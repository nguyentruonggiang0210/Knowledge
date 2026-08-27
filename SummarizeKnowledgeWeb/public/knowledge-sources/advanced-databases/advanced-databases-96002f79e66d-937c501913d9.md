# PostgreSQL nâng cao — Đề tự kiểm tra

Ngân hàng có 45 câu, tổng 150 điểm: PG-01..PG-30 là core 90 điểm; PG-31..PG-45 là curriculum expansion 60 điểm. Nên làm thành hai phiên 180 phút và 90 phút. Không mở file đáp án trước khi nộp câu trả lời của chính bạn.

## Dữ liệu thực hành chung

Chạy script sau trên database lab. Script tạo khoảng 200.000 orders, đủ để quan sát planner trên máy cá nhân nhưng chưa đại diện tải production.

~~~sql
DROP SCHEMA IF EXISTS quiz_pg CASCADE;
CREATE SCHEMA quiz_pg;
SET search_path = quiz_pg, public;

CREATE TABLE customers (
    customer_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id integer NOT NULL,
    email text NOT NULL,
    status text NOT NULL CHECK (status IN ('active', 'blocked')),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, email)
);

CREATE TABLE orders (
    order_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id integer NOT NULL,
    customer_id bigint NOT NULL REFERENCES customers(customer_id),
    status text NOT NULL CHECK (status IN ('pending', 'paid', 'cancelled')),
    total_amount numeric(12,2) NOT NULL CHECK (total_amount >= 0),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inventory (
    sku text PRIMARY KEY,
    available integer NOT NULL CHECK (available >= 0),
    version integer NOT NULL DEFAULT 0
);

CREATE TABLE jobs (
    job_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payload jsonb NOT NULL,
    status text NOT NULL DEFAULT 'ready',
    attempts integer NOT NULL DEFAULT 0,
    available_at timestamptz NOT NULL DEFAULT now(),
    locked_at timestamptz,
    worker_id text
);

INSERT INTO customers (tenant_id, email, status, created_at)
SELECT 1 + (g % 20), 'user-' || g || '@example.test',
       CASE WHEN g % 50 = 0 THEN 'blocked' ELSE 'active' END,
       now() - (g % 730) * interval '1 day'
FROM generate_series(1, 10000) AS g;

INSERT INTO orders (tenant_id, customer_id, status, total_amount, created_at)
SELECT c.tenant_id,
       c.customer_id,
       (ARRAY['pending','paid','paid','paid','cancelled'])[1 + (g % 5)],
       round((10 + random() * 490)::numeric, 2),
       now() - (g % 365) * interval '1 day' - (g % 86400) * interval '1 second'
FROM generate_series(1, 200000) AS g
JOIN customers c ON c.customer_id = 1 + (g % 10000);

INSERT INTO inventory (sku, available) VALUES
('SKU-RED', 10), ('SKU-BLUE', 5), ('SKU-GREEN', 0);

INSERT INTO jobs (payload, available_at)
SELECT jsonb_build_object('order_id', g), now() - interval '1 minute'
FROM generate_series(1, 100) AS g;

ANALYZE;
~~~

Ghi lại phiên bản và cấu hình chính trước khi làm:

~~~sql
SELECT version();
SHOW work_mem;
SHOW random_page_cost;
SHOW effective_cache_size;
~~~

## A. Multiple choice — chọn và giải thích

### PG-01 — MVCC và VACUUM

Một transaction ở trạng thái idle in transaction giữ snapshot cũ trong nhiều giờ. Hậu quả trực tiếp đáng lo nhất là gì?

A. WAL lập tức bị xóa  
B. VACUUM không thể dọn một số dead tuples còn có thể được snapshot đó nhìn thấy  
C. Mọi SELECT khác bị khóa  
D. Primary key tự mất hiệu lực

### PG-02 — Partial index

Có index:

~~~sql
CREATE INDEX orders_pending_idx ON orders (created_at) WHERE status = 'pending';
~~~

Query nào có khả năng dùng index này ổn định nhất?

A. WHERE status IN ('pending', 'paid')  
B. WHERE status <> 'cancelled'  
C. WHERE status = 'pending' AND created_at >= now() - interval '1 day'  
D. WHERE coalesce(status, 'pending') = 'pending'

### PG-03 — Tạo index online

Phát biểu đúng về CREATE INDEX CONCURRENTLY là:

A. Có thể đặt trong transaction block để rollback thuận tiện  
B. Không khóa bất kỳ thao tác nào và luôn kết thúc trong một scan  
C. Không được chạy trong transaction block; thất bại có thể để lại index invalid  
D. Nhanh và ít I/O hơn CREATE INDEX thường

### PG-04 — Isolation

Ở READ COMMITTED, hai transaction cùng đọc available = 1 rồi đều ghi available = 0 dựa trên giá trị đã đọc. Vấn đề thiết kế chính là:

A. Dirty read  
B. Lost update hoặc logic check-then-act không nguyên tử  
C. Phantom không thể tránh  
D. WAL corruption

### PG-05 — Index-only scan

Một index có INCLUDE đủ cột cho SELECT nhưng heap fetches vẫn rất cao. Giải thích hợp lý nhất là:

A. INCLUDE vô hiệu với kiểu bigint  
B. Visibility map chưa đánh dấu nhiều page all-visible nên executor vẫn phải kiểm tra heap  
C. Index-only scan không tồn tại trong PostgreSQL  
D. Primary key phải bị xóa trước

### PG-06 — BRIN

Workload phù hợp nhất với BRIN là:

A. Bảng rất lớn, created_at tương quan với thứ tự vật lý, query theo khoảng thời gian  
B. Bảng nhỏ, tìm email duy nhất  
C. JSONB containment tùy ý  
D. ORDER BY ngẫu nhiên

### PG-07 — work_mem

Điều nào đúng?

A. work_mem là giới hạn RAM toàn server  
B. Mỗi query chỉ dùng đúng một work_mem  
C. Nhiều sort/hash node và worker có thể mỗi node dùng một phần work_mem  
D. Tăng work_mem luôn làm query nhanh hơn và không có rủi ro

### PG-08 — Partition pruning

Bảng range partition theo created_at. Điều kiện nào giúp pruning rõ ràng nhất?

A. WHERE date(created_at) = DATE '2026-08-27'  
B. WHERE created_at >= TIMESTAMPTZ '2026-08-27 00:00+07' AND created_at < TIMESTAMPTZ '2026-08-28 00:00+07'  
C. WHERE to_char(created_at, 'YYYY-MM-DD') = '2026-08-27'  
D. WHERE extract(day FROM created_at) = 27

### PG-09 — HOT update

Điều kiện thuận lợi cho HOT update là:

A. Cập nhật cột nằm trong mọi index  
B. Cập nhật cột không được index và page còn chỗ cho tuple mới  
C. Bảng không có primary key  
D. autovacuum bị tắt

### PG-10 — Replication slot

Một logical replication consumer ngừng đọc nhưng slot vẫn active/inactive và retained WAL tăng. Rủi ro chính là:

A. Disk của primary đầy vì WAL không được recycle  
B. Mất tất cả index trên subscriber  
C. VACUUM tự chuyển thành VACUUM FULL  
D. Query tự chuyển sang serializable

## B. Explain why — giải thích cơ chế

### PG-11 — MVCC

Vì sao một UPDATE tạo tuple version mới thay vì ghi đè tại chỗ? xmin/xmax và snapshot giúp reader/writer không chặn nhau như thế nào?

### PG-12 — Cardinality estimate

Vì sao planner ước lượng sai nghiêm trọng khi hai cột country và city tương quan? Nêu cách kiểm tra và ít nhất hai hướng khắc phục.

### PG-13 — Composite index

Giải thích leftmost-prefix bằng index (tenant_id, status, created_at DESC). Query nào được lợi, query nào không? Vì sao đặt tenant_id đầu thường quan trọng trong SaaS đa tenant?

### PG-14 — Serializable

Vì sao SERIALIZABLE không có nghĩa là ứng dụng sẽ không bao giờ thấy lỗi? Ứng dụng phải xử lý SQLSTATE 40001 thế nào?

### PG-15 — Backup

Vì sao chỉ có streaming replica không được xem là chiến lược backup? Phân biệt RPO/RTO và nêu phép thử phục hồi tối thiểu.

## C. Hidden bugs — tìm, tái hiện, sửa

### PG-16 — Non-sargable timestamp

Query dashboard sau chậm khi bảng lớn:

~~~sql
SELECT count(*)
FROM orders
WHERE tenant_id = 7
  AND date(created_at) = CURRENT_DATE;
~~~

Chỉ ra lỗi ẩn liên quan đến index/time zone, viết lại query và đề xuất index.

### PG-17 — NOT IN và NULL

Vì sao query có thể trả 0 hàng ngoài dự kiến?

~~~sql
SELECT c.customer_id
FROM customers c
WHERE c.customer_id NOT IN (
    SELECT o.customer_id
    FROM orders o
    WHERE o.status = 'cancelled'
    UNION ALL
    SELECT NULL
);
~~~

Viết phiên bản an toàn.

### PG-18 — LEFT JOIN biến thành INNER JOIN

Mục tiêu là liệt kê mọi customer và số paid order 30 ngày qua. Query sau làm mất customer chưa có order:

~~~sql
SELECT c.customer_id, count(o.order_id)
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.status = 'paid'
  AND o.created_at >= now() - interval '30 days'
GROUP BY c.customer_id;
~~~

Sửa query và giải thích vị trí predicate.

### PG-19 — Job queue bị xử lý lặp

Hai worker chạy SELECT sau, sau đó mới UPDATE bằng một câu riêng:

~~~sql
SELECT job_id, payload
FROM jobs
WHERE status = 'ready' AND available_at <= now()
ORDER BY job_id
LIMIT 10;
~~~

Thiết kế lại thao tác claim job để worker không lấy trùng nhau. Nêu vì sao SKIP LOCKED vẫn không thay thế idempotency.

### PG-20 — Connection pool và idle transaction

API mở transaction, SELECT một hàng, gọi HTTP service 30 giây rồi COMMIT. Khi tải cao, pool cạn và bloat tăng. Hãy chỉ ra ít nhất ba vấn đề và đưa ra biện pháp có thể kiểm chứng qua catalog/config.

### PG-21 — Online index thất bại

Một migration CREATE INDEX CONCURRENTLY bị cancel. Lần chạy sau báo relation already exists, nhưng planner không dùng index. Viết query kiểm tra trạng thái và quy trình sửa an toàn.

## D. SQL writing

### PG-22 — Latest row per group

Viết hai cách lấy order mới nhất của từng customer thuộc tenant 7: một cách dùng DISTINCT ON, một cách dùng window function. Đề xuất index và quy tắc tie-break.

### PG-23 — Keyset pagination

Thay OFFSET bằng keyset pagination cho danh sách paid order của tenant 7, sắp xếp created_at DESC, order_id DESC. Viết query trang đầu, trang kế và index tương ứng.

### PG-24 — Reserve inventory nguyên tử

Viết một statement đặt trước 3 sản phẩm SKU-RED chỉ khi available đủ; trả lại số lượng còn lại. Giải thích cách phân biệt hết hàng với SKU không tồn tại.

### PG-25 — Partial covering index

Endpoint thường xuyên đọc 100 pending order mới nhất của một tenant, chỉ cần order_id, customer_id, total_amount, created_at. Viết index phục vụ access pattern và query kiểm chứng bằng EXPLAIN (ANALYZE, BUFFERS).

### PG-26 — Upsert có điều kiện phiên bản

Tạo bảng customer_profiles có khóa (tenant_id, customer_id), cột payload jsonb và source_version bigint. Viết upsert chỉ cập nhật khi source_version mới lớn hơn phiên bản đang lưu để chống event đến sai thứ tự.

## E. Execution-plan analysis

Mỗi câu phải nêu: dấu hiệu trong plan, giả thuyết nguyên nhân, query kiểm chứng và thay đổi ít rủi ro nhất.

### PG-27 — Ước lượng lệch

~~~text
Seq Scan on orders  (cost=0.00..48000.00 rows=12 width=40)
                      (actual time=0.042..810.221 rows=182000 loops=1)
  Filter: ((tenant_id = 7) AND (status = 'paid'))
  Rows Removed by Filter: 18000
  Buffers: shared hit=1500 read=21000
Planning Time: 0.320 ms
Execution Time: 829.470 ms
~~~

Điều gì đáng ngờ? Không được mặc định kết luận “seq scan luôn xấu”.

### PG-28 — Nested loop bùng nổ

~~~text
Nested Loop  (actual time=0.090..2400.000 rows=200000 loops=1)
  -> Seq Scan on customers c (actual rows=10000 loops=1)
  -> Index Scan using orders_customer_id_idx on orders o
       (actual rows=20 loops=10000)
       Index Cond: (customer_id = c.customer_id)
       Filter: (status = 'paid')
       Rows Removed by Filter: 45
~~~

Plan nói gì về tổng công việc? Đề xuất index/query/statistics phù hợp tùy selectivity.

### PG-29 — Sort spill

~~~text
Sort  (actual time=910.000..1040.000 rows=900000 loops=1)
  Sort Key: created_at DESC
  Sort Method: external merge  Disk: 148000kB
  -> Seq Scan on orders_archive (actual rows=900000 loops=1)
Buffers: shared hit=8000 read=64000, temp read=18500 written=18600
~~~

Bạn sẽ đo và sửa theo thứ tự nào? Vì sao SET work_mem thật lớn ở cấp global có thể gây sự cố?

### PG-30 — Bitmap lossy

~~~text
Bitmap Heap Scan on events (actual rows=420000 loops=1)
  Recheck Cond: (tenant_id = 9)
  Rows Removed by Index Recheck: 730000
  Heap Blocks: exact=3200 lossy=18000
  -> Bitmap Index Scan on events_tenant_idx (actual rows=420000 loops=1)
~~~

Giải thích exact/lossy, nguyên nhân thường gặp và ít nhất ba lựa chọn xử lý có trade-off.

## F. Curriculum expansion — PG-31..PG-45

Mỗi câu phần này tối đa 4 điểm: kết luận/correctness, SQL hoặc bằng chứng, trade-off và production pitfall.

### PG-31 — Domain, generated column và tenant uniqueness

Viết DDL cho invoice_line dùng domain positive_money, quantity dương, line_total generated từ quantity × unit_price, và uniqueness (tenant_id, invoice_id, line_no). Nêu điều gì xảy ra khi muốn thay đổi rule của domain trên dữ liệu đã tồn tại.

### PG-32 — Deferred và exclusion constraints

Một hệ thống booking cần cho phép tạm thời đổi hai slot trong cùng transaction nhưng trạng thái cuối không được overlap cho cùng room. Thiết kế exclusion constraint có thể defer tới COMMIT và giải thích range boundary [).

### PG-33 — Idempotency record và outbox

API chỉ đặt UNIQUE(idempotency_key), nhưng retry cùng key với payload khác vẫn trả response cũ. Hãy thiết kế scope + request_hash và transaction tạo order/outbox. Nêu failure mode nếu publish broker nằm trong transaction database.

### PG-34 — WAL và durability contract

Phân biệt wal_level, fsync, full_page_writes và synchronous_commit. Nếu chỉ một report-import chấp nhận mất vài transaction vừa ACK khi OS crash, setting nào có thể đặt cục bộ mà không làm cluster mất khả năng recovery cấu trúc?

### PG-35 — Checkpoint, FPI và WAL vượt max_wal_size

Sau checkpoint, wal_bytes/wal_fpi tăng mạnh; pg_wal đôi lúc lớn hơn max_wal_size. Giải thích hai hiện tượng, viết query PostgreSQL 17 lấy checkpoint/WAL evidence và đề xuất tuning có guardrail.

### PG-36 — Preflight DDL và add column

Migration chạy ALTER TABLE big_orders ADD COLUMN token uuid DEFAULT gen_random_uuid() NOT NULL vào bảng nhiều TB. Vì sao có thể rewrite/lock lâu khác với constant default? Viết preflight lock query và chiến lược expand/backfill phù hợp.

### PG-37 — Online backfill và NOT NULL

Viết quy trình keyset batch có thể resume để backfill big_orders.token, sau đó dùng CHECK NOT VALID → VALIDATE → SET NOT NULL. Nêu cách throttle và chứng minh không bỏ sót concurrent writes.

### PG-38 — Unique/FK online và expand-contract

Sắp xếp các bước an toàn để thêm unique constraint từ concurrent index, thêm foreign key NOT VALID, và đổi tên/type column khi hai phiên bản ứng dụng cùng chạy. Chỉ ra lệnh nào không được nằm trong transaction block.

### PG-39 — Extension lifecycle và dependency

Viết query inventory extension installed/available, version và dependencies. Vì sao DROP EXTENSION ... CASCADE hoặc ALTER EXTENSION UPDATE trực tiếp trên production là nguy hiểm? Đưa ra release sequence.

### PG-40 — Major upgrade decision

So sánh pg_upgrade, dump/restore và logical-replication blue/green theo downtime, disk, rollback và compatibility. Sau OS/ICU hoặc major upgrade phải kiểm tra collation/statistics/index thế nào?

### PG-41 — Capacity budget

Một workload có 40 query đồng thời; mỗi query có 2 sort/hash nodes, tối đa 3 processes kể cả parallel workers, work_mem = 64 MB. Tính upper-bound thô cho riêng operation memory. Viết SQL tính disk growth/day và runway từ hai snapshot size cách nhau 24 giờ.

### PG-42 — Deadline và cancellation

Ứng dụng bắt statement_timeout, sau đó tiếp tục query trên cùng transaction và nhận current transaction is aborted. Giải thích đúng lifecycle; phân biệt statement_timeout, lock_timeout, idle_in_transaction_session_timeout, pg_cancel_backend và pg_terminate_backend.

### PG-43 — JSONB, full-text và trigram

Cho product(metadata jsonb, name text, description text). Viết:

- query/index cho metadata @> {"color":"red"};
- generated search_vector + GIN cho tìm kiếm từ vựng;
- pg_trgm index cho substring/typo trên name.

Giải thích vì sao một GIN index không phục vụ mọi operator/biểu thức.

### PG-44 — RLS và SECURITY DEFINER

Pool dùng SET app.tenant_id ở cấp session và function SECURITY DEFINER có search_path = public, app. Hãy chỉ ra hai lỗ hổng, viết policy tenant mẫu và hardening function/role. Thiết kế test chứng minh tenant A không đọc/ghi tenant B.

### PG-45 — PITR/HA/observability incident

Primary sắp đầy disk: archive failed, một logical slot inactive giữ WAL, standby lag tăng. Viết query triage PostgreSQL 17, thứ tự quyết định an toàn, và recovery drill chứng minh PITR. Vì sao drop slot, promote standby hoặc restart primary ngay lập tức có thể làm sự cố nặng hơn?

## Checklist nộp bài

- [ ] Đã ghi phiên bản PostgreSQL và cấu hình liên quan.
- [ ] Mọi câu plan đều trích đúng evidence, không chỉ nêu mẹo chung.
- [ ] Mọi index đề xuất đều nêu chi phí ghi, dung lượng và trường hợp không dùng được.
- [ ] Query dùng timestamp có biên dưới/biên trên và time zone rõ ràng.
- [ ] Thao tác concurrent có transaction boundary và retry/idempotency.
- [ ] EXPLAIN ANALYZE trên lệnh ghi được bọc BEGIN/ROLLBACK.
- [ ] Đã ghi confidence 1–5 cho từng câu.
