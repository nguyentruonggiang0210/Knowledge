# 05 - Truy vấn phân tích, aggregate, funnel và window

## Mục tiêu

- Viết conditional/approximate aggregation đúng semantic.
- Tính funnel, retention và session metrics.
- Dùng window function, JOIN và ASOF JOIN có kiểm soát memory/cardinality.

## 1. Conditional aggregation

Các hậu tố combinator như `If`, `Distinct`, `State`, `Merge` ghép với aggregate function:

```sql
SELECT
    event_date,
    count() AS all_events,
    countIf(event_type = 'purchase') AS purchases,
    uniqCombined64If(user_id, event_type = 'purchase') AS buyers,
    sumIf(price * quantity, event_type = 'purchase') AS revenue,
    round(purchases / all_events, 4) AS purchase_event_rate
FROM ecommerce.events
GROUP BY event_date
ORDER BY event_date;
```

Một `purchase` event không nhất thiết bằng một order. Metric contract phải ghi rõ grain và denominator.

## 2. Exact và approximate distinct/quantile

```sql
SELECT
    uniqExact(user_id) AS exact_users,
    uniqCombined64(user_id) AS approx_users,
    quantilesExact(0.5, 0.9, 0.99)(toFloat64(price)) AS exact_price_q,
    quantilesTDigest(0.5, 0.9, 0.99)(toFloat64(price)) AS approx_price_q
FROM ecommerce.events;
```

`uniqExact` có memory tăng theo cardinality. Approximate algorithms có error/storage khác nhau; không đổi function giữa dashboard mà không version metric.

## 3. ROLLUP, CUBE và GROUPING SETS

```sql
SELECT
    event_date,
    category,
    countIf(event_type = 'purchase') AS purchases
FROM ecommerce.events
GROUP BY GROUPING SETS
(
    (event_date, category),
    (event_date),
    ()
)
ORDER BY event_date, category;
```

Subtotal có default value ở dimension tùy setting/type. Dùng `GROUPING()` khi cần phân biệt subtotal với dimension thật có giá trị mặc định:

```sql
SELECT
    event_date,
    category,
    grouping(event_date, category) AS grouping_mask,
    count()
FROM ecommerce.events
GROUP BY ROLLUP(event_date, category)
ORDER BY grouping_mask, event_date, category;
```

## 4. Funnel theo session

```sql
SELECT
    session_id,
    windowFunnel(3600)(
        toDateTime(event_time),
        event_type = 'view',
        event_type = 'add_cart',
        event_type = 'purchase'
    ) AS reached_step
FROM ecommerce.events
GROUP BY session_id
ORDER BY reached_step DESC;
```

Phân phối funnel:

```sql
WITH per_session AS
(
    SELECT
        session_id,
        windowFunnel(3600)(toDateTime(event_time),
            event_type = 'view',
            event_type = 'add_cart',
            event_type = 'purchase') AS step
    FROM ecommerce.events
    GROUP BY session_id
)
SELECT
    count() AS sessions,
    countIf(step >= 1) AS viewed,
    countIf(step >= 2) AS added,
    countIf(step >= 3) AS purchased
FROM per_session;
```

Funnel phụ thuộc order timestamp, cửa sổ và mode. Event đến muộn, clock sai hoặc duplicate làm kết quả đổi.

## 5. Retention/cohort

```sql
WITH first_seen AS
(
    SELECT user_id, min(event_date) AS cohort_date
    FROM ecommerce.events
    GROUP BY user_id
), activity AS
(
    SELECT DISTINCT user_id, event_date
    FROM ecommerce.events
)
SELECT
    f.cohort_date,
    dateDiff('day', f.cohort_date, a.event_date) AS day_number,
    uniqExact(a.user_id) AS active_users
FROM activity AS a
INNER JOIN first_seen AS f USING (user_id)
GROUP BY f.cohort_date, day_number
ORDER BY f.cohort_date, day_number;
```

Nếu dataset chỉ giữ 90 ngày, `min(event_date)` không phải first-ever; cohort bị “left truncation”. Cần user first-seen table hoặc backfill đủ lịch sử.

## 6. Window functions

Doanh thu chạy lũy kế:

```sql
WITH daily AS
(
    SELECT
        event_date,
        sumIf(price * quantity, event_type = 'purchase') AS revenue
    FROM ecommerce.events
    GROUP BY event_date
)
SELECT
    event_date,
    revenue,
    sum(revenue) OVER
        (ORDER BY event_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_revenue,
    avg(revenue) OVER
        (ORDER BY event_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS moving_7_rows
FROM daily
ORDER BY event_date;
```

`7 ROWS` nghĩa là tối đa 7 dòng, không phải 7 ngày lịch nếu ngày thiếu. Muốn calendar window, tạo calendar/fill date rồi window.

Xếp hạng category theo ngày:

```sql
WITH sales AS
(
    SELECT event_date, category,
           sumIf(price * quantity, event_type = 'purchase') AS revenue
    FROM ecommerce.events
    GROUP BY event_date, category
)
SELECT
    *,
    dense_rank() OVER (PARTITION BY event_date ORDER BY revenue DESC) AS category_rank
FROM sales
ORDER BY event_date, category_rank;
```

