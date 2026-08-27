# 07 — Function, trigger, RLS và security

Database-side logic mạnh vì mọi client đều đi qua cùng invariant. Đổi lại, logic ẩn sau function/trigger/policy khó quan sát hơn code application; cần version control, test concurrency và quyền tối thiểu.

## Scenario và trade-off map

| Knowledge item | Scenario production | Trade-off cần quyết định |
|---|---|---|
| SQL function/volatility | deterministic formula/query reuse | Planner tối ưu được; khai volatility sai cho kết quả/index sai |
| PL/pgSQL transaction logic | atomic state transition nhiều statement | Central correctness; hidden logic, lock/retry và deploy coupling |
| Trigger/audit | invariant/audit cho mọi client | Coverage rộng; row trigger bulk overhead, recursion và bypass modes |
| Dynamic SQL | admin/report theo identifier động | Linh hoạt; identifier injection/search-path nếu không `%I`/allowlist |
| `SECURITY DEFINER` | capability hẹp với quyền owner | Least-privilege API; search-path/object hijack là privilege escalation |
| RLS | shared-table multi-tenant defense-in-depth | Policy tự áp mọi query; owner/bypass/context/pool semantics phức tạp |
| Security-invoker view | projection vẫn giữ caller RLS | Composition an toàn hơn; caller cần underlying privileges và plan có thể đổi |
| Least privilege/default privileges | migration owner tách runtime | Blast radius nhỏ; nhiều role/grant cần automation/audit drift |

## Chuẩn bị

```sql
DROP SCHEMA IF EXISTS security_lab CASCADE;
CREATE SCHEMA security_lab;

CREATE TABLE security_lab.account (
    account_id bigint PRIMARY KEY,
    balance numeric(14,2) NOT NULL CHECK (balance >= 0),
    updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO security_lab.account VALUES
    (1, 1000, now()), (2, 500, now());
```

## 1. SQL function và volatility

```sql
CREATE OR REPLACE FUNCTION security_lab.calculate_fee(p_amount numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
AS $$
    SELECT round(p_amount * 0.015, 2)
$$;

SELECT security_lab.calculate_fee(1000);
SELECT security_lab.calculate_fee(NULL);
```

- `IMMUTABLE`: cùng input luôn cùng output, không phụ thuộc DB/config/time.
- `STABLE`: trong một statement, output ổn định; có thể đọc DB.
- `VOLATILE`: có thể đổi mỗi call hoặc có side effect; mặc định.
- `STRICT`: gặp bất kỳ argument `NULL` thì trả `NULL` mà không gọi body.
- `PARALLEL SAFE/RESTRICTED/UNSAFE`: khai báo an toàn khi chạy trong parallel plan.

**Tình huống thực tế:** Công thức deterministic dùng trong query, expression index hoặc generated column.

> **Bug ẩn / production — volatility lie:** Đánh dấu `IMMUTABLE` cho function dùng `now()`, table lookup, timezone hoặc setting có thể làm planner fold/cache kết quả sai và làm index corruption logic. Khai báo theo hành vi thật, không để “tối ưu”.

> **Bug ẩn / production — overload:** Function overload với kiểu gần nhau có thể resolve bất ngờ khi literal/parameter là `unknown`. Cast input rõ và giữ API function đơn giản.

## 2. PL/pgSQL cho transaction logic

