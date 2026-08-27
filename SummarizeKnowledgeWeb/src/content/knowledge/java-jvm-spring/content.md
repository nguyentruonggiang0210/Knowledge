## Bản đồ học: từ nền C# đến Senior Java

Nguồn `JavaAdvanceMapCsharp` tổ chức kiến thức thành ba lane chạy song song, không phải 27 bài phải học tuần tự máy móc:

| Lane | Trọng tâm | Bằng chứng nên tạo |
|---|---|---|
| Java depth | type system, collections, JVM, concurrency, module | sample chạy được, giải thích được semantic khác C# |
| Backend production | Spring, SQL, persistence, security, distributed/cloud | service có failure path, test và telemetry |
| Interview execution | DSA, LLD/HLD, behavioral | mock có rubric và error log |

Baseline của sample là Java 21 LTS; tài liệu còn giúp đọc Java 17 legacy và nhận biết thay đổi Java 25. Hãy bắt đầu ở `Lessions/00-senior-competency-matrix.md`, chọn năng lực P0 dưới mức 3, rồi dùng roadmap 16 tuần trong `Lessions/README.md` để ưu tiên.

Nguyên tắc xuyên suốt: ánh xạ **ý định thiết kế**, không dịch C# sang Java từng dòng.

## Ngôn ngữ, type system và domain model

Những khác biệt nhỏ ở cú pháp thường dẫn đến lỗi lớn ở runtime:

| Ý định | C#/.NET | Java | Điều phải nhớ |
|---|---|---|---|
| Runtime | IL, CLR, JIT | bytecode, JVM, JIT | warm-up và deoptimization làm benchmark ngây thơ sai |
| Giá trị nullable | nullable analysis | `null`, annotation, `Optional<T>` | `Optional` chủ yếu dành cho return type |
| So sánh | `==` thường so value cho `string` | `==` so identity, `equals` so value | override `equals` phải đi cùng `hashCode` |
| Value object | record/record struct | record | cả hai chỉ bất biến nông |
| Tập subtype đóng | sealed type | sealed class/interface | phù hợp exhaustive switch, không phù hợp plugin mở |

Java luôn truyền tham số **by value**; với object, giá trị được copy là reference. Boxing tạo bẫy identity (`Integer == Integer`), generic không nhận primitive, và mutable key có thể làm `HashMap` không còn tìm thấy phần tử.

Domain object nên hợp lệ ngay khi được tạo. Dùng record cho value object/DTO, class cho entity có identity và lifecycle, defensive copy cho collection, và canonicalize `BigDecimal` theo currency/scale/rounding trước khi dùng trong equality.

## Generics, collections, Stream và thiết kế API

Generic Java chủ yếu dùng type erasure và use-site variance. Quy tắc nhớ nhanh là **PECS**:

```java
static <T> void copy(
    List<? extends T> source, // producer
    List<? super T> target)   // consumer
{
    target.addAll(source);
}
```

- `ArrayList` là lựa chọn mặc định cho list; `ArrayDeque` cho stack/queue.
- `ConcurrentHashMap` chỉ atomic theo từng operation; chuỗi `get → decide → put` vẫn race nếu không dùng atomic method hoặc lock.
- `List.copyOf` tạo snapshot bất biến nông; `unmodifiableList` chỉ là view.
- Comparator trả `0` quyết định trùng key trong tree collection, kể cả khi `equals` khác.

Stream gần LINQ ở `filter/map/flatMap/grouping`, nhưng một stream chỉ consume một lần. Pipeline nên stateless, không mutate state bên ngoài, và `toMap` phải định nghĩa merge khi key có thể trùng. `parallelStream()` chỉ đáng dùng cho workload CPU-bound đủ lớn sau benchmark; không dùng common pool cho blocking I/O.

Public API cần nói rõ ownership, blocking, cancellation, deadline, null/empty semantics và compatibility. Với text, phân biệt UTF-16 code unit, code point và grapheme; với time, lưu `Instant` cho thời điểm tuyệt đối và giữ `ZoneId` khi luật nghiệp vụ phụ thuộc múi giờ.

## Exception, resource, build và testing

