# Đáp án và rubric — Quiz tổng hợp Senior Backend

## Cách chấm

- Tổng điểm: **165**; mỗi câu tối đa **3 điểm**.
- Mỗi gạch rubric trị giá **1 điểm**. Có thể cho **0,5 điểm** khi ý đúng nhưng thiếu điều kiện hoặc diễn đạt mơ hồ.
- Không bắt buộc trùng từ khóa. Chấm theo lập luận đúng, assumption rõ và giải pháp giữ được invariant.
- Nếu kết luận đúng nhưng cơ chế sai, tối đa 1 điểm. Nếu đưa công nghệ nhưng không nói failure mode/cách kiểm chứng, tối đa 2 điểm.
- Các mục “failure mode” là tín hiệu phân biệt câu trả lời Senior; không nhất thiết phải nêu toàn bộ để đủ điểm nếu ba gạch rubric đã đạt.

## A. C#

### QS-001 — [C#][Equality][Code review] — 3 điểm

**Câu hỏi:** Một `record` chứa `List<string>` được dùng làm key của `Dictionary`; list tiếp tục bị sửa sau khi insert. Phân tích equality/hash behavior, failure mode và thiết kế lại contract của key.

- **1 điểm:** Nhận ra equality tổng hợp của record gọi equality của từng member; `List<T>` mặc định dùng identity, không structural equality. Hai list cùng phần tử vẫn khác key.
- **1 điểm:** Nêu key phải bất biến trong suốt thời gian ở hash table. Với `List<T>` hiện tại, sửa phần tử không đổi reference hash nhưng làm semantic key drift; với member mutable có structural/hash tùy state thì lookup có thể hỏng hoàn toàn.
- **1 điểm:** Thiết kế key từ scalar/value immutable đã canonicalize, immutable collection với equality rõ, hoặc comparer snapshot; defensive copy và kiểm thử `Equals/GetHashCode` contract.

**Điểm then chốt:** Không khẳng định sai rằng mọi mutation của `List<T>` chắc chắn đổi hash; vấn đề cốt lõi là contract identity/semantic và khả năng mutation. **Failure modes:** duplicate logical key, không tìm/xóa được key, dữ liệu key khác state business, race khi list sửa đồng thời. **Tham chiếu:** CS-006, CS-048, CS-051.

### QS-002 — [C#][Async][Code review] — 3 điểm

**Câu hỏi:** Đoạn `items.Select(async x => await SaveAsync(x, ct));` không materialize hoặc await kết quả. Điều gì thực sự chạy, lỗi được quan sát ở đâu, và viết lại thế nào nếu phải giới hạn concurrency?

- **1 điểm:** LINQ deferred; nếu không enumerate thì lambda chưa chạy. Nếu enumerate mà bỏ các `Task`, caller không chờ hoàn tất và exception có thể không được quan sát đúng boundary.
- **1 điểm:** Không giới hạn: materialize task rồi `await Task.WhenAll(...)`, truyền cancellation và xác định fail-fast/best-effort, thu exception đúng semantics.
- **1 điểm:** Có giới hạn: `Parallel.ForEachAsync`, `SemaphoreSlim` trong `try/finally`, bounded `Channel`, hoặc worker pool; giới hạn theo downstream, không theo số item.

**Điểm then chốt:** Async I/O không đồng nghĩa concurrency vô hạn. **Failure modes:** socket/connection exhaustion, task bị bỏ quên, partial write, cancellation không truyền, closure/index sai. **Tham chiếu:** CS-031, CS-032, CS-033, CS-034.

### QS-003 — [C#][Memory][API design] — 3 điểm

**Câu hỏi:** Thiết kế parser nhận dữ liệu có thể đến từ buffer đồng bộ hoặc I/O bất đồng bộ. So sánh `ReadOnlySpan<T>`, `ReadOnlyMemory<T>` và `ReadOnlySequence<T>` theo lifetime, allocation và boundary `await`.

- **1 điểm:** `ReadOnlySpan<T>` là stack-only `ref struct`, view không sở hữu dữ liệu, không sống qua `await`, không lưu vào heap; tốt cho parsing đồng bộ nóng.
- **1 điểm:** `ReadOnlyMemory<T>` lưu/truyền qua async được nhưng lifetime của backing owner vẫn phải bảo đảm; có thể lấy Span trong đoạn đồng bộ sau await.
- **1 điểm:** `ReadOnlySequence<T>` biểu diễn nhiều segment, phù hợp Pipe/stream không cần ghép buffer; API nên tách sync span parser khỏi async acquisition/ownership và tránh giữ pooled memory sau khi trả pool.

**Điểm then chốt:** Loại view không tự sở hữu/làm bất biến backing storage. **Failure modes:** use-after-return pool, copy ngầm, giữ buffer quá lâu, giả định dữ liệu contiguous, cắt multibyte token ở biên segment. **Tham chiếu:** CS-043, CS-044, CS-045, CS-046.

### QS-004 — [C#][Concurrency][Mechanism] — 3 điểm

**Câu hỏi:** Vì sao `volatile int count; count++` vẫn mất cập nhật? Chọn `Interlocked`, `lock` hoặc immutable snapshot cho ba loại invariant khác nhau.

- **1 điểm:** `volatile` chỉ cung cấp visibility/order nhất định cho read/write, còn `count++` là read-modify-write nhiều bước nên hai thread có thể ghi đè.
- **1 điểm:** `Interlocked` cho counter/CAS một word; `lock` cho invariant nhiều field hoặc chuỗi thao tác; immutable snapshot + atomic swap cho đọc nhiều/ghi ít.
- **1 điểm:** Nêu memory visibility/linearization và chọn theo contention/correctness; compound operation trên concurrent collection vẫn cần primitive atomic hoặc lock thích hợp.

**Điểm then chốt:** Thread-safe component không tự làm workflow nhiều bước atomic. **Failure modes:** lost update, torn logical state, retry CAS có side effect, starvation/contention, lock object công khai. **Tham chiếu:** CS-035, CS-036, CS-037, CS-040.

### QS-005 — [C#][LINQ][Data access] — 3 điểm

**Câu hỏi:** Một repository trả `IQueryable<Order>` ra ngoài application layer; caller thêm method C# không translate được rồi enumerate hai lần. Nêu các rủi ro về boundary, execution, hiệu năng và cách định hình API tốt hơn.

- **1 điểm:** `IQueryable` là expression/provider-bound và execute khi enumerate; lộ ra ngoài làm caller điều khiển SQL, lifetime context, authorization/filter và provider detail.
- **1 điểm:** Method không translate gây exception hoặc client-side/materialization tùy provider/version; enumerate hai lần có thể chạy hai query trên data khác nhau, tăng I/O và latency.
- **1 điểm:** Expose use-case query/specification/typed filter và projection DTO; materialize tại boundary có pagination/cancellation; kiểm tra generated SQL/query count.

**Điểm then chốt:** Không phải mọi LINQ giống nhau giữa `IEnumerable` và `IQueryable`. **Failure modes:** N+1, Cartesian explosion, unbounded query, context disposed, query injection qua dynamic expression, consistency giữa hai enumeration. **Tham chiếu:** CS-020, CS-021, CS-022, NET-038, NET-045.

### QS-006 — [C#][Resources][Correctness] — 3 điểm

**Câu hỏi:** Phân biệt `IDisposable`, `IAsyncDisposable`, finalizer và `SafeHandle`. Thiết kế cleanup khi acquisition dở dang hoặc `DisposeAsync` ném exception mà vẫn phải giải phóng các tài nguyên còn lại.

- **1 điểm:** `IDisposable` giải phóng đồng bộ; `IAsyncDisposable` cho cleanup có async I/O. Finalizer là fallback không xác định thời điểm; `SafeHandle` đóng gói native handle an toàn hơn tự finalizer.
- **1 điểm:** Acquisition nhiều bước phải rollback phần đã có bằng nested `using`/`try/finally`; ownership rõ, dispose idempotent theo contract và không dựa GC cho resource khan hiếm.
- **1 điểm:** Cleanup nhiều resource phải vẫn thử giải phóng phần còn lại khi một dispose lỗi, giữ exception chính và ghi/aggregate lỗi cleanup theo policy; `await using` và cancellation cleanup không được tùy tiện bỏ dở.

