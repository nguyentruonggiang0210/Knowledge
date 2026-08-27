# Đáp án — System Design và Distributed Systems

Rubric cho [`../system_design.md`](../system_design.md). Bài thiết kế không có một đáp án duy nhất; điểm Senior nằm ở giả định, trade-off, failure mode và cách kiểm chứng.

## SD-001 — Làm rõ requirement

**Câu hỏi:** Khi bắt đầu một bài system design, bạn cần làm rõ functional requirement và non-functional requirement nào?

Functional: actor, use case chính, API/input-output, scope và non-goal. Non-functional: traffic/peak, data size/growth, read-write ratio, latency percentile, availability, durability, consistency, retention, security/compliance, region và cost.

Sau đó ưu tiên critical journey và chốt SLO. Một câu Senior không lao vào vẽ service trước khi biết constraint; phải ghi assumption để người phỏng vấn sửa được.

## SD-002 — Capacity estimate

**Câu hỏi:** Từ DAU, request/user/day, read-write ratio và kích thước payload, hãy ước lượng peak QPS, storage và bandwidth. Vì sao cần ghi rõ hệ số peak?

Ví dụ average QPS = `DAU × requests/user/day ÷ 86,400`; peak = average × hệ số quan sát/giả định (thường 3–10, nhưng phải nói rõ). Storage/day = writes × payload × replication/index overhead; bandwidth = QPS × response bytes, tách ingress/egress.

Không cần chính xác tuyệt đối; cần đúng bậc độ lớn, đơn vị và headroom. Hệ số peak phản ánh diurnal/event burst; nếu bỏ nó, capacity trung bình sẽ sập ở giờ cao điểm.

## SD-003 — SLA/SLO/SLI và error budget

**Câu hỏi:** Phân biệt SLA, SLO và SLI. Một availability target 99.99% tạo error budget bao nhiêu và ảnh hưởng thiết kế thế nào?

SLI là phép đo (tỷ lệ request tốt); SLO là mục tiêu nội bộ; SLA là cam kết có hậu quả với khách hàng. 99.99% trong 30 ngày cho phép khoảng `0.01% × 43,200 phút = 4.32 phút` request-time/downtime theo cách định nghĩa SLI.

Mục tiêu này buộc loại single point, deploy an toàn, failover nhanh và alert burn-rate; nhưng không tự động đòi active-active nếu SLI request-based vẫn đạt. Phải nói measurement window và loại request bị loại.

## SD-004 — Scale up/out

**Câu hỏi:** Scale up và scale out khác nhau ra sao? State trong application làm scale out khó như thế nào?

Scale up tăng CPU/RAM/I/O một máy, đơn giản nhưng có trần, failure domain lớn và thường downtime/cost curve cao. Scale out thêm instance, tăng availability và elasticity nhưng đòi partition/load balance, coordination và observability.

Session/in-memory state dính vào instance làm request cần sticky routing và mất state khi fail. Đưa durable/shared state ra store, token hóa session hoặc replicate có chủ đích; vẫn giữ local cache ephemeral.

## SD-005 — Load balancer

**Câu hỏi:** Load balancer layer 4 và layer 7 khác nhau thế nào? Các thuật toán round-robin, least-connections và consistent hashing phù hợp khi nào?

L4 route theo IP/port, ít overhead, dùng được nhiều protocol; L7 hiểu HTTP host/path/header, TLS, auth/rate policy nhưng tốn CPU và có semantic timeout. Round-robin hợp request đồng đều; least-connections cho duration lệch nhưng không biết work cost; consistent hash giữ affinity/cache locality nhưng dễ hotspot.

Senior nêu health check, draining, retry ownership, cross-zone cost và việc LB metrics có thể che instance overload.

## SD-006 — CAP/PACELC

**Câu hỏi:** CAP theorem thực sự nói gì trong lúc network partition? PACELC bổ sung quyết định latency/consistency khi không partition ra sao?

Khi có partition, distributed data system phải chọn tiếp tục trả lời có thể không nhất quán (A) hoặc từ chối/chờ để giữ consistency (C); partition tolerance không phải lựa chọn thực tế nếu mạng có thể lỗi. CAP không nói “chọn hai trong ba” mọi lúc.

PACELC thêm: nếu có Partition chọn A/C; Else bình thường chọn Latency/Consistency. Quyết định có thể khác theo operation—cart có thể AP, payment ledger CP.

## SD-007 — Consistency models

**Câu hỏi:** Strong, eventual, causal và read-your-writes consistency khác nhau ra sao? Hãy gắn mỗi mô hình với một use case.

Strong/linearizable: read thấy write mới nhất theo real time; phù hợp lock/unique allocation. Eventual: nếu ngừng write, replicas hội tụ; phù hợp feed/cache. Causal giữ quan hệ nguyên nhân trước kết quả nhưng concurrent event có thể khác thứ tự; hợp collaboration/chat. Read-your-writes bảo một client thấy thay đổi của chính nó, có thể qua session stickiness/version token.

Senior gắn model với user invariant thay vì đòi strong cho mọi dữ liệu.

## SD-008 — Linearizability và serializability

**Câu hỏi:** Linearizability khác serializability thế nào? Một hệ thống có thể có tính chất này mà không có tính chất kia không?

Linearizability là thuộc tính từng operation/object theo thứ tự real-time. Serializability là transaction execution tương đương một thứ tự tuần tự, nhưng thứ tự đó không nhất thiết tôn trọng wall-clock. Strict serializability kết hợp cả hai.

Một DB snapshot/serializable có thể chọn serialization order không theo real-time; một key-value register linearizable từng key nhưng transaction nhiều key không serializable. Câu tốt phân biệt concurrency correctness với transaction isolation.

## SD-009 — Distributed clocks

**Câu hỏi:** Vì sao đồng hồ hệ thống không đủ để sắp thứ tự tuyệt đối các event phân tán? Lamport clock và vector clock giải quyết phần nào?

Wall clock lệch, drift và bị NTP điều chỉnh; network delay không giới hạn nên timestamp không chứng minh causal order. Lamport clock cho `a → b` thì L(a)<L(b), nhưng L nhỏ hơn không chứng minh causal; vector clock phát hiện causal/concurrent bằng vector per participant nhưng metadata lớn.

