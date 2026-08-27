# PostgreSQL nâng cao — Đáp án và giải thích

Chỉ mở file này sau khi đã làm [đề PostgreSQL](POSTGRESQL_ADVANCED_QUESTIONS.md). SQL giả định search_path là quiz_pg, public như script đề bài.

## A. Multiple choice

### PG-01 — Đáp án B

**Vì sao:** MVCC phải giữ những tuple version mà snapshot cũ vẫn có thể nhìn thấy. xmin horizon bị kéo lùi, VACUUM chưa thể reclaim chúng; dead tuples, bloat và thời gian vacuum có thể tăng. Kiểm tra session lâu:

~~~sql
SELECT pid, usename, state, xact_start, now() - xact_start AS xact_age,
       backend_xmin, left(query, 120) AS query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_start;
~~~

**Bẫy production:** kill query không luôn kết thúc transaction; session idle in transaction cần được terminate hoặc cấu hình idle_in_transaction_session_timeout có kiểm soát. Tránh terminate nhầm maintenance/replication session.

### PG-02 — Đáp án C

**Vì sao:** predicate của query chứng minh được status = 'pending', nên tập kết quả nằm trong partial index. Các biểu thức còn lại có thể gồm hàng ngoài predicate hoặc không tương đương về logic.

~~~sql
EXPLAIN SELECT order_id
FROM orders
WHERE status = 'pending'
  AND created_at >= now() - interval '1 day';
~~~

**Bẫy production:** prepared statement dùng tham số status có thể chuyển sang generic plan; planner không chứng minh được tham số luôn là pending nên bỏ partial index. Hãy đo custom/generic plan thay vì ép enable_seqscan.

### PG-03 — Đáp án C

**Vì sao:** CREATE INDEX CONCURRENTLY thực hiện nhiều phase/scan, chờ transaction cũ và không được đặt trong transaction block. Khi thất bại, catalog có thể còn index với indisvalid = false.

~~~sql
SELECT c.relname, i.indisready, i.indisvalid
FROM pg_index i
JOIN pg_class c ON c.oid = i.indexrelid
WHERE c.relname = 'orders_pending_idx';
~~~

**Bẫy production:** concurrent không có nghĩa là không ảnh hưởng tải; nó tăng I/O/CPU và có thể chờ lâu. Migration framework tự bọc transaction sẽ làm lệnh lỗi.

### PG-04 — Đáp án B

**Vì sao:** check-then-act tách rời cho phép cả hai request cùng quyết định từ dữ liệu cũ. Dùng một UPDATE có predicate hoặc row lock để check và write là một thao tác nguyên tử.

~~~sql
UPDATE inventory
SET available = available - 1
WHERE sku = 'SKU-RED' AND available >= 1
RETURNING available;
~~~

**Bẫy production:** SELECT FOR UPDATE sửa race trong database nhưng giữ lock qua network call sẽ kéo dài lock queue. Đưa external call ra ngoài transaction và dùng idempotency/outbox.

### PG-05 — Đáp án B

**Vì sao:** index chứa đủ giá trị nhưng PostgreSQL vẫn phải xác minh visibility trong heap nếu page chưa all-visible. VACUUM cập nhật visibility map khi điều kiện cho phép.

~~~sql
EXPLAIN (ANALYZE, BUFFERS) SELECT order_id, created_at
FROM orders WHERE customer_id = 10;
~~~

**Bẫy production:** bảng update liên tục thường có ít page all-visible; thêm INCLUDE làm index phình và tăng write amplification nhưng chưa chắc giảm heap fetch.

### PG-06 — Đáp án A

**Vì sao:** BRIN lưu summary theo block range, rất nhỏ và hiệu quả khi giá trị tương quan với vị trí vật lý. Nó bỏ qua range chắc chắn không chứa khoảng thời gian cần tìm.

~~~sql
CREATE INDEX orders_created_brin ON orders USING brin (created_at)
WITH (pages_per_range = 64);
~~~

**Bẫy production:** backfill dữ liệu cũ xen vào cuối bảng làm correlation giảm và nhiều range match giả. pages_per_range quá lớn tiết kiệm index nhưng đọc dư nhiều hơn.

### PG-07 — Đáp án C

**Vì sao:** work_mem áp dụng cho từng sort/hash operation; parallel worker và nhiều node có thể đồng thời cấp phát. Tổng RAM xấp xỉ concurrency × nodes × workers × work_mem, không phải một giá trị duy nhất.

~~~sql
SHOW work_mem;
EXPLAIN (ANALYZE, BUFFERS, SETTINGS) SELECT tenant_id, count(*)
FROM orders GROUP BY tenant_id ORDER BY count(*) DESC;
~~~

**Bẫy production:** đặt global work_mem lớn để cứu một report có thể gây OOM khi traffic tăng. Ưu tiên SET LOCAL trong transaction/report role và đo temp files.

### PG-08 — Đáp án B

**Vì sao:** half-open range trên chính partition key dễ được planner/executor pruning và không bỏ sót timestamp có phần lẻ. Các lựa chọn bọc cột trong hàm làm quan hệ với partition bound khó hoặc không thể suy ra.

**Bẫy production:** mốc local midnight phải đổi sang timestamptz với time zone nghiệp vụ. Cộng 24 giờ không luôn tương đương ngày kế tiếp ở vùng có DST.

### PG-09 — Đáp án B

**Vì sao:** HOT chain tránh thêm entry mới vào index nếu không đổi cột được index và page cũ còn chỗ. fillfactor thấp hơn có thể dành chỗ cho update.

~~~sql
SELECT n_tup_upd, n_tup_hot_upd
FROM pg_stat_user_tables
WHERE relname = 'orders';
~~~

**Bẫy production:** thêm một index tưởng vô hại lên cột cập nhật thường xuyên có thể làm HOT ratio giảm mạnh và tăng WAL/bloat.

### PG-10 — Đáp án A

