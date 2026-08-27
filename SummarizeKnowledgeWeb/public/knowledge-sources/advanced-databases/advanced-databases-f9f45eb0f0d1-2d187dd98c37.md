# 05 — Declarative partitioning và lifecycle dữ liệu

Partitioning chia một logical table thành các table vật lý. Nó hữu ích nhất khi query loại bỏ được nhiều partition, hoặc khi cần attach/detach/drop dữ liệu theo vòng đời. Nó không phải giải pháp tự động cho mọi bảng lớn.

## Scenario và trade-off map

| Knowledge item | Scenario production | Trade-off cần quyết định |
|---|---|---|
| Range partition | event/time-series retention theo tháng | Pruning/lifecycle tốt; boundary/timezone và tạo partition đúng hạn |
| Pruning | query có time predicate | Bỏ nhiều child; expression/thiếu partition key làm chạm toàn hierarchy |
| List/hash | region hữu hạn hoặc phân phối tenant | Routing rõ/cân bằng; category mới và hash resize khó |
| Subpartition | time × tenant cực lớn | Child nhỏ hơn/hotspot giảm; số partition/catalog/planning nhân nhanh |
| Global uniqueness/FK | business key trên partitioned table | Integrity mạnh nhưng unique key phải chứa partition key; design/FK rộng hơn |
| Partitioned index | index đồng nhất mọi child | Dễ quản lý; concurrent build phải orchestration từng child |
| Attach/detach retention | load/archive/drop partition | Metadata nhanh trên parent; child/default scan, lock và dữ liệu biến mất khỏi parent ngay |
| Partition-wise operation | join/aggregate hai hierarchy tương thích | Local work/parallelism tốt; nhân sort/hash/`work_mem` và planning cost |

## 1. Range partition theo thời gian

```sql
DROP SCHEMA IF EXISTS partition_lab CASCADE;
CREATE SCHEMA partition_lab;

CREATE TABLE partition_lab.event (
    event_id bigint GENERATED ALWAYS AS IDENTITY,
    tenant_id integer NOT NULL,
    event_type text NOT NULL,
    occurred_at timestamptz NOT NULL,
    payload jsonb NOT NULL,
    PRIMARY KEY (occurred_at, event_id)
) PARTITION BY RANGE (occurred_at);

CREATE TABLE partition_lab.event_2026_01
PARTITION OF partition_lab.event
FOR VALUES FROM ('2026-01-01 00:00+00') TO ('2026-02-01 00:00+00');

CREATE TABLE partition_lab.event_2026_02
PARTITION OF partition_lab.event
FOR VALUES FROM ('2026-02-01 00:00+00') TO ('2026-03-01 00:00+00');

CREATE TABLE partition_lab.event_default
PARTITION OF partition_lab.event DEFAULT;

CREATE INDEX event_tenant_time_idx
ON partition_lab.event (tenant_id, occurred_at DESC);

INSERT INTO partition_lab.event
    (tenant_id, event_type, occurred_at, payload)
VALUES
    (1, 'login', '2026-01-10 09:00+07', '{"device":"mobile"}'),
    (1, 'pay',   '2026-02-12 10:00+07', '{"amount":200}'),
    (2, 'login', '2026-04-01 08:00+07', '{}'); -- vào DEFAULT
```

**Tình huống thực tế:** Event/audit/time-series có retention theo tháng; query thường có time range; có thể detach tháng cũ nhanh hơn `DELETE` hàng triệu row.

> **Bug ẩn / production — boundary:** Partition dùng cận dưới inclusive, cận trên exclusive (`FROM ... TO ...`). Sai timezone hoặc dùng ngày cuối tháng làm upper inclusive sẽ route sai/fail insert. Quy ước UTC boundary và test đúng thời điểm giao tháng/DST.

> **Bug ẩn / production — default partition:** DEFAULT tránh insert outage khi quên tạo partition mới, nhưng có thể âm thầm phình to và làm pruning kém. Alert khi DEFAULT có row, và chuyển row sang partition đúng bằng quy trình có kiểm soát.

## 2. Partition pruning

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*)
FROM partition_lab.event
WHERE occurred_at >= TIMESTAMPTZ '2026-02-01 00:00+00'
  AND occurred_at <  TIMESTAMPTZ '2026-03-01 00:00+00'
  AND tenant_id = 1;
