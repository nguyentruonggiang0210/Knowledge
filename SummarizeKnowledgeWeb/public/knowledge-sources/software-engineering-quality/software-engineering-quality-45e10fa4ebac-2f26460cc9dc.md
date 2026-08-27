# Đáp án — Software Engineering và kiến trúc ứng dụng

Đây là rubric tham khảo cho [`../software_engineering.md`](../software_engineering.md). Câu trả lời Senior cần gắn nguyên tắc với constraint thay vì chỉ đọc tên pattern.

## SE-001 — SOLID và over-engineering

**Câu hỏi:** SOLID giải quyết nhóm vấn đề nào? Cho một ví dụ việc áp dụng SOLID quá mức làm code khó bảo trì hơn.

SOLID hướng tới code dễ thay đổi bằng cách tách lý do thay đổi, lập trình theo abstraction, giữ contract thay thế được và tạo interface đúng nhu cầu consumer. Nó không phải năm luật phải áp vào mọi class.

Áp dụng quá mức thường tạo nhiều interface chỉ có một implementation, factory cho object đơn giản, hoặc chuỗi wrapper khiến luồng xử lý khó lần theo. Middle nên giải thích đúng từng nguyên lý bằng ví dụ. Senior cần nói được chi phí indirection và chỉ tạo abstraction tại volatility boundary đã biết hoặc nơi test/substitution thực sự có giá trị.

## SE-002 — Cohesion và coupling

**Câu hỏi:** High cohesion và low coupling là gì? Bạn đo hoặc nhận ra chúng qua những dấu hiệu nào trong codebase?

High cohesion nghĩa là các phần trong module cùng phục vụ một trách nhiệm/business capability; low coupling nghĩa là module biết ít chi tiết của nhau và giao tiếp qua contract nhỏ, ổn định.

Dấu hiệu cohesion thấp: class có nhiều nhóm field/method không liên quan, thay đổi một feature phải sửa nhiều nơi. Coupling cao: import vòng, shared database/schema, gọi chuỗi đồng bộ, test một module phải dựng cả hệ thống. Có thể theo dõi dependency graph, change coupling/co-change và fan-in/fan-out, nhưng metric chỉ là tín hiệu; boundary nghiệp vụ mới là quyết định chính.

## SE-003 — Composition và inheritance

**Câu hỏi:** Vì sao thường ưu tiên composition hơn inheritance? Trường hợp nào inheritance vẫn là mô hình đúng?

Composition ghép behavior qua collaborator nên thay thế được lúc runtime, tránh phụ thuộc vào internal state và không tạo hierarchy cứng. Inheritance hợp lý khi có quan hệ “is-a” thật, subtype giữ đầy đủ contract của base type và hierarchy ổn định—ví dụ framework extension point được thiết kế rõ.

Không nên kế thừa chỉ để reuse vài dòng code; có thể kéo theo fragile base class và vi phạm LSP. Senior cần cân nhắc delegation boilerplate, performance/lifecycle của composed object và phân biệt interface inheritance với implementation inheritance.

## SE-004 — LSP theo contract

**Câu hỏi:** Liskov Substitution Principle liên quan thế nào đến precondition, postcondition và invariant? Nêu một vi phạm không dùng ví dụ `Square/Rectangle`.

Subtype phải dùng được ở mọi nơi chờ base type mà không làm sai tính đúng đắn: không được tăng precondition, không được giảm postcondition, phải giữ invariant và quy tắc exception/side effect quan sát được.

Ví dụ `ReadOnlyRepository` kế thừa `Repository` nhưng `Save` luôn ném `NotSupportedException`: client tin contract base cho phép lưu sẽ hỏng. Thiết kế lại bằng capability interface nhỏ (`IReadRepository`, `IWriteRepository`) hoặc composition. Câu Senior nên nhận ra LSP không chỉ là type signature mà là behavioral contract.

## SE-005 — DI, DIP và Service Locator

**Câu hỏi:** Dependency Injection khác Dependency Inversion thế nào? Vì sao Service Locator thường bị xem là anti-pattern?

Dependency Inversion là nguyên lý: policy cấp cao không phụ thuộc chi tiết; cả hai phụ thuộc abstraction do phía policy định hình. Dependency Injection là kỹ thuật truyền dependency từ bên ngoài qua constructor/factory/container.

Service Locator để object tự gọi container lấy dependency, làm dependency bị ẩn, lỗi chuyển sang runtime và test khó dựng. Constructor injection làm graph rõ và bảo đảm object hợp lệ sau khi tạo. Locator có thể chấp nhận ở composition root/framework boundary nhưng không nên rò vào domain/application code.

## SE-006 — Anemic và rich domain model

**Câu hỏi:** So sánh anemic domain model và rich domain model. Với một CRUD service đơn giản, bạn sẽ chọn mô hình nào và vì sao?

Anemic model chủ yếu chứa data, logic nằm ở service; rich model đặt invariant và behavior cạnh state. Rich model hữu ích khi domain phức tạp vì ngăn tạo trạng thái không hợp lệ. CRUD ít quy tắc thường dùng transaction script/anemic DTO đơn giản sẽ rõ hơn, tránh DDD ceremony.

Senior không chọn theo “best practice” chung: xem độ phức tạp nghiệp vụ, vòng đời invariant, khả năng test và cách ORM map. Dù dùng anemic model, validation quan trọng vẫn phải tập trung chứ không rải ở controller.

