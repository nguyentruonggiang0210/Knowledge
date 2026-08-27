# Rapid Fire Backend — 80 câu trong 65 phút

## Hướng dẫn

- Thời gian mục tiêu: **65 phút**; có thể dùng trong khung **60–75 phút**.
- Tổng điểm: **80**; mỗi câu 1 điểm.
- Mỗi câu chỉ trả lời **1–3 câu văn**. Ưu tiên contract/cơ chế cốt lõi và một pitfall quan trọng.
- Không tra thư mục `Anwsers` khi làm. Nếu không biết, đánh dấu để quay lại thay vì dừng quá 60 giây.

## Thang tự đánh giá

| Điểm | Mức đánh giá |
|---:|---|
| 68–80 | Nền tảng rộng và chắc, sẵn sàng vòng phỏng vấn Middle/Senior |
| 56–67 | Đạt nền tảng Middle, nên củng cố các nhóm dưới 70% |
| 40–55 | Kiến thức chưa đều; cần ôn theo ngân hàng chủ đề |
| 0–39 | Nên học lại nền tảng trước khi luyện tình huống nâng cao |

## 1. C# — 8 câu

### QR-001 — [C#] — 1 điểm

Boxing là gì và vì sao generic collection thường tránh được chi phí này?

### QR-002 — [C#] — 1 điểm

Vì sao `IEnumerable<string>` có thể gán cho `IEnumerable<object>` nhưng `List<string>` không thể gán cho `List<object>`?

### QR-003 — [C#] — 1 điểm

`event` khác public delegate field ở quyền mà subscriber được phép thực hiện như thế nào?

### QR-004 — [C#] — 1 điểm

Một LINQ query deferred được enumerate hai lần có thể tạo kết quả hoặc chi phí gì bất ngờ?

### QR-005 — [C#] — 1 điểm

Compiler biến method `async` thành cấu trúc gì, và code trước `await` chạy khi nào?

### QR-006 — [C#] — 1 điểm

Vì sao gọi `.Result` hoặc `.Wait()` trên task có thể gây deadlock hoặc thread-pool starvation?

### QR-007 — [C#] — 1 điểm

Vì sao không nên `lock` trên `this`, string interned hoặc object công khai?

### QR-008 — [C#] — 1 điểm

Vì sao `Span<T>` là `ref struct` và không thể được giữ qua `await` theo cách thông thường?

## 2. .NET và ASP.NET Core — 7 câu

### QR-009 — [.NET] — 1 điểm

Gen 0/1/2 và Large Object Heap phản ánh giả định lifetime nào của GC?

### QR-010 — [.NET] — 1 điểm

Hai dấu hiệu production phổ biến của .NET thread-pool starvation là gì?

### QR-011 — [.NET] — 1 điểm

Vì sao hai type cùng full name được load bởi hai `AssemblyLoadContext` có thể không cast được cho nhau?

### QR-012 — [.NET] — 1 điểm

Captive dependency xảy ra khi lifetime nào phụ thuộc trực tiếp lifetime nào?

### QR-013 — [.NET] — 1 điểm

Middleware exception handling nên đứng ở đâu trong pipeline và vì sao thứ tự middleware quan trọng?

### QR-014 — [.NET] — 1 điểm

Vì sao `DbContext` không nên là singleton hoặc được dùng đồng thời bởi nhiều thread?

### QR-015 — [.NET] — 1 điểm

Log, metric và distributed trace lần lượt trả lời tốt nhất loại câu hỏi vận hành nào?

## 3. Java — 8 câu

### QR-016 — [Java] — 1 điểm

`==` và `equals()` khác nhau thế nào với object Java?

### QR-017 — [Java] — 1 điểm

PECS hướng dẫn đặt `extends` và `super` thế nào cho producer/consumer generic?

### QR-018 — [Java] — 1 điểm

Điều gì xảy ra nếu field tham gia `hashCode()` của key bị đổi sau khi đưa vào `HashMap`?

### QR-019 — [Java] — 1 điểm

Vì sao fail-fast iterator và `ConcurrentModificationException` không tạo thread safety?

### QR-020 — [Java] — 1 điểm

Intermediate operation của Stream được thực thi khi nào và short-circuit terminal operation thay đổi gì?

