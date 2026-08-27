# 00 — Nền tảng PostgreSQL duy nhất

Đây là bài cơ bản duy nhất. Mục tiêu là thống nhất vocabulary và tránh những lỗi dữ liệu mà tối ưu phía sau không thể cứu được.

## 1. Schema và `search_path`

Schema là namespace bên trong một database. Dùng schema để tách miền nghiệp vụ và quản lý quyền, không phải để thay thế database độc lập.

```sql
DROP SCHEMA IF EXISTS foundation CASCADE;
CREATE SCHEMA foundation;

CREATE TABLE foundation.customer (
    customer_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO foundation.customer (email)
VALUES ('an@example.com');

SELECT * FROM foundation.customer;
SHOW search_path;
```

**Tình huống thực tế:** `billing.invoice` và `crm.customer` giúp tên bảng diễn đạt đúng bounded context và cấp quyền theo miền.

> **Bug ẩn / production — `search_path`:** Cùng tên bảng/function ở schema khác có thể bị resolve nhầm. Trong migration, function có quyền cao và ứng dụng production, ưu tiên tên đầy đủ `schema.object`; không đặt schema user có quyền ghi đứng trước schema tin cậy.

## 2. Kiểu dữ liệu: chọn theo ý nghĩa

```sql
CREATE TABLE foundation.product (
    product_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sku text NOT NULL,
    price numeric(12,2) NOT NULL CHECK (price >= 0),
    weight_kg double precision,
    active boolean NOT NULL DEFAULT true,
    available_on date,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

INSERT INTO foundation.product
    (sku, price, weight_kg, available_on, metadata)
VALUES
    ('DB-01', 199.90, 1.25, DATE '2026-01-15', '{"color":"blue"}');

SELECT sku, price, metadata ->> 'color' AS color
FROM foundation.product;
```

- `numeric(p,s)` cho tiền/tính toán cần chính xác; `real`/`double precision` cho đo lường chấp nhận sai số nhị phân.
- `text` thường tốt hơn giới hạn tùy ý bằng `varchar(n)`; dùng `CHECK` nếu giới hạn là rule nghiệp vụ.
- `date` là ngày; `timestamptz` là một thời điểm tuyệt đối và hiển thị theo timezone session.
- `jsonb` phù hợp thuộc tính linh hoạt nhưng không thay mọi column quan hệ.
- `bigint GENERATED ... AS IDENTITY` là lựa chọn ID tuần tự rõ nghĩa; UUID phù hợp khi cần sinh phân tán/khó đoán.

```sql
SET TIME ZONE 'Asia/Ho_Chi_Minh';
SELECT TIMESTAMPTZ '2026-01-01 09:00+07' AS local_view;
SET TIME ZONE 'UTC';
SELECT TIMESTAMPTZ '2026-01-01 09:00+07' AS utc_view;

SELECT 0.1::double precision + 0.2::double precision AS approximate,
       0.1::numeric + 0.2::numeric AS exact;
```

> **Bug ẩn / production — tiền:** `double precision` có sai số biểu diễn; phép so sánh/rounding tiền có thể lệch một cent. Dùng `numeric` hoặc số nguyên đơn vị nhỏ nhất và quy định rounding rõ ràng.

> **Bug ẩn / production — thời gian:** `timestamp without time zone` không lưu timezone và dễ bị hiểu khác giữa service. Với event thực, lưu `timestamptz`; chỉ dùng `timestamp` cho “giờ trên tường” như lịch lặp cục bộ khi đó thật sự là domain model.

> **Bug ẩn / production — JSONB:** Đưa field dùng để join, unique, foreign key hoặc lọc thường xuyên vào JSONB làm integrity và statistics yếu hơn. Giữ field cốt lõi ở column typed.

## 3. `NULL` và logic ba giá trị

`NULL` nghĩa là chưa biết/không có, không bằng bất kỳ giá trị nào, kể cả một `NULL` khác.

```sql
SELECT
    NULL = NULL AS not_true,
    NULL IS NULL AS true_value,
    10 + NULL AS unknown_result;

CREATE TABLE foundation.contact (
    contact_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nickname text
);

INSERT INTO foundation.contact (nickname)
VALUES (NULL), ('An'), ('Binh');

SELECT *
FROM foundation.contact
WHERE nickname IS NULL;

SELECT COALESCE(nickname, '(chưa đặt)') AS display_name
FROM foundation.contact;
```

