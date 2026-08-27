# Entry diagnostic — Đáp án và giải thích

Chỉ mở sau khi hoàn thành [ENTRY_DIAGNOSTIC_QUESTIONS.md](ENTRY_DIAGNOSTIC_QUESTIONS.md).

## PostgreSQL

### PG-D01 — Schema và search_path

**Đáp án:** tên không qualification được resolve theo search_path, nên schema đứng trước có thể chứa object cùng tên. Dùng app.orders và cố định search_path tin cậy trong privileged function.

~~~sql
SELECT * FROM app.orders;
ALTER FUNCTION app.do_work() SET search_path = pg_catalog, app;
~~~

**Vì sao:** qualification biến dependency ngầm thành object rõ ràng.

**Bẫy production:** schema user có quyền CREATE đứng trước schema tin cậy có thể dẫn tới object hijacking, đặc biệt trong SECURITY DEFINER function.

### PG-D02 — Kiểu tiền và thời gian

**Đáp án:** dùng numeric(p,s), hoặc integer đơn vị nhỏ nhất, cho tiền; dùng timestamptz cho instant tuyệt đối.

~~~sql
CREATE TABLE type_demo (
  amount numeric(14,2) NOT NULL,
  occurred_at timestamptz NOT NULL
);
~~~

**Vì sao:** floating point không biểu diễn chính xác mọi số thập phân; timestamptz chuẩn hóa instant và hiển thị theo session timezone.

**Bẫy production:** timestamptz không lưu tên timezone gốc. Nếu rule nghiệp vụ cần timezone địa phương, lưu timezone identifier riêng.

### PG-D03 — NULL và logic ba giá trị

**Đáp án:** NULL = NULL là UNKNOWN. NOT IN với một NULL có thể làm mọi so sánh còn lại thành UNKNOWN. Dùng NOT EXISTS với correlation đầy đủ.

~~~sql
SELECT c.customer_id
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id
);
~~~

**Vì sao:** NOT EXISTS chỉ quan tâm row match thật, không bị NULL trong tập đầu độc predicate.

**Bẫy production:** anti-join đa tenant phải so đủ tenant_id và business key để tránh loại nhầm hoặc rò dữ liệu.

### PG-D04 — CHECK, UNIQUE và NULL

**Đáp án:** CHECK chỉ reject FALSE; NULL tạo UNKNOWN nên vẫn qua. Thêm NOT NULL. Dùng UNIQUE NULLS NOT DISTINCT nếu NULL cũng phải được coi là một giá trị duy nhất.

~~~sql
price numeric NOT NULL CHECK (price > 0),
email text,
UNIQUE NULLS NOT DISTINCT (email)
~~~

**Vì sao:** constraint phải biểu diễn riêng cả presence lẫn value rule.

**Bẫy production:** đổi sang NULLS NOT DISTINCT có thể fail nếu dữ liệu cũ đã có nhiều NULL; preflight duplicate trước migration.

### PG-D05 — Foreign key và index

**Đáp án:** PostgreSQL không tự tạo index ở referencing columns. Thường cần index trên child key theo workload.

~~~sql
CREATE INDEX order_items_order_id_idx ON order_items(order_id);
~~~

**Vì sao:** khi update/delete parent, database phải tìm child rows để kiểm tra/cascade; thiếu index có thể scan bảng con và giữ lock lâu.

**Bẫy production:** không phải FK nào cũng cần index đơn cột riêng; composite index có đúng prefix có thể đã đủ. Tránh duplicate index.

### PG-D06 — DML an toàn

**Đáp án:** SQL grammar không yêu cầu WHERE. RETURNING lấy row thực sự thay đổi trong cùng statement/snapshot.

~~~sql
UPDATE orders
SET status = 'paid'
WHERE order_id = 42 AND status = 'pending'
RETURNING order_id, status, updated_at;
~~~

**Vì sao:** predicate và write nguyên tử hơn SELECT rồi UPDATE.

**Bẫy production:** API phải kiểm tra row count rỗng; nó có thể là conflict/business state, không phải thành công.

### PG-D07 — Join multiplicity