**Vì sao:** replication slot bảo đảm WAL cần cho consumer không bị recycle. Consumer đứng lâu làm restart_lsn tụt xa current WAL LSN và pg_wal có thể đầy.

~~~sql
SELECT slot_name, active,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained
FROM pg_replication_slots;
~~~

**Bẫy production:** xóa slot giải phóng WAL nhưng có thể buộc consumer resnapshot/mất continuity. Phải xác minh owner, lag và recovery plan trước khi drop.

## B. Explain why

### PG-11 — MVCC

**Đáp án:** UPDATE tạo tuple mới với xmin của transaction cập nhật; version cũ được đánh dấu xmax. Snapshot dùng tập transaction đang chạy cùng xmin/xmax để quyết định version nào visible. Reader cũ có thể thấy version cũ trong khi writer tạo version mới, nên đọc thường không chặn ghi. Row-level conflict giữa hai writer vẫn khóa/chờ.

Quan sát version trong lab:

~~~sql
SELECT ctid, xmin, xmax, status FROM orders WHERE order_id = 1;
BEGIN;
UPDATE orders SET status = 'paid' WHERE order_id = 1;
SELECT ctid, xmin, xmax, status FROM orders WHERE order_id = 1;
ROLLBACK;
~~~

**Bẫy production:** MVCC không miễn phí: version cũ cần VACUUM, WAL và disk. Transaction dài làm cleanup chậm; đọc không chặn ghi cũng không có nghĩa hai writer không deadlock.

### PG-12 — Cardinality estimate

**Đáp án:** statistics từng cột thường giả định độc lập; country = 'VN' và city = 'Bangkok' không có xác suất bằng tích selectivity nếu hai cột phụ thuộc nhau. Kiểm tra estimate/actual và catalog, rồi tăng statistics target hoặc tạo extended statistics:

~~~sql
SELECT attname, n_distinct, most_common_vals, most_common_freqs
FROM pg_stats
WHERE schemaname = 'quiz_pg' AND tablename = 'customers';

CREATE STATISTICS customers_geo_stats (dependencies, mcv)
ON country, city FROM customers;
ANALYZE customers;
~~~

Nếu schema lab chưa có country/city, đây là SQL mẫu cho bảng production tương ứng. Hướng khác là rewrite predicate/schema, tăng per-column statistics hoặc cập nhật statistics sau bulk load.

**Bẫy production:** extended statistics hỗ trợ estimate nhưng không tự tạo index và không giải quyết mọi join correlation. Tăng statistics target toàn server làm ANALYZE/catalog nặng hơn.

### PG-13 — Composite index

**Đáp án:** index (tenant_id, status, created_at DESC) hiệu quả nhất khi query ràng buộc tenant_id, rồi tùy chọn status, và có range/order trên created_at. Query chỉ status hoặc created_at thường không thể định vị vùng nhỏ từ đầu index. Query chỉ tenant_id vẫn dùng được prefix đầu.

~~~sql
CREATE INDEX orders_tenant_status_created_idx
ON orders (tenant_id, status, created_at DESC);

EXPLAIN SELECT order_id FROM orders
WHERE tenant_id = 7 AND status = 'paid'
ORDER BY created_at DESC LIMIT 50;
~~~

tenant_id đầu vừa phục vụ access pattern vừa giảm nguy cơ scan chéo tenant; authorization vẫn phải được thực thi riêng, ví dụ RLS.

**Bẫy production:** thứ tự cột không được chọn chỉ theo cardinality. Range ở cột sớm có thể làm các cột sau không giúp định vị; thêm nhiều index gần giống nhau tăng write/WAL.

### PG-14 — Serializable

**Đáp án:** PostgreSQL Serializable dùng SSI và có thể abort một transaction khi phát hiện dependency cycle nguy hiểm. SQLSTATE 40001 là kết quả đúng để giữ tính serializable. Ứng dụng phải retry toàn bộ transaction từ đầu, có backoff/jitter, giới hạn số lần và metric.

~~~text
begin -> đọc/check -> ghi -> commit
nếu 40001: rollback hoàn toàn -> backoff -> chạy lại toàn bộ hàm transaction
~~~

**Bẫy production:** retry riêng statement cuối dùng dữ liệu đọc cũ và sai logic. External side effect trong transaction có thể bị gửi hai lần; dùng idempotency key/outbox.

### PG-15 — Backup

**Đáp án:** replica sao chép cả thao tác xóa nhầm/corruption logic và có thể lag hoặc hỏng cùng failure domain. Backup cần bản sao độc lập, retention và khả năng phục hồi tới thời điểm trước lỗi. RPO là lượng dữ liệu tối đa chấp nhận mất; RTO là thời gian tối đa để phục hồi dịch vụ. Test tối thiểu: restore base backup vào máy tách biệt, replay WAL tới target time, kiểm tra dữ liệu/constraint và đo thời gian.

~~~sql
SELECT pg_is_in_recovery(), pg_last_wal_replay_lsn(), pg_last_xact_replay_timestamp();
~~~

**Bẫy production:** “backup job thành công” không chứng minh restore được. Thiếu WAL segment, key mã hóa hoặc extension/version đúng có thể chỉ lộ ra khi thảm họa.

## C. Hidden bugs

### PG-16 — Non-sargable timestamp

**Đáp án:** date(created_at) bọc cột nên B-tree thường không dùng range trực tiếp; CURRENT_DATE phụ thuộc session time zone. Xác định ngày nghiệp vụ rõ ràng:

~~~sql
WITH local_day AS (
  SELECT (now() AT TIME ZONE 'Asia/Bangkok')::date AS d
), bounds AS (
  SELECT d::timestamp AT TIME ZONE 'Asia/Bangkok' AS lo,
         (d + 1)::timestamp AT TIME ZONE 'Asia/Bangkok' AS hi
  FROM local_day
)
SELECT count(*)
FROM orders o CROSS JOIN bounds b
WHERE o.tenant_id = 7
  AND o.created_at >= b.lo
  AND o.created_at < b.hi;

