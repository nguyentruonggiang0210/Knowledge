# Đáp án và rubric — Rapid Fire Backend

## Cách chấm

- Tổng điểm: **80**; mỗi câu **1 điểm**. Chấp nhận thuật ngữ tương đương nếu đúng bản chất.
- Cho **1 điểm** khi có đủ các ý trong rubric; **0,5 điểm** khi đúng cơ chế chính nhưng thiếu guarantee/pitfall; **0 điểm** nếu đảo ngược contract hoặc chỉ kể tên.
- Mốc đánh giá: **68–80** nền tảng rất chắc; **56–67** đạt Middle; **40–55** kiến thức chưa đều; **dưới 40** cần ôn nền tảng.

## 1. C# — 8 câu

### QR-001 — [C#] — 1 điểm

Boxing là gì và vì sao generic collection thường tránh được chi phí này?

**Đáp án:** Boxing bọc value type vào object/interface trên managed heap và cần unboxing/cast khi lấy lại. Generic collection như `List<int>` giữ kiểu cụ thể nên tránh boxing từng phần tử.

**Rubric:** Đủ boxing value→object và lợi ích type-specialized generic. **Tham chiếu:** `CS-002`, `CS-009`.

### QR-002 — [C#] — 1 điểm

Vì sao `IEnumerable<string>` có thể gán cho `IEnumerable<object>` nhưng `List<string>` không thể gán cho `List<object>`?

**Đáp án:** `IEnumerable<out T>` covariant vì chỉ sản xuất `T`; `List<T>` vừa đọc vừa ghi nên invariant. Nếu list covariant, caller có thể thêm object không phải string và phá type safety.

**Rubric:** Đủ covariance/producer và lý do mutable list invariant. **Tham chiếu:** `CS-007`.

### QR-003 — [C#] — 1 điểm

`event` khác public delegate field ở quyền mà subscriber được phép thực hiện như thế nào?

**Đáp án:** Bên ngoài chỉ được `+=`/`-=` event; chỉ declaring type được invoke hoặc gán thay invocation list. Public delegate cho caller invoke, gán null hay thay toàn bộ subscriber.

**Rubric:** Nêu đúng giới hạn subscribe so với invoke/assign. **Tham chiếu:** `CS-016`.

### QR-004 — [C#] — 1 điểm

Một LINQ query deferred được enumerate hai lần có thể tạo kết quả hoặc chi phí gì bất ngờ?

**Đáp án:** Source và operator chạy lại mỗi lần, nên có thể thấy dữ liệu đã đổi, lặp I/O/CPU hoặc side effect. Materialize khi cần snapshot/reuse có chủ đích.

**Rubric:** Có re-execution và ít nhất một hệ quả. **Tham chiếu:** `CS-020`.

### QR-005 — [C#] — 1 điểm

Compiler biến method `async` thành cấu trúc gì, và code trước `await` chạy khi nào?

**Đáp án:** Compiler hạ method thành state machine cùng builder/continuation. Code chạy đồng bộ trên caller thread đến khi gặp await chưa hoàn tất; continuation chạy theo awaiter/context/scheduler.

**Rubric:** Có state machine và synchronous-before-first-incomplete-await. **Tham chiếu:** `CS-026`.

### QR-006 — [C#] — 1 điểm

Vì sao gọi `.Result` hoặc `.Wait()` trên task có thể gây deadlock hoặc thread-pool starvation?

**Đáp án:** Thread bị block trong khi continuation có thể cần chính context/thread đó, tạo deadlock; nhiều blocking worker còn chiếm pool khiến continuation không có worker và tăng starvation. Dùng `await` xuyên suốt.

**Rubric:** Nêu context deadlock hoặc pool starvation và hướng async-all-the-way. **Tham chiếu:** `CS-029`.

### QR-007 — [C#] — 1 điểm

Vì sao không nên `lock` trên `this`, string interned hoặc object công khai?

**Đáp án:** Code ngoài có thể lock cùng object mà class không kiểm soát, gây contention/deadlock; string còn có thể được intern và chia sẻ ngoài ý muốn. Dùng private readonly lock object.

**Rubric:** Có external lock interference và private lock. **Tham chiếu:** `CS-035`.

### QR-008 — [C#] — 1 điểm

Vì sao `Span<T>` là `ref struct` và không thể được giữ qua `await` theo cách thông thường?

**Đáp án:** Span có thể tham chiếu stack/unmanaged region nên bị giới hạn ở stack để không escape quá lifetime. Async state machine thường lưu local trên heap qua suspension, vì thế không thể giữ span sống qua `await`.

**Rubric:** Có lifetime/escape và async heap state machine. **Tham chiếu:** `CS-043`.

## 2. .NET và ASP.NET Core — 7 câu

### QR-009 — [.NET] — 1 điểm

Gen 0/1/2 và Large Object Heap phản ánh giả định lifetime nào của GC?

**Đáp án:** Generational hypothesis cho rằng phần lớn object chết trẻ: object mới ở Gen 0, sống qua collection được promote dần; object lớn vào LOH và thường được thu cùng collection thế hệ cao. Live set/promotion mới là chi phí quan trọng, không chỉ số allocation.

