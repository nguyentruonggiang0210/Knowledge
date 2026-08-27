# 09 — Backup, PITR, replication và High Availability

Ba mục tiêu khác nhau:

- backup/recovery bảo vệ khỏi xóa nhầm, corruption và thảm họa;
- replication tạo bản sao gần thời gian thực và/hoặc read scaling;
- HA phát hiện lỗi, chọn primary, fence node cũ và chuyển traffic.

Replica **không** thay backup: `DROP TABLE` hoặc dữ liệu sai có thể replicate ngay.

## Scenario và trade-off map

| Knowledge item | Scenario production | Trade-off cần quyết định |
|---|---|---|
| RPO/RTO | chọn recovery architecture theo business | RPO/RTO thấp cần standby/automation/cost cao hơn |
| Logical backup | restore chọn database/object, cross-version | Portable nhưng dump/restore/index build lâu và snapshot gây I/O |
| Physical base backup | cluster lớn, PITR/standby bootstrap | Nhanh/đúng physical state; gắn major/platform và không restore một table dễ |
| WAL archive/PITR | khôi phục trước xóa nhầm | RPO nhỏ/flexible target; chỉ một missing WAL segment làm gãy chuỗi |
| Streaming replica | HA/read scaling | Catch-up nhanh; async stale/loss window, sync thêm latency/availability dependency |
| Replication slot | giữ WAL cho consumer outage | Không mất stream; inactive slot có thể làm đầy primary disk |
| Sync commit mode | transaction durability class | RPO giảm/read-after-write tốt; commit chờ network/replay |
| Logical replication | table subset/cross-major/CDC | Flexible; DDL/sequence/schema/identity và initial copy phải quản lý riêng |
| Failover/fencing | primary/node/AZ lỗi | RTO ngắn; quorum/control plane/split-brain complexity |
| Recovery drill | chứng minh backup và runbook | Tốn hạ tầng/thời gian nhưng là bằng chứng duy nhất RPO/RTO đạt |

## 1. Định nghĩa RPO và RTO trước công cụ

- RPO (Recovery Point Objective): chấp nhận mất tối đa bao nhiêu dữ liệu theo thời gian.
- RTO (Recovery Time Objective): dịch vụ phải phục hồi trong bao lâu.

```sql
SELECT
    clock_timestamp() AS measured_at,
    pg_current_wal_lsn() AS current_wal,
    pg_size_pretty(pg_database_size(current_database())) AS database_size;
```

**Tình huống thực tế:** RPO 5 phút có thể dùng base backup + WAL archive liên tục; RTO 5 phút có thể cần standby đã warm và failover automation, không thể đợi restore TB dữ liệu.

> **Bug ẩn / production — mục tiêu mơ hồ:** “Có backup mỗi đêm” tương đương RPO gần 24 giờ trong tình huống xấu và chưa nói RTO. Ghi con số, owner, phạm vi dữ liệu và dependency rồi đo bằng recovery drill.

## 2. Logical backup: `pg_dump`

Custom format cho phép restore song song/chọn object:

```bash
pg_dump --host=localhost --username=student \
  --format=custom --compress=6 --no-owner \
  --file=lab.dump lab

createdb --host=localhost --username=student lab_restore
pg_restore --host=localhost --username=student \
  --dbname=lab_restore --jobs=4 --clean --if-exists \
  lab.dump
```

Dump role/tablespace riêng vì `pg_dump` chỉ một database:

```bash
pg_dumpall --host=localhost --username=student \
  --globals-only --file=globals.sql
```

Kiểm tra sau restore:

```sql
SELECT current_database(), count(*) AS tables
FROM pg_class
WHERE relkind IN ('r', 'p')
  AND relnamespace NOT IN (
      'pg_catalog'::regnamespace,
      'information_schema'::regnamespace
  )
GROUP BY current_database();

SELECT conrelid::regclass, conname, contype, convalidated
FROM pg_constraint
WHERE NOT convalidated;
```

> **Bug ẩn / production — dump thành công:** Exit code 0 chỉ chứng minh dump command hoàn tất, không chứng minh restore đúng, đủ quyền/extension/large object hay app chạy được. Restore định kỳ vào môi trường mới, chạy integrity + smoke test và đo thời gian.

