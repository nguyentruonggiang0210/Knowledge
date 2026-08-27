# AI Engineer: từ nền tảng đến production

Đây là giáo trình thực hành theo thứ tự phụ thuộc, dành cho người muốn hiểu **AI hoạt động ra sao** và đủ năng lực xây, đánh giá, bảo mật, triển khai hệ thống AI thật. Tên thư mục `Lessions` được giữ đúng theo yêu cầu ban đầu; mỗi lesson có lý thuyết tiếng Việt và một demo chạy offline.

> Không có lộ trình hữu hạn nào có thể bảo đảm “không bỏ sót mọi kiến thức AI”: lĩnh vực thay đổi liên tục và có nhiều nhánh nghiên cứu chuyên sâu. Giáo trình này đặt mục tiêu thực tế hơn: phủ kín năng lực lõi của một AI Engineer hiện đại, chỉ rõ phần chuyên sâu, và dạy cách tự kiểm chứng công nghệ/thuật ngữ mới.

## Bắt đầu trong 5 phút

Yêu cầu duy nhất cho các demo cốt lõi là Python 3.11 trở lên. Không cần API key, GPU hay dịch vụ trả phí.

```powershell
python tools/course.py doctor
python tools/course.py list
python tools/course.py run 05
python tools/course.py smoke
python Quiz/quiz.py --phase foundations --limit 10
```

Mỗi bài học theo chu trình:

1. Đọc `README.md`, tự trả lời câu hỏi “khi nào không nên dùng?”.
2. Chạy `src/demo.py`, đọc từng hàm và thay input.
3. Làm bài tập mà chưa xem gợi ý.
4. Chạy quiz/checkpoint; chỉ qua bài khi đạt ít nhất 80%.
5. Ghi một đoạn learning log: điều đã hiểu, điều còn mơ hồ, bằng chứng demo chạy.

## Lộ trình 8 giai đoạn

| Giai đoạn | Lessons | Năng lực đầu ra |
|---|---:|---|
| 1. Nền móng kỹ thuật | 00–10 | Terminal, Git, Python, kiểm thử, parser, toán, dữ liệu |
| 2. Machine Learning | 11–19 | Validation, mô hình cổ điển, metric, time series, graph ML, causal/fairness |
| 3. Deep Learning và LLM | 20–27 | Backprop, training loop, CV, NLP, Transformer, inference, structured output |
| 4. Retrieval và Agents | 28–35 | RAG, tool calling, workflow, harness, memory, multi-agent, MCP/skills |
| 5. Độ tin cậy | 36–38 | Evals, tracing, latency/cost, safety, security, red-team |
| 6. Điều chỉnh và multimodal | 39–42 | LoRA/quantization, RL/alignment, synthetic data, vision/audio/diffusion |
| 7. Production AI | 43–46 | Serving, MLOps/LLMOps, distributed systems, privacy/governance/product |
| 8. Coding agents và capstone | 47–50 | So sánh agent, hai hệ thống end-to-end, portfolio và system design |

Danh mục chi tiết và quan hệ tiên quyết nằm trong [COURSE_MAP.md](COURSE_MAP.md). Lịch học theo tuần nằm trong [STUDY_PLAN.md](STUDY_PLAN.md). Nguồn chính thức, ngày kiểm chứng và lưu ý về nội dung thay đổi theo thời gian nằm trong [SOURCES.md](SOURCES.md).

## Nhịp học khuyến nghị

- 12–15 giờ/tuần: khoảng 12–15 tháng.
- 20 giờ/tuần: khoảng 8–10 tháng.
- Đã là software engineer: làm bài kiểm tra đầu vào và có thể rút gọn lessons 01–04, nhưng không bỏ qua 05–11.
- Không chạy theo chứng chỉ. Mỗi giai đoạn cần một artifact: code, test, báo cáo eval, threat model hoặc benchmark.

Ba cổng chất lượng bắt buộc:

- **Đúng:** demo/test pass và giải thích được assumptions.
- **Đáng tin:** có eval, failure cases, giới hạn quyền và quan sát được trace.
- **Vận hành được:** người khác clone, chạy lại và biết rollback khi lỗi.

## Cấu trúc repository

```text
Lessions/<NN-topic>/README.md   # bài học, use case, bài tập, checklist
Lessions/<NN-topic>/src/demo.py # mã nguồn tự chứa, chạy offline
Quiz/                           # quiz theo checkpoint và challenge
course_manifest.json            # curriculum machine-readable
tools/course.py                 # doctor/list/run/smoke
tests/                          # kiểm tra cấu trúc và toàn bộ demo
```

## Quy tắc dùng AI để học AI

Được dùng agent để gợi ý, review và tạo test; không dùng output của agent thay cho việc giải thích. Với mỗi đoạn code do AI sinh, người học phải chỉ ra input/output, invariant, failure mode, complexity và cách kiểm chứng. Đó là khác biệt giữa “biết gọi model” và kỹ sư AI chuyên nghiệp.