```

Plan chỉ nên truy cập `event_2026_02`. PostgreSQL có plan-time và execution-time pruning; parameterized plan vẫn có thể prune lúc thực thi.

```sql
PREPARE event_range(timestamptz, timestamptz) AS
SELECT count(*)
FROM partition_lab.event
WHERE occurred_at >= $1 AND occurred_at < $2;

EXPLAIN (ANALYZE, BUFFERS)
EXECUTE event_range(
    TIMESTAMPTZ '2026-01-01 00:00+00',
    TIMESTAMPTZ '2026-02-01 00:00+00'
);
DEALLOCATE event_range;
```

> **Bug ẩn / production — không filter partition key:** Lọc chỉ `tenant_id` phải chạm mọi partition. Nếu workload chủ yếu theo tenant, time-only partitioning có thể sai trục; cân nhắc partition/subpartition khác hoặc index toàn bộ children.

> **Bug ẩn / production — expression:** Bọc partition key (`date_trunc('month', occurred_at) = ...`) có thể ngăn pruning tốt. Viết range trực tiếp trên key và xác nhận bằng plan.

## 3. List và hash partition

List phù hợp tập category/region hữu hạn; hash phân phối khá đều khi không có natural range.

```sql
CREATE TABLE partition_lab.tenant_setting (
    tenant_id integer NOT NULL,
    region text NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    PRIMARY KEY (region, tenant_id, key)
) PARTITION BY LIST (region);

CREATE TABLE partition_lab.tenant_setting_apac
PARTITION OF partition_lab.tenant_setting
FOR VALUES IN ('VN', 'SG', 'TH');

CREATE TABLE partition_lab.tenant_setting_us
PARTITION OF partition_lab.tenant_setting
FOR VALUES IN ('US');

CREATE TABLE partition_lab.metric (
    tenant_id bigint NOT NULL,
    metric_name text NOT NULL,
    value double precision NOT NULL
) PARTITION BY HASH (tenant_id);

CREATE TABLE partition_lab.metric_h0 PARTITION OF partition_lab.metric
FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE partition_lab.metric_h1 PARTITION OF partition_lab.metric
FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE partition_lab.metric_h2 PARTITION OF partition_lab.metric
FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE partition_lab.metric_h3 PARTITION OF partition_lab.metric
FOR VALUES WITH (MODULUS 4, REMAINDER 3);
```

> **Bug ẩn / production — list:** Region/category mới không có DEFAULT sẽ làm insert fail. Có DEFAULT thì lại dễ che lỗi mapping. Chọn fail-fast hay fallback có chủ đích và monitor.

> **Bug ẩn / production — hash:** Tăng từ 4 lên 8 partition không đơn giản như split range; cần kế hoạch di chuyển/attach dữ liệu. Hash partition cũng không giúp retention theo thời gian.

## 4. Subpartitioning

Có thể range theo tháng rồi hash theo tenant để giảm hotspot/độ lớn mỗi child.

```sql
CREATE TABLE partition_lab.log (
    tenant_id bigint NOT NULL,
    logged_at timestamptz NOT NULL,
    message text NOT NULL
) PARTITION BY RANGE (logged_at);

CREATE TABLE partition_lab.log_2026_01
PARTITION OF partition_lab.log
FOR VALUES FROM ('2026-01-01 00:00+00') TO ('2026-02-01 00:00+00')
PARTITION BY HASH (tenant_id);

CREATE TABLE partition_lab.log_2026_01_h0
PARTITION OF partition_lab.log_2026_01
FOR VALUES WITH (MODULUS 2, REMAINDER 0);

CREATE TABLE partition_lab.log_2026_01_h1
PARTITION OF partition_lab.log_2026_01
FOR VALUES WITH (MODULUS 2, REMAINDER 1);
```

> **Bug ẩn / production — quá nhiều partition:** Hàng chục nghìn partition làm planning, catalog, autovacuum workers và migration nặng. Subpartition chỉ khi đo được lợi ích; đừng nhân tenant × ngày theo quán tính.

## 5. Unique, primary key và foreign key

Trên partitioned table, unique/primary key phải chứa toàn bộ partition key vì mỗi child có physical index riêng.

```sql
-- Hợp lệ vì có occurred_at, partition key:
ALTER TABLE partition_lab.event
ADD CONSTRAINT event_tenant_time_uk
UNIQUE (occurred_at, tenant_id, event_id);
```

> **Bug ẩn / production — global uniqueness:** `UNIQUE (event_id)` riêng lẻ không tạo được trên table partition theo `occurred_at`. Identity thường vẫn sinh unique trong một sequence, nhưng database không biểu diễn constraint toàn cục đó trên parent. Nếu business key cần unique toàn cục, đổi partition key/design hoặc dùng registry table với tradeoff rõ ràng.

> **Bug ẩn / production — foreign key:** FK đến/từ partitioned table được hỗ trợ trong các phiên bản hiện đại, nhưng delete/update parent có thể chạm nhiều partition và lock phức tạp. Index referencing columns trên children và thử migration/delete ở scale thật.

## 6. Index trên partitioned table

Index khai báo trên parent là partitioned index; PostgreSQL tạo/attach index tương ứng trên partitions.

```sql
SELECT
    parent.relname AS parent_index,
    child.relname AS child_index