## SE-007 — Bounded context

**Câu hỏi:** Trong Domain-Driven Design, bounded context được xác định bằng ngôn ngữ và business capability như thế nào? Vì sao không nên đồng nhất bounded context với microservice?

Bounded context là biên mà một ubiquitous language và model có nghĩa nhất quán. Cùng từ “Customer” có thể là hồ sơ trong CRM nhưng là bên nhận hóa đơn trong Billing. Context mapping mô tả quan hệ upstream/downstream và cách dịch model.

Một context có thể chạy trong module của monolith hoặc nhiều deployable; microservice là deployment/ownership boundary. Tách hai khái niệm tránh tạo distributed monolith. Senior nên xác định biên qua business capability, team ownership, tốc độ thay đổi và transaction/invariant, không chỉ qua entity hoặc bảng.

## SE-008 — Aggregate boundary

**Câu hỏi:** Aggregate bảo vệ invariant ra sao? Làm thế nào chọn aggregate boundary mà không tạo object graph hoặc transaction quá lớn?

Aggregate là consistency boundary: mọi thay đổi đi qua aggregate root và invariant bên trong được bảo vệ atomically. Chỉ đưa entity/value cần strong consistency tức thời vào cùng aggregate; tham chiếu aggregate khác bằng ID và phối hợp eventual consistency qua event/process manager.

Aggregate quá lớn gây contention, load graph nặng và transaction dài; quá nhỏ làm invariant xuyên aggregate khó giữ. Senior nêu cách kiểm tra invariant thực sự phải đồng bộ, optimistic concurrency/version và xử lý conflict/retry.

## SE-009 — Entity và value object

**Câu hỏi:** Phân biệt entity và value object. Equality, identity và tính bất biến của chúng nên được cài đặt thế nào?

Entity có identity tồn tại qua thay đổi thuộc tính; equality chủ yếu dựa identity và lifecycle. Value object được xác định bởi toàn bộ giá trị, thường immutable, validate ngay lúc tạo và có structural equality—ví dụ Money(amount, currency).

Không dùng mutable field trong hash/equality khi object nằm trong hash collection. Temporary/persistence ID cần chiến lược rõ để equality không đổi giữa trước và sau lưu.

## SE-010 — Domain event và integration event

**Câu hỏi:** Phân biệt domain event và integration event. Tại thời điểm nào mỗi loại được phát, và xử lý failure khác nhau ra sao?

Domain event biểu diễn việc đã xảy ra trong domain, thường xử lý trong cùng bounded context và có thể phát trước/đồng thời commit tùy thiết kế. Integration event là contract ổn định cho context/process khác, chỉ được công bố sau khi transaction nguồn đã bền vững.

Không publish thẳng broker trước DB commit vì dual-write. Thường lưu outbox cùng transaction rồi relay, consumer idempotent. Domain event có thể dùng in-process handler; integration event cần versioning, retry, DLQ và observability.

## SE-011 — Hexagonal/Onion/Clean

**Câu hỏi:** Hexagonal, Onion và Clean Architecture có ý tưởng chung nào? Dependency rule được kiểm tra trong thực tế bằng cách nào?

Điểm chung là business policy nằm trong, không phụ thuộc UI, database hay framework. Port/interface ở boundary; adapter triển khai chi tiết. Dependency source code luôn hướng vào trong, còn control flow có thể đi ra qua interface.

Kiểm tra bằng project/module references, architecture tests, visibility/package rule và review; DI composition root nối graph. Không cần tạo một layer cho mỗi khái niệm nếu application nhỏ. Senior cần giữ domain không import ORM/HTTP mà vẫn tránh mapping vô ích ở mọi dòng.

## SE-012 — CQRS

**Câu hỏi:** CQRS có nhất thiết cần hai database hoặc event sourcing không? Khi nào chi phí eventual consistency không đáng để chấp nhận?

CQRS chỉ tách model/đường xử lý command và query; có thể dùng cùng database, cùng process và không cần event sourcing. Nó đáng giá khi read/write có shape, scale, quyền hoặc consistency khác nhau.

Hai store tạo replication lag, duplicate model, rebuild/migration và vận hành phức tạp. Với CRUD cần read-after-write chặt, CQRS vật lý thường không đáng. Senior nên bắt đầu logical separation, đo pain rồi mới tách deployment/store.

## SE-013 — Strategy, Decorator, Adapter

**Câu hỏi:** So sánh Strategy, Decorator và Adapter. Hãy chỉ ra một tín hiệu code cho thấy mỗi pattern có thể phù hợp.

Strategy thay thuật toán cùng contract (nhiều `if` chọn pricing policy). Decorator bọc cùng interface để thêm behavior theo chuỗi (cache/retry/metrics). Adapter chuyển interface/model của dependency sang contract mà ứng dụng cần (vendor client).

Decorator phải giữ semantic contract và thứ tự wrapper quan trọng; strategy cần selection rõ; adapter không nên rò model vendor. Câu tốt đưa ví dụ thật thay vì chỉ định nghĩa.

## SE-014 — Factory và Builder

**Câu hỏi:** Factory Method, Abstract Factory và Builder giải quyết các vấn đề tạo object khác nhau thế nào?

Factory Method giao việc tạo subtype cho method/subclass; Abstract Factory tạo một họ object tương thích; Builder tạo object phức tạp từng bước, đặc biệt khi nhiều tùy chọn/invariant.

