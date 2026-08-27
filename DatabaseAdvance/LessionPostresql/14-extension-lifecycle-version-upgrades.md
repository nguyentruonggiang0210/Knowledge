# 14 — Extension lifecycle và nâng cấp PostgreSQL

Extension và upgrade là supply-chain + data-migration problem, không chỉ là `CREATE EXTENSION` hay đổi Docker tag. Mục tiêu là biết binary/SQL object nào đang chạy, dependency nào bị tác động, cutover/rollback ra sao và dữ liệu được xác minh thế nào.

## 1. Inventory extension đã cài và có sẵn

```sql
SELECT
    e.extname,
    e.extversion,
    n.nspname AS extension_schema,
    e.extrelocatable,
    pg_get_userbyid(e.extowner) AS owner
FROM pg_extension AS e
JOIN pg_namespace AS n ON n.oid = e.extnamespace
ORDER BY e.extname;

SELECT
    name,
    default_version,
    installed_version,
    comment
FROM pg_available_extensions
ORDER BY name;
```

`pg_available_extensions` phản ánh control/SQL files trên server hiện tại; `pg_extension` phản ánh object đã đăng ký trong database hiện tại.

**Scenario:** Trước OS/image/major upgrade, lập bill of materials cho mọi database để biết extension binary/control files nào phải có ở target.

**Trade-off:** Extension đem data type/operator/index/observability mạnh vào PostgreSQL, đổi lại tạo dependency vào package, ABI, upgrade script và security của tác giả.

> **Bug ẩn / production — per database:** `CREATE EXTENSION` đăng ký theo từng database, không phải tự động toàn cluster. Inventory mọi database/template; target có package file nhưng chưa `CREATE EXTENSION` vẫn không có SQL objects.

> **Bug ẩn / production — available ≠ compatible:** Cùng tên extension có mặt ở image mới không chứng minh version, compile flags, data format hoặc upgrade path tương thích. Pin artifact và test restore/upgrade với dữ liệu/index thật.

## 2. Cài vào schema tin cậy

Lab dùng `hstore` thuộc bộ contrib miễn phí:

```sql
CREATE SCHEMA IF NOT EXISTS extensions AUTHORIZATION CURRENT_USER;
REVOKE CREATE ON SCHEMA extensions FROM PUBLIC;

CREATE EXTENSION IF NOT EXISTS hstore
WITH SCHEMA extensions;

SELECT extname, extversion, extnamespace::regnamespace
FROM pg_extension
WHERE extname = 'hstore';
```

Test:

```sql
SELECT extensions.hstore(ARRAY['env', 'lab', 'owner', 'database-team'])
       OPERATOR(extensions.->) 'owner' AS owner;
```

**Scenario:** Extension cung cấp operator/function cho app nhưng untrusted users không được tạo object cạnh extension để hijack lookup.

**Trade-off:** Schema riêng làm privilege/audit rõ hơn nhưng query/operator class có thể cần schema qualification hoặc `search_path` được quản lý.

> **Bug ẩn / production — install script:** Cài extension bằng superuser là chạy code/SQL của extension với quyền cao. Chỉ dùng artifact/source đáng tin, checksum/SBOM và schema không cho user lạ `CREATE`; `trusted=true` không có nghĩa không cần review.

> **Bug ẩn / production — `CASCADE`:** `CREATE EXTENSION ... CASCADE` tự cài dependency với default version/schema có thể ngoài manifest. Production nên inventory/pin dependency rõ, không dùng CASCADE để “cho chạy được” mà không audit.

## 3. Extension members và dependency graph

```sql
SELECT
    e.extname,
    pg_describe_object(d.classid, d.objid, d.objsubid) AS member
FROM pg_depend AS d
JOIN pg_extension AS e ON e.oid = d.refobjid
WHERE d.deptype = 'e'
  AND e.extname = 'hstore'
ORDER BY member;

SELECT
    pg_describe_object(d.refclassid, d.refobjid, d.refobjsubid) AS referenced,
    pg_describe_object(d.classid, d.objid, d.objsubid) AS dependent,
    d.deptype
FROM pg_depend AS d
WHERE d.refobjid = (
    SELECT oid FROM pg_extension WHERE extname = 'hstore'
)
ORDER BY dependent;
```

