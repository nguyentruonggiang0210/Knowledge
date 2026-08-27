# 03 — Index chuyên sâu: đúng operator, đúng workload

Index tăng tốc một số đường đọc nhưng làm tốn dung lượng, cache và chi phí mọi lần ghi. Quy trình đúng là: mô tả query quan trọng → chọn access method/operator class → tạo index → `ANALYZE` → xác minh bằng plan và số liệu production.

## Scenario và trade-off map

| Knowledge item | Scenario production | Trade-off cần quyết định |
|---|---|---|
| Composite B-tree | equality + range + ordering/keyset | Read/order nhanh; column order khóa các prefix hữu ích và tăng write/cache cost |
| Expression index | tìm normalized email/expression | Giữ query sargable; expression phải khớp/immutable và collation semantics ổn định |
| Partial index/unique | chỉ row open/hot hoặc invariant có điều kiện | Nhỏ/ít write hơn; planner phải chứng minh predicate và distribution có thể drift |
| Covering `INCLUDE` | read-mostly projection | Có cơ hội index-only; index rộng/phình và visibility map vẫn quyết định heap fetch |
| GIN | JSONB/array/full-text membership | Lookup nhiều token mạnh; ingest/update/pending-list và size cao |
| GiST/exclusion | overlap/range/nearest-neighbor | Operator/invariant phong phú; lossy recheck và maintenance cost |
| BRIN | log cực lớn tương quan vật lý | Index rất nhỏ; backfill/random order làm correlation/recheck tệ |
| Concurrent build/reindex | thêm/sửa index khi còn write | Ít blocking DML; hai scan, I/O lâu, chờ transaction và có invalid cleanup |

## Chuẩn bị workload

```sql
DROP SCHEMA IF EXISTS index_lab CASCADE;
CREATE SCHEMA index_lab;

CREATE TABLE index_lab.orders (
    order_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id integer NOT NULL,
    customer_email text NOT NULL,
    status text NOT NULL,
    amount numeric(12,2) NOT NULL,
    tags text[] NOT NULL DEFAULT '{}',
    payload jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL
);

INSERT INTO index_lab.orders
    (tenant_id, customer_email, status, amount, tags, payload, created_at)
SELECT
    1 + (g % 50),
    'user' || (g % 10000) || '@example.com',
    (ARRAY['pending','paid','shipped','cancelled'])[1 + (g % 4)],
    (10 + (g % 5000))::numeric / 10,
    CASE WHEN g % 10 = 0 THEN ARRAY['vip','mobile'] ELSE ARRAY['web'] END,
    jsonb_build_object('channel', CASE WHEN g % 3 = 0 THEN 'app' ELSE 'web' END,
                       'campaign', 'c' || (g % 20)),
    TIMESTAMPTZ '2025-01-01 00:00+00' + g * INTERVAL '1 minute'
FROM generate_series(1, 200000) AS g;

ANALYZE index_lab.orders;
```

## 1. B-tree: equality, range và ordering

B-tree là mặc định, phù hợp `=`, `<`, `<=`, `>`, `>=`, `BETWEEN`, prefix `LIKE 'abc%'` trong điều kiện collation phù hợp, và trả dữ liệu có thứ tự.

```sql
CREATE INDEX orders_tenant_status_created_idx
ON index_lab.orders (tenant_id, status, created_at DESC, order_id DESC);

EXPLAIN (ANALYZE, BUFFERS)
SELECT order_id, created_at, amount
FROM index_lab.orders
WHERE tenant_id = 7
  AND status = 'paid'
ORDER BY created_at DESC, order_id DESC
LIMIT 20;
```

**Tình huống thực tế:** Trang danh sách order mới nhất của một tenant và status, dùng keyset pagination.

```sql
SELECT order_id, created_at, amount
FROM index_lab.orders
WHERE tenant_id = 7
  AND status = 'paid'
  AND (created_at, order_id) <
      (TIMESTAMPTZ '2025-05-01 00:00+00', 999999999)
ORDER BY created_at DESC, order_id DESC
LIMIT 20;
```

