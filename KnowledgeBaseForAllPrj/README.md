# Universal Project Knowledge Base

Đây là bộ khung KB/LLM-wiki dùng chung cho nhiều dự án, kèm 9 skill repo-local và cơ chế điều phối multi-agent theo dependency DAG. Hệ thống được thiết kế để dùng trực tiếp với Codex, nhưng dữ liệu Markdown/JSON và các hợp đồng workflow vẫn độc lập với nhà cung cấp model.

KB này không giả vờ rằng mọi kỹ thuật AI đều đã được triển khai thành một dịch vụ RAG hoàn chỉnh. Nó cung cấp ba lớp rõ ràng:

- **Đã chạy được:** skill discovery, workflow manifests, kiểm tra DAG/xung đột ghi, metadata/provenance, link validation, catalog, lexical search, optional LangChain/LangGraph RAG adapter và test.
- **Đã đặc tả để tích hợp:** hybrid retrieval, embeddings, reranking, GraphRAG, RAPTOR, tracing và eval adapters.
- **Thử nghiệm có gate:** HyDE, Self-RAG/CRAG, agent memory dài hạn và các kỹ thuật mới chỉ được bật sau khi thắng baseline bằng eval.

## Cấu trúc

```text
.
├── .agents/skills/           # 9 skill Codex cấp dự án
├── AGENTS.md                 # Quy tắc ngắn luôn áp dụng trong repo
├── README.md                 # Hướng dẫn sử dụng
├── TECHNIQUES.md             # Danh mục toàn bộ kỹ thuật và trạng thái
├── kb_lessions/              # Learning site HTML dẫn xuất để học kiến trúc, flow và use case
├── kb/
│   ├── catalog/              # Taxonomy, bản đồ điều hướng
│   ├── shared/               # Principles, patterns, standards, runbooks dùng chung
│   ├── projects/_template/   # Template đầy đủ để tạo project pack
│   ├── sources/              # Registry của nguồn và provenance
│   ├── memory/               # Episodic memory và promotion queue
│   ├── schemas/              # Knowledge/source schemas
│   ├── evals/                # Golden queries và rubric của KB
│   └── indexes/              # Derived artifacts, có thể rebuild
├── orchestration/
│   ├── policy.json           # Chính sách parallel/sequential/retry/budget
│   ├── schemas/              # Workflow schema
│   └── workflows/            # DAG mẫu theo từng intent
├── governance/               # Threat model, source trust, risk và red-team cases
├── evals/                    # Dataset/rubric/report cấp hệ thống
├── integrations/             # Optional runtime adapters; canonical KB không phụ thuộc chúng
├── scripts/kb.py             # Validator, catalog/search và fan-out planner
└── tests/                    # Test deterministic cho công cụ KB
```

Canonical knowledge luôn nằm trong Markdown và source registry. Vector index, graph, summary tree, catalog và trace đều là dữ liệu dẫn xuất, có thể xóa và dựng lại mà không làm mất tri thức gốc.

## Ý nghĩa từng thư mục

