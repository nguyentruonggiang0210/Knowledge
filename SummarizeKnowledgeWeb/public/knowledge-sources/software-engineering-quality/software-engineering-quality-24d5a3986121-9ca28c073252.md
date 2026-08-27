# Bài 02 — OOP và domain modeling theo idiom Java

## Đích học

Chuyển tư duy class/interface C# sang Java; dùng record, sealed type, composition và immutability để mô hình hóa domain.

## Mapping

| C# | Java | Ghi chú |
|---|---|---|
| property | accessor method / record component | Java không có property cấp ngôn ngữ |
| `record` | `record` | Đều hợp với value object; Java record luôn final |
| `sealed` + pattern matching | sealed class/interface + switch pattern | `permits` làm tập subtype đóng |
| extension method | static utility/default interface method | Không có extension method tổng quát |
| explicit interface implementation | không tương đương trực tiếp | Giải quyết bằng adapter/composition/API redesign |
| `internal` | package-private / JPMS export | Package-private rất hữu ích để giữ encapsulation |

### Nguyên tắc thiết kế

- Dùng constructor/factory để object hợp lệ ngay khi sinh ra; validate invariant ở domain boundary.
- Ưu tiên composition. Inheritance chỉ khi subtype thực sự thay thế được base type (LSP).
- Interface nhỏ mô tả capability; đừng tạo `IClassName` cho mọi class chỉ vì quen từ C#.
- Record phù hợp `Money`, `Email`, command/result; entity có lifecycle và identity thường là class.
- Sealed hierarchy + exhaustive switch phù hợp tập trạng thái/loại nghiệp vụ đóng. Strategy/registry phù hợp extension bởi plugin.

### C# refresh

C# `record class` là reference type, `record struct` là value type. `init` chỉ giới hạn lúc khởi tạo, không làm sâu toàn object graph bất biến. Java record cũng shallow immutable: component là `List` vẫn có thể mutable; dùng `List.copyOf` trong compact constructor.

Với `BigDecimal`, equality của record kế thừa `BigDecimal.equals`: `10.0` và `10.00` khác nhau vì scale, dù `compareTo` bằng 0. Value object tiền phải canonicalize scale/rounding/currency trước khi dùng làm key/equality; xem [bài 13](13-standard-library-api-design.md).

### Trong dự án

- Payment method đóng (`Card`, `BankTransfer`): sealed hierarchy.
- Tax provider cần thêm theo quốc gia/deployment: interface + DI, không sealed.
- Entity ORM: constructor/proxy constraints có thể xung đột domain purity; tách persistence model nếu domain phức tạp.

## Thực hành

[Java domain sample](../SourceSamples/02-domain-model/src/main/java/course/domain/DomainModelDemo.java) · [C# mapping](../SourceSamples/02-domain-model/csharp/Program.cs)

Thêm `Wallet` payment method. Bạn phải quyết định sửa sealed hierarchy hay chuyển sang registry và ghi lý do.

## Quiz

1. Record có đảm bảo deep immutability không?
2. Khi nào sealed type tốt hơn interface mở?
3. Vì sao inheritance để tái sử dụng code thường tạo coupling?
4. Package-private giúp kiến trúc thế nào?

<details><summary>Đáp án</summary>

1. Không; phải defensive copy các component mutable.
2. Khi tập case hữu hạn, thuộc quyền kiểm soát và cần exhaustive handling.
3. Subclass phụ thuộc implementation/contract của base và dễ vi phạm substitutability.
4. Giấu implementation trong package, thu nhỏ public API và giới hạn coupling.
</details>