CREATE INDEX orders_tenant_created_idx
ON orders (tenant_id, created_at);
~~~

**Vì sao:** half-open interval dùng được index, bao phủ mọi phần lẻ và tránh double count tại midnight.

**Bẫy production:** expression index trên date(created_at) phụ thuộc kiểu/time zone expression và ít linh hoạt. Đừng dùng BETWEEN với 23:59:59.999 vì precision có thể cao hơn.

### PG-17 — NOT IN và NULL

**Đáp án:** so sánh với tập chứa NULL tạo UNKNOWN theo three-valued logic; NOT UNKNOWN vẫn UNKNOWN nên hàng không qua WHERE. Dùng NOT EXISTS:

~~~sql
SELECT c.customer_id
FROM customers c
WHERE NOT EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.customer_id
    AND o.status = 'cancelled'
);
~~~

**Vì sao:** correlated anti-join chỉ loại customer khi tồn tại row match thật, NULL ở dữ liệu khác không đầu độc toàn predicate.

**Bẫy production:** nếu key ghép, phải so khớp đủ tenant_id và customer_id; thiếu tenant predicate có thể vừa sai dữ liệu vừa tạo security incident.

### PG-18 — LEFT JOIN biến thành INNER JOIN

**Đáp án:** đặt điều kiện của bảng nullable vào ON để row không match vẫn được giữ:

~~~sql
SELECT c.customer_id, count(o.order_id) AS paid_30d
FROM customers c
LEFT JOIN orders o
  ON o.customer_id = c.customer_id
 AND o.tenant_id = c.tenant_id
 AND o.status = 'paid'
 AND o.created_at >= now() - interval '30 days'
GROUP BY c.customer_id;
~~~

**Vì sao:** WHERE chạy sau join; o.status trên null-extended row là UNKNOWN và loại row đó.

**Bẫy production:** count(*) sẽ trả 1 cho customer không có order; phải count khóa/cột non-null phía phải. Thiếu tenant trong join có thể ghép chéo nếu ID chỉ unique trong tenant.

### PG-19 — Claim job

**Đáp án:** claim trong một statement/transaction, khóa row và đổi trạng thái trước khi nhả lock:

~~~sql
WITH picked AS (
  SELECT job_id
  FROM jobs
  WHERE status = 'ready' AND available_at <= now()
  ORDER BY job_id
  FOR UPDATE SKIP LOCKED
  LIMIT 10
)
UPDATE jobs j
SET status = 'running',
    locked_at = clock_timestamp(),
    worker_id = 'worker-42',
    attempts = attempts + 1
FROM picked
WHERE j.job_id = picked.job_id
RETURNING j.job_id, j.payload;
~~~

**Vì sao:** row locks loại các worker cạnh tranh trong lúc claim; UPDATE RETURNING trả đúng tập đã chuyển trạng thái.

**Bẫy production:** worker có thể crash sau side effect nhưng trước khi mark done. Cần lease timeout/reaper, max attempts, dead-letter và handler idempotent theo job_id. SKIP LOCKED còn có thể gây starvation.

### PG-20 — Idle transaction

**Đáp án:** vấn đề gồm giữ connection trong pool, giữ snapshot cản vacuum, có thể giữ row/table lock, và transaction latency/error tăng. Không gọi network trong transaction; đọc dữ liệu cần thiết, commit, gọi ngoài, rồi dùng transaction ngắn với optimistic check/outbox.

~~~sql
SELECT pid, state, wait_event_type, wait_event,
       now() - xact_start AS xact_age,
       pg_blocking_pids(pid) AS blockers,
       left(query, 100) AS query
FROM pg_stat_activity
WHERE datname = current_database()
ORDER BY xact_start NULLS LAST;

SHOW idle_in_transaction_session_timeout;
SHOW statement_timeout;
SHOW lock_timeout;
~~~

**Vì sao:** transaction boundary phải bao quanh database invariant, không bao quanh thời gian chờ remote không kiểm soát.

**Bẫy production:** đặt timeout quá thấp toàn server có thể giết migration/maintenance hợp lệ. Cấu hình theo role/application_name và bảo đảm client rollback connection trước khi trả về pool.

### PG-21 — Invalid index

**Đáp án:** kiểm tra cả definition và flag:

~~~sql
SELECT n.nspname, c.relname, i.indisready, i.indisvalid,
       pg_get_indexdef(i.indexrelid) AS definition
FROM pg_index i
JOIN pg_class c ON c.oid = i.indexrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'quiz_pg' AND c.relname = 'orders_pending_idx';
~~~

Nếu invalid và xác nhận không có migration khác sở hữu nó:

~~~sql
DROP INDEX CONCURRENTLY quiz_pg.orders_pending_idx;
CREATE INDEX CONCURRENTLY orders_pending_idx
ON quiz_pg.orders (created_at) WHERE status = 'pending';
~~~

**Vì sao:** object invalid vẫn chiếm tên nhưng planner không thể dùng như index hợp lệ.

**Bẫy production:** DROP/CREATE CONCURRENTLY đều có giới hạn transaction và có thể chờ transaction cũ. Trước khi drop, kiểm tra constraint dependency, locks, I/O budget và tên schema để không đụng index khác.

## D. SQL writing

### PG-22 — Latest row per group

**Đáp án 1 — DISTINCT ON:**

~~~sql
SELECT DISTINCT ON (customer_id)
       customer_id, order_id, status, total_amount, created_at
FROM orders
WHERE tenant_id = 7
ORDER BY customer_id, created_at DESC, order_id DESC;
~~~

**Đáp án 2 — window:**

~~~sql
SELECT customer_id, order_id, status, total_amount, created_at
FROM (
  SELECT o.*,
         row_number() OVER (
           PARTITION BY customer_id
           ORDER BY created_at DESC, order_id DESC
         ) AS rn
  FROM orders o
  WHERE tenant_id = 7
) ranked
WHERE rn = 1;
~~~

