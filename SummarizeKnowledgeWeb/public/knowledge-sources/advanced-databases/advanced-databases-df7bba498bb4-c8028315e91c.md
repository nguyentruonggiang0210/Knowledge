# 11 — Data modeling và integrity nâng cao

Mục tiêu của bài này không phải tạo thật nhiều type hoặc constraint. Mục tiêu là đặt invariant ở tầng thấp nhất có thể chứng minh đúng dưới concurrency, đồng thời giữ migration và query đủ đơn giản để vận hành.

## Chuẩn bị

```sql
DROP SCHEMA IF EXISTS model_lab CASCADE;
CREATE SCHEMA model_lab;
```

## 1. Domain: tái sử dụng luật cho một scalar

Domain phù hợp khi nhiều bảng dùng cùng một khái niệm scalar và cùng validation.

```sql
CREATE DOMAIN model_lab.email_text AS text
CHECK (
    VALUE IS NULL
    OR VALUE ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
);

CREATE DOMAIN model_lab.nonnegative_money AS numeric(14,2)
CHECK (VALUE IS NULL OR VALUE >= 0);

CREATE TABLE model_lab.customer (
    customer_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email model_lab.email_text NOT NULL UNIQUE,
    credit_limit model_lab.nonnegative_money NOT NULL DEFAULT 0
);

INSERT INTO model_lab.customer (email, credit_limit)
VALUES ('an@example.com', 1000.00)
RETURNING *;
```

**Scenario:** Email và amount xuất hiện ở nhiều bounded context nhưng đều cần baseline validation giống nhau.

**Trade-off:** Domain giảm lặp DDL và giúp schema tự mô tả, nhưng thay constraint của domain tác động mọi column sử dụng nó và làm migration có blast radius lớn hơn.

> **Bug ẩn / production — `NULL`:** Nên để domain constraint chấp nhận `NULL`, rồi đặt `NOT NULL` tại từng column. Một domain `NOT NULL` vẫn có những góc tương tác với outer join/composite value khó đoán; nullability thường là thuộc tính của field, không phải của scalar type toàn hệ thống.

> **Bug ẩn / production — regex email:** Regex mẫu chỉ là kiểm tra hình dạng, không chứng minh mailbox tồn tại và không bao phủ toàn bộ RFC. Đừng biến constraint thành parser phức tạp/volatile; canonicalization và verification vẫn là business workflow.

Thêm rule mới vào domain lớn theo hai pha:

```sql
ALTER DOMAIN model_lab.email_text
ADD CONSTRAINT email_reasonable_length_ck
CHECK (VALUE IS NULL OR length(VALUE) <= 320)
NOT VALID;

ALTER DOMAIN model_lab.email_text
VALIDATE CONSTRAINT email_reasonable_length_ck;
```

> **Bug ẩn / production — domain evolution:** Domain `CHECK` được PostgreSQL giả định là immutable. Nếu rule gọi function rồi function đổi semantics, row cũ không tự được recheck và dump/restore có thể lỗi. Drop/re-add hoặc `NOT VALID`/`VALIDATE` constraint theo migration có kiểm chứng.

## 2. Generated column: giá trị dẫn xuất cùng row

PostgreSQL 17 chỉ hỗ trợ generated column dạng `STORED`; expression phải immutable và không được đọc row/table khác.

```sql
CREATE TABLE model_lab.invoice_line (
    invoice_id bigint NOT NULL,
    line_no integer NOT NULL CHECK (line_no > 0),
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price model_lab.nonnegative_money NOT NULL,
    discount model_lab.nonnegative_money NOT NULL DEFAULT 0,
    line_total numeric(16,2)
        GENERATED ALWAYS AS (quantity * unit_price - discount) STORED,
    PRIMARY KEY (invoice_id, line_no),
    CHECK (discount <= quantity * unit_price)
);

INSERT INTO model_lab.invoice_line
    (invoice_id, line_no, quantity, unit_price, discount)
VALUES (1, 1, 3, 19.90, 5.00)
RETURNING *;

UPDATE model_lab.invoice_line
SET quantity = 4
WHERE invoice_id = 1 AND line_no = 1
RETURNING quantity, line_total;
```

