# Source samples

Các thư mục 01–25 và 27 là Maven project riêng; module core kế thừa cấu hình Java 21 từ `pom.xml` ở root. Bài 26 là artifact Markdown, không phải project build. Build một bài Java:

```powershell
mvn -f SourceSamples/06-concurrency/pom.xml test
```

Sau khi build, chạy main class (ví dụ bài 06):

```powershell
java -cp SourceSamples/06-concurrency/target/classes course.concurrency.ConcurrencyDemo
```

Các module có runtime đặc biệt:

```powershell
# JPMS/SPI phải chạy trên module path; classpath sẽ bỏ qua `provides` trong module-info.java.
java --module-path SourceSamples/14-modules-classloading/target/classes --module course.modules/course.modules.ModuleDemo

# Spring Boot 16; 17 chỉ cho phép create-drop trong profile local.
mvn -f SourceSamples/16-spring-boot/pom.xml spring-boot:run
mvn -f SourceSamples/17-jpa-hibernate/pom.xml spring-boot:run "-Dspring-boot.run.profiles=local"

# MyBatis core + mapper XML và bản Dapper đối chiếu.
mvn -f SourceSamples/27-mybatis-dapper/pom.xml exec:java "-Dexec.mainClass=course.mybatis.MyBatisDemo"
dotnet run --project SourceSamples/27-mybatis-dapper/csharp/MyBatisDapperMapping.csproj

# Security local demo: inject secret, không có password mặc định trong source.
$env:COURSE_SECURITY_READER_PASSWORD = "replace-local-secret"
$env:COURSE_SECURITY_ADMIN_PASSWORD = "replace-local-secret"
mvn -f SourceSamples/18-security/pom.xml spring-boot:run "-Dspring-boot.run.profiles=local"
```

Modules 16–18 khai báo Spring Boot Maven plugin nên `mvn package` tạo executable jar. Profile mặc định của bài 18 là OAuth2 Resource Server và cần issuer/JWK config thật.

Thư mục `csharp/` là bản đối chiếu cô đọng, không phải bản dịch từng dòng. Mỗi thư mục đã có `.csproj`; chạy `dotnet build SourceSamples/01-runtime-types/csharp/RuntimeTypes.csproj` hoặc `dotnet test SourceSamples/09-testing/csharp/TestingMapping.csproj`.

| Bài | Main class | Trọng tâm |
|---|---|---|
| 01 | `course.runtime.RuntimeTypesDemo` | pass-by-value, equality, optional |
| 02 | `course.domain.DomainModelDemo` | record, sealed, invariant |
| 03 | `course.collections.CollectionsDemo` | PECS, defensive copy |
| 04 | `course.streams.StreamDemo` | lazy stream, grouping |
| 05 | `course.errors.ResourceDemo` | try-with-resources, suppressed error |
| 06 | `course.concurrency.ConcurrencyDemo` | virtual thread, future, atomic |
| 07 | `course.jvm.JvmMemoryDemo` | bounded cache, allocation/measurement |
| 08 | `course.reflection.ReflectionDemo` | annotation + dynamic proxy |
| 09 | tests | JUnit + injectable Clock |
| 10 | `course.sql.JdbcDemo` | JDBC, SQL, rollback/version |
| 11 | `course.architecture.ArchitectureDemo` | ports/adapters/use case |
| 12 | `course.capstone.CapstoneDemo` | capstone skeleton |
| 13 | `course.stdlib.StandardLibraryDemo` | money/time/Unicode/NIO traps |
| 14 | `course.modules.ModuleDemo` | JPMS + ServiceLoader/SPI |
| 15 | `course.concurrencydeep.ConcurrencyDeepDemo` | safe publication + bounded executor |
| 16 | `course.spring.SpringProductionApplication` | Spring Boot REST/config/idempotency |
| 17 | `course.jpa.JpaApplication` | JPA/version/atomic stock update |
| 18 | `course.security.SecurityApplication` | Spring Security 401/403/roles |
| 19 | `course.messaging.MessagingDemo` | in-process inbox/fingerprint model; không phải Kafka integration |
| 20 | `course.distributed.DistributedSystemsDemo` | in-process versioned-write model; không phải distributed store |
| 21 | `course.resilience.ResilienceDemo` | bounded TTL model/token bucket/circuit state; không thay production library |
| 22 | `course.observability.ObservabilityDemo` | telemetry semantics model; không phải OTel SDK/exporter |
| 23 | `course.networking.NetworkingDemo` | teaching HTTP/probe/deadline + container/Kubernetes |
| 24 | `course.interview.Algorithms` | DSA + JUnit edge cases |
| 25 | `course.systemdesign.SystemDesignDemo` | capacity-estimation sanity checks |
| 26 | Markdown artifacts | behavioral story bank/project deep dive |
| 27 | `course.mybatis.MyBatisDemo` | MyBatis mapper/XML/session/transaction ↔ Dapper |

Các module 16–18 dùng Spring Boot 4.1.1 độc lập; các module core còn lại giữ compatibility target Java 21. Bài 17 và 27 dùng H2 để sample chạy nhanh nhưng lesson yêu cầu PostgreSQL/Testcontainers cho claim liên quan dialect/generated key/isolation/query plan.
