# Bài 05 — Exception, resource ownership và error boundary

## Đích học

Phân loại lỗi, thiết kế exception contract, quản lý tài nguyên deterministically và tránh mất root cause.

## Mapping

Trong Java, `RuntimeException`, `Error` và subclass của chúng là unchecked; các throwable type còn lại là checked và chịu quy tắc catch/declare. C# không có checked exception. Checked exception hữu ích khi caller có hành động recovery rõ; dùng quá mức tạo catch-and-wrap boilerplate.

| Ý định | Java | C# |
|---|---|---|
| resource scope | try-with-resources + `AutoCloseable` | `using` + `IDisposable/IAsyncDisposable` |
| rethrow | `throw;` không tồn tại; `throw e` giữ object nhưng stack đã có | `throw;` giữ stack; `throw ex;` làm thay đổi stack |
| cause | `new X(msg, cause)` | `new X(msg, innerException)` |
| cleanup failures | suppressed exceptions | dispose exception có thể che lỗi nếu xử lý không cẩn thận |

Try-with-resources đóng theo thứ tự ngược khai báo. Nếu body và `close()` cùng lỗi, lỗi body là primary, lỗi close nằm trong `getSuppressed()`.

## Thiết kế production

- Domain validation: return typed result hoặc exception cụ thể tùy style; đừng dùng exception cho flow thường xuyên.
- Infrastructure failure: translate ở boundary (`SQLException` → `OrderRepositoryException`) nhưng luôn giữ cause.
- HTTP boundary: map domain/not-found/conflict/validation sang status nhất quán; không lộ stack trace.
- Log một lần tại boundary có đủ context; vừa log vừa throw ở mọi layer tạo log trùng.
- Catch `InterruptedException`: restore interrupt bằng `Thread.currentThread().interrupt()` nếu không propagate.

### C# refresh

`using`/`await using` thể hiện ownership. GC không thay thế disposal cho socket, stream, DB connection. Java cũng vậy. Không dùng finalizer: finalization đã deprecated for removal và có thể bị runtime vô hiệu hóa. Dùng resource scope; `Cleaner` chỉ là safety net cho resource đặc biệt, không thay cleanup deterministic.

## Thực hành

[Java sample](../SourceSamples/05-exceptions-resources/src/main/java/course/errors/ResourceDemo.java) · [C# mapping](../SourceSamples/05-exceptions-resources/csharp/Program.cs)

Quan sát primary/suppressed exception, sau đó thêm exception translation vẫn giữ root cause.

## Quiz

1. Checked exception có nghĩa là recoverable không?
2. Vì sao không catch `Exception` rồi trả null?
3. Thứ tự close của nhiều resource?
4. Khi catch `InterruptedException` mà không throw tiếp, cần làm gì?

<details><summary>Đáp án</summary>

1. Không tự động; đó chỉ là compiler contract. Thiết kế phải dựa trên khả năng caller xử lý.
2. Mất nguyên nhân, biến lỗi thành null xa nguồn và dễ tạo lỗi thứ cấp.
3. Ngược thứ tự khai báo.
4. Khôi phục interrupt flag và kết thúc/propagate theo contract.
</details>
