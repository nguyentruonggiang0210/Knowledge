# Quiz phỏng vấn kinh điển — 12 miền

- **Thời gian:** 120 phút
- **Số câu:** 72
- **Tổng điểm:** 144
- **Cấu trúc mỗi miền:** 2 câu Basic × 1 điểm, 2 câu Middle × 2 điểm, 2 câu Senior/scenario × 3 điểm.
- **Cách làm:** Trả lời ngắn nhưng phải nêu rõ kết luận, cơ chế và trade-off. Với tình huống Senior, hãy làm rõ assumption, invariant, failure mode và cách vận hành. Với câu behavioral, chỉ dùng trải nghiệm thật của bạn.

## 1. C# — 12 điểm

### QK-001 — [C#] [Basic] — 1 điểm

Vì sao `string` trong C# là immutable, phép `==` so sánh gì, và khi nối nhiều đoạn trong vòng lặp bạn chọn cách nào?

### QK-002 — [C#] [Basic] — 1 điểm

Phân biệt method overloading, overriding và hiding bằng `new`; kiểu compile-time hay runtime quyết định method nào được gọi?

### QK-003 — [C#] [Middle] — 2 điểm

Một method dùng `yield return` đọc dữ liệu theo từng phần. Code thật sự chạy khi nào, exception xuất hiện lúc nào, và tài nguyên phải được giải phóng ra sao nếu consumer dừng sớm?

### QK-004 — [C#] [Middle] — 2 điểm

Khi nào nên trả thẳng `Task` và khi nào phải dùng `async`/`await`; `try/catch`, stack trace và lifetime của `using` làm lựa chọn này khác nhau thế nào?

### QK-005 — [C#] [Senior/Scenario] — 3 điểm

Bạn bọc một API callback thành `Task<T>` bằng `TaskCompletionSource<T>`. Hãy thiết kế completion, exception, cancellation và continuation để tránh race, reentrancy hoặc deadlock.

### QK-006 — [C#] [Senior/Scenario] — 3 điểm

Thiết kế pipeline producer–consumer bằng bounded `Channel<T>` cho tải burst: chọn chính sách full, truyền backpressure, shutdown, completion và failure từ consumer như thế nào?

## 2. .NET / ASP.NET Core / EF Core — 12 điểm

### QK-007 — [.NET/ASP.NET/EF] [Basic] — 1 điểm

Phân biệt .NET SDK, runtime, shared framework, target framework và NuGet package; máy build và máy chạy tối thiểu cần gì?

### QK-008 — [.NET/ASP.NET/EF] [Basic] — 1 điểm

Trong ASP.NET Core, khi nào dùng `ControllerBase` thay `Controller`, và `[ApiController]` tự động hóa những gì cho routing, binding và validation?

### QK-009 — [.NET/ASP.NET/EF] [Middle] — 2 điểm

Bạn cần correlation, exception mapping và validation cho ASP.NET Core API. Phần nào nên đặt ở middleware, MVC action filter hay endpoint filter, và vì sao?

### QK-010 — [.NET/ASP.NET/EF] [Middle] — 2 điểm

EF Core Migrations khác `EnsureCreated` thế nào; một migration production an toàn cần được tạo, review, triển khai và phục hồi ra sao?

### QK-011 — [.NET/ASP.NET/EF] [Senior/Scenario] — 3 điểm

Thiết kế rate limiting cho API ASP.NET Core nhiều instance và nhiều tenant: partition key, fairness, burst/queue, coordination và fail-open/fail-closed được quyết định thế nào?

### QK-012 — [.NET/ASP.NET/EF] [Senior/Scenario] — 3 điểm

Một API ghi aggregate rồi phát event. Hãy dùng EF Core outbox/interceptor để giữ atomicity và thiết kế integration test deterministic cho commit, retry, background worker và duplicate delivery.

## 3. Java — 12 điểm

### QK-013 — [Java] [Basic] — 1 điểm

Interface và abstract class khác nhau về state, constructor, multiple inheritance và khả năng tiến hóa API; khi nào chọn mỗi loại?

### QK-014 — [Java] [Basic] — 1 điểm

Vì sao `String` immutable và String Pool tồn tại; `new String("abc")` khác literal ra sao, và vì sao không nên dùng `+` lặp lại trong loop lớn?

### QK-015 — [Java] [Middle] — 2 điểm

Vì sao thường ưu tiên composition hơn inheritance; hãy dùng Liskov Substitution Principle để nhận biết một quan hệ kế thừa hợp lệ.

### QK-016 — [Java] [Middle] — 2 điểm

So sánh `Runnable`, `Callable<T>` và `Future<T>` về kết quả, exception và cancellation; vì sao application code thường nên dùng executor thay vì tạo `Thread` thủ công?

