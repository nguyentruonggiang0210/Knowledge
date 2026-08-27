# 12 - Tích hợp PostgreSQL và CDC

## Mục tiêu

- Thiết kế snapshot + WAL streaming không gap/overlap.
- Giữ raw audit log và dựng current-state table trong ClickHouse.
- Xử lý version, delete, transaction, schema change, lag và reconciliation.
- Biết khi nào dùng live connector/JOIN và khi nào copy dimension.

## 1. Kiến trúc tham chiếu miễn phí cho lab

```text
PostgreSQL (source of truth)
        |
 logical decoding / WAL
        |
Debezium + Kafka Connect ----> Kafka/Redpanda topic
        |                              |
        + metadata/checkpoint          v
                                ClickHouse raw CDC
                                      |
                                MV/transform
                                      v
                               current-state table
```

PostgreSQL, Debezium và Apache Kafka đều có thể chạy miễn phí/open-source trong lab. Sink có thể là ClickHouse Kafka Connect Sink hoặc consumer tự viết. Chọn công cụ sau khi kiểm tra semantics delivery, version compatibility và cơ chế dead-letter/retry; tên công cụ không tự tạo exactly-once end-to-end.

Một pipeline nhỏ cũng có thể dùng batch incremental theo `updated_at + id`, nhưng phải xử lý rows có cùng timestamp, deletes và clock/transaction boundaries.

## 2. Chuẩn bị PostgreSQL (blueprint)

Logical replication cần `wal_level=logical`, đủ replication slots/senders và quyền tối thiểu. Các thay đổi cấu hình có thể cần restart:

```sql
-- Chạy bằng PostgreSQL admin, không chạy trong ClickHouse.
CREATE ROLE cdc_reader WITH LOGIN REPLICATION PASSWORD 'replace_from_secret_manager';
GRANT CONNECT ON DATABASE shop TO cdc_reader;
GRANT USAGE ON SCHEMA public TO cdc_reader;
GRANT SELECT ON TABLE public.orders TO cdc_reader;

CREATE PUBLICATION shop_orders_pub
FOR TABLE public.orders;
```

Connector thường quản lý replication slot. Không tạo/xóa slot thủ công khi connector đang sở hữu nó. Monitor `pg_replication_slots` vì slot bị bỏ quên giữ WAL làm đầy disk PostgreSQL.

Với delete/update cần đủ identity. Primary key là lựa chọn tốt; `REPLICA IDENTITY FULL` gửi old row rộng hơn và tăng WAL, chỉ dùng khi cần.

## 3. Contract CDC bắt buộc

Mỗi message normalized nên có:

- business key (`order_id`);
- operation: snapshot/insert/update/delete;
- before/after hoặc after image đầy đủ theo contract;
- source commit position (`source_lsn`) để audit;
- deterministic `source_version` tổng thứ tự cho từng key, kể cả nhiều changes trong một transaction;
- transaction id + row ordinal nếu cần tái dựng ordering;
- source commit timestamp và sink ingest timestamp;
- schema version.

Không parse chuỗi PostgreSQL LSN thành một version bằng công thức tự chế mà chưa chứng minh overflow/order. Connector/normalizer nên tạo `UInt64 source_version` ổn định, strictly increasing trên cùng key; lưu raw LSN riêng để điều tra.

## 4. Raw audit table

```sql
CREATE TABLE ecommerce.orders_cdc_raw
(
    order_id UInt64,
    user_id UInt64,
    status LowCardinality(String),
    total_amount Decimal(14, 2),
    created_at DateTime64(3, 'UTC'),
    op Enum8('snapshot' = 0, 'insert' = 1, 'update' = 2, 'delete' = 3),
    is_deleted UInt8 MATERIALIZED op = 'delete',
    source_version UInt64,
    source_lsn String,
    source_tx_id UInt64,
    source_row_index UInt32,
    source_commit_ts DateTime64(3, 'UTC'),
    ingested_at DateTime64(3, 'UTC') DEFAULT now64(3),
    schema_version UInt32
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(ingested_at)
ORDER BY (order_id, source_version, source_row_index);
```

Raw table append-only, partition theo arrival để audit/replay và retention. Duplicate delivery vẫn được giữ; đó là bằng chứng, không phải current state.

## 5. Current-state table

Tất cả versions của một `order_id` phải vào cùng partition để background replacement có cơ hội gặp nhau. Dùng fixed hash buckets cho current state:

```sql
CREATE TABLE ecommerce.orders_current
(
    order_id UInt64,
    user_id UInt64,
    status LowCardinality(String),
    total_amount Decimal(14, 2),
    created_at DateTime64(3, 'UTC'),
    is_deleted UInt8,
    source_version UInt64,
    source_commit_ts DateTime64(3, 'UTC')
)
ENGINE = ReplacingMergeTree(source_version)
PARTITION BY cityHash64(order_id) % 32
ORDER BY order_id;

CREATE MATERIALIZED VIEW ecommerce.mv_orders_current
TO ecommerce.orders_current
AS
SELECT
    order_id,
    user_id,
    status,
    total_amount,
    created_at,
    toUInt8(op = 'delete') AS is_deleted,
    source_version,
    source_commit_ts
FROM ecommerce.orders_cdc_raw;
```

