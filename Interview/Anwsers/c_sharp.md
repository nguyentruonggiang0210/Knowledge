# Đáp án phỏng vấn C# — Middle & Senior

> Mỗi mục lặp nguyên văn câu hỏi trong `c_sharp.md`. “Kỳ vọng” là dấu hiệu nhận biết độ sâu của câu trả lời, không phải đáp án duy nhất.

## 1. Type system, value/reference semantics và ngôn ngữ

### CS-001 [Middle]

**Câu hỏi:** C# phân biệt value type và reference type như thế nào, và sự khác biệt đó ảnh hưởng ra sao đến phép gán, truyền tham số và cấp phát bộ nhớ?

**Trả lời:** Value type chứa trực tiếp giá trị; phép gán/truyền-by-value sao chép giá trị. Reference type chứa tham chiếu đến object; phép gán sao chép tham chiếu nên hai biến có thể trỏ cùng object. Cả hai mặc định vẫn truyền-by-value; `ref` mới truyền alias của biến. Không nên đồng nhất value type với stack và reference type với heap: field value type có thể nằm trong object trên heap, local có thể được JIT giữ trong register, và object có thể được tối ưu hóa.

**Pitfall/trade-off:** Struct lớn bị copy nhiều; mutable struct dễ tạo bản sao ngoài ý muốn. Class thêm allocation/GC nhưng có identity và polymorphism thuận tiện.

**Kỳ vọng:** Middle nêu đúng copy/reference và parameter passing; Senior tránh quy tắc “struct luôn ở stack”, nói tới layout, boxing và chi phí copy.

### CS-002 [Middle]

**Câu hỏi:** Boxing và unboxing xảy ra khi nào; chúng gây chi phí gì và có thể tránh bằng những kỹ thuật nào?

**Trả lời:** Boxing đóng gói value type vào object/interface tương thích, thường cấp phát object và copy dữ liệu; unboxing kiểm tra đúng boxed type rồi lấy/copy giá trị. Nó xuất hiện khi ép sang `object`, gọi API non-generic, lưu struct vào collection cũ, hoặc dispatch interface trong một số ngữ cảnh. Dùng generic (`List<int>`, `EqualityComparer<T>.Default`), generic constraint và overload kiểu cụ thể để tránh.

**Pitfall/trade-off:** `(long)(object)1` ném `InvalidCastException` vì boxed type là `int`, không áp dụng numeric conversion khi unbox. Đừng tối ưu boxing ở cold path trước khi đo.

**Kỳ vọng:** Middle nhận ra allocation/copy; Senior phát hiện boxing ẩn qua interface, enum, formatting và xác nhận bằng allocation profiler.

### CS-003 [Middle]

**Câu hỏi:** Giải thích các kiểu truyền tham số mặc định, `ref`, `out`, `in` và `ref readonly`; khi nào mỗi kiểu phù hợp?

**Trả lời:** Mặc định sao chép giá trị đối số. `ref` cho phép đọc/ghi biến gốc và biến phải được khởi tạo; `out` bắt buộc callee gán trước khi trả về; `in` truyền readonly reference, hữu ích với struct lớn; `ref readonly` thường là reference trả về/biến chỉ đọc nhằm tránh copy. API phải biểu đạt rõ ownership và mutation.

**Pitfall/trade-off:** `in` với struct nhỏ có thể chậm hơn; gọi member không readonly trên readonly receiver có thể tạo defensive copy. Reference return không được vượt lifetime của storage nguồn.

**Kỳ vọng:** Middle mô tả đúng contract; Senior nói tới defensive copy, escape/lifetime và chỉ tối ưu sau benchmark.

### CS-004 [Senior]

**Câu hỏi:** Nullable reference types hoạt động dựa trên phân tích tĩnh như thế nào; các annotation `?`, toán tử `!` và thuộc tính nullable metadata có giới hạn gì?

**Trả lời:** NRT là hệ thống cảnh báo compile-time dựa trên annotation và flow analysis, không làm reference có runtime representation mới. `string?` cho phép null theo contract; `string` được kỳ vọng non-null; `!` chỉ dập cảnh báo, không kiểm tra runtime. Compiler ghi nullable context/annotation vào metadata để tooling và assembly khác diễn giải. Attributes như `NotNullWhen`, `MemberNotNull`, `MaybeNull` mô tả flow phức tạp.

**Pitfall/trade-off:** Reflection, deserialization, code cũ/oblivious và concurrent mutation vẫn có thể đưa null vào. Bật NRT không thay thế guard/invariant tại boundary.

**Kỳ vọng:** Senior phân biệt annotation với runtime safety, hiểu flow states, generic nullability và chiến lược migrate có kiểm soát.

### CS-005 [Middle]

**Câu hỏi:** So sánh `const`, `readonly` và `static readonly`, đặc biệt về thời điểm gán giá trị, versioning giữa assembly và thread safety.

**Trả lời:** `const` là compile-time constant, ngầm static và bị inline vào assembly gọi. `readonly` là field theo instance, gán tại khai báo/constructor. `static readonly` gán một lần khi type initialization chạy. Readonly ngăn gán lại field sau khởi tạo, không làm object được trỏ tới trở thành immutable.

**Pitfall/trade-off:** Thay giá trị public `const` mà không build lại consumer giữ giá trị cũ; ưu tiên `static readonly` cho giá trị có thể đổi giữa phiên bản. Publication qua type initializer an toàn, nhưng object mutable chứa trong readonly field vẫn cần synchronization.

**Kỳ vọng:** Middle nêu thời điểm gán; Senior nhấn mạnh binary versioning và shallow immutability.

### CS-006 [Senior]

**Câu hỏi:** Hãy giải thích equality trong C#: `ReferenceEquals`, `object.Equals`, `IEquatable<T>`, toán tử `==` và yêu cầu nhất quán với `GetHashCode`.

**Trả lời:** `ReferenceEquals` kiểm tra identity (boxing làm nó không phù hợp cho value type). `object.Equals` là virtual equality contract; `IEquatable<T>` tránh boxing và cho typed equality. `==` là toán tử được resolve tĩnh và có thể overload. Nếu hai object `Equals` nhau thì bắt buộc có cùng hash code; hash phải ổn định trong lúc object nằm trong hash collection. Equality nên reflexive, symmetric, transitive và xử lý null.

**Pitfall/trade-off:** Overload `==` nhưng không override `Equals`/`GetHashCode`, hoặc dùng field mutable trong hash, sẽ phá dictionary/set. Inheritance làm value equality khó vì symmetry.

**Kỳ vọng:** Senior trình bày trọn contract, comparer tùy ngữ cảnh và cách test property-based.

### CS-007 [Senior]

**Câu hỏi:** Variance (`out`, `in`) của interface/delegate generic là gì; vì sao `IEnumerable<string>` gán được cho `IEnumerable<object>` nhưng `List<string>` không gán được cho `List<object>`?

**Trả lời:** Covariance `out T` cho phép kiểu dẫn xuất chuyển sang kiểu cơ sở khi `T` chỉ ở vị trí output; contravariance `in T` đi chiều ngược khi `T` chỉ ở input. `IEnumerable<T>` chỉ sản xuất `T`, nên covariance an toàn. `List<T>` vừa đọc vừa ghi: nếu coi `List<string>` là `List<object>`, ta có thể thêm `new object()` và phá type safety, nên invariant.

**Pitfall/trade-off:** Variance chỉ áp dụng reference conversion và generic interface/delegate, không tự áp dụng cho class hay value type.

**Kỳ vọng:** Senior giải thích bằng tính an toàn khi read/write, không chỉ học thuộc hướng mũi tên.

### CS-008 [Middle]

**Câu hỏi:** `dynamic`, `object` và kiểu suy luận bằng `var` khác nhau ở thời điểm binding, kiểm tra lỗi và hiệu năng như thế nào?

**Trả lời:** `var` vẫn là kiểu tĩnh được compiler suy luận; mọi kiểm tra như khai báo kiểu rõ ràng. `object` là static type `System.Object`, muốn gọi member riêng phải cast/pattern match. `dynamic` trì hoãn member binding đến runtime qua DLR; lỗi thành runtime binder exception và call site có cơ chế cache.

**Pitfall/trade-off:** `dynamic` làm mất refactoring/type safety và thêm overhead; hữu ích tại COM, dữ liệu động hoặc boundary hẹp. `var` không đồng nghĩa dynamic.

**Kỳ vọng:** Middle phân biệt compile-time/runtime; Senior giới hạn dynamic ở adapter boundary và nói tới test/observability.

## 2. Generics và abstraction

### CS-009 [Middle]

**Câu hỏi:** Generics đem lại lợi ích gì so với dùng `object`; CLR hiện thực generic cho value type và reference type khác nhau ra sao?

**Trả lời:** Generics giữ type safety, tránh cast và thường tránh boxing. CLR thường chia sẻ native code cho nhiều instantiation reference type, nhưng tạo specialized code cho value type vì layout/operations khác nhau; JIT vẫn có thể tạo thêm specialization/optimization theo runtime.

**Pitfall/trade-off:** Nhiều value-type instantiation có thể tăng code size; abstraction generic phức tạp có thể khó đọc. Lợi ích cần cân bằng với API usability.

**Kỳ vọng:** Middle nêu type safety/boxing; Senior hiểu code sharing, reification và tác động code size.

### CS-010 [Middle]

**Câu hỏi:** Các generic constraints phổ biến (`class`, `struct`, `notnull`, `unmanaged`, `new()`, base type/interface) có ý nghĩa và giới hạn gì?

**Trả lời:** Constraint giới hạn tập kiểu và mở các operation hợp lệ trong thân generic: reference/value/non-nullable/unmanaged, constructor không tham số công khai, hoặc members từ base/interface. Có quy tắc thứ tự và một số constraint loại trừ nhau. `unmanaged` bảo đảm graph field không chứa managed reference; `notnull` chủ yếu phục vụ nullable analysis.

**Pitfall/trade-off:** `new()` không truyền tham số và không biểu đạt factory policy; `class` khác `class?` trong nullable context. Constraint quá chặt làm giảm khả năng tái sử dụng.

