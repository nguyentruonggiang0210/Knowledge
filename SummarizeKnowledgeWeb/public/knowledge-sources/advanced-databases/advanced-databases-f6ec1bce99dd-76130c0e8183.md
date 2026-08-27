# 04 — `EXPLAIN`, optimizer và statistics

Optimizer chọn plan dựa trên ước lượng số row và cost. Nó không biết “query này quan trọng”; nó chỉ biết SQL, statistics, cấu hình, parameter và các access path hiện có.

## Scenario và trade-off map

| Knowledge item | Scenario production | Trade-off cần quyết định |
|---|---|---|
| `EXPLAIN ANALYZE BUFFERS` | tìm node thật sự tốn latency/I/O | Bằng chứng execution thật; statement có side effect/tải cao phải chạy an toàn |
| Scan/selectivity | point lookup so với đọc phần lớn table | Index giảm row đọc nhưng random I/O; seq/bitmap có thể đúng ở selectivity khác |
| Sargability | filter time/key trên index | Range typed rõ giúp index; expression/cast tiện nhưng có thể phá access path/correctness timezone |
| Column statistics | status/data skew | Estimate tốt hơn; target cao tăng analyze/planning/catalog cost |
| Extended statistics | columns tương quan | Sửa giả định độc lập trong một table; không giải mọi join/range correlation |
| Join algorithms | small-to-large và large-to-large join | Nested/hash/merge tối ưu ở cardinality khác; estimate sai nhân `loops` rất lớn |
| `work_mem`/spill | sort/hash report | Memory giảm temp I/O; cấp theo node × worker × concurrency nên có OOM risk |
| Custom/generic plan | prepared query parameter skew | Generic giảm planning; một plan chung có thể rất tệ cho giá trị hiếm/phổ biến |
| Parallel/JIT | aggregate CPU-heavy dài | Có thể giảm elapsed time; startup/worker/compile overhead hại OLTP ngắn |
| Tuning workflow | incident/query regression | Thay một biến dễ quy nguyên nhân; tối ưu cục bộ có thể tăng write/storage toàn hệ |

## Chuẩn bị dữ liệu lệch và tương quan

```sql
DROP SCHEMA IF EXISTS plan_lab CASCADE;
CREATE SCHEMA plan_lab;

CREATE TABLE plan_lab.customer (
    customer_id bigint PRIMARY KEY,
    country text NOT NULL,
    city text NOT NULL,
    segment text NOT NULL
);

INSERT INTO plan_lab.customer
SELECT
    g,
    CASE WHEN g <= 90000 THEN 'VN' ELSE 'US' END,
    CASE
        WHEN g <= 70000 THEN 'HCM'
        WHEN g <= 90000 THEN 'HN'
        ELSE 'NY'
    END,
    CASE WHEN g % 100 = 0 THEN 'enterprise' ELSE 'retail' END
FROM generate_series(1, 100000) AS g;

CREATE TABLE plan_lab.orders (
    order_id bigint PRIMARY KEY,
    customer_id bigint NOT NULL REFERENCES plan_lab.customer,
    status text NOT NULL,
    created_at timestamptz NOT NULL,
    amount numeric(12,2) NOT NULL
);

INSERT INTO plan_lab.orders
SELECT
    g,
    1 + (g % 100000),
    CASE WHEN g % 20 = 0 THEN 'pending' ELSE 'paid' END,
    TIMESTAMPTZ '2025-01-01 00:00+00' + g * INTERVAL '30 seconds',
    (10 + (g % 20000))::numeric / 10
FROM generate_series(1, 500000) AS g;

CREATE INDEX orders_customer_idx ON plan_lab.orders (customer_id);
CREATE INDEX orders_created_idx ON plan_lab.orders (created_at);
CREATE INDEX orders_pending_idx ON plan_lab.orders (created_at)
WHERE status = 'pending';

ANALYZE plan_lab.customer;
ANALYZE plan_lab.orders;
```