## 7. JOIN: kiểm soát multiplicity

```sql
SELECT
    i.category,
    sum(i.quantity * i.unit_price) AS paid_revenue
FROM ecommerce.order_items AS i
INNER JOIN
(
    SELECT
        order_id,
        argMax(tuple(status, is_deleted), version) AS latest
    FROM ecommerce.orders
    GROUP BY order_id
) AS o USING (order_id)
WHERE o.latest.1 = 'paid' AND o.latest.2 = 0
GROUP BY i.category;
```

Nếu join trực tiếp `orders`, order 5001 có hai versions và line item bị nhân đôi. Trước JOIN, bảo đảm grain bên phải là một row/key hoặc chủ động dùng `ANY JOIN` khi bất kỳ match nào cũng hợp semantic.

```sql
-- Kiểm tra uniqueness trước khi coi dimension là one-to-one.
SELECT order_id, count()
FROM ecommerce.orders
GROUP BY order_id
HAVING count() > 1;
```

## 8. ASOF JOIN cho dữ liệu theo thời điểm

```sql
CREATE TABLE ecommerce.product_prices
(
    product_id UInt64,
    valid_from DateTime64(3, 'UTC'),
    price Decimal(12, 2)
)
ENGINE = MergeTree
ORDER BY (product_id, valid_from);

INSERT INTO ecommerce.product_prices VALUES
    (1001, '2025-01-01 00:00:00.000', 15.90),
    (1001, '2025-02-01 00:00:00.000', 16.90);

SELECT
    e.event_time,
    e.product_id,
    p.price AS price_valid_at_event
FROM ecommerce.events AS e
ASOF LEFT JOIN ecommerce.product_prices AS p
    ON e.product_id = p.product_id AND e.event_time >= p.valid_from
WHERE e.product_id = 1001
ORDER BY e.event_time;
```

ASOF cần equality key và inequality time; sorting/data size vẫn ảnh hưởng chi phí. Giá đến muộn hoặc interval overlap cần rule deterministic.

## 9. CTE không mặc định là cache/materialization

```sql
WITH purchases AS
(
    SELECT *
    FROM ecommerce.events
    WHERE event_type = 'purchase'
)
SELECT count(), sum(price * quantity)
FROM purchases;
```

Đừng giả định CTE được chạy một lần và lưu. Kiểm tra plan; subquery được tham chiếu nhiều lần có thể bị thực thi lại theo query rewrite/semantics.

## Keywords và bug ẩn production

| Keyword | Ý nghĩa | Bug ẩn / tình huống thực tế |
|---|---|---|
| `countIf/sumIf` | Conditional aggregate | Numerator/denominator khác grain tạo conversion rate hợp cú pháp nhưng sai nghiệp vụ. |
| `uniqExact` | Distinct chính xác | Cardinality cao có thể vượt memory; dashboard đồng thời làm sự cố theo cấp số nhân. |
| `uniqCombined64` | Distinct xấp xỉ | Không so tuyệt đối với hệ dùng thuật toán/seed khác; error rõ hơn trên tập nhỏ. |
| `quantilesTDigest` | Quantile xấp xỉ | Không phù hợp Decimal cực chính xác hoặc tail compliance nếu error chưa được chấp thuận. |
| aggregate state | Trạng thái trung gian | State phụ thuộc function/type; merge bằng sai hàm hoặc schema type khác sẽ lỗi/sai. |
| `GROUPING SETS` | Nhiều cấp aggregate | Default dimension ở subtotal bị nhầm với giá trị thật nếu không dùng `GROUPING()`. |
| `windowFunnel` | Chuỗi event trong cửa sổ | Hàm không nhận `DateTime64` trực tiếp ở bản lab nên cast `DateTime` làm mất phần mili-giây; duplicate/tie/out-of-order cần rule rõ. |
| cohort | Nhóm theo first event | Retention window làm mất first-ever và dịch cohort về ngày đầu còn giữ. |
| window `ROWS` | Frame theo số dòng | 7 rows không phải 7 calendar days khi dữ liệu thưa. |
| `rank/dense_rank` | Xếp hạng trong partition | Tie và thiếu secondary order làm output order giữa các row cùng hạng không deterministic. |
| `JOIN` | Kết hợp datasets | Many-to-many âm thầm nhân doanh thu; kiểm tra grain/uniqueness trước join. |
| `ANY JOIN` | Chọn một match | “Một row bất kỳ” không phải latest row; kết quả có thể không deterministic nếu duplicates khác nhau. |
| `ASOF JOIN` | Match gần nhất theo time | Late price/dimension correction làm kết quả lịch sử đổi nếu không snapshot/version đúng. |
| CTE | Named expression/subquery | Không phải materialized cache; tham chiếu lặp có thể tăng scan/CPU. |

## Bài thực hành

Viết dashboard gồm DAU, buyer, revenue, p95 basket, funnel theo device và rolling 7 calendar days. Với mỗi metric, ghi grain, exact/approx, timezone, cách xử lý duplicate và late event.