Constructor hoặc static factory đơn giản thường đủ. Builder nên tạo object hợp lệ khi `Build`, tránh trạng thái nửa vời. Abstract Factory hữu ích ở product family, không phải chỉ để che `new`.

## SE-015 — Observer trong process

**Câu hỏi:** Observer/pub-sub trong cùng process có các rủi ro nào về lifecycle, thứ tự, exception và memory leak?

Publisher có thể giữ reference subscriber quá lâu gây leak; subscribe/unsubscribe/lifecycle phải rõ hoặc dùng weak subscription phù hợp. Handler order thường không nên ngầm được dựa vào; một handler ném lỗi có thể chặn handler sau. Reentrancy, thread-safety và slow subscriber cũng cần xử lý.

Nếu event là business-critical cần durability/retry thì in-process observer không đủ; dùng outbox/broker. Với event nội bộ, snapshot subscriber list, isolate lỗi theo policy và trả subscription token/disposable.

## SE-016 — Repository/Unit of Work với ORM

**Câu hỏi:** Repository và Unit of Work còn mang lại giá trị gì khi ORM đã cung cấp abstraction tương tự? Khi nào custom generic repository làm mất khả năng của ORM?

ORM context thường đã là Unit of Work và entity set gần giống Repository. Custom repository có giá trị khi biểu đạt domain query/aggregate boundary, che persistence khỏi core hoặc cung cấp test seam thực sự.

Generic CRUD repository thường làm mất eager loading, projection, specification, batching, concurrency token và transaction API; rồi sinh method “escape hatch”. Senior ưu tiên query/application service cụ thể hoặc expose composable query có kiểm soát, không bọc ORM chỉ vì pattern catalog.

## SE-017 — Anti-corruption layer

**Câu hỏi:** Anti-corruption layer bảo vệ domain khỏi hệ thống legacy hoặc vendor API ra sao? Bạn đặt mapping và retry ở đâu?

ACL dịch vocabulary, data shape, error và semantic của hệ ngoài sang model nội bộ. Adapter/client ở infrastructure thực hiện transport, auth, timeout/retry; mapping semantic thuộc boundary/application, không để DTO vendor đi sâu vào domain.

Retry chỉ cho operation idempotent/transient, có timeout budget và observability. ACL cũng version contract và cô lập quirks. Nếu mapping thất bại cần error rõ, quarantine hoặc manual reconciliation chứ không âm thầm mặc định dữ liệu.

## SE-018 — Modular monolith

**Câu hỏi:** Thiết kế modular monolith như thế nào để module có boundary thực sự thay vì chỉ là các folder?

Mỗi module nên sở hữu model/schema logic, public API nhỏ và cấm truy cập internal type/table trực tiếp. Tổ chức project/package riêng, architecture test dependency, module composition root, event/command contract và owner rõ.

Có thể cùng process/database nhưng schema/table ownership phải tôn trọng; transaction xuyên module là quyết định có chủ đích. Module deploy cùng nhau nên đơn giản vận hành, đồng thời tạo seam để tách sau nếu có lý do.

## SE-019 — Khi tách microservice

**Câu hỏi:** Những tín hiệu nào biện minh cho việc tách một module thành microservice? Những chi phí vận hành nào phải được tính trước?

Tín hiệu: capability có nhu cầu scale/SLO/security khác, release bị khóa lẫn nhau, team ownership ổn định, model boundary rõ hoặc fault isolation có giá trị cao. Không tách chỉ vì codebase lớn.

Chi phí gồm network failure/latency, eventual consistency, tracing, deployment, on-call, schema/event versioning, test environment và platform maturity. Senior thường cải thiện module/CI trước, đo bottleneck và có migration strangler thay vì rewrite đồng loạt.

## SE-020 — API backward compatibility

**Câu hỏi:** Thiết kế API backward-compatible gồm những nguyên tắc nào về field, enum, validation, pagination và error contract?

Thêm optional field thường an toàn; không xóa/đổi nghĩa field, không siết validation ngay, không thêm enum value nếu consumer exhaustive không chịu được. Pagination cần stable ordering/cursor; error có machine code ổn định, message chỉ cho người đọc.

Áp dụng tolerant reader có giới hạn, contract test, telemetry theo client/version và deprecation window. Với JSON, phân biệt missing/null/default. Senior mô tả expand–migrate–contract và cách rollback.

## SE-021 — Idempotency application layer

**Câu hỏi:** Idempotency ở application layer được thiết kế thế nào? Phân biệt natural idempotency, idempotency key và deduplication theo message ID.

Natural idempotency là operation bản chất cho cùng kết quả (`PUT` set trạng thái). Idempotency key ánh xạ tenant + operation + key đến request hash và kết quả, được ghi atomically với business change; cùng key khác payload phải bị từ chối. Dedup message dùng message ID và inbox/processed table.

Phải định nghĩa scope, TTL, concurrent duplicate (`in-progress`) và replay response. Chỉ cache HTTP response ngoài transaction không ngăn double side effect.

## SE-022 — Error model API

**Câu hỏi:** Một error model tốt cho API cần chứa gì? Vì sao không nên trả stack trace hoặc dùng HTTP 200 cho mọi kết quả?

Nên có HTTP status đúng lớp lỗi, stable machine-readable code/type, human message an toàn, field violations và correlation/trace ID; có thể theo Problem Details. Không lộ stack trace, SQL hoặc secret.