**Rubric:** Có young-dies-young, promotion và vai trò LOH. **Tham chiếu:** `NET-003`.

### QR-010 — [.NET] — 1 điểm

Hai dấu hiệu production phổ biến của .NET thread-pool starvation là gì?

**Đáp án:** Queue/latency tăng trong khi worker thread tăng chậm hoặc nhiều worker đang block; CPU có thể chưa bão hòa và timer/continuation chạy trễ. Thread-pool queue length/thread count cùng trace stack giúp xác nhận.

**Rubric:** Nêu hai dấu hiệu, ít nhất một dấu hiệu phân biệt với CPU saturation. **Tham chiếu:** `NET-007`.

### QR-011 — [.NET] — 1 điểm

Vì sao hai type cùng full name được load bởi hai `AssemblyLoadContext` có thể không cast được cho nhau?

**Đáp án:** Runtime type identity gồm cả assembly/load context, không chỉ namespace và tên. Shared contract phải được load ở context chung thay vì mỗi plugin có một bản riêng.

**Rubric:** Có load-context identity và shared-contract boundary. **Tham chiếu:** `NET-011`, `NET-012`.

### QR-012 — [.NET] — 1 điểm

Captive dependency xảy ra khi lifetime nào phụ thuộc trực tiếp lifetime nào?

**Đáp án:** Thường là singleton giữ scoped hoặc transient có semantics/disposal ngắn hơn, kéo nó sống quá scope và có thể dùng state request cũ. Cần align lifetime hoặc singleton tạo scope/factory có ownership rõ khi thật sự cần.

**Rubric:** Xác định long-lived→short-lived và hậu quả. **Tham chiếu:** `NET-015`, `NET-016`.

### QR-013 — [.NET] — 1 điểm

Middleware exception handling nên đứng ở đâu trong pipeline và vì sao thứ tự middleware quan trọng?

**Đáp án:** Nó nên ở đủ sớm để bọc các middleware/endpoint phía sau, nhưng sau các thành phần cần thiết như forwarded headers tùy topology. Pipeline là nested delegates theo thứ tự đăng ký, nên đặt sai có thể không bắt lỗi hoặc chạy auth/CORS/routing sai semantics.

**Rubric:** Có outer wrapper và order/nesting consequence. **Tham chiếu:** `NET-022`, `NET-023`.

### QR-014 — [.NET] — 1 điểm

Vì sao `DbContext` không nên là singleton hoặc được dùng đồng thời bởi nhiều thread?

**Đáp án:** Nó là mutable unit-of-work/identity map, không thread-safe và giữ tracked entities; singleton gây race, stale/tracking conflict và phình memory. Dùng scoped per use case/request hoặc factory với dispose rõ.

**Rubric:** Có mutable/non-thread-safe và lifetime đúng. **Tham chiếu:** `NET-041`.

### QR-015 — [.NET] — 1 điểm

Log, metric và distributed trace lần lượt trả lời tốt nhất loại câu hỏi vận hành nào?

**Đáp án:** Metric cho xu hướng/alert và “có bao nhiêu”; trace cho đường đi/latency qua service; log cho event/context chi tiết để giải thích “đã xảy ra gì”. Chúng cần correlation nhưng phải kiểm soát cardinality và dữ liệu nhạy cảm.

**Rubric:** Ghép đúng vai trò của cả ba. **Tham chiếu:** `NET-052`, `DO-026`.

## 3. Java — 8 câu

### QR-016 — [Java] — 1 điểm

`==` và `equals()` khác nhau thế nào với object Java?

**Đáp án:** `==` so reference identity; `equals()` định nghĩa logical equality và mặc định của `Object` cũng là identity nếu không override. Equality dùng trong collection phải đi cùng `hashCode()` nhất quán.

**Rubric:** Phân biệt identity/logical equality. **Tham chiếu:** `JAVA-002`.

### QR-017 — [Java] — 1 điểm

PECS hướng dẫn đặt `extends` và `super` thế nào cho producer/consumer generic?

**Đáp án:** Producer dùng `? extends T` để đọc như T; consumer dùng `? super T` để ghi T an toàn. Đó là “Producer Extends, Consumer Super”.

**Rubric:** Đúng cả hai chiều và thao tác. **Tham chiếu:** `JAVA-006`.

### QR-018 — [Java] — 1 điểm

Điều gì xảy ra nếu field tham gia `hashCode()` của key bị đổi sau khi đưa vào `HashMap`?

**Đáp án:** Key vẫn nằm ở bucket theo hash cũ nhưng lookup dùng hash mới, nên có thể không tìm/xóa được dù object vẫn trong map. Key nên immutable theo equality/hash.

**Rubric:** Có wrong-bucket lookup và giải pháp immutable key. **Tham chiếu:** `JAVA-002`, `JAVA-012`.

### QR-019 — [Java] — 1 điểm

Vì sao fail-fast iterator và `ConcurrentModificationException` không tạo thread safety?

**Đáp án:** Việc phát hiện dựa trên `modCount` là best-effort, không tạo synchronization hay happens-before và không bảo đảm bắt mọi race. Phải dùng lock hoặc concurrent collection theo consistency cần thiết.

**Rubric:** Có best-effort và không có memory/synchronization guarantee. **Tham chiếu:** `JAVA-015`.