> **Bug ẩn / production — version:** Dùng `pg_dump` client cùng hoặc mới hơn server theo compatibility được hỗ trợ; restore sang major mới cần test extension/collation. Logical dump database lớn có thể chậm và tạo I/O/WAL retention pressure qua snapshot dài.

## 3. Physical base backup

`pg_basebackup` sao chép toàn cluster và WAL cần thiết. Chạy từ máy có quyền replication:

```bash
pg_basebackup --host=primary --username=replicator \
  --pgdata=/backup/base-2026-08-27 \
  --format=plain --wal-method=stream \
  --checkpoint=fast --progress --verbose

pg_verifybackup /backup/base-2026-08-27
```

```sql
SELECT
    pg_current_wal_lsn(),
    current_setting('data_checksums') AS data_checksums;
```

> **Bug ẩn / production — physical compatibility:** Physical backup gắn với major version, architecture/format và toàn cluster; không restore chọn một table như logical dump. `checkpoint=fast` có thể tạo I/O spike, nên lịch và monitor.

> **Bug ẩn / production — storage snapshot:** Copy trực tiếp data directory khi server đang chạy mà không dùng backup API/snapshot consistency có thể không recover được. Snapshot nhiều volume phải crash-consistent cùng thời điểm và vẫn cần WAL.

## 4. WAL archiving

Trong `postgresql.conf` của primary lab:

```conf
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /archive/%f && cp %p /archive/%f'
archive_timeout = '5min'
```

Reload/restart theo parameter, tạo WAL switch và kiểm tra:

```sql
SELECT pg_switch_wal();

SELECT
    archived_count,
    failed_count,
    last_archived_wal,
    last_archived_time,
    last_failed_wal,
    last_failed_time
FROM pg_stat_archiver;
```

`archive_command` phải trả success chỉ khi WAL đã được lưu bền vững; tên file `%f` phải idempotent.

> **Bug ẩn / production — archive fail:** Nếu archive liên tục thất bại, `pg_wal` không được recycle và disk primary có thể đầy. Alert `failed_count`, thời gian từ `last_archived_time`, disk forecast; có runbook sửa destination/network.

> **Bug ẩn / production — `archive_timeout`:** Giá trị quá thấp ép nhiều WAL file gần rỗng, tăng storage/requests. Nó giới hạn thời gian chưa archive ở workload ít ghi, không thay continuous monitoring.

> **Bug ẩn / production — command mẫu:** `cp` chỉ là lab một host, không phải DR. Production cần storage khác failure domain, encryption, immutability/retention và xác minh checksum; công cụ mã nguồn mở như pgBackRest/Barman có thể tự động hóa nhưng vẫn phải restore-test.

## 5. Point-in-Time Recovery (PITR)

PITR = base backup trước thời điểm mục tiêu + chuỗi WAL archive đầy đủ đến mục tiêu.

Quy trình trên **instance phục hồi tách biệt**:

1. dừng PostgreSQL và đặt base backup vào data directory mới;
2. cấu hình lấy WAL archive;
3. tạo `recovery.signal`;
4. đặt target rõ timezone;
5. start, quan sát log, dừng/promote đúng target;
6. kiểm tra dữ liệu rồi mới quyết định chuyển traffic.

```conf
restore_command = 'cp /archive/%f %p'
recovery_target_time = '2026-08-27 10:14:59+07'
recovery_target_action = 'promote'
```

Kiểm tra instance:

```sql
SELECT
    pg_is_in_recovery(),
    pg_last_wal_receive_lsn(),
    pg_last_wal_replay_lsn(),
    pg_last_xact_replay_timestamp();
```

> **Bug ẩn / production — target:** Timestamp thiếu timezone hoặc chọn sau transaction phá hoại một chút sẽ phục hồi sai. Ghi audit time, transaction ID/LSN/restore point nếu có, và thử nhiều target trên copy.

```sql
-- Tạo mốc trước thao tác rủi ro; không thay backup:
SELECT pg_create_restore_point('before_release_2026_08_27');
```

> **Bug ẩn / production — timeline:** Sau promote, PostgreSQL tạo timeline mới. Backup catalog/restore phải giữ `.history` và WAL của timeline cần thiết; không giả định WAL filename tăng tuyến tính trên một timeline duy nhất.