HTTP 200 cho lỗi phá proxy/monitor/retry semantics. Phân biệt 4xx không retry, 409 conflict, 429/503 có `Retry-After`, và lỗi nội bộ 5xx. Log chi tiết phía server gắn correlation.

## SE-023 — Chiến lược test

**Câu hỏi:** Test pyramid, test trophy và honeycomb khác nhau ở điểm nhấn nào? Bạn chọn tỷ lệ test dựa trên kiến trúc ra sao?

Pyramid nhấn nhiều unit, ít integration/E2E vì tốc độ; trophy nhấn integration vì giá trị confidence; honeycomb phù hợp distributed services với nhiều integration và observability test. Không có tỷ lệ cố định.

Logic thuần dùng unit/property test; persistence/message contract dùng integration/contract; critical journey dùng ít E2E. Câu Senior chọn theo risk, architecture, feedback time và chi phí bảo trì.

## SE-024 — Test double

**Câu hỏi:** Khi nào mock hữu ích, khi nào mock làm test gắn chặt với implementation? Phân biệt mock, stub, fake và spy.

Stub trả dữ liệu định trước; fake có implementation đơn giản; mock xác minh interaction kỳ vọng; spy ghi nhận call hoặc bọc object thật. Mock tốt ở outbound side effect/protocol boundary. Mock internal collaborator khiến refactor hỏng test dù behavior không đổi.

Ưu tiên assert observable outcome/state, dùng real value object và lightweight fake khi đáng tin. Không mock framework/ORM sâu nếu integration behavior mới là rủi ro.

## SE-025 — Integration test database

**Câu hỏi:** Integration test có database nên quản lý schema, dữ liệu và isolation giữa các test như thế nào?

Dùng engine/version gần production (thường container), migration thật, seed tối thiểu qua API/builder. Isolation bằng transaction rollback nếu semantics cho phép, truncate/reset schema, hoặc database/schema riêng theo worker. Test song song không dùng chung mutable fixtures.

Kiểm tra constraint, index/query quan trọng và timezone/collation. Mỗi test tự sở hữu dữ liệu, ID ngẫu nhiên nhưng output tái lập; failure giữ log/DB state đủ chẩn đoán.

## SE-026 — Contract testing

**Câu hỏi:** Consumer-driven contract testing phát hiện được lỗi gì và không thay thế được loại test nào? Quản lý version contract ra sao?

Consumer-driven contract xác nhận provider vẫn thỏa các interaction consumer thật dùng, bắt breaking field/status/header sớm. Nó không thay provider logic test, integration hạ tầng, performance hay end-to-end workflow.

Contract được publish theo consumer version, provider verify trong CI, có compatibility matrix và deployment rule “can I deploy”. Tránh contract quá cụ thể theo implementation; quản lý optional/enum và deprecation.

## SE-027 — Property và mutation testing

**Câu hỏi:** Property-based testing và mutation testing bổ sung gì cho test case truyền thống? Nêu một ví dụ phù hợp cho mỗi loại.

Property-based test sinh nhiều input để kiểm invariant, ví dụ encode rồi decode bằng original hoặc sort cho kết quả ordered và permutation. Mutation testing cố ý đổi operator/condition; test suite phải “giết” mutant, qua đó phát hiện assertion yếu.

Chúng bổ sung example tests, không thay thế. Generator/shrinking và property phải hợp lệ; mutation tốn chi phí nên chạy module quan trọng hoặc theo lịch.

## SE-028 — Flaky test

**Câu hỏi:** Flaky test thường đến từ đâu? Hãy mô tả quy trình khoanh vùng và sửa thay vì chỉ retry hoặc quarantine vô thời hạn.

Nguồn thường là time/random không kiểm soát, shared state, race, async chưa await, port/network, test order, eventual consistency và resource thiếu. Đầu tiên lưu seed/log/timing, chạy lặp và thay đổi order/concurrency để tái hiện, rồi cô lập dependency.

Inject clock/ID, await condition có deadline thay sleep, reset state và dùng deterministic scheduler khi phù hợp. Retry chỉ giúp thu thập bằng chứng; quarantine phải có owner/expiry vì flaky test làm mất niềm tin pipeline.

## SE-029 — Refactor legacy

**Câu hỏi:** Bạn refactor một module legacy gần như không có test như thế nào? Characterization test và seam giúp giảm rủi ro ra sao?

Khoanh boundary và quan sát behavior hiện tại bằng characterization test—kể cả behavior kỳ quặc nếu consumer dựa vào. Tạo seam tại database/time/network/static call, tách từng lát nhỏ và so output trước/sau.

Dùng branch by abstraction hoặc strangler, telemetry và feature flag cho rollout. Không rewrite lớn khi chưa hiểu invariant/data edge case. Senior ưu tiên risk hotspot dựa change frequency + defect impact.

## SE-030 — Code review

**Câu hỏi:** Một code review hiệu quả nên ưu tiên điều gì? Phân biệt lỗi phải chặn merge với góp ý sở thích.

Ưu tiên correctness, security, data loss, concurrency, API compatibility, maintainability và test; sau đó mới style (nên tự động hóa formatter/linter). Comment phải cụ thể, nêu tác động và phân biệt `blocking`, `suggestion`, `question`, `nit`.

