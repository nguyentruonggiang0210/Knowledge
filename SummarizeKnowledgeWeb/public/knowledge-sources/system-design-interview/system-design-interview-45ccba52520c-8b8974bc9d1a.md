# Bài kiểm tra tổng hợp Middle Backend — 90 phút

## Hướng dẫn

- Thời gian: **90 phút**. Tổng điểm: **100**.
- Trả lời ngắn gọn nhưng phải nêu được cơ chế hoặc lý do. Với câu tình huống, ghi rõ giả định và thứ tự xử lý.
- Không xem thư mục `Anwsers` trong lúc làm. Không cần viết code chạy được nếu đề không yêu cầu.
- Câu 1 điểm nên hoàn thành trong khoảng 30–45 giây; câu 2 điểm trong 1–2 phút; câu 3 điểm trong 3–4 phút.

## Thang tự đánh giá

| Điểm | Mức đánh giá |
|---:|---|
| 85–100 | Middle rất vững; có nền tảng tiến lên Senior |
| 70–84 | Đạt kỳ vọng Middle |
| 55–69 | Có nền tảng nhưng còn lỗ hổng quan trọng |
| 0–54 | Nên ôn lại theo từng ngân hàng chủ đề |

## 1. C# — 9 điểm

### QM-001 — [C#] [Short answer] — 1 điểm

Phân biệt value type và reference type khi gán biến hoặc truyền tham số. Từ khóa `ref` thay đổi điều gì?

### QM-002 — [C#] [Short answer] — 1 điểm

Deferred execution của LINQ là gì, và gọi `ToList()` thay đổi lifetime của query như thế nào?

### QM-003 — [C#] [Code reasoning] — 2 điểm

Đoạn code sau in gì và vì sao? Viết lại để mỗi action giữ đúng giá trị tương ứng.

```csharp
var actions = new List<Action>();
for (var i = 0; i < 3; i++)
    actions.Add(() => Console.Write(i));
foreach (var action in actions) action();
```

### QM-004 — [C#] [Code reasoning] — 2 điểm

Chỉ ra lỗi correctness và lỗi kiểm soát tải trong đoạn code; mô tả cách sửa.

```csharp
public Task SaveAll(IEnumerable<Item> items, CancellationToken ct)
{
    items.Select(async item => await repository.SaveAsync(item, ct));
    return Task.CompletedTask;
}
```

### QM-005 — [C#] [Scenario] — 3 điểm

Một singleton publisher giữ event handler của các object request-scoped. Sau vài ngày heap tăng liên tục dù request đã kết thúc. Hãy nêu nguyên nhân, bằng chứng cần thu và hai cách sửa an toàn.

## 2. .NET và ASP.NET Core — 9 điểm

### QM-006 — [.NET] [Short answer] — 1 điểm

IL, CLR và JIT phối hợp thế nào từ lúc build đến lúc một method được thực thi?

### QM-007 — [.NET] [Short answer] — 1 điểm

Transient, scoped và singleton khác nhau về lifetime; “captive dependency” là gì?

### QM-008 — [.NET] [Code reasoning] — 2 điểm

Middleware bắt mọi exception rồi trả HTTP 200 với `{ "success": false }`. Nêu hai hậu quả đối với client/vận hành và status/error contract nên được sửa thế nào.

### QM-009 — [.NET] [Scenario] — 2 điểm

Một `DbContext` singleton được dùng đồng thời bởi nhiều request và đôi lúc báo lỗi tracking hoặc trả dữ liệu lẫn nhau. Hãy xác định sai lifetime, ownership đúng và cách kiểm tra query chỉ thực thi khi nào.

### QM-010 — [.NET] [Scenario] — 3 điểm

Sau deploy, allocation rate và Gen 2 collection tăng mạnh, p99 tăng gấp bốn nhưng throughput không đổi. Trình bày thứ tự thu thập bằng chứng, khoanh vùng và xác nhận bản sửa.

## 3. Java — 9 điểm

### QM-011 — [Java] [Short answer] — 1 điểm

Java “pass-by-value” nghĩa là gì khi đối số là object reference?

### QM-012 — [Java] [Short answer] — 1 điểm

Contract giữa `equals()` và `hashCode()` là gì khi object làm key của `HashMap`?

### QM-013 — [Java] [Code reasoning] — 2 điểm

Hoàn thiện wildcard cho method sau để copy type-safe từ nguồn sang đích và giải thích lựa chọn.

```java
static <T> void copy(Collection<___> source, Collection<___> destination) {
    destination.addAll(source);
}
```

### QM-014 — [Java] [Code reasoning] — 2 điểm

Pipeline sau gặp exception khi có hai user trùng email. Hãy mô tả một chính sách merge hợp lệ và cách giữ insertion order.

