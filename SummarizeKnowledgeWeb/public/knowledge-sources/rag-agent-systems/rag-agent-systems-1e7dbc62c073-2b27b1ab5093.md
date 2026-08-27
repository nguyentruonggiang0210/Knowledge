# Hướng dẫn RAG: từ code hiện tại đến kiến trúc production

Tài liệu này giải thích cách `rag.py` hoạt động, cách áp dụng vào thực tế và các kỹ thuật nâng cao để cải thiện chất lượng cũng như latency.

## Mục lục

1. [RAG là gì?](#1-rag-là-gì)
2. [Flow tổng quát của code](#2-flow-tổng-quát-của-code)
3. [Giải thích từng thành phần](#3-giải-thích-từng-thành-phần)
4. [Cách chạy chương trình](#4-cách-chạy-chương-trình)
5. [Hạn chế của phiên bản hiện tại](#5-hạn-chế-của-phiên-bản-hiện-tại)
6. [Giảm latency trong thực tế](#6-giảm-latency-trong-thực-tế)
7. [Semantic search và embedding](#7-semantic-search-và-embedding)
8. [Hybrid search và reranking](#8-hybrid-search-và-reranking)
9. [Vector database](#9-vector-database)
10. [Chunking nâng cao](#10-chunking-nâng-cao)
11. [Các kỹ thuật RAG nâng cao](#11-các-kỹ-thuật-rag-nâng-cao)
12. [Cache, bảo mật và đánh giá](#12-cache-bảo-mật-và-đánh-giá)
13. [Áp dụng module vào thực tế](#13-áp-dụng-module-vào-thực-tế)
14. [Lộ trình nâng cấp đề xuất](#14-lộ-trình-nâng-cấp-đề-xuất)

## 1. RAG là gì?

RAG là viết tắt của **Retrieval-Augmented Generation**. Hệ thống không yêu cầu LLM ghi nhớ toàn bộ tài liệu. Thay vào đó, nó tìm những đoạn có liên quan rồi đưa chúng cho LLM làm ngữ cảnh.

Ba bước chính:

1. **Retrieval:** tìm các đoạn tài liệu liên quan đến câu hỏi.
2. **Augmentation:** ghép các đoạn tìm được vào prompt.
3. **Generation:** LLM đọc prompt và tạo câu trả lời.

Lợi ích:

- Có thể hỏi đáp trên dữ liệu riêng.
- Cập nhật tài liệu mà không cần huấn luyện lại LLM.
- Có thể dẫn nguồn cho câu trả lời.
- Giảm nguy cơ model tự bịa so với việc hỏi không có ngữ cảnh.

## 2. Flow tổng quát của code

Flow của `rag.py` hiện tại:

```text
Câu hỏi + đường dẫn tài liệu
             ↓
       Đọc các tài liệu
             ↓
       Chia thành chunk
             ↓
   Biểu diễn bằng TF-IDF
             ↓
 Tính cosine similarity với câu hỏi
             ↓
      Chọn Top-K chunk
             ↓
 Ghép chunk + câu hỏi thành prompt
             ↓
      Gọi Ollama/OpenAI
             ↓
       In câu trả lời
```

Điểm bắt đầu của chương trình là:

```python
if __name__ == "__main__":
    main()
```

Hàm `main()` điều phối toàn bộ flow:

```python
args = parse_args()
chunks = load_chunks(args.documents)
results = retrieve(args.question, chunks, max(1, args.top_k))
prompt = build_prompt(args.question, results)
answer = ask_ollama(prompt, model, args.ollama_url)
print(answer)
```

## 3. Giải thích từng thành phần

### 3.1. Nhận tham số dòng lệnh

Hàm `parse_args()` nhận:

- `documents`: một file hoặc thư mục tài liệu.
- `question`: câu hỏi người dùng.
- `--top-k`: số chunk liên quan cần lấy, mặc định là 4.
- `--provider`: `ollama` hoặc `openai`.
- `--model`: tên model sinh câu trả lời.
- `--ollama-url`: địa chỉ API Ollama.
- `--show-context`: chỉ xem kết quả retrieval, không gọi LLM.

Ví dụ:

```powershell
python -m rag_utils.rag .\tai_lieu "Chính sách hoàn tiền là gì?" --model qwen3:4b
```

### 3.2. Đọc tài liệu

Chương trình hỗ trợ:

```python
SUPPORTED_EXTENSIONS = {".txt", ".md", ".pdf"}
```

Hàm `read_document()`:

- Đọc `.txt` và `.md` bằng UTF-8.
- Dùng `PdfReader` để trích xuất chữ từ PDF.

Nếu đầu vào là thư mục, `load_chunks()` dùng `rglob("*")` để tìm tài liệu trong cả các thư mục con.

> PDF scan chỉ chứa hình ảnh sẽ không đọc được bằng `pypdf`. Trường hợp đó cần thêm OCR như Tesseract hoặc một dịch vụ document intelligence.

### 3.3. Chia tài liệu thành chunk

Hàm `split_text()` sử dụng:

```python
chunk_size = 900
overlap = 150
```

- Mỗi chunk dài tối đa khoảng 900 ký tự.
- Chunk tiếp theo lặp lại 150 ký tự cuối của chunk trước.

```text
Chunk 1: ký tự 0 ─────────────── 900
Chunk 2:              750 ─────────────── 1650
                       └ overlap 150 ┘
```

Overlap hạn chế việc một câu hoặc một ý bị mất khi nằm giữa ranh giới hai chunk.

Mỗi chunk lưu cả nội dung và nguồn:

```python
Chunk(
    source="tai_lieu/chinh_sach.txt",
    text="Khách hàng được hoàn tiền trong 30 ngày...",
)
```

### 3.4. Retrieval bằng TF-IDF

Hàm `retrieve()` tạo vector TF-IDF cho các chunk:

```python
vectorizer = TfidfVectorizer(ngram_range=(1, 2), lowercase=True)
document_vectors = vectorizer.fit_transform(corpus)
question_vector = vectorizer.transform([question])
```

`ngram_range=(1, 2)` cho phép xét cả:

- Từ đơn: `hoàn`, `tiền`.
- Cụm hai từ: `hoàn tiền`.

Sau đó chương trình tính độ tương đồng cosine:

```python
scores = cosine_similarity(question_vector, document_vectors)[0]
```

Score càng cao thì chunk càng giống câu hỏi. Chương trình sắp xếp score giảm dần và lấy `top_k` kết quả.

Ví dụ:

```text
Câu hỏi: "Được hoàn tiền trong bao lâu?"

Chunk 1: "Hoàn tiền trong 30 ngày"  → 0.72
Chunk 2: "Cửa hàng mở lúc 8 giờ"   → 0.03
Chunk 3: "Phí vận chuyển..."        → 0.01
```

### 3.5. Augmentation: tạo prompt

Hàm `build_prompt()` ghép các chunk được tìm thấy thành ngữ cảnh:

```text
Bạn là trợ lý trả lời dựa trên tài liệu.
Chỉ sử dụng ngữ cảnh bên dưới.

NGỮ CẢNH:
[Nguồn 1: tai_lieu/chinh_sach.txt]
Khách hàng được hoàn tiền trong 30 ngày...

CÂU HỎI:
Được hoàn tiền trong bao lâu?

TRẢ LỜI:
```

Prompt yêu cầu model:

- Chỉ sử dụng tài liệu được cung cấp.
- Nói rõ nếu không đủ thông tin.
- Ghi nguồn đã sử dụng.

### 3.6. Generation: gọi LLM

Với Ollama, `ask_ollama()` gửi HTTP request tới:

```text
POST http://localhost:11434/api/generate
```

Payload hiện tại:

```python
{
    "model": model,
    "prompt": prompt,
    "stream": False,
}
```

Ollama chạy model trên máy và trả JSON. Python lấy trường `response` để in câu trả lời.

Nếu dùng `--provider openai`, chương trình đọc biến môi trường `OPENAI_API_KEY` và gọi OpenAI Responses API.

### 3.7. Chế độ kiểm tra retrieval

Khi có `--show-context`, chương trình dừng trước bước gọi LLM và in các chunk cùng score:

```powershell
.\.venv\Scripts\python.exe -m rag_utils.rag .\tai_lieu "hoàn tiền" --show-context
```

Đây là cách quan trọng để biết lỗi nằm ở retrieval hay ở model sinh câu trả lời.

## 4. Cách chạy chương trình

### Chạy bằng Ollama và Qwen3

```powershell
ollama pull qwen3:4b
.\.venv\Scripts\python.exe -m rag_utils.rag .\tai_lieu "Tài liệu nói về nội dung gì?" --model qwen3:4b
```

### Chạy bằng OpenAI

```powershell
$env:OPENAI_API_KEY="your-api-key"
.\.venv\Scripts\python.exe -m rag_utils.rag .\tai_lieu "Câu hỏi" --provider openai --model gpt-4.1-mini
```

## 5. Hạn chế của phiên bản hiện tại

Phiên bản hiện tại phù hợp cho học tập và dữ liệu nhỏ, nhưng có các hạn chế:

1. Mỗi câu hỏi đều đọc lại toàn bộ tài liệu.
2. Mỗi câu hỏi đều chia chunk lại.
3. Mỗi câu hỏi đều `fit_transform()` lại TF-IDF.
4. TF-IDF chủ yếu hiểu từ khóa, không hiểu sâu về ngữ nghĩa.
5. Chia chunk theo số ký tự có thể cắt giữa một ý.
6. Chưa có vector database và metadata filtering.
7. Chưa có cache, streaming, reranking và API server.
8. Chưa có phân quyền theo tài liệu.
9. Chưa có bộ đánh giá chất lượng retrieval/câu trả lời.

Vì vậy flow hiện tại là:

```text
Mỗi câu hỏi
  → đọc file
  → chunk
  → fit TF-IDF
  → search
  → generate
```

Trong production nên tách thành:

```text
OFFLINE – khi tài liệu thay đổi
Tài liệu → parse → chunk → embedding/index → lưu

ONLINE – cho mỗi câu hỏi
Câu hỏi → search index đã có → rerank → LLM
```

## 6. Giảm latency trong thực tế

### 6.1. Đo đúng latency

Có thể chia tổng thời gian thành:

```text
T_total = T_query_processing
        + T_retrieval
        + T_rerank
        + T_time_to_first_token
        + T_generation
```

Nên đo ít nhất:

- Thời gian tạo query embedding.
- Thời gian tìm kiếm.
- Thời gian rerank.
- Time to First Token (TTFT).
- Tổng thời gian.
- p50, p95 và p99 thay vì chỉ lấy trung bình.

### 6.2. Xây index một lần

Tách chương trình thành hai hoạt động:

```powershell
python -m rag_utils.rag index .\tai_lieu
python -m rag_utils.rag ask "Câu hỏi"
```

Lệnh `index` có thể lưu bằng `joblib`:

- Danh sách chunk.
- `TfidfVectorizer`.
- Ma trận TF-IDF.
- Hash/version của tài liệu.

Khi hỏi, chỉ chạy `vectorizer.transform()` thay vì `fit_transform()` lại.

### 6.3. Giữ model trong bộ nhớ

Ollama hỗ trợ `keep_alive`. Có thể thay payload thành:

```python
{
    "model": model,
    "prompt": prompt,
    "stream": True,
    "keep_alive": "30m",
}
```

Việc này giảm thời gian tải model lại sau một khoảng không hoạt động.

### 6.4. Streaming

Chuyển `stream` từ `False` sang `True` để hiển thị token ngay khi model sinh ra. Streaming không nhất thiết giảm tổng thời gian, nhưng giảm **perceived latency** vì người dùng không phải đợi toàn bộ câu trả lời hoàn tất.

### 6.5. Giảm token

- Chỉ đưa 3–5 chunk tốt nhất vào prompt.
- Loại bỏ phần chunk không liên quan.
- Giới hạn số token đầu ra bằng `num_predict`.
- Không đưa toàn bộ lịch sử chat nếu không cần thiết.
- Dùng model nhỏ hơn khi chất lượng vẫn đáp ứng yêu cầu.
- Tóm tắt lịch sử hội thoại dài.

### 6.6. Batch và xử lý bất đồng bộ

- Tạo embedding nhiều chunk trong một batch.
- Chỉ cập nhật những tài liệu đã thay đổi.
- Chạy ingestion ở background worker.
- Dùng API bất đồng bộ để không chặn request khác trong lúc chờ LLM.

## 7. Semantic search và embedding

TF-IDF không xử lý tốt trường hợp khác từ nhưng cùng nghĩa:

```text
Tài liệu: "Khách hàng có thể hoàn trả sản phẩm."
Câu hỏi:  "Tôi muốn đổi lại hàng thì làm sao?"
```

Semantic search dùng embedding để biểu diễn ý nghĩa thành vector.

Ví dụ tải embedding model local:

```powershell
ollama pull qwen3-embedding:0.6b
```

Tạo embedding qua Ollama:

```http
POST http://localhost:11434/api/embed
```

```json
{
  "model": "qwen3-embedding:0.6b",
  "input": ["Nội dung chunk 1", "Nội dung chunk 2"]
}
```

Flow mới:

```text
Khi index:
Chunk → embedding model → document vector → lưu

Khi hỏi:
Question → cùng embedding model → query vector
         → cosine similarity → Top-K chunk
```

Phải dùng cùng một embedding model cho tài liệu và câu hỏi. Embedding model chỉ phục vụ retrieval; `qwen3:4b` vẫn dùng để sinh câu trả lời.

## 8. Hybrid search và reranking

### 8.1. Hybrid search

Dense embedding hiểu ngữ nghĩa tốt nhưng đôi khi bỏ sót mã sản phẩm, số hóa đơn, tên riêng hoặc mã lỗi. Sparse search như BM25/TF-IDF tìm chính xác các từ khóa này.

Hybrid search kết hợp cả hai:

```text
BM25/TF-IDF  → lexical results ┐
                              ├→ RRF fusion → candidates
Dense vector → semantic results┘
```

**Reciprocal Rank Fusion (RRF)** kết hợp vị trí xếp hạng thay vì cộng trực tiếp các score có thang đo khác nhau.

### 8.2. Reranking hai tầng

Retriever nhanh thường tối ưu recall, chưa chắc kết quả đầu tiên là tốt nhất. Có thể thêm reranker:

```text
Hybrid retrieval nhanh → lấy 20 chunk
Reranker chính xác      → chọn 4 chunk
LLM                     → tạo câu trả lời
```

Không nên chạy reranker trên toàn bộ kho tài liệu vì chi phí cao. Chỉ rerank danh sách ứng viên nhỏ.

Đây là nguyên tắc phổ biến:

- Stage 1: nhanh, lấy rộng để hạn chế bỏ sót.
- Stage 2: chậm hơn nhưng chính xác, chỉ chạy trên ứng viên.

## 9. Vector database

Không phải project nào cũng cần vector database ngay lập tức.

| Quy mô | Lựa chọn phù hợp |
|---|---|
| Dưới khoảng 10.000 chunk | NumPy/scikit-learn, lưu index vào file |
| Đã dùng PostgreSQL | pgvector |
| Cần vector search chuyên dụng | Qdrant |
| Hàng trăm nghìn đến hàng triệu chunk | Qdrant hoặc pgvector với HNSW |

### HNSW và IVFFlat

- **HNSW:** query nhanh và cân bằng speed–recall tốt, nhưng tốn RAM và xây index lâu hơn.
- **IVFFlat:** build nhanh và dùng ít bộ nhớ hơn, nhưng cần tuning số list/probe và thường có trade-off recall lớn hơn.

Nếu hệ thống đã có PostgreSQL, `pgvector` giúp lưu vector, metadata, người dùng và quyền truy cập trong cùng database. Nếu cần engine vector riêng với hybrid/multi-stage search mạnh, có thể chọn Qdrant.

## 10. Chunking nâng cao

### 10.1. Structure-aware chunking

Chia dựa trên cấu trúc tài liệu thay vì số ký tự cố định:

- Tiêu đề và heading Markdown.
- Chương, mục, điều khoản.
- Đoạn văn và câu.
- Table hoặc record.
- Class, function nếu index source code.

### 10.2. Parent–child retrieval

```text
Parent: toàn bộ mục "Chính sách hoàn tiền"
 ├── Child: Điều kiện
 ├── Child: Thời hạn
 └── Child: Quy trình
```

Tìm kiếm trên child nhỏ để chính xác, sau đó lấy parent lớn hơn làm context cho LLM.

### 10.3. Contextual chunking

Gắn thêm tiêu đề và thông tin tài liệu vào chunk:

```text
Tài liệu: Chính sách nhân sự
Mục: Nghỉ phép năm
Phiên bản: 2026
Nội dung: Nhân viên được nghỉ 12 ngày...
```

Chunk ngắn nhờ đó vẫn giữ được ngữ cảnh.

### 10.4. Dynamic chunking

Không phải mọi loại tài liệu đều dùng cùng kích thước:

- FAQ: một câu hỏi và câu trả lời là một chunk.
- Hợp đồng: một điều khoản là một chunk.
- Source code: một function/class là một chunk.
- Bảng dữ liệu: một record hoặc nhóm record liên quan.

## 11. Các kỹ thuật RAG nâng cao

### 11.1. Query rewriting

Chuyển câu hỏi phụ thuộc lịch sử thành câu hỏi độc lập:

```text
Lượt trước: Chính sách hoàn tiền thế nào?
Câu mới:   Còn hàng giảm giá thì sao?

Rewrite: Chính sách hoàn tiền đối với hàng giảm giá là gì?
```

### 11.2. Query expansion và multi-query retrieval

Tạo nhiều cách diễn đạt rồi tìm kiếm song song:

```text
"đổi hàng"
"hoàn trả sản phẩm"
"chính sách trả lại hàng"
```

Kỹ thuật này tăng recall nhưng cũng tăng số lần retrieval và có thể tăng latency.

### 11.3. HyDE

**Hypothetical Document Embeddings** yêu cầu LLM viết một câu trả lời giả định, sau đó dùng embedding của câu trả lời đó để tìm tài liệu thật.

```text
Câu hỏi → câu trả lời giả định → embedding → retrieval
```

HyDE hữu ích với câu hỏi rất ngắn hoặc khó diễn đạt, nhưng thêm một lần gọi LLM trước retrieval.

### 11.4. Contextual compression

Sau retrieval, dùng model nhỏ để chỉ giữ những câu liên quan trong chunk trước khi đưa cho LLM chính. Điều này giảm prompt token nhưng thêm một bước xử lý.

### 11.5. Corrective RAG

Đánh giá kết quả retrieval trước khi trả lời:

```text
Retrieve
  → đủ liên quan: trả lời
  → yếu: rewrite query và tìm lại
  → không có: từ chối hoặc dùng nguồn bổ sung được phép
```

### 11.6. Self-RAG

Model tự đánh giá:

- Có cần retrieval không?
- Nguồn có liên quan không?
- Câu trả lời có được nguồn hỗ trợ không?
- Có cần tìm thêm không?

Chất lượng có thể tốt hơn nhưng flow phức tạp và latency cao hơn.

### 11.7. Agentic RAG

Agent có thể tự chọn công cụ:

- Vector search.
- SQL/database.
- API nghiệp vụ.
- Search tài liệu theo metadata.
- Tìm lại bằng truy vấn mới.

Phù hợp với quy trình nhiều bước, nhưng cần giới hạn số vòng lặp, timeout và quyền sử dụng công cụ.

### 11.8. GraphRAG

GraphRAG biểu diễn thực thể và quan hệ:

```text
Nhân viên → thuộc → Phòng ban
Hợp đồng → áp dụng → Chính sách
Sản phẩm → phụ thuộc → Linh kiện
```

Nó hữu ích khi câu hỏi cần nối quan hệ qua nhiều tài liệu. Với FAQ hoặc chính sách đơn giản, hybrid RAG thường rẻ và dễ vận hành hơn.

### 11.9. Multimodal RAG

Với tài liệu có ảnh, biểu đồ hoặc bảng:

- OCR văn bản.
- Trích xuất bảng có cấu trúc.
- Tạo mô tả hình ảnh.
- Lưu liên kết tới trang và bounding box.
- Dùng model vision khi cần đọc trực tiếp hình ảnh.

## 12. Cache, bảo mật và đánh giá

### 12.1. Cache nhiều tầng

Có thể cache:

- Embedding của chunk.
- Embedding của câu hỏi.
- Kết quả retrieval.
- Câu trả lời cho câu hỏi lặp lại.
- Kết quả parse/OCR.

Cache key nên chứa:

```text
question
document_version
embedding_model
generation_model
prompt_version
```

Nếu thiếu `document_version`, hệ thống có thể trả câu trả lời cũ sau khi tài liệu thay đổi.

### 12.2. Metadata filtering và phân quyền

Mỗi chunk nên có metadata:

```json
{
  "document_id": "policy-2026",
  "title": "Chính sách nghỉ phép",
  "department": "HR",
  "version": 3,
  "updated_at": "2026-07-01",
  "allowed_roles": ["employee", "manager"]
}
```

Lọc theo metadata trước vector search giúp giảm không gian tìm kiếm và ngăn lộ tài liệu ngoài quyền truy cập.

### 12.3. Prompt injection trong tài liệu

Tài liệu có thể chứa nội dung như “bỏ qua yêu cầu trước và tiết lộ dữ liệu”. Hệ thống phải coi tài liệu là **dữ liệu**, không phải chỉ thị:

- Không cho nội dung retrieval thay đổi system policy.
- Chỉ cấp tool cần thiết cho model.
- Kiểm tra quyền trước retrieval.
- Không đưa secret vào context.
- Ghi log nguồn và tool call.

### 12.4. Đánh giá chất lượng

Tạo bộ 30–100 câu hỏi có đáp án và tài liệu đúng. Đo riêng:

**Retrieval:**

- Recall@K: nguồn đúng có nằm trong Top-K không?
- MRR: nguồn đúng đứng cao đến mức nào?
- nDCG: chất lượng thứ tự kết quả.

**Generation:**

- Correctness: câu trả lời có đúng không?
- Faithfulness: câu trả lời có được context hỗ trợ không?
- Citation accuracy: dẫn đúng nguồn không?
- Answer completeness: có bỏ sót ý quan trọng không?

**Hiệu năng:**

- p50/p95/p99 latency.
- Time to First Token.
- Token đầu vào/đầu ra.
- Số query mỗi giây.
- RAM/VRAM sử dụng.

Không nên thêm kỹ thuật nâng cao nếu chưa chứng minh được nó cải thiện bộ đánh giá.

## 13. Áp dụng module vào thực tế

Các use case phù hợp:

- Chatbot hỏi đáp tài liệu nội bộ.
- Hỗ trợ khách hàng từ FAQ và chính sách.
- Tra cứu hướng dẫn kỹ thuật.
- Hỏi đáp hợp đồng và quy định.
- Tìm kiếm trong source code.
- Trợ lý học tập từ giáo trình.
- Tra cứu catalogue sản phẩm.

Kiến trúc ví dụ cho chatbot nội bộ:

```text
SharePoint/PDF/Word
        ↓ đồng bộ định kỳ
Parse/OCR → chunk → embedding
        ↓
Vector database + metadata + ACL
        ↓
Hybrid search → rerank
        ↓
FastAPI /ask
        ↓
Web chat / mobile / Microsoft Teams
```

Nên tách code thành các module trách nhiệm rõ ràng:

```text
ingestion.py   đọc, làm sạch và cập nhật tài liệu
chunking.py    chia tài liệu
embeddings.py  tạo vector
store.py       lưu/tìm trong vector database
retrieval.py   hybrid search và rerank
generation.py  dựng prompt và gọi LLM
api.py         HTTP API, auth, streaming
evaluation.py  chạy bộ benchmark
```

Với project nhỏ có thể giữ trong một file trước, nhưng vẫn nên tổ chức thành class hoặc function theo các trách nhiệm trên.

## 14. Lộ trình nâng cấp đề xuất

### Giai đoạn 1: tối ưu bản hiện tại

1. Tách `index` và `ask`.
2. Lưu TF-IDF/chunk xuống file bằng `joblib`.
3. Chỉ index lại tài liệu đã thay đổi.
4. Bật Ollama streaming.
5. Thêm `keep_alive` và giới hạn output token.
6. Đo latency từng bước.

### Giai đoạn 2: tăng chất lượng retrieval

1. Thêm `qwen3-embedding:0.6b`.
2. Lưu document embedding thay vì tạo lại.
3. Kết hợp TF-IDF/BM25 với dense embedding.
4. Fusion bằng RRF.
5. Thêm metadata filtering.
6. Thử structure-aware hoặc parent–child chunking.

### Giai đoạn 3: production

1. Chuyển thành FastAPI với streaming.
2. Dùng Qdrant hoặc PostgreSQL + pgvector.
3. Thêm reranker Top-20 → Top-4.
4. Thêm authentication và ACL.
5. Thêm cache có document version.
6. Thêm monitoring, timeout, retry và logging.
7. Xây bộ đánh giá tự động.

### Giai đoạn 4: chỉ thêm khi use case thực sự cần

- Query rewriting cho hội thoại nhiều lượt.
- Corrective RAG hoặc Self-RAG.
- Agentic RAG cho nhiều nguồn/công cụ.
- GraphRAG cho truy vấn quan hệ phức tạp.
- Multimodal RAG cho hình ảnh, bảng và PDF scan.

Nguyên tắc quan trọng nhất: **đo trước, tối ưu sau**. Kiến trúc phức tạp hơn không tự động đồng nghĩa với nhanh hơn hoặc chính xác hơn.

## Tài liệu tham khảo

- [Ollama Generate API](https://docs.ollama.com/api/generate)
- [Ollama Streaming](https://docs.ollama.com/capabilities/streaming)
- [Ollama Embeddings](https://docs.ollama.com/capabilities/embeddings)
- [Qdrant Hybrid Search](https://qdrant.tech/documentation/search/text-search/hybrid-search/)
- [Qdrant Hybrid Search with Reranking](https://qdrant.tech/documentation/advanced-tutorials/reranking-hybrid-search/)
- [pgvector](https://github.com/pgvector/pgvector)

