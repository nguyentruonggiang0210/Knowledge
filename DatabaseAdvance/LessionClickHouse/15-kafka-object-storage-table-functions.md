# 15 - Kafka, object storage và table functions

## Mục tiêu

- Dùng table function cho import/export ad-hoc mà không tạo table lâu dài.
- Đọc/ghi object storage bằng `s3()` và thiết kế backfill an toàn.
- Hiểu pipeline Kafka engine → materialized view → MergeTree.
- Thiết kế retry, schema-error, dedup, replay và quan sát lag đúng semantics.

## 1. Chọn công cụ theo loại ingestion

| Nhu cầu | Công cụ phù hợp | Lý do |
|---|---|---|
| Import/export file local trong lab | `file()` | Không cần service ngoài, dễ kiểm tra format/schema. |
| Batch/backfill từ object storage | `s3()` / `s3Cluster()` | Streaming blocks qua query; glob nhiều object, không cần persist adapter. |
| Theo dõi object mới liên tục | `S3Queue` | Giữ trạng thái file đã xử lý; cần thiết kế replay/dedup. |
| Stream event liên tục | Kafka engine + MV | Consumer group + materialized view đẩy block vào MergeTree. |

Không query trực tiếp Kafka/S3 trên đường dashboard nếu SLO cần ổn định. Persist vào MergeTree để có sorting key, index, TTL, replica và workload isolation.

## 2. Table function `file()` chạy hoàn toàn local

ClickHouse server chỉ cho `file()` đọc/ghi dưới thư mục `user_files`; client không được truyền path tùy ý trên host.

```sql
INSERT INTO TABLE FUNCTION file(
    'lesson15_products.csv',
    CSVWithNames,
    'product_id UInt64, product_name String, category String'
)
SELECT product_id, product_name, toString(category)
FROM ecommerce.product_dimension
ORDER BY product_id
SETTINGS engine_file_truncate_on_insert = 1;

SELECT *
FROM file(
    'lesson15_products.csv',
    CSVWithNames,
    'product_id UInt64, product_name String, category String'
)
ORDER BY product_id;
```

`engine_file_truncate_on_insert = 1` làm lab chạy lại được nhưng sẽ ghi đè file. Production export phải dùng object key bất biến hoặc temp-key → atomic publish; không bật truncate trên path chung khi nhiều job chạy đồng thời.

Table function là table expression dùng một lần. Table engine là object có metadata lâu dài. Chọn table function cho backfill/ad-hoc; chọn table/table engine khi cần RBAC, dependency, monitoring và lifecycle ổn định.

## 3. Đọc S3 public không cần tài khoản

Query chính thức sau cần Internet nhưng không cần AWS credentials:

```sql
SELECT min(Date), max(Date), count()
FROM s3(
    'https://datasets-documentation.s3.eu-west-3.amazonaws.com/aapl_stock.csv',
    NOSIGN,
    'CSVWithNames'
);
```

Import streaming vào MergeTree; chỉ vài blocks nằm trong RAM tại một thời điểm:

```sql
DROP TABLE IF EXISTS ecommerce.aapl_prices;

CREATE TABLE ecommerce.aapl_prices
(
    trade_date Date,
    open Float64,
    high Float64,
    low Float64,
    close Float64,
    volume UInt64
)
ENGINE = MergeTree
ORDER BY trade_date;

INSERT INTO ecommerce.aapl_prices
SELECT
    Date,
    Open,
    High,
    Low,
    Close,
    Volume
FROM s3(
    'https://datasets-documentation.s3.eu-west-3.amazonaws.com/aapl_stock.csv',
    NOSIGN,
    'CSVWithNames'
);

SELECT toYear(trade_date) AS year, avg(close)
FROM ecommerce.aapl_prices
GROUP BY year
ORDER BY year;
```