**Scenario:** Trước update/drop extension, xác định type/function/operator/index nào là member và object app nào phụ thuộc.

**Trade-off:** Catalog graph chính xác hơn search text, nhưng cần quyền/hiểu `deptype`; vẫn phải kiểm tra code/query ngoài database.

> **Bug ẩn / production — sửa member trực tiếp:** `CREATE OR REPLACE`/ALTER object thuộc extension có thể bị update script ghi đè hoặc làm schema drift. Đóng góp patch/fork có version, không hot-fix member không được ghi nhận.

## 4. Update extension có kiểm soát

```sql
SELECT
    name,
    version,
    installed,
    superuser,
    trusted,
    relocatable,
    requires
FROM pg_available_extension_versions
WHERE name = 'hstore'
ORDER BY version;

ALTER EXTENSION hstore UPDATE;

SELECT extname, extversion
FROM pg_extension
WHERE extname = 'hstore';
```

`ALTER EXTENSION ... UPDATE TO 'x.y'` chỉ chạy được khi server có update path/scripts tương ứng.

**Scenario:** Patch extension sửa bug/security hoặc phải khớp binary sau PostgreSQL major upgrade.

**Trade-off:** In-place update giữ dependency/object OID tốt hơn drop/recreate, nhưng update script có thể lock/rewrite data và rollback không đơn giản.

> **Bug ẩn / production — no downgrade:** Extension thường không có downgrade script. Snapshot/backup trước update, test lock/WAL/duration trên clone và định nghĩa roll-forward hoặc restore; `ALTER EXTENSION UPDATE` chạy thành công không chứng minh app semantics không đổi.

> **Bug ẩn / production — search path:** Function/script extension có unqualified names có thể bị object trojan bắt. Giữ schema tin cậy, review `SECURITY DEFINER` và không cho runtime role tạo object ở schema đứng trước.

## 5. Extension cần preload/restart

Không phải module nào chỉ cần `CREATE EXTENSION`. Ví dụ `pg_stat_statements` cần shared memory từ startup:

```sql
SHOW shared_preload_libraries;

SELECT name, setting, context, pending_restart, source
FROM pg_settings
WHERE name IN (
    'shared_preload_libraries',
    'compute_query_id',
    'pg_stat_statements.max',
    'pg_stat_statements.track'
)
ORDER BY name;
```

Sau khi cấu hình `shared_preload_libraries = 'pg_stat_statements'` và restart cluster:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT extversion FROM pg_extension WHERE extname = 'pg_stat_statements';
```

**Scenario:** Bật query fingerprint observability cần startup hook + SQL view trong từng database.

**Trade-off:** Preloaded module dùng shared memory/code trong mọi backend và restart để đổi; lợi ích quan sát phải cân với memory/compatibility/failure domain.

> **Bug ẩn / production — partial rollout:** `CREATE EXTENSION` trước preload có thể tạo object nhưng view không hoạt động đúng; preload binary không tạo view trong database. Runbook phải có package → config → restart → `CREATE/UPDATE EXTENSION` → smoke test.

> **Bug ẩn / production — typo/startup:** Sai library name/binary ABI có thể làm PostgreSQL không start. Thử image/replica trước, giữ console/rollback config và không restart toàn HA cluster cùng lúc.

## 6. Drop/move extension: dependency trước `CASCADE`

```sql
SELECT
    e.extname,
    n.nspname AS current_schema,
    e.extrelocatable
FROM pg_extension AS e
JOIN pg_namespace AS n ON n.oid = e.extnamespace
WHERE e.extname = 'hstore';

-- Chỉ extension relocatable mới cho phép:
-- ALTER EXTENSION hstore SET SCHEMA another_secure_schema;

