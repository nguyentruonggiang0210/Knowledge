# D14 - Data, database, cache và messaging

## Mục tiêu

- Chọn storage/data model theo semantics, không theo độ phổ biến.
- Hiểu transaction/isolation/replication/partition và migration compatibility.
- Vận hành backup/PITR/restore, query/lock/pool/capacity.
- Xử lý duplicate, ordering, retry, backpressure, outbox và DLQ.

## Storage và database

| Loại | Điểm mạnh | Câu hỏi vận hành |
|---|---|---|
| Block | Low-level volume, filesystem/DB | attach, filesystem, snapshot, zone |
| File | Shared hierarchical filesystem | lock, metadata, throughput, permission |
| Object | Durable object/key, scale/lifecycle | consistency, overwrite, listing, egress |
| Relational | Schema, query, transaction/constraint | index, lock, migration, replica |
| Key-value/document | Access pattern linh hoạt/scale | partition key, consistency, secondary query |
| Cache | Latency/load reduction | eviction, staleness, stampede, source of truth |
| Search/analytics | Full-text/aggregate | ingestion lag, rebuild, data governance |

Polyglot persistence tăng số failure/backup/skill cần sở hữu. Bắt đầu đơn giản.

## Transaction và isolation

ACID là atomicity, consistency theo constraint, isolation và durability. Isolation level kiểm
phenomena/concurrency; tên level/implementation khác DB. MVCC cho nhiều reader/writer nhưng
vẫn có bloat/vacuum/conflict. Application invariant như “không trừ tồn kho âm” phải được
enforce bằng transaction/constraint/locking đúng, không chỉ check-then-write rời rạc.

~~~sql
BEGIN;
SELECT available
FROM inventory
WHERE sku = 'demo'
FOR UPDATE;

UPDATE inventory
SET available = available - 1
WHERE sku = 'demo' AND available > 0;
COMMIT;
~~~

Kiểm affected rows; timeout/deadlock cần retry toàn transaction nếu operation retry-safe.

## Index, query và connection

- Index tăng read nhưng tốn write/storage/maintenance; dựa query plan/data distribution.
- N+1 query, full scan, sort/spill và lock wait có thể là app issue, không chỉ “DB chậm”.
- Connection pool quá lớn nhân theo replica có thể làm DB cạn connection/memory.
- Set query/statement/lock timeout theo deadline; theo dõi slow query, saturation, replica lag.
- Schema statistics/maintenance/vacuum và engine upgrade cần plan.

Không optimize bằng một query plan snapshot duy nhất; production parameters/data khác lab.

## Replication, consistency và partition

Synchronous replication có thể giảm data loss nhưng tăng latency/availability dependency.
Asynchronous tăng lag và RPO. Read replica có stale read/read-your-writes issue. Khi network
partition, hệ thống phân tán phải trade consistency/availability cho operation cụ thể; CAP
không phải nhãn “DB CP/AP” thay cho thiết kế.

Quorum formula chỉ đúng dưới assumption replica/failure/protocol cụ thể. Split-brain/fencing
và failover cần được database/platform đảm bảo, không tự viết leader election bằng script.

## Backup, PITR và restore

- Full/incremental/snapshot/WAL-log archive có semantics khác.
- Backup application-consistent khác crash-consistent.
- Retention, immutability/offline copy, encryption/key, region/account isolation.
- PITR target và timezone; restore cần schema/app/config/identity/dependency tương thích.
- Validate checksum/data reconciliation và đo actual RPO/RTO.

Backup “successful” chưa có nghĩa restore được. D18 mở rộng DR/failover.

## Schema migration expand-contract

1. Expand schema backward-compatible.
2. Deploy app hiểu old/new.
3. Backfill theo batch/checkpoint, rate limit và monitor.
4. Switch read/write bằng flag và verify reconciliation.
5. Ngừng old consumers.
6. Contract ở release sau.

[lab/expand-contract.sql](lab/expand-contract.sql) minh họa PostgreSQL. Review lock/rewrite
behavior theo engine/version/table size; không chạy production trực tiếp.

## Queue, pub/sub và stream/log

- Queue thường phân phối work tới consumer; pub/sub fan-out tới subscriber; log/stream giữ
  ordered record theo partition để consumer đọc offset.
- Ordering thường chỉ trong partition/key; global ordering đắt và hạn chế scale.
- At-most-once có thể mất; at-least-once có thể duplicate.
- “Exactly-once” chỉ trong boundary/protocol được định nghĩa; external email/payment vẫn cần
  idempotency, dedup hoặc reconciliation.
- Ack trước xử lý có thể mất; ack sau xử lý có thể duplicate.
- DLQ giữ poison message nhưng cần owner, alert, replay policy và data retention/security.

## Idempotency, outbox và saga

API nhận idempotency key, lưu outcome trong transaction và trả lại cho duplicate. Consumer
lưu processed message ID/unique business constraint. Transactional outbox ghi business data
và event cùng database transaction; relay publish sau, consumer vẫn idempotent.

Saga phối hợp local transaction qua event/command và compensation; compensation không phải
time machine—refund có business effect riêng. Thiết kế state machine, timeout và audit.

## Backpressure và retry

Consumer lag tăng khi arrival > service rate. Scale consumer chỉ tới partition/dependency
capacity. Dùng bounded queue, admission/rate limit, prefetch/batch hợp lý, retry topic/delay,
exponential backoff+jitter và poison cutoff. Immediate retry hot-loop làm broker/downstream
tệ hơn.

## Lab: OrderFlow data path

1. PostgreSQL orders + unique idempotency key + outbox table.
2. Worker publish/consume event at-least-once.
3. Inject duplicate/out-of-order/poison message; chứng minh một side effect business.
4. Expand-contract status column khi old/new app cùng chạy.
5. Backfill có checkpoint và không lock table quá lâu.
6. Tạo read replica lag/cache stale scenario và behavior user rõ.
7. Backup/PITR vào sandbox; đo restore và reconcile count/hash/business invariant.
8. Load test pool/lock/queue lag; đặt saturation alert/runbook.

## Hoàn thành D14 khi

- Data store được chọn từ access/consistency/recovery/ops requirements.
- Migration old/new compatible và contract an toàn.
- Duplicate/retry không tạo side effect lặp.
- Queue lag/DLQ có capacity, ownership và replay plan.
- Restore/PITR được đo và data integrity được verify.
- Giải thích boundary của “exactly-once” và CAP mà không dùng slogan.

Nguồn: [PostgreSQL documentation](https://www.postgresql.org/docs/current/),
[Apache Kafka design](https://kafka.apache.org/documentation/#design) và
[CloudEvents specification](https://cloudevents.io/).

Tiếp theo: [D15 - Platform engineering và developer experience](../15-platform-engineering-dx/README.md).
