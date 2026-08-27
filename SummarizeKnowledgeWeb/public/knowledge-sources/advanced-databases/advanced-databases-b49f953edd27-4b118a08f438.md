# 12 — WAL, checkpoint và durability internals

Bài backup/PITR dùng WAL như một công cụ. Bài này đi sâu commit path: PostgreSQL bảo đảm điều gì đã bền vững, checkpoint đổi I/O/WAL ra sao, và vì sao một tuning “nhanh hơn” có thể đổi trực tiếp RPO hoặc khả năng crash recovery.

## Chuẩn bị

```sql
DROP SCHEMA IF EXISTS wal_lab CASCADE;
CREATE SCHEMA wal_lab;

CREATE TABLE wal_lab.wal_probe (
    probe_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payload text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO wal_lab.wal_probe (payload)
SELECT repeat(md5(g::text), 8)
FROM generate_series(1, 10000) AS g;
```

## 1. Write-ahead rule và LSN

Write-ahead rule: WAL mô tả thay đổi phải được flush tới storage bền vững trước khi data page tương ứng được phép ghi bền vững. Commit thông thường chỉ cần WAL commit record bền vững; dirty heap/index pages có thể được checkpointer/background writer ghi sau và crash recovery sẽ REDO.

```sql
SELECT
    pg_current_wal_insert_lsn() AS inserted,
    pg_current_wal_flush_lsn() AS flushed_durable;

SELECT pg_walfile_name(pg_current_wal_lsn()) AS current_segment;
```

LSN là byte position logic, không phải timestamp hay business version.

```sql
SELECT pg_size_pretty(
    pg_wal_lsn_diff('0/02000000'::pg_lsn, '0/01000000'::pg_lsn)
) AS byte_distance;
```

**Scenario:** Đo replication/recovery progress và lượng WAL sinh giữa hai mốc deploy/load test.

**Trade-off:** LSN cho thứ tự/byte distance của WAL nhưng gắn với cluster/timeline; nó không thay event ID, aggregate version hoặc wall-clock time.

> **Bug ẩn / production — LSN semantics:** Không parse chuỗi LSN thủ công hoặc coi LSN từ timeline/cluster khác là cùng một trục. Dùng type `pg_lsn`, `pg_wal_lsn_diff`, giữ timeline/cluster identity trong tooling.

## 2. Đo WAL của một thay đổi

Block sau dùng biến `psql` và chạy được trong lab:

```sql
SELECT pg_current_wal_insert_lsn() AS wal_before \gset

UPDATE wal_lab.wal_probe
SET payload = payload || 'x',
    updated_at = clock_timestamp()
WHERE probe_id BETWEEN 1 AND 5000;

SELECT
    :'wal_before'::pg_lsn AS wal_before,
    pg_current_wal_insert_lsn() AS wal_after,
    pg_size_pretty(
        pg_wal_lsn_diff(
            pg_current_wal_insert_lsn(),
            :'wal_before'::pg_lsn
        )
    ) AS generated;
```

**Scenario:** Ước lượng WAL của backfill/index/migration để dự báo disk archive, network và replica lag.

**Trade-off:** Đo trên một session dễ làm nhưng WAL là cluster-wide; transaction concurrent cũng nằm trong khoảng LSN nên cần môi trường cô lập hoặc rate baseline.

> **Bug ẩn / production — rollback:** Transaction rollback vẫn có thể sinh WAL và tạo dead tuples; “không commit dữ liệu” không có nghĩa migration thử nghiệm miễn phí. Đo cả WAL, bloat, replica và cleanup.

## 3. Durability settings: đừng trộn các guarantee

```sql
SELECT name, setting, unit, context, pending_restart
FROM pg_settings
WHERE name IN (
    'fsync',
    'full_page_writes',
    'synchronous_commit',
    'wal_level',
    'wal_sync_method',
    'wal_compression',
    'data_checksums'
)
ORDER BY name;
```

