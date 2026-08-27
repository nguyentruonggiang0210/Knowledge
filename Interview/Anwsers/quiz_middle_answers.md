# Đáp án và rubric — Bài kiểm tra tổng hợp Middle Backend

## Cách chấm

- Tổng điểm tối đa: **100**. Chấp nhận cách diễn đạt khác nếu đúng contract và trade-off.
- Câu tình huống chỉ đạt tối đa 50% nếu chỉ kể tên công cụ mà không nêu thứ tự, bằng chứng hoặc failure mode.
- Mốc đánh giá: **85–100** Middle rất vững; **70–84** đạt Middle; **55–69** còn lỗ hổng; **dưới 55** cần ôn lại nền tảng.
- Mỗi mục **Tham chiếu** trỏ về mã trong ngân hàng câu hỏi gốc để ôn sâu hơn.

## 1. C# — 9 điểm

### QM-001 — [C#] [Short answer] — 1 điểm

Phân biệt value type và reference type khi gán biến hoặc truyền tham số. Từ khóa `ref` thay đổi điều gì?

**Đáp án kỳ vọng:** Gán/truyền value type mặc định copy giá trị; với reference type, copy giá trị reference nên hai biến có thể cùng trỏ một object nhưng vẫn là hai slot độc lập. `ref` truyền alias tới chính storage location của biến, cho phép callee gán lại biến caller.

**Rubric:** 0,5 điểm cho semantics copy; 0,5 điểm cho ý nghĩa `ref` và phân biệt mutate object với rebind biến.

**Tham chiếu:** `CS-001`, `CS-003`.

### QM-002 — [C#] [Short answer] — 1 điểm

Deferred execution của LINQ là gì, và gọi `ToList()` thay đổi lifetime của query như thế nào?

**Đáp án kỳ vọng:** Phần lớn LINQ operator chỉ tạo query; source được duyệt khi enumerate nên mỗi lần enumerate có thể chạy lại và thấy source mới. `ToList()` materialize một snapshot ngay lúc gọi, giữ kết quả độc lập với các lần enumerate source sau đó.

**Rubric:** 0,5 điểm cho thời điểm chạy; 0,5 điểm cho materialization/snapshot và hệ quả chi phí.

**Tham chiếu:** `CS-020`, `CS-022`.

### QM-003 — [C#] [Code reasoning] — 2 điểm

Đoạn code sau in gì và vì sao? Viết lại để mỗi action giữ đúng giá trị tương ứng.

```csharp
var actions = new List<Action>();
for (var i = 0; i < 3; i++)
    actions.Add(() => Console.Write(i));
foreach (var action in actions) action();
```

**Đáp án kỳ vọng:** In `333`: các closure capture cùng biến `i`, không capture giá trị từng vòng; khi chạy action thì loop đã kết thúc với `i == 3`. Tạo biến cục bộ bên trong vòng lặp: `var captured = i; actions.Add(() => Console.Write(captured));` để in `012`.

**Rubric:** 0,5 điểm cho output; 0,75 điểm cho cơ chế capture; 0,75 điểm cho cách sửa đúng.

**Tham chiếu:** `CS-017`.

### QM-004 — [C#] [Code reasoning] — 2 điểm

Chỉ ra lỗi correctness và lỗi kiểm soát tải trong đoạn code; mô tả cách sửa.

```csharp
public Task SaveAll(IEnumerable<Item> items, CancellationToken ct)
{
    items.Select(async item => await repository.SaveAsync(item, ct));
    return Task.CompletedTask;
}
```

**Đáp án kỳ vọng:** `Select` là deferred và sequence không được enumerate/await nên save có thể chưa chạy; method lại báo hoàn tất giả. Sửa cơ bản bằng `await Task.WhenAll(items.Select(x => repository.SaveAsync(x, ct)))`; với tập lớn phải giới hạn concurrency bằng `Parallel.ForEachAsync`, batch hoặc `SemaphoreSlim`, đồng thời truyền cancellation và xử lý exception theo policy.

**Rubric:** 0,75 điểm cho lỗi deferred/unawaited; 0,5 điểm cho await/composition đúng; 0,75 điểm cho bounded concurrency và cancellation/failure.

**Tham chiếu:** `CS-031`, `CS-033`, `CS-034`.

### QM-005 — [C#] [Scenario] — 3 điểm

Một singleton publisher giữ event handler của các object request-scoped. Sau vài ngày heap tăng liên tục dù request đã kết thúc. Hãy nêu nguyên nhân, bằng chứng cần thu và hai cách sửa an toàn.

**Đáp án kỳ vọng:** Event giữ strong reference từ invocation list của singleton tới subscriber, tạo đường GC root và kéo cả request graph sống lâu. So sánh heap snapshot/dominator/path-to-root và số handler theo thời gian; sửa bằng subscription trả `IDisposable` và unsubscribe chắc chắn khi scope kết thúc, hoặc đổi ownership/lifetime/pub-sub để publisher không giữ subscriber ngắn hạn; weak subscription chỉ dùng khi semantics cleanup được hiểu rõ.

**Rubric:** 1 điểm cho GC-root/event mechanism; 1 điểm cho bằng chứng heap/path-to-root; 1 điểm cho hai cách sửa có lifecycle rõ.

**Tham chiếu:** `CS-019`, `CS-041`.

## 2. .NET và ASP.NET Core — 9 điểm

### QM-006 — [.NET] [Short answer] — 1 điểm