**Đáp án:** hai quan hệ one-to-many tạo tích items × payments cho cùng order. Aggregate mỗi phía trước rồi join.

~~~sql
WITH item_total AS (
  SELECT order_id, sum(amount) AS items FROM order_items GROUP BY order_id
), paid_total AS (
  SELECT order_id, sum(amount) AS paid FROM payments GROUP BY order_id
)
SELECT o.order_id, i.items, p.paid
FROM orders o
LEFT JOIN item_total i USING (order_id)
LEFT JOIN paid_total p USING (order_id);
~~~

**Vì sao:** mỗi CTE đưa cardinality về tối đa một row/order trước join.

**Bẫy production:** DISTINCT có thể che duplicate nhưng làm sai tổng hoặc tốn sort/hash; sửa cardinality thay vì vá output.

### PG-D08 — Transaction boundary

**Đáp án:** order đã commit nhưng publish intent biến mất; downstream không bao giờ nhận event. Business write và outbox phải cùng transaction, publish network ở ngoài.

~~~sql
BEGIN;
UPDATE orders SET status = 'paid' WHERE order_id = 42;
INSERT INTO outbox(aggregate_id, event_type) VALUES (42, 'order.paid');
COMMIT;
~~~

**Vì sao:** atomic commit bảo đảm cả hai cùng tồn tại hoặc cùng rollback.

**Bẫy production:** publisher crash sau destination ack nhưng trước mark published tạo duplicate; consumer phải idempotent.

### PG-D09 — SQL gate

~~~sql
CREATE SCHEMA IF NOT EXISTS app;
CREATE TABLE app.app_user (
  user_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);
~~~

**Vì sao:** uniqueness đúng tenant scope và timestamptz lưu instant.

**Bẫy production:** email case-insensitive cần contract normalization/collation rõ; lower(email) unique không tự đúng cho mọi ngôn ngữ.

### PG-D10 — SQL gate

~~~sql
UPDATE inventory
SET available = available - 3
WHERE sku = 'SKU-RED' AND available >= 3
RETURNING sku, available;
~~~

**Vì sao:** row lock và predicate được xử lý trong một statement; available không âm khi cạnh tranh.

**Bẫy production:** kết quả rỗng gộp hai trường hợp SKU không tồn tại và không đủ hàng. Nếu API cần phân biệt, kiểm tra trong cùng transaction; retry vẫn cần idempotency key.

## ClickHouse

### CH-D01 — OLTP hay OLAP

**Đáp án:** aggregate hàng tỷ event đọc ít cột phù hợp ClickHouse; số dư serializable phù hợp OLTP database.

**Vì sao:** columnar storage, compression và vectorized execution tối ưu scan/aggregate.

**Bẫy production:** latency tốt của một lookup không tạo ra transaction/constraint semantics như PostgreSQL.

### CH-D02 — Metadata

~~~sql
SELECT version(), currentDatabase(), currentUser();
SELECT partition, count() AS active_parts, sum(rows) AS rows
FROM system.parts
WHERE database = 'ecommerce' AND table = 'events' AND active
GROUP BY partition ORDER BY partition;
~~~

**Vì sao:** parts/rows per part cho biết producer có tạo small-part pressure hay merge có theo kịp.

**Bẫy production:** active part count là snapshot; background merge làm số thay đổi. Ghi timestamp và dùng part_log khi cần lịch sử.

### CH-D03 — Part và partition

**Đáp án:** partition là miền logical theo expression; part là file-set immutable do insert/merge tạo bên trong một partition. Merge không vượt partition boundary.

**Vì sao:** partition hỗ trợ lifecycle/coarse pruning, parts là đơn vị storage/merge.

**Bẫy production:** partition cardinality cao làm parts không thể hợp nhất qua các partition nhỏ.

### CH-D04 — Column pruning và PREWHERE

**Đáp án:** ClickHouse đọc column files cần thiết. PREWHERE đọc filter columns trước rồi mới đọc thêm columns cho dữ liệu còn lại.

~~~sql
SELECT event_time, event_type
FROM ecommerce.events
PREWHERE tenant_id = 7
WHERE event_date >= today() - 7;
~~~

**Vì sao:** giảm bytes giải nén/I/O cho wide table.

