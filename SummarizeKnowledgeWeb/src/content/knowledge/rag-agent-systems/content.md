Chủ đề này hợp nhất phần RAG/agent trong `AIEngineer`, bộ kiến thức kiến trúc Claude và implementation trong `RAG`. Cùng một khái niệm chỉ xuất hiện một lần; các nguồn còn lại được dùng như lớp overview, deep-dive hoặc code tham chiếu.

## Phân biệt workflow, RAG và agent

| Kiến trúc | Quyết định bước tiếp theo | Dữ liệu bên ngoài | Dùng khi |
|---|---|---|---|
| Workflow cố định | Code định sẵn | Tùy chọn | Chuỗi bước ổn định, deterministic, dễ audit |
| RAG | Pipeline retrieval định sẵn | Tài liệu/index | Cần trả lời dựa trên dữ liệu riêng và dẫn nguồn |
| Agent | Model chọn hành động trong giới hạn | Tool, API, RAG, state | Bước tiếp theo phụ thuộc kết quả vừa quan sát |

RAG không mặc nhiên là agent. Một pipeline `retrieve → prompt → generate` vẫn là workflow. Nó trở thành agentic khi model có thể quyết định tìm lại, đổi query, gọi tool khác, hỏi làm rõ hoặc escalation.

## Hai pipeline của một hệ thống RAG

Tách công việc nặng khỏi request trực tuyến là cải tiến quan trọng nhất so với bản RAG học tập ban đầu:

```text
OFFLINE — khi tài liệu thay đổi
PDF/TXT/MD → parse → normalize → chunk → sparse/dense index
           → document hash → atomic persistent artifact

ONLINE — cho mỗi câu hỏi
question → filter → sparse + dense retrieval → RRF
         → threshold/rerank/MMR → context budget
         → cache hoặc LLM → citation + streaming response
```

`rag.py` đọc, chunk và fit TF-IDF lại mỗi câu hỏi nên dễ hiểu nhưng chậm. `rag_v2.py` bổ sung persistent index, incremental document hash và lệnh `index`, `ask`, `status`, `eval`, `serve`.

## Ingestion, chunking và provenance

Một index tốt phải bảo toàn được đường về nguồn:

- Parser đọc TXT/MD/PDF; PDF cần giữ page number để citation có ý nghĩa.
- Normalize loại nhiễu nhưng không được làm mất cấu trúc quan trọng.
- Structure-aware chunking ưu tiên heading/đoạn trước khi cắt theo kích thước và overlap.
- Stable chunk ID giúp cache, incremental update và đánh giá không bị đổi danh tính vô cớ.
- Document hash cho biết file nào thật sự thay đổi; atomic write tránh để process đọc artifact nửa chừng.

Các hướng nâng cao trong guide v1 gồm parent–child retrieval, contextual/dynamic chunking và multimodal parsing. Đây là lựa chọn theo use case, không phải checklist phải bật đồng thời.

## Hybrid retrieval, fusion và diversity

Sparse retrieval như TF-IDF/BM25 mạnh ở keyword, mã lỗi và tên riêng. Dense embedding tìm được câu khác từ nhưng gần nghĩa. Hybrid search kết hợp cả hai rồi dùng Reciprocal Rank Fusion:

```text
RRF_score(document) = Σ 1 / (k + rank_của_document_trong_mỗi_retriever)
```

Sau fusion:

1. Relevance threshold bỏ kết quả quá yếu.
2. Optional reranker sắp lại candidate bằng tín hiệu mạnh hơn nhưng tăng latency/cost.
3. MMR cân bằng relevance và diversity để top-k không chứa nhiều chunk gần như giống nhau.
4. Metadata/source filter giới hạn miền tìm kiếm, đặc biệt khi người dùng đính kèm một file cụ thể.

Hit@K đo tài liệu đúng có xuất hiện trong top-k; MRR thưởng cho việc đưa kết quả đúng lên vị trí cao. Cần một eval set có query, expected source và failure cases thay vì chỉ đọc vài câu trả lời đẹp.

## Prompt, generation, cache và bảo mật

