# 10 — Observability và troubleshooting theo bằng chứng

Observability tốt trả lời được: chuyện gì xảy ra, bắt đầu khi nào, query/tenant nào gây ra, tài nguyên nào bão hòa, ai đang chặn ai, và thay đổi gần nhất là gì.

## Scenario và trade-off map

| Knowledge item | Scenario production | Trade-off cần quyết định |
|---|---|---|
| Activity/wait event | live incident triage | State tức thời rõ; snapshot dễ bỏ spike và query text nhạy cảm |
| Lock graph | root blocker và lock convoy | Xác định dependency; cancel/terminate sai tạo rollback blast radius |
| `pg_stat_statements` | top fingerprint theo total/I/O/calls | Aggregate rẻ/hữu ích; che parameter skew/tail và cần preload/memory |
| Table/index/database stats | churn, scan, unused index trend | Coverage built-in; cumulative estimate/reset không phải ground truth tức thời |
| `pg_stat_io` | phân biệt backend/checkpointer/vacuum I/O | Cluster I/O evidence; không thấy toàn bộ OS/storage stack |
| Progress views | vacuum/index/rewrite đang chạy tới đâu | Cho phase/counter; phần trăm không luôn tuyến tính và có thể chờ lock |
| WAL/archive/replication | disk/DR/lag health | Bảo vệ durability; metric semantics khác nhau cần rate + state + heartbeat |
| Logging | slow/lock/autovacuum forensic | Chi tiết; threshold thấp tạo log storm/PII/I/O cost |
| Runbooks | slow query, lock, connection, bloat | Response lặp lại được; runbook cũ/sai version nguy hiểm nếu không drill |
| Dashboard/alerts | SLO, saturation, recovery risk | Phát hiện sớm; metric cardinality/alert fatigue cần owner và action |

## 1. Activity, transaction và wait event

```sql
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    wait_event_type,
    wait_event,
    backend_start,
    xact_start,
    query_start,
    state_change,
    left(query, 200) AS query
FROM pg_stat_activity
WHERE datname = current_database()
ORDER BY xact_start NULLS LAST, query_start NULLS LAST;
```

`state='active'` chưa chắc đang dùng CPU; nếu có `wait_event`, backend đang chờ lock/I/O/client/... `idle in transaction` là transaction mở nhưng client không gửi query.

```sql
SELECT
    pid,
    now() - xact_start AS transaction_age,
    now() - state_change AS state_age,
    wait_event_type,
    wait_event,
    left(query, 160) AS last_query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_start;
```

> **Bug ẩn / production — query text:** Query có thể chứa literal/token/PII. Hạn chế quyền xem monitoring, dùng parameterized SQL, redact log/export và đặt retention phù hợp.

> **Bug ẩn / production — kết luận từ state:** Một snapshot có thể bỏ lỡ spike hoặc hiểu sai client đang idle. Lấy chuỗi thời gian, rate và correlate CPU/I/O/log/deploy.

## 2. Lock graph và blocker

```sql
SELECT
    blocked.pid AS blocked_pid,
    blocked.usename AS blocked_user,
    now() - blocked.query_start AS blocked_for,
    blocker.pid AS blocker_pid,
    blocker.usename AS blocker_user,
    blocker.state AS blocker_state,
    now() - blocker.xact_start AS blocker_xact_age,
    left(blocked.query, 120) AS blocked_query,
    left(blocker.query, 120) AS blocker_query
FROM pg_stat_activity AS blocked
CROSS JOIN LATERAL unnest(pg_blocking_pids(blocked.pid)) AS b(blocker_pid)
JOIN pg_stat_activity AS blocker ON blocker.pid = b.blocker_pid
ORDER BY blocked_for DESC;
```

Xem lock cụ thể:

```sql
SELECT
    l.pid,
    l.locktype,
    l.mode,
    l.granted,
    l.relation::regclass,
    l.transactionid,
    l.virtualxid
FROM pg_locks AS l
WHERE NOT l.granted
ORDER BY l.pid, l.locktype;
```

**Tình huống thực tế:** Một session `idle in transaction` giữ row lock, hàng trăm API request chờ; CPU thấp nhưng latency tăng.

