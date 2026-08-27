# 16 — Capstone: OrderHub multi-tenant ở mức production

Bạn sẽ xây một mini SaaS xử lý order, tồn kho, event và outbox. Không cần dịch vụ trả phí: PostgreSQL, Docker, `psql`, `pgbench` và công cụ quan sát mã nguồn mở là đủ.

## Decision và trade-off register

| Component | Scenario/correctness goal | Trade-off phải chứng minh |
|---|---|---|
| Constraints + tenant composite key | không cross-tenant/invalid state | Key/index rộng và migration phức tạp hơn app-only validation |
| Query-driven indexes | list/order lookup đạt SLO | Read nhanh đổi write/WAL/storage/HOT cost |
| Atomic stock update | không oversell dưới concurrency | Hot-row contention và retry/idempotency |
| Transactional outbox | không mất publish intent | At-least-once duplicate, lease, cleanup và consumer dedupe |
| Event partitioning | retention/pruning | Boundary/default/global uniqueness/catalog lifecycle |
| RLS | defense-in-depth multi-tenant | Policy/context/pool/owner bypass cần test matrix |
| OLTP report | revenue/window query | Freshness tại primary đổi resource contention; replica/ClickHouse đổi consistency |
| Benchmark/capacity | tìm knee point và headroom | Dataset/load realism tốn thời gian nhưng TPS đơn lẻ không đủ |
| Observability | evidence trước tuning/incident | Metrics/log overhead, retention và sensitive data |
| Backup/PITR/HA | đạt RPO/RTO đo được | Storage/standby/control-plane cost và recovery drill |

## 1. Yêu cầu và SLO

Workload giả định:

- 100 tenant, 1 triệu order, event append-only tăng nhanh;
- checkout phải không bán âm tồn kho và idempotent;
- tenant không được đọc/sửa dữ liệu tenant khác;
- API list order p95 < 100 ms ở concurrency mục tiêu;
- RPO ≤ 5 phút, RTO ≤ 30 phút;
- event giữ online 90 ngày, archive lâu hơn.

```sql
SELECT
    current_database(),
    current_setting('server_version') AS version,
    current_setting('TimeZone') AS timezone,
    current_setting('transaction_isolation') AS isolation;
```

> **Bug ẩn / production — requirement:** “Nhanh” và “không mất dữ liệu” không kiểm thử được. Ghi percentile, concurrency, dataset, failure scope, RPO/RTO và measurement window trước thiết kế.

## 2. Data model và invariant

```sql
DROP SCHEMA IF EXISTS capstone CASCADE;
CREATE SCHEMA capstone;

CREATE TABLE capstone.tenant (
    tenant_id bigint PRIMARY KEY,
    name text NOT NULL UNIQUE
);

CREATE TABLE capstone.inventory (
    tenant_id bigint NOT NULL REFERENCES capstone.tenant,
    product_id bigint NOT NULL,
    available integer NOT NULL CHECK (available >= 0),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, product_id)
);

CREATE TABLE capstone.orders (
    order_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id bigint NOT NULL REFERENCES capstone.tenant,
    idempotency_key text NOT NULL,
    customer_id bigint NOT NULL,
    status text NOT NULL
        CHECK (status IN ('pending', 'paid', 'cancelled', 'shipped')),
    total numeric(14,2) NOT NULL CHECK (total >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, idempotency_key),
    UNIQUE (tenant_id, order_id)
);

CREATE TABLE capstone.order_line (
    tenant_id bigint NOT NULL,
    order_id bigint NOT NULL,
    line_no integer NOT NULL CHECK (line_no > 0),
    product_id bigint NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
    PRIMARY KEY (tenant_id, order_id, line_no),
    FOREIGN KEY (tenant_id, order_id)
        REFERENCES capstone.orders (tenant_id, order_id)
        ON DELETE CASCADE
);

CREATE TABLE capstone.outbox (
    outbox_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id bigint NOT NULL REFERENCES capstone.tenant,
    aggregate_type text NOT NULL,
    aggregate_id bigint NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    published_at timestamptz,
    attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0)
);

INSERT INTO capstone.tenant VALUES (1, 'Alpha'), (2, 'Beta');
INSERT INTO capstone.inventory (tenant_id, product_id, available) VALUES
    (1, 100, 100), (1, 200, 50), (2, 100, 10);
```