Try-with-resources đóng tài nguyên theo thứ tự ngược khai báo. Nếu body và `close()` cùng lỗi, lỗi body là primary và lỗi cleanup nằm trong `getSuppressed()`. Khi translate exception ở boundary, luôn giữ cause; log một lần tại nơi chịu trách nhiệm thay vì log rồi throw ở mọi layer.

Maven đi qua `validate → compile → test → package → verify → install → deploy`. Parent POM quản lý module/version; dependency scope, BOM, plugin và dependency mediation đều ảnh hưởng classpath/artifact.

Test theo rủi ro:

- unit test domain rule, inject `Clock`, ID/random generator;
- integration test adapter bằng engine gần production;
- contract test cho HTTP/message/schema;
- end-to-end chỉ giữ các critical journey;
- concurrency test dùng barrier/latch/eventually, không dùng `Thread.sleep` làm đồng bộ.

H2 phù hợp feedback nhanh nhưng không chứng minh PostgreSQL dialect, lock, isolation hay query plan. Tương tự, repository fake không chứng minh SQL thật.

## JVM, class loading và chẩn đoán bằng bằng chứng

JVM memory không chỉ có heap: còn thread stack, metaspace, code cache, direct/native memory và page cache. Vì vậy container có thể OOMKilled dù Java heap chưa đầy.

Class đi qua loading, linking rồi initialization. Identity của class là `(binary name, defining class loader)`; hai class cùng tên do hai loader định nghĩa vẫn không cast được cho nhau. JPMS thêm boundary `requires`, `exports`, `opens`, `uses`, `provides`; `ServiceLoader` là SPI, còn mở toàn module cho reflection làm yếu encapsulation.

Quy trình điều tra nên bắt đầu từ triệu chứng:

| Triệu chứng | Bằng chứng đầu tiên | Bước sâu hơn |
|---|---|---|
| CPU hoặc p99 cao | metrics, JFR CPU/lock/I/O | flame graph, thread dump, query trace |
| Live set tăng | GC log, class histogram | heap dump, dominator/retained path |
| RSS tăng, heap ổn | native metrics, NMT nếu đã bật | direct buffer, metaspace, thread count |
| Hang/deadlock | nhiều thread dump theo thời gian | owner/wait graph, JFR locks |

Chọn Parallel, G1, ZGC hay Shenandoah từ workload, heap và SLO; không chọn bằng truyền thuyết. Microbenchmark dùng JMH với fork/warm-up/measurement, sau đó vẫn phải đo end-to-end.

## Kiến trúc service và Spring Boot production

Boundary được đề xuất là:

```text
HTTP/message adapter → application use case → domain
                                      ↓
                              outbound ports
                         DB / remote / message adapters
```

Spring `ApplicationContext` tạo, post-process và có thể proxy bean. Constructor injection làm dependency rõ nhưng không làm singleton thread-safe. `@ConfigurationProperties` + validation phù hợp config có cấu trúc; secret phải externalize và có kế hoạch rotation.

Request thường đi qua filter/security chain, `DispatcherServlet`, interceptor, binding/validation, controller, application service rồi adapter. Validate shape ở transport; invariant và object-level authorization ở application/domain. Error contract nên có machine code, detail an toàn và trace ID.

Proxy chỉ intercept call đi qua proxy. Self-invocation, private/final method hoặc object tạo bằng `new` có thể làm `@Transactional`, cache hay method security không chạy. Giữ transaction ở public application-service boundary; không gọi remote lâu trong transaction.

MVC + blocking JDBC hợp phần lớn service. Virtual thread hữu ích cho nhiều I/O blocking nhưng không tăng DB connections. WebFlux chỉ phù hợp khi stack end-to-end non-blocking và team hiểu Reactor/context/backpressure.

## SQL và ba lựa chọn persistence

| Công cụ | Chọn khi | Trách nhiệm chính |
|---|---|---|
| JDBC/JdbcTemplate | hot path hoặc query ít, cần kiểm soát thấp tầng | connection, statement, result set, transaction |
| JPA/Hibernate | aggregate CRUD, lifecycle và change tracking có giá trị | entity state, fetch plan, flush, equality, locking |
| MyBatis | SQL phức tạp/legacy/schema-first, cần DBA review | mapper/XML, bind value, result map, session/cache |

