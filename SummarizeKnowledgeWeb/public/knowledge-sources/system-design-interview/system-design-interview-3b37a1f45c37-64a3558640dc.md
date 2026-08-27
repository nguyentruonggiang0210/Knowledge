# Đáp án và rubric — Quiz phỏng vấn kinh điển

- **Đề bài:** [Quiz/classic_interview.md](../Quiz/classic_interview.md)
- **Tổng điểm:** 144
- **Nguyên tắc chấm:** Chỉ chấm ý được diễn đạt rõ ràng; thuật ngữ đúng nhưng không giải thích không mặc nhiên đạt trọn điểm. Có thể dùng cách diễn đạt khác đáp án mẫu nếu vẫn giữ đúng contract, cơ chế và trade-off.

## 1. C# — 12 điểm

### QK-001 — [C#] [Basic] — 1 điểm

**Câu hỏi:** Vì sao `string` trong C# là immutable, phép `==` so sánh gì, và khi nối nhiều đoạn trong vòng lặp bạn chọn cách nào?

**Đáp án kỳ vọng:** Nội dung của một `string` không đổi sau khi tạo; thao tác tưởng là sửa sẽ tạo chuỗi mới, nhờ đó chuỗi an toàn để chia sẻ, intern và dùng làm key. Toán tử `==` của `string` so sánh nội dung theo ordinal, phân biệt hoa thường, không phải reference identity. Nối vài literal bằng `+` thường được compiler tối ưu; vòng lặp lớn nên dùng `StringBuilder` để tránh nhiều allocation và copy. Khi so sánh theo nghiệp vụ vẫn phải chọn `StringComparison` rõ ràng.

**Rubric (1 điểm):**

- **1 điểm:** Nêu đúng immutability, value equality của `==` và chọn `StringBuilder` cho nối lặp; thiếu một trong ba ý chỉ tối đa 0,5 điểm.

**Tham chiếu:** `CS-063`.

### QK-002 — [C#] [Basic] — 1 điểm

**Câu hỏi:** Phân biệt method overloading, overriding và hiding bằng `new`; kiểu compile-time hay runtime quyết định method nào được gọi?

**Đáp án kỳ vọng:** Overloading là nhiều signature cùng tên và được compiler chọn theo kiểu đối số. Overriding thay implementation của member `virtual`/`abstract`; dispatch dựa trên runtime type của object. Hiding bằng `new` tạo member khác và lời gọi được chọn theo compile-time type của biến. `sealed override` chặn override tiếp; ép kiểu base có thể làm lộ khác biệt giữa override và hiding.

**Rubric (1 điểm):**

- **1 điểm:** Phân biệt đủ ba cơ chế và nói đúng compile-time dispatch của overload/hiding với runtime virtual dispatch của override.

**Tham chiếu:** `CS-065`.

### QK-003 — [C#] [Middle] — 2 điểm

**Câu hỏi:** Một method dùng `yield return` đọc dữ liệu theo từng phần. Code thật sự chạy khi nào, exception xuất hiện lúc nào, và tài nguyên phải được giải phóng ra sao nếu consumer dừng sớm?

**Đáp án kỳ vọng:** Compiler biến iterator thành state machine; gọi method chủ yếu tạo enumerable/enumerator, còn thân method chạy dần tại `MoveNext`, nên lỗi đọc dữ liệu thường xuất hiện lúc enumerate chứ không phải lúc tạo query. `foreach` dispose enumerator trong `finally`; `using` nằm trong iterator cũng được hạ thành cleanup gắn với `Dispose`. Consumer tự gọi `GetEnumerator` phải dispose, đặc biệt khi dừng sớm, nếu không file/connection có thể bị giữ lâu. Iterator chỉ nên sở hữu tài nguyên trong khoảng enumerate, không mở tài nguyên trước khi trả enumerable.

**Rubric (2 điểm):**

- **1 điểm:** Giải thích state machine, deferred execution và thời điểm exception tại enumeration.
- **1 điểm:** Nêu đúng nghĩa vụ dispose khi hoàn tất/dừng sớm và pitfall tài nguyên sống theo lifetime của enumerator.

**Tham chiếu:** `CS-069`.

### QK-004 — [C#] [Middle] — 2 điểm

**Câu hỏi:** Khi nào nên trả thẳng `Task` và khi nào phải dùng `async`/`await`; `try/catch`, stack trace và lifetime của `using` làm lựa chọn này khác nhau thế nào?

**Đáp án kỳ vọng:** Có thể trả thẳng task khi method chỉ chuyển tiếp nguyên vẹn kết quả; cách này tránh state machine phụ. Cần `await` khi phải biến đổi kết quả, chạy logic sau completion, bắt exception bất đồng bộ tại wrapper, hoặc giữ `using`/`finally` sống đến khi operation kết thúc. Nếu trả task ra khỏi một `using`, tài nguyên có thể bị dispose trước khi task dùng xong. `await` thường giữ logical async stack rõ hơn; wrapper trả thẳng cũng có khác biệt về thời điểm lỗi ném trước khi task được tạo. Không thêm `async` chỉ theo thói quen, nhưng cũng không bỏ `await` khi nó thay đổi semantics.

**Rubric (2 điểm):**

- **1 điểm:** Nêu đúng trường hợp pass-through so với trường hợp cần continuation/exception handling.
- **1 điểm:** Giải thích ít nhất một pitfall thực về `using`/`finally`, exception timing hoặc stack trace.

**Tham chiếu:** `CS-075`.

### QK-005 — [C#] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Bạn bọc một API callback thành `Task<T>` bằng `TaskCompletionSource<T>`. Hãy thiết kế completion, exception, cancellation và continuation để tránh race, reentrancy hoặc deadlock.

**Đáp án kỳ vọng:** Tạo `TaskCompletionSource<T>` với `TaskCreationOptions.RunContinuationsAsynchronously`; đăng ký callback trước khi bắt đầu operation và map success/error/cancel thành `TrySetResult`, `TrySetException`, `TrySetCanceled` để các đường đua không ném lỗi completion lần hai. Đăng ký cancellation có token phù hợp, yêu cầu API gốc hủy nếu hỗ trợ, rồi dispose registration/unsubscribe callback đúng một lần. Continuation chạy bất đồng bộ tránh callback dưới lock chạy thẳng code của consumer gây reentrancy hoặc deadlock. Vẫn phải định nghĩa rõ ai thắng nếu completion và cancellation đến đồng thời, đồng thời tránh giữ closure/registration gây leak.

**Rubric (3 điểm):**

- **1 điểm:** Dùng các API `TrySet*`, ánh xạ đủ success/error/cancel và định nghĩa race winner.
- **1 điểm:** Dùng `RunContinuationsAsynchronously` và giải thích rủi ro continuation inline/reentrancy.
- **1 điểm:** Quản lý cancellation của API gốc, unsubscribe/dispose registration và lifetime không rò rỉ.

**Tham chiếu:** `CS-077`.

### QK-006 — [C#] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Thiết kế pipeline producer–consumer bằng bounded `Channel<T>` cho tải burst: chọn chính sách full, truyền backpressure, shutdown, completion và failure từ consumer như thế nào?

**Đáp án kỳ vọng:** Dùng `Channel.CreateBounded<T>` với capacity dựa trên memory budget và thời gian chịu backlog. `FullMode.Wait` truyền backpressure khi không được mất dữ liệu; các mode drop chỉ hợp lệ khi đã định nghĩa loại dữ liệu được bỏ và có metric. Producer dùng `WriteAsync` với cancellation; một owner duy nhất gọi `TryComplete`, sau đó consumer `await foreach` drain đến hết. Nếu consumer lỗi, complete channel với exception và hủy các producer qua linked token; shutdown bình thường ngừng nhận, complete writer, drain có deadline rồi mới cancel. Cấu hình single reader/writer chỉ khi invariant đúng, và quan sát depth, wait time, drop, throughput cùng failure.

**Rubric (3 điểm):**

- **1 điểm:** Chọn capacity/full mode có lý do và truyền backpressure thay vì queue vô hạn.
- **1 điểm:** Mô tả đúng ownership của completion, drain và cancellation khi shutdown.
- **1 điểm:** Propagate failure hai chiều, xử lý drop/race và nêu telemetry vận hành cần thiết.

**Tham chiếu:** `CS-079`.

## 2. .NET / ASP.NET Core / EF Core — 12 điểm

### QK-007 — [.NET/ASP.NET/EF] [Basic] — 1 điểm

**Câu hỏi:** Phân biệt .NET SDK, runtime, shared framework, target framework và NuGet package; máy build và máy chạy tối thiểu cần gì?

**Đáp án kỳ vọng:** SDK chứa compiler, CLI/MSBuild và runtime để build/test; runtime chỉ đủ thực thi. Shared framework là tập runtime assemblies chung như `Microsoft.AspNetCore.App`; TFM là contract API mà project nhắm tới; NuGet package là dependency được resolve/restore. Máy build cần SDK tương thích. Máy chạy framework-dependent cần runtime/shared framework đúng major; self-contained deployment mang runtime theo và không cần cài runtime tương ứng sẵn.

**Rubric (1 điểm):**

- **1 điểm:** Phân biệt đúng năm khái niệm và yêu cầu build/runtime, kể cả khác biệt framework-dependent với self-contained.

**Tham chiếu:** `NET-056`.

### QK-008 — [.NET/ASP.NET/EF] [Basic] — 1 điểm

**Câu hỏi:** Trong ASP.NET Core, khi nào dùng `ControllerBase` thay `Controller`, và `[ApiController]` tự động hóa những gì cho routing, binding và validation?

**Đáp án kỳ vọng:** `ControllerBase` cung cấp API primitives nhưng không có view support; `Controller` kế thừa nó và thêm View/ViewData/TempData, nên Web API thường dùng `ControllerBase`. `[ApiController]` yêu cầu attribute routing, suy luận binding source và tự trả 400/validation problem khi model state không hợp lệ theo conventions. Automatic 400 có thể xảy ra trước action; error contract riêng cần cấu hình pipeline thay vì xử lý lặp trong từng action.

**Rubric (1 điểm):**

- **1 điểm:** Phân biệt đúng hai base class và nêu được attribute routing, binding-source inference cùng automatic validation response; thiếu một nửa chỉ tối đa 0,5 điểm.

**Tham chiếu:** `NET-058`, `NET-060`.

### QK-009 — [.NET/ASP.NET/EF] [Middle] — 2 điểm

**Câu hỏi:** Bạn cần correlation, exception mapping và validation cho ASP.NET Core API. Phần nào nên đặt ở middleware, MVC action filter hay endpoint filter, và vì sao?

**Đáp án kỳ vọng:** Middleware bao quanh toàn pipeline nên phù hợp correlation, request logging và global exception-to-ProblemDetails; thứ tự đặt quyết định nó thấy exception/identity/endpoint hay không. MVC action filter chỉ áp dụng controller/action và thấy action arguments/model state, phù hợp policy riêng của MVC. Endpoint filter gắn endpoint, đặc biệt Minimal API, thấy handler arguments/metadata và có thể validate/short-circuit gần handler. Validation format/model binding nên ở boundary; invariant nghiệp vụ vẫn ở application/domain. Không nhân ba cùng một concern, và không dùng filter để bắt lỗi phát sinh trước MVC.