~~~sql
CREATE INDEX orders_latest_customer_idx
ON orders (tenant_id, customer_id, created_at DESC, order_id DESC)
INCLUDE (status, total_amount);
~~~

**Vì sao:** order_id là tie-break ổn định khi hai order cùng timestamp. DISTINCT ON thường gọn trong PostgreSQL; window linh hoạt/portable hơn.

**Bẫy production:** thiếu tie-break làm kết quả không deterministic. INCLUDE rộng làm write amplification; index-only còn phụ thuộc visibility map.

### PG-23 — Keyset pagination

**Đáp án:**

~~~sql
-- Trang đầu
SELECT order_id, customer_id, total_amount, created_at
FROM orders
WHERE tenant_id = 7 AND status = 'paid'
ORDER BY created_at DESC, order_id DESC
LIMIT 50;

-- Trang tiếp; hai tham số lấy từ row cuối trang trước
SELECT order_id, customer_id, total_amount, created_at
FROM orders
WHERE tenant_id = 7 AND status = 'paid'
  AND (created_at, order_id) <
      (TIMESTAMPTZ '2026-08-27 10:00:00+07', 123456::bigint)
ORDER BY created_at DESC, order_id DESC
LIMIT 50;

CREATE INDEX orders_paid_page_idx
ON orders (tenant_id, created_at DESC, order_id DESC)
WHERE status = 'paid';
~~~

**Vì sao:** keyset bắt đầu sau cursor trong index, không phải đọc/bỏ toàn bộ OFFSET; cặp key tạo total order.

**Bẫy production:** cursor phải mang đủ sort key, đúng type/time zone và nên được ký nếu gửi ra client. Dữ liệu update sort key giữa hai trang vẫn có semantics cần định nghĩa.

### PG-24 — Reserve inventory

**Đáp án:**

~~~sql
UPDATE inventory
SET available = available - 3,
    version = version + 1
WHERE sku = 'SKU-RED'
  AND available >= 3
RETURNING sku, available, version;
~~~

Không có row trả về có thể là SKU thiếu hoặc không đủ. Nếu API cần phân biệt, thực hiện SELECT trong cùng transaction sau khi UPDATE trả 0 row, hoặc trả một status từ function/CTE.

**Vì sao:** predicate được đánh giá lại khi row lock được cấp, nên concurrent update không làm available âm.

**Bẫy production:** retry request sau timeout có thể trừ hai lần dù statement nguyên tử. Cần idempotency key/ledger unique theo reservation_id.

### PG-25 — Partial covering index

**Đáp án:**

~~~sql
CREATE INDEX CONCURRENTLY orders_pending_feed_idx
ON orders (tenant_id, created_at DESC, order_id DESC)
INCLUDE (customer_id, total_amount)
WHERE status = 'pending';

EXPLAIN (ANALYZE, BUFFERS, WAL, SETTINGS)
SELECT order_id, customer_id, total_amount, created_at
FROM orders
WHERE tenant_id = 7 AND status = 'pending'
ORDER BY created_at DESC, order_id DESC
LIMIT 100;
~~~

**Vì sao:** equality tenant dẫn đầu, index order khớp sort/limit, predicate giảm kích thước, INCLUDE đáp ứng projection.

**Bẫy production:** parameterized/generic status có thể không dùng partial index; concurrent build có I/O và invalid-index failure mode. Đừng giữ index nếu pending chiếm gần toàn bảng và write cost vượt lợi ích.

### PG-26 — Version-aware upsert

**Đáp án:**

~~~sql
CREATE TABLE customer_profiles (
  tenant_id integer NOT NULL,
  customer_id bigint NOT NULL,
  payload jsonb NOT NULL,
  source_version bigint NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, customer_id)
);

INSERT INTO customer_profiles
  (tenant_id, customer_id, payload, source_version)
VALUES
  (7, 42, '{"tier":"gold"}'::jsonb, 18)
ON CONFLICT (tenant_id, customer_id) DO UPDATE
SET payload = EXCLUDED.payload,
    source_version = EXCLUDED.source_version,
    updated_at = now()
WHERE EXCLUDED.source_version > customer_profiles.source_version
RETURNING *;
~~~

**Vì sao:** WHERE trên DO UPDATE loại event cũ/duplicate sau khi khóa row conflict.

**Bẫy production:** không có row RETURNING có thể nghĩa là event stale, không phải lỗi. source_version phải monotonic trong đúng scope; hai source độc lập không thể dùng chung counter ngây thơ.

## E. Execution-plan analysis

### PG-27 — Ước lượng lệch

**Đáp án:** estimate 12 so với actual 182.000 lệch hơn bốn bậc độ lớn. Nhưng actual trả 91% bảng, nên sequential scan có thể vẫn là lựa chọn đúng; vấn đề chính là statistics/data distribution và các quyết định downstream có thể sai.

~~~sql
SELECT last_analyze, last_autoanalyze, n_live_tup
FROM pg_stat_user_tables WHERE relname = 'orders';

SELECT attname, n_distinct, most_common_vals, most_common_freqs
FROM pg_stats
WHERE schemaname = 'quiz_pg' AND tablename = 'orders'
  AND attname IN ('tenant_id', 'status');

CREATE STATISTICS orders_tenant_status_stats (mcv, dependencies)
ON tenant_id, status FROM orders;
ANALYZE orders;
~~~

**Vì sao:** lệch có thể do stale stats, tenant skew hoặc correlation giữa tenant/status. Đo lại plan sau ANALYZE/extended stats rồi mới cân nhắc index.

**Bẫy production:** ép index scan có thể biến một lần đọc tuần tự thành hàng trăm nghìn random heap fetch. Plan minh họa có số liệu không nhất thiết khớp dataset nhỏ của quiz.

### PG-28 — Nested loop bùng nổ