**Quyết định:** `orders` không partition để giữ global identity/FK/lookup đơn giản. Event lịch sử ở phần sau mới partition theo time.

> **Bug ẩn / production — tenant key:** FK chỉ theo `order_id` có thể để code gắn line tenant A với order tenant B nếu tenant không nằm trong relationship. Composite FK đưa tenant boundary vào integrity, không chỉ dựa application/RLS.

> **Bug ẩn / production — tiền:** `total` lưu sẵn có thể lệch tổng lines. Chọn source of truth: tính trong transaction/trigger được test, hoặc không lưu và chấp nhận query cost. Không âm thầm cho hai nguồn cùng authoritative.

## 3. Index theo query inventory

```sql
CREATE INDEX orders_tenant_status_time_idx
ON capstone.orders (tenant_id, status, created_at DESC, order_id DESC)
INCLUDE (customer_id, total);

CREATE INDEX orders_tenant_customer_time_idx
ON capstone.orders (tenant_id, customer_id, created_at DESC);

CREATE INDEX outbox_unpublished_idx
ON capstone.outbox (created_at, outbox_id)
WHERE published_at IS NULL;

CREATE INDEX order_line_product_idx
ON capstone.order_line (tenant_id, product_id, order_id);

ANALYZE capstone.orders;
ANALYZE capstone.order_line;
```

Query API dùng keyset:

```sql
SELECT order_id, customer_id, status, total, created_at
FROM capstone.orders
WHERE tenant_id = 1
  AND status = 'paid'
  AND (created_at, order_id) <
      (TIMESTAMPTZ '9999-12-31 00:00+00', 9223372036854775807)
ORDER BY created_at DESC, order_id DESC
LIMIT 50;
```

> **Bug ẩn / production — over-index:** Bốn status-specific/query-specific indexes có thể làm checkout chậm hơn lợi ích list API. Lưu query inventory, `EXPLAIN (ANALYZE, BUFFERS)`, size và write TPS trước/sau từng index.

## 4. Checkout atomic và chống oversell

Một statement CTE giảm round trip và chỉ tạo order nếu atomic stock decrement thành công:

```sql
WITH reserved AS (
    UPDATE capstone.inventory
    SET available = available - 2,
        updated_at = clock_timestamp()
    WHERE tenant_id = 1
      AND product_id = 100
      AND available >= 2
    RETURNING product_id
), new_order AS (
    INSERT INTO capstone.orders
        (tenant_id, idempotency_key, customer_id, status, total)
    SELECT 1, 'req-0001', 5001, 'pending', 39.80
    FROM reserved
    RETURNING order_id, tenant_id, total
), new_line AS (
    INSERT INTO capstone.order_line
        (tenant_id, order_id, line_no, product_id, quantity, unit_price)
    SELECT tenant_id, order_id, 1, 100, 2, 19.90
    FROM new_order
    RETURNING order_id, tenant_id
), new_event AS (
    INSERT INTO capstone.outbox
        (tenant_id, aggregate_type, aggregate_id, event_type, payload)
    SELECT tenant_id, 'order', order_id, 'OrderCreated',
           jsonb_build_object('order_id', order_id, 'total', 39.80)
    FROM new_line
    RETURNING aggregate_id
)
SELECT aggregate_id AS order_id FROM new_event;
```

Chạy nhiều session với stock nhỏ: tổng quantity thành công không được vượt stock ban đầu.

> **Bug ẩn / production — empty result:** Không có row trả về có thể là hết hàng; application phải coi đó là business result, không phải checkout thành công rỗng.