**Rubric (2 điểm):**

- **1 điểm:** Đặt đúng correlation/exception ở middleware và validation gần MVC/endpoint boundary với lý do về phạm vi.
- **1 điểm:** Nêu ordering/metadata hoặc failure boundary, đồng thời tránh duplicate concern hay đưa business invariant vào filter.

**Tham chiếu:** `NET-064`.

### QK-010 — [.NET/ASP.NET/EF] [Middle] — 2 điểm

**Câu hỏi:** EF Core Migrations khác `EnsureCreated` thế nào; một migration production an toàn cần được tạo, review, triển khai và phục hồi ra sao?

**Đáp án kỳ vọng:** `EnsureCreated` tạo schema trực tiếp, không có migration history và không phải đường nâng cấp schema tiến hóa; phù hợp test/prototype hoặc database disposable. Migration là delta có version, được generate rồi phải review code/SQL, nhất là rename, data migration, lock và operation phá hủy. Production nên build script/idempotent bundle trong CI, backup/kiểm tra capacity, dùng expand–migrate–contract để tương thích rolling deploy, và chạy bởi job có quyền riêng thay vì mọi app instance. Phục hồi thường ưu tiên roll-forward; down migration chỉ dùng khi đã chứng minh an toàn cho dữ liệu.

**Rubric (2 điểm):**

- **1 điểm:** Phân biệt chính xác migration history/evolution với direct schema creation của `EnsureCreated`.
- **1 điểm:** Trình bày quy trình production có review, compatibility/locking và chiến lược recovery dữ liệu an toàn.

**Tham chiếu:** `NET-068`.

### QK-011 — [.NET/ASP.NET/EF] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Thiết kế rate limiting cho API ASP.NET Core nhiều instance và nhiều tenant: partition key, fairness, burst/queue, coordination và fail-open/fail-closed được quyết định thế nào?

**Đáp án kỳ vọng:** Partition theo authenticated tenant/API key cho quota kinh doanh, thêm user/endpoint khi cần và chỉ dùng IP làm fallback vì NAT/proxy; chuẩn hóa key để tránh bypass/cardinality attack. Chọn token bucket/sliding window theo burst và độ chính xác; queue phải nhỏ, có deadline và fairness để tenant lớn không chiếm worker. Nhiều instance cần store/coordinator dùng atomic operation hoặc chấp nhận quota xấp xỉ bằng local limiter có phân bổ budget. Endpoint nhạy cảm có thể fail-closed; endpoint thiết yếu có thể fail-open với local emergency limit. Trả `429`/`Retry-After` và đo allowed, rejected, queued latency, hot partition cùng lỗi coordinator.

**Rubric (3 điểm):**

- **1 điểm:** Chọn partition key và thuật toán/queue dựa trên tenant fairness cùng burst semantics.
- **1 điểm:** Giải quyết coordination nhiều instance, consistency và degradation khi limiter/store lỗi.
- **1 điểm:** Nêu HTTP contract, chống bypass/cardinality và telemetry/capacity vận hành.

**Tham chiếu:** `NET-072`.

### QK-012 — [.NET/ASP.NET/EF] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Một API ghi aggregate rồi phát event. Hãy dùng EF Core outbox/interceptor để giữ atomicity và thiết kế integration test deterministic cho commit, retry, background worker và duplicate delivery.

**Đáp án kỳ vọng:** Aggregate change và outbox row phải được ghi bởi cùng `DbContext`/database transaction; interceptor hoặc dispatcher chỉ thu domain event và thêm outbox entity trước `SaveChanges`, không publish network trong transaction. Dispatcher riêng claim row bằng lease/locking, publish rồi đánh dấu; crash giữa publish và mark tạo at-least-once nên message có stable ID và consumer idempotent. Test dùng database thật và `WebApplicationFactory`, ép một lần commit thật, kiểm tra rollback không có outbox, điều khiển clock bằng `TimeProvider`, trigger/await worker qua hook thay vì sleep, fault-inject publish/mark rồi chạy retry và xác nhận duplicate không đổi kết quả.

**Rubric (3 điểm):**

- **1 điểm:** Giữ aggregate và outbox atomic, không nhầm database transaction với network atomicity.
- **1 điểm:** Thiết kế claim/retry/idempotency cho at-least-once và các crash window.
- **1 điểm:** Test deterministic qua commit thật, clock/worker điều khiển được, fault injection và assertion duplicate.

**Tham chiếu:** `NET-074`, `NET-075`.

## 3. Java — 12 điểm

### QK-013 — [Java] [Basic] — 1 điểm

**Câu hỏi:** Interface và abstract class khác nhau về state, constructor, multiple inheritance và khả năng tiến hóa API; khi nào chọn mỗi loại?

**Đáp án kỳ vọng:** Abstract class có instance state, constructor, protected implementation và chỉ được kế thừa một class; interface mô tả capability/contract, cho phép implement nhiều interface, field chỉ là hằng và có default/static/private methods. Chọn abstract class khi các subtype thật sự chia sẻ invariant, state và lifecycle; chọn interface để tách contract, hỗ trợ nhiều implementation hoặc composition. Default method giúp tiến hóa nhưng không nên biến interface thành base class chứa state ngầm.

**Rubric (1 điểm):**

- **1 điểm:** Nêu đúng khác biệt state/constructor/multiple inheritance và tiêu chí chọn dựa trên shared implementation so với contract.

**Tham chiếu:** `JAVA-059`.

### QK-014 — [Java] [Basic] — 1 điểm

**Câu hỏi:** Vì sao `String` immutable và String Pool tồn tại; `new String("abc")` khác literal ra sao, và vì sao không nên dùng `+` lặp lại trong loop lớn?

**Đáp án kỳ vọng:** String không đổi nội dung nên an toàn để chia sẻ, cache hash và intern. Literal được intern trong pool; `new String("abc")` tạo object riêng dù literal/pool có thể đã tồn tại, vì vậy dùng `equals` cho nội dung chứ không dùng `==`. Compiler có thể fold literal hoặc hạ một expression nối thành `StringBuilder`, nhưng `s += part` qua nhiều vòng thường tạo chuỗi trung gian và copy lặp; dùng một `StringBuilder`. `StringBuffer` chỉ đáng dùng khi thật sự cần đồng bộ trên cùng builder.

**Rubric (1 điểm):**

- **1 điểm:** Giải thích immutability/pool, identity của `new String` và lựa chọn `StringBuilder` trong loop.

**Tham chiếu:** `JAVA-060`, `JAVA-061`.

### QK-015 — [Java] [Middle] — 2 điểm

**Câu hỏi:** Vì sao thường ưu tiên composition hơn inheritance; hãy dùng Liskov Substitution Principle để nhận biết một quan hệ kế thừa hợp lệ.

**Đáp án kỳ vọng:** Composition ủy quyền cho dependency qua contract nhỏ, cho phép thay implementation, test độc lập và không làm client phụ thuộc protected state/lifecycle của base class. Inheritance hợp lệ khi subtype thật sự là substitutable: không siết precondition, không làm yếu postcondition, giữ invariant và semantics mà client của base mong đợi. Nếu subclass chỉ muốn tái sử dụng vài method, phải override nhiều hành vi hoặc `instanceof` liên tục để sửa contract, nên compose. Inheritance vẫn tốt cho hierarchy ổn định/closed với invariant chung, nhưng tránh fragile-base-class và deep hierarchy.

**Rubric (2 điểm):**

- **1 điểm:** Nêu lợi ích coupling/testing/evolution của composition và rủi ro fragile base.
- **1 điểm:** Áp dụng đúng LSP bằng precondition, postcondition/invariant hoặc ví dụ substitutability cụ thể.

**Tham chiếu:** `JAVA-066`.

### QK-016 — [Java] [Middle] — 2 điểm

**Câu hỏi:** So sánh `Runnable`, `Callable<T>` và `Future<T>` về kết quả, exception và cancellation; vì sao application code thường nên dùng executor thay vì tạo `Thread` thủ công?

**Đáp án kỳ vọng:** `Runnable.run` không trả kết quả và không khai báo checked exception; `Callable.call` trả `T` và có thể throw. Submit chúng vào executor trả `Future`: `get` chờ và bọc lỗi trong `ExecutionException`, `cancel(true)` chỉ yêu cầu interrupt nên task phải hợp tác kiểm tra interrupt/dùng API interruptible. Executor quản pool, queue, reuse, saturation và shutdown tốt hơn tạo thread cho từng task. Vẫn phải chọn bounded queue/rejection policy, truyền timeout và không nuốt `InterruptedException`; với composition bất đồng bộ hiện đại có thể dùng `CompletableFuture` nhưng cancellation semantics vẫn cần hiểu.

**Rubric (2 điểm):**

- **1 điểm:** Phân biệt đúng result/exception của `Runnable`, `Callable` và quan sát qua `Future`.
- **1 điểm:** Giải thích cancellation cooperative cùng lợi ích và pitfall capacity/lifecycle của executor.

**Tham chiếu:** `JAVA-072`.

### QK-017 — [Java] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Thiết kế producer–consumer bằng bounded `BlockingQueue`: xử lý backpressure, nhiều producer/consumer, interruption và shutdown thế nào để không mất hoặc treo task?

**Đáp án kỳ vọng:** Chọn capacity theo memory/SLO; producer dùng `put` hoặc `offer(timeout)` để truyền backpressure và có policy rõ khi timeout, không đổi sang queue vô hạn. Consumer dùng pool kích thước hữu hạn và `take`/`poll`; task failure phải được ghi nhận/chuyển sang retry hoặc dead-letter chứ không làm worker chết âm thầm. Shutdown theo thứ tự: ngừng nhận producer, chờ producer đang chạy, đánh dấu completion, drain với deadline rồi interrupt/cancel. Poison pill cần một marker cho mỗi consumer và dễ race với producer; lifecycle flag cộng executor shutdown thường rõ hơn. Khi bắt `InterruptedException`, restore interrupt hoặc thoát, không nuốt tín hiệu.

**Rubric (3 điểm):**

- **1 điểm:** Bounded capacity và API `put`/`offer` tạo backpressure với overload policy rõ.
- **1 điểm:** Xử lý nhiều worker, task failure, interruption mà không mất tín hiệu hoặc chết âm thầm.
- **1 điểm:** Trình bày shutdown/drain không race, nhận ra trade-off của poison pill và có deadline/telemetry.

**Tham chiếu:** `JAVA-076`.

### QK-018 — [Java] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Một service lưu tenant context trong `ThreadLocal` trên thread pool và thỉnh thoảng trả dữ liệu sai tenant. Hãy giải thích nguyên nhân, cách khắc phục và phương án truyền context an toàn hơn.

