# Đáp án phỏng vấn .NET & ASP.NET Core — Middle & Senior

> Mỗi mục lặp nguyên văn câu hỏi trong `dotnet_aspnet.md`. “Kỳ vọng” là dấu hiệu nhận biết độ sâu của câu trả lời, không phải đáp án duy nhất.

## 1. CLR, JIT và Garbage Collector

### NET-001 [Middle]

**Câu hỏi:** Từ mã C# đến lúc chạy, compiler, IL, CLR và JIT phối hợp với nhau như thế nào?

**Trả lời:** Compiler C# kiểm tra kiểu và phát IL+CIL metadata vào assembly. CLR nạp/xác minh metadata, resolve type/member, quản lý GC, exception, threading; JIT biên dịch IL của method thành native code khi cần. Runtime có thể dùng tiering, precompiled ReadyToRun hoặc AOT, nên “mỗi method luôn JIT đúng một lần” không phải quy tắc tuyệt đối.

**Pitfall/trade-off:** IL vẫn phụ thuộc runtime/target framework; reflection/dynamic loading có thể trì hoãn lỗi. Debug và Release khác optimization.

**Kỳ vọng:** Middle mô tả pipeline đúng; Senior bổ sung loader, tiered compilation và generic specialization.

### NET-002 [Senior]

**Câu hỏi:** Tiered compilation, ReadyToRun, dynamic PGO và Native AOT khác nhau về startup, throughput, kích thước và tính tương thích ra sao?

**Trả lời:** Tiering chạy code compile nhanh trước rồi re-JIT hot method tối ưu; dynamic PGO dùng profile runtime để inline/devirtualize tốt hơn. ReadyToRun chứa native code sẵn để cải thiện startup nhưng vẫn có thể JIT lại và tăng artifact size. Native AOT tạo executable native đóng, startup/memory tốt và không cần JIT, nhưng hạn chế reflection/dynamic code, plugin/loading và cần trimming compatibility.

**Pitfall/trade-off:** R2R có thể cho code quality thấp hơn tier-1; AOT không mặc định nhanh hơn mọi workload và code size/generic expansion có thể lớn. Phải benchmark publish mode thực.

**Kỳ vọng:** Senior chọn theo startup, steady-state, deployment và closed-world assumptions thay vì xem AOT là nâng cấp miễn phí.

### NET-003 [Middle]

**Câu hỏi:** GC theo thế hệ hoạt động thế nào; Gen 0/1/2, LOH và promotion phản ánh giả định gì về lifetime object?

**Trả lời:** GC dựa trên giả định phần lớn object chết trẻ: object mới vào Gen 0, survivor được promote qua Gen 1 đến Gen 2; collection trẻ nhanh và thường xuyên hơn. Object lớn thường vào LOH, được thu cùng Gen 2 và compaction có policy riêng. Promotion không phải “di chuyển vào vùng cố định” trong mọi chi tiết implementation, mà biểu thị tuổi sống qua collection.

**Pitfall/trade-off:** Nhiều survivor/LOH allocation kéo theo full GC đắt; pooling quá mức lại giữ memory lâu. Không gọi `GC.Collect` như tối ưu mặc định.

**Kỳ vọng:** Middle hiểu generational hypothesis; Senior liên hệ allocation rate, survival, pause và fragmentation.

### NET-004 [Senior]

**Câu hỏi:** Workstation GC, Server GC, background GC và latency mode nên được lựa chọn/điều chỉnh theo workload nào?

**Trả lời:** Workstation ưu tiên footprint/responsiveness cho client hoặc workload nhỏ; Server GC dùng heap/GC thread theo logical CPU để tăng throughput cho server đa core nhưng thường tốn memory hơn. Background GC cho phép managed threads chạy trong phần lớn Gen 2 collection; latency modes đổi cân bằng pause, throughput và memory trong cửa sổ có kiểm soát.

**Pitfall/trade-off:** Container CPU/memory limits làm lựa chọn khác bare metal; low-latency kéo dài có thể làm heap phình hoặc allocation fail. Đừng chỉnh nếu chưa có trace pause/allocation.

**Kỳ vọng:** Senior kiểm chứng bằng GC counters/trace dưới resource limits và SLO thực.

### NET-005 [Senior]

**Câu hỏi:** GC roots, finalization queue, resurrection và `GC.SuppressFinalize` liên quan với nhau như thế nào?

**Trả lời:** Object reachable từ root không được thu. Object có finalizer được đăng ký; khi unreachable, nó được đưa vào hàng chờ ready-for-finalization và sống thêm ít nhất một chu kỳ trước khi finalizer chạy. Finalizer có thể resurrection bằng cách lưu `this` vào root, làm lifetime khó đoán. Dispose thành công gọi `GC.SuppressFinalize(this)` để tránh chi phí fallback.

**Pitfall/trade-off:** Thứ tự finalizer không bảo đảm; không dựa vào managed dependency khác còn sống. Ưu tiên SafeHandle và không resurrection.

**Kỳ vọng:** Senior giải thích two-phase lifetime, root path và vì sao finalizable object tăng pressure.

### NET-006 [Senior]

**Câu hỏi:** LOH fragmentation, pinning và Pinned Object Heap ảnh hưởng thế nào đến pause time và memory footprint?

**Trả lời:** Allocation lớn đi vào LOH; các block sống/chết xen kẽ tạo free holes và footprint cao dù live bytes thấp. Pinning ngăn compaction/movement, có thể phân mảnh moving heap. POH tách object được cấp phát pinned có chủ ý khỏi generational heaps để giảm tác động, nhưng memory vẫn phải quản lý và không tự chữa lifetime dài/cache không giới hạn.

**Pitfall/trade-off:** Bật LOH compaction có thể tạo pause lớn; pooling buffer lớn giảm churn nhưng giữ working set. Dùng heap dump/GC trace xác định size distribution và pin sources trước.

**Kỳ vọng:** Senior cân nhắc copy-vs-pin, pool limits và pause budget dựa trên số đo.

### NET-007 [Middle]

**Câu hỏi:** Thread pool của .NET quản lý worker thread và I/O completion ra sao; dấu hiệu thread-pool starvation là gì?

**Trả lời:** Thread pool tái dùng worker cho work items/continuations; async I/O thường hoàn tất qua OS completion rồi xếp continuation, không giữ một worker suốt thời gian chờ. Pool điều chỉnh thread theo thuật toán hill-climbing/injection. Starvation có queue length tăng, request latency tăng, thread count tăng chậm/cao, CPU có thể thấp và stacks cho thấy nhiều worker bị block.

**Pitfall/trade-off:** Tăng minimum threads có thể giảm triệu chứng ngắn hạn nhưng tăng context switch và che sync-over-async/lock/I/O blocking.

**Kỳ vọng:** Middle nhận biết blocking; Senior dùng runtime counters/dump và sửa nguồn block.

### NET-008 [Senior — Tình huống]

**Câu hỏi:** Một service có allocation rate rất cao, Gen 2 collection liên tục và latency p99 tăng; bạn sẽ thu thập bằng chứng và xử lý theo thứ tự nào?

**Trả lời:** Ghi baseline request rate/p50-p99, allocation/sec, heap/LOH size, pause time/% time in GC và container limits. Thu GC trace + allocation stacks/heap snapshots ở thời điểm đại diện; xác định type/dominator và lý do survivor (cache, queue, event, buffer). Sửa retention trước, rồi giảm hot allocations/materialization/temporary strings, điều chỉnh buffer/pool có giới hạn. Load test cùng distribution và đặt regression metric.

**Pitfall/trade-off:** Full dump gây overhead/dữ liệu nhạy cảm; pooling có thể đổi allocation thành retained memory. Tuning GC trước khi sửa object lifetime thường chỉ dời vấn đề.

**Kỳ vọng:** Senior liên kết allocation→survival→Gen2/pause bằng trace, thay đổi từng giả thuyết và rollback được.

### NET-009 [Senior]

**Câu hỏi:** `GC.GetTotalMemory`, process working set, managed heap size và allocation rate đo các khía cạnh khác nhau nào của bộ nhớ?

**Trả lời:** `GC.GetTotalMemory` ước lượng managed memory đang được GC quản lý/live tùy thời điểm, không gồm toàn native/reserved. Managed heap size gồm committed/reserved/fragmentation theo counter định nghĩa, không bằng live objects. Working set là pages process đang resident, gồm runtime, native heap, stacks, mmap và có thể loại pages bị trim. Allocation rate là bytes tạo theo thời gian, có thể rất cao dù live heap ổn định.

**Pitfall/trade-off:** So metric khác nguồn/thời điểm dễ kết luận leak sai. Cần xem private bytes/commit, RSS, GC heap và native allocations cùng nhau.

**Kỳ vọng:** Senior phân biệt flow (rate), stock (live/committed) và OS residency.

## 2. Assembly, loading, versioning và runtime metadata

### NET-010 [Middle]

**Câu hỏi:** Assembly, module, namespace và package NuGet khác nhau thế nào; strong name thực sự bảo đảm điều gì?

**Trả lời:** Assembly là đơn vị deployment/version/identity chứa manifest, metadata và một hay nhiều module; namespace chỉ tổ chức tên type và có thể trải nhiều assembly. NuGet package là đơn vị phân phối có thể chứa nhiều assembly/assets theo target. Strong name tạo identity gồm name/version/culture/public key và kiểm tra integrity/signature phục vụ binding; không phải chứng thư tin cậy của publisher hay security sandbox.