**Kỳ vọng:** Middle biết công dụng; Senior chọn constraint theo capability thực sự cần và hiểu compile-time contract.

### CS-011 [Senior]

**Câu hỏi:** Static abstract interface members giải quyết bài toán generic math như thế nào; chúng khác virtual dispatch thông thường ở đâu?

**Trả lời:** Interface có thể yêu cầu static operators/properties/methods; generic code gọi chúng qua type parameter, ví dụ `where T : INumber<T>`, nên viết thuật toán số học type-safe mà không dynamic/reflection. Dispatch gắn với type argument và static member, không với instance/vtable như virtual method.

**Pitfall/trade-off:** API phức tạp hơn, ecosystem/type support có thể chưa đồng đều và binary compatibility của interface contract cần cân nhắc. Không thể gọi member static abstract qua biến interface thông thường.

**Kỳ vọng:** Senior liên hệ generic math, CRTP-style constraint, compile-time capability và AOT.

### CS-012 [Senior]

**Câu hỏi:** Vì sao không thể trực tiếp khởi tạo `new T()` nếu thiếu constraint, và khi factory delegate thường tốt hơn constraint `new()`?

**Trả lời:** Compiler không biết `T` có constructor khả dụng, nên cần `where T : new()`. Constraint đó chỉ gọi constructor public không tham số và phải đứng cuối danh sách constraint. Factory `Func<T>`/interface factory cho phép dependency, tham số, pooling, async creation, test doubles và tách policy tạo object khỏi thuật toán.

**Pitfall/trade-off:** Delegate có thể thêm indirection/allocation nếu tạo lặp lại; DI/factory quá mức làm thiết kế rườm rà.

**Kỳ vọng:** Senior chọn `new()` cho container/utility đơn giản, factory cho lifecycle hoặc construction có policy.

### CS-013 [Senior]

**Câu hỏi:** Thiết kế một API generic để tránh vừa boxing vừa runtime type checks; bạn sẽ cân nhắc constraint và specialization thế nào?

**Trả lời:** Bắt đầu từ capability cần thiết: constraint theo `IEquatable<T>`, `IComparable<T>`, `unmanaged` hay static abstract interface; dùng `EqualityComparer<T>.Default`, `Span<T>` và generic overload để JIT thấy concrete operations. Chỉ tạo fast path theo type khi profiling chứng minh, cô lập specialization sau API chung và có fallback đúng.

**Pitfall/trade-off:** `typeof(T)` branching lan rộng làm code khó bảo trì; interface call trên unconstrained struct có thể box. Quá nhiều instantiation/specialization tăng code size.

**Kỳ vọng:** Senior trình bày contract trước, benchmark sau, đồng thời cân bằng boxing, inlining và code bloat.

### CS-014 [Middle]

**Câu hỏi:** So sánh interface và abstract class về multiple inheritance, state, versioning API và khả năng kiểm thử.

**Trả lời:** Một type triển khai nhiều interface nhưng chỉ kế thừa một class. Abstract class có state, protected implementation và constructor; interface thiên về capability/contract, dù có default/static members. Interface dễ thay thế bằng test double và giảm coupling; abstract base phù hợp khi các subtype thật sự chia sẻ invariant/implementation.

**Pitfall/trade-off:** Thêm abstract member phá implementer; default interface method giảm nhưng không xóa rủi ro versioning. Base class dễ thành “god class” và fragile hierarchy.

**Kỳ vọng:** Middle nêu khác biệt cơ bản; Senior chọn theo semantic ownership, evolution và composition-over-inheritance.

## 3. Delegate, event, closure và biểu thức lambda

### CS-015 [Middle]

**Câu hỏi:** Delegate multicast hoạt động thế nào; giá trị trả về và exception của invocation list được xử lý ra sao?

**Trả lời:** Delegate multicast giữ invocation list theo thứ tự kết hợp. Gọi trực tiếp sẽ lần lượt gọi handler; với return value, chỉ kết quả handler cuối được trả. Nếu một handler ném exception, invocation dừng và các handler sau không chạy trừ khi caller tự duyệt `GetInvocationList()` và đặt policy lỗi.

**Pitfall/trade-off:** Tự nuốt exception làm mất tín hiệu; gom lỗi cần quyết định tiếp tục, aggregate hay fail-fast. Delegate instances là immutable, phép `+=` tạo delegate mới.

**Kỳ vọng:** Middle biết invocation list; Senior nêu rõ error policy, concurrency khi subscribe/unsubscribe.

### CS-016 [Middle]

**Câu hỏi:** `event` khác một field delegate công khai như thế nào và mẫu publish/subscribe có rủi ro memory leak gì?

**Trả lời:** `event` chỉ cho code ngoài type đăng ký/hủy đăng ký; chỉ publisher được invoke hoặc gán toàn bộ delegate. Publisher giữ strong reference qua delegate tới subscriber; nếu publisher sống lâu hơn, subscriber không được GC.

**Pitfall/trade-off:** Cần unsubscribe theo lifecycle, trả `IDisposable` subscription, weak event khi phù hợp, hoặc dùng broker có ownership rõ. Weak event đổi lấy complexity và đôi khi mất handler sớm.

**Kỳ vọng:** Middle hiểu encapsulation; Senior giải thích object graph, race lúc raise và lifecycle contract.

### CS-017 [Senior]

**Câu hỏi:** Closure được compiler hạ cấp thành gì; việc capture local variable có thể gây allocation và lỗi logic trong loop ra sao?

**Trả lời:** Compiler thường tạo display-class chứa biến bị capture và delegate trỏ tới method trên object đó; nhiều lambda có thể chia sẻ cùng ô biến, không phải snapshot giá trị. Closure thoát scope có thể cấp phát heap. Trong loop, capture biến bị tái sử dụng hoặc biến mutable khiến mọi callback quan sát giá trị cuối/giá trị về sau; tạo local copy mỗi iteration khi cần snapshot.

**Pitfall/trade-off:** Lambda không capture có thể cache; static lambda cấm capture. Đừng giả định compiler luôn allocation—hãy đo phiên bản runtime cụ thể.

**Kỳ vọng:** Senior mô tả lowering, variable lifetime và nhận diện allocation trong hot path.

### CS-018 [Senior]

**Câu hỏi:** So sánh lambda thường, static lambda, local function và expression tree về capture, allocation và khả năng phân tích runtime.

**Trả lời:** Lambda thường có thể capture; static lambda không thể, giúp ngăn closure. Local function có thể generic, recursion và đôi khi compiler tối ưu capture tốt, nhưng vẫn có thể tạo delegate nếu chuyển như value. `Expression<Func<...>>` tạo cây biểu diễn để provider phân tích/translate; compile nó mới tạo executable delegate và có chi phí.

**Pitfall/trade-off:** Không phải mọi cú pháp C# hay method call đều được provider expression-tree dịch. Compile expression lặp lại rất tốn; cần cache theo shape hợp lệ.

**Kỳ vọng:** Senior chọn representation theo nhu cầu execute hay inspect/translate, không dùng expression tree như delegate miễn phí.

### CS-019 [Senior — Tình huống]

**Câu hỏi:** Một singleton publisher giữ event handler của hàng nghìn đối tượng request-scoped khiến bộ nhớ tăng liên tục; hãy chẩn đoán và đề xuất cách sửa an toàn.

**Trả lời:** Heap dump sẽ cho retention path từ GC root singleton → delegate invocation list → target subscriber. Sửa ưu tiên: subscription trả token `IDisposable` và scope luôn dispose; hoặc chuyển sang mediator/channel không lưu subscriber theo request. Weak event chỉ dùng khi semantics cho phép handler biến mất. Khi raise, copy delegate vào local (`handler?.Invoke`) hoặc dùng add/remove accessor thread-safe tùy yêu cầu.

**Pitfall/trade-off:** Finalizer không phải cơ chế unsubscribe đáng tin; chỉ unsubscribe khi request thành công sẽ vẫn leak ở exception path. Weak reference có thể che lỗi lifecycle.

**Kỳ vọng:** Senior chứng minh bằng retention graph, sửa ownership và bổ sung load/lifecycle test.

## 4. Collections và LINQ

### CS-020 [Middle]

**Câu hỏi:** Deferred execution của LINQ là gì; khi nào query được thực thi lại và khi nào nên materialize bằng `ToList`/`ToArray`?

**Trả lời:** Phần lớn operator trả pipeline chưa chạy; enumeration mới đọc source. Mỗi lần enumerate thường chạy lại và thấy trạng thái source hiện tại. Materialize khi cần snapshot, enumerate nhiều lần, đóng resource trước khi rời boundary, hoặc tránh query từ xa lặp lại.

**Pitfall/trade-off:** Materialize sớm tăng memory và mất streaming; trì hoãn quá lâu có thể truy cập disposed context, lặp side effect hoặc phát nhiều database query.

**Kỳ vọng:** Middle giải thích deferred execution; Senior chủ động xác định ownership, lifetime và số lần enumeration.

### CS-021 [Middle]

**Câu hỏi:** So sánh `IEnumerable<T>`, `IQueryable<T>` và `IAsyncEnumerable<T>` về nơi thực thi, biểu diễn query và streaming.

**Trả lời:** `IEnumerable<T>` chạy delegate trong process khi enumerate. `IQueryable<T>` xây expression tree để provider dịch và thường chạy ở remote store; support tùy provider. `IAsyncEnumerable<T>` pull từng phần tử bất đồng bộ qua `MoveNextAsync`, phù hợp streaming I/O và hỗ trợ cancellation qua `WithCancellation`/enumerator token.

**Pitfall/trade-off:** Chuyển sang `AsEnumerable` làm phần sau chạy client-side; expose `IQueryable` qua layer làm rò provider/query policy. Async streaming vẫn có thể buffer ở operator/transport.

**Kỳ vọng:** Middle phân biệt ba contract; Senior nói tới translation boundary, lifetime connection và backpressure hạn chế.

### CS-022 [Senior]

**Câu hỏi:** Những toán tử LINQ nào có thể stream và toán tử nào phải buffer toàn bộ dữ liệu; điều này tác động thế nào đến độ trễ và bộ nhớ?