**Đáp án kỳ vọng:** Thread pool tái sử dụng worker, còn `ThreadLocal` gắn value với thread chứ không gắn task; nếu không `remove`, task kế tiếp có thể thấy tenant cũ, đồng thời value/classloader có thể bị giữ lâu. Biện pháp tối thiểu là set ở boundary và luôn `remove` trong `finally`, kể cả lỗi/cancel; wrapper executor phải capture context có chủ đích và restore trạng thái cũ, không copy mù toàn bộ context. An toàn hơn là truyền immutable request context tường minh qua call chain; với code phù hợp có thể dùng scoped/structured context thay vì ambient mutable state. Authorization vẫn phải lấy tenant từ identity đáng tin và enforce tại data boundary, không chỉ dựa vào ThreadLocal.

**Rubric (3 điểm):**

- **1 điểm:** Giải thích chính xác thread reuse gây stale/cross-tenant context và leak.
- **1 điểm:** Sửa bằng `try/finally remove`, capture/restore có kiểm soát và xử lý mọi đường lỗi.
- **1 điểm:** Đề xuất explicit/scoped context cùng defense-in-depth authorization tại boundary dữ liệu.

**Tham chiếu:** `JAVA-077`.

## 4. JVM / Spring — 12 điểm

### QK-019 — [JVM/Spring] [Basic] — 1 điểm

**Câu hỏi:** JDK, JRE và JVM khác nhau ở vai trò nào; build server và runtime container của một ứng dụng Java cần những thành phần gì?

**Đáp án kỳ vọng:** JVM thực thi bytecode và cung cấp runtime services như class loading, JIT, GC. JRE là JVM cộng thư viện/runtime cần để chạy ứng dụng; JDK bao gồm toolchain phát triển như `javac`, `jar`, debugger cùng runtime. Build server cần JDK đúng toolchain/release target. Runtime container chỉ cần runtime image tương thích, có thể là JRE/JDK tối giản hoặc image tạo bằng `jlink`; không cần compiler nếu không compile lúc chạy.

**Rubric (1 điểm):**

- **1 điểm:** Phân biệt đúng JVM/JRE/JDK và nhu cầu của build so với runtime image.

**Tham chiếu:** `JVM-056`.

### QK-020 — [JVM/Spring] [Basic] — 1 điểm

**Câu hỏi:** `@Controller`, `@RestController` và `@ResponseBody` khác nhau thế nào; trường hợp nào trả view và trường hợp nào ghi body qua HTTP message conversion?

**Đáp án kỳ vọng:** `@Controller` đánh dấu MVC controller; giá trị trả về thường được view resolver hiểu là view/model flow. `@ResponseBody` trên method/type yêu cầu ghi return value vào response qua `HttpMessageConverter`. `@RestController` tương đương `@Controller` cộng `@ResponseBody` mặc định cho mọi handler. Vì vậy một `String` từ controller có thể là tên view, còn từ REST controller thường là body; vẫn cần chọn media type và converter phù hợp.

**Rubric (1 điểm):**

- **1 điểm:** Nêu đúng quan hệ annotation và phân biệt view resolution với serialization vào response body.

**Tham chiếu:** `JVM-060`.

### QK-021 — [JVM/Spring] [Middle] — 2 điểm

**Câu hỏi:** Spring resolve dependency thế nào khi có nhiều bean cùng interface; `@Primary`, `@Qualifier`, tên bean và inject collection nên được dùng ra sao?

**Đáp án kỳ vọng:** Spring trước hết lọc candidate theo type và generic metadata. Một dependency đơn có nhiều candidate sẽ cần qualifier hoặc một `@Primary`; tên injection point có thể là fallback nhưng dễ vỡ khi refactor, nên contract quan trọng dùng `@Qualifier`/custom qualifier. `@Primary` đặt default toàn cục trong nhóm nhưng không nên che sự mơ hồ về nghiệp vụ. Inject `List<T>`/`Map<String,T>` lấy mọi bean phù hợp, có thể sắp bằng `@Order`, thích hợp strategy chain; injection đơn không tự chọn tùy ý mà báo `NoUniqueBeanDefinitionException` khi chưa resolve được.

**Rubric (2 điểm):**

- **1 điểm:** Mô tả đúng type candidate và vai trò khác nhau của `@Primary`, `@Qualifier`, tên bean.
- **1 điểm:** Giải thích collection injection/order và pitfall dùng default/name để che ambiguity nghiệp vụ.

**Tham chiếu:** `JVM-064`.

### QK-022 — [JVM/Spring] [Middle] — 2 điểm

**Câu hỏi:** Một method `@Transactional` gọi công việc `@Async`. Transaction context có đi theo thread mới không, và bạn thiết kế boundary thế nào để tránh partial commit hoặc query ngoài transaction?

**Đáp án kỳ vọng:** Spring transaction thường được giữ trong thread-local context nên không tự truyền sang executor thread. Async task có thể chạy trước khi transaction caller commit, đọc không thấy dữ liệu hoặc tạo side effect dù caller rollback. Hãy commit một intent/outbox trong transaction, rồi worker nhận sau commit và mở transaction riêng cho một unit of work; truyền ID/immutable payload thay vì managed entity. Nếu chỉ cần async sau commit, listener vẫn cần retry bền vững vì `AFTER_COMMIT` không làm network side effect atomic. Đồng thời lưu ý proxy/self-invocation: gọi `@Async` hay `@Transactional` nội bộ cùng bean có thể bỏ qua advice.

**Rubric (2 điểm):**

- **1 điểm:** Nêu transaction không flow qua thread và chỉ ra race/partial side effect cụ thể.
- **1 điểm:** Đặt boundary mới bằng transaction riêng/outbox sau commit, truyền dữ liệu phù hợp và nhận biết proxy pitfall.

**Tham chiếu:** `JVM-067`, `JVM-072`.

### QK-023 — [JVM/Spring] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Thiết kế POST idempotent trong Spring bằng `Idempotency-Key` để xử lý concurrent duplicate, payload mismatch, response replay, TTL và transaction boundary.

**Đáp án kỳ vọng:** Scope key theo principal/tenant + operation, lưu key với request hash, trạng thái và response chuẩn hóa; unique constraint/upsert đảm bảo chỉ một request giành quyền xử lý. Duplicate cùng hash đang chạy chờ/poll hoặc nhận trạng thái xác định; đã xong replay cùng status/body; cùng key khác payload trả conflict. Business write và idempotency record phải chung database transaction hoặc dùng state machine/outbox có recovery để crash không tạo write “mồ côi”. TTL phải dài hơn cửa sổ retry và không xóa record khi operation còn có thể tái xuất hiện. Không log key nhạy cảm; giới hạn key length/cardinality và quan sát conflict, replay, stuck pending.

**Rubric (3 điểm):**

- **1 điểm:** Thiết kế key scope, request hash, unique concurrency control và response replay đúng.
- **1 điểm:** Giữ transaction/crash semantics và xử lý pending, mismatch, duplicate đồng thời.
- **1 điểm:** Quyết định TTL/cleanup, abuse controls và observability có lý do.

**Tham chiếu:** `JVM-073`.

### QK-024 — [JVM/Spring] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Một JPQL bulk update chạy trong service rồi test `@Transactional` vẫn xanh, nhưng production có entity stale và event sau commit bị thiếu. Hãy giải thích và thiết kế lại cả code lẫn test.

**Đáp án kỳ vọng:** Bulk JPQL/native update chạy thẳng SQL, bỏ qua dirty checking, entity callback và thường cả optimistic version; managed entity đã load vẫn giữ state cũ. Sau bulk phải `clear`/`refresh`, tách transaction hoặc tránh bulk khi cần invariant/callback; thêm version predicate/increment nếu concurrency contract yêu cầu. Test được bọc transaction và rollback không đi qua commit boundary thật nên có thể che constraint deferred, `AFTER_COMMIT` listener và outbox dispatcher. Integration test phải dùng database thật, commit transaction, tạo persistence context mới để đọc lại, điều khiển/await worker, rồi fault-inject retry và kiểm tra event/outbox cùng optimistic locking.

**Rubric (3 điểm):**

- **1 điểm:** Giải thích bulk update bypass persistence context/callback/version và stale entity.
- **1 điểm:** Đưa ra code boundary đúng: clear/refresh hoặc transaction riêng, bảo vệ version/invariant.
- **1 điểm:** Thiết kế test quan sát commit thật, context mới và after-commit/outbox failure thay vì dựa rollback mặc định.

**Tham chiếu:** `JVM-074`, `JVM-075`.

## 5. Algorithms & Data Structures — 12 điểm

### QK-025 — [Algorithms] [Basic] — 1 điểm

**Câu hỏi:** Phân tích Big-O cho hai vòng lặp có kích thước đầu vào độc lập, trong đó một vòng tăng tuyến tính và một vòng nhân đôi biến đếm; vì sao không mặc định viết `O(n²)`?

**Đáp án kỳ vọng:** Vòng tăng từng đơn vị theo input `n` chạy `O(n)`; vòng nhân đôi đến `m` chạy `O(log m)`. Nếu hai vòng nối tiếp, tổng là `O(n + log m)`; nếu vòng log nằm bên trong mỗi iteration của vòng tuyến tính thì là `O(n log m)`. Không được gộp thành `O(n²)` vì hai input độc lập và tốc độ tăng khác nhau; chỉ thay `m = n` khi contract thực sự nói vậy.

**Rubric (1 điểm):**

- **1 điểm:** Nhận ra `O(n)` và `O(log m)`, kết hợp đúng theo nối tiếp/lồng nhau và giữ biến input độc lập.

**Tham chiếu:** `ALG-061`.

### QK-026 — [Algorithms] [Basic] — 1 điểm

**Câu hỏi:** Giải Two Sum trả về hai index khác nhau bằng hash map trong một pass; invariant và độ phức tạp là gì?

**Đáp án kỳ vọng:** Duyệt `i` từ trái sang phải; trước khi thêm `a[i]`, tra `target - a[i]` trong map giá trị → index đã thấy. Nếu có thì trả index cũ và `i`; nếu chưa thì lưu `a[i] -> i`. Invariant: map chỉ chứa phần tử ở index trước `i`, nên không dùng cùng một phần tử hai lần. Độ phức tạp trung bình `O(n)` thời gian, `O(n)` bộ nhớ; cần nói rõ contract khi không có nghiệm/nhiều nghiệm và integer overflow nếu miền số có thể tràn.

**Rubric (1 điểm):**

- **1 điểm:** Thuật toán one-pass đúng, invariant hai index khác nhau và complexity trung bình `O(n)`/`O(n)`.

**Tham chiếu:** `ALG-062`.

### QK-027 — [Algorithms] [Middle] — 2 điểm

**Câu hỏi:** Tìm độ dài longest substring không lặp ký tự bằng sliding window; khi gặp ký tự lặp, con trỏ trái phải cập nhật thế nào để vẫn tuyến tính?

**Đáp án kỳ vọng:** Giữ cửa sổ `[left, right]` không có duplicate và map ký tự → vị trí cuối. Với ký tự `c` tại `right`, đặt `left = max(left, last[c] + 1)`, rồi cập nhật `last[c] = right` và đáp án bằng độ dài cửa sổ. `max` ngăn con trỏ trái lùi khi lần xuất hiện cũ đã ở ngoài cửa sổ. Mỗi index được xử lý hằng số lần nên `O(n)` thời gian; bộ nhớ theo alphabet. Cần thống nhất “ký tự” là code unit, code point hay grapheme nếu input Unicode thực tế.

