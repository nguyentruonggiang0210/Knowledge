# 13 — Zero-downtime schema migrations

“Zero downtime” không có nghĩa DDL không lock. Nó nghĩa lock mạnh chỉ tồn tại trong budget rất ngắn, schema cũ/mới tương thích trong lúc rolling deploy, backfill có throttle/resume, và mọi phase có bằng chứng cùng đường rollback.

## Chuẩn bị

```sql
DROP SCHEMA IF EXISTS migration_lab CASCADE;
CREATE SCHEMA migration_lab;

CREATE TABLE migration_lab.customer (
    customer_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email text NOT NULL,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO migration_lab.customer (email)
SELECT 'user' || g || '@example.com'
FROM generate_series(1, 5000) AS g;

ANALYZE migration_lab.customer;
```

## 1. Preflight: lock budget trước DDL

Hầu hết `ALTER TABLE` mặc định lấy `ACCESS EXCLUSIVE` nếu subcommand không ghi khác. DDL metadata rất nhanh vẫn có thể chờ transaction dài, rồi đứng đầu lock queue và chặn request mới.

```sql
SELECT
    pid,
    application_name,
    state,
    xact_start,
    query_start,
    wait_event_type,
    wait_event,
    pg_blocking_pids(pid) AS blockers,
    left(query, 160) AS query
FROM pg_stat_activity
WHERE datname = current_database()
ORDER BY xact_start NULLS LAST;

BEGIN;
SET LOCAL lock_timeout = '1s';
SET LOCAL statement_timeout = '10s';
SET LOCAL transaction_timeout = '15s'; -- PostgreSQL 17+
ALTER TABLE migration_lab.customer
ADD COLUMN IF NOT EXISTS source text;
COMMIT;
```

**Scenario:** Migration chạy lúc còn traffic; nếu không lấy lock trong 1 giây thì fail-fast, không tạo lock convoy.

**Trade-off:** Timeout ngắn làm migration cần retry/orchestration, nhưng tốt hơn giữ hàng request production chờ vô hạn.

> **Bug ẩn / production — retry DDL:** Retry không jitter tạo thundering herd giữa nhiều deploy instance. Chỉ một migration runner được quyền DDL, exponential backoff và alert sau số lần giới hạn.

> **Bug ẩn / production — transaction dài:** `idle in transaction`, prepared transaction và session báo cáo lâu đều có thể giữ lock/snapshot. Không kill tự động chỉ vì age; xác định owner và rollback cost.

## 2. Add column: constant default nhanh, volatile default có thể rewrite

Từ PostgreSQL 11, add column với constant non-volatile default thường không rewrite từng row:

```sql
BEGIN;
SET LOCAL lock_timeout = '1s';
ALTER TABLE migration_lab.customer
ALTER COLUMN source SET DEFAULT 'web';
UPDATE migration_lab.customer SET source = 'web' WHERE source IS NULL;
ALTER TABLE migration_lab.customer ALTER COLUMN source SET NOT NULL;
COMMIT;
```

Vì cột đã được thêm nullable ở phase trước, ví dụ này minh họa backfill nhỏ trong lab. Trên bảng lớn phải tách backfill thành batch như mục 3.

Add trực tiếp constant default trên bảng khác:

```sql
CREATE TABLE migration_lab.fast_default_demo AS
SELECT g AS id FROM generate_series(1, 10000) AS g;

ALTER TABLE migration_lab.fast_default_demo
ADD COLUMN state text NOT NULL DEFAULT 'new';

SELECT count(*) FROM migration_lab.fast_default_demo WHERE state = 'new';
```

**Scenario:** Thêm feature flag/status mặc định giống nhau cho row cũ và mới.

**Trade-off:** Fast default giảm rewrite nhưng vẫn cần lock metadata; default làm row mới đúng, không thay migration compatibility của app cũ/mới.

> **Bug ẩn / production — volatile default:** `DEFAULT clock_timestamp()` hoặc expression volatile phải tính cho từng row và có thể rewrite table/index. Với bảng lớn, add nullable, deploy dual-write, backfill theo batch rồi enforce.

