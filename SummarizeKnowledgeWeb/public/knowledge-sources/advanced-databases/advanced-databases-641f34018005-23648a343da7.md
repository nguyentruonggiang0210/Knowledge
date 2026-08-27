# 04 - Ingestion: batch, async insert, format và retry

## Mục tiêu

- Nạp dữ liệu với batch đủ lớn và chọn format phù hợp.
- Hiểu async insert, acknowledgement và backpressure.
- Thiết kế retry/idempotency mà không ngộ nhận dedup là vĩnh viễn.
- Theo dõi parts, rejected rows và ingest lag.

## 1. Insert batch bằng SQL

```sql
INSERT INTO ecommerce.events
    (event_id, event_time, user_id, session_id, event_type, product_id,
     category, price, quantity, country, device, properties)
VALUES
    (generateUUIDv4(), now64(3), 201, generateUUIDv4(), 'view', 9001,
     'home', 12.50, 1, 'VN', 'mobile', map('source', 'lesson')),
    (generateUUIDv4(), now64(3), 202, generateUUIDv4(), 'view', 9002,
     'books', 18.00, 1, 'TH', 'desktop', map('source', 'lesson'));
```

Trong production, gửi nhiều nghìn rows/một vài MB mỗi batch thường tốt hơn một insert mỗi event. Con số đúng phụ thuộc row width, latency SLO và concurrency; đo active part rate và throughput.

## 2. `INSERT SELECT` và sinh data server-side

```sql
CREATE TABLE ecommerce.events_stage AS ecommerce.events;

INSERT INTO ecommerce.events_stage
    (event_id, event_time, user_id, session_id, event_type, product_id,
     category, price, quantity, country, device, properties)
SELECT
    generateUUIDv4(),
    now64(3) - toIntervalSecond(number),
    number % 1000,
    generateUUIDv4(),
    'view',
    number % 100,
    'books',
    toDecimal64('9.99', 2),
    1,
    'VN',
    'mobile',
    map('source', 'generated')
FROM numbers(10000);

INSERT INTO ecommerce.events
SELECT * FROM ecommerce.events_stage;
```

`INSERT SELECT` dùng server resources cho cả read và write; tránh chạy backfill lớn cùng giờ dashboard peak.

## 3. Format streaming

### JSONEachRow

```bash
curl -u student:student_pass \
  'http://127.0.0.1:8123/?query=INSERT%20INTO%20ecommerce.events%20FORMAT%20JSONEachRow' \
  --data-binary '{"event_id":"00000000-0000-0000-0000-000000000099","event_time":"2025-02-10 10:00:00.000","user_id":999,"session_id":"10000000-0000-0000-0000-000000000099","event_type":"view","product_id":1001,"category":"books","price":15.90,"quantity":1,"country":"VN","device":"mobile","properties":{"source":"curl"}}'
```

### CSV/Parquet/Native

```sql
INSERT INTO ecommerce.events
    (event_id, event_time, user_id, session_id, event_type, product_id,
     category, price, quantity, country, device, properties)
FORMAT CSV;
```

- JSON dễ debug nhưng tốn parse và dễ schema drift.
- CSV gọn nhưng mapping theo thứ tự/delimiter/null dễ sai.
- Native hiệu quả giữa ClickHouse components.
- Parquet phù hợp object storage/batch interoperability và column projection.

## 4. Async insert

Client có nhiều event nhỏ có thể để server buffer trước khi tạo part:

```sql
INSERT INTO ecommerce.events
    (event_id, event_time, user_id, session_id, event_type, product_id,
     category, price, quantity, country, device, properties)
SETTINGS async_insert = 1, wait_for_async_insert = 1
VALUES
    (generateUUIDv4(), now64(3), 301, generateUUIDv4(), 'view', 1001,
     'books', 15.90, 1, 'VN', 'mobile', map('source', 'async'));
```

`wait_for_async_insert=1` chỉ ACK sau khi flush thành công, giúp client thấy lỗi. Nếu đặt `0`, ACK sớm giảm latency nhưng process crash/parse failure sau ACK có thể làm mất dữ liệu mà client tưởng đã ghi.

```sql
SELECT
    event_time,
    query,
    status,
    flush_time,
    rows,
    bytes
FROM system.asynchronous_insert_log
WHERE event_time >= now() - INTERVAL 10 MINUTE
ORDER BY event_time DESC
LIMIT 20;
```

System log/table availability và retention phụ thuộc version/config; nếu table không tồn tại, kiểm tra `SHOW TABLES FROM system LIKE '%asynchronous%'`.

## 5. Retry và idempotency

Network timeout không cho biết insert đã commit hay chưa. Ba pattern:

1. producer giữ stable `event_id`, chấp nhận duplicate vật lý và dedup khi query/MV;
2. ingest qua queue có offset/checkpoint, đồng thời có reconciliation;
3. replicated insert deduplication/block token trong cửa sổ cấu hình—chỉ là lớp bảo vệ retry ngắn, không phải unique constraint vĩnh viễn.

