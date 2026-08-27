# Bộ câu hỏi phỏng vấn Java — Middle & Senior

> Mỗi câu hỏi nên được trả lời theo ba lớp: cơ chế hoạt động, hệ quả thiết kế và cách kiểm chứng trong production. Câu hỏi có nhãn **[Middle]** kiểm tra nền tảng vững; **[Senior]** yêu cầu phân tích trade-off, failure mode và quyết định kiến trúc.

## 1. Ngôn ngữ, hệ kiểu và Generics

### JAVA-001 [Middle] Java luôn truyền tham trị (pass-by-value) nghĩa là gì khi tham số là object, và vì sao một method có thể đổi trạng thái object nhưng không thể đổi object mà biến của caller đang trỏ tới?

### JAVA-002 [Middle] Phân biệt `==`, `equals()` và `hashCode()`; contract nào phải được giữ khi object được dùng làm key của `HashMap`?

### JAVA-003 [Senior] Hãy code review một value object tiền tệ có `BigDecimal`: vì sao `equals()` có thể cho kết quả khác `compareTo()`, và bạn sẽ chuẩn hóa equality thế nào?

### JAVA-004 [Middle] Overloading, overriding, static method hiding và dynamic dispatch khác nhau thế nào; compiler/runtime chọn method ở thời điểm nào?

### JAVA-005 [Senior] Type erasure của Java Generics tạo ra bridge method, raw type và heap pollution như thế nào; khi nào `@SafeVarargs` thực sự an toàn?

### JAVA-006 [Middle] Giải thích quy tắc PECS (`Producer Extends, Consumer Super`) và thiết kế chữ ký copy phần tử giữa hai collection sao cho type-safe.

### JAVA-007 [Senior] Vì sao `List<String>` không phải subtype của `List<Object>`, trong khi array lại covariant; sự khác biệt này chuyển lỗi từ compile time sang runtime ra sao?

### JAVA-008 [Senior] Phân biệt bounded type parameter, wildcard bound và recursive bound như `<T extends Comparable<? super T>>`; mỗi dạng phù hợp cho API nào?

### JAVA-009 [Middle] Boxing/unboxing, integer cache và numeric promotion có thể gây bug gì với `Integer`, toán tử `==`, nullable wrapper và overload resolution?

### JAVA-010 [Senior] Hãy thiết kế API biểu diễn “không có kết quả”: so sánh `null`, `Optional`, empty collection và exception; vì sao không nên lạm dụng `Optional` trong field/parameter?

## 2. Collections và cấu trúc dữ liệu chuẩn

### JAVA-011 [Middle] So sánh `ArrayList` và `LinkedList` theo layout bộ nhớ, locality, độ phức tạp và workload thực tế; vì sao Big-O đơn thuần dễ dẫn tới lựa chọn sai?

### JAVA-012 [Senior] Mô tả cơ chế bucket, resize, treeification và collision của `HashMap`; mutable key hoặc `hashCode()` kém gây failure mode nào?

### JAVA-013 [Middle] `HashMap`, `LinkedHashMap`, `TreeMap` và `ConcurrentHashMap` khác nhau về ordering, null, complexity và concurrency guarantee ra sao?

### JAVA-014 [Senior] `ConcurrentHashMap.computeIfAbsent()` có những ràng buộc gì với mapping function; vì sao blocking I/O, recursion hoặc side effect trong function này nguy hiểm?

### JAVA-015 [Middle] Fail-fast iterator là gì, khác snapshot/weakly-consistent iterator thế nào, và vì sao `ConcurrentModificationException` không phải cơ chế đồng bộ?

### JAVA-016 [Senior] Khi nào chọn immutable collection, unmodifiable view hay defensive copy; `Collections.unmodifiableList()` có đảm bảo dữ liệu không đổi không?

### JAVA-017 [Middle] `Comparable` và `Comparator` phải giữ contract nào; comparator không nhất quán với `equals()` ảnh hưởng `TreeSet`/`TreeMap` thế nào?

### JAVA-018 [Senior] Hãy chọn cấu trúc dữ liệu cho cache LRU có concurrency: phân tích `LinkedHashMap`, synchronized wrapper, lock phân đoạn và thư viện cache chuyên dụng.

