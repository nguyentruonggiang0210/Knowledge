# 14 - Dictionary, external lookup và chiến lược JOIN

## Mục tiêu

- Dùng dictionary cho lookup dimension theo khóa với latency thấp.
- Phân biệt `dictGet`, direct JOIN và JOIN tổng quát.
- Chọn `parallel_hash`, `full_sorting_merge`, `partial_merge`, `grace_hash` hoặc `auto` theo dữ liệu thật.
- Nhận ra sai lệch nghiệp vụ do key trùng, dữ liệu refresh trễ và `ANY JOIN`.

## 1. Tình huống thực tế và semantic phải chốt trước

Dashboard cần gắn tên/category hiện tại của sản phẩm vào hàng tỷ events. Dimension chỉ vài triệu dòng và mỗi `product_id` phải có đúng một bản ghi hiện hành. Đây là ứng viên tốt cho dictionary.

Trước khi viết DDL, hãy trả lời:

- Báo cáo cần thuộc tính **hiện tại** hay thuộc tính **tại thời điểm event**?
- Mỗi key thật sự có một dòng hay quan hệ one-to-many?
- Chấp nhận dữ liệu lookup trễ tối đa bao lâu?
- Dictionary có vừa RAM trên từng ClickHouse server không?

Dictionary không lưu lịch sử SCD giúp bạn. Nếu báo cáo phải tái hiện giá/category tại thời điểm mua, hãy ghi thuộc tính vào fact hoặc JOIN với dimension có khoảng hiệu lực.

## 2. Lab dictionary chạy trên một node

Tạo source có key duy nhất theo hợp đồng dữ liệu:

```sql
DROP DICTIONARY IF EXISTS ecommerce.product_dict;
DROP TABLE IF EXISTS ecommerce.product_dimension;

CREATE TABLE ecommerce.product_dimension
(
    product_id UInt64,
    product_name String,
    category LowCardinality(String),
    list_price Decimal(12, 2),
    active UInt8,
    updated_at DateTime64(3, 'UTC')
)
ENGINE = MergeTree
ORDER BY product_id;

INSERT INTO ecommerce.product_dimension VALUES
    (1001, 'SQL thực chiến', 'books',       15.90, 1, now64(3)),
    (1002, 'OLAP nhập môn', 'books',       21.00, 1, now64(3)),
    (2001, 'Laptop Pro',    'electronics', 799.00, 1, now64(3)),
    (3001, 'Áo khoác',      'fashion',      42.50, 1, now64(3));
```

`ORDER BY product_id` chỉ sắp xếp, **không ép duy nhất**. Pipeline source phải kiểm tra duplicate trước khi dictionary reload.

Tạo dictionary từ chính ClickHouse lab:

```sql
CREATE DICTIONARY ecommerce.product_dict
(
    product_id UInt64,
    product_name String,
    category String,
    list_price Decimal(12, 2),
    active UInt8
)
PRIMARY KEY product_id
SOURCE(CLICKHOUSE(
    HOST '127.0.0.1'
    PORT 9000
    USER 'student'
    PASSWORD 'student_pass'
    DB 'ecommerce'
    TABLE 'product_dimension'
))
LIFETIME(MIN 30 MAX 60)
LAYOUT(HASHED());
```

Credentials plaintext ở trên chỉ để lab tự chứa. Production nên dùng named collection/config secret, TLS và một user chỉ có quyền đọc dimension.

Tra cứu theo key:

```sql
SELECT
    product_id,
    dictGetOrDefault(
        'ecommerce.product_dict',
        'product_name',
        product_id,
        'unknown'
    ) AS product_name,
    count() AS events
FROM ecommerce.events
GROUP BY product_id
ORDER BY product_id;

SELECT
    product_id,
    dictHas('ecommerce.product_dict', product_id) AS known_product
FROM ecommerce.events
GROUP BY product_id
ORDER BY product_id;
```

`dictGet` với key thiếu trả default của attribute; default đó dễ bị hiểu nhầm là dữ liệu thật. `dictGetOrDefault` làm fallback hiện rõ trong query, còn `dictHas` giúp đo tỷ lệ key chưa được ánh xạ.

## 3. Layout, refresh và quan sát

Lựa chọn thường gặp:

| Layout | Phù hợp | Trade-off |
|---|---|---|
| `FLAT` | Key số nguyên dày, range nhỏ | Rất nhanh nhưng key lớn/thưa có thể lãng phí RAM nghiêm trọng. |
| `HASHED` | Dimension vừa RAM, key phân tán | Lookup nhanh và giữ toàn bộ dữ liệu trong RAM trên mỗi server. |
| `COMPLEX_KEY_HASHED` | Key ghép | Tốn thêm RAM/CPU hash; phải truyền tuple đúng type/thứ tự. |
| `CACHE` | Source rất lớn, working set nhỏ | Miss gọi source, latency biến động; sizing/TTL sai có thể biến OLTP thành bottleneck. |