```java
var usersByEmail = users.stream()
    .collect(Collectors.toMap(User::email, Function.identity()));
```

### QM-015 — [Java] [Scenario] — 3 điểm

Một service tăng số worker thread từ 50 lên 500 nhưng throughput giảm, latency và connection-pool wait tăng. Hãy nêu mô hình giải thích và các phép đo/thay đổi ưu tiên.

## 4. JVM và Spring — 9 điểm

### QM-016 — [JVM/Spring] [Short answer] — 1 điểm

Heap, thread stack, metaspace và direct/native memory chứa loại dữ liệu nào?

### QM-017 — [JVM/Spring] [Short answer] — 1 điểm

Vì sao `@Transactional` trên method được gọi bằng `this.method()` có thể không tạo transaction?

### QM-018 — [JVM/Spring] [Scenario] — 2 điểm

RSS của process tăng nhưng heap sau GC ổn định. Bạn sẽ phân biệt direct/native memory leak với allocation pressure bằng công cụ và dữ liệu nào?

### QM-019 — [JVM/Spring] [Scenario] — 2 điểm

Một transaction database được giữ mở trong lúc gọi HTTP sang service khác. Nêu rủi ro và phác thảo boundary dùng timeout, outbox cùng idempotency.

### QM-020 — [JVM/Spring] [Scenario] — 3 điểm

Endpoint tải 100 đơn hàng rồi phát thêm 100 query lấy dòng hàng; đổi tất cả association sang `EAGER` còn làm response nặng hơn. Hãy chẩn đoán, đề xuất hai query strategy và nêu một bẫy khi fetch nhiều collection.

## 5. Algorithms và Data Structures — 9 điểm

### QM-021 — [Algorithms] [Short answer] — 1 điểm

Vì sao append vào dynamic array có amortized O(1) dù một lần resize có thể O(n)?

### QM-022 — [Algorithms] [Short answer] — 1 điểm

Khi nào dùng BFS thay Dijkstra, và khi nào Dijkstra không còn đúng?

### QM-023 — [Algorithms] [Code reasoning] — 2 điểm

Đoạn binary search dưới đây có thể lặp vô hạn hoặc bỏ sót biên nào? Viết invariant và phép cập nhật đúng cho bài toán tìm phần tử đầu tiên `>= target`.

```text
while (left < right):
    mid = (left + right) / 2
    if a[mid] < target: right = mid
    else: left = mid
```

### QM-024 — [Algorithms] [Problem solving] — 2 điểm

Thiết kế thuật toán lấy 100 giá trị lớn nhất từ stream hàng trăm triệu phần tử với bộ nhớ O(100). Nêu độ phức tạp.

### QM-025 — [Algorithms] [Scenario] — 3 điểm

Thiết kế LRU cache có `get`/`put` O(1), capacity hữu hạn và truy cập concurrent. Nêu cấu trúc dữ liệu, invariant và cách chọn chiến lược đồng bộ.

## 6. Database — 10 điểm

### QM-026 — [Database] [Short answer] — 1 điểm

Dirty read, non-repeatable read và phantom read khác nhau thế nào?

### QM-027 — [Database] [Code reasoning] — 2 điểm

Vì sao query sau có thể trả rỗng nếu subquery chứa `NULL`, và viết lại theo semantics an toàn hơn?

```sql
SELECT id FROM customer
WHERE id NOT IN (SELECT customer_id FROM blocked_customer);
```

### QM-028 — [Database] [Code reasoning] — 2 điểm

Với index `(tenant_id, status, created_at)`, phân tích khả năng seek/range/order của query chỉ lọc `status`, và query lọc `tenant_id`, `status` rồi range theo `created_at`.

### QM-029 — [Database] [Scenario] — 2 điểm

Hai request cùng đọc balance 100 rồi lần lượt ghi 90 và 80, làm mất một cập nhật. Nêu hai cách kiểm soát concurrency và cách client xử lý conflict.

### QM-030 — [Database] [Scenario] — 3 điểm

Một query nhanh ở staging nhưng timeout ở production, đồng thời xuất hiện lock wait. Trình bày thứ tự kiểm tra generated SQL/parameter, execution plan, statistics/index, blocking và cách xác nhận fix không làm write path tệ hơn.

## 7. Software Engineering — 9 điểm

### QM-031 — [Software Engineering] [Short answer] — 1 điểm

Dependency Injection khác Dependency Inversion Principle ở điểm nào?

### QM-032 — [Software Engineering] [Short answer] — 1 điểm

Entity và value object khác nhau về identity, equality và mutability như thế nào?

### QM-033 — [Software Engineering] [Code review] — 2 điểm

Review đoạn code `catch (Exception) { return null; }`: chỉ ra vấn đề về contract, observability và cancellation; đề xuất error model thay thế.

### QM-034 — [Software Engineering] [Scenario] — 2 điểm

