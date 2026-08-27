# Java Advanced for C# Engineers

Khóa học thực hành dành cho lập trình viên C# middle/senior muốn học Java bằng cách ánh xạ từ kiến thức đã có, đồng thời ôn lại các phần C# và SQL thường bị bỏ sót.

## Bắt đầu

1. Đọc [senior competency matrix](Lessions/00-senior-competency-matrix.md) rồi [roadmap và cách học](Lessions/README.md).
2. Học các bài technical theo dependency trong roadmap; bắt đầu lane DSA và behavioral từ tuần 1 thay vì đợi học xong core. Mỗi bài có mapping C# ↔ Java khi phù hợp, bối cảnh dự án, lỗi thường gặp và quiz.
3. Chạy sample theo lệnh ghi trong từng bài. Toàn bộ sample nằm trong [SourceSamples](SourceSamples/README.md).
4. Làm capstone sau khi hoàn thành các bài nền tảng.

Baseline chạy sample: Java 21 LTS, Maven 3.9+, .NET 8/9 và SQL chuẩn (ví dụ dùng H2). Phần interview hiện đại còn đối chiếu Java 25 LTS và Spring Boot 4.x; các sample core giữ Java 21 để sát cả codebase doanh nghiệp chưa nâng cấp.

## Bản đồ nhanh

| C#/.NET | Java/JVM |
|---|---|
| CLR, IL, JIT | JVM, bytecode, JIT |
| assembly/project/solution | JAR/module/Maven multi-module |
| property, record, struct | getter/setter, record, primitive/value-oriented class |
| LINQ, `IEnumerable<T>` | Stream API, `Iterable<T>` |
| `Task`, async/await | `CompletableFuture`, virtual thread, structured concurrency |
| `using`, `IDisposable` | try-with-resources, `AutoCloseable` |
| attribute | annotation |
| reflection | reflection + method handles |
| ASP.NET Core DI | Spring DI / Jakarta CDI |
| ADO.NET / Dapper / EF Core | JDBC / MyBatis / JPA-Hibernate |
| NuGet/MSBuild | Maven/Gradle |

Roadmap hiện có 27 bài: 12 bài bridge/core ban đầu, 12 bài production/data/distributed/cloud và 3 bài interview execution (DSA, system design, leadership).

> Không nên dịch code C# sang Java từng dòng. Hãy chuyển **ý định thiết kế**, rồi dùng idiom và hệ sinh thái của Java.