IL, CLR và JIT phối hợp thế nào từ lúc build đến lúc một method được thực thi?

**Đáp án kỳ vọng:** C# compiler tạo IL cùng metadata trong assembly; CLR load/verify/quản runtime và JIT biên dịch method cần chạy thành native code, có thể recompile theo tier/profile. IL tạo portability giữa runtime/architecture tương thích.

**Rubric:** 0,5 điểm cho source→IL/metadata; 0,5 điểm cho CLR load và JIT→native.

**Tham chiếu:** `NET-001`, `NET-002`.

### QM-007 — [.NET] [Short answer] — 1 điểm

Transient, scoped và singleton khác nhau về lifetime; “captive dependency” là gì?

**Đáp án kỳ vọng:** Transient tạo theo lần resolve, scoped dùng chung trong một scope/request, singleton sống theo container. Captive dependency là object sống dài, thường singleton, giữ dependency sống ngắn như scoped làm sai scope/state/disposal.

**Rubric:** 0,5 điểm cho ba lifetime; 0,5 điểm cho captive dependency và hậu quả.

**Tham chiếu:** `NET-015`, `NET-016`.

### QM-008 — [.NET] [Code reasoning] — 2 điểm

Middleware bắt mọi exception rồi trả HTTP 200 với `{ "success": false }`. Nêu hai hậu quả đối với client/vận hành và status/error contract nên được sửa thế nào.

**Đáp án kỳ vọng:** HTTP 200 làm client/proxy/APM/SLO xem failure là success, phá retry/cache/alert semantics; bắt mọi lỗi còn dễ leak dữ liệu hoặc nuốt cancellation. Map validation/domain/auth/dependency lỗi sang status phù hợp, dùng error schema ổn định và correlation ID, log chi tiết nội bộ một lần, không trả stack/request body nhạy cảm.

**Rubric:** 1 điểm cho ít nhất hai hậu quả cụ thể; 1 điểm cho status mapping, safe error contract và observability.

**Tham chiếu:** `NET-023`, `NET-029`.

### QM-009 — [.NET] [Scenario] — 2 điểm

Một `DbContext` singleton được dùng đồng thời bởi nhiều request và đôi lúc báo lỗi tracking hoặc trả dữ liệu lẫn nhau. Hãy xác định sai lifetime, ownership đúng và cách kiểm tra query chỉ thực thi khi nào.

**Đáp án kỳ vọng:** `DbContext` là mutable unit-of-work, không thread-safe; dùng scoped theo request/use case hoặc factory tạo context có ownership/dispose rõ. `IQueryable` chỉ là expression; SQL chạy khi materialize/enumerate như `ToListAsync`, `FirstAsync`, và phải inspect generated SQL/log tại boundary đó.

**Rubric:** 0,75 điểm cho lifetime/thread safety; 0,5 điểm cho scoped/factory ownership; 0,75 điểm cho deferred `IQueryable` và materialization.

**Tham chiếu:** `NET-038`, `NET-041`.

### QM-010 — [.NET] [Scenario] — 3 điểm

Sau deploy, allocation rate và Gen 2 collection tăng mạnh, p99 tăng gấp bốn nhưng throughput không đổi. Trình bày thứ tự thu thập bằng chứng, khoanh vùng và xác nhận bản sửa.

**Đáp án kỳ vọng:** Khoanh timeline/version/cohort rồi so baseline về allocation, heap size/live set, GC pause/frequency, LOH và process RSS; thu trace/profile allocation/heap dump khi an toàn để tìm type/call stack/GC root tăng. Tái hiện với cùng data/load, sửa owner/hot allocation hoặc retention, benchmark/load-test và canary để xác nhận p99, allocation, Gen2 cùng error/throughput không regression.

**Rubric:** 1 điểm cho metric/timeline đúng; 1 điểm cho profile/dump và phân biệt churn với leak; 1 điểm cho controlled validation/canary và nhiều metric.

**Tham chiếu:** `NET-003`, `NET-008`, `NET-009`, `NET-052`.

## 3. Java — 9 điểm

### QM-011 — [Java] [Short answer] — 1 điểm

Java “pass-by-value” nghĩa là gì khi đối số là object reference?

**Đáp án kỳ vọng:** Callee nhận bản copy của reference value: nó có thể mutate object chung qua reference nhưng gán parameter sang object khác không rebind biến caller.

**Rubric:** 0,5 điểm cho copy reference value; 0,5 điểm cho mutate so với rebind.

**Tham chiếu:** `JAVA-001`.

### QM-012 — [Java] [Short answer] — 1 điểm

Contract giữa `equals()` và `hashCode()` là gì khi object làm key của `HashMap`?

**Đáp án kỳ vọng:** Hai object equal bắt buộc có cùng hash; hash/equality phải ổn định khi key đang nằm trong map. Hash bằng nhau không bắt buộc equal.

**Rubric:** 0,5 điểm cho equal→same hash; 0,5 điểm cho stability hoặc chiều ngược không bắt buộc.

**Tham chiếu:** `JAVA-002`, `JAVA-012`.

### QM-013 — [Java] [Code reasoning] — 2 điểm

Hoàn thiện wildcard cho method sau để copy type-safe từ nguồn sang đích và giải thích lựa chọn.

```java
static <T> void copy(Collection<___> source, Collection<___> destination) {
    destination.addAll(source);
}
```

