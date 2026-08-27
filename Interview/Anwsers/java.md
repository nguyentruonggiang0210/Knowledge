# Đáp án — Java Middle & Senior

> Đáp án là khung đánh giá, không phải câu học thuộc. Ứng viên tốt cần nối được contract của Java với ví dụ, failure mode và cách kiểm chứng.

## 1. Ngôn ngữ, hệ kiểu và Generics

### JAVA-001 [Middle] Java luôn truyền tham trị (pass-by-value) nghĩa là gì khi tham số là object, và vì sao một method có thể đổi trạng thái object nhưng không thể đổi object mà biến của caller đang trỏ tới?

**Kết luận:** Java copy giá trị của đối số vào parameter. Với object, giá trị được copy là reference; hai reference ban đầu cùng trỏ một object, nhưng bản thân hai biến độc lập.

**Lập luận:** `p.setName()` đi qua reference đã copy và mutate cùng object nên caller quan sát được. `p = new Person()` chỉ gán lại parameter cục bộ, không thay reference trong caller. Muốn thay “slot” của caller phải return object mới hoặc mutate một holder được chia sẻ.

**Pitfall/trade-off:** Gọi cơ chế này là “pass-by-reference” dẫn tới API khó hiểu và nhầm rằng method có thể rebind biến caller. Mutation còn làm aliasing khó kiểm soát.

**Mức kỳ vọng:** **Middle:** giải thích được hai phép gán trên. **Senior:** liên hệ aliasing, immutability và thiết kế API trả giá trị mới.

### JAVA-002 [Middle] Phân biệt `==`, `equals()` và `hashCode()`; contract nào phải được giữ khi object được dùng làm key của `HashMap`?

**Kết luận:** Với reference, `==` so identity; `equals()` định nghĩa logical equality; các object equal bắt buộc có cùng `hashCode()`.

**Lập luận:** `HashMap` chọn bucket bằng hash rồi mới so key bằng equality. `equals()` cần reflexive, symmetric, transitive, consistent và false với `null`; hash phải ổn định khi các field tham gia equality không đổi.

**Pitfall/trade-off:** Override `equals()` mà quên `hashCode()` làm lookup thất bại. Mutate field tham gia hash sau khi `put` khiến key nằm sai bucket. Hash giống nhau không có nghĩa equal.

**Mức kỳ vọng:** **Middle:** nêu đúng contract và mutable-key bug. **Senior:** thiết kế value object/key immutable, phân tích inheritance và equality symmetry.

### JAVA-003 [Senior] Hãy code review một value object tiền tệ có `BigDecimal`: vì sao `equals()` có thể cho kết quả khác `compareTo()`, và bạn sẽ chuẩn hóa equality thế nào?

**Kết luận:** `new BigDecimal("1.0").equals(new BigDecimal("1.00"))` là false vì `equals` xét cả value và scale; `compareTo` trả 0 vì so giá trị số.

**Lập luận:** Value object phải chọn rõ invariant: hoặc scale cố định theo currency và chuẩn hóa bằng `setScale(..., roundingMode)`, hoặc canonicalize bằng `stripTrailingZeros()` rồi dùng representation đó nhất quán trong constructor, equality và hash. Amount còn phải gắn currency.

```java
record Money(BigDecimal amount, Currency currency) {
  Money { amount = amount.setScale(currency.getDefaultFractionDigits(), RoundingMode.UNNECESSARY); }
}
```

**Pitfall/trade-off:** `stripTrailingZeros()` có thể tạo scale âm; rounding ngầm làm sai tiền. Comparator không nhất quán với equals khiến `TreeSet` và `HashSet` nhìn “trùng” khác nhau.

**Mức kỳ vọng:** **Middle:** biết khác biệt scale. **Senior:** xác lập canonical form/domain rounding và test equality/hash/order nhất quán.

### JAVA-004 [Middle] Overloading, overriding, static method hiding và dynamic dispatch khác nhau thế nào; compiler/runtime chọn method ở thời điểm nào?

**Kết luận:** Overload được compiler chọn theo kiểu tĩnh và conversion; instance override được JVM dispatch theo class thực của receiver; static method bị hide và chọn theo kiểu tĩnh.

**Lập luận:** Signature overload khác parameter list. Override giữ signature tương thích, return có thể covariant và access không được hẹp hơn. Field và static method không polymorphic như instance method.

**Pitfall/trade-off:** Overload với `null`, boxing/varargs hoặc hierarchy gần nhau có thể ambiguous/bất ngờ. Gọi static qua instance làm người đọc tưởng dynamic dispatch. Quên `@Override` dễ tạo overload ngoài ý muốn.

**Mức kỳ vọng:** **Middle:** dự đoán đúng method được gọi. **Senior:** giải thích bytecode call site, bridge/covariant return và tránh API overload mơ hồ.

### JAVA-005 [Senior] Type erasure của Java Generics tạo ra bridge method, raw type và heap pollution như thế nào; khi nào `@SafeVarargs` thực sự an toàn?

**Kết luận:** Type argument chủ yếu bị erase; compiler chèn cast và có thể sinh bridge method để giữ polymorphism. Heap pollution xảy ra khi biến generic trỏ dữ liệu sai parameterized type.

**Lập luận:** Raw type và generic varargs là đường thoát khỏi kiểm tra compile time. Varargs là array reified, còn `T` erased, nên lưu/đưa array ra ngoài có thể tạo `ClassCastException` xa nguồn lỗi. `@SafeVarargs` chỉ đúng khi method không ghi phần tử không an toàn và không expose/forward array tới code không tin cậy.

**Pitfall/trade-off:** Annotation chỉ tắt warning, không tạo safety. Cast unchecked nên được cô lập ở adapter nhỏ và được chứng minh invariant.

**Mức kỳ vọng:** **Middle:** hiểu erasure/raw warning. **Senior:** đọc bridge method, chứng minh varargs safety và thiết kế API tránh heap pollution.

### JAVA-006 [Middle] Giải thích quy tắc PECS (`Producer Extends, Consumer Super`) và thiết kế chữ ký copy phần tử giữa hai collection sao cho type-safe.

**Kết luận:** Nguồn chỉ sản xuất `T` dùng `? extends T`; đích nhận `T` dùng `? super T`.

```java
static <T> void copyInto(Collection<? extends T> src,
                         Collection<? super T> dst) {
  dst.addAll(src);
}
```

**Lập luận:** Từ producer có thể đọc an toàn dưới dạng `T` nhưng không thể thêm một `T` tùy ý; vào consumer có thể thêm `T`, còn đọc ra chỉ chắc là `Object`.

**Pitfall/trade-off:** Wildcard không phải lúc nào cũng tốt: nếu type xuất hiện nhiều vị trí và cần ràng buộc quan hệ, named type parameter rõ hơn. `?` không đồng nghĩa `Object`.

**Mức kỳ vọng:** **Middle:** viết đúng signature và thao tác hợp lệ. **Senior:** cân bằng variance với usability/type inference của public API.

### JAVA-007 [Senior] Vì sao `List<String>` không phải subtype của `List<Object>`, trong khi array lại covariant; sự khác biệt này chuyển lỗi từ compile time sang runtime ra sao?

**Kết luận:** Generic invariant ngăn thêm `Integer` vào list thực chất chứa `String` ngay ở compile time. Array covariant và reified nên cho phép assignment nhưng kiểm tra store ở runtime.

**Lập luận:** `Object[] a = new String[1]` hợp lệ, nhưng `a[0] = 1` ném `ArrayStoreException`. Nếu `List<String>` gán được cho `List<Object>`, type erasure không thể bảo vệ invariant tương tự.

**Pitfall/trade-off:** Covariant array tiện cho API cũ nhưng kém type-safe; generic array creation bị cấm phần lớn vì reification và erasure xung đột.

**Mức kỳ vọng:** **Middle:** nêu ví dụ `ArrayStoreException`. **Senior:** nối variance, reification, wildcard và thiết kế collection API.

### JAVA-008 [Senior] Phân biệt bounded type parameter, wildcard bound và recursive bound như `<T extends Comparable<? super T>>`; mỗi dạng phù hợp cho API nào?

**Kết luận:** Named type parameter biểu diễn quan hệ cần tái sử dụng; wildcard tăng variance cho một vị trí; recursive bound mô tả khả năng của chính type.

**Lập luận:** `<T extends Number>` cho implementation gọi API của `Number`; `List<? extends Number>` nhận nhiều loại list nhưng không giữ type cụ thể; `<T extends Comparable<? super T>>` chấp nhận type so sánh với chính nó hoặc supertype, phù hợp `max/sort`.

**Pitfall/trade-off:** Quá nhiều type parameter làm API khó gọi và lỗi compiler khó đọc. Bound `Comparable<T>` đôi khi quá chặt cho subtype kế thừa comparator của parent.

**Mức kỳ vọng:** **Middle:** phân biệt bound và wildcard. **Senior:** giải thích `? super T` trong recursive bound và tối giản generic surface.

### JAVA-009 [Middle] Boxing/unboxing, integer cache và numeric promotion có thể gây bug gì với `Integer`, toán tử `==`, nullable wrapper và overload resolution?

**Kết luận:** Wrapper là object; `==` có thể so identity. Cache khiến một số giá trị nhỏ trông như so value thành công; unbox `null` ném `NullPointerException`.

**Lập luận:** Numeric promotion có thể unbox rồi widen; overload chọn theo quy tắc ưu tiên widening/boxing/varargs chứ không theo “ý định”. Dùng `Objects.equals(a,b)` hoặc primitive khi nullable không cần thiết.

**Pitfall/trade-off:** Không dựa vào phạm vi cache như một contract business. Boxing trong loop/collection tăng allocation; overload đồng thời `int`, `Integer`, `long` dễ gây bất ngờ.

**Mức kỳ vọng:** **Middle:** tìm được `==` và nullable-unbox bug. **Senior:** phân tích overload resolution/allocation trên hot path.