**Trả lời:** `Where`, `Select`, `Take` thường stream; `OrderBy`, `GroupBy` và một số set operation phải đọc/buffer đáng kể trước khi có kết quả (implementation/provider có thể khác). `Reverse` thường buffer; `Distinct` stream output nhưng giữ set đã thấy. Buffering tăng time-to-first-item và memory O(n), trong khi streaming giữ memory nhỏ và hỗ trợ early termination.

**Pitfall/trade-off:** Source remote có execution plan khác LINQ-to-Objects; không suy luận chỉ từ tên operator. `Count` có thể tối ưu nếu collection/provider hỗ trợ.

**Kỳ vọng:** Senior phân tích theo operator state, cardinality và provider thực tế.

### CS-023 [Middle — Code review]

**Câu hỏi:** Đoạn code gọi `source.Where(predicate).Count() > 0` có vấn đề gì và nên thay bằng gì trong từng loại source?

**Trả lời:** Với LINQ-to-Objects, `Count` duyệt hết phần tử phù hợp, còn `Any(predicate)` dừng ở kết quả đầu. Với `IQueryable`, `Any` thường dịch thành `EXISTS`, tốt hơn đếm toàn bộ; vẫn kiểm tra SQL/query plan của provider. Nếu cần chính xác số lượng cho logic khác thì tính một lần, không gọi cả `Any` lẫn `Count`.

**Pitfall/trade-off:** Một số collection có `Count` O(1), nhưng thêm predicate mất lợi thế. Predicate có side effect sẽ thay đổi hành vi khi short-circuit—bản thân side effect trong query là mùi thiết kế.

**Kỳ vọng:** Middle đề xuất `Any`; Senior phân biệt local/remote và kiểm tra generated SQL.

### CS-024 [Senior]

**Câu hỏi:** `GroupBy`, `Join` và `ToLookup` có đặc điểm độ phức tạp và lifetime dữ liệu gì; khi nào cần custom comparer?

**Trả lời:** LINQ-to-Objects thường xây lookup hash O(n) memory: `GroupBy` deferred ở mức gọi nhưng khi enumerate phải tổ chức source; `ToLookup` materialize ngay và reusable; `Join` thường index inner rồi stream outer. Custom `IEqualityComparer<TKey>` cần khi equality miền nghiệp vụ khác mặc định, như key không phân biệt hoa thường/canonical form.

**Pitfall/trade-off:** Comparer phải có `Equals`/`GetHashCode` nhất quán; key mutable phá lookup. Với dữ liệu rất lớn, sort/merge, database join hoặc streaming partition có thể phù hợp hơn.

**Kỳ vọng:** Senior nêu complexity, hướng build/probe và lifetime, không chỉ cú pháp.

### CS-025 [Senior — Tình huống]

**Câu hỏi:** Một pipeline LINQ chạy chậm trên hàng triệu phần tử và tạo nhiều allocation; bạn sẽ đo, xác định nguyên nhân và tối ưu theo thứ tự nào?

**Trả lời:** Lập benchmark đại diện và profile CPU/allocation trước; kiểm tra multiple enumeration, boxing, closure, materialization, ordering/grouping, comparer và cardinality. Sau đó giảm dữ liệu sớm, fuse logic/hạn chế iterator ở hot path, dùng collection/count phù hợp, cache invariant, hoặc chuyển sang loop/Span khi số đo chứng minh. Giữ test tính đúng đắn trước và sau.

**Pitfall/trade-off:** Viết lại LINQ thành loop có thể tăng tốc nhưng giảm clarity; database query phải tối ưu ở SQL/index trước micro-optimization client.

**Kỳ vọng:** Senior đưa baseline, giả thuyết, metric và regression benchmark thay vì đoán.

## 5. Async/await và lập trình bất đồng bộ

### CS-026 [Middle]

**Câu hỏi:** Compiler biến một phương thức `async` thành state machine như thế nào và phần code trước `await` chạy ở đâu?

**Trả lời:** Compiler tạo state machine với state, locals cần giữ, builder và continuation. Method bắt đầu chạy đồng bộ trên thread gọi cho tới await đầu chưa hoàn tất; nếu awaitable đã hoàn tất, có thể tiếp tục đồng bộ. Khi chưa hoàn tất, continuation được đăng ký và method trả Task/ValueTask; sau đó resume theo awaiter/context rules.

**Pitfall/trade-off:** Gọi async method không tự chuyển sang background thread. Exception trước/sau await thường được ghi vào returned task (trừ lỗi argument có thể chủ động kiểm tra trong wrapper non-async).

**Kỳ vọng:** Middle hiểu không có “async thread” mặc định; Senior nói đến fast path, builder và allocation.

### CS-027 [Middle]

**Câu hỏi:** Phân biệt concurrency, parallelism và asynchronous I/O; vì sao `Task.Run` không phải cách mặc định để làm I/O bất đồng bộ?

**Trả lời:** Concurrency là nhiều công việc cùng tiến triển; parallelism là thật sự chạy đồng thời trên nhiều core; async I/O trả thread về pool trong lúc kernel/device chờ. `Task.Run` chỉ đưa blocking work lên thread-pool, không biến I/O sync thành non-blocking và có thể gây starvation dưới tải server. Dùng API I/O async thật; dùng `Task.Run` chủ yếu cho CPU-bound ở caller phù hợp (thường UI), không che blocking trong server.

**Pitfall/trade-off:** Parallelize CPU quá mức tranh core/cache; async có overhead cho tác vụ luôn rất nhỏ.

**Kỳ vọng:** Middle phân biệt CPU/I/O; Senior liên hệ throughput, scheduler và workload model.

### CS-028 [Senior]

**Câu hỏi:** `SynchronizationContext`, `TaskScheduler` và `ConfigureAwait(false)` ảnh hưởng thế nào đến continuation trong UI, ASP.NET cũ và ASP.NET Core?

**Trả lời:** `await` mặc định capture context/scheduler thích hợp để continuation quay lại môi trường đó. UI cần context để chạm control; ASP.NET cổ điển có request context; ASP.NET Core mặc định không có custom `SynchronizationContext`, nên thường continuation chạy thread-pool. `ConfigureAwait(false)` tránh capture cho await đó, hữu ích trong library, nhưng không bảo đảm thread cụ thể và không “làm async nhanh” trong mọi trường hợp.

**Pitfall/trade-off:** Sau `false`, code UI không được cập nhật control trực tiếp; `AsyncLocal`/ExecutionContext vẫn có thể flow. App code cần context có thể giữ mặc định.

**Kỳ vọng:** Senior phân biệt SynchronizationContext, scheduler và ExecutionContext; không áp dụng `false` máy móc.

### CS-029 [Middle]

**Câu hỏi:** Vì sao `.Result`/`.Wait()` có thể gây deadlock hoặc thread starvation; nguyên tắc “async all the way” giải quyết ra sao?

**Trả lời:** Thread chặn chờ task trong khi continuation cần chính context/thread đó tạo deadlock (điển hình UI/ASP.NET cũ). Trên server, nhiều sync-over-async còn chiếm thread-pool, làm continuation thiếu thread và throughput sụp. Để caller async và `await` xuyên toàn call chain, chỉ bridge sync/async ở boundary được thiết kế rõ.

**Pitfall/trade-off:** `ConfigureAwait(false)` có thể tránh một số context deadlock nhưng không chữa starvation hay code blocking khác. `GetAwaiter().GetResult()` chỉ unwrap exception tốt hơn, vẫn block.

**Kỳ vọng:** Middle mô tả deadlock; Senior tách deadlock khỏi starvation và đề xuất migration boundary.

### CS-030 [Middle]

**Câu hỏi:** Khi nào dùng `Task`, `ValueTask`, `async void` và `IAsyncEnumerable<T>`; các contract và bẫy chính là gì?

**Trả lời:** `Task` là lựa chọn mặc định, có thể await nhiều lần và compose tốt. `ValueTask` dành cho hot path thường hoàn tất đồng bộ sau benchmark; thường chỉ consume một lần, không nên lưu/await nhiều lần nếu backing source hạn chế—có thể gọi `AsTask`. `async void` chỉ hợp với event handler vì caller không await/catch được. `IAsyncEnumerable<T>` stream nhiều kết quả theo thời gian.

**Pitfall/trade-off:** ValueTask tăng kích thước state/cognitive cost; async iterator phải dispose enumerator và truyền cancellation. Exception async void đi vào context/unhandled policy.

**Kỳ vọng:** Middle chọn đúng type; Senior nêu contract consumption và lý do đo trước ValueTask.

### CS-031 [Senior]

**Câu hỏi:** Cancellation nên được thiết kế và truyền xuyên suốt API thế nào; `OperationCanceledException`, timeout và linked token khác nhau ra sao?

**Trả lời:** Nhận `CancellationToken` ở public async boundary, truyền nó xuống mọi operation hỗ trợ, kiểm tra ở loop CPU đủ thưa và chỉ dừng tại điểm trạng thái nhất quán. Cancellation là cooperative; `OperationCanceledException`/`TaskCanceledException` biểu thị kết quả canceled khi token liên quan được kích hoạt. Timeout là policy thời gian; có thể dùng `CancelAfter` hoặc API timeout riêng. Linked token hợp nhất caller cancellation, shutdown và timeout nhưng phải dispose source.

**Pitfall/trade-off:** Không biến cancellation thành lỗi 500 hay retry vô điều kiện; sau khi commit side effect cần trả semantics rõ. Đăng ký callback phải nhanh, thread-safe và được dispose.

**Kỳ vọng:** Senior phân biệt cancellation, deadline, timeout; thiết kế idempotency và điểm không thể hủy.

### CS-032 [Senior]

**Câu hỏi:** `Task.WhenAll` xử lý kết quả và nhiều exception như thế nào; làm sao thu thập lỗi mà vẫn giữ semantics fail-fast hoặc best-effort mong muốn?

**Trả lời:** `WhenAll` hoàn tất khi tất cả task hoàn tất; task tổng hợp fault nếu có lỗi, canceled nếu không fault nhưng có cancel. `await` ném một exception đại diện, còn `all.Exception?.InnerExceptions` chứa tập lỗi đã aggregate. Muốn best-effort, bọc từng operation thành result/error rồi await all. Muốn fail-fast thực tế, dùng token chung và hủy phần còn lại khi task đầu fault, nhưng vẫn quan sát tất cả task để tránh lỗi thất lạc.