> **Bug ẩn / production — `IF NOT EXISTS`:** Nó chỉ kiểm tra tên cột đã tồn tại, không chứng minh type/default/nullability đúng. Migration idempotent phải audit catalog definition, không bỏ qua drift âm thầm.

## 3. Backfill online: keyset batch, throttle và resume

Thêm cột mới và trigger tạm để write mới không tạo thêm nợ:

```sql
ALTER TABLE migration_lab.customer
ADD COLUMN email_normalized text;

CREATE OR REPLACE FUNCTION migration_lab.sync_email_normalized()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.email_normalized := lower(NEW.email);
    RETURN NEW;
END;
$$;

CREATE TRIGGER customer_sync_email_normalized
BEFORE INSERT OR UPDATE OF email
ON migration_lab.customer
FOR EACH ROW
EXECUTE FUNCTION migration_lab.sync_email_normalized();
```

Chạy statement sau lặp lại cho tới `UPDATE 0`:

```sql
BEGIN;
SET LOCAL lock_timeout = '500ms';
SET LOCAL statement_timeout = '5s';

WITH batch AS (
    SELECT customer_id
    FROM migration_lab.customer
    WHERE email_normalized IS NULL
    ORDER BY customer_id
    FOR UPDATE SKIP LOCKED
    LIMIT 1000
)
UPDATE migration_lab.customer AS c
SET email_normalized = lower(c.email)
FROM batch
WHERE c.customer_id = batch.customer_id
RETURNING c.customer_id;
COMMIT;
```

Theo dõi debt:

```sql
SELECT
    count(*) FILTER (WHERE email_normalized IS NULL) AS remaining,
    min(customer_id) FILTER (WHERE email_normalized IS NULL) AS next_id
FROM migration_lab.customer;
```

**Scenario:** Backfill hàng trăm triệu row trong nhiều giờ/ngày mà OLTP vẫn chạy và job có thể resume.

**Trade-off:** Batch nhỏ giảm lock/WAL burst và replica lag nhưng kéo dài thời gian dual-schema; trigger/dual-write tăng write cost tạm thời.

> **Bug ẩn / production — OFFSET:** `OFFSET` ngày càng scan nhiều và row thay đổi làm skip/duplicate. Dùng primary-key keyset hoặc predicate `IS NULL`, commit mỗi batch, lưu progress/idempotency.

> **Bug ẩn / production — `SKIP LOCKED`:** Nó có thể bỏ row nóng mãi. Sau pass nhanh, chạy reconciliation không `SKIP LOCKED` hoặc retry theo key để chứng minh remaining về 0.

> **Bug ẩn / production — trigger tạm:** Trigger là hidden write path và chạy cho mọi client/bulk load. Đo latency, version-control, và chỉ drop sau khi tất cả app version đã dual-write đúng.

## 4. `NOT NULL` không scan dài bằng `CHECK NOT VALID`

Sau khi backfill remaining = 0:

```sql
ALTER TABLE migration_lab.customer
ADD CONSTRAINT customer_email_normalized_nn
CHECK (email_normalized IS NOT NULL)
NOT VALID;

ALTER TABLE migration_lab.customer
VALIDATE CONSTRAINT customer_email_normalized_nn;

BEGIN;
SET LOCAL lock_timeout = '1s';
ALTER TABLE migration_lab.customer
ALTER COLUMN email_normalized SET NOT NULL;
COMMIT;

ALTER TABLE migration_lab.customer
DROP CONSTRAINT customer_email_normalized_nn;
```

`NOT VALID` enforce row mới/row được update nhưng không scan row cũ lúc add. `VALIDATE` scan với lock nhẹ hơn; valid `CHECK` chứng minh non-null giúp `SET NOT NULL` bỏ table scan.

**Scenario:** Enforce column mới sau online backfill mà không giữ `ACCESS EXCLUSIVE` suốt full scan.

