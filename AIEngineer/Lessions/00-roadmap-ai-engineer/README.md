# 00 — Bản đồ năng lực AI Engineer

## Mục tiêu

Sau bài này, bạn có thể nhìn nghề AI Engineer như một hệ thống năng lực có quan hệ phụ thuộc, thay vì một danh sách công nghệ rời rạc. Bạn sẽ biết thứ tự hợp lý giữa lập trình, toán, dữ liệu, machine learning, deep learning, LLM, agent, vận hành và an toàn; đồng thời biết kiểm tra một chủ đề đã đủ nền để học hay chưa.

## Bản chất và cách hoạt động

Một AI Engineer biến bài toán kinh doanh thành hệ thống có thể đo lường và vận hành. Công việc thường đi qua sáu lớp:

1. Software engineering: CLI, Git, Python, cấu trúc dữ liệu, test và typing.
2. Toán và dữ liệu: đại số tuyến tính, xác suất, tối ưu, SQL, ETL và chất lượng.
3. Machine learning: baseline, train/validation/test, feature, metric, chống leakage.
4. Deep learning và model nền tảng: tensor, backpropagation, Transformer, embedding.
5. Hệ thống AI: serving, RAG, tool use, agent harness, quan sát và đánh giá.
6. Sản phẩm: chi phí, độ trễ, SLO, phản hồi, bảo mật và governance.

Các lớp tạo thành đồ thị có hướng: cạnh A → B nghĩa là cần hiểu A trước B. Demo dùng DFS để sắp xếp topo và phát hiện chu trình. Tư duy này cũng áp dụng khi thiết kế pipeline ML hoặc DAG dữ liệu.

## Khi nào dùng / không dùng

Dùng roadmap phụ thuộc khi lập kế hoạch học, onboarding, phân rã dự án hoặc tìm lỗ hổng kiến thức. Không coi roadmap là lịch cứng: dự án nhỏ có thể học theo chiều dọc từ dữ liệu đến triển khai rồi quay lại đào sâu. Không dùng số framework đã biết làm thước đo; năng lực phải được chứng minh bằng bài tập và sản phẩm chạy được.

## Ví dụ thực tế

Một nhóm muốn xây trợ lý hỏi đáp tài liệu. Nếu nhảy thẳng vào agent framework mà chưa biết retrieval, evaluation và observability, hệ thống có thể demo đẹp nhưng không đo được hallucination. Mô hình phụ thuộc chỉ ra tiền đề còn thiếu và bài hiện đã được “mở khóa”.

## Chạy demo

~~~powershell
python .\Lessions\00-roadmap-ai-engineer\src\demo.py
~~~

Demo xác minh roadmap không có chu trình, tạo thứ tự hợp lệ và liệt kê bài có thể học tiếp.

## Bài tập

1. Thêm RAG, vector database, prompt injection và model serving vào đồ thị.
2. Cố ý tạo chu trình A → B → A, quan sát lỗi và giải thích vì sao roadmap vô lý.
3. Tạo roadmap cá nhân 12 tuần; mỗi nút phải có một sản phẩm hoặc phép đo đầu ra.

## Checklist

- [ ] Tôi phân biệt AI Engineer với việc chỉ gọi API mô hình.
- [ ] Tôi mô tả được sáu lớp năng lực và quan hệ phụ thuộc.
- [ ] Tôi hiểu sắp xếp topo và phát hiện chu trình ở mức trực giác.
- [ ] Tôi có tiêu chí đầu ra đo được cho từng chặng học.

## Liên kết bài trước / sau

- Bài trước: không có — đây là điểm bắt đầu.
- Bài sau: 01 — Computing, CLI và Git.
