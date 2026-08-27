# 08 — Hiệu năng hệ thống, connection pooling, vacuum và bloat

Tối ưu production không chỉ là query nhanh. Mục tiêu là latency ổn định dưới concurrency, không vượt CPU/I/O/memory, và vẫn vacuum/recover được.

## Scenario và trade-off map

| Knowledge item | Scenario production | Trade-off cần quyết định |
|---|---|---|
| Performance budget | SLO percentile dưới concurrency | Đo đúng workload tốn công; không có budget thì tuning không có điểm dừng |
| Connection budget | nhiều pod/service vào một primary | Pool giảm backend/memory; quá nhỏ queue, quá lớn saturation |
| PgBouncer mode | transaction pooling cho OLTP | Density cao; session state/prepared/temp/listen compatibility bị hạn chế |
| Batch/transaction length | ingest/update nhiều row | Giảm round trip/fsync; batch lớn giữ lock/snapshot/WAL/rollback lâu |
| Vacuum/dead tuple | update-heavy queue/session | Reuse space/visibility; dùng I/O nhưng trì hoãn tạo bloat/wraparound |
| Autovacuum tuning | table lớn/hot khác baseline | Theo kịp churn; worker/cost aggressive cạnh tranh foreground |
| Freeze/XID | cluster chạy lâu, nhiều transaction | Bảo vệ wraparound; anti-wraparound vacuum có thể tạo I/O khẩn cấp |
| HOT/fillfactor | update column không indexed | Giảm index churn; fillfactor thấp tăng table/cache footprint |
| Bloat reclaim | table/index lớn sau churn | Rewrite trả disk/performance; lock, extra disk, WAL/replica lag |
| Timeout hierarchy | chờ pool/lock/query theo deadline | Bảo vệ saturation; quá thấp tạo false failure/retry storm |
| Safe rollout | tune/index/vacuum policy | Canary/rollback giảm risk; cần thời gian và observability baseline |

## Chuẩn bị workload update

```sql
DROP SCHEMA IF EXISTS perf_lab CASCADE;
CREATE SCHEMA perf_lab;

CREATE TABLE perf_lab.session_state (
    session_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id bigint NOT NULL,
    status text NOT NULL,
    counter bigint NOT NULL DEFAULT 0,
    payload text NOT NULL DEFAULT repeat('x', 200),
    updated_at timestamptz NOT NULL DEFAULT now()
) WITH (fillfactor = 80);

INSERT INTO perf_lab.session_state (user_id, status)
SELECT g % 10000, 'active'
FROM generate_series(1, 200000) AS g;

CREATE INDEX session_state_user_idx
ON perf_lab.session_state (user_id);

ANALYZE perf_lab.session_state;
```

## 1. Performance budget và throughput/latency

Đặt mục tiêu trước khi chỉnh: ví dụ p95 < 100 ms, 2.000 transaction/s, error rate < 0,1%, replica lag < 5 s, và headroom CPU/I/O 30%.

```sql
SELECT
    datname,
    numbackends,
    xact_commit,
    xact_rollback,
    blks_read,
    blks_hit,
    temp_files,
    pg_size_pretty(temp_bytes) AS temp_written
FROM pg_stat_database
WHERE datname = current_database();
```

**Tình huống thực tế:** Query p50 rất nhanh nhưng p99 tăng khi có checkpoint, autovacuum hoặc 500 request cùng lúc. SLO phải dùng percentile và concurrency đại diện.

> **Bug ẩn / production — benchmark:** Benchmark một connection trên laptop thường đo cache và client, không đo queueing. Dùng data lớn hơn RAM/cache cần đánh giá, warm-up có chủ đích, nhiều mức concurrency và cùng transaction mix production.

## 2. Connection là tài nguyên hữu hạn

Mỗi backend PostgreSQL là process có memory/state. Nhiều connection không đồng nghĩa nhiều throughput; khi vượt số task CPU/I/O có ích, context switching và memory làm latency tăng.