PR nhỏ, mô tả intent/risks và review theo deadline giúp flow. Không yêu cầu đổi chỉ vì sở thích nếu cả hai phương án tương đương; dùng guideline/ADR để giải quyết tranh luận lặp lại.

## SE-031 — Technical debt

**Câu hỏi:** Technical debt nên được mô tả, định lượng và ưu tiên thế nào để trao đổi được với product/business?

Mô tả debt bằng tác động: lead time, incident, cloud cost, security exposure, thời gian onboarding; ghi principal (công sửa) và interest (chi phí lặp lại). Liên kết với roadmap/business risk và đưa option theo mức đầu tư.

Ưu tiên theo xác suất × tác động × tần suất thay đổi, dành capacity đều hoặc gắn vào feature chạm vùng đó. “Code xấu” không đủ là business case; cần baseline và success metric.

## SE-032 — Expand–migrate–contract

**Câu hỏi:** Mô tả expand–migrate–contract cho một thay đổi schema hoặc API không downtime. Điểm rollback nằm ở đâu?

Expand: thêm schema/field mới tương thích. Deploy code có thể đọc cũ/mới và ghi dual-write hoặc source-of-truth rõ. Migrate/backfill theo batch, checkpoint, throttle và đối soát. Chuyển read sang mới qua flag, quan sát. Contract chỉ xóa cũ khi mọi consumer và rollback window kết thúc.

Rollback trước contract là đổi flag/deploy cũ; sau destructive migration thường không còn rollback rẻ. Vì vậy contract tách release và backup/restore phải được thử.

## SE-033 — Feature flag

**Câu hỏi:** Feature flag hỗ trợ release thế nào và tạo ra loại nợ kỹ thuật nào? Quản lý owner, expiry và interaction giữa flag ra sao?

Flag tách deploy khỏi release, hỗ trợ cohort/canary/kill switch. Nó tạo nhánh code, tổ hợp khó test, config dependency và flag “xác sống”. Mỗi flag cần type, owner, default an toàn, created/expiry, audit và metric.

Test cả hai state quan trọng; giới hạn interaction, ưu tiên server-side evaluation nhất quán. Dọn code và config ngay sau rollout. Kill switch dài hạn được quản lý khác experiment ngắn hạn.

## SE-034 — Semantic Versioning

**Câu hỏi:** Semantic Versioning có giới hạn gì trong hệ thống phân tán? Bạn kiểm soát dependency update và breaking change thế nào?

SemVer mô tả compatibility của một package nhưng không bảo đảm behavior, config, data/event contract hoặc hệ phân tán cùng nâng đồng thời. `0.x`, transitive dependency và range rộng cũng làm kỳ vọng mơ hồ.

Pin/lock dependency, bot update PR nhỏ, compatibility test và changelog/migration guide. Public contract cần định nghĩa cụ thể; rollout producer/consumer theo compatibility window thay vì tin số version.

## SE-035 — Trunk-based và GitFlow

**Câu hỏi:** So sánh trunk-based development với GitFlow. Team cần điều kiện kỹ thuật và thói quen nào để trunk-based an toàn?

Trunk-based dùng branch ngắn, merge thường xuyên, CI nhanh, feature flag và release từ trunk; giảm merge debt. GitFlow có long-lived develop/release branch, hợp release train hoặc nhiều version bảo trì nhưng tăng divergence.

Trunk an toàn cần test tự động tin cậy, review nhanh, artifact promotion, rollback/canary và thay đổi nhỏ. Không đồng nghĩa merge code chưa kiểm soát thẳng production.

## SE-036 — Concurrent update entity

**Câu hỏi:** Hai request đồng thời cùng sửa một business entity. Bạn đặt concurrency control ở domain, application và persistence layer thế nào?

Domain định nghĩa invariant và conflict semantics: reject, merge hay last-write-wins. Application mang expected version/idempotency và retry có giới hạn. Persistence dùng optimistic concurrency token/version hoặc pessimistic lock cho contention cao/ngắn.

Check-then-update phải atomic trong transaction/conditional update (`WHERE version = ?`). Retry phải chạy lại toàn command với dữ liệu mới và tránh lặp side effect; trả 409 khi cần người dùng giải quyết.

## SE-037 — Clean code và comment

**Câu hỏi:** Clean code có phải luôn là method ngắn và ít comment không? Comment nào có giá trị và abstraction nào đang che giấu logic?

Method ngắn không tự động dễ hiểu nếu chỉ chia vụn và chuyển state ẩn. Abstraction tốt đặt tên theo intent, giữ flow ở một mức và boundary rõ. Comment có giá trị khi giải thích “vì sao”, constraint, workaround có link/expiry hoặc contract khó thấy.

Comment lặp lại code nhanh lỗi thời; code sinh ra hoặc thuật toán phức tạp có thể cần giải thích. Senior cân bằng readability với locality và performance thay vì theo metric dòng.

## SE-038 — Performance và benchmark

**Câu hỏi:** Bạn xử lý yêu cầu “tối ưu performance” thế nào trước khi sửa code? Benchmark đáng tin cần tránh những sai lệch gì?

Định nghĩa SLO/workload, đo baseline bằng production telemetry/profile, tìm bottleneck lớn nhất rồi lập hypothesis. Tối ưu sau khi xác nhận CPU, allocation, I/O, lock hay downstream; đo lại và kiểm regression/cost.