### JAVA-010 [Senior] Hãy thiết kế API biểu diễn “không có kết quả”: so sánh `null`, `Optional`, empty collection và exception; vì sao không nên lạm dụng `Optional` trong field/parameter?

**Kết luận:** Return `Optional<T>` cho kết quả đơn có thể vắng; return collection rỗng cho tập kết quả; exception cho failure, không cho absence bình thường.

**Lập luận:** `Optional` làm caller xử lý absence rõ ràng ở return boundary. Parameter thường rõ hơn bằng overload/type riêng; field `Optional` tăng object graph, có thể vướng framework/serialization và tạo ba trạng thái nếu chính field là `null`.

**Pitfall/trade-off:** `Optional.get()` hoặc `orElse(expensive())` phá lợi ích (`orElseGet` mới lazy). Empty list không phân biệt “chưa tải” với “đã tải nhưng rỗng” nếu domain cần khác biệt.

**Mức kỳ vọng:** **Middle:** chọn đúng theo cardinality/failure. **Senior:** mô hình hóa absence ở domain boundary và giữ API/serialization ổn định.

## 2. Collections và cấu trúc dữ liệu chuẩn

### JAVA-011 [Middle] So sánh `ArrayList` và `LinkedList` theo layout bộ nhớ, locality, độ phức tạp và workload thực tế; vì sao Big-O đơn thuần dễ dẫn tới lựa chọn sai?

**Kết luận:** `ArrayList` thường thắng nhờ vùng nhớ liên tục, ít object và CPU cache locality; `LinkedList` chỉ có lợi trong một số thao tác chèn/xóa khi đã có iterator/node position.

**Lập luận:** Truy cập index của linked list là O(n); mỗi node mang hai reference và allocation. Array resize là O(n) không thường xuyên nên append amortized O(1), duyệt rất nhanh.

**Pitfall/trade-off:** Nói “linked list chèn O(1)” bỏ qua chi phí tìm vị trí. Queue/deque thường nên dùng `ArrayDeque`, không phải `LinkedList`.

**Mức kỳ vọng:** **Middle:** so được complexity. **Senior:** xét locality, GC, benchmark theo workload và memory footprint.

### JAVA-012 [Senior] Mô tả cơ chế bucket, resize, treeification và collision của `HashMap`; mutable key hoặc `hashCode()` kém gây failure mode nào?

**Kết luận:** `HashMap` trải hash vào bucket của table; collision nằm trong chain và có thể tree hóa khi đủ dài/capacity đủ lớn. Resize phân bố lại entry khi vượt load threshold.

**Lập luận:** Hash đều cho lookup kỳ vọng O(1); collision nặng làm tăng comparison. Trong triển khai Java phổ biến, treeification chỉ xảy ra quanh threshold 8 khi table ít nhất 64, nếu nhỏ hơn thường resize trước; đây là implementation detail, không nên làm contract.

**Pitfall/trade-off:** Mutable key mất lookup; hash hằng biến map thành hotspot. `HashMap` không thread-safe; concurrent resize/mutation không có guarantee.

**Mức kỳ vọng:** **Middle:** hiểu bucket/load factor. **Senior:** giải thích collision attack, treeification và thiết kế hash/equality ổn định.

### JAVA-013 [Middle] `HashMap`, `LinkedHashMap`, `TreeMap` và `ConcurrentHashMap` khác nhau về ordering, null, complexity và concurrency guarantee ra sao?

**Kết luận:** `HashMap` không đảm bảo order; `LinkedHashMap` giữ insertion/access order; `TreeMap` sắp theo comparator; `ConcurrentHashMap` hỗ trợ truy cập concurrent và không cho null key/value.

**Lập luận:** Hash map kỳ vọng O(1), tree map O(log n). Linked map thêm linked structure. Concurrent map cho atomic compound methods và iterator weakly consistent, không khóa toàn map cho read thông thường.

**Pitfall/trade-off:** Thứ tự quan sát hiện tại của `HashMap` không phải contract. `containsKey` rồi `put` không atomic; dùng `putIfAbsent/compute`.

**Mức kỳ vọng:** **Middle:** chọn đúng collection cơ bản. **Senior:** diễn giải consistency/atomicity của compound operation và comparator contract.

### JAVA-014 [Senior] `ConcurrentHashMap.computeIfAbsent()` có những ràng buộc gì với mapping function; vì sao blocking I/O, recursion hoặc side effect trong function này nguy hiểm?

**Kết luận:** Mapping function phải ngắn, không null nếu muốn insert, và lý tưởng là thuần/idempotent; không được recursively update cùng key/map theo cách phá invariant.

**Lập luận:** Việc tính có thể giữ cơ chế đồng bộ nội bộ quanh bucket; blocking I/O kéo contention và tail latency. Exception để map unchanged; recursion có thể bị phát hiện hoặc deadlock/livelock tùy đường cập nhật.

**Pitfall/trade-off:** Dùng nó làm cache loader không tự có timeout, eviction hay chống stampede trên nhiều process. Side effect có thể xảy ra lại nếu retry ở tầng ngoài.

**Mức kỳ vọng:** **Middle:** dùng atomic initialization đúng. **Senior:** giữ critical section ngắn và chọn cache library/async loading cho I/O.

### JAVA-015 [Middle] Fail-fast iterator là gì, khác snapshot/weakly-consistent iterator thế nào, và vì sao `ConcurrentModificationException` không phải cơ chế đồng bộ?

**Kết luận:** Fail-fast iterator best-effort phát hiện structural modification ngoài iterator; snapshot duyệt bản chụp; weakly-consistent có thể thấy một phần thay đổi mà không fail.

**Lập luận:** `modCount` không tạo happens-before và không bảo đảm phát hiện mọi race. `CopyOnWriteArrayList` iterator là snapshot; concurrent collections thường weakly consistent.

**Pitfall/trade-off:** Catch `ConcurrentModificationException` rồi retry không làm code thread-safe. Snapshot có chi phí copy/write lớn; weak consistency không phù hợp nếu cần snapshot atomic.

**Mức kỳ vọng:** **Middle:** biết dùng `Iterator.remove`. **Senior:** chọn consistency model theo invariant và thiết kế synchronization rõ ràng.

### JAVA-016 [Senior] Khi nào chọn immutable collection, unmodifiable view hay defensive copy; `Collections.unmodifiableList()` có đảm bảo dữ liệu không đổi không?

**Kết luận:** Unmodifiable view chỉ chặn mutation qua view; backing list vẫn đổi được. Immutable snapshot/copy tách structural state tại thời điểm tạo.

**Lập luận:** `List.copyOf(input)` phù hợp boundary và có thể từ chối null; defensive copy cả ở input lẫn output ngăn alias. Tất cả thường chỉ shallow: phần tử mutable vẫn đổi.

**Pitfall/trade-off:** Copy tốn memory/time; view phản ánh thay đổi chủ đích đôi khi hữu ích nhưng phải document. “Immutable collection” không làm object bên trong immutable.

**Mức kỳ vọng:** **Middle:** phân biệt view và copy. **Senior:** xác định ownership, deep/shallow invariant và tối ưu copy có đo lường.

### JAVA-017 [Middle] `Comparable` và `Comparator` phải giữ contract nào; comparator không nhất quán với `equals()` ảnh hưởng `TreeSet`/`TreeMap` thế nào?

**Kết luận:** Ordering cần antisymmetry về dấu, transitivity và consistency; nên nhất quán với equals nếu collection sorted được dùng như set/map logical.

**Lập luận:** `TreeSet/TreeMap` xem `compare(a,b)==0` là cùng key, dù `equals` false. Comparable là natural order trong type; Comparator là strategy bên ngoài và compose được.

**Pitfall/trade-off:** Comparator dùng phép trừ có thể overflow; field mutable làm hỏng tree ordering. Null handling phải explicit.

**Mức kỳ vọng:** **Middle:** xây comparator bằng `comparing/thenComparing`. **Senior:** kiểm tra total order, locale/collation và consistency với domain identity.

### JAVA-018 [Senior] Hãy chọn cấu trúc dữ liệu cho cache LRU có concurrency: phân tích `LinkedHashMap`, synchronized wrapper, lock phân đoạn và thư viện cache chuyên dụng.

**Kết luận:** `LinkedHashMap(accessOrder=true)` đủ cho cache nhỏ dưới một lock; production concurrent cache thường nên dùng thư viện như Caffeine thay vì tự dựng LRU tuyệt đối.

**Lập luận:** Access-order làm cả `get` trở thành mutation, nên read cũng cần lock. Một global lock đơn giản/correct nhưng bottleneck; segmentation giảm contention nhưng eviction chỉ xấp xỉ toàn cục. Thư viện có eviction, expiry, async loading, metric và chống stampede tốt hơn.

**Pitfall/trade-off:** LRU tuyệt đối tốn coordination và không luôn cho hit rate tốt. Cache cần capacity theo weight, lifecycle, failure policy và boundedness; map concurrent đơn thuần không eviction.

**Mức kỳ vọng:** **Middle:** cài được bounded single-lock cache đúng. **Senior:** chọn policy theo workload, đánh giá hit rate/contention và buy-vs-build.

## 3. Stream, Lambda và lập trình hàm

### JAVA-019 [Middle] Stream pipeline được đánh giá lazy như thế nào; intermediate operation, terminal operation và short-circuiting ảnh hưởng execution ra sao?

**Kết luận:** Intermediate operation chỉ mô tả pipeline; terminal operation mới kéo dữ liệu. Pipeline thường fuse từng phần tử qua các stage thay vì tạo collection trung gian.

**Lập luận:** `filter/map` lazy; `collect/count` terminal. `findFirst/anyMatch/limit` có thể dừng sớm, nhưng stateful operation như sorted có thể cần buffer toàn bộ.

