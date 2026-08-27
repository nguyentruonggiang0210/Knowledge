# 01 — Advanced SQL: từ báo cáo đến truy vấn đồ thị

## Scenario và trade-off map

| Knowledge item | Scenario production | Trade-off cần quyết định |
|---|---|---|
| Window function | ranking, running balance, so kỳ trước | Gọn hơn self-join nhưng thường cần sort/window memory; frame và tie-break phải rõ |
| `DISTINCT ON` | latest row per entity | Rất gọn và index-friendly nhưng PostgreSQL-specific, ordering sai cho kết quả không ổn định |
| CTE | chia pipeline logic hoặc tái dùng intermediate result | Readable; `MATERIALIZED` có thể tránh tính lại nhưng chặn pushdown và spill |
| `LATERAL` | top-N child per parent | Diễn đạt correlated lookup tốt; thiếu index biến thành N lần scan |
| Recursive CTE | cây danh mục/dependency graph | Không cần procedural loop; cycle/depth làm CPU-memory không giới hạn nếu thiếu guard |
| `GROUPING SETS`/`ROLLUP` | detail + subtotal + grand total một lượt | Giảm scan nhưng output `NULL` tổng hợp cần phân biệt và plan có thể nặng |

## Chuẩn bị dữ liệu

```sql
DROP SCHEMA IF EXISTS adv_sql CASCADE;
CREATE SCHEMA adv_sql;

CREATE TABLE adv_sql.customer (
    customer_id bigint PRIMARY KEY,
    name text NOT NULL,
    region text NOT NULL
);

CREATE TABLE adv_sql.orders (
    order_id bigint PRIMARY KEY,
    customer_id bigint NOT NULL REFERENCES adv_sql.customer,
    ordered_at timestamptz NOT NULL,
    amount numeric(12,2) NOT NULL,
    status text NOT NULL
);

INSERT INTO adv_sql.customer VALUES
    (1, 'An', 'north'), (2, 'Bình', 'south'), (3, 'Chi', 'north');

INSERT INTO adv_sql.orders VALUES
    (101, 1, '2026-01-01 08:00+07', 100, 'paid'),
    (102, 1, '2026-01-03 09:00+07', 250, 'paid'),
    (103, 2, '2026-01-02 10:00+07', 80,  'cancelled'),
    (104, 2, '2026-01-05 11:00+07', 150, 'paid'),
    (105, 3, '2026-01-05 12:00+07', 300, 'paid'),
    (106, 3, '2026-01-08 13:00+07', 120, 'paid');
```

## 1. Window function

Window function tính trên tập row liên quan nhưng không gom chúng thành một row như `GROUP BY`.

```sql
SELECT
    customer_id,
    order_id,
    ordered_at,
    amount,
    row_number() OVER (
        PARTITION BY customer_id
        ORDER BY ordered_at, order_id
    ) AS order_no,
    sum(amount) OVER (
        PARTITION BY customer_id
        ORDER BY ordered_at, order_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_amount,
    lag(amount) OVER (
        PARTITION BY customer_id
        ORDER BY ordered_at, order_id
    ) AS previous_amount
FROM adv_sql.orders
WHERE status = 'paid'
ORDER BY customer_id, ordered_at, order_id;
```

**Tình huống thực tế:** Xếp thứ tự giao dịch, running balance, so sánh với kỳ trước và phát hiện biến động mà không self-join.

> **Bug ẩn / production — window frame:** Với `ORDER BY`, frame mặc định thường là `RANGE ... CURRENT ROW`, gồm cả các peer có cùng sort key. Running total có thể “nhảy” nhiều row. Ghi rõ `ROWS ...` và thêm tie-breaker duy nhất như `order_id`.

### Top N mỗi nhóm

```sql
WITH ranked AS (
    SELECT o.*,
           row_number() OVER (
               PARTITION BY customer_id
               ORDER BY amount DESC, order_id
           ) AS rn
    FROM adv_sql.orders AS o
    WHERE status = 'paid'
)
SELECT *
FROM ranked
WHERE rn <= 2
ORDER BY customer_id, rn;
```

> **Bug ẩn / production — `row_number`:** Nếu `ORDER BY` không xác định duy nhất, row thắng có thể đổi giữa các lần chạy. Luôn có tie-breaker ổn định.

## 2. `DISTINCT ON` của PostgreSQL

`DISTINCT ON` rất gọn cho “row mới nhất mỗi nhóm”.

```sql
SELECT DISTINCT ON (customer_id)
       customer_id, order_id, ordered_at, amount
FROM adv_sql.orders
WHERE status = 'paid'
ORDER BY customer_id, ordered_at DESC, order_id DESC;
```

**Tình huống thực tế:** Lấy trạng thái/event mới nhất của mỗi entity. Index `(customer_id, ordered_at DESC, order_id DESC)` thường hữu ích khi bảng lớn.

> **Bug ẩn / production — `DISTINCT ON`:** Biểu thức đầu của `ORDER BY` phải khớp `DISTINCT ON`. Thiếu `ORDER BY` hoặc tie-breaker làm kết quả không xác định; đây cũng là cú pháp riêng PostgreSQL, ảnh hưởng portability.

## 3. CTE: readability, inlining và materialization