Dùng monotonic clock cho duration, logical/Hybrid Logical Clock cho ordering phù hợp và tie-breaker rõ; không coi timestamp là global truth.

## SD-010 — Consensus/Raft

**Câu hỏi:** Consensus giải quyết bài toán nào? Giải thích vai trò leader, quorum và term/epoch trong Raft ở mức khái niệm.

Consensus khiến node không tin cậy thống nhất một log/value dù crash/network delay trong giả định quorum. Raft bầu leader theo term; leader append log, commit khi majority xác nhận; node có log mới hơn được ưu tiên bầu. Term/epoch nhận diện leadership mới và loại message cũ.

Quorum cần majority sống, nên không tăng write availability qua partition. Consensus không giải quyết Byzantine fault mặc định và không thay idempotency ở client.

## SD-011 — Replication sync/async

**Câu hỏi:** Replication đồng bộ và bất đồng bộ đánh đổi latency, durability và availability thế nào? Replica lag gây anomaly gì?

Sync chờ replica/quorum nên latency cao và có thể mất availability khi replica lỗi, đổi lại RPO thấp. Async trả sau primary write, latency/availability tốt nhưng failover có thể mất acknowledged write.

Replica lag gây stale read, read-after-write violation, monotonic read đảo ngược và job chạy trên dữ liệu cũ. Mitigation: route session về primary, version/LSN wait, bounded staleness hoặc UI pending state; đo lag theo thời gian lẫn bytes.

## SD-012 — Replication topology

**Câu hỏi:** Leader–follower, multi-leader và leaderless replication phù hợp với workload nào? Conflict được phát hiện và giải quyết ra sao?

Leader–follower đơn giản conflict/order, read scale tốt nhưng leader bottleneck/failover. Multi-leader hợp multi-region/offline write nhưng cần conflict detection/merge. Leaderless gửi N replicas, dùng quorum/read repair/anti-entropy, availability cao nhưng sibling/conflict và tombstone phức tạp.

Conflict có thể last-write-wins (mất update), version/vector, CRDT hoặc domain merge/manual. Chọn theo invariants, không theo marketing.

## SD-013 — Quorum N/R/W

**Câu hỏi:** Quorum read/write với N, R, W hoạt động thế nào? Vì sao `R + W > N` chưa tự động bảo đảm linearizability?

Write đến W replicas, read từ R và chọn version mới nhất; `R+W>N` tạo overlap, `W>N/2` giúp write quorums overlap. Nhưng clock/version, sloppy quorum, failed write một phần, concurrent writes và read repair quyết định kết quả.

Linearizability còn cần single order/consensus hoặc protocol đúng; quorum arithmetic một mình không đủ. Senior nhắc latency tail vì operation chờ replica thứ R/W.

## SD-014 — Sharding

**Câu hỏi:** Range sharding, hash sharding và directory-based sharding khác nhau thế nào? Rebalancing ảnh hưởng production ra sao?

Range shard hỗ trợ range scan/locality nhưng hotspot ở key tăng dần; hash phân bố đều nhưng range query/fan-out và reshard khó; directory linh hoạt placement nhưng metadata service là dependency.

Rebalance tiêu bandwidth/I/O, tăng tail latency và cần dual-read/write hoặc ownership epoch để không mất/ghi đôi. Chọn shard key theo access pattern, cardinality và growth; tránh tenant lớn dồn một shard.

## SD-015 — Consistent hashing

**Câu hỏi:** Consistent hashing và virtual nodes giảm data movement/hotspot như thế nào? Nó không giải quyết loại skew nào?

Node/key nằm trên ring; thêm/bớt node chỉ chuyển vùng lân cận thay vì mod-hash toàn bộ. Virtual nodes phân tán mỗi physical node ở nhiều điểm, cân bằng capacity/failure và cho weight khác nhau.

Nó không chữa skew do một key cực nóng hoặc workload không đều theo key. Cần key splitting, replication/cache hoặc adaptive partition.

## SD-016 — Distributed ID

**Câu hỏi:** Thiết kế ID phân tán bằng database sequence, UUIDv4/v7, Snowflake hoặc hi/lo có trade-off gì về ordering, index và collision?

DB sequence ngắn/ordered/unique nhưng central bottleneck và lộ volume; hi/lo cấp block giảm round-trip nhưng có gap. UUIDv4 phi tập trung nhưng random làm B-tree fragmentation/lớn; UUIDv7 time-ordered hơn. Snowflake ghép timestamp+worker+sequence, sortable nhưng cần worker ID và xử lý clock rollback.

Chọn theo uniqueness scope, offline generation, privacy và index. Không dùng ID đo thứ tự tuyệt đối nếu clock/worker semantics không đảm bảo.

## SD-017 — Cache patterns

**Câu hỏi:** Cache-aside, read-through, write-through và write-behind khác nhau thế nào?

Cache-aside: app đọc cache miss rồi DB và tự invalidate; đơn giản nhưng race/stampede. Read-through để cache loader chịu trách nhiệm. Write-through ghi cache và store đồng bộ, dễ consistent hơn nhưng write latency. Write-behind ghi cache rồi flush, nhanh nhưng có nguy cơ mất/reorder và phức tạp durability.

Source of truth và failure policy phải rõ. Cache không nên là correctness requirement trừ khi được thiết kế như store bền vững.

## SD-018 — Invalidation/stampede

**Câu hỏi:** Cache invalidation, stale data và cache stampede được xử lý bằng TTL jitter, single-flight, stale-while-revalidate hoặc versioning ra sao?

TTL giới hạn stale; jitter tránh nhiều key hết hạn cùng lúc. Single-flight/lease cho một request reload; stale-while-revalidate phục vụ bản cũ trong lúc refresh; negative cache chặn miss lặp. Versioned key/event invalidation giảm delete race.

Phải đặt max staleness theo nghiệp vụ, timeout load và fallback khi cache lỗi. Distributed lock không có fencing có thể để loader cũ ghi đè mới.

## SD-019 — Hot key/partition