Prompt builder phải phân tách rõ instruction, dữ liệu truy xuất và câu hỏi. Tài liệu là **untrusted data**: câu lệnh nằm trong PDF không được phép ghi đè system policy. Dù vậy, lời nhắc chống injection chỉ là một lớp phòng thủ, không phải security boundary.

Context budget nên ưu tiên chunk liên quan, giữ citation và loại phần trùng. Streaming giảm thời gian chờ cảm nhận chứ không nhất thiết giảm tổng latency. `keep_alive` giảm thời gian nạp lại model local; answer cache giảm lần generation lặp nhưng phải key theo query, index/model/config và có TTL.

Trước khi public dữ liệu nhạy cảm cần thêm authentication, tenant/document ACL, rate limit, file scanning, HTTPS và audit. Device ID hoặc MAC nullable trong workspace hiện tại chỉ phục vụ lịch sử, không phải cơ chế đăng nhập.

## Ứng dụng web, streaming và triển khai hiện có

Workspace `RAG` không chỉ có CLI. Backend FastAPI nhận upload, lập chỉ mục nền, tìm kiếm và hỏi đáp; chat stream qua Server-Sent Events để frontend nhận token dần. React/Vite cung cấp giao diện quản lý tài liệu, search/chat và vùng soạn thảo Monaco. SQLite lưu answer cache cùng conversation/message history theo device identifier.

Luồng web cần giữ các ranh giới sau:

- Upload validate extension, kích thước và tên/path an toàn trước khi đưa vào index job.
- Background indexing cần trạng thái job, error có thể quan sát và atomic publish; không để request đọc index đang ghi dở.
- SSE cần phát event có type, xử lý disconnect/cancellation và kết thúc rõ; streaming không thay thế timeout tổng.
- Conversation history phải ràng buộc user/tenant khi có auth. Device ID hiện tại chỉ là convenience key, không chống giả mạo.
- Docker Compose/Oracle Cloud guide mô tả đường triển khai frontend + backend + model/service, nhưng production còn cần TLS, secret store, backup, process supervision, health/readiness và rollback đã diễn tập.

Implementation hiện là production-style learning project, chưa phải dịch vụ multi-tenant hardened: dense retrieval còn exact scan, state chủ yếu single-process và auth/ACL chưa hoàn chỉnh.

## Agent loop và hợp đồng tool

Agent loop an toàn cần controller ở ngoài model:

```text
goal + context + available tools
        ↓
model chọn tool hoặc câu trả lời
        ↓
validate input → permission/policy gate → execute
        ↓
tool_result có cấu trúc → cập nhật state → lặp
        ↓
terminal state, budget hết, lỗi hoặc human escalation
```

Tool name, description và input schema đều là tín hiệu định tuyến. Khác intent hoặc required fields thì nên tách tool; cùng intent, chồng nghĩa hoặc cần atomicity thì nên gộp. Lỗi transient như timeout/503 có thể retry có giới hạn trong tool; validation, permission và business-rule error phải trả metadata hành động được, không retry mù.

`tool_choice` quyết định model được tự chọn, bắt buộc gọi một tool bất kỳ, bắt buộc đúng tool hay không được gọi tool. MCP chuẩn hóa discovery và giao tiếp với tools/resources/prompts, nhưng không tự tạo trust: secrets, quyền và validation vẫn thuộc ứng dụng.

## Planning, memory và multi-agent orchestration

- **Planning/reflection/verifier** hữu ích cho task dài, nhưng verifier cần evidence/test gate độc lập thay vì chỉ hỏi model “đã đúng chưa?”.
- **Memory** nên tách current structured state, durable facts, recent verbatim turns và summary của lịch sử cũ.
- **Compaction** giảm context nhưng có thể làm mất chi tiết; sau compaction phải re-ground bằng goal, quyết định, fact và trạng thái mới nhất.
- **Multi-agent** chạy song song khi nhiệm vụ độc lập, tuần tự khi output bước trước là input bước sau. Coordinator phải truyền handoff rõ, kiểm tra coverage và hợp nhất provenance.
- **Loop detection** phải đổi chiến lược hoặc escalation sau lỗi lặp, thay vì tiêu token cho cùng một hành động.

Context caching giảm chi phí tính toán của prefix ổn định; nó không giải phóng context window và không chữa “lost in the middle”.