**Scenario:** Một biểu thức được đọc/lọc nhiều và phải luôn đồng bộ với base columns trong cùng row.

**Trade-off:** Đọc đơn giản hơn và có thể index trực tiếp, đổi lại mỗi write tính/lưu thêm dữ liệu; đổi expression có thể cần migration/rewrite đáng kể.

```sql
CREATE INDEX invoice_line_total_idx
ON model_lab.invoice_line (line_total);
```

> **Bug ẩn / production — generated column:** Không dùng `now()`, timezone-dependent function, subquery hoặc lookup table trong expression. Generated column không thay aggregate liên row như invoice total; invariant đó cần transaction logic, trigger được test, hoặc không lưu duplicated total.

> **Bug ẩn / production — logical replication:** Trong PostgreSQL 17, generated columns bị bỏ qua trong logical replication và không được đưa vào publication column list. Subscriber phải có schema/expression tương thích; test CDC trước khi dựa vào field này ở downstream.

## 3. Surrogate key, natural key và uniqueness theo tenant

Surrogate key giúp FK nhỏ/ổn định; natural key vẫn cần unique constraint nếu business coi nó là định danh.

```sql
CREATE TABLE model_lab.product (
    product_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id bigint NOT NULL,
    sku text NOT NULL,
    external_code text,
    name text NOT NULL,
    UNIQUE (public_id),
    UNIQUE (tenant_id, sku),
    UNIQUE NULLS NOT DISTINCT (tenant_id, external_code)
);

INSERT INTO model_lab.product (tenant_id, sku, external_code, name)
VALUES (1, 'PG-BOOK', NULL, 'PostgreSQL Production')
RETURNING product_id, public_id;
```

**Scenario:** `product_id` phục vụ join nội bộ, UUID khó đoán dùng ở public API, còn `(tenant_id, sku)` bảo vệ identity nghiệp vụ.

**Trade-off:** Mỗi key/index tăng storage và write amplification. UUID ngẫu nhiên phân tán tốt khi sinh ở nhiều node nhưng B-tree locality kém hơn identity tuần tự.

> **Bug ẩn / production — surrogate-only:** Có primary key tự sinh không ngăn hai row cùng SKU/idempotency key. Nếu business nói “không được trùng”, phải có unique/exclusion constraint tương ứng, không chỉ kiểm tra trước bằng `SELECT`.

> **Bug ẩn / production — sequence:** Sequence/identity không rollback và có gap là bình thường. Không dùng tính liên tục của ID để đếm giao dịch, phát hiện mất dữ liệu hoặc làm số chứng từ pháp lý.

## 4. Deferred constraint cho thay đổi hợp lệ ở cuối transaction

Chỉ `UNIQUE`, `PRIMARY KEY`, `REFERENCES` và `EXCLUDE` có thể deferred; `NOT NULL` và `CHECK` không chịu tác động của `SET CONSTRAINTS`.

```sql
CREATE TABLE model_lab.board_card (
    list_id bigint NOT NULL,
    card_id bigint NOT NULL,
    position integer NOT NULL CHECK (position > 0),
    PRIMARY KEY (list_id, card_id),
    CONSTRAINT board_card_position_uk
        UNIQUE (list_id, position)
        DEFERRABLE INITIALLY IMMEDIATE
);

INSERT INTO model_lab.board_card VALUES
    (1, 10, 1), (1, 20, 2);

BEGIN;
SET CONSTRAINTS model_lab.board_card_position_uk DEFERRED;
UPDATE model_lab.board_card
SET position = CASE card_id WHEN 10 THEN 2 WHEN 20 THEN 1 END
WHERE list_id = 1 AND card_id IN (10, 20);
SET CONSTRAINTS model_lab.board_card_position_uk IMMEDIATE;
COMMIT;

SELECT * FROM model_lab.board_card ORDER BY position;
```

**Scenario:** Swap/reorder nhiều row có trạng thái trung gian trùng nhưng trạng thái cuối transaction hợp lệ.

**Trade-off:** Deferred checking cho phép transaction biểu đạt tự nhiên hơn nhưng lỗi xuất hiện muộn ở `SET CONSTRAINTS`/`COMMIT`, khó quy về statement cụ thể và có overhead.