**Rubric (2 điểm):**

- **1 điểm:** Nêu invariant cửa sổ và công thức cập nhật `left`/last-seen chính xác.
- **1 điểm:** Chứng minh tuyến tính, nêu complexity bộ nhớ và nhận biết contract ký tự/edge case.

**Tham chiếu:** `ALG-069`.

### QK-028 — [Algorithms] [Middle] — 2 điểm

**Câu hỏi:** Dùng Floyd tortoise–hare để phát hiện cycle và tìm node bắt đầu cycle trong singly linked list; giải thích vì sao pha thứ hai đúng.

**Đáp án kỳ vọng:** Cho slow đi một bước, fast hai bước; nếu fast gặp `null` thì không có cycle, nếu gặp nhau thì có. Sau điểm gặp, đặt một con trỏ về head và cho cả hai đi một bước; node gặp kế tiếp là entry. Nếu khoảng từ head đến entry là `μ`, cycle dài `λ`, tại lần gặp khoảng đi của slow thỏa quan hệ modulo `λ`; phần còn lại từ điểm gặp đến entry tương đương `μ` modulo cycle, nên hai con trỏ cùng tốc độ gặp ở entry. Thời gian `O(n)`, bộ nhớ `O(1)`.

**Rubric (2 điểm):**

- **1 điểm:** Mô tả đúng hai pha, điều kiện không cycle và kết quả entry.
- **1 điểm:** Giải thích bằng khoảng cách/modulo đủ thuyết phục và nêu `O(n)`/`O(1)`.

**Tham chiếu:** `ALG-070`.

### QK-029 — [Algorithms] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Tìm minimum window substring chứa đủ multiplicity của pattern; nêu invariant của cửa sổ, cách co/mở và xử lý edge case.

**Đáp án kỳ vọng:** Đếm `need` cho từng ký tự của pattern và `have` trong cửa sổ; theo dõi số loại ký tự đã đạt đúng requirement hoặc tổng số instance còn thiếu. Mở `right`, cập nhật count; khi cửa sổ valid thì liên tục ghi nhận đáp án nhỏ nhất và tăng `left` cho đến khi vừa mất validity. Multiplicity bắt buộc: pattern `AABC` cần hai `A`, không chỉ presence. Mỗi đầu cửa sổ chỉ tiến nên `O(|s| + |t|)`, bộ nhớ theo alphabet. Trả empty khi pattern rỗng/không thể thỏa theo contract, xử lý tie deterministic và định nghĩa đơn vị Unicode nếu cần.

**Rubric (3 điểm):**

- **1 điểm:** Dùng frequency/missing hoặc formed-required để giữ đúng multiplicity invariant.
- **1 điểm:** Mở/co cửa sổ đúng, cập nhật minimum tại thời điểm valid và chứng minh tuyến tính.
- **1 điểm:** Bao phủ pattern rỗng/không có nghiệm/tie cùng contract ký tự và tránh off-by-one.

**Tham chiếu:** `ALG-079`.

### QK-030 — [Algorithms] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Tìm median của hai sorted array trong `O(log(min(m,n)))`; mô tả partition invariant, biên rỗng và công thức cho tổng độ dài chẵn/lẻ.

**Đáp án kỳ vọng:** Binary search partition trên mảng ngắn `A`; chọn `i` và suy ra `j = (m+n+1)/2 - i`. Partition hợp lệ khi `Aleft <= Bright` và `Bleft <= Aright`; nếu `Aleft > Bright` dịch trái, ngược lại dịch phải. Dùng `-∞/+∞` cho phía partition rỗng. Nếu tổng lẻ, median là `max(Aleft,Bleft)`; nếu chẵn là trung bình của `max(left)` và `min(right)`, tránh overflow khi cộng. Nếu cả hai mảng rỗng phải báo invalid theo contract. Complexity `O(log min(m,n))`, bộ nhớ `O(1)`.

**Rubric (3 điểm):**

- **1 điểm:** Thiết lập đúng `i`, `j`, số phần tử nửa trái và hai bất đẳng thức partition.
- **1 điểm:** Điều hướng binary search và xử lý sentinel/partition rỗng chính xác.
- **1 điểm:** Công thức chẵn/lẻ, empty-input/overflow và complexity đúng.

**Tham chiếu:** `ALG-080`.

## 6. Database — 12 điểm

### QK-031 — [Database] [Basic] — 1 điểm

**Câu hỏi:** Viết truy vấn tìm các email xuất hiện nhiều hơn một lần và trả cả số lần xuất hiện; `NULL` và chuẩn hóa hoa thường cần được quyết định thế nào?

**Đáp án kỳ vọng:** Dạng cốt lõi là `SELECT normalized_email, COUNT(*) AS occurrences FROM users WHERE email IS NOT NULL GROUP BY normalized_email HAVING COUNT(*) > 1`. `normalized_email` có thể là `LOWER(TRIM(email))` hoặc tốt hơn là cột normalized được ghi/index theo business rule. SQL thường group các `NULL` cùng nhau, nên phải chủ động loại hoặc coi chúng là duplicate theo contract. Collation có thể đã không phân biệt hoa thường; không áp hàm tùy tiện khiến index hiện có mất tác dụng.

**Rubric (1 điểm):**

- **1 điểm:** Có `GROUP BY` + `HAVING COUNT(*) > 1`, trả count và nêu quyết định rõ về `NULL`/case normalization.

**Tham chiếu:** `DB-066`.

### QK-032 — [Database] [Basic] — 1 điểm

**Câu hỏi:** PRIMARY KEY, UNIQUE và FOREIGN KEY bảo vệ những invariant khác nhau nào; constraint nào không tự bảo đảm business rule phức tạp?

**Đáp án kỳ vọng:** PRIMARY KEY định danh duy nhất, không null cho mỗi row và mỗi bảng có một key chính (có thể composite). UNIQUE ngăn trùng candidate key nhưng semantics của nhiều `NULL` phụ thuộc DB. FOREIGN KEY bảo đảm giá trị con tham chiếu row cha tồn tại hoặc null nếu cho phép, cùng policy update/delete. Chúng không tự diễn đạt mọi rule liên-row/liên-bảng như “tổng hạn mức không vượt X”; cần CHECK, transaction/locking, trigger hoặc model khác tùy invariant.

**Rubric (1 điểm):**

- **1 điểm:** Ánh xạ đúng identity, uniqueness, referential integrity và nhận ra giới hạn với invariant nghiệp vụ phức tạp.

**Tham chiếu:** `DB-068`.

### QK-033 — [Database] [Middle] — 2 điểm

**Câu hỏi:** Lấy top 3 mức lương của từng phòng ban bằng window function; chọn `ROW_NUMBER`, `RANK` hay `DENSE_RANK` thế nào khi có tie?

**Đáp án kỳ vọng:** Tính rank trong CTE/subquery với `... OVER (PARTITION BY department_id ORDER BY salary DESC, tie_breaker)` rồi lọc bên ngoài. `ROW_NUMBER <= 3` trả đúng tối đa ba row và cần tie-breaker ổn định. `RANK <= 3` giữ tie nhưng có khoảng hạng, nên có thể bỏ mức lương kế sau; `DENSE_RANK <= 3` trả ba mức lương phân biệt và có thể hơn ba người. Chọn theo product contract, không dùng `LIMIT 3` toàn bảng và không giả định thứ tự ổn định khi salary bằng nhau.

**Rubric (2 điểm):**

- **1 điểm:** Dùng window với `PARTITION BY` đúng và lọc rank ở query ngoài.
- **1 điểm:** Phân biệt chính xác ba hàm khi tie, nêu tie-breaker/cardinality theo contract.

**Tham chiếu:** `DB-073`.

### QK-034 — [Database] [Middle] — 2 điểm

**Câu hỏi:** Thiết kế composite index cho query có equality, range và sort; thứ tự cột, covering và keyset pagination ảnh hưởng plan ra sao?

**Đáp án kỳ vọng:** Thường đặt các cột equality/selective prefix trước, sau đó cột range; index chỉ phục vụ `ORDER BY` nếu thứ tự/direction còn khớp sau prefix và range không phá khả năng scan mong muốn. Với trang latest orders chẳng hạn có thể dùng `(tenant_id, status, created_at DESC, id DESC)`; cursor mang `(created_at,id)` và predicate tuple tương ứng để seek ổn định. INCLUDE/cover các cột projection nhỏ giảm lookup nhưng tăng write, storage và cache pressure. Xác nhận bằng actual plan/row estimate, không áp “cột selective nhất luôn đứng đầu” như quy tắc tuyệt đối.

**Rubric (2 điểm):**

- **1 điểm:** Chọn thứ tự equality–range–sort và giải thích khi index hỗ trợ filter/order.
- **1 điểm:** Nêu keyset cursor/tie-breaker cùng trade-off covering đối với read, write và kích thước index.

**Tham chiếu:** `DB-077`, `DB-078`.

### QK-035 — [Database] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Sau một đợt dữ liệu skew, query đang nhanh bỗng chọn plan tệ do cardinality estimate sai. Bạn xác nhận nguyên nhân, giảm thiểu và ngăn plan regression thế nào?

**Đáp án kỳ vọng:** So sánh actual với estimated rows theo từng operator, parameter/value, plan cũ/mới, statistics age/histogram và wait/I/O; kiểm tra parameter-sensitive plan, correlation giữa cột và recent data shift trước khi đổ lỗi optimizer. Giảm thiểu có thể update statistics đúng sample, recompile/plan variant, rewrite predicate, thêm filtered/composite statistics/index hoặc tạm force known-good plan với expiry. Dài hạn theo dõi query/plan store, latency theo parameter cohort, auto-stats và regression alert; test bằng distribution production-like. Force plan vô thời hạn hoặc index theo một hot value có thể làm cohort khác tệ và tăng write cost.

**Rubric (3 điểm):**

- **1 điểm:** Xác nhận bằng actual-vs-estimated, statistics/histogram, parameter và data distribution.
- **1 điểm:** Đề xuất mitigation nhiều tầng, không chỉ “thêm index”, kèm rủi ro của plan forcing/recompile.
- **1 điểm:** Có prevention qua telemetry/regression detection, stats policy và workload dữ liệu đại diện.

**Tham chiếu:** `DB-081`.

### QK-036 — [Database] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Database failover đúng lúc client gửi COMMIT nên kết quả transaction là unknown. Thiết kế retry, idempotency key, reconciliation và thông báo trạng thái cho client ra sao?

**Đáp án kỳ vọng:** Timeout/mất connection sau COMMIT không chứng minh rollback; retry mù có thể tạo giao dịch kép. Gắn business operation/idempotency key ổn định, lưu nó với kết quả trong unique constraint cùng transaction; request lặp đọc/replay kết quả đã commit hoặc tranh chấp có kiểm soát. Nếu chưa xác định, trả trạng thái pending/unknown với operation ID và cho client poll, còn reconciler kiểm tra ledger/provider/replica authoritative trước khi retry. Side effect ngoài DB cần outbox/saga và idempotent consumer. Log correlation/audit nhưng không tuyên bố failure khi commit outcome chưa biết; diễn tập failover và đặt retention key dài hơn retry window.

