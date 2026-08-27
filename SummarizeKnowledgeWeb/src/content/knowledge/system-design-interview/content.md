## Bản đồ phỏng vấn thống nhất

Bộ `Interview` bao phủ 12 miền: thuật toán, C#, .NET/ASP.NET, Java, JVM/Spring, database, software engineering, system design, infrastructure/cloud, DevOps/observability, security và behavioral/leadership. Các file ở thư mục gốc là **câu hỏi**, còn `Anwsers` là **đáp án tương ứng**; đó là hai mặt của cùng một đơn vị học, không phải hai kho kiến thức độc lập. Các bộ `Quiz` tiếp tục ghép đề với answer key theo cùng nguyên tắc.

Nên ôn theo vòng lặp:

1. Tự trả lời thành tiếng trong một giới hạn thời gian.
2. Nêu giả định và trade-off trước khi xem đáp án.
3. So sánh với rubric, ghi đúng một lỗ hổng cần sửa.
4. Viết lại câu trả lời bằng từ ngữ của mình.
5. Lặp lại sau 1, 3 và 7 ngày; xen kẽ nhiều miền thay vì học dồn.

> Mục tiêu không phải nhớ 834 đáp án. Mục tiêu là tạo được mô hình tư duy có thể tái sử dụng khi câu hỏi, quy mô hoặc ràng buộc thay đổi.

## Quy trình system design từ mơ hồ đến kiến trúc

Một buổi thiết kế tốt diễn ra như cuộc đối thoại, không phải độc thoại vẽ hộp. Quy trình thực dụng:

| Bước | Câu hỏi phải trả lời | Đầu ra |
|---|---|---|
| Làm rõ | Ai dùng, use case chính, ngoài phạm vi là gì? | Functional requirements và scope |
| Chốt chất lượng | Latency, availability, consistency, durability, privacy? | SLO/NFR có thứ tự ưu tiên |
| Ước lượng | QPS, peak factor, kích thước record, retention, bandwidth? | Bậc độ lớn và nút thắt dự kiến |
| Contract | API/command/event nào đi qua ranh giới? | Giao diện, idempotency key, error model |
| Data | Access pattern, ownership, index, partition key? | Mô hình dữ liệu và consistency |
| Kiến trúc | Sync hay async, cache ở đâu, queue để làm gì? | Sơ đồ luồng đọc/ghi tối thiểu |
| Failure-first | Dependency chậm, retry storm, node/zone chết thì sao? | Timeout, retry budget, DLQ, failover |
| Vận hành | Đo gì, deploy/rollback/restore thế nào? | SLI, alert, runbook và migration plan |

Luôn bắt đầu bằng thiết kế đơn giản đáp ứng hiện tại, sau đó chỉ mở rộng tại nút thắt đã chứng minh. Một cache, broker hay microservice được thêm mà không gắn với access pattern hoặc failure mode cụ thể thường chỉ làm tăng trạng thái và chi phí vận hành.

## Dữ liệu, consistency và giao tiếp dịch vụ

Thiết kế dữ liệu xuất phát từ **ownership + access pattern**, không xuất phát từ tên công nghệ:

- Ràng buộc mạnh trong một transaction nên ở cùng boundary khi có thể. Cross-service transaction thường đổi sang saga, outbox/inbox và reconciliation.
- Strong consistency phù hợp số dư, tồn kho quyết định hoặc quyền truy cập. Eventual consistency phù hợp search index, analytics, feed và read model có thể sửa hội tụ.
- Replication tăng khả năng đọc và chịu lỗi nhưng tạo replication lag. Sharding tăng dung lượng ghi nhưng làm join, rebalance và hot-key khó hơn.
- Cache cần định nghĩa key, TTL, invalidation, stampede protection và hành vi khi cache hỏng. “Có Redis” chưa phải chiến lược cache.
- Event phải có schema/version, partition key, ordering scope, retry/DLQ và consumer idempotent. Broker không tự tạo exactly-once cho toàn business flow.

Khi so sánh SQL/NoSQL, hãy nói về transaction, query shape, index, growth, operational maturity và recovery—không dùng khẩu hiệu “NoSQL scale tốt hơn”.

## Scale, reliability và observability

Scale theo trục đang bão hòa:

- **Compute:** stateless instance, horizontal autoscaling, bounded worker và admission control.
- **Read:** index đúng access pattern, read replica, cache và precomputation.
- **Write:** batching, partition, asynchronous buffer; kiểm soát backpressure.
- **Storage:** retention/TTL, compression, tiering, archive và partition lifecycle.

Reliability cần một chuỗi phòng vệ: deadline đầu cuối → timeout từng hop → retry có jitter và budget → circuit breaker/bulkhead → degrade có chủ đích. Retry thao tác ghi chỉ an toàn khi có idempotency key hoặc cơ chế dedup. Cần phân biệt **availability** với **durability**, **backup** với **replica**, và phải diễn tập restore để RPO/RTO có ý nghĩa.

Observability bắt đầu từ SLI: latency distribution, error rate, throughput/saturation và business invariant. Log có correlation ID; metric dùng để cảnh báo xu hướng; trace giải thích critical path. Alert phải gắn với tác động người dùng và có runbook, không chỉ báo CPU cao.