```sql
SHOW max_connections;

SELECT
    backend_type,
    state,
    count(*) AS connections
FROM pg_stat_activity
GROUP BY backend_type, state
ORDER BY backend_type, state;

SELECT
    usename,
    application_name,
    count(*) AS connections,
    max(now() - backend_start) AS oldest_connection
FROM pg_stat_activity
WHERE backend_type = 'client backend'
GROUP BY usename, application_name
ORDER BY connections DESC;
```

Pool budget đơn giản:

```text
usable DB backends
  = max_connections
  - superuser_reserved_connections
  - admin/migration/replication headroom

pool size mỗi service
  phải thỏa tổng(pool_size × số instance) <= usable DB backends
```

> **Bug ẩn / production — pool nhân bản:** Cấu hình pool 20 nghe nhỏ, nhưng 50 pod tạo 1.000 backend. Tính tổng theo autoscaling cực đại và chừa emergency connection cho DBA.

> **Bug ẩn / production — connection leak:** Connection `idle in transaction` vẫn giữ snapshot/lock. Pool timeout không thay application transaction hygiene; theo dõi `xact_start`, đặt `idle_in_transaction_session_timeout` và sửa code path không commit/rollback.

## 3. PgBouncer và pool mode

PgBouncer là connection pooler mã nguồn mở phổ biến:

```ini
[databases]
lab = host=postgres port=5432 dbname=lab

[pgbouncer]
pool_mode = transaction
default_pool_size = 20
reserve_pool_size = 5
max_client_conn = 500
server_reset_query = DISCARD ALL
```

- session pooling: một server connection cho cả client session; tương thích session state nhất.
- transaction pooling: trả backend sau mỗi transaction; density tốt, session state không ổn định.
- statement pooling: hạn chế transaction nhiều statement; ít phù hợp ứng dụng phức tạp.

Kiểm tra code tương thích transaction pooling:

```sql
BEGIN;
SET LOCAL statement_timeout = '2s';
SET LOCAL app.tenant_id = '42';
SELECT current_setting('app.tenant_id');
COMMIT;
```

> **Bug ẩn / production — session state:** Temp table, session advisory lock, `SET` không LOCAL, `LISTEN`, session prepared statement và cursor có thể hỏng/đổi semantics ở transaction pooling. Dùng transaction-scoped state, driver/pooler feature tương thích, hoặc session mode cho workload cần.

> **Bug ẩn / production — double pooling:** Pool lớn trong mỗi app cộng PgBouncer có thể tạo queue ở hai tầng, timeout khó hiểu. Chọn budget/timeout theo một chuỗi rõ ràng và expose queue time.

## 4. Transaction ngắn, batch hợp lý

```sql
-- Một statement nhiều row thay cho 1.000 round trip:
INSERT INTO perf_lab.session_state (user_id, status)
SELECT 1000000 + g, 'active'
FROM generate_series(1, 1000) AS g;

-- Upsert atomic:
INSERT INTO perf_lab.session_state (session_id, user_id, status, counter)
OVERRIDING SYSTEM VALUE
VALUES (1, 1, 'active', 1)
ON CONFLICT (session_id) DO UPDATE
SET counter = perf_lab.session_state.counter + 1,
    updated_at = clock_timestamp()
RETURNING session_id, counter;
```

**Tình huống thực tế:** Batch giảm network round trips và commit/WAL flush, nhưng kích thước phải giữ lock/WAL/memory trong budget.

> **Bug ẩn / production — batch quá lớn:** Một transaction hàng triệu row giữ snapshot/lock lâu, làm replica lag, WAL tăng và rollback đắt. Chia chunk có keyset, idempotency và checkpoint tiến độ; tránh `OFFSET` cho batch mutating.

> **Bug ẩn / production — upsert:** `ON CONFLICT DO UPDATE` vẫn có lock contention ở hot key và trigger có thể chạy. Nếu input batch có duplicate conflict key, statement có thể lỗi “cannot affect row a second time”; deduplicate trước.

## 5. Dead tuple và `VACUUM`

`UPDATE`/`DELETE` tạo dead tuple theo MVCC. Plain `VACUUM` đánh dấu không gian để tái sử dụng và cập nhật visibility map; thường không trả file space về OS.

