# 15 — Capacity planning, deadlines và query cancellation

Capacity planning trả lời “khi nào hệ hết headroom?”; timeout/cancellation bảo đảm khi vượt budget, một request không chiếm tài nguyên vô hạn và kéo cả hệ xuống. Hai chủ đề phải thiết kế cùng nhau.

## Chuẩn bị snapshot schema

```sql
DROP SCHEMA IF EXISTS capacity_lab CASCADE;
CREATE SCHEMA capacity_lab;

CREATE TABLE capacity_lab.cluster_snapshot (
    captured_at timestamptz PRIMARY KEY,
    database_size_bytes bigint NOT NULL,
    wal_bytes numeric NOT NULL,
    xact_commit bigint NOT NULL,
    xact_rollback bigint NOT NULL,
    connections integer NOT NULL
);

INSERT INTO capacity_lab.cluster_snapshot
SELECT
    clock_timestamp(),
    pg_database_size(current_database()),
    w.wal_bytes,
    d.xact_commit,
    d.xact_rollback,
    d.numbackends
FROM pg_stat_wal AS w
CROSS JOIN pg_stat_database AS d
WHERE d.datname = current_database();

SELECT * FROM capacity_lab.cluster_snapshot ORDER BY captured_at DESC;
```

Chạy snapshot định kỳ bằng scheduler bên ngoài; không dùng high-cardinality metric labels cho từng query/tenant vô hạn.

## 1. Disk budget không chỉ là table size

```sql
SELECT
    n.nspname AS schema_name,
    c.relname,
    c.relkind,
    pg_size_pretty(pg_table_size(c.oid)) AS table_toast_fsm_vm,
    pg_size_pretty(pg_indexes_size(c.oid)) AS indexes,
    pg_size_pretty(pg_total_relation_size(c.oid)) AS total
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r', 'm', 'p')
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(c.oid) DESC
LIMIT 30;

SELECT
    pg_size_pretty(pg_database_size(current_database())) AS database_size,
    pg_size_pretty(COALESCE(sum(size), 0)) AS pg_wal_size
FROM pg_ls_waldir();
```

Disk headroom phải gồm:

```text
live heap + TOAST + indexes
+ expected bloat/dead tuples
+ temp spill
+ retained WAL (checkpoint + archive + slots + backup)
+ migration/reindex/pg_upgrade copy or clone overhead
+ emergency headroom
```

**Scenario:** Table 500 GB có index 400 GB; `REINDEX CONCURRENTLY`/type rewrite cần thêm copy, đồng thời slot giữ 300 GB WAL. “Disk còn 600 GB” vẫn không đủ.

**Trade-off:** Headroom lớn tốn chi phí storage nhưng là capacity cho recovery/migration, không phải lãng phí; tối ưu quá sát làm mọi sự cố thành disk-full incident.

> **Bug ẩn / production — `max_wal_size`:** Là soft checkpoint target, không cap WAL bị slot/archive/backup giữ. Disk forecast phải dùng WAL growth rate và retained bytes thật.

> **Bug ẩn / production — temp:** Temp sort/hash files có thể xuất hiện nhanh hơn scrape interval rồi biến mất. Theo dõi `pg_stat_database.temp_bytes`, log temp file và filesystem peak, không chỉ relation size.

## 2. Growth rate và runway

Sau khi có ít nhất hai snapshot:

```sql
WITH samples AS (
    SELECT
        captured_at,
        database_size_bytes,
        lag(captured_at) OVER (ORDER BY captured_at) AS previous_at,
        lag(database_size_bytes) OVER (ORDER BY captured_at) AS previous_size
    FROM capacity_lab.cluster_snapshot
), rates AS (
    SELECT
        captured_at,
        database_size_bytes - previous_size AS bytes_grown,
        extract(epoch FROM captured_at - previous_at) AS seconds_elapsed
    FROM samples
    WHERE previous_at IS NOT NULL
)
SELECT
    captured_at,
    pg_size_pretty(bytes_grown) AS growth,
    round(bytes_grown * 86400.0 / NULLIF(seconds_elapsed, 0)) AS bytes_per_day
FROM rates
ORDER BY captured_at DESC;
```