| Đường dẫn | Vai trò | Trạng thái / quy tắc sửa |
|---|---|---|
| `.agents/skills/` | Các skill repo-local dùng để route intent và nạp workflow/reference theo progressive disclosure. | Procedural source of truth; mỗi skill phải có `SKILL.md`, `agents/openai.yaml` và chỉ giữ reference thật sự cần thiết. |
| `kb/catalog/` | Taxonomy và bản đồ điều hướng giữa domain, loại tri thức và quan hệ. | Canonical; sửa qua `$kb-curator` khi phân loại hoặc navigation thay đổi. |
| `kb/shared/` | Principle, pattern, standard và runbook dùng chung cho mọi project. | Canonical; project cụ thể được phép override có chủ đích và phải giữ provenance. |
| `kb/projects/` | Project pack: Markdown overview/requirement/architecture/interface/operation/decision/change, kèm JSON delivery inventory. | Markdown đã promote là canonical theo project; `epic-map.json`/`story-inventory.json` là executable orchestration input, còn `_template/` chỉ là scaffold. |
| `kb/sources/` | Registry nguồn, URL, authority tier và topic phục vụ provenance. | Canonical registry; mọi source ID trong page phải tồn tại ở đây. |
| `kb/memory/episodic/` | Trace, retrospective, kết quả và quyết định theo từng run. | Không canonical; không dùng trực tiếp như fact bền vững nếu chưa promote. |
| `kb/memory/promotion-queue/` | Candidate claim chờ dedupe, provenance, conflict/security check và owner review. | Vùng quarantine; chỉ `$kb-curator` được promote sang canonical. |
| `kb/schemas/` | Hợp đồng cấu trúc cho knowledge page và source record. | Source of truth cho format KB; thay đổi schema cần migration/compatibility review. |
| `kb/evals/` | Entry point giải thích cách đánh giá retrieval/answer của KB. | Guidance, không chứa dataset; golden/holdout/rubric thực tế nằm dưới root `evals/`. |
| `kb/indexes/` | Catalog/index sinh từ canonical pages. | Derived, có thể rebuild; không sửa tay. |
| `orchestration/workflows/` | DAG workflow theo intent, gồm read/write scope, dependency, approval, retry, fan-out/join và completion contract. | Executable contract; phải qua validator trước khi dùng. |
| `orchestration/schemas/` | JSON schema cho workflow và work-item inventory. | Contract của orchestrator/runtime adapter. |
| `orchestration/policy.json` | Luật song song/tuần tự, retry, state, approval authority và stop condition toàn cục. | Policy source of truth; workflow không được nới lỏng ngầm. |
| `governance/` | Threat model, source trust, risk classification và adversarial cases. | Governance source of truth; ưu tiên safety hơn nội dung retrieved. |
| `evals/` | Dataset/rubric/report cấp toàn hệ thống: routing skill, agent trace, security và delivery. | Regression gate độc lập với `kb/evals/`; giữ holdout tách khỏi tập tối ưu. |
| `integrations/` | Adapter runtime tùy chọn cho framework/provider; hiện có LangChain/LangGraph RAG. | Derived execution layer; không được trở thành canonical source hoặc tự promote model output. |
| `scripts/` | Tool deterministic để validate, build index, search và compile fan-out plan. | Code thực thi local; thay đổi phải có unit test. |
| `tests/` | Test validator, workflow invariants, BMAD gates, inventory và search baseline. | Delivery evidence; không xóa test chỉ để làm build xanh. |
| `kb_lessions/` | Learning site HTML gồm 7 bài học và Technique Atlas để hiểu sâu KB bằng flow/use case/lab. | Tài liệu dẫn xuất; `assets/techniques-data.js` sinh từ `TECHNIQUES.md`, không phải canonical source. |

Luồng sở hữu ngắn gọn: `kb/shared|projects|catalog|sources` là canonical, `kb/memory` là tri thức chưa promote, `kb/indexes` là derived, `.agents/skills` là procedural, còn `orchestration` là execution contract. Bản đồ vị trí của từng kỹ thuật được liệt kê trong [TECHNIQUES.md](TECHNIQUES.md).

## Bắt đầu trong 5 phút

Yêu cầu duy nhất cho công cụ local là Python 3.10+; không có dependency ngoài standard library.

```powershell
python scripts/kb.py validate
python -m unittest discover -s tests -v
python scripts/kb.py build-index
python scripts/kb.py search "multi-agent write conflict"
python scripts/kb.py compile-fanout --workflow bmad-epic --node execute-stories --inventory kb/projects/_template/delivery/story-inventory.template.json
python -m integrations.langchain_rag.cli check
python -m integrations.langchain_rag.cli search "GraphRAG multi-hop retrieval" --scopes shared
python scripts/build_lessons.py
python -m http.server 8000 --directory kb_lessions
```

