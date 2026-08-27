# D19 - Distributed systems, hybrid và multi-cloud

## Mục tiêu

- Lý luận về partial failure, time, partition, consistency và consensus.
- Thiết kế timeout/retry/idempotency/backpressure để tránh cascade.
- Chọn monolith/microservices/service mesh theo organizational và operational fit.
- Đánh giá hybrid/multi-cloud bằng business case, data/identity/network/cost/recovery.

## Điều gì làm hệ phân tán khó?

Hai process không chia sẻ hoàn hảo clock, memory hoặc fate:

- message có thể chậm, mất, duplicate, reorder;
- process có thể pause/crash nhưng peer không biết ngay;
- network partition làm timeout không nói request có thực thi hay chưa;
- wall clock có thể nhảy do sync; monotonic clock phù hợp đo duration;
- deploy/config/schema có nhiều version cùng tồn tại;
- retry/queue/cache tạo behavior phi tuyến.

Timeout là observation, không tự là cancellation. Sau timeout của request ghi, outcome có thể
unknown; cần idempotency/query/reconciliation trước retry.

## Consistency và availability

- Strong/linearizable: operation có vẻ xảy ra atomically theo real-time order.
- Sequential/causal/session guarantees có semantics trung gian.
- Eventual: nếu ngừng update, replica cuối cùng hội tụ; không nói bao lâu hoặc conflict xử lý sao.

CAP nói khi có network partition, operation phải trade consistency và availability; hệ thống
thực còn trade latency khi không partition (thường gợi bằng PACELC). Đừng gắn nhãn toàn
database; phân tích từng operation: payment ledger khác product recommendation.

Quorum read/write công thức đơn giản chỉ đúng với assumption replica/protocol/conflict cụ thể.
Consensus (như Raft/Paxos family) giúp node đồng thuận log/leader khi đủ quorum; nó không xóa
latency, capacity, bug, operator error hay data corruption. Fencing token ngăn leader cũ tiếp
tục ghi sau pause/partition.

## Reliability patterns

| Pattern | Mục đích | Failure mới cần tránh |
|---|---|---|
| Timeout/deadline | Chặn chờ vô hạn | Timeout quá ngắn, orphan work |
| Bounded retry | Che transient fault | Amplification/duplicate |
| Backoff+jitter | Phân tán retry | Recovery quá chậm nếu tuning sai |
| Circuit breaker | Ngắt dependency lỗi | Half-open stampede/stale fallback |
| Bulkhead | Cô lập pool/tenant | Underutilization/queue không công bằng |
| Load shedding | Bảo vệ core under overload | Shed sai priority/user |
| Idempotency/dedup | An toàn khi duplicate | Key scope/retention/race |
| Cache | Giảm latency/load | Stale, stampede, invalidation |
| Queue | Buffer/decouple | Lag, hidden overload, DLQ |

End-to-end deadline nên được truyền xuống; mỗi layer không tự retry ba lần. Retry budget và
admission control bảo vệ dependency. Bounded queue làm overload nhìn thấy thay vì OOM muộn.

## Time và ordering

- Lưu event timestamp UTC nhưng dùng monotonic clock đo elapsed time.
- NTP/clock drift ảnh hưởng TLS/token/log timeline; timestamp không tự là causal order.
- Logical clock/version/vector tùy use case; database commit/order broker có boundary riêng.
- Event ID, aggregate version và idempotency key giúp phát hiện duplicate/out-of-order.
- Last-write-wins có thể mất update và phụ thuộc clock; chỉ dùng khi business chấp nhận.

## Transactions xuyên service

Distributed transaction/2PC có coordination/availability trade-off. Saga chia local transaction
và compensation; outbox nối DB state với event intent; consumer vẫn idempotent. Thiết kế
business invariant, state machine, timeout, retry, manual reconciliation và audit.

## Monolith, microservices và mesh

Modular monolith thường tốt khi domain/team/scale còn nhỏ: transaction/debug/deploy đơn giản.
Microservices giúp independent ownership/deploy/scale khi boundary thật rõ, đổi lại network,
data consistency, platform/on-call/observability/supply-chain complexity.

Service mesh có thể cung cấp mTLS, routing và telemetry thống nhất, nhưng thêm proxy/control
plane, latency/cost/upgrade/failure. Không dùng mesh để che API không có deadline/idempotency.