**Đáp án kỳ vọng:** `Collection<? extends T> source` và `Collection<? super T> destination`. Source sản xuất `T` nên `extends`; destination tiêu thụ `T` nên `super` theo PECS.

**Rubric:** 1 điểm cho hai wildcard đúng; 1 điểm cho producer/consumer và thao tác đọc/ghi hợp lệ.

**Tham chiếu:** `JAVA-006`, `JAVA-007`.

### QM-014 — [Java] [Code reasoning] — 2 điểm

Pipeline sau gặp exception khi có hai user trùng email. Hãy mô tả một chính sách merge hợp lệ và cách giữ insertion order.

```java
var usersByEmail = users.stream()
    .collect(Collectors.toMap(User::email, Function.identity()));
```

**Đáp án kỳ vọng:** Truyền merge function theo domain, ví dụ giữ bản mới hơn hoặc fail với lỗi nghiệp vụ rõ; dùng overload có supplier `LinkedHashMap::new` để giữ encounter/insertion order. Merge phải deterministic, và không nên âm thầm “giữ cái đầu” nếu duplicate là dữ liệu lỗi.

**Rubric:** 1 điểm cho merge policy explicit; 0,5 điểm cho `LinkedHashMap` supplier; 0,5 điểm cho deterministic/domain trade-off.

**Tham chiếu:** `JAVA-024`.

### QM-015 — [Java] [Scenario] — 3 điểm

Một service tăng số worker thread từ 50 lên 500 nhưng throughput giảm, latency và connection-pool wait tăng. Hãy nêu mô hình giải thích và các phép đo/thay đổi ưu tiên.

**Đáp án kỳ vọng:** Bottleneck thật là DB/downstream; thêm thread làm queue, contention, context switch và Little’s Law `L=λW` đẩy latency tăng chứ không tạo capacity. Đo CPU/run queue, executor queue, DB pool/lock/query latency, allocation/GC và downstream; giảm/bound concurrency, queue và timeout, tạo backpressure/admission control rồi load-test tìm knee theo SLO.

**Rubric:** 1 điểm cho bottleneck/queueing model; 1 điểm cho bộ đo đa lớp; 1 điểm cho bounded concurrency/backpressure và validation.

**Tham chiếu:** `JAVA-040`, `JAVA-044`.

## 4. JVM và Spring — 9 điểm

### QM-016 — [JVM/Spring] [Short answer] — 1 điểm

Heap, thread stack, metaspace và direct/native memory chứa loại dữ liệu nào?

**Đáp án kỳ vọng:** Heap chứa object/array; mỗi thread stack chứa frame/local/operand; metaspace chứa class metadata; direct/native chứa direct buffer, JVM/native-library structures và thread stacks/native allocation ngoài heap.

**Rubric:** 0,25 điểm cho mỗi vùng được mô tả đúng.

**Tham chiếu:** `JVM-009`.

### QM-017 — [JVM/Spring] [Short answer] — 1 điểm

Vì sao `@Transactional` trên method được gọi bằng `this.method()` có thể không tạo transaction?

**Đáp án kỳ vọng:** Spring thường áp transaction bằng proxy; self-invocation gọi trực tiếp object target nên không đi qua interceptor. Tách boundary sang bean khác hoặc dùng `TransactionTemplate` khi phù hợp.

**Rubric:** 0,75 điểm cho proxy/self-invocation; 0,25 điểm cho một cách sửa đúng.

**Tham chiếu:** `JVM-023`, `JVM-028`.

### QM-018 — [JVM/Spring] [Scenario] — 2 điểm

RSS của process tăng nhưng heap sau GC ổn định. Bạn sẽ phân biệt direct/native memory leak với allocation pressure bằng công cụ và dữ liệu nào?

**Đáp án kỳ vọng:** GC log/allocation profile cho biết churn/heap live set; class histogram/heap dump xác nhận managed heap không tăng. Dùng Native Memory Tracking baseline/diff, direct-buffer metric và OS/native profiler/RSS map để tìm vùng native; lưu ý allocator giữ committed pages không luôn là leak.

**Rubric:** 1 điểm cho dữ liệu heap/allocation; 1 điểm cho NMT/direct/OS evidence và diễn giải RSS đúng.

**Tham chiếu:** `JVM-009`, `JVM-013`.

### QM-019 — [JVM/Spring] [Scenario] — 2 điểm

Một transaction database được giữ mở trong lúc gọi HTTP sang service khác. Nêu rủi ro và phác thảo boundary dùng timeout, outbox cùng idempotency.

**Đáp án kỳ vọng:** External call kéo dài giữ connection/lock, tăng deadlock và không atomic với DB. Transaction local chỉ ghi business state + outbox; relay publish có retry/timeout, consumer dedupe bằng event/idempotency ID; workflow cần trạng thái/compensation khi thất bại.

**Rubric:** 0,75 điểm cho rủi ro; 0,75 điểm cho atomic business+outbox; 0,5 điểm cho timeout/idempotency/compensation.

**Tham chiếu:** `JVM-032`, `DB-039`, `SD-026`.

### QM-020 — [JVM/Spring] [Scenario] — 3 điểm

Endpoint tải 100 đơn hàng rồi phát thêm 100 query lấy dòng hàng; đổi tất cả association sang `EAGER` còn làm response nặng hơn. Hãy chẩn đoán, đề xuất hai query strategy và nêu một bẫy khi fetch nhiều collection.