**Pitfall/trade-off:** `WhenAll` không tự giới hạn concurrency và không tự hủy sibling. Fail-fast không thể rollback side effect đã xảy ra.

**Kỳ vọng:** Senior đặt rõ failure semantics, cancellation và observability cho từng item.

### CS-033 [Senior — Code review]

**Câu hỏi:** Đoạn `items.Select(async x => await SaveAsync(x))` nhưng không await kết quả có lỗi gì; hãy nêu cách sửa có và không giới hạn concurrency.

**Trả lời:** `Select` deferred nên nếu không enumerate, `SaveAsync` chưa chạy; nếu enumerate mà bỏ tasks, caller hoàn tất sớm và exception không được quan sát. Không giới hạn: `await Task.WhenAll(items.Select(x => SaveAsync(x)))`. Có giới hạn: `Parallel.ForEachAsync` với `MaxDegreeOfParallelism`, `SemaphoreSlim` trong helper có `finally`, hoặc channel/worker pool; luôn truyền token và xác định policy lỗi.

```csharp
await Parallel.ForEachAsync(items,
    new ParallelOptions { MaxDegreeOfParallelism = 16, CancellationToken = ct },
    async (item, token) => await SaveAsync(item, token));
```

**Pitfall/trade-off:** Giới hạn tối ưu phụ thuộc downstream; thứ tự kết quả và thread safety của `SaveAsync` phải được làm rõ.

**Kỳ vọng:** Senior phát hiện cả deferred execution, lost exceptions và unbounded concurrency.

### CS-034 [Senior — Tình huống]

**Câu hỏi:** Một API fan-out 5.000 lời gọi HTTP bằng `Task.WhenAll` gây cạn socket và tăng tail latency; hãy thiết kế lại cơ chế giới hạn, hủy và retry.

**Trả lời:** Dùng `HttpClient`/handler được tái sử dụng, giới hạn in-flight theo năng lực upstream bằng `SemaphoreSlim`, channel workers hoặc resilience bulkhead; ưu tiên batch nếu API hỗ trợ. Áp deadline toàn request và per-attempt timeout, truyền token; retry có backoff+jitter chỉ cho lỗi transient và operation idempotent, tôn trọng `Retry-After`. Circuit breaker/load shedding ngăn khuếch đại lỗi; thu metric p95/p99, queue time, attempts và saturation.

**Pitfall/trade-off:** Retry nhân tải và tail latency; concurrency quá thấp giảm throughput, quá cao gây queue ở downstream. Cancellation không bảo đảm server chưa thực hiện side effect.

**Kỳ vọng:** Senior dùng capacity measurement để điều chỉnh, có fairness, idempotency và overload policy.

## 6. Threading, synchronization và concurrency

### CS-035 [Middle]

**Câu hỏi:** `lock` bảo đảm điều gì về mutual exclusion và memory visibility; vì sao không nên lock trên `this`, string hoặc object công khai?

**Trả lời:** Cùng một lock object bảo đảm một thread vào critical section tại một thời điểm và tạo acquire/release memory barriers để write trước unlock được thread sau lock thấy. Lock object public, `this`, `typeof(T)` hoặc interned string có thể bị code ngoài khóa cùng, gây deadlock/contention không kiểm soát. Dùng private readonly gate với scope nhỏ.

**Pitfall/trade-off:** `lock` là reentrant nhưng không await được; không giữ lock qua I/O/callback. Lock khác nhau không bảo vệ cùng invariant.

**Kỳ vọng:** Middle biết mutual exclusion; Senior nói tới happens-before, lock identity và invariant.

### CS-036 [Senior]

**Câu hỏi:** So sánh `Monitor`, `SemaphoreSlim`, `Mutex`, `ReaderWriterLockSlim`, `SpinLock` và primitive dựa trên `Interlocked`.

**Trả lời:** `lock` hạ về `Monitor`, phù hợp mutual exclusion trong process, reentrant và synchronous. `SemaphoreSlim` giới hạn N và có `WaitAsync`; `Mutex` là kernel primitive có thể cross-process nhưng đắt. `ReaderWriterLockSlim` hữu ích khi read dài/nhiều và write hiếm, song overhead/starvation cần đo. `SpinLock` chỉ cho critical section cực ngắn khi block đắt. `Interlocked` làm atomic read-modify-write cho state đơn giản/lock-free algorithm được chứng minh.

**Pitfall/trade-off:** Chọn primitive theo semantics, không theo độ “nhanh”. Lock-free vẫn có ABA, livelock và khó chứng minh; semaphore release sai làm vượt capacity.

**Kỳ vọng:** Senior đánh giá contention duration, sync/async, process boundary và fairness.

### CS-037 [Senior]

**Câu hỏi:** `volatile` trong C# bảo đảm và không bảo đảm điều gì; khi nào cần `Interlocked` hoặc lock thay thế?

**Trả lời:** Volatile read/write tạo ordering/visibility phù hợp và ngăn một số reordering, nhưng không làm compound operation như `x++`, check-then-act hay invariant nhiều field thành atomic. Dùng `Volatile.Read/Write` cho flag/publication protocol đơn giản đã hiểu rõ; `Interlocked` cho atomic increment/exchange/CAS; lock cho nhiều bước hoặc nhiều biến cần nhất quán.

**Pitfall/trade-off:** Visibility không đồng nghĩa atomic transaction. Double-checked locking cần publication đúng; đọc nhiều field volatile vẫn có thể thấy snapshot lệch.

**Kỳ vọng:** Senior diễn đạt bằng atomicity/order/happens-before và tránh xem volatile là “lock nhẹ”.

### CS-038 [Senior]

**Câu hỏi:** Race condition, deadlock, livelock, starvation và thread-pool starvation khác nhau thế nào; bạn nhận diện chúng từ triệu chứng nào?

**Trả lời:** Race là kết quả phụ thuộc interleaving; deadlock là vòng chờ không tiến triển; livelock vẫn chạy/đổi trạng thái nhưng không hoàn thành; starvation là một tác vụ không được tài nguyên công bằng; thread-pool starvation là worker bị block/bận khiến work/continuation xếp hàng. Dùng stress test, dump stacks/wait graph, runtime counters (thread count, queue length), contention trace và timeline để phân biệt.

**Pitfall/trade-off:** Tăng thread chỉ che blocking và tăng context switch. Race biến mất dưới debugger không có nghĩa đã sửa.

**Kỳ vọng:** Senior nối triệu chứng với bằng chứng, tái hiện và invariant vi phạm.

### CS-039 [Senior — Code review]

**Câu hỏi:** Một method giữ `lock` rồi gọi API bên ngoài hoặc chạy callback của người dùng; rủi ro là gì và nên tái cấu trúc thế nào?

**Trả lời:** External code có latency không giới hạn, có thể re-enter, lấy lock khác hoặc ném lỗi, làm critical section dài/deadlock. Dưới lock chỉ validate/cập nhật state và chụp snapshot/callback list; nhả lock rồi thực hiện I/O/callback. Nếu cần commit theo kết quả, dùng state machine/version check, queue single-consumer hoặc transaction phù hợp thay vì giữ monitor.

**Pitfall/trade-off:** Nhả lock tạo khoảng thời gian state đổi; cần xác định linearization point và xử lý optimistic conflict. Copy callback list tốn allocation nhưng cô lập contention.

**Kỳ vọng:** Senior bảo toàn invariant khi di chuyển side effect ra ngoài lock, không chỉ thu nhỏ block một cách cơ học.

### CS-040 [Senior]

**Câu hỏi:** So sánh `ConcurrentDictionary`, immutable collections và copy-on-write cho trạng thái đọc nhiều ghi ít; compound operation cần xử lý ra sao?

**Trả lời:** `ConcurrentDictionary` hỗ trợ concurrent per-key operations; dùng `GetOrAdd`, `AddOrUpdate`, `TryUpdate` thay check-then-act rời rạc, nhưng factory có thể chạy nhiều lần nên phải an toàn. Immutable collection tạo snapshot, update bằng cấu trúc chia sẻ và publish atomically; reader không khóa. Copy-on-write đơn giản và đọc rất nhanh khi tập nhỏ/ghi cực hiếm nhưng mỗi write có thể O(n).

**Pitfall/trade-off:** Thread-safe collection không làm workflow nhiều key atomic. Cần lock/transaction/versioned snapshot nếu invariant trải nhiều operation.

**Kỳ vọng:** Senior chọn theo read/write ratio, snapshot semantics, allocation và atomic boundary.

## 7. Memory, Span và quản lý tài nguyên

### CS-041 [Middle]

**Câu hỏi:** GC quản lý managed memory nhưng vì sao vẫn có memory leak; hãy nêu các GC root thường giữ object ngoài ý muốn.

**Trả lời:** GC chỉ thu object không còn reachable; leak managed là object không còn hữu ích nhưng vẫn có đường từ root. Root thường gồm static field/singleton cache, thread/local đang sống, event publisher, timer/callback, GCHandle, task/closure và finalizer queue. Cache không giới hạn hoặc key/value retention cũng là nguồn phổ biến.

**Pitfall/trade-off:** Working set cao chưa chắc leak; GC giữ segment để tái dùng. So sánh heap snapshot và retention path sau full GC thay vì nhìn RAM đơn lẻ.

**Kỳ vọng:** Middle hiểu reachability; Senior dùng dominator/retention graph để tìm owner và lifecycle sai.

### CS-042 [Middle]

**Câu hỏi:** Mẫu `IDisposable`/`using` dùng để giải phóng tài nguyên gì; finalizer và `SafeHandle` đóng vai trò nào?

**Trả lời:** Dispose giải phóng deterministic các resource có lifetime cần đóng: handle, stream, connection, registration hoặc object sở hữu disposable khác. `using` hạ thành `try/finally`; `await using` cho `IAsyncDisposable`. Finalizer là fallback không xác định thời điểm cho unmanaged resource; ưu tiên bọc handle bằng `SafeHandle`, để runtime xử lý critical finalization và class thường chỉ dispose SafeHandle.