-- Luôn thử RESTRICT/đọc dependency trước; không chạy trong lab nếu còn dùng:
-- DROP EXTENSION hstore RESTRICT;
```

**Scenario:** Loại extension không còn được hỗ trợ hoặc chuẩn hóa schema.

**Trade-off:** Drop giảm attack/maintenance surface nhưng object app/index/column type có thể phụ thuộc sâu, yêu cầu data conversion trước.

> **Bug ẩn / production — `DROP ... CASCADE`:** Có thể xóa column/index/view/function app không dễ phục hồi. Không dùng như dependency resolver; dump schema, query `pg_depend`, migrate data/type và để `RESTRICT` bảo vệ.

## 7. Minor và major version không cùng quy trình

```sql
SELECT
    current_setting('server_version') AS version,
    current_setting('server_version_num') AS version_num,
    version() AS full_build;
```

- Minor upgrade trong cùng major thay binary rồi restart; data format tương thích, nhưng vẫn phải đọc release notes và test extension.
- Major upgrade cần `pg_dump`/restore, `pg_upgrade`, hoặc logical replication; không mount data directory 16 vào binary 17.

**Scenario:** Security patch 17.11 → 17.x khác với migration 16 → 17.

**Trade-off:** Minor upgrade ít downtime/risk hơn nhưng không phải zero-risk; major cho feature/support mới nhưng cần compatibility/cutover plan toàn hệ thống.

> **Bug ẩn / production — tag trôi:** Docker tag chỉ theo major (`postgres:17`) có thể đổi minor ngoài kiểm soát. Pin digest/explicit tested patch trong production, rollout standby/canary, nhưng vẫn có lịch cập nhật security.

## 8. Preflight major upgrade

```sql
SELECT extname, extversion FROM pg_extension ORDER BY extname;

SELECT c.oid::regclass AS invalid_index
FROM pg_index AS i
JOIN pg_class AS c ON c.oid = i.indexrelid
WHERE NOT i.indisvalid OR NOT i.indisready;

SELECT conrelid::regclass, conname, contype
FROM pg_constraint
WHERE NOT convalidated;

SELECT slot_name, slot_type, active, restart_lsn, wal_status
FROM pg_replication_slots;

SELECT pid, now() - xact_start AS age, state, left(query, 120)
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_start;
```

Ngoài ra inventory collation, C extensions, FDW, background workers, tablespace, large object, RLS/privilege, backup/restore time và client driver compatibility.

**Scenario:** Go/no-go trước rehearsal/cutover.

**Trade-off:** Preflight/rehearsal tốn thời gian và hạ tầng tạm, nhưng rẻ hơn phát hiện missing library/collation/index invalid trong maintenance window.

> **Bug ẩn / production — chỉ test schema:** Query compile chưa đủ; plan/performance có thể đổi vì optimizer/default/statistics mới. Replay workload/critical plans, concurrency và restore/failover drill trên target version.

## 9. `pg_upgrade`: nhanh nhưng cần binary + filesystem discipline

Chạy `--check` với hai cluster đã chuẩn bị và target mới được `initdb`:

```bash
pg_upgrade --check \
  --old-bindir=/opt/postgresql/16/bin \
  --new-bindir=/opt/postgresql/17/bin \
  --old-datadir=/data/pg16 \
  --new-datadir=/data/pg17
```

Sau khi backup/rehearsal và dừng write/cluster đúng runbook:

```bash
pg_upgrade \
  --old-bindir=/opt/postgresql/16/bin \
  --new-bindir=/opt/postgresql/17/bin \
  --old-datadir=/data/pg16 \
  --new-datadir=/data/pg17 \
  --clone