```sql
CREATE TABLE security_lab.transfer_request (
    idempotency_key uuid PRIMARY KEY,
    from_account bigint NOT NULL REFERENCES security_lab.account,
    to_account bigint NOT NULL REFERENCES security_lab.account,
    amount numeric(14,2) NOT NULL CHECK (amount > 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION security_lab.transfer_funds(
    p_from bigint,
    p_to bigint,
    p_amount numeric,
    p_idempotency_key uuid
)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
    v_inserted integer;
    v_locked integer;
    v_balance numeric;
BEGIN
    IF p_from = p_to OR p_amount <= 0 THEN
        RAISE EXCEPTION 'invalid transfer'
            USING ERRCODE = '22023';
    END IF;

    INSERT INTO security_lab.transfer_request
        (idempotency_key, from_account, to_account, amount)
    VALUES
        (p_idempotency_key, p_from, p_to, p_amount)
    ON CONFLICT (idempotency_key) DO NOTHING;

    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 0 THEN
        RETURN false; -- request đã được xử lý/đang tồn tại
    END IF;

    -- Mọi transfer lock theo account_id để giảm deadlock.
    PERFORM account_id
    FROM security_lab.account
    WHERE account_id IN (p_from, p_to)
    ORDER BY account_id
    FOR UPDATE;

    GET DIAGNOSTICS v_locked = ROW_COUNT;
    IF v_locked <> 2 THEN
        RAISE EXCEPTION 'account not found'
            USING ERRCODE = 'P0002';
    END IF;

    SELECT balance INTO STRICT v_balance
    FROM security_lab.account
    WHERE account_id = p_from;

    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'insufficient balance'
            USING ERRCODE = 'P0001';
    END IF;

    UPDATE security_lab.account
    SET balance = balance - p_amount
    WHERE account_id = p_from;

    UPDATE security_lab.account
    SET balance = balance + p_amount
    WHERE account_id = p_to;

    RETURN true;
END;
$$;

BEGIN;
SELECT security_lab.transfer_funds(
    1, 2, 100, '11111111-1111-1111-1111-111111111111'
);
SELECT * FROM security_lab.account ORDER BY account_id;
COMMIT;
```

**Tình huống thực tế:** Đóng gói state transition cần atomicity, lock ordering và idempotency cho nhiều client.

> **Bug ẩn / production — idempotency:** Cùng key nhưng payload khác ở ví dụ trên bị coi là request cũ. Production phải so request hash/from/to/amount và báo conflict nếu key bị reuse sai. Side effect ngoài DB cần transactional outbox; function không làm HTTP an toàn.

> **Bug ẩn / production — function không tự là transaction:** Function chạy bên trong transaction của caller và không `COMMIT` giữa chừng. Client vẫn phải xử lý rollback, timeout, serialization/deadlock retry cho toàn unit of work.

> **Bug ẩn / production — exception:** Bắt `WHEN OTHERS` rồi bỏ qua làm mất lỗi và có thể che invariant. Catch SQLSTATE cụ thể, thêm context, và chỉ tiếp tục khi có semantics rõ.

## 3. Trigger cho invariant cục bộ và audit

```sql
CREATE OR REPLACE FUNCTION security_lab.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := clock_timestamp();
    RETURN NEW;
END;
$$;

CREATE TRIGGER account_10_set_updated_at
BEFORE UPDATE ON security_lab.account
FOR EACH ROW
EXECUTE FUNCTION security_lab.set_updated_at();

UPDATE security_lab.account
SET balance = balance + 1
WHERE account_id = 1
RETURNING account_id, balance, updated_at;
```

Audit mẫu:

```sql
CREATE TABLE security_lab.account_audit (
    audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id bigint NOT NULL,
    operation text NOT NULL,
    old_row jsonb,
    new_row jsonb,
    changed_by text NOT NULL,
    changed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE OR REPLACE FUNCTION security_lab.audit_account()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO security_lab.account_audit
        (account_id, operation, old_row, new_row, changed_by)
    VALUES
        (COALESCE(NEW.account_id, OLD.account_id),
         TG_OP,
         CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END,
         CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END,
         session_user);
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER account_90_audit
AFTER INSERT OR UPDATE OR DELETE ON security_lab.account
FOR EACH ROW
EXECUTE FUNCTION security_lab.audit_account();

UPDATE security_lab.account SET balance = balance + 5 WHERE account_id = 2;
SELECT * FROM security_lab.account_audit ORDER BY audit_id;
```

> **Bug ẩn / production — row trigger:** Bulk update một triệu row gọi trigger một triệu lần, tạo WAL/audit khổng lồ. Cân nhắc statement trigger với transition tables, logical decoding hoặc audit pipeline tùy yêu cầu.

