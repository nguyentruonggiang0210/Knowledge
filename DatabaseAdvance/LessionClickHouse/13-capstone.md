# 13 - Capstone: nền tảng analytics thương mại điện tử production-ready

## Bối cảnh

Bạn sở hữu hệ phân tích cho một sàn thương mại điện tử:

- event app/web đến liên tục, có duplicate và đến muộn;
- PostgreSQL là source of truth cho orders, ClickHouse nhận CDC;
- dashboard cần revenue, funnel, DAU và current order state;
- analyst chạy ad-hoc queries nhưng không được phá SLO dashboard;
- retention event 2 năm, raw CDC 90 ngày;
- hệ thống phải backup/restore và có runbook sự cố.

Capstone không chỉ là DDL. Sản phẩm cuối phải có benchmark, quyết định thiết kế, kiểm tra correctness, alert và failure drill.

## 1. SLO và workload contract

Đặt baseline theo máy lab rồi ghi rõ target. Ví dụ production giả lập:

| SLI | Target |
|---|---|
| Ingest freshness p99 | `< 60 giây` với source có heartbeat |
| Dashboard query p95 | `< 2 giây` cho 7 ngày, concurrency 8 |
| Dashboard query p99 | `< 5 giây` |
| Reconciliation | 0 mismatch theo 100 hash buckets tại cùng boundary |
| RPO | 15 phút |
| RTO | 2 giờ |
| Restore drill | Thành công ít nhất mỗi quý |

Mỗi metric cần contract: grain, timezone, exact/approx, late-event window, duplicate rule, deleted-row rule và owner.

## 2. Sinh dataset đại diện

Tạo table riêng để không làm thay đổi dataset bài học:

```sql
CREATE TABLE ecommerce.capstone_events
(
    event_id UUID,
    event_time DateTime64(3, 'UTC') CODEC(DoubleDelta, ZSTD(1)),
    event_date Date MATERIALIZED toDate(event_time),
    user_id UInt64,
    session_id UUID,
    event_type LowCardinality(String),
    product_id UInt64,
    category LowCardinality(String),
    price Decimal(12, 2),
    quantity UInt16,
    country FixedString(2),
    device LowCardinality(String),
    ingested_at DateTime64(3, 'UTC') DEFAULT now64(3)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, event_type, country, user_id, event_time, event_id)
TTL event_date + INTERVAL 2 YEAR DELETE
SETTINGS index_granularity = 8192;

INSERT INTO ecommerce.capstone_events
    (event_id, event_time, user_id, session_id, event_type, product_id,
     category, price, quantity, country, device)
SELECT
    generateUUIDv4(),
    toDateTime64('2025-01-01 00:00:00', 3, 'UTC')
        + toIntervalSecond(number % (90 * 86400)),
    number % 1000000,
    generateUUIDv4(),
    ['view', 'view', 'view', 'add_cart', 'purchase'][1 + number % 5],
    number % 100000,
    ['books', 'electronics', 'fashion', 'home'][1 + number % 4],
    toDecimal64(toString(1 + number % 100000), 2),
    toUInt16(1 + number % 5),
    ['VN', 'TH', 'SG'][1 + number % 3],
    ['mobile', 'desktop', 'tablet'][1 + number % 3]
FROM numbers(10000000);
```

10 triệu rows là mặc định vừa phải. Tăng dần tới khi query baseline đủ chậm để thấy khác biệt; không làm máy hết disk. Dataset synthetic phân bố đều không mô phỏng hot tenant, seasonality, Map rộng hay late data—bổ sung các distribution đó vào báo cáo giới hạn benchmark.

Inject duplicate 0,1% theo stable ID:

```sql
INSERT INTO ecommerce.capstone_events
SELECT *
FROM ecommerce.capstone_events
WHERE cityHash64(event_id) % 1000 = 0;
```

Inject late arrivals (event time cũ, ingest time mới) bằng insert riêng:

```sql
INSERT INTO ecommerce.capstone_events
    (event_id, event_time, user_id, session_id, event_type, product_id,
     category, price, quantity, country, device)
SELECT
    generateUUIDv4(),
    toDateTime64('2025-01-03 00:00:00', 3, 'UTC') + toIntervalSecond(number),
    2000000 + number,
    generateUUIDv4(),
    'purchase',
    number % 1000,
    'books',
    toDecimal64('10.00', 2),
    1,
    'VN',
    'mobile'
FROM numbers(1000);
```

## 3. Query pack bắt buộc

### Q1 - Daily KPI

```sql
SELECT
    event_date,
    country,
    count() AS events,
    uniqCombined64(user_id) AS users,
    countIf(event_type = 'purchase') AS purchase_events,
    sumIf(price * quantity, event_type = 'purchase') AS revenue
FROM ecommerce.capstone_events
WHERE event_date >= toDate('2025-03-01')
GROUP BY event_date, country
ORDER BY event_date, country;
```

### Q2 - Funnel

```sql
WITH session_steps AS
(
    SELECT
        session_id,
        windowFunnel(3600)(
            toDateTime(event_time),
            event_type = 'view',
            event_type = 'add_cart',
            event_type = 'purchase'
        ) AS step
    FROM ecommerce.capstone_events
    WHERE event_date BETWEEN '2025-03-01' AND '2025-03-07'
    GROUP BY session_id
)
SELECT
    countIf(step >= 1) AS viewed,
    countIf(step >= 2) AS added,
    countIf(step >= 3) AS purchased
FROM session_steps;
```

Synthetic generator tạo random `session_id` mỗi row nên funnel gần như không tiến bước—đây là test data bug có chủ đích. Hãy viết generator v2 giữ nhiều events cùng session và theo thứ tự hợp lý; ghi lại vì sao dữ liệu test sai có thể dẫn đến “tối ưu” sai.

### Q3 - Current live orders từ CDC

```sql
SELECT
    status,
    count() AS orders,
    sum(amount) AS amount
FROM
(
    SELECT
        order_id,
        latest.1 AS status,
        latest.2 AS amount,
        latest.3 AS deleted
    FROM
    (
        SELECT
            order_id,
            argMax(tuple(status, total_amount, is_deleted), source_version) AS latest
        FROM ecommerce.orders_current
        GROUP BY order_id
    )
)
WHERE deleted = 0
GROUP BY status;
```

### Q4 - Product anomaly

```sql
SELECT
    product_id,
    countIf(event_type = 'purchase') AS purchases,
    quantileTDigest(0.99)(toFloat64(price * quantity)) AS p99_order_value
FROM ecommerce.capstone_events
WHERE event_date >= '2025-03-01'
GROUP BY product_id
HAVING purchases >= 10
ORDER BY p99_order_value DESC
LIMIT 100;
```

## 4. Thiết kế phải nộp

Viết các ADR (Architecture Decision Record), mỗi ADR gồm context, alternatives, decision, evidence, consequences và rollback:

1. Vì sao chọn ClickHouse thay/đi cùng PostgreSQL.
2. Grain và type của event/order CDC.
3. Sorting key và partition key cho từng table.
4. Batch/async insert settings và retry/idempotency contract.
5. Exact/approx algorithms cho distinct/quantile.
6. MV/projection/skipping index nào được chọn và vì sao những cái còn lại bị loại.
7. Raw/current CDC, version/tombstone và late-event policy.
8. Shard key, replica count, Keeper topology và capacity plan.
9. RBAC/quota/network/TLS boundary.
10. Backup RPO/RTO và restore drill.

## 5. Pre-aggregation ứng viên

Một MV cho Q1:

```sql
CREATE TABLE ecommerce.capstone_daily_kpi
(
    day Date,
    country FixedString(2),
    events UInt64,
    purchase_events UInt64,
    revenue Decimal(20, 2)
)
ENGINE = SummingMergeTree
ORDER BY (day, country);

-- Lab: backfill trước khi create MV khi không có concurrent writer.
INSERT INTO ecommerce.capstone_daily_kpi
SELECT
    event_date,
    country,
    count(),
    countIf(event_type = 'purchase'),
    sumIf(price * quantity, event_type = 'purchase')
FROM ecommerce.capstone_events
GROUP BY event_date, country;

CREATE MATERIALIZED VIEW ecommerce.mv_capstone_daily_kpi
TO ecommerce.capstone_daily_kpi
AS
SELECT
    event_date AS day,
    country,
    count() AS events,
    countIf(event_type = 'purchase') AS purchase_events,
    sumIf(price * quantity, event_type = 'purchase') AS revenue
FROM ecommerce.capstone_events
GROUP BY day, country;

SELECT
    day,
    country,
    sum(events) AS events,
    sum(purchase_events) AS purchase_events,
    sum(revenue) AS revenue
FROM ecommerce.capstone_daily_kpi
GROUP BY day, country
ORDER BY day, country;
```

Unique users không cộng được giữa blocks/days. Nếu pre-aggregate DAU, dùng `AggregateFunction(uniqCombined64, UInt64)` với `uniqCombined64State/Merge`, không sum số distinct từng block.

## 6. Benchmark tái lập

Lưu query vào client hoặc dùng command:

```bash
docker compose exec clickhouse clickhouse-benchmark \
  --user student --password student_pass \
  --concurrency 8 --iterations 50 \
  --query "SELECT country, count() FROM ecommerce.capstone_events WHERE event_date >= '2025-03-01' GROUP BY country"
```

Cho mỗi version thiết kế, ghi:

| Chỉ số | Baseline | Sau tối ưu | Chênh lệch |
|---|---:|---:|---:|
| p50/p95/p99 latency | | | |
| read_rows/read_bytes | | | |
| SelectedMarks | | | |
| peak memory | | | |
| insert rows/s | | | |
| compressed bytes | | | |
| active parts | | | |

Chạy warm-up riêng; cùng data snapshot, concurrency và settings. Đo cả write penalty sau khi thêm MV/projection/index.

## 7. Correctness test suite

```sql
-- Duplicate rate.
SELECT
    count() AS physical_rows,
    uniqExact(event_id) AS logical_events,
    physical_rows - logical_events AS duplicate_rows
FROM ecommerce.capstone_events;

-- Current-state version collision.
SELECT order_id, source_version, uniqExact(tuple(status, total_amount, is_deleted)) AS payloads
FROM ecommerce.orders_current
GROUP BY order_id, source_version
HAVING payloads > 1;

-- Late-data lag distribution.
SELECT
    quantiles(0.5, 0.95, 0.99)(dateDiff('second', event_time, ingested_at)) AS lag_seconds
FROM ecommerce.capstone_events;

-- MV reconciliation by day/country.
SELECT
    r.event_date,
    r.country,
    r.revenue AS raw_revenue,
    m.revenue AS mv_revenue,
    raw_revenue - mv_revenue AS delta
FROM
(
    SELECT event_date, country,
           sumIf(price * quantity, event_type = 'purchase') AS revenue
    FROM ecommerce.capstone_events
    GROUP BY event_date, country
) r
FULL OUTER JOIN
(
    SELECT day, country, sum(revenue) AS revenue
    FROM ecommerce.capstone_daily_kpi
    GROUP BY day, country
) m ON r.event_date = m.day AND r.country = m.country
WHERE raw_revenue != mv_revenue OR r.event_date IS NULL OR m.day IS NULL
SETTINGS join_use_nulls = 1;
```

`FULL OUTER JOIN` với non-Nullable join keys có thể điền default thay NULL tùy `join_use_nulls`; query bật setting này có chủ đích. Khi chuẩn hóa cho CI, so thêm counts/checksum theo key.