- `fsync=on`: PostgreSQL yêu cầu kernel/storage flush đúng durability protocol.
- `full_page_writes=on`: first change của page sau checkpoint ghi full-page image để chống torn page.
- `synchronous_commit`: quy định commit chờ WAL tới đâu; có thể chọn theo transaction.
- `wal_level`: lượng thông tin cho recovery/replica/logical decoding; đổi thường cần restart.
- data checksums: phát hiện page corruption, không tự sửa nó.

**Scenario:** Payment cần local durable commit; telemetry tái tạo được có thể chấp nhận async commit để giảm tail latency.

**Trade-off:** Durability cao hơn thường thêm flush/network wait; giảm guarantee chỉ hợp lý khi business RPO phân loại rõ từng transaction.

> **Bug ẩn / production — `fsync=off`:** Có thể gây corruption không phục hồi sau OS/power crash, không chỉ mất vài commit. Không tắt trên cluster cần giữ dữ liệu/failover; hardware “xịn” không chứng minh write cache báo flush trung thực.

> **Bug ẩn / production — `full_page_writes=off`:** Torn page sau crash có thể làm data page không recover được. Đừng tắt để giảm WAL nếu không phải disposable cluster và chưa có storage guarantee đặc biệt được chứng minh bằng crash test.

## 4. Synchronous và asynchronous commit

Một transaction không critical có thể chọn async commit mà không đổi toàn cluster:

```sql
BEGIN;
SET LOCAL synchronous_commit = off;
INSERT INTO wal_lab.wal_probe (payload)
VALUES ('rebuildable telemetry');
COMMIT;
```

Với `off`, client có thể nhận success trước khi WAL commit record được flush. PostgreSQL crash đơn thuần thường vẫn giữ consistency; OS/power crash trong risk window có thể mất transaction vừa báo thành công.

```sql
SHOW synchronous_commit;

-- Chỉ có ý nghĩa đầy đủ khi cấu hình synchronous standby:
BEGIN;
SET LOCAL synchronous_commit = 'remote_apply';
INSERT INTO wal_lab.wal_probe (payload) VALUES ('must be visible on sync standby');
COMMIT;
```

**Scenario:** Chọn durability class theo command: ledger/order dùng `on` hoặc synchronous replica policy; cache invalidation/audit có nguồn khác tái tạo được có thể dùng `off`.

**Trade-off:** Async giảm commit latency/group flush pressure nhưng tạo RPO dương; `remote_apply` cho read-after-write trên synchronous standby nhưng thêm network + replay latency và giảm availability khi standby không sẵn sàng.

> **Bug ẩn / production — ambiguous commit:** Client timeout/disconnect lúc `COMMIT` không chứng minh transaction rollback. Nó có thể đã commit. Mọi API retry write cần idempotency key; không “retry mù” chỉ vì socket lỗi.

> **Bug ẩn / production — session leak:** `SET synchronous_commit=off` cấp session có thể rò qua pool sang request critical. Dùng `SET LOCAL` trong explicit transaction và test pool reset.

## 5. Full-page image, checkpoint frequency và WAL compression

Sau mỗi checkpoint, lần sửa đầu của một page thường ghi full-page image (FPI). Checkpoint quá thường xuyên vừa write dirty buffers nhiều hơn vừa bắt đầu lại chu kỳ FPI.

```sql
SHOW full_page_writes;
SHOW wal_compression;

SELECT
    wal_records,
    wal_fpi,
    pg_size_pretty(wal_bytes) AS wal_bytes,
    wal_buffers_full,
    wal_write,
    wal_sync,
    wal_write_time,
    wal_sync_time,
    stats_reset
FROM pg_stat_wal;
```

`wal_compression` có thể giảm WAL FPI khi page compressible, đổi lại CPU. `track_wal_io_timing` phải bật để timing có ý nghĩa.

```sql
SHOW track_wal_io_timing;
```

**Scenario:** Bulk update làm `wal_fpi`/archive bandwidth tăng mạnh ngay sau checkpoint; compression có thể đổi bottleneck từ network sang CPU.

**Trade-off:** Compression tiết kiệm bytes/disk/network nhưng không miễn phí; hiệu quả phụ thuộc dữ liệu, thuật toán build hỗ trợ và CPU headroom.

