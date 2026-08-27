# Ngân hàng câu hỏi phỏng vấn .NET & ASP.NET Core — Middle & Senior

> Chỉ gồm câu hỏi. Mỗi câu có mã ổn định để đối chiếu với `Anwsers/dotnet_aspnet.md`.

## 1. CLR, JIT và Garbage Collector

1. **NET-001 [Middle]** Từ mã C# đến lúc chạy, compiler, IL, CLR và JIT phối hợp với nhau như thế nào?
2. **NET-002 [Senior]** Tiered compilation, ReadyToRun, dynamic PGO và Native AOT khác nhau về startup, throughput, kích thước và tính tương thích ra sao?
3. **NET-003 [Middle]** GC theo thế hệ hoạt động thế nào; Gen 0/1/2, LOH và promotion phản ánh giả định gì về lifetime object?
4. **NET-004 [Senior]** Workstation GC, Server GC, background GC và latency mode nên được lựa chọn/điều chỉnh theo workload nào?
5. **NET-005 [Senior]** GC roots, finalization queue, resurrection và `GC.SuppressFinalize` liên quan với nhau như thế nào?
6. **NET-006 [Senior]** LOH fragmentation, pinning và Pinned Object Heap ảnh hưởng thế nào đến pause time và memory footprint?
7. **NET-007 [Middle]** Thread pool của .NET quản lý worker thread và I/O completion ra sao; dấu hiệu thread-pool starvation là gì?
8. **NET-008 [Senior — Tình huống]** Một service có allocation rate rất cao, Gen 2 collection liên tục và latency p99 tăng; bạn sẽ thu thập bằng chứng và xử lý theo thứ tự nào?
9. **NET-009 [Senior]** `GC.GetTotalMemory`, process working set, managed heap size và allocation rate đo các khía cạnh khác nhau nào của bộ nhớ?

## 2. Assembly, loading, versioning và runtime metadata

10. **NET-010 [Middle]** Assembly, module, namespace và package NuGet khác nhau thế nào; strong name thực sự bảo đảm điều gì?
11. **NET-011 [Senior]** `AssemblyLoadContext` hoạt động ra sao; làm thế nào xây plugin có dependency cô lập và có thể unload?
12. **NET-012 [Senior]** Vì sao type có cùng full name nhưng được load bởi hai context có thể không cast được cho nhau; shared contract nên bố trí ở đâu?
13. **NET-013 [Senior]** Trimming và Native AOT làm reflection/dynamic code gặp vấn đề gì; các annotation và source generation giúp ra sao?
14. **NET-014 [Senior — Tình huống]** Sau khi nâng một package, ứng dụng lỗi `MissingMethodException` chỉ ở production; hãy nêu quy trình chẩn đoán assembly/version mismatch.

## 3. Dependency Injection, configuration và options

15. **NET-015 [Middle]** Transient, scoped và singleton lifetime trong DI container ASP.NET Core có semantics gì; dependency graph nào là captive dependency?
16. **NET-016 [Senior]** Vì sao resolve scoped service từ singleton là lỗi; khi singleton thực sự cần tạo scope, cách làm đúng và trade-off là gì?
17. **NET-017 [Middle]** Constructor injection có lợi gì; khi nào factory, keyed service hoặc explicit parameter phù hợp hơn service locator?
18. **NET-018 [Senior]** Built-in DI container xử lý open generic, multiple registration, disposal và validation như thế nào?
19. **NET-019 [Middle]** Thứ tự configuration providers ảnh hưởng kết quả ra sao; environment variables ánh xạ key phân cấp như thế nào?
20. **NET-020 [Senior]** So sánh `IOptions<T>`, `IOptionsSnapshot<T>` và `IOptionsMonitor<T>` về lifetime, reload và thread safety.
21. **NET-021 [Senior — Code review]** Một singleton giữ trực tiếp object options mutable rồi callback reload sửa từng property; race condition nào có thể xảy ra và nên thiết kế snapshot thế nào?

## 4. ASP.NET Core pipeline và thiết kế API

22. **NET-022 [Middle]** Middleware pipeline được xây và thực thi theo thứ tự nào; `Use`, `Run`, `Map` và short-circuit khác nhau ra sao?
23. **NET-023 [Senior]** Thứ tự exception handling, forwarded headers, HTTPS, routing, CORS, authentication, authorization và endpoint execution nên được xác định thế nào?
24. **NET-024 [Middle]** Model binding, validation và serialization trong controller/minimal API diễn ra ở đâu; lỗi đầu vào nên trả về contract nào?
25. **NET-025 [Senior]** So sánh controller API và minimal API về filter, binding, testability, metadata và tổ chức ứng dụng lớn.
26. **NET-026 [Senior]** Kestrel xử lý request body/response streaming và backpressure như thế nào; vì sao không nên buffer toàn bộ payload lớn?
27. **NET-027 [Senior]** Cancellation khi client disconnect được biểu diễn thế nào; endpoint nên xử lý `RequestAborted` và side effect đã commit ra sao?
28. **NET-028 [Senior]** Thiết kế idempotency cho POST/payment API cần key, persistence, concurrency control, response replay và thời hạn thế nào?
29. **NET-029 [Senior — Code review]** Middleware bắt mọi exception, trả HTTP 200 cùng `{ success:false }` và log toàn bộ request body; hãy chỉ ra các vấn đề vận hành, bảo mật và semantic.
30. **NET-030 [Senior — Tình huống]** API tải file 5 GB đang dùng `ReadToEndAsync` rồi trả `byte[]`; hãy thiết kế lại để streaming, giới hạn tài nguyên và hỗ trợ range/cancellation.