> **Bug ẩn / production — lỗi lúc commit:** Application phải coi `COMMIT` là operation có thể fail và không phát side effect trước khi commit chắc chắn. Deferred unique constraint cũng không dùng được làm arbiter cho mọi `ON CONFLICT` workflow; test câu UPSERT thực tế.

## 5. Range, multirange và exclusion constraint

Range biểu diễn interval rõ hơn hai column rời và có operator overlap/containment. Quy ước `[)` thường phù hợp lịch: bắt đầu được tính, kết thúc không tính.

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE model_lab.booking (
    booking_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id bigint NOT NULL,
    room_id bigint NOT NULL,
    status text NOT NULL CHECK (status IN ('held', 'confirmed', 'cancelled')),
    during tstzrange NOT NULL,
    CHECK (
        NOT isempty(during)
        AND NOT lower_inf(during)
        AND NOT upper_inf(during)
    ),
    CONSTRAINT booking_no_confirmed_overlap
        EXCLUDE USING gist (
            tenant_id WITH =,
            room_id WITH =,
            during WITH &&
        )
        WHERE (status = 'confirmed')
        DEFERRABLE INITIALLY IMMEDIATE
);

INSERT INTO model_lab.booking (tenant_id, room_id, status, during)
VALUES
    (1, 101, 'confirmed', tstzrange(
        '2026-09-01 09:00+07', '2026-09-01 10:00+07', '[)'
    )),
    (1, 101, 'confirmed', tstzrange(
        '2026-09-01 10:00+07', '2026-09-01 11:00+07', '[)'
    ));

SELECT booking_id, during
FROM model_lab.booking
WHERE tenant_id = 1
  AND room_id = 101
  AND during && tstzrange(
      '2026-09-01 09:30+07', '2026-09-01 10:15+07', '[)'
  );
```

Multirange hợp nhất các khoảng rời nhau:

```sql
SELECT tstzmultirange(
    tstzrange('2026-09-01 09:00+07', '2026-09-01 10:00+07', '[)'),
    tstzrange('2026-09-01 11:00+07', '2026-09-01 12:00+07', '[)')
) AS occupied_windows;
```

**Scenario:** Booking, effective-date, IP/price/measurement interval cần query overlap và invariant “không giao nhau”.

**Trade-off:** Range + GiST diễn đạt đúng và chống race tốt hơn check-then-insert, nhưng operator/exclusion là PostgreSQL-specific và GiST tăng write/storage cost.

> **Bug ẩn / production — boundary/timezone:** Trộn `[]`, `[)` hoặc `timestamp`/`timestamptz` gây overlap/gap ở biên. Chốt timezone và boundary convention trong domain contract, test đúng thời điểm DST/giao ngày.

> **Bug ẩn / production — exclusion và `NULL`:** `NULL` có thể không xung đột như bạn kỳ vọng. Đặt `NOT NULL` cho mọi dimension bắt buộc và test partial predicate (`status`) khi state đổi đồng thời.

## 6. Composite foreign key, `MATCH FULL` và delete semantics

```sql
CREATE TABLE model_lab.taxpayer (
    country_code char(2) NOT NULL,
    tax_id text NOT NULL,
    legal_name text NOT NULL,
    PRIMARY KEY (country_code, tax_id)
);

CREATE TABLE model_lab.tax_invoice (
    invoice_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    taxpayer_country char(2),
    taxpayer_tax_id text,
    amount model_lab.nonnegative_money NOT NULL,
    CONSTRAINT tax_invoice_taxpayer_fk
        FOREIGN KEY (taxpayer_country, taxpayer_tax_id)
        REFERENCES model_lab.taxpayer (country_code, tax_id)
        MATCH FULL
        ON UPDATE CASCADE
        ON DELETE RESTRICT
        DEFERRABLE INITIALLY IMMEDIATE
);

INSERT INTO model_lab.taxpayer VALUES ('VN', '0312345678', 'Công ty A');
INSERT INTO model_lab.tax_invoice
    (taxpayer_country, taxpayer_tax_id, amount)