**Pitfall/trade-off:** Package version không nhất thiết bằng assembly version. Strong-name key công khai không chứng minh tác giả đáng tin nếu không có chuỗi tin cậy riêng.

**Kỳ vọng:** Middle phân biệt các lớp; Senior hiểu binding/versioning và giới hạn trust.

### NET-011 [Senior]

**Câu hỏi:** `AssemblyLoadContext` hoạt động ra sao; làm thế nào xây plugin có dependency cô lập và có thể unload?

**Trả lời:** Mỗi ALC có scope resolution/cache assembly riêng; custom collectible ALC kết hợp `AssemblyDependencyResolver` có thể load dependency từ plugin path. Shared contract phải lấy từ Default ALC để host và plugin có cùng type identity; dependency riêng load vào plugin context. Để unload, bỏ mọi strong reference tới ALC/assembly/type/instance/delegate/thread, gọi `Unload`, rồi GC chỉ để kiểm chứng trong test.

**Pitfall/trade-off:** Static/event/thread/Reflection cache ở host dễ giữ plugin; native library và dependency conflict cần policy. Unload là cooperative, không tức thời.

**Kỳ vọng:** Senior thiết kế boundary contract, isolation, cleanup protocol và kiểm tra weak reference.

### NET-012 [Senior]

**Câu hỏi:** Vì sao type có cùng full name nhưng được load bởi hai context có thể không cast được cho nhau; shared contract nên bố trí ở đâu?

**Trả lời:** Runtime type identity gồm assembly identity và load context, không chỉ namespace+name. Hai bản contract được nạp ở ALC khác nhau là hai type khác, nên cast thất bại dù metadata giống. Đặt interface/DTO contract ổn định trong assembly chung do Default ALC load; custom ALC trả assembly đó từ default hoặc không tự load bản sao.

**Pitfall/trade-off:** Chia sẻ quá nhiều dependency làm mất isolation/version freedom; truyền object implementation-specific qua boundary gây leak context. DTO trung lập/serialization có thể tách mạnh hơn nhưng tốn mapping.

**Kỳ vọng:** Senior giải thích type identity và đưa loading rule cụ thể.

### NET-013 [Senior]

**Câu hỏi:** Trimming và Native AOT làm reflection/dynamic code gặp vấn đề gì; các annotation và source generation giúp ra sao?

**Trả lời:** Trimmer phân tích tĩnh và loại member tưởng không dùng; reflection theo string/generic pattern động không nhìn thấy nên runtime thiếu metadata/code. AOT còn không cho sinh/JIT code tùy ý. Dùng API annotated như `DynamicallyAccessedMembers`, `DynamicDependency` hoặc descriptor khi thật cần; ưu tiên source-generated serializers/DI/regex và `RequiresUnreferencedCode`/`RequiresDynamicCode` để lan truyền cảnh báo đúng.

**Pitfall/trade-off:** Suppress warning không bảo tồn member; annotation quá rộng làm mất lợi ích trimming. Test artifact đã publish, không chỉ `dotnet run`.

**Kỳ vọng:** Senior xử lý warning như correctness issue, thiết kế closed-world path và fallback rõ.

### NET-014 [Senior — Tình huống]

**Câu hỏi:** Sau khi nâng một package, ứng dụng lỗi `MissingMethodException` chỉ ở production; hãy nêu quy trình chẩn đoán assembly/version mismatch.

**Trả lời:** Thu stack, method signature, runtime/OS và danh sách assembly thật được load (path, file/assembly version, ALC); so với lock file, deps.json và publish output. Kiểm tra transitive dependency conflict, stale deployment files, roll-forward/shared framework, trimming/R2R và plugin context. Reproduce từ artifact/container production, làm clean deterministic restore/publish và xem API compatibility của package.

**Pitfall/trade-off:** Binding redirect kiểu .NET Framework không phải lời giải chung cho .NET hiện đại. Không copy DLL thủ công; sửa dependency graph/deployment atomic và thêm smoke test startup/hot paths.

**Kỳ vọng:** Senior phân biệt compile-time reference với runtime loaded binary và chứng minh bằng artifact evidence.

## 3. Dependency Injection, configuration và options

### NET-015 [Middle]

**Câu hỏi:** Transient, scoped và singleton lifetime trong DI container ASP.NET Core có semantics gì; dependency graph nào là captive dependency?

**Trả lời:** Transient tạo mỗi lần resolve; scoped tạo một instance mỗi scope (thường mỗi request); singleton một instance cho root container/app. Captive dependency xảy ra khi service sống lâu giữ service sống ngắn, điển hình singleton nhận scoped: scoped bị kéo thành gần singleton hoặc validation báo lỗi, phá isolation/disposal.

**Pitfall/trade-off:** Transient disposable được container giữ để dispose cuối scope nên tạo quá nhiều có thể tốn memory. Singleton phải thread-safe; scoped không đồng nghĩa tự thread-safe trong các task song song.

**Kỳ vọng:** Middle vẽ được object lifetime; Senior xét ownership/disposal và concurrency.

### NET-016 [Senior]

**Câu hỏi:** Vì sao resolve scoped service từ singleton là lỗi; khi singleton thực sự cần tạo scope, cách làm đúng và trade-off là gì?

**Trả lời:** Singleton tồn tại qua nhiều request nên giữ scoped instance sẽ trộn state, dùng DbContext quá lifetime và trì hoãn dispose. Background singleton có thể inject `IServiceScopeFactory`, tạo/dispose scope cho từng message/unit-of-work rồi resolve bên trong; không trả scoped object ra ngoài. Với request-specific action, tốt hơn để request-scoped orchestrator gọi singleton stateless.

**Pitfall/trade-off:** Tạo scope ẩn làm dependency khó thấy/test; service locator tùy ý là mùi thiết kế. Scope không tạo transaction hay concurrency boundary tự động.

**Kỳ vọng:** Senior dùng explicit unit-of-work, cancellation và dispose/async-dispose đúng.

### NET-017 [Middle]

**Câu hỏi:** Constructor injection có lợi gì; khi nào factory, keyed service hoặc explicit parameter phù hợp hơn service locator?

**Trả lời:** Constructor injection làm dependency bắt buộc, rõ, immutable và dễ test; object hợp lệ ngay sau construction. Factory phù hợp khi tạo theo runtime value/lifetime hoặc lazy; keyed service khi có tập implementation định danh được cấu hình; dữ liệu thay đổi theo lời gọi nên là method parameter. Service locator giấu dependency và chuyển lỗi sang runtime.

**Pitfall/trade-off:** Constructor quá nhiều dependency báo hiệu class nhiều trách nhiệm, không phải lý do chuyển hết sang locator. Factory cần ownership/disposal contract.

**Kỳ vọng:** Middle ưu tiên constructor; Senior phân biệt dependency ổn định, creation policy và request data.

### NET-018 [Senior]

**Câu hỏi:** Built-in DI container xử lý open generic, multiple registration, disposal và validation như thế nào?

**Trả lời:** Có thể đăng ký open generic và đóng khi resolve type phù hợp. Resolve `IEnumerable<T>` trả tất cả theo thứ tự đăng ký; resolve một `T` thường lấy đăng ký cuối. Container dispose instance disposable do nó tạo theo thứ tự phù hợp khi scope/root kết thúc; instance do caller cung cấp thường caller sở hữu. `ValidateOnBuild`/`ValidateScopes` bắt nhiều graph/lifetime lỗi nhưng không kích hoạt mọi factory/dynamic path.

**Pitfall/trade-off:** Resolve transient disposable từ root giữ đến app shutdown; không tự dispose object container quản lý. Built-in container cố ý đơn giản, đừng thay chỉ vì thói quen.

**Kỳ vọng:** Senior biết enumerable/last-registration, ownership và giới hạn validation.

### NET-019 [Middle]

**Câu hỏi:** Thứ tự configuration providers ảnh hưởng kết quả ra sao; environment variables ánh xạ key phân cấp như thế nào?

**Trả lời:** Providers được thêm theo thứ tự; key từ provider sau thường ghi đè provider trước, cho phép defaults→file→environment→command line. Key phân cấp dùng `:`; environment variables thường dùng `__` để tương thích shell, ví dụ `ConnectionStrings__Main`. Configuration là chuỗi key/value, binding mới chuyển sang type.

**Pitfall/trade-off:** Reload chỉ có nếu provider hỗ trợ; array/object merge có semantics theo key index, không phải deep merge trực giác. Không log toàn configuration vì có secret.

**Kỳ vọng:** Middle hiểu precedence; Senior kiểm soát nguồn, validation và provenance khi debug.

### NET-020 [Senior]

**Câu hỏi:** So sánh `IOptions<T>`, `IOptionsSnapshot<T>` và `IOptionsMonitor<T>` về lifetime, reload và thread safety.

**Trả lời:** `IOptions<T>.Value` là singleton-style value, thường đọc một lần và không cập nhật reload. `IOptionsSnapshot<T>` scoped, tính/cache theo scope và phù hợp request nhận snapshot mới. `IOptionsMonitor<T>` singleton, cung cấp `CurrentValue`, named options và `OnChange` khi provider reload. Options object nên coi immutable snapshot; monitor callback có thể chạy đồng thời và cần dispose registration.