```

`--clone` cần filesystem hỗ trợ reflink; copy mode tốn disk/time hơn; `--link` nhanh nhưng sau khi new cluster start, old cluster không còn là rollback copy an toàn.

**Scenario:** Cluster nhiều TB cần downtime ngắn, binary extensions có bản target và cùng host/storage compatibility.

**Trade-off:** `pg_upgrade` nhanh vì reuse data files, nhưng cần dừng service/cutover chặt, disk strategy, extension binary mới và post-upgrade analyze.

> **Bug ẩn / production — link mode:** Start new cluster có thể sửa shared files; không coi old directory là rollback. Có filesystem snapshot/backup độc lập và fencing để không bao giờ start hai cluster trên cùng linked data.

> **Bug ẩn / production — standby/slot:** Standby, logical slots/subscriptions và replication origins cần procedure đúng source/target versions. PostgreSQL 17 có thêm khả năng migrate state nhưng prerequisite nghiêm ngặt; chạy `pg_upgrade --check`, đọc log và verify từng slot/subscription, không giả định tự động.

## 10. Dump/restore: sạch và portable hơn, downtime theo data size

```bash
pg_dumpall --host=old-primary --username=postgres \
  --globals-only --file=globals.sql

pg_dump --host=old-primary --username=postgres \
  --format=directory --jobs=4 --file=app.dump appdb

pg_restore --host=new-primary --username=postgres \
  --dbname=appdb --jobs=4 --exit-on-error app.dump
```

Dùng `pg_dump` binary của target/newer supported version để lấy fixes; restore vào target cô lập và chạy smoke/invariant.

**Scenario:** Muốn rebuild sạch, đổi encoding/layout có hỗ trợ, loại bloat hoặc cluster vừa đủ nhỏ cho RTO.

**Trade-off:** Portable/selective và clean data files, nhưng dump/restore + index build có thể lâu, cần disk/network và cutover delta strategy.

> **Bug ẩn / production — globals/secrets:** Một database dump không chứa đầy đủ cluster roles/tablespaces; globals dump có role metadata nhạy cảm. Quản lý secret/owner mapping, không commit dump vào source control.

> **Bug ẩn / production — restore success:** Exit 0 không chứng minh sequence, extension, privilege, collation, RLS, scheduled job và business invariant đúng. Chạy test app + catalog diff + row/checksum samples.

## 11. Logical replication cho blue/green major upgrade

Schema/DDL và sequence không tự replicate. Additive schema nên apply subscriber trước khi publisher phát row mới.

```sql
-- Publisher: inventory publication/table readiness.
SELECT pubname, puballtables, pubinsert, pubupdate, pubdelete, pubtruncate
FROM pg_publication;

-- Subscriber: monitor catch-up.
SELECT
    subname,
    pid,
    received_lsn,
    latest_end_lsn,
    latest_end_time
FROM pg_stat_subscription;
```

Cutover outline:

1. initial copy + continuous sync;
2. apply/test schema, extension và permission ở target;
3. reconcile row count/checksum/invariant theo key range;
4. quiesce/fence writes source;
5. đợi subscriber catch up tới cutover LSN;
6. đồng bộ sequence và non-replicated state;
7. switch endpoint, smoke test, giữ source read-only trong rollback window.

Sequence sync mẫu ở target sau khi đã fence source:

```sql
SELECT setval(
    'migration_lab.customer_customer_id_seq',
    GREATEST((SELECT max(customer_id) FROM migration_lab.customer), 1),
    true
);
```

**Scenario:** Major upgrade với downtime cutover vài giây/phút và khả năng test target lâu trước chuyển traffic.

**Trade-off:** Downtime ngắn hơn dump/pg_upgrade nhưng có thời gian chạy hai cluster, slot/WAL risk, DDL/sequence manual và reverse-replication rollback phức tạp.

> **Bug ẩn / production — divergence:** Sau khi target nhận write, failback source không còn là đổi DNS ngược. Cần reverse replication hoặc restore/reconcile; fencing source là bắt buộc để tránh split brain.

> **Bug ẩn / production — replica identity:** Update/delete cần replica identity. Table không có PK có thể cần `REPLICA IDENTITY FULL`, làm WAL/CPU/network lớn; audit trước initial sync.

## 12. Collation version sau OS/ICU/major upgrade

Tìm mismatch và dependent objects:

```sql
SELECT
    pg_describe_object(refclassid, refobjid, refobjsubid) AS collation,
    pg_describe_object(classid, objid, objsubid) AS dependent_object