**Pitfall/trade-off:** Dispose nên idempotent; không dùng object sau dispose. Finalizer làm object sống lâu hơn và tốn GC; không thêm nếu không trực tiếp sở hữu unmanaged resource.

**Kỳ vọng:** Middle dùng using đúng; Senior trình bày ownership, dispose pattern kế thừa và SafeHandle.

### CS-043 [Senior]

**Câu hỏi:** `Span<T>`/`ReadOnlySpan<T>` là gì, vì sao là `ref struct`, và những nơi nào không được phép lưu hoặc truyền chúng?

**Trả lời:** Span là view liên tục `(reference, length)` trên array, stack, native memory hoặc slice mà không copy. Là `ref struct` để compiler thực thi stack-only/lifetime safety: không boxing, không field của class/struct thường, không qua interface/object, không capture bởi lambda và bị hạn chế qua `await`/`yield` khi có thể sống qua suspension. `ReadOnlySpan` ngăn ghi qua view, không bảo đảm backing storage bất biến.

**Pitfall/trade-off:** Trả span chỉ an toàn khi backing storage còn sống; span từ stackalloc không được escape. API async thường dùng `Memory<T>`.

**Kỳ vọng:** Senior giải thích escape safety, slicing O(1) và lifetime chứ không chỉ “nhanh hơn array”.

### CS-044 [Senior]

**Câu hỏi:** So sánh `Span<T>`, `Memory<T>`, array, `ArraySegment<T>` và `ReadOnlySequence<T>` khi thiết kế API parsing/streaming.

**Trả lời:** Array sở hữu storage liên tục; `ArraySegment` là view array truyền thống. Span là view sync stack-only, tối ưu parser hot path. Memory là view có thể lưu trên heap và đi qua async, lấy `.Span` khi xử lý đồng bộ. `ReadOnlySequence<T>` biểu diễn một hoặc nhiều segment, phù hợp pipelines/network khi dữ liệu không contiguous và tránh copy.

**Pitfall/trade-off:** Ép sequence về array phá zero-copy; parser sequence phải xử lý token băng qua segment. Ownership/lifetime backing buffer phải ghi rõ, nhất là buffer pool.

**Kỳ vọng:** Senior chọn abstraction từ lifetime, contiguity, sync/async và ownership.

### CS-045 [Senior]

**Câu hỏi:** `stackalloc`, object pooling và `ArrayPool<T>` giúp giảm allocation thế nào; chúng có rủi ro an toàn và lifetime gì?

**Trả lời:** `stackalloc` cấp vùng nhỏ theo stack/frame, không tạo áp lực GC; cần giới hạn kích thước và tránh trong loop gây stack overflow. Pool tái sử dụng object/array để giảm allocation ở hot path; thuê trong `try`, trả trong `finally`, không giữ reference sau trả. Array thuê có thể lớn hơn yêu cầu và chứa dữ liệu cũ.

**Pitfall/trade-off:** Pool thêm contention, retained memory và use-after-return/data leak; xóa vùng nhạy cảm trước khi trả. Chỉ pool object đắt và có reset đúng, dựa trên benchmark.

**Kỳ vọng:** Senior nói rõ ownership protocol, security clearing và ngưỡng stack/pool.

### CS-046 [Senior — Code review]

**Câu hỏi:** Một method thuê buffer từ `ArrayPool<byte>.Shared`, trả về sớm khi lỗi và trả buffer cho pool mà không xóa; hãy chỉ ra mọi vấn đề có thể xảy ra.

**Trả lời:** Early return/exception có thể bỏ `Return`, gây giảm hiệu quả pool; cần `try/finally`. Nếu dữ liệu nhạy cảm, không clear làm tenant sau đọc được bytes cũ; dùng `CryptographicOperations.ZeroMemory` vùng đã dùng hoặc `Return(clearArray: true)` theo threat model. Không được trả buffer rồi tiếp tục dùng/return view trỏ tới nó; xử lý theo requested length, không theo toàn `Length`; tránh double-return.

```csharp
var buffer = ArrayPool<byte>.Shared.Rent(size);
try { return Process(buffer.AsSpan(0, size)); }
finally {
    CryptographicOperations.ZeroMemory(buffer.AsSpan(0, size));
    ArrayPool<byte>.Shared.Return(buffer);
}
```

**Pitfall/trade-off:** `Process` trong ví dụ phải trả kết quả không tham chiếu buffer. Clear toàn array tốn CPU nhưng có thể bắt buộc vì bảo mật.

**Kỳ vọng:** Senior phát hiện leak-pool, stale data, wrong length, ownership và escape.

### CS-047 [Senior]

**Câu hỏi:** Pinning, unsafe code và blittable types liên quan thế nào đến interop và hiệu năng GC; khi nào pinning dài hạn đặc biệt nguy hiểm?

**Trả lời:** Pinning ngăn GC di chuyển object để native code dùng địa chỉ ổn định; unsafe/fixed hoặc `GCHandle` cung cấp pointer. Blittable type có representation managed/unmanaged tương thích nên marshal trực tiếp hơn. Pin lâu, nhất là object nhỏ trong moving generations, tạo fragmentation và cản compaction; vùng pinned object heap/buffer unmanaged có thể phù hợp cho lifetime dài có chủ ý.

**Pitfall/trade-off:** Pointer vượt lifetime pin gây memory corruption; layout, alignment và endianness phải xác định. Copy đôi khi nhanh/an toàn hơn pinning kéo dài.

**Kỳ vọng:** Senior cân bằng pin-vs-copy, lifetime, GC generation và ABI correctness.

## 8. Records, immutability và pattern matching

### CS-048 [Middle]

**Câu hỏi:** So sánh `record class`, `record struct`, class và struct thường về equality, mutability, copy và inheritance.

**Trả lời:** Record mặc định cung cấp value-based equality, `ToString`, deconstruction và `with`. `record class` là reference type, mặc định positional properties init-only và hỗ trợ record inheritance; `record struct` là value type và mặc định có thể mutable trừ `readonly record struct`. Class thường mặc định reference equality; struct thường có value equality nhưng có thể kém tối ưu nếu không implement.

**Pitfall/trade-off:** `with` là shallow copy; collection/reference member vẫn chia sẻ. Struct lớn tốn copy; record equality qua inheritance có semantics cần xem kỹ.

**Kỳ vọng:** Middle nêu equality/copy; Senior nói shallow immutability, hash stability và hierarchy.

### CS-049 [Senior]

**Câu hỏi:** `init`, `required` và constructor validation phối hợp thế nào để tạo immutable object vẫn bảo đảm invariant?

**Trả lời:** `init` giới hạn gán property vào object initialization/construction nhưng không tự validate; `required` buộc caller khởi tạo theo compile-time contract nhưng không bảo đảm non-null/runtime reflection. Invariant mạnh nên nằm trong constructor/factory nhận đủ dữ liệu, validate rồi tạo object; dùng private init/set khi cần. `SetsRequiredMembers` chỉ nói với compiler và phải dùng thận trọng.

**Pitfall/trade-off:** Object initializer có thể quan sát trạng thái chưa hoàn chỉnh trong setter/init và deserializer có thể bypass. `with` có thể tạo tổ hợp vi phạm invariant nếu từng property phụ thuộc nhau.

**Kỳ vọng:** Senior phân biệt ergonomic initialization với invariant enforcement và thiết kế serialization boundary.

### CS-050 [Middle]

**Câu hỏi:** Property, positional, relational, logical và list pattern giúp mô hình hóa branching ra sao; exhaustiveness có được compiler bảo đảm hoàn toàn không?

**Trả lời:** Pattern cho phép destructure và kiểm tra shape/value trong `is`/`switch`: property/positional đọc thành phần, relational so ngưỡng, logical kết hợp, list kiểm tra sequence shape/slice. Compiler có thể cảnh báo non-exhaustive cho nhiều miền hữu hạn/nullability, nhưng open class hierarchy, guards và dữ liệu runtime khiến không phải lúc nào cũng chứng minh đầy đủ; switch expression có thể ném nếu không match.

**Pitfall/trade-off:** Pattern quá lồng khó đọc và có thể gọi property có logic nhiều lần; ưu tiên domain method khi rule phức tạp.

**Kỳ vọng:** Middle dùng pattern đúng; Senior hiểu exhaustiveness limitation và ordering/subsumption.

### CS-051 [Senior — Tình huống]

**Câu hỏi:** Dùng record làm key của dictionary nhưng một property thành phần bị mutate sau khi insert; điều gì xảy ra và thiết kế nào tránh lỗi?

**Trả lời:** Hash bucket được chọn từ hash lúc insert. Nếu member tham gia equality/hash bị mutate, lookup bằng cùng object hoặc giá trị tương đương có thể thất bại, remove không tìm thấy và dictionary có trạng thái logic hỏng. Key phải immutable sâu đối với phần tham gia equality: dùng primitive/immutable value object, defensive copy collection, hoặc custom comparer chỉ dùng stable identity.

**Pitfall/trade-off:** `init`/record chỉ tạo shallow immutability; một `List<T>` property vẫn đổi được. Không sửa bằng cách tính hash ngẫu nhiên/cached nếu equality vẫn thay đổi.

**Kỳ vọng:** Senior giải thích bucket invariant và thiết kế stable key, kèm regression test.

## 9. Exception và reliability

### CS-052 [Middle]

**Câu hỏi:** Khi nào nên throw exception, trả result type hoặc dùng `TryXxx`; vì sao exception không nên dùng cho control flow bình thường?

**Trả lời:** Throw cho thất bại bất thường/vi phạm contract mà caller không luôn dự kiến tại mỗi lần gọi. `TryXxx` phù hợp failure dự kiến, thường xuyên và chỉ cần success/value; result type phù hợp domain errors cần dữ liệu, pattern match và compose. Exception có stack capture/unwind, làm flow ẩn và tốn kém khi xảy ra thường xuyên.

**Pitfall/trade-off:** Result khắp nơi có thể rườm rà và dễ bị bỏ qua; exception ở boundary cần map sang status/domain response, không lộ internals.

**Kỳ vọng:** Middle phân loại expected/unexpected; Senior xây error model nhất quán, observability và retry semantics.