> **Bug ẩn / production — so counter:** `pg_stat_wal` là cumulative cluster-wide và có `stats_reset`. So hai snapshot/rate cùng window; không kết luận từ số tuyệt đối hoặc sau reset/restart không ghi nhận.

## 6. Checkpoint internals và I/O smoothing

Checkpoint tạo recovery point và bảo đảm dirty buffers thuộc checkpoint được flush. Nó chạy theo `checkpoint_timeout` hoặc khi WAL tiến gần `max_wal_size`; `max_wal_size` là soft target, không phải hard disk cap.

```sql
SELECT name, setting, unit, source, pending_restart
FROM pg_settings
WHERE name IN (
    'checkpoint_timeout',
    'checkpoint_completion_target',
    'checkpoint_warning',
    'max_wal_size',
    'min_wal_size',
    'checkpoint_flush_after'
)
ORDER BY name;

SELECT
    num_timed,
    num_requested,
    restartpoints_timed,
    restartpoints_req,
    restartpoints_done,
    write_time,
    sync_time,
    buffers_written,
    stats_reset
FROM pg_stat_checkpointer;
```

`pg_stat_checkpointer` là view PostgreSQL 17; ở PostgreSQL 16 một số counter nằm trong `pg_stat_bgwriter`.

Lab có thể tạo checkpoint để quan sát delta:

```sql
CHECKPOINT;
SELECT num_timed, num_requested, write_time, sync_time
FROM pg_stat_checkpointer;
```

**Scenario:** p99 latency spike đều mỗi vài phút hoặc requested checkpoints tăng trong bulk load.

**Trade-off:** Checkpoint thưa/`max_wal_size` lớn thường smooth I/O và giảm FPI nhưng cần thêm disk WAL và kéo dài crash recovery; checkpoint dày giảm REDO window nhưng tăng write burst/WAL.

> **Bug ẩn / production — manual `CHECKPOINT`:** Lệnh này dùng tài nguyên cluster-wide và có thể tạo latency spike. Chỉ dùng trong lab/runbook có lý do; không chạy định kỳ như “flush cho chắc”.

> **Bug ẩn / production — tuning target:** Giảm `checkpoint_completion_target` làm write tập trung hơn. PostgreSQL 17 mặc định 0.9 để trải I/O; tune dựa trên checkpoint rate, write/sync time, storage latency và recovery drill.

## 7. Vì sao `pg_wal` vẫn vượt `max_wal_size`

WAL cũ chỉ recycle/remove khi không còn cần cho crash recovery, archive, standby/slot, backup hoặc recovery. Vì vậy `max_wal_size` không giới hạn retention do slot/archive failure.

```sql
SELECT pg_size_pretty(sum(size)) AS wal_directory_size
FROM pg_ls_waldir();

SELECT
    slot_name,
    slot_type,
    active,
    restart_lsn,
    wal_status,
    pg_size_pretty(
        pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)
    ) AS retained
FROM pg_replication_slots
ORDER BY pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) DESC NULLS LAST;

SELECT
    archived_count,
    failed_count,
    last_archived_time,
    last_failed_time
FROM pg_stat_archiver;
```

**Scenario:** Disk tăng dù checkpoint vẫn chạy: một inactive logical slot hoặc archive destination lỗi đang pin WAL.

**Trade-off:** Slot bảo vệ consumer khỏi mất WAL nhưng chuyển outage consumer thành disk pressure primary; phải có retention budget/failover/rebootstrap policy.

> **Bug ẩn / production — xóa WAL tay:** Không xóa file trong `pg_wal` bằng OS command để lấy chỗ; cluster có thể không start/recover. Giải quyết root cause (slot/archive/backup), mở rộng disk khẩn cấp, và dùng PostgreSQL-aware runbook.

## 8. Logged, UNLOGGED và temporary data

```sql
CREATE UNLOGGED TABLE wal_lab.rebuildable_stage (
    batch_id bigint NOT NULL,
    row_no bigint NOT NULL,
    payload jsonb NOT NULL,
    PRIMARY KEY (batch_id, row_no)
);

INSERT INTO wal_lab.rebuildable_stage
SELECT 1, g, jsonb_build_object('n', g)
FROM generate_series(1, 10000) AS g;

SELECT
    c.relname,
    c.relpersistence,
    pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'wal_lab';
```