## 3. Stream, Lambda và lập trình hàm

### JAVA-019 [Middle] Stream pipeline được đánh giá lazy như thế nào; intermediate operation, terminal operation và short-circuiting ảnh hưởng execution ra sao?

### JAVA-020 [Senior] Điều kiện associativity, identity và statelessness nào cần giữ để `reduce()`/`collect()` cho kết quả đúng trên parallel stream?

### JAVA-021 [Middle] Phân biệt `map()` và `flatMap()`; hãy xử lý `List<Optional<T>>` hoặc cấu trúc lồng nhau mà không tạo stream lồng khó đọc.

### JAVA-022 [Senior] Vì sao side effect trong `peek()`, `map()` hoặc `forEach()` làm pipeline khó đúng, đặc biệt khi parallel/unordered; cách viết lại là gì?

### JAVA-023 [Senior] Khi nào parallel stream tăng tốc và khi nào làm chậm hoặc gây starvation; vai trò của spliterator, kích thước dữ liệu và common `ForkJoinPool` là gì?

### JAVA-024 [Middle] Hãy code review pipeline gom dữ liệu bằng `Collectors.toMap()`: duplicate key, null, ordering và merge function cần được xử lý thế nào?

## 4. Exception và thiết kế lỗi

### JAVA-025 [Middle] Checked exception và unchecked exception khác nhau về contract API ra sao; khi nào nên wrap và phải giữ nguyên cause thế nào?

### JAVA-026 [Senior] Thiết kế error model cho service nhiều tầng thế nào để không leak chi tiết hạ tầng nhưng vẫn giữ khả năng retry, quan sát và truy vết nguyên nhân?

### JAVA-027 [Middle] `try-with-resources` đóng tài nguyên theo thứ tự nào; suppressed exception là gì và vì sao có thể che giấu lỗi cleanup?

### JAVA-028 [Senior] Hãy code review catch block `catch (Exception e) { return null; }`: nó phá vỡ correctness/observability ra sao và nên thay bằng chiến lược nào?

## 5. Immutability và mô hình domain

### JAVA-029 [Middle] Một class immutable đúng nghĩa cần những điều kiện nào khi chứa `Date`, collection hoặc object mutable; defensive copy đặt ở đâu?

### JAVA-030 [Senior] Immutability hỗ trợ thread safety và cache/hash key thế nào, nhưng gây trade-off gì về allocation, copy và mô hình cập nhật lớn?

### JAVA-031 [Senior] Builder có thể làm mất invariant của immutable object ra sao; bạn sẽ validate cross-field, tránh trạng thái nửa vời và biểu diễn construction failure thế nào?

## 6. Concurrency, JMM, lock và Virtual Threads

### JAVA-032 [Middle] Phân biệt atomicity, visibility và ordering trong Java Memory Model; `volatile` đảm bảo gì và không đảm bảo gì?

### JAVA-033 [Senior] Quan hệ happens-before được tạo bởi monitor, volatile, thread start/join và concurrent collection như thế nào; tại sao nó quan trọng hơn “thường chạy đúng”?

### JAVA-034 [Senior] Double-checked locking singleton sai thế nào nếu field không `volatile`; safe publication ngăn thấy object được khởi tạo một phần ra sao?

### JAVA-035 [Middle] So sánh `synchronized`, `ReentrantLock`, `ReadWriteLock` và `StampedLock`; interruptibility, fairness và optimistic read ảnh hưởng lựa chọn thế nào?

### JAVA-036 [Senior] Deadlock, livelock và starvation khác nhau ra sao; hãy nêu cách phát hiện bằng thread dump và cách thiết kế lock ordering/timeouts để phòng tránh.

### JAVA-037 [Middle] `wait/notify/notifyAll` phải dùng trong vòng lặp kiểm tra condition vì sao; lost notification và spurious wakeup là gì?

### JAVA-038 [Senior] `AtomicInteger`, `LongAdder` và synchronized counter khác nhau dưới contention; vì sao `LongAdder.sum()` không phải atomic snapshot?

### JAVA-039 [Senior] Giải thích ABA problem và compare-and-set; stamped/versioned reference hoặc thiết kế immutable state giải quyết thế nào?

