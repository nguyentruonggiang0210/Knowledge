## Mental model: Task không phải thread

Concurrency là nhiều công việc cùng tiến triển; parallelism là nhiều công việc thật sự chạy đồng thời. `Task`/future là handle cho công việc hoặc kết quả, không đồng nghĩa mỗi task có một OS thread.

| Workload | .NET | Java | Giới hạn thật |
|---|---|---|---|
| I/O async | `async/await`, async API | virtual thread hoặc async client/future | socket, DB connection, remote quota |
| CPU-bound | bounded tasks/`Parallel.ForEachAsync` | fixed executor/fork-join | CPU core/quota |
| Producer-consumer | bounded `Channel<T>` | `BlockingQueue`, Reactive Streams | queue, worker và downstream capacity |
| Shared counter | `Interlocked` | `Atomic*`, `LongAdder` | một counter không bảo vệ invariant nhiều field |

.NET `Task.WaitAsync(timeout)` timeout task wrapper dùng để chờ, không tự dừng task gốc. Java `CompletableFuture.orTimeout` hoàn tất chính future đó bằng exception khi hết hạn nên các dependent stage nhìn thấy timeout, nhưng supplier/I/O bên dưới vẫn có thể tiếp tục. Ở cả hai nền tảng, cancellation phải đi tới operation thực và cleanup phải được kiểm chứng.

Virtual thread giúp chờ blocking rẻ hơn, nhưng không tạo thêm CPU hay connection. C# async I/O thường không giữ worker khi đang chờ; `Task.Run` không phải bản tương đương virtual thread.

## Bounded Channel và backpressure

`Channel<T>` là queue bất đồng bộ, thread-safe giữa producer và consumer. Bounded channel buộc producer chờ khi queue đầy, nhờ đó overload xuất hiện thành áp lực có kiểm soát thay vì tăng RAM/latency vô hạn.

```csharp
var jobs = Channel.CreateBounded<Job>(new BoundedChannelOptions(16)
{
    SingleWriter = true,
    FullMode = BoundedChannelFullMode.Wait
});

await jobs.Writer.WriteAsync(job, cancellationToken);
await foreach (var item in jobs.Reader.ReadAllAsync(cancellationToken))
{
    await ProcessAsync(item, cancellationToken);
}
```

`Wait` giữ mọi item; các mode drop chỉ phù hợp khi business chấp nhận mất dữ liệu. Writer phải complete trong `finally` để reader không chờ vô hạn. `Channel<T>` còn có completion protocol; Java `BlockingQueue` không có close chuẩn và thường cần poison pill, interrupt hoặc lifecycle bên ngoài.

Một channel unbounded không có backpressure. Nó chỉ an toàn khi producer rate/result size được bound hoặc consumer chắc chắn theo kịp.

## File processing: fan-out, fan-in và output nguyên tử

`FileProcessingSample` dùng pipeline:

```text
lazy file discovery
    → bounded Channel<FileJob>
        → N workers: analyze + SHA-256 + GZip
            → result channel
                → single collector → JSON report
```

Discovery dùng `Directory.EnumerateFiles` nên không giữ toàn bộ path. Analyzer đọc từng dòng, compressor copy theo buffer, và stream mở với async + sequential-scan options. `Interlocked` bảo vệ statistics; immutable record giảm shared mutable state.

Mỗi file có fault boundary riêng: file hỏng tạo failed result, còn cancellation được rethrow để dừng pipeline. GZip ghi vào file tạm rồi rename, tránh publish output dở dang và cho phép chạy lại cùng tên.

Điểm cần nhớ ở scale lớn: result channel hiện unbounded và collector giữ mọi `FileProcessingResult` trong RAM. Hàng triệu file nên dùng bounded result channel, JSON Lines streaming hoặc persistence thay vì một list cuối cùng.

## Batch ETL: streaming, partition và atomic dedupe

`BatchEtlSample` tách rõ ba bước:

1. Extract CSV thành `IAsyncEnumerable<RawOrder>`.
2. Gom `BatchSize` record thành partition rồi đẩy vào bounded channel.
3. N worker validate/normalize/dedupe và bulk upsert.

Partition giảm task/round-trip overhead, nhưng batch quá lớn tăng RAM, lock time và retry cost. Worker count phải dựa vào DB connection pool, IOPS và transaction log chứ không chỉ `ProcessorCount`.

Duplicate filter dùng `ConcurrentDictionary.TryAdd`, gộp “đã có chưa?” và “thêm” thành một atomic operation. `ContainsKey` rồi `Add` sẽ có race. Trong production, uniqueness lớn hoặc xuyên restart nên thuộc về authoritative database/unique constraint/checkpoint, không phải dictionary sống trong process.

Sample dùng `string.Split(',')` và in-memory repository để dễ đọc. Quoted CSV, transaction/staging, retry classification, dead-letter record, checkpoint và idempotent rerun vẫn là phần phải bổ sung.

## Media processing: bounded parallelism theo loại tài nguyên

`MediaProcessingSample` chạy ba group đồng thời:

- ảnh: ImageSharp auto-orient, resize giữ tỷ lệ, encode JPEG;
- video: FFmpeg H.264/AAC 720p, fast-start và thumbnail;
- audio: MP3 192 kbps và waveform.

Mỗi group dùng `Parallel.ForEachAsync` với concurrency riêng. Đây là quyết định quan trọng vì image, video và audio có profile CPU/RAM/I/O khác nhau. FFmpeg còn có thread nội bộ, nên phải giới hạn cả số process lẫn thread/process để tránh nested oversubscription.

`ProcessStartInfo.ArgumentList` truyền argument không qua shell; stdout/stderr được drain đồng thời; khi cancel, runner kill toàn process tree để không để encoder mồ côi. `ConcurrentBag` gom kết quả và report được sort để deterministic.

> Caveat: pipeline gọi `DiscoverJobs(...).ToArray()`, nên dù iterator discovery là lazy, toàn bộ danh sách job vẫn được materialize trước xử lý. Production lớn nên stream/bound job. Tự tải FFmpeg chỉ phù hợp demo; deployment thật nên pin binary/image và kiểm tra license/codec.

## Cancellation, lỗi và shared state

Một pipeline an toàn cần trả lời sáu câu:

- Ai sở hữu task/executor/channel và ai complete/shutdown nó?
- Cancellation token/deadline có truyền tới file, DB, HTTP và child process không?
- Lỗi một item có fail cả batch hay được quarantine?
- Queue, worker, file handle và downstream có bound không?
- Shared state có một linearization point rõ không?
- Output sau crash/cancel có thể bị nhìn thấy ở trạng thái dở dang không?

`counter++` không atomic; dùng `Interlocked`. Collection concurrent không biến workflow nhiều bước thành atomic. Immutable snapshot, single-owner collector, atomic map method, lock hoặc database transaction được chọn theo invariant.

Java thêm yêu cầu chứng minh happens-before/safe publication bằng lock, volatile, thread start/join hoặc concurrent utility; chạy test 1.000 lần không phải proof. Unbounded executor queue cũng chỉ trì hoãn failure đến lúc latency/memory sụp.

## ActiveMQ Worker: transactional consume và redelivery

`ActiveMqWorkerSample` là .NET Worker/Windows Service dùng Apache NMS AMQP và ActiveMQ Artemis trong Docker Compose. Generic Host bind + validate options; reconnect loop tạo một connection và nhiều consumer. Mỗi consumer có session riêng vì NMS session không thread-safe.

```text
receive text message
  → deserialize + validate
  → handle business work
  → session.CommitAsync()

failure/cancel
  → session.RollbackAsync()
  → broker có thể redeliver
```