Đừng phụ thuộc schema inference trong pipeline lâu dài. Một file rỗng, cột mới hoặc số bị ghi thành string có thể làm job hôm nay suy luận khác hôm qua; truyền structure rõ khi contract quan trọng.

## 4. Globs, virtual columns và backfill idempotent

Blueprint cho bucket của bạn:

```sql
SELECT
    _path,
    _file,
    count() AS rows
FROM s3(
    'https://my-bucket.s3.amazonaws.com/events/date=2025-01-*/*.parquet',
    'Parquet'
)
GROUP BY _path, _file
ORDER BY _path;
```

Backfill nên có manifest/control table ghi `object_path`, size/etag hoặc checksum, batch id, start/end, rows accepted/rejected và status. `INSERT SELECT` chạy lại cùng glob sẽ nạp lại toàn bộ files; MergeTree thường không tự dedup theo business key.

Credentials production nên nằm trong named collection hoặc secret/config, không nằm trong SQL/query log:

```sql
-- Blueprint: thay giá trị bằng secret injection của môi trường.
CREATE NAMED COLLECTION object_store AS
    access_key_id = '***',
    secret_access_key = '***';

SELECT count()
FROM s3(
    object_store,
    url = 'https://my-bucket.s3.amazonaws.com/events/*.parquet',
    format = 'Parquet'
);
```

Giới hạn quyền bucket theo prefix và operation. Key xuất hiện trong query text có thể rơi vào `system.query_log`, audit log, BI history hoặc exception.

## 5. Object storage liên tục: khi nào dùng `S3Queue`

`s3()` là một query batch; nó không nhớ file nào đã đọc. `S3Queue` theo dõi file và thường được nối với materialized view để đẩy vào MergeTree. Trạng thái xử lý dùng Keeper nên topology/backup/monitoring của Keeper trở thành dependency ingestion.

Blueprint (chỉ chạy sau khi có bucket/credentials thật):

```sql
CREATE TABLE ecommerce.object_events_queue
(
    event_id UUID,
    event_time DateTime64(3, 'UTC'),
    user_id UInt64,
    event_type String
)
ENGINE = S3Queue(
    'https://my-bucket.s3.amazonaws.com/incoming/*.jsonl',
    'JSONEachRow'
)
SETTINGS mode = 'unordered';

CREATE TABLE ecommerce.object_events
(
    event_id UUID,
    event_time DateTime64(3, 'UTC'),
    user_id UInt64,
    event_type LowCardinality(String)
)
ENGINE = MergeTree
ORDER BY (toDate(event_time), event_type, user_id, event_time, event_id);

CREATE MATERIALIZED VIEW ecommerce.object_events_mv
TO ecommerce.object_events
AS SELECT event_id, event_time, user_id, event_type
FROM ecommerce.object_events_queue;
```

`ordered` cần tên file tăng đúng thứ tự từ điển; file đến muộn có tên nhỏ hơn watermark có thể bị bỏ qua. `unordered` phù hợp nhiều producer nhưng giữ metadata processed-file nhiều hơn. Persistent processing nodes của 26.3 giảm duplicate do Keeper session expiry, nhưng parse retry và abnormal termination vẫn có thể tạo duplicate. `tracked_files_limit`/`tracked_file_ttl_sec` loại state cũ thì file cũ sẽ được import lại.

Cũng có cửa sổ mất dữ liệu khi node mất điện sau lúc file được ghi “processed” trong Keeper nhưng target part chưa fsync; `after_processing = 'delete'` làm tình huống này khó cứu hơn. `fsync_after_insert = 1` và `fsync_part_directory = 1` trên target thu hẹp cửa sổ nhưng đổi lấy latency/I/O. Vì vậy vẫn cần event id, durable source retention và reconciliation.

## 6. Khởi động broker Kafka-compatible miễn phí

File `docker-compose.integrations.yml` thêm một Redpanda broker development mode, tương thích Kafka API. Nó là profile tùy chọn: base lab không tải/chạy broker nếu bạn chỉ dùng `docker compose up -d`.