### JAVA-040 [Middle] Thiết kế `ExecutorService`: chọn pool size, queue, rejection policy và shutdown protocol cho CPU-bound so với I/O-bound như thế nào?

### JAVA-041 [Senior] `CompletableFuture` xử lý composition, exception và cancellation ra sao; lỗi nào phát sinh khi gọi `join()`/blocking trong cùng executor?

### JAVA-042 [Senior] Structured concurrency cải thiện lifetime, cancellation và error propagation của các subtask so với future rời rạc như thế nào?

### JAVA-043 [Senior] Virtual thread phù hợp workload nào; pinning, `ThreadLocal`, connection pool và giới hạn tài nguyên downstream thay đổi thiết kế ra sao?

### JAVA-044 [Senior] Hãy điều tra scenario throughput tụt khi tăng số thread: dùng Little’s Law, contention, context switch, queueing và backpressure để tìm nguyên nhân thế nào?

## 7. Records, sealed types và pattern matching

### JAVA-045 [Middle] Record tự sinh những gì, có thật sự immutable sâu không, và compact constructor nên dùng để chuẩn hóa/validate invariant thế nào?

### JAVA-046 [Senior] Sealed class/interface cùng exhaustive pattern matching giúp mô hình hóa domain algebraic ra sao; rủi ro tương thích khi thêm subtype mới là gì?

### JAVA-047 [Middle] Pattern matching cho `instanceof`/`switch` cải thiện flow scoping và exhaustiveness thế nào; cần xử lý `null` ra sao?

### JAVA-048 [Senior] Khi nào nên dùng record thay DTO/entity/class truyền thống; tác động đến serialization framework, JPA proxy và binary compatibility là gì?

## 8. I/O, NIO và serialization

### JAVA-049 [Middle] Phân biệt byte stream, character stream, charset và buffering; bug mojibake hoặc cắt đôi multibyte character xuất hiện thế nào?

### JAVA-050 [Senior] Blocking I/O, NIO selector và asynchronous I/O khác nhau về execution model/backpressure; chọn mô hình nào cho nhiều connection nhưng ít dữ liệu?

### JAVA-051 [Middle] `Path`/`Files` nên được dùng an toàn thế nào để tránh resource leak, TOCTOU và path traversal khi xử lý file do người dùng chỉ định?

### JAVA-052 [Senior] Vì sao Java native serialization thường không phù hợp cho dữ liệu không tin cậy hoặc lưu dài hạn; so sánh serialization proxy với JSON/Protobuf và versioning.

## 9. Testing, profiling và hiệu năng

### JAVA-053 [Middle] Unit test tốt khác integration test thế nào; test behavior thay vì implementation giúp giảm brittle test ra sao?

### JAVA-054 [Senior] Test code concurrent cần tránh phụ thuộc `sleep()` thế nào; sử dụng barrier/latch, repeated test và invariant để bắt race condition ra sao?

### JAVA-055 [Senior] Vì sao microbenchmark Java phải dùng JMH; warmup, dead-code elimination, constant folding, fork và Blackhole tác động kết quả thế nào?

### JAVA-056 [Middle] Phân biệt latency percentile, throughput và allocation rate; vì sao average latency có thể che giấu sự cố production?

### JAVA-057 [Senior] Hãy code review việc “tối ưu” bằng object pool/string intern/cache tự viết: GC, memory retention, contention và complexity có thể làm hệ thống tệ hơn thế nào?

### JAVA-058 [Senior] Quy trình điều tra CPU cao hoặc latency tăng trong ứng dụng Java nên kết hợp profiler, JFR, flame graph, metric và load test ra sao để tránh tối ưu theo phỏng đoán?

## 10. Câu hỏi kinh điển bổ sung — Basic đến Senior

### JAVA-059 [Basic · ⭐ Rất thường gặp] Interface và abstract class khác nhau thế nào về state, constructor, multiple inheritance và khả năng tiến hóa API; khi nào chọn mỗi loại?

### JAVA-060 [Basic · ⭐ Rất thường gặp] Vì sao `String` immutable, String Pool hoạt động ra sao, và `new String("abc")` khác literal `"abc"` ở identity/bộ nhớ thế nào?