32 buckets là ví dụ, không phải con số mặc định production. Current table không cần time partition lifecycle như raw; fixed bucket bảo đảm versions cùng key không bị chia theo tháng.

## 6. Dữ liệu CDC mẫu chạy được

```sql
INSERT INTO ecommerce.orders_cdc_raw
    (order_id, user_id, status, total_amount, created_at, op,
     source_version, source_lsn, source_tx_id, source_row_index,
     source_commit_ts, schema_version)
VALUES
    (8001, 501, 'created', 20.00, '2025-03-01 01:00:00.000', 'snapshot',
     1001, '0/16B6A10', 10, 1, '2025-03-01 01:00:00.100', 1),
    (8001, 501, 'paid',    20.00, '2025-03-01 01:00:00.000', 'update',
     1002, '0/16B6B20', 11, 1, '2025-03-01 01:01:00.100', 1),
    (8002, 502, 'paid',    30.00, '2025-03-01 02:00:00.000', 'insert',
     1003, '0/16B6C30', 12, 1, '2025-03-01 02:00:00.100', 1),
    (8001, 501, 'paid',    20.00, '2025-03-01 01:00:00.000', 'delete',
     1004, '0/16B6D40', 13, 1, '2025-03-01 03:00:00.100', 1);
```

Raw audit:

```sql
SELECT order_id, op, source_version, source_lsn, source_commit_ts, ingested_at
FROM ecommerce.orders_cdc_raw
ORDER BY source_version;
```

Current live state, đúng ngay cả trước merge:

```sql
SELECT
    order_id,
    latest.1 AS user_id,
    latest.2 AS status,
    latest.3 AS amount,
    latest.5 AS source_version
FROM
(
    SELECT
        order_id,
        argMax(
            tuple(user_id, status, total_amount, is_deleted, source_version),
            source_version
        ) AS latest
    FROM ecommerce.orders_current
    GROUP BY order_id
)
WHERE latest.4 = 0;
```

Order 8001 không xuất hiện vì latest message là tombstone. Lọc `is_deleted=0` trước `argMax` sẽ hồi sinh version paid.

## 7. Snapshot + stream cutover

Một snapshot đúng cần connector đảm bảo:

1. lấy consistent snapshot hoặc snapshot theo contract;
2. ghi lại WAL position liên kết snapshot;
3. stream changes từ boundary đó;
4. có key/version để duplicate overlap không sai current state;
5. checkpoint chỉ advance sau durable delivery theo semantics của sink;
6. reconciliation sau snapshot trước khi công bố dashboard.

Snapshot kéo dài trong khi source vẫn ghi; “copy xong rồi mới bật WAL” không có boundary sẽ mất changes. Bật stream trước rồi snapshot thiếu version sẽ để snapshot cũ ghi đè update mới.

## 8. Transaction semantics

PostgreSQL transaction có thể đổi 10.000 rows atomically. CDC thường phát nhiều records; ClickHouse query có thể thấy một phần transaction trong lúc ingest. Nếu báo cáo đòi atomic visibility theo transaction:

- buffer theo transaction metadata và publish khi commit marker đến;
- ingest vào staging rồi attach/swap partition theo batch phù hợp;
- hoặc chấp nhận eventual window và ghi rõ SLO.

Transaction quá lớn làm buffer memory/disk phình; cần size limit và dead-letter/runbook.

## 9. Schema evolution và type mapping

| PostgreSQL | ClickHouse gợi ý | Điểm cần quyết định |
|---|---|---|
| `bigint` | `Int64`/`UInt64` | Có âm không, overflow, sequence lifetime |
| `numeric(p,s)` | `Decimal(P,S)` | Precision/scale và phép tính downstream |
| `timestamptz` | `DateTime64(..., 'UTC')` | Chuẩn hóa UTC; timezone hiển thị |
| `timestamp` | `DateTime64` theo contract | Nó không mang timezone; đừng tự gắn UTC mù quáng |
| `uuid` | `UUID` | Sorting key locality |
| `jsonb` | typed columns + raw `String`/Map | Hot fields, schema drift, dynamic paths |
| array | `Array(T)` | NULL elements, order, size |
| enum/text status | `LowCardinality(String)` | Dễ thêm label hơn Enum, validate ở pipeline |

Add column phải triển khai theo thứ tự tương thích: sink nhận được field mới, ClickHouse có column/default, consumers không phụ thuộc `SELECT *`. Rename/drop/type narrowing cần dual-write/backfill/version contract.

## 10. CDC lag và heartbeat

