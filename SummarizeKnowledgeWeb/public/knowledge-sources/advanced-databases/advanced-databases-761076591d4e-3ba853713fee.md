# 03 - MergeTree, sorting key, partition, primary index và granule

## Mục tiêu

- Thiết kế `PARTITION BY`, `ORDER BY`, `PRIMARY KEY` từ query pattern.
- Hiểu MergeTree family và trạng thái “chưa merge xong”.
- Đọc được `EXPLAIN indexes = 1` và metadata parts.

## 1. Bốn quyết định riêng biệt

```sql
CREATE TABLE ecommerce.events_design_demo
(
    event_time DateTime64(3, 'UTC'),
    event_date Date MATERIALIZED toDate(event_time),
    tenant_id UInt32,
    event_type LowCardinality(String),
    user_id UInt64,
    value Float64
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
PRIMARY KEY (tenant_id, event_date, event_type)
ORDER BY (tenant_id, event_date, event_type, user_id, event_time)
SETTINGS index_granularity = 8192;
```

- `PARTITION BY`: lifecycle/partition pruning và ranh giới merge.
- `ORDER BY`: thứ tự vật lý trong mỗi part; quyết định locality/compression/data skipping.
- `PRIMARY KEY`: sparse index; thường là prefix của sorting key; không unique.
- granule/mark: đơn vị index và đọc gần đúng, không phải một entry mỗi row.

Nếu không khai báo `PRIMARY KEY`, ClickHouse dùng sorting key làm primary key. Chỉ tách hai key khi có lý do giảm index-in-memory hoặc dùng phần suffix chỉ cho locality.

## 2. Chọn sorting key từ query thực tế

Query phổ biến:

```sql
SELECT event_date, uniqCombined64(user_id)
FROM ecommerce.events
WHERE event_date BETWEEN '2025-01-01' AND '2025-01-31'
  AND event_type = 'purchase'
GROUP BY event_date;
```

Key hiện tại bắt đầu `(event_date, event_type, ...)`, phù hợp range ngày rồi loại event. Quy tắc thực dụng:

1. Các cột hầu như luôn có trong filter và cardinality vừa phải đứng sớm.
2. Đặt range/time sau equality dimensions thường dùng, nhưng xem lại pattern đa số.
3. Cột cardinality cao có thể ở sau để tạo locality.
4. Đừng đưa mọi cột vào key; key dài tăng metadata/merge work và không cứu predicate không liên quan.

Đo pruning:

```sql
EXPLAIN indexes = 1
SELECT count()
FROM ecommerce.events
WHERE event_date = '2025-01-05' AND event_type = 'purchase';

EXPLAIN indexes = 1
SELECT count()
FROM ecommerce.events
WHERE user_id = 101;
```

## 3. Partition vừa đủ thô

Monthly partition thường hợp retention theo tháng:

```sql
SELECT
    partition,
    count() AS parts,
    sum(rows) AS rows,
    min(min_date) AS min_date,
    max(max_date) AS max_date
FROM system.parts
WHERE database = 'ecommerce' AND table = 'events' AND active
GROUP BY partition
ORDER BY partition;
```

Partition không nhằm tăng tốc mọi query. Sorting/primary index mới chịu phần lớn data skipping bên trong partition. Partition theo `user_id` hoặc timestamp chi tiết thường là thảm họa metadata.

Thao tác lifecycle nhanh theo partition:

```sql
-- Chỉ xem lệnh; chạy trên table lab khi thật sự muốn xóa tháng đó.
ALTER TABLE ecommerce.events_design_demo DROP PARTITION 202401;
```

## 4. MergeTree family

### 4.1 MergeTree: giữ mọi row

```sql
CREATE TABLE ecommerce.raw_measurements
(
    ts DateTime64(3, 'UTC'),
    sensor_id UInt32,
    value Float64
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (sensor_id, ts);
```

### 4.2 ReplacingMergeTree: chọn phiên bản khi merge

`ecommerce.orders` dùng `ReplacingMergeTree(version)`. Quan sát raw và logical latest:

```sql
SELECT order_id, status, version
FROM ecommerce.orders
WHERE order_id = 5001
ORDER BY version;

-- Chính xác theo engine semantics tại thời điểm đọc, nhưng có thể đắt.
SELECT order_id, status, version
FROM ecommerce.orders FINAL
WHERE order_id = 5001;

-- Pattern thường nhanh hơn cho báo cáo lớn: lấy trọn state mới nhất,
-- rồi mới lọc tombstone. Lọc is_deleted trước argMax sẽ "hồi sinh" row cũ.
SELECT
    order_id,
    latest.1 AS latest_status,
    latest.3 AS latest_version
FROM
(
    SELECT
        order_id,
        argMax(tuple(status, is_deleted, version), version) AS latest
    FROM ecommerce.orders
    GROUP BY order_id
)
WHERE latest.2 = 0;
```

Replacing chỉ so các row có cùng sorting key và nằm trong phạm vi merge phù hợp. Nếu cùng business ID bị đưa vào partition khác nhau, chúng không tự gặp nhau để dedup trong background merge.

### 4.3 SummingMergeTree: cộng cột numeric trong merge

```sql
CREATE TABLE ecommerce.daily_sales_summing
(
    day Date,
    category LowCardinality(String),
    orders UInt64,
    revenue Decimal(18, 2)
)
ENGINE = SummingMergeTree
ORDER BY (day, category);

INSERT INTO ecommerce.daily_sales_summing VALUES
    ('2025-01-05', 'books', 1, 15.90),
    ('2025-01-05', 'books', 2, 42.00);

-- Luôn aggregate lại khi đọc; merge có thể chưa xảy ra.
SELECT day, category, sum(orders), sum(revenue)
FROM ecommerce.daily_sales_summing
GROUP BY day, category;
```