**Đáp án kỳ vọng:** Đây là N+1; EAGER là fetch contract, không đảm bảo một query và gây over-fetch. Chọn fetch join/entity graph cho graph cụ thể, batch fetch hoặc projection DTO; fetch join nhiều to-many dễ Cartesian explosion/duplicate và pagination sai/đắt.

**Rubric:** 1 điểm cho chẩn đoán/EAGER; 1 điểm cho hai strategy đúng; 1 điểm cho Cartesian/pagination/query-budget pitfall.

**Tham chiếu:** `JVM-046`, `JVM-047`.

## 5. Algorithms và Data Structures — 9 điểm

### QM-021 — [Algorithms] [Short answer] — 1 điểm

Vì sao append vào dynamic array có amortized O(1) dù một lần resize có thể O(n)?

**Đáp án kỳ vọng:** Capacity tăng theo cấp số nhân nên tổng số phần tử phải copy qua n lần append là O(n); chia tổng chi phí cho n thao tác được O(1) amortized, dù một thao tác riêng vẫn O(n).

**Rubric:** 0,5 điểm cho geometric growth; 0,5 điểm cho aggregate/amortized reasoning.

**Tham chiếu:** `ALG-002`.

### QM-022 — [Algorithms] [Short answer] — 1 điểm

Khi nào dùng BFS thay Dijkstra, và khi nào Dijkstra không còn đúng?

**Đáp án kỳ vọng:** BFS cho graph unweighted hoặc mọi edge cùng trọng số, tìm đường ít cạnh nhất; Dijkstra dùng non-negative weights và không đúng tổng quát khi có edge âm.

**Rubric:** 0,5 điểm cho BFS condition; 0,5 điểm cho non-negative constraint của Dijkstra.

**Tham chiếu:** `ALG-013`, `ALG-015`.

### QM-023 — [Algorithms] [Code reasoning] — 2 điểm

Đoạn binary search dưới đây có thể lặp vô hạn hoặc bỏ sót biên nào? Viết invariant và phép cập nhật đúng cho bài toán tìm phần tử đầu tiên `>= target`.

```text
while (left < right):
    mid = (left + right) / 2
    if a[mid] < target: right = mid
    else: left = mid
```

**Đáp án kỳ vọng:** Nhánh bị đảo và `left = mid` không luôn thu nhỏ interval. Với half-open `[left,right)`: mọi index `< left` có value `< target`, mọi index `>= right` có value `>= target`; nếu `a[mid] < target` đặt `left=mid+1`, ngược lại `right=mid`, kết thúc trả `left`.

**Rubric:** 0,5 điểm cho lỗi; 0,75 điểm cho invariant; 0,75 điểm cho update/biên đúng.

**Tham chiếu:** `ALG-019`.

### QM-024 — [Algorithms] [Problem solving] — 2 điểm

Thiết kế thuật toán lấy 100 giá trị lớn nhất từ stream hàng trăm triệu phần tử với bộ nhớ O(100). Nêu độ phức tạp.

**Đáp án kỳ vọng:** Giữ min-heap kích thước K=100; push đến đủ K, sau đó chỉ thay root khi phần tử mới lớn hơn root. Thời gian O(n log K), bộ nhớ O(K); root là phần tử nhỏ nhất trong Top-K.

**Rubric:** 1 điểm cho min-heap bounded đúng; 0,5 điểm cho update; 0,5 điểm cho complexity.

**Tham chiếu:** `ALG-006`, `ALG-053`.

### QM-025 — [Algorithms] [Scenario] — 3 điểm

Thiết kế LRU cache có `get`/`put` O(1), capacity hữu hạn và truy cập concurrent. Nêu cấu trúc dữ liệu, invariant và cách chọn chiến lược đồng bộ.

**Đáp án kỳ vọng:** Hash map key→node + doubly linked list theo recency; head/tail là MRU/LRU, mỗi node xuất hiện đúng một lần ở cả map/list và size≤capacity. Vì `get` cũng đổi list, một lock bảo vệ compound invariant là thiết kế đơn giản đúng; segmentation/approximate policy hoặc cache library chỉ khi profile cho thấy contention.

**Rubric:** 1 điểm cho map+list; 1 điểm cho invariant/eviction; 1 điểm cho synchronization và trade-off.

**Tham chiếu:** `ALG-007`, `ALG-051`, `JAVA-018`.

## 6. Database — 10 điểm

### QM-026 — [Database] [Short answer] — 1 điểm

Dirty read, non-repeatable read và phantom read khác nhau thế nào?

**Đáp án kỳ vọng:** Dirty read thấy dữ liệu chưa commit; non-repeatable read đọc lại cùng row thấy value khác; phantom là chạy lại predicate thấy tập row thêm/bớt.

**Rubric:** 1 điểm nếu đủ ba khái niệm; trừ khoảng 0,25 điểm cho mỗi khái niệm sai/thiếu.

**Tham chiếu:** `DB-032`.

### QM-027 — [Database] [Code reasoning] — 2 điểm

Vì sao query sau có thể trả rỗng nếu subquery chứa `NULL`, và viết lại theo semantics an toàn hơn?

```sql
SELECT id FROM customer
WHERE id NOT IN (SELECT customer_id FROM blocked_customer);
```