Benchmark cần warm-up JIT, đủ iteration, data đại diện, tránh dead-code elimination, noise/turbo/GC không kiểm soát, báo distribution chứ không chỉ mean. Microbenchmark không thay load/soak test end-to-end.

## SE-039 — ADR

**Câu hỏi:** Architecture Decision Record nên ghi những gì? Khi nào cần supersede một quyết định và làm sao tránh ADR trở thành tài liệu chết?

ADR ghi context/constraint, decision, alternatives, trade-off/consequence, status, date/owner và link evidence. Nó ngắn, version cùng code và được tạo khi quyết định đáng kể, không phải tài liệu kiến trúc toàn hệ thống.

Khi context đổi, tạo ADR mới `supersedes` bản cũ thay vì sửa lịch sử. Review ADR trong design/PR và kiểm implementation/metric để nó sống.

## SE-040 — Build versus buy

**Câu hỏi:** Build-versus-buy một capability quan trọng nên được đánh giá trên những trục nào ngoài chi phí license?

Đánh giá time-to-value, total cost (license + integration + vận hành), strategic differentiation, security/compliance, data residency, SLO/support, scalability, customization, portability/exit cost và vendor viability.

Làm proof-of-concept trên risk lớn, thương lượng export/API/SLA và có contingency. Senior không mặc định “tự build rẻ” hay “managed luôn tốt”; xem opportunity cost của đội.

## SE-041 — Yêu cầu mơ hồ, deadline cố định

**Câu hỏi:** Một yêu cầu mơ hồ nhưng deadline cố định được giao cho team. Bạn chia nhỏ, đưa giả định và quản lý rủi ro kỹ thuật ra sao?

Xác định outcome, non-goal, stakeholder và acceptance examples; ghi assumption có owner. Chia vertical slice theo giá trị/rủi ro, spike time-box phần chưa biết và đưa option scope theo must/should/could.

Đặt milestone/demo sớm, dependency/risk register và telemetry/rollback. Báo trade-off rõ: cố định thời gian thì scope hoặc quality attribute nào có thể đổi; không âm thầm giảm security/correctness.

## SE-042 — Tranh luận trong incident

**Câu hỏi:** Trong incident, hai kỹ sư tranh luận hai nguyên nhân khác nhau. Tech lead nên tổ chức điều tra và ra quyết định thế nào?

Incident Commander ưu tiên service restore, tách hypothesis khỏi fact và chỉ định kiểm tra có thời hạn với tín hiệu dự đoán được. Có thể chạy điều tra song song nếu không tăng blast radius; chọn mitigation reversible dựa evidence hiện có.

Ghi timeline/decision, giữ kênh communication riêng và tránh tranh luận quyền lực. Sau phục hồi mới phân tích root cause/system factors đầy đủ.

## SE-043 — Mentoring PR quá lớn

**Câu hỏi:** Bạn mentoring một Middle engineer thường đưa PR rất lớn và khó review như thế nào mà vẫn giữ ownership cho họ?

Thống nhất mục tiêu: feedback nhanh và giảm rủi ro, không lấy lại ownership. Cùng họ lập design/sequence trước, chia commit/vertical slice có thể merge độc lập, đặt giới hạn PR mềm và review draft sớm.

Đưa ví dụ, pair ở lần đầu, rồi để engineer tự đề xuất cách chia; đo cycle time/rework. Phân biệt khi change thật sự atomic và cần PR lớn, khi đó cung cấp map/review guide.

## SE-044 — Shared library breaking change

**Câu hỏi:** Một shared library nội bộ đã được 30 service dùng nhưng cần breaking change. Hãy lập kế hoạch migration có đo lường và đường lui.

Inventory consumer/version/owner và telemetry usage. Nếu có thể, thêm API v2 song song hoặc adapter/shim; phát hành deprecation warning và migration guide/codemod. Migrate canary consumer, rồi theo cohort với dashboard và deadline.

Giữ v1 trong compatibility window, có rollback package và không xóa đến khi xác nhận runtime usage bằng dữ liệu. Với thay đổi rất lớn, side-by-side package/service contract có thể an toàn hơn lockstep upgrade.

## SE-045 — Monolith 8 năm và yêu cầu microservices

**Câu hỏi:** Một monolith 8 năm tuổi deploy mất 90 phút, test flaky, ownership mơ hồ và product muốn “chuyển sang microservices trong 6 tháng”. Bạn sẽ đánh giá, ưu tiên và đề xuất roadmap nào?

Trước hết baseline deploy lead time, flaky rate, incident/change coupling, module dependency và team ownership. Nút thắt đang là delivery/quality; tách service khi CI và ownership yếu có thể nhân vấn đề.

Roadmap hợp lý: ổn định pipeline/test, build artifact/cache, observability; lập dependency map và tạo modular boundary/architecture test; chọn một capability ít phụ thuộc nhưng có giá trị scale/release để strangler pilot. Đặt success metric (deploy <15 phút, change failure rate, lead time), data migration/outbox và platform minimum. Sau pilot, quyết định tiếp theo dựa số liệu; không cam kết rewrite toàn bộ trong sáu tháng. Senior cũng nêu stakeholder communication, capacity và đường lui.

## Câu hỏi kinh điển bổ sung — Basic đến Senior

## SE-046 — Bốn tính chất OOP