### JAVA-061 [Basic · ⭐ Rất thường gặp] So sánh nối chuỗi bằng `+`, `StringBuilder` và `StringBuffer`; compiler tối ưu được trường hợp nào và lựa chọn nào phù hợp trong loop hoặc concurrent code?

### JAVA-062 [Basic · ⭐ Rất thường gặp] `List`, `Set` và `Map` biểu diễn cardinality/lookup khác nhau thế nào; ordering, duplicate và `null` có phải guarantee chung cho mọi implementation không?

### JAVA-063 [Basic · ⭐ Rất thường gặp] Phân biệt `final`, `finally` và `finalize()`; vì sao không nên dùng finalization để giải phóng tài nguyên?

### JAVA-064 [Basic · ⭐ Rất thường gặp] `throw` và `throws` khác nhau thế nào; exception được propagate dọc call stack cho đến khi được xử lý ra sao?

### JAVA-065 [Basic · ⭐ Rất thường gặp] Gọi `Thread.start()` khác gọi trực tiếp `run()` thế nào; một `Thread` instance có thể được start lại sau khi kết thúc không?

### JAVA-066 [Middle · ⭐ Rất thường gặp] Vì sao thường ưu tiên composition hơn inheritance trong Java; dấu hiệu nào cho thấy inheritance vẫn là quan hệ subtype đúng theo Liskov?

### JAVA-067 [Middle · ⭐ Rất thường gặp] Vì sao `ArrayDeque` thường được ưu tiên hơn `Stack` hoặc `LinkedList` khi cài stack/queue; các giới hạn về `null`, thread safety và capacity là gì?

### JAVA-068 [Middle · Thường gặp] Vì sao không thể tạo trực tiếp `new T[]` hoặc `new List<String>[n]`; reification của array và erasure của generic xung đột thế nào?

### JAVA-069 [Middle · ⭐ Rất thường gặp] `return` hoặc `throw` trong `finally` ảnh hưởng control flow và exception gốc thế nào; quy tắc nào giúp tránh che giấu lỗi?

### JAVA-070 [Middle · Thường gặp] `Files.lines()`/`Files.walk()` trả stream lazy có ownership tài nguyên thế nào; xử lý file rất lớn ra sao để không leak handle hoặc giữ toàn bộ dữ liệu trong RAM?

### JAVA-071 [Middle · ⭐ Rất thường gặp] `synchronized` instance method, static method và block khóa trên những monitor nào; hai method synchronized có luôn chặn nhau không?

### JAVA-072 [Middle · ⭐ Rất thường gặp] So sánh `Runnable`, `Callable<T>` và `Future<T>` về kết quả, exception và cancellation; khi nào không nên tạo `Thread` thủ công?

### JAVA-073 [Middle · Thường gặp] Phân biệt `Instant`, `LocalDate`, `LocalDateTime`, `OffsetDateTime` và `ZonedDateTime`; loại nào nên dùng để lưu timestamp và xử lý business time theo múi giờ?

### JAVA-074 [Senior · Thường gặp] Equality trong hierarchy có thể phá symmetry/transitivity thế nào khi dùng `instanceof` hoặc `getClass()`; composition, sealed hierarchy hay `canEqual` giải quyết trade-off ra sao?

### JAVA-075 [Senior · Thường gặp] Sau type erasure, API JSON/DI làm sao giữ thông tin `List<Order>` tại runtime bằng `Class<T>`, type token hoặc super-type token; mỗi cách có giới hạn gì?

### JAVA-076 [Senior · ⭐ Rất thường gặp] Thiết kế producer–consumer bằng bounded `BlockingQueue` thế nào để có backpressure, nhiều producer/consumer và shutdown không mất hoặc treo task?

### JAVA-077 [Senior · ⭐ Rất thường gặp] `ThreadLocal` gây leak hoặc truyền nhầm context trong thread pool thế nào; `remove()`, explicit context và scoped value thay đổi thiết kế ra sao?

### JAVA-078 [Senior · Thường gặp] Default method giúp tiến hóa interface nhưng tạo conflict nào khi nhiều interface hoặc superclass cùng định nghĩa method; Java phân giải và bảo vệ binary compatibility ra sao?