**Điểm then chốt:** Cleanup correctness quan trọng hơn che exception. **Failure modes:** double dispose, resource leak trên early return/constructor fail, finalizer block, trả pooled object quá sớm, cleanup exception che business exception. **Tham chiếu:** CS-042, CS-045, CS-046.

## B. .NET và ASP.NET Core

### QS-007 — [.NET][GC][Incident] — 3 điểm

**Câu hỏi:** Sau deploy, allocation rate và Gen 2 collection tăng, p99 xấu nhưng managed heap sau GC không tăng nhiều. Đưa ra giả thuyết, bằng chứng cần thu và thứ tự xử lý.

- **1 điểm:** Giả thuyết allocation churn/promotion, LOH, pinning, finalizer hoặc cache ngắn hạn; heap sau GC ổn không loại trừ CPU/pause do tốc độ cấp phát và copy.
- **1 điểm:** So sánh trước/sau deploy bằng allocation rate, collection count/pause, promoted bytes, LOH/POH, thread-pool và request trace; dùng counters, GC trace/profile/flame graph, dump khi cần.
- **1 điểm:** Tìm allocation callsite/dominator rồi giảm materialization/copy, lifetime/pinning hoặc revert/canary; benchmark/load-test và xác nhận p99, không gọi `GC.Collect` làm “fix”.

**Điểm then chốt:** Phân biệt footprint với allocation rate/retained size. **Failure modes:** tối ưu theo average, dump gây pause/disk, object pool làm retention/lock tệ hơn, bỏ qua native memory. **Tham chiếu:** NET-003, NET-005, NET-006, NET-008, NET-055.

### QS-008 — [.NET][Dependency Injection][Code review] — 3 điểm

**Câu hỏi:** Một singleton inject trực tiếp `DbContext` và options mutable được reload từng property. Chỉ ra hai lỗi lifetime/concurrency và đề xuất dependency graph cùng snapshot semantics đúng.

- **1 điểm:** `DbContext` scoped, không thread-safe; singleton giữ nó gây concurrent use, stale tracking và lifetime/disposal sai.
- **1 điểm:** Singleton chỉ giữ dependency singleton-safe; mỗi operation tạo scope/factory context có boundary rõ, hoặc chuyển orchestration thành scoped service.
- **1 điểm:** Reload config phải publish một immutable validated snapshot bằng atomic reference; dùng đúng `IOptionsSnapshot/IOptionsMonitor`, không mutate từng property đang được reader dùng.

**Điểm then chốt:** Container validation không thay thread-safety của object. **Failure modes:** captive dependency, use-after-dispose, partial config, callback leak, context parallel operation. **Tham chiếu:** NET-015, NET-016, NET-020, NET-021, NET-041.

### QS-009 — [ASP.NET Core][Middleware][Code review] — 3 điểm

**Câu hỏi:** Middleware bắt mọi exception, log cả request body rồi trả HTTP 200 `{success:false}`. Phân tích tác động tới protocol semantics, retry/monitoring, PII và cách thiết kế error pipeline.

- **1 điểm:** HTTP 200 che failure, phá client retry/cache/proxy và SLI error rate; map validation/domain/auth/dependency sang status + stable error contract/correlation.
- **1 điểm:** Exception handler đặt đúng thứ tự, log structured một lần với trace ID; không leak stack/internal detail và không nuốt cancellation/client disconnect như server error.
- **1 điểm:** Request body có PII/token, có thể lớn/one-shot; chỉ log allowlisted metadata/redacted với size limit/sampling và quyền truy cập/retention.

**Điểm then chốt:** Protocol semantics là một phần correctness/observability. **Failure modes:** double response sau headers sent, duplicate logs, body buffering DoS, token leak, false-success dashboards. **Tham chiếu:** NET-022, NET-023, NET-024, NET-029, SEC-043.

### QS-010 — [ASP.NET Core][Streaming][Backpressure] — 3 điểm

**Câu hỏi:** Endpoint proxy file 8 GB đang buffer toàn bộ vào `byte[]`. Thiết kế luồng truyền, cancellation, range, giới hạn tài nguyên và hành vi khi client ngắt kết nối.

- **1 điểm:** Stream/chunk từ nguồn tới response hoặc `Pipe`, không giữ toàn file; backpressure bằng await write/copy và bounded buffer.
- **1 điểm:** Truyền `RequestAborted`, timeout và cleanup source; xử lý client disconnect, giới hạn concurrent transfer/rate/size và không retry giữa stream mù quáng.
- **1 điểm:** Range/seek hoặc object-store/CDN redirect theo capability, status/header đúng, authorization trước stream và checksum/ETag khi cần.

**Điểm then chốt:** Streaming giảm RAM nhưng không tự giới hạn bandwidth/file descriptor. **Failure modes:** path traversal, slow client giữ resource, buffer pool lifetime, response đã bắt đầu không đổi status được, range amplification. **Tham chiếu:** NET-026, NET-027, NET-030, INF-036.

### QS-011 — [.NET][EF Core][Transaction] — 3 điểm

**Câu hỏi:** Một execution strategy retry transaction chứa cả `SaveChanges`, publish message và gọi payment HTTP. Phân tích duplicate/partial effect và đặt lại transaction/out-of-process boundary.

- **1 điểm:** Retry execution strategy có thể chạy lại delegate; HTTP/publish không transactional nên có thể charge/publish lặp, còn DB rollback không hoàn tác side effect ngoài.
- **1 điểm:** Local DB transaction chỉ chứa write/invariant; ghi outbox/idempotency state cùng transaction, relay async; payment dùng idempotency key/state machine/reconciliation.
- **1 điểm:** Retry có phân loại/transient, bounded backoff, toàn transaction và biết commit outcome unknown; consumer idempotent, không giữ connection/lock qua network.

**Điểm then chốt:** “Exactly once” không xuất hiện chỉ nhờ retry API. **Failure modes:** duplicate charge/event, partial commit, retry non-idempotent, transaction dài, execution strategy lồng user transaction sai. **Tham chiếu:** NET-028, NET-043, DB-039, DB-059, SD-029.

### QS-012 — [.NET][AOT][Runtime] — 3 điểm

**Câu hỏi:** Ứng dụng dùng reflection để discover handler và dynamic proxy. Khi chuyển sang trimming/Native AOT, lỗi nào có thể xuất hiện và nên thay đổi build/runtime contract thế nào?

- **1 điểm:** Trimmer không thấy type/member chỉ truy cập reflection; Native AOT hạn chế dynamic code/proxy/emit, dẫn tới member bị cắt, metadata thiếu hoặc runtime failure.
- **1 điểm:** Chuyển discovery sang explicit registration/source generator/compile-time mapping; dùng annotation/descriptors (`DynamicallyAccessedMembers`, dependency) có phạm vi nhỏ khi reflection bắt buộc.
- **1 điểm:** Bật trim/AOT analyzer, warning-as-signal và chạy publish artifact test; cân startup/size với build time, compatibility, diagnostics và plugin requirement.

**Điểm then chốt:** “Chạy debug” không chứng minh publish trimmed đúng. **Failure modes:** suppress warning rộng, serialization mất constructor/property, assembly load động, proxy framework không hỗ trợ. **Tham chiếu:** NET-002, NET-013, NET-014.

## C. Java, JVM và Spring

### QS-013 — [Java][Equality][Code review] — 3 điểm

**Câu hỏi:** Một `Money(BigDecimal amount, Currency currency)` dùng `BigDecimal.equals`, rồi object mutable được đặt vào `HashMap`. Nêu hai lớp lỗi và định nghĩa value object an toàn.

- **1 điểm:** `BigDecimal.equals` xét cả scale (`1.0` khác `1.00`) trong khi `compareTo` có thể bằng; equality tiền phải định nghĩa currency + amount canonical theo domain.
- **1 điểm:** Key mutable phá `equals/hashCode` stability sau insert; value object phải final/deep immutable, defensive construction và hash nhất quán.
- **1 điểm:** Chọn fixed scale/rounding theo currency hoặc canonical representation (minor units) và validate; test equality, serialization, arithmetic/rounding.