UNLOGGED table giảm WAL cho data relation, nhưng bị truncate sau crash/unclean shutdown và không có dữ liệu trên physical standby.

**Scenario:** Staging/intermediate cache có source file/object storage để rebuild và không được dùng cho failover read.

**Trade-off:** Ingest nhanh/WAL thấp hơn đổi lấy mất crash durability, replication và recovery semantics.

> **Bug ẩn / production — “không quan trọng”:** Một queue/idempotency/outbox nhìn giống cache nhưng mất nó tạo duplicate/mất business event. Chỉ dùng UNLOGGED khi có rebuild procedure được drill và dependency không cần row đó để correctness.

## 9. Checksum và structural verification

```sql
SHOW data_checksums;

CREATE EXTENSION IF NOT EXISTS amcheck;
SELECT bt_index_check('wal_lab.wal_probe_pkey'::regclass);
```

`amcheck` kiểm tra structural consistency của index/heap theo function phù hợp; data checksum phát hiện page đọc lên khác checksum ghi, nhưng không xác minh business correctness.

Offline cluster check:

```bash
pg_checksums --check --pgdata=/var/lib/postgresql/data
```

**Scenario:** Sau storage incident/upgrade, kiểm tra checksum, index structure, backup restore và business invariants trên copy cô lập.

**Trade-off:** Verification đọc I/O lớn và có thể ảnh hưởng cache/latency; schedule/rate-limit, nhưng không kiểm tra thì corruption có thể chỉ lộ khi cần restore.

> **Bug ẩn / production — repair:** `REINDEX` có thể sửa index hỏng từ heap đúng, nhưng không sửa heap corruption. Đừng “repair” trên bản duy nhất; giữ image/backup, xác định scope/root cause, restore/reconcile rồi mới thay primary.

## 10. Durability drill

Ghi một probe có idempotency key, xác nhận commit, kill process/container theo kịch bản lab, restart và kiểm tra:

```sql
INSERT INTO wal_lab.wal_probe (payload)
VALUES ('durability-drill-2026-08-28')
RETURNING probe_id, pg_current_wal_lsn();

SELECT *
FROM wal_lab.wal_probe
WHERE payload = 'durability-drill-2026-08-28';
```

Drill riêng database-process crash, OS/container hard stop, standby loss và archive outage; chúng có failure semantics khác nhau.

**Scenario:** Chứng minh RPO/RTO quan sát được thay vì suy luận từ config.

**Trade-off:** Crash test tốn môi trường/thời gian nhưng phát hiện storage lie, orchestration sai, archive gap và ambiguous commit trước production.

> **Bug ẩn / production — kill sai target:** Chỉ drill trên stack cô lập, xác minh container/data directory/cluster ID trước lệnh dừng. Không dùng chaos command từ tài liệu copy-paste khi chưa có fencing và backup.

## Bài tập

1. Snapshot `pg_stat_wal`, update cùng workload trước/sau checkpoint và so `wal_fpi`/bytes.
2. So latency/WAL của logged và UNLOGGED staging; viết rebuild proof.
3. Làm archive fail trong lab, đo WAL growth rate và time-to-full.
4. So `synchronous_commit=on/off` ở concurrency 1 và 20; ghi rõ guarantee bị đổi.
5. Chạy crash/restart drill và đối chiếu probe, log recovery, checksum, RPO/RTO.

## Tài liệu PostgreSQL 17 chính thức

- [Write-Ahead Logging](https://www.postgresql.org/docs/17/wal-intro.html)
- [WAL Configuration](https://www.postgresql.org/docs/17/wal-configuration.html)
- [Write Ahead Log settings](https://www.postgresql.org/docs/17/runtime-config-wal.html)
- [Asynchronous Commit](https://www.postgresql.org/docs/17/wal-async-commit.html)
- [Reliability and WAL](https://www.postgresql.org/docs/17/wal.html)
- [Monitoring statistics](https://www.postgresql.org/docs/17/monitoring-stats.html)