**Bẫy production:** predicate không chọn lọc hoặc sort key sai vẫn đọc nhiều granule; PREWHERE không thay schema design.

### CH-D05 — ORDER BY

**Đáp án:** ORDER BY sắp dữ liệu trong part và tạo sparse primary-index order; không enforce uniqueness.

**Vì sao:** nó cho phép bỏ granule và tăng locality/compression.

**Bẫy production:** SELECT thiếu ORDER BY không bảo đảm output order, dù table có MergeTree ORDER BY.

### CH-D06 — Numeric và time

~~~sql
tenant_id UInt32,
revenue Decimal(12,2),
event_time DateTime64(3, 'UTC')
~~~

**Vì sao:** unsigned type biểu diễn miền, Decimal giữ thập phân chính xác, DateTime64 giữ precision/timezone metadata.

**Bẫy production:** Decimal overflow/scale và currency vẫn cần contract; UTC storage không tự giải quyết business-day timezone.

### CH-D07 — LowCardinality và Nullable

**Đáp án:** LowCardinality(String) hợp event_type. Nullable lưu null mask ngoài values.

**Vì sao:** dictionary encoding giảm lặp; null mask biểu diễn missing khác default.

**Bẫy production:** UUID gần unique làm LowCardinality phản tác dụng; thay NULL bằng 0 nhập nhằng nếu 0 hợp lệ.

### CH-D08 — Complex types

**Đáp án:** Map tiện cho keys thay đổi/thưa; Array/Tuple/Nested có cấu trúc hơn tùy domain. Field hot nên thành typed column để có statistics/locality/index và type validation tốt hơn.

**Bẫy production:** filter Map key trên hàng tỷ rows thường phải đọc/giải mã Map rộng; promoted column chỉ tự có cho row mới nếu không materialize/backfill.

### CH-D09 — Expression columns

**Đáp án:** DEFAULT có thể bị client override và được lưu; MATERIALIZED không nhận insert trực tiếp thông thường và được lưu; ALIAS tính khi đọc, không lưu.

**Bẫy production:** đổi expression không tự rewrite giá trị MATERIALIZED cũ; ALIAS đắt nếu expression nặng và đọc thường xuyên.

### CH-D10 — Key design

**Đáp án:** event_id gần unique tạo partition explosion nếu dùng partition key; ORDER BY event_id làm rows tenant/time phân tán nên dashboard không prune tốt. Chọn monthly partition và tenant/date prefix.

**Bẫy production:** partition theo tenant cũng bùng metadata khi có hàng trăm nghìn tenant; partition phục vụ lifecycle, sorting key phục vụ query.

### CH-D11 — SQL gate

~~~sql
CREATE TABLE diag_events
(
  event_time DateTime64(3, 'UTC'),
  event_date Date MATERIALIZED toDate(event_time),
  event_id UUID,
  tenant_id UInt32,
  event_type LowCardinality(String),
  revenue Decimal(12,2)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (tenant_id, event_date, event_type, event_time, event_id);
~~~

**Vì sao:** monthly lifecycle và tenant/date access prefix khớp workload.

**Bẫy production:** key rộng tăng merge/index cost; phải benchmark query inventory trước khi thêm cột.

### CH-D12 — SQL gate

~~~sql
SELECT event_date, event_type, count() AS events, sum(revenue) AS revenue
FROM diag_events
WHERE tenant_id = 7
  AND event_time >= toDateTime64('2026-08-01 00:00:00', 3, 'UTC')
  AND event_time <  toDateTime64('2026-08-08 00:00:00', 3, 'UTC')
GROUP BY event_date, event_type
ORDER BY event_date, event_type;

EXPLAIN indexes = 1
SELECT count()
FROM diag_events
WHERE tenant_id = 7
  AND event_date >= toDate('2026-08-01')
  AND event_date <  toDate('2026-08-08');
~~~

**Vì sao:** half-open range không double-count boundary và conditions khớp key.

**Bẫy production:** query đầu filter event_time trong khi key có event_date trước; thêm explicit date bounds có thể giúp pruning nhưng phải giữ semantics timezone tương đương.