**Đáp án kỳ vọng:** `NOT IN` so với tập có NULL tạo UNKNOWN theo three-valued logic nên predicate không true. Dùng correlated `NOT EXISTS`: `SELECT c.id FROM customer c WHERE NOT EXISTS (SELECT 1 FROM blocked_customer b WHERE b.customer_id=c.id)`; hoặc loại NULL có chủ đích nếu semantics phù hợp.

**Rubric:** 1 điểm cho UNKNOWN/NULL; 1 điểm cho rewrite null-safe đúng.

**Tham chiếu:** `DB-005`.

### QM-028 — [Database] [Code reasoning] — 2 điểm

Với index `(tenant_id, status, created_at)`, phân tích khả năng seek/range/order của query chỉ lọc `status`, và query lọc `tenant_id`, `status` rồi range theo `created_at`.

**Đáp án kỳ vọng:** Chỉ `status` bỏ qua leading column nên thường không dùng seek hiệu quả theo leftmost prefix, có thể scan/skip-scan tùy engine. Equality trên tenant+status rồi range/order created_at khớp prefix và hỗ trợ seek/range, có thể tránh sort nếu direction/query phù hợp.

**Rubric:** 1 điểm cho query thiếu prefix; 1 điểm cho equality-prefix + range/order và lưu ý engine/plan.

**Tham chiếu:** `DB-022`.

### QM-029 — [Database] [Scenario] — 2 điểm

Hai request cùng đọc balance 100 rồi lần lượt ghi 90 và 80, làm mất một cập nhật. Nêu hai cách kiểm soát concurrency và cách client xử lý conflict.

**Đáp án kỳ vọng:** Dùng optimistic version/CAS (`UPDATE ... WHERE id=? AND version=?`) và báo conflict để đọc lại/retry bounded, hoặc pessimistic row lock/serializable/atomic SQL tùy invariant và contention. Retry phải chạy lại decision trên state mới và external effect phải idempotent.

**Rubric:** 1 điểm cho hai cơ chế hợp lệ; 1 điểm cho detect conflict + retry/re-read semantics.

**Tham chiếu:** `DB-032`, `DB-036`, `DB-037`.

### QM-030 — [Database] [Scenario] — 3 điểm

Một query nhanh ở staging nhưng timeout ở production, đồng thời xuất hiện lock wait. Trình bày thứ tự kiểm tra generated SQL/parameter, execution plan, statistics/index, blocking và cách xác nhận fix không làm write path tệ hơn.

**Đáp án kỳ vọng:** Capture SQL, bind values/cardinality và actual plan; so estimated/actual rows, scan/seek, join/spill và parameter-sensitive plan. Kiểm tra stats/index/data skew rồi lock graph/transaction owner và thời gian giữ lock; sửa query/index/transaction boundary, load-test với data phân bố thật và đo read p95/p99, write latency, lock, IO và index-maintenance cost.

**Rubric:** 1 điểm cho SQL/parameter/actual plan; 1 điểm cho stats/index/blocking/owner; 1 điểm cho validation đa workload và regression write.

**Tham chiếu:** `DB-027`, `DB-028`, `DB-030`, `DB-035`.

## 7. Software Engineering — 9 điểm

### QM-031 — [Software Engineering] [Short answer] — 1 điểm

Dependency Injection khác Dependency Inversion Principle ở điểm nào?

**Đáp án kỳ vọng:** DIP là nguyên lý dependency hướng vào abstraction/policy thay vì detail; DI là kỹ thuật cung cấp dependency từ bên ngoài. Có thể dùng DI container mà vẫn vi phạm DIP nếu high-level code phụ thuộc abstraction sai hoặc detail leak.

**Rubric:** 0,5 điểm cho nguyên lý; 0,5 điểm cho kỹ thuật và quan hệ không đồng nhất.

**Tham chiếu:** `SE-005`.

### QM-032 — [Software Engineering] [Short answer] — 1 điểm

Entity và value object khác nhau về identity, equality và mutability như thế nào?

**Đáp án kỳ vọng:** Entity có identity ổn định xuyên thay đổi state; value object equal theo toàn bộ giá trị có ý nghĩa và thường immutable, được thay bằng instance mới khi đổi.

**Rubric:** 0,5 điểm cho entity identity; 0,5 điểm cho value equality/immutability.

**Tham chiếu:** `SE-009`.

### QM-033 — [Software Engineering] [Code review] — 2 điểm

Review đoạn code `catch (Exception) { return null; }`: chỉ ra vấn đề về contract, observability và cancellation; đề xuất error model thay thế.

**Đáp án kỳ vọng:** Nó trộn absence với failure, mất stack/cause/context và có thể nuốt cancellation/interruption, gây lỗi xa nguồn. Chỉ catch lỗi có thể xử lý/translate, giữ cause và stable error code/result/typed exception; propagate cancellation, log một lần ở boundary với correlation và không leak nội bộ.

**Rubric:** 1 điểm cho ba failure mode; 1 điểm cho error/cancellation/observability strategy.

**Tham chiếu:** `SE-022`, `JAVA-028`, `CS-052`, `CS-053`.

### QM-034 — [Software Engineering] [Scenario] — 2 điểm

Một module có hàng trăm unit test mock mọi dependency nhưng lỗi wiring và SQL vẫn lọt production. Hãy phân bổ lại unit, integration, contract và end-to-end test theo rủi ro.

**Đáp án kỳ vọng:** Giữ unit test thuần cho domain/branching; integration với DB thật/container cho mapping, query, transaction và wiring; contract test cho API/message giữa team; ít end-to-end cho critical journey. Mock external port có cost/non-determinism, không mock persistence khi mục tiêu là kiểm tra SQL.