```sql
UPDATE perf_lab.session_state
SET counter = counter + 1,
    updated_at = clock_timestamp()
WHERE session_id % 2 = 0;

SELECT
    relname,
    n_live_tup,
    n_dead_tup,
    n_tup_upd,
    n_tup_hot_upd,
    last_autovacuum,
    autovacuum_count
FROM pg_stat_user_tables
WHERE schemaname = 'perf_lab';

VACUUM (VERBOSE, ANALYZE) perf_lab.session_state;
```

**Tình huống thực tế:** Bảng queue/session có nhiều update cần autovacuum aggressive hơn bảng append-only cùng kích thước.

> **Bug ẩn / production — vacuum blocking myth:** Plain vacuum không khóa chặn DML như `VACUUM FULL`, nhưng vẫn dùng I/O/CPU và có phase cần lock nhẹ. Tắt autovacuum để tránh load thường biến vấn đề thành bloat/wraparound lớn hơn.

> **Bug ẩn / production — long snapshot:** Vacuum không dọn tuple còn có thể visible với transaction/replication slot cũ. Sửa oldest xmin/slot trước; chạy vacuum liên tục không thắng được blocker.

## 6. Autovacuum threshold và per-table tuning

Vacuum được kích hoạt xấp xỉ khi dead tuples vượt:

```text
autovacuum_vacuum_threshold
  + autovacuum_vacuum_scale_factor × số row ước lượng
```

Với table 1 tỷ row, scale factor mặc định tương đối có thể cho phép rất nhiều dead tuple. Tune theo table:

```sql
ALTER TABLE perf_lab.session_state SET (
    autovacuum_vacuum_scale_factor = 0.02,
    autovacuum_vacuum_threshold = 1000,
    autovacuum_analyze_scale_factor = 0.01,
    autovacuum_analyze_threshold = 1000,
    autovacuum_vacuum_cost_limit = 2000
);

SELECT reloptions
FROM pg_class
WHERE oid = 'perf_lab.session_state'::regclass;
```

> **Bug ẩn / production — tune chỉ threshold:** Worker count, cost delay/limit, I/O capacity và thời lượng một vòng vacuum đều quan trọng. Threshold thấp mà worker luôn bận vẫn không theo kịp. Theo dõi duration/progress và dead tuple growth rate.

> **Bug ẩn / production — statistics estimate:** `n_dead_tup` là estimate, không phải đếm chính xác. Không alert chỉ dựa trên một absolute value; dùng trend, ratio, autovacuum age và query impact.

> **Bug ẩn / production — partition parent:** Autovacuum không tự `ANALYZE` partitioned parent theo cách nhiều người kỳ vọng vì parent không trực tiếp được insert/update. Sau thay đổi phân bố lớn ở partitions, chạy `ANALYZE parent` theo lịch để planner có statistics cần thiết.

## 7. Transaction ID freeze và wraparound

Vacuum freeze transaction IDs cũ để chúng luôn visible và ngăn wraparound. Anti-wraparound vacuum sẽ chạy dù autovacuum bị “tắt” ở table.

```sql
SELECT
    datname,
    age(datfrozenxid) AS xid_age
FROM pg_database
ORDER BY xid_age DESC;

SELECT
    n.nspname,
    c.relname,
    age(c.relfrozenxid) AS xid_age,
    pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r', 'm')
ORDER BY age(c.relfrozenxid) DESC
LIMIT 20;
```

> **Bug ẩn / production — wraparound:** Bỏ qua cảnh báo age có thể dẫn tới emergency autovacuum rất nặng hoặc PostgreSQL từ chối transaction để bảo vệ dữ liệu. Alert từ xa trước `autovacuum_freeze_max_age`; không kill anti-wraparound vacuum tùy tiện.

## 8. HOT update và `fillfactor`

HOT (Heap-Only Tuple) có thể tránh tạo entry mới ở index khi không đổi indexed columns và page còn chỗ.