> **Bug ẩn / production — composite B-tree:** Thứ tự cột không phải “cột selective nhất trước” một cách máy móc. Nó phải khớp equality/range/order của query. Index trên `(tenant_id, status, created_at)` hỗ trợ tốt prefix trái; query chỉ theo `status` thường không được lợi tương đương. Sau cột range đầu tiên, khả năng giới hạn scan bằng các cột sau thường giảm.

> **Bug ẩn / production — offset:** `OFFSET 100000` vẫn phải đi qua rất nhiều index entries và dễ trả trùng/thiếu khi dữ liệu thay đổi. Dùng keyset/cursor với tuple `(created_at, order_id)` và tie-breaker duy nhất.

## 2. Expression index và tính sargable

```sql
CREATE INDEX orders_lower_email_idx
ON index_lab.orders (lower(customer_email));

EXPLAIN (ANALYZE, BUFFERS)
SELECT order_id, customer_email
FROM index_lab.orders
WHERE lower(customer_email) = lower('USER42@EXAMPLE.COM');
```

**Tình huống thực tế:** Tra email không phân biệt hoa thường trong hệ thống legacy.

> **Bug ẩn / production — expression match:** Query phải dùng biểu thức mà planner có thể khớp với index. `lower(email)` index không tự giúp mọi biến thể như `upper(email)` hoặc function wrapper khác. Collation và định nghĩa case-insensitive theo ngôn ngữ có thể làm `lower()` không tương đương domain; cân nhắc chuẩn hóa khi ghi hoặc kiểu/collation phù hợp.

> **Bug ẩn / production — function volatility:** Function trong index expression phải `IMMUTABLE`. Đánh dấu function phụ thuộc timezone/config là immutable chỉ để tạo được index sẽ làm index chứa kết quả sai.

## 3. Partial index và partial unique

Chỉ index tập row “nóng” hoặc tập cần áp invariant.

```sql
CREATE INDEX orders_open_created_idx
ON index_lab.orders (tenant_id, created_at DESC)
WHERE status IN ('pending', 'paid');

EXPLAIN (ANALYZE, BUFFERS)
SELECT order_id, created_at
FROM index_lab.orders
WHERE tenant_id = 8
  AND status IN ('pending', 'paid')
ORDER BY created_at DESC
LIMIT 20;
```

Partial unique index biểu diễn “mỗi customer chỉ có một draft”:

```sql
CREATE TABLE index_lab.checkout (
    checkout_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id bigint NOT NULL,
    state text NOT NULL
);

CREATE UNIQUE INDEX checkout_one_open_uk
ON index_lab.checkout (customer_id)
WHERE state = 'open';

INSERT INTO index_lab.checkout (customer_id, state) VALUES (10, 'open');
-- Lệnh sau phải lỗi unique_violation:
-- INSERT INTO index_lab.checkout (customer_id, state) VALUES (10, 'open');
```

> **Bug ẩn / production — predicate implication:** Planner chỉ dùng partial index khi chứng minh được `WHERE` của query kéo theo predicate của index. Predicate viết khác, cast khác hoặc parameter trong prepared statement có thể khiến planner không chứng minh được ở generic plan. Kiểm tra plan thật của ứng dụng.

> **Bug ẩn / production — status drift:** Nếu hầu hết row dần trở thành “open”, partial index không còn nhỏ. Theo dõi phân bố dữ liệu, kích thước và write cost; index design không bất biến theo thời gian.

## 4. Covering index với `INCLUDE` và index-only scan

```sql
CREATE INDEX orders_tenant_created_cover_idx
ON index_lab.orders (tenant_id, created_at DESC)
INCLUDE (status, amount);

VACUUM (ANALYZE) index_lab.orders;

EXPLAIN (ANALYZE, BUFFERS)
SELECT created_at, status, amount
FROM index_lab.orders
WHERE tenant_id = 9
ORDER BY created_at DESC
LIMIT 50;
```