**Pitfall/trade-off:** Snapshot không inject vào singleton; reload không có nghĩa mọi dependent resource tự tái tạo atomic. Validate startup và validate-on-change theo policy.

**Kỳ vọng:** Senior chọn theo consumer lifetime và thiết kế atomic reconfiguration/failure fallback.

### NET-021 [Senior — Code review]

**Câu hỏi:** Một singleton giữ trực tiếp object options mutable rồi callback reload sửa từng property; race condition nào có thể xảy ra và nên thiết kế snapshot thế nào?

**Trả lời:** Reader có thể thấy cấu hình “rách”: property A mới nhưng B cũ, collection đang đổi hoặc invariant tạm thời sai. Bind+validate thành instance mới hoàn chỉnh, xây resource phụ thuộc trước, rồi publish cả reference atomically (`Volatile.Write`/lock); reader chụp một reference và không mutate. Nếu build mới lỗi, giữ last-known-good và phát metric/log có redact.

**Pitfall/trade-off:** Resource cũ có request đang dùng nên cần lease/ref-count hoặc delayed disposal, không dispose ngay khi swap. Callback đồng thời cần serialize/coalesce.

**Kỳ vọng:** Senior nêu immutable snapshot, atomic publication và lifecycle của old/new resources.

## 4. ASP.NET Core pipeline và thiết kế API

### NET-022 [Middle]

**Câu hỏi:** Middleware pipeline được xây và thực thi theo thứ tự nào; `Use`, `Run`, `Map` và short-circuit khác nhau ra sao?

**Trả lời:** Request đi theo thứ tự đăng ký; middleware gọi `next` để đi vào phần sau, response unwind theo thứ tự ngược. `Use` có thể trước/sau `next`; `Run` là terminal; `Map` branch theo path (cùng các biến thể branch khác). Không gọi `next` là short-circuit có chủ ý.

**Pitfall/trade-off:** Ghi response rồi gọi next có thể gây headers already sent/body lẫn; middleware bắt exception phải bao quanh phần cần bắt. Ordering là một phần correctness/security.

**Kỳ vọng:** Middle mô tả onion flow; Senior suy ra tác động thứ tự và response-started.

### NET-023 [Senior]

**Câu hỏi:** Thứ tự exception handling, forwarded headers, HTTPS, routing, CORS, authentication, authorization và endpoint execution nên được xác định thế nào?

**Trả lời:** Không có danh sách mù cho mọi app, nhưng exception handler phải bao quanh phần cần xử lý; forwarded headers phải sớm và chỉ tin proxy đã cấu hình để scheme/IP đúng trước HTTPS/auth/logging. Routing chọn endpoint/metadata; CORS phải chạy ở vị trí có metadata và trước endpoint; authentication dựng `User`, authorization dùng user+endpoint policy, rồi endpoint chạy. Theo template/framework version và test thứ tự thực.

**Pitfall/trade-off:** Sai forwarded-header trust cho phép spoof; CORS không thay auth. Exception sau response started không thể đổi status/body sạch.

**Kỳ vọng:** Senior giải thích dependency giữa stages và threat model proxy, không chỉ đọc thuộc chuỗi.

### NET-024 [Middle]

**Câu hỏi:** Model binding, validation và serialization trong controller/minimal API diễn ra ở đâu; lỗi đầu vào nên trả về contract nào?

**Trả lời:** Binding lấy route/query/header/body/services thành parameters/model; validation chạy theo metadata/filter/conventions tùy controller/minimal API setup; output formatter/serializer viết response. Lỗi client nên dùng status phù hợp (thường 400, 415, 422 theo contract) và `ProblemDetails`/validation problem ổn định với field errors, trace id, không lộ stack.

**Pitfall/trade-off:** Data annotations không thay domain invariant; deserialize thành object không nghĩa được phép mass-assign mọi field. Giới hạn body/depth và xử lý culture/time rõ.

**Kỳ vọng:** Middle phân biệt binding/validation; Senior thiết kế boundary DTO, error contract và security limits.

### NET-025 [Senior]

**Câu hỏi:** So sánh controller API và minimal API về filter, binding, testability, metadata và tổ chức ứng dụng lớn.

**Trả lời:** Minimal API ít ceremony, route+handler+metadata gần nhau, có endpoint filters và typed results; controller có conventions, action filters, model-binding ecosystem và cấu trúc quen thuộc cho API lớn. Cả hai dùng cùng routing/DI và đều test integration tốt. Testability phụ thuộc tách business logic khỏi transport, không chỉ chọn style.

**Pitfall/trade-off:** Handler lambda khổng lồ làm minimal API khó tổ chức; controller base/filter ma thuật làm flow khó thấy. Metadata OpenAPI/auth phải nhất quán ở cả hai.

**Kỳ vọng:** Senior chọn theo team/domain, modularize endpoints và giữ thin transport layer.

### NET-026 [Senior]

**Câu hỏi:** Kestrel xử lý request body/response streaming và backpressure như thế nào; vì sao không nên buffer toàn bộ payload lớn?

**Trả lời:** Body là stream/pipe đọc dần; response có thể ghi/flush dần. Pipelines/transport áp backpressure khi consumer/client chậm, khiến write await thay vì tăng buffer vô hạn. Buffer toàn payload làm memory theo concurrency×payload, LOH/GC pressure, time-to-first-byte cao và dễ DoS. Dùng streaming parser, bounded buffers, body/response limits và cancellation.

**Pitfall/trade-off:** Flush quá thường xuyên tăng syscall/chunk overhead; serializer/operator có thể âm thầm buffer. Không giữ pooled segment sau `Advance`/return.

**Kỳ vọng:** Senior mô tả bounded memory, slow-client behavior và ownership của buffer.

### NET-027 [Senior]

**Câu hỏi:** Cancellation khi client disconnect được biểu diễn thế nào; endpoint nên xử lý `RequestAborted` và side effect đã commit ra sao?

**Trả lời:** `HttpContext.RequestAborted` được signal khi request bị hủy/disconnect (phát hiện không phải tức thời tuyệt đối). Truyền token xuống database/HTTP/streaming và dừng work không cần thiết tại safe point. Nếu transaction/side effect đã commit, cancellation không hoàn tác; ghi trạng thái/idempotency record và không báo logic “chưa làm”. Cleanup dùng `finally`/token shutdown riêng khi cần.

**Pitfall/trade-off:** Dùng request token cho fire-and-forget làm job bị hủy khi response xong; background work phải enqueue bền vững. Không log cancellation dự kiến như server error.

**Kỳ vọng:** Senior phân biệt transport cancellation với business transaction và có idempotent recovery.

### NET-028 [Senior]

**Câu hỏi:** Thiết kế idempotency cho POST/payment API cần key, persistence, concurrency control, response replay và thời hạn thế nào?

**Trả lời:** Client gửi idempotency key scoped theo tenant/operation; server lưu atomic key + request fingerprint + trạng thái + kết quả trong durable store có unique constraint. Hai request đồng thời chỉ một owner xử lý; request cùng key nhưng payload khác bị từ chối. Khi completed, replay status/body/headers cần thiết; trạng thái in-progress/failure có recovery policy. TTL phải dài hơn retry window và cân nhắc audit/payment rules.

**Pitfall/trade-off:** Cache memory không đủ khi multi-instance/restart; lưu key sau side effect tạo khe duplicate. External provider cũng cần idempotency key/outbox hoặc reconciliation.

**Kỳ vọng:** Senior nói tới atomicity, crash windows, fingerprint, multi-tenant và exactly-once là mục tiêu không tuyệt đối.

### NET-029 [Senior — Code review]

**Câu hỏi:** Middleware bắt mọi exception, trả HTTP 200 cùng `{ success:false }` và log toàn bộ request body; hãy chỉ ra các vấn đề vận hành, bảo mật và semantic.

**Trả lời:** HTTP 200 phá cache, retry, alert/SLO, client/tooling semantics; map lỗi dự kiến sang 4xx, lỗi server 5xx và ProblemDetails ổn định. Catch phải giữ cancellation và không nuốt fatal/response-started cases; log một lần với trace id. Toàn body có password/token/PII, payload lớn hoặc stream đã đọc; mặc định không log, chỉ allowlist/redact/limit và có quyền truy cập/retention.

**Pitfall/trade-off:** Trả chi tiết exception lộ internals; đổi error contract cần versioning. Logging body còn ảnh hưởng performance và model binding nếu buffering sai.

**Kỳ vọng:** Senior liên kết protocol semantics, observability, privacy và resilient middleware ordering.

### NET-030 [Senior — Tình huống]

**Câu hỏi:** API tải file 5 GB đang dùng `ReadToEndAsync` rồi trả `byte[]`; hãy thiết kế lại để streaming, giới hạn tài nguyên và hỗ trợ range/cancellation.

**Trả lời:** Mở file/blob stream async và trả `FileStreamResult`/stream trực tiếp hoặc copy bằng bounded buffer; bật range processing khi storage seek/range được và đặt `Content-Length`, type, ETag/Last-Modified đúng. Truyền `RequestAborted`, giới hạn concurrent download/bandwidth/timeouts và tránh giữ request-scoped resource bị dispose sớm. Với cloud storage có thể redirect/signed URL để offload.

**Pitfall/trade-off:** Range cần validate và chống amplification; compression file đã nén tốn CPU. Backpressure phải được await, không fire-and-forget copy.