## 1. Đọc `EXPLAIN (ANALYZE, BUFFERS)`

```sql
EXPLAIN (ANALYZE, BUFFERS, WAL, SETTINGS, SUMMARY)
SELECT c.country, sum(o.amount) AS revenue
FROM plan_lab.orders AS o
JOIN plan_lab.customer AS c USING (customer_id)
WHERE o.created_at >= TIMESTAMPTZ '2025-03-01 00:00+00'
  AND o.created_at <  TIMESTAMPTZ '2025-04-01 00:00+00'
GROUP BY c.country;
```

Đọc từ node trong cùng ra ngoài:

- `cost=startup..total`: đơn vị cost nội bộ, không phải milliseconds;
- `rows` trước dấu ngoặc thực thi: row optimizer ước lượng;
- `actual time`, `rows`, `loops`: số đo thật; tổng row qua node thường cần hiểu cùng `loops`;
- `Buffers: shared hit/read/dirtied/written`: block cache hit, đọc, làm bẩn, ghi;
- `temp read/written`: spill ra temporary file;
- `Rows Removed by Filter/Recheck`: công việc đã đọc rồi loại;
- `Planning Time` và `Execution Time`: hai pha khác nhau.

**Tình huống thực tế:** Hai plan đều 50 ms ở cache nóng, nhưng plan A đọc 100 block còn B đọc 50.000 block. B có nguy cơ tệ hơn nhiều khi cache lạnh hoặc concurrency cao.

> **Bug ẩn / production — timing:** Một lần chạy không đại diện. Cache, checkpoint, autovacuum, parameter và concurrent load làm kết quả đổi. Lấy nhiều mẫu, percentile, buffer/I/O và dữ liệu có phân bố giống production.

> **Bug ẩn / production — side effect:** `EXPLAIN ANALYZE DELETE/UPDATE/INSERT` thực thi thật. Dùng bản sao hoặc `BEGIN; EXPLAIN ANALYZE ...; ROLLBACK;`, đồng thời nhớ sequence/side effect ngoài transaction có thể không rollback hoàn toàn.

## 2. Scan node và selectivity

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM plan_lab.orders WHERE order_id = 4242;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM plan_lab.orders WHERE status = 'paid';

EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM plan_lab.orders
WHERE created_at >= TIMESTAMPTZ '2025-02-01 00:00+00'
  AND created_at <  TIMESTAMPTZ '2025-02-02 00:00+00';
```

- `Seq Scan`: hợp lý khi đọc phần lớn bảng hoặc bảng nhỏ.
- `Index Scan`: lấy tuple theo thứ tự index, quay về heap nếu cần.
- `Index Only Scan`: có thể tránh heap nếu visibility map và columns cho phép.
- `Bitmap Index Scan` + `Bitmap Heap Scan`: gom vị trí rồi đọc heap theo page; tốt cho selectivity trung bình.

> **Bug ẩn / production — “seq scan là xấu”:** Ép `enable_seqscan = off` trong production có thể chọn random I/O đắt hơn. Chỉ tắt planner method tạm thời để chẩn đoán phương án, không xem đó là fix.

```sql
BEGIN;
SET LOCAL enable_seqscan = off;
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM plan_lab.orders WHERE status = 'paid';
ROLLBACK;
```

## 3. Sargability: để index nhận ra điều kiện

Không bọc indexed column bằng phép biến đổi nếu có thể viết thành range tương đương.

```sql
-- Khó dùng index created_at trực tiếp:
EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*)
FROM plan_lab.orders
WHERE created_at::date = DATE '2025-02-10';

-- Sargable và đúng với timestamptz nếu boundary có timezone rõ ràng:
EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*)
FROM plan_lab.orders
WHERE created_at >= TIMESTAMPTZ '2025-02-10 00:00+00'
  AND created_at <  TIMESTAMPTZ '2025-02-11 00:00+00';