**Điểm then chốt:** `stripTrailingZeros` cũng cần policy cho scale/zero, không phải phép màu universal. **Failure modes:** duplicate logical key, lookup fail, rounding tài chính sai, currency mismatch. **Tham chiếu:** JAVA-002, JAVA-003, JAVA-029, JAVA-030.

### QS-014 — [Java][JMM][Concurrency] — 3 điểm

**Câu hỏi:** Giải thích vì sao double-checked locking không có `volatile` có thể publish object khởi tạo dở. Chỉ ra happens-before cần có và một cách triển khai đơn giản hơn.

- **1 điểm:** Không có happens-before, compiler/CPU có thể quan sát reference trước các write khởi tạo; lần check ngoài lock có thể thấy object partially initialized.
- **1 điểm:** `volatile` trên reference tạo release/acquire cho publication và check trong synchronized bảo đảm một instance; constructor không để `this` escape.
- **1 điểm:** Đề xuất initialization-on-demand holder, enum singleton hoặc eager static initialization do class initialization có guarantee rõ hơn.

**Điểm then chốt:** Mutual exclusion khi tạo chưa đủ cho reader không lock. **Failure modes:** unsafe publication qua collection thường, field non-final nhìn default, side effect trong constructor, test “chạy nhiều lần” không chứng minh an toàn. **Tham chiếu:** JAVA-032, JAVA-033, JAVA-034.

### QS-015 — [Java][Virtual threads][Capacity] — 3 điểm

**Câu hỏi:** Chuyển sang virtual thread làm số request concurrent tăng mạnh nhưng connection pool chỉ có 100 và downstream giới hạn 500 RPS. Phân tích throughput, pinning, backpressure và giới hạn cần giữ.

- **1 điểm:** Virtual thread giảm chi phí thread chờ, không tăng capacity DB/downstream; concurrency cao hơn sẽ xếp hàng tại pool 100 và có thể làm tail latency/timeout tăng.
- **1 điểm:** Dùng semaphore/bulkhead/rate limiter/bounded admission theo downstream 500 RPS và latency budget; timeout/cancellation, backpressure thay vì tạo vô hạn task.
- **1 điểm:** Kiểm tra pinning/long synchronized/native call, ThreadLocal memory và observability; pool connection vẫn là giới hạn tài nguyên, size theo DB chứ không theo số virtual thread.

**Điểm then chốt:** Concurrency là demand; throughput bị chặn bởi bottleneck. **Failure modes:** retry storm, queue không giới hạn, OOM do task/context, connection starvation, carrier pinning. **Tham chiếu:** JAVA-040, JAVA-043, JAVA-044, JVM-054.

### QS-016 — [Java][CompletableFuture][Code review] — 3 điểm

**Câu hỏi:** Các stage chạy trên cùng executor bounded, một stage gọi `join()` chờ future cũng cần executor đó. Phân tích starvation/deadlock, exception/cancellation propagation và cách compose lại.

- **1 điểm:** Worker block bằng `join` trong pool mà continuation cần chính pool có thể gây starvation/deadlock; common/bounded executor cũng bị blocking I/O chiếm hết.
- **1 điểm:** Compose dependency bằng `thenCompose/thenCombine/allOf` thay vì block, tách executor CPU/blocking khi cần và giới hạn fan-out.
- **1 điểm:** Xác định exception unwrap/aggregation, timeout và cancellation propagation (không mặc định hủy toàn graph); cleanup và partial result theo policy.

**Điểm then chốt:** Future graph phải biểu diễn dependency thay vì giấu synchronous wait. **Failure modes:** exception swallowed trong `exceptionally`, join trong event/executor thread, orphan task, side effect chạy sau timeout. **Tham chiếu:** JAVA-040, JAVA-041, JAVA-042.

### QS-017 — [JVM][Container][Memory] — 3 điểm

**Câu hỏi:** Pod có limit 1 GiB, `-Xmx768m` nhưng vẫn `OOMKilled` và không thấy Java heap OOM. Liệt kê phần bộ nhớ ngoài heap, bằng chứng cần lấy và cách đặt budget.

- **1 điểm:** RSS gồm heap cộng metaspace/class metadata, code cache/JIT, direct/NIO buffer, thread stacks, GC native structures, JNI/library và mmap/page; `Xmx` không phải process limit.
- **1 điểm:** Thu cgroup events/RSS, native memory tracking, thread count/stack, direct buffer/JFR/GC log và Kubernetes termination reason; phân biệt Java OOM với kernel OOMKill.
- **1 điểm:** Chừa headroom, đặt heap theo container và budget native/thread/direct, giảm concurrency/stack/leak; request/limit/probe và alert theo working set/saturation.

**Điểm then chốt:** Heap dump có thể không giải thích OOMKill. **Failure modes:** heap quá sát limit, memory request thấp làm node pressure, dump khi không đủ disk, restart loop che bằng chứng. **Tham chiếu:** JVM-012, JVM-015, JVM-018, JVM-054, INF-021.

### QS-018 — [Spring][Transaction][Proxy] — 3 điểm

**Câu hỏi:** Method `placeOrder()` gọi nội bộ method `@Transactional`, sau đó gọi HTTP trong transaction và publish event trực tiếp. Phân tích proxy boundary, rollback và thiết kế consistency khi có lỗi.

- **1 điểm:** Self-invocation bỏ qua Spring proxy nên annotation có thể không mở transaction; rollback default/exception handling cũng phải được kiểm tra.
- **1 điểm:** Không giữ DB transaction qua HTTP/publish; local transaction ghi order + durable intent/outbox, sau đó worker phối hợp provider bằng idempotency/retry/state.
- **1 điểm:** Event consumer idempotent, compensation/reconciliation cho outcome unknown; transaction boundary nằm ở bean được proxy hoặc dùng explicit transaction template có chủ đích.

**Điểm then chốt:** Annotation không thay kiến trúc dual-write. **Failure modes:** commit dù catch exception, event trước rollback, duplicate provider effect, connection pool cạn, `REQUIRES_NEW` partial commit. **Tham chiếu:** JVM-023, JVM-028, JVM-029, JVM-031, JVM-032.

## D. Algorithms và Data Structures

### QS-019 — [Algorithm][Streaming][Complexity] — 3 điểm

**Câu hỏi:** Tìm Top-100 theo score từ stream 500 triệu record với 256 MB RAM. Chọn cấu trúc, nêu invariant, time/space complexity và cách xử lý tie.

- **1 điểm:** Giữ min-heap 100 phần tử; root là nhỏ nhất trong tập ứng viên, thay root khi record mới tốt hơn theo total comparator.
- **1 điểm:** Time O(n log k), RAM O(k), cuối cùng sort O(k log k) nếu cần output có thứ tự; không cần giữ 500 triệu record.
- **1 điểm:** Tie-break deterministic bằng ID/time hoặc chính sách include-ties; nếu include mọi tie có thể vượt k và cần bound/contract.

**Điểm then chốt:** Top-K lớn nhất dùng min-heap kích thước k. **Failure modes:** max-heap sai hướng, comparator overflow/không transitive, score update, distributed aggregate không thỏa local Top-K. **Tham chiếu:** ALG-006, ALG-053.

### QS-020 — [Algorithm][Sliding window][Correctness] — 3 điểm

**Câu hỏi:** Vì sao sliding window chuẩn có thể sai khi tìm đoạn ngắn nhất có tổng ít nhất S nếu có số âm? Đưa phản ví dụ hoặc invariant bị phá và hướng thuật toán phù hợp.

- **1 điểm:** Window hai con trỏ cần tính đơn điệu: với số không âm, mở tăng tổng và thu giảm tổng; số âm phá điều này.
- **1 điểm:** Đưa phản ví dụ hợp lệ hoặc chỉ ra bỏ left có thể tăng tổng/mở right có thể giảm tổng nên greedy co cửa sổ bỏ lỡ optimum.
- **1 điểm:** Dùng prefix sum + monotonic deque: bỏ prefix lớn hơn ở tail, tìm prefix đủ chênh ở head; O(n) time/O(n) worst space.