**Pitfall/trade-off:** Stream chỉ dùng một lần; quên terminal thì không có side effect. `peek` không đảm bảo chạy cho mọi phần tử vì optimization/short-circuit.

**Mức kỳ vọng:** **Middle:** dự đoán execution order. **Senior:** phân tích stateful stage, encounter order và memory của pipeline.

### JAVA-020 [Senior] Điều kiện associativity, identity và statelessness nào cần giữ để `reduce()`/`collect()` cho kết quả đúng trên parallel stream?

**Kết luận:** Accumulator/combiner phải associative, identity phải trung lập và tương thích; behavioral function không can thiệp source và thường phải stateless.

**Lập luận:** Parallel execution chia/ghép theo grouping không xác định. Phép trừ hoặc mutable identity dùng chung sẽ cho kết quả khác sequential. Collector cần supplier tạo container độc lập, accumulator và combiner ghép đúng invariant; `CONCURRENT` chỉ khai khi accumulator thực sự thread-safe.

**Pitfall/trade-off:** Floating-point addition không hoàn toàn associative. Dùng `reduce(new ArrayList<>(), mutate...)` sai; dùng `collect` cho mutable reduction.

**Mức kỳ vọng:** **Middle:** nhận ra side effect/shared list. **Senior:** chứng minh algebraic law và viết custom collector đúng characteristics.

### JAVA-021 [Middle] Phân biệt `map()` và `flatMap()`; hãy xử lý `List<Optional<T>>` hoặc cấu trúc lồng nhau mà không tạo stream lồng khó đọc.

**Kết luận:** `map` biến một phần tử thành một giá trị; `flatMap` biến thành stream/container rồi làm phẳng một cấp.

```java
List<T> values = optionals.stream()
    .flatMap(Optional::stream)
    .toList();
```

**Lập luận:** Với `List<List<T>>`, dùng `flatMap(Collection::stream)`. Nó diễn đạt cardinality 0..n và tránh `Stream<Stream<T>>`.

**Pitfall/trade-off:** Chuỗi flatMap quá sâu có thể che domain structure; loop hoặc helper có tên đôi khi rõ hơn. Không dùng stream để che exception/side effect phức tạp.

**Mức kỳ vọng:** **Middle:** chọn đúng operation. **Senior:** giữ pipeline readable và hiểu monadic composition/absence mà không lạm dụng thuật ngữ.

### JAVA-022 [Senior] Vì sao side effect trong `peek()`, `map()` hoặc `forEach()` làm pipeline khó đúng, đặc biệt khi parallel/unordered; cách viết lại là gì?

**Kết luận:** Behavioral function nên thuần; side effect có thể chạy khác thứ tự, đồng thời, ít lần hơn do short-circuit hoặc không chạy nếu thiếu terminal.

**Lập luận:** Dùng `map` để tạo giá trị và `collect` để reduction có contract. Logging/debug bằng `peek` có thể chấp nhận tạm thời, nhưng business mutation nên tách thành vòng lặp/explicit effect stage.

**Pitfall/trade-off:** `forEachOrdered` giữ encounter order nhưng có thể mất parallelism, không tự làm state ngoài thread-safe. Synchronized side effect có thể biến parallel stream thành chậm hơn sequential.

**Mức kỳ vọng:** **Middle:** phát hiện shared mutable collection. **Senior:** refactor theo immutable transformation và giải thích execution semantics.

### JAVA-023 [Senior] Khi nào parallel stream tăng tốc và khi nào làm chậm hoặc gây starvation; vai trò của spliterator, kích thước dữ liệu và common `ForkJoinPool` là gì?

**Kết luận:** Có lợi khi dữ liệu đủ lớn, dễ chia, computation CPU-bound đáng kể và reduction associative; có hại với tập nhỏ, split kém, blocking I/O hoặc shared contention.

**Lập luận:** Spliterator quyết định partition/size/order. Mặc định nhiều pipeline dùng common pool dùng chung process; blocking task có thể chiếm worker và ảnh hưởng code không liên quan. Overhead fork/merge phải nhỏ hơn công việc.

**Pitfall/trade-off:** Gọi `.parallel()` không phải tuning plan. Benchmark với workload/cores thật; cân nhắc executor rõ ràng hoặc structured tasks cho I/O.

**Mức kỳ vọng:** **Middle:** nêu CPU-bound và overhead. **Senior:** đánh giá splittability, pool interference, NUMA/cache và đo speedup/Amdahl.

### JAVA-024 [Middle] Hãy code review pipeline gom dữ liệu bằng `Collectors.toMap()`: duplicate key, null, ordering và merge function cần được xử lý thế nào?

**Kết luận:** Phải định nghĩa duplicate policy; mặc định duplicate key ném exception. Chọn supplier nếu cần order/map type và tránh null không có contract phù hợp.

```java
Map<String, User> byEmail = users.stream().collect(Collectors.toMap(
    User::normalizedEmail,
    Function.identity(),
    (oldValue, newValue) -> newer(oldValue, newValue),
    LinkedHashMap::new));
```

**Lập luận:** Merge function phải deterministic/associative nếu parallel. Ordering chỉ có khi map implementation và collector behavior hỗ trợ.

**Pitfall/trade-off:** “Giữ cái đầu” có thể che duplicate dữ liệu. Null key/value khác nhau theo map/collector implementation; nên validate trước thay vì dựa vào chi tiết.

**Mức kỳ vọng:** **Middle:** xử lý duplicate rõ ràng. **Senior:** gắn policy với domain, parallel determinism và memory/cardinality.

## 4. Exception và thiết kế lỗi

### JAVA-025 [Middle] Checked exception và unchecked exception khác nhau về contract API ra sao; khi nào nên wrap và phải giữ nguyên cause thế nào?

**Kết luận:** Checked buộc caller acknowledge tại compile time; unchecked phù hợp programming error hoặc lỗi không thể xử lý hữu ích tại boundary hiện tại. Wrap khi đổi abstraction nhưng luôn giữ cause.

```java
throw new CustomerRepositoryException("Cannot load customer " + id, e);
```

**Lập luận:** Exception type/message nên thêm context không nhạy cảm. Một tầng chỉ catch nếu có thể recover, translate hoặc cleanup; nếu không, để propagate.

**Pitfall/trade-off:** Checked quá dày gây catch/wrap máy móc; unchecked không có nghĩa bỏ document. Wrap lặp nhiều tầng tạo noise, mất SQL state/retry metadata nếu model nghèo.

**Mức kỳ vọng:** **Middle:** không nuốt cause. **Senior:** thiết kế taxonomy ổn định theo recoverability và observability.

### JAVA-026 [Senior] Thiết kế error model cho service nhiều tầng thế nào để không leak chi tiết hạ tầng nhưng vẫn giữ khả năng retry, quan sát và truy vết nguyên nhân?

**Kết luận:** Tách error public/domain khỏi exception hạ tầng; translate tại boundary sở hữu abstraction, giữ cause nội bộ và gắn stable error code/correlation ID.

**Lập luận:** Phân loại validation, conflict, not-found, unauthorized, transient dependency và permanent internal. Retryability phải là metadata/policy có giới hạn, không suy từ chuỗi message. Log một lần ở boundary với trace và structured context.

**Pitfall/trade-off:** Trả stack trace/SQL ra client leak dữ liệu; map mọi lỗi thành 500 mất semantics. Retry lỗi non-idempotent hoặc retry nhiều tầng gây amplification.

**Mức kỳ vọng:** **Middle:** mapping exception sang response đúng. **Senior:** thống nhất taxonomy, SLO/telemetry, retry budget và backward-compatible error contract.

### JAVA-027 [Middle] `try-with-resources` đóng tài nguyên theo thứ tự nào; suppressed exception là gì và vì sao có thể che giấu lỗi cleanup?

**Kết luận:** Resource đóng theo thứ tự ngược khai báo. Nếu body ném lỗi rồi `close()` cũng ném, lỗi body là primary và lỗi close nằm trong `getSuppressed()`.

**Lập luận:** Compiler sinh logic tương đương finally nhưng giữ cả hai failure. Nếu body thành công và close lỗi, close exception được propagate.

**Pitfall/trade-off:** Logging chỉ message/cause mà bỏ suppressed làm mất tín hiệu cleanup. Resource khai báo ngoài phải effectively final và ownership cần rõ để không đóng nhầm resource dùng chung.

**Mức kỳ vọng:** **Middle:** dùng đúng `AutoCloseable`. **Senior:** giữ suppressed qua translation và thiết kế close/idempotent ownership.

### JAVA-028 [Senior] Hãy code review catch block `catch (Exception e) { return null; }`: nó phá vỡ correctness/observability ra sao và nên thay bằng chiến lược nào?

**Kết luận:** Nó biến mọi failure thành absence mơ hồ, mất stack/cause, khiến lỗi xuất hiện xa nguồn dưới dạng NPE hoặc dữ liệu sai.

**Lập luận:** Chỉ catch type dự kiến. Recover có policy rõ, translate với cause, hoặc propagate. Nếu absence là kết quả hợp lệ thì chỉ convert exception cụ thể tương ứng; metric/log tại ownership boundary.

**Pitfall/trade-off:** Catch `Exception` còn có thể nuốt interruption; nếu bắt `InterruptedException`, thường restore flag bằng `Thread.currentThread().interrupt()` rồi propagate/cancel. Logging rồi throw ở mọi tầng gây duplicate.

**Mức kỳ vọng:** **Middle:** thay null bằng exception/result rõ. **Senior:** bảo toàn cancellation, error taxonomy và tránh log amplification.

## 5. Immutability và mô hình domain

### JAVA-029 [Middle] Một class immutable đúng nghĩa cần những điều kiện nào khi chứa `Date`, collection hoặc object mutable; defensive copy đặt ở đâu?

**Kết luận:** State không đổi sau construction, không expose reference mutable, invariant hoàn tất trong constructor và object được publication an toàn.

