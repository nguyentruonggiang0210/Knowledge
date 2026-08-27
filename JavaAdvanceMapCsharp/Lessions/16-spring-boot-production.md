# Bài 16 — Spring Boot production: IoC, Web, transaction proxy và testing

## Bar senior

Giải thích được Spring tạo bean/auto-configuration ra sao, request đi qua filter/dispatcher/controller thế nào, proxy cắt ở đâu và test boundary nào. Phải xây REST contract có validation/error/idempotency, không chỉ biết annotation. [Sample Spring Boot](../SourceSamples/16-spring-boot/src/main/java/course/spring/SpringProductionApplication.java).

## Version map 2026

Spring Boot 4.1.x là stable hiện hành, chạy Java 17–26; Boot 3.5.x vẫn là stable line mà nhiều doanh nghiệp dùng. Boot 4 chuyển mạnh hơn sang Jakarta/Servlet 6.1 và modular starters; `spring-boot-starter-webmvc` thay tên starter web cũ được deprecate. Khi phỏng vấn hãy hỏi version, nhưng trả lời từ principle. Xem [official system requirements](https://docs.spring.io/spring-boot/system-requirements.html) và [build starters](https://docs.spring.io/spring-boot/reference/using/build-systems.html).

## 1. IoC container và bean lifecycle

`ApplicationContext` đọc bean definitions, resolve dependency, tạo/post-process/proxy bean và quản lý lifecycle. Constructor injection:

- dependency bắt buộc và nhìn thấy trong signature; reference có thể lưu ở `final`, nhưng dependency object không tự trở thành immutable;
- dễ unit test, phát hiện cycle sớm;
- không làm singleton thread-safe—bean singleton phải stateless hoặc đồng bộ state.

Scope phổ biến: singleton (per context), prototype, request, session. Inject shorter-lived bean vào singleton cần scoped proxy/provider; hiểu ownership/lifecycle trước khi làm.

`@Configuration`/`@Bean` dùng cho third-party/explicit wiring; stereotype scanning tiện cho app-owned components. Tránh scan toàn classpath và field injection. Bean post-processor/AOP có thể thay object bằng proxy, nên runtime class không nhất thiết là implementation gốc.

### Auto-configuration mental model

Boot import auto-configurations có conditions theo classpath, missing bean, property, web type… User bean thường back off default. Debug bằng condition evaluation report/Actuator, không đoán. Starter là dependency descriptor; BOM/dependency management giữ version set tương thích—không override ngẫu nhiên một transitive dependency.

## 2. Configuration đúng boundary

Dùng immutable `@ConfigurationProperties` + validation thay `@Value` rải rác. Hiểu precedence giữa command line, environment, config data/profile và default. Profile mô tả environment slice, không nên biến thành hàng trăm nhánh business. Secret nằm ở secret manager/mounted source, không commit/log; rotation phải được thiết kế.

C# mapping: `IOptions<T>` gần configuration properties; Generic Host/DI gần application context; middleware gần filter/interceptor nhưng order/lifecycle khác.

## 3. Request pipeline và REST contract

```text
client → container → Filter/SecurityFilterChain → DispatcherServlet
       → interceptor → argument binding/validation → controller
       → application service → port/adapter → response/error advice
```

- Filter phù hợp low-level request/security/context; interceptor phù hợp handler concern; AOP phù hợp method boundary. Chọn đúng layer, tránh log/retry/transaction ba lần.
- Transport DTO không phải domain entity. Validate shape (`@NotBlank`, size) ở transport; invariant/business authorization ở application/domain.
- Jackson mapping cần policy rõ cho unknown field, enum, null, date/time và money. Không expose JPA entity/lazy proxy trực tiếp.
- Error dùng stable machine code + human detail + trace ID, có thể theo RFC Problem Details; không lộ stack/SQL/token.
- HTTP: GET safe/idempotent; PUT idempotent theo resource semantics; POST cần idempotency key nếu retry có thể tạo duplicate. Dùng đúng 201/202/204/400/401/403/404/409/412/422/429.
- Pagination: limit bound; keyset cho deep/volatile list; sort allow-list. ETag/If-Match hữu ích optimistic HTTP concurrency.
- Versioning ưu tiên additive/backward-compatible; deprecation/consumer telemetry trước breaking change.

## 4. MVC, WebFlux hay virtual threads?

- MVC + blocking JDBC phù hợp phần lớn CRUD/service; dễ debug.
- MVC + virtual threads phù hợp I/O blocking concurrency lớn, nhưng vẫn giới hạn DB/downstream.
- WebFlux cần end-to-end non-blocking và team hiểu Reactor/context/backpressure; gọi blocking API trên event loop phá model.
- Không chọn reactive vì “nhanh hơn”. Đo connections, throughput, CPU, tail latency, memory và operational complexity.

Outbound HTTP client luôn cấu hình connect/response/read timeout, pool, deadline propagation và size limit. Retry không đặt mù trong client; eligibility thuộc use case/idempotency.

## 5. AOP và transaction trap

Proxy chỉ intercept call đi qua proxy. Self-invocation, private/final method hoặc object tạo bằng `new` ngoài container có thể bypass advice. Với `@Transactional`:

- default rollback thường cho unchecked exception; checked exception cần policy `rollbackFor` hoặc translation phù hợp;
- `REQUIRED` join/current transaction; `REQUIRES_NEW` suspend outer và mượn connection khác—có thể exhaust pool/deadlock;
- `readOnly` là hint, không phải security guarantee;
- remote call trong transaction dài giữ connection/lock và coupling failure;
- transaction test cùng thread có thể auto rollback, nhưng random-port HTTP server chạy transaction thread khác.

Nếu boundary khó thấy, dùng application service public method hoặc `TransactionTemplate`; đừng “sửa” self-call bằng self-injection không lý giải.

## 6. Test strategy cho Spring

| Test | Dùng | Không chứng minh |
|---|---|---|
| pure unit | domain/application rules, no context | binding/proxy/SQL |
| `@WebMvcTest` | controller, validation, serialization, error/security filter | full wiring/database |
| `@DataJpaTest` | mapping/query/persistence behavior | full service workflow |
| `@SpringBootTest` | context/integration | production network/container mặc định |
| random port | real HTTP/container behavior | external dependencies nếu vẫn fake |
| Testcontainers | production-like Postgres/Kafka/Redis | managed-service config/scale hoàn toàn |

Thêm contract test, WireMock/fake server cho remote protocol, Awaitility/eventually cho async; không `sleep`. Mockito mock behavior boundary, bật strictness, tránh mock graph implementation detail. ArchUnit/static analysis/mutation/property test là tools theo risk chứ không checklist bắt buộc.

## Production checklist

- Actuator health chỉ expose/bảo vệ endpoint cần thiết; liveness không phụ thuộc DB từ xa, readiness có thể phản ánh khả năng phục vụ.
- Graceful shutdown: stop admission, mark unready, drain với timeout, đóng executor/client/pool.
- Structured logs/trace ID, metric low-cardinality, no PII/token.
- Hikari/HTTP/executor pool có capacity/timeout/queue metrics.
- Auto-config/config precedence và dependency BOM có thể giải thích/reproduce.

## Lab

1. Chạy sample; test valid/invalid request và duplicate idempotency key.
2. Tạo self-invocation case, đặt breakpoint/log quanh proxy và sửa boundary.
3. Viết `@WebMvcTest` cho error contract, rồi integration test random port; ghi rõ mỗi test không cover gì.
4. Thêm configuration properties có validation; khởi động với config invalid phải fail fast.

`OrderService` trong sample chỉ chứng minh atomic idempotency **trong một JVM**. Production multi-pod/restart cần unique idempotency key + payload fingerprint + stored response cùng transaction authoritative; không dùng local map làm evidence production. Sample inject `Clock` để timestamp deterministic trong test.

## Interview drill

- Auto-configuration back off thế nào? Debug bean “vì sao có/không có” bằng gì?
- Singleton bean có thread-safe không? Prototype inject vào singleton ra sao?
- Filter/interceptor/AOP khác boundary nào?
- `@Transactional` self-invocation vì sao không chạy? checked exception rollback thế nào?
- MVC/virtual thread/WebFlux: chọn bằng workload và metric nào?
- Thiết kế POST idempotent trước hai concurrent request.

## Quiz

1. Constructor injection có tự loại circular dependency bằng thiết kế không?
2. `@SpringBootTest` luôn khởi động real HTTP server?
3. `REQUIRES_NEW` có miễn phí và độc lập hoàn toàn?
4. Liveness check DB fail nên trả unhealthy để Kubernetes restart ngay?

<details><summary>Đáp án/rubric</summary>

1. Nó phát hiện cycle rõ/sớm; cycle vẫn là design smell cần bỏ, không tự sửa.
2. Không; mặc định mock web environment. Chọn RANDOM_PORT khi cần real server.
3. Không; suspend outer, cần resource/connection khác và có consistency/after-commit implications.
4. Thường không; dependency outage có thể restart cascade. Liveness hỏi process có phục hồi bằng restart không, readiness hỏi có nên nhận traffic.
</details>