Từ `LessionClickHouse/`, khởi động ClickHouse + broker:

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.integrations.yml \
  --profile streaming up -d

docker compose \
  -f docker-compose.yml \
  -f docker-compose.integrations.yml \
  --profile streaming ps
```

Profile lab giới hạn broker ở 1 core, 1 GiB RAM, một replica và dùng thêm volume `redpanda_data`; nên dành khoảng 2 GiB RAM tổng cho cả hai containers. Đây không phải topology Kafka/Redpanda production hay HA.

Tạo topic 3 partitions một cách idempotent:

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.integrations.yml \
  --profile streaming exec redpanda \
  rpk topic create ecommerce-events-v1 \
  --partitions 3 --replicas 1 --if-not-exists \
  -X brokers=redpanda:9092
```

Host dùng `127.0.0.1:19092`; ClickHouse container dùng listener nội bộ `redpanda:9092`. Dùng sai listener advertised là nguyên nhân phổ biến của lỗi “bootstrap kết nối được nhưng broker tiếp theo không resolve”.

## 7. Kafka engine: pipeline production cơ bản

Kafka/Redpanda đều có thể chạy local miễn phí. DDL dưới đây dùng broker DNS `redpanda:9092` và topic vừa tạo. Kafka source không phải nơi lưu analytics; target MergeTree mới là bảng query.

```sql
DROP VIEW IF EXISTS ecommerce.kafka_events_mv;
DROP VIEW IF EXISTS ecommerce.kafka_rejects_mv;
DROP TABLE IF EXISTS ecommerce.kafka_events_raw;
DROP TABLE IF EXISTS ecommerce.events_stream;
DROP TABLE IF EXISTS ecommerce.kafka_rejects;

CREATE TABLE ecommerce.kafka_events_raw
(
    event_id UUID,
    event_time DateTime64(3, 'UTC'),
    user_id UInt64,
    event_type String,
    product_id UInt64,
    price Decimal(12, 2),
    quantity UInt16
)
ENGINE = Kafka
SETTINGS
    kafka_broker_list = 'redpanda:9092',
    kafka_topic_list = 'ecommerce-events-v1',
    kafka_group_name = 'clickhouse-events-v1',
    kafka_format = 'JSONEachRow',
    kafka_num_consumers = 3,
    kafka_handle_error_mode = 'stream';

CREATE TABLE ecommerce.events_stream
(
    event_id UUID,
    event_time DateTime64(3, 'UTC'),
    event_date Date MATERIALIZED toDate(event_time),
    user_id UInt64,
    event_type LowCardinality(String),
    product_id UInt64,
    price Decimal(12, 2),
    quantity UInt16,
    ingested_at DateTime64(3, 'UTC') DEFAULT now64(3)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, event_type, user_id, event_time, event_id);

CREATE TABLE ecommerce.kafka_rejects
(
    raw_message String,
    error String,
    rejected_at DateTime64(3, 'UTC') DEFAULT now64(3)
)
ENGINE = MergeTree
ORDER BY rejected_at;

CREATE MATERIALIZED VIEW ecommerce.kafka_events_mv
TO ecommerce.events_stream AS
SELECT event_id, event_time, user_id, event_type, product_id, price, quantity
FROM ecommerce.kafka_events_raw
WHERE _error = '';

CREATE MATERIALIZED VIEW ecommerce.kafka_rejects_mv
TO ecommerce.kafka_rejects AS
SELECT _raw_message AS raw_message, _error AS error, now64(3) AS rejected_at
FROM ecommerce.kafka_events_raw
WHERE _error != '';
```

Gửi hai events từ PowerShell:

