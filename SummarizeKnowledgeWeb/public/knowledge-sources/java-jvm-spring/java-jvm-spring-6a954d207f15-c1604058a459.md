# Senior Java competency matrix — bản audit 2026

## Kết luận audit

12 bài ban đầu đủ làm **core bridge C# → Java**, nhưng chưa đủ để tuyên bố sẵn sàng phỏng vấn senior tại công ty lớn. Phần thiếu lớn nhất là Spring/JPA/MyBatis thực chiến, module/class loading, concurrency nâng cao, security, event-driven/distributed systems, observability/cloud, DSA, system design và leadership evidence. Roadmap mở rộng từ bài 13–27 lấp các khoảng trống đó.

Không có syllabus nào bảo đảm bao phủ mọi công ty: team low-latency, trading, Android, data platform hoặc compiler sẽ có bar chuyên ngành riêng. Matrix này bao phủ bar **Senior Backend Java/SDE tổng quát**; trước khi phỏng vấn vẫn phải đọc job description và hỏi recruiter về format.

## Phiên bản cần biết tại thời điểm 27-08-2026

- Java 25 là LTS hiện tại; Java 21 vẫn là LTS rất phổ biến trong hệ thống đang vận hành. Java 26 là feature release, phù hợp để theo dõi chứ không phải mặc định cho mọi production estate. Xem [Oracle Java SE Support Roadmap](https://www.oracle.com/java/technologies/java-se-support-roadmap.html).
- Spring Boot có các stable line 4.1.x, 4.0.x, 3.5.x; Boot 4.1 yêu cầu tối thiểu Java 17 và hỗ trợ đến Java 26. Xem [Spring Boot system requirements](https://docs.spring.io/spring-boot/system-requirements.html).
- Học theo ba tầng: **đọc được Java 17 legacy**, **viết production bằng Java 21**, **giải thích thay đổi Java 25**. Không dùng preview API trong thiết kế production nếu chưa có migration plan.

## Thang tự đánh giá

| Điểm | Bằng chứng |
|---:|---|
| 0 | không có tín hiệu dùng được hoặc sai nền tảng |
| 1 | biết định nghĩa nhưng cần nhiều gợi ý |
| 2 | đạt happy path mức Middle, còn thiếu trade-off/edge/failure |
| 3 | giải độc lập ở bar Senior của round, đúng và nêu được trade-off/test/failure phù hợp |
| 4 | strong-hire signal: chủ động khóa ambiguity, nhìn hệ quả bậc hai và đưa evidence rõ |

Mục tiêu senior: mọi năng lực P0 đạt ≥3; P1 đạt ≥2 và ít nhất ba năng lực P1 đạt 3; P2 phụ thuộc role. Rubric riêng của coding/LLD/HLD/Java-depth/behavioral định nghĩa evidence cụ thể; thang chung không thay các rubric đó.

## Matrix bao phủ

| Năng lực | Bar senior phải chứng minh | Bài | Ưu tiên |
|---|---|---:|---|
| Java language/type/API | equality, generics erasure, immutability, time/money/I/O, API design | 01–05, 13 | P0 |
| JVM/runtime | bytecode, class loading, JMM, GC/JIT, profiling, compatibility | 01, 07, 14 | P0 |
| Concurrency | happens-before, safe publication, executors, virtual thread, cancellation, backpressure | 06, 15 | P0 |
| Testing/build | Maven graph/BOM/plugin, unit/integration/contract/load test, deterministic design | 09 | P0 |
| SQL/persistence | plan/index/isolation, DataSource/pool, JDBC, MyBatis, JPA lifecycle/fetch/locking/migration | 10, 17, 27 | P0 |
| Spring production | IoC lifecycle, auto-config, MVC, validation, transaction/proxy/config/test slice | 11, 16 | P0 |
| Security | threat model, OAuth/OIDC/JWT, access control, injection, secrets/supply chain | 18 | P0 |
| Messaging | partition/order, consumer group, retry/DLQ, schema, outbox/idempotency/EOS scope | 19 | P0 |
| Distributed systems | consistency, quorum, replication/sharding, saga, NoSQL/search choice | 20 | P0 |
| Reliability | timeout/deadline, retry budget, circuit breaker, rate limit, cache/coherency | 21 | P0 |
| Observability/SRE | SLI/SLO, logs/metrics/traces/profiles, capacity, incident/RCA | 22 | P1 |
| Network/API/cloud | TCP/TLS/HTTP, REST/gRPC, container/JVM limits, Kubernetes/CI/CD | 23 | P1 |
| Coding interview | DSA patterns, complexity, clean runnable Java, edge-case tests | 24 | P0 |
| LLD/HLD interview | requirements, estimation, data/API/model, scale/failure/security/trade-off | 25 | P0 |
| Leadership | ownership, ambiguity, conflict, mentoring, incident, measurable impact | 26 | P0 |
| Capstone evidence | transaction + concurrency + outbox + security + telemetry + deployment ADR | 12 | P0 |

## Những gì không cần thuộc lòng

- Mọi JVM flag, mọi Spring annotation hoặc mọi Kafka config.
- Exact syntax của API hiếm dùng; interviewer quan tâm mental model và cách kiểm chứng.
- “Best practice” không có context. Câu trả lời senior luôn nêu workload, constraint, failure mode, alternative và cách đo.

## Definition of interview-ready

Bạn chỉ đánh dấu sẵn sàng khi có đủ bằng chứng:

- Giải hai bài coding medium trong 90 phút bằng Java, code compile, tự test edge case và nói rõ complexity.
- Trả lời 30 câu Java/JVM/Spring ngẫu nhiên với follow-up “tại sao/trường hợp hỏng” ≥80%.
- Thiết kế một hệ thống trong 45 phút, có estimate, API/data model, failure path, consistency, observability, security và cost.
- Kể được 8 câu chuyện STAR(R) không trùng hoàn toàn, có số liệu và phần “tôi” rõ ràng.
- Demo capstone, giải thích ba incident giả lập và bảo vệ mọi ADR quan trọng.
- Hoàn thành ít nhất ba mock loop có rubric; lỗi lặp lại được đưa ngược vào study backlog.