> **Bug ẩn / production — kill blocker:** Blocker đầu chuỗi có thể là transaction quan trọng và rollback rất lâu. Ưu tiên liên hệ owner/cancel statement (`pg_cancel_backend`), chỉ terminate sau khi hiểu side effect/rollback, rồi sửa timeout/transaction boundary gốc.

```sql
-- Thay PID đã xác minh; không chạy mù:
-- SELECT pg_cancel_backend(12345);
-- SELECT pg_terminate_backend(12345, 5000); -- timeout hỗ trợ ở phiên bản mới
```

## 3. `pg_stat_statements`: query fingerprint

Thêm vào `postgresql.conf` và restart:

```conf
shared_preload_libraries = 'pg_stat_statements'
compute_query_id = auto
pg_stat_statements.track = all
```

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT
    queryid,
    calls,
    round(total_exec_time::numeric, 2) AS total_ms,
    round(mean_exec_time::numeric, 2) AS mean_ms,
    rows,
    shared_blks_hit,
    shared_blks_read,
    temp_blks_written,
    left(query, 180) AS normalized_query
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
ORDER BY total_exec_time DESC
LIMIT 20;
```

Các góc nhìn khác:

```sql
-- Nhiều lần gọi, dù mỗi lần rẻ:
SELECT calls, total_exec_time, mean_exec_time, left(query, 160)
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 10;

-- I/O/temp-heavy:
SELECT calls, shared_blks_read, temp_blks_written, left(query, 160)
FROM pg_stat_statements
ORDER BY shared_blks_read + temp_blks_written DESC
LIMIT 10;
```

> **Bug ẩn / production — average:** Mean che tail latency và parameter skew. Extension aggregate theo normalized fingerprint; một query ID có thể gồm tenant nhỏ/lớn với plan khác nhau. Kết hợp log sampling/trace và percentile ở application/proxy.

> **Bug ẩn / production — reset:** Counters tích lũy từ `stats_reset`; restart/reset làm rate sai. Lưu timestamp và scrape delta. Không gọi `pg_stat_statements_reset()` giữa incident trước khi export snapshot.

> **Bug ẩn / production — queryid:** Query ID có thể thay đổi giữa major/version/config và không phải business identifier vĩnh viễn. Dashboard phải chịu được churn.

## 4. Database, table và index statistics

```sql
SELECT
    datname,
    xact_commit,
    xact_rollback,
    deadlocks,
    conflicts,
    blks_read,
    blks_hit,
    temp_files,
    pg_size_pretty(temp_bytes) AS temp_bytes,
    stats_reset
FROM pg_stat_database
WHERE datname = current_database();

SELECT
    schemaname,
    relname,
    seq_scan,
    seq_tup_read,
    idx_scan,
    n_live_tup,
    n_dead_tup,
    n_mod_since_analyze,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 20;

SELECT
    schemaname,
    relname,
    indexrelname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;
```

> **Bug ẩn / production — cache hit ratio:** `blks_hit/(hit+read)` không phải OS/device cache hit và một tỷ lệ cao vẫn có thể đi cùng nhiều I/O tuyệt đối. Theo dõi latency, throughput và block rates, không có “99% là luôn tốt”.

> **Bug ẩn / production — unused index:** `idx_scan=0` có thể do stats vừa reset, index phục vụ constraint/rare critical query hoặc index-only stats semantics. Inventory một chu kỳ nghiệp vụ đầy đủ và dependency trước drop.

## 5. I/O observability với `pg_stat_io` (PostgreSQL 16+)

```sql
SHOW track_io_timing;

SELECT
    backend_type,
    object,
    context,
    reads,
    read_time,
    writes,
    write_time,
    hits,
    evictions,
    fsyncs,
    fsync_time,
    stats_reset
FROM pg_stat_io
ORDER BY reads + writes DESC NULLS LAST;
```

**Tình huống thực tế:** Phân biệt client backend đọc nhiều với autovacuum/checkpointer write pressure, rồi correlate storage latency.

> **Bug ẩn / production — timing disabled:** Khi `track_io_timing=off`, count vẫn hữu ích nhưng time có thể bằng 0. Bật timing có overhead phụ thuộc hệ thống; benchmark và bật có chủ đích.

> **Bug ẩn / production — database view không đủ:** PostgreSQL không thấy toàn bộ filesystem queue/cache/network-attached storage. Kết hợp OS/container/cloud metrics; đừng chẩn đoán disk chỉ từ một catalog.

## 6. Vacuum và index build progress

```sql
SELECT
    pid,
    relid::regclass AS table_name,
    phase,
    heap_blks_total,
    heap_blks_scanned,
    heap_blks_vacuumed,
    index_vacuum_count