Buộc reload và kiểm tra:

```sql
SYSTEM RELOAD DICTIONARY ecommerce.product_dict;

SELECT
    database,
    name,
    status,
    type,
    element_count,
    formatReadableSize(bytes_allocated) AS memory,
    lifetime_min,
    lifetime_max,
    last_successful_update_time,
    error_count,
    last_exception
FROM system.dictionaries
WHERE database = 'ecommerce' AND name = 'product_dict';
```

`LIFETIME` là cửa sổ refresh, không phải SLA source-to-query. Khi source lỗi, ClickHouse có thể tiếp tục phục vụ bản cũ; hãy alert cả `status`, `error_count` lẫn tuổi của `last_successful_update_time`.

## 4. Direct JOIN qua dictionary

Dictionary có thể đứng bên phải JOIN. Với lookup one-to-one/first-match, direct JOIN bỏ bước build hash table:

```sql
SELECT
    e.product_id,
    d.product_name,
    count() AS events
FROM ecommerce.events AS e
LEFT ANY JOIN ecommerce.product_dict AS d
    ON e.product_id = d.product_id
GROUP BY e.product_id, d.product_name
ORDER BY e.product_id
SETTINGS join_algorithm = 'direct';
```

Direct JOIN phù hợp nhất với `INNER` hoặc `LEFT ANY` khi right side hỗ trợ key-value lookup. Nó không thay thế JOIN nhiều điều kiện, range JOIN hay quan hệ one-to-many. Dictionary giữ một giá trị theo key; duplicate source có thể bị loại âm thầm và làm mất multiplicity.

## 5. `ANY` hay `ALL`: correctness trước hiệu năng

Ví dụ kiểm tra multiplicity trước khi chọn `ANY`:

```sql
SELECT product_id, count() AS versions
FROM ecommerce.product_dimension
GROUP BY product_id
HAVING versions != 1;
```

- `ALL` giữ mọi match và có thể nhân số dòng.
- `ANY` chọn tối đa một match, giảm nổ số dòng nhưng che duplicate ở dimension.
- `SEMI` chỉ kiểm tra tồn tại; `ANTI` chọn bên trái không có match.

Scenario: một sản phẩm có ba tags. `LEFT ANY JOIN` chỉ còn một tag nên báo cáo sai dù query nhanh. Cách đúng là giữ quan hệ one-to-many ở bảng riêng và chấp nhận multiplicity, hoặc aggregate tags trước JOIN.

## 6. Chọn thuật toán JOIN bằng workload thật

Các query sau chạy được với dataset lab; dataset nhỏ chỉ xác nhận cú pháp, không chứng minh thuật toán nào tốt hơn:

```sql
SELECT count()
FROM ecommerce.events AS e
INNER JOIN ecommerce.product_dimension AS p
    ON e.product_id = p.product_id
SETTINGS join_algorithm = 'parallel_hash';

SELECT count()
FROM ecommerce.events AS e
INNER JOIN ecommerce.product_dimension AS p
    ON e.product_id = p.product_id
SETTINGS join_algorithm = 'full_sorting_merge';

SELECT count()
FROM ecommerce.events AS e
INNER JOIN ecommerce.product_dimension AS p
    ON e.product_id = p.product_id
SETTINGS join_algorithm = 'grace_hash';

SELECT count()
FROM ecommerce.events AS e
INNER JOIN ecommerce.product_dimension AS p
    ON e.product_id = p.product_id
SETTINGS join_algorithm = 'auto';
```

| Thuật toán | Khi cân nhắc | Trade-off production |
|---|---|---|
| `parallel_hash` | Right side vừa RAM, ưu tiên tốc độ | Nhanh nhưng build hash table có thể tạo peak memory lớn. |
| `full_sorting_merge` | Hai bên lớn và key/order giúp sort-merge | Ít phụ thuộc hash RAM; sort có thể tốn CPU/I/O, lợi nhất khi bỏ được sorting. |
| `partial_merge` | Muốn giảm memory so với hash | Thường chậm hơn, cần benchmark với cardinality/filter thật. |
| `grace_hash` | Right side không vừa RAM | Chia bucket và có thể spill; tránh OOM đổi lấy disk I/O/latency. |
| `direct` | Right side là dictionary/key-value, semantic được hỗ trợ | Latency tốt nhưng giới hạn loại JOIN và mất duplicate key. |
| `auto` | Muốn engine chọn/fallback trong khả năng phiên bản | Không phải lời hứa tối ưu; upgrade có thể đổi plan nên vẫn cần regression benchmark. |