```sql
SELECT
    relname,
    n_tup_upd,
    n_tup_hot_upd,
    round(100.0 * n_tup_hot_upd / NULLIF(n_tup_upd, 0), 2) AS hot_pct
FROM pg_stat_user_tables
WHERE schemaname = 'perf_lab';

-- counter không indexed, có cơ hội HOT nhờ fillfactor 80:
UPDATE perf_lab.session_state
SET counter = counter + 1
WHERE session_id BETWEEN 1 AND 10000;
```

> **Bug ẩn / production — HOT:** Chỉ cần update một indexed column, kể cả index biểu thức/partial có liên quan, HOT có thể không dùng được. `fillfactor` thấp tăng cơ hội HOT nhưng làm table lớn/cache kém; đổi fillfactor không tự reorganize row cũ.

## 9. Đo bloat và reclaim space

`pgstattuple` là extension contrib miễn phí; phép đo exact có thể đọc/lock đáng kể, nên ưu tiên approximate ở bảng lớn.

```sql
CREATE EXTENSION IF NOT EXISTS pgstattuple;

SELECT *
FROM pgstattuple_approx('perf_lab.session_state'::regclass);

SELECT
    pg_size_pretty(pg_table_size('perf_lab.session_state')) AS table_size,
    pg_size_pretty(pg_indexes_size('perf_lab.session_state')) AS indexes_size,
    pg_size_pretty(pg_total_relation_size('perf_lab.session_state')) AS total_size;
```

Lựa chọn:

- plain `VACUUM`: tái sử dụng space bên trong, ít blocking;
- `REINDEX CONCURRENTLY`: rebuild index với blocking thấp hơn;
- `VACUUM FULL`/`CLUSTER`: rewrite và trả space, nhưng cần thêm disk và lock mạnh;
- online rewrite tool bên ngoài: miễn phí có lựa chọn, nhưng vẫn cần test, disk/WAL/replica budget.

```sql
-- Chỉ chạy trong lab/maintenance window đã đánh giá:
VACUUM (FULL, ANALYZE) perf_lab.session_state;
```

> **Bug ẩn / production — reclaim:** `VACUUM FULL` lấy `ACCESS EXCLUSIVE`, rewrite table, tạo WAL lớn và có thể làm replica lag/disk đầy. Bloat 30% không tự động phải reclaim nếu space sẽ được reuse; tối ưu theo tác động thực.

## 10. Timeout theo tầng

```sql
BEGIN;
SET LOCAL lock_timeout = '1s';
SET LOCAL statement_timeout = '5s';
SET LOCAL idle_in_transaction_session_timeout = '30s';
SELECT count(*) FROM perf_lab.session_state;
COMMIT;
```

- connect timeout: giới hạn thiết lập kết nối ở client;
- pool acquisition timeout: giới hạn chờ connection;
- `lock_timeout`: chờ lock;
- `statement_timeout`: tổng thời gian statement phía server;
- transaction/application deadline: bao toàn workflow.

> **Bug ẩn / production — timeout inversion:** Proxy timeout 2 s nhưng DB statement timeout 30 s khiến client bỏ đi còn DB tiếp tục chạy, làm overload nặng hơn. Deadline phải giảm dần và cancellation được truyền xuống DB.

## 11. Checklist performance thay đổi an toàn

```sql
SELECT
    relname,
    seq_scan,
    idx_scan,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_dead_tup
FROM pg_stat_user_tables
WHERE schemaname = 'perf_lab';
```

1. Baseline latency/throughput/error/resource và query fingerprint.
2. Test correctness/concurrency trước performance.
3. Tính memory theo concurrency, WAL/disk và replica impact.
4. Rollout nhỏ, monitor, có rollback.
5. Không reset statistics giữa sự cố nếu chưa lưu snapshot.

## Bài tập

1. Tính pool budget cho 30 pod, autoscale lên 60, `max_connections=300`, chừa 30 backend vận hành.
2. Chạy update workload với fillfactor 100 và 80, so HOT ratio/size.
3. Giữ một transaction snapshot lâu, update table ở session khác, chứng minh vacuum chưa dọn được.
4. Tạo bloat có kiểm soát, so plain vacuum và full vacuum về lock, file size, WAL và RTO.