Runway concept:

```sql
WITH assumption AS (
    SELECT
        pg_size_bytes('2TB')::numeric AS free_bytes,
        pg_size_bytes('50GB')::numeric AS growth_per_day,
        2.0::numeric AS peak_multiplier
)
SELECT
    round(free_bytes / (growth_per_day * peak_multiplier), 1) AS runway_days
FROM assumption;
```

**Scenario:** Dự báo disk exhaustion trước campaign, retention change hoặc tenant lớn mới onboard.

**Trade-off:** Linear forecast dễ hiểu nhưng phải có seasonal/peak/migration scenarios; model phức tạp hơn chỉ đáng khi dữ liệu lịch sử đủ tốt.

> **Bug ẩn / production — negative growth:** Vacuum/reindex/drop làm size giảm và che ingest trend. Forecast theo component/rate business, dùng rolling percentile và annotate maintenance/deploy.

> **Bug ẩn / production — average:** 50 GB/ngày trung bình không thấy burst 300 GB/giờ do backfill/slot outage. Alert time-to-full ở current rate và worst observed rate.

## 3. Memory budget theo operation × worker × concurrency

```sql
SELECT name, setting, unit, context
FROM pg_settings
WHERE name IN (
    'shared_buffers',
    'work_mem',
    'hash_mem_multiplier',
    'maintenance_work_mem',
    'autovacuum_work_mem',
    'autovacuum_max_workers',
    'max_connections',
    'max_parallel_workers_per_gather',
    'max_worker_processes'
)
ORDER BY name;
```

`work_mem` gần như per sort/hash node và per worker; hash operation có thể dùng `work_mem × hash_mem_multiplier`.

What-if pessimistic, không phải exact allocator:

```sql
WITH assumption AS (
    SELECT
        pg_size_bytes('16MB')::numeric AS work_mem_bytes,
        2.0::numeric AS hash_multiplier,
        80::numeric AS concurrent_queries,
        3::numeric AS memory_nodes_per_query,
        2::numeric AS processes_per_query
)
SELECT pg_size_pretty(
    work_mem_bytes
    * hash_multiplier
    * concurrent_queries
    * memory_nodes_per_query
    * processes_per_query
) AS pessimistic_operator_memory
FROM assumption;
```

**Scenario:** Một dashboard query có ba hash/sort nodes và parallel worker; 80 query cùng lúc biến `work_mem=16MB` thành nhiều GB chứ không phải 16 MB toàn server.

**Trade-off:** `work_mem` cao giảm spill nhưng tăng OOM/swap risk; thấp bảo vệ concurrency nhưng tăng temp I/O. Dùng pool/admission và `SET LOCAL` cho workload đã đo.

> **Bug ẩn / production — global tune:** Tăng `work_mem` toàn cluster theo một query chậm có thể làm workload peak OOM. Plan có thể có nhiều operation và parallel process; tính concurrency cực đại, không chỉ active trung bình.

> **Bug ẩn / production — maintenance:** `maintenance_work_mem` có thể được dùng bởi nhiều maintenance sessions; autovacuum dùng `autovacuum_work_mem` hoặc fallback và có nhiều worker. Budget riêng cho restore/reindex/vacuum window.

## 4. Connection/pool capacity và queueing

```sql
SELECT
    state,
    wait_event_type,
    wait_event,
    count(*) AS sessions
FROM pg_stat_activity
WHERE backend_type = 'client backend'
GROUP BY state, wait_event_type, wait_event
ORDER BY sessions DESC;

SELECT
    current_setting('max_connections')::integer AS max_connections,
    count(*) FILTER (WHERE backend_type = 'client backend') AS client_backends,
    count(*) FILTER (WHERE state = 'active') AS active_sessions
FROM pg_stat_activity;
```

