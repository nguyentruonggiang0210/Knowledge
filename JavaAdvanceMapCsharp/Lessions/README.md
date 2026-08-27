# Roadmap Senior Java từ nền C#

## Bắt đầu bằng audit

Đọc [Senior competency matrix](00-senior-competency-matrix.md), tự chấm 0–4 và ưu tiên năng lực P0 dưới 3. Đây là roadmap cho Senior Backend Java/SDE; không nên học tuần tự máy móc nếu bạn đã mạnh một track.

## Lane lặp bắt đầu ngay từ tuần 1

Ba lane dưới đây chạy **song song** với chủ đề chính trong bảng; tuần 13–15 là giai đoạn consolidation/mock, không phải lần đầu học:

| Giai đoạn | Coding/DSA | Design | Behavioral/project | Mock checkpoint |
|---|---|---|---|---|
| Tuần 1–4 | đọc [24](24-dsa-coding-interview.md), 3 phiên/tuần: 2 học pattern + 1 timed | đọc framework HLD/LLD ở [25](25-system-design-interview.md), 1 bài estimate/2 tuần | mở [26](26-behavioral-leadership-interview.md), viết 1–2 STAR(R)/tuần | tuần 4: coding + Java-core mini-loop |
| Tuần 5–8 | 3 phiên timed/tuần, error log + retest unseen | 1 LLD hoặc HLD/tuần từ tuần 6 | hoàn thành 8 story + 2 project deep dive | tuần 8: loop 1, chấm đủ rubric |
| Tuần 9–12 | 3 phiên/tuần, graph/DP và Java traps | 1 HLD + 1 LLD mỗi 2 tuần, inject failure | luyện follow-up/metric/conflict/incident | tuần 12: loop 2 + remediation |
| Tuần 13–16 | 2–3 mock coding/tuần | 4 HLD + 2 LLD tổng kết | story calibration theo company | loop 3 tuần 15; final loop tuần 16 |

Không chuyển sang prompt quen sau mock: remediate đúng category lỗi rồi retest bằng prompt unseen. Như vậy mới tạo spaced repetition và ba vòng feedback mà readiness gate yêu cầu.

## Lộ trình 16 tuần

| Tuần | Track | Bài | Sản phẩm kiểm chứng |
|---:|---|---|---|
| 1 | Language bridge | [01](01-runtime-va-type-system.md)–[03](03-generics-collections.md) | value object + collection API đúng contract |
| 2 | Functional/error/API | [04](04-functional-streams.md), [05](05-exceptions-resources.md), [13](13-standard-library-api-design.md) | pipeline + file/time/money boundary |
| 3 | JVM | [07](07-jvm-memory-performance.md), [14](14-jpms-classloading-compatibility.md) | JFR/GC/class-loading investigation note |
| 4 | Concurrency | [06](06-concurrency.md), [15](15-concurrency-deep-dive.md) | fan-out có deadline/backpressure/cancellation |
| 5 | Build & test | [08](08-annotations-reflection.md), [09](09-testing-build-tooling.md) | unit/integration/contract test matrix |
| 6 | SQL & persistence | [10](10-sql-jdbc-transactions.md), [17](17-jpa-hibernate-persistence.md), [27](27-mybatis-dapper-sql-mapper.md) | DataSource/pool + query plan + JPA/MyBatis transaction/locking tests |
| 7 | Spring | [11](11-architecture-spring.md), [16](16-spring-boot-production.md) | REST service có validation/error/config/test |
| 8 | Security & network | [18](18-security-oauth-owasp.md), phần network của [23](23-networking-cloud-devops.md) | threat model + protected endpoint |
| 9 | Event-driven | [19](19-messaging-kafka-event-driven.md) | idempotent consumer + outbox/retry/DLQ design |
| 10 | Distributed systems | [20](20-distributed-systems-data.md) | consistency/sharding design exercise |
| 11 | Reliability | [21](21-caching-resilience-rate-limiting.md) | retry budget + cache/rate-limit failure tests |
| 12 | Production | [22](22-observability-sre-performance.md), [23](23-networking-cloud-devops.md) | SLO/dashboard/runbook + container manifest |
| 13 | Coding consolidation | [24](24-dsa-coding-interview.md) | 10 timed unseen problems, sửa các error category lặp |
| 14 | Design consolidation | [25](25-system-design-interview.md) | 4 HLD + 2 LLD mock có rubric riêng |
| 15 | Leadership calibration | [26](26-behavioral-leadership-interview.md) | story bank 8–10 STAR(R) + loop 3 |
| 16 | Graduation | [12](12-capstone.md) + full mock loop | capstone, ADR, incident drill, mock interview |

## Ba lane học song song

- **Java depth:** 01–09, 13–15. Không bỏ qua vì đã biết C#; các bug senior thường nằm đúng ở semantic khác nhau.
- **Backend production:** 10–23 và 27. Phải trả lời “failure xảy ra thì sao?” và “đo bằng gì?” cho mỗi quyết định.
- **Interview execution:** 24–26. Kiến thức mạnh nhưng không luyện timebox/communication vẫn dễ fail.

## Cổng kiểm tra

- **Core gate:** equality/hash, erasure/variance, lazy stream, resource ownership, time/money API.
- **Runtime gate:** class loading, JMM/happens-before, GC/JIT, virtual thread/backpressure, profiling evidence.
- **Service gate:** Spring proxy/transaction, JPA fetch/locking, MyBatis mapper/session/dynamic SQL, DataSource/pool, SQL plan, API/security/test boundary.
- **Scale gate:** message semantics, idempotency, consistency, cache/retry, SLO/capacity, cloud failure.
- **Interview gate:** coding + HLD/LLD + behavioral đều qua rubric; không bù một lane yếu bằng lane khác.

## Cách học mỗi bài

1. Viết dự đoán trước khi chạy sample.
2. Map ý định C# sang idiom Java, không dịch từng dòng.
3. Làm failure exercise và quiz không xem đáp án.
4. Ghi một production story: context → decision → alternative → metric → failure mode.
5. Thêm câu sai vào error log và ôn theo spaced repetition.

Build toàn bộ Java modules 01–25 và 27: `mvn test`. Build riêng: `mvn -f SourceSamples/<bai>/pom.xml test`. Bài 26 là bộ artifact Markdown nên không có POM.