> **Bug ẩn / production — idempotency race:** Ví dụ có unique key nhưng lần retry sẽ nhận unique violation sau khi stock update nằm cùng statement; statement rollback nên stock an toàn, nhưng API cần `INSERT ... ON CONFLICT`/lookup để trả lại **đúng response cũ** và phải kiểm tra cùng key không đi với payload khác.

> **Bug ẩn / production — multi-product:** Update từng SKU theo request order khác nhau gây deadlock. Sort `(tenant_id, product_id)`, lock/update theo thứ tự ổn định hoặc dùng set-based input và retry `40P01`/`40001` cho toàn checkout.

## 5. Transactional outbox và worker

Order và outbox row commit cùng transaction; publisher gửi message sau đó. Claim batch:

```sql
BEGIN;
WITH picked AS (
    SELECT outbox_id
    FROM capstone.outbox
    WHERE published_at IS NULL
      AND attempts < 10
    ORDER BY created_at, outbox_id
    FOR UPDATE SKIP LOCKED
    LIMIT 100
)
UPDATE capstone.outbox AS o
SET attempts = attempts + 1
FROM picked
WHERE o.outbox_id = picked.outbox_id
RETURNING o.outbox_id, o.event_type, o.payload;
COMMIT;
```

Sau khi broker xác nhận, đánh dấu bằng statement idempotent:

```sql
UPDATE capstone.outbox
SET published_at = COALESCE(published_at, clock_timestamp())
WHERE outbox_id = 1
RETURNING outbox_id, published_at;
```

> **Bug ẩn / production — dual write:** Không giữ transaction DB mở trong lúc gọi broker. Nếu publish xong nhưng crash trước mark-published, message sẽ gửi lại; consumer bắt buộc idempotent theo `outbox_id`.

> **Bug ẩn / production — claim semantics:** Code mẫu tăng attempt rồi thả lock; nhiều worker có thể claim lại row chưa published. Production thêm lease/`next_attempt_at`/owner token, backoff và dead-letter. Không đánh dấu published trước broker ack chỉ để tránh duplicate vì sẽ mất message.

## 6. Event table partition và retention

```sql
CREATE TABLE capstone.order_event (
    event_id bigint GENERATED ALWAYS AS IDENTITY,
    tenant_id bigint NOT NULL,
    order_id bigint NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    occurred_at timestamptz NOT NULL,
    PRIMARY KEY (occurred_at, event_id)
) PARTITION BY RANGE (occurred_at);

CREATE TABLE capstone.order_event_2026_08
PARTITION OF capstone.order_event
FOR VALUES FROM ('2026-08-01 00:00+00') TO ('2026-09-01 00:00+00');

CREATE TABLE capstone.order_event_default
PARTITION OF capstone.order_event DEFAULT;

CREATE INDEX order_event_tenant_time_idx
ON capstone.order_event (tenant_id, occurred_at DESC);

INSERT INTO capstone.order_event
    (tenant_id, order_id, event_type, payload, occurred_at)
VALUES
    (1, 1, 'OrderCreated', '{}', '2026-08-20 10:00+07');

EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM capstone.order_event
WHERE tenant_id = 1
  AND occurred_at >= TIMESTAMPTZ '2026-08-01 00:00+00'
  AND occurred_at <  TIMESTAMPTZ '2026-09-01 00:00+00';
```

> **Bug ẩn / production — retention:** Detach partition theo `occurred_at` không bảo đảm business/legal retention nếu event đến trễ hoặc legal hold. Monitor DEFAULT/late data, archive + verify trước drop và giữ metadata tìm lại archive.

## 7. RLS test matrix

```sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'capstone_runtime') THEN
        CREATE ROLE capstone_runtime NOLOGIN;
    END IF;
END
$$;

GRANT USAGE ON SCHEMA capstone TO capstone_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE
ON capstone.orders, capstone.order_line, capstone.inventory
TO capstone_runtime;

GRANT USAGE, SELECT
ON SEQUENCE capstone.orders_order_id_seq
TO capstone_runtime;

ALTER TABLE capstone.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE capstone.orders FORCE ROW LEVEL SECURITY;

CREATE POLICY orders_tenant_policy
ON capstone.orders
TO capstone_runtime
USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::bigint
)
WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::bigint
);

BEGIN;
SET LOCAL ROLE capstone_runtime;
SET LOCAL app.tenant_id = '2';
SELECT * FROM capstone.orders; -- không được thấy tenant 1
ROLLBACK;
```

