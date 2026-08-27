# Bài 11 — Kiến trúc Java service và mapping ASP.NET Core → Spring

## Đích học

Thiết kế service theo boundary rõ ràng và hiểu Spring mà không để framework nuốt domain.

## Mapping hệ sinh thái

| ASP.NET Core | Spring Boot |
|---|---|
| middleware | filter/interceptor |
| built-in DI container | Spring IoC container |
| controller/minimal API | `@RestController` |
| options/configuration | `@ConfigurationProperties` |
| hosted service | scheduled/listener/lifecycle bean |
| EF Core DbContext | JPA EntityManager/repository |
| authentication/authorization | Spring Security filter chain/method security |

Spring bean mặc định singleton, nên phải stateless hoặc thread-safe. Constructor injection làm dependency explicit và test dễ; tránh field injection/service locator. Proxy caveat của bài 08 áp dụng cho `@Transactional`, `@Cacheable`, method security.

## Kiến trúc đề xuất

```text
inbound adapter (HTTP/message)
        -> application use case
              -> domain model/rules
              -> outbound ports
                    -> DB/remote/message adapters
```

Dependency hướng vào domain/application. DTO HTTP, JPA entity và domain model có thể giống ở CRUD nhỏ; tách khi lifecycle, invariant hoặc coupling framework bắt đầu gây đau. Đừng tạo layer/mapping chỉ vì sơ đồ đẹp.

### Cross-cutting production

- Validation ở transport cho shape, ở domain cho invariant.
- Timeout/retry chỉ ở idempotent operation; exponential backoff + jitter; circuit breaker không thay capacity limit.
- Structured logging + correlation/trace ID; metric theo outcome/latency, tránh high-cardinality label.
- Config/secrets externalized; readiness khác liveness; graceful shutdown ngừng nhận request rồi drain.
- API evolution: additive trước, consumer-driven contract, migration DB expand/contract.

### Chọn persistence

- JPA: aggregate CRUD và relation hợp; phải hiểu fetch, flush, persistence context.
- SQL-first (jOOQ/MyBatis/JDBC): reporting/query phức tạp, cần kiểm soát execution plan. Xem mapping MyBatis ↔ Dapper ở [bài 27](27-mybatis-dapper-sql-mapper.md).
- Có thể kết hợp theo use case (CQRS nhẹ), không cần tôn giáo công cụ.

## Thực hành

[Hexagonal sample thuần Java](../SourceSamples/11-architecture/src/main/java/course/architecture/ArchitectureDemo.java) · [C# mapping](../SourceSamples/11-architecture/csharp/Program.cs)

Sample cố ý không kéo Spring để domain boundary nhìn rõ. Hãy thay in-memory adapter bằng JDBC adapter bài 10; controller/framework chỉ gọi input port.

Sau bài này phải làm [Spring Boot production sample thật](16-spring-boot-production.md), [JPA/Hibernate](17-jpa-hibernate-persistence.md), [MyBatis/Dapper](27-mybatis-dapper-sql-mapper.md) và [Security](18-security-oauth-owasp.md). Bài 11 chỉ dạy boundary kiến trúc, không đủ chứng minh Spring fluency.

## Quiz

1. Spring singleton bean có an toàn thread mặc định?
2. `@Transactional` trên private/self-called method có chắc chạy?
3. Khi nào nên tách JPA entity khỏi domain entity?
4. Retry mọi POST có an toàn?

<details><summary>Đáp án</summary>

1. Không; scope singleton không tạo thread safety.
2. Không; proxy thường không intercept self-invocation/private method.
3. Khi persistence constraints/lifecycle/loading làm rò rỉ hoặc phá domain invariant; CRUD đơn giản có thể chưa cần.
4. Không; chỉ khi operation idempotent hoặc có idempotency key/semantics phù hợp.
</details>
