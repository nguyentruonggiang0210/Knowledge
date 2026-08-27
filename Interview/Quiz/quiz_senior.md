# Quiz tổng hợp Senior Backend — 120 phút

## Hướng dẫn

- Thời gian: **120 phút**. Tổng điểm: **165**.
- Trả lời ngắn nhưng phải có: kết luận, cơ chế/invariant, trade-off hoặc cách kiểm chứng.
- Không cần viết code hoàn chỉnh; pseudocode, SQL hoặc sơ đồ nhỏ được phép khi làm rõ lập luận.
- Mỗi câu **3 điểm**. Không dùng tài liệu và không xem file trong `Anwsers` trước khi hết giờ.
- Nếu thiếu dữ kiện, hãy ghi giả định. Một lựa chọn công nghệ không có lý do hoặc failure mode không được tính trọn điểm.

| Phần | Số câu | Điểm | Thời gian gợi ý |
|---|---:|---:|---:|
| C# | 6 | 18 | 12 phút |
| .NET / ASP.NET Core | 6 | 18 | 12 phút |
| Java / JVM / Spring | 6 | 18 | 15 phút |
| Algorithms & Data Structures | 5 | 15 | 10 phút |
| Database | 6 | 18 | 13 phút |
| Software Architecture | 5 | 15 | 10 phút |
| Distributed Systems | 6 | 18 | 15 phút |
| Infrastructure / Cloud | 5 | 15 | 10 phút |
| DevOps / Observability | 5 | 15 | 11 phút |
| Security | 5 | 15 | 12 phút |
| **Tổng** | **55** | **165** | **120 phút** |

## A. C#

### QS-001 — [C#][Equality][Code review] — 3 điểm
Một `record` chứa `List<string>` được dùng làm key của `Dictionary`; list tiếp tục bị sửa sau khi insert. Phân tích equality/hash behavior, failure mode và thiết kế lại contract của key.

### QS-002 — [C#][Async][Code review] — 3 điểm
Đoạn `items.Select(async x => await SaveAsync(x, ct));` không materialize hoặc await kết quả. Điều gì thực sự chạy, lỗi được quan sát ở đâu, và viết lại thế nào nếu phải giới hạn concurrency?

### QS-003 — [C#][Memory][API design] — 3 điểm
Thiết kế parser nhận dữ liệu có thể đến từ buffer đồng bộ hoặc I/O bất đồng bộ. So sánh `ReadOnlySpan<T>`, `ReadOnlyMemory<T>` và `ReadOnlySequence<T>` theo lifetime, allocation và boundary `await`.

### QS-004 — [C#][Concurrency][Mechanism] — 3 điểm
Vì sao `volatile int count; count++` vẫn mất cập nhật? Chọn `Interlocked`, `lock` hoặc immutable snapshot cho ba loại invariant khác nhau.

### QS-005 — [C#][LINQ][Data access] — 3 điểm
Một repository trả `IQueryable<Order>` ra ngoài application layer; caller thêm method C# không translate được rồi enumerate hai lần. Nêu các rủi ro về boundary, execution, hiệu năng và cách định hình API tốt hơn.

### QS-006 — [C#][Resources][Correctness] — 3 điểm
Phân biệt `IDisposable`, `IAsyncDisposable`, finalizer và `SafeHandle`. Thiết kế cleanup khi acquisition dở dang hoặc `DisposeAsync` ném exception mà vẫn phải giải phóng các tài nguyên còn lại.

## B. .NET và ASP.NET Core

### QS-007 — [.NET][GC][Incident] — 3 điểm
Sau deploy, allocation rate và Gen 2 collection tăng, p99 xấu nhưng managed heap sau GC không tăng nhiều. Đưa ra giả thuyết, bằng chứng cần thu và thứ tự xử lý.

### QS-008 — [.NET][Dependency Injection][Code review] — 3 điểm
Một singleton inject trực tiếp `DbContext` và options mutable được reload từng property. Chỉ ra hai lỗi lifetime/concurrency và đề xuất dependency graph cùng snapshot semantics đúng.

### QS-009 — [ASP.NET Core][Middleware][Code review] — 3 điểm
Middleware bắt mọi exception, log cả request body rồi trả HTTP 200 `{success:false}`. Phân tích tác động tới protocol semantics, retry/monitoring, PII và cách thiết kế error pipeline.

### QS-010 — [ASP.NET Core][Streaming][Backpressure] — 3 điểm
Endpoint proxy file 8 GB đang buffer toàn bộ vào `byte[]`. Thiết kế luồng truyền, cancellation, range, giới hạn tài nguyên và hành vi khi client ngắt kết nối.