FROM pg_stat_progress_vacuum;

-- Các cột dead-item chi tiết đổi giữa major versions;
-- xem tài liệu đúng version trước khi thêm vào exporter.

SELECT
    pid,
    relid::regclass AS table_name,
    index_relid::regclass AS index_name,
    command,
    phase,
    lockers_total,
    lockers_done,
    blocks_total,
    blocks_done
FROM pg_stat_progress_create_index;
```

Các cột đếm dead-item chi tiết đổi tên/semantics giữa PostgreSQL 16 và 17; query baseline trên chỉ dùng tập cột chung.

> **Bug ẩn / production — phần trăm:** Không phải mọi phase có total ổn định; progress có thể đứng khi chờ lock và concurrent index có nhiều scan/validation phase. Xem `wait_event` và log, không kill chỉ vì phần trăm không đổi.

## 7. WAL, archive và replication health

```sql
SELECT pg_size_pretty(sum(size)) AS pg_wal_directory_size
FROM pg_ls_waldir();

SELECT
    archived_count,
    failed_count,
    last_archived_time,
    last_failed_time,
    stats_reset
FROM pg_stat_archiver;

SELECT
    slot_name,
    active,
    restart_lsn,
    wal_status,
    pg_size_pretty(
        pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)
    ) AS retained
FROM pg_replication_slots;
```

> **Bug ẩn / production — disk alert:** Disk “còn 20%” không đủ nếu WAL tăng 100 GB/giờ. Alert cả free bytes và time-to-full dựa trên rate; phân biệt archive failure, inactive slot, long backup và high write burst.

> **Bug ẩn / production — privileged views:** `pg_ls_waldir` và query text/other sessions cần quyền cao. Monitoring role dùng predefined roles/quyền tối thiểu, không cấp superuser cho exporter.

## 8. Logging có kiểm soát

Các setting tham khảo, điều chỉnh theo workload và chính sách dữ liệu:

```conf
log_line_prefix = '%m [%p] %q%u@%d app=%a '
log_min_duration_statement = '500ms'
log_lock_waits = on
deadlock_timeout = '1s'
log_autovacuum_min_duration = '1s'
log_checkpoints = on
log_temp_files = '100MB'
```

Kiểm tra runtime:

```sql
SELECT name, setting, unit, source, pending_restart
FROM pg_settings
WHERE name IN (
    'log_min_duration_statement',
    'log_lock_waits',
    'deadlock_timeout',
    'log_autovacuum_min_duration',
    'log_checkpoints',
    'log_temp_files'
)
ORDER BY name;
```

> **Bug ẩn / production — log storm:** `log_statement='all'` hoặc threshold quá thấp trên OLTP tạo I/O, chi phí ingest và rò PII/password trong SQL. Sampling/normalized metrics thường tốt hơn; bảo vệ và giới hạn retention.

> **Bug ẩn / production — duration only:** Query chờ lock 10 s rồi chạy 1 ms vẫn log là chậm nhưng execution plan không phải gốc lỗi. Correlate wait event/lock log và transaction ID/request ID.

## 9. Runbook A — query chậm

```sql
SELECT
    pid,
    now() - query_start AS age,
    wait_event_type,
    wait_event,
    left(query, 180) AS query
FROM pg_stat_activity
WHERE state = 'active'
  AND pid <> pg_backend_pid()