**Câu hỏi:** Hot key/hot partition được phát hiện và giảm tải thế nào mà không phá consistency requirement?

Phát hiện qua per-key/partition QPS, throttling, latency, queue depth và skew so median; sampling heavy hitters để tránh cardinality metric. Giảm bằng local/multi-level cache, replicate read, request coalescing, split logical key/bucket hoặc isolate tenant.

Write hot key cần batching/aggregation, sharded counters/CRDT rồi reconcile; nếu invariant strong, serialize qua owner/queue và chấp nhận throughput ceiling thay vì phá đúng đắn.

## SD-020 — Bloom filter

**Câu hỏi:** Bloom filter hoạt động ra sao, có false positive/false negative thế nào, và hữu ích ở đâu trong storage/cache?

Bit array + k hashes: add set bit; query “definitely absent” nếu có bit 0, hoặc “possibly present” nếu tất cả 1. Không có false negative nếu filter không xóa sai; có false positive tăng theo load. Counting Bloom hỗ trợ delete với chi phí lớn hơn.

Dùng tránh disk/cache/database lookup cho key chắc chắn không tồn tại, LSM SSTable hoặc crawler dedup. Phải chọn size/k theo n và target false-positive, rebuild khi quá đầy.

## SD-021 — Sync hay async

**Câu hỏi:** Khi nào dùng synchronous request/response, khi nào dùng asynchronous messaging? Chi phí về coupling và observability là gì?

Sync phù hợp khi caller cần kết quả tức thời, flow ngắn và dependency đạt latency budget; đơn giản semantic nhưng temporal coupling/cascade. Async decouple thời gian, buffer burst, retry/replay nhưng tạo eventual consistency, duplicate/order issue và debug khó.

Senior xem user expectation, failure handling và backpressure; thường command chấp nhận trả `202 + operation ID`, còn validation nhanh có thể sync. Không dùng broker chỉ để che API chậm.

## SD-022 — Delivery semantics

**Câu hỏi:** At-most-once, at-least-once và effectively-once delivery khác nhau thế nào? Vì sao “exactly once” end-to-end rất khó?

At-most-once có thể mất nhưng không duplicate; at-least-once retry nên có duplicate; effectively-once đạt outcome một lần nhờ idempotency/dedup/transaction trong phạm vi. “Exactly once” broker thường chỉ trong boundary cụ thể, không bao trùm DB, email, payment và external effect.

End-to-end cần identity, atomic state transition và reconciliation. Senior hỏi rõ phạm vi tuyên bố.

## SD-023 — Idempotent consumer

**Câu hỏi:** Thiết kế idempotent message consumer gồm dedup store, transaction boundary và retention như thế nào?

Message có stable ID và business key. Trong cùng DB transaction, insert vào inbox/processed table có unique `(consumer, message_id)` rồi áp dụng business update; duplicate vi phạm unique thì ack/no-op. Nếu effect ngoài DB, dùng state machine/outbox hoặc provider idempotency key.

Retention phải dài hơn redelivery/replay window; partition table để dọn. Đừng mark processed trước business commit hoặc dùng cache volatile làm dedup duy nhất.

## SD-024 — Ordering

**Câu hỏi:** Message ordering được bảo đảm ở phạm vi nào? Partition key và consumer concurrency tác động ra sao?

Broker thường chỉ bảo đảm trong partition/queue, không global. Chọn partition key theo entity cần order (order/account); nhiều consumer xử lý partition khác song song. Retry/DLQ có thể làm event sau vượt event trước.

Dùng sequence/version per entity, reject/buffer out-of-order hoặc thiết kế operation commutative. Global order làm throughput/availability bottleneck và hiếm khi là requirement thật.

## SD-025 — Queue và log

**Câu hỏi:** Queue và log/stream khác nhau về consumption, replay, retention và fan-out thế nào?

Queue phân công message cho một consumer trong group, thường remove/ack sau xử lý—tốt cho work distribution. Log append-only giữ event theo retention; mỗi group có offset riêng, replay/fan-out và stream processing tốt.

Sản phẩm có thể hỗ trợ cả hai, nhưng cần xét ordering, retention, compaction, consumer lag và backpressure. Queue không phải audit log nếu message bị xóa.

## SD-026 — Transactional Outbox

**Câu hỏi:** Transactional Outbox giải quyết dual-write ra sao? Relay polling và CDC có failure mode nào?

Business row và outbox event được ghi cùng local transaction, loại khoảng trống DB thành công nhưng publish thất bại. Relay poll với lock/skip-locked hoặc CDC đọc log rồi publish; sau publish trước mark có thể duplicate nên consumer idempotent.

Polling tăng load/latency; CDC vận hành connector/schema/offset phức tạp. Cần ordering key, cleanup, poison event, lag metric và không publish payload chứa model nội bộ không version.

## SD-027 — Saga

**Câu hỏi:** Saga choreography và orchestration khác nhau thế nào? Thiết kế compensating action cần lưu ý điều gì?

Choreography: service phản ứng event, ít central coupling nhưng flow ẩn, khó quan sát và vòng event. Orchestration: coordinator giữ state/command, flow rõ và timeout tốt hơn nhưng là component quan trọng/coupling contract.

Compensation là business action mới, không phải rollback hoàn hảo; phải idempotent, có thể thất bại và cần manual reconciliation. Thiết kế pivot/irreversible step, timeout và trạng thái saga bền vững.

## SD-028 — Two-phase commit

**Câu hỏi:** Khi nào two-phase commit hợp lý, và vì sao thường tránh nó giữa microservices?

2PC dùng coordinator: prepare resource giữ lock rồi commit/abort. Hợp trong hạ tầng kiểm soát, số resource ít và cần atomicity mạnh hơn availability/latency.

Giữa microservices nó tạo blocking khi coordinator/network lỗi, lock dài, coupling và support không đồng đều. Saga/outbox + invariant cục bộ thường phù hợp hơn; nhưng đừng tuyên bố 2PC “luôn xấu” trong database cluster/transaction manager phù hợp.

## SD-029 — Timeout/retry/backoff

**Câu hỏi:** Timeout, retry, exponential backoff và jitter phải được phối hợp ra sao để tránh retry storm?