## Protocol cho coding interview

Tab [Algorithms & Data Structures](?topic=algorithms-data-structures) là nguồn canonical cho pattern, proof, complexity và checklist edge case. Trong vòng phỏng vấn tổng hợp, chỉ cần giữ execution contract cố định để người nghe theo được suy luận:

```text
Clarify → Baseline → Invariant/pattern → Implement → Test → Complexity
```

Nói rõ assumption trước khi code, dry-run case biên và kết luận trade-off/cách production hóa. Với Java/C#, gọi đúng semantics ảnh hưởng correctness: equality/hash, overflow, immutable key, collection complexity, recursion depth, comparator consistency, cancellation và thread safety. Không lặp lại toàn bộ pattern ở tab này và không tối ưu sớm khi chưa chứng minh bottleneck.

## Phỏng vấn chuyên môn Java, .NET và nền tảng

Câu trả lời senior thường có bốn lớp: **cơ chế → trade-off → failure mode → bằng chứng thực tế**.

- Java/JVM: type/equality, erasure/generics, Stream laziness, exception/resource, JMM/happens-before, GC/JIT, class loading, Spring proxy/transaction, JPA N+1 và locking.
- C#/.NET: value/reference, async/await và cooperative cancellation, thread pool, `IAsyncEnumerable`, DI/middleware, ASP.NET lifetime, EF transaction/tracking, GC và diagnostics.
- Database: MVCC/isolation/locks, index và query plan, migration không downtime, backup/PITR, replication lag.
- Cloud/DevOps: network/TLS, container/Kubernetes, IaC state, CI/CD, SLO, incident response, security và cost.

Đừng dừng ở định nghĩa. Ví dụ, với “optimistic locking”, hãy chỉ ra khi collision tăng, cách retry, UX khi conflict và metric cần theo dõi.

## Behavioral và leadership bằng STAR(R)

Một câu chuyện mạnh dùng **STAR(R)**:

- **Situation:** bối cảnh ngắn, quy mô và ràng buộc.
- **Task:** trách nhiệm cá nhân; phân biệt rõ “tôi” và “chúng tôi”.
- **Action:** quyết định, lựa chọn bị loại, cách tạo đồng thuận và quản lý rủi ro.
- **Result:** kết quả có số liệu hoặc bằng chứng quan sát được.
- **Reflection:** điều học được, điều sẽ làm khác và cách áp dụng về sau.

Chuẩn bị story bank phủ: sự cố production, bất đồng kỹ thuật, thất bại, deadline khó, mentoring, cải thiện chất lượng, quyết định dưới thiếu dữ liệu và dẫn dắt xuyên nhóm. Một câu chuyện có thể dùng cho nhiều câu hỏi nhưng cần thay trọng tâm, không đọc kịch bản thuộc lòng.

Tín hiệu leadership senior là làm rõ mục tiêu, tạo cơ chế ra quyết định, giảm rủi ro hệ thống và nâng năng lực đội—không phải nhận mọi việc hoặc tự mình cứu dự án.

## Mock interview và rubric

Một vòng luyện cân bằng có thể gồm:

| Phiên | Thời lượng | Rubric chính |
|---|---:|---|
| Rapid fire | 20–30 phút | Chính xác, ngắn, biết giới hạn |
| Coding | 45–60 phút | Clarify, correctness, tests, complexity, communication |
| System design | 60 phút | Requirements, estimation, trade-off, failure, operations |
| Behavioral | 40–50 phút | Ownership, evidence, conflict, reflection |
| Practical scenario | 45 phút | Triage, ưu tiên, rollback, giao tiếp |

Chấm theo thang nhất quán và ghi bằng chứng cụ thể. Chỉ tăng độ khó khi lỗi nền tảng đã giảm. Luân phiên vai interviewer giúp nhận ra câu trả lời lan man hoặc thiếu giả định nhanh hơn.

## Lỗi thường gặp và checklist sẵn sàng

- [ ] Không nhảy vào công nghệ trước khi chốt requirement và NFR.
- [ ] Có ước lượng bậc độ lớn, không giả vờ số liệu quá chính xác.
- [ ] Mỗi retry đều có timeout, backoff, budget và idempotency story.
- [ ] Phân biệt replica với backup; có restore/rollback plan.
- [ ] Code có case biên, test và complexity rõ.
- [ ] Câu trả lời chuyên môn có trade-off và production failure mode.
- [ ] Có ít nhất 6 câu chuyện STAR(R), mỗi câu có kết quả đo được.
- [ ] Khi không biết, nói phạm vi hiểu biết rồi đề xuất cách kiểm chứng.
- [ ] Sau mỗi mock chỉ chọn 1–2 điểm sửa ưu tiên.

Lộ trình hợp lý là: foundation → bài theo miền → quiz không xem đáp án → mock có thời gian → review theo rubric → lặp giãn cách. Checklist `Interview/classic_checklist.md`, các answer key và roadmap của Algorithms là nguồn theo dõi chính; chúng đã được gom vào tab này thay vì tạo hàng chục tab hỏi/đáp trùng nhau.