Little's Law là sanity check: concurrency in service ≈ throughput × mean latency.

```sql
WITH workload AS (
    SELECT 2000::numeric AS transactions_per_second,
           0.050::numeric AS mean_seconds
)
SELECT
    transactions_per_second,
    mean_seconds,
    transactions_per_second * mean_seconds AS concurrent_in_service
FROM workload;
```

**Scenario:** 2.000 TPS × 50 ms cần khoảng 100 transaction đang phục vụ; pool 1.000 không làm CPU nhanh hơn mà chỉ tăng queue/context/memory.

**Trade-off:** Pool nhỏ tạo queue có kiểm soát và backpressure; quá nhỏ bỏ phí CPU/I/O, quá lớn chuyển queue vào database và làm tail latency sụp.

> **Bug ẩn / production — autoscaling:** `pool_size × max pods × services` mới là demand cực đại. Chừa backend cho migration, monitoring, replication và emergency admin; không cấp hết `max_connections` cho app.

> **Bug ẩn / production — mean latency:** Little's Law với p50/mean không dự báo tail khi saturation. Load test nhiều concurrency, quan sát pool wait, DB active, CPU run queue và disk latency để tìm knee point.

## 5. CPU, I/O và query mix capacity

```sql
SELECT
    backend_type,
    object,
    context,
    reads,
    read_time,
    writes,
    write_time,
    hits,
    evictions
FROM pg_stat_io
ORDER BY reads + writes DESC NULLS LAST;

SELECT
    calls,
    round(total_exec_time::numeric, 2) AS total_ms,
    shared_blks_read,
    temp_blks_written,
    wal_bytes,
    left(query, 140) AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

Query `pg_stat_statements` cần extension/preload ở bài 10/14; nếu chưa bật, dùng activity/log/application metrics.

**Scenario:** Capacity hết vì CPU (expression/JIT), random read IOPS, sequential bandwidth, WAL fsync hoặc temp write—mỗi bottleneck cần giải pháp khác.

**Trade-off:** Index/cache tăng read performance nhưng tăng write/WAL/storage; replica tách read nhưng có consistency/lag; scale-up đơn giản nhưng có giới hạn/cost.

> **Bug ẩn / production — utilization target:** CPU 50% trung bình có thể chứa core 100%, lock serialization hoặc disk bão hòa. Quan sát per-resource latency/queue và headroom trong failure mode N-1, không chỉ average utilization.

## 6. Vacuum capacity là một rate problem

```sql
SELECT
    schemaname,
    relname,
    n_live_tup,
    n_dead_tup,
    n_mod_since_analyze,
    last_autovacuum,
    autovacuum_count,
    vacuum_count
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 30;

SELECT
    pid,
    relid::regclass AS table_name,
    phase,
    heap_blks_total,
    heap_blks_scanned,
    heap_blks_vacuumed
FROM pg_stat_progress_vacuum;
```

Snapshot cumulative update/delete/dead tuple counters theo thời gian để so dead-tuple creation rate với vacuum removal/cycle duration.

**Scenario:** Ba table lớn cùng vượt threshold và chiếm hết autovacuum worker, table queue nhỏ nhưng hot không được xử lý kịp.

**Trade-off:** Autovacuum aggressive dùng I/O/CPU sớm nhưng giữ bloat/XID ổn định; throttle quá mạnh giữ foreground latency ngắn hạn nhưng tạo maintenance debt.

> **Bug ẩn / production — threshold only:** Scale factor thấp không giúp nếu worker/cost/I/O không đủ throughput hoặc long transaction/slot giữ xmin. Capacity plan phải gồm worker occupancy, duration và oldest xmin.

## 7. WAL/archive/replication capacity

```sql
SELECT
    wal_records,
    wal_fpi,
    pg_size_pretty(wal_bytes) AS wal_bytes,
    wal_buffers_full,
    stats_reset