### QR-020 — [Java] — 1 điểm

Intermediate operation của Stream được thực thi khi nào và short-circuit terminal operation thay đổi gì?

**Đáp án:** Intermediate operation thường lazy và chỉ chạy khi terminal operation kéo phần tử qua pipeline. `findFirst`, `anyMatch`, `limit` có thể dừng trước khi duyệt hết source.

**Rubric:** Có lazy terminal trigger và early termination. **Tham chiếu:** `JAVA-019`.

### QR-021 — [Java] — 1 điểm

`volatile` bảo đảm visibility/order nào và vì sao không làm `count++` atomic?

**Đáp án:** Volatile write happens-before volatile read tương ứng, tạo visibility và cấm một số reordering quanh access. `count++` là read–modify–write gồm nhiều bước nên hai thread vẫn mất update; dùng atomic/lock.

**Rubric:** Có happens-before visibility và compound non-atomic. **Tham chiếu:** `JAVA-032`, `JAVA-033`.

### QR-022 — [Java] — 1 điểm

Vì sao `LongAdder.sum()` phù hợp metric hơn quota cần snapshot tuyến tính?

**Đáp án:** LongAdder phân tán update qua nhiều cell để giảm contention, còn `sum()` đọc các cell khi update có thể xen giữa nên không phải atomic snapshot. Metric thống kê chấp nhận điều đó; quota/invariant cần linearizable atomic hoặc lock.

**Rubric:** Có striped cells, non-atomic sum và use-case distinction. **Tham chiếu:** `JAVA-038`.

### QR-023 — [Java] — 1 điểm

Virtual thread giúp workload nào và tại sao vẫn phải giới hạn connection tới database?

**Đáp án:** Virtual thread giúp nhiều task blocking I/O theo thread-per-task với chi phí thread thấp, không tăng CPU capacity. DB connection là tài nguyên downstream hữu hạn nên vẫn cần pool/semaphore/backpressure để tránh overload.

**Rubric:** Có blocking-I/O suitability và downstream bound. **Tham chiếu:** `JAVA-043`.

## 4. JVM và Spring — 7 câu

### QR-024 — [JVM/Spring] — 1 điểm

Class identity trên JVM gồm binary name và thành phần nào nữa?

**Đáp án:** Gồm binary name và defining class loader. Vì vậy class cùng tên do hai loader định nghĩa là hai type khác nhau và có thể cast lỗi.

**Rubric:** Nêu defining class loader và hệ quả. **Tham chiếu:** `JVM-002`.

### QR-025 — [JVM/Spring] — 1 điểm

Metaspace và direct memory khác heap ở dữ liệu và cách chẩn đoán ra sao?

**Đáp án:** Metaspace chứa class metadata, direct/native memory chứa buffer/JVM/native allocation, còn heap chứa Java objects. Heap dump không đủ cho phần ngoài heap; dùng class-loading metric, Native Memory Tracking, direct-buffer và OS RSS/map.

**Rubric:** Phân vùng đúng và có công cụ non-heap. **Tham chiếu:** `JVM-009`, `JVM-013`.

### QR-026 — [JVM/Spring] — 1 điểm

G1 và ZGC ưu tiên trade-off throughput/pause khác nhau thế nào?

**Đáp án:** G1 cân bằng throughput với pause mục tiêu bằng region và mixed collection; ZGC làm nhiều marking/relocation concurrent để pause rất thấp trên heap lớn, đổi lại CPU/barrier/headroom. Chọn bằng SLO và load test, không chỉ theo tên collector.

**Rubric:** Nêu đúng ưu tiên và ít nhất một trade-off. **Tham chiếu:** `JVM-012`.

### QR-027 — [JVM/Spring] — 1 điểm

Spring singleton có tự động thread-safe không, và state nào không nên đặt trong singleton controller?

**Đáp án:** Không; singleton chỉ là một bean instance trong context và nhận request đồng thời. Không giữ request/user-specific hoặc mutable unsynchronized state trong field; ưu tiên local/immutable/thread-safe external state.

**Rubric:** Có no-thread-safety guarantee và ví dụ state nguy hiểm. **Tham chiếu:** `JVM-021`.

### QR-028 — [JVM/Spring] — 1 điểm

JDK dynamic proxy và class-based proxy khác nhau về interface và `final` method như thế nào?

**Đáp án:** JDK proxy triển khai interface; class-based proxy subclass class target. Final class/method không thể được subclass/override để intercept, và self-call vẫn không đi qua proxy.

**Rubric:** Đúng interface/subclass và final limitation. **Tham chiếu:** `JVM-023`.

### QR-029 — [JVM/Spring] — 1 điểm

Spring mặc định rollback transaction với nhóm exception nào?

**Đáp án:** Mặc định rollback với unchecked `RuntimeException` và `Error`, không phải mọi checked exception. Nếu exception bị catch và method return bình thường, proxy thường commit trừ khi được đánh rollback-only.

**Rubric:** Nêu runtime/error và checked/catch caveat. **Tham chiếu:** `JVM-031`.

### QR-030 — [JVM/Spring] — 1 điểm