**Rubric (3 điểm):**

- **1 điểm:** Nhận đúng trạng thái ambiguous commit và không retry non-idempotent một cách mù quáng.
- **1 điểm:** Dùng key unique/result record, outbox hoặc ledger để retry/replay an toàn.
- **1 điểm:** Có trạng thái client/reconciliation/audit và policy retention/failover test vận hành được.

**Tham chiếu:** `DB-084`.

## 7. Software Engineering — 12 điểm

### QK-037 — [Software Engineering] [Basic] — 1 điểm

**Câu hỏi:** Abstraction và encapsulation khác nhau thế nào; hãy nêu một ví dụ API che giấu state tốt nhưng vẫn cung cấp abstraction kém.

**Đáp án kỳ vọng:** Abstraction chọn mô hình/operation thiết yếu — “cái gì” client cần; encapsulation che representation và bảo vệ invariant — “bên trong làm thế nào”. Một repository có private connection nhưng expose `Execute(string table, string where, Dictionary<string,object> fields)` đã encapsulate connection, song abstraction vẫn rò schema/query mechanics và buộc client biết chi tiết persistence. API tốt nên biểu đạt intent nghiệp vụ ổn định, không chỉ bọc chi tiết bằng member private.

**Rubric (1 điểm):**

- **1 điểm:** Phân biệt đúng hai khái niệm và đưa ví dụ cho thấy che state không tự tạo abstraction tốt.

**Tham chiếu:** `SE-047`.

### QK-038 — [Software Engineering] [Basic] — 1 điểm

**Câu hỏi:** Unit test, integration test và end-to-end test khác nhau về boundary, tốc độ, độ ổn định và loại lỗi phát hiện được thế nào?

**Đáp án kỳ vọng:** Unit test cô lập unit/logic nhỏ, nhanh và định vị lỗi tốt nhưng không chứng minh integration. Integration test dùng boundary thật quan trọng như database, broker hoặc HTTP adapter để bắt schema/config/protocol mismatch, chậm hơn. E2E đi qua hệ thống gần người dùng, bắt wiring/deployment/journey nhưng đắt, chậm và dễ flaky nên giữ ít kịch bản critical. Không đánh đồng “có mock” với unit; phân loại theo boundary và confidence cần đạt.

**Rubric (1 điểm):**

- **1 điểm:** So sánh đủ boundary, speed/stability và defect coverage của ba loại, kèm trade-off hợp lý.

**Tham chiếu:** `SE-052`.

### QK-039 — [Software Engineering] [Middle] — 2 điểm

**Câu hỏi:** Validation nên được phân bổ giữa client, API boundary, application/domain và database thế nào; format validation khác business invariant ở đâu?

**Đáp án kỳ vọng:** Client validation cải thiện UX nhưng không đáng tin. API boundary kiểm tra syntax, type, size, required, canonical form và từ chối payload xấu sớm. Application phối hợp use case/authorization; domain model giữ invariant phải đúng trong mọi entry point. Database là hàng rào cuối cho `NOT NULL`, `UNIQUE`, FK, CHECK và concurrency, vì nhiều writer/race có thể vượt validation trước đó. Format như email parse được khác invariant như “mỗi tenant chỉ có một email hoạt động”; invariant cần transaction/constraint, không chỉ annotation DTO. Tránh duplicate rule bằng shared semantics nhưng vẫn enforce ở nhiều trust boundary có mục đích.

**Rubric (2 điểm):**

- **1 điểm:** Phân bố đúng trách nhiệm ở client/boundary/domain/database và coi client là không tin cậy.
- **1 điểm:** Phân biệt format với invariant, nêu race/concurrency và defense-in-depth không mâu thuẫn.

**Tham chiếu:** `SE-055`.

### QK-040 — [Software Engineering] [Middle] — 2 điểm

**Câu hỏi:** Giải thích chu trình Red–Green–Refactor của TDD; khi nào test-first giúp thiết kế và khi nào tạo coupling hoặc chi phí không đáng có?

**Đáp án kỳ vọng:** Red viết một test nhỏ thất bại vì behavior chưa có; Green viết tối thiểu để pass; Refactor cải thiện design trong khi toàn bộ suite giữ behavior. TDD hữu ích cho logic có contract rõ, nhiều edge case và feedback nhanh; nó thúc đẩy API có thể kiểm thử. Giá trị thấp hơn ở spike khám phá, UI/third-party biến động hoặc boundary cần test thật đắt. Pitfall là mock implementation detail, viết test quá rộng trước khi hiểu problem, hoặc coi test là design duy nhất; nên test observable behavior, dùng integration test ở boundary và xóa test không còn mang signal.

**Rubric (2 điểm):**

- **1 điểm:** Mô tả đúng ba bước và vai trò safety net của refactor.
- **1 điểm:** Nêu use case phù hợp lẫn ít phù hợp, cùng pitfall coupling vào implementation/mocking.

**Tham chiếu:** `SE-056`.

### QK-041 — [Software Engineering] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Bạn phải đổi schema event đang có nhiều producer và consumer độc lập. Hãy phân biệt backward/forward compatibility và lập thứ tự rollout không làm gián đoạn hệ thống.

**Đáp án kỳ vọng:** Phải nói rõ viewpoint: backward-compatible reader mới đọc được event cũ; forward-compatible reader cũ chịu được event mới. Bắt đầu bằng thay đổi additive: field mới optional/default, consumer bỏ qua unknown field và schema registry/contract test chặn breaking change. Rollout consumer đọc cả old/new trước, sau đó producer ghi new (có thể dual-write/version envelope), quan sát lag/error và chỉ xóa field cũ khi mọi consumer cùng retained event/backfill đã qua cửa sổ. Rename/type change thường là add–migrate–remove, không sửa in-place. Có owner, compatibility matrix, canary, rollback và deadline deprecation.

**Rubric (3 điểm):**

- **1 điểm:** Định nghĩa backward/forward theo reader-writer cụ thể, không dùng thuật ngữ mơ hồ.
- **1 điểm:** Đưa rollout expand/dual-read-write/migrate/contract theo thứ tự tương thích.
- **1 điểm:** Có schema gate, telemetry, retained-data/backfill, rollback và deprecation governance.

**Tham chiếu:** `SE-058`.

### QK-042 — [Software Engineering] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Một kiến trúc modular đang suy thoái dần theo thời gian. Hãy áp dụng Evolutionary Architecture và fitness functions để phát hiện, chặn và chủ động tiến hóa nó.

**Đáp án kỳ vọng:** Xác định quality attributes/invariant cần giữ thay vì đóng băng sơ đồ: ví dụ module dependency acyclic, không import persistence từ domain, API compatibility, latency/cost/security budget. Biến chúng thành fitness functions chạy tự động: architecture tests/dependency graph, schema compatibility, benchmark/SLO, vulnerability/policy check và production metric. Đặt threshold, owner, exception có hạn dùng; baseline nợ hiện tại rồi giảm dần để CI không bị vô hiệu vì quá nhiều lỗi. Thay đổi kiến trúc qua small reversible steps, ADR/experiment/canary và đo outcome; fitness function cũng phải được review để tránh gaming hoặc tối ưu metric sai mục tiêu.

**Rubric (3 điểm):**

- **1 điểm:** Liên kết fitness functions với quality attributes/invariant có thể đo.
- **1 điểm:** Đưa ví dụ automation cả structural và runtime, kèm threshold/exception governance.
- **1 điểm:** Có lộ trình tiến hóa nhỏ, feedback production và nhận biết gaming/metric decay.

**Tham chiếu:** `SE-060`.

## 8. System Design — 12 điểm

### QK-043 — [System Design] [Basic] — 1 điểm

**Câu hỏi:** Latency và throughput khác nhau thế nào; vì sao tăng concurrency có thể tăng throughput nhưng đồng thời làm p99 latency xấu đi?

**Đáp án kỳ vọng:** Latency là thời gian một request hoàn tất; throughput là số work hoàn tất trên đơn vị thời gian. Tăng concurrency che thời gian chờ và dùng tài nguyên tốt hơn đến điểm saturation, nên throughput tăng. Sau đó queueing, contention, context switch, GC và downstream limit làm tail wait tăng mạnh; average có thể vẫn đẹp trong khi p99 xấu. Cần đo distribution theo tải và đặt concurrency/backpressure theo SLO, không tối đa hóa throughput đơn độc.

**Rubric (1 điểm):**

- **1 điểm:** Phân biệt đúng hai metric và giải thích saturation/queueing khiến tail latency tăng khi concurrency quá cao.

**Tham chiếu:** `SD-061`.

### QK-044 — [System Design] [Basic] — 1 điểm

**Câu hỏi:** Availability, reliability và durability khác nhau thế nào; cho một failure mode vi phạm từng thuộc tính.

**Đáp án kỳ vọng:** Availability là khả năng phục vụ đúng lúc được yêu cầu — service down vi phạm. Reliability là thực hiện chức năng đúng, ổn định qua thời gian — service trả kết quả sai/ngắt quãng dù endpoint còn up vi phạm. Durability là dữ liệu đã được xác nhận không bị mất — ACK write rồi mất sau disk/replica failure vi phạm. Redundancy có thể tăng availability nhưng không tự bảo đảm correctness hay durability nếu replicate corruption/delete.

**Rubric (1 điểm):**

- **1 điểm:** Định nghĩa và cho failure mode phân biệt được cả ba thuộc tính.

**Tham chiếu:** `SD-062`.

### QK-045 — [System Design] [Middle] — 2 điểm

**Câu hỏi:** Một pipeline analytics cần kết quả gần realtime nhưng vẫn phải backfill và tính lại chính xác. Batch và stream processing nên phối hợp thế nào về ordering, state và replay?

**Đáp án kỳ vọng:** Stream đọc durable log để cập nhật low-latency, dùng event time/watermark cho late event, checkpoint state và idempotent sink/dedup khi replay. Batch quét nguồn lịch sử authoritative để backfill/recompute, xử lý tập dữ liệu bounded với completeness cao. Tốt nhất tái dùng cùng business transform/semantic version để tránh hai kết quả khác nhau; output partition/version cho phép shadow rebuild rồi atomic switch. Ordering chỉ nên yêu cầu trong key/partition cần thiết; global order rất đắt. Theo dõi lag, lateness, checkpoint, duplicate và chênh lệch batch-stream.

**Rubric (2 điểm):**

- **1 điểm:** Phân vai stream realtime và batch backfill/recompute, xử lý state/event time/replay.
- **1 điểm:** Có idempotency/versioned rebuild, phạm vi ordering và reconciliation/telemetry.

**Tham chiếu:** `SD-069`.

### QK-046 — [System Design] [Middle] — 2 điểm

**Câu hỏi:** Distributed lock khác lease thế nào; vì sao TTL không đủ bảo đảm mutual exclusion khi process pause lâu, và fencing token giải quyết điều gì?