Key columns tham gia tìm kiếm/sắp xếp; columns trong `INCLUDE` chỉ là payload. Planner có thể dùng index-only scan khi mọi column cần thiết nằm trong index và visibility map cho biết heap page đã all-visible.

> **Bug ẩn / production — “index-only”:** Tên plan không bảo đảm không đọc heap. Xem `Heap Fetches`; bảng update liên tục hoặc autovacuum chậm có thể phải quay lại heap nhiều lần. INCLUDE column lớn làm index phình, giảm fan-out và tăng write amplification.

## 5. GIN: JSONB, array và full-text

GIN (Generalized Inverted Index) lập index nhiều key/token bên trong một value.

```sql
CREATE INDEX orders_payload_gin_idx
ON index_lab.orders USING gin (payload);

CREATE INDEX orders_tags_gin_idx
ON index_lab.orders USING gin (tags);

EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*)
FROM index_lab.orders
WHERE payload @> '{"channel":"app"}'::jsonb;

EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*)
FROM index_lab.orders
WHERE tags @> ARRAY['vip'];
```

`jsonb_ops` mặc định hỗ trợ nhiều operator (`?`, `?|`, `?&`, `@>`, `@?`, `@@`). `jsonb_path_ops` thường nhỏ hơn/tốt cho containment `@>` và jsonpath, nhưng không hỗ trợ toàn bộ operator tồn tại-key.

```sql
CREATE INDEX orders_payload_path_gin_idx
ON index_lab.orders USING gin (payload jsonb_path_ops);
```

> **Bug ẩn / production — GIN write cost:** GIN có nhiều index entries mỗi row và pending list (`fastupdate`), nên ingest/update có thể spike khi list được merge. Theo dõi latency, autovacuum và index size; đừng tạo cả `jsonb_ops` lẫn `jsonb_path_ops` nếu workload không chứng minh cần.

> **Bug ẩn / production — JSON operator:** Index GIN trên cả column có thể không hỗ trợ biểu thức biến đổi tùy ý. Ví dụ lọc `payload ->> 'channel' = 'app'` thường phù hợp expression B-tree hơn:

```sql
CREATE INDEX orders_channel_idx
ON index_lab.orders ((payload ->> 'channel'));
```

## 6. GiST: range, khoảng cách và exclusion constraint

GiST (Generalized Search Tree) là framework cho dữ liệu như range, geometric, nearest-neighbor và extension địa lý.

```sql
CREATE TABLE index_lab.reservation (
    reservation_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    room_id integer NOT NULL,
    during tstzrange NOT NULL,
    CHECK (NOT isempty(during))
);

CREATE INDEX reservation_during_gist_idx
ON index_lab.reservation USING gist (during);

INSERT INTO index_lab.reservation (room_id, during)
VALUES
    (1, tstzrange('2026-02-01 09:00+07', '2026-02-01 10:00+07', '[)')),
    (2, tstzrange('2026-02-01 09:30+07', '2026-02-01 11:00+07', '[)'));

SELECT *
FROM index_lab.reservation
WHERE during && tstzrange(
    '2026-02-01 09:45+07',
    '2026-02-01 10:15+07',
    '[)'
);
```

Ngăn hai booking cùng phòng overlap bằng extension miễn phí đi kèm PostgreSQL:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE index_lab.reservation
ADD CONSTRAINT reservation_no_overlap
EXCLUDE USING gist (
    room_id WITH =,
    during WITH &&
);
```

> **Bug ẩn / production — range boundary:** Quy ước `[)` (gồm đầu, không gồm cuối) cho phép booking 09:00–10:00 và 10:00–11:00 không overlap. Trộn `[]`, `()` hoặc timezone không nhất quán tạo gap/overlap khó thấy. Chuẩn hóa boundary từ domain.

> **Bug ẩn / production — GiST:** GiST có thể trả candidate cần recheck; selectivity kém vẫn đọc nhiều heap page. Xem `Rows Removed by Index Recheck` và buffers, không chỉ thấy chữ “Index Scan” rồi kết luận nhanh.

## 7. BRIN: bảng cực lớn có tương quan vật lý

BRIN lưu summary theo block ranges, rất nhỏ và phù hợp khi giá trị tương quan với thứ tự vật lý—ví dụ log append-only theo thời gian.

```sql
CREATE INDEX orders_created_brin_idx
ON index_lab.orders USING brin (created_at)
WITH (pages_per_range = 64);