**Điểm then chốt:** Phải nêu precondition, không chỉ đổi một dấu trong sliding window. **Failure modes:** off-by-one prefix, overflow, giả định S dương, deque lưu value thay index. **Tham chiếu:** ALG-026, ALG-028.

### QS-021 — [Data structure][Cache][Concurrency] — 3 điểm

**Câu hỏi:** Thiết kế LRU O(1) cho `get/put`. Nêu invariant giữa map/list và vì sao chỉ thay map bằng concurrent map chưa làm toàn bộ cache thread-safe.

- **1 điểm:** Hash map key→node + doubly linked list MRU/LRU; get/put detach+move, quá capacity xóa tail khỏi cả hai, O(1) average.
- **1 điểm:** Invariant map/list một-một, liên kết nhất quán, size/capacity và update existing/capacity zero; xóa map nếu evict để không leak.
- **1 điểm:** Concurrent map chỉ atomic thao tác của map; move/list/map compound cần lock chung, sharding hoặc library cache với policy concurrency rõ.

**Điểm then chốt:** Linearization point của get có recency update phải được định nghĩa. **Failure modes:** duplicate node, cycle/list corruption, callback dưới lock, TTL/weight race, lock contention. **Tham chiếu:** ALG-007, ALG-051, ALG-058.

### QS-022 — [Algorithm][Rate limiting][Distributed] — 3 điểm

**Câu hỏi:** So sánh token bucket, fixed window và sliding counter cho API cho phép burst. Khi chạy nhiều instance, atomicity, clock và fail-open/fail-closed được xử lý ở đâu?

- **1 điểm:** Fixed window rẻ nhưng burst biên; sliding counter xấp xỉ mượt hơn; token bucket nạp theo rate và capacity cho burst.
- **1 điểm:** Multi-instance cần atomic update tại owner/store/script hoặc phân quota có sai số; dùng monotonic/server time, key/TTL và chống hot key.
- **1 điểm:** Nêu identity/cost, response/retry metadata và policy khi store/network lỗi: fail-open bảo availability, fail-closed bảo abuse/cost theo endpoint risk.

**Điểm then chốt:** Rate và concurrency limit bảo vệ các failure mode khác nhau. **Failure modes:** clock skew, double burst, unlimited local fallback, NAT/IP unfairness, retry tự khuếch đại. **Tham chiếu:** ALG-048, SD-034, SEC-035.

### QS-023 — [Algorithm][DAG][Scheduling] — 3 điểm

**Câu hỏi:** Pipeline task có dependency, duration và nhu cầu CPU/RAM khác nhau. Nêu cách phát hiện cycle, xác định critical path và lý do tối ưu makespan với resource hữu hạn không chỉ là topological sort.

- **1 điểm:** Kahn/DFS phát hiện cycle và tạo ready set; cycle phải được báo cùng path/component, không chỉ bỏ task.
- **1 điểm:** Longest weighted path trên DAG cho critical path/lower bound; priority task theo slack/criticality khi ready.
- **1 điểm:** Resource-constrained scheduling/makespan tổng quát khó (NP-hard); cần list scheduling/bin-packing heuristic, reservation, fairness và đo utilization.

**Điểm then chốt:** Topological order chỉ bảo đảm dependency, không tối ưu resource/time. **Failure modes:** starvation task lớn, estimate duration sai, retry phá dependency, oversubscribe RAM, task failure không propagation. **Tham chiếu:** ALG-014, ALG-054.

## E. Database

### QS-024 — [Database][Index][Query plan] — 3 điểm

**Câu hỏi:** Với index `(tenant_id, status, created_at)`, giải thích query nào seek/range/order tốt, ảnh hưởng của range column và khi nào covering index đáng giá.

- **1 điểm:** B-tree sort lexicographic; equality tenant/status rồi range created hỗ trợ tốt. Bỏ tenant thường không seek hiệu quả; sau range, cột sau khó thu hẹp seek.
- **1 điểm:** Index có thể đáp ứng ORDER BY khi filter/order/direction khớp và không bị range/order conflict; phải nhìn row fraction/selectivity, không ép seek.
- **1 điểm:** INCLUDE/cover tránh base lookup cho query hot nhưng tăng width, cache/storage và write/WAL; chọn từ workload/actual plan.

**Điểm then chốt:** Không chọn thứ tự chỉ theo “selectivity cao nhất”. **Failure modes:** implicit cast, parameter skew, duplicate overlapping indexes, include LOB, tenant filter bị bỏ. **Tham chiếu:** DB-022, DB-023, DB-025, DB-028.

### QS-025 — [Database][MVCC][Operations] — 3 điểm

**Câu hỏi:** Một transaction `idle in transaction` hàng giờ trong hệ thống MVCC. Phân tích bloat/undo, cleanup horizon, lock/connection và replica/log retention.

- **1 điểm:** Snapshot cũ giữ version horizon nên PostgreSQL không vacuum/reuse tuple hoặc InnoDB phải giữ undo; bloat/read amplification tăng.
- **1 điểm:** Transaction có thể giữ row/table lock, connection và transaction ID; WAL/binlog/replication slot/replica cleanup lag có thể phình disk.
- **1 điểm:** Tìm oldest transaction/session/owner, timeout và sửa application boundary; terminate có kiểm soát, theo dõi cleanup thay vì maintenance rewrite mù quáng.

**Điểm then chốt:** “Idle” không có nghĩa không giữ state. **Failure modes:** kill gây rollback dài, `VACUUM FULL` lock/rewrite, pool leak, autovacuum tuning che transaction leak. **Tham chiếu:** DB-033, DB-039, DB-041, DB-047.

### QS-026 — [Database][Isolation][Correctness] — 3 điểm

**Câu hỏi:** Hai transaction snapshot cùng kiểm tra “luôn còn ít nhất một bác sĩ trực” rồi sửa hai row khác nhau. Gọi tên anomaly và đưa ra ít nhất hai cách bảo vệ invariant.

- **1 điểm:** Đây là write skew dưới snapshot: hai transaction đọc cùng predicate nhưng ghi hai row khác nhau nên không có write-write conflict.
- **1 điểm:** Serializable/SSI với bounded retry, hoặc khóa một guard/on-call-set row/range để buộc conflict.
- **1 điểm:** Có thể remodel invariant thành constraint/atomic statement (counter/slot/exclusion phù hợp engine) và test interleaving; không chỉ tăng “repeatable read” theo tên.

**Điểm then chốt:** Snapshot isolation không tương đương serializable. **Failure modes:** retry không toàn transaction, khóa row không tồn tại, predicate scan thiếu index, deadlock/starvation. **Tham chiếu:** DB-034, DB-036, DB-038.

### QS-027 — [Database][Optimizer][Diagnosis] — 3 điểm

**Câu hỏi:** Actual rows lệch estimated rows 10.000 lần và hash join spill. Nêu chuỗi nguyên nhân có thể có, cách đọc plan và thứ tự khắc phục an toàn.

- **1 điểm:** Estimate lệch do stats cũ/sample, skew/parameter sniffing, correlation, non-SARGable cast/function hoặc predicate dependency; chọn sai build/join/memory grant dẫn spill.
- **1 điểm:** Đọc actual-vs-estimated từ operator lệch đầu tiên, loops/rows, predicate, wait/I/O/temp, parameter; không chỉ nhìn phần trăm cost.
- **1 điểm:** Cập nhật/extended/filtered stats hoặc sửa query/index/model sau tái hiện; canary/measure và chỉ hint/recompile có kiểm soát khi hiểu trade-off.

**Điểm then chốt:** Spill là hậu quả có thể từ cardinality, không nhất thiết chỉ “thiếu RAM”. **Failure modes:** update stats toàn hệ thống giờ cao điểm, force plan cho mọi tenant, index thừa, chạy actual DML nguy hiểm. **Tham chiếu:** DB-020, DB-028, DB-029, DB-030, DB-044.

### QS-028 — [Database][Pagination][API] — 3 điểm

**Câu hỏi:** Offset pagination trên bảng thay đổi liên tục gây chậm, trùng và thiếu row. Thiết kế cursor keyset có total order, tie-break, backward navigation và consistency contract.

