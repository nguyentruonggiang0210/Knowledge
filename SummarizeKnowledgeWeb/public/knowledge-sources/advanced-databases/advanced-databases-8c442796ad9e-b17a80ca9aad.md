# Capstone — Commerce Event Platform

## Bối cảnh

Bạn xây nền tảng bán hàng đa tenant. PostgreSQL là system of record cho order/inventory; ClickHouse phục vụ dashboard near-real-time. Delivery từ PostgreSQL sang ClickHouse là at-least-once: event có thể trùng, đến sai thứ tự hoặc đến muộn. Hệ thống phải chạy hoàn toàn local bằng Docker.

Mục tiêu không phải tạo nhiều code nhất. Mục tiêu là chứng minh data correctness, performance và recovery bằng query/metric tái lập được.

## Quy mô lab

Chọn một profile và ghi trong report:

| Profile | PostgreSQL orders | ClickHouse events | Máy gợi ý |
|---|---:|---:|---|
| S | 100.000 | 1.000.000 | 4 GB RAM trống |
| M | 1.000.000 | 10.000.000 | 8 GB RAM trống |
| L | tự chọn | 50.000.000+ | 16 GB RAM trống |

Nếu máy yếu, dùng S nhưng phải tạo skew: tenant lớn nhất chiếm 60%, 5% event đến trễ, 2% duplicate và một hot hour chiếm 30% traffic.

## Yêu cầu chức năng

### 1. PostgreSQL OLTP

Thiết kế tối thiểu:

- tenants, customers, products, inventory, orders, order_items;
- order status transition có constraint/rule rõ ràng;
- reserve inventory không âm dưới concurrent requests;
- idempotency key cho create/pay/cancel order;
- outbox ghi cùng transaction với business change;
- query customer order history dùng keyset pagination;
- audit timestamp và source_version monotonic theo aggregate.

Bạn phải cung cấp migration up/down hoặc chiến lược rollback. Foreign key/index phải giải thích theo access pattern, không chỉ tạo mặc định.

### 2. Event contract

Envelope tối thiểu:

~~~json
{
  "event_id": 90000001,
  "tenant_id": 7,
  "aggregate_type": "order",
  "aggregate_id": 42001,
  "source_version": 3,
  "event_type": "order.paid",
  "occurred_at": "2026-08-27T09:30:00.123456Z",
  "schema_version": 1,
  "payload": {
    "status": "paid",
    "total_amount": "129.90",
    "currency": "VND"
  }
}
~~~

Định nghĩa rõ uniqueness scope, time zone, decimal representation, schema evolution, tombstone và dữ liệu nhạy cảm không được đưa vào event.

### 3. Delivery/replay

Có thể dùng script/programming language bất kỳ hoặc export/import CLI. Pipeline phải:

- đọc outbox theo keyset/checkpoint, không dùng OFFSET tăng dần;
- batch insert vào ClickHouse;
- chỉ advance checkpoint sau destination ack;
- retry cùng logical event identity;
- hỗ trợ replay một time/id range;
- lưu metric lag, batch size, retry và poison event;
- không giữ PostgreSQL transaction trong lúc gọi network.

### 4. ClickHouse OLAP

Thiết kế tối thiểu:

- raw immutable event table có retention;
- serving path trả latest order state đúng trước background merge;
- daily aggregate theo tenant/status gồm order count, revenue và unique customers;
- query funnel created → paid → shipped trong cửa sổ thời gian;
- query top products theo tenant/day;
- schema xử lý duplicate, out-of-order, late event và tombstone;
- PARTITION BY, ORDER BY, types, codecs và aggregate states có giải thích.

Không dùng SELECT FINAL cho mọi dashboard như giải pháp mặc định.

### 5. Observability và recovery

Tạo một runbook có:

- slow-query evidence PostgreSQL: pg_stat_activity, pg_stat_statements nếu cài được, EXPLAIN (ANALYZE, BUFFERS);
- health ClickHouse: query_log, parts, merges, mutations, disk;
- connection/transaction age, replication/outbox lag và data freshness;
- backup/restore/PITR plan PostgreSQL và test restore ghi thời gian;
- retention/rebuild serving table ClickHouse từ raw;
- alert threshold có lý do và owner/action.

## Workload cần benchmark

### PostgreSQL

1. Reserve cùng một SKU từ 20 concurrent requests.
2. Order history tenant/customer bằng keyset pagination.
3. Worker claim outbox theo batch với SKIP LOCKED.
4. Report cố ý không sargable, sau đó tối ưu và đối soát.
5. Một long transaction gây vacuum horizon; phát hiện và xử lý trong lab.

### ClickHouse