**Đáp án:** inner index scan chạy 10.000 lần; nó trả 20 nhưng còn lọc 45 mỗi loop, tức khoảng 650.000 index/heap candidates. Tổng work phải đọc actual rows × loops, không nhìn một loop riêng.

Các bước:

~~~sql
CREATE INDEX orders_customer_paid_idx
ON orders (customer_id) WHERE status = 'paid';
ANALYZE orders;

EXPLAIN (ANALYZE, BUFFERS)
SELECT c.customer_id, count(o.order_id)
FROM customers c
JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'paid'
GROUP BY c.customer_id;
~~~

Nếu paid chiếm phần lớn và cần gần toàn bộ bảng, hash join + seq scan có thể rẻ hơn; rewrite pre-aggregate orders rồi join cũng đáng thử. Kiểm tra statistics/status skew và buffer reads.

**Bẫy production:** tắt enable_nestloop chỉ che estimate sai và ảnh hưởng mọi query trong session. Partial index không lợi nếu predicate chiếm gần hết bảng hoặc query parameter không chứng minh predicate.

### PG-29 — Sort spill

**Đáp án:** external merge, Disk và temp read/written là bằng chứng sort vượt memory. Thứ tự xử lý:

1. Xác nhận query cần cả 900.000 hàng hay có thể LIMIT/filter sớm.
2. Kiểm tra index khớp filter + ORDER BY; đừng tạo index chỉ để tránh một report hiếm.
3. Đo work_mem hiện tại, concurrency, số sort/worker và temp file metrics.
4. Thử SET LOCAL work_mem trong transaction của report, so sánh median/p95 và buffer/temp.

~~~sql
BEGIN;
SET LOCAL work_mem = '128MB';
EXPLAIN (ANALYZE, BUFFERS, SETTINGS)
SELECT * FROM orders_archive ORDER BY created_at DESC;
ROLLBACK;
~~~

**Vì sao:** memory đủ có thể chuyển sang quicksort, nhưng đọc/trả gần triệu row vẫn đắt và network có thể là bottleneck tiếp theo.

**Bẫy production:** work_mem global × nhiều node × worker × session có thể vượt RAM, swap/OOM. Index scan toàn bảng cũng có thể chậm hơn seq scan + sort do random I/O.

### PG-30 — Bitmap lossy

**Đáp án:** exact bitmap giữ offset từng tuple; lossy chỉ nhớ page và phải recheck mọi tuple trong page. Nhiều lossy blocks cùng 730.000 rows removed cho thấy bitmap thiếu memory hoặc predicate quá rộng/dữ liệu phân tán.

Lựa chọn có điều kiện:

- tăng work_mem cục bộ và đo lại, đổi lấy RAM theo concurrency;
- tạo composite/partial index để bitmap nhỏ/chọn lọc hơn, đổi lấy write/storage;
- partition/cluster dữ liệu theo access pattern để giảm page, đổi lấy maintenance/design cost;
- nếu lấy phần lớn bảng, chấp nhận sequential scan có thể tốt hơn;
- thêm predicate nghiệp vụ hoặc pre-aggregate nếu endpoint không thật sự cần 420.000 rows.

~~~sql
SELECT correlation, n_distinct
FROM pg_stats
WHERE schemaname = 'quiz_pg' AND tablename = 'events'
  AND attname = 'tenant_id';
~~~

**Vì sao:** sửa đúng phụ thuộc selectivity, layout và concurrency; từ một plan không thể khẳng định chỉ cần tăng RAM.

**Bẫy production:** VACUUM không tự biến lossy thành exact; đây là bitmap trong execution memory, không phải trạng thái index bị hỏng. CLUSTER không duy trì thứ tự sau các write tiếp theo.

## F. Curriculum expansion — PG-31..PG-45

### PG-31 — Domain, generated column và tenant uniqueness

~~~sql
CREATE DOMAIN positive_money AS numeric(14,2)
CHECK (VALUE > 0);

CREATE TABLE invoice_line (
  tenant_id bigint NOT NULL,
  invoice_id bigint NOT NULL,
  line_no integer NOT NULL CHECK (line_no > 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price positive_money NOT NULL,
  line_total numeric(18,2)
    GENERATED ALWAYS AS (quantity * unit_price) STORED,
  PRIMARY KEY (tenant_id, invoice_id, line_no)
);
~~~

**Vì sao:** domain tái sử dụng rule scalar; generated column giữ giá trị dẫn xuất cùng row; composite key đặt tenant boundary vào integrity. Khi đổi domain constraint, inventory mọi column dùng domain và dùng NOT VALID/VALIDATE nếu cú pháp/rule cho phép để tách lock khỏi scan.

~~~sql
SELECT n.nspname, c.relname, a.attname
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE a.atttypid = 'positive_money'::regtype
  AND a.attnum > 0 AND NOT a.attisdropped;
~~~

**Bẫy production:** sửa domain ảnh hưởng mọi bảng dùng nó, không chỉ bảng đang deploy. Generated stored tăng write/WAL và không phù hợp biểu thức phụ thuộc row khác hoặc function không immutable.

### PG-32 — Deferred và exclusion constraints

~~~sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE room_booking (
  booking_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id bigint NOT NULL,
  slot tstzrange NOT NULL CHECK (NOT isempty(slot)),
  EXCLUDE USING gist (
    room_id WITH =,
    slot WITH &&
  ) DEFERRABLE INITIALLY DEFERRED
);

BEGIN;
SET CONSTRAINTS ALL DEFERRED;
-- Các update hoán đổi slot; trạng thái trung gian có thể overlap.
SET CONSTRAINTS ALL IMMEDIATE; -- kiểm tra sớm trước COMMIT nếu muốn
COMMIT;
~~~

**Vì sao:** operator && phát hiện overlap; boundary [) cho phép slot kết thúc 10:00 và slot mới bắt đầu 10:00 không overlap. Deferred constraint kiểm tra invariant ở cuối transaction.

**Bẫy production:** transaction vẫn phải kết thúc ở trạng thái hợp lệ; lỗi tại COMMIT cần rollback/retry toàn unit. Deferrable unique/exclusion constraint không luôn dùng được làm arbiter cho ON CONFLICT.

### PG-33 — Idempotency record và outbox

~~~sql
CREATE TABLE api_idempotency (
  tenant_id bigint NOT NULL,
  action text NOT NULL,
  idempotency_key text NOT NULL,
  request_hash bytea NOT NULL,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, action, idempotency_key)
);