```powershell
$events = @'
{"event_id":"00000000-0000-0000-0000-000000000201","event_time":"2025-03-01 10:00:00.000","user_id":201,"event_type":"view","product_id":1001,"price":15.90,"quantity":1}
{"event_id":"00000000-0000-0000-0000-000000000202","event_time":"2025-03-01 10:01:00.000","user_id":201,"event_type":"purchase","product_id":1001,"price":15.90,"quantity":1}
'@

$events | docker compose `
  -f docker-compose.yml `
  -f docker-compose.integrations.yml `
  --profile streaming exec -T redpanda `
  rpk topic produce ecommerce-events-v1 -X brokers=redpanda:9092
```

Xác nhận ClickHouse đã persist:

```sql
SELECT event_id, event_type, product_id, price
FROM ecommerce.events_stream
WHERE event_id IN
(
    toUUID('00000000-0000-0000-0000-000000000201'),
    toUUID('00000000-0000-0000-0000-000000000202')
)
ORDER BY event_time;
```

Nếu chưa thấy ngay, kiểm tra `system.kafka_consumers` và logs; đừng thêm sleep cố định vào production health check.

Khi materialized view attach, consumer bắt đầu chạy nền. Để đổi transform/target một cách kiểm soát:

```sql
DETACH TABLE ecommerce.kafka_events_mv;
-- ALTER target hoặc deploy view mới, kiểm tra schema rồi:
ATTACH TABLE ecommerce.kafka_events_mv;
```

Detach làm tăng lag; phải biết retention của Kafka có đủ cho thời gian migration không. Direct `SELECT` từ Kafka table chỉ nên dùng để debug vì việc đọc có semantics consumer/offset, không phải preview vô hại.

## 8. Delivery, retry và dedup

Ranh giới Kafka offset commit và insert vào MergeTree không phải transaction end-to-end. Nếu target đã nhận block nhưng process chết trước commit offset, block có thể được đọc lại. Vì vậy:

1. producer sinh `event_id` ổn định và không đổi khi retry;
2. raw/audit giữ đủ dữ liệu để replay;
3. query hoặc state table có chiến lược dedup đã đo chi phí;
4. reconciliation theo time bucket so count, sum và hash, không chỉ count;
5. retention topic dài hơn outage + thời gian khắc phục tệ nhất.

`ReplacingMergeTree` không biến pipeline thành exactly-once: duplicate còn tồn tại cho tới merge, `FINAL` tốn chi phí, và version/key sai vẫn cho kết quả sai.

## 9. Throughput và quan sát consumer

Tổng `kafka_num_consumers` của các replicas trong cùng consumer group không nên vượt số partitions hữu ích; mỗi partition chỉ được một consumer trong group. Nó cũng không nên vượt số cores vật lý trên server.

```sql
SELECT
    database,
    table,
    consumer_id,
    assignments.topic,
    assignments.partition_id,
    assignments.current_offset,
    last_poll_time,
    last_commit_time,
    num_messages_read,
    exceptions.text
FROM system.kafka_consumers
WHERE database = 'ecommerce';
```

`current_offset` một mình không phải consumer lag: cần broker end offset cho từng partition rồi lấy chênh lệch. Alert cả lag time, no-data heartbeat, parse errors, target insert errors, rebalance rate và thời gian từ event tới `ingested_at`.

Nếu `dead_letter_queue` được chọn nhưng system DLQ chưa cấu hình trên server, CREATE table sẽ lỗi. `stream` trong lab phơi `_error`/`_raw_message`; production phải giới hạn retention/quyền vì raw payload có thể chứa PII.

Dừng profile nhưng giữ volumes:

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.integrations.yml \
  --profile streaming down