Mở rộng policy tương tự cho mọi tenant-owned table và viết automated test:

| Operation | đúng tenant | sai tenant | thiếu context |
|---|---:|---:|---:|
| SELECT | thấy row | 0 row | 0 row |
| INSERT | thành công | lỗi | lỗi |
| UPDATE/DELETE | đúng row count | 0/lỗi | 0/lỗi |

> **Bug ẩn / production — coverage:** Chỉ bật RLS trên `orders` nhưng quên `order_line`, outbox, view hoặc function là lỗ cross-tenant. Inventory mọi access path; worker cross-tenant dùng role riêng có quyền được review, không biến runtime role thành `BYPASSRLS`.

> **Bug ẩn / production — pool:** Tenant context phải `SET LOCAL` trong transaction; test cả timeout/rollback để bảo đảm connection trả về pool không giữ state.

## 8. Báo cáo advanced SQL

Doanh thu và tăng trưởng theo ngày/tenant:

```sql
WITH daily AS (
    SELECT
        tenant_id,
        created_at::date AS day,
        sum(total) AS revenue
    FROM capstone.orders
    WHERE status IN ('paid', 'shipped')
    GROUP BY tenant_id, created_at::date
), compared AS (
    SELECT
        tenant_id,
        day,
        revenue,
        lag(revenue) OVER (
            PARTITION BY tenant_id ORDER BY day
        ) AS previous_revenue
    FROM daily
)
SELECT
    tenant_id,
    day,
    revenue,
    previous_revenue,
    round(
        100 * (revenue - previous_revenue)
        / NULLIF(previous_revenue, 0),
        2
    ) AS growth_pct
FROM compared
ORDER BY tenant_id, day;
```

> **Bug ẩn / production — timezone:** `created_at::date` theo session timezone. Báo cáo tenant-specific phải dùng timezone tenant có version/rule rõ, ví dụ `(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`, rồi thiết kế index/materialization tương ứng.

> **Bug ẩn / production — OLTP analytics:** Scan/aggregate lớn trên primary tranh cache/I/O với checkout. Đặt budget, summary table/materialized view, read replica có consistency chấp nhận được, hoặc đẩy analytics sang hệ cột ở phần lộ trình khác.

## 9. Sinh dữ liệu và benchmark

Sinh 100 tenant, 100.000 inventory row:

```sql
INSERT INTO capstone.tenant (tenant_id, name)
SELECT g, 'Tenant ' || g
FROM generate_series(3, 100) AS g
ON CONFLICT DO NOTHING;

INSERT INTO capstone.inventory (tenant_id, product_id, available)
SELECT t.tenant_id, p.product_id, 100 + (p.product_id % 100)
FROM generate_series(1, 100) AS t(tenant_id)
CROSS JOIN generate_series(1, 1000) AS p(product_id)
ON CONFLICT DO NOTHING;

ANALYZE capstone.inventory;
```

Chạy `pgbench` bằng script checkout/list tự viết:

```bash
pgbench --host=localhost --username=student --dbname=lab \
  --clients=10 --jobs=4 --time=60 --progress=5 \
  --file=checkout.sql
```

Ma trận test tối thiểu:

- concurrency 1, 10, 50, 100;
- dataset 10 nghìn, 1 triệu order;
- read/write mix 90/10 và 50/50;
- cache warm và restart/cold-ish scenario;
- autovacuum/checkpoint đang chạy;
- một tenant cực lớn để tạo skew.

> **Bug ẩn / production — benchmark correctness:** TPS cao nhưng stock âm, duplicate order hoặc lost outbox là thất bại. Sau mỗi run chạy invariant query:

```sql
SELECT * FROM capstone.inventory WHERE available < 0;

SELECT tenant_id, idempotency_key, count(*)
FROM capstone.orders
GROUP BY tenant_id, idempotency_key
HAVING count(*) > 1;

SELECT o.tenant_id, o.order_id
FROM capstone.orders AS o
LEFT JOIN capstone.outbox AS x
  ON x.tenant_id = o.tenant_id
 AND x.aggregate_id = o.order_id
 AND x.event_type = 'OrderCreated'
WHERE x.outbox_id IS NULL;
```

## 10. Observability và capacity report

```sql
EXPLAIN (ANALYZE, BUFFERS, SETTINGS)
SELECT order_id, customer_id, total, created_at
FROM capstone.orders
WHERE tenant_id = 1 AND status = 'pending'
ORDER BY created_at DESC, order_id DESC
LIMIT 50;

SELECT
    relname,
    n_live_tup,
    n_dead_tup,
    n_tup_hot_upd,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'capstone'
ORDER BY relname;

SELECT
    relname,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_catalog.pg_statio_user_tables
WHERE schemaname = 'capstone'
ORDER BY pg_total_relation_size(relid) DESC;
```

Nộp bảng: throughput, p50/p95/p99, error, CPU, disk IOPS/latency, buffers, temp/WAL rate, connection/pool wait, dead tuples và size theo từng load level.

> **Bug ẩn / production — extrapolation:** 100 GB không thể chỉ nhân thời gian test 1 GB lên 100 vì cache level, plan, index height, vacuum và checkpoint thay đổi. Scale dataset theo các ngưỡng kiến trúc và đo lại.

## 11. Backup và failure drills

Tạo probe trước backup:

```sql
INSERT INTO capstone.orders
    (tenant_id, idempotency_key, customer_id, status, total)
VALUES
    (1, 'recovery-probe-20260827', 9999, 'paid', 1.00)
RETURNING order_id, created_at;
```

Hoàn thành các drill:

1. logical dump/restore vào database sạch, chạy invariant/RLS tests;
2. base backup + WAL archive, PITR tới trước một `DELETE` giả lập;
3. standby mất mạng, quan sát slot/WAL/disk, reconnect;
4. failover có fencing và endpoint switch;
5. deadlock hai checkout, retry backoff + idempotency;
6. worker chết giữa publish và mark, consumer không tạo duplicate effect;
7. transaction dài gây bloat, tìm blocker và phục hồi.

> **Bug ẩn / production — drill destructive:** Failure test phải ở môi trường cô lập với target/credential/network guard. Gắn nhãn rõ primary/standby/restore; một lệnh `DROP`/promote đúng cú pháp nhưng sai host vẫn là thảm họa.

## 12. Deliverables và rubric

Nộp các artefact sau:

- ERD và giải thích invariant/tenant boundary;
- migrations có forward/rollback/lock-timeout strategy;
- query inventory + index rationale + execution plans;
- concurrency tests chứng minh không oversell/idempotency/outbox;
- RLS permission matrix;
- load-test report và capacity limit đầu tiên;
- dashboard/alerts kèm runbook lock, slow query, disk/WAL, vacuum;
- backup manifest, restore evidence, RPO/RTO đo được;
- ADR: vì sao phần nào ở PostgreSQL, phần analytics nào nên sang ClickHouse.

Tự chấm 100 điểm:

| Hạng mục | Điểm |
|---|---:|
| Correctness và constraint | 20 |
| Concurrency/idempotency/outbox | 20 |
| Query/index/plan có bằng chứng | 15 |
| RLS/least privilege | 15 |
| Vacuum/pooling/observability | 10 |
| Backup/PITR/HA drill | 15 |
| Tài liệu quyết định và tradeoff | 5 |

Điều kiện bắt buộc: không cross-tenant, không stock âm, restore chạy được. Nếu một trong ba sai, capstone chưa đạt dù benchmark nhanh.