**Câu hỏi:** Bốn tính chất cốt lõi của OOP—encapsulation, abstraction, inheritance và polymorphism—là gì? Cho một ví dụ thực tế và một cách lạm dụng mỗi tính chất.

Encapsulation bảo vệ state/invariant sau API; abstraction chỉ lộ khái niệm cần thiết; inheritance tạo subtype dùng lại contract/implementation; polymorphism cho cùng contract có behavior khác qua dynamic dispatch. Ví dụ payment method che credential, `PaymentGateway` là abstraction, subtype provider và gọi `Pay` đa hình.

Lạm dụng gồm getter/setter phá invariant, abstraction “rỗng” chỉ thêm indirection, hierarchy chỉ để reuse code và polymorphism với contract không giữ LSP. Câu tốt phải gắn bốn khái niệm với maintainability, không chỉ đọc định nghĩa.

## SE-047 — Abstraction và encapsulation

**Câu hỏi:** Abstraction và encapsulation khác nhau thế nào? Một API có thể encapsulate tốt nhưng abstraction kém không?

Encapsulation trả lời “chi tiết/state nào bị che và ai được phép thay đổi”; abstraction trả lời “model/interface nào người dùng cần suy nghĩ”. Một class có private field và chỉ method public—encapsulate tốt—nhưng API gồm hàng chục method theo chi tiết storage vẫn là abstraction kém.

Abstraction tốt ổn định theo intent/capability; encapsulation giúp nó giữ invariant. Hai khái niệm bổ sung nhưng không đồng nghĩa.

## SE-048 — DRY, KISS, YAGNI

**Câu hỏi:** DRY, KISS và YAGNI hướng đến điều gì? Khi các nguyên tắc này xung đột, bạn ưu tiên dựa trên tín hiệu nào?

DRY tránh nhiều nguồn sự thật cho cùng knowledge, không cấm mọi đoạn code giống nhau. KISS chọn giải pháp đơn giản đáp ứng constraint. YAGNI không xây capability khi chưa có nhu cầu thật. Trừu tượng hóa hai đoạn giống bề ngoài nhưng thay đổi vì lý do khác có thể làm coupling tệ hơn.

Ưu tiên correctness và thay đổi dự kiến có bằng chứng; chấp nhận duplication nhỏ đến khi pattern ổn định. Senior nêu change frequency, co-change, cost of reversal và không dùng slogan thay phân tích.

## SE-049 — Refactor, rewrite, bug fix

**Câu hỏi:** Refactoring khác rewrite và sửa bug thế nào? Điều kiện nào giúp refactor giữ nguyên observable behavior?

Refactor thay cấu trúc nội bộ mà giữ contract/behavior quan sát được; bug fix cố ý đổi behavior sai; rewrite thay implementation lớn, thường cần migration/parallel validation. Refactor an toàn cần test characterization/contract, bước nhỏ, review, telemetry và rollback.

“Giữ behavior” bao gồm output, exception, side effect, timing/ordering quan trọng và compatibility—not chỉ compile. Nếu vừa đổi behavior vừa refactor, tách commit để dễ chứng minh.

## SE-050 — Immutability

**Câu hỏi:** Immutability đem lại lợi ích gì cho reasoning, concurrency và caching? Chi phí của immutable object là gì?

Object không đổi sau tạo giúp alias an toàn, dễ làm value equality/hash key, chia sẻ giữa thread và cache/memoize mà không invalidation vì mutation. Invariant được kiểm ngay constructor/factory.

Chi phí là allocation/copy khi cập nhật, object graph lớn và integration với ORM/serializer; persistent data structure/builder/copy-on-write giảm một phần. Immutability không tự làm operation nhiều object atomic.

## SE-051 — DTO, domain, persistence entity

**Câu hỏi:** Vì sao không nên dùng cùng một class cho API DTO, domain model và persistence entity trong mọi trường hợp?

Ba model có lý do thay đổi khác nhau: DTO theo contract/security/version; domain theo invariant/behavior; persistence theo schema/tracking. Dùng chung dễ mass assignment, leak field, coupling migration và làm domain anemic theo ORM.

CRUD đơn giản có thể chấp nhận để giảm mapping. Khi boundary/risk tăng, mapping explicit và contract test đáng chi phí; không cần tạo ba model máy móc cho mọi bảng.

## SE-052 — Các cấp test

**Câu hỏi:** Unit test, integration test và end-to-end test khác nhau về boundary, tốc độ, độ tin cậy và loại lỗi phát hiện được thế nào?

Unit test cô lập logic nhỏ, nhanh/deterministic nhưng không chứng minh wiring. Integration test chạy thật với DB/broker/framework boundary, bắt mapping/query/config với chi phí setup. E2E đi qua critical journey, bắt wiring/deployment nhưng chậm, khó chẩn đoán và dễ flaky.

Chọn theo risk: invariant thuần dùng unit, adapter dùng integration, vài hành trình sống còn dùng E2E. Số lượng không quan trọng bằng feedback time và confidence.

## SE-053 — Singleton pattern

**Câu hỏi:** Singleton pattern giải quyết điều gì và thường gây vấn đề nào về global state, lifecycle, concurrency và testing?

Singleton bảo đảm một instance trong một scope/process và cung cấp điểm truy cập; hợp resource/stateless service có lifecycle do composition root quản lý. Nó dễ biến dependency thành global ẩn, giữ mutable state xuyên request, race, leak và làm test phụ thuộc order.