### QS-011 — [.NET][EF Core][Transaction] — 3 điểm
Một execution strategy retry transaction chứa cả `SaveChanges`, publish message và gọi payment HTTP. Phân tích duplicate/partial effect và đặt lại transaction/out-of-process boundary.

### QS-012 — [.NET][AOT][Runtime] — 3 điểm
Ứng dụng dùng reflection để discover handler và dynamic proxy. Khi chuyển sang trimming/Native AOT, lỗi nào có thể xuất hiện và nên thay đổi build/runtime contract thế nào?

## C. Java, JVM và Spring

### QS-013 — [Java][Equality][Code review] — 3 điểm
Một `Money(BigDecimal amount, Currency currency)` dùng `BigDecimal.equals`, rồi object mutable được đặt vào `HashMap`. Nêu hai lớp lỗi và định nghĩa value object an toàn.

### QS-014 — [Java][JMM][Concurrency] — 3 điểm
Giải thích vì sao double-checked locking không có `volatile` có thể publish object khởi tạo dở. Chỉ ra happens-before cần có và một cách triển khai đơn giản hơn.

### QS-015 — [Java][Virtual threads][Capacity] — 3 điểm
Chuyển sang virtual thread làm số request concurrent tăng mạnh nhưng connection pool chỉ có 100 và downstream giới hạn 500 RPS. Phân tích throughput, pinning, backpressure và giới hạn cần giữ.

### QS-016 — [Java][CompletableFuture][Code review] — 3 điểm
Các stage chạy trên cùng executor bounded, một stage gọi `join()` chờ future cũng cần executor đó. Phân tích starvation/deadlock, exception/cancellation propagation và cách compose lại.

### QS-017 — [JVM][Container][Memory] — 3 điểm
Pod có limit 1 GiB, `-Xmx768m` nhưng vẫn `OOMKilled` và không thấy Java heap OOM. Liệt kê phần bộ nhớ ngoài heap, bằng chứng cần lấy và cách đặt budget.

### QS-018 — [Spring][Transaction][Proxy] — 3 điểm
Method `placeOrder()` gọi nội bộ method `@Transactional`, sau đó gọi HTTP trong transaction và publish event trực tiếp. Phân tích proxy boundary, rollback và thiết kế consistency khi có lỗi.

## D. Algorithms và Data Structures

### QS-019 — [Algorithm][Streaming][Complexity] — 3 điểm
Tìm Top-100 theo score từ stream 500 triệu record với 256 MB RAM. Chọn cấu trúc, nêu invariant, time/space complexity và cách xử lý tie.

### QS-020 — [Algorithm][Sliding window][Correctness] — 3 điểm
Vì sao sliding window chuẩn có thể sai khi tìm đoạn ngắn nhất có tổng ít nhất S nếu có số âm? Đưa phản ví dụ hoặc invariant bị phá và hướng thuật toán phù hợp.

### QS-021 — [Data structure][Cache][Concurrency] — 3 điểm
Thiết kế LRU O(1) cho `get/put`. Nêu invariant giữa map/list và vì sao chỉ thay map bằng concurrent map chưa làm toàn bộ cache thread-safe.

### QS-022 — [Algorithm][Rate limiting][Distributed] — 3 điểm
So sánh token bucket, fixed window và sliding counter cho API cho phép burst. Khi chạy nhiều instance, atomicity, clock và fail-open/fail-closed được xử lý ở đâu?

### QS-023 — [Algorithm][DAG][Scheduling] — 3 điểm
Pipeline task có dependency, duration và nhu cầu CPU/RAM khác nhau. Nêu cách phát hiện cycle, xác định critical path và lý do tối ưu makespan với resource hữu hạn không chỉ là topological sort.

## E. Database

### QS-024 — [Database][Index][Query plan] — 3 điểm
Với index `(tenant_id, status, created_at)`, giải thích query nào seek/range/order tốt, ảnh hưởng của range column và khi nào covering index đáng giá.

### QS-025 — [Database][MVCC][Operations] — 3 điểm
Một transaction `idle in transaction` hàng giờ trong hệ thống MVCC. Phân tích bloat/undo, cleanup horizon, lock/connection và replica/log retention.

### QS-026 — [Database][Isolation][Correctness] — 3 điểm
Hai transaction snapshot cùng kiểm tra “luôn còn ít nhất một bác sĩ trực” rồi sửa hai row khác nhau. Gọi tên anomaly và đưa ra ít nhất hai cách bảo vệ invariant.

