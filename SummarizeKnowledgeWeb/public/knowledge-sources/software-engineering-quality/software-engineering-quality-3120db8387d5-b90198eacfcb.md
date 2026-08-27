# Software Engineering và kiến trúc ứng dụng

Ngân hàng câu hỏi về tư duy thiết kế, chất lượng phần mềm, testing và năng lực dẫn dắt kỹ thuật. Khi trả lời câu Senior, hãy nêu bối cảnh mà nguyên tắc/pattern **không** nên áp dụng.

## 1. Nguyên lý thiết kế và mô hình hóa

### SE-001 [Middle]
SOLID giải quyết nhóm vấn đề nào? Cho một ví dụ việc áp dụng SOLID quá mức làm code khó bảo trì hơn.

### SE-002 [Middle]
High cohesion và low coupling là gì? Bạn đo hoặc nhận ra chúng qua những dấu hiệu nào trong codebase?

### SE-003 [Middle → Senior]
Vì sao thường ưu tiên composition hơn inheritance? Trường hợp nào inheritance vẫn là mô hình đúng?

### SE-004 [Senior]
Liskov Substitution Principle liên quan thế nào đến precondition, postcondition và invariant? Nêu một vi phạm không dùng ví dụ `Square/Rectangle`.

### SE-005 [Middle]
Dependency Injection khác Dependency Inversion thế nào? Vì sao Service Locator thường bị xem là anti-pattern?

### SE-006 [Senior]
So sánh anemic domain model và rich domain model. Với một CRUD service đơn giản, bạn sẽ chọn mô hình nào và vì sao?

### SE-007 [Senior]
Trong Domain-Driven Design, bounded context được xác định bằng ngôn ngữ và business capability như thế nào? Vì sao không nên đồng nhất bounded context với microservice?

### SE-008 [Senior]
Aggregate bảo vệ invariant ra sao? Làm thế nào chọn aggregate boundary mà không tạo object graph hoặc transaction quá lớn?

### SE-009 [Middle]
Phân biệt entity và value object. Equality, identity và tính bất biến của chúng nên được cài đặt thế nào?

### SE-010 [Senior]
Phân biệt domain event và integration event. Tại thời điểm nào mỗi loại được phát, và xử lý failure khác nhau ra sao?

## 2. Kiến trúc và pattern

### SE-011 [Middle → Senior]
Hexagonal, Onion và Clean Architecture có ý tưởng chung nào? Dependency rule được kiểm tra trong thực tế bằng cách nào?

### SE-012 [Senior]
CQRS có nhất thiết cần hai database hoặc event sourcing không? Khi nào chi phí eventual consistency không đáng để chấp nhận?

### SE-013 [Middle]
So sánh Strategy, Decorator và Adapter. Hãy chỉ ra một tín hiệu code cho thấy mỗi pattern có thể phù hợp.

### SE-014 [Middle]
Factory Method, Abstract Factory và Builder giải quyết các vấn đề tạo object khác nhau thế nào?

### SE-015 [Middle → Senior]
Observer/pub-sub trong cùng process có các rủi ro nào về lifecycle, thứ tự, exception và memory leak?

### SE-016 [Senior]
Repository và Unit of Work còn mang lại giá trị gì khi ORM đã cung cấp abstraction tương tự? Khi nào custom generic repository làm mất khả năng của ORM?

### SE-017 [Senior]
Anti-corruption layer bảo vệ domain khỏi hệ thống legacy hoặc vendor API ra sao? Bạn đặt mapping và retry ở đâu?

### SE-018 [Senior]
Thiết kế modular monolith như thế nào để module có boundary thực sự thay vì chỉ là các folder?

### SE-019 [Senior]
Những tín hiệu nào biện minh cho việc tách một module thành microservice? Những chi phí vận hành nào phải được tính trước?

### SE-020 [Middle → Senior]
Thiết kế API backward-compatible gồm những nguyên tắc nào về field, enum, validation, pagination và error contract?

### SE-021 [Senior]
Idempotency ở application layer được thiết kế thế nào? Phân biệt natural idempotency, idempotency key và deduplication theo message ID.

### SE-022 [Middle]
Một error model tốt cho API cần chứa gì? Vì sao không nên trả stack trace hoặc dùng HTTP 200 cho mọi kết quả?

## 3. Testing và chất lượng

### SE-023 [Middle]
Test pyramid, test trophy và honeycomb khác nhau ở điểm nhấn nào? Bạn chọn tỷ lệ test dựa trên kiến trúc ra sao?

### SE-024 [Middle]
Khi nào mock hữu ích, khi nào mock làm test gắn chặt với implementation? Phân biệt mock, stub, fake và spy.

### SE-025 [Middle → Senior]
Integration test có database nên quản lý schema, dữ liệu và isolation giữa các test như thế nào?

### SE-026 [Senior]
Consumer-driven contract testing phát hiện được lỗi gì và không thay thế được loại test nào? Quản lý version contract ra sao?

### SE-027 [Senior]
Property-based testing và mutation testing bổ sung gì cho test case truyền thống? Nêu một ví dụ phù hợp cho mỗi loại.

### SE-028 [Middle → Senior]
Flaky test thường đến từ đâu? Hãy mô tả quy trình khoanh vùng và sửa thay vì chỉ retry hoặc quarantine vô thời hạn.

### SE-029 [Senior]
Bạn refactor một module legacy gần như không có test như thế nào? Characterization test và seam giúp giảm rủi ro ra sao?

### SE-030 [Middle → Senior]
Một code review hiệu quả nên ưu tiên điều gì? Phân biệt lỗi phải chặn merge với góp ý sở thích.

## 4. Delivery, thay đổi và vận hành codebase