**Đáp án kỳ vọng:** Lock biểu đạt quyền độc quyền; lease là quyền có hạn và phải renew. Nếu holder bị GC pause/network partition lâu hơn TTL, lease hết và holder mới được cấp, nhưng holder cũ tỉnh lại vẫn có thể ghi — hai phía cùng tin mình hợp lệ. Fencing token tăng đơn điệu theo lần cấp; downstream resource chỉ chấp nhận token lớn hơn token đã thấy, nên reject write stale. TTL/clock vẫn ảnh hưởng liveness và renew, nhưng fencing chuyển correctness sang nơi thực hiện side effect. Nếu downstream không enforce token, “distributed lock có TTL” không đủ cho invariant quan trọng.

**Rubric (2 điểm):**

- **1 điểm:** Phân biệt lock/lease và mô tả đúng stale holder do pause/partition.
- **1 điểm:** Giải thích monotonic fencing token phải được downstream enforce cùng giới hạn/liveness trade-off.

**Tham chiếu:** `SD-072`.

### QK-047 — [System Design] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Thiết kế distributed rate limiter cho nhiều API gateway: key/quota, burst algorithm, consistency, failure policy và observability.

**Đáp án kỳ vọng:** Key theo tenant/API credential + route/cost class, chuẩn hóa và giới hạn cardinality; quota có hierarchy global/tenant/user. Token bucket phù hợp burst, sliding window chính xác hơn quanh boundary nhưng tốn state; có thể dùng atomic script/counter trong sharded store hoặc cấp local token budget để giảm latency với sai số định lượng. Chống hot key bằng partition/aggregation và clock theo server. Khi store lỗi, chọn fail-open với local emergency cap hay fail-closed theo risk endpoint; trả `429`, remaining/reset hoặc `Retry-After`. Đo allowed/denied, decision latency, store errors, skew, hot keys, queue wait và false rejection; rollout shadow/canary trước enforcement.

**Rubric (3 điểm):**

- **1 điểm:** Mô hình key/quota và thuật toán burst phù hợp, có chống cardinality/hot key.
- **1 điểm:** Giải quyết atomicity/consistency nhiều gateway, local budget và failure mode rõ.
- **1 điểm:** Có client contract, telemetry, capacity và rollout/shadow validation.

**Tham chiếu:** `SD-071`, `SD-074`.

### QK-048 — [System Design] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Thiết kế leaderboard cập nhật điểm liên tục, hỗ trợ top-N và rank quanh một người dùng; xử lý partition, tie-break, rebuild và hot key ra sao?

**Đáp án kỳ vọng:** Xác định scope/window và score semantics; dùng ordered index/sorted set theo `(score, tie-breaker)` với tie-breaker ổn định như thời điểm đạt điểm rồi user ID. Một board vừa kích thước có thể ở một shard; quy mô lớn partition theo season/region/league, giữ top-K per shard rồi merge cho global top. Rank quanh user cần rank-capable index hoặc bucket/approximation; cross-shard exact rank đắt. Update phải idempotent/versioned để tránh event duplicate/out-of-order. Rebuild từ durable event/score source vào version mới rồi swap; cache top-N, split celebrity/global hot board và đo lag, update/query latency, skew cùng divergence.

**Rubric (3 điểm):**

- **1 điểm:** Chọn ordered structure, score/tie-break contract và hỗ trợ top/rank đúng.
- **1 điểm:** Thiết kế partition/global merge cùng trade-off exact rank và hot-key mitigation.
- **1 điểm:** Có idempotent update, durable rebuild/version swap, cache và observability.

**Tham chiếu:** `SD-075`.

## 9. Infrastructure & Cloud — 12 điểm

### QK-049 — [Infra/Cloud] [Basic] — 1 điểm

**Câu hỏi:** TCP và UDP khác nhau về connection, reliability, ordering, flow/congestion control; chọn giao thức nào cho ba use case tiêu biểu?

**Đáp án kỳ vọng:** TCP là ordered reliable byte stream có connection, retransmission, flow và congestion control; UDP gửi datagram không bảo đảm delivery/order/uniqueness và không có các control đó ở transport, đổi lại ít handshake/state hơn. HTTPS truyền thống dùng TCP vì cần stream tin cậy; DNS query nhỏ thường dùng UDP nhưng fallback TCP khi cần; realtime voice/game có thể dùng UDP và tự chọn loss/jitter policy. QUIC chạy trên UDP nhưng tự cung cấp reliability/congestion/TLS ở tầng trên, nên “UDP” không đồng nghĩa ứng dụng không tin cậy.

**Rubric (1 điểm):**

- **1 điểm:** Phân biệt đúng semantics và chọn ba use case có lý do, không tuyên bố tuyệt đối “TCP chậm, UDP nhanh”.

**Tham chiếu:** `INF-046`.

### QK-050 — [Infra/Cloud] [Basic] — 1 điểm

**Câu hỏi:** Một hostname truy cập không được: `ping`, `traceroute`, `nslookup`/`dig`, `curl` và `netstat`/`ss` giúp khoanh vùng những lớp lỗi nào?

**Đáp án kỳ vọng:** `dig`/`nslookup` kiểm tra resolution, record và resolver; `ping` thử ICMP reachability/latency nhưng bị chặn không chứng minh host chết; `traceroute` gợi ý path/hop nơi traffic dừng nhưng cũng chịu filtering. `curl -v`/`--resolve` quan sát DNS, TCP, TLS, HTTP status/header và giúp tách từng lớp. `ss`/`netstat` trên host kiểm tra process có listen đúng address/port và connection state. Nên bắt đầu từ tên → route/port → TLS → HTTP, so sánh từ đúng network namespace, không dựa một tool để kết luận.

**Rubric (1 điểm):**

- **1 điểm:** Ánh xạ đúng công cụ với DNS/network/local socket/TLS-HTTP và nhận ra giới hạn của ping/traceroute.

**Tham chiếu:** `INF-050`.

### QK-051 — [Infra/Cloud] [Middle] — 2 điểm

**Câu hỏi:** Linux load average đo gì; vì sao load cao có thể xảy ra khi CPU chưa 100%, và bạn đọc thêm metric nào trước khi kết luận?

**Đáp án kỳ vọng:** Load average 1/5/15 phút xấp xỉ số task runnable và task ở uninterruptible sleep, thường do I/O; nó không phải phần trăm CPU. So với số logical CPU để có bối cảnh, nhưng workload I/O blocked có thể làm load cao khi CPU idle. Kiểm tra run queue, per-core utilization, iowait, disk latency/queue, memory pressure/swap, PSI, network/storage và process/thread state. Container/cgroup còn cần xem quota/throttling và host scope. Kết luận dựa trend và SLO, không dùng ngưỡng “load > số core luôn xấu” máy móc.

**Rubric (2 điểm):**

- **1 điểm:** Định nghĩa runnable + uninterruptible tasks và giải thích load cao không đồng nghĩa CPU 100%.
- **1 điểm:** Chọn metric chẩn đoán CPU/I/O/memory/cgroup phù hợp và đặt trong bối cảnh core/trend.

**Tham chiếu:** `INF-053`.

### QK-052 — [Infra/Cloud] [Middle] — 2 điểm

**Câu hỏi:** Trong Dockerfile, `CMD` và `ENTRYPOINT` phối hợp thế nào; exec form khác shell form ra sao về argument, PID 1 và signal khi shutdown?

**Đáp án kỳ vọng:** `ENTRYPOINT` xác định executable chính; `CMD` cung cấp default command hoặc default arguments và dễ bị override lúc chạy. Với exec form JSON, executable trở thành PID 1 trực tiếp, nhận signal và arguments không qua shell expansion. Shell form chạy qua `/bin/sh -c`; shell có thể nuốt/không forward signal nếu không `exec`, đồng thời quoting và environment expansion khác. Mẫu phổ biến là exec-form `ENTRYPOINT` + exec-form `CMD` cho default args. Process PID 1 vẫn phải handle SIGTERM/reap child hoặc dùng init phù hợp; Kubernetes command/args override semantics phải được test.

**Rubric (2 điểm):**

- **1 điểm:** Phân biệt vai trò/override của `ENTRYPOINT` và `CMD`.
- **1 điểm:** Giải thích exec/shell form đối với PID 1, signal, argument cùng pitfall shutdown thực tế.

**Tham chiếu:** `INF-055`.

### QK-053 — [Infra/Cloud] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Từ lúc gửi một Kubernetes Deployment đến khi Pod nhận traffic, hãy lần theo API Server, etcd, controller, scheduler, kubelet, CNI và Service routing; nêu điểm quan sát khi Pod không Ready.

**Đáp án kỳ vọng:** API Server authn/authz/admission rồi persist desired state vào etcd. Deployment controller tạo/điều chỉnh ReplicaSet; ReplicaSet controller tạo Pod. Scheduler watch Pod chưa bind, lọc/chấm node rồi ghi binding. Kubelet trên node gọi container runtime kéo image/tạo container và CNI cấu hình network; kubelet chạy probes, cập nhật Pod status. Khi readiness pass, EndpointSlice controller đưa Pod IP vào endpoint của Service; kube-proxy hoặc dataplane CNI/eBPF lập routing/load-balancing. Chẩn đoán theo conditions/events: admission/quota, pending scheduling, image/volume/CNI, container logs, readiness probe, EndpointSlice và dataplane; không chỉ restart Pod.

**Rubric (3 điểm):**

- **1 điểm:** Lần đúng control-plane flow API Server–etcd–controllers–scheduler.
- **1 điểm:** Lần đúng node/data-plane flow kubelet/runtime/CNI–readiness–EndpointSlice/Service routing.
- **1 điểm:** Đưa cây quan sát theo condition/event/log/network để định vị Pod không Ready.

**Tham chiếu:** `INF-058`.

### QK-054 — [Infra/Cloud] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Lập kế hoạch nâng cấp node Kubernetes không downtime: kiểm tra compatibility, surge capacity, cordon/drain, PDB, stateful workload và rollback.

**Đáp án kỳ vọng:** Kiểm tra version-skew/API deprecation, addon/CNI/CSI, workload và backup/restore; nâng control plane theo support matrix trước node. Tạo canary node pool phiên bản mới và surge capacity đủ để reschedule cả request lẫn topology constraint. Cordon rồi drain từng node, tôn trọng PDB, grace period, local storage và DaemonSet; PDB sai hoặc replica=1 phải được sửa/đàm phán maintenance trước, không force drain mù. Stateful workload cần replication, volume attach/fencing và quorum test. Theo dõi SLO, Pending/eviction/error theo wave; rollback bằng giữ node pool/image cũ và workload compatibility, nhưng database/state migration cần kế hoạch riêng vì không luôn đảo ngược.

**Rubric (3 điểm):**

- **1 điểm:** Có preflight compatibility/deprecation/addon và canary/surge capacity.
- **1 điểm:** Drain theo wave với PDB, scheduling constraint và stateful/quorum safety đúng.
- **1 điểm:** Định nghĩa SLO/stop condition, rollback thực tế và không dùng force như mặc định.

**Tham chiếu:** `INF-060`.

