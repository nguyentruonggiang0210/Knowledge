# Ngân hàng câu hỏi phỏng vấn C# — Middle & Senior

> Chỉ gồm câu hỏi. Mỗi câu có mã ổn định để đối chiếu với `Anwsers/c_sharp.md`.

## 1. Type system, value/reference semantics và ngôn ngữ

1. **CS-001 [Middle]** C# phân biệt value type và reference type như thế nào, và sự khác biệt đó ảnh hưởng ra sao đến phép gán, truyền tham số và cấp phát bộ nhớ?
2. **CS-002 [Middle]** Boxing và unboxing xảy ra khi nào; chúng gây chi phí gì và có thể tránh bằng những kỹ thuật nào?
3. **CS-003 [Middle]** Giải thích các kiểu truyền tham số mặc định, `ref`, `out`, `in` và `ref readonly`; khi nào mỗi kiểu phù hợp?
4. **CS-004 [Senior]** Nullable reference types hoạt động dựa trên phân tích tĩnh như thế nào; các annotation `?`, toán tử `!` và thuộc tính nullable metadata có giới hạn gì?
5. **CS-005 [Middle]** So sánh `const`, `readonly` và `static readonly`, đặc biệt về thời điểm gán giá trị, versioning giữa assembly và thread safety.
6. **CS-006 [Senior]** Hãy giải thích equality trong C#: `ReferenceEquals`, `object.Equals`, `IEquatable<T>`, toán tử `==` và yêu cầu nhất quán với `GetHashCode`.
7. **CS-007 [Senior]** Variance (`out`, `in`) của interface/delegate generic là gì; vì sao `IEnumerable<string>` gán được cho `IEnumerable<object>` nhưng `List<string>` không gán được cho `List<object>`?
8. **CS-008 [Middle]** `dynamic`, `object` và kiểu suy luận bằng `var` khác nhau ở thời điểm binding, kiểm tra lỗi và hiệu năng như thế nào?

## 2. Generics và abstraction

9. **CS-009 [Middle]** Generics đem lại lợi ích gì so với dùng `object`; CLR hiện thực generic cho value type và reference type khác nhau ra sao?
10. **CS-010 [Middle]** Các generic constraints phổ biến (`class`, `struct`, `notnull`, `unmanaged`, `new()`, base type/interface) có ý nghĩa và giới hạn gì?
11. **CS-011 [Senior]** Static abstract interface members giải quyết bài toán generic math như thế nào; chúng khác virtual dispatch thông thường ở đâu?
12. **CS-012 [Senior]** Vì sao không thể trực tiếp khởi tạo `new T()` nếu thiếu constraint, và khi factory delegate thường tốt hơn constraint `new()`?
13. **CS-013 [Senior]** Thiết kế một API generic để tránh vừa boxing vừa runtime type checks; bạn sẽ cân nhắc constraint và specialization thế nào?
14. **CS-014 [Middle]** So sánh interface và abstract class về multiple inheritance, state, versioning API và khả năng kiểm thử.

## 3. Delegate, event, closure và biểu thức lambda

15. **CS-015 [Middle]** Delegate multicast hoạt động thế nào; giá trị trả về và exception của invocation list được xử lý ra sao?
16. **CS-016 [Middle]** `event` khác một field delegate công khai như thế nào và mẫu publish/subscribe có rủi ro memory leak gì?
17. **CS-017 [Senior]** Closure được compiler hạ cấp thành gì; việc capture local variable có thể gây allocation và lỗi logic trong loop ra sao?
18. **CS-018 [Senior]** So sánh lambda thường, static lambda, local function và expression tree về capture, allocation và khả năng phân tích runtime.
19. **CS-019 [Senior — Tình huống]** Một singleton publisher giữ event handler của hàng nghìn đối tượng request-scoped khiến bộ nhớ tăng liên tục; hãy chẩn đoán và đề xuất cách sửa an toàn.

## 4. Collections và LINQ