### QK-017 — [Java] [Senior/Scenario] — 3 điểm

Thiết kế producer–consumer bằng bounded `BlockingQueue`: xử lý backpressure, nhiều producer/consumer, interruption và shutdown thế nào để không mất hoặc treo task?

### QK-018 — [Java] [Senior/Scenario] — 3 điểm

Một service lưu tenant context trong `ThreadLocal` trên thread pool và thỉnh thoảng trả dữ liệu sai tenant. Hãy giải thích nguyên nhân, cách khắc phục và phương án truyền context an toàn hơn.

## 4. JVM / Spring — 12 điểm

### QK-019 — [JVM/Spring] [Basic] — 1 điểm

JDK, JRE và JVM khác nhau ở vai trò nào; build server và runtime container của một ứng dụng Java cần những thành phần gì?

### QK-020 — [JVM/Spring] [Basic] — 1 điểm

`@Controller`, `@RestController` và `@ResponseBody` khác nhau thế nào; trường hợp nào trả view và trường hợp nào ghi body qua HTTP message conversion?

### QK-021 — [JVM/Spring] [Middle] — 2 điểm

Spring resolve dependency thế nào khi có nhiều bean cùng interface; `@Primary`, `@Qualifier`, tên bean và inject collection nên được dùng ra sao?

### QK-022 — [JVM/Spring] [Middle] — 2 điểm

Một method `@Transactional` gọi công việc `@Async`. Transaction context có đi theo thread mới không, và bạn thiết kế boundary thế nào để tránh partial commit hoặc query ngoài transaction?

### QK-023 — [JVM/Spring] [Senior/Scenario] — 3 điểm

Thiết kế POST idempotent trong Spring bằng `Idempotency-Key` để xử lý concurrent duplicate, payload mismatch, response replay, TTL và transaction boundary.

### QK-024 — [JVM/Spring] [Senior/Scenario] — 3 điểm

Một JPQL bulk update chạy trong service rồi test `@Transactional` vẫn xanh, nhưng production có entity stale và event sau commit bị thiếu. Hãy giải thích và thiết kế lại cả code lẫn test.

## 5. Algorithms & Data Structures — 12 điểm

### QK-025 — [Algorithms] [Basic] — 1 điểm

Phân tích Big-O cho hai vòng lặp có kích thước đầu vào độc lập, trong đó một vòng tăng tuyến tính và một vòng nhân đôi biến đếm; vì sao không mặc định viết `O(n²)`?

### QK-026 — [Algorithms] [Basic] — 1 điểm

Giải Two Sum trả về hai index khác nhau bằng hash map trong một pass; invariant và độ phức tạp là gì?

### QK-027 — [Algorithms] [Middle] — 2 điểm

Tìm độ dài longest substring không lặp ký tự bằng sliding window; khi gặp ký tự lặp, con trỏ trái phải cập nhật thế nào để vẫn tuyến tính?

### QK-028 — [Algorithms] [Middle] — 2 điểm

Dùng Floyd tortoise–hare để phát hiện cycle và tìm node bắt đầu cycle trong singly linked list; giải thích vì sao pha thứ hai đúng.

### QK-029 — [Algorithms] [Senior/Scenario] — 3 điểm

Tìm minimum window substring chứa đủ multiplicity của pattern; nêu invariant của cửa sổ, cách co/mở và xử lý edge case.

### QK-030 — [Algorithms] [Senior/Scenario] — 3 điểm

Tìm median của hai sorted array trong `O(log(min(m,n)))`; mô tả partition invariant, biên rỗng và công thức cho tổng độ dài chẵn/lẻ.

## 6. Database — 12 điểm

### QK-031 — [Database] [Basic] — 1 điểm

Viết truy vấn tìm các email xuất hiện nhiều hơn một lần và trả cả số lần xuất hiện; `NULL` và chuẩn hóa hoa thường cần được quyết định thế nào?

### QK-032 — [Database] [Basic] — 1 điểm

PRIMARY KEY, UNIQUE và FOREIGN KEY bảo vệ những invariant khác nhau nào; constraint nào không tự bảo đảm business rule phức tạp?

### QK-033 — [Database] [Middle] — 2 điểm

Lấy top 3 mức lương của từng phòng ban bằng window function; chọn `ROW_NUMBER`, `RANK` hay `DENSE_RANK` thế nào khi có tie?

### QK-034 — [Database] [Middle] — 2 điểm

Thiết kế composite index cho query có equality, range và sort; thứ tự cột, covering và keyset pagination ảnh hưởng plan ra sao?

### QK-035 — [Database] [Senior/Scenario] — 3 điểm

Sau một đợt dữ liệu skew, query đang nhanh bỗng chọn plan tệ do cardinality estimate sai. Bạn xác nhận nguyên nhân, giảm thiểu và ngăn plan regression thế nào?