Vì sao đổi mọi association JPA sang `EAGER` không phải cách đúng để sửa N+1?

**Đáp án:** EAGER là fetch contract, provider vẫn có thể chạy query phụ và còn gây over-fetch/Cartesian result. Dùng fetch join/entity graph/batch/projection theo từng use case và đo query count/row count.

**Rubric:** Có EAGER≠query plan và use-case fetch strategy. **Tham chiếu:** `JVM-046`, `JVM-047`.

## 5. Algorithms và Data Structures — 7 câu

### QR-031 — [Algorithms] — 1 điểm

Khái niệm amortized O(1) của dynamic-array append có nghĩa gì?

**Đáp án:** Một lần resize có thể O(n), nhưng capacity tăng theo cấp số nhân làm tổng copy qua n append là O(n). Chi phí trung bình theo chuỗi thao tác là O(1), không có nghĩa mọi append worst-case O(1).

**Rubric:** Có aggregate/geometric reasoning và phân biệt worst-case. **Tham chiếu:** `ALG-002`.

### QR-032 — [Algorithms] — 1 điểm

Stack, queue và deque khác nhau ở thứ tự lấy phần tử như thế nào?

**Đáp án:** Stack LIFO; queue FIFO; deque cho thêm/lấy ở cả hai đầu nên biểu diễn được cả hai pattern. Chọn theo invariant order, không chỉ theo tên API.

**Rubric:** Đúng LIFO/FIFO/two-ended. **Tham chiếu:** `ALG-005`.

### QR-033 — [Algorithms] — 1 điểm

BFS và DFS đều O(V+E) trên adjacency list nhưng khác nhau ở guarantee đường đi nào?

**Đáp án:** BFS duyệt theo layer nên tìm shortest path theo số cạnh trong graph unweighted; DFS không bảo đảm đường ngắn nhất, phù hợp reachability, cycle/topology/backtracking tùy bài.

**Rubric:** Có BFS unweighted shortest-path guarantee và DFS không có. **Tham chiếu:** `ALG-013`.

### QR-034 — [Algorithms] — 1 điểm

`lower_bound` trả vị trí có invariant gì so với target?

**Đáp án:** Trả index đầu tiên có value `>= target`, hoặc end nếu không có. Trong binary search half-open, phần bên trái candidate đã chứng minh `< target`, phần bên phải chưa loại chứa `>= target`.

**Rubric:** Có first `>=` và end/boundary semantics. **Tham chiếu:** `ALG-019`.

### QR-035 — [Algorithms] — 1 điểm

Để giữ Top-K lớn nhất từ stream, nên duy trì min-heap hay max-heap kích thước K?

**Đáp án:** Min-heap kích thước K; root là phần tử nhỏ nhất trong Top-K để so và thay nhanh khi gặp giá trị lớn hơn. Thời gian O(n log K), bộ nhớ O(K).

**Rubric:** Min-heap, root semantics và complexity. **Tham chiếu:** `ALG-006`.

### QR-036 — [Algorithms] — 1 điểm

Bốn thành phần tối thiểu khi mô tả một dynamic-programming solution là gì?

**Đáp án:** State, transition/recurrence, base case và thứ tự tính; nên kèm đáp án nằm ở state nào và complexity. Bốn mục đầu là cốt lõi để chứng minh dependency đã có trước khi dùng.

**Rubric:** Đủ state, transition, base, order. **Tham chiếu:** `ALG-031`.

### QR-037 — [Algorithms] — 1 điểm

Bloom filter có thể false positive hay false negative trong triển khai chuẩn không xóa?

**Đáp án:** Có false positive nhưng không có false negative nếu chỉ insert/query và implementation đúng: “có thể có”, còn “chắc chắn không có”. Xóa bit trực tiếp có thể tạo false negative; counting Bloom mới hỗ trợ delete có điều kiện.

**Rubric:** Đúng false-positive/no-false-negative và điều kiện không xóa. **Tham chiếu:** `ALG-043`, `SD-020`.

## 6. Database — 8 câu

### QR-038 — [Database] — 1 điểm

Vì sao `column = NULL` không trả true trong SQL?

**Đáp án:** NULL biểu diễn unknown nên phép so sánh trả UNKNOWN theo three-valued logic, không phải true. Dùng `IS NULL`/`IS NOT NULL` và xem kỹ semantics của `NOT IN`/aggregate.

**Rubric:** Có UNKNOWN/three-valued logic và `IS NULL`. **Tham chiếu:** `DB-005`.

### QR-039 — [Database] — 1 điểm

Quy tắc leftmost-prefix ảnh hưởng composite index như thế nào?

**Đáp án:** Index sắp theo cột từ trái sang phải nên query thường seek hiệu quả khi ràng buộc prefix đầu; bỏ cột đầu làm các cột sau khó dùng cho seek/order. Sau range trên một cột, khả năng dùng các cột sau cho seek thường giảm.

**Rubric:** Có leading prefix và hệ quả bỏ prefix/range. **Tham chiếu:** `DB-022`.

### QR-040 — [Database] — 1 điểm

Một predicate không SARGable làm optimizer khó dùng index seek ra sao?