## 8. Failure drills bắt buộc

- stop ClickHouse trong khi producer vẫn gửi; đo queue growth và recovery;
- gửi 10.000 one-row inserts; quan sát parts/delay/throw và sửa batching;
- tạo mutation lớn; đo merge/query contention rồi cancel an toàn;
- làm disk gần ngưỡng bằng data **trong volume lab**, không lấp disk hệ điều hành;
- cluster lab: kill replica/Keeper/network, đo ACK/read consistency;
- CDC: restart từ checkpoint, inject duplicate, delete và version collision;
- backup database, xóa một **table lab copy**, restore và kiểm chứng checksum;
- chạy query analyst vượt quota/memory và xác nhận dashboard user không bị ảnh hưởng.

Mỗi drill phải có expected signal, alert, bước chẩn đoán, mitigation, rollback và điều kiện kết thúc.

## 9. Risk register: bug ẩn phải xử lý

| Keyword/risk | Test bắt buộc | Điều kiện pass |
|---|---|---|
| `ORDER BY` không unique | Insert cùng event ID 2 lần | Metric contract xử lý duplicate rõ ràng |
| merge eventual | Query trước/sau merge | Kết quả logic không phụ thuộc thời điểm merge |
| `FINAL` cost | So raw state query và FINAL | Đạt SLO hoặc có state-table alternative |
| partition explosion | Đếm partitions/parts | Cardinality có bound và merge theo kịp |
| small inserts | Burst one-row inserts | Backpressure/async batching hồi phục được |
| late events | Insert event vào tháng cũ | MV/report/backup có correction policy |
| tombstone resurrection | Delete latest rồi query | Deleted order không sống lại |
| MV cutover | Backfill + concurrent insert | Không gap/duplicate theo watermark |
| distinct states | Merge nhiều blocks | DAU không được sum từ distinct counts |
| projection/index write tax | Đo ingest trước/sau | Read gain biện minh storage/write cost |
| shard skew | Hot tenant distribution | Max shard load trong bound đã định |
| replica lag | Đọc ngay sau write/lỗi mạng | Consistency behavior đúng contract |
| CDC slot lag | Dừng consumer | Alert trước khi WAL đe dọa source disk |
| schema evolution | Add/rename/type change | Producer/sink/consumer rollout tương thích |
| backup chain | Restore isolated | Đạt RPO/RTO và checksum/business query đúng |
| query-log PII | Audit log access/retention | Quyền tối thiểu, TTL/masking theo policy |

## 10. Rubric 100 điểm

| Hạng mục | Điểm |
|---|---:|
| Correctness + metric contracts | 20 |
| Schema/key/engine decisions | 15 |
| Ingestion, dedup, late data, CDC | 15 |
| Query/MV/projection/index performance | 15 |
| Benchmark methodology/evidence | 10 |
| Cluster/capacity/failure behavior | 10 |
| Security/backup/restore | 10 |
| Monitoring/runbook/communication | 5 |

## Definition of done

- Tất cả DDL/query nằm trong version control và chạy lại trên volume rỗng.
- Dashboard metrics khớp reconciliation tại boundary đã ghi.
- Benchmark đạt SLO hoặc có capacity plan định lượng.
- Không có mutation/merge/replication/distributed queue lỗi tồn đọng.
- Quyền analyst/ingest/admin được kiểm thử tách biệt.
- Backup đã restore trên database khác, không chỉ báo `BACKUP_CREATED`.
- Ba failure drills quan trọng nhất đã chạy và cập nhật runbook từ kết quả thật.
- ADR ghi cả trade-off và điều kiện cần xem xét lại quyết định.

Khi hoàn thành, hãy trình bày hệ thống theo chuỗi: **business question → metric contract → data model → physical layout → ingest semantics → query evidence → failure behavior → recovery**. Đây là năng lực production quan trọng hơn việc nhớ nhiều settings.