### CS-053 [Middle]

**Câu hỏi:** `throw;` khác `throw ex;` thế nào; exception filter và inner exception hỗ trợ chẩn đoán ra sao?

**Trả lời:** Trong catch, `throw;` rethrow giữ stack gốc; `throw ex;` đặt lại điểm stack và che nguồn lỗi. Khi đổi abstraction, bọc bằng exception có ý nghĩa và truyền `ex` làm InnerException. Filter `catch (X ex) when (...)` chọn handler mà không unwind trước khi đánh giá, hữu ích cho logging có điều kiện/policy mà vẫn giữ stack.

**Pitfall/trade-off:** Không log rồi rethrow ở mọi layer gây log trùng; filter không nên có side effect/throw. Không đưa secret/PII vào message/data.

**Kỳ vọng:** Middle biết giữ stack; Senior chọn layer chịu trách nhiệm translate/log và bảo toàn context.

### CS-054 [Senior]

**Câu hỏi:** Hãy thiết kế exception policy cho một thư viện: taxonomy, wrapping, retryability, dữ liệu nhạy cảm và tương thích phiên bản cần xử lý thế nào?

**Trả lời:** Public exception taxonomy nhỏ, ổn định, gắn với abstraction; dùng standard exceptions cho argument/state, exception riêng khi caller cần catch có ý nghĩa. Wrap implementation exception với inner exception, correlation/context không nhạy cảm; tài liệu hóa điều kiện, partial side effect và retryability (hoặc mã lỗi typed). Cancellation phải giữ semantics. Thêm subtype thường tương thích hơn đổi loại exception đã công bố.

**Pitfall/trade-off:** Catch `Exception` rồi đổi hết thành một loại làm mất chẩn đoán; public message không phải contract máy đọc và phải redact credentials/queries. Retry nên do policy layer quyết định dựa trên idempotency.

**Kỳ vọng:** Senior cân bằng abstraction, diagnosability, security và binary/behavioral compatibility.

## 10. Reflection, code generation và performance

### CS-055 [Middle]

**Câu hỏi:** Reflection có những chi phí và rủi ro nào; caching metadata/delegate cải thiện hot path ra sao?

**Trả lời:** Lookup metadata, binder, argument array, invoke và boxing có thể đắt hơn call trực tiếp; sai member/signature thành runtime error. Reflection còn khó trimming/AOT và có thể phá encapsulation. Cache `MemberInfo` theo type và tạo typed delegate/expression một lần để giảm lookup/invoke overhead; cache cần bounded/lifetime-aware.

**Pitfall/trade-off:** Cache keyed bằng `Type` có thể giữ collectible AssemblyLoadContext. Không cache exception/sai kết quả vĩnh viễn nếu assembly/config thay đổi.

**Kỳ vọng:** Middle biết cache lookup; Senior nói tới delegate fast path, unloadability, trimming annotations và benchmark.

### CS-056 [Senior]

**Câu hỏi:** Expression tree, compiled delegate, IL emit và source generator khác nhau về thời điểm sinh code, AOT compatibility và khả năng debug thế nào?

**Trả lời:** Expression tree là runtime data model có thể inspect/translate; compile thành delegate tốn startup và dynamic code có thể bị hạn chế trong AOT. Delegate viết sẵn dễ debug và tối ưu. IL emit linh hoạt nhất runtime nhưng phức tạp, khó verify/debug và không hợp Native AOT. Source generator sinh C# lúc build, nhanh runtime/AOT-friendly và IDE thấy code/diagnostic, đổi lại build complexity và chỉ biết thông tin compile-time.

**Pitfall/trade-off:** Generated code làm tăng assembly size; expression provider không hỗ trợ mọi node. Cần fallback rõ cho dynamic types.

**Kỳ vọng:** Senior chọn kỹ thuật theo closed/open world, startup, throughput, tooling và deployment target.

### CS-057 [Senior]

**Câu hỏi:** Source generator incremental nên được thiết kế thế nào để deterministic, cache-friendly và báo diagnostic hữu ích?

**Trả lời:** Dùng incremental pipeline từ syntax predicate rẻ → semantic transform tối thiểu → immutable equatable model → combine inputs cần thiết → output. Tránh giữ Compilation/SyntaxNode lớn trong model, I/O/time/random/global mutable state; normalize ordering và hint name để output deterministic. Diagnostic phải có ID ổn định, location chính xác, severity/message/actionable và không crash compiler.

**Pitfall/trade-off:** Comparer/model equality kém làm invalidation toàn pipeline; đọc AdditionalFiles/config phải khai báo input. Generator không nên sửa source người dùng.

**Kỳ vọng:** Senior hiểu incremental graph, cache invalidation, determinism và test snapshot/driver.

### CS-058 [Senior]

**Câu hỏi:** Tiered compilation, inlining, devirtualization và PGO có thể làm benchmark C# sai lệch ra sao?

**Trả lời:** Method ban đầu có thể chạy tier-0 nhanh compile nhưng chưa tối ưu; sau đủ call được re-JIT tier-1, PGO dùng profile để inline/devirtualize/optimize hot path. Benchmark quá ngắn đo startup/tier transition thay steady state; dead-code elimination, constant folding và environment noise cũng sai lệch. Dùng BenchmarkDotNet với warmup/iterations, consume result, cấu hình runtime và xem disassembly khi cần.

**Pitfall/trade-off:** Production có startup workload nên chỉ đo steady state cũng thiếu. So sánh phải cùng runtime, architecture, GC và power state.

**Kỳ vọng:** Senior xác định metric startup vs throughput và lý giải bằng generated code/counters.

### CS-059 [Middle]

**Câu hỏi:** Bạn sẽ dùng BenchmarkDotNet và profiler thế nào để phân biệt vấn đề CPU, allocation, lock contention và I/O?

**Trả lời:** BenchmarkDotNet tạo microbenchmark cô lập với warmup, thống kê, MemoryDiagnoser; profiler/tracing trên workload thật cho call stacks, allocation stacks/GC, contention events, thread-pool queue và I/O wait. CPU cao + hot stacks khác thời gian tường cao nhưng CPU thấp/I/O wait. Kết hợp runtime counters, distributed trace và database/network metric.

**Pitfall/trade-off:** Microbenchmark không mô phỏng contention/cache/data distribution; profiler sampling có bias và instrumentation có overhead. Luôn có baseline và dữ liệu đại diện.

**Kỳ vọng:** Middle biết đúng công cụ; Senior liên kết metric đa tầng và kiểm chứng tối ưu trong production-like test.

### CS-060 [Senior — Tình huống]

**Câu hỏi:** Một serializer tự viết dùng reflection cho từng request, tạo nhiều string tạm và chậm dưới tải; hãy đề xuất lộ trình tối ưu có số đo và vẫn giữ tính đúng đắn.

**Trả lời:** Chốt corpus/test compatibility và benchmark throughput, latency, bytes allocated theo payload. Profile để tách metadata lookup, invocation, encoding và buffer growth. Cache immutable serialization plan/typed accessors theo type; viết thẳng UTF-8 vào `IBufferWriter<byte>`/span thay nối string; pool buffer có ownership đúng. Nếu type set biết lúc build, dùng source generator/AOT-friendly path, có reflection fallback. So sánh với serializer chuẩn trước khi duy trì giải pháp riêng.

**Pitfall/trade-off:** Cache phải hỗ trợ collectible context/bounded growth; source generation tăng code size. Giữ semantics null, culture, escaping, reference cycles, versioning và security; fuzz/differential test trước tối ưu.

**Kỳ vọng:** Senior tối ưu theo evidence, có correctness oracle, rollout/counter và không hy sinh bảo mật để lấy benchmark đẹp.

## Câu hỏi kinh điển bổ sung — Basic đến Senior

### CS-061 [Basic · ⭐ Rất thường gặp]

**Câu hỏi:** Bốn đặc tính OOP là encapsulation, abstraction, inheritance và polymorphism được thể hiện trong C# bằng những cơ chế nào, và chúng khác nhau ở mục đích gì?

**Kết luận:** Encapsulation bảo vệ state/invariant; abstraction chỉ công khai contract cần thiết; inheritance tái sử dụng hoặc chuyên biệt hóa quan hệ “is-a”; polymorphism cho cùng contract có nhiều implementation.

**Cơ chế:** C# dùng access modifier và property để đóng gói, interface/abstract class để trừu tượng hóa, base class để kế thừa, còn virtual dispatch/interface dispatch để đa hình runtime. Overload là polymorphism compile-time, không phải override runtime.

**Pitfall / follow-up Senior:** Kế thừa không phải mục tiêu bắt buộc của OOP. Ưu tiên composition nếu subtype không giữ được LSP; hierarchy sâu làm tăng coupling và fragile-base-class risk.

### CS-062 [Basic · ⭐ Rất thường gặp]

**Câu hỏi:** Các access modifier `public`, `private`, `protected`, `internal`, `protected internal` và `private protected` khác nhau thế nào; mức truy cập mặc định của type/member là gì?

**Kết luận:** `public` ở mọi nơi; `private` chỉ declaring type; `protected` cho declaring/derived type; `internal` trong cùng assembly. `protected internal` là hợp **OR** (cùng assembly hoặc derived ở assembly khác), còn `private protected` là hợp **AND** (derived và cùng assembly).

**Cơ chế:** Top-level type không ghi modifier mặc định là `internal`; nested type và member của class/struct mặc định là `private`. Member contract của interface mặc định public, dù interface hiện đại có thể có helper member với access khác.

**Pitfall / follow-up Senior:** `internal` không phải security boundary; reflection hoặc `InternalsVisibleTo` có thể vượt ý định đóng gói. Public/protected surface là compatibility contract nên cần giữ nhỏ.

### CS-063 [Basic · ⭐ Rất thường gặp]

**Câu hỏi:** Vì sao `string` là immutable; phép `==`, nối chuỗi, string interning và `StringBuilder` có hành vi hoặc chi phí gì đáng chú ý?

**Kết luận:** Một `string` không đổi nội dung sau khi tạo; thao tác biến đổi trả string mới. `==` trên string so giá trị theo ordinal, case-sensitive mặc định, không so identity.