**Đáp án:** Function/cast trên indexed column hoặc leading wildcard có thể buộc tính trên nhiều row nên không tạo range seek trực tiếp, dẫn tới scan/residual filter. Viết predicate theo range trên raw column hoặc dùng index biểu thức/generated column nếu engine hỗ trợ.

**Rubric:** Có nguyên nhân và một cách làm SARGable. **Tham chiếu:** `DB-019`, `DB-026`.

### QR-041 — [Database] — 1 điểm

Durability trong ACID phụ thuộc những cơ chế persistence nào?

**Đáp án:** Thường dựa WAL/redo log được flush/fsync theo commit policy, storage guarantee và đôi khi synchronous replica nếu yêu cầu chịu mất máy/site. “Commit thành công” chỉ bền theo failure model/config đã chọn.

**Rubric:** Có WAL+flush và failure-model/config caveat. **Tham chiếu:** `DB-031`.

### QR-042 — [Database] — 1 điểm

MVCC cho phép reader không chặn writer bằng snapshot/version như thế nào?

**Đáp án:** Mỗi write tạo version, còn transaction đọc version visible theo snapshot thay vì khóa row đang được writer sửa. Đổi lại phải giữ/dọn version cũ; transaction dài gây bloat/vacuum lag.

**Rubric:** Có version visibility và cleanup cost. **Tham chiếu:** `DB-033`.

### QR-043 — [Database] — 1 điểm

Deadlock khác lock wait bình thường ở cấu trúc phụ thuộc nào, và application nên phản ứng ra sao?

**Đáp án:** Deadlock có cycle trong wait-for graph nên không task nào tự tiến; DB chọn victim để rollback, còn wait bình thường có owner sẽ nhả lock. Application retry toàn transaction bị chọn với bounded backoff và giảm cycle bằng lock order/transaction ngắn.

**Rubric:** Có wait cycle, victim rollback và retry/design response. **Tham chiếu:** `DB-035`.

### QR-044 — [Database] — 1 điểm

Keyset pagination tránh hai nhược điểm nào của offset pagination?

**Đáp án:** Nó seek từ stable ordered cursor nên không phải scan/bỏ qua offset lớn và giảm duplicate/missing khi row trước trang bị chèn/xóa. Cần total order cùng tie-breaker và không hỗ trợ nhảy trang tùy ý dễ dàng.

**Rubric:** Có performance và consistency benefit. **Tham chiếu:** `DB-016`.

### QR-045 — [Database] — 1 điểm

Đọc từ asynchronous replica có thể vi phạm read-your-writes thế nào?

**Đáp án:** Primary đã commit nhưng replica chưa replay WAL/log, nên cùng user đọc replica ngay sau write có thể thấy state cũ. Có thể pin/session-read primary, chờ LSN/token hoặc dùng consistency routing theo yêu cầu.

**Rubric:** Có replica lag anomaly và một mitigation. **Tham chiếu:** `DB-054`, `DB-055`.

## 7. Software Engineering — 7 câu

### QR-046 — [Software Engineering] — 1 điểm

High cohesion và low coupling biểu hiện điều gì về boundary của module?

**Đáp án:** Thành phần trong module cùng phục vụ một trách nhiệm/capability và thay đổi cùng nhau, trong khi module phụ thuộc ít và qua contract hẹp vào bên ngoài. Dấu hiệu xấu là thay một feature phải sửa nhiều module hoặc module có quá nhiều lý do đổi.

**Rubric:** Đúng cohesion nội bộ và coupling bên ngoài. **Tham chiếu:** `SE-002`.

### QR-047 — [Software Engineering] — 1 điểm

Khi nào composition phù hợp hơn inheritance?

**Đáp án:** Khi cần kết hợp/đổi behavior độc lập mà không có quan hệ “is-a” và substitutability thật; composition giảm coupling với implementation parent. Inheritance vẫn đúng khi subtype giữ LSP/invariant và hierarchy ổn định.

**Rubric:** Có behavior reuse/is-a/LSP distinction. **Tham chiếu:** `SE-003`, `SE-004`.

### QR-048 — [Software Engineering] — 1 điểm

Aggregate trong DDD chịu trách nhiệm bảo vệ điều gì?

**Đáp án:** Aggregate root bảo vệ invariant cần nhất quán trong một transaction và là cổng thay đổi các entity/value bên trong. Boundary quá lớn gây contention/object graph lớn; quá nhỏ đẩy invariant thành distributed coordination.

**Rubric:** Có transactional invariant/root boundary. **Tham chiếu:** `SE-008`.

### QR-049 — [Software Engineering] — 1 điểm

Domain event và integration event khác nhau ở boundary và thời điểm phát như thế nào?

**Đáp án:** Domain event diễn tả sự kiện trong bounded context và có thể xử lý trong cùng use case/transaction; integration event là contract bền hơn cho bên ngoài, thường publish sau commit qua outbox. Không nên phát external event trước khi state local commit.

**Rubric:** Có internal/external boundary và commit timing. **Tham chiếu:** `SE-010`.

### QR-050 — [Software Engineering] — 1 điểm

Idempotency key phải gắn với scope và lifecycle nào để phát hiện retry đúng?

**Đáp án:** Key phải scoped theo caller/tenant + operation/resource và trỏ tới request fingerprint/result, được lưu atomic với side effect. TTL/retention phải phủ retry window; tái dùng cùng key với payload khác phải reject.

