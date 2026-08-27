# 07 - Materialized view, projection và data-skipping index

## Mục tiêu

- Chọn đúng giữa pre-aggregation, alternate layout và skipping.
- Backfill materialized view không đếm trùng.
- Chứng minh optimizer dùng projection/index qua `EXPLAIN` và read metrics.

## 1. Ba công cụ, ba mục tiêu

| Công cụ | Dùng khi | Không phải |
|---|---|---|
| Materialized view (incremental) | Transform/pre-aggregate block mới sang target table | View luôn tính lại toàn source |
| Projection | Layout/aggregate phụ được quản lý cùng table | B-tree secondary index |
| Data-skipping index | Predicate tương quan giúp bỏ granule | Unique index hoặc lookup một row |

## 2. Incremental materialized view

Tạo target và backfill trong lab:

```sql
CREATE TABLE ecommerce.daily_sales
(
    day Date,
    category LowCardinality(String),
    purchase_events UInt64,
    revenue Decimal(18, 2)
)
ENGINE = SummingMergeTree
ORDER BY (day, category);

-- Backfill dữ liệu có trước.
INSERT INTO ecommerce.daily_sales
SELECT
    event_date AS day,
    category,
    countIf(event_type = 'purchase') AS purchase_events,
    sumIf(price * quantity, event_type = 'purchase') AS revenue
FROM ecommerce.events
GROUP BY day, category;

-- Từ đây MV nhận block insert mới.
CREATE MATERIALIZED VIEW ecommerce.mv_daily_sales
TO ecommerce.daily_sales
AS
SELECT
    event_date AS day,
    category,
    countIf(event_type = 'purchase') AS purchase_events,
    sumIf(price * quantity, event_type = 'purchase') AS revenue
FROM ecommerce.events
GROUP BY day, category;
```

Đọc target phải aggregate lại vì `SummingMergeTree` merge bất đồng bộ:

```sql
SELECT
    day,
    category,
    sum(purchase_events) AS purchase_events,
    sum(revenue) AS revenue
FROM ecommerce.daily_sales
GROUP BY day, category
ORDER BY day, category;
```

Test incremental:

```sql
INSERT INTO ecommerce.events
    (event_id, event_time, user_id, session_id, event_type, product_id,
     category, price, quantity, country, device, properties)
VALUES
    (generateUUIDv4(), '2025-02-10 11:00:00.000', 901, generateUUIDv4(),
     'purchase', 1001, 'books', 10.00, 2, 'VN', 'mobile', map('source', 'mv-test'));
```

Production không thể để khoảng trống giữa backfill và create MV như lab khi writes vẫn chạy. Chọn watermark/cutover: tạo MV với filter từ thời điểm T rồi backfill `< T`, hoặc pause/dual-write có kiểm chứng.

## 3. MV chỉ thấy inserted block

Incremental MV không reread toàn source sau mutation và không tự phản ứng khi một JOINed dimension table thay đổi. Với `ReplacingMergeTree`/CDC, mỗi version insert có thể đi vào aggregate, khiến cộng cả old lẫn new state.

Pattern state an toàn hơn cho metric cần latest:

```sql
CREATE TABLE ecommerce.order_latest_state
(
    order_id UInt64,
    state AggregateFunction(
        argMax,
        Tuple(LowCardinality(String), Decimal(14, 2), UInt8),
        UInt64
    )
)
ENGINE = AggregatingMergeTree
ORDER BY order_id;

-- Backfill những versions đã có trước khi bật MV (lab đang không có concurrent writes).
INSERT INTO ecommerce.order_latest_state
SELECT
    order_id,
    argMaxState(tuple(status, total_amount, is_deleted), version) AS state
FROM ecommerce.orders
GROUP BY order_id;

CREATE MATERIALIZED VIEW ecommerce.mv_order_latest_state
TO ecommerce.order_latest_state
AS
SELECT
    order_id,
    argMaxState(tuple(status, total_amount, is_deleted), version) AS state
FROM ecommerce.orders
GROUP BY order_id;

SELECT
    order_id,
    tupleElement(argMaxMerge(state), 1) AS status,
    tupleElement(argMaxMerge(state), 2) AS amount,
    tupleElement(argMaxMerge(state), 3) AS is_deleted
FROM ecommerce.order_latest_state
GROUP BY order_id;
```

MV chỉ nhận inserts từ thời điểm được tạo. Ví dụ đã backfill trước khi tạo MV; production phải khóa một watermark để backfill và stream không gap/overlap.

## 4. Projection: alternate order/layout

Predicate `product_id` không khớp sorting key chính của `events`. Thêm projection:

```sql
ALTER TABLE ecommerce.events
ADD PROJECTION IF NOT EXISTS p_by_product
(
    SELECT
        product_id,
        event_date,
        event_type,
        user_id,
        price,
        quantity
    ORDER BY (product_id, event_date, event_type)
);

ALTER TABLE ecommerce.events MATERIALIZE PROJECTION p_by_product;

EXPLAIN indexes = 1
SELECT count()
FROM ecommerce.events
WHERE product_id = 1001
  AND event_date >= '2025-01-01';
```

