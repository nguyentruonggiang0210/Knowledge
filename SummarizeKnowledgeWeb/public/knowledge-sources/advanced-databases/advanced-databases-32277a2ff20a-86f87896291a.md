# Practical labs — Lời giải tham khảo

Đây không phải output chuẩn duy nhất. Plan và timing thay đổi theo máy, version, cache và phân phối dữ liệu. Một bài làm đạt yêu cầu phải có bằng chứng của chính người học.

## PG-L01 — Sargability và covering index

**Lời giải mẫu:**

~~~sql
SET search_path = quiz_pg, public;

EXPLAIN (ANALYZE, BUFFERS, SETTINGS)
SELECT order_id, total_amount
FROM orders
WHERE tenant_id = 7
  AND date(created_at) = CURRENT_DATE;

CREATE INDEX CONCURRENTLY orders_tenant_created_cover_idx
ON orders (tenant_id, created_at)
INCLUDE (order_id, total_amount);

WITH local_day AS (
  SELECT (now() AT TIME ZONE 'Asia/Bangkok')::date AS d
), b AS (
  SELECT d::timestamp AT TIME ZONE 'Asia/Bangkok' AS lo,
         (d + 1)::timestamp AT TIME ZONE 'Asia/Bangkok' AS hi
  FROM local_day
)
SELECT order_id, total_amount
FROM orders o CROSS JOIN b
WHERE tenant_id = 7
  AND created_at >= b.lo AND created_at < b.hi;

EXPLAIN (ANALYZE, BUFFERS, SETTINGS)
WITH local_day AS (
  SELECT (now() AT TIME ZONE 'Asia/Bangkok')::date AS d
), b AS (
  SELECT d::timestamp AT TIME ZONE 'Asia/Bangkok' AS lo,
         (d + 1)::timestamp AT TIME ZONE 'Asia/Bangkok' AS hi
  FROM local_day
)
SELECT order_id, total_amount
FROM orders o CROSS JOIN b
WHERE tenant_id = 7
  AND created_at >= b.lo AND created_at < b.hi;
~~~

Đối soát bằng EXCEPT hai chiều hoặc count + sum trên cùng bounds. VACUUM phải chạy ngoài BEGIN:

~~~sql
VACUUM (ANALYZE) quiz_pg.orders;

UPDATE quiz_pg.orders
SET total_amount = total_amount
WHERE order_id % 5 = 0;

SELECT n_tup_upd, n_tup_hot_upd, n_dead_tup, last_vacuum
FROM pg_stat_user_tables
WHERE schemaname = 'quiz_pg' AND relname = 'orders';
~~~

**Vì sao:** range trực tiếp mở index access path. INCLUDE có thể cho index-only scan, nhưng UPDATE làm page mất all-visible cho tới vacuum; heap fetches có thể tăng.

**Bẫy production:** total_amount nằm trong INCLUDE nên update cột này vẫn phải cập nhật index, không HOT. Index rộng tăng WAL/disk; planner chọn seq scan trên bảng nhỏ hoặc range rộng là hợp lý.

## PG-L02 — Race condition và job queue

**Tái hiện:** ở A/B cùng BEGIN và SELECT available = 5. Nếu application cả hai tính 5 - 4 = 1 rồi chạy SET available = 1, lần ghi sau đè logic của lần trước; hệ thống đã nhận hai reservation nhưng stock chỉ giảm một lần.

Sửa inventory:

~~~sql
UPDATE quiz_pg.inventory
SET available = available - 4,
    version = version + 1
WHERE sku = 'SKU-RED' AND available >= 4
RETURNING available, version;
~~~

Claim jobs ở mỗi worker, đổi worker_id:

~~~sql
WITH picked AS (
  SELECT job_id
  FROM quiz_pg.jobs
  WHERE status = 'ready' AND available_at <= now()
  ORDER BY job_id
  FOR UPDATE SKIP LOCKED
  LIMIT 10
)
UPDATE quiz_pg.jobs j
SET status = 'running', worker_id = 'worker-A',
    locked_at = clock_timestamp(), attempts = attempts + 1
FROM picked
WHERE j.job_id = picked.job_id
RETURNING j.job_id;
~~~

Reaper dùng lease và lock để không tranh worker đang hoàn tất:

~~~sql
WITH expired AS (
  SELECT job_id
  FROM quiz_pg.jobs
  WHERE status = 'running'
    AND locked_at < now() - interval '5 minutes'
    AND attempts < 5
  FOR UPDATE SKIP LOCKED
)
UPDATE quiz_pg.jobs j
SET status = 'ready', worker_id = NULL, locked_at = NULL,
    available_at = now() + interval '10 seconds'
FROM expired e
WHERE j.job_id = e.job_id
RETURNING j.job_id;
~~~

Idempotency skeleton:

~~~sql
CREATE TABLE IF NOT EXISTS quiz_pg.reservations (
  reservation_id text PRIMARY KEY,
  sku text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

BEGIN;
INSERT INTO quiz_pg.reservations (reservation_id, sku, quantity)
VALUES ('request-20260827-001', 'SKU-RED', 4)
ON CONFLICT DO NOTHING
RETURNING reservation_id;
-- Chỉ khi INSERT trả row mới chạy UPDATE nguyên tử; nếu UPDATE không trả row thì ROLLBACK.
COMMIT;
~~~

**Vì sao:** lock giải quyết cạnh tranh trong database; idempotency key giải quyết retry ở ranh giới network.

**Bẫy production:** giữ transaction mở trong lúc xử lý job/network call kéo dài row locks. Job có thể chạy lại sau crash, nên side effect downstream vẫn phải idempotent.

## PG-L03 — Skew và plan stability

**Lời giải mẫu:**

~~~sql
PREPARE skew_q(integer, text) AS
SELECT count(*)
FROM quiz_pg.skew_orders
WHERE tenant_id = $1 AND status = $2;

SET plan_cache_mode = force_custom_plan;
EXPLAIN (ANALYZE, BUFFERS, SETTINGS) EXECUTE skew_q(1, 'paid');
EXPLAIN (ANALYZE, BUFFERS, SETTINGS) EXECUTE skew_q(99, 'pending');

SET plan_cache_mode = force_generic_plan;
EXPLAIN (ANALYZE, BUFFERS, SETTINGS) EXECUTE skew_q(1, 'paid');
EXPLAIN (ANALYZE, BUFFERS, SETTINGS) EXECUTE skew_q(99, 'pending');

SELECT name, generic_plans, custom_plans
FROM pg_prepared_statements WHERE name = 'skew_q';

ALTER TABLE quiz_pg.skew_orders
  ALTER COLUMN tenant_id SET STATISTICS 1000;
ALTER TABLE quiz_pg.skew_orders
  ALTER COLUMN status SET STATISTICS 1000;
CREATE STATISTICS skew_tenant_status (mcv, dependencies)
ON tenant_id, status FROM quiz_pg.skew_orders;
ANALYZE quiz_pg.skew_orders;
~~~

Report nên tính estimate factor = greatest(actual, estimate) / greatest(1, least(actual, estimate)). Tenant 1 có thể đúng với seq scan vì lấy phần lớn rows; rare tenant có thể lợi index-only/range scan.

**Vì sao:** MCV/extended statistics cho planner biết skew và correlation mà histogram độc lập bỏ lỡ. Custom plan thấy parameter; generic plan phải chọn một plan chung.

**Bẫy production:** force_custom_plan tăng planning CPU; force_generic_plan có tail latency xấu với tenant lệch. Không đặt toàn server trước khi đo prepared-statement workload thật.

## PG-L04 — HOT, bloat và snapshot

**Setup/runs:**

~~~sql
DROP TABLE IF EXISTS quiz_pg.hot100, quiz_pg.hot70;
CREATE TABLE quiz_pg.hot100
  (id bigint PRIMARY KEY, payload text, flag integer) WITH (fillfactor = 100);
CREATE TABLE quiz_pg.hot70
  (id bigint PRIMARY KEY, payload text, flag integer) WITH (fillfactor = 70);

INSERT INTO quiz_pg.hot100
SELECT g, repeat('x', 80), 0 FROM generate_series(1, 200000) g;
INSERT INTO quiz_pg.hot70 SELECT * FROM quiz_pg.hot100;

UPDATE quiz_pg.hot100 SET flag = flag + 1;
UPDATE quiz_pg.hot70 SET flag = flag + 1;
-- Lặp năm vòng, rồi yêu cầu stats collector flush nếu version hỗ trợ.
SELECT pg_stat_force_next_flush();

SELECT relname, n_tup_upd, n_tup_hot_upd, n_dead_tup,
       pg_size_pretty(pg_total_relation_size(relid)) AS total
FROM pg_stat_user_tables
WHERE schemaname = 'quiz_pg' AND relname IN ('hot100', 'hot70');

CREATE INDEX hot70_flag_idx ON quiz_pg.hot70(flag);
UPDATE quiz_pg.hot70 SET flag = flag + 1;
~~~

Session A:

~~~sql
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT count(*) FROM quiz_pg.hot70;
-- Giữ transaction để B thay đổi dữ liệu và vacuum.
~~~

Session B:

~~~sql
UPDATE quiz_pg.hot70 SET payload = payload || 'y' WHERE id % 2 = 0;
VACUUM (VERBOSE, ANALYZE) quiz_pg.hot70;
SELECT pid, xact_start, backend_xmin, state
FROM pg_stat_activity WHERE xact_start IS NOT NULL;
~~~

Sau COMMIT ở A, VACUUM lại. VACUUM thường đánh dấu space để reuse nhưng không nhất thiết trả file về OS; VACUUM FULL rewrite và khóa mạnh.

**Vì sao:** fillfactor 70 dành page space cho version mới; index lên cột flag khiến update flag không đủ điều kiện HOT.

**Bẫy production:** relation size có thể tăng do tuple rộng/TOAST/checkpoint khác, không chỉ HOT. Không chạy VACUUM FULL production theo phản xạ; đo lock/disk/RTO và cân nhắc pg_repack nếu chính sách cho phép.

## PG-L05 — Partition lifecycle

**DDL mẫu theo thời điểm khóa học:**

~~~sql
DROP TABLE IF EXISTS quiz_pg.orders_partitioned CASCADE;
CREATE TABLE quiz_pg.orders_partitioned
(
  order_id bigint NOT NULL,
  tenant_id integer NOT NULL,
  customer_id bigint NOT NULL,
  status text NOT NULL,
  total_amount numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (order_id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE quiz_pg.orders_p202606 PARTITION OF quiz_pg.orders_partitioned
FOR VALUES FROM ('2026-06-01 00:00+00') TO ('2026-07-01 00:00+00');
CREATE TABLE quiz_pg.orders_p202607 PARTITION OF quiz_pg.orders_partitioned
FOR VALUES FROM ('2026-07-01 00:00+00') TO ('2026-08-01 00:00+00');
CREATE TABLE quiz_pg.orders_p202608 PARTITION OF quiz_pg.orders_partitioned
FOR VALUES FROM ('2026-08-01 00:00+00') TO ('2026-09-01 00:00+00');
CREATE TABLE quiz_pg.orders_default PARTITION OF quiz_pg.orders_partitioned DEFAULT;

INSERT INTO quiz_pg.orders_partitioned
SELECT order_id, tenant_id, customer_id, status, total_amount, created_at, updated_at
FROM quiz_pg.orders;

EXPLAIN (ANALYZE, BUFFERS)
SELECT sum(total_amount) FROM quiz_pg.orders_partitioned
WHERE created_at >= TIMESTAMPTZ '2026-08-10 00:00+00'
  AND created_at < TIMESTAMPTZ '2026-08-11 00:00+00';
~~~

Trước khi tạo September partition, kiểm tra/move mọi September row khỏi default. ATTACH một standalone table có CHECK bound giúp PostgreSQL tránh hoặc giảm validation scan nếu constraint được chứng minh:

~~~sql
SELECT count(*) FROM quiz_pg.orders_default
WHERE created_at >= TIMESTAMPTZ '2026-09-01 00:00+00'
  AND created_at < TIMESTAMPTZ '2026-10-01 00:00+00';

CREATE TABLE quiz_pg.orders_p202609
  (LIKE quiz_pg.orders_partitioned INCLUDING DEFAULTS INCLUDING CONSTRAINTS);
ALTER TABLE quiz_pg.orders_p202609 ADD CONSTRAINT orders_p202609_bound
CHECK (created_at >= TIMESTAMPTZ '2026-09-01 00:00+00'
   AND created_at < TIMESTAMPTZ '2026-10-01 00:00+00');
ALTER TABLE quiz_pg.orders_partitioned ATTACH PARTITION quiz_pg.orders_p202609
FOR VALUES FROM ('2026-09-01 00:00+00') TO ('2026-10-01 00:00+00');
~~~

Nếu default có matching rows, ATTACH sẽ cần xử lý chúng trước và có locking. Retention an toàn: đối soát bounds/count/checksum, DETACH PARTITION, backup/archive, quan sát một retention window, rồi mới DROP detached table.

**Vì sao:** partition pruning dựa bound/key, còn default là safety net cần alert; key unique toàn bảng phải chứa created_at vì local indexes không enforce order_id xuyên partition độc lập.

**Bẫy production:** time zone ở bounds, lock lúc attach/detach và foreign key dependency dễ bị bỏ quên. Default partition có dữ liệu trong bound mới có thể làm attach fail hoặc scan/lock lâu.

## PG-L06 — Integrity và zero-downtime migration

**Setup mẫu:**

~~~sql
DROP SCHEMA IF EXISTS migration_lab CASCADE;
CREATE SCHEMA migration_lab;
CREATE TABLE migration_lab.orders (
  order_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id integer NOT NULL,
  status text NOT NULL,
  amount numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO migration_lab.orders(tenant_id,status,amount,created_at)
SELECT CASE WHEN g <= 180000 THEN 1 ELSE 2 + g % 100 END,
       CASE WHEN g % 5 = 0 THEN 'pending' ELSE 'paid' END,
       (10 + g % 10000)::numeric / 100,
       now() - (g % 90) * interval '1 day'
FROM generate_series(1,300000) g;
ANALYZE migration_lab.orders;

SELECT pg_total_relation_size('migration_lab.orders') AS bytes_before,
       pg_current_wal_lsn() AS lsn_before;
ALTER TABLE migration_lab.orders
ADD COLUMN source text DEFAULT 'api' NOT NULL;
~~~

Constant default thường dùng fast path; không dùng kết quả này để suy ra volatile default cũng nhanh. Expand token:

~~~sql
ALTER TABLE migration_lab.orders ADD COLUMN token uuid;
ALTER TABLE migration_lab.orders ALTER COLUMN token SET DEFAULT gen_random_uuid();

WITH batch AS (
  SELECT order_id FROM migration_lab.orders
  WHERE token IS NULL
  ORDER BY order_id
  LIMIT 5000
  FOR UPDATE SKIP LOCKED
)
UPDATE migration_lab.orders o
SET token = gen_random_uuid()
FROM batch b WHERE o.order_id=b.order_id
RETURNING o.order_id;
-- Lặp tới zero; lưu max ID/rows mỗi batch và chạy final NULL sweep.

ALTER TABLE migration_lab.orders
ADD CONSTRAINT orders_token_nn CHECK(token IS NOT NULL) NOT VALID;
ALTER TABLE migration_lab.orders VALIDATE CONSTRAINT orders_token_nn;
ALTER TABLE migration_lab.orders ALTER COLUMN token SET NOT NULL;
~~~

Build/attach uniqueness:

~~~sql
CREATE UNIQUE INDEX CONCURRENTLY orders_tenant_token_uq_idx
ON migration_lab.orders(tenant_id,token);
ALTER TABLE migration_lab.orders
ADD CONSTRAINT orders_tenant_token_uq
UNIQUE USING INDEX orders_tenant_token_uq_idx;

SELECT c.relname,i.indisready,i.indisvalid,pg_get_indexdef(i.indexrelid)
FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid
WHERE c.relname='orders_tenant_token_uq_idx';
~~~

Nếu cancel concurrent build và thấy indisvalid=false, xác minh đúng index rồi DROP INDEX CONCURRENTLY và build lại; các lệnh concurrent không nằm trong transaction block.

Lock evidence:

~~~sql
SELECT a.pid,a.state,a.xact_start,l.mode,l.granted,
       pg_blocking_pids(a.pid) AS blockers,left(a.query,100)
FROM pg_stat_activity a
JOIN pg_locks l ON l.pid=a.pid
WHERE l.relation='migration_lab.orders'::regclass;
~~~

Idempotency/outbox skeleton:

~~~sql
CREATE TABLE migration_lab.idempotency (
  tenant_id integer, action text, key text, request_hash bytea,
  response jsonb, PRIMARY KEY(tenant_id,action,key)
);
CREATE TABLE migration_lab.outbox (
  outbox_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id integer, order_id bigint, version bigint, payload jsonb,
  UNIQUE(tenant_id,order_id,version)
);

BEGIN;
-- Insert/compare request hash, update order, then insert outbox.
UPDATE migration_lab.orders SET status='paid'
WHERE tenant_id=1 AND order_id=42 AND status='pending';
INSERT INTO migration_lab.outbox(tenant_id,order_id,version,payload)
VALUES(1,42,1,'{"status":"paid"}');
COMMIT;
~~~

**Vì sao:** expand-contract giữ schema tương thích; batch/validate tách bounded work khỏi metadata lock; concurrent index giảm write blocking; outbox giữ state + intent nguyên tử.

**Bẫy production:** SKIP LOCKED có thể bỏ row đang khóa nên cần nhiều pass/final validation. DDL chờ lock có thể tạo queue; invalid index vẫn có write cost; request key cùng hash khác phải conflict, không trả response cũ.

## PG-L07 — WAL, capacity, timeout và upgrade readiness

**Baseline:**

~~~sql
SELECT wal_records,wal_fpi,wal_bytes,wal_buffers_full,stats_reset
FROM pg_stat_wal;
SELECT num_timed,num_requested,write_time,sync_time,buffers_written,stats_reset
FROM pg_stat_checkpointer;
SELECT pg_size_pretty(sum(size)) FROM pg_ls_waldir();
SELECT pg_size_pretty(pg_database_size(current_database()));
SHOW wal_level; SHOW fsync; SHOW full_page_writes;
SHOW synchronous_commit; SHOW work_mem;
~~~

Ghi output trước/sau workload thay vì reset counters giữa bài:

~~~sql
DROP TABLE IF EXISTS quiz_pg.wal_probe;
CREATE TABLE quiz_pg.wal_probe(id bigint, payload text);
CHECKPOINT;
INSERT INTO quiz_pg.wal_probe
SELECT g,repeat(md5(g::text),4) FROM generate_series(1,200000) g;

BEGIN;
SET LOCAL synchronous_commit=off;
INSERT INTO quiz_pg.wal_probe VALUES(999999,'replay-safe-import');
COMMIT;
~~~

Tính budget như PG-41, nhưng thay literals bằng snapshot định kỳ của pg_database_size, pg_wal bytes, archive/slot retained bytes. Upper-bound operation memory phải nhân concurrency × plan nodes × workers × work_mem và cộng headroom hệ thống.

Timeout timeline bằng hai sessions:

~~~sql
-- A
BEGIN; UPDATE quiz_pg.inventory SET version=version+1 WHERE sku='SKU-RED';

-- B
BEGIN;
SET LOCAL lock_timeout='500ms';
SET LOCAL statement_timeout='2s';
UPDATE quiz_pg.inventory SET version=version+1 WHERE sku='SKU-RED';
-- Sau timeout transaction aborted; ROLLBACK trước mọi query tiếp.
ROLLBACK;
~~~

Từ session admin lab, xác minh PID/query rồi thử pg_cancel_backend; chỉ pg_terminate_backend khi hiểu rollback cost.

Upgrade inventory:

~~~sql
SELECT extname,extversion FROM pg_extension ORDER BY 1;
SELECT datname,datcollversion,
       pg_database_collation_actual_version(oid) AS actual
FROM pg_database WHERE datallowconn;
SELECT name,default_version,installed_version
FROM pg_available_extensions ORDER BY name;
~~~

Logical restore drill bằng container root:

~~~powershell
docker exec database-advance-postgres pg_dump -U student -d lab -Fc -f /tmp/lab_assessment.dump
docker exec database-advance-postgres createdb -U student lab_restore
docker exec database-advance-postgres pg_restore -U student -d lab_restore --clean --if-exists /tmp/lab_assessment.dump
docker exec database-advance-postgres psql -U student -d lab_restore -c "SELECT count(*) FROM quiz_pg.orders"
~~~

PITR artifact phải liệt kê base backup, WAL liên tục, timeline/history, restore target có timezone/LSN, config/key/extensions và invariant. Major-upgrade ADR so pg_upgrade, dump/restore, logical blue-green cùng disk/downtime/failback.

**Vì sao:** WAL/durability, capacity và upgrade là contract có số đo; restore mới chứng minh backup usable.

**Bẫy production:** synchronous_commit=off có thể mất transaction đã ACK sau crash; không tắt fsync/full_page_writes. createdb sẽ fail nếu lab_restore đã tồn tại—dùng tên run mới, không drop nhầm. pg_upgrade link mode có rollback discipline đặc biệt.

## CH-L01 — Sort key benchmark

**DDL/query mẫu:**

~~~sql
USE quiz_ch;
DROP TABLE IF EXISTS events_bad;
CREATE TABLE events_bad AS events
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY event_id;

INSERT INTO events_bad
  (event_time, event_id, tenant_id, user_id, event_type, properties, revenue, ingested_at)
SELECT event_time, event_id, tenant_id, user_id, event_type, properties, revenue, ingested_at
FROM events;

EXPLAIN indexes = 1
SELECT count(), sum(revenue)
FROM events
WHERE tenant_id = 7 AND event_date >= today() - 7 AND event_type = 'purchase';

EXPLAIN indexes = 1
SELECT count(), sum(revenue)
FROM events_bad
WHERE tenant_id = 7 AND event_date >= today() - 7 AND event_type = 'purchase';

SYSTEM FLUSH LOGS;
SELECT query, query_duration_ms, read_rows, read_bytes, result_rows, memory_usage
FROM system.query_log
WHERE type = 'QueryFinish' AND query LIKE '%sum(revenue)%'
ORDER BY event_time DESC LIMIT 10;
~~~

events thắng tenant/date query; events_bad thắng direct event_id lookup. Thử device index:

~~~sql
ALTER TABLE events ADD INDEX device_bf properties['device']
TYPE bloom_filter(0.01) GRANULARITY 4;
ALTER TABLE events MATERIALIZE INDEX device_bf;

EXPLAIN indexes = 1
SELECT count() FROM events
WHERE tenant_id = 7 AND properties['device'] = 'mobile';
~~~

**Vì sao:** sort key quyết định locality chính; skipping index chỉ loại granules theo summary/probabilistic membership.

**Bẫy production:** với chỉ ba device phân bố đều, mỗi granule có thể chứa mobile nên bloom filter không bỏ được gì. MATERIALIZE rewrite/đọc parts và tốn tài nguyên; rollback bằng DROP INDEX không hoàn lại chi phí đã dùng.

## CH-L02 — Part explosion

**Setup:**

~~~sql
USE quiz_ch;
DROP TABLE IF EXISTS events_tiny;
DROP TABLE IF EXISTS events_batch;
CREATE TABLE events_tiny AS events;
CREATE TABLE events_batch AS events;
~~~

PowerShell minh họa 50 inserts riêng với container của root compose:

~~~powershell
1..50 | ForEach-Object { docker exec database-advance-clickhouse clickhouse-client --user student --password student_pass --database quiz_ch --query "INSERT INTO events_tiny (event_time,event_id,tenant_id,user_id,event_type,properties,revenue) SELECT now64(3),generateUUIDv4(),7,toUInt64($_),'view',map('device','mobile'),toDecimal64(0,2)" }
~~~

Cùng dữ liệu theo batch:

~~~sql
INSERT INTO events_batch
  (event_time, event_id, tenant_id, user_id, event_type, properties, revenue)
SELECT now64(3), generateUUIDv4(), 7, number + 1, 'view',
       map('device', 'mobile'), toDecimal64(0, 2)
FROM numbers(50);

SELECT table, count() AS active_parts, sum(rows) AS rows,
       round(rows / active_parts, 2) AS rows_per_part
FROM system.parts
WHERE database = 'quiz_ch' AND table IN ('events_tiny', 'events_batch') AND active
GROUP BY table;
~~~

Async test dùng cùng 50 calls nhưng thêm SETTINGS async_insert = 1, wait_for_async_insert = 1. Policy mẫu: flush khi 10.000–100.000 rows, 1–10 MB hoặc 200 ms, tùy SLO; giới hạn số partition trong một batch.

**Vì sao:** một batch tạo ít part lớn hơn, giảm metadata và merge amplification.

**Bẫy production:** background merge có thể làm active part count hội tụ trước khi đo. Với async insert, token/settings khác nhau chia queue; wait = 0 làm client khó biết flush error.

## CH-L03 — Eventual dedup

**Lời giải mẫu:**

~~~sql
DROP TABLE IF EXISTS quiz_ch.entity_updates;
CREATE TABLE quiz_ch.entity_updates
(
  tenant_id UInt32,
  entity_id UInt64,
  version UInt64,
  event_id UUID,
  status LowCardinality(String),
  amount Decimal(12,2),
  updated_at DateTime64(3, 'UTC')
)
ENGINE = ReplacingMergeTree(version)
ORDER BY (tenant_id, entity_id);

INSERT INTO quiz_ch.entity_updates VALUES
(7, 42, 1, generateUUIDv4(), 'new', 10, now64(3));
INSERT INTO quiz_ch.entity_updates VALUES
(7, 42, 3, generateUUIDv4(), 'paid', 30, now64(3));
INSERT INTO quiz_ch.entity_updates VALUES
(7, 42, 2, generateUUIDv4(), 'approved', 20, now64(3));

SELECT * FROM quiz_ch.entity_updates WHERE tenant_id = 7 AND entity_id = 42;
SELECT * FROM quiz_ch.entity_updates FINAL WHERE tenant_id = 7 AND entity_id = 42;

SELECT tenant_id, entity_id,
       argMax(tuple(status, amount, updated_at),
              tuple(version, updated_at, event_id)) AS latest
FROM quiz_ch.entity_updates
GROUP BY tenant_id, entity_id;
~~~

Insert hai row cùng version khác payload để chứng minh business contract thiếu total order. event_id phải ổn định khi retry; version nên monotonic theo aggregate. Tombstone có is_deleted và serving query lọc trạng thái latest, không lọc tombstone trước argMax.

**Vì sao:** nếu WHERE is_deleted = 0 chạy trước argMax, version cũ có thể “sống lại”. Phải chọn latest rồi mới quyết định deleted.

**Bẫy production:** ReplacingMergeTree chỉ xét rows có cùng ORDER BY key; đưa version vào ORDER BY sẽ làm các version không còn cùng dedup key. OPTIMIZE FINAL không bảo đảm duy trì uniqueness cho inserts tương lai.

## CH-L04 — MV và cutoff

**Lời giải mẫu:** dùng DDL daily_event_agg ở CH-25. Ghi T0 một lần và paste cùng literal vào mọi query, ví dụ:

~~~sql
SELECT now64(3, 'UTC') AS cutoff_t0;
~~~

Tạo MV trước khi ingest batch live. Sau đó backfill miền cũ:

~~~sql
INSERT INTO quiz_ch.daily_event_agg
SELECT event_date AS d, tenant_id, event_type,
       uniqCombined64State(user_id) AS users_state,
       sumState(revenue) AS revenue_state
FROM quiz_ch.events
WHERE ingested_at < toDateTime64('2026-08-27 12:00:00.000', 3, 'UTC')
GROUP BY d, tenant_id, event_type;
~~~

Thay literal bằng T0 thực tế. Đối soát revenue:

~~~sql
SELECT event_date AS d, tenant_id, event_type, sum(revenue) AS source_revenue
FROM quiz_ch.events
GROUP BY d, tenant_id, event_type
ORDER BY d, tenant_id, event_type;

SELECT d, tenant_id, event_type, sumMerge(revenue_state) AS target_revenue
FROM quiz_ch.daily_event_agg
GROUP BY d, tenant_id, event_type
ORDER BY d, tenant_id, event_type;
~~~

Đối soát users phải so uniqCombined64 với uniqCombined64Merge, chấp nhận cùng approximate semantics. Nếu overlap đã double count additive state, cách an toàn thường là rebuild partition/bucket vào shadow target rồi replace/attach, không cố trừ uniq state.

**Vì sao:** cutoff theo ingested_at chia chính xác rows source được MV thấy sau creation và rows backfill trước đó.

**Bẫy production:** clock/time zone và late event làm event_time không phải cutoff tốt. MV failure/target schema mismatch cần monitor; source mutation không phát correction tự động.

## CH-L05 — Retention và mutation

**Lời giải mẫu:**

~~~sql
DROP TABLE IF EXISTS quiz_ch.retention_lab;
CREATE TABLE quiz_ch.retention_lab AS quiz_ch.events
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (tenant_id, event_date, event_type, user_id, event_time, event_id)
TTL event_time + INTERVAL 30 DAY DELETE;

INSERT INTO quiz_ch.retention_lab
  (event_time,event_id,tenant_id,user_id,event_type,properties,revenue,ingested_at)
SELECT event_time,event_id,tenant_id,user_id,event_type,properties,revenue,ingested_at
FROM quiz_ch.events;

ALTER TABLE quiz_ch.retention_lab
DELETE WHERE tenant_id = 1 AND event_type = 'click';

SELECT mutation_id, parts_to_do, is_done, latest_fail_reason
FROM system.mutations
WHERE database = 'quiz_ch' AND table = 'retention_lab';
~~~

Lấy partition id thực tế trước thao tác:

~~~sql
SELECT partition, count(), sum(rows), formatReadableSize(sum(bytes_on_disk))
FROM system.parts
WHERE database = 'quiz_ch' AND table = 'retention_lab' AND active
GROUP BY partition ORDER BY partition;

ALTER TABLE quiz_ch.retention_lab DETACH PARTITION '202608';
SELECT * FROM system.detached_parts
WHERE database = 'quiz_ch' AND table = 'retention_lab';
ALTER TABLE quiz_ch.retention_lab ATTACH PARTITION '202608';
~~~

Chỉ dùng partition tồn tại trên máy bạn. Runbook cần precheck row/bytes, free disk, merge/mutation backlog, replica health, maintenance window, query SLO, verify count và đường attach/restore.

**Vì sao:** detach là reversible trong lab khi detached part còn nguyên; TTL/mutation reclaim vật lý qua merge, không nhất thiết ngay khi SELECT không thấy row.

**Bẫy production:** không DROP detached part trước khi hết rollback window. Trên replicated table, lệnh ON CLUSTER, ZooKeeper/Keeper state và replica lag cần được kiểm tra riêng.

## CH-L06 — Dictionary serving, cache và schema-quality cutover

Tạo dimension/dictionary theo CH-31, sau đó inject duplicate có chủ đích:

~~~sql
INSERT INTO ecommerce.product_dimension VALUES
(1001,'Tên conflict','books',99.00,1,now64(3));

SELECT product_id,count() AS versions
FROM ecommerce.product_dimension
GROUP BY product_id HAVING versions != 1;

SYSTEM RELOAD DICTIONARY ecommerce.product_dict;
SELECT * FROM system.dictionaries
WHERE database='ecommerce' AND name='product_dict';
~~~

So ALL/ANY/direct và lưu query_log:

~~~sql
SELECT count() FROM ecommerce.events e
ALL INNER JOIN ecommerce.product_dimension d USING(product_id)
SETTINGS join_algorithm='parallel_hash';

SELECT count() FROM ecommerce.events e
LEFT ANY JOIN ecommerce.product_dict d USING(product_id)
SETTINGS join_algorithm='direct';

SYSTEM FLUSH LOGS;
SELECT query_id,query_duration_ms,read_rows,memory_usage,exception_code
FROM system.query_log WHERE type='QueryFinish'
ORDER BY event_time DESC LIMIT 20;
~~~

ANY/direct chỉ đạt nếu contract one-to-one và duplicate check bằng zero. Cache stale test dùng block CH-35; report phải ghi TTL, endpoint cho phép stale và system.events hit/miss.

Workload lab:

~~~sql
CREATE RESOURCE quiz_cpu (MASTER THREAD, WORKER THREAD);
CREATE WORKLOAD quiz_all;
CREATE WORKLOAD quiz_dashboard IN quiz_all SETTINGS weight=3;
CREATE WORKLOAD quiz_backfill IN quiz_all SETTINGS weight=1;
SELECT * FROM system.scheduler;
~~~

Nếu user thiếu ACCESS MANAGEMENT hoặc server config không hỗ trợ scheduling, lưu exact error/version và nộp blueprint; không cấp quyền rộng chỉ để pass lab.

Shadow cutover tối thiểu:

~~~sql
CREATE TABLE ecommerce.quiz_orders_shadow
(
  order_id UInt64, amount_cents UInt64, currency LowCardinality(String),
  created_at DateTime64(3,'UTC')
)
ENGINE=MergeTree ORDER BY (currency,created_at,order_id);

INSERT INTO ecommerce.quiz_orders_shadow
SELECT order_id,toUInt64(roundBankers(total_amount*100)),'USD',updated_at
FROM ecommerce.orders FINAL;

SELECT count(),sum(amount_cents),groupBitXor(cityHash64(order_id,amount_cents))
FROM ecommerce.quiz_orders_shadow;
-- So source theo cùng cutoff; chỉ EXCHANGE với table lab compatible đã chuẩn bị.
~~~

Quality path dùng một source có reasons Array(String), clean MV WHERE empty(reasons) và reject MV WHERE NOT empty(reasons). Acceptance invariant:

~~~sql
SELECT
 (SELECT count() FROM ecommerce.quality_ingest) AS input,
 (SELECT count() FROM ecommerce.quality_clean) AS accepted,
 (SELECT count() FROM ecommerce.quality_reject) AS rejected,
 input = accepted + rejected AS balanced;
~~~

**Vì sao:** lab buộc correctness JOIN, freshness, resource fairness, migration và quality gate cùng có evidence/rollback.

**Bẫy production:** dictionary duplicate winner/staleness, cache sharing, EXCHANGE dependencies và two-MV delivery đều cần contract. Không coi balanced count là đủ; so keys/sum/hash và drill-down mismatch.

## CH-L07 — Kafka/Redpanda ingestion recovery (optional, resource-heavy)

Từ root repository, chỉ chạy nếu máy đủ tài nguyên và root stack không xung đột:

~~~powershell
docker compose -f docker-compose.yml -f LessionClickHouse/docker-compose.integrations.yml --profile streaming up -d
docker compose -f docker-compose.yml -f LessionClickHouse/docker-compose.integrations.yml --profile streaming ps
docker compose -f docker-compose.yml -f LessionClickHouse/docker-compose.integrations.yml --profile streaming exec redpanda rpk topic create ecommerce-events-v1 -p 3 -X brokers=redpanda:9092
~~~

Dùng DDL CH-34 nhưng tạo target/reject tables trước hai MVs. Giữ kafka_group_name riêng cho lab. Gửi hai valid JSON rows, một malformed row và retry một event_id không đổi.

~~~sql
SELECT count() AS physical,uniqExact(event_id) AS unique_events
FROM ecommerce.events_stream;
SELECT error,count() FROM ecommerce.kafka_rejects GROUP BY error;

SELECT database,table,consumer_id,assignments.topic,
       assignments.partition_id,assignments.current_offset,
       last_poll_time,last_commit_time,num_messages_read,exceptions.text
FROM system.kafka_consumers WHERE database='ecommerce';
~~~

Để tạo lag, DETACH cả valid và reject materialized views, produce thêm messages, lấy broker end offsets bằng rpk, rồi ATTACH cả hai. Đo thời gian current offsets bắt kịp và event_time → ingested_at.

Serving dedup minh họa:

~~~sql
SELECT event_id,argMax(tuple(event_time,event_type,product_id,price),ingested_at) AS latest
FROM ecommerce.events_stream
GROUP BY event_id;
~~~

Reconcile theo bucket event_id với count, uniq, sum và groupBitXor; raw physical duplicate được phép nhưng serving business metric phải ổn định.

Cleanup scoped: drop chỉ quiz Kafka tables/MVs/topic sau khi lưu evidence, rồi stop riêng Redpanda; không thêm --volumes vào root stack.

~~~powershell
docker compose -f docker-compose.yml -f LessionClickHouse/docker-compose.integrations.yml --profile streaming stop redpanda
~~~

**Vì sao:** Kafka→MV→MergeTree là at-least-once có failure window; stable identity + reject path + lag/reconcile tạo recovery contract.

**Bẫy production:** nếu chỉ detach một trong nhiều MVs, Kafka source vẫn có thể được consume. Direct SELECT có offset semantics. Topic retention phải dài hơn outage; raw rejects có PII; số consumers hữu ích không vượt partitions.

## X-L01 — PostgreSQL outbox sang ClickHouse

**PostgreSQL source/outbox:**

~~~sql
ALTER TABLE quiz_pg.orders
ADD COLUMN IF NOT EXISTS source_version bigint NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS quiz_pg.order_outbox
(
  event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id integer NOT NULL,
  aggregate_id bigint NOT NULL,
  source_version bigint NOT NULL,
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  published_at timestamptz,
  UNIQUE (aggregate_id, source_version)
);

BEGIN;
WITH changed AS (
  UPDATE quiz_pg.orders
  SET status = 'paid', source_version = source_version + 1,
      updated_at = clock_timestamp()
  WHERE order_id = 42
  RETURNING *
)
INSERT INTO quiz_pg.order_outbox
  (tenant_id, aggregate_id, source_version, event_type, occurred_at, payload)
SELECT tenant_id, order_id, source_version, 'order.changed', updated_at,
       jsonb_build_object('status', status, 'total_amount', total_amount)
FROM changed;
COMMIT;
~~~

**ClickHouse raw log:**

~~~sql
CREATE TABLE IF NOT EXISTS quiz_ch.order_events_raw
(
  event_id UInt64,
  tenant_id UInt32,
  aggregate_id UInt64,
  source_version UInt64,
  event_type LowCardinality(String),
  occurred_at DateTime64(6, 'UTC'),
  ingested_at DateTime64(3, 'UTC') DEFAULT now64(3),
  is_deleted UInt8 DEFAULT 0,
  status LowCardinality(String),
  total_amount Decimal(12,2)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(occurred_at)
ORDER BY (tenant_id, aggregate_id, source_version, event_id);
~~~

Pipeline export/import có thể dùng JSONEachRow; checkpoint chỉ được advance sau ClickHouse ack. Retry cùng event_id được chấp nhận ở raw, serving query dedup hai tầng:

~~~sql
WITH dedup_event AS
(
  SELECT event_id, tenant_id, aggregate_id, source_version,
         argMax(tuple(is_deleted, status, total_amount, occurred_at), ingested_at) AS body
  FROM quiz_ch.order_events_raw
  GROUP BY event_id, tenant_id, aggregate_id, source_version
), latest_order AS
(
  SELECT tenant_id, aggregate_id,
         argMax(body, tuple(source_version, event_id)) AS latest
  FROM dedup_event
  GROUP BY tenant_id, aggregate_id
)
SELECT * FROM latest_order
WHERE tupleElement(latest, 1) = 0;
~~~

Reconciliation tối thiểu theo window so PostgreSQL outbox count, max(event_id), count published; ClickHouse count, uniqExact(event_id), max(source_version) và lag giữa occurred_at/ingested_at. Failure matrix:

| Điểm crash | Trạng thái | Recovery |
|---|---|---|
| trước commit source | không order/outbox | client retry transaction |
| sau commit, trước publish | outbox chưa published | poller đọc lại |
| sau CH insert, trước ack/checkpoint | có thể duplicate | retry cùng event_id; serving dedup |
| sau ack, trước mark published | có thể duplicate | như trên, reconciliation phát hiện |

**Vì sao:** outbox làm business write và publish intent nguyên tử trong PostgreSQL; at-least-once delivery + stable identity + reconciliation tạo hệ chịu lỗi thực tế.

**Bẫy production:** đánh dấu published trước destination ack gây mất event; sau ack gây duplicate khi crash. OFFSET/checkpoint đơn độc không thay idempotency, và xóa outbox quá sớm phá replay/audit.

## Dọn dữ liệu lab

Chỉ sau khi xác nhận current database là lab, có thể drop các object quiz được nêu rõ. Không xóa Docker volume để reset một lab đơn lẻ.

~~~sql
-- PostgreSQL: xóa toàn bộ schema quiz nếu thật sự muốn reset
SELECT current_database(), current_user;
DROP SCHEMA quiz_pg CASCADE;

-- ClickHouse: chạy ở client riêng và xác nhận database trước
SELECT currentDatabase(), currentUser();
DROP DATABASE quiz_ch;
~~~

Đây là thao tác phá hủy toàn bộ kết quả quiz trong hai schema/database; hãy export evidence trước.