- **1 điểm:** Chọn total order ổn định như `(created_at,id)` và predicate lexicographic sau cursor, index cùng prefix/order; tie-break ID duy nhất.
- **1 điểm:** Cursor opaque/signed chứa values, direction và filter/version; backward đảo comparator/order rồi đảo output, xử lý NULL/collation rõ.
- **1 điểm:** Contract nêu read-committed “moving feed” hay snapshot/as-of; key được update có thể dịch vị trí, nên dùng immutable order key hoặc snapshot token.

**Điểm then chốt:** Keyset tối ưu seek nhưng không tự tạo snapshot consistency. **Failure modes:** chỉ timestamp, cursor dùng offset bên trong, thay filter giữa trang, leak sensitive key, missing index. **Tham chiếu:** DB-016, DB-022.

### QS-029 — [Database][Migration][Delivery] — 3 điểm

**Câu hỏi:** Đổi một cột nullable thành bắt buộc và thay kiểu trên bảng 2 TB trong lúc ba version ứng dụng cùng chạy. Lập các pha tương thích, backfill, validation và rollback.

- **1 điểm:** Expand bằng cột/type mới backward-compatible và deploy code có thể đọc/ghi cả schema; tránh DDL rewrite/lock một bước, tạo index/constraint theo capability online.
- **1 điểm:** Backfill bounded/idempotent có checkpoint, throttle theo log/replica/OLTP; dual-write/CDC/version rồi checksum/reconcile và validate constraint.
- **1 điểm:** Chuyển read, đặt NOT NULL/contract sau compatibility window rồi mới xóa cũ; rollback/roll-forward từng pha và chứng minh mọi app/job cũ đã rời.

**Điểm then chốt:** Ba version đồng thời buộc schema tương thích cả reader lẫn writer. **Failure modes:** default/rewrite 2 TB, dual-write drift, backfill đè update mới, replica lag/disk đầy, contract quá sớm. **Tham chiếu:** DB-061, DB-045, DB-046, DO-010, SD-043.

## F. Software Architecture

### QS-030 — [Architecture][DDD][Invariant] — 3 điểm

**Câu hỏi:** Chọn aggregate boundary cho Order, Payment và Shipment. Invariant nào cần transaction cục bộ, điều gì nên eventual, và vì sao object graph lớn là dấu hiệu xấu?

- **1 điểm:** Order bảo vệ line/total/state transition cục bộ; Payment và Shipment có identity/lifecycle/provider riêng nên thường là aggregate/bounded workflow khác.
- **1 điểm:** Invariant phải đúng tức thời nằm trong một transaction/aggregate; phối hợp payment/shipping dùng durable event/state machine và chấp nhận trạng thái trung gian có tên.
- **1 điểm:** Boundary lớn gây lock/contention, load graph, transaction dài và coupling; dùng ID/reference, snapshot fact cần thiết và version/idempotency giữa aggregate.

**Điểm then chốt:** Aggregate là consistency boundary, không phải object graph để cascade mọi thứ. **Failure modes:** distributed transaction vô tình, cascade delete, total tính từ giá hiện tại, event trước commit, trạng thái không reconcile được. **Tham chiếu:** SE-007, SE-008, SE-009, SE-010, DB-001.

### QS-031 — [Architecture][Code review][Coupling] — 3 điểm

**Câu hỏi:** Một service class 2.000 dòng vừa validate, query ORM, gọi HTTP, map DTO, retry và emit metric. Nêu cách tìm cohesion/coupling boundary và lộ trình refactor không “big bang”.

- **1 điểm:** Nhận diện các reason-to-change/boundary: domain policy, persistence, remote adapter, mapping, resilience và telemetry; đo dependency fan-in/out, test pain và change coupling.
- **1 điểm:** Tạo characterization/integration test tại behavior hiện có, extract seam/interface quanh I/O và tách pure domain/application orchestration theo từng vertical slice.
- **1 điểm:** Refactor incrementally với metric/feature flag, không tạo “manager/helper” vô nghĩa; retry/metric có thể là decorator/pipeline nhưng ownership policy phải rõ.

**Điểm then chốt:** Chia method/class không tự tạo cohesion. **Failure modes:** big-bang rewrite, interface cho mọi class, transaction boundary bị vỡ, duplicate retry, test chỉ mock call order. **Tham chiếu:** SE-001, SE-002, SE-005, SE-011, SE-029, SE-030.

### QS-032 — [Architecture][Testing][Risk] — 3 điểm

**Câu hỏi:** Một codebase có 90% coverage nhưng hầu hết test mock mọi dependency và assert call sequence. Đánh giá rủi ro, đề xuất test portfolio và contract cần kiểm tra ở boundary.

- **1 điểm:** Coverage chỉ đo code được chạy; mock-heavy/assert sequence khóa implementation nhưng bỏ wiring, SQL/transaction, serialization, proxy, schema và race.
- **1 điểm:** Giữ unit/property test cho logic pure; integration bằng database/broker/container cho adapter/invariant; contract test giữa service, ít end-to-end cho critical journey.
- **1 điểm:** Chọn test theo risk/change frequency, kiểm soát data/isolation/determinism; dùng mutation/defect escape và thời gian phản hồi thay vanity coverage.

**Điểm then chốt:** Test double ở boundary không được giả lập lại chính semantics cần kiểm tra. **Failure modes:** in-memory DB khác production, flaky sleep, shared state, snapshot test vô nghĩa, contract provider/consumer lệch version. **Tham chiếu:** SE-023, SE-024, SE-025, SE-026, SE-027, SE-028.

### QS-033 — [Architecture][Modularity][Trade-off] — 3 điểm

**Câu hỏi:** Khi nào modular monolith tốt hơn microservices? Đưa tiêu chí tách service dựa trên ownership, deploy, scaling, consistency và operational maturity.

- **1 điểm:** Modular monolith phù hợp team/domain chưa ổn định, cần transaction/join đơn giản và scale đồng đều; boundary bằng module API, ownership, dependency rule và schema discipline.
- **1 điểm:** Tách service khi business capability/owner/deploy cadence/scaling/failure isolation độc lập có lợi ích đo được, không chỉ vì codebase lớn.
- **1 điểm:** Tính chi phí network, eventual consistency, observability, CI/CD, on-call, security và data migration; có strangler/rollback thay vì deadline “microservice hóa”.

**Điểm then chốt:** Bounded context không bắt buộc là process riêng. **Failure modes:** distributed monolith, shared DB write, chatty calls, ownership mơ hồ, copy platform logic, transaction xuyên service. **Tham chiếu:** SE-007, SE-018, SE-019, SE-045, SD-036.

### QS-034 — [Architecture][ADR][Build vs buy] — 3 điểm

**Câu hỏi:** Viết khung ADR cho quyết định tự xây hay mua workflow engine. Các giả định, option, consequence, exit strategy và tín hiệu xem lại nào bắt buộc có?

- **1 điểm:** ADR ghi context/problem, drivers có trọng số, constraint/assumption, option kể cả do-nothing và decision owner/date/status.
- **1 điểm:** So sánh capability fit, reliability/security/compliance, integration/lock-in, extensibility, TCO vận hành, skills/support và time-to-value bằng spike/evidence.
- **1 điểm:** Ghi consequence/risk, migration/exit/data portability, rollback và trigger xem lại như scale, price, SLA/vendor change; supersede chứ không sửa mất lịch sử.

**Điểm then chốt:** ADR ghi “vì sao trong bối cảnh này”, không chỉ outcome. **Failure modes:** benchmark vendor không đại diện, bỏ egress/license growth, không có exit, tự xây bỏ chi phí on-call. **Tham chiếu:** SE-039, SE-040.

## G. Distributed Systems

### QS-035 — [Distributed systems][CAP][Quorum] — 3 điểm

**Câu hỏi:** Vì sao `R + W > N` chưa tự động tạo linearizability? Phân tích version, sloppy quorum, clock, read repair và network partition.