### QK-036 — [Database] [Senior/Scenario] — 3 điểm

Database failover đúng lúc client gửi COMMIT nên kết quả transaction là unknown. Thiết kế retry, idempotency key, reconciliation và thông báo trạng thái cho client ra sao?

## 7. Software Engineering — 12 điểm

### QK-037 — [Software Engineering] [Basic] — 1 điểm

Abstraction và encapsulation khác nhau thế nào; hãy nêu một ví dụ API che giấu state tốt nhưng vẫn cung cấp abstraction kém.

### QK-038 — [Software Engineering] [Basic] — 1 điểm

Unit test, integration test và end-to-end test khác nhau về boundary, tốc độ, độ ổn định và loại lỗi phát hiện được thế nào?

### QK-039 — [Software Engineering] [Middle] — 2 điểm

Validation nên được phân bổ giữa client, API boundary, application/domain và database thế nào; format validation khác business invariant ở đâu?

### QK-040 — [Software Engineering] [Middle] — 2 điểm

Giải thích chu trình Red–Green–Refactor của TDD; khi nào test-first giúp thiết kế và khi nào tạo coupling hoặc chi phí không đáng có?

### QK-041 — [Software Engineering] [Senior/Scenario] — 3 điểm

Bạn phải đổi schema event đang có nhiều producer và consumer độc lập. Hãy phân biệt backward/forward compatibility và lập thứ tự rollout không làm gián đoạn hệ thống.

### QK-042 — [Software Engineering] [Senior/Scenario] — 3 điểm

Một kiến trúc modular đang suy thoái dần theo thời gian. Hãy áp dụng Evolutionary Architecture và fitness functions để phát hiện, chặn và chủ động tiến hóa nó.

## 8. System Design — 12 điểm

### QK-043 — [System Design] [Basic] — 1 điểm

Latency và throughput khác nhau thế nào; vì sao tăng concurrency có thể tăng throughput nhưng đồng thời làm p99 latency xấu đi?

### QK-044 — [System Design] [Basic] — 1 điểm

Availability, reliability và durability khác nhau thế nào; cho một failure mode vi phạm từng thuộc tính.

### QK-045 — [System Design] [Middle] — 2 điểm

Một pipeline analytics cần kết quả gần realtime nhưng vẫn phải backfill và tính lại chính xác. Batch và stream processing nên phối hợp thế nào về ordering, state và replay?

### QK-046 — [System Design] [Middle] — 2 điểm

Distributed lock khác lease thế nào; vì sao TTL không đủ bảo đảm mutual exclusion khi process pause lâu, và fencing token giải quyết điều gì?

### QK-047 — [System Design] [Senior/Scenario] — 3 điểm

Thiết kế distributed rate limiter cho nhiều API gateway: key/quota, burst algorithm, consistency, failure policy và observability.

### QK-048 — [System Design] [Senior/Scenario] — 3 điểm

Thiết kế leaderboard cập nhật điểm liên tục, hỗ trợ top-N và rank quanh một người dùng; xử lý partition, tie-break, rebuild và hot key ra sao?

## 9. Infrastructure & Cloud — 12 điểm

### QK-049 — [Infra/Cloud] [Basic] — 1 điểm

TCP và UDP khác nhau về connection, reliability, ordering, flow/congestion control; chọn giao thức nào cho ba use case tiêu biểu?

### QK-050 — [Infra/Cloud] [Basic] — 1 điểm

Một hostname truy cập không được: `ping`, `traceroute`, `nslookup`/`dig`, `curl` và `netstat`/`ss` giúp khoanh vùng những lớp lỗi nào?

### QK-051 — [Infra/Cloud] [Middle] — 2 điểm

Linux load average đo gì; vì sao load cao có thể xảy ra khi CPU chưa 100%, và bạn đọc thêm metric nào trước khi kết luận?

### QK-052 — [Infra/Cloud] [Middle] — 2 điểm

Trong Dockerfile, `CMD` và `ENTRYPOINT` phối hợp thế nào; exec form khác shell form ra sao về argument, PID 1 và signal khi shutdown?

### QK-053 — [Infra/Cloud] [Senior/Scenario] — 3 điểm

Từ lúc gửi một Kubernetes Deployment đến khi Pod nhận traffic, hãy lần theo API Server, etcd, controller, scheduler, kubelet, CNI và Service routing; nêu điểm quan sát khi Pod không Ready.

### QK-054 — [Infra/Cloud] [Senior/Scenario] — 3 điểm

Lập kế hoạch nâng cấp node Kubernetes không downtime: kiểm tra compatibility, surge capacity, cordon/drain, PDB, stateful workload và rollback.