ANALYZE index_lab.orders;

EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*)
FROM index_lab.orders
WHERE created_at >= TIMESTAMPTZ '2025-05-01 00:00+00'
  AND created_at <  TIMESTAMPTZ '2025-05-02 00:00+00';
```

**Tình huống thực tế:** Event/audit table hàng trăm GB được append gần theo `created_at`, query chủ yếu theo khoảng thời gian rộng.

> **Bug ẩn / production — correlation:** Nếu backfill ngẫu nhiên hoặc update làm `created_at` phân tán khắp heap, BRIN phải recheck nhiều block và gần như seq scan. Xem correlation trong `pg_stats`, `Rows Removed by Index Recheck`, và cân nhắc partition/CLUSTER có chiến lược.

> **Bug ẩn / production — unsummarized ranges:** Range mới có thể chưa summarized. Autovacuum thường xử lý, hoặc dùng `brin_summarize_new_values` khi cần; đừng benchmark ngay sau bulk load mà quên `ANALYZE`/summarization.

## 8. Chọn index theo operator, không theo tên cột

| Nhu cầu | Index thường phù hợp |
|---|---|
| equality/range/order | B-tree |
| membership trong array/JSONB, full-text | GIN |
| overlap range, nearest-neighbor | GiST |
| bảng rất lớn, dữ liệu tương quan vật lý | BRIN |
| chỉ tập row nóng | Partial index kết hợp access method phù hợp |
| query cần thêm output column | B-tree với `INCLUDE` nếu read/write tradeoff hợp lý |

```sql
SELECT
    schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'index_lab'
ORDER BY tablename, indexname;
```

> **Bug ẩn / production — duplicate index:** `(tenant_id)` thường dư nếu đã có `(tenant_id, created_at)` cho cùng workload; nhưng index rộng hơn có thể lớn hơn và không thay unique constraint. So definition, usage và constraint dependency trước khi xóa.

## 9. Xây và bảo trì index online

```sql
-- Phải chạy ngoài transaction block:
CREATE INDEX CONCURRENTLY IF NOT EXISTS orders_amount_idx
ON index_lab.orders (amount);

-- PostgreSQL hỗ trợ reindex ít chặn hơn:
REINDEX INDEX CONCURRENTLY index_lab.orders_amount_idx;
```

`CREATE INDEX CONCURRENTLY` giảm blocking write nhưng lâu hơn, tốn thêm I/O và không được chạy trong explicit transaction.

> **Bug ẩn / production — invalid index:** Nếu concurrent build thất bại, catalog có thể còn index `indisvalid = false` nhưng vẫn tạo write overhead. Kiểm tra và xử lý có chủ đích:

```sql
SELECT
    c.oid::regclass AS index_name,
    i.indisready,
    i.indisvalid
FROM pg_index AS i
JOIN pg_class AS c ON c.oid = i.indexrelid
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'index_lab';
```

> **Bug ẩn / production — usage counter:** `idx_scan = 0` từ `pg_stat_user_indexes` không tự động nghĩa index vô dụng: statistics có thể vừa reset, index phục vụ constraint/FK checks, hoặc query chỉ chạy cuối tháng. Kết hợp thời gian quan sát, query inventory và dependency.

## Bài tập

1. Đổi thứ tự composite index và so `Buffers`, sort node, latency cho ba query khác nhau.
2. Chứng minh một generic prepared statement không chọn partial index, rồi so custom plan.
3. Update ngẫu nhiên `created_at` của nhiều row và đo BRIN recheck tăng thế nào.
4. So kích thước và operator hỗ trợ của `jsonb_ops` với `jsonb_path_ops`.
5. Dùng `pg_relation_size`/`pg_indexes_size` lập bảng tradeoff dung lượng trước và sau mỗi index.