### QS-027 — [Database][Optimizer][Diagnosis] — 3 điểm
Actual rows lệch estimated rows 10.000 lần và hash join spill. Nêu chuỗi nguyên nhân có thể có, cách đọc plan và thứ tự khắc phục an toàn.

### QS-028 — [Database][Pagination][API] — 3 điểm
Offset pagination trên bảng thay đổi liên tục gây chậm, trùng và thiếu row. Thiết kế cursor keyset có total order, tie-break, backward navigation và consistency contract.

### QS-029 — [Database][Migration][Delivery] — 3 điểm
Đổi một cột nullable thành bắt buộc và thay kiểu trên bảng 2 TB trong lúc ba version ứng dụng cùng chạy. Lập các pha tương thích, backfill, validation và rollback.

## F. Software Architecture

### QS-030 — [Architecture][DDD][Invariant] — 3 điểm
Chọn aggregate boundary cho Order, Payment và Shipment. Invariant nào cần transaction cục bộ, điều gì nên eventual, và vì sao object graph lớn là dấu hiệu xấu?

### QS-031 — [Architecture][Code review][Coupling] — 3 điểm
Một service class 2.000 dòng vừa validate, query ORM, gọi HTTP, map DTO, retry và emit metric. Nêu cách tìm cohesion/coupling boundary và lộ trình refactor không “big bang”.

### QS-032 — [Architecture][Testing][Risk] — 3 điểm
Một codebase có 90% coverage nhưng hầu hết test mock mọi dependency và assert call sequence. Đánh giá rủi ro, đề xuất test portfolio và contract cần kiểm tra ở boundary.

### QS-033 — [Architecture][Modularity][Trade-off] — 3 điểm
Khi nào modular monolith tốt hơn microservices? Đưa tiêu chí tách service dựa trên ownership, deploy, scaling, consistency và operational maturity.

### QS-034 — [Architecture][ADR][Build vs buy] — 3 điểm
Viết khung ADR cho quyết định tự xây hay mua workflow engine. Các giả định, option, consequence, exit strategy và tín hiệu xem lại nào bắt buộc có?

## G. Distributed Systems

### QS-035 — [Distributed systems][CAP][Quorum] — 3 điểm
Vì sao `R + W > N` chưa tự động tạo linearizability? Phân tích version, sloppy quorum, clock, read repair và network partition.

### QS-036 — [Distributed systems][Messaging][Idempotency] — 3 điểm
Broker giao at-least-once và consumer vừa cập nhật DB vừa phát event tiếp. Thiết kế transaction boundary, dedup retention và recovery khi crash ở từng bước.

### QS-037 — [Distributed systems][Cache][Race] — 3 điểm
Cache-aside có reader miss trước update nhưng set giá trị cũ sau khi writer invalidate. Mô tả timeline và chọn cơ chế giảm stale cùng stampede cho hot key.

### QS-038 — [Distributed systems][Saga][Payment] — 3 điểm
Payment provider timeout sau khi có thể đã charge, inventory reserve thành công và client retry. Thiết kế state machine, reconciliation, compensation và trạng thái “unknown”.

### QS-039 — [Distributed systems][Ordering][Clock] — 3 điểm
Hai region tạo event có timestamp wall-clock trái thứ tự causal. Phân biệt total order, causal order và nêu cách dùng sequence/epoch hoặc logical clock theo nhu cầu.

### QS-040 — [Distributed systems][Resilience][Overload] — 3 điểm
Retry đồng loạt làm downstream đang chậm bị sập hoàn toàn. Phối hợp timeout budget, retry policy, jitter, circuit breaker, bulkhead, rate limit và load shedding.

## H. Infrastructure và Cloud

### QS-041 — [Infrastructure][Networking][Diagnosis] — 3 điểm
Request nhỏ qua HTTPS thành công nhưng upload lớn timeout chỉ ở một đường mạng. Lập giả thuyết theo DNS/TLS/proxy/MTU và kế hoạch khoanh vùng bằng bằng chứng.

### QS-042 — [Kubernetes][Health probes][Availability] — 3 điểm
Liveness probe gọi mọi dependency; database chập chờn khiến toàn bộ pod restart. Thiết kế lại startup/liveness/readiness và hành vi degrade.

### QS-043 — [Kubernetes][Resources][Runtime] — 3 điểm
Pod Java/.NET có CPU throttling, memory limit và burst traffic. Giải thích request/limit ảnh hưởng scheduling/runtime, OOMKill, autoscaling và capacity downstream.