Demo publisher gửi persistent message với event type/correlation ID. Handler dùng `ConcurrentDictionary<EventId,...>` làm inbox tạm, skip duplicate và xóa key khi xử lý lỗi để broker có thể thử lại.

Điểm production còn thiếu: inbox in-memory mất khi restart và không atomic với business database + broker commit; poison message có thể lặp nếu không có max delivery/DLQ policy; local credential `change-me-local` không phải secret deployment.

## Kafka, ActiveMQ và event-driven correctness

ActiveMQ sample cho thấy transactional session/redelivery thực hành; bài Kafka cung cấp mental model partition, consumer group, offset, ordering và schema evolution.

| Khái niệm | ActiveMQ/JMS-style queue | Kafka log |
|---|---|---|
| Đơn vị scale/order | queue + consumer/session | partition + consumer group |
| Progress | ack/transactional session | offset |
| Replay | redelivery/DLQ theo broker policy | seek/reconsume theo retained log |
| Ordering | phụ thuộc queue/consumer setup | trong một partition |
| Exactly-once scope | không bao external DB/email | Kafka EOS có thể atomic offsets + output topic |

Commit progress trước side effect có thể làm mất xử lý; side effect trước progress có thể tạo duplicate khi crash. Vì vậy “exactly once” luôn phải nêu phạm vi. Kafka transaction không làm email hay external database tự nhiên exactly-once; ActiveMQ transaction cũng không thay business transaction.

Partition key quyết định ordering và hot-key risk. Retry blocking giữ partition/consumer; retry topic hay DLQ đổi trade-off ordering/throughput. Schema additive vẫn có thể phá behavioral compatibility nếu meaning/default thay đổi.

## Idempotency, outbox/inbox và caveat của sample

Thiết kế bền vững thường dùng:

```text
Producer DB transaction: business state + outbox row
Relay/CDC: publish, có thể duplicate
Consumer DB transaction: inbox/event fingerprint + local side effect
Broker progress: commit sau local transaction
```

Idempotency key phải gắn payload fingerprint; cùng key nhưng payload khác là conflict, không phải duplicate vô hại. Timeout sau write tạo result-unknown: client cần query/reconcile theo key thay vì blind retry. DLQ cần owner, alert, metadata, quyền truy cập và replay tool; nó không tự sửa poison message.

Các Java sample messaging/distributed/resilience là **teaching models trong một process**: không kết nối Kafka thật, không mô phỏng partition/consensus và không thay library production. Tương tự, file/ETL/media sample minh họa pattern nhưng chưa có distributed checkpoint, durable state hay full observability.

## Distributed systems, consistency và data ownership

Trong hệ phân tán, timeout chỉ nói rằng caller chưa nhận được kết quả: operation có thể chưa chạy, đã commit hoặc vẫn đang chạy. Mạng có thể delay, drop, duplicate, reorder và partition message. Vì vậy request cần deadline, idempotency key, correlation ID và đường query/reconcile cho trạng thái **result unknown**, thay vì coi timeout đồng nghĩa thất bại rồi retry mù.

CAP chỉ buộc lựa chọn trong lúc có network partition: hệ thống giữ linearizable consistency hoặc tiếp tục trả lời mọi request ở hai phía partition, chứ không thể đảm bảo cả hai. PACELC nhắc thêm rằng khi không partition vẫn thường có trade-off latency–consistency. Cần gọi đúng guarantee đang cần: linearizable, serializable, causal, read-your-writes hay eventual consistency không phải các tên thay thế cho nhau.

Với `N` replica, điều kiện `W + R > N` tạo giao nhau giữa write quorum và read quorum, nhưng **không tự động chứng minh linearizability**. Kết quả còn phụ thuộc version/conflict resolution, concurrent write, failure, sloppy quorum và reconfiguration. Leader/follower đơn giản hóa thứ tự ghi nhưng phải xử lý failover và stale leader bằng epoch/fencing token; leaderless đổi lấy logic reconcile phức tạp hơn. Sharding cũng cần key bám access pattern, tránh hot key và có kế hoạch reshard.