20. **CS-020 [Middle]** Deferred execution của LINQ là gì; khi nào query được thực thi lại và khi nào nên materialize bằng `ToList`/`ToArray`?
21. **CS-021 [Middle]** So sánh `IEnumerable<T>`, `IQueryable<T>` và `IAsyncEnumerable<T>` về nơi thực thi, biểu diễn query và streaming.
22. **CS-022 [Senior]** Những toán tử LINQ nào có thể stream và toán tử nào phải buffer toàn bộ dữ liệu; điều này tác động thế nào đến độ trễ và bộ nhớ?
23. **CS-023 [Middle — Code review]** Đoạn code gọi `source.Where(predicate).Count() > 0` có vấn đề gì và nên thay bằng gì trong từng loại source?
24. **CS-024 [Senior]** `GroupBy`, `Join` và `ToLookup` có đặc điểm độ phức tạp và lifetime dữ liệu gì; khi nào cần custom comparer?
25. **CS-025 [Senior — Tình huống]** Một pipeline LINQ chạy chậm trên hàng triệu phần tử và tạo nhiều allocation; bạn sẽ đo, xác định nguyên nhân và tối ưu theo thứ tự nào?

## 5. Async/await và lập trình bất đồng bộ

26. **CS-026 [Middle]** Compiler biến một phương thức `async` thành state machine như thế nào và phần code trước `await` chạy ở đâu?
27. **CS-027 [Middle]** Phân biệt concurrency, parallelism và asynchronous I/O; vì sao `Task.Run` không phải cách mặc định để làm I/O bất đồng bộ?
28. **CS-028 [Senior]** `SynchronizationContext`, `TaskScheduler` và `ConfigureAwait(false)` ảnh hưởng thế nào đến continuation trong UI, ASP.NET cũ và ASP.NET Core?
29. **CS-029 [Middle]** Vì sao `.Result`/`.Wait()` có thể gây deadlock hoặc thread starvation; nguyên tắc “async all the way” giải quyết ra sao?
30. **CS-030 [Middle]** Khi nào dùng `Task`, `ValueTask`, `async void` và `IAsyncEnumerable<T>`; các contract và bẫy chính là gì?
31. **CS-031 [Senior]** Cancellation nên được thiết kế và truyền xuyên suốt API thế nào; `OperationCanceledException`, timeout và linked token khác nhau ra sao?
32. **CS-032 [Senior]** `Task.WhenAll` xử lý kết quả và nhiều exception như thế nào; làm sao thu thập lỗi mà vẫn giữ semantics fail-fast hoặc best-effort mong muốn?
33. **CS-033 [Senior — Code review]** Đoạn `items.Select(async x => await SaveAsync(x))` nhưng không await kết quả có lỗi gì; hãy nêu cách sửa có và không giới hạn concurrency.
34. **CS-034 [Senior — Tình huống]** Một API fan-out 5.000 lời gọi HTTP bằng `Task.WhenAll` gây cạn socket và tăng tail latency; hãy thiết kế lại cơ chế giới hạn, hủy và retry.

## 6. Threading, synchronization và concurrency

35. **CS-035 [Middle]** `lock` bảo đảm điều gì về mutual exclusion và memory visibility; vì sao không nên lock trên `this`, string hoặc object công khai?
36. **CS-036 [Senior]** So sánh `Monitor`, `SemaphoreSlim`, `Mutex`, `ReaderWriterLockSlim`, `SpinLock` và primitive dựa trên `Interlocked`.
37. **CS-037 [Senior]** `volatile` trong C# bảo đảm và không bảo đảm điều gì; khi nào cần `Interlocked` hoặc lock thay thế?
38. **CS-038 [Senior]** Race condition, deadlock, livelock, starvation và thread-pool starvation khác nhau thế nào; bạn nhận diện chúng từ triệu chứng nào?
39. **CS-039 [Senior — Code review]** Một method giữ `lock` rồi gọi API bên ngoài hoặc chạy callback của người dùng; rủi ro là gì và nên tái cấu trúc thế nào?
40. **CS-040 [Senior]** So sánh `ConcurrentDictionary`, immutable collections và copy-on-write cho trạng thái đọc nhiều ghi ít; compound operation cần xử lý ra sao?

## 7. Memory, Span và quản lý tài nguyên