```sql
SELECT
    max(source_commit_ts) AS latest_source_commit,
    max(ingested_at) AS latest_ingest,
    dateDiff('second', latest_source_commit, latest_ingest) AS transport_seconds,
    dateDiff('second', latest_source_commit, now64(3)) AS apparent_end_to_end_seconds
FROM ecommerce.orders_cdc_raw;
```

Source không có order mới làm `now - max(commit_ts)` tăng dù pipeline khỏe. Phát heartbeat/checkpoint định kỳ để đo end-to-end lag thực; theo dõi riêng queue lag, source slot lag và sink freshness.

## 11. Reconciliation

ClickHouse-side theo bucket:

```sql
WITH latest AS
(
    SELECT
        order_id,
        argMax(tuple(total_amount, is_deleted), source_version) AS state
    FROM ecommerce.orders_current
    GROUP BY order_id
)
SELECT
    cityHash64(order_id) % 100 AS bucket,
    countIf(state.2 = 0) AS live_orders,
    sumIf(state.1, state.2 = 0) AS amount,
    groupBitXor(cityHash64(order_id, state.1, state.2)) AS checksum
FROM latest
GROUP BY bucket
ORDER BY bucket;
```

Chạy aggregate tương đương trên PostgreSQL snapshot có cùng boundary và so theo bucket. `count` đơn lẻ có thể cân bằng “một thiếu + một trùng”; checksum/sum giúp phát hiện thêm nhưng vẫn cần drill-down key khi mismatch.

## 12. Live PostgreSQL table function: dùng có giới hạn

Blueprint (không chạy nếu chưa có PostgreSQL host):

```sql
SELECT customer_id, segment
FROM postgresql(
    'postgres.internal:5432',
    'shop',
    'public.customers',
    'ch_readonly',
    'password_from_secret'
)
LIMIT 10;
```

Live lookup/JOIN gửi tải về OLTP, phụ thuộc network và có thể không đồng nhất với fact event-time. Dimension nhỏ có thể dùng dictionary có lifetime/invalidation hoặc replicate vào ClickHouse; định nghĩa “current” hay “as-of-event”.

## Keywords và bug ẩn production

| Keyword | Ý nghĩa | Bug ẩn / tình huống thực tế |
|---|---|---|
| CDC | Capture thay đổi source | “Exactly once” ở một connector không bao phủ source→queue→sink→MV; vẫn cần idempotency/reconcile. |
| WAL | PostgreSQL write-ahead log | Replication slot lag/abandoned giữ WAL tới đầy disk source, ảnh hưởng OLTP trước ClickHouse. |
| publication | Tập tables/events phát | Thêm table vào DB không tự nằm publication; schema team tưởng đã replicate nhưng không có event. |
| replication slot | Checkpoint logical stream | Failover/slot ownership sai gây gap hoặc đọc lại lượng WAL lớn. |
| replica identity | Key/old image cho update-delete | Không PK/identity phù hợp làm delete thiếu key hoặc update không thể map row. |
| snapshot | Baseline ban đầu | Snapshot + stream không chung boundary gây gap/overlap; snapshot lâu tăng source load. |
| source LSN | WAL position audit | Chuỗi LSN không nên so lexical; một commit có nhiều row events cần ordinal/version rule. |
| source version | Winner order cho key | Hai payload khác nhau cùng version làm winner nondeterministic trong Replacing/argMax. |
| tombstone | Logical delete event | Sink bỏ delete khiến ClickHouse giữ row mãi; lọc tombstone sớm làm hồi sinh old version. |
| raw table | Append-only audit/replay | TTL raw quá ngắn hơn thời gian phát hiện lỗi khiến không còn nguồn replay. |
| current table | Latest state phục vụ query | Partition theo mutable/event month chia versions một key, làm background dedup không gặp nhau. |
| transaction metadata | Boundary commit | Row-by-row visibility phá atomic reporting; buffer transaction lớn có thể hết disk/RAM. |
| schema registry/contract | Phiên bản payload | Producer đổi Decimal thành String hoặc rename field có thể default âm thầm thay vì fail loud. |
| `updated_at` polling | Batch incremental đơn giản | Nhiều rows cùng timestamp, clock không monotonic và hard delete gây mất data nếu chỉ dùng `> last_ts`. |
| heartbeat | Event đo freshness khi source idle | Không có heartbeat thì alert lag giả; heartbeat đi đường khác data cũng có thể báo khỏe giả. |
| reconciliation | So source/sink theo boundary | So ở hai thời điểm khác nhau tạo mismatch giả; phải khóa snapshot/version boundary. |
| PostgreSQL table function | Đọc live OLTP | Dashboard fan-out có thể quá tải PostgreSQL và network; credential xuất hiện trong DDL/log nếu quản lý sai. |

## Bài thực hành

Chạy PostgreSQL + Debezium/Kafka trong lab, snapshot 100.000 orders rồi cập nhật/xóa trong lúc snapshot. Tắt sink 10 phút, restart, inject duplicate và schema add-column. Chứng minh raw audit đủ replay, current state đúng, lag alert có heartbeat và reconciliation về zero mismatch.