Mỗi call có timeout từ end-to-end deadline, connect/read riêng; retry chỉ lỗi transient và operation idempotent, có max attempts/budget. Exponential backoff giảm tần suất, full jitter phân tán client. Tôn trọng `Retry-After`.

Chỉ một layer nên chủ yếu retry để tránh nhân số lần; đặt cap và circuit/load shedding. Log attempt nhưng metric outcome cuối lẫn retry load.

## SD-030 — Protective patterns

**Câu hỏi:** Circuit breaker, bulkhead, rate limiter và load shedding bảo vệ hệ thống ở các failure mode khác nhau thế nào?

Rate limiter giới hạn admission theo quota; load shedding từ chối khi saturated để giữ core. Circuit breaker ngừng gọi dependency đang lỗi và probe hồi phục; bulkhead tách pool/queue để lỗi một dependency/tenant không ăn hết tài nguyên.

Chúng cần timeout/backpressure và fallback có ý nghĩa. Cấu hình sai có thể tạo synchronized half-open hoặc chặn traffic khỏe; metric rejected/saturation phải rõ.

## SD-031 — Backpressure

**Câu hỏi:** Backpressure nên được truyền qua HTTP, stream và worker queue như thế nào? Khi nào nên drop, buffer hay reject?

HTTP có thể trả 429/503 + `Retry-After`, giới hạn concurrency/queue và hủy theo deadline. Reactive stream dùng demand/window; worker queue pause consumption, giảm prefetch hoặc scale consumer theo downstream capacity.

Buffer chỉ hấp thụ burst hữu hạn và làm tăng latency; đặt bound. Drop dữ liệu có giá trị thấp/telemetry theo policy, reject để caller retry khi request có giá trị, hoặc block chỉ khi không gây giữ tài nguyên dây chuyền. Senior bảo vệ downstream trước mục tiêu “nhận hết”.

## SD-032 — DLQ

**Câu hỏi:** Dead-letter queue dùng đúng cách ra sao? Vì sao DLQ không nên trở thành nơi chôn message vô thời hạn?

DLQ giữ message vượt retry policy hoặc lỗi không retry được cùng payload/reference, headers, error, attempts và source offset. Cần alert theo rate/age, dashboard, owner, tooling inspect/redact/replay có kiểm soát.

Trước replay phải sửa nguyên nhân và bảo đảm idempotency/order; poison message có thể quarantine. TTL/retention và privacy phải rõ. DLQ tăng không phải thành công delivery.

## SD-033 — Webhook service

**Câu hỏi:** Webhook delivery service cần chữ ký, retry, ordering, idempotency và tenant isolation thế nào?

Lưu subscription/secret theo tenant; outbox tạo delivery record. Ký raw body với timestamp + delivery ID, HTTPS, allow/deny destination chống SSRF. Retry exponential+jitter theo endpoint, limit concurrency/tenant và DLQ/disable sau ngưỡng.

Order chỉ cam kết per subscription/entity nếu thật sự cần; receiver dedup delivery ID. Có delivery log, manual replay, secret rotation/key ID, payload version và không để tenant chậm chiếm worker chung.

## SD-034 — Gateway/BFF

**Câu hỏi:** API Gateway/BFF mang lại lợi ích và rủi ro gì? Logic nào không nên đặt trong gateway?

Gateway tập trung routing, TLS/authn, coarse authz, rate limit, protocol translation và observability. BFF tạo API theo nhu cầu từng client, giảm chatty call.

Không đặt core business invariant, long transaction hoặc data ownership trong gateway; nếu không nó thành monolith/bottleneck. Cần HA, config rollout, timeout và tránh retry trùng với service. Fine-grained authorization vẫn ở service sở hữu resource.

## SD-035 — Service discovery

**Câu hỏi:** Service discovery client-side và server-side khác nhau thế nào? DNS caching và stale endpoint gây lỗi gì?

Client-side lấy registry và tự load-balance, kiểm soát tốt nhưng nhúng logic/library; server-side qua proxy/LB đơn giản client nhưng thêm hop/control plane. Kubernetes DNS/Service là dạng server-side/virtual IP.

DNS TTL có thể bị runtime cache lâu; connection pool giữ IP đã mất dù DNS đổi. Cần endpoint health, draining, resolver refresh và retry kết nối có deadline; không retry request non-idempotent mù quáng.

## SD-036 — Database per service

**Câu hỏi:** Database-per-service bảo vệ autonomy thế nào, và làm query/join/reporting xuyên service ra sao?

Mỗi service sở hữu schema và không cho service khác query trực tiếp, cho phép thay đổi/deploy/scale độc lập. Cross-service view dùng API composition cho online nhỏ, event-driven materialized view/CQRS cho read nhiều, hoặc CDC/data warehouse cho analytics.

Không distributed join trên request path nếu latency/SLO không chịu được. Data duplicate là có chủ đích, cần source of truth, freshness và reconciliation. Reporting store không được viết ngược vào operational data.

## SD-037 — Event sourcing

**Câu hỏi:** Event sourcing đem lại audit/rebuild nhưng tạo những chi phí gì về schema evolution, projection và debugging?

Lưu immutable event cho phép audit, temporal query và rebuild projection; write model có lịch sử đầy đủ. Chi phí: event schema không dễ xóa, upcaster/versioning, projection lag/rebuild, snapshot, storage, GDPR và developer tooling/debug mental model.

Event phải là business fact ổn định, không serialize object internals. Side effect không tự replay; handler phải phân biệt live/rebuild. Chỉ dùng nơi lịch sử là giá trị lõi, không vì “event-driven”.

## SD-038 — Rebuild CQRS read model

**Câu hỏi:** CQRS read model được rebuild và chuyển version không downtime như thế nào?

Tạo projection version mới cạnh cũ, replay từ checkpoint/snapshot vào store mới, rồi catch up live event. Đối soát count/hash/business invariants và đo lag. Khi sẵn sàng, chuyển read qua alias/flag; giữ cũ trong rollback window rồi xóa.

Handler phải deterministic/idempotent, event schema cũ đọc được. Nếu dual-processing live, quản lý offset atomic và resource throttle để rebuild không ảnh hưởng production.

