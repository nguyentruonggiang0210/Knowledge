# Bài 13 — Java semantics, standard library và API design traps

## Bar senior

Không chỉ nhớ API: phải dự đoán được overload/dispatch/initialization, chọn representation cho text/time/money, giữ ownership I/O và thiết kế public API tương thích. [Sample](../SourceSamples/13-standard-library/src/main/java/course/stdlib/StandardLibraryDemo.java) cố ý chứa các case dễ sai để chạy và sửa.

## 1. Semantics hay bị hỏi sâu

### Số, boxing và null

- Các primitive integer `byte/short/int/long` có dấu; `char` là integral primitive 16-bit không dấu. Overflow integer chạy theo two's-complement, không tự throw. Dùng `Math.addExact/multiplyExact` khi overflow là lỗi nghiệp vụ. C# có `checked/unchecked` context.
- Widening primitive có thể tự động; narrowing cần cast và có thể mất dữ liệu. `double` không biểu diễn chính xác tiền thập phân.
- Unboxing `Integer null` thành `int` ném `NullPointerException`. `Integer == Integer` so identity; cache boxing chỉ làm bug có vẻ “lúc đúng lúc sai”.
- `BigDecimal.equals` xét cả value và scale: `10.0` khác `10.00`; `compareTo` trả 0. Chuẩn hóa scale/rounding tại value-object boundary, không rải `setScale` khắp code.

### Overload, override và initialization

- Overload được chọn compile-time theo static type; override dispatch runtime theo object type. Static method là **hidden**, không polymorphic.
- Constructor gọi overridable method có thể dispatch vào subclass trước khi field subclass được khởi tạo; tránh pattern này.
- Trong một class: static field/block theo textual order một lần; khi tạo object, instance field/block theo textual order rồi constructor. Với inheritance, superclass static initialization chạy trước subclass; superclass instance initialization/constructor hoàn tất trước phần instance của subclass. Class initialization failure thường trở thành `ExceptionInInitializerError`; lần dùng sau có thể là `NoClassDefFoundError`.
- `final` reference không cho reassign nhưng object vẫn có thể mutable; gần `readonly` field của C#, không tương đương deep immutability.
- Array Java covariant (`String[]` là `Object[]`) nên có thể `ArrayStoreException` runtime; generic invariant để bắt lỗi compile-time.

### Generic/varargs trap

Type erasure tạo non-reifiable type; không có `new T[]`, `instanceof List<String>` hay generic overload chỉ khác type argument. Compiler có thể sinh bridge method để giữ polymorphism sau erasure. Generic varargs có thể tạo heap pollution; chỉ dùng `@SafeVarargs` khi implementation thật sự không ghi/escape array nguy hiểm.

## 2. Text, Unicode và regex

`String.length()` đếm UTF-16 code unit, không phải Unicode code point hay grapheme người dùng nhìn thấy. Emoji có thể dài 2 code unit; grapheme còn phức tạp hơn. Khi cắt/đếm identifier quốc tế, xác định rõ unit và normalization. Luôn chỉ rõ `Charset` ở boundary (`UTF_8`), không dựa platform default.

Nối chuỗi nhỏ bằng `+` thường được compiler tối ưu; loop lớn dùng `StringBuilder`. Không `intern()` dữ liệu tùy ý như một cache. Regex từ input có thể gây ReDoS; giới hạn input, tránh nested ambiguous quantifier và đặt timeout/boundary nếu engine/workload yêu cầu.

## 3. Time đúng nghĩa

| Ý định | Java | .NET |
|---|---|---|
| thời điểm tuyệt đối | `Instant` | `DateTimeOffset`/`Instant` trong NodaTime |
| ngày theo lịch | `LocalDate` | `DateOnly` |
| giờ local chưa có zone | `LocalDateTime` | `DateTime` (semantics phải rõ) |
| offset cố định | `OffsetDateTime` | `DateTimeOffset` |
| timezone + DST rules | `ZonedDateTime` + `ZoneId` | `TimeZoneInfo`/NodaTime |
| test clock | inject `Clock` | `TimeProvider` |