> **Bug ẩn / production — missing WAL:** Chỉ thiếu một segment giữa base backup và target là chuỗi PITR bị gãy. Kiểm kê/verify archive liên tục, không đợi thảm họa mới biết.

## 6. Streaming physical replication

Primary tối thiểu:

```conf
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
```

Tạo role có quyền tối thiểu và cấu hình `pg_hba.conf` giới hạn network/TLS:

```sql
CREATE ROLE replicator WITH LOGIN REPLICATION PASSWORD 'REPLACE_IN_SECRET_MANAGER';
```

Khởi tạo standby trống bằng `pg_basebackup` (`-R` ghi connection config/signal, `-C -S` tạo slot):

```bash
pg_basebackup --host=primary --username=replicator \
  --pgdata=/var/lib/postgresql/data \
  --format=plain --wal-method=stream --progress \
  --write-recovery-conf --create-slot --slot=standby_1
```

Trên primary:

```sql
SELECT
    application_name,
    client_addr,
    state,
    sync_state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn)) AS byte_lag,
    write_lag,
    flush_lag,
    replay_lag
FROM pg_stat_replication;
```

Trên standby:

```sql
SELECT
    pg_is_in_recovery(),
    pg_last_wal_receive_lsn(),
    pg_last_wal_replay_lsn(),
    now() - pg_last_xact_replay_timestamp() AS replay_time_lag;
```

> **Bug ẩn / production — lag metric:** Time lag có thể là `NULL`/trông lớn khi primary không có transaction mới; byte lag và replay timestamp cũng có semantics khác. Alert kết hợp WAL positions, receiver state và workload heartbeat.

> **Bug ẩn / production — read-after-write:** Async replica có thể chưa thấy commit vừa trả về primary. Route read cần consistency về primary, chờ replay LSN có timeout, hoặc chấp nhận eventual consistency rõ trong API.

## 7. Replication slot và WAL retention

Slot bảo đảm primary giữ WAL cần cho consumer/standby bị ngắt.

```sql
SELECT
    slot_name,
    slot_type,
    active,
    restart_lsn,
    confirmed_flush_lsn,
    wal_status,
    pg_size_pretty(
        pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)
    ) AS retained_wal
FROM pg_replication_slots;
```

> **Bug ẩn / production — slot bỏ quên:** Inactive slot giữ WAL vô hạn nếu không có giới hạn/config phù hợp và có thể làm đầy disk. Mọi slot cần owner, consumer heartbeat, retained-byte alert và quy trình drop an toàn.

```sql
-- Chỉ sau khi xác nhận consumer đã bỏ vĩnh viễn:
-- SELECT pg_drop_replication_slot('old_standby');
```

## 8. Asynchronous và synchronous replication

Async ưu tiên availability/latency, có cửa sổ mất commit khi primary chết. Sync chờ một hoặc nhiều standby xác nhận theo `synchronous_commit`, giảm RPO nhưng thêm latency và dependency availability.

```conf
synchronous_standby_names = 'FIRST 1 (standby_1, standby_2)'
```

```sql
BEGIN;
SET LOCAL synchronous_commit = 'remote_apply';
CREATE TABLE IF NOT EXISTS public.sync_probe (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.sync_probe DEFAULT VALUES RETURNING *;
COMMIT;
```

> **Bug ẩn / production — synchronous availability:** Nếu không có eligible synchronous standby, commit có thể chờ lâu/vô hạn theo client perspective. Cần HA policy tự động, timeout/cancel semantics, quorum design và hiểu rằng cancel client không chắc transaction chưa commit.

> **Bug ẩn / production — `remote_apply`:** Mạnh hơn `on`/remote flush nhưng chậm hơn và vẫn không giải quyết external side effect. Chọn durability level theo transaction class, không bật cao nhất theo quán tính.

## 9. Logical replication

Logical replication chọn table và có thể đi giữa major versions, nhưng schema phải tương thích.

Trên publisher:

```sql
CREATE SCHEMA IF NOT EXISTS replication_lab;
CREATE TABLE replication_lab.customer_event (
    event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id bigint NOT NULL,
    payload jsonb NOT NULL,
    occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE PUBLICATION customer_event_pub
FOR TABLE replication_lab.customer_event;
```

Trên subscriber khác, tạo schema/table tương thích trước, rồi:

```sql
CREATE SUBSCRIPTION customer_event_sub
CONNECTION 'host=publisher dbname=lab user=logical_rep password=REPLACE_ME sslmode=require'
PUBLICATION customer_event_pub
WITH (copy_data = true);

SELECT * FROM pg_stat_subscription;
```

> **Bug ẩn / production — DDL/sequence:** Built-in logical replication không tự replicate mọi DDL và sequence state. Migration phải được phối hợp publisher/subscriber; failover dùng sequence chưa đồng bộ có thể trùng key.

> **Bug ẩn / production — replica identity:** `UPDATE`/`DELETE` cần replica identity (thường primary key). `REPLICA IDENTITY FULL` có thể dùng khi không có key nhưng gửi/so row rộng, tốn WAL/CPU.

```sql
SELECT
    c.oid::regclass,
    c.relreplident
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'replication_lab';
```

> **Bug ẩn / production — initial copy:** Copy dữ liệu ban đầu cạnh tranh I/O với production và có thể làm slot giữ nhiều WAL. Rate-limit/lập lịch, monitor slot + disk và test cutover.

## 10. Failover, fencing và split brain

Trên standby được chọn:

```sql
SELECT pg_is_in_recovery(); -- phải true trước promote
SELECT pg_promote(wait_seconds => 60);
SELECT pg_is_in_recovery(); -- false sau promote thành công
```

Một HA control plane hoàn chỉnh cần:

1. health check phân biệt DB chậm, network partition và node chết;
2. leader election/quorum;
3. fencing bảo đảm primary cũ không nhận write;
4. promote standby đủ mới;
5. chuyển endpoint/proxy;
6. rejoin/rebuild node cũ theo timeline mới.

Có thể học hoàn toàn miễn phí với PostgreSQL + Patroni + etcd/Consul và HAProxy, nhưng hãy bắt đầu bằng hai container/VM và drill thủ công để hiểu state transition.

> **Bug ẩn / production — split brain:** Promote chỉ là một câu lệnh; nếu client vẫn ghi được primary cũ, hai timeline diverge. DNS TTL không phải fencing. Cần revoke network/storage/lease của leader cũ trước hoặc như một phần atomic orchestration.

> **Bug ẩn / production — failback:** Không “start lại rồi cho primary cũ làm leader”. Nó phải được rewind/rebuild và catch up; failback là migration khác cần kế hoạch, không phải undo tức thời.

## 11. Recovery drill và bằng chứng

```sql
CREATE TABLE IF NOT EXISTS public.recovery_probe (
    probe_id uuid PRIMARY KEY,
    created_at timestamptz NOT NULL,
    checksum text NOT NULL
);

INSERT INTO public.recovery_probe
VALUES (
    '22222222-2222-2222-2222-222222222222',
    clock_timestamp(),
    md5('known recovery payload')
)
ON CONFLICT DO NOTHING;
```

Mỗi quý/tháng theo RTO:

- restore vào network cô lập;
- ghi start/end time, backup ID, WAL range/timeline;
- chạy checksum/count/FK/application smoke test;
- xác minh secret/role/extension/scheduled job;
- lưu bằng chứng và sửa runbook.

> **Bug ẩn / production — drill giả:** Restore vào server đã có extension/config/data phụ trợ che dependency thiếu. Drill tốt dùng instance mới và không truy cập dịch vụ production ngoài ý muốn (email/payment/job consumer phải bị cô lập).

## Bài tập

1. Dump/restore lab vào database mới, so row count/constraint/permissions và đo RTO.
2. Tạo base backup + WAL archive, xóa một row, PITR tới ngay trước lệnh xóa.
3. Dừng standby dùng slot, tạo WAL và quan sát retained bytes; đặt alert/runbook.
4. Drill failover có fencing, ghi timeline và cách rebuild primary cũ.
5. Lập ma trận RPO/RTO cho async, sync, PITR và logical replication; ghi failure mode mỗi lựa chọn.