VALUES ('VN', '0312345678', 500.00), (NULL, NULL, 20.00);
```

`MATCH FULL` yêu cầu composite FK hoặc toàn bộ `NULL`, hoặc toàn bộ có giá trị; trạng thái nửa-null bị từ chối.

```sql
CREATE INDEX tax_invoice_taxpayer_idx
ON model_lab.tax_invoice (taxpayer_country, taxpayer_tax_id);
```

**Scenario:** Key nghiệp vụ nhiều cột và relationship có thể hoàn toàn vắng mặt nhưng không được thiếu một nửa.

**Trade-off:** Composite key giữ tenant/business boundary trong database, đổi lại FK/index rộng và mọi join phải mang đủ key.

> **Bug ẩn / production — FK index:** PostgreSQL không tự tạo index phía referencing table. Thiếu index làm delete/update parent scan child lớn và giữ lock lâu.

> **Bug ẩn / production — cascade:** `ON DELETE CASCADE` tiện nhưng một parent delete có thể fan-out hàng triệu row, tạo WAL/bloat/replica lag và trigger storm. Dùng khi lifecycle thực sự thuộc parent; nếu cần audit/retention, thường chọn `RESTRICT` + workflow xóa chunk.

## 7. Snapshot lịch sử thay vì join vào “hiện tại”

```sql
CREATE TABLE model_lab.catalog_item (
    product_id bigint PRIMARY KEY,
    current_name text NOT NULL,
    current_price model_lab.nonnegative_money NOT NULL
);

CREATE TABLE model_lab.order_line_snapshot (
    order_id bigint NOT NULL,
    line_no integer NOT NULL,
    product_id bigint NOT NULL REFERENCES model_lab.catalog_item,
    product_name_at_order text NOT NULL,
    unit_price_at_order model_lab.nonnegative_money NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (order_id, line_no)
);

INSERT INTO model_lab.catalog_item VALUES (100, 'Sách PostgreSQL', 30.00);

INSERT INTO model_lab.order_line_snapshot
    (order_id, line_no, product_id, product_name_at_order,
     unit_price_at_order, quantity)
SELECT 500, 1, product_id, current_name, current_price, 2
FROM model_lab.catalog_item
WHERE product_id = 100;
```

**Scenario:** Invoice/order phải giữ đúng tên và giá tại lúc giao dịch dù catalog đổi sau đó.

**Trade-off:** Snapshot duplicate dữ liệu có chủ đích và cần write path đúng; join catalog hiện tại ít storage hơn nhưng làm lịch sử thay đổi ngược thời gian.

> **Bug ẩn / production — duplicated truth:** Ghi cả `total`, snapshot price và quantity nhưng update không đồng bộ tạo ba nguồn sự thật. Chốt field nào immutable sau order, field nào derived, và constraint/state transition nào cho phép sửa.

## 8. Idempotency record: cùng key phải cùng request

Idempotency không chỉ là “unique key”. Cần lưu fingerprint request và outcome để retry trả lại đúng kết quả, đồng thời phát hiện key bị tái sử dụng cho payload khác.

```sql
CREATE TABLE model_lab.api_idempotency (
    tenant_id bigint NOT NULL,
    idempotency_key text NOT NULL,
    request_hash text NOT NULL,
    state text NOT NULL CHECK (state IN ('processing', 'done', 'failed')),
    owner_token uuid NOT NULL,
    locked_until timestamptz NOT NULL,
    response_status integer,
    response_body jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, idempotency_key),
    CHECK (
        state <> 'done'
        OR (response_status IS NOT NULL AND response_body IS NOT NULL)
    )
);

INSERT INTO model_lab.api_idempotency
    (tenant_id, idempotency_key, request_hash, state,
     owner_token, locked_until)
VALUES
    (1, 'checkout-abc', 'sha256:payload-v1', 'processing',
     '44444444-4444-4444-4444-444444444444'::uuid,
     clock_timestamp() + INTERVAL '30 seconds')
ON CONFLICT (tenant_id, idempotency_key) DO NOTHING
RETURNING owner_token, state;