## SD-039 — Search index

**Câu hỏi:** Search engine/inverted index khác database index thế nào? Đồng bộ source of truth với search index ra sao?

DB B-tree/hash index tối ưu exact/range và transaction; inverted index ánh term → documents, hỗ trợ tokenization, relevance, stemming/fuzzy và facets nhưng thường eventual. Database là source of truth; outbox/CDC cập nhật index.

Cần idempotent upsert theo entity version, delete/tombstone, reindex version side-by-side và reconciliation. UI phải chấp nhận freshness hoặc fallback DB cho read-after-write quan trọng.

## SD-040 — Multi-tenancy

**Câu hỏi:** Multi-tenancy dùng shared schema, schema-per-tenant hay database-per-tenant có trade-off nào về isolation, cost và vận hành?

Shared schema rẻ/dễ pool nhưng isolation yếu và noisy neighbor; cần tenant key mọi index/query và RLS. Schema-per-tenant isolation/backup tùy tenant tốt hơn nhưng migration/connection nhiều. Database-per-tenant mạnh nhất cho compliance/large tenant nhưng cost/fleet automation cao.

Thường tiered hybrid: small tenant shared, enterprise dedicated. Senior nêu encryption key, quota, placement catalog, cross-tenant admin và migration giữa tiers.

## SD-041 — Tamper-resistant audit

**Câu hỏi:** Audit log chống sửa đổi nên lưu actor, intent, before/after và correlation thế nào? Làm sao cân bằng với quyền xóa dữ liệu cá nhân?

Ghi actor/effective actor, action/intent, resource, before-after hoặc diff đã redact, timestamp, request/trace ID, auth context và outcome. Append-only storage, restricted write/read, hash chain/signature hoặc WORM tăng khả năng phát hiện sửa; ship ra account/boundary khác.

Privacy: minimization, field tokenization/encryption, retention legal và crypto-erasure/pseudonymization; audit không phải excuse giữ mọi PII mãi mãi. Đồng bộ clock và kiểm tra completeness.

## SD-042 — Zero-downtime migration

**Câu hỏi:** Một zero-downtime data migration qua nhiều service cần compatibility window, backfill, validation và rollback thế nào?

Mở rộng contract/schema tương thích; producer phát cả version hoặc canonical event mới, consumer đọc cũ/mới. Backfill batch có checkpoint/throttle, đối soát và sửa delta; shadow read/compare rồi cutover bằng flag.

Giữ compatibility đến khi inventory/telemetry cho thấy mọi instance/consumer đã chuyển. Rollback trước destructive contract; migration service-to-service cần ownership và correlation. Không dual-write hai store không có repair plan.

## SD-043 — Multi-region modes

**Câu hỏi:** Active-passive và active-active multi-region khác nhau về RTO, RPO, routing và conflict thế nào?

Active-passive route một region, replicate sang standby; conflict ít, cost thấp hơn nhưng failover/RTO và capacity standby cần thử. Active-active phục vụ nhiều region, latency/availability tốt nhưng routing affinity, replication conflict, global dependency và vận hành phức tạp.

RPO phụ thuộc replication sync/async; DNS TTL/health, data fencing và failback quan trọng. Không gọi active-active nếu write thực tế vẫn phụ thuộc một primary toàn cầu.

## SD-044 — Backup, HA và DR

**Câu hỏi:** Disaster Recovery: phân biệt backup, high availability và disaster recovery; cách chứng minh RPO/RTO đạt yêu cầu?

HA xử lý lỗi thường xuyên trong site/failure domain; backup là bản dữ liệu phục hồi khỏi xóa/corruption/ransomware; DR khôi phục service sau thảm họa lớn gồm infra, data, identity, dependency và people/process.

Chứng minh RPO/RTO bằng restore/failover drill định kỳ từ backup bất biến, đo mất dữ liệu và thời gian end-to-end, không chỉ tin job “backup success”. Test quyền, runbook, DNS, secret và failback.

## SD-045 — Split brain/fencing

**Câu hỏi:** Split-brain xảy ra thế nào? Fencing token giúp ngăn stale leader ghi dữ liệu ra sao?

Partition có thể khiến leader cũ và mới cùng tin mình sở hữu resource. Lease hết hạn chưa đủ vì leader cũ có thể pause rồi tiếp tục write. Mỗi leadership cấp fencing token tăng dần; storage/resource từ chối token thấp hơn token mới nhất.

Consensus/majority giảm split brain, STONITH có thể cô lập node. Senior phân biệt distributed lock với bảo vệ tại resource nhận write.

## SD-046 — Health checks

**Câu hỏi:** Health check liveness, readiness và startup nên phản ánh gì? Vì sao check mọi dependency trong liveness có thể gây cascade?

Startup cho app thời gian khởi động; readiness quyết định nhận traffic và có thể phản ánh dependency thiết yếu/capacity; liveness chỉ xác định process không thể tự hồi nếu không restart (deadlock), nên nhẹ và local.

Nếu liveness gọi DB, DB chập chờn làm mọi Pod restart, mất cache/connection và khuếch đại sự cố. Readiness cũng cần hysteresis/timeout để tránh flap; dependency optional nên degrade chứ không unready toàn app.

## SD-047 — Graceful degradation

**Câu hỏi:** Graceful degradation được thiết kế theo critical user journey và dependency budget như thế nào?

Xác định critical journey và dependency nào bắt buộc/optional. Dành timeout/retry budget, bulkhead và quota; fallback sang cache/stale/default, tắt recommendation/analytics, chuyển write sang queue hoặc read-only mode theo correctness.

Fallback phải được test và hiển thị trạng thái trung thực, không trả dữ liệu sai cho payment. Theo dõi degradation activation và có recovery plan; feature flag/kill switch có owner.

## SD-048 — Chaos experiment

**Câu hỏi:** Chaos experiment an toàn cần hypothesis, blast radius, abort condition và steady-state metric gì?

Đặt hypothesis: khi dependency X latency 2s, checkout core vẫn đạt SLI Y nhờ timeout/fallback. Xác định steady-state metric, blast radius nhỏ/canary, thời lượng, owner, communication, abort threshold và rollback/stop injection.

