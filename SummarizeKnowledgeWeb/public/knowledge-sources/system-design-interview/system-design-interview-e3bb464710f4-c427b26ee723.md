# System Design và Distributed Systems

Các câu hỏi này kiểm tra khả năng đi từ requirement đến kiến trúc vận hành được. Với câu thiết kế, hãy định lượng workload và nêu rõ consistency, SLO, failure mode, security, cost trước khi chọn công nghệ.

## 1. Khung tư duy và nền tảng phân tán

### SD-001 [Middle → Senior]
Khi bắt đầu một bài system design, bạn cần làm rõ functional requirement và non-functional requirement nào?

### SD-002 [Senior]
Từ DAU, request/user/day, read-write ratio và kích thước payload, hãy ước lượng peak QPS, storage và bandwidth. Vì sao cần ghi rõ hệ số peak?

### SD-003 [Senior]
Phân biệt SLA, SLO và SLI. Một availability target 99.99% tạo error budget bao nhiêu và ảnh hưởng thiết kế thế nào?

### SD-004 [Middle]
Scale up và scale out khác nhau ra sao? State trong application làm scale out khó như thế nào?

### SD-005 [Middle → Senior]
Load balancer layer 4 và layer 7 khác nhau thế nào? Các thuật toán round-robin, least-connections và consistent hashing phù hợp khi nào?

### SD-006 [Senior]
CAP theorem thực sự nói gì trong lúc network partition? PACELC bổ sung quyết định latency/consistency khi không partition ra sao?

### SD-007 [Senior]
Strong, eventual, causal và read-your-writes consistency khác nhau ra sao? Hãy gắn mỗi mô hình với một use case.

### SD-008 [Senior]
Linearizability khác serializability thế nào? Một hệ thống có thể có tính chất này mà không có tính chất kia không?

### SD-009 [Senior]
Vì sao đồng hồ hệ thống không đủ để sắp thứ tự tuyệt đối các event phân tán? Lamport clock và vector clock giải quyết phần nào?

### SD-010 [Senior]
Consensus giải quyết bài toán nào? Giải thích vai trò leader, quorum và term/epoch trong Raft ở mức khái niệm.

## 2. Data distribution, cache và định danh

### SD-011 [Middle → Senior]
Replication đồng bộ và bất đồng bộ đánh đổi latency, durability và availability thế nào? Replica lag gây anomaly gì?

### SD-012 [Senior]
Leader–follower, multi-leader và leaderless replication phù hợp với workload nào? Conflict được phát hiện và giải quyết ra sao?

### SD-013 [Senior]
Quorum read/write với N, R, W hoạt động thế nào? Vì sao `R + W > N` chưa tự động bảo đảm linearizability?

### SD-014 [Middle → Senior]
Range sharding, hash sharding và directory-based sharding khác nhau thế nào? Rebalancing ảnh hưởng production ra sao?

### SD-015 [Senior]
Consistent hashing và virtual nodes giảm data movement/hotspot như thế nào? Nó không giải quyết loại skew nào?

### SD-016 [Senior]
Thiết kế ID phân tán bằng database sequence, UUIDv4/v7, Snowflake hoặc hi/lo có trade-off gì về ordering, index và collision?

### SD-017 [Middle]
Cache-aside, read-through, write-through và write-behind khác nhau thế nào?

### SD-018 [Senior]
Cache invalidation, stale data và cache stampede được xử lý bằng TTL jitter, single-flight, stale-while-revalidate hoặc versioning ra sao?

### SD-019 [Senior]
Hot key/hot partition được phát hiện và giảm tải thế nào mà không phá consistency requirement?

### SD-020 [Middle → Senior]
Bloom filter hoạt động ra sao, có false positive/false negative thế nào, và hữu ích ở đâu trong storage/cache?

## 3. Giao tiếp, message và reliability

### SD-021 [Middle]
Khi nào dùng synchronous request/response, khi nào dùng asynchronous messaging? Chi phí về coupling và observability là gì?

### SD-022 [Middle → Senior]
At-most-once, at-least-once và effectively-once delivery khác nhau thế nào? Vì sao “exactly once” end-to-end rất khó?

### SD-023 [Senior]
Thiết kế idempotent message consumer gồm dedup store, transaction boundary và retention như thế nào?