### QS-044 — [Infrastructure as Code][Terraform][Safety] — 3 điểm
Terraform state bị lưu local, hai pipeline apply đồng thời và có resource sửa tay. Phân tích rủi ro, backend/locking, secret, drift và quy trình import/reconcile.

### QS-045 — [Cloud][Disaster recovery][Design] — 3 điểm
Hệ thống phải đạt RPO 5 phút, RTO 30 phút khi mất cả region. Phân biệt HA/backup/DR và nêu topology, restore/failover test cùng failure mode quan trọng.

## I. DevOps và Observability

### QS-046 — [CI/CD][Supply chain][Release] — 3 điểm
Thiết kế pipeline “build once, promote same artifact” có provenance, SBOM, signing và secret isolation từ PR không tin cậy tới production.

### QS-047 — [Delivery][Progressive release][Rollback] — 3 điểm
So sánh canary, blue-green và rolling update cho thay đổi có cả schema. Nêu metric gate, compatibility window và điều kiện rollback/roll-forward.

### QS-048 — [SRE][SLO][Alerting] — 3 điểm
Dịch vụ có average latency tốt nhưng user phàn nàn theo từng đợt. Chọn SLI, SLO/error budget và multi-window burn-rate alert thay vì threshold CPU đơn lẻ.

### QS-049 — [Observability][Telemetry][Cost] — 3 điểm
Phân chia vai trò log, metric, trace và profile trong điều tra p99. Xử lý correlation, sampling và cardinality khi tenant/order ID rất lớn.

### QS-050 — [Incident response][Operations][Learning] — 3 điểm
Nêu trình tự từ detect, triage, mitigate, communicate, recover đến postmortem. Phân biệt hành động giảm blast radius với điều tra root cause trong sự cố đang diễn ra.

## J. Security

### QS-051 — [Security][JWT][Identity] — 3 điểm
Một API chỉ decode JWT và kiểm tra `exp`. Liệt kê validation bắt buộc, key rotation/revocation và cách tránh algorithm/key confusion.

### QS-052 — [Security][Injection][Code review] — 3 điểm
API parameterize giá trị nhưng nối trực tiếp `ORDER BY ${userInput}`. Vì sao vẫn injection và thiết kế allowlist/query builder cùng least privilege thế nào?

### QS-053 — [Security][SSRF][Threat modeling] — 3 điểm
Service tải URL do user nhập. Phân tích redirect, DNS rebinding, alternate IP notation và metadata endpoint; đề xuất control nhiều lớp.

### QS-054 — [Security][Secrets][Supply chain] — 3 điểm
Token production xuất hiện trong CI log của một build từ fork. Nêu containment, rotation, audit phạm vi và thay đổi pipeline để ngăn tái diễn.

### QS-055 — [Security][Authorization][Multi-tenant] — 3 điểm
Một endpoint kiểm tra role nhưng không ràng buộc tenant/resource ownership. Mô tả IDOR/BOLA, cách enforce authorization nhất quán và audit mà không log PII/token quá mức.

## Phiếu tự chấm

| Phần | Điểm đạt | Điểm tối đa |
|---|---:|---:|
| A. C# |  | 18 |
| B. .NET / ASP.NET Core |  | 18 |
| C. Java / JVM / Spring |  | 18 |
| D. Algorithms & Data Structures |  | 15 |
| E. Database |  | 18 |
| F. Software Architecture |  | 15 |
| G. Distributed Systems |  | 18 |
| H. Infrastructure / Cloud |  | 15 |
| I. DevOps / Observability |  | 15 |
| J. Security |  | 15 |
| **Tổng** |  | **165** |

## Thang đánh giá

- **0–90 (<55%)**: còn lỗ hổng nền tảng; ôn theo các ID tham chiếu trong đáp án.
- **91–115 (55–69%)**: nền tảng Middle tốt nhưng lập luận Senior hoặc failure mode chưa ổn định.
- **116–140 (70–84%)**: sẵn sàng phần lớn vòng phỏng vấn Senior; cần cải thiện các miền dưới 70%.
- **141–153 (85–92%)**: Senior vững, có tư duy production và trade-off rõ.
- **154–165 (>92%)**: rất mạnh; tiếp tục luyện diễn đạt, estimation và mock interview dưới áp lực thời gian.

Điều kiện khuyến nghị: ngoài tổng điểm, không phần nào dưới **50%**; Security và Database không dưới **60%** đối với vị trí có quyền thay đổi production data.
