# Bài 15 — JMM, safe publication, executors, Loom và backpressure

## Bar senior

Chứng minh thread safety bằng happens-before/invariant; thiết kế bounded concurrency/cancellation; đọc failure từ thread dump. Không dùng “test chạy 1.000 lần không fail” làm proof. [Java sample](../SourceSamples/15-concurrency-deep/src/main/java/course/concurrencydeep/ConcurrencyDeepDemo.java) · [C# sample đối chiếu](../SourceSamples/15-concurrency-deep/csharp/Program.cs).

## 1. Java Memory Model

Ba trục khác nhau:

- **Atomicity:** operation không bị quan sát ở trạng thái trung gian.
- **Visibility:** thread khác có thấy write hay không.
- **Ordering:** compiler/CPU có thể reorder trong giới hạn observable semantics.

Happens-before quan trọng: program order; monitor unlock→subsequent lock; volatile write→subsequent read cùng field; thread start; mọi action trong thread→successful join; completion rules của concurrent utilities. Không có HB thì data race và kết quả có thể hợp lệ theo JMM dù “CPU của tôi luôn chạy đúng”.

`volatile` cho visibility/order của một field, không bảo vệ compound invariant. Lock tạo mutual exclusion + HB. Atomic dùng CAS cho operation riêng; workflow nhiều field vẫn cần coordination khác.

### JMM không phải bản đổi tên của CLR memory model

- Java volatile write → subsequent volatile read cùng field là một happens-before edge theo JMM. C# `volatile`/`Volatile.Read`/`Volatile.Write` có contract của .NET; không lấy một litmus test chạy trên x64/.NET để chứng minh code Java có data race là đúng, hoặc ngược lại.
- Java cho `volatile long`/`double`; C# không cho khai báo hai kiểu đó là `volatile`. Khi cần read-modify-write/linearization, dùng `Interlocked`/`Atomic*` hoặc lock thay vì dựa vào visibility.
- Java `final` field có initialization-safety rule khi constructor hoàn thành và object được publish đúng. C# `readonly` chủ yếu hạn chế assignment; nó không phải bản dịch 1:1 của final-field semantics và cũng không tạo deep immutability.
- `synchronized` unlock→lock và `Monitor.Exit`→`Monitor.Enter` đều là publication boundary trong runtime tương ứng, nhưng proof phải dùng specification/API contract của đúng platform.
- Với cả hai bên, `volatile bool initialized` đi kèm nhiều mutable field rất dễ publish một invariant dang dở. Ưu tiên immutable snapshot, lock hoặc primitive cấp cao.

Tài liệu gốc để kiểm chứng: [JLS §17.4 Memory Model](https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html#jls-17.4) và [C# `volatile`](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/volatile).

### Safe publication

- static initialization holder;
- write reference vào volatile;
- publish dưới lock và đọc cùng lock;
- concurrent collection/queue có documented memory effects;
- hoàn thành constructor rồi publish immutable object với final fields.

Tránh `this` escape trong constructor (register listener/start thread/call overridable method). Double-checked locking chỉ đúng khi instance reference là `volatile`; initialization-on-demand holder thường đơn giản hơn.

## 2. Locks, atomics và utilities

| Công cụ | Dùng khi | Bẫy |
|---|---|---|
| `synchronized` | critical section đơn giản | giữ lock qua slow I/O; nested order deadlock |
| `ReentrantLock/Condition` | timed/interruptible lock, nhiều condition | luôn unlock trong finally |
| read/write lock | read nhiều, write ít và section đủ lớn | starvation/overhead có thể tệ hơn lock thường |
| `StampedLock` | optimistic read đo được lợi ích | không reentrant; stamp validation phức tạp |
| `AtomicLong` | linearizable counter/read | contention hotspot |
| `LongAdder` | metric write contention cao | `sum()` không phải linearizable transaction value |
| latch/barrier/phaser | phối hợp phase/test | không thay data protection |
| blocking queue | producer/consumer + backpressure | unbounded queue chỉ dời OOM/latency |

Deadlock: mutual exclusion + hold-and-wait + no preemption + circular wait. Phòng bằng lock ordering, thu nhỏ scope, timed acquisition hoặc loại shared state. Livelock vẫn chạy nhưng không tiến; starvation là một task không được phục vụ công bằng.

## 3. Executor capacity

CPU-bound pool gần số core khả dụng (sau container quota), đo saturation. Blocking I/O platform-thread pool cần tính wait/compute và phải bounded. `ThreadPoolExecutor` cần quyết định rõ core/max, queue capacity, rejection policy, thread factory, metrics và shutdown. Unbounded queue che overload cho đến khi latency/memory sụp; caller-runs có thể tạo backpressure nhưng cần xét event-loop/request thread.

ForkJoinPool tối ưu divide-and-conquer/work stealing; common pool là shared global resource. Không để blocking I/O tùy ý chiếm common pool.

Java thường tạo executor có owner, queue/rejection policy và shutdown rõ. `Task.Run` thường dùng .NET global adaptive ThreadPool; đừng “sửa” overload của một subsystem bằng cách chỉnh global pool như thể đó là `ThreadPoolExecutor`. Ở .NET, bound một pipeline bằng `SemaphoreSlim`, bounded `Channel<T>`, rate limiter hoặc Dataflow; async I/O thật không giữ worker trong lúc chờ.

### `Channel<T>` không phải `BlockingQueue<T>` đổi tên

- Bounded `Channel.Writer.WriteAsync` suspend producer bất đồng bộ khi full; `BlockingQueue.put` block thread (virtual thread có thể làm chi phí chờ rẻ hơn).
- Channel có `Complete/TryComplete`, `Reader.Completion` và `ReadAllAsync`. `BlockingQueue` không có close protocol chuẩn; cần poison pill, interrupt, external lifecycle hoặc abstraction cao hơn.
- Channel có các full mode wait/drop-oldest/drop-newest/drop-write. Blocking queue thường dùng `put`, `offer(timeout)` hoặc rejection ở executor; semantics mất dữ liệu phải là quyết định business, không phải config tình cờ.
- `BlockingCollection<T>` là mapping blocking gần hơn; `Channel<T>` là async pipeline gần hơn. Reactive Streams/`Flow.Publisher` mới có demand protocol; Java `Stream` không tương đương `IAsyncEnumerable<T>`.

## 4. CompletableFuture không phải async/await 1:1

- Non-`Async` continuation có thể chạy trên thread hoàn thành stage; `Async` không truyền executor dùng common pool mặc định.
- `allOf` trả `Void`; phải join individual result và quyết định fail-fast/collect error.
- `CompletionException` bọc cause; thiết kế translation boundary.
- `orTimeout`/`completeOnTimeout` hoàn thành future theo thời gian, **không bảo đảm underlying supplier bị interrupt/dừng**. Cancellation Java là cooperative: operation/client phải hiểu interrupt/deadline.
- Timeout riêng từng hop không đủ; truyền absolute deadline/budget xuyên call chain để tránh tổng latency vượt SLO.

## 5. Virtual thread, structured concurrency và Scoped Values

Virtual thread (standard từ Java 21) phù hợp nhiều blocking task độc lập, cho code imperative/thread-per-request. Nó không tăng CPU, connection pool hoặc downstream quota. ThreadLocal lớn/nhiều gây footprint; luôn có semaphore/bulkhead/rate limit ở resource boundary.

C# async method được compiler biến thành state machine/continuation; khi await I/O chưa xong, nó không giữ một worker thread. Java virtual thread vẫn là `Thread` có identity và stack; JVM có thể unmount nó khỏi carrier khi blocking operation được hỗ trợ. Vì vậy `Task.Run` không phải virtual thread, và không bọc I/O C# vốn đã async trong `Task.Run` chỉ để bắt chước Loom. `AsyncLocal<T>` đi theo .NET `ExecutionContext` qua await; Java `ThreadLocal` đi theo thread, còn `ScopedValue` chỉ là mapping gần cho immutable dynamic context.

Ghi chú version: monitor-related pinning là vấn đề đáng kể ở Java 21; JDK 24/JEP 491 loại phần lớn pinning do `synchronized`. Native/foreign call và version thực chạy vẫn cần profile, nên không lặp máy móc lời khuyên cũ.

Scoped Values đã standard ở Java 25 cho immutable context theo dynamic scope. Structured Concurrency vẫn preview trong Java 25/26: dùng để học tư duy child-task lifetime/failure/cancellation, không khóa production API nếu policy không chấp nhận preview.

Reactive Streams giải bài toán async stream có backpressure; không tự làm business code nhanh hơn và debug/context phức tạp hơn. Với Spring: MVC + virtual thread thường hợp blocking stack; WebFlux hợp end-to-end non-blocking/high connection concurrency khi team/tooling phù hợp. Benchmark workload thật.

## C#/.NET refresh và mapping hai chiều

Đây là mapping theo **vai trò**, không phải cam kết rằng memory model hay scheduling giống hệt nhau:

| Ý định | C#/.NET | Java | Khác biệt phải nói được ở level senior |
|---|---|---|---|
| work item/async result | `Task<T>`, `ValueTask<T>` | `CompletableFuture<T>`, `Future<T>` | Java không có `await` ở mức ngôn ngữ; continuation/executor và exception wrapping khác |
| scheduler/pool | `ThreadPool`, `TaskScheduler` | `ExecutorService`, `ForkJoinPool` | đừng gửi blocking I/O vào shared pool mà không kiểm soát capacity |
| nhiều blocking I/O | async I/O hoặc Task trên pool | virtual thread per task | virtual thread vẫn blocking theo style imperative; không tăng DB connection/quota |
| mutex/monitor | `lock`, `Monitor` | `synchronized` | đều reentrant; contract memory model không được suy diễn từng câu chữ giữa CLR và JMM |
| lock nâng cao | `ReaderWriterLockSlim`, `SemaphoreSlim` | `ReentrantReadWriteLock`, `StampedLock`, `Semaphore` | `SemaphoreSlim` còn có async wait; Java semaphore acquire là blocking/interruption-aware |
| atomic/visibility | `Interlocked`, `Volatile.Read/Write`, `volatile` | `Atomic*`, `VarHandle`, `volatile` | visibility không biến workflow nhiều bước thành atomic; loại được phép dùng `volatile` của C# cũng khác Java |
| concurrent map | `ConcurrentDictionary` | `ConcurrentHashMap` | callback atomic method có constraint; không đặt side effect chậm vào callback tùy tiện |
| producer/consumer | `Channel<T>`, `BlockingCollection<T>` | `BlockingQueue<T>`, Reactive Streams | bounded capacity mới tạo backpressure; unbounded chỉ dời failure sang memory/latency |
| countdown/phase | `CountdownEvent`, `Barrier` | `CountDownLatch`, `CyclicBarrier`, `Phaser` | coordination không tự bảo vệ business state |
| fan-out/fan-in | `Task.WhenAll/WhenAny` | `CompletableFuture.allOf/anyOf` | phải định nghĩa fail-fast, collect lỗi, cancel sibling và giữ thứ tự result |
| cancellation | `CancellationToken` | interrupt + token/deadline ở API | cả hai cooperative; timeout wrapper không chắc dừng DB/HTTP operation bên dưới |
| context | `AsyncLocal<T>` | `ScopedValue`/`ThreadLocal` | context có thể mất hoặc leak qua boundary; Scoped Value immutable theo dynamic scope |
| async stream | `IAsyncEnumerable<T>` | `Flow.Publisher<T>`/reactive library | Java `Stream` không phải async stream và không cung cấp network backpressure |
| diagnose | `dotnet-trace`, `dotnet-dump`, counters | JFR, `jcmd`, thread dump | lấy nhiều snapshot và ghép queue time, saturation, lock contention với trace |

`Lazy<T>` với `ExecutionAndPublication` là cách C# thường dùng để khởi tạo singleton an toàn; Java thường dùng static holder/enum hoặc volatile DCL khi thật sự cần. [C# deep sample](../SourceSamples/15-concurrency-deep/csharp/Program.cs) cố ý dùng `Lazy<T>`, bounded `Channel<T>`, `Interlocked` và deadline để đối chiếu Java volatile DCL, bounded executor, `LongAdder` và latch—mapping ý định thay vì dịch từng dòng.

Ôn lại C#: tránh sync-over-async (`.Result/.Wait()`), `Task.Run` cho I/O vốn đã async, fire-and-forget mất ownership, thread-pool starvation, quên truyền `CancellationToken`, giữ lock qua `await`, và `ConfigureAwait` cargo cult trong ASP.NET Core không có custom synchronization context mặc định. Với `ValueTask`, chỉ dùng khi profiling chứng minh lợi ích và tuân thủ rule chỉ await/consume đúng contract; mặc định chọn `Task` cho API rõ ràng.

## 6. Production failure checklist

- Capacity: active/queued/rejected tasks, thread count, semaphore permits, pool saturation.
- Latency: queue time tách execution time; deadline/timeout/cancel count.
- Correctness: invariant và linearization point; duplicate/retry/idempotency.
- Shutdown: ngừng nhận việc, cancel/drain có deadline, restore interrupt, đóng executor.
- Context: trace/security/locale không giả định ThreadLocal tự truyền qua mọi abstraction.
- Diagnose: nhiều thread dump + JFR lock/thread events; phân biệt BLOCKED monitor, WAITING condition/future và RUNNABLE native I/O/CPU.

| Cần tìm | Java | .NET |
|---|---|---|
| pool starvation/backlog | executor active/queue/rejected metrics, JFR | ThreadPool thread/queue/completed counters |
| monitor/deadlock | nhiều `jcmd Thread.print`, JFR lock events | `dotnet-stack`, `dotnet-dump`, SOS/Parallel Stacks |
| wait gián đoạn | JFR/async-profiler | `dotnet-trace`/EventPipe, PerfView |
| CPU/allocation | JFR/async-profiler | `dotnet-trace`, PerfView |
| logical work | virtual-thread-aware dump/JFR | task/async stacks trong dump/trace |

Một Java thread ở `RUNNABLE` có thể đang dùng CPU hoặc ở native I/O; một async Task C# không có một OS-thread stack cố định xuyên mọi `await`. Lấy nhiều snapshot hoặc trace theo thời gian, không kết luận từ một dump duy nhất.

## Lab failure-first

1. Sample dùng bounded executor + rejection/backpressure; hạ capacity để quan sát reject.
2. Thay atomic account transfer bằng hai atomics và tìm invariant bị phá; sửa bằng lock ordering.
3. Tạo future timeout nhưng supplier tiếp tục; thêm cooperative deadline/interrupt và verify cleanup.
4. Viết jcstress test (optional dependency lab) cho unsafe publication; không dùng loop result làm proof.

## Interview drill

- `volatile`, atomic, lock giải quyết khác nhau gì? Cho invariant cần lock.
- Những cách safe-publish object; `this` escape xảy ra thế nào?
- `AtomicLong` vs `LongAdder`; khi nào `sum()` không phù hợp?
- Unbounded queue giết service theo chuỗi failure nào?
- `thenApply`/`thenApplyAsync` chạy đâu? `orTimeout` có cancel I/O không?
- Virtual thread không chữa CPU saturation/downstream exhaustion vì sao?

## Quiz

1. Final field có biến object graph thành deep immutable?
2. Concurrent collection có làm sequence `get → decide → put` atomic?
3. Caller-runs policy luôn tốt?
4. Structured concurrency trong Java 25 có phải standard API không preview?
5. Java `final` có phải C# `readonly`, và Java/C# `volatile` có map 1:1 không?
6. Channel completion map trực tiếp sang API nào của `BlockingQueue`?
7. `Task.WaitAsync` và `CompletableFuture.orTimeout` có dừng underlying work không?

<details><summary>Đáp án/rubric</summary>

1. Không; nó hỗ trợ initialization safety cho field, nhưng referenced object có thể mutable/escape.
2. Không tự động; dùng atomic map method/lock/transaction phù hợp và hiểu callback constraints.
3. Không; nó tạo backpressure nhưng có thể block event loop/critical thread hoặc khuếch đại latency. Phải chọn theo caller contract.
4. Không; Java 25 vẫn preview. Câu trả lời mạnh phân biệt Scoped Values standard với Structured Concurrency preview và nêu preview deployment policy.
5. Không. Cả hai cặp có ý định gần nhau nhưng initialization-safety, type restriction và memory-order contract khác; dùng spec của đúng runtime.
6. Không có API chuẩn 1:1; cần protocol như poison pill/interrupt/external lifecycle hoặc dùng abstraction stream cao hơn.
7. Không được bảo đảm; chúng timeout phía chờ/future. Operation bên dưới phải nhận và thực thi cancellation/deadline riêng.
</details>