**Lập luận:** Field thường `private final`; copy mutable input khi nhận và copy/immutable view khi trả. `Date` có thể copy theo epoch; collection dùng `List.copyOf`, nhưng phần tử cũng phải immutable hoặc deep-copy theo ownership.

**Pitfall/trade-off:** `final` reference không làm object được trỏ tới immutable. Subclass có thể phá invariant, nên class final/sealed hoặc constructor kiểm soát.

**Mức kỳ vọng:** **Middle:** làm defensive copy hai chiều. **Senior:** định nghĩa deep/shallow ownership, serialization invariant và safe publication.

### JAVA-030 [Senior] Immutability hỗ trợ thread safety và cache/hash key thế nào, nhưng gây trade-off gì về allocation, copy và mô hình cập nhật lớn?

**Kết luận:** Immutable object đọc chia sẻ không cần lock và hash/equality ổn định; đổi lại cập nhật tạo phiên bản mới và có thể copy graph lớn.

**Lập luận:** Final-field semantics giúp publication; snapshot dễ reasoning/rollback. Persistent data structure/structural sharing giảm copy. JVM có thể tối ưu short-lived allocation, nên không nên mặc định mutation nhanh hơn.

**Pitfall/trade-off:** Copy sâu trên aggregate lớn tăng allocation/bandwidth; giữ nhiều version gây retention. Mutable encapsulated state dưới lock đôi khi phù hợp hot counter/buffer.

**Mức kỳ vọng:** **Middle:** nêu lợi ích concurrency. **Senior:** chọn hybrid/persistent structure dựa trên profile và invariant.

### JAVA-031 [Senior] Builder có thể làm mất invariant của immutable object ra sao; bạn sẽ validate cross-field, tránh trạng thái nửa vời và biểu diễn construction failure thế nào?

**Kết luận:** Builder được phép mutable nhưng `build()` phải là cổng atomic: validate đầy đủ, canonicalize, copy input rồi mới tạo object hợp lệ duy nhất.

**Lập luận:** Required field có thể qua constructor/staged builder; cross-field rule kiểm tra tập trung trong domain constructor/factory để mọi construction path dùng chung. Failure dùng validation result cho nhiều lỗi người dùng hoặc exception cụ thể cho programmer misuse.

**Pitfall/trade-off:** Reuse builder giữa thread hoặc sau `build` dễ alias collection. Staged builder type-safe nhưng API/code sinh lớn; runtime validation đơn giản hơn.

**Mức kỳ vọng:** **Middle:** validate required fields. **Senior:** bảo vệ invariant qua serialization/framework và cân nhắc staged API/error accumulation.

## 6. Concurrency, JMM, lock và Virtual Threads

### JAVA-032 [Middle] Phân biệt atomicity, visibility và ordering trong Java Memory Model; `volatile` đảm bảo gì và không đảm bảo gì?

**Kết luận:** Atomicity là thao tác không bị xen; visibility là thread thấy write; ordering là ràng buộc thứ tự quan sát. Volatile read/write tạo visibility và ordering happens-before, nhưng không biến read-modify-write thành atomic.

**Lập luận:** `volatile int count; count++` vẫn gồm read/add/write và mất update. Dùng `AtomicInteger`, lock hoặc partition ownership. Volatile phù hợp flag/state snapshot độc lập.

**Pitfall/trade-off:** Nhiều volatile field không tạo invariant atomic giữa chúng. Visibility không đồng nghĩa collection mutable bên trong trở thành thread-safe sau publication.

**Mức kỳ vọng:** **Middle:** sửa counter race. **Senior:** mô hình hóa compound invariant và chọn immutable snapshot/lock/atomic phù hợp.

### JAVA-033 [Senior] Quan hệ happens-before được tạo bởi monitor, volatile, thread start/join và concurrent collection như thế nào; tại sao nó quan trọng hơn “thường chạy đúng”?

**Kết luận:** Happens-before là guarantee visibility/order của JMM: unlock trước lock kế tiếp cùng monitor; volatile write trước read thấy nó; thao tác trước `start` thấy bởi thread mới; completion trước `join` return.

**Lập luận:** Concurrent collection cũng quy định memory-consistency effects, ví dụ action trước đưa object vào queue/map happens-before action sau lấy/truy cập tương ứng. Nếu không có edge, data race cho phép giá trị stale/reordering dù test trên máy hiện tại pass.

**Pitfall/trade-off:** Thời gian thực hoặc `sleep` không tạo happens-before. “Atomic CPU” không đủ nếu compiler/JIT được reorder.

**Mức kỳ vọng:** **Middle:** nhận biết synchronization edge. **Senior:** vẽ publication path và chứng minh mọi shared state có edge hợp lệ.

### JAVA-034 [Senior] Double-checked locking singleton sai thế nào nếu field không `volatile`; safe publication ngăn thấy object được khởi tạo một phần ra sao?

**Kết luận:** Không volatile, publication reference có thể bị quan sát trước khi constructor writes được thấy đầy đủ. Volatile field làm write singleton happens-before read tương ứng.

```java
private static volatile Service instance;
static Service get() {
  var r = instance;
  if (r == null) synchronized (Owner.class) {
    if ((r = instance) == null) instance = r = new Service();
  }
  return r;
}
```

**Lập luận:** Safe alternatives đơn giản hơn là eager static final hoặc initialization-on-demand holder, dựa vào class initialization guarantee.

**Pitfall/trade-off:** DCL phức tạp, ít đáng dùng nếu initialization rẻ. `this` escape khỏi constructor vẫn có thể phá invariant khác.

**Mức kỳ vọng:** **Middle:** biết cần volatile. **Senior:** giải thích reordering/final-field và ưu tiên holder/DI lifecycle.

### JAVA-035 [Middle] So sánh `synchronized`, `ReentrantLock`, `ReadWriteLock` và `StampedLock`; interruptibility, fairness và optimistic read ảnh hưởng lựa chọn thế nào?

**Kết luận:** `synchronized` đơn giản, tự release; `ReentrantLock` thêm try/timeout/interrupt/fairness/conditions; read-write lock cho nhiều reader khi write ít; stamped lock có optimistic read nhưng không reentrant.

**Lập luận:** Lock thủ công phải unlock trong `finally`. Optimistic read phải `validate()` và đọc lại dưới read lock nếu thất bại. Fairness giảm starvation nhưng thường hạ throughput.

**Pitfall/trade-off:** Read-write lock có overhead và writer starvation; với critical section nhỏ, mutex thường nhanh/rõ hơn. StampedLock dễ deadlock khi tái nhập hoặc convert sai.

**Mức kỳ vọng:** **Middle:** dùng lock/finally đúng. **Senior:** chọn theo contention profile, invariant và cancellation requirement.

### JAVA-036 [Senior] Deadlock, livelock và starvation khác nhau ra sao; hãy nêu cách phát hiện bằng thread dump và cách thiết kế lock ordering/timeouts để phòng tránh.

**Kết luận:** Deadlock là vòng chờ không tiến; livelock liên tục hành động nhưng không tiến; starvation là một task không được cấp cơ hội đủ lâu.

**Lập luận:** Thread dump nhiều mẫu thời gian cho owner/waiter và JVM có thể báo monitor deadlock. Phòng bằng global lock order, giảm nested locks, acquire atomically/`tryLock` timeout, tránh external call trong lock và fairness khi thực sự cần.

**Pitfall/trade-off:** Timeout phá chờ vô hạn nhưng cần rollback state và jitter, nếu retry đồng bộ có thể thành livelock. Dump đơn lẻ dễ nhầm wait bình thường.

**Mức kỳ vọng:** **Middle:** nhận diện cycle. **Senior:** tái thiết kế ownership/locking protocol và xác nhận bằng dump/JFR contention.

### JAVA-037 [Middle] `wait/notify/notifyAll` phải dùng trong vòng lặp kiểm tra condition vì sao; lost notification và spurious wakeup là gì?

**Kết luận:** Luôn giữ monitor và dùng `while (!condition) wait()` vì wakeup không đảm bảo condition đúng; thread khác có thể lấy mất condition hoặc JVM cho spurious wakeup.

**Lập luận:** Condition state mới là sự thật, notification chỉ là tín hiệu kiểm tra lại. Lost notification xảy ra khi protocol check/register/signal không cùng synchronization hoặc signal trước khi waiter thật sự chờ.

**Pitfall/trade-off:** `notify` có thể đánh thức sai nhóm condition; `notifyAll` an toàn hơn nhưng herd effect. Ưu tiên `BlockingQueue`, latch hoặc `Condition` cấp cao.

**Mức kỳ vọng:** **Middle:** viết đúng guarded block. **Senior:** chứng minh protocol không lost signal và chọn primitive cao cấp.

### JAVA-038 [Senior] `AtomicInteger`, `LongAdder` và synchronized counter khác nhau dưới contention; vì sao `LongAdder.sum()` không phải atomic snapshot?

**Kết luận:** AtomicInteger CAS trên một ô, tốt ở contention vừa/thấp và có linearizable value; LongAdder phân tán update qua cells để tăng throughput nhưng sum đọc nhiều cell không khóa; synchronized cho compound invariant linh hoạt.

**Lập luận:** Trong lúc `sum`, update có thể xen giữa các cell nên kết quả phù hợp metric thống kê chứ không cho sequence/limit chính xác. CAS có thể retry mạnh dưới contention.

**Pitfall/trade-off:** LongAdder tốn memory và `reset/sumThenReset` không phải snapshot an toàn với concurrent update theo mọi use case. Counter làm quota cần atomic invariant khác.

**Mức kỳ vọng:** **Middle:** chọn AtomicInteger cho ID/count chính xác. **Senior:** phân biệt linearizability với eventual metric và benchmark contention.

### JAVA-039 [Senior] Giải thích ABA problem và compare-and-set; stamped/versioned reference hoặc thiết kế immutable state giải quyết thế nào?