**Rubric:** Có scope, atomic result và retention/payload rule. **Tham chiếu:** `SE-021`.

### QR-051 — [Software Engineering] — 1 điểm

Mock quá nhiều có thể làm test bỏ sót hai loại lỗi tích hợp nào?

**Đáp án:** Có thể bỏ sót wiring/config/proxy/serialization contract và behavior thật của DB như SQL, transaction, constraint hoặc locking. Mock nên ở external boundary; integration test dùng dependency thật cho rủi ro cần xác minh.

**Rubric:** Nêu ít nhất hai nhóm lỗi khác nhau. **Tham chiếu:** `SE-023`, `SE-024`, `SE-025`.

### QR-052 — [Software Engineering] — 1 điểm

Một Architecture Decision Record tối thiểu nên ghi những mục nào?

**Đáp án:** Context/problem và constraints, decision, alternatives, trade-off/consequences, status/date/owner; khi đổi thì tạo ADR supersede và liên kết. ADR cần gần workflow code/review để không thành tài liệu chết.

**Rubric:** Có context, decision, alternatives và consequences/status. **Tham chiếu:** `SE-039`.

## 8. System Design — 7 câu

### QR-053 — [System Design] — 1 điểm

Từ traffic trung bình, vì sao phải áp dụng peak factor khi ước lượng capacity?

**Đáp án:** Traffic không phân bố đều; chiến dịch/giờ cao điểm/retry có thể làm QPS tức thời nhiều lần average. Ghi rõ peak factor và headroom giúp sizing theo burst/SLO thay vì hệ thống bão hòa dù daily average thấp.

**Rubric:** Có non-uniform burst và capacity/headroom consequence. **Tham chiếu:** `SD-002`.

### QR-054 — [System Design] — 1 điểm

CAP yêu cầu hệ thống lựa chọn điều gì khi network partition thực sự xảy ra?

**Đáp án:** Khi partition, hệ thống phân tán phải đánh đổi giữa tiếp tục phục vụ mọi request (availability theo CAP) và duy trì consistency model mạnh; partition tolerance là điều kiện phải chịu, không phải nút chọn tùy ý. Lựa chọn có thể khác theo operation/data.

**Rubric:** Đúng C-vs-A during partition. **Tham chiếu:** `SD-006`.

### QR-055 — [System Design] — 1 điểm

Consistent hashing giảm data movement khi node thay đổi nhưng không tự giải quyết dạng hotspot nào?

**Đáp án:** Nó phân bố key space và giảm remap, nhưng một key cực nóng hoặc workload/value size skew vẫn có thể dồn tải vào một shard. Cần split/replicate hot key, request coalescing hoặc application partitioning riêng.

**Rubric:** Nêu hot-key/workload skew và không nhầm với node distribution. **Tham chiếu:** `SD-015`, `SD-019`.

### QR-056 — [System Design] — 1 điểm

Cache-aside xử lý cache miss và write như thế nào?

**Đáp án:** Read miss thì application đọc source of truth rồi populate cache; write thường cập nhật DB và invalidate/cache-update theo policy. Race có thể tạo stale value nên cần ordering/version/TTL phù hợp.

**Rubric:** Có read miss flow và write/invalidation caveat. **Tham chiếu:** `SD-017`, `SD-018`.

### QR-057 — [System Design] — 1 điểm

At-least-once delivery đặt yêu cầu gì lên message consumer?

**Đáp án:** Message có thể được giao lại nên consumer phải idempotent/dedupe và chỉ ack sau khi state cần thiết đã commit. External side effect cũng cần idempotency key hoặc outbox.

**Rubric:** Có duplicate handling và ack/commit order. **Tham chiếu:** `SD-022`, `SD-023`.

### QR-058 — [System Design] — 1 điểm

Exponential backoff cần jitter để tránh hiện tượng gì?

**Đáp án:** Nếu client retry cùng lịch, chúng đồng bộ thành retry herd/storm ở các mốc giống nhau; jitter phân tán request theo thời gian. Vẫn cần timeout, max attempts/deadline và retry chỉ lỗi/idempotent operation phù hợp.

**Rubric:** Có synchronized retry storm và random spreading. **Tham chiếu:** `SD-029`.

### QR-059 — [System Design] — 1 điểm

Vì sao liveness check không nên fail chỉ vì một dependency tạm thời unavailable?

**Đáp án:** Restart instance không sửa dependency và có thể tạo restart/cascade storm, làm mất capacity còn hoạt động. Readiness có thể rút traffic khi instance không phục vụ được; liveness chỉ phản ánh process không thể tự hồi phục.

**Rubric:** Có cascade/restart reasoning và readiness distinction. **Tham chiếu:** `SD-046`, `INF-021`.

## 9. Infrastructure và Cloud — 7 câu

### QR-060 — [Infra] — 1 điểm

TCP cung cấp byte stream có hai guarantee chính nào và không giữ message boundary nghĩa là gì?

**Đáp án:** TCP cung cấp byte stream reliable và ordered (trong điều kiện connection còn hợp lệ), loại duplicate ở layer transport. Một lần `send` không tương ứng một lần `read`; application phải tự frame message theo length/delimiter/protocol.

