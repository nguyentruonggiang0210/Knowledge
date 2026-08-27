# Lesson 29 — Advanced RAG, document parsers và GraphRAG

## Mục tiêu

Bạn sẽ parse Markdown có cấu trúc, kết hợp lexical BM25 với semantic-like retrieval, fusion bằng Reciprocal Rank Fusion, mở rộng entity theo graph và đánh giá citation.

## Bản chất và cách hoạt động

Document parser phải giữ heading, table, page, source id và metadata; text extraction đúng ký tự nhưng mất cấu trúc vẫn làm retrieval sai. PDF scan cần OCR, table cần parser/layout riêng và mọi bước phải trace được về source.

Hybrid retrieval kết hợp:

- Sparse/BM25: mạnh với exact term, mã lỗi và tên riêng.
- Dense: mạnh với paraphrase nhưng có thể bỏ lỡ token hiếm.
- Reranker: chấm query–candidate kỹ hơn sau retrieval.
- RRF: cộng 1/(k + rank) từ nhiều danh sách mà không cần score cùng thang.

GraphRAG biểu diễn entity/relationship và mở rộng neighborhood trước khi tổng hợp. Nó hữu ích cho câu hỏi multi-hop, không phải mặc định tốt hơn vector RAG.

Citation evaluation cần kiểm tra citation id tồn tại, source có nằm trong retrieved set, evidence có hỗ trợ claim và coverage của các claim.

## Khi dùng

- Kho PDF/HTML/Markdown phức tạp, mã lỗi hoặc bảng.
- Query vừa cần keyword chính xác vừa cần ngữ nghĩa.
- Câu hỏi dependency/multi-hop giữa service, người, sự kiện.

## Khi không dùng

- Không thêm GraphRAG/reranker nếu basic RAG đã đạt mục tiêu.
- Không fusion raw score từ hai retriever khác thang.
- Không coi citation hợp lệ về ID là evidence thực sự hỗ trợ claim.

## Ví dụ thực tế

Runbook ghi Checkout phụ thuộc PaymentAPI. Query dùng cách nói “dịch vụ trả tiền bị ngừng”; dense normalization và BM25 tạo hai ranking, RRF hợp nhất, graph mở rộng từ Checkout tới PaymentAPI/Database.

## Demo

~~~powershell
python .\Lessions\29-advanced-rag-document-parsers-graphrag\src\demo.py
~~~

## Bài tập

1. Parser giữ table row và line/page reference.
2. Tuning BM25 k1/b trên validation set.
3. Thêm cross-encoder giả lập và so với RRF.
4. Đánh giá citation entailment theo từng claim, không chỉ valid ID.

## Checklist

- [ ] Parser fixtures bao phủ heading, table, Unicode và malformed input.
- [ ] Sparse/dense được đánh giá riêng trước fusion.
- [ ] RRF dùng rank, không trộn raw score.
- [ ] Graph có provenance và giới hạn hop.
- [ ] Citation validity, correctness và coverage được đo riêng.

## Bài trước và bài sau

- Bài trước: Lesson 28 — RAG fundamentals.
- Bài sau: Lesson 30 — tool calling, agent loop và workflows.
