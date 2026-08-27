Kho kiến thức này lấy giáo trình 51 bài trong `AIEngineer` làm trục chính. Các ý trùng được gom theo năng lực cần đạt, còn demo, quiz và source chuyên biệt được giữ như bằng chứng thực hành thay vì biến thành những bài lặp lại.

## Bản đồ năng lực AI Engineer

Một hệ thống AI đáng tin không bắt đầu từ việc gọi model. Nó bắt đầu từ phần mềm có thể tái lập, dữ liệu có chất lượng và cách đo đúng. Lộ trình nguồn đi theo chuỗi phụ thuộc sau:

| Chặng | Kiến thức cốt lõi | Năng lực đầu ra |
|---|---|---|
| Nền tảng | CLI, Git, Python, test, thuật toán, parser, toán, SQL | Viết chương trình và pipeline có thể kiểm chứng |
| Machine Learning | validation, leakage, regression, classification, ensemble | Huấn luyện và so sánh mô hình đúng phương pháp |
| Deep Learning & LLM | backprop, PyTorch, CNN, NLP, Transformer, decoding | Hiểu cách model học và suy luận |
| Điều chỉnh model | LoRA, quantization, RL, synthetic data, multimodal | Chọn cách thích nghi model theo dữ liệu và tài nguyên |
| Production AI | serving, eval, observability, MLOps, bảo mật, governance | Vận hành, giám sát và rollback hệ thống thật |

Các bài RAG và agent được trình bày sâu hơn trong chủ đề **RAG & Agent Systems**, nhưng vẫn phụ thuộc vào vector, parser, API, metric và software engineering ở đây.

## Nền móng toán, phần mềm và dữ liệu

- **Đại số tuyến tính** giải thích vector, matrix, dot product, cosine similarity và không gian embedding.
- **Giải tích và tối ưu** nối chain rule, gradient, learning rate với quá trình cập nhật tham số.
- **Xác suất và thống kê** giúp phân biệt cải thiện thật với nhiễu, thiết kế thí nghiệm và diễn giải độ bất định.
- **Cấu trúc dữ liệu và độ phức tạp** buộc ta cân bằng latency, memory và khả năng scale.
- **Parser, AST và schema** biến input không tin cậy thành cấu trúc có thể validate; đây cũng là nền của structured output và coding agent.
- **SQL, ETL, lineage và data quality** bảo đảm model học từ dữ liệu có phiên bản, nguồn gốc và quy tắc quarantine rõ ràng.

Feature engineering phải dùng cùng logic ở train và serving. Nếu hai phía biến đổi dữ liệu khác nhau, metric offline tốt vẫn có thể thất bại vì **train–serving skew**.

## Workflow Machine Learning không rò rỉ dữ liệu

Một workflow tối thiểu nên đi theo thứ tự:

```text
Framing → baseline → split dữ liệu → pipeline biến đổi
        → train → validation → error analysis → test cuối
        → đóng gói artifact + metadata + metric
```

Những nguyên tắc quan trọng:

1. Chốt đơn vị dự đoán, thời điểm dự đoán và chi phí sai trước khi chọn model.
2. Fit scaler, encoder hoặc feature selector chỉ trên tập train.
3. Dùng temporal split cho dữ liệu thời gian; không trộn tương lai vào quá khứ.
4. Giữ test set như phép đo cuối, không dùng nó để chỉnh hyperparameter.
5. Lưu seed, phiên bản dữ liệu, code, tham số và artifact để tái lập kết quả.

Accuracy không đủ cho dữ liệu mất cân bằng. Cần xem precision, recall, calibration, threshold và cost matrix theo tác động nghiệp vụ.

## Họ mô hình và cách chọn

| Nhóm | Phù hợp khi | Điểm cần cảnh giác |
|---|---|---|
| Regression | Dự đoán đại lượng liên tục, cần baseline dễ giải thích | residual có cấu trúc, outlier, regularization |
| Classification | Quyết định theo xác suất hoặc ngưỡng | imbalance, calibration, false-positive/false-negative cost |
| Tree & ensemble | Dữ liệu tabular, quan hệ phi tuyến | overfit, leakage qua feature, diễn giải importance sai |
| Clustering/PCA/anomaly | Thiếu nhãn hoặc cần khám phá cấu trúc | metric nội tại không thay thế kiểm chứng nghiệp vụ |
| Time series/ranking/recommender | Thứ tự thời gian hoặc thứ hạng quan trọng | temporal leakage, feedback loop, cold start |
| Graph ML/GNN | Quan hệ giữa thực thể mang thông tin | sampling, message-passing depth, đánh giá split theo graph |

Explainability chỉ cho biết model dựa vào tín hiệu nào; nó không tự chứng minh quan hệ nhân quả hay tính công bằng. Vì vậy phải đo theo subgroup, xem counterfactual và ghi rõ giới hạn của dữ liệu.

## Deep Learning, NLP và Transformer

Neural network là một computational graph gồm phép biến đổi khả vi. Forward pass tạo dự đoán; loss đo sai lệch; backprop truyền gradient ngược; optimizer cập nhật tham số. Gradient check, shape check và tách chế độ `train/eval` giúp phát hiện nhiều lỗi âm thầm.

Các nhánh chính được hợp nhất như sau:

- **Computer Vision:** convolution, augmentation, transfer learning, detection và segmentation.
- **NLP:** Unicode, tokenization/BPE, TF-IDF, embedding, sequence mask.
- **Transformer:** query/key/value, attention mask, multi-head attention, positional information, residual path và kiến trúc encoder/decoder.
- **LLM inference:** sampling, temperature/top-p, batching, KV cache, streaming và nguyên nhân hallucination.

Một model lớn hơn không tự sửa được input sai, metric sai hoặc pipeline không quan sát được.

## Điều chỉnh model và dữ liệu

Chọn kỹ thuật dựa trên loại thiếu hụt:

- Kiến thức thay đổi hoặc cần dẫn nguồn: ưu tiên retrieval thay vì fine-tune.
- Hành vi/format chuyên biệt có dữ liệu tốt: cân nhắc SFT hoặc PEFT/LoRA.
- Thiếu VRAM: quantization hoặc QLoRA, nhưng phải benchmark chất lượng và latency.
- Cần tối ưu preference: RLHF/DPO có thể phù hợp, đồng thời phải kiểm soát reward hacking.
- Thiếu dữ liệu: synthetic data và teacher–student distillation chỉ hữu ích khi có lọc, dedup và eval độc lập.
- Nhiều modality: OCR/layout, vision, audio và diffusion cần metric riêng; không thể dùng một điểm số văn bản cho mọi đầu ra.

Fine-tuning, RAG và prompting là ba đòn bẩy khác nhau, không phải ba phiên bản mạnh dần của cùng một giải pháp.

## Đánh giá, phục vụ và vòng đời production

Production AI cần ba lớp kiểm chứng:

- **Đúng:** unit/property/golden eval, benchmark và failure set có chủ đích.
- **Đáng tin:** trace/span, error taxonomy, red-team, least privilege và human approval cho hành động rủi ro.
- **Vận hành được:** SLI/SLO, p50/p95, TTFT, token/cost, canary, drift detection, rollback và incident runbook.

Serving phải quản lý queue, batching, cache, backpressure, overload và graceful shutdown. MLOps/LLMOps nối data lineage, model registry, CI eval và deployment; governance bổ sung PII, retention, risk register, system card và trách nhiệm của con người.

## Distributed AI và coding-agent harness

Khi một model không còn vừa một device, phải chọn đúng trục song song: data parallel nhân model và chia batch; tensor/model parallel chia phép tính hoặc layer; pipeline parallel chia stage và micro-batch. Collective communication, topology GPU/network, mixed precision, checkpoint/shard, straggler và khả năng resume thường quyết định throughput nhiều hơn FLOPS lý thuyết. Scale chỉ có ý nghĩa khi đo utilization, tokens/second, time-to-train, failure recovery và cost; distributed setup nhỏ sai cấu hình có thể chậm hơn một GPU.

Các lesson coding agent tách **model** khỏi **harness**. So sánh agent theo task fit, context/tool support, sandbox/permission, edit precision, test/eval, latency/cost và khả năng audit—không chỉ theo benchmark tổng hợp. Một harness tối thiểu cần:

```text
goal → inspect workspace → plan/change → diff → test/evidence
     → repair có giới hạn → human gate/commit-ready result
```

Harness phải giới hạn filesystem/network/command, chống prompt injection từ repository, giữ checkpoint và phát hiện loop. Coding agent mạnh vẫn cần test oracle, review cho thay đổi rủi ro và provenance về file/lệnh đã dùng. Lesson 47 cung cấp khung so sánh; lesson 49 và capstone biến khung đó thành runtime có state, tool policy, verifier và tiêu chí dừng.

## Cách học bằng source và demo

Mỗi lesson trong `AIEngineer/Lessions` có lý thuyết và một `src/demo.py` chạy độc lập. Có thể dùng chu trình:

```powershell
cd AIEngineer
python tools/course.py doctor
python tools/course.py list
python tools/course.py run 05
python tools/course.py smoke
python Quiz/quiz.py --phase foundations --limit 10
```

Sau mỗi bài, người học nên tự trả lời: input/output là gì, assumption nào đang đúng, failure mode nào chưa được test, complexity ra sao và bằng chứng nào cho thấy demo thực sự hoạt động.

## Hợp nhất nguồn và những giới hạn hiện tại

- `AIEngineer` là nguồn canonical: 51 README, 51 demo, manifest dependency, kế hoạch 52 tuần, 60 quiz và 6 checkpoint.
- Các khái niệm xuất hiện ở nhiều lesson như parser, metric, security hoặc observability được liên kết theo prerequisite, không nhân thành topic mới.
- `MLDotNet` **chưa phải bài ML.NET hoàn chỉnh**: `Program.cs` chỉ in `Hello, World!`; `MLNet.mbconfig` mới mô tả ý định image classification trên local GPU với validation split 20%, chưa có dữ liệu hay pipeline training để học từ code.
- Thư mục `Python` đang **trống hoàn toàn**, vì vậy không có nội dung riêng để tổng hợp. Kiến thức Python được lấy từ các lesson 02–03 của `AIEngineer`.
- Các demo là tài liệu học tập nhỏ và offline; muốn dùng production vẫn cần dependency thật, dữ liệu thật, benchmark tải, security review và kiểm thử tích hợp.

Checklist tự đánh giá:

- [ ] Giải thích được vì sao split sai gây leakage.
- [ ] Chọn metric theo cost của lỗi, không theo thói quen.
- [ ] Mô tả được forward, loss, backprop và optimizer.
- [ ] Phân biệt prompting, RAG và fine-tuning.
- [ ] Thiết kế được eval, observability và rollback trước khi release.