Không lưu một event chỉ bằng `LocalDateTime`: nó không xác định duy nhất trên timeline. DST có gap/overlap; “cộng 24 giờ” khác “cùng giờ ngày mai”. Persist `Instant`/UTC cho event, giữ zone ID khi business rule phụ thuộc địa phương; API contract phải nêu format/precision.

## 4. I/O, NIO và ownership

- Byte stream xử lý binary; reader/writer xử lý character với charset.
- `Path`/`Files` là mặc định cho filesystem. `Files.lines()` và directory stream giữ resource: đóng bằng try-with-resources.
- `ByteBuffer` có `capacity`, `position`, `limit`; sau ghi, `flip()` đặt limit=position rồi position=0 để đọc. Channel có thể partial read/write; loop đến khi contract hoàn tất.
- Direct buffer nằm ngoài Java heap, hữu ích cho native I/O nhưng vẫn chiếm RSS và cleanup không deterministic theo lexical scope. Đừng pool/cấp direct buffer tùy tiện.
- Native Java serialization (`ObjectInputStream`) gắn wire format với object graph và có lịch sử gadget/security risk; ưu tiên schema rõ (JSON/Protobuf/Avro) và allow-list nếu buộc đọc legacy data.

## 5. Public API senior checklist

- Nhận/trả interface phù hợp; collection trả ra immutable snapshot hoặc document live view.
- Không dùng `null`, exception và optional lẫn lộn cho cùng một outcome. `Optional` chủ yếu cho return, không phải mọi field/parameter.
- Value type validate/canonicalize một chỗ; money có currency/scale/rounding; ID là typed wrapper nếu tránh nhầm có giá trị.
- Method name thể hiện side effect/blocking/ownership. API async phải nói executor, cancellation và deadline semantics.
- Preserve source/binary/behavioral compatibility; thêm overload cũng có thể làm source call trở nên ambiguous.
- Random nghiệp vụ thường dùng `RandomGenerator`; token/secret dùng `SecureRandom`, không tự chế crypto.

## Java 17 → 21 → 25 cần nhận biết

Java 21 đưa record pattern và pattern matching for switch thành standard, virtual thread thành standard. Java 25 là LTS hiện tại và finalizes một số ergonomic feature như module imports/compact source files; production code vẫn cần policy compiler/toolchain rõ. Hãy phân biệt **standard**, **preview** và **incubator** khi trả lời interview.

## Lab failure-first

1. Chạy sample, giải thích `BigDecimal` trong `HashSet`, emoji length và DST gap.
2. Sửa/kiểm tra `Money` để `10.0` và `10.00` có equality/hash nhất quán theo domain; test USD/JPY/KWD và excess precision. Sample dùng ISO currency fraction digits + `UNNECESSARY`, còn business khác có thể chọn rounding policy explicit.
3. Đọc file UTF-8 bằng `Files.lines()` trong resource scope; thử ký tự ngoài BMP.
4. Viết test round-trip API timestamp qua hai timezone và DST transition.

## Interview drill

- Vì sao `BigDecimal.compareTo()==0` nhưng `HashSet.contains` có thể false? Bạn chọn canonicalization nào?
- Overload và override khác thời điểm binding ra sao? Static method/field có polymorphic không?
- `final List<T>` đảm bảo điều gì, không đảm bảo điều gì?
- `ByteBuffer.flip()` đổi state nào? Vì sao một lần `channel.write(buffer)` chưa chắc ghi hết?
- Chọn `Instant`, `OffsetDateTime`, `ZonedDateTime` cho booking toàn cầu thế nào?

## Quiz

1. `String.length()` có phải số ký tự người dùng nhìn thấy?
2. `Integer value = null; int x = value` thất bại lúc compile hay runtime?
3. Khi nào `Math.addExact` đáng dùng?
4. Vì sao deserialize object từ nguồn không tin cậy nguy hiểm?

<details><summary>Đáp án/rubric</summary>

1. Không; nó là số UTF-16 code unit. Code point/grapheme có semantics khác.
2. Compile được, runtime ném NPE khi unbox.
3. Khi overflow phải là failure rõ thay vì wraparound, như tiền/count/capacity có invariant.
4. Input có thể điều khiển object graph/type và kích hoạt gadget; format cũng coupling chặt với class evolution. Câu trả lời mạnh nêu allow-list/schema/size limit và boundary isolation.
</details>