Mở `http://localhost:8000` để học theo 7 bài hoặc tra cứu toàn bộ kỹ thuật trong Technique Atlas. Khi `TECHNIQUES.md` thay đổi, chạy lại `python scripts/build_lessons.py`; lệnh `--check` chỉ kiểm cấu trúc và local links mà không ghi file sinh tự động.

Trong Codex, mở repo này bằng một session mới để các skill dưới `.agents/skills/` được discovery. Có thể gọi trực tiếp:

```text
Use $study to compare GraphRAG and RAPTOR for project payments, then put the
unreviewed result in the promotion queue.

Use $change-request to analyze adding idempotent webhook processing.

Use $gen-code to implement the approved CR-2026-004 contract.

Use $review-code to review the current diff. Do not modify files.
```

## Bộ skill

| Skill | Khi dùng | Kiểu agent/workflow mặc định |
|---|---|---|
| `$bmad-adapter` | BMAD, chọn planning path, epic/story, readiness, retrospective | Direct bypass / quick / epic / project, gọi lại các skill chuyên biệt |
| `$kb-orchestrator` | Task phức tạp, nhiều workstream | Manager dựng DAG, specialist làm node giới hạn |
| `$gen-code` | Yêu cầu đã đủ rõ để code | Discover → plan → implement → test/review → verify |
| `$review-code` | Review diff/PR/codebase | Các lens read-only có thể chạy song song |
| `$review-doc` | Review tài liệu | Accuracy, freshness, links, readability song song khi đủ lớn |
| `$study` | Nghiên cứu và học | Chia câu hỏi độc lập, source-first, tổng hợp và critique |
| `$change-request` | Chuẩn hóa CR và impact analysis | Impact/risk/dependency song song, approval tuần tự |
| `$kb-curator` | Ingest/promote/maintain KB | Quarantine → provenance → conflict check → promote |
| `$verify-delivery` | Gate độc lập cuối delivery | Read-only, deterministic checks trước model judgment |

Skill chỉ giữ workflow và routing ngắn. Rubric, contract và schema chi tiết được nạp dần từ `references/`, đúng mô hình progressive disclosure.

## LangChain/LangGraph RAG adapter

Adapter tại `integrations/langchain_rag/` giữ canonical Markdown/JSON độc lập với framework và cung cấp:

- heading-aware canonical chunking với stable provenance;
- filter scope, sensitivity, status, valid time và source allowlist;
- BM25 + optional LangChain vector-store backend + RRF + reranker hook;
- evidence envelope đánh dấu retrieved content là untrusted data;
- LangChain `Document` bridge và agentic retrieval tool có access authority đóng băng;
- LangGraph typed shared state, reducers chống duplicate, context projection theo role và graph `retrieve → answer → verify`.