## 10. DevOps & Observability — 12 điểm

### QK-055 — [DevOps/Observability] [Basic] — 1 điểm

`git merge` và `git rebase` khác nhau về lịch sử và conflict; vì sao không nên rebase tùy tiện một branch đã chia sẻ?

### QK-056 — [DevOps/Observability] [Basic] — 1 điểm

Monitoring và observability khác nhau thế nào; vì sao nhiều dashboard vẫn chưa bảo đảm có thể chẩn đoán một failure chưa biết trước?

### QK-057 — [DevOps/Observability] [Middle] — 2 điểm

CI build chỉ fail trên runner nhưng chạy được ở máy developer. Hãy lập thứ tự kiểm tra dependency, environment, timing, cache và resource để tìm nguyên nhân có thể tái hiện.

### QK-058 — [DevOps/Observability] [Middle] — 2 điểm

Alert fatigue hình thành như thế nào; quy trình nào giảm noise mà không che mất incident thật và dùng metric gì để biết alert đã tốt hơn?

### QK-059 — [DevOps/Observability] [Senior/Scenario] — 3 điểm

CI/CD control plane unavailable trong lúc cần hotfix production. Thiết kế quy trình break-glass về quyền, artifact, kiểm chứng, audit và thu hồi sau sự cố.

### QK-060 — [DevOps/Observability] [Senior/Scenario] — 3 điểm

Sau một release, bạn nghi pipeline đã bị compromise. Hãy nêu thứ tự containment, xác minh provenance, rotate identity, đánh giá blast radius và rebuild trust chain.

## 11. Security — 12 điểm

### QK-061 — [Security] [Basic] — 1 điểm

Input validation, canonicalization, sanitization và output encoding khác nhau thế nào; mỗi kỹ thuật thuộc trust boundary hoặc sink nào?

### QK-062 — [Security] [Basic] — 1 điểm

Các thuộc tính cookie `Secure`, `HttpOnly`, `SameSite`, `Domain`, `Path` và `Max-Age` kiểm soát điều gì, và thuộc tính nào không thể thay thế CSRF defense hoàn chỉnh?

### QK-063 — [Security] [Middle] — 2 điểm

Session fixation là gì; vì sao phải rotate session ID sau login hoặc privilege change, và còn phải xử lý session cũ thế nào?

### QK-064 — [Security] [Middle] — 2 điểm

BOLA/IDOR khác Broken Function Level Authorization thế nào; hãy phác thảo authorization matrix test theo subject, object, action và tenant.

### QK-065 — [Security] [Senior/Scenario] — 3 điểm

Một service quyền cao nhận yêu cầu thay mặt người dùng rồi truy cập service khác. Threat-model Confused Deputy và thiết kế audience, capability cùng authorization context để ngăn lạm quyền.

### QK-066 — [Security] [Senior/Scenario] — 3 điểm

Một workflow hoàn tiền có các endpoint hợp lệ riêng lẻ nhưng có thể bị gọi sai thứ tự, lặp hoặc bỏ bước. Bạn bảo vệ business logic và kiểm thử abuse case như thế nào?

## 12. Behavioral & Leadership — 12 điểm

### QK-067 — [Behavioral/Leadership] [Basic] — 1 điểm

Hãy giới thiệu hành trình nghề nghiệp của bạn trong khoảng hai phút và nối các trải nghiệm quan trọng với vai trò đang ứng tuyển.

### QK-068 — [Behavioral/Leadership] [Basic] — 1 điểm

Hãy kể một thất bại hoặc sai lầm đáng kể: phần trách nhiệm của bạn, cách khắc phục và thay đổi hành vi sau đó.

### QK-069 — [Behavioral/Leadership] [Middle] — 2 điểm

Hãy kể một lần bạn sở hữu kết quả end-to-end vượt ngoài việc viết code: success metric, rủi ro, phối hợp và trách nhiệm vận hành của bạn là gì?

### QK-070 — [Behavioral/Leadership] [Middle] — 2 điểm

Hãy kể một production incident nghiêm trọng bạn tham gia: bạn giảm impact, phối hợp điều tra và biến bài học thành thay đổi bền vững thế nào?

### QK-071 — [Behavioral/Leadership] [Senior/Scenario] — 3 điểm

Hãy dùng một trải nghiệm thật để trình bày cách bạn xây hoặc thay đổi technical strategy phục vụ mục tiêu kinh doanh dài hạn, gồm assumptions, bets, guardrails và kết quả.

### QK-072 — [Behavioral/Leadership] [Senior/Scenario] — 3 điểm

Hãy dùng một trải nghiệm thật về thay đổi tổ chức hoặc kỹ thuật quy mô lớn: bạn quản resistance, communication, migration, adoption metric và điều chỉnh roadmap ra sao?