41. **CS-041 [Middle]** GC quản lý managed memory nhưng vì sao vẫn có memory leak; hãy nêu các GC root thường giữ object ngoài ý muốn.
42. **CS-042 [Middle]** Mẫu `IDisposable`/`using` dùng để giải phóng tài nguyên gì; finalizer và `SafeHandle` đóng vai trò nào?
43. **CS-043 [Senior]** `Span<T>`/`ReadOnlySpan<T>` là gì, vì sao là `ref struct`, và những nơi nào không được phép lưu hoặc truyền chúng?
44. **CS-044 [Senior]** So sánh `Span<T>`, `Memory<T>`, array, `ArraySegment<T>` và `ReadOnlySequence<T>` khi thiết kế API parsing/streaming.
45. **CS-045 [Senior]** `stackalloc`, object pooling và `ArrayPool<T>` giúp giảm allocation thế nào; chúng có rủi ro an toàn và lifetime gì?
46. **CS-046 [Senior — Code review]** Một method thuê buffer từ `ArrayPool<byte>.Shared`, trả về sớm khi lỗi và trả buffer cho pool mà không xóa; hãy chỉ ra mọi vấn đề có thể xảy ra.
47. **CS-047 [Senior]** Pinning, unsafe code và blittable types liên quan thế nào đến interop và hiệu năng GC; khi nào pinning dài hạn đặc biệt nguy hiểm?

## 8. Records, immutability và pattern matching

48. **CS-048 [Middle]** So sánh `record class`, `record struct`, class và struct thường về equality, mutability, copy và inheritance.
49. **CS-049 [Senior]** `init`, `required` và constructor validation phối hợp thế nào để tạo immutable object vẫn bảo đảm invariant?
50. **CS-050 [Middle]** Property, positional, relational, logical và list pattern giúp mô hình hóa branching ra sao; exhaustiveness có được compiler bảo đảm hoàn toàn không?
51. **CS-051 [Senior — Tình huống]** Dùng record làm key của dictionary nhưng một property thành phần bị mutate sau khi insert; điều gì xảy ra và thiết kế nào tránh lỗi?

## 9. Exception và reliability

52. **CS-052 [Middle]** Khi nào nên throw exception, trả result type hoặc dùng `TryXxx`; vì sao exception không nên dùng cho control flow bình thường?
53. **CS-053 [Middle]** `throw;` khác `throw ex;` thế nào; exception filter và inner exception hỗ trợ chẩn đoán ra sao?
54. **CS-054 [Senior]** Hãy thiết kế exception policy cho một thư viện: taxonomy, wrapping, retryability, dữ liệu nhạy cảm và tương thích phiên bản cần xử lý thế nào?

## 10. Reflection, code generation và performance

55. **CS-055 [Middle]** Reflection có những chi phí và rủi ro nào; caching metadata/delegate cải thiện hot path ra sao?
56. **CS-056 [Senior]** Expression tree, compiled delegate, IL emit và source generator khác nhau về thời điểm sinh code, AOT compatibility và khả năng debug thế nào?
57. **CS-057 [Senior]** Source generator incremental nên được thiết kế thế nào để deterministic, cache-friendly và báo diagnostic hữu ích?
58. **CS-058 [Senior]** Tiered compilation, inlining, devirtualization và PGO có thể làm benchmark C# sai lệch ra sao?
59. **CS-059 [Middle]** Bạn sẽ dùng BenchmarkDotNet và profiler thế nào để phân biệt vấn đề CPU, allocation, lock contention và I/O?
60. **CS-060 [Senior — Tình huống]** Một serializer tự viết dùng reflection cho từng request, tạo nhiều string tạm và chậm dưới tải; hãy đề xuất lộ trình tối ưu có số đo và vẫn giữ tính đúng đắn.

## Câu hỏi kinh điển bổ sung — Basic đến Senior