**Kỳ vọng:** Senior đạt memory O(buffer), hỗ trợ conditional/range requests, slow client và quan sát bytes/duration.

## 5. Security cho web/API

### NET-031 [Middle]

**Câu hỏi:** Authentication và authorization khác nhau thế nào; claim, role, policy và resource-based authorization dùng khi nào?

**Trả lời:** Authentication xác lập danh tính/principal; authorization quyết định principal có được làm hành động trên resource hay không. Claim là thuộc tính/assertion từ issuer; role là nhóm quyền thô; policy kết hợp requirements/handlers theo rule; resource-based authorization cần chính object/owner/state để quyết định sau khi load an toàn.

**Pitfall/trade-off:** Đã đăng nhập không đồng nghĩa có quyền; không tin claim từ client ngoài token/cookie đã validate. Role explosion khó quản lý, policy/capability thường linh hoạt hơn.

**Kỳ vọng:** Middle phân biệt 401 và 403; Senior mô hình hóa least privilege, tenant/resource checks và deny-by-default.

### NET-032 [Senior]

**Câu hỏi:** JWT access token cần được validate những gì; vì sao chỉ decode token hoặc kiểm tra chữ ký là chưa đủ?

**Trả lời:** Validate thuật toán/key/signature, issuer, audience, expiry/not-before với clock skew hợp lý, token type/purpose và các claim bắt buộc; lấy key từ nguồn tin cậy có rotation/cache. Decode chỉ base64, không chứng minh integrity. Chữ ký hợp lệ vẫn có thể là token cho audience/issuer khác, hết hạn, sai loại hoặc bị replay.

**Pitfall/trade-off:** Không chấp nhận algorithm từ token một cách tùy ý hay vô hiệu hóa audience. JWT khó revoke tức thời; dùng access token ngắn hạn, rotation/introspection/revocation theo threat model và không log token.

**Kỳ vọng:** Senior nói tới key rotation, confused-deputy, clock, replay và authorization sau validation.

### NET-033 [Senior]

**Câu hỏi:** Cookie authentication cần xử lý `SameSite`, `Secure`, `HttpOnly`, CSRF, session fixation và data-protection keys thế nào?

**Trả lời:** Cookie auth dùng `Secure`, `HttpOnly`, scope Domain/Path tối thiểu và SameSite phù hợp luồng (OIDC cross-site thường cần ngoại lệ + Secure). Vì browser tự gửi cookie, request thay đổi trạng thái cần anti-forgery token/origin defense. Regenerate/sign-in lại cookie sau privilege/auth change để chống fixation. Data Protection keys phải chia sẻ bền vững giữa instances, bảo vệ at rest và có rotation để cookie sống qua restart/deploy.

**Pitfall/trade-off:** SameSite không thay CSRF defense hoàn chỉnh; XSS vẫn có thể thực hiện request dù HttpOnly ngăn đọc cookie. Sliding expiration cần absolute cap/revocation policy.

**Kỳ vọng:** Senior nối browser behavior, proxy HTTPS, key ring và session lifecycle.

### NET-034 [Middle]

**Câu hỏi:** CORS là gì và không phải là gì; vì sao cấu hình `AllowAnyOrigin` với credentials là nguy hiểm/không hợp lệ?

**Trả lời:** CORS là cơ chế browser cho phép script ở origin khác đọc/gửi một số request theo header/preflight; nó không phải authentication, firewall hay bảo vệ non-browser clients. Khi gửi credentials, server phải trả origin cụ thể được phép, không dùng wildcard `*`, vì nếu phản chiếu mọi origin thì site độc hại có thể đọc dữ liệu bằng credential người dùng.

**Pitfall/trade-off:** CORS sai không ngăn CSRF với “simple request”; allowlist phải exact và tránh suffix/regex ngây thơ. Preflight caching cần cân bằng thay đổi policy.

**Kỳ vọng:** Middle hiểu same-origin/browser; Senior phân biệt read protection với request-forgery và cấu hình theo endpoint.

### NET-035 [Senior]

**Câu hỏi:** Secret/config nhạy cảm nên được quản lý từ local development đến production và rotation như thế nào?

**Trả lời:** Local dùng user-secrets/env tạm, không commit; CI/prod lấy từ secret manager/workload identity với quyền tối thiểu, audit và encryption. Ưu tiên short-lived credentials thay static key. Rotation cần hỗ trợ overlap old/new, atomic reload/recreate client, canary và revoke sau khi xác nhận; inventory owner/expiry. Redact log, dump, telemetry và error.

**Pitfall/trade-off:** Environment variable có thể lộ qua process/debug/config dump; Kubernetes Secret chỉ base64 nếu storage chưa mã hóa. Secret đã vào git phải rotate, xóa history không đủ.

**Kỳ vọng:** Senior thiết kế end-to-end lifecycle, bootstrap trust, access boundary và diễn tập rotation.

### NET-036 [Senior — Tình huống]

**Câu hỏi:** Một endpoint nhận URL từ người dùng rồi server tải nội dung; hãy phân tích SSRF và các lớp phòng vệ cần thiết.

**Trả lời:** Kẻ tấn công có thể ép server truy cập loopback, metadata service, private network hoặc exfiltrate qua redirect/DNS rebinding. Tốt nhất dùng allowlist scheme/host/port và service chuyên biệt; resolve DNS rồi chặn mọi IP private/link-local/loopback ở mỗi redirect, giới hạn redirect, response bytes, content type, timeout và concurrency. Egress firewall/proxy, metadata protection và network segmentation là lớp bắt buộc ngoài code.

**Pitfall/trade-off:** Chặn theo chuỗi URL/hostname một lần không đủ với IPv6, alternate encoding, DNS change. Không trả raw upstream body/header và không gửi internal credentials.

**Kỳ vọng:** Senior đưa defense-in-depth ở parser, resolver, HTTP client và network, kèm audit/test bypass.

## 6. EF Core, truy vấn và giao dịch

### NET-037 [Middle]

**Câu hỏi:** Tracking query, no-tracking và `AsNoTrackingWithIdentityResolution` khác nhau về identity, update và memory thế nào?

**Trả lời:** Tracking gắn entity vào change tracker, identity resolution trả cùng instance cho cùng key và `SaveChanges` phát hiện update; tốn memory/CPU. `AsNoTracking` phù hợp read-only, không track và có thể tạo nhiều instance cho cùng row/entity. `AsNoTrackingWithIdentityResolution` dùng tracker tạm chỉ để deduplicate trong kết quả, không attach vào context để update.

**Pitfall/trade-off:** Project DTO thường tốt hơn load entity read-only; update entity detached cần explicit attach/state và chống overposting. Tracking đôi khi nhanh hơn no-tracking nếu context đã có entity.

**Kỳ vọng:** Middle chọn no-tracking cho đọc; Senior hiểu identity/fix-up và update semantics.

### NET-038 [Middle]

**Câu hỏi:** `IQueryable` của EF Core được dịch sang SQL khi nào; client evaluation và materialization boundary gây rủi ro gì?

**Trả lời:** Query expression được tích lũy đến terminal enumeration/materialization như `ToListAsync`, `SingleAsync`, async enumeration. EF dịch phần hỗ trợ sang SQL; expression không dịch được ở filter/order quan trọng thường ném thay vì âm thầm client-evaluate, còn top-level projection có thể có logic client. `AsEnumerable`/`ToList` tạo boundary, phần sau chạy trong memory.

**Pitfall/trade-off:** Materialize trước filter làm tải bảng lớn; enumerate lại phát query lại. Log generated SQL và dùng `ToQueryString` khi chẩn đoán, nhưng parameter value có thể nhạy cảm.

**Kỳ vọng:** Middle biết deferred execution; Senior kiểm soát translation, parameterization và boundary.

### NET-039 [Senior]

**Câu hỏi:** N+1 query xuất hiện từ lazy/explicit loading hoặc projection sai như thế nào; làm sao phát hiện và sửa mà tránh cartesian explosion?

**Trả lời:** Một query lấy parents rồi truy cập navigation trong loop phát thêm query mỗi parent. Phát hiện qua command count/log/tracing và integration test query budget. Sửa bằng projection đúng shape, eager loading có chọn lọc, batch keys hoặc explicit load một lần. Khi nhiều collection include tạo tích Descartes, dùng split query/projection/batch thay vì join khổng lồ.

**Pitfall/trade-off:** Include tất cả chữa N+1 nhưng over-fetch và duplication; split query thêm round-trip và consistency window. Lazy loading làm I/O ẩn nên thường tránh ở service.

**Kỳ vọng:** Senior tối ưu tổng round-trips × rows × payload, kiểm tra SQL/plan chứ không chỉ số query.

### NET-040 [Senior]

**Câu hỏi:** Single query và split query khi `Include` nhiều collection có trade-off consistency, round-trip và kích thước result ra sao?

**Trả lời:** Single query một round-trip và snapshot theo một statement, nhưng joins sibling collections nhân số row, lặp cột lớn và tốn materialization. Split query phát query riêng cho collections, giảm cartesian explosion nhưng thêm round-trips và dữ liệu có thể đổi giữa các query nếu isolation không bảo đảm. Ordering/key correlation do EF xử lý nhưng cần xem phiên bản/provider.

**Pitfall/trade-off:** Transaction snapshot/serializable tăng consistency nhưng tăng contention; projection thường loại dữ liệu không cần tốt hơn cả hai. Benchmark cardinality production.