- **1 điểm:** `R+W>N` chỉ tạo giao nhau tập replica theo giả định; linearizability còn cần version/order và read thấy write mới nhất đã commit.
- **1 điểm:** Sloppy quorum/handoff có thể dùng node khác nên tập không giao; concurrent writes, LWW dựa clock skew hoặc coordinator split tạo conflict/stale.
- **1 điểm:** Cần leader/consensus hoặc quorum protocol có epoch/version fencing, read repair không thay atomic commit; định nghĩa hành vi khi partition và session.

**Điểm then chốt:** Quorum số học không đủ nếu membership và version semantics lỏng. **Failure modes:** split brain, stale leader, clock rollback, read repair sau khi đã trả stale, hinted handoff mất. **Tham chiếu:** SD-006, SD-008, SD-010, SD-013, SD-045.

### QS-036 — [Distributed systems][Messaging][Idempotency] — 3 điểm

**Câu hỏi:** Broker giao at-least-once và consumer vừa cập nhật DB vừa phát event tiếp. Thiết kế transaction boundary, dedup retention và recovery khi crash ở từng bước.

- **1 điểm:** Consumer ghi business effect + inbox/dedup event ID trong cùng local transaction; duplicate trả/no-op, retention dài hơn replay/retry window.
- **1 điểm:** Ghi event tiếp vào outbox cùng transaction, relay at-least-once; commit broker offset/checkpoint chỉ sau durable DB outcome theo connector semantics.
- **1 điểm:** Phân tích crash trước/sau DB commit, publish và ack; retry toàn unit, unique constraint, payload/version/partition ordering và replay/rebuild plan.

**Điểm then chốt:** Dedup riêng ngoài business transaction vẫn có crash window. **Failure modes:** ID không global/scope sai, TTL quá ngắn, poison message chôn DLQ, side effect ngoài DB không idempotent. **Tham chiếu:** SD-022, SD-023, SD-026, DB-052, DB-059.

### QS-037 — [Distributed systems][Cache][Race] — 3 điểm

**Câu hỏi:** Cache-aside có reader miss trước update nhưng set giá trị cũ sau khi writer invalidate. Mô tả timeline và chọn cơ chế giảm stale cùng stampede cho hot key.

- **1 điểm:** Timeline đúng: reader lấy old DB/miss, writer commit+invalidate, reader set old sau invalidate; TTL đơn thuần chỉ giới hạn thời gian stale.
- **1 điểm:** Dùng version/generation trong key/value, conditional set, update event theo version hoặc delayed/double invalidation tùy guarantee; source DB vẫn authoritative.
- **1 điểm:** Hot miss dùng single-flight/lease, TTL jitter, stale-while-revalidate/negative cache và bounded fallback; monitor stale/hit/load.

**Điểm then chốt:** “Delete cache sau write” vẫn có race với fill đang bay. **Failure modes:** lock cache mất không fencing, stampede khi lock holder fail, cache penetration, invalidation reorder, write-behind mất dữ liệu. **Tham chiếu:** SD-017, SD-018, SD-019, DB-058.

### QS-038 — [Distributed systems][Saga][Payment] — 3 điểm

**Câu hỏi:** Payment provider timeout sau khi có thể đã charge, inventory reserve thành công và client retry. Thiết kế state machine, reconciliation, compensation và trạng thái “unknown”.

- **1 điểm:** State machine durable có `pending/unknown/confirmed/failed/compensating`; cùng idempotency key cho client→service→provider, không retry charge với key mới.
- **1 điểm:** Timeout là outcome unknown; query provider/webhook/reconciliation ledger trước quyết định, dedup callback và transition bằng compare-and-set/version.
- **1 điểm:** Inventory reservation có expiry/confirm/release idempotent; compensation/refund là action có thể fail, cần retry/manual queue/audit và client response không nói false failure/success.

**Điểm then chốt:** Không thể suy “timeout = chưa charge”. **Failure modes:** double charge/refund, release inventory rồi payment thành công muộn, webhook giả mạo/out-of-order, saga state mất. **Tham chiếu:** SD-027, SD-029, SD-055, SEC-036, DB-040.

### QS-039 — [Distributed systems][Ordering][Clock] — 3 điểm

**Câu hỏi:** Hai region tạo event có timestamp wall-clock trái thứ tự causal. Phân biệt total order, causal order và nêu cách dùng sequence/epoch hoặc logical clock theo nhu cầu.

- **1 điểm:** Wall clock có skew/jump nên timestamp không chứng minh causality; causal order chỉ buộc cause trước effect, total order so được mọi cặp nhưng cần coordination/tie-break.
- **1 điểm:** Per-aggregate/partition sequence và leader epoch/fencing phù hợp ordering cục bộ; Lamport biểu diễn happens-before một chiều, vector phát hiện concurrent nhưng metadata lớn.
- **1 điểm:** Chọn theo requirement: ledger/transition cần sequence/consensus trong scope, analytics có thể event-time+watermark; consumer xử lý duplicate/out-of-order.

**Điểm then chốt:** “Sort timestamp” không sửa causal correctness. **Failure modes:** clock rollback, sequence reset khi failover, global ordering bottleneck, late event ghi đè state mới. **Tham chiếu:** SD-009, SD-010, SD-024, SD-045.

### QS-040 — [Distributed systems][Resilience][Overload] — 3 điểm

**Câu hỏi:** Retry đồng loạt làm downstream đang chậm bị sập hoàn toàn. Phối hợp timeout budget, retry policy, jitter, circuit breaker, bulkhead, rate limit và load shedding.

- **1 điểm:** Timeout phải theo end-to-end budget; retry chỉ transient/idempotent, giới hạn attempt/time, exponential backoff + jitter và retry budget để không nhân tải.
- **1 điểm:** Circuit breaker ngừng gọi dependency lỗi; bulkhead cô lập pool; rate/concurrency limit và bounded queue tạo backpressure; load shedding bỏ việc ít giá trị trước saturation.
- **1 điểm:** Propagate deadline/cancellation, trả `Retry-After` khi phù hợp, quan sát retry amplification/queue/saturation và canary policy; capacity downstream quyết định admission.

**Điểm then chốt:** Các pattern bổ sung nhau, không phải checklist đặt mặc định. **Failure modes:** retry mọi tầng, timeout dài hơn caller, half-open herd, queue vô hạn, circuit breaker global cho mọi tenant. **Tham chiếu:** SD-029, SD-030, SD-031, ALG-048.

## H. Infrastructure và Cloud

### QS-041 — [Infrastructure][Networking][Diagnosis] — 3 điểm

**Câu hỏi:** Request nhỏ qua HTTPS thành công nhưng upload lớn timeout chỉ ở một đường mạng. Lập giả thuyết theo DNS/TLS/proxy/MTU và kế hoạch khoanh vùng bằng bằng chứng.

- **1 điểm:** Small request thành công làm DNS/TLS cơ bản ít khả năng hơn; giả thuyết MTU/PMTUD black hole, proxy body/idle timeout, buffering/WAF hoặc upload rate/HTTP version.
- **1 điểm:** So sánh đường tốt/xấu bằng trace ID và proxy/server log, packet capture/TCP retransmit/ICMP, thử payload/DF/MTU, curl protocol/direct hop có kiểm soát.
- **1 điểm:** Khoanh từng hop client→LB→proxy→app, thay một biến; mitigation có blast radius/rollback, rồi sửa MTU/ICMP/timeout/streaming đúng nguyên nhân.

**Điểm then chốt:** Không tăng timeout trước khi biết bytes dừng ở hop nào. **Failure modes:** packet capture lộ payload, health check nhỏ che lỗi, proxy buffering đầy disk, asymmetric path, TLS inspection. **Tham chiếu:** INF-001, INF-003, INF-010, INF-030.

### QS-042 — [Kubernetes][Health probes][Availability] — 3 điểm

**Câu hỏi:** Liveness probe gọi mọi dependency; database chập chờn khiến toàn bộ pod restart. Thiết kế lại startup/liveness/readiness và hành vi degrade.

- **1 điểm:** Startup cho khởi động chậm; liveness chỉ chứng minh process không thể tự hồi phục và không phụ thuộc mọi downstream; readiness quyết định nhận traffic.
- **1 điểm:** DB lỗi thì readiness/degrade theo critical journey và local capacity, không restart toàn fleet; timeout/cache probe, tránh probe tự gây tải.
- **1 điểm:** Phối hợp failure threshold/period, PDB/rolling/draining và alert dependency; kiểm thử outage để tránh cascade và recovery herd.