### SD-024 [Senior]
Message ordering được bảo đảm ở phạm vi nào? Partition key và consumer concurrency tác động ra sao?

### SD-025 [Middle → Senior]
Queue và log/stream khác nhau về consumption, replay, retention và fan-out thế nào?

### SD-026 [Senior]
Transactional Outbox giải quyết dual-write ra sao? Relay polling và CDC có failure mode nào?

### SD-027 [Senior]
Saga choreography và orchestration khác nhau thế nào? Thiết kế compensating action cần lưu ý điều gì?

### SD-028 [Senior]
Khi nào two-phase commit hợp lý, và vì sao thường tránh nó giữa microservices?

### SD-029 [Middle → Senior]
Timeout, retry, exponential backoff và jitter phải được phối hợp ra sao để tránh retry storm?

### SD-030 [Senior]
Circuit breaker, bulkhead, rate limiter và load shedding bảo vệ hệ thống ở các failure mode khác nhau thế nào?

### SD-031 [Senior]
Backpressure nên được truyền qua HTTP, stream và worker queue như thế nào? Khi nào nên drop, buffer hay reject?

### SD-032 [Middle → Senior]
Dead-letter queue dùng đúng cách ra sao? Vì sao DLQ không nên trở thành nơi chôn message vô thời hạn?

### SD-033 [Senior]
Webhook delivery service cần chữ ký, retry, ordering, idempotency và tenant isolation thế nào?

## 4. Kiến trúc dịch vụ và dữ liệu

### SD-034 [Middle]
API Gateway/BFF mang lại lợi ích và rủi ro gì? Logic nào không nên đặt trong gateway?

### SD-035 [Senior]
Service discovery client-side và server-side khác nhau thế nào? DNS caching và stale endpoint gây lỗi gì?

### SD-036 [Senior]
Database-per-service bảo vệ autonomy thế nào, và làm query/join/reporting xuyên service ra sao?

### SD-037 [Senior]
Event sourcing đem lại audit/rebuild nhưng tạo những chi phí gì về schema evolution, projection và debugging?

### SD-038 [Senior]
CQRS read model được rebuild và chuyển version không downtime như thế nào?

### SD-039 [Middle → Senior]
Search engine/inverted index khác database index thế nào? Đồng bộ source of truth với search index ra sao?

### SD-040 [Senior]
Multi-tenancy dùng shared schema, schema-per-tenant hay database-per-tenant có trade-off nào về isolation, cost và vận hành?

### SD-041 [Senior]
Audit log chống sửa đổi nên lưu actor, intent, before/after và correlation thế nào? Làm sao cân bằng với quyền xóa dữ liệu cá nhân?

### SD-042 [Senior]
Một zero-downtime data migration qua nhiều service cần compatibility window, backfill, validation và rollback thế nào?

## 5. Multi-region, khả năng phục hồi và vận hành

### SD-043 [Senior]
Active-passive và active-active multi-region khác nhau về RTO, RPO, routing và conflict thế nào?

### SD-044 [Senior]
Disaster Recovery: phân biệt backup, high availability và disaster recovery; cách chứng minh RPO/RTO đạt yêu cầu?

### SD-045 [Senior]
Split-brain xảy ra thế nào? Fencing token giúp ngăn stale leader ghi dữ liệu ra sao?

### SD-046 [Senior]
Health check liveness, readiness và startup nên phản ánh gì? Vì sao check mọi dependency trong liveness có thể gây cascade?

### SD-047 [Senior]
Graceful degradation được thiết kế theo critical user journey và dependency budget như thế nào?

### SD-048 [Senior]
Chaos experiment an toàn cần hypothesis, blast radius, abort condition và steady-state metric gì?

### SD-049 [Senior]
Bạn tối ưu cost cho hệ thống có tải theo mùa mà không hy sinh SLO bằng những đòn bẩy nào?

### SD-050 [Senior]
Data residency và compliance ảnh hưởng placement, replication, observability và support access ra sao?

## 6. Bài thiết kế thực tế

### SD-051 [Middle → Senior · Design]
Thiết kế URL shortener: API, ID/alias, data model, redirect latency, cache, abuse prevention và analytics.

