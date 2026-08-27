# Bài 09 — Maven, testing và tooling

## Đích học

Đọc lifecycle Maven, thiết kế test có giá trị và map xUnit/NUnit/MSTest sang JUnit 5.

## Build mapping

| .NET | Java |
|---|---|
| `.sln` / `.csproj` | parent/aggregator `pom.xml`, module `pom.xml` |
| NuGet | Maven Central/repository |
| `dotnet restore/build/test` | `mvn dependency:resolve/package/test` |
| MSBuild target | Maven lifecycle phase + plugin goal |
| xUnit `[Fact]` | JUnit `@Test` |
| fixture/DI test host | extension/test container/framework context |

Maven lifecycle phổ biến: `validate → compile → test → package → verify → install → deploy`. Dependency scope (`compile`, `runtime`, `test`, `provided`) ảnh hưởng classpath và artifact. Pin plugin version, dùng Maven Wrapper trong team, bật reproducible build/lock policy theo tổ chức.

## Test strategy

- Unit test domain rule: nhanh, deterministic, không framework/database/network.
- Integration test adapter: database thật tương thích production qua container khi query/transaction là trọng tâm.
- Contract test: biên HTTP/message/schema.
- End-to-end: ít, cho critical journey.

Test behavior, không test implementation detail. Fake nhỏ thường rõ hơn mock graph lớn. Với time/random/ID, inject `Clock`, generator hoặc port. Không `Thread.sleep` để chờ async; dùng future/latch/eventually có timeout.

### Production test portfolio

- Mockito strict mock chỉ cho interaction boundary; graph mock lớn báo coupling.
- Spring slice (`@WebMvcTest`, `@DataJpaTest`) kiểm tra layer; `@SpringBootTest` kiểm tra wiring; random-port kiểm tra real server boundary.
- Testcontainers dùng PostgreSQL/Kafka/Redis gần production; H2/in-memory fake không chứng minh dialect, lock hay query plan.
- WireMock/fake server kiểm tra outbound protocol/timeout/error; consumer-driven contract kiểm tra compatibility.
- Property-based test cho invariant, mutation test đo test strength, ArchUnit/static analysis giữ rule kiến trúc—áp theo risk.
- Concurrency test tạo race bằng barrier/latch và assert invariant; jcstress cho JMM litmus. Load/stress/soak khác unit test; JMH chỉ microbenchmark.

Maven senior topics: dependency mediation “nearest wins”, `dependency:tree`, BOM/import scope, plugin vs dependency, lifecycle/profile, reproducible artifact, wrapper và supply-chain repository policy. Gradle cần biết task graph/configuration/cache/version catalog ở mức đọc được nếu job dùng, nhưng không cần thuộc DSL cả hai.

### C# refresh

`IQueryable<T>` test bằng in-memory LINQ có thể che khác biệt SQL translation. Tương tự, repository fake không chứng minh JPA/JDBC query đúng. Query quan trọng phải integration-test với engine hoặc dialect gần production.

## Thực hành

[JUnit sample](../SourceSamples/09-testing/src/test/java/course/testing/PriceCalculatorTest.java) · [xUnit-style mapping](../SourceSamples/09-testing/csharp/PriceCalculatorTests.cs)

```powershell
mvn -f SourceSamples/09-testing/pom.xml test
```

Thêm case biên cho rounding và một property: discount không làm total âm.

## Quiz

1. `mvn package` có chạy test mặc định không?
2. Mock repository có chứng minh SQL đúng không?
3. Vì sao inject `Clock`?
4. Test pyramid có nghĩa luôn cần số lượng theo tỷ lệ cố định?

<details><summary>Đáp án</summary>

1. Có, lifecycle đi qua phase test; trừ khi bị skip/config khác.
2. Không; cần integration test database.
3. Để test time-dependent behavior deterministic và mô phỏng boundary.
4. Không; đó là heuristic về feedback/cost, điều chỉnh theo rủi ro hệ thống.
</details>
