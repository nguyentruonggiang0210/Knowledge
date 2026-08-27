## Chất lượng là thuộc tính của cả hệ thống

Code sạch chỉ là một phần. Chất lượng production là khả năng hệ thống **đúng, dễ thay đổi, quan sát được, phục hồi được và an toàn** trong suốt vòng đời. Nó đến từ nhiều vòng phản hồi: type checker/compiler, test, review, CI, telemetry, canary, incident và phản hồi người dùng.

Một quyết định kỹ thuật tốt cần trả lời:

- Invariant nào đang được bảo vệ?
- Boundary nào có thể thay đổi độc lập?
- Failure được biểu diễn và quan sát ra sao?
- Ta sẽ kiểm chứng bằng test hoặc metric nào?
- Nếu giả định sai, rollback/migrate thế nào?

> “Clean” không có nghĩa là nhiều layer. Kiến trúc chỉ đáng giá khi làm rõ trách nhiệm, hướng dependency và điểm thay đổi.

## Modeling trước framework

Mô hình bắt đầu từ ngôn ngữ miền: entity có identity, value object bất biến, aggregate bảo vệ invariant và service biểu diễn hành vi không thuộc một object rõ ràng. Encapsulation nghĩa là trạng thái không thể đi vào cấu hình sai qua public setter tùy ý.

Các nguyên tắc thực dụng:

- Ưu tiên composition; inheritance chỉ khi quan hệ thay thế thật sự đúng.
- Làm immutable mặc định cho value và message; mutation phải có owner rõ.
- Equality/hash phải nhất quán, đặc biệt khi object làm key của hash map/set.
- Không để DTO/database model lan vào domain nếu chúng ép business rule phụ thuộc transport hoặc persistence.
- Tên gọi theo ý nghĩa nghiệp vụ, tránh lớp kiểu `Helper`, `Manager`, `Common` gom trách nhiệm vô hạn.

SOLID là công cụ chẩn đoán coupling, không phải mục tiêu đếm interface. Một interface chỉ có một implementation vẫn hữu ích nếu nó đặt boundary tới clock, broker, filesystem hay database; nhưng interface cho mọi class thuần túy chỉ làm tăng indirection.

## Clean Architecture và hướng dependency

Một bố cục tối thiểu:

```text
Presentation → Application → Domain
                     ↑
Infrastructure ──────┘  (implement các port do application sở hữu)
```

- **Domain:** rule và type cốt lõi; không biết React, ASP.NET, Spring hay SQL.
- **Application:** use case, orchestration và port cần thiết.
- **Infrastructure:** adapter cho file, database, API, queue.
- **Presentation:** chuyển tương tác người dùng thành input use case và render output.
- **Composition root:** chọn implementation và nối dependency.

Boundary có chi phí. Với CRUD nhỏ, module theo feature + service/repository rõ ràng có thể đủ. Tách microservice, event hoặc abstraction chỉ khi có nhu cầu ownership, deployment, scale, security hoặc thay đổi độc lập.

## Contract và API có thể tiến hóa

Contract gồm cả dữ liệu, semantics, error, timeout và compatibility—not chỉ schema.

- Validate ở boundary; domain vẫn tự bảo vệ invariant.
- Error có mã ổn định, thông điệp cho người dùng và chi tiết correlation cho vận hành; không lộ stack trace/secrets.
- Operation ghi qua mạng cần idempotency key hoặc natural dedup key.
- Pagination phải ổn định; cursor tốt hơn offset cho tập thay đổi lớn.
- Version bằng additive change trước; deprecate có telemetry và thời hạn.
- Event schema cần owner, compatibility rule và consumer-driven verification.

Structured output, OpenAPI/JSON Schema và type generation giảm mismatch nhưng không thay semantic validation. Một payload đúng schema vẫn có thể sai business rule.

## Testing theo rủi ro

Chọn test dựa trên failure cần bắt:

| Mức | Bắt tốt | Không nên dùng để |
|---|---|---|
| Unit/property | Rule, invariant, edge case, state transition | Chứng minh wiring/database thật |
| Integration | SQL, serialization, filesystem, broker, framework config | Bao phủ mọi tổ hợp business |
| Contract | Tương thích producer/consumer hoặc API | Thay thế integration end-to-end |
| End-to-end | Critical journey và deployment wiring | Kiểm mọi nhánh nhỏ |
| Load/chaos/security | Capacity, degradation, threat assumption | Chạy thay mọi test trong mỗi commit |

Test tốt có Arrange–Act–Assert rõ, deterministic, tên mô tả hành vi và thất bại giúp chẩn đoán. Tránh mock toàn bộ implementation detail; hãy fake boundary có semantics thật hoặc dùng Testcontainers cho dependency quan trọng. Với async/concurrency, không dùng `sleep` để “đợi đủ lâu”; điều khiển clock/signal và test cancellation, timeout, backpressure.

