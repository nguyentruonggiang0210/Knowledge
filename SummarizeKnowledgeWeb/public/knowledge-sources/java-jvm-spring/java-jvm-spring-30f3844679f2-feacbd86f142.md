# Bài 04 — Lambda, Stream API và LINQ

## Đích học

Dùng stream đúng semantics, hiểu lazy/deferred execution, side effect, collector và parallelism.

## LINQ ↔ Stream

| LINQ | Java Stream |
|---|---|
| `Where` | `filter` |
| `Select` | `map` |
| `SelectMany` | `flatMap` |
| `Any/All` | `anyMatch/allMatch` |
| `GroupBy` | `collect(groupingBy(...))` |
| `ToDictionary` | `collect(toMap(...))` |
| `Aggregate` | `reduce` |
| `IEnumerable<T>` tái enumerate được tùy source | Stream chỉ consume một lần |

Intermediate operation lazy; terminal operation mới chạy pipeline. Lambda chỉ capture local variable effectively-final, khác C# closure có thể gán lại biến capture. Method reference (`Order::total`) tương tự method group ở C#.

### Quy tắc production

- Pipeline nên stateless, non-interfering; không mutate external list trong `map/forEach`.
- `toMap` phải có merge function nếu key có thể trùng.
- Dùng primitive stream (`mapToInt`) để giảm boxing ở aggregate lớn.
- Không bật `parallelStream()` theo cảm tính: common pool dùng chung, blocking I/O làm nghẽn; đo workload CPU-bound đủ lớn trước.
- Stream tốt cho transformation; loop thường rõ hơn với control flow phức tạp/early mutation.

### Collector/parallel semantics

Reduction song song cùng type cần associative operation và identity thật sự neutral. Với overload ba tham số `reduce`, combiner phải associative, identity neutral với combiner và accumulator phải tương thích với combiner; accumulator `BiFunction<U,T,U>` không nhất thiết tự có phép “associative” độc lập. Collector có supplier/accumulator/combiner/finisher và characteristics (`CONCURRENT`, `UNORDERED`, `IDENTITY_FINISH`); khai báo sai tạo race/kết quả sai. Encounter order, `Spliterator` khả năng split/size và stateful ops như `sorted/distinct/limit` ảnh hưởng parallel cost. `forEachOrdered` giữ order nhưng giảm freedom. Hãy chứng minh bằng benchmark workload thật; không dùng parallel stream cho blocking I/O trên common pool.

### SQL connection

`filter/map/grouping` gợi SQL `WHERE/SELECT/GROUP BY`, nhưng SQL engine có index, optimizer và xử lý gần data. Query database trước, stream chỉ làm business transformation không biểu diễn tốt trong SQL. Tránh load cả bảng rồi `.filter()`.

## Thực hành

[Java order pipeline](../SourceSamples/04-functional-streams/src/main/java/course/streams/StreamDemo.java) · [C# LINQ](../SourceSamples/04-functional-streams/csharp/Program.cs)

Thêm duplicate category vào `toMap` và sửa bằng merge function. Sau đó viết lại pipeline bằng loop, so sánh độ rõ.

## Quiz

1. Stream được enumerate hai lần không?
2. Side effect trong `map` gây vấn đề gì khi parallel?
3. Khi nào `parallelStream` phù hợp?
4. Deferred execution có rủi ro chung nào ở LINQ và Stream?

<details><summary>Đáp án</summary>

1. Không; terminal operation xong thì stream đã consumed.
2. Race condition, nondeterminism và vi phạm contract stateless/non-interfering.
3. CPU-bound, dữ liệu đủ lớn, operation độc lập, benchmark chứng minh lợi ích và common pool phù hợp.
4. Source có thể đổi, exception xảy ra muộn, query chạy nhiều/ngoài lifetime resource nếu không materialize đúng chỗ.
</details>