### QR-021 — [Java] — 1 điểm

`volatile` bảo đảm visibility/order nào và vì sao không làm `count++` atomic?

### QR-022 — [Java] — 1 điểm

Vì sao `LongAdder.sum()` phù hợp metric hơn quota cần snapshot tuyến tính?

### QR-023 — [Java] — 1 điểm

Virtual thread giúp workload nào và tại sao vẫn phải giới hạn connection tới database?

## 4. JVM và Spring — 7 câu

### QR-024 — [JVM/Spring] — 1 điểm

Class identity trên JVM gồm binary name và thành phần nào nữa?

### QR-025 — [JVM/Spring] — 1 điểm

Metaspace và direct memory khác heap ở dữ liệu và cách chẩn đoán ra sao?

### QR-026 — [JVM/Spring] — 1 điểm

G1 và ZGC ưu tiên trade-off throughput/pause khác nhau thế nào?

### QR-027 — [JVM/Spring] — 1 điểm

Spring singleton có tự động thread-safe không, và state nào không nên đặt trong singleton controller?

### QR-028 — [JVM/Spring] — 1 điểm

JDK dynamic proxy và class-based proxy khác nhau về interface và `final` method như thế nào?

### QR-029 — [JVM/Spring] — 1 điểm

Spring mặc định rollback transaction với nhóm exception nào?

### QR-030 — [JVM/Spring] — 1 điểm

Vì sao đổi mọi association JPA sang `EAGER` không phải cách đúng để sửa N+1?

## 5. Algorithms và Data Structures — 7 câu

### QR-031 — [Algorithms] — 1 điểm

Khái niệm amortized O(1) của dynamic-array append có nghĩa gì?

### QR-032 — [Algorithms] — 1 điểm

Stack, queue và deque khác nhau ở thứ tự lấy phần tử như thế nào?

### QR-033 — [Algorithms] — 1 điểm

BFS và DFS đều O(V+E) trên adjacency list nhưng khác nhau ở guarantee đường đi nào?

### QR-034 — [Algorithms] — 1 điểm

`lower_bound` trả vị trí có invariant gì so với target?

### QR-035 — [Algorithms] — 1 điểm

Để giữ Top-K lớn nhất từ stream, nên duy trì min-heap hay max-heap kích thước K?

### QR-036 — [Algorithms] — 1 điểm

Bốn thành phần tối thiểu khi mô tả một dynamic-programming solution là gì?

### QR-037 — [Algorithms] — 1 điểm

Bloom filter có thể false positive hay false negative trong triển khai chuẩn không xóa?

## 6. Database — 8 câu

### QR-038 — [Database] — 1 điểm

Vì sao `column = NULL` không trả true trong SQL?

### QR-039 — [Database] — 1 điểm

Quy tắc leftmost-prefix ảnh hưởng composite index như thế nào?

### QR-040 — [Database] — 1 điểm

Một predicate không SARGable làm optimizer khó dùng index seek ra sao?

### QR-041 — [Database] — 1 điểm

Durability trong ACID phụ thuộc những cơ chế persistence nào?

### QR-042 — [Database] — 1 điểm

MVCC cho phép reader không chặn writer bằng snapshot/version như thế nào?

### QR-043 — [Database] — 1 điểm

Deadlock khác lock wait bình thường ở cấu trúc phụ thuộc nào, và application nên phản ứng ra sao?

### QR-044 — [Database] — 1 điểm

Keyset pagination tránh hai nhược điểm nào của offset pagination?

### QR-045 — [Database] — 1 điểm

Đọc từ asynchronous replica có thể vi phạm read-your-writes thế nào?

## 7. Software Engineering — 7 câu

### QR-046 — [Software Engineering] — 1 điểm

High cohesion và low coupling biểu hiện điều gì về boundary của module?

### QR-047 — [Software Engineering] — 1 điểm

Khi nào composition phù hợp hơn inheritance?

### QR-048 — [Software Engineering] — 1 điểm

Aggregate trong DDD chịu trách nhiệm bảo vệ điều gì?

### QR-049 — [Software Engineering] — 1 điểm

Domain event và integration event khác nhau ở boundary và thời điểm phát như thế nào?

### QR-050 — [Software Engineering] — 1 điểm