> **Bug ẩn / production — recursion/order:** Trigger update lại cùng table có thể recurse. Nhiều trigger cùng timing/event chạy theo thứ tự tên; prefix tên có chủ đích nhưng tốt hơn tránh phụ thuộc ngầm. Test `INSERT ... ON CONFLICT DO UPDATE`, cascade và multi-row DML.

> **Bug ẩn / production — audit identity:** `current_user` có thể là function owner trong `SECURITY DEFINER`; `session_user` là login gốc nhưng pool thường dùng một login chung. Truyền authenticated actor qua context tin cậy và lưu request/trace ID; không mặc định DB role chính là end user.

> **Bug ẩn / production — trigger bypass:** Superuser, replication behavior, `session_replication_role`, disabled trigger hoặc restore mode có thể thay đổi việc trigger chạy. Audit compliance cần threat model và hệ thống chống sửa/xóa ngoài table audit thường.

## 4. Dynamic SQL an toàn

```sql
CREATE OR REPLACE FUNCTION security_lab.count_rows(
    p_schema name,
    p_table name
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_count bigint;
BEGIN
    EXECUTE format('SELECT count(*) FROM %I.%I', p_schema, p_table)
    INTO v_count;
    RETURN v_count;
END;
$$;

SELECT security_lab.count_rows('security_lab', 'account');
```

Dùng `%I` cho identifier, `%L` cho literal; values trong DML nên dùng `EXECUTE ... USING`.

> **Bug ẩn / production — SQL injection:** Nối chuỗi identifier/value trực tiếp cho phép injection và lỗi quote. Parameter placeholder không đại diện cho table/column name, nên identifier phải allowlist và quote bằng `%I`.

## 5. `SECURITY DEFINER` và `search_path`

`SECURITY INVOKER` (mặc định) chạy với quyền caller. `SECURITY DEFINER` chạy với quyền owner và là privilege boundary.

```sql
CREATE OR REPLACE FUNCTION security_lab.account_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, security_lab
AS $$
    SELECT count(*) FROM security_lab.account
$$;

REVOKE ALL ON FUNCTION security_lab.account_count() FROM PUBLIC;
-- Chỉ grant cho role thực sự cần:
-- GRANT EXECUTE ON FUNCTION security_lab.account_count() TO reporting_role;
```

> **Bug ẩn / production — object hijacking:** `SECURITY DEFINER` với `search_path` chứa schema user ghi được có thể gọi nhầm function/operator giả mạo và leo quyền. Schema-qualify object, đặt `pg_catalog`/schema tin cậy, revoke `PUBLIC EXECUTE`, và owner function không nên là superuser.

> **Bug ẩn / production — default EXECUTE:** Function mới thường có `EXECUTE` cho `PUBLIC`. Migration phải revoke/grant trong cùng transaction để không có cửa sổ quyền rộng.

## 6. Row-Level Security cho multi-tenant

```sql
CREATE TABLE security_lab.tenant_document (
    document_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id bigint NOT NULL,
    title text NOT NULL,
    body text NOT NULL
);

INSERT INTO security_lab.tenant_document (tenant_id, title, body) VALUES
    (1, 'Tenant 1 private', 'secret A'),
    (2, 'Tenant 2 private', 'secret B');

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lesson_runtime') THEN
        CREATE ROLE lesson_runtime NOLOGIN;
    END IF;
END
$$;

GRANT USAGE ON SCHEMA security_lab TO lesson_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE
ON security_lab.tenant_document TO lesson_runtime;
GRANT USAGE, SELECT
ON SEQUENCE security_lab.tenant_document_document_id_seq TO lesson_runtime;

ALTER TABLE security_lab.tenant_document ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_lab.tenant_document FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_document_isolation
ON security_lab.tenant_document
FOR ALL
TO lesson_runtime
USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::bigint
)
WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::bigint
);
```

Test như application role:

```sql
BEGIN;
SET LOCAL ROLE lesson_runtime;
SET LOCAL app.tenant_id = '1';

SELECT * FROM security_lab.tenant_document; -- chỉ tenant 1

INSERT INTO security_lab.tenant_document (tenant_id, title, body)
VALUES (1, 'Allowed', 'tenant 1');

-- Phải lỗi do WITH CHECK:
-- INSERT INTO security_lab.tenant_document (tenant_id, title, body)
-- VALUES (2, 'Forbidden', 'cross tenant');
ROLLBACK;
```

