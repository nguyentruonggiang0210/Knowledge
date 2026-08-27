# Lesson 28 — Retrieval-Augmented Generation fundamentals

## Mục tiêu

Bạn sẽ xây pipeline RAG tối thiểu gồm ingest, chunk, embed, index, retrieve, context assembly, câu trả lời có citation và no-answer khi không đủ bằng chứng.

## Bản chất và cách hoạt động

RAG không “nạp tài liệu vào model”. Nó tìm đoạn liên quan ở thời điểm query rồi đặt chúng vào context. Pipeline có ba vùng lỗi:

1. Ingestion: parser/chunk/metadata làm mất thông tin.
2. Retrieval: query không lấy được chunk đúng.
3. Generation: đã có context đúng nhưng câu trả lời không grounded.

Chunk quá nhỏ mất ngữ cảnh; quá lớn làm loãng retrieval và tốn token. Citation phải trỏ tới source/chunk thật. No-answer là hành vi đúng khi evidence không đủ.

## Khi dùng

- Knowledge thay đổi, cần nguồn hoặc thuộc tài liệu riêng.
- Có thể tìm đoạn evidence độc lập.
- Fine-tuning không phù hợp để lưu fact thường xuyên đổi.

## Khi không dùng

- Không dùng RAG cho dữ liệu cần truy vấn tính toán chính xác nếu SQL/tool phù hợp hơn.
- Không hứa RAG loại bỏ hallucination.
- Không đưa toàn bộ kho tài liệu vào context.

## Ví dụ thực tế

Nhân viên hỏi số ngày nghỉ phép. Retriever lấy đúng đoạn HR policy và câu trả lời trích dẫn chunk đó. Câu hỏi về chính sách không tồn tại phải trả “không đủ thông tin”.

## Demo

~~~powershell
python .\Lessions\28-rag-fundamentals\src\demo.py
~~~

## Bài tập

1. Thêm overlap và kiểm tra duplicate context.
2. Lưu metadata version/effective_date.
3. Viết Recall@k trên 10 query có expected chunk.
4. Thêm citation validator và no-answer threshold học từ validation.

## Checklist

- [ ] Source có stable id, version và metadata.
- [ ] Chunking phù hợp loại tài liệu.
- [ ] Đánh giá retrieval tách khỏi answer.
- [ ] Citation ánh xạ được về source thật.
- [ ] Có threshold/no-answer và chống prompt injection từ document.

## Bài trước và bài sau

- Bài trước: Lesson 27 — vector search và local inference.
- Bài sau: Lesson 29 — advanced RAG, document parser và GraphRAG.