## 5. Security cho web/API

31. **NET-031 [Middle]** Authentication và authorization khác nhau thế nào; claim, role, policy và resource-based authorization dùng khi nào?
32. **NET-032 [Senior]** JWT access token cần được validate những gì; vì sao chỉ decode token hoặc kiểm tra chữ ký là chưa đủ?
33. **NET-033 [Senior]** Cookie authentication cần xử lý `SameSite`, `Secure`, `HttpOnly`, CSRF, session fixation và data-protection keys thế nào?
34. **NET-034 [Middle]** CORS là gì và không phải là gì; vì sao cấu hình `AllowAnyOrigin` với credentials là nguy hiểm/không hợp lệ?
35. **NET-035 [Senior]** Secret/config nhạy cảm nên được quản lý từ local development đến production và rotation như thế nào?
36. **NET-036 [Senior — Tình huống]** Một endpoint nhận URL từ người dùng rồi server tải nội dung; hãy phân tích SSRF và các lớp phòng vệ cần thiết.

## 6. EF Core, truy vấn và giao dịch

37. **NET-037 [Middle]** Tracking query, no-tracking và `AsNoTrackingWithIdentityResolution` khác nhau về identity, update và memory thế nào?
38. **NET-038 [Middle]** `IQueryable` của EF Core được dịch sang SQL khi nào; client evaluation và materialization boundary gây rủi ro gì?
39. **NET-039 [Senior]** N+1 query xuất hiện từ lazy/explicit loading hoặc projection sai như thế nào; làm sao phát hiện và sửa mà tránh cartesian explosion?
40. **NET-040 [Senior]** Single query và split query khi `Include` nhiều collection có trade-off consistency, round-trip và kích thước result ra sao?
41. **NET-041 [Middle]** `DbContext` nên có lifetime và ownership thế nào; vì sao nó không thread-safe và không nên là singleton?
42. **NET-042 [Senior]** Optimistic concurrency với concurrency token/rowversion vận hành thế nào; quy trình resolve conflict nên tùy nghiệp vụ ra sao?
43. **NET-043 [Senior]** `SaveChanges` và transaction explicit phối hợp thế nào; savepoint, execution strategy/retry và user transaction có bẫy gì?
44. **NET-044 [Senior]** Projection, compiled query, batching và bulk operation giúp tối ưu EF Core trong trường hợp nào; giới hạn của từng cách là gì?
45. **NET-045 [Senior — Code review]** Repository trả `IQueryable<TEntity>` ra ngoài và controller tùy ý `Include`/filter; hãy đánh giá coupling, testability, security và phương án thay thế.
46. **NET-046 [Senior — Tình huống]** Một truy vấn EF Core nhanh ở dev nhưng timeout ở production với dữ liệu lớn; bạn sẽ chẩn đoán từ generated SQL đến index và execution plan thế nào?

## 7. Caching và trạng thái phân tán

47. **NET-047 [Middle]** In-memory cache và distributed cache khác nhau về consistency, availability, serialization và scale-out như thế nào?
48. **NET-048 [Senior]** Cache-aside cần xử lý invalidation, TTL, stampede, negative caching và dữ liệu stale ra sao?
49. **NET-049 [Senior — Tình huống]** Một key “hot” hết hạn khiến hàng nghìn request cùng truy vấn database; hãy đề xuất single-flight, jitter, stale-while-revalidate và giới hạn lỗi.

## 8. Testing, observability, performance và deployment

50. **NET-050 [Middle]** Unit test, integration test với `WebApplicationFactory` và end-to-end test nên phân chia trách nhiệm thế nào?
51. **NET-051 [Senior]** Vì sao EF Core InMemory provider có thể tạo test sai lệch; SQLite, container database và test double nên dùng khi nào?
52. **NET-052 [Senior]** Logging có cấu trúc, metrics và distributed tracing/OpenTelemetry bổ sung nhau thế nào; correlation và cardinality cần kiểm soát ra sao?
53. **NET-053 [Senior]** Health check readiness, liveness và startup khác nhau thế nào; dependency nào nên hoặc không nên kiểm tra ở mỗi loại?
54. **NET-054 [Senior]** Graceful shutdown của ASP.NET Core cần phối hợp load balancer, `IHostApplicationLifetime`, request đang chạy và background service ra sao?
55. **NET-055 [Senior — Tình huống]** Một bản phát hành làm p99 tăng gấp ba nhưng CPU trung bình vẫn thấp; hãy xây quy trình điều tra và rollback/canary an toàn.