**Rubric:** 1 điểm cho vai trò đúng của bốn tầng; 1 điểm cho lựa chọn boundary/risk và production parity.

**Tham chiếu:** `SE-023`, `SE-024`, `SE-025`, `SE-026`.

### QM-035 — [Software Engineering] [Scenario] — 3 điểm

Monolith cũ deploy 90 phút, test flaky và ownership mơ hồ; product yêu cầu tách microservice trong sáu tháng. Nêu ba bước ưu tiên đầu, tiêu chí quyết định boundary và cách giữ đường lui.

**Đáp án kỳ vọng:** Đo baseline/dependency/flow và ổn định CI-test-deploy/observability/ownership trước; tạo modular boundaries/seams và characterization tests; chọn một bounded context có business autonomy, dữ liệu/owner và change cadence rõ để pilot strangler. Dùng compatibility contract, routing/feature flag, expand-contract và khả năng quay traffic về monolith; không lấy “folder” hay thời hạn làm boundary.

**Rubric:** 1 điểm cho ba ưu tiên giảm rủi ro; 1 điểm cho boundary criteria/chi phí phân tán; 1 điểm cho incremental extraction/metrics/rollback.

**Tham chiếu:** `SE-018`, `SE-019`, `SE-029`, `SE-045`.

## 8. System Design — 9 điểm

### QM-036 — [System Design] [Short answer] — 1 điểm

Khi bắt đầu bài system design, cần làm rõ hai functional requirement và bốn non-functional requirement nào?

**Đáp án kỳ vọng:** Ví dụ functional: use cases/actor và phạm vi CRUD/flow; non-functional: scale/traffic, latency/availability SLO, consistency/durability, security/compliance/cost. Chấp nhận lựa chọn khác nếu cụ thể và đo được.

**Rubric:** 0,4 điểm cho hai functional; 0,6 điểm cho bốn non-functional hợp lệ.

**Tham chiếu:** `SD-001`, `SD-002`, `SD-003`.

### QM-037 — [System Design] [Short answer] — 1 điểm

Strong consistency và eventual consistency khác nhau ở guarantee quan sát nào? Cho mỗi loại một use case.

**Đáp án kỳ vọng:** Strong consistency theo model được chọn làm read quan sát write mới nhất/ordering chặt; eventual cho phép stale nhưng replica hội tụ nếu ngừng update. Số dư/booking thường cần strong hơn; feed/like count có thể eventual.

**Rubric:** 0,5 điểm cho guarantee; 0,5 điểm cho hai use case hợp lý.

**Tham chiếu:** `SD-007`.

### QM-038 — [System Design] [Scenario] — 2 điểm

Một key cache hết hạn gây hàng nghìn request cùng truy vấn database. Nêu ba kỹ thuật giảm cache stampede và trade-off chính.

**Đáp án kỳ vọng:** Single-flight/lock một loader, TTL jitter, stale-while-revalidate/refresh-ahead; cũng có thể negative cache hoặc request coalescing. Lock cần timeout/failure path, stale phục vụ dữ liệu cũ, jitter chỉ phân tán chứ không xử lý hot key đơn lẻ.

**Rubric:** 1,25 điểm cho ba kỹ thuật; 0,75 điểm cho trade-off/failure handling.

**Tham chiếu:** `SD-018`.

### QM-039 — [System Design] [Scenario] — 2 điểm

Broker giao message at-least-once. Thiết kế consumer cập nhật database sao cho retry không tạo duplicate side effect.

**Đáp án kỳ vọng:** Message có stable ID; trong cùng DB transaction, insert ID vào inbox/dedup table có unique constraint và áp state transition, duplicate trở thành no-op. Chỉ ack sau commit; external side effect dùng outbox/idempotency key, retention của dedup phải phủ retry horizon.

**Rubric:** 1 điểm cho atomic dedup+state; 0,5 điểm cho ack/transaction; 0,5 điểm cho side effect/retention.

**Tham chiếu:** `SD-022`, `SD-023`, `SD-026`.

### QM-040 — [System Design] [Scenario] — 3 điểm

Thiết kế dịch vụ notification email/SMS/push: nêu API/queue, preference, idempotency, rate limit, retry/DLQ, provider failover và ba metric SLO chính.

**Đáp án kỳ vọng:** API nhận command có idempotency ID, validate preference/template rồi enqueue theo tenant/channel; worker rate-limit/bulkhead từng provider, retry lỗi transient có backoff/jitter, DLQ có replay workflow và provider failover không gửi trùng. Theo dõi accepted-to-delivered latency, success/error rate và backlog/age (cùng duplicate/drop nếu có).

**Rubric:** 1 điểm cho flow/data/preference; 1 điểm cho resilience/idempotency/rate/DLQ; 1 điểm cho ba SLI/SLO có ý nghĩa.

**Tham chiếu:** `SD-029`, `SD-032`, `SD-054`.

## 9. Infrastructure và Cloud — 9 điểm

### QM-041 — [Infra] [Short answer] — 1 điểm

Khi truy cập một HTTPS URL lần đầu, DNS, transport, TLS và HTTP diễn ra theo thứ tự nào?