Chạy trong staging trước nhưng production mới có topology thật; không chaos khi hệ đang yếu. Experiment phải tạo action/learning, không chỉ chứng minh “hệ thống bị hỏng”.

## SD-049 — Seasonal cost

**Câu hỏi:** Bạn tối ưu cost cho hệ thống có tải theo mùa mà không hy sinh SLO bằng những đòn bẩy nào?

Baseline unit economics và SLO; autoscale stateless theo leading signal, scheduled pre-scale cho campaign, queue buffer, cache/CDN, database read replica/partition và load test capacity. Rightsize baseline, commitments cho tải ổn định, spot/preemptible cho job chịu gián đoạn.

Giữ headroom có chủ đích, limit runaway cost và theo dõi cost/request/tenant. Scale-down phải tránh thrash; database/license/egress thường là bottleneck không tự co.

## SD-050 — Data residency

**Câu hỏi:** Data residency và compliance ảnh hưởng placement, replication, observability và support access ra sao?

Phân loại data và vùng được phép lưu/xử lý; route tenant theo home region, ngăn replication/backup/search/log/trace vượt biên. Key management, admin/support access, incident export và subprocessors cũng thuộc phạm vi.

Metadata toàn cầu phải tối thiểu/pseudonymized. Policy-as-code và audit chứng minh placement. Senior nhận ra observability và DR copy thường là đường rò residency bị bỏ quên.

## SD-051 — URL shortener

**Câu hỏi:** Thiết kế URL shortener: API, ID/alias, data model, redirect latency, cache, abuse prevention và analytics.

API tạo alias idempotent, validate custom alias/expiry; redirect `GET /{code}`. Sinh code bằng random base62 đủ entropy hoặc ID+encoding (cân nhắc enumeration), unique constraint. KV/DB shard theo code, cache hot mapping và negative cache; redirect 301 khó cập nhật hơn 302.

Analytics đi async, không chặn redirect. Rate limit, reputation/malware/phishing scan, reserved words và abuse takedown. Nêu QPS/read-heavy, TTL, custom collision retry và multi-region consistency cho alias creation.

## SD-052 — News feed

**Câu hỏi:** Thiết kế news feed cho hàng chục triệu người dùng. So sánh fan-out-on-write, fan-out-on-read và cách xử lý celebrity.

Fan-out-on-write ghi post ID vào inbox follower: read nhanh, write khổng lồ cho celebrity. Fan-out-on-read query/merge followees: write rẻ, read nặng. Hybrid fan-out người thường; celebrity pull lúc read rồi k-way merge/rank.

Store social graph, post source, timeline cache; partition theo user, cursor theo rank/time+ID, dedup/privacy deletion. Queue handles fan-out with idempotency; eventual feed acceptable nhưng unfollow/privacy cần invalidation nhanh.

## SD-053 — Chat

**Câu hỏi:** Thiết kế chat 1-1 và group chat: connection, presence, ordering, offline delivery, history và multi-device sync.

WebSocket gateway giữ connection/presence ephemeral; conversation service assigns sequence per conversation/partition, persists message before ack, publishes to online devices; offline push separate. Client message ID idempotent, delivery/read receipts là events.

History partition by conversation/time with cursor; group fan-out strategy theo size. Multi-device sync uses per-device cursor, reconnect fetch gaps. Presence eventually consistent/TTL; encryption, abuse, retention and attachment object storage included.

## SD-054 — Notification

**Câu hỏi:** Thiết kế hệ thống notification đa kênh: preference, template, scheduling, dedup, provider failover và rate limit.

API/event → preference/consent + template version → scheduling/orchestration → per-channel queue/worker/provider adapter. Dedup on business event+recipient+channel, priority/quota, quiet hours/timezone, provider rate limit and circuit/failover.

Track state accepted/sent/delivered/failed where provider supports, retry only transient, DLQ/replay. Avoid duplicate across failover using provider/client idempotency; unsubscribe and PII handling are critical.

## SD-055 — Payment

**Câu hỏi:** Thiết kế payment workflow: idempotency, ledger, provider timeout, reconciliation, refund và audit.

Create payment with merchant idempotency key and immutable amount/currency; state machine persists intent. Double-entry ledger is append-only source for money, provider calls via outbox. Timeout means unknown—not failed—so query webhook/poll and reconcile provider settlement.

Webhook signed/deduped, transition conditional on version. Refund is new ledger/payment operation, not row edit. Separate authorization/capture, audit, PCI/tokenization, manual exception queue and daily reconciliation.

## SD-056 — Reservation

**Câu hỏi:** Thiết kế hệ thống đặt chỗ số lượng hữu hạn: chống oversell, hold/expiry, fairness và high contention.

Inventory must have atomic conditional decrement/unique seat lock or serialized owner; create short-lived hold with expiry and idempotent request. Payment occurs outside long DB lock; confirm via state machine, expiry worker releases with compare/version.

High contention: queue per event/seat class, partition, admission/waiting room; fairness policy explicit. Cache may show availability but cannot authorize final booking. Reconcile leaked holds and handle payment success after expiry via refund/manual policy.

## SD-057 — Large file pipeline

**Câu hỏi:** Thiết kế upload và xử lý file lớn: multipart, resumable upload, checksum, malware scan, transcoding và CDN.

Backend issues short-lived multipart/resumable upload credentials scoped to object/key/size; client uploads chunks direct, records upload session and checksum/ETag, then finalize atomically. Quarantine bucket triggers malware/type scan; safe object moves or is tagged before processing.

Jobs idempotent by asset+version, queue transcoding with progress/retry/DLQ. CDN serves signed URL from separate domain; filename/content-disposition safe. Lifecycle cleans abandoned parts, quota and decompression-bomb checks protect cost.

## SD-058 — Distributed scheduler

**Câu hỏi:** Thiết kế distributed job scheduler: schedule ownership, clock, retry, dedup, long-running job và failover.

Persist schedule and next-run; shard ownership via lease/consensus with fencing. Scheduler scans due jobs using DB time/ordered index, atomically creates unique execution `(job, scheduled_time)` into queue and advances schedule. Workers heartbeat/checkpoint long jobs; at-least-once means handler idempotent.