**Kết luận:** CAS chỉ thấy value/reference hiện tại bằng A, không biết nó đã A→B→A; thuật toán có thể dựa sai vào việc “chưa đổi”.

**Lập luận:** Gắn version/stamp vào state khiến A-v1 khác A-v3; `AtomicStampedReference` CAS cả reference và stamp. Immutable state aggregate với monotonically increasing version cũng giúp update toàn invariant.

**Pitfall/trade-off:** Version có thể overflow (thường cần đánh giá thực tế), tăng width/contention; garbage collection giảm một số ABA do reuse address nhưng không xóa ABA logical/reference reuse.

**Mức kỳ vọng:** **Middle:** hiểu CAS retry. **Senior:** chỉ ra linearization point, ABA cụ thể và chứng minh mitigation.

### JAVA-040 [Middle] Thiết kế `ExecutorService`: chọn pool size, queue, rejection policy và shutdown protocol cho CPU-bound so với I/O-bound như thế nào?

**Kết luận:** CPU-bound thường gần số core; blocking I/O cần concurrency lớn hơn nhưng phải bound theo latency và tài nguyên downstream. Queue luôn cần capacity/policy rõ.

**Lập luận:** Little’s Law và đo wait/compute giúp ước lượng. Bounded queue tạo backpressure; rejection có thể fail-fast, caller-runs hoặc drop chỉ khi semantics cho phép. Shutdown: stop nhận việc, `shutdown`, await, rồi `shutdownNow` và xử lý interruption.

**Pitfall/trade-off:** Unbounded queue che overload bằng latency/memory; pool quá lớn tăng context switch và connection pressure. Task cần timeout/cancellation cooperative.

**Mức kỳ vọng:** **Middle:** không dùng pool/queue vô hạn mù quáng. **Senior:** capacity planning theo SLO, overload policy và graceful termination.

### JAVA-041 [Senior] `CompletableFuture` xử lý composition, exception và cancellation ra sao; lỗi nào phát sinh khi gọi `join()`/blocking trong cùng executor?

**Kết luận:** Dùng `thenCompose` cho async dependency, `thenCombine` cho độc lập; xử lý lỗi bằng `handle/exceptionally/whenComplete` theo semantics. Blocking `join` trong pool hữu hạn có thể gây starvation/deadlock.

**Lập luận:** Async method không chỉ định executor thường dùng common pool. Exception được bọc khi join/get. Cancellation của một future không tự động đảm bảo interrupt công việc hay cascade toàn graph; phải thiết kế timeout/cancel propagation.

**Pitfall/trade-off:** `thenApply` trả nested future; `exceptionally` vô tình biến failure thành success. Context/MDC không tự truyền qua thread.

**Mức kỳ vọng:** **Middle:** compose không nested và xử lý exception. **Senior:** quản lý executor, deadlines, cancellation tree và context propagation.

### JAVA-042 [Senior] Structured concurrency cải thiện lifetime, cancellation và error propagation của các subtask so với future rời rạc như thế nào?

**Kết luận:** Nó buộc subtasks nằm trong lexical scope: parent chờ các child, policy có thể cancel siblings khi một task fail/succeed, và lifetime không rò khỏi request.

**Lập luận:** Error được tổng hợp tại join boundary; deadline/cancellation dễ truyền theo cây. Điều này khớp cấu trúc call stack và làm thread dump/observability dễ hiểu hơn future fire-and-forget.

**Pitfall/trade-off:** API/availability phụ thuộc phiên bản JDK và có thể cần preview flag; nó không tự làm downstream call cancellable/idempotent. Task chia sẻ mutable state vẫn cần synchronization.

**Mức kỳ vọng:** **Middle:** hiểu fork/join scope. **Senior:** thiết kế failure policy, deadline budget và migration tương thích JDK.

### JAVA-043 [Senior] Virtual thread phù hợp workload nào; pinning, `ThreadLocal`, connection pool và giới hạn tài nguyên downstream thay đổi thiết kế ra sao?

**Kết luận:** Virtual thread giúp thread-per-task cho workload nhiều blocking I/O; không làm CPU-bound nhanh hơn và không biến tài nguyên downstream thành vô hạn.

**Lập luận:** Blocking JDK-aware thường unmount khỏi carrier. Pinning trong một số synchronized/native/foreign call giữ carrier, quan sát bằng JFR rồi rút ngắn vùng pin. Dùng semaphore/pool để bound DB/API; connection pool vẫn là giới hạn thật.

**Pitfall/trade-off:** Pool virtual thread để “giới hạn thread” thường sai abstraction; giới hạn resource cụ thể. Hàng triệu `ThreadLocal` value lớn làm memory retention/context cost.

**Mức kỳ vọng:** **Middle:** chọn đúng I/O workload. **Senior:** đo pinning, thiết kế backpressure/deadline và audit ThreadLocal/library compatibility.

### JAVA-044 [Senior] Hãy điều tra scenario throughput tụt khi tăng số thread: dùng Little’s Law, contention, context switch, queueing và backpressure để tìm nguyên nhân thế nào?

**Kết luận:** Nhiều thread chỉ tăng throughput trước bottleneck; sau đó làm wait/queue/context switch/GC tăng và tail latency xấu đi.

**Lập luận:** Đo arrival rate, concurrency và response time (`L=λW`), CPU saturation, run queue, lock profile, pool/DB wait, allocation và downstream latency. Load test theo từng mức concurrency để tìm knee, không chỉ peak throughput.

**Pitfall/trade-off:** CPU thấp không có nghĩa dư capacity: có thể đang chờ lock/I/O. Queue vô hạn giữ throughput tạm thời nhưng phá latency/SLO; cần admission control và backpressure.

**Mức kỳ vọng:** **Middle:** kiểm tra pool/CPU/DB. **Senior:** xây bottleneck model, correlate evidence và đặt concurrency limit theo SLO.

## 7. Records, sealed types và pattern matching

### JAVA-045 [Middle] Record tự sinh những gì, có thật sự immutable sâu không, và compact constructor nên dùng để chuẩn hóa/validate invariant thế nào?

**Kết luận:** Record sinh final fields, accessors, canonical constructor, `equals/hashCode/toString`; component reference final nhưng object được trỏ tới vẫn có thể mutable.

```java
record Tags(List<String> values) {
  Tags { values = List.copyOf(values); }
}
```

**Lập luận:** Compact constructor chạy trước assignment ngầm; có thể validate/canonicalize parameter. Record phù hợp transparent data carrier/value semantics.

**Pitfall/trade-off:** Nhận list rồi không copy phá immutability; array component equality vẫn theo array identity. Không nhét hidden mutable lifecycle vào record.

**Mức kỳ vọng:** **Middle:** biết shallow immutability. **Senior:** bảo vệ invariant/equality và đánh giá framework/serialization.

### JAVA-046 [Senior] Sealed class/interface cùng exhaustive pattern matching giúp mô hình hóa domain algebraic ra sao; rủi ro tương thích khi thêm subtype mới là gì?

**Kết luận:** Sealed hierarchy đóng tập subtype được phép, giúp compiler kiểm tra exhaustive switch và làm illegal state khó biểu diễn.

**Lập luận:** Mỗi variant mang đúng dữ liệu của nó; pattern switch thay cast/visitor boilerplate. Permitted subtype phải tuân quy tắc final/sealed/non-sealed và ranh giới module/package tương ứng.

**Pitfall/trade-off:** Thêm subtype phá source exhaustiveness của consumer và có thể ảnh hưởng binary behavior khi switch cũ gặp variant mới. `non-sealed` mở lại tập và mất exhaustiveness sâu.

**Mức kỳ vọng:** **Middle:** mô hình hóa result variants. **Senior:** lập versioning strategy cho public hierarchy và fallback boundary.

### JAVA-047 [Middle] Pattern matching cho `instanceof`/`switch` cải thiện flow scoping và exhaustiveness thế nào; cần xử lý `null` ra sao?

**Kết luận:** Pattern vừa test type vừa bind biến trong scope mà compiler chứng minh match; switch trên sealed/enum có thể exhaustive. `null` cần case explicit hoặc guard trước theo semantics/API version.

**Lập luận:** Flow scoping hiểu các nhánh boolean, giảm cast lặp. Guarded pattern xử lý điều kiện bổ sung; thứ tự case phải tránh pattern rộng che pattern hẹp.

**Pitfall/trade-off:** `default` tiện nhưng che variant mới và mất compiler warning. Pattern switch không tự biến domain mở thành đóng.

**Mức kỳ vọng:** **Middle:** viết switch an toàn null/type. **Senior:** dùng exhaustiveness như công cụ evolution và tránh dominance/unreachable cases.

### JAVA-048 [Senior] Khi nào nên dùng record thay DTO/entity/class truyền thống; tác động đến serialization framework, JPA proxy và binary compatibility là gì?

**Kết luận:** Dùng record cho value/data carrier có state cố định và equality theo toàn bộ components; không mặc định dùng cho entity có identity/lifecycle/proxy/mutation.

**Lập luận:** Framework hiện đại có thể gọi canonical constructor nhưng cần kiểm tra version/module reflection. JPA entity truyền thống cần no-arg/proxy và mutable dirty tracking nên record thường không phù hợp làm entity. Thay component làm đổi constructor/accessor và serialization shape.

**Pitfall/trade-off:** Record public là API contract mạnh; thêm/reorder component phá source/binary/client schema. DTO serialization cần explicit schema/version, không dựa chỉ vào cú pháp ngắn.

**Mức kỳ vọng:** **Middle:** chọn record cho response/value. **Senior:** đánh giá persistence/proxy/toolchain và compatibility lifecycle.

## 8. I/O, NIO và serialization

### JAVA-049 [Middle] Phân biệt byte stream, character stream, charset và buffering; bug mojibake hoặc cắt đôi multibyte character xuất hiện thế nào?