**Đáp án kỳ vọng:** Resolve DNS để lấy endpoint, thiết lập TCP hoặc QUIC, thực hiện TLS handshake/xác minh certificate và thương lượng protocol, rồi gửi HTTP request qua connection đã bảo mật; proxy/cache có thể thêm bước.

**Rubric:** 1 điểm nếu đúng thứ tự và có TLS validation.

**Tham chiếu:** `INF-001`.

### QM-042 — [Infra] [Short answer] — 1 điểm

Container khác virtual machine ở isolation kernel và resource control như thế nào?

**Đáp án kỳ vọng:** Container chia sẻ host kernel, dùng namespaces cho isolation view và cgroups cho resource; VM chạy guest OS/kernel riêng qua hypervisor nên boundary mạnh hơn nhưng overhead/startup lớn hơn.

**Rubric:** 0,5 điểm cho shared kernel/namespaces+cgroups; 0,5 điểm cho VM kernel/overhead/isolation.

**Tham chiếu:** `INF-014`, `INF-016`.

### QM-043 — [Infra] [Scenario] — 2 điểm

Một Pod khởi động chậm bị liveness probe restart liên tục, còn lúc deploy lại nhận traffic trước khi warmup xong. Hãy phân vai startup, readiness và liveness probe.

**Đáp án kỳ vọng:** Startup probe che giai đoạn khởi động dài trước khi liveness được áp; readiness chỉ true khi instance sẵn nhận traffic và false khi cần drain; liveness chỉ phát hiện process không thể tự hồi phục, không phụ thuộc mọi downstream tạm lỗi.

**Rubric:** 0,5 điểm cho mỗi probe đúng; 0,5 điểm cho tránh cascade/restart loop và cấu hình timeout/threshold hợp lý.

**Tham chiếu:** `INF-021`, `SD-046`.

### QM-044 — [Infra] [Scenario] — 2 điểm

HTTP client dùng connection pool lâu dài nhưng sau DNS failover vẫn gọi IP cũ. Nêu nguyên nhân và các timeout/lifetime cần phối hợp.

**Đáp án kỳ vọng:** Pool tái dùng connection đã resolve IP nên DNS TTL không buộc socket đang mở đổi endpoint; DNS/runtime còn có cache riêng. Đặt pooled connection lifetime/idle timeout phù hợp DNS/failover, connect/request timeout, retry có budget và health handling; không tắt pooling cực đoan.

**Rubric:** 1 điểm cho stale pooled connection/DNS mechanism; 1 điểm cho lifetime/timeout/retry phối hợp.

**Tham chiếu:** `INF-004`, `INF-009`.

### QM-045 — [Infra] [Troubleshooting] — 3 điểm

Pod ở trạng thái `Running`, readiness pass nhưng client thỉnh thoảng nhận 503. Lập cây kiểm tra từ load balancer/Ingress/Service/Endpoint đến ứng dụng và saturation.

**Đáp án kỳ vọng:** Xác định 503 do lớp nào qua request ID/access log, kiểm tra LB/Ingress target/timeout/retry/TLS, Service selector và EndpointSlice có Pod terminating/not-ready/stale, network policy/DNS/zone. Cuối cùng kiểm tra app queue/thread/connection pool, dependency, readiness có phản ánh saturation và correlate theo pod/AZ/version; mitigate bằng rút target lỗi/rollback trước khi root-cause.

**Rubric:** 1 điểm cho LB/Ingress; 1 điểm cho Service/Endpoint/network; 1 điểm cho app saturation/correlation/mitigation.

**Tham chiếu:** `INF-008`, `INF-020`, `INF-021`, `INF-030`.

## 10. DevOps và Observability — 9 điểm

### QM-046 — [DevOps] [Short answer] — 1 điểm

Continuous Integration, Continuous Delivery và Continuous Deployment khác nhau thế nào?

**Đáp án kỳ vọng:** CI tích hợp thường xuyên và kiểm tra tự động; Delivery giữ artifact luôn có thể phát hành nhưng production có thể cần quyết định người; Deployment tự động đưa mọi thay đổi đạt gate đến production.

**Rubric:** 1 điểm nếu phân biệt đủ ba, đặc biệt delivery với deployment.

**Tham chiếu:** `DO-001`.

### QM-047 — [DevOps] [Short answer] — 1 điểm

Phân biệt SLI, SLO và SLA; error budget dùng để ra quyết định gì?

**Đáp án kỳ vọng:** SLI là phép đo, SLO là mục tiêu nội bộ trên SLI, SLA là cam kết/hệ quả với khách hàng; error budget là phần unreliability cho phép để cân bằng tốc độ thay đổi với công việc reliability.

**Rubric:** 0,75 điểm cho ba khái niệm; 0,25 điểm cho quyết định dựa budget.

**Tham chiếu:** `DO-017`, `DO-018`, `DO-019`.

### QM-048 — [DevOps] [Scenario] — 2 điểm

Thiết kế canary release: chọn cohort, metric, observation window và điều kiện automated rollback nào?

**Đáp án kỳ vọng:** Chọn cohort nhỏ nhưng đại diện/isolated theo traffic hoặc tenant; so canary với control về error, latency, saturation và business KPI qua đủ cửa sổ tải. Rollback tự động khi threshold/burn-rate có statistical/minimum-volume guard vượt mức; tăng dần blast radius và giữ artifact/config rollback được.

**Rubric:** 1 điểm cho cohort+metric+window; 1 điểm cho gate/rollback/blast-radius hợp lý.

**Tham chiếu:** `DO-009`.