-- Nếu INSERT không trả row, chạy statement mới để đọc outcome hiện hữu:
SELECT request_hash, state, response_status, response_body, locked_until
FROM model_lab.api_idempotency
WHERE tenant_id = 1 AND idempotency_key = 'checkout-abc';
```

UUID cố định chỉ để lab chạy lặp/dễ đọc; production sinh token ngẫu nhiên cho mỗi lần claim và dùng đúng token trả về như fencing token.

Application phải so `request_hash`; khác hash là `409 Conflict`, không trả response cũ.

Hoàn tất chỉ khi còn sở hữu token:

```sql
UPDATE model_lab.api_idempotency
SET state = 'done',
    response_status = 201,
    response_body = '{"order_id":500}'::jsonb,
    updated_at = clock_timestamp()
WHERE tenant_id = 1
  AND idempotency_key = 'checkout-abc'
  AND request_hash = 'sha256:payload-v1'
  AND owner_token = '44444444-4444-4444-4444-444444444444'::uuid
  AND state = 'processing'
RETURNING response_status, response_body;
```

**Scenario:** Client timeout sau commit rồi retry checkout; server không được trừ stock/tạo order lần hai.

**Trade-off:** Lưu response tăng storage/PII retention; chỉ lưu phần response ổn định cần replay, TTL theo business và encrypt/redact dữ liệu nhạy cảm.

> **Bug ẩn / production — CTE visibility:** Đừng cố `INSERT ... ON CONFLICT DO NOTHING` rồi `UNION SELECT` existing row trong cùng statement và tin luôn có kết quả. Khi conflict với transaction concurrent, `ON CONFLICT` có thể thấy conflict mà snapshot của `SELECT` chưa thấy row đó. Dùng statement kế tiếp/retry có giới hạn.

> **Bug ẩn / production — lease:** Worker chết ở `processing` cần lease/reclaim với token mới; nhưng reclaim quá sớm cho phép hai owner chạy side effect song song. Deadline phải lớn hơn worst-case đã đo hoặc workflow phải có fencing/idempotency ở dependency tiếp theo.

## 9. Transactional outbox đầy đủ

```sql
CREATE TABLE model_lab.purchase_order (
    order_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id bigint NOT NULL,
    state text NOT NULL CHECK (state IN ('pending', 'paid', 'cancelled')),
    version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
    total model_lab.nonnegative_money NOT NULL
);

CREATE TABLE model_lab.integration_outbox (
    event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id bigint NOT NULL,
    aggregate_type text NOT NULL,
    aggregate_id bigint NOT NULL,
    aggregate_version bigint NOT NULL CHECK (aggregate_version > 0),
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    available_at timestamptz NOT NULL DEFAULT now(),
    locked_by uuid,
    locked_until timestamptz,
    attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, aggregate_type, aggregate_id, aggregate_version)
);

CREATE INDEX integration_outbox_ready_idx
ON model_lab.integration_outbox (available_at, event_id)
WHERE published_at IS NULL;
```

Business write và publish intent phải cùng transaction:

```sql
BEGIN;
WITH new_order AS (
    INSERT INTO model_lab.purchase_order (tenant_id, state, total)
    VALUES (1, 'pending', 59.80)
    RETURNING order_id, tenant_id, version, state, total
)
INSERT INTO model_lab.integration_outbox
    (tenant_id, aggregate_type, aggregate_id, aggregate_version,
     event_type, payload)
SELECT tenant_id, 'order', order_id, version, 'OrderCreated',
       jsonb_build_object(
           'order_id', order_id,
           'state', state,
           'total', total
       )
FROM new_order
RETURNING event_id, aggregate_id;
COMMIT;
```

Claim bằng lease, commit nhanh rồi mới gọi broker:

```sql
BEGIN;
WITH picked AS (
    SELECT event_id
    FROM model_lab.integration_outbox
    WHERE published_at IS NULL
      AND available_at <= clock_timestamp()
      AND (locked_until IS NULL OR locked_until < clock_timestamp())
    ORDER BY available_at, event_id
    FOR UPDATE SKIP LOCKED
    LIMIT 100
)
UPDATE model_lab.integration_outbox AS o
SET locked_by = '33333333-3333-3333-3333-333333333333'::uuid,
    locked_until = clock_timestamp() + INTERVAL '30 seconds',
    attempts = attempts + 1
FROM picked
WHERE o.event_id = picked.event_id
RETURNING o.event_id, o.aggregate_id, o.aggregate_version, o.payload;
COMMIT;
```

Sau broker acknowledgement:

```sql
UPDATE model_lab.integration_outbox
SET published_at = clock_timestamp(),
    locked_by = NULL,
    locked_until = NULL