FROM pg_inherits AS i
JOIN pg_class AS parent ON parent.oid = i.inhparent
JOIN pg_class AS child ON child.oid = i.inhrelid
JOIN pg_namespace AS n ON n.oid = parent.relnamespace
WHERE n.nspname = 'partition_lab'
  AND parent.relkind = 'I'
ORDER BY parent.relname, child.relname;
```

> **Bug ẩn / production — concurrent index:** `CREATE INDEX CONCURRENTLY` trực tiếp trên partitioned parent có giới hạn; chiến lược phổ biến là build concurrently trên từng child rồi attach vào parent index. Script phải xử lý child mới và kiểm tra tất cả index valid trước khi coi migration hoàn tất.

## 7. Attach, detach và retention

Tạo table riêng, thêm constraint chứng minh boundary, rồi attach để tránh validation scan/lock kéo dài.

```sql
CREATE TABLE partition_lab.event_2026_03
(LIKE partition_lab.event INCLUDING DEFAULTS INCLUDING CONSTRAINTS);

ALTER TABLE partition_lab.event_2026_03
ADD CONSTRAINT event_2026_03_bound
CHECK (
    occurred_at >= TIMESTAMPTZ '2026-03-01 00:00+00'
    AND occurred_at < TIMESTAMPTZ '2026-04-01 00:00+00'
);

-- Row tháng 4 đang ở DEFAULT phải được chuyển/xóa trước khi attach tháng 4;
-- tháng 3 không xung đột với dữ liệu mẫu.
ALTER TABLE partition_lab.event
ATTACH PARTITION partition_lab.event_2026_03
FOR VALUES FROM ('2026-03-01 00:00+00') TO ('2026-04-01 00:00+00');
```

Retention an toàn thường detach trước, backup/archive/verify, sau đó mới drop. Vì lab này có DEFAULT partition, dùng bản không `CONCURRENTLY`:

```sql
ALTER TABLE partition_lab.event
DETACH PARTITION partition_lab.event_2026_01;

-- Sau khi archive và được phê duyệt mới thực hiện:
-- DROP TABLE partition_lab.event_2026_01;
```

`DETACH PARTITION ... CONCURRENTLY` giảm lock trên parent và phải chạy ngoài transaction block, nhưng PostgreSQL 16/17 không cho dùng khi parent còn DEFAULT partition.

> **Bug ẩn / production — attach với DEFAULT:** Khi attach partition mới, PostgreSQL có thể phải scan DEFAULT để chứng minh không có row overlap và lấy lock. Trước đó cần constraint loại trừ tương ứng trên DEFAULT hoặc quy trình di chuyển row, đặc biệt với table lớn.

> **Bug ẩn / production — detach/drop:** Detach thay đổi query result ngay; application query parent không còn thấy dữ liệu đó. Xác minh retention, legal hold, backup và replica lag. `DROP` không phải backup strategy.

## 8. Partition-wise join/aggregate

```sql
SHOW enable_partitionwise_join;
SHOW enable_partitionwise_aggregate;
```

Khi hai bảng partition tương thích, planner có thể join từng cặp partition hoặc aggregate cục bộ.

> **Bug ẩn / production — resource multiplication:** Partition-wise operation có thể tạo nhiều hash/sort node, mỗi node dùng `work_mem`; memory tăng theo số partition chạy đồng thời. Hai setting này không mặc định bật trong mọi trường hợp vì planning/resource tradeoff.

## Bài tập

1. Tạo automation sinh partition tháng kế tiếp và alert nếu DEFAULT có row.
2. Chứng minh pruning mất đi khi query bọc partition key bằng expression.
3. Di chuyển row tháng 4 khỏi DEFAULT, thêm constraint loại trừ, rồi attach partition tháng 4.
4. Thiết kế retention 90 ngày: detach, checksum/archive, restore test, drop; ghi rõ điểm rollback.