Một module có hàng trăm unit test mock mọi dependency nhưng lỗi wiring và SQL vẫn lọt production. Hãy phân bổ lại unit, integration, contract và end-to-end test theo rủi ro.

### QM-035 — [Software Engineering] [Scenario] — 3 điểm

Monolith cũ deploy 90 phút, test flaky và ownership mơ hồ; product yêu cầu tách microservice trong sáu tháng. Nêu ba bước ưu tiên đầu, tiêu chí quyết định boundary và cách giữ đường lui.

## 8. System Design — 9 điểm

### QM-036 — [System Design] [Short answer] — 1 điểm

Khi bắt đầu bài system design, cần làm rõ hai functional requirement và bốn non-functional requirement nào?

### QM-037 — [System Design] [Short answer] — 1 điểm

Strong consistency và eventual consistency khác nhau ở guarantee quan sát nào? Cho mỗi loại một use case.

### QM-038 — [System Design] [Scenario] — 2 điểm

Một key cache hết hạn gây hàng nghìn request cùng truy vấn database. Nêu ba kỹ thuật giảm cache stampede và trade-off chính.

### QM-039 — [System Design] [Scenario] — 2 điểm

Broker giao message at-least-once. Thiết kế consumer cập nhật database sao cho retry không tạo duplicate side effect.

### QM-040 — [System Design] [Scenario] — 3 điểm

Thiết kế dịch vụ notification email/SMS/push: nêu API/queue, preference, idempotency, rate limit, retry/DLQ, provider failover và ba metric SLO chính.

## 9. Infrastructure và Cloud — 9 điểm

### QM-041 — [Infra] [Short answer] — 1 điểm

Khi truy cập một HTTPS URL lần đầu, DNS, transport, TLS và HTTP diễn ra theo thứ tự nào?

### QM-042 — [Infra] [Short answer] — 1 điểm

Container khác virtual machine ở isolation kernel và resource control như thế nào?

### QM-043 — [Infra] [Scenario] — 2 điểm

Một Pod khởi động chậm bị liveness probe restart liên tục, còn lúc deploy lại nhận traffic trước khi warmup xong. Hãy phân vai startup, readiness và liveness probe.

### QM-044 — [Infra] [Scenario] — 2 điểm

HTTP client dùng connection pool lâu dài nhưng sau DNS failover vẫn gọi IP cũ. Nêu nguyên nhân và các timeout/lifetime cần phối hợp.

### QM-045 — [Infra] [Troubleshooting] — 3 điểm

Pod ở trạng thái `Running`, readiness pass nhưng client thỉnh thoảng nhận 503. Lập cây kiểm tra từ load balancer/Ingress/Service/Endpoint đến ứng dụng và saturation.

## 10. DevOps và Observability — 9 điểm

### QM-046 — [DevOps] [Short answer] — 1 điểm

Continuous Integration, Continuous Delivery và Continuous Deployment khác nhau thế nào?

### QM-047 — [DevOps] [Short answer] — 1 điểm

Phân biệt SLI, SLO và SLA; error budget dùng để ra quyết định gì?

### QM-048 — [DevOps] [Scenario] — 2 điểm

Thiết kế canary release: chọn cohort, metric, observation window và điều kiện automated rollback nào?

### QM-049 — [DevOps] [Troubleshooting] — 2 điểm

P99 tăng gấp năm nhưng CPU trung bình bình thường. Nêu ít nhất bốn hypothesis và telemetry dùng để kiểm chứng từng nhóm nguyên nhân.

### QM-050 — [DevOps] [Scenario] — 3 điểm

Deploy mới cần migration đổi tên cột đang được phiên bản cũ đọc. Hãy mô tả expand–migrate–contract, thứ tự rollout, validation và rollback point.

## 11. Security — 9 điểm

### QM-051 — [Security] [Short answer] — 1 điểm

Authentication và authorization khác nhau thế nào; vì sao ẩn nút trên UI không phải authorization?

### QM-052 — [Security] [Short answer] — 1 điểm

Hashing, encryption và digital signature bảo vệ ba mục tiêu khác nhau nào?

### QM-053 — [Security] [Code reasoning] — 2 điểm

Parameterized value có ngăn SQL injection nếu client được truyền trực tiếp tên cột `ORDER BY` không? Thiết kế xử lý dynamic identifier an toàn.

### QM-054 — [Security] [Scenario] — 2 điểm

Nêu các kiểm tra bắt buộc khi API nhận JWT và chiến lược key rotation không downtime.

### QM-055 — [Security] [Scenario] — 3 điểm

Backend nhận URL do người dùng nhập để tải file. Hãy threat-model SSRF qua redirect/DNS/private IP, đặt network boundary, giới hạn tài nguyên và kiểm tra nội dung trước khi lưu/phục vụ.