**Kết luận:** Input/OutputStream xử lý byte; Reader/Writer xử lý character qua charset decoder/encoder. Luôn chỉ định charset tại boundary và buffer hợp lý.

**Lập luận:** UTF-8 character có nhiều byte; decode từng chunk độc lập hoặc cast byte sang char có thể cắt sequence. Reader/decoder giữ state giữa buffer. Buffered I/O giảm syscall.

**Pitfall/trade-off:** Default charset khác máy tạo bug môi trường. `flush` không đồng nghĩa fsync/durability; buffer quá lớn tăng memory, quá nhỏ tăng syscall.

**Mức kỳ vọng:** **Middle:** dùng UTF-8 explicit/try-with-resources. **Senior:** xử lý streaming decoder, partial frame và durability requirement.

### JAVA-050 [Senior] Blocking I/O, NIO selector và asynchronous I/O khác nhau về execution model/backpressure; chọn mô hình nào cho nhiều connection nhưng ít dữ liệu?

**Kết luận:** Blocking thread-per-connection đơn giản, đặc biệt với virtual thread; selector multiplex nhiều nonblocking channel trên ít event-loop thread; async API báo completion qua callback/future.

**Lập luận:** Nhiều idle connection từng khiến selector hiệu quả hơn platform thread. Tuy nhiên state machine phức tạp; virtual thread có thể đạt scalability với code tuần tự. Mọi mô hình vẫn cần bounded buffers, write readiness và slow-consumer policy.

**Pitfall/trade-off:** Blocking event-loop làm đứng mọi connection; nonblocking không tự có backpressure. Chọn theo ecosystem, profiling, protocol và operation có thực sự nonblocking.

**Mức kỳ vọng:** **Middle:** phân biệt execution model. **Senior:** thiết kế flow control, buffer ownership và failure/cancellation.

### JAVA-051 [Middle] `Path`/`Files` nên được dùng an toàn thế nào để tránh resource leak, TOCTOU và path traversal khi xử lý file do người dùng chỉ định?

**Kết luận:** Resolve vào root tin cậy, normalize/canonicalize và xác minh vẫn nằm dưới root; đóng mọi stream trả bởi `Files`; không dựa vào check-then-use nếu attacker có thể đổi filesystem.

```java
Path root = uploadRoot.toRealPath();
Path target = root.resolve(userName).normalize();
if (!target.startsWith(root)) throw new SecurityException("invalid path");
```

**Lập luận:** `Files.lines/list/walk` đều cần try-with-resources. Với threat symlink mạnh, dùng API hỗ trợ no-follow/secure directory operation và quyền OS, file descriptor-relative operation nếu có.

**Pitfall/trade-off:** Normalize lexical không giải quyết symlink; filename validation đơn thuần dễ bypass. TOCTOU không thể xóa chỉ bằng hai lần check.

**Mức kỳ vọng:** **Middle:** chặn `..` và đóng stream. **Senior:** threat-model symlink/race, permission và atomic move/create.

### JAVA-052 [Senior] Vì sao Java native serialization thường không phù hợp cho dữ liệu không tin cậy hoặc lưu dài hạn; so sánh serialization proxy với JSON/Protobuf và versioning.

**Kết luận:** Native serialization gắn chặt object graph/class implementation và từng có bề mặt gadget/deserialization lớn; không nên deserialize dữ liệu không tin cậy nếu không có kiểm soát nghiêm.

**Lập luận:** Serialization proxy (`writeReplace/readResolve`) giữ invariant tốt hơn default field graph; object input filter/allowlist giảm rủi ro nhưng không làm format lý tưởng dài hạn. JSON dễ đọc/evolve nhưng schema lỏng; Protobuf có schema/tag, compact và quy tắc compatibility rõ.

**Pitfall/trade-off:** `serialVersionUID` không tự giải quyết semantic evolution. Không tái sử dụng field number/tag; validate dữ liệu sau decode; giới hạn size/depth.

**Mức kỳ vọng:** **Middle:** tránh native serialization ở boundary. **Senior:** chọn schema/version/migration và threat controls end-to-end.

## 9. Testing, profiling và hiệu năng

### JAVA-053 [Middle] Unit test tốt khác integration test thế nào; test behavior thay vì implementation giúp giảm brittle test ra sao?

**Kết luận:** Unit test cô lập logic nhỏ, nhanh/deterministic; integration test xác nhận wiring và contract với thành phần thật. Test observable behavior cho phép refactor nội bộ mà không sửa test.

**Lập luận:** Unit test domain pure; integration cho DB, serialization, transaction, HTTP contract. Mock chỉ boundary đắt/không deterministic, không mock mọi method call nội bộ.

**Pitfall/trade-off:** Quá nhiều mock tạo test pass dù hệ thống không wire được; chỉ integration khiến suite chậm/khó định vị lỗi. Tránh assert thứ tự call nếu không phải contract.

**Mức kỳ vọng:** **Middle:** viết test AAA và edge cases. **Senior:** xây test portfolio theo risk, contract test và feedback time.

### JAVA-054 [Senior] Test code concurrent cần tránh phụ thuộc `sleep()` thế nào; sử dụng barrier/latch, repeated test và invariant để bắt race condition ra sao?

**Kết luận:** Đồng bộ test theo event/condition bằng latch, barrier, future với timeout; không dùng sleep như bằng chứng thread đã đến đúng trạng thái.

**Lập luận:** Barrier ép interleaving mong muốn; chạy lặp/stress tăng xác suất nhưng assertion phải là invariant như no lost update, conservation, linearizable result. Mọi wait có timeout để suite không treo; capture task exception.

**Pitfall/trade-off:** Test pass nhiều lần không chứng minh không có race. Over-synchronizing test có thể vô tình xóa race; dùng model checker/stress framework khi invariant quan trọng.

**Mức kỳ vọng:** **Middle:** thay sleep bằng latch. **Senior:** thiết kế deterministic schedule, linearization assertion và stress/JCStress khi phù hợp.

### JAVA-055 [Senior] Vì sao microbenchmark Java phải dùng JMH; warmup, dead-code elimination, constant folding, fork và Blackhole tác động kết quả thế nào?

**Kết luận:** JIT làm benchmark vòng lặp tự viết rất dễ đo sai; JMH quản lý warmup, measurement, fork, state và chống optimization thường gặp.

**Lập luận:** Warmup đưa code qua compilation/profile; fork tách JVM state; kết quả không được dùng có thể bị DCE; input constant có thể được fold. Trả result hoặc Blackhole giữ computation, nhưng benchmark vẫn phải đại diện workload.

**Pitfall/trade-off:** Blackhole không sửa setup sai, cache effect hay benchmark operation quá nhỏ. Không suy production latency từ nanobenchmark mà thiếu allocation/GC/concurrency.

**Mức kỳ vọng:** **Middle:** không dùng `nanoTime` loop ngây thơ. **Senior:** thiết kế state/scope/param/fork và diễn giải confidence/distribution.

### JAVA-056 [Middle] Phân biệt latency percentile, throughput và allocation rate; vì sao average latency có thể che giấu sự cố production?

**Kết luận:** Throughput là số việc/thời gian; latency là thời gian mỗi việc; percentile mô tả tail; allocation rate là byte/object tạo theo thời gian và ảnh hưởng GC.

**Lập luận:** Average bị kéo phẳng: đa số nhanh nhưng 1% request rất chậm vẫn phá SLO. Theo dõi p50/p95/p99 cùng histogram, tải và error. Coordinated omission trong load generator có thể che latency khi hệ thống nghẽn.

**Pitfall/trade-off:** Percentile không cộng/trung bình tùy tiện giữa instance/time window. Giảm allocation chưa chắc giảm latency nếu tăng CPU/complexity.

**Mức kỳ vọng:** **Middle:** đọc đúng metric. **Senior:** chọn SLI/window/histogram và correlate GC/queue/load.

### JAVA-057 [Senior] Hãy code review việc “tối ưu” bằng object pool/string intern/cache tự viết: GC, memory retention, contention và complexity có thể làm hệ thống tệ hơn thế nào?

**Kết luận:** Với object rẻ, allocator/young GC thường tốt hơn pool; intern/cache có thể kéo dài lifetime và biến allocation thành retention/contention.

**Lập luận:** Pool cần reset ownership, capacity, synchronization và leak handling; chỉ hợp lý cho resource thật sự đắt/bounded như connection/direct buffer trong ngữ cảnh cụ thể. Intern giữ canonical entries; cache phải bounded, eviction và metric.

**Pitfall/trade-off:** Pool dùng chung gây false sharing/lock; stale sensitive data có thể tái sử dụng. “Giảm GC” nhưng tăng old-gen/live set khiến pause tệ hơn.

**Mức kỳ vọng:** **Middle:** yêu cầu benchmark/profile. **Senior:** tính lifecycle/live-set, contention và ưu tiên tối ưu bottleneck đã đo.

### JAVA-058 [Senior] Quy trình điều tra CPU cao hoặc latency tăng trong ứng dụng Java nên kết hợp profiler, JFR, flame graph, metric và load test ra sao để tránh tối ưu theo phỏng đoán?

**Kết luận:** Bắt đầu từ symptom/SLO và timeline, tạo hypothesis bằng metric, thu profile/JFR đúng khoảng sự cố, rồi tái hiện và xác nhận thay đổi bằng load test/canary.

**Lập luận:** Phân biệt on-CPU, lock, I/O wait, GC và queue. Flame graph cho stack tổng hợp; JFR liên kết allocation, lock, thread, socket/GC với thời gian; tracing tìm dependency. So baseline cùng tải/data/JDK.

**Pitfall/trade-off:** Sampling có bias và thiếu method ngắn; instrumentation có overhead. Profile lúc hệ thống bình thường không giải thích spike. Một flame graph không chứng minh causality.

**Mức kỳ vọng:** **Middle:** thu thread dump/metric/profile có hệ thống. **Senior:** correlate đa nguồn, kiểm soát thí nghiệm và chứng minh cải thiện không chuyển bottleneck.