FROM pg_depend AS d
JOIN pg_collation AS c
  ON refclassid = 'pg_collation'::regclass
 AND refobjid = c.oid
WHERE c.collversion <> pg_collation_actual_version(c.oid)
ORDER BY 1, 2;
```

Sau khi rebuild **tất cả** affected indexes/objects và validate sort/unique semantics:

```sql
-- Ví dụ cho user index phù hợp; exclusion/system cases cần runbook riêng:
-- REINDEX INDEX CONCURRENTLY schema.index_name;

-- Chỉ refresh sau rebuild:
-- ALTER COLLATION schema.collation_name REFRESH VERSION;
-- ALTER DATABASE current_database_name REFRESH COLLATION VERSION;
```

**Scenario:** Image/OS đổi ICU/libc làm sort order khác dù PostgreSQL schema/data không đổi.

**Trade-off:** Giữ provider/version cũ giảm migration risk nhưng bỏ update hệ thống; rebuild đúng tốn I/O/WAL nhưng bảo vệ search/unique/order correctness.

> **Bug ẩn / production — refresh trước:** `REFRESH VERSION` chỉ cập nhật metadata/cảnh báo, không rebuild hay kiểm tra object. Refresh trước làm mất tín hiệu trong khi index vẫn có thứ tự cũ và có thể trả sai/vi phạm uniqueness logic.

## 13. Post-upgrade validation và statistics

`pg_upgrade` không mang planner statistics theo cách có thể bỏ qua analyze; query plan ban đầu có thể tệ cho tới khi stats đủ.

```bash
vacuumdb --all --analyze-in-stages --jobs=4
```

```sql
SELECT extname, extversion FROM pg_extension ORDER BY extname;

SELECT datname, datcollversion
FROM pg_database
ORDER BY datname;

SELECT conrelid::regclass, conname
FROM pg_constraint
WHERE NOT convalidated;

SELECT c.oid::regclass
FROM pg_index AS i
JOIN pg_class AS c ON c.oid = i.indexrelid
WHERE NOT i.indisvalid OR NOT i.indisready;
```

Chạy restore/backup mới, RLS/privilege test, critical `EXPLAIN`, write/read smoke, replication/slot/archive, checksum/amcheck và capacity baseline.

**Scenario:** Chỉ mở full traffic sau khi target chứng minh correctness, performance và recoverability.

**Trade-off:** Analyze/check tạo I/O và kéo cutover/canary, nhưng tránh chạy optimizer mù hoặc bỏ sót invalid object.

> **Bug ẩn / production — rollback window:** Giữ source quá lâu mà không cập nhật security/backup tạo hệ thứ hai nguy hiểm; xóa quá sớm mất forensic/rollback. Định nghĩa immutable snapshot, retention, fencing và điều kiện kết thúc trước cutover.

## Bài tập

1. Inventory extension ở mọi database, phân loại contrib/third-party/C binary/preload.
2. Rehearse update một extension trên restore clone; đo locks, WAL và rollback path.
3. Chạy `pg_upgrade --check` giữa hai disposable clusters, ghi mọi prerequisite.
4. Mô phỏng logical blue/green, thêm column subscriber-first, sync sequence và fence source.
5. Tạo collation-dependent index trong lab, viết runbook rebuild-before-refresh.

## Tài liệu PostgreSQL 17 chính thức

- [CREATE EXTENSION](https://www.postgresql.org/docs/17/sql-createextension.html)
- [Packaging Related Objects into an Extension](https://www.postgresql.org/docs/17/extend-extensions.html)
- [Additional Supplied Modules](https://www.postgresql.org/docs/17/contrib.html)
- [Upgrading a PostgreSQL Cluster](https://www.postgresql.org/docs/17/upgrading.html)
- [`pg_upgrade`](https://www.postgresql.org/docs/17/pgupgrade.html)
- [Logical Replication Restrictions](https://www.postgresql.org/docs/17/logical-replication-restrictions.html)
- [ALTER COLLATION](https://www.postgresql.org/docs/17/sql-altercollation.html)