CREATE TABLE order_outbox (
  outbox_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL,
  order_id bigint NOT NULL,
  source_version bigint NOT NULL,
  payload jsonb NOT NULL,
  published_at timestamptz,
  UNIQUE (tenant_id, order_id, source_version)
);

BEGIN;
INSERT INTO api_idempotency
VALUES (7, 'create-order', 'req-42', decode('0123', 'hex'), NULL, now())
ON CONFLICT DO NOTHING;
-- Nếu key đã có: khóa/đọc row và so request_hash; khác hash => conflict.
-- Nếu mới: tạo order rồi outbox trong cùng transaction.
COMMIT;
~~~

**Vì sao:** scope ngăn collision giữa tenant/action; hash ngăn cùng key đại diện hai request khác; outbox intent commit nguyên tử với business state.

**Bẫy production:** JSON hash phải canonical hóa ổn định. Gọi broker trong transaction giữ lock/network uncertainty; crash sau broker ACK nhưng trước mark published vẫn tạo duplicate, nên consumer phải idempotent.

### PG-34 — WAL và durability contract

**Đáp án:** wal_level quyết định lượng thông tin WAL; fsync bảo đảm writes được flush theo thứ tự an toàn; full_page_writes bảo vệ page khỏi torn write sau checkpoint; synchronous_commit quyết định commit có chờ WAL durable/replica acknowledgement trước khi trả ACK hay không.

~~~sql
BEGIN;
SET LOCAL synchronous_commit = off;
-- Chỉ transaction import chấp nhận mất vài commit vừa ACK nếu server/OS crash.
INSERT INTO import_stage SELECT * FROM incoming_batch;
COMMIT;

SHOW wal_level;
SHOW fsync;
SHOW full_page_writes;
SHOW synchronous_commit;
SELECT pg_current_wal_lsn();
~~~

**Vì sao:** asynchronous local commit vẫn tạo WAL và giữ crash-consistent structure; nó chỉ nới ACK durability window. Không tắt fsync/full_page_writes để tối ưu một workload.

**Bẫy production:** client đã nhận COMMIT vẫn có thể mất transaction async sau crash. Nếu import có side effect bên ngoài hoặc checkpoint ứng dụng đã advance, replay phải idempotent.

### PG-35 — Checkpoint, FPI và WAL retention

~~~sql
SELECT wal_records, wal_fpi, wal_bytes, wal_buffers_full,
       stats_reset
FROM pg_stat_wal;

SELECT num_timed, num_requested, write_time, sync_time,
       buffers_written, stats_reset
FROM pg_stat_checkpointer;

SELECT pg_size_pretty(sum(size)) AS pg_wal_on_disk
FROM pg_ls_waldir();

SELECT slot_name, active,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained
FROM pg_replication_slots;
~~~

**Vì sao:** lần thay đổi page đầu sau checkpoint thường ghi full-page image, nên checkpoint quá thường tăng wal_fpi. max_wal_size là soft checkpoint target, không phải hard cap; archive failure, slots, wal_keep_size, backup và checkpoint timing có thể giữ WAL lâu hơn.

Tuning theo bằng chứng: tăng max_wal_size/checkpoint_timeout nếu disk cho phép, giữ checkpoint_completion_target để smooth I/O, cân nhắc wal_compression và sửa retention cause trước.

**Bẫy production:** tắt full_page_writes hoặc ép CHECKPOINT liên tục có thể đổi spike thành corruption risk/WAL amplification. Counters phải đọc cùng stats_reset và workload window.

### PG-36 — Preflight DDL và volatile default

~~~sql
SET lock_timeout = '2s';
SELECT pid, state, xact_start, wait_event_type, wait_event,
       pg_blocking_pids(pid) AS blockers, left(query,120)
FROM pg_stat_activity
WHERE datname = current_database();

-- Expand nhanh trước, không default volatile/not-null ngay:
ALTER TABLE big_orders ADD COLUMN token uuid;
ALTER TABLE big_orders ALTER COLUMN token SET DEFAULT gen_random_uuid();
~~~

**Vì sao:** constant default trên PostgreSQL hiện đại có fast path metadata trong nhiều trường hợp; volatile expression phải tạo giá trị riêng cho từng row và có thể rewrite table. Mọi ALTER vẫn cần lock, nên transaction dài trước nó có thể tạo lock queue.

Chiến lược: add nullable column, deploy dual-write/default cho rows mới, backfill batch, validate NOT NULL, rồi contract.

**Bẫy production:** một DDL chờ lock có thể đứng đầu queue và chặn request phía sau. statement_timeout không thay lock_timeout; migration runner phải rollback transaction sau timeout.

### PG-37 — Backfill và NOT NULL online

~~~sql
-- Lặp batch; lưu last_id/progress ở control table hoặc job state.
WITH batch AS (
  SELECT order_id
  FROM big_orders
  WHERE token IS NULL AND order_id > :last_id
  ORDER BY order_id
  LIMIT 5000
  FOR UPDATE
)
UPDATE big_orders b
SET token = gen_random_uuid()
FROM batch
WHERE b.order_id = batch.order_id
RETURNING b.order_id;

ALTER TABLE big_orders
  ADD CONSTRAINT big_orders_token_nn CHECK (token IS NOT NULL) NOT VALID;