**Điểm then chốt:** Restart không chữa dependency outage. **Failure modes:** liveness chung DB làm restart loop, readiness luôn false che lỗi, probe endpoint lock chung, startup quá ngắn, mọi pod reconnect đồng loạt. **Tham chiếu:** INF-021, SD-046, SD-047, NET-053.

### QS-043 — [Kubernetes][Resources][Runtime] — 3 điểm

**Câu hỏi:** Pod Java/.NET có CPU throttling, memory limit và burst traffic. Giải thích request/limit ảnh hưởng scheduling/runtime, OOMKill, autoscaling và capacity downstream.

- **1 điểm:** Request ảnh hưởng scheduling/CPU share; CPU limit gây throttling/tail latency, memory limit bị kernel OOMKill; runtime heap còn native/headroom.
- **1 điểm:** HPA theo CPU có thể phản ứng muộn/sai khi throttled hoặc bottleneck downstream; dùng demand/queue/custom SLI, stabilization và min/max capacity.
- **1 điểm:** Đặt concurrency/admission theo downstream, load/soak test, requests gần working set thực, limit có headroom và PDB/node/AZ capacity.

**Điểm then chốt:** Scale pod không tăng capacity database tự động. **Failure modes:** request quá thấp gây overcommit/eviction, limit CPU quá chặt, OOM restart storm, HPA thundering herd, GC do memory pressure. **Tham chiếu:** INF-022, INF-023, INF-029, DO-021, JVM-054.

### QS-044 — [Infrastructure as Code][Terraform][Safety] — 3 điểm

**Câu hỏi:** Terraform state bị lưu local, hai pipeline apply đồng thời và có resource sửa tay. Phân tích rủi ro, backend/locking, secret, drift và quy trình import/reconcile.

- **1 điểm:** Local state dễ mất/leak và không phối hợp; concurrent apply race/corrupt/overwrite. Dùng remote encrypted backend, access control, versioning/backup và state locking.
- **1 điểm:** State có thể chứa secret dù config dùng secret manager; giới hạn IAM/CI log, short-lived credential và tách state/blast radius hợp lý.
- **1 điểm:** Detect drift bằng plan định kỳ; quyết định import/cập nhật code hay revert manual change qua review, không sửa state tay; serialize apply và audit.

**Điểm then chốt:** State là dữ liệu nhạy cảm và nguồn mapping identity, không chỉ cache. **Failure modes:** force-unlock nhầm active job, backend key mất, apply plan cũ, broad IAM, manual hotfix không backport. **Tham chiếu:** INF-041, INF-042, INF-043.

### QS-045 — [Cloud][Disaster recovery][Design] — 3 điểm

**Câu hỏi:** Hệ thống phải đạt RPO 5 phút, RTO 30 phút khi mất cả region. Phân biệt HA/backup/DR và nêu topology, restore/failover test cùng failure mode quan trọng.

- **1 điểm:** HA xử lý failure thường trong topology; backup giữ bản độc lập; DR khôi phục khi site/failure domain mất. RPO 5 phút định data loss, RTO 30 phút định service restore.
- **1 điểm:** Chọn async cross-region replication/log archive + immutable backup theo failure model, warm capacity/routing/fencing/runbook; sync chỉ nếu latency/availability cho phép.
- **1 điểm:** Diễn tập mất region, restore checksum/application dependency/secret/DNS, failover và failback/reconcile; đo RPO/RTO thật, không chỉ “replica healthy”.

**Điểm then chốt:** Replica có thể sao chép delete/corruption nên không thay backup. **Failure modes:** split brain, DR thiếu capacity/key/quyền, DNS TTL, backup chưa restore, dependency vẫn ở region cũ. **Tham chiếu:** INF-045, SD-043, SD-044, DO-024, DB-062, DB-063.

## I. DevOps và Observability

### QS-046 — [CI/CD][Supply chain][Release] — 3 điểm

**Câu hỏi:** Thiết kế pipeline “build once, promote same artifact” có provenance, SBOM, signing và secret isolation từ PR không tin cậy tới production.

- **1 điểm:** Build hermetic/reproducible từ pinned dependency/toolchain trên isolated ephemeral runner; artifact immutable có digest/provenance/SBOM và chỉ build một lần.
- **1 điểm:** Ký bằng identity/key được bảo vệ và verify policy khi promote/deploy; config/secret inject lúc runtime, không bake vào artifact/log/cache.
- **1 điểm:** Fork PR không nhận production secret/quyền publish; tách trust stage/approval, least privilege short-lived workload identity và attest source/test.

**Điểm then chốt:** Ký artifact độc hại chỉ chứng minh ai đã ký; trust policy phải bảo vệ build inputs/runner. **Failure modes:** poisoned cache, mutable tag, long-lived token, untrusted script sau approval, SBOM không gắn digest. **Tham chiếu:** DO-003, DO-004, DO-005, DO-007, DO-013, DO-014, SEC-038.

### QS-047 — [Delivery][Progressive release][Rollback] — 3 điểm

**Câu hỏi:** So sánh canary, blue-green và rolling update cho thay đổi có cả schema. Nêu metric gate, compatibility window và điều kiện rollback/roll-forward.

- **1 điểm:** Rolling thay dần, blue-green chuyển toàn cohort nhanh/rollback code nhanh nhưng cần gấp capacity, canary tăng traffic có kiểm soát và học từ metric.
- **1 điểm:** Schema theo expand–migrate–contract, cả old/new app đọc/ghi tương thích; rollback code không hoàn tác data, có thể cần roll-forward/reconciliation.
- **1 điểm:** Gate theo error/latency/business/DB saturation và đủ observation; abort/rollback tự động có guard, cohort đại diện, feature flag tách deploy/release.

**Điểm then chốt:** Strategy deploy không cứu breaking schema. **Failure modes:** canary không nhận traffic quan trọng, metric average che tail, migration chạy startup nhiều pod, rollback sau destructive write. **Tham chiếu:** DO-008, DO-009, DO-010, DO-011, DO-016.

### QS-048 — [SRE][SLO][Alerting] — 3 điểm

**Câu hỏi:** Dịch vụ có average latency tốt nhưng user phàn nàn theo từng đợt. Chọn SLI, SLO/error budget và multi-window burn-rate alert thay vì threshold CPU đơn lẻ.

- **1 điểm:** Chọn SLI từ user journey: ratio request good theo availability và latency threshold/percentile có cửa sổ; segment endpoint/region/tenant tier khi cần.
- **1 điểm:** SLO tạo error budget; average che burst/tail. Multi-window burn rate bắt cả cháy nhanh và chậm, alert theo budget impact chứ không CPU đơn lẻ.
- **1 điểm:** Alert actionable có owner/runbook/severity, correlate saturation/deploy nhưng không page mọi cause metric; review SLO theo business.

**Điểm then chốt:** Percentile của average hoặc average percentile có thể sai khi aggregate. **Failure modes:** high-cardinality SLI, traffic thấp làm ratio nhiễu, alert flapping, SLO chỉ theo server không theo user. **Tham chiếu:** DO-017, DO-018, DO-019, DO-020.

### QS-049 — [Observability][Telemetry][Cost] — 3 điểm

**Câu hỏi:** Phân chia vai trò log, metric, trace và profile trong điều tra p99. Xử lý correlation, sampling và cardinality khi tenant/order ID rất lớn.

- **1 điểm:** Metric phát hiện xu hướng/SLI, trace nối critical path từng request, log cho event/detail, profile cho CPU/allocation/lock theo code; dùng cùng correlation/resource metadata.
- **1 điểm:** ID tenant/order không làm metric label; để trong sampled trace/log có access/redaction, hoặc bounded cohort. Histogram bucket phù hợp SLO.
- **1 điểm:** Head/tail/adaptive sampling giữ error/slow trace, log sampling/retention tier và exemplars; kiểm soát PII, cost và missing context qua async/message.