Từ ClickHouse 24.12, planner có thể tự đặt side nhỏ hơn sang bên phải trong nhiều trường hợp, nhưng bạn vẫn nên đẩy filter sớm và chỉ SELECT cột cần thiết:

```sql
SELECT e.category, sum(p.list_price * e.quantity) AS list_revenue
FROM
(
    SELECT product_id, category, quantity
    FROM ecommerce.events
    WHERE event_type = 'purchase'
) AS e
INNER JOIN
(
    SELECT product_id, list_price
    FROM ecommerce.product_dimension
    WHERE active = 1
) AS p USING (product_id)
GROUP BY e.category
SETTINGS join_algorithm = 'auto';
```

## 7. Đo thay vì đoán

```sql
EXPLAIN PIPELINE
SELECT count()
FROM ecommerce.events AS e
INNER JOIN ecommerce.product_dimension AS p
    ON e.product_id = p.product_id
SETTINGS join_algorithm = 'parallel_hash';

SYSTEM FLUSH LOGS;

SELECT
    query_id,
    query_duration_ms,
    read_rows,
    formatReadableSize(memory_usage) AS memory,
    exception_code
FROM system.query_log
WHERE type = 'QueryFinish'
  AND event_time >= now() - INTERVAL 10 MINUTE
  AND query LIKE '%product_dimension%'
ORDER BY event_time DESC
LIMIT 10;
```

Chạy cold/warm nhiều lần với data skew và concurrency đại diện. Một query đúng trên 10 rows không phản ánh spill, allocator peak hay broadcast trong cluster.

## Keywords và bug ẩn production

| Keyword | Ý nghĩa | Bug ẩn / tình huống thực tế |
|---|---|---|
| dictionary | Lookup key → attributes | Đây là snapshot/refresh cache, không phải dimension lịch sử; dashboard có thể đổi khi dictionary reload. |
| `PRIMARY KEY` của dictionary | Khóa lookup | Source trùng key không tạo lỗi UNIQUE như OLTP; một giá trị có thể thắng âm thầm. |
| `dictGet` | Lấy attribute | Key thiếu trả default, dễ biến missing-data thành giá trị hợp lệ giả. |
| `dictHas` | Kiểm tra key tồn tại | Bỏ qua metric miss khiến product mới biến thành `unknown` nhiều giờ mà không ai biết. |
| `LIFETIME` | Chu kỳ reload | Source lỗi vẫn có thể phục vụ dữ liệu cũ; status “query chạy được” không đồng nghĩa fresh. |
| `HASHED` | Giữ toàn bộ dictionary trong hash table | Nhân RAM theo số server/replica; dimension tăng đột biến có thể OOM cả cluster. |
| `CACHE` | Chỉ cache key được hỏi | Cache miss storm gây tải trực tiếp lên PostgreSQL/HTTP source và tạo tail latency. |
| direct JOIN | Lookup right side trực tiếp | Chỉ đúng với loại JOIN/semantic hỗ trợ; ép dùng cho one-to-many làm mất dòng. |
| `ANY JOIN` | Tối đa một match | Có thể che dimension duplicate và làm kết quả không ổn định theo dữ liệu nạp. |
| `ALL JOIN` | Giữ mọi match | Duplicate vô tình làm nhân revenue/count; luôn audit multiplicity. |
| `parallel_hash` | Hash JOIN song song | Right side sau filter vẫn quá lớn khiến peak memory vượt limit. |
| `full_sorting_merge` | JOIN theo sort/merge | Sorting key “gần giống” nhưng khác type/order không giúp bỏ sort như kỳ vọng. |
| `grace_hash` | Hash theo bucket/spill | Tránh OOM nhưng có thể bão hòa disk dùng chung với merges. |
| `auto` | Engine tự chọn/fallback | Kết quả benchmark có thể đổi sau upgrade; phải giữ plan/latency regression test. |

## Bài thực hành

Sinh dimension 1 triệu rows, cố tình thêm 1% duplicate key và 1% fact key thiếu. So `dictGet`, direct JOIN, `parallel_hash` và `grace_hash` theo p95, peak RAM, rows output. Viết assertion chặn duplicate/missing vượt ngưỡng trước khi reload dictionary.

## Tài liệu chính thức

- [CREATE DICTIONARY](https://clickhouse.com/docs/reference/statements/create/dictionary)
- [Dictionaries](https://clickhouse.com/docs/dictionary)
- [Minimize and optimize JOINs](https://clickhouse.com/docs/best-practices/minimize-optimize-joins)
- [JOIN clause](https://clickhouse.com/docs/reference/statements/select/join)

