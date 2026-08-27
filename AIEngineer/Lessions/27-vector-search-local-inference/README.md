# Lesson 27 — Vector search, local inference và quantization

## Mục tiêu

Bạn sẽ tự xây exact vector search, hiểu embedding/similarity, đóng gói một classifier local và quantize weight đối xứng sang integer để thấy trade-off memory–sai số.

## Bản chất và cách hoạt động

Vector search gồm embedding query/document vào cùng không gian, chuẩn hóa nếu metric yêu cầu, tính similarity và lấy top-k. Exact search so mọi vector; ANN như HNSW/IVF đổi một phần recall lấy latency và memory tốt hơn.

Local inference cần tokenizer/preprocessing, weights, runtime và config đúng version. Chạy local tăng privacy/control nhưng bạn tự chịu trách nhiệm tài nguyên, patch, license và observability.

Quantization ánh xạ số thực sang tập integer hữu hạn bằng scale. INT8/INT4 giảm memory và bandwidth nhưng gây rounding/clipping error. Per-channel thường chính xác hơn per-tensor nhưng phức tạp hơn. Luôn đo chất lượng thực tế.

## Khi dùng

- Semantic search/RAG và memory retrieval.
- Dữ liệu không thể gửi ra ngoài hoặc cần hoạt động offline.
- Model bị giới hạn RAM/VRAM và latency chủ yếu do bandwidth.

## Khi không dùng

- Không dùng cosine giữa embedding của hai model/version khác nhau.
- Không mặc định quantization không ảnh hưởng chất lượng.
- Không chọn ANN trước khi có baseline exact và recall target.

## Ví dụ thực tế

Ứng dụng hỗ trợ chạy offline nhận query “quên mật khẩu đăng nhập”, phân loại intent bằng weight INT8 và tìm đúng hướng dẫn đăng nhập trong kho vector nhỏ.

## Demo

~~~powershell
python .\Lessions\27-vector-search-local-inference\src\demo.py
~~~

## Bài tập

1. Thêm metadata filter trước top-k.
2. So sánh dot product và cosine khi vector chưa normalize.
3. Quantize theo từng row và đo lỗi.
4. Viết recall@k khi approximate search cố ý bỏ candidate.

## Checklist

- [ ] Embedding model/version được lưu cùng index.
- [ ] Metric khớp cách normalize.
- [ ] Có exact-search baseline.
- [ ] Đo recall, latency, RAM và chất lượng sau quantization.
- [ ] Model/tokenizer license và checksum rõ ràng.

## Bài trước và bài sau

- Bài trước: Lesson 26 — prompting, context và structured output.
- Bài sau: Lesson 28 — RAG fundamentals.
