# Bài 01 — JVM, runtime và type system

## Đích học

Hiểu đường đi source → bytecode → JVM/JIT; phân biệt value/reference, boxing, null và equality; đọc được cấu trúc Maven tối thiểu.

## Mapping C# → Java

| C# | Java | Điểm cần nhớ |
|---|---|---|
| C# → IL → CLR | Java → bytecode → JVM | Đều có JIT; JVM còn có tiered compilation/deoptimization |
| `int` / `System.Int32` | `int` / `Integer` | Java generic không nhận primitive; boxing có cache làm `==` nguy hiểm |
| nullable reference analysis | `Optional<T>` và annotation nullability | `Optional` chủ yếu cho return type, không thay mọi `null` |
| `==` thường là value cho `string` | `==` so identity; `.equals` so logical value | Luôn dùng `Objects.equals(a,b)` khi có thể null |
| assembly | JAR | Package là namespace + access boundary; module JPMS là lớp boundary khác |

`javac` tạo bytecode độc lập CPU. Class loader nạp/xác minh/liên kết class; interpreter khởi chạy nhanh, JIT biên dịch hot path. Vì warm-up và profile-guided optimization, benchmark JVM bằng stopwatch tự viết thường sai; dùng JMH.

Java truyền tham số **by value**. Với object, giá trị được copy là reference; method có thể mutate object nhưng không thể đổi biến reference của caller. C# cũng pass-by-value mặc định, nhưng có `ref/in/out` và value type `struct`.

### Equality contract

Nếu override `equals`, phải override `hashCode`. Equality cần reflexive, symmetric, transitive, consistent và false với null. Không thay đổi field tham gia hash khi object đang là key trong `HashMap`. Java `record` tự sinh value equality; C# `record` cũng vậy.

### Dùng ở dự án thực tế

- DTO/value object: ưu tiên `record` khi dữ liệu bất biến và identity không quan trọng.
- Entity: equality theo stable identity, cẩn thận ID do database cấp sau khi persist.
- Public API: `Optional<T>` cho “có thể không có kết quả”; collection rỗng thay vì optional collection.
- Hot path: tránh boxing ngoài ý muốn, nhưng chỉ sửa sau profiling.

## Thực hành

Chạy [sample Java](../SourceSamples/01-runtime-types/src/main/java/course/runtime/RuntimeTypesDemo.java) và xem [bản đối chiếu C#](../SourceSamples/01-runtime-types/csharp/Program.cs).

```powershell
mvn -f SourceSamples/01-runtime-types/pom.xml test
```

Thử bỏ `hashCode` của `Money`, thêm hai object bằng nhau vào `HashSet`, rồi giải thích kết quả.

## Quiz

1. `Integer a = 100; Integer b = 100; a == b` có phải quy tắc đúng để so giá trị không?
2. Java có truyền object “by reference” không?
3. Vì sao mutable key làm hỏng lookup của `HashMap`?
4. Khi nào không nên dùng `Optional`?

<details><summary>Đáp án</summary>

1. Không phải quy tắc tổng quát. Với đúng constant `100`, JLS bắt buộc hai boxing conversion cho cùng identity nên biểu thức là `true`; đổi sang giá trị ngoài khoảng bắt buộc cache hoặc tạo object khác thì kết quả có thể khác. `==` vẫn so identity, hãy dùng `equals` để so value.
2. Không. Java luôn pass-by-value; value đó có thể là một reference.
3. Hash/bucket có thể đổi sau insertion nên map tìm sai bucket.
4. Thường tránh ở field/entity/parameter, collection optional, và nơi serialization framework không hỗ trợ tốt.
</details>