61. **CS-061 [Basic · ⭐ Rất thường gặp]** Bốn đặc tính OOP là encapsulation, abstraction, inheritance và polymorphism được thể hiện trong C# bằng những cơ chế nào, và chúng khác nhau ở mục đích gì?
62. **CS-062 [Basic · ⭐ Rất thường gặp]** Các access modifier `public`, `private`, `protected`, `internal`, `protected internal` và `private protected` khác nhau thế nào; mức truy cập mặc định của type/member là gì?
63. **CS-063 [Basic · ⭐ Rất thường gặp]** Vì sao `string` là immutable; phép `==`, nối chuỗi, string interning và `StringBuilder` có hành vi hoặc chi phí gì đáng chú ý?
64. **CS-064 [Basic · ⭐ Rất thường gặp]** Field, property và auto-property khác nhau thế nào; vì sao public API thường expose property thay vì public field?
65. **CS-065 [Basic · ⭐ Rất thường gặp]** Method overloading, overriding và hiding bằng `new` khác nhau thế nào; `virtual`, `abstract`, `override` và `sealed` ảnh hưởng dispatch ra sao?
66. **CS-066 [Basic · Thường gặp]** Khi nào dùng `int`, `float`, `double` hoặc `decimal`; precision, range, `NaN` và bài toán tiền tệ tạo những bẫy nào?
67. **CS-067 [Basic · ⭐ Rất thường gặp]** Chọn array, `List<T>`, `Dictionary<TKey,TValue>` hay `HashSet<T>` theo access pattern nào; độ phức tạp trung bình của các thao tác chính là gì?
68. **CS-068 [Middle · ⭐ Rất thường gặp]** Chọn `StringComparison.Ordinal`, `OrdinalIgnoreCase`, `CurrentCulture` hay `InvariantCulture` thế nào cho identifier, dữ liệu hiển thị, sort và key không phân biệt hoa thường?
69. **CS-069 [Middle · ⭐ Rất thường gặp]** Compiler hiện thực iterator dùng `yield return`/`yield break` thế nào; deferred execution, disposal và exception của iterator xuất hiện vào thời điểm nào?
70. **CS-070 [Middle · Thường gặp]** Extension method được khai báo và resolve thế nào; vì sao nó không thật sự thêm virtual member, vẫn có thể nhận receiver null và có rủi ro versioning gì?
71. **CS-071 [Middle · ⭐ Rất thường gặp]** So sánh `IEnumerable<T>`, `ICollection<T>`, `IReadOnlyCollection<T>`, `IList<T>` và `IReadOnlyList<T>` khi thiết kế tham số hoặc kiểu trả về của API.
72. **CS-072 [Middle · Thường gặp]** `checked` và `unchecked` kiểm soát overflow của integral arithmetic/conversion thế nào; vì sao cấu hình build và constant expression có thể làm hành vi khác nhau?
73. **CS-073 [Middle · ⭐ Rất thường gặp]** `try`, `catch` và `finally` thực thi thế nào khi có `return` hoặc exception; vì sao throw trong `finally` và catch quá rộng thường nguy hiểm?
74. **CS-074 [Middle · Thường gặp]** `Action`, `Func`, `Predicate<T>` và custom delegate khác nhau thế nào; khi nào một delegate riêng biểu đạt contract tốt hơn dùng `Func`/`Action`?
75. **CS-075 [Middle · ⭐ Rất thường gặp]** Trả thẳng một `Task` khác gì dùng `async`/`await`; exception timing, stack trace, `using` lifetime và khả năng thêm logic sau await ảnh hưởng quyết định ra sao?
76. **CS-076 [Senior · Thường gặp]** Thứ tự khởi tạo static/instance, static constructor, `beforefieldinit` và `Lazy<T>` ảnh hưởng thế nào đến singleton, publication và lỗi type initialization?
77. **CS-077 [Senior · Thường gặp]** `TaskCompletionSource<T>` nên được hoàn tất và hủy thế nào; continuation chạy inline gây reentrancy/deadlock ra sao và `RunContinuationsAsynchronously` giải quyết gì?
78. **CS-078 [Senior · Thường gặp]** `ExecutionContext`, `AsyncLocal<T>` và `ThreadLocal<T>` khác nhau thế nào; context flow qua `await`/`Task.Run` có thể gây rò dữ liệu hoặc chi phí ở đâu?
79. **CS-079 [Senior · ⭐ Rất thường gặp]** Thiết kế producer–consumer bằng bounded `Channel<T>` khác gì `ConcurrentQueue<T>` cộng signaling hoặc `BlockingCollection<T>`; completion, backpressure và failure propagation cần xử lý thế nào?
80. **CS-080 [Senior · Thường gặp]** Một type sở hữu đồng thời tài nguyên `IDisposable` và `IAsyncDisposable` nên triển khai `Dispose`/`DisposeAsync` thế nào để idempotent, tránh double-dispose và vẫn cleanup đủ khi một bước thất bại?