**Kỳ vọng:** Senior định lượng shape/cardinality và chọn consistency level theo nghiệp vụ.

### NET-041 [Middle]

**Câu hỏi:** `DbContext` nên có lifetime và ownership thế nào; vì sao nó không thread-safe và không nên là singleton?

**Trả lời:** DbContext đại diện unit-of-work ngắn, thường scoped per request/command và được DI dispose. Change tracker, connection/command state không hỗ trợ operation song song; await xong trước khi dùng tiếp. Singleton làm tracker phình, stale entities, trộn thay đổi giữa request và race. Background/parallel work tạo scope/context riêng qua factory.

**Pitfall/trade-off:** Một request dài với nhiều unit-of-work có thể cần nhiều context; context pooling tái dùng instance đã reset, không biến nó thread-safe và tenant state phải reset đúng.

**Kỳ vọng:** Middle biết scoped; Senior thiết kế transaction/unit-of-work và parallel boundaries rõ.

### NET-042 [Senior]

**Câu hỏi:** Optimistic concurrency với concurrency token/rowversion vận hành thế nào; quy trình resolve conflict nên tùy nghiệp vụ ra sao?

**Trả lời:** EF đưa original concurrency token vào `WHERE` của update/delete; nếu affected rows bằng 0, ném `DbUpdateConcurrencyException`. Handler đọc database/current/original values rồi chọn client-wins, store-wins, merge field, hỏi người dùng hoặc retry command bằng rule nghiệp vụ; token mới được cập nhật. SQL Server rowversion là token tự đổi, app-managed token hữu ích provider khác/field chọn lọc.

**Pitfall/trade-off:** Retry mù có thể ghi đè thay đổi hợp lệ hoặc lặp side effect. Token chỉ phát hiện xung đột trên row/phạm vi đã mô hình hóa, không bảo vệ invariant nhiều row.

**Kỳ vọng:** Senior gắn strategy với domain, idempotency và bounded retries.

### NET-043 [Senior]

**Câu hỏi:** `SaveChanges` và transaction explicit phối hợp thế nào; savepoint, execution strategy/retry và user transaction có bẫy gì?

**Trả lời:** Một `SaveChanges` thường chạy atomic trong transaction provider nếu cần. Trong transaction hiện có, EF có thể tạo savepoint để rollback lần save thất bại. Khi gộp nhiều SaveChanges/DbContext/external step cần transaction explicit hoặc pattern khác. Retrying execution strategy phải execute toàn transaction delegate như một unit; tự mở transaction ngoài strategy thường không tương thích retry.

**Pitfall/trade-off:** Transaction DB không bao trùm message/HTTP; dùng outbox/saga. Retry khi commit outcome không rõ có thể duplicate—cần idempotency. Transaction dài giữ locks/version store.

**Kỳ vọng:** Senior hiểu atomic boundary, transient retry, unknown commit và distributed consistency.

### NET-044 [Senior]

**Câu hỏi:** Projection, compiled query, batching và bulk operation giúp tối ưu EF Core trong trường hợp nào; giới hạn của từng cách là gì?

**Trả lời:** Projection giảm cột/entity/tracking sớm và thường có lợi lớn nhất. EF cache query theo shape; explicit compiled query giảm overhead compile ở hot query ổn định nhưng không chữa SQL chậm. Batching giảm round-trip của writes trong SaveChanges theo provider. ExecuteUpdate/Delete hoặc bulk library cập nhật nhiều row không materialize, nhưng bỏ qua change tracker/per-entity hooks và context đang track có thể stale.

**Pitfall/trade-off:** Bulk operation cần concurrency/audit/tenant filter explicit; compiled queries ít linh hoạt và lợi ích phải đo. Index/query plan thường quan trọng hơn ORM micro-tuning.

**Kỳ vọng:** Senior chọn đúng tầng bottleneck và bảo toàn semantics.

### NET-045 [Senior — Code review]

**Câu hỏi:** Repository trả `IQueryable<TEntity>` ra ngoài và controller tùy ý `Include`/filter; hãy đánh giá coupling, testability, security và phương án thay thế.

**Trả lời:** IQueryable làm rò EF/provider, lifetime DbContext và khả năng compose query tùy ý; controller dễ over-fetch, bypass tenant/authorization, tạo query không dịch được và khó đặt performance contract. Test bằng LINQ-to-Objects không phản ánh SQL. Thay bằng query service/specification/use-case method nhận criteria giới hạn và trả DTO/page; policy tenant/security nằm trước/ở query bắt buộc, vẫn cho composition nội bộ.

**Pitfall/trade-off:** Generic repository CRUD có thể chỉ bọc EF vô ích; specification quá trừu tượng cũng thành ngôn ngữ query thứ hai. Có thể expose IQueryable trong layer tin cậy với convention nghiêm, không qua API boundary.

**Kỳ vọng:** Senior cân bằng composability với bounded query surface, không áp repository giáo điều.

### NET-046 [Senior — Tình huống]

**Câu hỏi:** Một truy vấn EF Core nhanh ở dev nhưng timeout ở production với dữ liệu lớn; bạn sẽ chẩn đoán từ generated SQL đến index và execution plan thế nào?

**Trả lời:** Ghi query shape/tag, duration, rows và parameters an toàn; lấy `ToQueryString`/command trace rồi chạy với dữ liệu/cardinality tương tự. Xem actual execution plan: scan/seek, estimates, join, sort, spill, key lookup, blocking/locks và parameter sensitivity. Kiểm tra index composite/filter/include theo predicate/order, statistics, sargability, projection/pagination. Thay query/index có benchmark và theo dõi plan regression.

**Pitfall/trade-off:** Không dán literal production rồi kết luận vì parameterization/plan cache khác; thêm index làm chậm write/tốn storage. `AsNoTracking` không sửa SQL plan xấu.

**Kỳ vọng:** Senior đi xuyên ORM→SQL→optimizer→storage, đo logical reads/rows/time và có rollout.

## 7. Caching và trạng thái phân tán

### NET-047 [Middle]

**Câu hỏi:** In-memory cache và distributed cache khác nhau về consistency, availability, serialization và scale-out như thế nào?

**Trả lời:** Memory cache nằm trong process, rất nhanh, giữ object trực tiếp nhưng mỗi instance khác nhau và mất khi restart. Distributed cache được nhiều instance chia sẻ, cần network+serialization, có failure/latency riêng và vẫn không mặc định strong consistency với database. Cả hai cần size/eviction/TTL; distributed hỗ trợ scale-out tốt hơn nhưng thêm vận hành.

**Pitfall/trade-off:** Không dùng cache làm source of truth nếu không thiết kế persistence; instance-local invalidation có thể lệch. Cache object mutable gây cross-request race.

**Kỳ vọng:** Middle chọn theo topology; Senior mô hình hóa consistency, failure và serialization/versioning.

### NET-048 [Senior]

**Câu hỏi:** Cache-aside cần xử lý invalidation, TTL, stampede, negative caching và dữ liệu stale ra sao?

**Trả lời:** Read miss tải source rồi cache; write cập nhật source và invalidate/update cache với ordering được định nghĩa. TTL là safety net có jitter; version/key namespace giúp schema/tenant. Chống stampede bằng per-key single-flight/distributed lock, soft TTL + background refresh hoặc stale-while-revalidate. Negative cache “không có” với TTL ngắn để giảm penetration nhưng phải invalidate khi tạo mới.

**Pitfall/trade-off:** Delete cache sau DB commit vẫn có race read-old/write-old; CDC/outbox/version checks mạnh hơn khi cần. Stale phải có giới hạn và không phù hợp mọi dữ liệu nhạy cảm.

**Kỳ vọng:** Senior nêu consistency model, failure policy và metric hit/stale/load, không chỉ TTL.

### NET-049 [Senior — Tình huống]

**Câu hỏi:** Một key “hot” hết hạn khiến hàng nghìn request cùng truy vấn database; hãy đề xuất single-flight, jitter, stale-while-revalidate và giới hạn lỗi.

**Trả lời:** Trong mỗi instance, gộp concurrent miss theo key để một factory chạy; multi-instance có thể dùng distributed lease ngắn hoặc chấp nhận một loader mỗi node theo capacity. Dùng soft expiry để một worker refresh còn request khác nhận stale hợp lệ, hard expiry chặn stale quá lâu; thêm TTL jitter để tránh đồng loạt. Nếu source lỗi, serve last-known-good trong error budget, backoff/circuit break và giới hạn waiter/queue.

**Pitfall/trade-off:** Lock không được dài hơn loader vô hạn; owner crash cần lease expiry/fencing. Không cache exception lâu và không serve stale cho quyền/số dư nếu policy cấm.

**Kỳ vọng:** Senior đưa state machine fresh/stale/loading/failed, bounded resources và observability.

## 8. Testing, observability, performance và deployment

### NET-050 [Middle]

**Câu hỏi:** Unit test, integration test với `WebApplicationFactory` và end-to-end test nên phân chia trách nhiệm thế nào?

**Trả lời:** Unit test logic thuần nhanh và nhiều nhánh với dependency giả tối thiểu. Integration test host thật qua `WebApplicationFactory`, routing/middleware/DI/serialization/auth và integration DB/service gần thật. E2E chạy hệ thống triển khai cùng dependency/network/UI/consumer để xác nhận critical journeys, ít hơn vì chậm/flaky. Test pyramid là cân bằng feedback/risk, không quota cứng.