FROM pg_stat_wal;

SELECT
    slot_name,
    active,
    restart_lsn,
    wal_status,
    pg_size_pretty(
        pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)
    ) AS retained
FROM pg_replication_slots;

SELECT
    application_name,
    state,
    sync_state,
    pg_size_pretty(
        pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn)
    ) AS replay_byte_lag
FROM pg_stat_replication;
```

**Scenario:** Backfill sinh 200 MB/s WAL trong khi archive upload/standby replay chỉ 100 MB/s; lag/disk debt tăng 100 MB/s dù primary query vẫn nhanh.

**Trade-off:** Throttle write giảm tốc migration nhưng bảo vệ RPO/disk; tăng archive/replica capacity tốn tài nguyên nhưng rút recovery/catch-up.

> **Bug ẩn / production — lag in seconds:** Standby idle có timestamp lag gây hiểu sai; dùng byte LSN lag + receiver/replay state + heartbeat. Dự báo time-to-full bằng retained-byte rate.

## 8. Deadline hierarchy trong PostgreSQL 17

```sql
BEGIN;
SET LOCAL lock_timeout = '500ms';
SET LOCAL statement_timeout = '5s';
SET LOCAL transaction_timeout = '10s';
SET LOCAL idle_in_transaction_session_timeout = '30s';

SELECT
    current_setting('lock_timeout') AS lock_timeout,
    current_setting('statement_timeout') AS statement_timeout,
    current_setting('transaction_timeout') AS transaction_timeout,
    current_setting('idle_in_transaction_session_timeout') AS idle_xact_timeout;
COMMIT;
```

- `lock_timeout`: cho mỗi lần chờ lock; vô nghĩa nếu lớn hơn/equal statement deadline sẽ nổ trước.
- `statement_timeout`: từ lúc command đến server tới khi statement hoàn tất.
- `transaction_timeout` (17+): terminate session khi transaction sống quá lâu; prepared transaction không chịu timeout này.
- `idle_in_transaction_session_timeout`: session không gửi command nhưng transaction còn mở.
- client/pool/request deadline: phải bao toàn round trip và cancellation.

**Scenario:** API budget 2 s, DB statement 1,5 s, lock wait 200 ms; request fail nhanh thay vì treo hàng chờ.

**Trade-off:** Timeout thấp bảo vệ saturation nhưng tăng false timeout cho operation hợp lệ; chia role/workload và lấy percentile thực, không một global value cho OLTP + report + migration.

> **Bug ẩn / production — timeout precedence:** Nếu `transaction_timeout` ngắn hơn hoặc bằng statement/idle-in-transaction timeout, timeout dài hơn bị bỏ qua. Thiết kế hierarchy và test SQLSTATE/connection behavior.

> **Bug ẩn / production — global setting:** Tài liệu không khuyến nghị đặt `statement_timeout`, `lock_timeout`, `transaction_timeout` một giá trị chung trong `postgresql.conf`. Dùng role/database/session/`SET LOCAL` theo workload.

## 9. Statement timeout làm transaction aborted

Chạy block này trong `psql`; query `pg_sleep` được dự kiến lỗi:

```sql
BEGIN;
SET LOCAL statement_timeout = '100ms';
SELECT pg_sleep(1); -- ERROR: canceling statement due to statement timeout
SELECT 'không chạy vì transaction đã aborted';
ROLLBACK;
```

Muốn một optional statement thất bại nhưng giữ transaction, đặt savepoint và **client phải** rollback tới savepoint sau lỗi:

```sql
BEGIN;
SET LOCAL statement_timeout = '100ms';
SAVEPOINT before_optional_query;
SELECT pg_sleep(1); -- dự kiến lỗi
ROLLBACK TO SAVEPOINT before_optional_query;
SELECT 'transaction dùng lại được' AS result;
COMMIT;
```

Nếu client/runner bật stop-on-error, gửi `ROLLBACK`/`ROLLBACK TO` ở request tiếp theo.

**Scenario:** Report phụ timeout nhưng transaction chính có fallback được thiết kế rõ.

**Trade-off:** Savepoint cho recovery cục bộ nhưng thêm round trip/subtransaction overhead và code phức tạp; transaction OLTP thường đơn giản hơn khi rollback toàn bộ + retry idempotent.

> **Bug ẩn / production — connection trả pool:** Sau timeout/error, connection trong trạng thái aborted cho tới `ROLLBACK`. Trả nó vào pool không reset làm request kế tiếp nhận `current transaction is aborted`. Pool wrapper phải rollback trên mọi error path.

> **Bug ẩn / production — timeout ≠ no side effect:** Statement bị cancel có thay đổi DB trong statement đó rollback, nhưng sequence value, log và external side effect từ unsafe function có thể không “undo” như business mong đợi. Không gọi network từ DB transaction logic.

## 10. Cancel và terminate backend

Tìm đúng target trước:

```sql
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    backend_start,
    xact_start,
    query_start,
    state,
    wait_event_type,
    wait_event,
    left(query, 180) AS query
