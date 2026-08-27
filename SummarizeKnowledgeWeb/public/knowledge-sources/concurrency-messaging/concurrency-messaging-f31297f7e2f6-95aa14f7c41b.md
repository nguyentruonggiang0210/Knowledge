# Bài 06 — Concurrency: Task sang thread/future/virtual thread

## Đích học

Hiểu Java Memory Model, chọn concurrency abstraction, xử lý cancellation/timeout và tránh race/deadlock.

## Mapping tư duy

| C#/.NET | Java | Khác biệt bắt buộc nhớ |
|---|---|---|
| `Task<T>` | `Future<T>` hoặc `CompletionStage<T>`/`CompletableFuture<T>` | Task không đồng nghĩa với thread; `Future` là handle chờ/cancel, còn `CompletionStage` là graph composition |
| `Task.Run` | `ExecutorService.submit` / `CompletableFuture.supplyAsync` | scheduler mặc định là .NET ThreadPool so với Java common `ForkJoinPool`; production nên chỉ rõ owner/capacity |
| async/await | chưa có tương đương ngôn ngữ 1:1 | C# tạo state machine; Java có thể compose future hoặc viết blocking-style trên virtual thread |
| `Task.WhenAll/WhenAny` | `CompletableFuture.allOf/anyOf` | shape result, exception aggregation và cancellation khác |
| `lock`/`Monitor` | `synchronized` / `ReentrantLock` | đều reentrant nhưng wait/condition/interrupt semantics khác |
| `Volatile`, `volatile` | `volatile`, `VarHandle` | không suy diễn memory-order guarantee 1:1 giữa CLR và JMM |
| `Interlocked` | `Atomic*` / `VarHandle` | atomic một location không bảo vệ invariant nhiều field |
| `SemaphoreSlim.WaitAsync` | `Semaphore.acquire` | API Java này blocking; virtual thread làm việc chờ rẻ hơn chứ không biến nó thành async API |
| `Channel<T>` / `BlockingCollection<T>` | `BlockingQueue<T>` / Reactive Streams | completion, close và backpressure không map 1:1 |
| `CancellationToken` | interrupt + explicit token/deadline | cả hai cooperative; Java SE không có token chuẩn dùng xuyên mọi API |
| `Parallel.ForEach` | parallel stream / executor | tránh shared pool cho blocking I/O và phải đo workload CPU-bound |

`volatile` đảm bảo visibility và ordering, không làm `count++` atomic. Happens-before được tạo bởi lock unlock→lock, volatile write→read, thread start/join và concurrent utilities. Ưu tiên state bất biến, message passing, concurrent collection và task scope trước shared mutable state.

### Chọn model

- Nhiều I/O blocking độc lập: virtual thread per task (Java 21), vẫn phải giới hạn downstream bằng semaphore/rate limit.
- CPU-bound: fixed pool gần số core; thêm thread không tạo thêm CPU.
- DAG async/composition: `CompletableFuture`, luôn chỉ rõ executor và timeout.
- Shared counters/cache: atomic/concurrent map; nhiều invariant liên quan nhau cần lock/actor/transaction.

Virtual thread rẻ chứ tài nguyên downstream không vô hạn. Ghi chú version: monitor pinning do `synchronized` là concern đáng kể ở Java 21; JDK 24/JEP 491 đã loại phần lớn trường hợp này. Native/foreign calls và version thực chạy vẫn cần profile. Dù không pin, giữ lock qua blocking I/O vẫn tăng contention.

`CompletableFuture.orTimeout` và C# `Task.WaitAsync(timeout)` chỉ làm phía **chờ** timeout; không bảo đảm supplier/HTTP/DB operation bên dưới bị interrupt hay dừng. Cancellation phải truyền deadline/interrupt/token tới client/resource thực và cleanup được verify. Riêng `CompletableFuture.cancel(true)` không hứa interrupt supplier như `FutureTask.cancel(true)`; đừng dựa vào tên tham số để suy diễn. Xem [deep dive JMM/executor/Loom](15-concurrency-deep-dive.md).

### Production checklist

Deadline phải truyền xuyên call chain; cancellation phải cooperative; pool phải có ownership/shutdown; log request/correlation context cần propagation; test race bằng lặp/stress chứ một test pass không chứng minh thread safety.

## Thực hành

[Java concurrency lab](../SourceSamples/06-concurrency/src/main/java/course/concurrency/ConcurrencyDemo.java) · [C# async mapping](../SourceSamples/06-concurrency/csharp/Program.cs)

Hai sample cùng tách ba case: fan-out có downstream limit, wrapper timeout không dừng underlying work, và cooperative cancellation thật. Sau đó đổi virtual-thread executor thành fixed pool 2 threads, tăng số task và đo queue time/latency.

## Quiz

1. `volatile int` có làm increment atomic?
2. Virtual thread có làm database chịu được vô hạn request?
3. Khi nào fixed pool phù hợp hơn virtual thread?
4. Tại sao phải chỉ rõ executor cho `CompletableFuture` production?
5. `orTimeout`/`WaitAsync(timeout)` có chắc dừng query DB bên dưới không?
6. Vì sao `Task.Run` không phải virtual thread?

<details><summary>Đáp án</summary>

1. Không; read-modify-write gồm nhiều bước.
2. Không; connection pool/DB/remote quota vẫn hữu hạn.
3. CPU-bound hoặc khi cần giới hạn concurrency bằng chính pool.
4. Tránh phụ thuộc common pool dùng chung và kiểm soát capacity, lifecycle, observability.
5. Không; đó là timeout của wrapper/chờ. Driver/client phải hỗ trợ cancellation/deadline và outcome của write có thể vẫn chưa biết.
6. `Task.Run` queue delegate vào .NET ThreadPool; virtual thread là một `Thread` có identity/stack được JVM mount/unmount khỏi carrier khi blocking được hỗ trợ.
</details>