```

**Tình huống thực tế:** API lọc theo ngày cục bộ phải chuyển boundary của ngày đó thành hai instant chính xác, rồi so range.

> **Bug ẩn / production — date cast:** `created_at::date` phụ thuộc timezone session khi nguồn là `timestamptz`. Hai service có timezone khác có thể trả tập row khác. Truyền boundary có timezone hoặc chuẩn hóa theo timezone nghiệp vụ.

> **Bug ẩn / production — implicit cast:** So cột với parameter sai type có thể gây cast phía cột, estimate kém hoặc không dùng index. Driver phải bind đúng PostgreSQL type; kiểm tra plan từ prepared statement thật.

## 4. Cardinality estimate và statistics một cột

```sql
SELECT
    attname,
    null_frac,
    n_distinct,
    most_common_vals,
    most_common_freqs,
    histogram_bounds
FROM pg_stats
WHERE schemaname = 'plan_lab'
  AND tablename = 'customer'
  AND attname IN ('country', 'city', 'segment');
```

Tăng statistics target cho cột có skew quan trọng:

```sql
ALTER TABLE plan_lab.customer
ALTER COLUMN city SET STATISTICS 500;

ANALYZE plan_lab.customer (city);
```

**Tình huống thực tế:** Một status hiếm nhưng rất nóng (`pending`) cần MCV đủ chính xác để optimizer chọn partial index.

> **Bug ẩn / production — target:** Target cao làm `ANALYZE` và planning tốn CPU/bộ nhớ hơn, catalog statistics lớn hơn. Chỉ tăng cho cột có estimate sai ảnh hưởng plan; sau bulk load luôn chạy `ANALYZE` hoặc để autovacuum analyze kịp thời.

## 5. Extended statistics cho column tương quan

Trong dữ liệu mẫu, `country='US'` gần như kéo theo `city='NY'`; giả định độc lập sẽ ước lượng sai.

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM plan_lab.customer
WHERE country = 'US' AND city = 'NY';

CREATE STATISTICS customer_geo_stats
    (dependencies, ndistinct, mcv)
ON country, city
FROM plan_lab.customer;

ANALYZE plan_lab.customer;

EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM plan_lab.customer
WHERE country = 'US' AND city = 'NY';
```

So estimated `rows` trước/sau với actual rows.

> **Bug ẩn / production — extended stats:** Chúng chủ yếu giúp tương quan giữa expressions/columns trong cùng table, không tự sửa correlation xuyên bảng hay mọi range predicate. Statistics cũng có thể stale sau dữ liệu đổi mạnh.

## 6. Join algorithms

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT o.order_id, c.segment
FROM plan_lab.orders AS o
JOIN plan_lab.customer AS c USING (customer_id)
WHERE o.order_id BETWEEN 1000 AND 1020;

EXPLAIN (ANALYZE, BUFFERS)
SELECT c.country, count(*)
FROM plan_lab.orders AS o
JOIN plan_lab.customer AS c USING (customer_id)
GROUP BY c.country;
```

- Nested Loop: outer nhỏ, inner lookup rẻ/indexed.
- Hash Join: equality join, thường tốt khi input lớn và hash table vừa bộ nhớ.
- Merge Join: input có thứ tự theo join key; hữu ích cho input lớn hoặc đã sorted.

**Tình huống thực tế:** Estimate outer là 1 row nhưng actual 100.000 khiến nested loop inner chạy 100.000 lần. Gốc lỗi thường là statistics/predicate chứ không phải bản thân nested loop.

> **Bug ẩn / production — `loops`:** Inner node 0.05 ms nghe nhỏ nhưng `loops=500000` là tổng lớn. Nhân/diễn giải cùng loops và xem buffers tổng.

> **Bug ẩn / production — join multiplication:** Join hai bảng one-to-many rồi `sum()` có thể nhân doanh thu. Đây là lỗi correctness, optimizer không sửa. Aggregate từng phía hoặc kiểm tra cardinality/constraints trước join.

## 7. Sort/hash spill và `work_mem`

```sql
BEGIN;
SET LOCAL work_mem = '1MB';
EXPLAIN (ANALYZE, BUFFERS)
SELECT customer_id, amount
FROM plan_lab.orders
ORDER BY amount DESC, order_id;
ROLLBACK;
```

Tìm `Sort Method: external merge Disk:` hoặc temp blocks. Thử lại trong session lab:

```sql
BEGIN;
SET LOCAL work_mem = '64MB';
EXPLAIN (ANALYZE, BUFFERS)
SELECT customer_id, amount
FROM plan_lab.orders
ORDER BY amount DESC, order_id;
ROLLBACK;
```

> **Bug ẩn / production — `work_mem`:** Đây gần như là mức **mỗi sort/hash operation, mỗi worker**, không phải giới hạn cho cả server/query. Đặt global 256 MB với hàng trăm connection có thể làm OOM. Điều chỉnh `SET LOCAL` cho workload đã đo và dùng pool để giới hạn concurrency.

## 8. Prepared statement: custom và generic plan

Distribution lệch khiến plan tốt cho parameter hiếm khác parameter phổ biến.

```sql
PREPARE by_status(text) AS
SELECT * FROM plan_lab.orders WHERE status = $1;