**Cơ chế:** Immutability cho phép chia sẻ và giữ equality/hash ổn định, nên string phù hợp làm key. Một vài phép nối được compiler/runtime tối ưu, nhưng nối lặp trong loop có thể tạo nhiều object; `StringBuilder` phù hợp khi số đoạn lớn/không biết trước. Literal có thể được intern nên nhiều biến trỏ cùng instance; không nên giả định implementation luôn cache hash code.

```csharp
var sb = new StringBuilder();
foreach (var part in parts) sb.Append(part);
return sb.ToString();
```

**Pitfall / follow-up Senior:** Không dùng `ReferenceEquals` cho logic string và không intern dữ liệu không giới hạn vì interned value có lifetime dài. So sánh identifier cần chỉ rõ `StringComparison`, không phụ thuộc culture mặc định.

### CS-064 [Basic · ⭐ Rất thường gặp]

**Câu hỏi:** Field, property và auto-property khác nhau thế nào; vì sao public API thường expose property thay vì public field?

**Kết luận:** Field là storage; property là cặp accessor `get`/`set` trong metadata. Auto-property để compiler tạo backing field nhưng vẫn giữ contract property.

**Cơ chế:** Property có thể kiểm tra invariant, tính giá trị, đổi implementation, triển khai interface, khai báo `private set`/`init` và được nhiều serializer/binding framework nhận diện. Đổi public field thành property về sau có thể phá binary compatibility, nên property giữ đường tiến hóa tốt hơn.

**Pitfall / follow-up Senior:** Property getter nên nhanh và ít side effect; property trả collection mutable vẫn làm lộ state. Validation nhiều field phụ thuộc nhau thường thuộc constructor/domain method, không nên phân tán vào từng setter.

### CS-065 [Basic · ⭐ Rất thường gặp]

**Câu hỏi:** Method overloading, overriding và hiding bằng `new` khác nhau thế nào; `virtual`, `abstract`, `override` và `sealed` ảnh hưởng dispatch ra sao?

**Kết luận:** Overload được compiler chọn theo tên, static types và argument list. Override thay virtual slot nên runtime chọn implementation theo object thực. `new` tạo member khác và việc gọi phụ thuộc static type của biến.

```csharp
class Base { public virtual string M() => "base"; }
class Child : Base { public sealed override string M() => "child"; }
```

**Cơ chế:** `abstract` bắt subtype cụ thể triển khai; `virtual` có implementation mặc định; `override` tham gia cùng dispatch slot; `sealed override` dừng override tiếp. Return type covariant chỉ áp dụng trong các trường hợp ngôn ngữ cho phép, không biến overload thành override.

**Pitfall / follow-up Senior:** Hiding thường gây bất ngờ khi cast qua base. Tránh gọi virtual member từ constructor vì subtype có thể chưa hoàn tất invariant.

### CS-066 [Basic · Thường gặp]

**Câu hỏi:** Khi nào dùng `int`, `float`, `double` hoặc `decimal`; precision, range, `NaN` và bài toán tiền tệ tạo những bẫy nào?

**Kết luận:** `int` cho số nguyên trong range 32-bit; `float`/`double` là IEEE 754 binary floating point, trong đó double là mặc định cho đo lường/tính toán; `decimal` là decimal floating point độ chính xác cao, thường phù hợp tiền tệ.

**Cơ chế:** Nhiều số thập phân như `0.1` không biểu diễn chính xác bằng binary float, nên không so double bằng equality tuyệt đối sau phép tính; dùng tolerance theo miền. `NaN` không bằng chính nó và làm ordering đặc biệt. Với tiền, dùng `decimal` hoặc integer minor units cùng currency/rounding rule.

**Pitfall / follow-up Senior:** `decimal` chậm/range nhỏ hơn double và vẫn cần quy tắc rounding. Integral overflow phụ thuộc checked context; conversion giữa numeric types có thể mất precision.

### CS-067 [Basic · ⭐ Rất thường gặp]

**Câu hỏi:** Chọn array, `List<T>`, `Dictionary<TKey,TValue>` hay `HashSet<T>` theo access pattern nào; độ phức tạp trung bình của các thao tác chính là gì?

**Kết luận:** Array có kích thước cố định và index O(1); `List<T>` là dynamic array với index/amortized append O(1), chèn/xóa giữa O(n). Dictionary phục vụ key→value và HashSet phục vụ membership/uniqueness với lookup/add expected O(1).

**Cơ chế:** Dictionary/HashSet dùng hash rồi equality comparer; capacity/load factor quyết định resize và memory. Tìm tuyến tính trong array/list là O(n), nhưng locality tốt có thể thắng hash collection với tập nhỏ.

**Pitfall / follow-up Senior:** Hash operation có worst-case xấu, key phải có equality/hash ổn định. Chọn collection theo ordering, duplicate, mutation và memory—not chỉ Big-O; pre-size khi biết cardinality lớn.

### CS-068 [Middle · ⭐ Rất thường gặp]

**Câu hỏi:** Chọn `StringComparison.Ordinal`, `OrdinalIgnoreCase`, `CurrentCulture` hay `InvariantCulture` thế nào cho identifier, dữ liệu hiển thị, sort và key không phân biệt hoa thường?

**Kết luận:** Dùng ordinal cho protocol, token, key và identifier nội bộ; dùng `OrdinalIgnoreCase` khi contract định nghĩa identifier case-insensitive. Path phải theo contract của OS/filesystem: thường case-insensitive trên Windows và case-sensitive trên Unix, đồng thời cần canonicalization phù hợp. Dùng current culture cho text hiển thị; invariant culture cho xử lý culture-aware nhưng cần kết quả ổn định giữa máy.

**Cơ chế:** Culture rules có expansion/case đặc biệt nên kết quả khác ordinal. Dictionary/HashSet phải nhận cùng comparer với semantics của domain, ví dụ `StringComparer.OrdinalIgnoreCase`.

**Pitfall / follow-up Senior:** Culture-sensitive comparison trong authorization hoặc security token dễ tạo bypass; invariant không đồng nghĩa ordinal. Unicode normalization và ký tự đồng hình là lớp vấn đề khác, cần canonicalization/threat model rõ.

### CS-069 [Middle · ⭐ Rất thường gặp]

**Câu hỏi:** Compiler hiện thực iterator dùng `yield return`/`yield break` thế nào; deferred execution, disposal và exception của iterator xuất hiện vào thời điểm nào?

**Kết luận:** Compiler hạ iterator thành state machine triển khai enumerable/enumerator; gọi method thường chỉ tạo enumerable, còn thân chạy khi `MoveNext`/`foreach` bắt đầu.

**Cơ chế:** `yield return` lưu state/local rồi tạm dừng; lần kế tiếp tiếp tục sau điểm yield. `yield break` kết thúc sequence. `foreach` dispose enumerator trong `finally`, nhờ đó cleanup/finally trong iterator chạy khi enumeration hoàn tất hoặc dừng sớm.

```csharp
IEnumerable<int> Positive(IEnumerable<int> source)
{
    foreach (var x in source)
        if (x > 0) yield return x;
}
```

**Pitfall / follow-up Senior:** Exception trong thân thường xuất hiện lúc enumerate, không phải lúc lấy `IEnumerable`; enumerate lại sẽ chạy lại side effect. Resource phải được sở hữu trong iterator và cleanup qua `using`/`finally`.

### CS-070 [Middle · Thường gặp]

**Câu hỏi:** Extension method được khai báo và resolve thế nào; vì sao nó không thật sự thêm virtual member, vẫn có thể nhận receiver null và có rủi ro versioning gì?

**Kết luận:** Extension method là static method trong static class, tham số đầu có `this`; cú pháp instance chỉ là đường cú pháp. Compiler resolve nó theo static type và namespaces/imports, không virtual-dispatch theo runtime type.

**Cơ chế:** Instance member phù hợp luôn được ưu tiên trước extension. Vì receiver chỉ là argument, reference null vẫn vào method; method phải guard nếu contract không cho null. Có thể gọi dạng `Extensions.M(x)` để thấy rõ dispatch.

**Pitfall / follow-up Senior:** Khi dependency thêm instance method cùng tên, source được build lại có thể bind khác; hai namespace có extension tương đương gây ambiguity. Không dùng extension để che dependency hoặc giả lập polymorphism.

### CS-071 [Middle · ⭐ Rất thường gặp]

**Câu hỏi:** So sánh `IEnumerable<T>`, `ICollection<T>`, `IReadOnlyCollection<T>`, `IList<T>` và `IReadOnlyList<T>` khi thiết kế tham số hoặc kiểu trả về của API.

**Kết luận:** `IEnumerable<T>` chỉ yêu cầu enumeration; `ICollection<T>` thêm `Count` và bề mặt mutation nhưng implementation có thể báo `IsReadOnly` rồi ném `NotSupportedException`; `IReadOnlyCollection<T>` thêm Count nhưng không cho mutate qua interface; `IList<T>` thêm index/mutation; `IReadOnlyList<T>` thêm index chỉ đọc.

**Cơ chế:** Tham số nên yêu cầu capability nhỏ nhất thuật toán cần; return type nên công khai đúng semantics ổn định. Nếu cần index/count nhiều lần, nói rõ bằng interface thay vì enumerate tùy ý. `IReadOnly*` là read-only view, không chứng minh backing collection immutable.

**Pitfall / follow-up Senior:** Caller có thể giữ alias khác và mutate view; snapshot cần copy/immutable collection. Expose `IEnumerable` lazy còn kéo theo lifetime, exception và multiple-enumeration contract.

### CS-072 [Middle · Thường gặp]

**Câu hỏi:** `checked` và `unchecked` kiểm soát overflow của integral arithmetic/conversion thế nào; vì sao cấu hình build và constant expression có thể làm hành vi khác nhau?

**Kết luận:** Trong checked context, integral overflow ném `OverflowException`; unchecked cho wrap/truncate theo representation. Constant expression bị compiler kiểm tra chặt và có thể lỗi build dù operation runtime mặc định được unchecked.

```csharp
var next = checked(current + delta);
var lowByte = unchecked((byte)value);
```