ALTER TABLE big_orders VALIDATE CONSTRAINT big_orders_token_nn;
ALTER TABLE big_orders ALTER COLUMN token SET NOT NULL;
ALTER TABLE big_orders DROP CONSTRAINT big_orders_token_nn;
~~~

Sau mỗi COMMIT, chỉ lưu `last_id = max(order_id)` của batch đã commit. Nếu lock timeout thì rollback và retry đúng cursor; sau khi tới cuối keyspace, reset cursor và chạy một repair pass `WHERE token IS NULL` tới khi zero. Nếu cần nhiều worker với `SKIP LOCKED`, phải có durable range/claim riêng và repair pass này, không được chỉ advance một cursor qua row bị skip.

**Vì sao:** keyset batch có bounded locks/WAL và checkpoint resume; validated CHECK cho phép SET NOT NULL tận dụng bằng chứng thay vì scan dài. Default/dual-write bảo đảm concurrent new rows có token; final repair pass và validation chứng minh không còn NULL.

**Bẫy production:** kết hợp một cursor tăng đơn điệu với `SKIP LOCKED` có thể bỏ vĩnh viễn row nằm trước cursor. Batch quá lớn gây replica lag/WAL spike; quá nhỏ tạo overhead.

### PG-38 — Constraint và expand-contract

~~~sql
-- Ngoài transaction block:
CREATE UNIQUE INDEX CONCURRENTLY users_tenant_email_uq_idx
ON users(tenant_id, email);

-- Transaction ngắn để attach catalog constraint:
ALTER TABLE users ADD CONSTRAINT users_tenant_email_uq
UNIQUE USING INDEX users_tenant_email_uq_idx;

ALTER TABLE orders ADD CONSTRAINT orders_customer_fk
FOREIGN KEY (tenant_id, customer_id)
REFERENCES customers(tenant_id, customer_id) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT orders_customer_fk;
~~~

Rename/type change: add new column, deploy code đọc old/fallback new và dual-write, backfill/reconcile, chuyển reads sang new, dừng old writes, rồi drop old ở release sau.

**Vì sao:** CREATE INDEX CONCURRENTLY giảm write blocking nhưng không được chạy trong transaction block; NOT VALID tách metadata change khỏi scan validation.

**Bẫy production:** validation vẫn đọc nhiều data và có locks/I/O. Concurrent index failure để lại invalid index; hai app versions phải chịu được cả hai schema trong toàn deployment window.

### PG-39 — Extension lifecycle

~~~sql
SELECT e.extname, e.extversion, n.nspname AS schema,
       a.default_version, a.installed_version
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace
LEFT JOIN pg_available_extensions a ON a.name = e.extname
ORDER BY e.extname;

SELECT pg_describe_object(d.classid, d.objid, d.objsubid) AS dependent,
       d.deptype
FROM pg_depend d
WHERE d.refobjid = (SELECT oid FROM pg_extension WHERE extname = 'pg_trgm');
~~~

Release sequence: inventory binary/control/SQL availability trên target; đọc upgrade path; restore-test/staging clone; backup; cài package đúng version; ALTER EXTENSION UPDATE trong window; smoke/integrity/performance test; rollback strategy đã chứng minh.

**Vì sao:** extension gồm SQL objects và đôi khi native library/preload; dependency graph có application objects dựa vào members.

**Bẫy production:** DROP ... CASCADE có thể xóa index/function/view ngoài dự kiến. Native extension ABI, shared_preload_libraries và OS package mismatch có thể làm server không start sau restart.

### PG-40 — Major upgrade

**Đáp án:** pg_upgrade giảm data-copy downtime nhưng cần old/new binaries, disk/filesystem discipline và post-upgrade analyze; dump/restore portable/sạch nhưng downtime và data movement lớn; logical blue/green giảm cutover downtime nhưng cần compatibility, replication coverage, sequence/DDL handling và failback plan.

~~~sql
SELECT datname, datcollversion,
       pg_database_collation_actual_version(oid) AS actual
FROM pg_database
WHERE datallowconn;

SELECT extname, extversion FROM pg_extension ORDER BY 1;
~~~

Sau upgrade: kiểm tra extension/collation mismatch, REINDEX objects phụ thuộc collation khi cần, refresh version chỉ sau khi xử lý, chạy ANALYZE, smoke/invariant/query-plan benchmark và giữ old cluster immutable tới hết rollback window.

**Bẫy production:** pg_upgrade --link làm old/new cluster chia sẻ files theo cách khiến rollback nguy hiểm nếu start new cluster ghi dữ liệu. Logical replication không tự sao chép mọi DDL/large object/sequence semantics.

### PG-41 — Capacity budget

**Đáp án:** upper bound thô = 40 × 2 × 3 × 64 MB = 15.360 MB, xấp xỉ 15 GB chỉ cho sort/hash operations; chưa gồm shared_buffers, backend, cache, maintenance và OS.

~~~sql
WITH snapshots(ts, bytes) AS (
  VALUES
    (TIMESTAMPTZ '2026-08-27 00:00+07', 500000000000::numeric),
    (TIMESTAMPTZ '2026-08-28 00:00+07', 512000000000::numeric)
), rate AS (
  SELECT (max(bytes)-min(bytes)) /
         (extract(epoch FROM max(ts)-min(ts))/86400) AS bytes_per_day
  FROM snapshots
)
SELECT pg_size_pretty(bytes_per_day::bigint) AS growth_per_day,
       round(200000000000::numeric / NULLIF(bytes_per_day,0), 1) AS runway_days
FROM rate;
~~~

**Vì sao:** capacity là concurrency × operations/workers × per-operation limit và growth rate, không phải một config riêng lẻ.

**Bẫy production:** work_mem không phải allocation cứng/duy nhất và hash_mem_multiplier có thể tăng hash memory. Average concurrency che burst; runway cần WAL/temp/index/bloat/backup headroom.

### PG-42 — Deadline và cancellation