1. Dashboard daily 30 ngày của một tenant thường và hot tenant.
2. Latest state với 2% duplicate và out-of-order versions.
3. Funnel theo 7 ngày.
4. Query lọc dimension không nằm trong key; thử projection/skipping/serving table.
5. Backfill trong lúc live batch vẫn được ingest.

Mỗi benchmark chạy tối thiểu ba lần và lưu query_id/plan/rows read. Không đặt latency target tuyệt đối giữa các máy; yêu cầu giảm read amplification hoặc p95 có giải thích.

## Failure drills bắt buộc

### F1 — Lost acknowledgement

Cho ClickHouse nhận batch nhưng làm pipeline tưởng timeout trước checkpoint. Retry batch, chứng minh raw có thể duplicate nhưng serving metric không double count.

### F2 — Out-of-order

Gửi order version 4, 2, 3, 1. Latest state phải là version 4. Gửi hai payload khác nhau cùng version và ghi quyết định conflict.

### F3 — Worker crash

Worker claim outbox/jobs rồi chết trước mark completed. Sau lease, event được xử lý lại mà không mất và không tạo side effect sai.

### F4 — Backfill overlap

Cố tình backfill overlap 10 phút với live ingestion. Viết query phát hiện, phục hồi target đúng và cập nhật runbook để tránh tái diễn.

### F5 — Query overload

Chạy query ClickHouse scan rộng hoặc PostgreSQL sort spill trong giới hạn máy lab. Phát hiện bằng metric, hủy an toàn và áp guardrail per user/workload.

### F6 — Restore

Khôi phục PostgreSQL vào database/container tách biệt, không ghi đè lab đang chạy. Kiểm tra một business invariant và đo RPO/RTO quan sát được.

## Sản phẩm phải nộp

~~~text
capstone/
  README.md
  architecture.md
  decisions/
    001-postgresql-transaction.md
    002-clickhouse-keys.md
    003-delivery-semantics.md
  postgres/
    schema.sql
    seed.sql
    queries.sql
    maintenance.sql
  clickhouse/
    schema.sql
    seed.sql
    queries.sql
    operations.sql
  pipeline/
    source/
    README.md
  evidence/
    benchmark.csv
    plans/
    reconciliation/
    failure-drills/
  runbook.md
~~~

README phải có một lệnh setup/reset scoped cho project, phiên bản image và tài nguyên máy. Không commit password production hoặc dữ liệu cá nhân.

## Acceptance tests tối thiểu

### Invariant SQL — PostgreSQL

~~~sql
-- Không inventory âm
SELECT count(*) AS violations FROM inventory WHERE available < 0;

-- Không duplicate idempotency key trong scope tenant/action
SELECT tenant_id, action, idempotency_key, count(*)
FROM idempotency_requests
GROUP BY tenant_id, action, idempotency_key
HAVING count(*) > 1;

-- Outbox version không trùng một aggregate
SELECT aggregate_id, source_version, count(*)
FROM outbox
GROUP BY aggregate_id, source_version
HAVING count(*) > 1;
~~~

Tất cả phải trả 0 rows/violations sau concurrency test.

### Invariant SQL — ClickHouse

~~~sql
-- Đo duplicate delivery ở raw, không giả định bằng 0
SELECT count() - uniqExact(event_id) AS duplicate_copies
FROM order_events_raw;

-- Tìm conflict: cùng aggregate/version nhưng payload khác
SELECT tenant_id, aggregate_id, source_version,
       uniqExact(payload_hash) AS variants
FROM order_events_raw
GROUP BY tenant_id, aggregate_id, source_version
HAVING variants > 1;
~~~

Serving query phải có rule deterministic hoặc đưa conflict vào quarantine; không im lặng chọn winner ngẫu nhiên.

### Reconciliation

Theo từng cửa sổ 15 phút, report:

~~~text
source outbox events
destination raw unique event_id
destination latest max source_version
source vs serving revenue theo business semantics
p50/p95/p99 delivery lag
oldest unpublished event age
~~~

Giải thích mọi chênh lệch tạm thời và thời hạn hệ thống tự hội tụ.

## Giới hạn và an toàn

- Chỉ fault-inject trên local lab.
- EXPLAIN ANALYZE UPDATE/DELETE PostgreSQL phải dùng transaction + ROLLBACK khi không muốn giữ thay đổi.
- Không xóa volume để “sửa” một migration; chứng minh migration/rollback.
- Không tăng global memory/connection/merge setting nếu chưa tính concurrency budget.
- Không chấm đạt nếu dashboard đúng chỉ sau OPTIMIZE FINAL thủ công.

Khi hoàn tất, tự chấm bằng [CAPSTONE_RUBRIC.md](CAPSTONE_RUBRIC.md), sau đó nhờ một người khác chọn ngẫu nhiên hai failure drill để bạn demo lại từ môi trường sạch.