**Rubric:** Có ordered/reliable và application framing. **Tham chiếu:** `INF-002`.

### QR-061 — [Infra] — 1 điểm

HTTP/2 và HTTP/3 khác nhau ở transport-level head-of-line blocking như thế nào?

**Đáp án:** HTTP/2 multiplex stream trên một TCP connection nên packet loss có thể chặn mọi stream ở TCP HOL; HTTP/3 dùng QUIC với stream độc lập nên loss một stream không chặn transport delivery của stream khác. QUIC vẫn có congestion/operational trade-off.

**Rubric:** Đúng TCP connection HOL so với QUIC stream independence. **Tham chiếu:** `INF-003`.

### QR-062 — [Infra] — 1 điểm

CIDR xác định network prefix ra sao, và NAT khác firewall ở chức năng cốt lõi nào?

**Đáp án:** CIDR `/n` cho biết n bit đầu là network prefix và phần còn lại là host range. NAT dịch địa chỉ/port; firewall/security group quyết định allow/deny traffic, dù thiết bị có thể kết hợp cả hai.

**Rubric:** Đúng prefix và translation-vs-policy. **Tham chiếu:** `INF-006`, `INF-007`.

### QR-063 — [Infra] — 1 điểm

File-descriptor leak thường biểu hiện thế nào với socket/file trên Linux?

**Đáp án:** Số FD tăng tới process/system limit rồi open/accept/connect thất bại với `too many open files`, kéo theo timeout/503. Đo `/proc`, `lsof`/metric theo type và sửa ownership/close/pool.

**Rubric:** Có limit symptom và một cách xác nhận. **Tham chiếu:** `INF-013`.

### QR-064 — [Infra] — 1 điểm

Vì sao container có thể bị OOMKilled dù heap limit của runtime chưa đạt cgroup memory limit?

**Đáp án:** Cgroup tính toàn process: heap cộng native/direct, thread stacks, code/metaspace, library và page cache liên quan; heap còn headroom nhưng tổng RSS/working set có thể chạm limit. Cần budget non-heap và theo dõi cgroup/RSS, không chỉ heap.

**Rubric:** Có total-process accounting và non-heap examples. **Tham chiếu:** `INF-016`, `JVM-054`.

### QR-065 — [Infra] — 1 điểm

Kubernetes Service và Ingress/Gateway khác nhau ở phạm vi routing nào?

**Đáp án:** Service cung cấp stable virtual endpoint/discovery/load balancing tới Pods, thường L4 trong cluster; Ingress/Gateway nhận traffic và route L7 theo host/path/TLS tới Service. Loại Service có thể expose L4 ra ngoài nhưng không thay role L7.

**Rubric:** Có stable service/L4 và ingress host-path/L7. **Tham chiếu:** `INF-020`.

### QR-066 — [Infra] — 1 điểm

Object, block và file storage phù hợp ba access pattern khác nhau nào?

**Đáp án:** Object cho immutable-ish blob qua key/API và scale lớn; block cho random read/write volume gắn máy/DB/filesystem; file cho shared hierarchical filesystem/POSIX-like access. Latency, consistency và access mode khác nhau theo dịch vụ.

**Rubric:** Ghép đúng cả ba access pattern. **Tham chiếu:** `INF-034`.

## 10. DevOps và Observability — 7 câu

### QR-067 — [DevOps] — 1 điểm

“Build once, promote the same artifact” loại bỏ loại drift nào?

**Đáp án:** Nó tránh rebuild theo môi trường làm thay bytecode/dependency/toolchain/timestamp không kiểm soát; artifact đã test chính là artifact production. Config/secret được inject lúc deploy/runtime nhưng không mutate artifact.

**Rubric:** Có environment rebuild drift và same tested artifact. **Tham chiếu:** `DO-003`, `DO-004`.

### QR-068 — [DevOps] — 1 điểm

Canary release khác rolling deployment ở quyết định phát hành dựa trên tín hiệu nào?

**Đáp án:** Rolling chủ yếu thay instance dần theo health/availability; canary giữ cohort nhỏ để so SLI/business metric với control qua observation window rồi mới promote/rollback. Có thể kết hợp canary với rolling mechanics.

**Rubric:** Có metric-based cohort decision, không chỉ gradual replacement. **Tham chiếu:** `DO-008`, `DO-009`.

### QR-069 — [DevOps] — 1 điểm

Feature flag tách “deploy” khỏi “release” như thế nào?

**Đáp án:** Code có thể được deploy nhưng behavior vẫn tắt hoặc chỉ bật cho cohort sau đó, cho phép progressive release/kill switch. Flag cần owner, expiry và kiểm soát interaction để không thành nợ lâu dài.

**Rubric:** Có deployed-code vs enabled-behavior và lifecycle caveat. **Tham chiếu:** `DO-016`, `SE-033`.

### QR-070 — [DevOps] — 1 điểm

Bốn golden signals của SRE là gì?

**Đáp án:** Latency, traffic, errors và saturation. Chúng nên đo từ góc nhìn user/service boundary và phân tách success/failure phù hợp.