WHERE event_id = (
      SELECT event_id
      FROM model_lab.integration_outbox
      WHERE locked_by = '33333333-3333-3333-3333-333333333333'::uuid
        AND published_at IS NULL
      ORDER BY event_id
      LIMIT 1
  )
  AND locked_by = '33333333-3333-3333-3333-333333333333'::uuid
  AND published_at IS NULL
RETURNING event_id, published_at;
```

**Scenario:** Database commit và message publish không có distributed transaction; outbox tạo at-least-once delivery có thể phục hồi.

**Trade-off:** Có thêm table, polling, cleanup, duplicate và lag. Đổi lại không có cửa sổ “order đã commit nhưng process chết trước publish intent”.

> **Bug ẩn / production — network trong transaction:** Không giữ row lock/transaction mở khi gọi broker. Nếu publish thành công rồi crash trước ack DB, event sẽ được gửi lại; consumer phải deduplicate bằng `event_id` và xử lý version theo từng aggregate.

> **Bug ẩn / production — ordering:** `SKIP LOCKED` cố ý cho view không nhất quán và có thể publish aggregate version 2 trước version 1 khi nhiều worker. Nếu ordering per aggregate bắt buộc, partition/serialize theo aggregate key hoặc consumer buffer/reconcile version gap; không tuyên bố global ordering từ `ORDER BY` claim.

> **Bug ẩn / production — poison event:** Retry vô hạn chặn queue hoặc đốt tài nguyên. Có `attempts`, exponential backoff + jitter, dead-letter state, alert và replay tool; payload/schema phải versioned.

Cleanup theo chunk sau retention:

```sql
WITH old_rows AS (
    SELECT event_id
    FROM model_lab.integration_outbox
    WHERE published_at < clock_timestamp() - INTERVAL '30 days'
    ORDER BY published_at, event_id
    FOR UPDATE SKIP LOCKED
    LIMIT 1000
)
DELETE FROM model_lab.integration_outbox AS o
USING old_rows
WHERE o.event_id = old_rows.event_id
RETURNING o.event_id;
```

## 10. Audit constraint catalog

```sql
SELECT
    conrelid::regclass AS table_name,
    conname,
    contype,
    convalidated,
    condeferrable,
    condeferred,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'model_lab'::regnamespace
ORDER BY conrelid::regclass::text, conname;
```

**Scenario:** Sau migration/deploy, CI hoặc operator xác minh constraint thực tế đúng với manifest và không còn `NOT VALID` ngoài dự kiến.

**Trade-off:** Catalog audit rẻ và tự động hóa được nhưng không thay concurrency/business test; catalog cho biết constraint tồn tại, không chứng minh mọi client đi đúng state transition.

> **Bug ẩn / production — drift:** ORM model/test không chứng minh production constraint giống migration source. Audit catalog sau deploy, lưu schema dump và test invariant bằng câu lệnh concurrent/failing, không chỉ happy path.

## Bài tập

1. Viết test hai session cùng booking một phòng; đúng một transaction được commit.
2. Reuse idempotency key với hash khác và thiết kế response `409` không chạy business logic.
3. Làm worker chết sau broker ack nhưng trước DB ack; chứng minh consumer không tạo side effect hai lần.
4. Đổi catalog price và chứng minh order snapshot lịch sử không đổi.
5. So write TPS/size trước và sau generated/index/exclusion constraints; ghi trade-off.

## Tài liệu PostgreSQL 17 chính thức

- [Constraints](https://www.postgresql.org/docs/17/ddl-constraints.html)
- [Generated Columns](https://www.postgresql.org/docs/17/ddl-generated-columns.html)
- [Range Types](https://www.postgresql.org/docs/17/rangetypes.html)
- [CREATE DOMAIN](https://www.postgresql.org/docs/17/sql-createdomain.html)
- [SET CONSTRAINTS](https://www.postgresql.org/docs/17/sql-set-constraints.html)
- [INSERT / ON CONFLICT](https://www.postgresql.org/docs/17/sql-insert.html)
- [SELECT locking clause](https://www.postgresql.org/docs/17/sql-select.html)
