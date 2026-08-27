# Lesson 25 — LLM training, inference và decoding

## Mục tiêu

Bạn sẽ hiểu pretraining next-token, tokenizer/model artifacts, instruction tuning, logits/probability, autoregressive inference, temperature, top-k/top-p, context window, KV cache và quantization ở mức hệ thống.

## Bản chất và cách hoạt động

Trong pretraining, model nhận prefix và dự đoán token tiếp theo. Cross-entropy phạt xác suất thấp cho token thật. Instruction tuning thay đổi distribution bằng các cặp instruction–response; nó không biến model thành database sự thật.

Inference chạy autoregressive: tạo logits, áp policy decoding, chọn token, nối vào context rồi lặp. Temperature thấp làm distribution sắc hơn; top-k/top-p giới hạn candidate. Greedy ổn định nhưng không luôn tốt nhất. KV cache tái sử dụng attention key/value của prefix, giảm phép tính lặp nhưng dùng bộ nhớ.

Demo dùng bigram language model để quan sát toàn bộ train/decode, không nhằm thay thế Transformer.

## Khi dùng

- Chọn decoding cho extraction, chat, creative writing hoặc code.
- Ước lượng latency/memory và debug output lặp.
- Quyết định fine-tune, RAG hoặc prompt.

## Khi không dùng

- Không tăng temperature để “sửa” thiếu kiến thức.
- Không dùng sampling cho field bắt buộc deterministic nếu constrained output phù hợp hơn.
- Không đánh giá model chỉ bằng một prompt đẹp.

## Ví dụ thực tế

Một autocomplete hỗ trợ học từ các câu chào. Greedy chọn transition phổ biến nhất; sampling có seed tạo biến thể nhưng vẫn chỉ dựa trên distribution đã học.

## Demo

~~~powershell
python .\Lessions\25-llm-training-inference-decoding\src\demo.py
~~~

## Bài tập

1. Cài top-p sampling.
2. Thêm trigram context và so perplexity.
3. Thêm repetition penalty.
4. Đo số lần lookup tiết kiệm được khi cache prefix.

## Checklist

- [ ] Tokenizer và model version khớp nhau.
- [ ] Decoding config được version hóa.
- [ ] Có max token và stop condition.
- [ ] Đo quality, TTFT, throughput và memory.
- [ ] Tách lỗi kiến thức khỏi lỗi decoding.

## Bài trước và bài sau

- Bài trước: Lesson 24 — attention và Transformers.
- Bài sau: Lesson 26 — prompting, context và structured output.