### SE-031 [Senior]
Technical debt nên được mô tả, định lượng và ưu tiên thế nào để trao đổi được với product/business?

### SE-032 [Senior]
Mô tả expand–migrate–contract cho một thay đổi schema hoặc API không downtime. Điểm rollback nằm ở đâu?

### SE-033 [Middle → Senior]
Feature flag hỗ trợ release thế nào và tạo ra loại nợ kỹ thuật nào? Quản lý owner, expiry và interaction giữa flag ra sao?

### SE-034 [Middle]
Semantic Versioning có giới hạn gì trong hệ thống phân tán? Bạn kiểm soát dependency update và breaking change thế nào?

### SE-035 [Middle → Senior]
So sánh trunk-based development với GitFlow. Team cần điều kiện kỹ thuật và thói quen nào để trunk-based an toàn?

### SE-036 [Senior]
Hai request đồng thời cùng sửa một business entity. Bạn đặt concurrency control ở domain, application và persistence layer thế nào?

### SE-037 [Middle]
Clean code có phải luôn là method ngắn và ít comment không? Comment nào có giá trị và abstraction nào đang che giấu logic?

### SE-038 [Senior]
Bạn xử lý yêu cầu “tối ưu performance” thế nào trước khi sửa code? Benchmark đáng tin cần tránh những sai lệch gì?

### SE-039 [Senior]
Architecture Decision Record nên ghi những gì? Khi nào cần supersede một quyết định và làm sao tránh ADR trở thành tài liệu chết?

### SE-040 [Senior]
Build-versus-buy một capability quan trọng nên được đánh giá trên những trục nào ngoài chi phí license?

## 5. Tình huống và năng lực Senior

### SE-041 [Middle → Senior]
Một yêu cầu mơ hồ nhưng deadline cố định được giao cho team. Bạn chia nhỏ, đưa giả định và quản lý rủi ro kỹ thuật ra sao?

### SE-042 [Senior]
Trong incident, hai kỹ sư tranh luận hai nguyên nhân khác nhau. Tech lead nên tổ chức điều tra và ra quyết định thế nào?

### SE-043 [Senior]
Bạn mentoring một Middle engineer thường đưa PR rất lớn và khó review như thế nào mà vẫn giữ ownership cho họ?

### SE-044 [Senior]
Một shared library nội bộ đã được 30 service dùng nhưng cần breaking change. Hãy lập kế hoạch migration có đo lường và đường lui.

### SE-045 [Senior · Case study]
Một monolith 8 năm tuổi deploy mất 90 phút, test flaky, ownership mơ hồ và product muốn “chuyển sang microservices trong 6 tháng”. Bạn sẽ đánh giá, ưu tiên và đề xuất roadmap nào?

## 6. Câu hỏi kinh điển bổ sung — Basic đến Senior

### SE-046 [Basic · ⭐ Rất thường gặp]
Bốn tính chất cốt lõi của OOP—encapsulation, abstraction, inheritance và polymorphism—là gì? Cho một ví dụ thực tế và một cách lạm dụng mỗi tính chất.

### SE-047 [Basic · ⭐ Rất thường gặp]
Abstraction và encapsulation khác nhau thế nào? Một API có thể encapsulate tốt nhưng abstraction kém không?

### SE-048 [Basic · ⭐ Rất thường gặp]
DRY, KISS và YAGNI hướng đến điều gì? Khi các nguyên tắc này xung đột, bạn ưu tiên dựa trên tín hiệu nào?

### SE-049 [Basic · ⭐ Rất thường gặp]
Refactoring khác rewrite và sửa bug thế nào? Điều kiện nào giúp refactor giữ nguyên observable behavior?

### SE-050 [Basic · ⭐ Rất thường gặp]
Immutability đem lại lợi ích gì cho reasoning, concurrency và caching? Chi phí của immutable object là gì?

### SE-051 [Basic · ⭐ Rất thường gặp]
Vì sao không nên dùng cùng một class cho API DTO, domain model và persistence entity trong mọi trường hợp?

### SE-052 [Basic · ⭐ Rất thường gặp]
Unit test, integration test và end-to-end test khác nhau về boundary, tốc độ, độ tin cậy và loại lỗi phát hiện được thế nào?

### SE-053 [Middle · ⭐ Rất thường gặp]
Singleton pattern giải quyết điều gì và thường gây vấn đề nào về global state, lifecycle, concurrency và testing?

### SE-054 [Middle · Thường gặp]
Law of Demeter và nguyên tắc “Tell, Don’t Ask” muốn giảm coupling ra sao? Khi áp dụng máy móc có thể làm API tệ hơn thế nào?

### SE-055 [Middle · ⭐ Rất thường gặp]
Validation nên đặt ở client, API boundary, application, domain và database như thế nào? Phân biệt format validation với business invariant.

### SE-056 [Middle · ⭐ Rất thường gặp]
Chu trình Red–Green–Refactor của TDD là gì? Khi nào test-first đem lại giá trị thấp hoặc làm thiết kế bị bó buộc?

### SE-057 [Middle · Thường gặp]
Circular dependency xuất hiện ở class/module/service ra sao? Bạn phát hiện và phá vòng phụ thuộc bằng kỹ thuật nào?

### SE-058 [Senior · ⭐ Rất thường gặp]
Phân biệt backward compatibility và forward compatibility đối với API, event và stored data. Producer/consumer nên rollout theo thứ tự nào?

### SE-059 [Senior · Thường gặp]
Conway’s Law ảnh hưởng service boundary, API và ownership ra sao? Team topology nên thay đổi trước hay sau kiến trúc?

### SE-060 [Senior · Thường gặp]
Evolutionary Architecture và architecture fitness function là gì? Hãy nêu các kiểm tra tự động để ngăn kiến trúc suy thoái.