**Trade-off:** Nhiều phase/migration hơn nhưng lock mạnh ngắn và rollback từng phase rõ hơn.

> **Bug ẩn / production — drop proof sớm:** Không drop helper `CHECK` trong cùng command với `SET NOT NULL`; PostgreSQL cần constraint valid còn tồn tại để bỏ scan. Sau khi `attnotnull=true` mới drop helper.

## 5. Unique constraint bằng index concurrent

Chạy ngoài transaction block:

```sql
CREATE UNIQUE INDEX CONCURRENTLY customer_email_normalized_uidx
ON migration_lab.customer (email_normalized);
```

Sau khi index valid, attach thành constraint bằng metadata operation ngắn:

```sql
BEGIN;
SET LOCAL lock_timeout = '1s';
ALTER TABLE migration_lab.customer
ADD CONSTRAINT customer_email_normalized_uk
UNIQUE USING INDEX customer_email_normalized_uidx;
COMMIT;
```

Kiểm tra:

```sql
SELECT
    c.oid::regclass AS index_name,
    i.indisready,
    i.indisvalid,
    i.indisunique
FROM pg_index AS i
JOIN pg_class AS c ON c.oid = i.indexrelid
WHERE i.indrelid = 'migration_lab.customer'::regclass;
```

**Scenario:** Thêm unique business key trên bảng đang ghi mà không chặn DML suốt hai lần scan.

**Trade-off:** Concurrent build dùng nhiều I/O/CPU, chạy lâu hơn và chờ transaction cũ; uniqueness có thể bắt đầu enforce trước khi build kết thúc hoàn toàn.

> **Bug ẩn / production — invalid index:** Build fail để lại index invalid vẫn tạo write overhead, unique build còn có semantics enforcement đặc biệt. Audit `indisvalid`, drop/rebuild có chủ đích; không chỉ rerun `IF NOT EXISTS` vì tên invalid đã tồn tại.

> **Bug ẩn / production — transaction:** `CREATE INDEX CONCURRENTLY` và `REINDEX ... CONCURRENTLY` không chạy trong explicit transaction block. Migration framework phải hỗ trợ step non-transactional và resume state.

## 6. Foreign key với `NOT VALID` rồi `VALIDATE`

```sql
CREATE TABLE migration_lab.region (
    region_code text PRIMARY KEY,
    name text NOT NULL
);

INSERT INTO migration_lab.region VALUES ('APAC', 'Asia Pacific');

ALTER TABLE migration_lab.customer
ADD COLUMN region_code text NOT NULL DEFAULT 'APAC';

ALTER TABLE migration_lab.customer
ADD CONSTRAINT customer_region_fk
FOREIGN KEY (region_code)
REFERENCES migration_lab.region(region_code)
NOT VALID;

ALTER TABLE migration_lab.customer
VALIDATE CONSTRAINT customer_region_fk;

CREATE INDEX customer_region_idx
ON migration_lab.customer (region_code);
```

**Scenario:** Thêm relationship cho bảng lớn; write mới phải đúng ngay, row cũ được validate riêng.

**Trade-off:** Cửa sổ `convalidated=false` chấp nhận legacy violations nhưng không cho vi phạm mới. Operational complexity đổi lấy lock thấp hơn.

> **Bug ẩn / production — thứ tự:** Backfill child value trước khi parent keys tồn tại làm validate fail. Với logical replication, apply additive parent/schema changes ở subscriber trước publisher data thay đổi.

> **Bug ẩn / production — child index:** FK không tự tạo index phía child; validation/delete/update parent có thể đắt. Tạo index theo query/delete workload, thường concurrent ở bảng lớn.

## 7. Expand/contract cho rename hoặc type change

Đổi trực tiếp type có thể rewrite table + rebuild index, cần gần gấp đôi disk và lock mạnh. Thay bằng cột song song:

```sql
CREATE TABLE migration_lab.account (
    account_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    phone_legacy bigint
);

INSERT INTO migration_lab.account (phone_legacy)
VALUES (84901234567), (84907654321);

ALTER TABLE migration_lab.account ADD COLUMN phone_e164 text;

UPDATE migration_lab.account
SET phone_e164 = '+' || phone_legacy::text
WHERE phone_e164 IS NULL;

ALTER TABLE migration_lab.account
ADD CONSTRAINT account_phone_e164_ck
CHECK (phone_e164 ~ '^\+[1-9][0-9]{7,14}$')
NOT VALID;

ALTER TABLE migration_lab.account
VALIDATE CONSTRAINT account_phone_e164_ck;
```

Phases deploy:

1. expand schema, app cũ vẫn chạy;
2. app dual-write old/new và đọc fallback;
3. backfill + reconcile;
4. app đọc new-only;
5. dừng write old;
6. sau ít nhất một rollback window mới drop old.

```sql
-- Chỉ ở contract phase sau khi không còn reader/writer cũ:
-- ALTER TABLE migration_lab.account DROP COLUMN phone_legacy;
```

**Scenario:** Chuyển `bigint phone` sai modeling sang E.164 text trong rolling deployment nhiều pod.

**Trade-off:** Expand/contract tốn storage/code hai phiên bản và thời gian, đổi lại rollback app được và tránh rewrite/blocking cutover.

> **Bug ẩn / production — rename:** `ALTER TABLE ... RENAME COLUMN` nhanh về metadata nhưng phá app/query/report cũ ngay. Metadata-only không đồng nghĩa zero downtime; compatibility là điều kiện chính.

> **Bug ẩn / production — drop column:** Drop metadata nhanh nhưng space không lập tức trả OS; app cũ rollback sẽ hỏng. Delay destructive contract và không dùng `CASCADE` nếu chưa inventory dependency.

## 8. Phát hiện rewrite và ước lượng blast radius

```sql
SELECT
    c.oid::regclass AS relation,
    c.relfilenode,
    pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
    s.n_live_tup,
    s.n_dead_tup
FROM pg_class AS c
LEFT JOIN pg_stat_user_tables AS s ON s.relid = c.oid
WHERE c.oid IN (
    'migration_lab.customer'::regclass,
    'migration_lab.account'::regclass
);
```

Type change với content transformation/volatile default thường rewrite; rewrite có thể cần table + indexes gần gấp đôi disk, sinh WAL lớn và không MVCC-safe với snapshot cũ theo caveat tài liệu.

**Scenario:** Quyết định direct ALTER trong maintenance window hay expand/contract online.

**Trade-off:** Direct rewrite đơn giản về code nhưng có downtime/resource burst; online copy phức tạp nhưng kiểm soát cutover.

> **Bug ẩn / production — staging nhỏ:** Rewrite 1 GB nhanh không suy ra 1 TB tuyến tính vì checkpoint, WAL archive, replica replay, storage burst credit và lock queue. Test dữ liệu/IO gần production và tính headroom.

## 9. Migration runner, advisory lock và transaction boundary

Ngăn hai deployment cùng apply migration:

```sql
BEGIN;
SELECT pg_advisory_xact_lock(
    hashtextextended('database-advance-schema-migration', 0)
);
SET LOCAL lock_timeout = '1s';
SET LOCAL statement_timeout = '30s';

CREATE TABLE IF NOT EXISTS migration_lab.schema_migration (
    version text PRIMARY KEY,
    checksum text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO migration_lab.schema_migration (version, checksum)
VALUES ('20260828_001', 'sha256:replace-with-real-checksum')
ON CONFLICT (version) DO UPDATE
SET checksum = CASE
    WHEN migration_lab.schema_migration.checksum = EXCLUDED.checksum
    THEN migration_lab.schema_migration.checksum
    ELSE NULL
END;
COMMIT;
```

Ví dụ trên cố tình làm `NOT NULL` fail nếu cùng version có checksum khác, để drift không bị bỏ qua.

**Scenario:** CI/CD retry sau timeout và nhiều app instance start cùng lúc.

**Trade-off:** Central runner/advisory lock serialize schema evolution nhưng tạo một control-plane dependency; cần owner, timeout và observability.