## 10. Câu hỏi kinh điển bổ sung — Basic đến Senior

### JAVA-059 [Basic · ⭐ Rất thường gặp] Interface và abstract class khác nhau thế nào về state, constructor, multiple inheritance và khả năng tiến hóa API; khi nào chọn mỗi loại?

**Kết luận:** Interface mô tả capability/contract và một class có thể implement nhiều interface; abstract class phù hợp khi các subtype thực sự chia sẻ state, construction rule và template implementation.

**Cơ chế:** Abstract class có instance field, constructor, method abstract/concrete và class chỉ `extends` một class. Interface không có instance state/constructor; field là constant, nhưng có abstract, default, static và private method để tiến hóa contract có kiểm soát.

**Pitfall / follow-up Senior:** Dùng abstract base chỉ để tái sử dụng vài dòng tạo coupling inheritance; dùng interface “béo” phá Interface Segregation. Default method giúp compatibility nhưng có thể tạo conflict/semantic change cho implementation cũ.

### JAVA-060 [Basic · ⭐ Rất thường gặp] Vì sao `String` immutable, String Pool hoạt động ra sao, và `new String("abc")` khác literal `"abc"` ở identity/bộ nhớ thế nào?

**Kết luận:** String immutable nên chia sẻ/pool an toàn, hash ổn định và dễ dùng trong security/concurrency. Literal cùng nội dung thường trỏ entry canonical trong pool; `new String("abc")` tạo object String riêng nên identity thường khác.

**Cơ chế:** Compiler ghi literal vào constant pool và JVM intern/canonicalize nó; `intern()` trả canonical reference. Mọi operation “sửa” chuỗi tạo kết quả mới vì internal value không đổi.

```java
String a = "abc", b = "abc", c = new String("abc");
// a == b: true; a == c: false; a.equals(c): true
```

**Pitfall / follow-up Senior:** Không dùng `==` để so nội dung. Intern dữ liệu cardinality cao có thể tăng retention/cost; compiler/JIT có thể tối ưu allocation nhưng đó không phải lý do dựa vào identity.

### JAVA-061 [Basic · ⭐ Rất thường gặp] So sánh nối chuỗi bằng `+`, `StringBuilder` và `StringBuffer`; compiler tối ưu được trường hợp nào và lựa chọn nào phù hợp trong loop hoặc concurrent code?

**Kết luận:** `+` rõ và tốt cho biểu thức nhỏ; loop nối lặp nên dùng `StringBuilder`; `StringBuffer` đồng bộ từng operation nhưng hiếm khi là thiết kế concurrent tốt nhất.

**Cơ chế:** Compiler có thể fold literal và hạ một biểu thức concat thành builder hoặc `invokedynamic`/concat recipe tùy JDK. Trong loop, mỗi `s = s + x` có thể copy prefix nhiều lần; builder giữ buffer tăng dần. StringBuffer thêm synchronization overhead.

**Pitfall / follow-up Senior:** Một shared builder vẫn cần compound-operation coordination dù dùng StringBuffer; thường nên giữ builder thread-confined rồi hợp nhất kết quả. Pre-size chỉ sau khi có ước lượng đáng tin và profile.

### JAVA-062 [Basic · ⭐ Rất thường gặp] `List`, `Set` và `Map` biểu diễn cardinality/lookup khác nhau thế nào; ordering, duplicate và `null` có phải guarantee chung cho mọi implementation không?

**Kết luận:** List là sequence có index và cho duplicate; Set biểu diễn phần tử duy nhất theo equality/order contract; Map ánh xạ unique key tới value. Ordering và null thuộc contract của implementation, không phải của ba interface nói chung.

**Cơ chế:** `ArrayList`, `HashSet`/`HashMap`, `LinkedHash*`, `Tree*` và concurrent/immutable implementation có cấu trúc và guarantee khác nhau. Set thường dựa equality/hash hoặc comparator; Map duplicate key thay/merge value thay vì giữ hai key logical giống nhau.

**Pitfall / follow-up Senior:** Không dựa vào iteration order quan sát được của hash collection. Chọn collection theo lookup/order/concurrency/cardinality và bảo đảm key/element không đổi theo equality khi đang chứa trong hash/tree.

### JAVA-063 [Basic · ⭐ Rất thường gặp] Phân biệt `final`, `finally` và `finalize()`; vì sao không nên dùng finalization để giải phóng tài nguyên?

**Kết luận:** `final` giới hạn gán lại/override/inheritance; `finally` là block cleanup của `try`; `finalize()` là cơ chế GC callback cũ, không deterministic và đã bị deprecate để loại bỏ.

**Cơ chế:** Final reference không làm object sâu bên trong immutable. Finally chạy khi control rời try/catch trong hầu hết đường bình thường/exception, còn finalizer chỉ có thể được JVM gọi sau khi object unreachable và không có deadline/guarantee hữu ích.

**Pitfall / follow-up Senior:** Resource khan hiếm phải `AutoCloseable` + try-with-resources; Cleaner chỉ là safety net. Finalizer có queue/backlog, resurrection và security/performance risk; `System.exit`, crash hoặc kill không bảo đảm finally/finalizer chạy.

### JAVA-064 [Basic · ⭐ Rất thường gặp] `throw` và `throws` khác nhau thế nào; exception được propagate dọc call stack cho đến khi được xử lý ra sao?

**Kết luận:** `throw` thực sự ném một exception instance; `throws` khai báo method có thể để exception đi ra cho caller. Nếu không catch phù hợp, JVM unwinds frame cho đến handler hoặc uncaught-exception boundary.

**Cơ chế:** Trong lúc unwind, finally/try-with-resources cleanup chạy theo contract. Checked exception phải được catch hoặc declare; unchecked không bị compiler bắt buộc nhưng vẫn là API failure contract.

**Pitfall / follow-up Senior:** Chỉ catch khi recover/translate/cleanup được, giữ cause và context an toàn. Khai `throws Exception` hoặc wrap mọi tầng làm taxonomy/retryability mất ý nghĩa.

### JAVA-065 [Basic · ⭐ Rất thường gặp] Gọi `Thread.start()` khác gọi trực tiếp `run()` thế nào; một `Thread` instance có thể được start lại sau khi kết thúc không?

**Kết luận:** `start()` yêu cầu JVM tạo/schedule execution thread mới rồi thread đó gọi `run()`; gọi `run()` trực tiếp chỉ là method call trên thread hiện tại. Một Thread instance chỉ được start một lần.

**Cơ chế:** Action trước `start()` happens-before action trong thread mới; `join()` tạo edge khi chờ completion. Gọi `start()` lần hai, kể cả sau khi terminated, ném `IllegalThreadStateException`.

**Pitfall / follow-up Senior:** Production code thường submit task vào executor/structured scope thay vì quản thread thủ công để có boundedness, cancellation và shutdown. `start()` không bảo đảm thread chạy ngay hoặc thứ tự giữa các thread.

### JAVA-066 [Middle · ⭐ Rất thường gặp] Vì sao thường ưu tiên composition hơn inheritance trong Java; dấu hiệu nào cho thấy inheritance vẫn là quan hệ subtype đúng theo Liskov?

**Kết luận:** Composition ủy quyền capability qua field/interface nên thay implementation và kết hợp behavior linh hoạt hơn; inheritance đúng khi subtype thật sự thay thế được base trong mọi contract được công bố.

**Cơ chế:** Liskov yêu cầu subtype không siết precondition, không làm yếu postcondition và giữ invariant/semantics. Base class có protected hooks/state tạo coupling “fragile base class”; composition giữ boundary rõ và test độc lập.

**Pitfall / follow-up Senior:** “Is-a” theo tên chưa đủ: `UnsupportedOperationException` cho operation hợp lệ của base thường báo vi phạm. Composition cũng có boilerplate; sealed hierarchy/template method hợp lý khi tập subtype đóng và invariant dùng chung ổn định.

### JAVA-067 [Middle · ⭐ Rất thường gặp] Vì sao `ArrayDeque` thường được ưu tiên hơn `Stack` hoặc `LinkedList` khi cài stack/queue; các giới hạn về `null`, thread safety và capacity là gì?

**Kết luận:** ArrayDeque là circular resizable array, locality tốt và API `Deque` diễn đạt cả stack/queue; Stack là legacy subclass của Vector, còn LinkedList tốn node/allocation.

**Cơ chế:** `addFirst/removeFirst`, `addLast/removeLast`, `push/pop` đều O(1) amortized. ArrayDeque không cho null, không thread-safe và tự tăng capacity thay vì là bounded queue.

**Pitfall / follow-up Senior:** Concurrent/bounded producer–consumer nên dùng `ArrayBlockingQueue`, `LinkedBlockingQueue` hoặc primitive phù hợp, không bọc ArrayDeque tùy tiện. Chọn `offer/poll` hay `add/remove` theo semantics full/empty mong muốn.

### JAVA-068 [Middle · Thường gặp] Vì sao không thể tạo trực tiếp `new T[]` hoặc `new List<String>[n]`; reification của array và erasure của generic xung đột thế nào?

**Kết luận:** Array biết component type ở runtime và kiểm tra store; type argument generic bị erase/non-reifiable nên JVM không thể tạo/kiểm tra chính xác array generic đó.

**Cơ chế:** Nếu cho tạo `List<String>[]`, covariance của array có thể cho gán qua `Object[]` rồi store `List<Integer>`, tạo heap pollution và lỗi xa nguồn. Dùng `List<List<String>>`, hoặc nhận `Class<T>` và tạo array bằng reflection trong adapter được kiểm soát.

```java
@SuppressWarnings("unchecked")
T[] values = (T[]) Array.newInstance(componentType, size);
```

**Pitfall / follow-up Senior:** Cast unchecked chỉ đúng khi component token và mọi write giữ invariant; cô lập warning thay vì rải raw type. `List<?>[]` reifiable hơn nhưng khả năng ghi rất hạn chế.