- `USING`: row cũ caller được thấy/target.
- `WITH CHECK`: row mới sau insert/update được phép tồn tại.
- Nhiều permissive policy thường kết hợp bằng OR; restrictive policy có thể thêm điều kiện AND-like.

**Tình huống thực tế:** Defense-in-depth cho SaaS multi-tenant khi nhiều query path truy cập chung bảng.

> **Bug ẩn / production — bypass:** Superuser, role có `BYPASSRLS`, và thường table owner có thể bỏ qua RLS; `FORCE ROW LEVEL SECURITY` thay đổi hành vi owner nhưng không thắng superuser. Application role không được sở hữu bảng hoặc có quyền bypass.

> **Bug ẩn / production — tenant context:** Custom GUC `app.tenant_id` có thể do session tự đặt. Nó chỉ an toàn khi application xác thực tenant và user không thể gửi SQL tùy ý; với threat model mạnh hơn, ánh xạ từ `current_user`/signed context qua function được kiểm soát. RLS không sửa SQL injection.

> **Bug ẩn / production — connection pool:** `SET app.tenant_id='1'` cấp session có thể rò sang request tenant 2 khi tái sử dụng connection. Dùng `BEGIN; SET LOCAL ...; ... COMMIT;`, reset-on-return và test pool failure path.

> **Bug ẩn / production — missing policy:** Khi RLS enabled và không có applicable policy, hành vi là default-deny. Đây an toàn nhưng có thể gây outage sau deploy role/policy sai; test matrix SELECT/INSERT/UPDATE/DELETE cho từng role.

## 7. View và RLS

View chạy theo security semantics cần được chọn có chủ đích. PostgreSQL hiện đại hỗ trợ security-invoker view để quyền/RLS của caller áp dụng.

```sql
CREATE VIEW security_lab.tenant_document_titles
WITH (security_invoker = true)
AS
SELECT document_id, tenant_id, title
FROM security_lab.tenant_document;

GRANT SELECT ON security_lab.tenant_document_titles TO lesson_runtime;

BEGIN;
SET LOCAL ROLE lesson_runtime;
SET LOCAL app.tenant_id = '2';
SELECT * FROM security_lab.tenant_document_titles; -- chỉ tenant 2
ROLLBACK;
```

> **Bug ẩn / production — view owner semantics:** View cũ/mặc định có thể áp quyền và RLS theo owner theo cách caller không dự đoán. Kiểm tra `security_invoker`, `security_barrier`, function bên trong và version PostgreSQL; viết test chống cross-tenant thay vì suy luận.

## 8. Least privilege checklist

```sql
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

SELECT
    grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'security_lab'
ORDER BY grantee, table_name, privilege_type;
```

- role migration sở hữu object, tách khỏi runtime role;
- runtime chỉ có `CONNECT`, `USAGE`, DML/function cần thiết;
- không cấp superuser/owner/BYPASSRLS cho application;
- TLS và secret rotation ở tầng kết nối;
- log không chứa password/token/PII không cần thiết;
- quyền default cho object tương lai được quản lý bằng `ALTER DEFAULT PRIVILEGES` đúng owner.

> **Bug ẩn / production — default privileges:** `ALTER DEFAULT PRIVILEGES` áp cho object được tạo **sau này** bởi một owner cụ thể, không sửa object cũ và không tự áp cho owner khác. Kiểm tra migration role thực tế.

## Bài tập

1. Test hai transfer ngược chiều đồng thời; chứng minh lock ordering giảm deadlock.
2. Bulk update 100.000 row với/không row trigger, đo WAL/thời gian.
3. Viết test RLS cho mọi command, tenant context thiếu/sai, owner và runtime role.
4. Tạo một function `SECURITY DEFINER` cố tình có `search_path` nguy hiểm trong lab, chứng minh object hijacking rồi sửa.
5. Thiết kế audit identity khi app dùng một pooled DB login nhưng có end-user ID riêng.