**Tình huống thực tế:** Số điện thoại chưa cung cấp là `NULL`; chuỗi rỗng có thể là dữ liệu người dùng đã gửi. Không tự động đồng nhất hai nghĩa này.

> **Bug ẩn / production — `NOT IN`:** Một `NULL` trong subquery có thể làm toàn bộ điều kiện thành unknown. Dùng `NOT EXISTS` cho anti-join.

```sql
SELECT c.*
FROM foundation.contact AS c
WHERE NOT EXISTS (
    SELECT 1
    FROM foundation.contact AS blocked
    WHERE blocked.nickname = c.nickname
      AND blocked.nickname = 'An'
);
```

## 4. Constraint là tuyến phòng thủ dữ liệu

```sql
ALTER TABLE foundation.customer
    ADD CONSTRAINT customer_email_uk UNIQUE (email);

CREATE TABLE foundation.purchase_order (
    order_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id bigint NOT NULL
        REFERENCES foundation.customer(customer_id)
        ON DELETE RESTRICT,
    status text NOT NULL
        CHECK (status IN ('pending', 'paid', 'cancelled')),
    total numeric(12,2) NOT NULL CHECK (total >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    paid_at timestamptz,
    CONSTRAINT paid_time_ck CHECK (status <> 'paid' OR paid_at IS NOT NULL)
);

INSERT INTO foundation.purchase_order (customer_id, status, total)
SELECT customer_id, 'pending', 199.90
FROM foundation.customer
WHERE email = 'an@example.com';
```

- `PRIMARY KEY`: định danh duy nhất và không null.
- `UNIQUE`: cấm trùng; mặc định vẫn cho phép nhiều `NULL`.
- `FOREIGN KEY`: bảo đảm row được tham chiếu tồn tại.
- `CHECK`: invariant trên row; biểu thức trả về `NULL` vẫn được xem là không vi phạm.
- `NOT NULL`: bắt buộc có giá trị, tối ưu và rõ hơn `CHECK (x IS NOT NULL)`.

```sql
-- Khi nghiệp vụ yêu cầu NULL cũng chỉ được xuất hiện tối đa một lần:
CREATE TABLE foundation.external_identity (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    external_code text UNIQUE NULLS NOT DISTINCT
);
```

> **Bug ẩn / production — `UNIQUE`:** Unique thông thường coi các `NULL` là khác nhau. Dùng `UNIQUE NULLS NOT DISTINCT` khi domain coi “không có giá trị” cũng phải duy nhất.

> **Bug ẩn / production — foreign key:** PostgreSQL không tự tạo index ở cột tham chiếu (`purchase_order.customer_id`). Xóa/update parent có thể scan và lock nhiều row ở child. Tạo index theo workload:

```sql
CREATE INDEX purchase_order_customer_idx
    ON foundation.purchase_order (customer_id);
```

> **Bug ẩn / production — `CHECK`:** Vì `NULL` vượt qua `CHECK`, `CHECK (price > 0)` không thay cho `NOT NULL`. Ngoài ra không dùng `CHECK` để tra cứu row ở bảng khác; rule liên bảng cần FK, trigger được kiểm soát, hoặc transaction logic.

## 5. DML an toàn và `RETURNING`

```sql
INSERT INTO foundation.customer (email)
VALUES ('chi@example.com')
RETURNING customer_id, created_at;

UPDATE foundation.purchase_order
SET status = 'cancelled'
WHERE order_id = 1
  AND status = 'pending'
RETURNING order_id, status;

DELETE FROM foundation.contact
WHERE contact_id = 999999
RETURNING contact_id;
```

**Tình huống thực tế:** Điều kiện `AND status = 'pending'` biến update thành optimistic state transition; ứng dụng kiểm tra số row trả về để biết có tranh chấp hay không.

> **Bug ẩn / production — DML:** `UPDATE`/`DELETE` thiếu `WHERE` vẫn hợp lệ. Dùng transaction, review row count, quyền tối thiểu và backup. Không viết kiểu “SELECT trước rồi UPDATE” để kiểm tra trạng thái vì có race condition; gộp điều kiện vào một statement hoặc dùng lock phù hợp.

## Bài tập chốt nền tảng

Thiết kế bảng `foundation.subscription` có customer, plan, thời điểm bắt đầu/kết thúc và status. Chứng minh bằng câu lệnh cố tình sai rằng database chặn được:

1. customer không tồn tại;
2. ngày kết thúc trước ngày bắt đầu;
3. status ngoài tập cho phép;
4. hai subscription “active” cho cùng customer (gợi ý: partial unique index, học ở bài 03).