**Đáp án:** statement_timeout raise ERROR; trong explicit transaction, transaction chuyển aborted và chỉ ROLLBACK hoặc ROLLBACK TO SAVEPOINT mới tiếp tục được.

~~~sql
BEGIN;
SET LOCAL lock_timeout = '500ms';
SET LOCAL statement_timeout = '2s';
-- Nếu statement lỗi timeout:
ROLLBACK;

SELECT pg_cancel_backend(:pid);    -- yêu cầu hủy statement, giữ session
SELECT pg_terminate_backend(:pid); -- đóng session, rollback transaction
~~~

lock_timeout chỉ thời gian chờ lock; statement_timeout là toàn statement; idle_in_transaction_session_timeout xử lý session bỏ transaction mở. Deadline client nên ngắn hơn/đồng bộ với server budget và pool queue.

**Vì sao:** cancel là lỗi statement chứ không tự reset transaction state. Terminate mạnh hơn và rollback có thể lâu.

**Bẫy production:** client timeout/disconnect không chứng minh COMMIT chưa xảy ra; retry cần idempotency. Timeout global quá thấp có thể phá migration/maintenance hợp lệ.

### PG-43 — JSONB, FTS và trigram

~~~sql
CREATE INDEX product_metadata_path_idx
ON product USING gin (metadata jsonb_path_ops);

SELECT product_id FROM product
WHERE metadata @> '{"color":"red"}'::jsonb;

ALTER TABLE product ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(description,''))
) STORED;
CREATE INDEX product_search_idx ON product USING gin(search_vector);
SELECT product_id FROM product
WHERE search_vector @@ plainto_tsquery('simple', 'wireless mouse');

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX product_name_trgm_idx
ON product USING gin (name gin_trgm_ops);
SELECT product_id FROM product WHERE name ILIKE '%mous%';
~~~

**Vì sao:** jsonb_path_ops tối ưu containment nhưng hỗ trợ operator set hẹp hơn jsonb_ops; tsvector dùng linguistic token search; trigram dùng substring/similarity.

**Bẫy production:** GIN write/pending-list cost lớn và expression phải khớp query. FTS config/ngôn ngữ sai làm tokenization sai; một index không thay contract NULL/type của JSON fields.

### PG-44 — RLS và SECURITY DEFINER

~~~sql
ALTER TABLE app.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.orders FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_orders ON app.orders
USING (tenant_id = current_setting('app.tenant_id', true)::bigint)
WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::bigint);

ALTER FUNCTION app.admin_task()
  SET search_path = pg_catalog, app;
REVOKE ALL ON FUNCTION app.admin_task() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.admin_task() TO app_runtime;
~~~

Mỗi request dùng BEGIN; SET LOCAL app.tenant_id = '7'; ...; COMMIT. Runtime role không sở hữu table, không superuser/BYPASSRLS. Function schema-qualify mọi object và owner có quyền tối thiểu.

Test matrix phải SELECT/INSERT/UPDATE/DELETE tenant A/B, thiếu context, rollback/connection reuse và function/view path; cross-tenant phải trả zero/error.

**Vì sao:** SET LOCAL hết hiệu lực cùng transaction; USING bảo vệ visible rows, WITH CHECK bảo vệ rows mới/sau update.

**Bẫy production:** table owner và BYPASSRLS có semantics khác; RLS trên orders nhưng quên child/outbox/view vẫn rò dữ liệu. Custom GUC không đáng tin nếu user được chạy SQL tùy ý.

### PG-45 — PITR/HA/observability

~~~sql
SELECT archived_count, failed_count, last_archived_wal,
       last_archived_time, last_failed_wal, last_failed_time
FROM pg_stat_archiver;

SELECT slot_name, slot_type, active, restart_lsn,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained
FROM pg_replication_slots;

SELECT application_name, state, sync_state,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), sent_lsn)) AS send_gap,
       pg_size_pretty(pg_wal_lsn_diff(sent_lsn, replay_lsn)) AS replay_gap
FROM pg_stat_replication;

SELECT pg_size_pretty(sum(size)) AS wal_disk FROM pg_ls_waldir();
SELECT pid, state, xact_start, backend_xmin, wait_event, left(query,120)
FROM pg_stat_activity WHERE xact_start IS NOT NULL ORDER BY xact_start;
~~~

Thứ tự: xác nhận time-to-full; giảm/stop nonessential writes; mở capacity tạm an toàn nếu có; sửa archive destination/network; xác định slot owner/consumer và resnapshot plan trước drop; kiểm tra standby receiver/replay/disk; chỉ failover khi fencing primary và RPO rõ.

PITR drill: restore base backup vào instance tách biệt, cung cấp chuỗi WAL liên tục và recovery target time/LSN, start recovery, kiểm tra timeline, invariant/checksum và đo RPO/RTO.

**Vì sao:** archive failure và inactive slot đều có thể giữ WAL; standby lag có thể cùng nguyên nhân I/O/network nhưng cần metric riêng.

**Bẫy production:** drop slot phá continuity; promote không fencing tạo split brain; restart khi disk gần đầy có thể làm recovery cần thêm WAL/temp và kéo outage dài. Một missing WAL segment làm chuỗi PITR gãy.

## Tự đánh giá sau khi chấm

- Sai PG-01/04/11/14/19/24: ôn concurrency, transaction và idempotency.
- Sai PG-02/05/06/09/13/16/25: ôn index internals và access pattern.
- Sai PG-07/12/27–30: ôn planner, statistics và cách đọc actual rows × loops.
- Sai PG-10/15/20/21: ôn vận hành, recovery và failure mode.
- Sai PG-31–33: ôn integrity, deferred constraint, idempotency và outbox.
- Sai PG-34–42/45: ôn WAL, migration, upgrade, capacity, timeout, PITR/HA và observability.
- Sai PG-43/44: ôn JSONB/FTS/trigram và tenant security/RLS.

Làm lại câu sai sau 48–72 giờ bằng dữ liệu có phân phối khác; không học thuộc plan cụ thể.