Projection tăng storage, write/merge/mutation work. Optimizer chỉ dùng khi query có thể được phục vụ bởi projection và ước lượng có lợi.

Aggregate projection:

```sql
ALTER TABLE ecommerce.events
ADD PROJECTION IF NOT EXISTS p_daily_product_counts
(
    SELECT
        event_date,
        product_id,
        count()
    GROUP BY event_date, product_id
);

ALTER TABLE ecommerce.events MATERIALIZE PROJECTION p_daily_product_counts;

EXPLAIN
SELECT event_date, product_id, count()
FROM ecommerce.events
GROUP BY event_date, product_id;
```

## 5. Data-skipping indexes

### Bloom filter cho equality

```sql
ALTER TABLE ecommerce.events
ADD INDEX IF NOT EXISTS idx_product_id product_id
TYPE bloom_filter(0.01) GRANULARITY 4;

ALTER TABLE ecommerce.events MATERIALIZE INDEX idx_product_id;

EXPLAIN indexes = 1
SELECT count()
FROM ecommerce.events
WHERE product_id = 1001;
```

### Set index cho local cardinality nhỏ

```sql
ALTER TABLE ecommerce.events
ADD INDEX IF NOT EXISTS idx_country country TYPE set(100) GRANULARITY 4;

ALTER TABLE ecommerce.events MATERIALIZE INDEX idx_country;

EXPLAIN indexes = 1
SELECT count()
FROM ecommerce.events
WHERE country = 'VN';
```

### Min-max cho range tương quan

```sql
ALTER TABLE ecommerce.events
ADD INDEX IF NOT EXISTS idx_price price TYPE minmax GRANULARITY 4;

ALTER TABLE ecommerce.events MATERIALIZE INDEX idx_price;

EXPLAIN indexes = 1
SELECT count()
FROM ecommerce.events
WHERE price >= 700;
```

Nếu mỗi granule chứa gần như toàn range/country/product, index không loại được granule nào nhưng vẫn tốn storage/CPU write.

## 6. Đo hiệu quả, không tin tên index

```sql
SYSTEM FLUSH LOGS;

SELECT
    query_id,
    read_rows,
    read_bytes,
    result_rows,
    query_duration_ms,
    ProfileEvents['SelectedMarks'] AS selected_marks
FROM system.query_log
WHERE type = 'QueryFinish'
  AND query LIKE '%product_id = 1001%'
ORDER BY event_time DESC
LIMIT 5;
```

Trên 10 dòng mẫu, optimizer có thể scan toàn bộ; benchmark với `events_bench` và layout tương tự production.

## Keywords và bug ẩn production

| Keyword | Ý nghĩa | Bug ẩn / tình huống thực tế |
|---|---|---|
| incremental MV | Trigger trên inserted block | Không tự backfill; tạo MV sau lịch sử cho target rỗng/thiếu. |
| MV target | Table vật lý nhận output | Drop/alter target không tương thích làm insert source fail vì MV chạy đồng bộ trong insert path. |
| MV + JOIN | Transform block có lookup | Dimension thay đổi không kích hoạt tính lại rows cũ; historical output stale. |
| MV + CDC | Mỗi version là insert | Sum trực tiếp cộng cả before/after; cần sign, state aggregate hoặc recompute. |
| cutover watermark | Ranh giới backfill/realtime | Window overlap gây double count; gap gây mất rows. Lưu watermark và reconcile. |
| projection | Layout phụ cùng table | Tăng write amplification/disk; optimizer có thể không dùng dù projection tồn tại. |
| materialize projection | Xây cho old parts | Mutation nặng, cần disk headroom; parts mới và cũ có thể khác trạng thái trong lúc chạy. |
| bloom filter | Membership probabilistic | False positive chỉ làm đọc thêm, không mất row; FPR quá nhỏ làm index lớn/CPU cao. |
| `set(N)` | Tập giá trị mỗi block | Nếu distinct vượt N, index block có thể trống/không hữu ích; N không phải global cardinality. |
| `minmax` | Min/max mỗi granule | Dữ liệu random làm mỗi granule phủ gần toàn miền, không skip được. |
| index granularity multiplier | Số granules mỗi index block | Quá lớn làm pruning thô; quá nhỏ tăng index/write overhead. |
| `EXPLAIN indexes=1` | Báo parts/granules được chọn | Plan trên data nhỏ/cached không chứng minh lợi ích production; thêm query-log metrics. |

## Bài thực hành

Trên 10 triệu events, tối ưu ba query: theo product equality, price range và daily aggregate. Thử lần lượt sorting key, projection, skip index, MV; ghi storage tăng, insert throughput giảm và read_rows giảm. Chọn giải pháp theo tổng chi phí.