SET plan_cache_mode = force_custom_plan;
EXPLAIN (ANALYZE, BUFFERS) EXECUTE by_status('pending');
EXPLAIN (ANALYZE, BUFFERS) EXECUTE by_status('paid');

SET plan_cache_mode = force_generic_plan;
EXPLAIN (ANALYZE, BUFFERS) EXECUTE by_status('pending');

RESET plan_cache_mode;
DEALLOCATE by_status;
```

Mặc định `auto`, PostgreSQL cân nhắc chuyển sang generic plan sau một số lần execute nếu cost dự kiến hợp lý.

> **Bug ẩn / production — parameter sensitivity:** Query nhanh trong `psql` với literal có thể chậm qua driver vì prepared/generic plan. Capture SQL, parameter type, execution mode và plan tương ứng. Không ép custom toàn hệ thống nếu chưa đo planning overhead.

## 9. Parallel query và JIT

```sql
EXPLAIN (ANALYZE, BUFFERS, SETTINGS)
SELECT sum(amount), avg(amount)
FROM plan_lab.orders;

SHOW max_parallel_workers_per_gather;
SHOW jit;
```

Parallelism có startup/coordination cost; JIT có compilation cost nhưng có thể lợi cho query CPU-heavy dài.

> **Bug ẩn / production — parallel/JIT:** “Nhiều worker hơn” không luôn nhanh: I/O saturation, worker shortage và skew có thể làm chậm. JIT thường hại query OLTP rất ngắn. Dùng plan và workload test, không bật/tắt theo cảm giác.

## 10. Quy trình sửa query chậm

1. Xác nhận đúng query fingerprint, parameter, tần suất và percentile.
2. Lấy `EXPLAIN (ANALYZE, BUFFERS, SETTINGS)` an toàn trên dữ liệu đại diện.
3. Tìm node có thời gian/buffer/loops lớn và estimate lệch.
4. Kiểm tra correctness, sargability, statistics, index và row width.
5. Thay đổi **một yếu tố**, đo lại cả latency lẫn write/storage tradeoff.
6. Theo dõi sau deploy; chuẩn bị rollback.

> **Bug ẩn / production — optimization tunnel vision:** Query nhanh hơn riêng lẻ nhưng index mới có thể làm ingest chậm, vacuum nặng hoặc đẩy cache của workload khác. Đánh giá toàn hệ thống.

## Bài tập

1. Lưu plan trước/sau extended statistics và tính tỷ lệ estimate/actual.
2. Tạo query spill, tăng `work_mem` bằng `SET LOCAL`, ghi temp blocks và peak concurrency giả định.
3. So custom/generic plan cho `pending` và `paid`.
4. Tạo index biểu thức cho query cast theo ngày, rồi so với cách viết range; phân tích correctness timezone.