FROM pg_stat_activity
WHERE pid <> pg_backend_pid()
ORDER BY query_start NULLS LAST;
```

```sql
-- Thay PID đã xác minh; giữ comment trong tài liệu để tránh chạy nhầm:
-- SELECT pg_cancel_backend(12345);
-- SELECT pg_terminate_backend(12345, 5000); -- timeout milliseconds
```

- cancel gửi yêu cầu hủy query hiện tại; session thường còn và transaction bị aborted nếu đang trong transaction.
- terminate đóng session; PostgreSQL rollback transaction, có thể tốn lâu/I/O.

**Scenario:** Query runaway vượt error budget hoặc blocker cần gỡ có kiểm soát.

**Trade-off:** Cancel ít phá hơn nhưng client có thể lập tức chạy lại; terminate giải phóng session nhưng rollback lớn và application retry storm có thể nặng hơn.

> **Bug ẩn / production — PID reuse:** PID có thể kết thúc rồi được reuse. Xác minh `backend_start`, user, app, query và blocker ngay trước action; tooling nên dùng identity snapshot/guard, không lưu PID cũ rồi kill sau.

> **Bug ẩn / production — root blocker:** Kill mọi blocked query không giải phóng root blocker và làm request retry. Vẽ graph `pg_blocking_pids`, xử lý root + admission/backoff.

## 11. Client disconnect và abandoned work

```sql
SELECT name, setting, unit, context
FROM pg_settings
WHERE name IN (
    'client_connection_check_interval',
    'tcp_keepalives_idle',
    'tcp_keepalives_interval',
    'tcp_keepalives_count',
    'tcp_user_timeout',
    'idle_session_timeout'
)
ORDER BY name;
```

`client_connection_check_interval` cho phép long query thỉnh thoảng poll socket để nhận biết client đã mất; TCP keepalive/user timeout phụ thuộc OS/platform.

**Scenario:** Proxy timeout đóng client sau 2 s nhưng database vẫn chạy query 10 phút vì không nhận cancellation/disconnect sớm.

**Trade-off:** Check socket thường hơn có overhead; keepalive quá aggressive gây false disconnect khi network jitter. Application cancellation protocol + server timeout vẫn là lớp chính.

> **Bug ẩn / production — timeout inversion:** Outer HTTP timeout phải dài hơn pool acquisition + DB operation + response margin, đồng thời DB deadline không được dài hơn outer deadline đến mức tiếp tục làm việc vô ích. Truyền deadline/cancel xuyên các tầng.

> **Bug ẩn / production — idle session timeout:** Middleware pool có thể không chịu được server đóng idle connection bất ngờ. Ưu tiên pool lifetime/health check hoặc áp setting theo interactive role, test reconnect storm.

## 12. Admission control và load shedding

PostgreSQL không tự biết request nào còn nằm trong SLO. Giới hạn concurrency ở pool/job worker, tách role/pool OLTP-report-migration và từ chối sớm khi queue/deadline hết.

```sql
SELECT
    application_name,
    usename,
    state,
    count(*) AS sessions,
    count(*) FILTER (WHERE wait_event_type IS NOT NULL) AS waiting