## 10. DevOps & Observability — 12 điểm

### QK-055 — [DevOps/Observability] [Basic] — 1 điểm

**Câu hỏi:** `git merge` và `git rebase` khác nhau về lịch sử và conflict; vì sao không nên rebase tùy tiện một branch đã chia sẻ?

**Đáp án kỳ vọng:** Merge kết hợp hai histories và thường tạo merge commit, giữ commit identity/topology. Rebase replay commit lên base mới, tạo commit SHA mới và lịch sử tuyến tính; conflict được giải khi replay từng commit. Rebase branch đã chia sẻ làm đồng đội còn trỏ tới history cũ, gây divergence/duplicate và buộc force push. Có thể rebase local/private branch trước khi publish; shared branch nên merge hoặc phối hợp rõ với `--force-with-lease`, không dùng force mù.

**Rubric (1 điểm):**

- **1 điểm:** Nêu đúng topology/commit rewrite, cách conflict và rủi ro rebase shared history.

**Tham chiếu:** `DO-051`.

### QK-056 — [DevOps/Observability] [Basic] — 1 điểm

**Câu hỏi:** Monitoring và observability khác nhau thế nào; vì sao nhiều dashboard vẫn chưa bảo đảm có thể chẩn đoán một failure chưa biết trước?

**Đáp án kỳ vọng:** Monitoring theo dõi câu hỏi/failure mode đã biết qua metric, check và alert. Observability là khả năng suy ra internal state từ outputs đủ giàu để đặt câu hỏi mới, thường nhờ metrics, logs, traces, profiles và context tương quan. Dashboard chỉ là view của các tín hiệu đã chọn; nếu thiếu high-cardinality dimensions an toàn, trace propagation, structured events hoặc ownership/runbook thì failure mới vẫn mù. Observability không có nghĩa “thu mọi thứ”: cần SLO/use case, sampling, retention và cost control.

**Rubric (1 điểm):**

- **1 điểm:** Phân biệt known checks với khả năng điều tra unknowns và nêu vì sao dashboard/telemetry volume đơn thuần chưa đủ.

**Tham chiếu:** `DO-056`.

### QK-057 — [DevOps/Observability] [Middle] — 2 điểm

**Câu hỏi:** CI build chỉ fail trên runner nhưng chạy được ở máy developer. Hãy lập thứ tự kiểm tra dependency, environment, timing, cache và resource để tìm nguyên nhân có thể tái hiện.

**Đáp án kỳ vọng:** Giữ log/artifact và tái chạy cùng commit trên clean runner; so sánh pinned toolchain, lockfile, OS/architecture, locale/timezone, environment/config và network dependency mà không lộ secret. Tắt cache rồi phục hồi từng lớp, kiểm tra untracked/generated file và build có phụ thuộc thứ tự hay clock/randomness. Quan sát CPU/memory/disk/PID limit, parallelism và timeout để tìm race/OOM. Đóng gói hermetic container/dev image hoặc script bootstrap để local chạy cùng environment; khi thu nhỏ được reproducer, thêm regression test và pin digest thay vì “rerun đến xanh”.

**Rubric (2 điểm):**

- **1 điểm:** Có quy trình so sánh clean/pinned dependency, environment và cache một cách cô lập.
- **1 điểm:** Điều tra timing/resource/nondeterminism, tạo reproducer và sửa tính hermetic thay vì chỉ retry.

**Tham chiếu:** `DO-060`.

### QK-058 — [DevOps/Observability] [Middle] — 2 điểm

**Câu hỏi:** Alert fatigue hình thành như thế nào; quy trình nào giảm noise mà không che mất incident thật và dùng metric gì để biết alert đã tốt hơn?

**Đáp án kỳ vọng:** Fatigue đến từ alert không actionable, threshold tĩnh, duplicate symptom, flapping, thiếu owner/runbook và page cho mọi anomaly. Inventory alert theo lịch sử, nối mỗi page với user impact/SLO và hành động khẩn; xóa/downgrade ticket alert không cần đánh thức, dedup/group/inhibit downstream symptom, thêm duration/hysteresis và bảo đảm coverage bằng black-box/SLO alert. Review sau incident và test routing/silence expiry. Đo pages/on-call shift, actionable rate, false positive, acknowledgment/mitigation time và incident bị bỏ sót; giảm số page mà MTTA tăng hoặc miss incident không phải thành công.

**Rubric (2 điểm):**

- **1 điểm:** Chỉ ra nguồn noise và quy trình phân loại actionable/page so với ticket/dash.
- **1 điểm:** Có kỹ thuật dedup/tuning/coverage cùng metric cân bằng noise với missed incident/MTTA.

**Tham chiếu:** `DO-062`.

### QK-059 — [DevOps/Observability] [Senior/Scenario] — 3 điểm

**Câu hỏi:** CI/CD control plane unavailable trong lúc cần hotfix production. Thiết kế quy trình break-glass về quyền, artifact, kiểm chứng, audit và thu hồi sau sự cố.

**Đáp án kỳ vọng:** Chuẩn bị trước một đường deploy tối thiểu độc lập, chỉ người trực được ủy quyền mới kích hoạt bằng JIT/short-lived credential, MFA và tốt nhất hai người phê duyệt. Chỉ deploy immutable artifact đã build trước trong trusted repository; kiểm digest/signature/provenance và config diff, không build laptop. Ghi audit bất biến người-lý do-lệnh-artifact-target, canary theo health/SLO và có rollback đã thử. Sau incident revoke/expire quyền, reconcile actual state về IaC/CD, review mọi thao tác và diễn tập định kỳ. Break-glass không được bỏ security gate cốt lõi hoặc trở thành đường deploy thường xuyên.

**Rubric (3 điểm):**

- **1 điểm:** Thiết kế quyền JIT/MFA/two-person với scope và trigger rõ.
- **1 điểm:** Chỉ dùng artifact bất biến đã xác minh, canary/health gate và rollback.
- **1 điểm:** Audit độc lập, credential revocation, state reconciliation và drill/post-review.

**Tham chiếu:** `DO-064`.

### QK-060 — [DevOps/Observability] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Sau một release, bạn nghi pipeline đã bị compromise. Hãy nêu thứ tự containment, xác minh provenance, rotate identity, đánh giá blast radius và rebuild trust chain.

**Đáp án kỳ vọng:** Dừng promotion/deploy và cô lập runner/control path nghi ngờ nhưng bảo toàn log, disk snapshot và audit evidence; không xóa dấu vết. Xác định artifact/digest, provenance/signature, source commit, dependency/SBOM và mọi môi trường đã nhận artifact; rollback/quarantine theo risk. Revoke runner token, deploy credential, signing key và secret có thể truy cập, rotate từ clean trusted root — không dùng chính pipeline bị nghi để rotate. Rebuild runner/CI state từ known-good image, review source/dependency, tạo artifact mới hermetic, ký bằng key mới và verify ở admission/deploy. Hunt persistence, thông báo stakeholder, theo dõi IOC và chỉ mở lại từng stage khi trust assumption được chứng minh.

**Rubric (3 điểm):**

- **1 điểm:** Contain có bảo toàn evidence và khoanh artifact/environment blast radius.
- **1 điểm:** Xác minh provenance rồi revoke/rotate identity từ clean root theo thứ tự an toàn.
- **1 điểm:** Rebuild và attest trust chain end-to-end, kiểm ở consumer, hunt/monitor và staged recovery.

**Tham chiếu:** `DO-065`.

## 11. Security — 12 điểm

### QK-061 — [Security] [Basic] — 1 điểm

**Câu hỏi:** Input validation, canonicalization, sanitization và output encoding khác nhau thế nào; mỗi kỹ thuật thuộc trust boundary hoặc sink nào?

**Đáp án kỳ vọng:** Canonicalization đưa nhiều biểu diễn về một dạng trước khi so sánh/validate nhưng phải tránh decode lặp. Validation tại trust boundary chấp nhận dữ liệu theo allowlist/type/range/business format. Sanitization cố biến nội dung nguy hiểm thành tập con an toàn và chỉ phù hợp khi thực sự cần giữ rich content. Output encoding diễn giải dữ liệu thành text an toàn cho đúng sink/context như HTML, attribute, URL hay JavaScript; không encode một lần rồi dùng mọi nơi. Với SQL dùng parameterization, không coi sanitization/encoding là thay thế.

**Rubric (1 điểm):**

- **1 điểm:** Phân biệt đủ bốn kỹ thuật, gắn validation với boundary và encoding/parameterization với đúng sink/context.

**Tham chiếu:** `SEC-052`.

### QK-062 — [Security] [Basic] — 1 điểm

**Câu hỏi:** Các thuộc tính cookie `Secure`, `HttpOnly`, `SameSite`, `Domain`, `Path` và `Max-Age` kiểm soát điều gì, và thuộc tính nào không thể thay thế CSRF defense hoàn chỉnh?

**Đáp án kỳ vọng:** `Secure` chỉ gửi qua HTTPS; `HttpOnly` ngăn JavaScript đọc cookie nhưng không chặn browser tự gửi; `SameSite` giới hạn cross-site send (`Strict`/`Lax`/`None`, với `None` cần `Secure`). `Domain`/`Path` quyết định scope gửi chứ không phải authorization boundary mạnh; bỏ `Domain` tạo host-only cookie hẹp hơn. `Max-Age`/`Expires` quyết định persistence. SameSite giảm CSRF nhưng không thay token/origin check cho mọi flow, và HttpOnly không ngăn CSRF.

**Rubric (1 điểm):**

- **1 điểm:** Nêu đúng tác dụng các thuộc tính và nói rõ SameSite/HttpOnly không thay thế CSRF defense đầy đủ.

**Tham chiếu:** `SEC-053`.

### QK-063 — [Security] [Middle] — 2 điểm

**Câu hỏi:** Session fixation là gì; vì sao phải rotate session ID sau login hoặc privilege change, và còn phải xử lý session cũ thế nào?

**Đáp án kỳ vọng:** Kẻ tấn công khiến nạn nhân dùng một session ID mà hắn biết trước; nếu server giữ nguyên ID khi nạn nhân login, hắn tái sử dụng ID đó để chiếm session đã xác thực. Sau authentication và mỗi privilege elevation, tạo ID mới bằng CSPRNG, chuyển tối thiểu state hợp lệ rồi invalidate record/ID cũ atomically. Không nhận session ID từ URL, đặt cookie an toàn và giới hạn lifetime. Rotation phải tránh race giữa request đồng thời, revoke session liên quan khi logout/password reset theo policy và log anomaly mà không log token thô.

**Rubric (2 điểm):**

- **1 điểm:** Giải thích đúng attack flow và lý do rotate tại auth/privilege boundary.
- **1 điểm:** Invalidate ID cũ, bảo vệ cookie/lifetime và xử lý race/revocation thay vì chỉ đổi cookie phía client.

**Tham chiếu:** `SEC-058`.

### QK-064 — [Security] [Middle] — 2 điểm

**Câu hỏi:** BOLA/IDOR khác Broken Function Level Authorization thế nào; hãy phác thảo authorization matrix test theo subject, object, action và tenant.