```sql
WITH paid AS NOT MATERIALIZED (
    SELECT *
    FROM adv_sql.orders
    WHERE status = 'paid'
)
SELECT customer_id, sum(amount) AS revenue
FROM paid
WHERE ordered_at >= TIMESTAMPTZ '2026-01-03 00:00+07'
GROUP BY customer_id;
```

Từ PostgreSQL 12, CTE chỉ được tham chiếu một lần và không volatile thường có thể được inline. `MATERIALIZED` buộc tính trước; `NOT MATERIALIZED` khuyến khích gộp vào query cha.

```sql
WITH paid AS MATERIALIZED (
    SELECT * FROM adv_sql.orders WHERE status = 'paid'
)
SELECT count(*) FROM paid WHERE amount >= 200;
```

**Tình huống thực tế:** Materialize có lợi khi một kết quả đắt được dùng nhiều lần; inline có lợi khi filter từ query ngoài cần được push xuống scan.

> **Bug ẩn / production — CTE:** Cố ép `MATERIALIZED` có thể tạo intermediate result lớn, spill ra disk và chặn predicate pushdown. Ngược lại, `NOT MATERIALIZED` có thể lặp lại phép tính khi CTE được dùng nhiều lần. So bằng `EXPLAIN (ANALYZE, BUFFERS)`.

## 4. `LATERAL`: subquery phụ thuộc từng row bên trái

```sql
SELECT
    c.customer_id,
    c.name,
    recent.order_id,
    recent.ordered_at,
    recent.amount
FROM adv_sql.customer AS c
LEFT JOIN LATERAL (
    SELECT o.order_id, o.ordered_at, o.amount
    FROM adv_sql.orders AS o
    WHERE o.customer_id = c.customer_id
      AND o.status = 'paid'
    ORDER BY o.ordered_at DESC, o.order_id DESC
    LIMIT 1
) AS recent ON true
ORDER BY c.customer_id;
```

**Tình huống thực tế:** Top 1/N child mỗi parent, mở rộng mảng/JSON theo row, gọi set-returning function bằng input của row hiện tại.

```sql
CREATE INDEX orders_customer_latest_idx
ON adv_sql.orders (customer_id, ordered_at DESC, order_id DESC)
INCLUDE (amount)
WHERE status = 'paid';
```

> **Bug ẩn / production — `LATERAL`:** Subquery có thể chạy một lần cho mỗi row bên trái. Không có index phù hợp sẽ thành N lần scan bảng lớn. Kiểm tra `loops` trong execution plan.

## 5. Recursive CTE và cycle

```sql
CREATE TABLE adv_sql.category (
    category_id integer PRIMARY KEY,
    parent_id integer REFERENCES adv_sql.category,
    name text NOT NULL
);

INSERT INTO adv_sql.category VALUES
    (1, NULL, 'All'),
    (2, 1, 'Database'),
    (3, 2, 'PostgreSQL'),
    (4, 2, 'ClickHouse');

WITH RECURSIVE tree AS (
    SELECT category_id, parent_id, name,
           0 AS depth,
           ARRAY[category_id] AS path
    FROM adv_sql.category
    WHERE parent_id IS NULL

    UNION ALL

    SELECT c.category_id, c.parent_id, c.name,
           t.depth + 1,
           t.path || c.category_id
    FROM adv_sql.category AS c
    JOIN tree AS t ON c.parent_id = t.category_id
    WHERE NOT c.category_id = ANY(t.path)
)
SELECT category_id, repeat('  ', depth) || name AS indented_name, path
FROM tree
ORDER BY path;
```

**Tình huống thực tế:** Cây danh mục, org chart, dependency graph. Mảng `path` vừa sắp thứ tự vừa ngăn vòng lặp.

> **Bug ẩn / production — recursion:** Dữ liệu cycle hoặc cây quá sâu làm query chạy lâu/tiêu thụ bộ nhớ. Foreign key tự tham chiếu không ngăn cycle nhiều node. Luôn có cycle guard, giới hạn depth theo domain và timeout phù hợp.

## 6. `GROUPING SETS`, `ROLLUP`

```sql
SELECT
    c.region,
    o.status,
    sum(o.amount) AS amount,
    grouping(c.region) AS is_region_total,
    grouping(o.status) AS is_status_total
FROM adv_sql.orders AS o
JOIN adv_sql.customer AS c USING (customer_id)
GROUP BY GROUPING SETS (
    (c.region, o.status),
    (c.region),
    ()
)
ORDER BY c.region NULLS LAST, o.status NULLS LAST;
```

**Tình huống thực tế:** Một scan sinh báo cáo chi tiết, subtotal theo vùng và grand total.

> **Bug ẩn / production — subtotal:** `NULL` trong output có thể là giá trị dữ liệu thật hoặc row tổng hợp. Dùng `GROUPING(...)` để phân biệt, không chỉ `COALESCE` rồi đoán.

## Bài tập

1. Lấy ba order mới nhất mỗi region bằng window function.
2. Viết hai phiên bản top-1: `DISTINCT ON` và `LATERAL`; tạo 100.000 order bằng `generate_series`, so plan.
3. Cố tình tạo cycle `2 -> 3 -> 2` trong bảng phụ, chứng minh query vẫn dừng.
4. Tạo báo cáo doanh thu ngày, subtotal tháng và grand total bằng `ROLLUP`.