DI singleton không đồng nghĩa class pattern có static accessor. Object singleton phải thread-safe và không giữ dependency scoped; thường inject interface/lifecycle thay vì gọi `Instance`.

## SE-054 — Law of Demeter/Tell Don’t Ask

**Câu hỏi:** Law of Demeter và nguyên tắc “Tell, Don’t Ask” muốn giảm coupling ra sao? Khi áp dụng máy móc có thể làm API tệ hơn thế nào?

Law of Demeter hạn chế chuỗi truy cập qua nhiều collaborator; Tell, Don’t Ask yêu cầu gửi intent cho object sở hữu behavior thay vì kéo state ra rồi quyết định bên ngoài. Chúng giữ invariant gần data và giảm hiểu biết về graph.

Áp dụng cứng có thể sinh wrapper chuyển tiếp vô nghĩa hoặc nhồi behavior vào entity không sở hữu use case. Query/read model và value inspection vẫn hợp lệ; xét ownership và lý do thay đổi.

## SE-055 — Các lớp validation

**Câu hỏi:** Validation nên đặt ở client, API boundary, application, domain và database như thế nào? Phân biệt format validation với business invariant.

Client validation cho UX nhưng không đáng tin. API boundary kiểm syntax/shape/size/type; application kiểm permission và precondition use case; domain bảo invariant mọi đường gọi; database bảo constraint dữ liệu atomic như NOT NULL/UNIQUE/FK/CHECK.

Format như email syntax khác invariant “email duy nhất trong tenant”. Validation ở nhiều lớp không phải duplication nếu mục tiêu/failure boundary khác; race cuối cùng vẫn cần constraint/conditional write.

## SE-056 — TDD

**Câu hỏi:** Chu trình Red–Green–Refactor của TDD là gì? Khi nào test-first đem lại giá trị thấp hoặc làm thiết kế bị bó buộc?

Red viết test thất bại cho behavior nhỏ; Green cài tối thiểu để pass; Refactor cải thiện thiết kế trong khi test giữ safety net. TDD hữu ích với domain logic/API contract vì tạo feedback và thiết kế testable.

Giá trị thấp ở exploratory spike, generated/glue code hoặc UI/algorithm chưa hiểu; mock-first chi tiết implementation có thể khóa thiết kế. Sau spike vẫn cần test theo risk. TDD là nhịp thiết kế, không phải mục tiêu coverage 100%.

## SE-057 — Circular dependency

**Câu hỏi:** Circular dependency xuất hiện ở class/module/service ra sao? Bạn phát hiện và phá vòng phụ thuộc bằng kỹ thuật nào?

Vòng compile-time làm module A↔B không có hướng policy rõ; runtime service cycle tạo sync call/deploy/failure coupling. Phát hiện bằng dependency graph, architecture test, build cycle và tracing/change coupling.

Phá bằng tách abstraction do consumer sở hữu, extract shared concept đúng nghĩa, domain event/mediator, đảo dependency hoặc gộp module nếu boundary giả. Đưa mọi thứ vào “common” thường chỉ che vòng và tạo god library.

## SE-058 — Backward/forward compatibility

**Câu hỏi:** Phân biệt backward compatibility và forward compatibility đối với API, event và stored data. Producer/consumer nên rollout theo thứ tự nào?

Backward-compatible: phiên bản mới đọc/xử lý input/data cũ hoặc producer mới không phá consumer cũ tùy góc nhìn được định nghĩa. Forward-compatible: phiên bản cũ chịu được data/message từ phiên bản mới, thường nhờ unknown-field tolerance và optional field.

Rollout mở rộng consumer đọc cả cũ/mới trước, sau đó producer ghi mới; backfill; cuối cùng bỏ cũ khi telemetry xác nhận. Enum mới, required field và đổi meaning là bẫy. Luôn nói rõ ai là reader/writer để tránh thuật ngữ mơ hồ.

## SE-059 — Conway’s Law

**Câu hỏi:** Conway’s Law ảnh hưởng service boundary, API và ownership ra sao? Team topology nên thay đổi trước hay sau kiến trúc?

Hệ thống có xu hướng phản chiếu đường giao tiếp của tổ chức: nhiều handoff tạo API/boundary và coupling tương ứng. Service không có team sở hữu end-to-end dễ thành shared orphan; một team phải phối hợp năm team cho một feature sẽ có lead time cao.

Dùng inverse Conway maneuver: thiết kế team theo business capability mong muốn, rồi tách dần architecture; hai thay đổi thường song hành. Không reorganize chỉ theo sơ đồ nếu skill/on-call/data ownership chưa sẵn sàng.

## SE-060 — Evolutionary Architecture

**Câu hỏi:** Evolutionary Architecture và architecture fitness function là gì? Hãy nêu các kiểm tra tự động để ngăn kiến trúc suy thoái.

Evolutionary Architecture cho phép thay đổi có hướng dưới constraint thay vì cố dự đoán thiết kế cuối. Fitness function là phép đo/test khách quan cho đặc tính kiến trúc: dependency rule, API compatibility, latency/error budget, security policy, deployability hoặc cost.

Ví dụ architecture test cấm domain import infrastructure, contract test ngăn breaking schema, performance gate theo p99 và policy-as-code cấm public database. Function cần threshold/owner và cập nhật khi context đổi; quá nhiều gate chậm có thể khóa tiến hóa.