## Claude Code workflow và structured output

Deep-dive D3/D4 bổ sung lớp vận hành coding agent. Cấu hình phải có phạm vi rõ: instruction cấp repository trong `CLAUDE.md`, rule hẹp theo đường dẫn, skill cho quy trình tái sử dụng, hook cho kiểm tra deterministic, permission cho least privilege và MCP config cho integration. Plan mode phù hợp khi phạm vi/rủi ro chưa rõ; direct execution phù hợp thay đổi nhỏ có test gate. CI, code review và batch workflow phải giữ diff/evidence thay vì tin lời tự báo cáo của agent.

Prompt tốt nêu goal, constraint, tiêu chí chấp nhận và format; few-shot chỉ dùng ví dụ đại diện. Structured output nên dựa trên JSON Schema, phân biệt required/optional/nullable và validate hai lớp:

1. **Syntactic:** output parse được và đúng schema.
2. **Semantic:** ID tồn tại, tổng hợp hợp lệ, business invariant đúng.

Validation failure được trả lại có cấu trúc để sửa có giới hạn; không retry vô hạn. Batch chỉ an toàn khi item độc lập hoặc có partial-failure contract. Multi-pass draft/review giúp task khó nhưng tăng latency/cost, vì vậy phải đo chất lượng tăng thêm.

## Reliability, evaluation và human review

Một RAG agent cần đo cả thành phần lẫn end-to-end:

| Lớp | Tín hiệu nên đo |
|---|---|
| Retrieval | Hit@K, MRR, relevance, coverage theo loại tài liệu |
| Generation | groundedness, citation correctness, no-answer behavior |
| Agent trajectory | tool đúng, tham số đúng, số vòng, termination, policy violation |
| Vận hành | TTFT, p50/p95, token/cost, cache hit, error taxonomy |

Confidence tự khai báo của model không đủ để quyết định review. Cần calibration theo field/segment, lấy mẫu cả nhóm “tự tin cao”, và route con người khi hành động khó đảo ngược, vượt thẩm quyền hoặc evidence xung đột. Mọi claim tổng hợp từ nhiều nguồn nên giữ claim–source mapping đến output cuối.

## Hợp nhất nguồn và giới hạn implementation

- `AIEngineer` lessons 27–35 cung cấp prerequisite và overview; lessons 36–38/43–48 nối eval, security, serving và capstone.
- `ClaudeArchitectFoundation/Tool2/Output/D1…D5` là năm đơn vị học chuẩn về agent, tool/MCP, Claude Code workflow, structured output và context reliability. `ALL_DOMAINS.md` chứa lại D1–D5 theo dạng một tài liệu đọc gộp để tiện tra cứu/provenance, không phải một đơn vị kiến thức bổ sung. Bộ đếm file/từ thô vẫn có thể tính cả hai vì đồng bộ chỉ loại trùng theo hash toàn file; vì vậy không được diễn giải số từ thô ấy là lượng kiến thức ngữ nghĩa duy nhất.
- Hai CCAR-F study guide Việt/Anh là hai bản ngôn ngữ của cùng lộ trình; bộ 162 ảnh, answer key và Markdown quiz cùng phục vụ một ngân hàng câu hỏi.
- `RAG_GUIDE.md` giữ lý thuyết nâng cao như vector database, HyDE, Corrective/Self/Agentic/GraphRAG; `RAG_GUIDE_v2.md` là nguồn chính cho implementation hiện có.
- Implementation v2 vẫn dùng exact dense scan, load index trong một process, chưa tự watch thư mục, cache chủ yếu lưu answer, reranker dùng generation LLM và chưa có authentication/ACL thật. Đây là workspace học tập tốt, chưa phải kiến trúc multi-tenant production hoàn chỉnh.

Checklist trước khi gọi một RAG agent là “sẵn sàng”:

- [ ] Có eval set và no-answer cases.
- [ ] Citation truy ngược được đúng file/trang/chunk.
- [ ] Tool input, permission và terminal state được enforce ngoài prompt.
- [ ] Có giới hạn vòng lặp, timeout, retry và cost.
- [ ] Có auth/ACL và threat model trước khi dùng tài liệu nhạy cảm.
