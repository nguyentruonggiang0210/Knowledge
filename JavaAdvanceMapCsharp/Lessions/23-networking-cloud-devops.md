# Bài 23 — OS/networking, HTTP/gRPC, containers, Kubernetes và CI/CD

## Bar senior

Theo một request từ DNS/TCP/TLS/LB đến JVM/container, định vị timeout/resource limit; deploy backward-compatible có probe/drain/rollback. [Sample HTTP](../SourceSamples/23-networking-cloud/src/main/java/course/networking/NetworkingDemo.java), [Dockerfile](../SourceSamples/23-networking-cloud/Dockerfile), [Kubernetes manifest](../SourceSamples/23-networking-cloud/k8s/deployment.yaml).

## 1. OS fundamentals cho backend

- Process có virtual address space/resources; thread chia sẻ heap/file descriptors nhưng có stack/scheduling state.
- Context switch, run queue, CPU quota/throttling và blocking khác nhau; “CPU 50%” cần hiểu core/quota.
- Virtual memory/page fault/RSS khác Java heap. Memory gồm heap, metaspace, code cache, direct buffer, native library, thread stack, page cache.
- File/socket đều tiêu file descriptor; leak/limit gây lỗi dù heap còn.
- Disk/page cache/fsync quyết định durability/latency; write response trước durable commit cần contract rõ.
- Signal/PID 1: container app phải nhận SIGTERM và shutdown/drain; đừng chỉ kill.

## 2. Network request mental model

DNS lookup/cache → route/LB/proxy → TCP connect → TLS handshake/cert validation → HTTP connection/request/response. Timeout phải tách DNS/connect/pool-acquire/TLS/write/first-byte/read/total deadline. Connection pool reuse giảm handshake nhưng stale connection/DNS rotation/limit cần quản lý.

TCP cung cấp ordered byte stream, không message boundary; head-of-line/flow/congestion control ảnh hưởng latency. HTTP/1.1 connection behavior khác HTTP/2 multiplexing; HTTP/3 chạy QUIC/UDP. Không kết luận protocol nhanh hơn nếu proxy/server/client không support đúng.

### HTTP semantics

- Safe/idempotent/cacheable là semantics, không chỉ verb label.
- Proxy/CDN có cache key/Vary/authorization rules; stale/error behavior phải thiết kế.
- LB L4/L7, reverse proxy, gateway/service mesh giải concern khác; mỗi hop thêm failure/latency/config.
- `X-Forwarded-*`/Forwarded chỉ tin từ trusted proxy; tránh spoof scheme/client IP.
- Request/body/header/decompression limit chống resource exhaustion.

### REST, gRPC, GraphQL

| Style | Hợp khi | Trade-off |
|---|---|---|
| REST/JSON | public/general interoperability | schema discipline, over/under-fetch |
| gRPC/Protobuf | internal typed low-latency/streaming | browser/proxy/debug/schema evolution |
| GraphQL | client-driven graph/query | resolver N+1, cost/auth/cache complexity |

Protocol choice không thay domain boundaries. gRPC deadline/status/retry và HTTP idempotency vẫn phải explicit; schema compatibility test bắt buộc.

## 3. Containerizing JVM

- Multi-stage/layered build; pinned minimal trusted base; chạy non-root; không bake secret.
- JVM hiện đại nhận cgroup, nhưng `-Xmx` vẫn phải chừa headroom cho metaspace/direct/thread/code/native và sidecar. OOMKilled không nhất thiết có Java heap OOM dump.
- CPU limit có thể throttle và thay JIT/GC/thread-pool behavior; test dưới quota thật.
- Read-only filesystem/tmp/CA/timezone/native dependency phải explicit.
- Image là immutable artifact promote qua environment; config external; provenance/SBOM/signing/scanning theo policy.

## 4. Kubernetes production semantics