FROM pg_stat_activity
WHERE backend_type = 'client backend'
GROUP BY application_name, usename, state
ORDER BY sessions DESC;
```

Role-level baseline là lựa chọn, chỉ chạy khi đã quyết định policy:

```sql
-- ALTER ROLE report_reader SET statement_timeout = '30s';
-- ALTER ROLE migration_runner SET lock_timeout = '1s';
```

**Scenario:** Dashboard fan-out 500 queries không được chiếm toàn pool khiến checkout timeout.

**Trade-off:** Isolation/pool quota có thể để resource nhàn trong một class trong khi class khác queue; đổi lại critical workload có predictable headroom.

> **Bug ẩn / production — retry storm:** Timeout không giảm tải nếu mọi caller retry ngay. Chỉ retry transient SQLSTATE với exponential backoff + jitter, idempotency và global concurrency/rate limit.

## 13. Capacity review và failure headroom

Mỗi review phải có normal peak và N-1/failure mode:

```text
- mất một standby / một AZ / một app pool;
- archive hoặc CDC consumer dừng;
- autovacuum + checkpoint + backup trùng giờ;
- deploy backfill/reindex;
- largest tenant 5–10x bình thường;
- failover node lạnh cache;
- restore/upgrade cần temporary disk.
```

```sql
SELECT
    pg_size_pretty(pg_database_size(current_database())) AS db_size,
    (SELECT count(*) FROM pg_stat_activity) AS sessions,
    (SELECT pg_size_pretty(wal_bytes) FROM pg_stat_wal) AS cumulative_wal,
    (SELECT count(*) FROM pg_replication_slots WHERE NOT active) AS inactive_slots,
    (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle in transaction')
        AS idle_in_transaction;
```

**Scenario:** Quyết định scale/tune trước quý mới hoặc trước major migration.

**Trade-off:** Capacity reserved giảm utilization trung bình nhưng mua resilience; chọn headroom theo SLO/RTO và thời gian provision thực tế.

> **Bug ẩn / production — scale chỉ primary:** Backup/archive/network/replica/recovery phải theo kịp write rate mới. Primary gấp đôi CPU nhưng standby replay/disk cũ vẫn là failure bottleneck.

## Bài tập

1. Thu snapshot 24 giờ, tính growth/WAL/TPS rate và disk runway ở normal + slot outage.
2. Từ ba plan thật, đếm sort/hash/parallel workers và lập memory worst case theo pool max.
3. Tăng concurrency `pgbench` cho tới knee point; ghi throughput, p95/p99, pool wait, CPU/I/O.
4. Tạo timeout trong transaction, recovery bằng full rollback và savepoint; ghi SQLSTATE/driver behavior.
5. Tạo blocker/query runaway trong lab, cancel/terminate đúng target và đo rollback/queue drain.

## Tài liệu PostgreSQL 17 chính thức

- [Client Connection Defaults / timeouts](https://www.postgresql.org/docs/17/runtime-config-client.html)
- [Resource Consumption](https://www.postgresql.org/docs/17/runtime-config-resource.html)
- [System Administration Functions](https://www.postgresql.org/docs/17/functions-admin.html)
- [Monitoring Disk Usage](https://www.postgresql.org/docs/17/diskusage.html)
- [Routine Vacuuming](https://www.postgresql.org/docs/17/routine-vacuuming.html)
- [Monitoring Database Activity](https://www.postgresql.org/docs/17/monitoring.html)