Property-based test hợp với parser, serializer, thuật toán và invariant. Snapshot hữu ích cho output lớn ổn định nhưng cần review có chủ đích, không bấm update khi chưa hiểu diff.

## Quality gates trong delivery

Pipeline nên đi từ phản hồi nhanh đến chậm:

```text
format/lint → type-check/compile → unit → integration/contract
→ build artifact + scan → deploy staging → smoke → progressive delivery
```

Artifact phải immutable và promotion cùng một artifact qua môi trường. Dependency/secret/image scan hỗ trợ supply-chain security; SBOM và provenance giúp điều tra. Migration dữ liệu dùng expand → migrate/backfill → switch → contract, có observability và đường quay lại.

Pull request nhỏ, nêu mục đích/rủi ro/test/rollback, dễ review hơn một diff lớn. Review tập trung correctness, security, operability và maintainability; formatter xử lý style cơ học. Các quality gate phải đáng tin—test flaky khiến đội học cách bỏ qua tín hiệu.

## Production readiness và secure-by-design

Trước khi phát hành, kiểm tra:

- owner, SLO, dashboard, alert và runbook;
- timeout/cancellation/retry budget, rate limit và overload behavior;
- authentication/authorization, least privilege, secret rotation và audit;
- backup/restore, migration, rollback và dependency outage;
- resource limit, capacity estimate, cost guardrail và data retention;
- health/readiness đúng semantics, graceful shutdown và drain traffic.

Threat modeling dùng asset → trust boundary → attacker goal → abuse case → control → residual risk. Validate input, encode output, dùng parameterized query, không log token/PII, pin dependency và tách quyền build/deploy/runtime. Security test và scan là lưới an toàn; thiết kế boundary và least privilege mới giảm blast radius.

## Tài liệu là một phần của kiến trúc

Tài liệu tốt giúp ra quyết định và xử lý sự cố:

- **README:** mục tiêu, cách chạy, dependency và giới hạn.
- **ADR:** context, options, decision, consequence, điều kiện xem lại.
- **Runbook:** symptom, kiểm tra, hành động an toàn, rollback/escalation.
- **SLO:** user journey, SLI, target, window và error-budget policy.
- **Postmortem:** timeline, contributing factors, impact và action có owner; không đổ lỗi.
- **Threat model / readiness / DR test:** giả định được kiểm chứng định kỳ.

Diagram mô tả boundary và flow quan trọng hơn ảnh chụp mọi class. Tài liệu phải ở gần code, được review và có owner; tài liệu hết hạn nguy hiểm hơn thiếu tài liệu vì tạo niềm tin sai.

## Bằng chứng thực hành và trạng thái nguồn

Các capstone trong AI Engineer, Java, Data Engineering, RAG, Terraform/DevOps là nơi biến kiến thức thành evidence: test report, benchmark, dashboard, ADR, threat model, runbook, demo và postmortem giả lập.

Không phải mọi thư mục trong workspace đều là implementation hoàn chỉnh:

- `TestEveryThing` hiện chỉ là scaffold .NET “Hello World” cùng Dockerfile; không đủ để xem là bộ testing.
- `MLDotNet` mới có cấu hình Model Builder và chương trình khung.
- GraphQL .NET còn thiếu wiring/type/context và chưa khởi chạy server.
- Một số Java messaging/resilience/observability sample cố ý là teaching model, không phải client Kafka, distributed consensus hay OpenTelemetry exporter thật.

Gắn nhãn **ready / demo / draft / skeleton** giúp người học không nhầm code minh họa với production reference.

## Checklist hoàn thiện một feature

- [ ] Requirement, invariant và tiêu chí chấp nhận đã rõ.
- [ ] Domain không phụ thuộc transport/persistence framework ngoài nhu cầu thật.
- [ ] Contract có validation, error semantics, compatibility và idempotency.
- [ ] Test chọn theo rủi ro; có case biên và failure path.
- [ ] Log/metric/trace không lộ dữ liệu nhạy cảm và đủ correlation.
- [ ] Timeout, cancellation, resource bound và overload behavior rõ.
- [ ] CI tạo artifact tái lập; scan và migration gate chạy được.
- [ ] Có rollout, rollback và quan sát sau deploy.
- [ ] README/ADR/runbook được cập nhật cùng code.
- [ ] Giới hạn của demo được ghi thẳng, không quảng bá quá mức.

Đó là vòng kín của engineering: **mô hình đúng → boundary rõ → kiểm chứng tự động → triển khai có kiểm soát → học từ vận hành**.