### SD-052 [Senior · Design]
Thiết kế news feed cho hàng chục triệu người dùng. So sánh fan-out-on-write, fan-out-on-read và cách xử lý celebrity.

### SD-053 [Senior · Design]
Thiết kế chat 1-1 và group chat: connection, presence, ordering, offline delivery, history và multi-device sync.

### SD-054 [Senior · Design]
Thiết kế hệ thống notification đa kênh: preference, template, scheduling, dedup, provider failover và rate limit.

### SD-055 [Senior · Design]
Thiết kế payment workflow: idempotency, ledger, provider timeout, reconciliation, refund và audit.

### SD-056 [Senior · Design]
Thiết kế hệ thống đặt chỗ số lượng hữu hạn: chống oversell, hold/expiry, fairness và high contention.

### SD-057 [Senior · Design]
Thiết kế upload và xử lý file lớn: multipart, resumable upload, checksum, malware scan, transcoding và CDN.

### SD-058 [Senior · Design]
Thiết kế distributed job scheduler: schedule ownership, clock, retry, dedup, long-running job và failover.

### SD-059 [Senior · Design]
Thiết kế metrics/log ingestion platform: cardinality, partition, retention, downsampling, query và tenant quota.

### SD-060 [Senior · Incident]
Sau một network flap, queue backlog tăng 50 lần, consumer retry dồn dập, database đạt 100% CPU. Hãy trình bày thứ tự giảm thiểu, chẩn đoán và thay đổi thiết kế sau incident.

## 7. Câu hỏi kinh điển bổ sung — Basic đến Senior

### SD-061 [Basic · ⭐ Rất thường gặp]
Latency và throughput khác nhau thế nào? Vì sao tăng concurrency có thể tăng throughput nhưng làm p99 latency xấu đi?

### SD-062 [Basic · ⭐ Rất thường gặp]
Availability, reliability và durability khác nhau thế nào? Cho một failure mode vi phạm từng thuộc tính.

### SD-063 [Basic · ⭐ Rất thường gặp]
Stateless service và stateful service khác nhau ra sao? “Stateless” có nghĩa là hệ thống không có state không?

### SD-064 [Basic · ⭐ Rất thường gặp]
Single Point of Failure là gì? Redundancy, health check và failover cần phối hợp thế nào mới thực sự loại bỏ SPOF?

### SD-065 [Basic · ⭐ Rất thường gặp]
So sánh REST, gRPC và GraphQL về contract, transport, client, caching và use case phù hợp.

### SD-066 [Basic · ⭐ Rất thường gặp]
Polling, long polling, Server-Sent Events và WebSocket khác nhau thế nào? Chọn cơ chế nào cho notification hoặc realtime update?

### SD-067 [Basic · ⭐ Rất thường gặp]
Offset pagination và cursor/keyset pagination khác nhau về consistency, performance và khả năng nhảy trang ra sao?

### SD-068 [Middle · Thường gặp]
Push-based và pull-based data delivery đánh đổi backpressure, latency, batching và consumer autonomy thế nào?

### SD-069 [Middle · ⭐ Rất thường gặp]
Batch processing và stream processing khác nhau về latency, completeness, ordering, state và replay thế nào?

### SD-070 [Middle · Thường gặp]
Control plane và data plane là gì? Vì sao data plane nên tiếp tục hoạt động khi control plane tạm thời unavailable?

### SD-071 [Middle · ⭐ Rất thường gặp]
Fixed window, sliding window, token bucket và leaky bucket rate limiter khác nhau thế nào?

### SD-072 [Middle · ⭐ Rất thường gặp]
Distributed lock và lease khác nhau thế nào? TTL, clock, pause dài và fencing token ảnh hưởng tính đúng đắn ra sao?

### SD-073 [Senior · Thường gặp]
Cell-based architecture giảm blast radius và hỗ trợ scale ra sao? Routing, shared dependency và capacity imbalance gây khó khăn gì?

### SD-074 [Senior · ⭐ Rất thường gặp · Design]
Thiết kế distributed rate limiter cho nhiều API gateway: key, quota, burst, consistency, failure policy và observability.

### SD-075 [Senior · Thường gặp · Design]
Thiết kế leaderboard có cập nhật điểm liên tục và truy vấn top-N/rank quanh một người dùng: data structure, partition, tie-break và rebuild.