**Pitfall/trade-off:** Mock framework internals tạo test gắn implementation; integration dùng shared state cần isolation. Contract test hữu ích giữa services.

**Kỳ vọng:** Middle phân lớp đúng; Senior chọn test theo loại lỗi, fidelity, cost và production incident history.

### NET-051 [Senior]

**Câu hỏi:** Vì sao EF Core InMemory provider có thể tạo test sai lệch; SQLite, container database và test double nên dùng khi nào?

**Trả lời:** InMemory không phải relational: translation, SQL, constraints, transactions, case/collation và null semantics khác, nên query pass có thể fail production. SQLite relational hơn và nhanh nhưng dialect/type/feature vẫn khác. Container đúng engine cho query/migration/concurrency fidelity cao nhất. Test double/repository fake chỉ cho domain logic không nhằm kiểm chứng EF.

**Pitfall/trade-off:** Container test cần startup, data reset và CI resource; không chia DB state giữa test song song thiếu isolation. Migration phải được chạy trong test artifact.

**Kỳ vọng:** Senior lập test matrix: unit nhanh, SQLite chọn lọc, engine thật cho behavior quan trọng.

### NET-052 [Senior]

**Câu hỏi:** Logging có cấu trúc, metrics và distributed tracing/OpenTelemetry bổ sung nhau thế nào; correlation và cardinality cần kiểm soát ra sao?

**Trả lời:** Logs ghi sự kiện chi tiết có field truy vấn; metrics tổng hợp số theo thời gian cho alert/SLO; traces nối spans qua service để thấy critical path và latency. Propagate trace context chuẩn, gắn trace/span id vào log và exemplar khi hỗ trợ. Attribute/metric labels phải bounded; user id, URL raw, exception message làm cardinality bùng nổ và chi phí cao.

**Pitfall/trade-off:** Sampling trace có thể bỏ lỗi hiếm, cần tail/error sampling phù hợp; telemetry phải redact secret/PII. Log mọi request body không phải observability tốt.

**Kỳ vọng:** Senior thiết kế signal theo câu hỏi vận hành, semantic conventions, sampling và cost budget.

### NET-053 [Senior]

**Câu hỏi:** Health check readiness, liveness và startup khác nhau thế nào; dependency nào nên hoặc không nên kiểm tra ở mỗi loại?

**Trả lời:** Startup cho biết app đã hoàn tất khởi tạo chậm; liveness chỉ hỏi process có mắc kẹt cần restart không và nên ít phụ thuộc; readiness cho biết instance có nhận traffic mới được không, có thể xét dependency thiết yếu/local saturation. Nếu liveness gọi database, outage DB làm mọi pod restart và khuếch đại lỗi. Readiness cũng không nên fail vì dependency tùy chọn nếu app degrade được.

**Pitfall/trade-off:** Check phải timeout ngắn, cache/limit tần suất và không tự gây tải. Readiness flapping cần thresholds/grace period; health endpoint cần bảo vệ thông tin.

**Kỳ vọng:** Senior nối probe với hành động orchestrator và phân tích cascading failure.

### NET-054 [Senior]

**Câu hỏi:** Graceful shutdown của ASP.NET Core cần phối hợp load balancer, `IHostApplicationLifetime`, request đang chạy và background service ra sao?

**Trả lời:** Khi termination bắt đầu, instance chuyển not-ready/drain để LB ngừng request mới, host phát stopping token, server cho request đang chạy thời gian hoàn tất trong shutdown timeout. `BackgroundService.ExecuteAsync` phải tôn trọng token, ngừng nhận việc, checkpoint/requeue work dở và `StopAsync` không treo. Timeout hạ tầng phải lớn hơn drain+app cleanup và process cuối cùng vẫn có thể bị kill.

**Pitfall/trade-off:** In-memory queue mất việc; dùng durable broker/ack sau commit. Không dùng request cancellation để bỏ transaction ở điểm không an toàn; shutdown handler không dựa vào network vô hạn.

**Kỳ vọng:** Senior mô tả timeline signal→readiness→drain→cancel→kill, idempotency và test chaos deploy.

### NET-055 [Senior — Tình huống]

**Câu hỏi:** Một bản phát hành làm p99 tăng gấp ba nhưng CPU trung bình vẫn thấp; hãy xây quy trình điều tra và rollback/canary an toàn.

**Trả lời:** So canary/control theo cùng traffic: p50/p95/p99, errors, saturation, queue, thread pool, GC, outbound spans, DB locks/plans, connection pools và deployment/config diff. CPU thấp gợi ý wait: sync blocking, downstream latency, pool exhaustion, DNS/TLS, lock hoặc cold startup. Nếu SLO/error budget vượt ngưỡng, tự động dừng rollout/rollback artifact+config tương thích; giữ trace/profile mẫu trước khi mất bằng chứng. Reproduce bằng load distribution thực và bisect change.

**Pitfall/trade-off:** Average CPU che một core hot hoặc throttling; rollback DB migration phá compatibility nếu không expand/contract. Canary phải đủ traffic và route ổn định, không so thời điểm khác nhau thiếu baseline.

**Kỳ vọng:** Senior dẫn dắt bằng hypothesis+telemetry, có guardrail rollout, rollback đã diễn tập và post-incident regression test.

## Câu hỏi kinh điển bổ sung — Basic đến Senior

### NET-056 [Basic · ⭐ Rất thường gặp]

**Câu hỏi:** Phân biệt .NET SDK, runtime, shared framework, target framework và NuGet package; máy build và máy chạy cần thành phần nào?

**Kết luận:** SDK dùng để restore/build/test/publish và bao gồm toolchain; runtime thực thi ứng dụng. Target framework (TFM) là contract API app compile cho; shared framework cung cấp runtime cùng bộ framework assemblies; NuGet package là dependency phân phối độc lập.

**Cơ chế:** Máy build thường cần SDK phù hợp và targeting packs. Bản framework-dependent cần runtime/shared framework tương thích trên máy chạy; bản self-contained mang runtime theo artifact. `global.json`, project TFM và restore lock quyết định nhiều phần của build.

**Pitfall / follow-up Senior:** Có SDK không bảo đảm production có runtime đúng; roll-forward cần policy rõ. Self-contained tăng kích thước và trách nhiệm vá runtime; TFM tương thích không xóa khác biệt OS/native library.

### NET-057 [Basic · Thường gặp]

**Câu hỏi:** Managed code và unmanaged code khác nhau thế nào; GC, P/Invoke/COM interop và ownership tài nguyên phối hợp ra sao?

**Kết luận:** Managed code chạy dưới CLR với metadata, type safety và GC; unmanaged code chạy native và tự quản lifetime/ABI. P/Invoke hoặc COM interop là boundary marshal dữ liệu và chuyển quyền điều khiển.

**Cơ chế:** GC chỉ theo dõi reachability của managed object, không tự biết lúc nào phải đóng file descriptor, native allocation hay OS handle. Bọc handle bằng `SafeHandle` và dispose deterministic; pin hoặc copy buffer theo contract native. Với COM, CLR thường tạo Runtime Callable Wrapper (RCW); RCW che reference counting nhưng thời điểm GC/finalization giải phóng COM object không deterministic, và apartment/thread affinity vẫn có thể quan trọng.

**Pitfall / follow-up Senior:** Sai calling convention, struct layout, encoding hoặc ownership gây leak/corruption khó debug. Callback delegate phải được giữ sống; pinning dài làm GC fragmentation. `Marshal.ReleaseComObject`/`FinalReleaseComObject` có thể làm shared RCW bị invalid khi code khác còn dùng, nên chỉ release chủ động khi ownership thật sự rõ; ưu tiên wrapper/lifecycle theo API COM cụ thể. “Có GC” không có nghĩa không cần dispose.

### NET-058 [Basic · ⭐ Rất thường gặp]

**Câu hỏi:** Trong ASP.NET Core, `ControllerBase` và `Controller` khác nhau thế nào; `[ApiController]` bổ sung convention gì cho routing, binding và validation của Web API?

**Kết luận:** `ControllerBase` cung cấp nền tảng cho HTTP API mà không có view support; `Controller` kế thừa `ControllerBase` và thêm View/ViewData/TempData cho MVC có giao diện. Web API thường dùng `ControllerBase`, còn app trả Razor view mới cần `Controller`.

**Cơ chế:** `[ApiController]` yêu cầu attribute routing cho action, suy luận binding source, tự trả HTTP 400 khi model validation lỗi và dùng Problem Details conventions cho lỗi client theo cấu hình. Nó giảm boilerplate nhưng DTO/domain invariant và authorization vẫn phải được thiết kế riêng.

**Pitfall / follow-up Senior:** Automatic 400 có thể chạy trước action nên custom error contract/logging phải cấu hình qua `ApiBehaviorOptions` hoặc validation pipeline phù hợp. Không dùng `Controller` chỉ vì “nhiều tính năng hơn”, và không trả persistence entity trực tiếp từ controller.

### NET-059 [Basic · ⭐ Rất thường gặp]

**Câu hỏi:** Khi thiết kế API, nên dùng các status code 200, 201, 202, 204, 400, 401, 403, 404, 409, 422, 429, 500 và 503 trong trường hợp nào?