- Deployment/ReplicaSet cho stateless; StatefulSet không biến app thành distributed database đúng.
- Requests ảnh hưởng scheduling; limits ảnh hưởng throttling/OOM. HPA metric/lag/cooldown và downstream capacity cần xét.
- Startup probe cho slow start; liveness hỏi restart có chữa được; readiness điều khiển nhận traffic. Official Kubernetes cảnh báo liveness sai có thể tạo cascading failure: [probe documentation](https://kubernetes.io/docs/concepts/workloads/pods/probes/).
- Termination: endpoint removed/mark unready → preStop nếu cần → SIGTERM → app stop admission/drain → grace deadline → SIGKILL.
- Rolling update cần `maxUnavailable/maxSurge`, readiness, PDB và capacity headroom. PDB không bảo vệ mọi voluntary/involuntary outage.
- ConfigMap không dành secret; Kubernetes Secret chỉ encoding/storage mechanism, cần encryption/RBAC/external secret/rotation.
- NetworkPolicy/service account/least privilege; management endpoint không public.

## 5. Zero-downtime deploy và database

Code version N/N+1 có thể chạy đồng thời. API/event/schema phải backward compatible; DB migration dùng expand/contract. Canary/blue-green/progressive rollout dựa SLI và automated abort, không chỉ “pod ready”. Rollback binary không luôn rollback data/schema/event side effect; forward-fix/reconciliation plan.

Migration nên job/controlled step, không để mọi replica tranh DDL. Consumer schema/version và long-retained events làm rollback khó hơn HTTP.

## 6. CI/CD quality gates

```text
source → compile/unit/static checks → artifact/SBOM
       → integration/contract/security scan → image provenance
       → staging/smoke/load as risk requires → progressive deploy
       → SLI verification → promote or rollback/abort
```

Reproducible/pinned build, least-privilege CI credential, branch/review policy và artifact immutability chống supply-chain failure. Flaky test không được retry vô hạn che defect; quarantine có owner/deadline.

Infrastructure as code có plan/review/policy/drift detection. Không chạy production change chỉ từ laptop không audit.

## 7. Capacity/failure questions

- Max instances × DB pool có vượt DB connection budget?
- HPA scale-out có làm hot shard/downstream tệ hơn?
- DNS/LB retry + app retry có duplicate/amplification?
- Pod restart mất in-memory queue/cache/session gì?
- Region outage: DNS TTL, data replication lag, secret/key, message backlog, RPO/RTO?

## C#/.NET refresh và mapping

- Kestrel/ASP.NET middleware gần servlet container/filter chain nhưng connection/request lifecycle khác; cả hai cần graceful drain, bounded body/header/timeouts và forwarded-header trust.
- `.NET HttpClientFactory` quản lý handler pool/DNS/lifecycle; Java `HttpClient`/framework client có pool/timeout semantics riêng. Không tạo client mỗi request và không giả định cancellation chắc chắn dừng remote work.
- `CancellationToken` gần propagated deadline/cancellation intent; Java interrupt/future timeout không map 1:1. DNS/TCP/TLS/HTTP/Kubernetes behavior vẫn giống ở tầng hệ thống.
- Container image, cgroup CPU/memory, probe, rollout/rollback và schema compatibility là kiến thức chung; JVM và CLR khác runtime ergonomics/diagnostic tools.

## Lab

1. Chạy HTTP sample, đặt connect/overall deadline và payload limit; log trace ID không PII.
2. Build image; kiểm tra user/layers/size, chạy với memory/CPU limit và SIGTERM.
3. Review manifest: probes khác nhau, request/limit, grace period, rolling strategy, security context.
4. Viết expand/contract deploy sequence có N và N+1 cùng chạy; mô tả rollback data.

JDK `HttpServer` trong sample là teaching server, không chứng minh production limits/TLS/header hardening. Liveness chỉ phản ánh process/event loop còn sống; readiness đổi sang `503 draining` trước shutdown và là nơi xét khả năng nhận traffic. Startup probe dùng live path để không trộn dependency readiness với boot progress; framework/mesh thực tế cần verify drain propagation bằng load test.

## Interview drill

- Connect/read/total deadline khác gì? TCP stream có message boundary không?
- RSS gồm gì ngoài heap? Vì sao pod OOMKilled không có `OutOfMemoryError`?
- Liveness phụ thuộc DB gây restart cascade thế nào?
- HPA tăng pod nhưng throughput không tăng: bottleneck possibilities?
- REST vs gRPC; HTTP idempotency/cache/ETag dùng ra sao?
- Rolling deploy + incompatible DB migration thất bại theo timeline nào?

## Quiz

1. Container có memory limit 1 GiB thì đặt `-Xmx1g` an toàn?
2. Readiness fail có restart container?
3. Kubernetes Secret mặc định đồng nghĩa secret manager hoàn chỉnh?
4. Rollback image luôn hoàn tác release?

<details><summary>Đáp án/rubric</summary>

1. Không; cần native/metaspace/direct/thread/code/headroom và sidecar/container overhead.
2. Không; nó loại endpoint khỏi traffic. Liveness/startup failure mới có restart behavior tương ứng.
3. Không; cần at-rest encryption, RBAC, delivery/rotation/audit và thường external manager.
4. Không; schema/data/event/external side effect có thể đã đổi. Thiết kế compatibility/reconciliation/forward fix.
</details>