Idempotency key phải gắn với scope và lifecycle nào để phát hiện retry đúng?

### QR-051 — [Software Engineering] — 1 điểm

Mock quá nhiều có thể làm test bỏ sót hai loại lỗi tích hợp nào?

### QR-052 — [Software Engineering] — 1 điểm

Một Architecture Decision Record tối thiểu nên ghi những mục nào?

## 8. System Design — 7 câu

### QR-053 — [System Design] — 1 điểm

Từ traffic trung bình, vì sao phải áp dụng peak factor khi ước lượng capacity?

### QR-054 — [System Design] — 1 điểm

CAP yêu cầu hệ thống lựa chọn điều gì khi network partition thực sự xảy ra?

### QR-055 — [System Design] — 1 điểm

Consistent hashing giảm data movement khi node thay đổi nhưng không tự giải quyết dạng hotspot nào?

### QR-056 — [System Design] — 1 điểm

Cache-aside xử lý cache miss và write như thế nào?

### QR-057 — [System Design] — 1 điểm

At-least-once delivery đặt yêu cầu gì lên message consumer?

### QR-058 — [System Design] — 1 điểm

Exponential backoff cần jitter để tránh hiện tượng gì?

### QR-059 — [System Design] — 1 điểm

Vì sao liveness check không nên fail chỉ vì một dependency tạm thời unavailable?

## 9. Infrastructure và Cloud — 7 câu

### QR-060 — [Infra] — 1 điểm

TCP cung cấp byte stream có hai guarantee chính nào và không giữ message boundary nghĩa là gì?

### QR-061 — [Infra] — 1 điểm

HTTP/2 và HTTP/3 khác nhau ở transport-level head-of-line blocking như thế nào?

### QR-062 — [Infra] — 1 điểm

CIDR xác định network prefix ra sao, và NAT khác firewall ở chức năng cốt lõi nào?

### QR-063 — [Infra] — 1 điểm

File-descriptor leak thường biểu hiện thế nào với socket/file trên Linux?

### QR-064 — [Infra] — 1 điểm

Vì sao container có thể bị OOMKilled dù heap limit của runtime chưa đạt cgroup memory limit?

### QR-065 — [Infra] — 1 điểm

Kubernetes Service và Ingress/Gateway khác nhau ở phạm vi routing nào?

### QR-066 — [Infra] — 1 điểm

Object, block và file storage phù hợp ba access pattern khác nhau nào?

## 10. DevOps và Observability — 7 câu

### QR-067 — [DevOps] — 1 điểm

“Build once, promote the same artifact” loại bỏ loại drift nào?

### QR-068 — [DevOps] — 1 điểm

Canary release khác rolling deployment ở quyết định phát hành dựa trên tín hiệu nào?

### QR-069 — [DevOps] — 1 điểm

Feature flag tách “deploy” khỏi “release” như thế nào?

### QR-070 — [DevOps] — 1 điểm

Bốn golden signals của SRE là gì?

### QR-071 — [DevOps] — 1 điểm

Vì sao user ID hoặc order ID không nên là metric label?

### QR-072 — [DevOps] — 1 điểm

Trace context cần được truyền qua hai loại boundary phổ biến nào?

### QR-073 — [DevOps] — 1 điểm

Trong incident, mitigation khác root-cause fix ở mục tiêu tức thời nào?

## 11. Security — 7 câu

### QR-074 — [Security] — 1 điểm

Ba thuộc tính trong CIA triad là gì?

### QR-075 — [Security] — 1 điểm

Session cookie và JWT bearer khác nhau thế nào về revocation và CSRF?

### QR-076 — [Security] — 1 điểm

PKCE bảo vệ Authorization Code Flow trước loại interception nào?

### QR-077 — [Security] — 1 điểm

Vì sao password cần salt riêng và thuật toán hash chậm?

### QR-078 — [Security] — 1 điểm

Nonce reuse với AEAD có thể phá các guarantee nào?

### QR-079 — [Security] — 1 điểm

CSRF và CORS bảo vệ hai vấn đề khác nhau nào?

### QR-080 — [Security] — 1 điểm

Parameterized query bảo vệ value nhưng không tự bảo vệ dynamic identifier như thế nào?