**Đáp án kỳ vọng:** BOLA/IDOR xảy ra khi user được gọi chức năng nhưng truy cập object không thuộc quyền, ví dụ đổi `orderId`. BFLA là gọi cả chức năng/endpoint không dành cho role đó, ví dụ user thường gọi admin refund. Matrix liệt kê subject/role, tenant, object ownership/state và action; mỗi allow case có deny pair: object của user khác, tenant khác, role thấp hơn, object không tồn tại/trạng thái sai và bulk/list/export. Server authorize sau khi resolve object bằng identity tin cậy, default-deny và filter query theo tenant; không dựa UI ẩn nút hay ID khó đoán. Test cả direct HTTP và alternate method/route.

**Rubric (2 điểm):**

- **1 điểm:** Phân biệt object-level với function-level authorization bằng ví dụ đúng.
- **1 điểm:** Matrix có subject/object/action/tenant, positive + negative cases và enforcement server-side default-deny.

**Tham chiếu:** `SEC-060`.

### QK-065 — [Security] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Một service quyền cao nhận yêu cầu thay mặt người dùng rồi truy cập service khác. Threat-model Confused Deputy và thiết kế audience, capability cùng authorization context để ngăn lạm quyền.

**Đáp án kỳ vọng:** Deputy có credential mạnh có thể bị caller dụ dùng quyền của service cho resource/action caller không được phép, nhất là khi chỉ truyền object ID. Downstream phải phân biệt service identity và end-user/tenant context, validate issuer, signature, expiry, audience cùng authorized party; token cho service B không được replay sang C. Dùng on-behalf-of/downscoped capability chứa resource/action/tenant tối thiểu, hoặc service B tự authorize từ claims + authoritative ownership; không tin header do client tự đặt. Bind request to intent, chống replay/idempotency và log cả actor lẫn subject/delegation chain. Đánh giá cache authorization, async jobs và retries vì context dễ bị mất ở boundary đó.

**Rubric (3 điểm):**

- **1 điểm:** Mô tả đúng deputy dùng quyền cao thay caller và xác định actor/subject/resource threat.
- **1 điểm:** Thiết kế audience validation, downscoped capability/delegation và server-side authorization context.
- **1 điểm:** Bao phủ replay/async/cache, least privilege, audit chain và không tin client-supplied context.

**Tham chiếu:** `SEC-064`.

### QK-066 — [Security] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Một workflow hoàn tiền có các endpoint hợp lệ riêng lẻ nhưng có thể bị gọi sai thứ tự, lặp hoặc bỏ bước. Bạn bảo vệ business logic và kiểm thử abuse case như thế nào?

**Đáp án kỳ vọng:** Mô hình hóa server-side state machine với transition allowlist và invariant tiền tệ/quyền hạn; client không được tự khai state kế tiếp. Mỗi transition authorize actor, tenant, amount và current version; dùng transaction + compare-and-swap/lock để hai request đồng thời chỉ một thắng. Idempotency key chống lặp, ledger append-only và outbox giữ audit/side effect; approval token/capability phải bound với case, amount, action, expiry và single use. Test model/abuse sequence: skip, reorder, replay, concurrent duplicate, đổi amount/tenant sau approve, retry sau timeout và race cancellation/refund. Monitor denied transition và reconcile với payment provider.

**Rubric (3 điểm):**

- **1 điểm:** Có state machine/invariant và authorization lại ở từng transition, không tin thứ tự UI.
- **1 điểm:** Chống concurrency/replay bằng atomic versioning, idempotency, bound capability và ledger/outbox.
- **1 điểm:** Abuse tests bao phủ skip/reorder/duplicate/race/tamper cùng audit, detection và reconciliation.

**Tham chiếu:** `SEC-065`.

## 12. Behavioral & Leadership — 12 điểm

> Các mục dưới đây không cung cấp câu chuyện mẫu. Người làm bài phải dùng trải nghiệm thật; rubric chấm độ rõ của STAR, phạm vi đóng góp cá nhân, impact và reflection, không chấm việc “đoán đúng” một câu chuyện lý tưởng.

### QK-067 — [Behavioral/Leadership] [Basic] — 1 điểm

**Câu hỏi:** Hãy giới thiệu hành trình nghề nghiệp của bạn trong khoảng hai phút và nối các trải nghiệm quan trọng với vai trò đang ứng tuyển.

**Đáp án kỳ vọng:** Một câu trả lời thật, có cấu trúc hiện tại → 2–3 bước ngoặt liên quan → lý do bước tiếp theo. Nêu phạm vi, công nghệ/domain và một bằng chứng impact tiêu biểu thay vì đọc lại toàn bộ CV; kết thúc bằng liên hệ cụ thể với outcome của vai trò. Không bịa con số hay vai trò, và sẵn sàng đào sâu mọi claim.

**Rubric (1 điểm):**

- **1 điểm:** Mạch nghề nghiệp ngắn, nhất quán, có bằng chứng thật và liên hệ rõ với vai trò; lan man hoặc chỉ liệt kê công nghệ tối đa 0,5 điểm.

**Tham chiếu:** `BEH-001`.

### QK-068 — [Behavioral/Leadership] [Basic] — 1 điểm

**Câu hỏi:** Hãy kể một thất bại hoặc sai lầm đáng kể: phần trách nhiệm của bạn, cách khắc phục và thay đổi hành vi sau đó.

**Đáp án kỳ vọng:** Chọn trải nghiệm thật đủ đáng kể nhưng có thể trình bày an toàn. Nêu Situation/Task ngắn, nói rõ quyết định/hành động cá nhân dẫn đến vấn đề mà không đổ lỗi, rồi mô tả containment/correction, impact quan sát được và cơ chế/hành vi đã thay đổi. Reflection phải cụ thể và có tín hiệu cho thấy thay đổi tồn tại lâu hơn lời hứa.

**Rubric (1 điểm):**

- **1 điểm:** Có STAR thật, ownership rõ, impact/cách khắc phục và reflection được chứng minh; câu chuyện né trách nhiệm hoặc “điểm yếu giả” tối đa 0,5 điểm.

**Tham chiếu:** `BEH-004`.

### QK-069 — [Behavioral/Leadership] [Middle] — 2 điểm

**Câu hỏi:** Hãy kể một lần bạn sở hữu kết quả end-to-end vượt ngoài việc viết code: success metric, rủi ro, phối hợp và trách nhiệm vận hành của bạn là gì?

**Đáp án kỳ vọng:** Dùng một ví dụ thật và phân biệt rõ đóng góp “tôi” với “team”. STAR nên cho thấy ứng viên làm rõ outcome/metric, chủ động dependency và rủi ro, ra quyết định/đánh đổi, tổ chức rollout rồi theo dõi production thay vì kết thúc ở merge. Kết quả có baseline/after hoặc bằng chứng định tính đáng tin; reflection nêu điều sẽ làm khác, không phóng đại quyền hạn.

**Rubric (2 điểm):**

- **1 điểm:** Situation/Task rõ, ownership cá nhân và actions xuyên discovery–delivery–rollout/operations có bằng chứng.
- **1 điểm:** Có impact so với success metric, trade-off/rủi ro và reflection cụ thể từ trải nghiệm thật.

**Tham chiếu:** `BEH-013`.

### QK-070 — [Behavioral/Leadership] [Middle] — 2 điểm

**Câu hỏi:** Hãy kể một production incident nghiêm trọng bạn tham gia: bạn giảm impact, phối hợp điều tra và biến bài học thành thay đổi bền vững thế nào?

**Đáp án kỳ vọng:** Dùng incident thật, nêu severity/user impact và vai trò chính xác. Tách hành động mitigation khỏi root-cause investigation: bảo vệ người dùng, thiết lập command/communication, dùng timeline/evidence và tránh thay đổi đồng thời không kiểm soát. Sau phục hồi, chỉ ra contributing conditions thay vì blame, action item có owner/verification và impact như MTTR, recurrence hoặc coverage. Reflection phải nói quyết định nào tốt/chưa tốt và cách ứng viên thay đổi playbook.

**Rubric (2 điểm):**

- **1 điểm:** STAR thể hiện mitigation ưu tiên impact, coordination/communication và điều tra dựa evidence.
- **1 điểm:** Có kết quả đo được, prevention được verify và reflection/accountability không đổ lỗi.

**Tham chiếu:** `BEH-015`.

### QK-071 — [Behavioral/Leadership] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Hãy dùng một trải nghiệm thật để trình bày cách bạn xây hoặc thay đổi technical strategy phục vụ mục tiêu kinh doanh dài hạn, gồm assumptions, bets, guardrails và kết quả.

**Đáp án kỳ vọng:** Câu chuyện thật phải nối business outcome với technical diagnosis, constraints và time horizon; strategy không chỉ là danh sách công nghệ. Ứng viên nêu assumptions cần kiểm chứng, các bet/option đã cân nhắc, tiêu chí bỏ/tiếp tục và guardrail về reliability, security, cost hoặc migration. Actions cho thấy tạo alignment và sequencing qua nhiều mốc; result gồm leading/adoption metric lẫn business/technical impact. Reflection nêu assumption sai, trade-off hoặc cách strategy đã được cập nhật khi có dữ liệu mới.

**Rubric (3 điểm):**

- **1 điểm:** Context/outcome dài hạn và diagnosis/assumptions từ trải nghiệm thật, phạm vi cá nhân rõ.
- **1 điểm:** Có options/bets, guardrails, stakeholder alignment và roadmap có thể điều chỉnh.
- **1 điểm:** Impact/adoption đo được cùng reflection về trade-off, tín hiệu mới hoặc điều sẽ thay đổi.

**Tham chiếu:** `BEH-026`.

### QK-072 — [Behavioral/Leadership] [Senior/Scenario] — 3 điểm

**Câu hỏi:** Hãy dùng một trải nghiệm thật về thay đổi tổ chức hoặc kỹ thuật quy mô lớn: bạn quản resistance, communication, migration, adoption metric và điều chỉnh roadmap ra sao?

**Đáp án kỳ vọng:** Chọn thay đổi thật có nhiều nhóm/người dùng và giải thích vì sao cần thay đổi, ai bị ảnh hưởng, nguồn resistance hợp lý nào tồn tại. Actions nên gồm lắng nghe/coalition, communication theo audience, pilot và migration theo wave với owner, hỗ trợ, rollback cùng decision log; không đánh đồng phản đối với “không chịu thay đổi”. Đo adoption và outcome chứ không chỉ số buổi training; dùng feedback/incident/cost để sửa roadmap. Kết thúc bằng impact, phần chưa đạt và reflection về influence, pacing hoặc cơ chế duy trì sau khi ứng viên rời điểm nóng.

**Rubric (3 điểm):**

- **1 điểm:** Situation/scale/stakeholder và resistance được mô tả thật, công bằng, vai trò cá nhân rõ.
- **1 điểm:** Actions có coalition/communication, pilot–migration–rollback và quản rủi ro theo wave.
- **1 điểm:** Có adoption/outcome metric, điều chỉnh dựa feedback và reflection về tính bền vững/trade-off.

**Tham chiếu:** `BEH-036`.