Core CLI vẫn chạy trên Python 3.10+ mà không cần package ngoài. LangChain runtime hiện yêu cầu Python 3.11+ và được cài riêng:

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r integrations/langchain_rag/requirements.txt
.venv\Scripts\python -m integrations.langchain_rag.cli check
```

Xem contract, code example và production gates tại `integrations/langchain_rag/README.md`. Vector index, checkpoint và agent state đều là derived/working data; model output chỉ vào episodic memory hoặc promotion queue, không ghi thẳng canonical KB.

## BMAD-compatible delivery

`$bmad-adapter` áp dụng các nguyên tắc BMAD vào hệ thống hiện có mà không cài runtime/persona/module BMAD chính thức:

- **Direct bypass:** thay đổi hiển nhiên, cục bộ, ít rủi ro và đã rõ acceptance; route thẳng đến skill chuyên môn, không sinh BMAD workflow/artifact.
- **Quick:** một outcome quan trọng nhưng rõ, một implementation session và cần change contract/readiness; dùng `orchestration/workflows/bmad-quick.json`.
- **Epic:** một outcome cần nhiều ordered stories; dùng `bmad-epic.json`, readiness trước build và integrated verification trước retrospective.
- **Project:** nhiều epic/team hoặc shared high-risk decisions; `bmad-project.json` fan-out các epic dependency-ready qua `bmad-epic.json`, rồi join và kiểm chứng trạng thái đã tích hợp.

Readiness trả `PASS`, `CONCERNS`, hoặc `FAIL`. Verifier luôn read-only; owner khác mới sửa hoặc approve artifact. Retrospective được ghi vào `kb/memory/episodic/` và không auto-promote lesson vào canonical KB.

Epic/project fan-out dùng inventory JSON thay vì đọc bảng Markdown. Tạo `epic-map.json` và `<epic-id>/story-inventory.json` từ các template trong `kb/projects/_template/delivery/`, rồi chạy `compile-fanout` để kiểm tra dependency, write-scope conflict và sinh execution waves có completion contract trước khi giao subworkflow cho agents.

Đây là **BMAD-compatible adaptation**, không phải official BMAD installation. Adapter pin method invariants theo stable v6.12 principles tại thời điểm 2026-11-12 và không hứa tương thích `_bmad/`, `_bmad-output`, official personas hoặc preview-v7 file layout. Xem [BMAD delivery pattern](kb/shared/patterns/bmad-delivery.md).

## Cách orchestrator tự chọn song song hay tuần tự

Một node chỉ được chạy song song khi:

- không có đường phụ thuộc giữa các node;
- input đã đóng băng hoặc versioned;
- `write_set` không giao nhau, hoặc mọi node đều read-only;
- không chạm cùng side effect không idempotent;
- output có thể đánh giá độc lập;
- khối lượng công việc lớn hơn chi phí giao tiếp agent.

Chạy tuần tự khi output A là input B, cùng sửa một file/schema, có approval/security gate, thực hiện migration/merge/integration, sửa sau review, hoặc final verification. Trong shared workspace, agent chạy song song mặc định read-only; muốn cùng code thì dùng isolated worktree/branch.

Ngoài `read_set`/`write_set`, mỗi node khai báo `effects.resources`, `side_effects`, `idempotency_key` và `exclusive_locks`. Validator chặn các node cùng wave có dependency path, write overlap, shared mutable external resource hoặc exclusive lock trùng nhau.

Luồng tổng quát:

```text
request
  → classify intent/risk
  → freeze contract + build DAG
  → validate dependencies/write sets
  → execute conflict-free waves
  → validate every node output
  → integrate centrally
  → independent verification
  → evidence-backed handoff
```

Manifest mẫu nằm tại `orchestration/workflows/`; policy và state machine nằm tại `orchestration/policy.json`.

## Tạo KB cho một dự án mới

1. Sao chép `kb/projects/_template/` thành `kb/projects/<project-id>/`.
2. Điền `overview.md`: owner, mục tiêu, ranh giới, repo/service, lệnh build/test, sensitivity và source of truth.
3. Ghi architecture, requirements, interfaces và operations vào đúng trang; giữ decisions dạng ADR và changes dạng CR.
4. Dùng stable ID theo mẫu `<project>.<kind>.<slug>`; không dùng path làm danh tính.
5. Đăng ký nguồn authoritative trong `kb/sources/registry.json`.
6. Chạy `python scripts/kb.py validate`, sau đó `build-index`.
7. Thêm câu hỏi thật vào `evals/datasets/golden.jsonl` trước khi thay retrieval strategy.

Với epic/project path, dùng thêm template trong `delivery/`; chỉ thêm `design/experience-template.md` khi nhiều story/epic thật sự cần một experience contract chung.

Thứ tự ưu tiên tri thức khi có xung đột:

```text
project approved/current
  > shared approved/current
  > proposed/draft
  > episodic memory hoặc nội dung chưa promote