Handle misfire/catch-up/coalesce, timezone/DST, retry separate from next schedule, cancellation and tenant quota. Failover may enqueue duplicate but not lose due run; measure schedule lag.

## SD-059 — Telemetry ingestion

**Câu hỏi:** Thiết kế metrics/log ingestion platform: cardinality, partition, retention, downsampling, query và tenant quota.

Agents/collectors batch/compress and authenticate tenant; gateway rate-limits, validates cardinality and writes partitioned durable log. Stream processors aggregate/index; object storage is cheap source, hot TSDB/search holds recent data, downsample/compact by retention tier.

Partition by tenant/time/hash while isolating large tenants. Quotas on bytes/s, active series and query cost; backpressure/sampling policy explicit. Query frontend fans out with cache and timeouts. Data residency, PII and cost/GB are first-class.

## SD-060 — Queue/database incident

**Câu hỏi:** Sau một network flap, queue backlog tăng 50 lần, consumer retry dồn dập, database đạt 100% CPU. Hãy trình bày thứ tự giảm thiểu, chẩn đoán và thay đổi thiết kế sau incident.

Mitigate first: stop/reduce producers or shed noncritical work, pause aggressive retries, cap consumer concurrency, increase backoff/jitter, protect DB and scale only if safe; preserve critical queues. Establish incident roles and watch SLI/backlog age/DB locks, not just count.

Diagnose network errors, retry multiplication, poison/hot key, query plan/connection pool and recovery sequence. Drain gradually by capacity budget. Follow-up: end-to-end retry budget, bounded queues/backpressure, idempotency, adaptive concurrency, circuit/bulkhead, load/chaos test and alerts on backlog age/burn rate. Reconcile any duplicate/partial business effects.

## Câu hỏi kinh điển bổ sung — Basic đến Senior

## SD-061 — Latency và throughput

**Câu hỏi:** Latency và throughput khác nhau thế nào? Vì sao tăng concurrency có thể tăng throughput nhưng làm p99 latency xấu đi?

Latency là thời gian hoàn tất một operation; throughput là số operation trên đơn vị thời gian. Tăng concurrency tận dụng CPU/I/O nhàn đến điểm saturation; sau đó queue, context switch, lock, connection pool và GC làm thời gian chờ tăng mạnh, đặc biệt tail latency.

Đo distribution p50/p95/p99 cùng arrival rate, queue depth và utilization; áp dụng Little’s Law `L = λW`. Giới hạn concurrency/load shedding thường giữ throughput hữu ích tốt hơn queue vô hạn.

## SD-062 — Availability, reliability, durability

**Câu hỏi:** Availability, reliability và durability khác nhau thế nào? Cho một failure mode vi phạm từng thuộc tính.

Availability là khả năng phục vụ lúc được yêu cầu; reliability là thực hiện đúng, ổn định qua thời gian; durability là dữ liệu đã xác nhận không mất. Service có thể trả 200 mọi lúc nhưng kết quả sai—available, không reliable; service down 5 phút nhưng không mất data—durable, không available; ack write chỉ ở RAM rồi crash—không durable.

SLO/SLI phải đo riêng; replication/backup có thể tăng durability nhưng không bảo đảm correctness hoặc availability.

## SD-063 — Stateless và stateful

**Câu hỏi:** Stateless service và stateful service khác nhau ra sao? “Stateless” có nghĩa là hệ thống không có state không?

Stateless instance không cần local durable/session state giữa request, nên bất kỳ replica nào xử lý và bị thay được. Hệ thống vẫn có state trong database/cache/token/object store. Stateful service giữ identity/data gắn instance/partition, cần placement, replication và recovery.

Local cache/connection pool là state ephemeral nhưng không được là source of truth. “Đưa state ra ngoài” chuyển—not xóa—complexity và dependency.

## SD-064 — Single Point of Failure

**Câu hỏi:** Single Point of Failure là gì? Redundancy, health check và failover cần phối hợp thế nào mới thực sự loại bỏ SPOF?

SPOF là component/failure domain duy nhất mà lỗi của nó làm mất capability. Hai instance cùng node/AZ, chung DB primary/DNS/control plane chưa loại SPOF. Replica cần failure-domain độc lập, capacity đủ, data/state replicated và routing phát hiện lỗi.

Health check phải đúng symptom, failover có fencing tránh split brain và được diễn tập; automation/failover controller bản thân cũng cần HA hoặc đường thủ công đã thử.

## SD-065 — REST, gRPC, GraphQL

**Câu hỏi:** So sánh REST, gRPC và GraphQL về contract, transport, client, caching và use case phù hợp.

REST dùng resource/HTTP semantics, tooling/cache/proxy rộng; contract có OpenAPI nhưng dễ drift. gRPC dùng protobuf, codegen, HTTP/2 streaming và payload nhỏ—tốt internal low-latency—nhưng browser/debug/cache khó hơn. GraphQL cho client chọn shape và aggregate graph, giảm over/under-fetch nhưng query cost, N+1, auth/cache phức tạp.

Chọn theo consumer/network/contract, không theo thời thượng; có thể REST public, gRPC internal, GraphQL BFF. Versioning, timeout và observability vẫn cần cho cả ba.

## SD-066 — Cơ chế realtime

**Câu hỏi:** Polling, long polling, Server-Sent Events và WebSocket khác nhau thế nào? Chọn cơ chế nào cho notification hoặc realtime update?

Polling đơn giản nhưng thừa request/latency theo interval. Long polling giữ request đến có event rồi reconnect. SSE là server→client stream trên HTTP, tự reconnect/event ID, hợp browser notification. WebSocket full-duplex, hợp chat/collaboration nhưng connection state, heartbeat, backpressure và proxy scaling phức tạp.

Notification một chiều thường SSE; chat dùng WebSocket; workload thưa/không cần realtime dùng polling. Mọi cơ chế cần resume cursor, auth refresh và giới hạn connection.

## SD-067 — Pagination

**Câu hỏi:** Offset pagination và cursor/keyset pagination khác nhau về consistency, performance và khả năng nhảy trang ra sao?