## Câu hỏi kinh điển bổ sung — Basic đến Senior

56. **NET-056 [Basic · ⭐ Rất thường gặp]** Phân biệt .NET SDK, runtime, shared framework, target framework và NuGet package; máy build và máy chạy cần thành phần nào?
57. **NET-057 [Basic · Thường gặp]** Managed code và unmanaged code khác nhau thế nào; GC, P/Invoke/COM interop và ownership tài nguyên phối hợp ra sao?
58. **NET-058 [Basic · ⭐ Rất thường gặp]** Trong ASP.NET Core, `ControllerBase` và `Controller` khác nhau thế nào; `[ApiController]` bổ sung convention gì cho routing, binding và validation của Web API?
59. **NET-059 [Basic · ⭐ Rất thường gặp]** Khi thiết kế API, nên dùng các status code 200, 201, 202, 204, 400, 401, 403, 404, 409, 422, 429, 500 và 503 trong trường hợp nào?
60. **NET-060 [Basic · ⭐ Rất thường gặp]** So sánh kiểu trả về cụ thể, `IActionResult`, `ActionResult<T>`, `IResult` và typed HTTP results; lựa chọn đó ảnh hưởng OpenAPI và content negotiation thế nào?
61. **NET-061 [Basic · ⭐ Rất thường gặp]** Header `Content-Type` và `Accept` có vai trò gì; khi nào server trả 415 Unsupported Media Type hoặc 406 Not Acceptable?
62. **NET-062 [Basic · ⭐ Rất thường gặp]** Các trạng thái EF Core `Detached`, `Added`, `Unchanged`, `Modified`, `Deleted` có ý nghĩa gì và `SaveChanges` tạo lệnh database tương ứng ra sao?
63. **NET-063 [Middle · ⭐ Rất thường gặp]** `IHttpClientFactory` giải quyết socket exhaustion, DNS change và cấu hình client thế nào; handler pooling, cookie và resilience policy có pitfall gì?
64. **NET-064 [Middle · ⭐ Rất thường gặp]** Middleware, MVC action filter và endpoint filter khác nhau về phạm vi, thời điểm chạy, metadata và dependency; nên đặt cross-cutting concern ở lớp nào?
65. **NET-065 [Middle · ⭐ Rất thường gặp]** `IHostedService`/`BackgroundService` có lifecycle thế nào; làm sao dùng scoped dependency, bounded queue, cancellation và xử lý exception đúng trong worker?
66. **NET-066 [Middle · ⭐ Rất thường gặp]** HTTP caching với `Cache-Control`, ETag/`If-None-Match` và 304 hoạt động thế nào; Response Caching và Output Caching trong ASP.NET Core khác nhau ở đâu?
67. **NET-067 [Middle · Thường gặp]** Version một HTTP API bằng URL, query, header hoặc media type có trade-off gì; làm sao evolve DTO/enum/error contract mà vẫn tương thích client cũ?
68. **NET-068 [Middle · ⭐ Rất thường gặp]** EF Core Migrations khác `EnsureCreated`/`EnsureDeleted` thế nào; migration production nên được tạo, review, triển khai và rollback/roll-forward ra sao?
69. **NET-069 [Middle · ⭐ Rất thường gặp]** `Find`/`FindAsync`, `First`, `FirstOrDefault`, `Single` và `SingleOrDefault` khác nhau về identity map, SQL, cardinality contract và exception thế nào?
70. **NET-070 [Middle · Thường gặp]** Khi cập nhật entity disconnected từ API, `Attach`, `Update`, query-then-patch và property-level modification khác nhau thế nào; làm sao tránh overposting và lost update?
71. **NET-071 [Senior · Thường gặp]** DI container xây object đồng bộ nhưng service cần khởi tạo bất đồng bộ thì nên thiết kế ra sao; hosted startup, readiness gate và lazy initialization có trade-off gì?
72. **NET-072 [Senior · ⭐ Rất thường gặp]** Rate limiting trong ASP.NET Core nên partition theo IP, identity hay tenant thế nào; queue, fairness, multi-instance coordination và fail-open/fail-closed cần quyết định ra sao?
73. **NET-073 [Senior · Thường gặp]** EF Core global query filter cho soft delete và multi-tenancy có failure mode gì với `IgnoreQueryFilters`, required navigation và context pooling?
74. **NET-074 [Senior · ⭐ Rất thường gặp]** Dùng `SaveChanges` interceptor hoặc domain-event dispatcher để tạo audit/outbox cần giữ atomicity, ordering, idempotency và retry semantics thế nào?
75. **NET-075 [Senior · ⭐ Rất thường gặp]** Thiết kế integration test deterministic cho thời gian, background worker, retry và race condition trong ASP.NET Core bằng `TimeProvider`, `WebApplicationFactory`, database thật và fault injection như thế nào?