**Điểm then chốt:** Telemetry phải trả lời câu hỏi, không phải thu mọi thứ. **Failure modes:** cardinality làm backend sập, sample mất lỗi hiếm, trace ID không propagate, log token, clock lệch. **Tham chiếu:** DO-026, DO-028, DO-029, DO-030, DO-031, DO-033, DO-035.

### QS-050 — [Incident response][Operations][Learning] — 3 điểm

**Câu hỏi:** Nêu trình tự từ detect, triage, mitigate, communicate, recover đến postmortem. Phân biệt hành động giảm blast radius với điều tra root cause trong sự cố đang diễn ra.

- **1 điểm:** Declare/assign incident commander, scribe/comms/ops; triage impact/scope/change, giữ timeline và cập nhật stakeholder theo cadence.
- **1 điểm:** Ưu tiên mitigation giảm blast radius—rollback, shed, isolate, failover—với verification/abort; bảo toàn bằng chứng nhưng không trì hoãn phục hồi để tìm root cause.
- **1 điểm:** Sau recover, postmortem blameless có contributing conditions, detection/response gaps, action owner/deadline/priority và kiểm tra hiệu lực/runbook/game day.

**Điểm then chốt:** Root cause analysis sâu diễn ra khi hệ thống đã ổn định. **Failure modes:** nhiều người chỉ huy, đổi nhiều biến cùng lúc, im lặng với user, “human error” là kết luận, action list không owner. **Tham chiếu:** DO-025, DO-038, DO-039, DO-040, DO-050, SE-042.

## J. Security

### QS-051 — [Security][JWT][Identity] — 3 điểm

**Câu hỏi:** Một API chỉ decode JWT và kiểm tra `exp`. Liệt kê validation bắt buộc, key rotation/revocation và cách tránh algorithm/key confusion.

- **1 điểm:** Verify chữ ký bằng key tin cậy và allowlist algorithm; kiểm tra issuer, audience, exp, nbf/iat theo policy, token type và required claims/scopes.
- **1 điểm:** `kid` chỉ chọn trong JWKS của issuer, không nhận URL/key từ token; cache/refresh key hỗ trợ overlap rotation và xử lý unknown key an toàn.
- **1 điểm:** Access token ngắn hạn, revoke bằng session/token version/denylist khi threat yêu cầu; authorization resource vẫn riêng, TLS/log redaction và clock skew bounded.

**Điểm then chốt:** Decode base64 không xác thực; chữ ký đúng cũng chưa chứng minh token dành cho API này. **Failure modes:** `alg=none`, algorithm/key confusion, accept arbitrary JKU, audience bỏ qua, token trong log/URL. **Tham chiếu:** SEC-008, SEC-009, NET-032, JVM-041.

### QS-052 — [Security][Injection][Code review] — 3 điểm

**Câu hỏi:** API parameterize giá trị nhưng nối trực tiếp `ORDER BY ${userInput}`. Vì sao vẫn injection và thiết kế allowlist/query builder cùng least privilege thế nào?

- **1 điểm:** Parameter chỉ bind value, không bind grammar/identifier/direction; nối `ORDER BY` cho phép đổi cấu trúc SQL nên vẫn injection.
- **1 điểm:** Map enum API sang danh sách cột/direction cố định hoặc query builder AST có allowlist; quote identifier bằng dialect API chỉ là bổ sung, không nhận raw expression.
- **1 điểm:** DB role least privilege/read-only khi phù hợp, limit pagination/complexity, audit query template và test payload; parameter type đúng.

**Điểm then chốt:** Escape chuỗi thủ công không phải giải pháp. **Failure modes:** allowlist dùng substring, secondary sort raw, multi-statement/provider setting, error leak, quyền DB owner. **Tham chiếu:** SEC-023, DB-065.

### QS-053 — [Security][SSRF][Threat modeling] — 3 điểm

**Câu hỏi:** Service tải URL do user nhập. Phân tích redirect, DNS rebinding, alternate IP notation và metadata endpoint; đề xuất control nhiều lớp.

- **1 điểm:** Threat gồm loopback/private/link-local/metadata, IPv6/decimal/octal/mixed notation; parser discrepancy, credential trong URL, non-HTTP scheme/port.
- **1 điểm:** Resolve và kiểm tra mọi IP, chặn private/special range, revalidate mỗi redirect/hop, giới hạn scheme/port/redirect/size/time; DNS rebinding đòi pin/connect tới IP đã kiểm.
- **1 điểm:** Egress proxy/firewall/default-deny, workload identity/metadata hardening, sandbox fetcher và response content validation/log alert; allowlist domain khi business cho phép.

**Điểm then chốt:** Regex URL/domain đơn lẻ không đủ. **Failure modes:** TOCTOU DNS, redirect sang nội bộ, CNAME/rebinding, proxy env bypass, response bomb, blind SSRF qua timing. **Tham chiếu:** SEC-029, NET-036, INF-027.

### QS-054 — [Security][Secrets][Supply chain] — 3 điểm

**Câu hỏi:** Token production xuất hiện trong CI log của một build từ fork. Nêu containment, rotation, audit phạm vi và thay đổi pipeline để ngăn tái diễn.

- **1 điểm:** Dừng/restrict job/artifact/log, revoke/rotate token ngay theo dependency, kiểm tra fork/run/session đang dùng; giả định secret đã bị lấy dù log được xóa.
- **1 điểm:** Audit provider và CI cho use từ lúc lộ, scope resource/data/action, preserve evidence, notify owner/incident process và rotate downstream nếu token tạo credential khác.
- **1 điểm:** Fork không nhận secret; trust-separated workflow, ephemeral runner, short-lived OIDC identity, masked/redacted logs, least privilege/environment approval và secret scanning.

**Điểm then chốt:** Xóa log không thu hồi secret. **Failure modes:** rotate nhưng app vẫn dùng token cũ, attacker sửa artifact/cache, token broad/không audit, PR code chạy trong privileged post-step. **Tham chiếu:** DO-007, DO-013, SEC-020, SEC-038, SEC-046.

### QS-055 — [Security][Authorization][Multi-tenant] — 3 điểm

**Câu hỏi:** Một endpoint kiểm tra role nhưng không ràng buộc tenant/resource ownership. Mô tả IDOR/BOLA, cách enforce authorization nhất quán và audit mà không log PII/token quá mức.

- **1 điểm:** Role chỉ là coarse permission; BOLA/IDOR xảy ra khi đổi resource ID truy cập object tenant khác. Phải kiểm subject-action-resource-tenant và trạng thái/chính sách.
- **1 điểm:** Enforce policy/resource-based authorization ở service/query boundary, lấy tenant từ trusted identity không chỉ request, scope query/row-level control và deny by default; test cross-tenant.
- **1 điểm:** Audit actor, tenant, action, resource opaque ID, decision/reason, correlation và outcome; redact/minimize PII/token, tamper-resistant access/retention.

**Điểm then chốt:** Authentication và role hợp lệ không chứng minh ownership resource. **Failure modes:** confused deputy/service credential, cache key thiếu tenant, batch/export bỏ filter, support break-glass không audit, log raw body/token. **Tham chiếu:** SEC-011, SEC-012, SEC-042, SEC-043, SEC-049, SD-040.

## Tổng hợp kết quả

| Mức | Điểm | Diễn giải |
|---|---:|---|
| Cần củng cố | 0–90 | Ôn lại cơ chế nền tảng và làm lại các câu dưới 2 điểm. |
| Middle mạnh | 91–115 | Kết luận thường đúng nhưng còn thiếu invariant, production failure hoặc verification. |
| Senior sẵn sàng | 116–140 | Lập luận tốt trên phần lớn miền; tập trung các section dưới 70%. |
| Senior vững | 141–153 | Cân bằng correctness, delivery và vận hành; trade-off rõ. |
| Rất mạnh | 154–165 | Có chiều sâu cross-domain và diễn đạt hiệu quả dưới giới hạn thời gian. |

Ngoài tổng điểm, hãy đánh dấu mọi câu **0 điểm** là lỗ hổng ưu tiên. Một ứng viên Senior backend không nên bù Security/Database rất yếu chỉ bằng điểm ngôn ngữ cao.