Conway's Law: architecture phản chiếu communication. Chia service trước khi team/domain có
ownership rõ thường tạo distributed monolith.

## Hybrid architecture

~~~mermaid
flowchart LR
  Corp[On-prem identity users data] <-->|Federation DNS private connectivity| OCI[OCI landing zone]
  OCI <-->|Approved API events replication| AWS[AWS capability or recovery]
  OCI <-->|Approved API events replication| Azure[Azure capability or recovery]
  Gov[Data security cost policy] -.-> Corp
  Gov -.-> OCI
  Gov -.-> AWS
  Gov -.-> Azure
  Obs[Unified ownership and evidence] -.-> OCI
  Obs -.-> AWS
  Obs -.-> Azure
~~~

Hybrid cần:

- overlapping CIDR/IPAM, route/BGP/VPN/FastConnect/ExpressRoute/Direct Connect;
- DNS resolution/split-horizon và certificate/trust;
- identity federation/workload identity và break-glass;
- latency/bandwidth/MTU/egress và dependency timeout;
- data sovereignty/classification/replication/key ownership;
- observability correlation và incident responsibility;
- capacity/fallback khi private link/provider/control plane lỗi.

## Multi-cloud decision

Business reasons có thể hợp lệ: acquisition, regulatory/data residency, customer proximity,
unique managed capability, vendor negotiation hoặc carefully designed disaster recovery.
“Không lock-in” chung chung chưa đủ.

Tổng complexity:

~~~text
identity + organization/policy + network/DNS
+ data replication/consistency + CI/artifact
+ observability/incident + skill/on-call
+ contracts/egress + duplicated controls/compliance
~~~

Portability có các mức:

- source portability: có thể rebuild/migrate với effort;
- artifact portability: OCI container image nhưng runtime services vẫn khác;
- workload portability: interface/platform chuẩn;
- data portability: format/export/volume/time/egress;
- operational portability: team/runbook/telemetry/security.

Chỉ viết abstraction cho stable business capability. Lowest-common-denominator wrapper có thể
che value của managed service và tạo platform riêng phải bảo trì.

## Multi-cloud DR caveat

Cloud khác không tự độc lập: cùng DNS/IdP/Git/registry/library/team có thể là shared failure.
Cross-cloud data replication tăng RPO/consistency/egress/security complexity. Recovery stack
phải thường xuyên deploy/test; “Terraform chạy được ở hai cloud” không chứng minh app/data/
identity/dependency hoạt động.

Đọc [bảng so sánh và migration](../../Refer/README.md) trước decision.

## Lab: partition và architecture defense

### Part A - local distributed failure

1. Order API → payment → DB/broker với injected latency/loss/duplicate.
2. Đo khi mỗi layer retry ba lần; tính amplification.
3. Thêm end-to-end deadline, one-layer retry budget, jitter, bulkhead và load shedding.
4. Kill/pause leader/consumer; quan sát lag, unknown outcome và duplicate side effect.
5. Reconcile business invariant, không chỉ message count.

### Part B - hybrid/multi-cloud ADR

1. Đưa một business/regulatory requirement thật, không “học cho biết”.
2. So option OCI-only multi-region, hybrid và OCI + cloud khác.
3. Threat/failure/data/latency/cost/skill/exit model.
4. Viết dependency/failure matrix gồm DNS, IdP, Git, registry và people.
5. Mô phỏng cloud/connection/data corruption; đo restore/failback.
6. Chọn option đơn giản nhất đạt requirement và bảo vệ trước review panel.

## Hoàn thành D19 khi

- Giải thích partial failure/timeout/unknown outcome/clock mà không giả định network tin cậy.
- Retry/idempotency/queue/backpressure có bounded behavior và test.
- Consistency được chọn theo operation/business invariant.
- Microservice/mesh/multi-cloud có quantified benefit lớn hơn complexity.
- DR test bao gồm shared dependency, data integrity và failback.
- Có exit/migration plan và cost/skill ownership.

Nguồn: [Designing Data-Intensive Applications references](https://dataintensive.net/),
[CNCF TAG Network](https://github.com/cncf/tag-network),
[OCI multicloud documentation](https://docs.oracle.com/en-us/iaas/Content/multicloud.htm) và
[AWS/Azure/OCI comparison trong repository](../../Refer/README.md).

Tiếp theo: [D20 - Senior leadership và capstone](../20-senior-leadership-capstone/README.md).