`DataSource` là factory, không mặc định là pool. Connection sống theo unit of work; pool là bulkhead hữu hạn và phải tính theo `số pod × max pool/pod` so với capacity database.

Transaction ngắn bao quanh một invariant. Chống oversell bằng atomic conditional update, optimistic version hoặc row lock phù hợp; không dùng check-then-write trong application rồi hy vọng không race. `flush` không phải commit, JPA EAGER không tự sửa N+1, và collection fetch join + pagination có thể page sai parent.

Trong MyBatis, `#{value}` tạo bind parameter còn `${fragment}` là raw substitution, chỉ dùng với fragment do code allow-list. `SqlSession` không thread-safe; trong Spring dùng mapper proxy/`SqlSessionTemplate` dưới transaction. Generated key được gán vào command object, còn return của `insert()` thường là affected-row count.

## Security, reliability và vận hành

Threat model bắt đầu từ asset, trust boundary, actor, abuse case và impact. OAuth2 là delegation/authorization framework; OIDC thêm identity. Resource server phải validate signature, algorithm allow-list, issuer, audience, expiry, token type và key rotation. JWT được ký không đồng nghĩa được mã hóa.

Authorization không dừng ở role của endpoint: phải kiểm tra owner/tenant tại use case. Phân biệt 401 với 403, CSRF với CORS, access token với ID token; parameterize value và allow-list identifier/path/sort.

Reliability controls giải các failure khác nhau:

- timeout/deadline giới hạn thời gian và phải truyền xuyên call chain;
- retry chỉ cho lỗi transient và operation idempotent, có backoff/jitter/budget;
- circuit breaker ngừng gọi dependency đang lỗi;
- bulkhead/concurrency limit bảo vệ capacity;
- rate limit/load shedding chặn admission trước khi queue vô hạn.

Observability phải nối SLI/SLO với logs, metrics, traces và profiles. Dùng route template thay raw ID làm metric label; đo queue time, pool wait, dependency time và saturation. Container/Kubernetes cần non-root image, headroom ngoài heap, startup/readiness/liveness khác nghĩa, graceful drain và deploy N/N+1 tương thích schema.

## Capstone và tiêu chuẩn hoàn thành

Capstone `Order & Inventory Service` gom kiến thức thành một luồng có thể bảo vệ bằng evidence:

- [ ] Value object cho money; equality/hash ổn định.
- [ ] Reserve stock không âm và không lost update.
- [ ] Idempotency key, order và outbox cùng authoritative transaction.
- [ ] Keyset pagination, index và query plan có bằng chứng.
- [ ] Unit, integration, contract và concurrency tests.
- [ ] Security deny-by-default, structured telemetry và graceful shutdown.
- [ ] Docker/Kubernetes manifest cùng migration expand/contract.
- [ ] ADR cho persistence, locking, concurrency và domain mapping.

Phần starter chỉ là skeleton, không phải service production hoàn chỉnh. Các sample messaging, distributed store, resilience và observability cũng cố ý là mô hình trong process; hãy đọc badge/cảnh báo trong lesson trước khi suy rộng claim.

## Ôn phỏng vấn theo năng lực, không theo số bài

Coding round cần clarify, nêu invariant, đi từ brute force đến tối ưu, viết Java compile được, dry-run edge case và tính đủ complexity. Bộ sample DSA bao phủ hash, sliding window Unicode, heap, tree, trie, topological sort, union-find, Dijkstra, backtracking và dynamic programming.

HLD bắt đầu bằng requirement/SLO/estimate/API/data rồi mới vẽ component; với mỗi mũi tên phải hỏi timeout-after-commit, duplicate, saturation, retry, recovery và schema compatibility. LLD bắt đầu từ invariant, ownership và state transition, không từ pattern.

Behavioral dùng STAR(R): Action là phần lớn câu trả lời, phân biệt “tôi” và “team”, có baseline/metric thật và reflection. Chỉ coi là sẵn sàng khi coding, Java depth, HLD/LLD và behavioral đều đạt rubric; một vòng mạnh không bù vòng hard-fail.