**Cơ chế:** Project/compiler option có thể đổi default cho non-constant integral arithmetic, nên code cần semantics rõ tại boundary quan trọng. Floating point overflow tạo infinity/NaN thay vì theo checked; decimal overflow ném.

**Pitfall / follow-up Senior:** Wrap có thể phá length, allocation, authorization hoặc accounting. Checked chỉ phát hiện overflow số học, không validate range nghiệp vụ; conversion/operation trong method khác cần context của chính nó.

### CS-073 [Middle · ⭐ Rất thường gặp]

**Câu hỏi:** `try`, `catch` và `finally` thực thi thế nào khi có `return` hoặc exception; vì sao throw trong `finally` và catch quá rộng thường nguy hiểm?

**Kết luận:** `catch` phù hợp xử lý exception matching; `finally` chạy khi rời `try`/`catch` do hoàn tất, `return` hoặc exception trong điều kiện runtime thông thường. Giá trị return được xác định rồi finally chạy trước khi method thực sự trả.

**Cơ chế:** Nếu không được xử lý, exception tiếp tục unwind sau finally. `using` dựa trên `try/finally` để dispose. Catch nên xử lý loại lỗi mà layer hiểu được, hoặc thêm context rồi giữ inner exception/stack.

**Pitfall / follow-up Senior:** Exception mới từ finally có thể che exception gốc; cleanup nhiều bước cần cố gắng giải phóng phần còn lại và giữ lỗi có ý nghĩa. Không nuốt `Exception` hay biến cancellation dự kiến thành lỗi chung.

### CS-074 [Middle · Thường gặp]

**Câu hỏi:** `Action`, `Func`, `Predicate<T>` và custom delegate khác nhau thế nào; khi nào một delegate riêng biểu đạt contract tốt hơn dùng `Func`/`Action`?

**Kết luận:** `Action<...>` không trả giá trị; `Func<..., TResult>` có kiểu cuối là kết quả; `Predicate<T>` trả bool và mang nghĩa kiểm tra. Custom delegate hữu ích khi cần tên miền rõ, signature đặc biệt (`ref`/`out`) hoặc contract/event được tài liệu hóa độc lập.

**Cơ chế:** Tất cả là delegate type-safe và có thể trỏ method/lambda tương thích; hai delegate type khác nhau không tự hoán đổi chỉ vì signature giống nhau. Delegate equality dựa target+method/invocation list.

**Pitfall / follow-up Senior:** Truyền `async` lambda vào `Action` tạo `async void`, caller không await/compose lỗi được; ưu tiên `Func<Task>`/`Func<T,Task>`. Đừng tạo custom delegate nếu `Func` diễn đạt đủ và API chỉ nội bộ.

### CS-075 [Middle · ⭐ Rất thường gặp]

**Câu hỏi:** Trả thẳng một `Task` khác gì dùng `async`/`await`; exception timing, stack trace, `using` lifetime và khả năng thêm logic sau await ảnh hưởng quyết định ra sao?

**Kết luận:** Wrapper chỉ chuyển tiếp có thể trả Task trực tiếp để tránh state machine; dùng `async`/`await` khi cần transform kết quả, `try/catch/finally`, cleanup hoặc logic continuation rõ ràng.

```csharp
// Sai: CopyToAsync còn đọc source sau khi method đã trả.
Task Copy(Stream source, Stream destination)
{
    using (source) return source.CopyToAsync(destination);
}
```

**Cơ chế:** Method non-async có thể throw đồng bộ trước khi trả Task; exception trong `async Task` được ghi vào Task để quan sát khi await. `await` giữ lexical lifetime của `using`/`finally` đến khi operation xong và thường cho stack async dễ hiểu hơn.

**Pitfall / follow-up Senior:** Bỏ `async` không phải tối ưu đáng kể ở mọi nơi; forwarding Task có thể thay timing/stack/cleanup contract. Không viết `return await` vô nghĩa, nhưng cần nó trong `try/catch` hoặc `finally` có chủ đích.

### CS-076 [Senior · Thường gặp]

**Câu hỏi:** Thứ tự khởi tạo static/instance, static constructor, `beforefieldinit` và `Lazy<T>` ảnh hưởng thế nào đến singleton, publication và lỗi type initialization?

**Kết luận:** CLR zero-initialize toàn bộ storage trước. Với instance, field initializer của một type chạy theo textual order một lần trên constructor chain; trong C#, initializer của derived type chạy trước khi gọi base constructor, rồi đến body constructor từ base lên derived. Constructor dùng `this(...)` chuyển sang constructor khác và không chạy initializer lặp lại. Thứ tự giữa các phần của partial type không được bảo đảm.

**Cơ chế:** Static storage cũng được zero-init; static field initializer chạy theo textual order, sau đó explicit static constructor chạy tối đa một lần dưới synchronization trước lần sử dụng được yêu cầu. Type không có explicit static constructor thường mang `beforefieldinit`, cho phép runtime chạy initializer sớm hơn. Publication sau type initialization là thread-safe. Nếu initialization ném, runtime thường bọc `TypeInitializationException`; `Lazy<T>` hoãn construction và cho chọn publication mode.

**Pitfall / follow-up Senior:** Không block async, lấy lock ngoài hoặc gọi dependency vòng trong static constructor vì có thể deadlock/startup failure. `Lazy<T>` có thể cache exception tùy mode và singleton không tự làm object bên trong thread-safe.

### CS-077 [Senior · Thường gặp]

**Câu hỏi:** `TaskCompletionSource<T>` nên được hoàn tất và hủy thế nào; continuation chạy inline gây reentrancy/deadlock ra sao và `RunContinuationsAsynchronously` giải quyết gì?

**Kết luận:** TCS chuyển callback/event thành Task; mọi đường success/error/cancel phải cạnh tranh hoàn tất đúng một lần bằng `TrySetResult`, `TrySetException` hoặc `TrySetCanceled`.

```csharp
var tcs = new TaskCompletionSource<T>(
    TaskCreationOptions.RunContinuationsAsynchronously);
```

**Cơ chế:** Mặc định continuation có thể chạy đồng bộ ngay trên thread gọi `Set...`; nếu hoàn tất dưới lock/callback native, user code re-enter hoặc chờ lock khác. Option trên xếp continuation để chạy bất đồng bộ, tách producer khỏi consumer; nó không bảo đảm một thread cụ thể.

**Pitfall / follow-up Senior:** Dispose cancellation/event registration, truyền đúng token khi cancel và xử lý race callback–timeout. `Set...` ném khi đã hoàn tất; `TrySet...` phù hợp race dự kiến.

### CS-078 [Senior · Thường gặp]

**Câu hỏi:** `ExecutionContext`, `AsyncLocal<T>` và `ThreadLocal<T>` khác nhau thế nào; context flow qua `await`/`Task.Run` có thể gây rò dữ liệu hoặc chi phí ở đâu?

**Kết luận:** `ExecutionContext` mang logical ambient context qua async/thread-pool hops; `AsyncLocal<T>` lưu giá trị trong luồng logic đó. `ThreadLocal<T>` gắn với OS thread nên continuation sau await có thể thấy thread/value khác.

**Cơ chế:** Trace context, culture và một số security state dùng cơ chế flow tương tự. Task capture context tại scheduling; thay đổi AsyncLocal tạo copy-on-write/callback cost. Scope nên lưu giá trị cũ và restore trong `finally`.

**Pitfall / follow-up Senior:** Ambient mutable state làm dependency ẩn và có thể lẫn tenant/request nếu background work sống lâu hoặc scope không reset. `ExecutionContext.SuppressFlow` chỉ dùng ở infrastructure đã threat-model vì có thể làm mất tracing/security context.

### CS-079 [Senior · ⭐ Rất thường gặp]

**Câu hỏi:** Thiết kế producer–consumer bằng bounded `Channel<T>` khác gì `ConcurrentQueue<T>` cộng signaling hoặc `BlockingCollection<T>`; completion, backpressure và failure propagation cần xử lý thế nào?

**Kết luận:** Bounded Channel cung cấp queue async cùng signaling và backpressure tích hợp; `ConcurrentQueue` chỉ thread-safe cho collection nên caller phải tự ghép signal/capacity/completion. `BlockingCollection` phù hợp sync worker nhưng chặn thread.

**Cơ chế:** Với Channel, producer `WriteAsync` chờ hoặc áp full-mode đã chọn; consumer `ReadAllAsync` stream đến khi writer complete. Owner gọi `TryComplete(exception)` để truyền kết thúc/lỗi, và cấu hình single-reader/writer có thể tối ưu.

```csharp
var channel = Channel.CreateBounded<Job>(100);
await channel.Writer.WriteAsync(job, ct);
await foreach (var item in channel.Reader.ReadAllAsync(ct)) { /* handle */ }
```

**Pitfall / follow-up Senior:** Cancellation của một caller không nên vô tình complete queue dùng chung. Drop mode phải có metric/semantics; wait mode cần timeout/load shedding để không biến backpressure thành hàng nghìn request chờ.

### CS-080 [Senior · Thường gặp]

**Câu hỏi:** Một type sở hữu đồng thời tài nguyên `IDisposable` và `IAsyncDisposable` nên triển khai `Dispose`/`DisposeAsync` thế nào để idempotent, tránh double-dispose và vẫn cleanup đủ khi một bước thất bại?

**Kết luận:** Ghi rõ ownership và cung cấp hai đường cleanup có chung state exactly-once; async path await tài nguyên async, sync path chỉ block nếu contract thực sự hỗ trợ an toàn. `DisposeAsync` thường gọi core async, cleanup phần sync rồi suppress finalization.

**Cơ chế:** Dùng `Interlocked.Exchange` hoặc state được bảo vệ để hai caller không dispose trùng. Cleanup nhiều resource đặt trong nested `try/finally` để một lỗi không bỏ tài nguyên sau; với base class dùng `Dispose(bool)`/`DisposeAsyncCore`, sealed class có thể đơn giản hơn.

**Pitfall / follow-up Senior:** Sync-over-async trong `Dispose` có thể deadlock hoặc kéo dài latency; đôi khi chỉ expose `IAsyncDisposable` là đúng. Không dispose dependency không do object sở hữu, không nuốt lỗi tùy tiện, và mọi public method phải phản ứng nhất quán sau dispose.