**Kết luận:** 200 thành công có body; 201 tạo resource và nên có `Location`; 202 đã nhận xử lý async và nên cung cấp operation/status URI để theo dõi; 204 thành công không body. 400 request sai cú pháp/binding; 401 thiếu hoặc sai authentication và thường kèm `WWW-Authenticate`; 403 đã nhận diện nhưng không được phép; 404 không có/không muốn tiết lộ resource; 409 xung đột state; 422 input đúng cú pháp nhưng sai semantic.

**Cơ chế:** 429 là client/tenant vượt quota; 503 là dịch vụ tạm không sẵn sàng; cả hai có thể kèm `Retry-After`. 500 dành cho lỗi server ngoài dự kiến. Error body nên theo `ProblemDetails` ổn định và có correlation ID.

**Pitfall / follow-up Senior:** Không trả 200 cho lỗi nghiệp vụ chung chung hoặc 500 cho validation. Status còn điều khiển cache, retry, alert và client SDK; không đưa stack/secret vào error response.

### NET-060 [Basic · ⭐ Rất thường gặp]

**Câu hỏi:** So sánh kiểu trả về cụ thể, `IActionResult`, `ActionResult<T>`, `IResult` và typed HTTP results; lựa chọn đó ảnh hưởng OpenAPI và content negotiation thế nào?

**Kết luận:** Kiểu cụ thể phù hợp một success shape; `IActionResult` cho nhiều MVC result nhưng mất generic success type; `ActionResult<T>` giữ cả response thay thế và schema `T`. Minimal API dùng `IResult`; `TypedResults`/union `Results<...>` cung cấp concrete result metadata tốt hơn.

**Cơ chế:** MVC action results đi qua formatter/content negotiation; HTTP results thực thi qua `IResult` và quyết định content type theo implementation. Metadata/`ProducesResponseType` hoặc typed results giúp OpenAPI biết mọi status/schema.

**Pitfall / follow-up Senior:** Return type không thay thế error contract; mọi branch phải được mô tả/test. Trộn domain model trực tiếp vào transport dễ over-posting/version coupling; ưu tiên DTO/typed result tại boundary.

### NET-061 [Basic · ⭐ Rất thường gặp]

**Câu hỏi:** Header `Content-Type` và `Accept` có vai trò gì; khi nào server trả 415 Unsupported Media Type hoặc 406 Not Acceptable?

**Kết luận:** `Content-Type` mô tả representation của body đang gửi; `Accept` liệt kê representation client có thể nhận. Server trả 415 khi không thể đọc request media type, và có thể trả 406 khi không thể tạo response phù hợp Accept theo policy negotiation.

**Cơ chế:** Formatter/serializer chọn theo endpoint metadata, content type, charset và Accept quality values. Request không body không cần Content-Type; response Content-Type do server chọn và phải phản ánh bytes thực.

**Pitfall / follow-up Senior:** Không đoán JSON chỉ vì body “trông giống JSON”; kiểm soát charset, size và parser depth. Vendor media type/versioning làm contract rõ hơn nhưng tăng số formatter/cache variants.

### NET-062 [Basic · ⭐ Rất thường gặp]

**Câu hỏi:** Các trạng thái EF Core `Detached`, `Added`, `Unchanged`, `Modified`, `Deleted` có ý nghĩa gì và `SaveChanges` tạo lệnh database tương ứng ra sao?

**Kết luận:** Detached không được context theo dõi; Added tạo INSERT; Unchanged không ghi; Modified tạo UPDATE cho property được đánh dấu; Deleted tạo DELETE khi SaveChanges.

**Cơ chế:** Query tracking thường đưa entity vào Unchanged và lưu original values; change detection chuyển property/entity sang Modified. `Add`, `Attach`, `Update`, `Remove` đặt state cho entity/graph theo semantics riêng; sau save thành công state thường quay về Unchanged hoặc Detached với entity đã xóa.

**Pitfall / follow-up Senior:** `Update` một graph từ client có thể đánh dấu quá nhiều cột/entity và gây overposting. State không thay concurrency/transaction; detached DTO cần allowlist và token cạnh tranh rõ.

### NET-063 [Middle · ⭐ Rất thường gặp]

**Câu hỏi:** `IHttpClientFactory` giải quyết socket exhaustion, DNS change và cấu hình client thế nào; handler pooling, cookie và resilience policy có pitfall gì?

**Kết luận:** Factory tạo `HttpClient` nhẹ nhưng pool/rotate `HttpMessageHandler`, tái sử dụng connection và tập trung named/typed client, logging và delegating handlers. Điều này tránh tạo handler/socket liên tục và cho DNS được làm mới theo lifetime.

**Cơ chế:** Client từ factory có thể sống ngắn; connection pool nằm ở handler. Cấu hình base address/default headers/policy theo client; per-request token/header nên gắn vào request. Static HttpClient với `PooledConnectionLifetime` cũng là phương án hợp lệ nếu quản đúng.

**Pitfall / follow-up Senior:** Pooled `CookieContainer` có thể chia cookie giữa caller hoặc mất cookie khi handler rotate. Không capture typed client như singleton vô hạn, không retry non-idempotent request mù và tránh nhân retry ở nhiều tầng.

### NET-064 [Middle · ⭐ Rất thường gặp]

**Câu hỏi:** Middleware, MVC action filter và endpoint filter khác nhau về phạm vi, thời điểm chạy, metadata và dependency; nên đặt cross-cutting concern ở lớp nào?

**Kết luận:** Middleware bao quanh pipeline HTTP rộng và có thể chạy cho mọi request; MVC filters chạy trong MVC action lifecycle; endpoint filters bao quanh invocation của endpoint/minimal API. Chọn lớp gần semantics cần thiết nhất.

**Cơ chế:** Correlation, exception boundary, compression thường là middleware; action/result-specific policy dùng MVC filter; validation/behavior gắn endpoint dùng endpoint filter. Sau routing, middleware/filter có thể đọc endpoint metadata; ordering quyết định auth, exception và short-circuit.

**Pitfall / follow-up Senior:** Đừng triển khai cùng concern ở ba lớp gây log/lỗi lặp. Filter không thay authorization policy và middleware viết response rồi gọi `next` dễ làm response hỏng; integration test thứ tự thực.

### NET-065 [Middle · ⭐ Rất thường gặp]

**Câu hỏi:** `IHostedService`/`BackgroundService` có lifecycle thế nào; làm sao dùng scoped dependency, bounded queue, cancellation và xử lý exception đúng trong worker?

**Kết luận:** Host gọi start khi ứng dụng khởi động và stop khi shutdown; `BackgroundService` đặt loop dài trong `ExecuteAsync`. Singleton worker phải tạo/dispose DI scope theo từng message/unit-of-work để dùng DbContext/service scoped.