Offset/limit dễ nhảy trang và tổng count nhưng DB phải scan/skip sâu; insert/delete trước offset gây duplicate/missing. Keyset dùng predicate trên stable indexed sort key `(created_at,id)`, nhanh và ổn định hơn dưới thay đổi nhưng không nhảy trang tùy ý/dễ tính total.

Cursor nên opaque/signed, chứa sort position/filter/version; order phải deterministic và xử lý next/previous. Snapshot requirement có thể cần transaction/version riêng.

## SD-068 — Push và pull

**Câu hỏi:** Push-based và pull-based data delivery đánh đổi backpressure, latency, batching và consumer autonomy thế nào?

Push có latency thấp nhưng producer phải biết endpoint/capacity, retry và dễ overwhelm consumer. Pull cho consumer chọn tốc độ, batch, offset và backpressure tự nhiên, đổi lại polling latency/coordination. Broker thường push delivery về mặt API nhưng consumer credit/prefetch tạo pull-like flow.

Chọn theo ownership và volume; dù cơ chế nào cần bounded buffer, idempotency, retry policy và lag/saturation metric.

## SD-069 — Batch và stream

**Câu hỏi:** Batch processing và stream processing khác nhau về latency, completeness, ordering, state và replay thế nào?

Batch xử lý tập hữu hạn, biết completeness, tối ưu throughput/recompute nhưng latency theo lịch. Stream xử lý event liên tục với latency thấp, phải quản event time/watermark, out-of-order, state/checkpoint và late data. Micro-batch nằm giữa.

Log bền vững cho replay; output idempotent/versioned. Không phải “stream = real time chính xác”: completeness và correction policy phải rõ. Nhiều hệ dùng stream cho freshness, batch cho reconciliation.

## SD-070 — Control plane/data plane

**Câu hỏi:** Control plane và data plane là gì? Vì sao data plane nên tiếp tục hoạt động khi control plane tạm thời unavailable?

Control plane nhận intent/config, placement và policy; data plane phục vụ traffic/data theo config đã phân phối. Nếu mọi request hỏi control plane, sự cố quản trị trở thành outage toàn hệ thống và tăng latency.

Data plane cache last-known-good config có version/signature, fail closed/open theo risk và giới hạn staleness. Control plane phục hồi/reconcile; thay đổi mới có thể dừng nhưng traffic hiện tại tiếp tục. Security revocation khẩn là trade-off cần thiết kế riêng.

## SD-071 — Rate-limit algorithms

**Câu hỏi:** Fixed window, sliding window, token bucket và leaky bucket rate limiter khác nhau thế nào?

Fixed window rẻ nhưng cho burst gấp đôi ở biên. Sliding log chính xác nhưng tốn memory; sliding counter xấp xỉ rẻ hơn. Token bucket nạp token theo thời gian, cho burst đến bucket rồi giới hạn average. Leaky bucket xả đều, làm traffic mượt nhưng thêm queue/latency hoặc drop.

Chọn theo burst contract/cost; distributed limiter cần atomic update, clock và failure policy. Trả quota headers/Retry-After và phân key theo tenant/action cost.

## SD-072 — Distributed lock và lease

**Câu hỏi:** Distributed lock và lease khác nhau thế nào? TTL, clock, pause dài và fencing token ảnh hưởng tính đúng đắn ra sao?

Lock biểu diễn độc quyền; lease chỉ hợp lệ trong thời hạn và phải renew. Client pause vì GC/network có thể tiếp tục hành động sau khi lease hết và owner mới đã vào. So sánh wall clock hoặc “SET NX TTL” một mình không bảo vệ resource.

Consensus/authoritative lock service cấp fencing token tăng dần; resource từ chối token cũ. Critical section phải ngắn/idempotent, unlock kiểm owner token. Nếu resource không enforce fencing, lock chủ yếu giảm xác suất chứ chưa chứng minh safety.

## SD-073 — Cell-based architecture

**Câu hỏi:** Cell-based architecture giảm blast radius và hỗ trợ scale ra sao? Routing, shared dependency và capacity imbalance gây khó khăn gì?

Cell là lát stack tương đối độc lập phục vụ subset tenant/key; lỗi hoặc deploy chỉ ảnh hưởng cell đó, scale bằng thêm cell. Global routing/catalog ánh tenant→cell; mỗi cell có quota, compute/data/dependency cục bộ.

Shared DB/identity/queue toàn cục có thể phá isolation. Cần rebalance tenant, spare capacity, cell health/failover và tooling nhiều fleet. Tenant “cá voi” có thể cần cell riêng; cross-cell query/report đi qua async/global layer.

## SD-074 — Thiết kế distributed rate limiter

**Câu hỏi:** Thiết kế distributed rate limiter cho nhiều API gateway: key, quota, burst, consistency, failure policy và observability.

Policy xác định key `(tenant,user,endpoint/cost)` và token bucket/sliding counter. Gateway có local fast-path/budget được cấp từ authoritative sharded store hoặc atomic script; local allocation giảm latency nhưng cho overshoot có giới hạn. Hash key, TTL idle counter và isolate hot/large tenant.

Chọn fail-open cho low-risk availability, fail-closed/local conservative cho login/payment; trả 429 + Retry-After. Version policy, clock handling, config rollout và metric allowed/rejected/store latency/overshoot/cardinality. Multi-region quota mạnh cần home region hoặc chấp nhận approximate.

## SD-075 — Thiết kế leaderboard

**Câu hỏi:** Thiết kế leaderboard có cập nhật điểm liên tục và truy vấn top-N/rank quanh một người dùng: data structure, partition, tie-break và rebuild.

Trong một shard, sorted set/order-statistic tree theo `(score,tie_breaker,user_id)` hỗ trợ update/rank/top-N khoảng O(log n). Với quy mô lớn, partition theo game/season/region; top toàn cục lấy top-K mỗi shard rồi merge, còn exact global rank có thể cần distributed count/index hoặc precomputed projection.

Source of truth lưu score event/idempotency; leaderboard là projection rebuild được. Định nghĩa score decrease, tie, season reset, anti-cheat, eventual staleness và hot celebrity query/cache. Cursor không dựa chỉ score vì tie.