### JAVA-069 [Middle · ⭐ Rất thường gặp] `return` hoặc `throw` trong `finally` ảnh hưởng control flow và exception gốc thế nào; quy tắc nào giúp tránh che giấu lỗi?

**Kết luận:** Abrupt completion trong finally thắng return/throw đang pending từ try/catch, nên có thể đổi kết quả hoặc làm mất exception gốc. Không return/throw business error từ finally.

**Cơ chế:** JVM tính return value hoặc giữ throwable rồi chạy finally; nếu finally hoàn tất bình thường, control cũ tiếp tục, còn finally return/throw thay thế nó. Try-with-resources giữ close failure dưới dạng suppressed thay vì ghi đè primary failure.

**Pitfall / follow-up Senior:** Cleanup nên idempotent và lỗi cleanup phải được preserve/quan sát theo policy. Static analysis nên chặn `return` trong finally; khi translate exception phải giữ cause lẫn suppressed exceptions.

### JAVA-070 [Middle · Thường gặp] `Files.lines()`/`Files.walk()` trả stream lazy có ownership tài nguyên thế nào; xử lý file rất lớn ra sao để không leak handle hoặc giữ toàn bộ dữ liệu trong RAM?

**Kết luận:** Các stream này mở resource và phải được đóng, thường bằng try-with-resources; lazy processing chỉ giữ memory thấp nếu pipeline không materialize/buffer toàn bộ.

**Cơ chế:** Terminal operation kéo line/path theo nhu cầu, còn close stream đóng reader/directory handles liên quan. Dùng streaming parser/bounded batch, charset explicit và consumer backpressure cho file lớn.

```java
try (Stream<String> lines = Files.lines(path, StandardCharsets.UTF_8)) {
  lines.filter(this::valid).forEach(this::process);
}
```

**Pitfall / follow-up Senior:** `sorted`, `distinct`, `toList` hoặc parallel processing có thể giữ nhiều dữ liệu/tài nguyên và đổi bottleneck. Nếu trả Stream ra khỏi method, ownership/close contract phải cực rõ; thường callback hoặc eager bounded result an toàn hơn.

### JAVA-071 [Middle · ⭐ Rất thường gặp] `synchronized` instance method, static method và block khóa trên những monitor nào; hai method synchronized có luôn chặn nhau không?

**Kết luận:** Instance synchronized khóa `this`; static synchronized khóa object `Class` tương ứng; block khóa expression được chỉ định. Hai method chỉ loại trừ nhau khi cạnh tranh cùng monitor.

**Cơ chế:** Monitor reentrant và unlock/lock cùng monitor tạo happens-before. Hai instance khác nhau không chặn ở instance method; instance lock và class lock cũng độc lập.

**Pitfall / follow-up Senior:** Không khóa trên `this`, literal String hoặc object public nếu code ngoài có thể giữ lock. Nhiều monitor bảo vệ cùng invariant mà không có protocol chung vẫn race; nested order không nhất quán tạo deadlock.

### JAVA-072 [Middle · ⭐ Rất thường gặp] So sánh `Runnable`, `Callable<T>` và `Future<T>` về kết quả, exception và cancellation; khi nào không nên tạo `Thread` thủ công?

**Kết luận:** Runnable không trả result và không khai checked exception; Callable trả `T` và có thể ném checked exception; submit tạo Future để chờ result/failure/cancel.

**Cơ chế:** `Future.get()` block và bọc task failure trong `ExecutionException`; `cancel(true)` chỉ request interruption nếu task đã chạy, nên code phải cooperative. Executor tách task khỏi thread, tái sử dụng/bound worker và quản shutdown.

**Pitfall / follow-up Senior:** Future đơn lẻ có composition/cancellation propagation kém; dùng CompletableFuture hoặc structured concurrency theo dependency graph. Không dùng unbounded executor để “tránh tạo Thread thủ công”.

### JAVA-073 [Middle · Thường gặp] Phân biệt `Instant`, `LocalDate`, `LocalDateTime`, `OffsetDateTime` và `ZonedDateTime`; loại nào nên dùng để lưu timestamp và xử lý business time theo múi giờ?

**Kết luận:** Instant là điểm trên UTC timeline; LocalDate chỉ ngày; LocalDateTime không có offset/zone; OffsetDateTime gắn offset cố định; ZonedDateTime gắn ZoneId cùng rule lịch sử/DST.

**Cơ chế:** Lưu event timestamp thường bằng Instant; lưu thêm zone/locale khi cần tái hiện giờ business. Lịch “9 giờ sáng Europe/Paris” cần local time + ZoneId/rule, không chỉ offset hiện tại.

**Pitfall / follow-up Senior:** LocalDateTime không chuyển duy nhất thành Instant ở DST overlap/gap; phải có policy. Database/JSON precision và zone database version cũng là compatibility concern.

### JAVA-074 [Senior · Thường gặp] Equality trong hierarchy có thể phá symmetry/transitivity thế nào khi dùng `instanceof` hoặc `getClass()`; composition, sealed hierarchy hay `canEqual` giải quyết trade-off ra sao?

**Kết luận:** Base dùng `instanceof` có thể xem subtype equal trong khi subtype xét field mới và trả false; `getClass()` giữ symmetry bằng exact type nhưng cấm equality polymorphic/proxy. Không có một recipe đúng cho mọi hierarchy mở.

**Cơ chế:** Equality phải cùng notion of value cho cả hai phía và hash theo đúng field đó. Composition tách phần value khỏi subtype identity; sealed/final đóng tập variant để định nghĩa equality nhất quán; `canEqual` cho double-dispatch guard nhưng phức tạp.

**Pitfall / follow-up Senior:** ORM proxy làm `getClass()` đặc biệt khó; entity identity khác value equality. Hãy test property reflexive/symmetric/transitive và behavior trong HashSet/TreeSet, không chỉ vài pair ví dụ.

### JAVA-075 [Senior · Thường gặp] Sau type erasure, API JSON/DI làm sao giữ thông tin `List<Order>` tại runtime bằng `Class<T>`, type token hoặc super-type token; mỗi cách có giới hạn gì?

**Kết luận:** `Class<Order>` giữ raw class nhưng `List.class` không mang `Order`; parameterized type phải được truyền bằng `Type`/token, thường capture generic signature trong anonymous subclass.

**Cơ chế:** Framework đọc `getGenericSuperclass()` hoặc method/field generic metadata để dựng `ParameterizedType`, ví dụ `new TypeReference<List<Order>>() {}`. Token explicit cho phép deserialize đúng element type dù object runtime chỉ là List implementation.

**Pitfall / follow-up Senior:** Erasure vẫn áp dụng bên trong generic code; token không tự validate dữ liệu hay polymorphic subtype an toàn. Cache Type/serializer phải tránh giữ class loader của plugin và public API nên tránh lệ thuộc token của một vendor.

### JAVA-076 [Senior · ⭐ Rất thường gặp] Thiết kế producer–consumer bằng bounded `BlockingQueue` thế nào để có backpressure, nhiều producer/consumer và shutdown không mất hoặc treo task?

**Kết luận:** Queue bounded giới hạn in-flight work; producer `put/offer(timeout)` bị chặn/fail-fast khi đầy, consumer `take/poll` xử lý theo capacity. Shutdown cần protocol riêng, không chỉ interrupt ngẫu nhiên.

**Cơ chế:** Theo dõi số producer hoàn tất rồi enqueue đủ poison pill cho consumers, hoặc dùng executor/latch + shared closed state và poll timeout; stop nhận input, drain theo deadline, sau đó cancel/interrupt cooperative. Mọi task phải có ownership và failure reporting.

**Pitfall / follow-up Senior:** Sentinel phải không trùng dữ liệu và không bị một consumer nuốt hết; producer fail trước khi signal có thể treo hệ thống. Queue capacity, rejection và downstream concurrency phải được tính theo memory/SLO, không chọn tùy ý.

### JAVA-077 [Senior · ⭐ Rất thường gặp] `ThreadLocal` gây leak hoặc truyền nhầm context trong thread pool thế nào; `remove()`, explicit context và scoped value thay đổi thiết kế ra sao?

**Kết luận:** Worker pool sống lâu và tái dùng thread; value còn trong ThreadLocalMap có thể giữ object/class loader hoặc bị request sau đọc nhầm nếu không cleanup.

**Cơ chế:** Entry có key weak nhưng value được giữ mạnh đến lúc map dọn/thread chết; luôn set/restore/remove trong `finally`. Explicit immutable context truyền qua API/executor làm ownership rõ; scoped value (khi JDK/API phù hợp) cung cấp dynamic scope immutable gắn với lexical lifetime.

**Pitfall / follow-up Senior:** `remove()` ở một thread không xử lý task hop sang thread khác; decorator/context-propagation framework cần whitelist để tránh truyền credential quá xa. Virtual thread giảm reuse nhưng hàng loạt value lớn vẫn tốn memory.

### JAVA-078 [Senior · Thường gặp] Default method giúp tiến hóa interface nhưng tạo conflict nào khi nhiều interface hoặc superclass cùng định nghĩa method; Java phân giải và bảo vệ binary compatibility ra sao?

**Kết luận:** Class method thắng interface default; default ở subinterface cụ thể hơn thắng; hai default không liên quan gây compile error và class phải override, có thể gọi `A.super.m()` rõ ràng.

**Cơ chế:** Thêm default method thường cho binary-compatible evolution vì implementation cũ có fallback, khác thêm abstract method. Tuy vậy library version mới có thể tạo conflict với default khác hoặc method tình cờ có cùng signature.

**Pitfall / follow-up Senior:** Binary compatibility không bảo đảm semantic compatibility: default mới có thể đổi invariant/dispatch của client. Giữ default nhỏ, stateless, document contract và chạy compatibility tests với ecosystem implementation.
