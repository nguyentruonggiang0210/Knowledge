# Bài 08 — Annotation, reflection, proxy và framework mechanics

## Đích học

Hiểu cơ chế phía sau DI/ORM/test framework và giới hạn của reflection/proxy.

## Mapping

C# attribute lưu metadata; Java annotation cũng vậy nhưng phải khai báo `@Retention` (SOURCE/CLASS/RUNTIME) và `@Target`. Muốn reflection runtime thấy annotation, cần `RetentionPolicy.RUNTIME`.

Reflection đọc type/member và invoke động. `MethodHandle` thường composable/optimizable hơn cho infrastructure nâng cao. Annotation processor chạy compile-time có thể sinh code và bắt lỗi sớm; source generator của C# có vai trò gần tương tự.

### Proxy/AOP traps

- Interface dynamic proxy chỉ intercept call qua proxy/interface.
- Subclass proxy không override được final method/class.
- Self-invocation (`this.otherMethod()`) thường bypass proxy, nên transaction/cache/security annotation có thể không chạy.
- Reflection phá compile-time safety và encapsulation; dùng ở framework boundary, không thay domain polymorphism.

- Dynamic proxy invoke method ném checked exception không khai báo trong interface có thể bị bọc `UndeclaredThrowableException`; framework boundary phải unwrap/translate có chủ đích và giữ cause.

### Production use cases

- Annotation phù hợp metadata/declarative policy ổn định: validation, mapping, authorization marker.
- Không nhét business workflow phức tạp vào annotation khó debug.
- Với native image/AOT, reflection/proxy có thể cần configuration hoặc generated code.
- Cache metadata (`ClassValue`, map phù hợp) thay vì scan lặp lại hot path; chú ý class-loader leak.

## Thực hành

[Mini annotation framework](../SourceSamples/08-annotations-reflection/src/main/java/course/reflection/ReflectionDemo.java) · [C# attribute mapping](../SourceSamples/08-annotations-reflection/csharp/Program.cs)

Thêm annotation `@Timed`, intercept method qua dynamic proxy và kiểm tra method không nằm trên interface có được gọi qua proxy không.

## Quiz

1. Annotation mặc định có chắc đọc được runtime?
2. Vì sao self-invocation hay làm `@Transactional` mất tác dụng?
3. Khi nào compile-time generation tốt hơn reflection?
4. Reflection có nên thay interface/polymorphism domain?

<details><summary>Đáp án</summary>

1. Không; cần retention RUNTIME.
2. Call không đi qua proxy/interceptor.
3. Khi cần startup nhanh, type safety, AOT/native image hoặc giảm runtime scanning.
4. Thường không; reflection dành cho infrastructure/open-ended metadata.
</details>