```

Muốn reset cả dữ liệu ClickHouse và Redpanda của riêng stack này mới thêm `--volumes`; thao tác đó xóa toàn bộ dữ liệu lab, không dùng trên môi trường cần giữ dữ liệu.

## Keywords và bug ẩn production

| Keyword | Ý nghĩa | Bug ẩn / tình huống thực tế |
|---|---|---|
| table function | Adapter table dùng trong một query | Query lặp sẽ gọi external source lại; latency/cost không ổn định như MergeTree. |
| `file()` | Đọc/ghi dưới `user_files` | Nghĩ rằng path là máy client dẫn tới “file not found”; truncate có thể ghi đè export khác. |
| schema inference | Suy type từ file | File rỗng/khác schema làm job đổi type hoặc fail bất chợt; contract production nên explicit. |
| `s3()` | Đọc/ghi object qua table function | Glob chạy lại nạp trùng; listing hàng triệu objects tạo latency/API cost trước khi đọc data. |
| `_path` / `_file` | Virtual metadata object | Không lưu provenance này vào target khiến khó replay/reconcile file cụ thể. |
| named collection | Gom connection parameters | Không tự động là secret vault; quyền xem metadata/config và query log vẫn phải kiểm soát. |
| `S3Queue` | Theo dõi object mới | Trạng thái Keeper mất/sai hoặc crash đúng boundary có thể reprocess; event-level idempotency vẫn cần. |
| `tracked_file_ttl_sec` | Tuổi metadata file đã xử lý | Hết TTL thì file còn trong bucket được import lại; bật mà quên dedup tạo double count. |
| `after_processing = 'delete'` | Xóa object sau xử lý | Power loss trước target fsync có thể làm mất cả target rows lẫn source để replay. |
| Kafka engine | Consumer/producer table engine | Đây không phải MergeTree; query dashboard trực tiếp vừa bất ổn vừa ảnh hưởng consumption. |
| consumer group | Chia partitions giữa consumers | Đổi group name deploy nhầm sẽ replay toàn topic hoặc bắt đầu theo offset policy ngoài ý muốn. |
| advertised listener | Địa chỉ broker trả lại cho client | Host dùng DNS container hoặc container nhận `127.0.0.1` sẽ connect bootstrap rồi fail ở metadata request. |
| `kafka_num_consumers` | Consumers trên table | Vượt partitions tạo consumer rảnh; nhân với replicas có thể vượt cores và tăng rebalance. |
| materialized view | Đẩy block Kafka vào target | Detach/ALTER sai thứ tự tạo lag hoặc schema mismatch; MV không tự backfill data trước khi nó tồn tại. |
| offset commit | Checkpoint Kafka | Insert thành công rồi crash trước commit có thể duplicate; không phải exactly-once end-to-end. |
| `kafka_handle_error_mode` | Cách xử lý parse error | Skip/route lỗi mà không alert làm mất dữ liệu âm thầm; raw DLQ có thể rò PII. |
| replay | Đọc lại từ offset/object | Transform mới chạy song song với realtime dễ double-write nếu không có namespace/watermark. |
| lag | End offset − committed/current offset | Chỉ nhìn current offset không biết lag; topic im lặng cũng có thể che consumer chết nếu thiếu heartbeat. |

## Bài thực hành

Chạy broker local miễn phí, tạo topic 3 partitions, gửi 100.000 JSON events gồm duplicate và 1% malformed. Dừng MV hai phút rồi attach lại. Chứng minh: accepted + rejected = produced theo boundary; consumer bắt kịp; retry không làm KPI tăng; raw reject được redaction/TTL.

## Tài liệu chính thức

- [`file` table function](https://clickhouse.com/docs/reference/functions/table-functions/file)
- [`s3` table function](https://clickhouse.com/docs/reference/functions/table-functions/s3)
- [S3Queue table engine](https://clickhouse.com/docs/reference/engines/table-engines/integrations/s3queue)
- [Kafka table engine](https://clickhouse.com/docs/reference/engines/table-engines/integrations/kafka)
- [`system.kafka_consumers`](https://clickhouse.com/docs/reference/system-tables/kafka_consumers)
- [Redpanda Docker quickstart](https://docs.redpanda.com/current/get-started/quick-start/)