**Cơ chế:** Dùng bounded `Channel<T>` hoặc broker để nhận việc, await backpressure, truyền stopping token và ack/checkpoint chỉ sau kết quả durable. `StopAsync` ngừng nhận, drain trong deadline rồi requeue phần dở. [Từ .NET 10](https://learn.microsoft.com/en-us/dotnet/core/compatibility/extensions/10.0/backgroundservice-executeasync-task), toàn bộ `BackgroundService.ExecuteAsync` chạy ở background và không chặn startup; initialization bắt buộc trước khi ready nên đặt trong `StartAsync`, `IHostedLifecycleService` hoặc một readiness gate có chủ đích.

**Pitfall / follow-up Senior:** Fire-and-forget từ request hoặc queue memory không durable làm mất việc. Exception thoát worker có thể dừng worker/host theo cấu hình; phải có retry/idempotency/dead-letter và metric backlog/age thay vì catch-nuốt vô hạn.

### NET-066 [Middle · ⭐ Rất thường gặp]

**Câu hỏi:** HTTP caching với `Cache-Control`, ETag/`If-None-Match` và 304 hoạt động thế nào; Response Caching và Output Caching trong ASP.NET Core khác nhau ở đâu?

**Kết luận:** Cache-Control định freshness/cacheability; ETag là validator để client gửi `If-None-Match`, server trả 304 không body nếu representation chưa đổi. Response Caching tuân HTTP cache headers/client-proxy semantics; Output Caching là server-side policy chủ động lưu endpoint output.

**Cơ chế:** Cache key phải gồm route/query/header variants (`Vary`) thực sự ảnh hưởng representation. ETag nên gắn version nội dung ổn định, không dùng timestamp yếu tùy tiện. Output cache có policy expiration/vary/eviction độc lập request cache directive hơn response cache.

**Pitfall / follow-up Senior:** Không cache response cá nhân theo key dùng chung; auth/cookie/tenant phải partition hoặc bypass. 304 vẫn cần đúng headers; invalidation/stampede và multi-node consistency vẫn phải thiết kế.

### NET-067 [Middle · Thường gặp]

**Câu hỏi:** Version một HTTP API bằng URL, query, header hoặc media type có trade-off gì; làm sao evolve DTO/enum/error contract mà vẫn tương thích client cũ?

**Kết luận:** URL dễ thấy/cache/document nhưng làm resource URI đổi; query đơn giản nhưng dễ bị bỏ qua; header/media type giữ URI sạch nhưng khó khám phá/debug hơn. Không chiến lược nào thay thế compatibility discipline.

**Cơ chế:** Ưu tiên thay đổi additive: field mới optional, default rõ, tolerant reader, enum unknown handling và error shape ổn định. Breaking behavior/schema cần version mới hoặc migration window; publish OpenAPI/contract test và telemetry version adoption.

**Pitfall / follow-up Senior:** Versioning mọi thay đổi gây phân mảnh; không version hành vi âm thầm trong cùng contract. Có deprecation/sunset, owner cho client cũ và thời hạn rollback; cache/gateway phải vary theo dimension version.

### NET-068 [Middle · ⭐ Rất thường gặp]

**Câu hỏi:** EF Core Migrations khác `EnsureCreated`/`EnsureDeleted` thế nào; migration production nên được tạo, review, triển khai và rollback/roll-forward ra sao?

**Kết luận:** Migrations lưu lịch sử thay đổi model và nâng schema tuần tự; `EnsureCreated` chỉ khởi tạo schema nếu chưa có, không tạo lịch sử tương thích để tiếp tục bằng migrations. `EnsureDeleted` là thao tác phá hủy, phù hợp test/dev có chủ đích.

**Cơ chế:** Tạo migration từ model snapshot, review generated SQL/data-loss/lock, sinh script hoặc bundle đã version và chạy bằng job/identity riêng trước–sau app theo compatibility plan. Production ưu tiên expand–migrate–contract và roll-forward cho biến đổi data.

**Pitfall / follow-up Senior:** Không để mọi replica chạy migration dài lúc startup. Down migration không thể khôi phục data đã drop/transform; cần backup/PITR, idempotency/lock, timeout và đo replication lag.

### NET-069 [Middle · ⭐ Rất thường gặp]

**Câu hỏi:** `Find`/`FindAsync`, `First`, `FirstOrDefault`, `Single` và `SingleOrDefault` khác nhau về identity map, SQL, cardinality contract và exception thế nào?

**Kết luận:** `Find` tìm theo primary key trong change tracker trước rồi mới query database. `First` yêu cầu ít nhất một row; `Single` yêu cầu đúng một; các bản `OrDefault` trả default khi không có, nhưng Single vẫn ném nếu có nhiều.

**Cơ chế:** Provider thường giới hạn First một row và Single hai row để phát hiện duplicate. Query LINQ thông thường vẫn đi database dù context đã track entity, sau đó identity resolution có thể trả instance đang track. Không có ordering thì “first” không mang ý nghĩa ổn định.

**Pitfall / follow-up Senior:** Dùng Single chỉ khi uniqueness là invariant và nên có unique constraint DB. `Find` có thể trả state local chưa save; nullable result phải được xử lý rõ, không dùng exception cho lookup dự kiến.

### NET-070 [Middle · Thường gặp]

**Câu hỏi:** Khi cập nhật entity disconnected từ API, `Attach`, `Update`, query-then-patch và property-level modification khác nhau thế nào; làm sao tránh overposting và lost update?

**Kết luận:** `Attach` bắt đầu track graph chủ yếu là Unchanged; `Update` thường đánh dấu graph/property là Modified và dễ ghi đè. Query entity hiện tại rồi map các field được phép là đường an toàn mặc định; có thể attach stub và đánh dấu từng property cho hot path có contract chặt.

**Cơ chế:** DTO/command tách input khỏi entity, allowlist property và giữ original concurrency token/rowversion. SaveChanges sinh UPDATE theo state; token trong WHERE phát hiện dữ liệu đã đổi kể từ lúc client đọc.

**Pitfall / follow-up Senior:** Bind trực tiếp entity cho phép sửa owner/tenant/role ngoài ý muốn. Update toàn graph có thể insert/delete navigation sai và ghi đè concurrent change; không retry conflict mà thiếu merge rule nghiệp vụ.

### NET-071 [Senior · Thường gặp]

**Câu hỏi:** DI container xây object đồng bộ nhưng service cần khởi tạo bất đồng bộ thì nên thiết kế ra sao; hosted startup, readiness gate và lazy initialization có trade-off gì?

**Kết luận:** Constructor chỉ thiết lập invariant nhanh; không block async I/O trong DI factory. Khởi tạo bắt buộc có thể chạy ở bootstrap/hosted startup trước readiness; khởi tạo tùy chọn có thể dùng async single-flight lazy với failure/timeout policy rõ.

**Cơ chế:** Bootstrap tạo scope, await migration/warmup cần thiết rồi mới `Run`; hoặc hosted service giữ readiness false đến khi hoàn tất. Lazy path cache một Task an toàn, truyền shutdown/deadline thích hợp và cho retry có kiểm soát nếu lần đầu lỗi.

**Pitfall / follow-up Senior:** `.Result`/`GetResult` trong singleton factory gây starvation/deadlock và làm startup treo. Không để mọi request cùng khởi tạo; phân biệt fail-fast dependency bắt buộc với degraded mode, và dispose resource khởi tạo dở.

### NET-072 [Senior · ⭐ Rất thường gặp]

**Câu hỏi:** Rate limiting trong ASP.NET Core nên partition theo IP, identity hay tenant thế nào; queue, fairness, multi-instance coordination và fail-open/fail-closed cần quyết định ra sao?

**Kết luận:** Partition theo đơn vị chịu quota thực: tenant/API key/user sau authentication; IP chỉ là tín hiệu phụ vì NAT/proxy/spoofing. Chọn fixed/sliding/token/concurrency limiter theo burst và cost, trả 429 cùng retry guidance khi từ chối.

**Cơ chế:** Queue phải bounded và có thứ tự/fairness rõ; request đắt thường nên reject sớm hơn xếp lâu. Limiter in-process chỉ biết một replica; quota toàn cụm cần gateway hoặc store/algorithm phân tán atomic, chấp nhận latency/availability trade-off.

**Pitfall / follow-up Senior:** Tin `X-Forwarded-For` từ proxy không được allowlist tạo bypass. Fail-closed cho abuse/cost/security, fail-open có thể hợp critical availability; đo accepted/rejected/queued time theo partition và ngăn tenant lớn chiếm queue.

### NET-073 [Senior · Thường gặp]

**Câu hỏi:** EF Core global query filter cho soft delete và multi-tenancy có failure mode gì với `IgnoreQueryFilters`, required navigation và context pooling?

**Kết luận:** Global filter tự thêm predicate vào query, hữu ích cho soft delete/tenant guard nhưng không phải security boundary duy nhất. Bypass filter phải ở API nội bộ hẹp, được authorize/audit và luôn tái áp tenant constraint cần thiết.

**Cơ chế:** Filter tham chiếu tenant state từ context; required navigation có thể tạo inner join khiến parent biến mất khi child bị filter. Context pooling tái dùng instance nên tenant/state tùy request phải được set/reset qua factory đúng, vì `OnConfiguring` không chạy lại mỗi request.

**Pitfall / follow-up Senior:** Trước EF Core 10, nhiều concern thường được kết hợp trong một filter và `IgnoreQueryFilters()` bỏ tất cả. [EF Core 10 named filters](https://learn.microsoft.com/en-us/ef/core/querying/filters) cho phép disable chọn lọc bằng tên; gọi overload không tên vẫn có thể bỏ mọi filter. Background/admin query và raw SQL dễ vượt guard; bổ sung database row-level security/least privilege và integration test cross-tenant.

### NET-074 [Senior · ⭐ Rất thường gặp]

**Câu hỏi:** Dùng `SaveChanges` interceptor hoặc domain-event dispatcher để tạo audit/outbox cần giữ atomicity, ordering, idempotency và retry semantics thế nào?

**Kết luận:** Audit/outbox cần được tạo và ghi trong cùng database transaction với aggregate; publish ra broker chỉ sau commit qua relay. Interceptor/dispatcher là hook, không tự tạo atomicity end-to-end.

**Cơ chế:** Thu domain events, tạo outbox rows có message ID/version/order key trước SaveChanges hoàn tất; relay claim/publish rồi đánh dấu, consumer dedup. Audit lấy actor/correlation và original/current values có redact. Execution strategy hoặc retry SaveChanges có thể chạy hook nhiều lần, nên ID và mutation phải deterministic/idempotent.

**Pitfall / follow-up Senior:** Gọi HTTP/broker bên trong transaction kéo dài lock và vẫn có unknown outcome. Không clear event trước commit chắc chắn; tránh interceptor re-enter SaveChanges, và định nghĩa ordering chỉ trong aggregate/partition thay vì toàn hệ thống.

### NET-075 [Senior · ⭐ Rất thường gặp]

**Câu hỏi:** Thiết kế integration test deterministic cho thời gian, background worker, retry và race condition trong ASP.NET Core bằng `TimeProvider`, `WebApplicationFactory`, database thật và fault injection như thế nào?

**Kết luận:** Tách clock, job handler và external boundary thành dependency điều khiển được; host API thật bằng `WebApplicationFactory`, dùng engine database production qua container cho transaction/concurrency, và inject failure có kịch bản thay vì dựa timing ngẫu nhiên.

**Cơ chế:** `TimeProvider`/fake clock tiến thời gian chủ động cho timeout/TTL; worker expose tín hiệu completion hoặc xử lý handler trực tiếp, không `Task.Delay` đoán. Dùng barrier để ép interleaving, unique test data/schema reset, fake HTTP handler/proxy để tạo timeout/reset/retry và assert side effect/idempotency.

**Pitfall / follow-up Senior:** EF InMemory không kiểm chứng SQL/constraint; sleep và shared database làm flaky. Test cả unknown commit, cancellation/shutdown và retry budget; giữ một số stress/soak test riêng vì deterministic schedule không bao phủ mọi interleaving.