### QM-049 — [DevOps] [Troubleshooting] — 2 điểm

P99 tăng gấp năm nhưng CPU trung bình bình thường. Nêu ít nhất bốn hypothesis và telemetry dùng để kiểm chứng từng nhóm nguyên nhân.

**Đáp án kỳ vọng:** Có thể là dependency/network latency (trace), lock/thread/connection-pool queue (JFR/dump/pool metric), GC/allocation (GC log/profile), disk/DB IO hoặc query lock (DB/host metric), traffic skew/hot key và một pod/AZ lỗi (per-dimension RED metric). CPU average có thể che một core/pod hoặc thời gian chờ.

**Rubric:** 1 điểm cho bốn hypothesis khác lớp; 1 điểm cho telemetry ánh xạ đúng và phân tách theo thời gian/cohort.

**Tham chiếu:** `DO-026`, `DO-035`, `DO-046`.

### QM-050 — [DevOps] [Scenario] — 3 điểm

Deploy mới cần migration đổi tên cột đang được phiên bản cũ đọc. Hãy mô tả expand–migrate–contract, thứ tự rollout, validation và rollback point.

**Đáp án kỳ vọng:** Expand bằng thêm cột mới compatible; deploy code dual-write và đọc fallback, backfill theo batch có đối soát; chuyển read sang cột mới/canary, dừng write cũ sau compatibility window; chỉ contract/drop cột khi không còn reader cũ. Rollback an toàn trước contract vì cả schema/đường ghi còn tương thích; sau drop thường cần roll-forward/restore riêng.

**Rubric:** 1 điểm cho expand/dual compatibility; 1 điểm cho migrate/backfill/validation; 1 điểm cho contract/order và rollback point.

**Tham chiếu:** `DO-010`, `DO-011`, `SE-032`.

## 11. Security — 9 điểm

### QM-051 — [Security] [Short answer] — 1 điểm

Authentication và authorization khác nhau thế nào; vì sao ẩn nút trên UI không phải authorization?

**Đáp án kỳ vọng:** Authentication xác định principal; authorization kiểm tra principal được làm action trên resource nào. UI là client không tin cậy và request có thể gọi trực tiếp, nên server phải enforce authorization mọi boundary.

**Rubric:** 0,5 điểm cho phân biệt; 0,5 điểm cho server-side enforcement.

**Tham chiếu:** `SEC-006`.

### QM-052 — [Security] [Short answer] — 1 điểm

Hashing, encryption và digital signature bảo vệ ba mục tiêu khác nhau nào?

**Đáp án kỳ vọng:** Hash tạo digest một chiều cho integrity/fingerprint; encryption dùng key để giữ confidentiality và giải mã; digital signature chứng minh integrity cùng authenticity bằng private/public key.

**Rubric:** 1 điểm nếu ghép đúng ba primitive với mục tiêu; base64 không được coi là encryption.

**Tham chiếu:** `SEC-017`.

### QM-053 — [Security] [Code reasoning] — 2 điểm

Parameterized value có ngăn SQL injection nếu client được truyền trực tiếp tên cột `ORDER BY` không? Thiết kế xử lý dynamic identifier an toàn.

**Đáp án kỳ vọng:** Parameter placeholder chỉ đại diện value, không phải identifier/syntax; nối tên cột tùy ý vẫn injection. Map enum/input allowlist sang identifier hard-coded và direction allowlist, hoặc dùng query builder an toàn; reject mọi giá trị ngoài tập.

**Rubric:** 1 điểm cho giới hạn parameterization; 1 điểm cho allowlist mapping/reject đúng.

**Tham chiếu:** `SEC-023`, `DB-065`.

### QM-054 — [Security] [Scenario] — 2 điểm

Nêu các kiểm tra bắt buộc khi API nhận JWT và chiến lược key rotation không downtime.

**Đáp án kỳ vọng:** Allowlist algorithm, verify signature/key, issuer, audience, expiry/not-before, token type và quyền; không tin `alg`/key URL tùy token. Publish key mới, ký bằng key mới nhưng giữ key cũ verify trong overlap qua `kid`/JWKS cache refresh, rồi revoke sau khi mọi token cũ hết hạn.

**Rubric:** 1 điểm cho validation đầy đủ; 1 điểm cho versioned key/overlap/cache/revocation.

**Tham chiếu:** `SEC-008`, `SEC-020`, `JVM-041`.

### QM-055 — [Security] [Scenario] — 3 điểm

Backend nhận URL do người dùng nhập để tải file. Hãy threat-model SSRF qua redirect/DNS/private IP, đặt network boundary, giới hạn tài nguyên và kiểm tra nội dung trước khi lưu/phục vụ.

**Đáp án kỳ vọng:** Parse/canonicalize scheme/host, resolve và chặn loopback/private/link-local/metadata ở mọi redirect và sau DNS; chống rebinding bằng kết nối tới IP đã validate cùng Host/TLS đúng. Đặt fetcher trong sandbox/egress allowlist không có credential, timeout/size/rate/decompression limit; stream vào quarantine, xác minh type/malware, random filename/object permission và phục vụ từ domain không thực thi.

**Rubric:** 1 điểm cho URL/DNS/redirect validation; 1 điểm cho network isolation/resource limits; 1 điểm cho quarantine/content/storage/serving controls.

**Tham chiếu:** `SEC-029`, `SEC-032`, `SEC-050`, `INF-035`.