> **Bug ẩn / production — lock scope:** Session-level advisory lock rò qua pool; dùng transaction-level. Nhưng concurrent index không ở transaction, nên runner vẫn cần durable migration state/leader lease bên ngoài statement đó.

## 10. Monitor và cancel migration an toàn

```sql
SELECT
    p.pid,
    p.command,
    p.phase,
    p.relid::regclass AS table_name,
    p.index_relid::regclass AS index_name,
    p.lockers_total,
    p.lockers_done,
    p.blocks_total,
    p.blocks_done,
    a.wait_event_type,
    a.wait_event
FROM pg_stat_progress_create_index AS p
JOIN pg_stat_activity AS a USING (pid);
```

Ưu tiên `pg_cancel_backend` để statement abort và session còn sống; `pg_terminate_backend` chỉ khi hiểu rollback/side effect.

```sql
-- Thay PID sau khi xác minh application_name, query và blocker graph:
-- SELECT pg_cancel_backend(12345);
```

**Scenario:** Concurrent index/backfill vượt error budget hoặc làm replica/disk gần đầy.

**Trade-off:** Cancel sớm bảo vệ production nhưng có thể để invalid index/phase dở; tiếp tục có thể hoàn tất nhưng vượt SLO. Runbook phải định nghĩa ngưỡng và cleanup.

> **Bug ẩn / production — client timeout:** Migration client timeout không chứng minh server statement đã dừng. Kiểm tra `pg_stat_activity`, catalog/index validity và migration state trước retry.

## 11. Checklist release không downtime

- schema expand tương thích ít nhất N-1 app version;
- preflight lock/long transaction/disk/WAL/replica lag;
- `lock_timeout`, `statement_timeout`, PostgreSQL 17 `transaction_timeout` theo phase;
- batch progress, throttle, reconciliation và resume key;
- constraint/index `convalidated`/`indisvalid` audit;
- subscriber/CDC schema ordering;
- contract phase sau rollback window và usage evidence;
- load/concurrency test, backup và abort condition.

```sql
SELECT
    conrelid::regclass AS table_name,
    conname,
    contype,
    convalidated
FROM pg_constraint
WHERE connamespace = 'migration_lab'::regnamespace
ORDER BY conrelid::regclass::text, conname;
```

**Scenario:** Go/no-go checklist cho migration table hàng trăm GB.

**Trade-off:** Nhiều guardrail làm delivery chậm hơn một migration “one shot”, nhưng đổi downtime không dự đoán thành các phase đo/rollback được.

> **Bug ẩn / production — rollback:** Rollback application sau contract destructive có thể không chạy. “Down migration” cũng có thể mất dữ liệu; rollback thực tế thường là roll-forward compatibility, backup/PITR hoặc restore có RTO đã drill.

## Bài tập

1. Giữ transaction đọc table ở Session A, chạy ALTER ở B và quan sát lock queue; thêm `lock_timeout`.
2. Backfill 1 triệu row với batch 1.000/10.000, đo WAL, dead tuples và replica budget.
3. Làm concurrent unique index fail do duplicate, audit/cleanup invalid index rồi chạy lại.
4. Thực hiện expand/contract `phone_legacy -> phone_e164` qua hai phiên bản app giả lập.
5. Viết migration manifest có precheck, execute, validate, abort và rollback/roll-forward cho từng phase.

## Tài liệu PostgreSQL 17 chính thức

- [ALTER TABLE](https://www.postgresql.org/docs/17/sql-altertable.html)
- [Modifying Tables](https://www.postgresql.org/docs/17/ddl-alter.html)
- [CREATE INDEX](https://www.postgresql.org/docs/17/sql-createindex.html)
- [Explicit Locking](https://www.postgresql.org/docs/17/explicit-locking.html)
- [MVCC caveats for table rewrites](https://www.postgresql.org/docs/17/mvcc-caveats.html)
- [Logical replication restrictions](https://www.postgresql.org/docs/17/logical-replication-restrictions.html)
