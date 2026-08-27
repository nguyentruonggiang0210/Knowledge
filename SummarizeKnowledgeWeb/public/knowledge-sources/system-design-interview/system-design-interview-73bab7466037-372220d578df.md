# Bộ câu hỏi phỏng vấn Middle/Senior Backend Engineer

Kho tài liệu này dành cho việc ôn tập và phỏng vấn các vị trí **Middle/Senior C#/.NET và Java/JVM**. Nội dung không chỉ kiểm tra khả năng nhớ khái niệm mà còn tập trung vào cách phân tích trade-off, chẩn đoán production, thiết kế hệ thống và đưa ra quyết định kỹ thuật.

> Tên thư mục `Anwsers` được giữ theo đúng yêu cầu ban đầu. Mỗi câu hỏi có một mã duy nhất để tra cứu đáp án và làm quiz mà không vô tình nhìn thấy lời giải.

Nếu cần bắt đầu từ những câu có xác suất xuất hiện cao nhất, hãy dùng [`classic_checklist.md`](classic_checklist.md). Các section **Câu hỏi kinh điển bổ sung** trong từng ngân hàng đi từ Basic đến Senior và được đánh dấu `⭐`.

## Cấu trúc

| Nhóm | Số câu | Ngân hàng câu hỏi | Đáp án |
|---|---:|---|---|
| C# | 80 | [`c_sharp.md`](c_sharp.md) | [`Anwsers/c_sharp.md`](Anwsers/c_sharp.md) |
| .NET, ASP.NET Core, EF Core | 75 | [`dotnet_aspnet.md`](dotnet_aspnet.md) | [`Anwsers/dotnet_aspnet.md`](Anwsers/dotnet_aspnet.md) |
| Java | 78 | [`java.md`](java.md) | [`Anwsers/java.md`](Anwsers/java.md) |
| JVM, Spring, Hibernate | 75 | [`jvm_spring.md`](jvm_spring.md) | [`Anwsers/jvm_spring.md`](Anwsers/jvm_spring.md) |
| Thuật toán và cấu trúc dữ liệu | 80 | [`algorithms_data_structures.md`](algorithms_data_structures.md) | [`Anwsers/algorithms_data_structures.md`](Anwsers/algorithms_data_structures.md) |
| Database và data architecture | 85 | [`database.md`](database.md) | [`Anwsers/database.md`](Anwsers/database.md) |
| Software engineering và kiến trúc | 60 | [`software_engineering.md`](software_engineering.md) | [`Anwsers/software_engineering.md`](Anwsers/software_engineering.md) |
| System design và distributed systems | 75 | [`system_design.md`](system_design.md) | [`Anwsers/system_design.md`](Anwsers/system_design.md) |
| Infrastructure và cloud | 60 | [`infra_cloud.md`](infra_cloud.md) | [`Anwsers/infra_cloud.md`](Anwsers/infra_cloud.md) |
| DevOps và observability | 65 | [`devops_observability.md`](devops_observability.md) | [`Anwsers/devops_observability.md`](Anwsers/devops_observability.md) |
| Application security | 65 | [`security.md`](security.md) | [`Anwsers/security.md`](Anwsers/security.md) |
| Behavioral và leadership | 36 | [`behavioral_leadership.md`](behavioral_leadership.md) | [`Anwsers/behavioral_leadership.md`](Anwsers/behavioral_leadership.md) |
| **Tổng** | **834** | | **834 đáp án** |

Các bài kiểm tra nằm trong [`Quiz/`](Quiz/README.md); đáp án và rubric của quiz nằm trong [`Anwsers/quiz_answer_key.md`](Anwsers/quiz_answer_key.md). Năm bộ đề có thêm **274 câu/case**, gồm một mock interview 72 câu kinh điển cân bằng 12 miền.

## Cách sử dụng

1. Chọn một chủ đề và trả lời thành tiếng trong 2–5 phút/câu mà chưa mở `Anwsers`.
2. Với câu tình huống, luôn làm rõ requirement, giả định, SLO và ràng buộc trước khi đề xuất giải pháp.
3. Đối chiếu đáp án theo mã câu hỏi. Ghi lại phần còn thiếu bằng chính ngôn ngữ của bạn, không học thuộc từng câu chữ.
4. Sau mỗi 2–3 chủ đề, làm một quiz có giới hạn thời gian. Chấm theo rubric thay vì chỉ đếm đúng/sai.
5. Lặp lại câu sai theo nhịp 1 ngày, 3 ngày, 7 ngày và 21 ngày.

## Kỳ vọng theo cấp độ

| Năng lực | Middle | Senior |
|---|---|---|
| Kiến thức | Giải thích đúng cơ chế cốt lõi và dùng API an toàn | Hiểu cơ chế bên dưới, failure mode và giới hạn |
| Thực thi | Viết giải pháp rõ ràng, test được, vận hành được | Chọn giải pháp theo constraint; dự phòng rollback và migration |
| Debug | Dùng log/metric/trace và profiler có phương pháp | Khoanh vùng xuyên service, phân biệt nguyên nhân với triệu chứng |
| Thiết kế | Thiết kế component vừa phải và data model phù hợp | Thiết kế end-to-end theo SLO, scale, consistency, cost, security |
| Giao tiếp | Trình bày giả định và giải thích code | Dẫn dắt trade-off, rủi ro, lộ trình và alignment giữa các nhóm |

## Khung trả lời một câu senior

- **Làm rõ:** workload, quy mô, SLO, consistency, security/compliance và ngân sách.
- **Kết luận trước:** chọn phương án nào trong bối cảnh đã nêu.
- **Cơ chế:** giải thích vì sao nó hoạt động, không chỉ nêu tên công nghệ.
- **Trade-off:** ít nhất một lợi ích, một chi phí và một phương án thay thế.
- **Failure mode:** điều gì hỏng, phát hiện bằng tín hiệu nào và phục hồi ra sao.
- **Đo lường:** metric, test hoặc experiment nào xác nhận quyết định.

## Quy ước mã câu hỏi

`CS` C#, `NET` .NET, `JAVA` Java, `JVM` JVM/Spring, `ALG` thuật toán, `DB` database, `SE` software engineering, `SD` system design, `INF` infrastructure/cloud, `DO` DevOps/observability, `SEC` security, `BEH` behavioral/leadership.

Nhãn `[Middle]`, `[Senior]` biểu thị độ sâu tối thiểu; câu `[Middle → Senior]` phù hợp để đào sâu bằng follow-up.