Mô phỏng duplicate và đếm:

```sql
INSERT INTO ecommerce.events
SELECT *
FROM ecommerce.events
WHERE event_id = '00000000-0000-0000-0000-000000000001';

SELECT
    event_id,
    count() AS copies
FROM ecommerce.events
GROUP BY event_id
HAVING copies > 1;

-- Read-time dedup nếu business cần chính xác event-id.
SELECT count()
FROM
(
    SELECT event_id
    FROM ecommerce.events
    GROUP BY event_id
);
```

Không chạy `SELECT DISTINCT *` mặc định trên hàng tỷ rows; hãy thiết kế key/idempotency/upstream guarantee và chỉ dedup scope cần thiết.

## 6. Theo dõi small parts và ingest pressure

```sql
SELECT
    table,
    partition,
    count() AS active_parts,
    sum(rows) AS rows,
    round(sum(rows) / count(), 1) AS rows_per_part
FROM system.parts
WHERE database = 'ecommerce' AND active
GROUP BY table, partition
ORDER BY active_parts DESC;

SELECT
    metric,
    value
FROM system.metrics
WHERE metric IN ('BackgroundMergesAndMutationsPoolTask', 'PartsActive');
```

Metric names thay đổi theo phiên bản; khám phá bằng `SELECT metric, description FROM system.metrics WHERE metric ILIKE '%Part%'` thay vì hard-code dashboard mà không test upgrade.

## 7. Backfill theo lát và kiểm chứng

```sql
-- Ví dụ backfill một tháng, nên lặp theo partition/time window.
INSERT INTO ecommerce.events_stage
SELECT *
FROM ecommerce.events
WHERE event_date >= '2025-01-01' AND event_date < '2025-02-01';

SELECT
    event_date,
    count() AS source_rows,
    (SELECT count()
     FROM ecommerce.events_stage s
     WHERE s.event_date = e.event_date) AS stage_rows
FROM ecommerce.events e
WHERE event_date >= '2025-01-01' AND event_date < '2025-02-01'
GROUP BY event_date
ORDER BY event_date;
```

Với dữ liệu có duplicate, checksum phải dựa trên key/aggregate deterministic; không chỉ so tổng row.

## Keywords và bug ẩn production

| Keyword | Ý nghĩa | Bug ẩn / tình huống thực tế |
|---|---|---|
| batch insert | Gộp nhiều rows một insert | Batch quá nhỏ tạo parts; batch quá lớn vượt memory/timeout và retry lại khối lớn. |
| `INSERT SELECT` | Transform/nạp server-side | Backfill tranh thread, disk và merge pool với workload realtime. |
| `JSONEachRow` | Một JSON object/row | Unknown/missing field bị xử lý theo settings; schema drift có thể âm thầm default sai. |
| CSV | Text theo vị trí | Dấu phẩy/newline/nullable và đổi thứ tự column gây lệch dữ liệu khó phát hiện. |
| Native | Binary format ClickHouse | Khác version/type contract cần test; không phải định dạng lưu trữ lâu dài phổ quát. |
| Parquet | Columnar interchange | Decimal/timezone/schema nested mapping khác hệ có thể đổi semantics. |
| async insert | Server buffer small inserts | Nhiều combination của settings/shape tạo buffer riêng, giảm khả năng gộp. |
| `wait_for_async_insert` | Chờ flush trước ACK | Tắt nó có cửa sổ mất data sau ACK; bật nó nhưng client timeout vẫn cần retry/idempotency. |
| idempotency | Retry không nhân bản logic | Dedup token/window hữu hạn, đổi block boundary làm retry không match dedup. |
| stable event ID | Business key của event | Generate ID lại mỗi retry khiến mọi cơ chế downstream thấy event mới. |
| small parts | Quá nhiều part nhỏ | Lúc đầu ingest vẫn nhanh, sau đó chạm `parts_to_delay/throw_insert` và latency tăng đột ngột. |
| backpressure | Làm chậm producer khi sink quá tải | Queue không giới hạn chỉ dời sự cố sang disk/retention và tăng ingest lag. |
| backfill | Nạp lịch sử | Chạy chung đường realtime có thể đẩy lag và duplicate; cần window + throttle + reconciliation. |
| reconciliation | So source và sink | Chỉ so `count()` bỏ sót trường hợp vừa thiếu vừa trùng; thêm sum/hash theo bucket. |

## Bài thực hành

1. Gửi 1.000 insert một-row vào table tạm, rồi một insert 1.000 rows; so số parts và thời gian.
2. Tắt `wait_for_async_insert` trong lab, thử gửi row sai type và xem client/log khác gì.
3. Viết retry contract: ai sinh `event_id`, giữ bao lâu, checkpoint ở đâu, và query reconcile theo ngày.