Mỗi loại dữ liệu phải có nguồn sự thật rõ ràng. Search index, cache và read model thường là derived state: chấp nhận lag nhưng phải rebuild/reconcile được. Với invariant xuyên service, ưu tiên một transaction trong cùng boundary hoặc modular monolith khi còn phù hợp. Khi thực sự phân tán, dùng saga/outbox, reservation/compensation và reconciliation; chúng không tạo rollback ACID toàn cục. CQRS chỉ tách read/write model, còn event sourcing lưu event làm source of truth — hai khái niệm có thể dùng độc lập.

Các sample lesson 20 chạy trong một process để minh họa lựa chọn; chúng không tạo network partition, consensus, durable replication hay bằng chứng linearizability thật.

## Cache, retry và admission control

Cache là một bản sao có thêm chi phí consistency. Cache-aside đơn giản nhưng miss và invalidation thuộc application; read-through/write-through chuyển trách nhiệm qua cache/provider; write-behind giảm write latency nhưng có cửa sổ mất dữ liệu và yêu cầu durable queue. Thiết kế phải xét stampede, penetration, hot key, invalidation sai và cả cache outage. Single-flight/request coalescing, TTL jitter, negative cache có giới hạn và stale-while-revalidate là các công cụ theo từng failure mode, không phải mặc định áp dụng tất cả.

Timeout nên đi cùng end-to-end deadline. Chỉ retry lỗi transient khi operation idempotent hoặc có idempotency key; dùng exponential backoff + jitter, giới hạn attempt/time budget và chọn **một retry owner**. Ba tầng cùng cấu hình tối đa ba attempt có thể khuếch đại thành `3 × 3 × 3 = 27` lần gọi xuống tầng cuối, khiến sự cố nặng hơn.

Các guardrail giải quyết những vấn đề khác nhau:

- circuit breaker ngừng gọi dependency đang lỗi và thăm dò phục hồi;
- bulkhead cô lập pool/concurrency giữa workload;
- token bucket giới hạn rate nhưng cho phép burst trong số token tích lũy;
- concurrency limiter giới hạn số request in-flight;
- load shedding từ chối sớm khi hệ đã bão hòa.

Thứ tự thường bắt đầu bằng deadline, admission/rate/concurrency limit, bulkhead, circuit breaker rồi retry có budget; vị trí cụ thể phải theo cost và ownership. Theo dõi queue depth/wait, in-flight, rejection, timeout, retry amplification, breaker state và fallback rate. Fallback phải bounded, observable và không che giấu dữ liệu sai. Sample lesson 21 là mô hình rút gọn; production nên dùng library đã được kiểm thử cùng policy/telemetry tập trung.

## Chọn pattern và kiểm chứng

| Bài toán | Pattern khởi đầu | Metric/evidence |
|---|---|---|
| Nhiều file độc lập | bounded Channel + worker pool | queue time, throughput, file handles, memory |
| ETL lớn | async stream + partition + bulk write | batch latency, DB pool wait, invalid/duplicate rate |
| Media CPU-heavy | concurrency riêng + process/thread cap | CPU quota, RSS, encode latency, failure rate |
| Broker consumer | per-consumer session + durable inbox | lag/backlog, redelivery, DLQ, handler latency |
| Fan-out remote calls | semaphore/bulkhead + deadline | in-flight, timeout, downstream saturation |

Checklist cuối:

- [ ] Queue và concurrency đều bounded theo downstream.
- [ ] Completion/shutdown có owner và deadline.
- [ ] Cancellation dừng được underlying work hoặc có cơ chế reconcile.
- [ ] Retry có eligibility, jitter, budget và idempotency.
- [ ] Shared invariant nằm trong atomic operation/lock/transaction.
- [ ] Kết quả không publish dở dang; report có thứ tự ổn định khi cần.
- [ ] Demo limitation được ghi rõ trước khi dùng làm production claim.