**Rubric:** Đủ bốn tín hiệu. **Tham chiếu:** `DO-020`.

### QR-071 — [DevOps] — 1 điểm

Vì sao user ID hoặc order ID không nên là metric label?

**Đáp án:** Chúng tạo cardinality gần như không giới hạn, làm tăng memory/storage/query cost và có thể phá backend metric. Đặt ID trong trace/log có sampling/access control, còn metric dùng dimension bounded.

**Rubric:** Có cardinality explosion và alternative đúng. **Tham chiếu:** `DO-028`.

### QR-072 — [DevOps] — 1 điểm

Trace context cần được truyền qua hai loại boundary phổ biến nào?

**Đáp án:** Qua synchronous HTTP/RPC headers và asynchronous message metadata/carrier. Phải xử lý fan-out, retry/link và không tin baggage tùy ý để tránh mất correlation/cardinality/PII.

**Rubric:** Nêu HTTP/RPC và message/async boundary. **Tham chiếu:** `DO-030`.

### QR-073 — [DevOps] — 1 điểm

Trong incident, mitigation khác root-cause fix ở mục tiêu tức thời nào?

**Đáp án:** Mitigation ưu tiên khôi phục user impact nhanh, ví dụ rollback, shed load hay disable feature, dù nguyên nhân chưa chứng minh hoàn toàn. Root-cause fix loại cơ chế gây lỗi và cần validation sau khi hệ thống ổn định.

**Rubric:** Phân biệt restore-now với eliminate-cause-later. **Tham chiếu:** `DO-041`.

## 11. Security — 7 câu

### QR-074 — [Security] — 1 điểm

Ba thuộc tính trong CIA triad là gì?

**Đáp án:** Confidentiality, Integrity và Availability: bí mật đúng đối tượng, dữ liệu/hành vi không bị sửa trái phép và dịch vụ truy cập được khi cần. Một control có thể cải thiện thuộc tính này nhưng làm giảm thuộc tính khác hoặc tăng cost.

**Rubric:** Đủ ba tên và ý nghĩa cơ bản. **Tham chiếu:** `SEC-001`.

### QR-075 — [Security] — 1 điểm

Session cookie và JWT bearer khác nhau thế nào về revocation và CSRF?

**Đáp án:** Session server-side dễ revoke tập trung nhưng cần state/store; self-contained JWT khó revoke tức thời nếu không thêm denylist/introspection và thường dùng lifetime ngắn. Cookie tự được browser gửi nên có CSRF risk; bearer trong Authorization không tự gửi nhưng dễ bị đánh cắp qua XSS/storage sai.

**Rubric:** Có revocation và credential-transport/CSRF distinction. **Tham chiếu:** `SEC-007`.

### QR-076 — [Security] — 1 điểm

PKCE bảo vệ Authorization Code Flow trước loại interception nào?

**Đáp án:** Client tạo verifier bí mật tạm thời và gửi challenge; kẻ chặn authorization code không đổi được token nếu thiếu verifier. Nó đặc biệt cần cho public client không giữ được client secret.

**Rubric:** Có code interception + verifier/challenge. **Tham chiếu:** `SEC-010`.

### QR-077 — [Security] — 1 điểm

Vì sao password cần salt riêng và thuật toán hash chậm?

**Đáp án:** Salt ngẫu nhiên duy nhất ngăn precomputed/rainbow table và làm password giống nhau có hash khác; KDF chậm/memory-hard làm mỗi lần brute force đắt. Salt không cần bí mật, còn pepper nếu dùng phải quản trong secret system.

**Rubric:** Có unique salt và brute-force cost. **Tham chiếu:** `SEC-014`.

### QR-078 — [Security] — 1 điểm

Nonce reuse với AEAD có thể phá các guarantee nào?

**Đáp án:** Với cùng key, nonce reuse có thể lộ quan hệ/plaintext và cho phép giả mạo tag tùy scheme, phá cả confidentiality lẫn integrity. Nonce phải unique theo key và key/nonce lifecycle phải được thiết kế, không chỉ “random hy vọng không trùng”.

**Rubric:** Nêu phá confidentiality/integrity và uniqueness-per-key. **Tham chiếu:** `SEC-018`.

### QR-079 — [Security] — 1 điểm

CSRF và CORS bảo vệ hai vấn đề khác nhau nào?

**Đáp án:** CSRF chống browser bị lợi dụng gửi request với credential tự đính kèm; CORS là browser policy kiểm soát script origin nào được đọc/gửi cross-origin theo rule. CORS không phải authentication và không thay CSRF protection khi dùng cookie.

**Rubric:** Phân biệt request forgery với cross-origin read policy. **Tham chiếu:** `SEC-027`, `SEC-028`.

### QR-080 — [Security] — 1 điểm

Parameterized query bảo vệ value nhưng không tự bảo vệ dynamic identifier như thế nào?

**Đáp án:** Placeholder tách data value khỏi SQL syntax nhưng không đại diện được tên bảng/cột hay keyword `ORDER BY`; nối identifier tùy user vẫn injection. Ánh xạ input qua allowlist sang identifier hard-coded/query builder an toàn.

**Rubric:** Có limitation và allowlist mapping. **Tham chiếu:** `SEC-023`, `DB-065`.
