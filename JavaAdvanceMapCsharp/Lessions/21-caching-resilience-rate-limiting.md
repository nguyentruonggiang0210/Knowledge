# Bài 21 — Cache, retry, circuit breaker, bulkhead và rate limiting

## Bar senior

Ghép controls theo failure mode và budget; không biến retry/cache thành nguồn outage. [Sample](../SourceSamples/21-resilience-cache/src/main/java/course/resilience/ResilienceDemo.java) có TTL cache, token bucket và circuit-breaker tối giản để hiểu state—production nên dùng library đã battle-test.

## 1. Cache là copy có consistency cost

| Pattern | Flow | Trade-off |
|---|---|---|
| cache-aside | app read cache, miss load DB, then set | đơn giản; stale/race/invalidation |
| read-through | cache loader owns load | abstraction tốt; coupling/provider behavior |
| write-through | update cache/source synchronously | latency, dual failure |
| write-behind | cache ack rồi async persist | throughput nhưng data-loss/order/recovery phức tạp |

Local Caffeine rất nhanh nhưng mỗi instance có copy; Redis chia sẻ state nhưng thêm network/serialization/cluster failure. Cache key cần tenant/version/schema; value size/TTL/eviction/negative cache và data sensitivity rõ.

### Failure patterns

- Stampede/thundering herd: TTL cùng lúc → single-flight/request coalescing, stale-while-revalidate, TTL jitter, prewarm.
- Penetration: miss key liên tục → negative caching/Bloom filter/rate limit, nhưng tránh che data mới quá lâu.
- Hot key: một shard/network bottleneck → local cache/replicate/split key/load shed.
- Invalidation loss: stale copy → version/event/reconciliation/short TTL; “cache invalidation” là consistency design.
- Cache outage: fallback DB có thể tạo retry storm và hạ luôn DB; giới hạn fallback/admission.

Distributed lock bằng Redis lease không tự bảo đảm correctness khi pause/network/expiry; fencing token tăng monotonic epoch để protected resource từ chối stale owner. Business invariant nên ở authoritative store/atomic operation.

## 2. Timeout và deadline

Mọi remote call cần connect/acquire/response timeout phù hợp. Timeout dựa latency distribution/SLO và downstream capacity, không copy 30s. End-to-end deadline phân budget qua hops; queue time cũng tính. Sau timeout, underlying work có thể vẫn chạy—client/server phải cooperate cancel hoặc chịu orphan work.

## 3. Retry có điều kiện

Chỉ retry transient failure và idempotent/deduplicated operation. Exponential backoff + jitter + max attempts/elapsed deadline. Retry budget giới hạn tỷ lệ traffic retry; retry một layer có owner—3 attempts ở 3 tầng có thể thành 27 downstream calls.

Không retry validation/auth/not-found/permanent conflict. HTTP status riêng chưa đủ; API contract nói retry-after/idempotency/result-unknown. Sau write timeout, reconcile/query idempotency result trước blind retry.

## 4. Circuit breaker, bulkhead và load shedding

- Circuit breaker ngừng gọi dependency có tỷ lệ failure/slow cao, cho thời gian hồi phục; half-open probe. Nó không sửa latency overload và fallback cũng có thể fail.
- Bulkhead giới hạn concurrent work/resource theo dependency/tenant để failure không chiếm toàn service.
- Rate limiter kiểm soát admission theo identity/time; token bucket cho burst với average rate, leaky bucket smooth hơn.
- Concurrency limiter phản ứng trực tiếp work in-flight/latency; rate/sec không phản ánh request cost khác nhau.
- Load shedding trả 429/503 sớm tốt hơn queue vô hạn rồi timeout; priority/fairness bảo vệ critical traffic.

## 5. Composition order

Order ảnh hưởng semantics: timeout từng attempt hay toàn retry; rate-limit mỗi original request hay mỗi retry; circuit breaker đo attempt hay operation; bulkhead bao cả retry wait không. Vẽ call stack và metric label rõ. Fallback phải bounded, semantically acceptable và observable—không trả stale/empty như thành công bí mật.

### C# mapping

.NET có `HttpClientFactory`/resilience handlers; Java dùng HTTP clients + Resilience4j/Spring mechanisms. Principle giống nhau: handler order, idempotency, cancellation/deadline và telemetry; API cụ thể không map 1:1.

## 6. Metrics/runbook

- cache hit/miss/load latency/eviction/size/staleness; không tối ưu hit rate bỏ qua correctness;
- original vs retry calls, attempts, exhausted, budget, downstream status;
- circuit state/transitions/slow-call rate; bulkhead active/queued/rejected;
- rate-limit allowed/rejected theo low-cardinality dimension;
- fallback use/result freshness;
- SLO impact và saturation DB/thread/connection.

## Lab

1. Cho 100 request miss cùng key; thêm single-flight và đo load count.
2. Bật retry 3 tầng, tính amplification; chuyển về một owner + retry budget.
3. Sample token bucket dùng monotonic time; test burst/refill, clock edge và concurrent access.
4. Simulate cache down; bảo vệ DB bằng bulkhead/load shedding thay vì fallback không giới hạn.
5. Chạy circuit-breaker sample/test: hai failure mở circuit, call kế tiếp bị reject, hết cooldown chỉ một probe half-open được phép; failure probe mở lại, success đóng circuit.

TTL cache sample bắt đầu expiry **sau** successful load, dọn entry hết hạn và giữ approximate max-size. `ConcurrentHashMap.compute` cho single-flight theo key/bin nhưng loader chậm/re-entrant vẫn là trap; production dùng Caffeine/Redis client/library cùng metric/eviction policy đã kiểm chứng, không copy sample thành cache framework.

## Interview drill

- Cache-aside race và invalidation failure xử lý thế nào?
- TTL jitter/single-flight/stale-while-revalidate giải phần nào của stampede?
- Timeout/retry/circuit breaker/bulkhead khác failure nào?
- Retry ở nhiều tầng khuếch đại bao nhiêu? Khi nào POST retry được?
- Redis lock lease hết nhưng owner cũ vẫn chạy: fencing token giúp gì?
- Rate limit và concurrency limit khác nhau khi request cost biến động?

## Quiz

1. Cache hit rate 99% chứng minh cache tốt?
2. Circuit open thì fallback DB luôn nên chạy?
3. Jitter làm retry chắc chắn không đồng bộ?
4. Token bucket distributed có thể chỉ dùng clock local không xét drift/atomicity?

<details><summary>Đáp án/rubric</summary>

1. Không; xét staleness, latency, cost, eviction, memory, correctness và 1% miss amplification.
2. Không; có thể chuyển outage sang DB. Fallback cần capacity/bulkhead/semantic/SLO.
3. Không chắc chắn nhưng giảm synchronization; vẫn cần limit/budget/admission.
4. Không đơn giản; state update phải atomic/consistent theo required accuracy, time source/skew và partition behavior phải được thiết kế.
</details>