### 4.4 AggregatingMergeTree: lưu aggregate states

```sql
CREATE TABLE ecommerce.daily_users_agg
(
    day Date,
    category LowCardinality(String),
    users AggregateFunction(uniqCombined64, UInt64)
)
ENGINE = AggregatingMergeTree
ORDER BY (day, category);

INSERT INTO ecommerce.daily_users_agg
SELECT event_date, category, uniqCombined64State(user_id)
FROM ecommerce.events
GROUP BY event_date, category;

SELECT day, category, uniqCombined64Merge(users) AS users
FROM ecommerce.daily_users_agg
GROUP BY day, category;
```

### 4.5 CollapsingMergeTree: state/cancel theo sign

```sql
CREATE TABLE ecommerce.order_state_collapsing
(
    order_id UInt64,
    status LowCardinality(String),
    amount Decimal(14, 2),
    sign Int8
)
ENGINE = CollapsingMergeTree(sign)
ORDER BY order_id;

INSERT INTO ecommerce.order_state_collapsing VALUES
    (7001, 'created', 10.00,  1),
    (7001, 'created', 10.00, -1),
    (7001, 'paid',    10.00,  1);

SELECT order_id, sum(amount * sign) AS amount, sum(sign) AS live_states
FROM ecommerce.order_state_collapsing
GROUP BY order_id
HAVING live_states > 0;
```

`VersionedCollapsingMergeTree(sign, version)` thêm version để xử lý thứ tự arrival tốt hơn, nhưng producer vẫn phải sinh cancel/state đúng quy ước.

## 5. Granule thích nghi và index size

```sql
SELECT
    name,
    rows,
    marks,
    round(rows / greatest(marks, 1), 1) AS rows_per_mark,
    formatReadableSize(primary_key_bytes_in_memory) AS pk_memory
FROM system.parts
WHERE database = 'ecommerce' AND table = 'events' AND active;
```

Granule mục tiêu chịu `index_granularity` và `index_granularity_bytes`. Row rất rộng có thể tạo granule ít row hơn. Giảm granularity giúp pruning mịn nhưng tăng marks, index memory và số seek.

## 6. `OPTIMIZE ... FINAL` không phải cron job

```sql
-- Chỉ dùng trên table lab nhỏ để quan sát, không coi là maintenance định kỳ.
OPTIMIZE TABLE ecommerce.orders FINAL;

SELECT order_id, status, version
FROM ecommerce.orders
WHERE order_id = 5001;
```

`OPTIMIZE FINAL` ép merge lớn, có thể tiêu tốn I/O/disk tạm và bỏ qua chiến lược merge tối ưu. Production nên thiết kế query đúng khi merge chưa hoàn tất.

## Keywords và bug ẩn production

| Keyword | Ý nghĩa | Bug ẩn / tình huống thực tế |
|---|---|---|
| `MergeTree` | Engine nền tảng immutable parts | Tên có “Tree” nhưng không phải row-level B-tree; point lookup vẫn theo sparse index/granule. |
| `ORDER BY` | Sorting key vật lý | Không unique. Thêm UUID random đầu key làm các filter khác gần như mất pruning/locality. |
| `PRIMARY KEY` | Sparse primary index | Duplicate được phép; ORM giả định PK unique sẽ trả nhiều row. |
| prefix | Phần đầu sorting key | Filter bỏ cột đầu có thể giảm mạnh hiệu quả các cột key phía sau. |
| `PARTITION BY` | Ranh giới lifecycle/merge | Daily partition cho table nhỏ/many tenants sinh hàng chục nghìn partitions. |
| granule | Cụm row giữa marks | Giảm từ 8192 xuống rất nhỏ làm index phình và tăng seek/merge overhead. |
| adaptive granularity | Giới hạn theo rows/bytes | Row Map/String cực rộng khiến rows-per-granule thay đổi, benchmark trên schema giả sẽ sai. |
| `ReplacingMergeTree` | Giữ row có version cao khi merge | Dedup eventual; version bằng nhau chọn row không nên được xem là deterministic business rule. |
| `FINAL` | Collapse/dedup tại read | Dashboard quét toàn table với FINAL có thể tăng CPU/RAM lớn; dùng latest-state model/MV khi phù hợp. |
| `SummingMergeTree` | Cộng numeric cùng key khi merge | Nếu đọc không `GROUP BY sum`, kết quả phụ thuộc merge timing. Cột numeric không muốn cộng phải thiết kế rõ. |
| `AggregatingMergeTree` | Merge aggregate states | Đọc state bằng hàm thường thay vì `...Merge` cho type/error hoặc kết quả sai. |
| `CollapsingMergeTree` | Collapse state/cancel | Thiếu cancel row, sign sai hoặc duplicate message tạo balance sai khó sửa. |
| `VersionedCollapsingMergeTree` | Collapse có version | Version không monotonic/không cùng key làm lịch sử không collapse như mong đợi. |
| `OPTIMIZE FINAL` | Ép merge parts | Chạy định kỳ trên partition lớn gây write amplification và thiếu disk headroom. |

## Bài thực hành

Đề xuất key cho query SaaS: luôn lọc `tenant_id`, khoảng `event_time`, đôi khi `event_type`, group theo user. Viết DDL, sinh 1 triệu rows, dùng `EXPLAIN indexes = 1` chứng minh. Sau đó đảo key thành `(event_time, tenant_id, ...)` và so sánh hai workload khác nhau.