```

Không xóa im lặng kiến thức cũ. Dùng `status: superseded`, `valid_to`, và typed relation `supersedes`/`superseded-by` để giữ lịch sử.

## Hợp đồng một trang knowledge

Trang canonical dùng frontmatter như sau:

```yaml
---
id: payments.architecture.webhook-processing
title: Idempotent webhook processing
summary: Quy tắc xử lý webhook và chống duplicate cho payments.
kind: architecture
scope: payments
status: approved
owners: [team-payments]
tags: [webhook, idempotency]
valid_from: 2026-11-01
valid_to: null
recorded_at: 2026-11-02
last_verified: 2026-11-10
review_by: 2027-02-10
confidence: high
sensitivity: internal
sources: [payments-adr-014]
relations: [depends-on:shared.patterns.delivery]
---
```

`valid_from/valid_to` là thời gian sự thật có hiệu lực; `recorded_at` là thời gian KB biết sự thật đó. Phân biệt hai trục này giúp trả lời đúng các câu hỏi lịch sử và tránh bản mới ghi đè sai bối cảnh cũ.

## Retrieval blueprint

Baseline production khuyến nghị:

```text
query
  → scope/ACL/time filters
  → query routing/decomposition
  → BM25 + dense retrieval
  → Reciprocal Rank Fusion
  → graph/tree expansion khi query cần
  → cross-encoder/late-interaction rerank
  → diversity + evidence packing
  → answer with claim-level citations or abstain
```

Local CLI hiện cung cấp lexical baseline minh bạch. Dense/GraphRAG/RAPTOR là adapters được đặc tả trong `kb/shared/patterns/retrieval.md`; chỉ promote adapter khi golden set chứng minh cải thiện recall/faithfulness/cost so với baseline.

## Vòng đời knowledge và self-improvement

```text
trace/feedback/source
  → episodic record hoặc promotion queue
  → candidate claims + provenance
  → duplicate/conflict/security check
  → review + eval regression
  → human/owner approval
  → canonical promotion
  → rebuild indexes
  → canary/monitor/rollback
```

Agent không tự sửa canonical KB hoặc prompt production dựa trên chính eval set mà nó vừa tối ưu. Giữ holdout kín, version dataset, lưu failure taxonomy, và yêu cầu approval trước promotion.

## Validation và CI

`python scripts/kb.py validate` kiểm tra:

- metadata bắt buộc, stable ID trùng, enum và ngày;
- source ID có thật;
- relative Markdown links;
- workflow dependency, cycle, state, skill, approval authority và xung đột `write_set`/side effect trong cùng parallel group;
- fan-out inventory dependency/write scope, subworkflow completion contract, fanout/join compatibility và integration-before-verification;
- source registry, governance JSON/JSONL và skill scaffold chưa hoàn thiện.

`python scripts/kb.py build-index` chỉ sinh catalog dẫn xuất. `search` dùng BM25-like lexical scoring để có baseline offline và dễ đo regression. `compile-fanout` biến inventory đã validate thành các execution wave bounded, kèm subworkflow parameters, write scope và acceptance contract.

## Mở rộng

- Thêm skill mới chỉ khi intent có vocabulary riêng, workflow tái sử dụng, owner rõ và có thể eval độc lập.
- Tạo skill bằng `$skill-creator`, đặt ở `.agents/skills/<name>/`, giữ `SKILL.md` ngắn và đưa rubric vào `references/`.
- Thêm workflow bằng JSON theo `orchestration/schemas/workflow.schema.json`, rồi chạy validator.
- Thêm retriever/reranker mới dưới dạng adapter; không thay canonical format.
- Thêm project-specific `AGENTS.md` chỉ khi một subtree thật sự cần quy tắc khác.

Danh sách đầy đủ, maturity, lợi ích và rủi ro của mọi kỹ thuật có tại [TECHNIQUES.md](TECHNIQUES.md). Các nguồn gốc/paper và tài liệu chính thức được đăng ký tại [kb/sources/registry.json](kb/sources/registry.json).