ORDER BY query_start;
```

1. Xác định spike toàn hệ thống hay một fingerprint/parameter.
2. Nếu chờ, xử lý dependency (lock/I/O/pool) trước plan.
3. Nếu đang chạy, lấy plan an toàn trên replica/staging hoặc `EXPLAIN` không ANALYZE.
4. Kiểm tra estimate, buffers, spill, loops, stats và deploy gần nhất.
5. Cancel có chọn lọc nếu vượt error budget; fix rồi đo regression.

> **Bug ẩn / production — `EXPLAIN ANALYZE` cứu hỏa:** Chạy lại query khổng lồ trên primary đang quá tải có thể đẩy hệ thống qua điểm sụp. Bắt đầu bằng activity, fingerprint, plain `EXPLAIN`, log auto-explain sampling hoặc replica an toàn.

## 10. Runbook B — lock storm

1. Chụp lock graph và transaction age.
2. Tìm root blocker, owner, request/deploy/migration.
3. Dừng traffic gây thêm hàng chờ nếu cần.
4. Cancel/terminate theo tác động nhỏ nhất.
5. Theo dõi rollback và queue drain.
6. Sửa lock ordering, index FK, batch size, migration `lock_timeout`.

```sql
SELECT
    wait_event_type,
    wait_event,
    count(*)
FROM pg_stat_activity
WHERE state <> 'idle'
GROUP BY wait_event_type, wait_event
ORDER BY count(*) DESC;
```

> **Bug ẩn / production — thundering retry:** Khi blocker biến mất, hàng trăm request/retry cùng chạy làm CPU/I/O spike. Retry phải exponential backoff + jitter, queue/concurrency limit và idempotency.

## 11. Runbook C — connection exhaustion

```sql
SELECT
    usename,
    application_name,
    state,
    count(*) AS sessions,
    max(now() - state_change) AS max_state_age
FROM pg_stat_activity
WHERE backend_type = 'client backend'
GROUP BY usename, application_name, state
ORDER BY sessions DESC;
```

1. Dùng reserved admin access, xác định service/pool nào tăng.
2. Phân biệt active work, idle pool, idle-in-transaction và auth storm.
3. Giảm admission/rate, sửa leak hoặc pool budget.
4. Không chỉ tăng `max_connections`; kiểm tra memory/CPU và DB capacity.

> **Bug ẩn / production — metric thiếu label:** Nếu `application_name` trống hoặc mọi pod giống nhau, không tìm được owner. Driver phải đặt application name gồm service/deployment, nhưng tránh label theo request gây cardinality cao.

## 12. Runbook D — autovacuum/bloat

```sql
SELECT
    schemaname,
    relname,
    n_live_tup,
    n_dead_tup,
    n_mod_since_analyze,
    last_autovacuum,
    last_autoanalyze,
    autovacuum_count,
    autoanalyze_count
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 30;
```

1. Xác định table tăng dead tuples và update rate.
2. Tìm long transaction, slot/subscriber giữ xmin.
3. Kiểm tra worker/cost/I/O và progress.
4. Tune per table, chạy vacuum thường nếu cần.
5. Chỉ rewrite/reindex khi đo được bloat ảnh hưởng và có disk/lock/WAL window.

> **Bug ẩn / production — chữa triệu chứng:** Reindex mỗi tuần không sửa update pattern, fillfactor, long transaction hoặc autovacuum không theo kịp. Sau reclaim phải xử lý rate/cause.

## 13. Dashboard tối thiểu và alert có hành động

- traffic: transactions/s, query calls/s, rows/s;
- saturation: CPU, disk latency/queue, memory, connection/pool queue;
- latency/error: app percentile, DB fingerprint, timeout/rollback/deadlock;
- maintenance: dead tuples, vacuum/analyze age, XID age, bloat trend;
- durability: WAL rate, archive freshness/failure, slot retention;
- replication: receiver state, byte/replay lag, timeline;
- capacity: database/table/index size, disk time-to-full.

Prometheus exporters và Grafana đều có lựa chọn miễn phí, nhưng dashboard chỉ hữu ích khi metric có owner/runbook.

> **Bug ẩn / production — alert fatigue:** Alert trên mọi spike làm người trực bỏ qua. Alert symptom ảnh hưởng SLO hoặc trạng thái sắp không phục hồi (disk/XID/WAL), kèm ngưỡng theo thời gian, owner và câu lệnh chẩn đoán an toàn.

## Bài tập

1. Tạo lock chain ba session và vẽ blocker graph từ query trên.
2. Tạo sort spill, tìm fingerprint trong `pg_stat_statements` và temp block counters.
3. Mô phỏng slot inactive/WAL tăng trong lab, tính time-to-full.
4. Viết một incident report: timeline, evidence, root cause, contributing factors, fix và guardrail; không dừng ở “query chậm”.
