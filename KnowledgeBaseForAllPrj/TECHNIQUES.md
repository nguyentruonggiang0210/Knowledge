# Danh mục kỹ thuật

Ngày rà soát: **2026-11-13**. Maturity dùng ba mức: **Implemented** đã có artifact/code local; **Blueprint** đã có hợp đồng tích hợp nhưng cần hạ tầng/model; **Experimental** chỉ bật sau eval riêng. Cột **Vị trí source** trỏ tới implementation, executable contract hoặc blueprint chính; nguồn paper/official tương ứng nằm trong `kb/sources/registry.json`.

## Knowledge architecture

| Kỹ thuật | Maturity | Cách dùng trong KB | Vị trí source | Trade-off chính |
|---|---|---|---|---|
| Canonical Markdown | Implemented | Source of truth đọc được bởi người và model | `kb/index.md`, `kb/shared/**`, `kb/projects/**` | Cần kỷ luật schema |
| Stable semantic IDs | Implemented | Danh tính không phụ thuộc path | `kb/schemas/knowledge.schema.json`, `scripts/kb.py` | Cần registry và uniqueness check |
| Wiki links + typed relations | Implemented | Điều hướng cho người và graph adapter | `kb/schemas/knowledge.schema.json`, `scripts/kb.py` | Quan hệ phải được curate |
| Progressive disclosure | Implemented | Catalog → page → evidence; skill → reference | `kb/index.md`, `.agents/skills/*/SKILL.md` | Có thể thiếu context nếu routing kém |
| Project-over-shared precedence | Implemented | Local override có kiểm soát | `kb/shared/principles/source-of-truth.md`, `AGENTS.md` | Cần phát hiện conflict |
| Bitemporal knowledge | Implemented | `valid_*` tách khỏi `recorded_at` | `kb/shared/standards/knowledge-contract.md`, `kb/schemas/knowledge.schema.json` | Query phức tạp hơn |
| Explicit supersession | Implemented | Giữ lịch sử thay vì overwrite | `kb/shared/standards/knowledge-contract.md`, `scripts/kb.py` | Tăng số phiên bản cần quản lý |
| W3C PROV-inspired provenance | Implemented | Source/entity/activity/agent lineage | `kb/shared/standards/knowledge-contract.md`, `kb/sources/registry.json` | Metadata overhead |
| Authority tiers | Implemented | Ưu tiên spec/official/source code | `kb/sources/registry.json`, `governance/source-trust-policy.json` | Authority không đồng nghĩa đúng tuyệt đối |
| Content-addressed incremental index | Blueprint | Reindex theo hash và dependency | `kb/shared/patterns/retrieval.md` | Phải quản lý index version |
| Knowledge graph projection | Blueprint | Sinh entity/relation graph từ canonical pages | `kb/shared/patterns/retrieval.md` | Entity resolution và rebuild đắt |
| Working/episodic/semantic/procedural memory split | Implemented | Không trộn trace với facts hoặc skills | `kb/memory/README.md`, `.agents/skills/**` | Promotion pipeline thêm bước |
| Human-reviewed memory promotion | Implemented | Queue → provenance/conflict check → canonical | `.agents/skills/kb-curator/`, `orchestration/workflows/kb-curator.json` | Chậm hơn auto-memory |
| Source-first claim ledger | Implemented as workflow | Tách claim, evidence, source type, date, confidence, disagreement và inference trước synthesis | `.agents/skills/study/references/research-protocol.md` | Tốn công với nghiên cứu nhỏ |
| Validate-before-index fail-closed | Implemented | Từ chối index canonical repository đang invalid | `integrations/langchain_rag/canonical.py`, `scripts/kb.py` | Một lỗi metadata có thể chặn toàn batch |
| RDF/JSON-LD graph projection + SHACL | Blueprint | Chiếu typed relations sang graph chuẩn và validate graph-specific invariants | `kb/shared/patterns/knowledge-graph-and-provenance.md`, `kb/sources/registry.json` | Mapping/round-trip và shape governance phức tạp |
| Cryptographic provenance attestations | Blueprint | Ký subject digest, builder/source identity và input lineage cho index/report/release | `kb/shared/patterns/knowledge-graph-and-provenance.md`, `kb/sources/registry.json` | Key rotation, revocation và trust-root operations |
| Exact deletion + tombstones | Blueprint | Propagate authorized erasure qua canonical copy và mọi derived artifact | `kb/shared/patterns/knowledge-graph-and-provenance.md`, `kb/shared/standards/knowledge-contract.md` | Xung đột retention/legal hold và audit history |

## Retrieval và grounding

| Kỹ thuật | Maturity | Cách dùng | Vị trí source | Trade-off chính |
|---|---|---|---|---|
| Structure-aware chunking | Implemented | Chia theo heading/blank block, giữ fenced code nguyên khối và gắn parent locator | `integrations/langchain_rag/canonical.py`, `kb/shared/patterns/retrieval.md` | Block quá lớn được giữ nguyên thay vì cắt mù |
| Parent-child chunks | Blueprint | Retrieve nhỏ, pack parent context | `kb/shared/patterns/retrieval.md` | Dễ tăng token context |
| Contextual chunking | Blueprint | Thêm ngữ cảnh document vào chunk trước index | `kb/shared/patterns/retrieval.md`, `kb/sources/registry.json` | Chi phí index và summary drift |
| Late Chunking | Experimental | Encode long document trước rồi pool thành contextual chunk vectors | `kb/shared/patterns/retrieval.md`, `kb/sources/registry.json` | Long-context compute và context bleed |
| Deterministic content-hashed chunk IDs | Implemented | SHA-256 page ID + heading + content giữ chunk identity ổn định và dedupe được | `integrations/langchain_rag/canonical.py`, `tests/test_langchain_rag.py` | Content edit chủ đích tạo ID mới |
| BM25 / lexical retrieval | Implemented | `scripts/kb.py search` là offline baseline | `scripts/kb.py` (`rank_pages`, `command_search`) | Kém paraphrase |
| Dense embedding retrieval | Implemented as adapter | LangChain-compatible vector store cung cấp dense candidates | `integrations/langchain_rag/langchain_adapter.py`, `integrations/langchain_rag/retrieval.py` | Cần chọn embedding/vector backend riêng |
| Hybrid sparse+dense | Implemented as adapter | BM25 và dense chạy song song, post-filter rồi fuse | `integrations/langchain_rag/retrieval.py` | Hai index cần vận hành |
| Reciprocal Rank Fusion | Implemented | Hợp nhất ranking không cần calibrate score | `integrations/langchain_rag/retrieval.py`, `kb/sources/registry.json` | Không học domain weights |
| LangChain Document/vector-store bridge | Implemented as adapter | Chuyển canonical chunks sang `Document`, add/search qua vector-store interface | `integrations/langchain_rag/langchain_adapter.py` | Filter syntax vẫn phụ thuộc provider |
| 2-Step RAG execution graph | Implemented as adapter | Retrieve → answer → independent verify với model do runtime owner cấp | `integrations/langchain_rag/graph.py` | Chưa kèm model/provider mặc định |
| Agentic retrieval tool with frozen authority | Implemented as adapter | Agent chọn query nhưng không tự mở rộng ACL/scope | `integrations/langchain_rag/langchain_adapter.py` | Access context phải do trusted caller cấp |
| Learned sparse retrieval/SPLADE | Experimental | Semantic expansion nhưng vẫn inverted index | `kb/shared/patterns/retrieval.md`, `kb/sources/registry.json` | Model/index phức tạp |
| Cross-encoder reranking | Blueprint | Rerank candidate set nhỏ | `kb/shared/patterns/retrieval.md` | Latency runtime |
| ColBERT late interaction | Experimental | Token-level matching chính xác hơn | `kb/shared/patterns/retrieval.md`, `kb/sources/registry.json` | Storage và index lớn |
| MMR/diversity selection | Blueprint | Giảm chunk trùng lặp | `kb/shared/patterns/retrieval.md` | Có thể hy sinh relevance thuần |
| Query routing | Blueprint | Local fact/hierarchy/graph/web theo intent | `kb/shared/patterns/retrieval.md` | Router sai gây recall loss |
| Query decomposition | Blueprint | Chia multi-constraint/multi-hop query | `kb/shared/patterns/retrieval.md` | Tăng latency và merge complexity |
| Multi-query retrieval | Experimental | Nhiều paraphrase rồi fusion | `kb/shared/patterns/retrieval.md` | Query drift và chi phí |
| HyDE | Experimental | Hypothetical answer làm retrieval query | `kb/shared/patterns/retrieval.md` | Hallucinated query features |
| RAPTOR | Experimental | Summary tree cho long-document/global QA | `kb/shared/patterns/retrieval.md`, `kb/sources/registry.json` | Index đắt, summary distortion |
| GraphRAG local/global | Experimental | Multi-hop và corpus-level questions | `kb/shared/patterns/retrieval.md`, `kb/sources/registry.json` | Extraction/entity resolution đắt |
| HippoRAG 2 graph memory | Experimental | Factual, associative và multi-hop retrieval bằng passage/graph/PageRank | `kb/shared/patterns/retrieval.md`, `kb/sources/registry.json` | Graph poisoning, freshness và entity resolution |
| LightRAG/LiteRAG graph retrieval family | Experimental | Dual-level hoặc algorithmic graph exploration nhằm giảm token/latency | `kb/shared/patterns/retrieval.md`, `kb/sources/registry.json` | Hai biến thể khác nhau, phải benchmark ngang baseline |
| Visual RAG with ColPali | Experimental | Retrieve trực tiếp page image/layout/table/figure bằng multi-vector late interaction | `kb/shared/patterns/retrieval.md`, `kb/sources/registry.json` | Visual PII, storage lớn và region citation |
| Matryoshka multi-resolution embeddings | Experimental | Coarse dimensions cho candidate search, full dimensions cho rerank | `kb/shared/patterns/retrieval.md`, `kb/sources/registry.json` | Model/dimension coupling và recall trade-off |
| Adaptive retrieval / Self-RAG pattern | Experimental | Chỉ retrieve khi cần, critique support | `kb/shared/patterns/retrieval.md`, `kb/sources/registry.json` | Cần model/training hoặc controller đáng tin |
| Corrective RAG pattern | Experimental | Grade retrieval rồi retry/switch/abstain | `kb/shared/patterns/retrieval.md`, `kb/sources/registry.json` | Judge lỗi có thể khuếch đại lỗi |
| Claim-level evidence packing | Implemented | Evidence envelope giữ chunk/page/source/locator và trust boundary | `integrations/langchain_rag/runtime.py`, `kb/shared/standards/knowledge-contract.md` | Token và implementation overhead |
| Evidence conflict detection | Blueprint | Hiển thị mâu thuẫn thay vì chọn im lặng | `kb/shared/patterns/retrieval.md`, `kb/shared/principles/source-of-truth.md` | Cần temporal/authority policy |
| Evidence-aware abstention | Implemented as policy | Thiếu/mâu thuẫn evidence thì dừng | `kb/shared/principles/source-of-truth.md`, `kb/shared/patterns/retrieval.md` | Coverage thấp hơn nhưng an toàn hơn |

## Multi-agent và skills

| Kỹ thuật | Maturity | Cách dùng | Vị trí source | Trade-off chính |
|---|---|---|---|---|
| Manager + agents-as-tools | Implemented | Manager giữ scope, integration và final answer | `.agents/skills/kb-orchestrator/`, `kb/shared/patterns/agent-orchestration.md` | Manager có thể thành bottleneck |
| LangGraph typed shared state | Implemented as adapter | Agent chia sẻ evidence/result qua typed channels thay vì prompt toàn cục | `integrations/langchain_rag/context.py`, `integrations/langchain_rag/graph.py` | State schema phải evolve có version |
| Deduplicating context reducers | Implemented | Merge evidence/result theo stable contract ID | `integrations/langchain_rag/context.py` | Cần định nghĩa merge semantics cho field mới |
| Least-privilege context projection | Implemented | Researcher/implementer/reviewer/verifier chỉ thấy field cần thiết | `integrations/langchain_rag/context.py` | Role mới cần explicit field policy |
| Intent-based skill routing | Implemented | 9 description phân biệt rõ workflow | `.agents/skills/*/SKILL.md`, `evals/datasets/skill-routing.jsonl` | Metadata phải được eval |
| Progressive skill disclosure | Implemented | Chỉ nạp `SKILL.md`/reference cần thiết | `.agents/skills/*/SKILL.md`, `.agents/skills/*/references/` | Reference link phải đúng |
| Dependency DAG | Implemented | Workflow JSON + cycle/dependency checks | `orchestration/workflows/**`, `scripts/kb.py` (`validate_workflow_data`) | Planning overhead với task nhỏ |
| Topological execution waves | Implemented | Chạy node ready và conflict-free | `scripts/kb.py` (`compile_fanout_plan`), `orchestration/policy.json` | Cần state tracking runtime |
| Machine-readable hierarchical fan-out/join | Implemented | Project → epic → story bằng subworkflow, completion barrier và bounded concurrency | `orchestration/workflows/bmad-project.json`, `orchestration/workflows/bmad-epic.json`, `orchestration/workflows/bmad-story.json`, `orchestration/schemas/work-item-inventory.schema.json`, `scripts/kb.py` | Runtime phải cấp inventory/write scope đúng contract |
| Read/write-set conflict detection | Implemented | Validator chặn overlapping writes trong một wave | `scripts/kb.py` (`write_patterns_overlap`, `validate_work_item_inventory`) | Glob pattern chỉ là approximation |
| Parallel read-only specialist lenses | Implemented as workflow | Review/research độc lập rồi dedupe | `orchestration/workflows/review-code.json`, `orchestration/workflows/review-doc.json`, `orchestration/workflows/study.json`, `orchestration/workflows/bmad-project.json` | Có thể lặp evidence |
| Sequential integration gates | Implemented as policy | Merge/migration/approval/verify không chạy song song | `orchestration/policy.json`, `kb/shared/patterns/agent-orchestration.md` | Tăng elapsed time |
| Integration-before-system-verification | Implemented | Join mọi unit accepted, merge tuần tự, chạy integration checks rồi mới verify | `orchestration/workflows/bmad-epic.json`, `orchestration/workflows/bmad-project.json`, `scripts/kb.py` | Integration vẫn có thể phát hiện lỗi muộn |
| Isolated worktree branch-and-merge | Blueprint | Parallel implementation khi write scope disjoint | `kb/shared/patterns/agent-orchestration.md`, `orchestration/workflows/bmad-story.json` | Merge và environment cost |
| Structured inter-agent contracts | Implemented | Objective/input/output/evidence/stop | `.agents/skills/kb-orchestrator/references/orchestration-contract.md`, `orchestration/schemas/workflow.schema.json` | Hợp đồng tệ vẫn cho kết quả tệ |
| Bounded concurrency | Implemented | Default 3 specialist, override theo risk | `orchestration/policy.json`, trường `budget`/`fanout.max_concurrency` trong workflow | Không luôn tối ưu throughput |
| Bounded retry + reconciliation | Implemented as policy | Retry transient unfinished node sau state check | `orchestration/policy.json`, trường `retry` trong workflow | Phải phân loại lỗi đúng |
| Idempotency-aware side effects | Implemented as policy | Không replay side effect đã thành công | `orchestration/schemas/workflow.schema.json`, `scripts/kb.py`, `orchestration/policy.json` | Cần idempotency key/audit |
| Evidence-gated completion | Implemented | Không claim done khi thiếu observed proof | trường `acceptance`/`completion_contract` trong `orchestration/workflows/**` | Có thể để trạng thái blocked lâu hơn |
| Role-specific approval authorities | Implemented | High-risk human gate nêu product/architecture/security/privacy/ops owner áp dụng | `orchestration/policy.json`, `scripts/kb.py`, `required_authorities` trong workflow | Cần mapping vai trò theo từng tổ chức |
| Independent verifier/critic | Implemented | `$verify-delivery` không tự sửa | `.agents/skills/verify-delivery/`, `scripts/kb.py`, workflow `verify-delivery` nodes | Thêm cost và latency |
| Handoff only for ownership transfer | Implemented as policy | Specialist không chiếm final response mặc định | `.agents/skills/kb-orchestrator/SKILL.md`, `AGENTS.md` | Manager phải tổng hợp tốt |
| Trace-based workflow evaluation | Blueprint | Chấm routing/tool/handoff, không chỉ output | `kb/shared/standards/evaluation.md`, `evals/rubrics/workflow.md` | Cần trace backend hoặc JSONL adapter |
| BMAD-compatible right-sized planning | Implemented | Direct bypass/quick/epic/project theo intent, risk và coordination | `.agents/skills/bmad-adapter/`, `kb/shared/patterns/bmad-delivery.md` | Path classification sai có thể thừa hoặc thiếu process |
| Anti-ceremony direct bypass | Implemented | Local low-risk edit route thẳng đến specialist, không tạo BMAD artifact | `.agents/skills/bmad-adapter/SKILL.md`, `.agents/skills/bmad-adapter/references/planning-paths.md` | Phải escalate khi phát hiện quyết định/rủi ro mới |
| Requirement → epic → story traceability | Implemented | Stable IDs, coverage, dependency và integrated checks | `kb/projects/_template/delivery/`, `orchestration/workflows/bmad-*.json` | Cần maintain khi scope đổi |
| Implementation readiness gate | Implemented | Read-only `PASS/CONCERNS/FAIL` trước build | `kb/projects/_template/delivery/readiness-review-template.md`, `orchestration/workflows/bmad-*.json` | Gate tệ có thể thành ceremony |
| Bounded story build | Implemented | Một story/một session; parallel chỉ khi isolated/disjoint | `orchestration/workflows/bmad-story.json`, `kb/projects/_template/delivery/story-inventory.template.json` | Integration vẫn là sequential gate |
| Evidence-backed retrospective | Implemented | Giữ unfinished work, deviations, follow-up và lesson candidates | `kb/memory/episodic/retrospective-template.md`, `orchestration/workflows/bmad-epic.json`, `orchestration/workflows/bmad-project.json` | Không tự động chứng minh quan hệ nhân quả |
| BMAD official-runtime boundary | Implemented | Adapter không copy `_bmad/`, personas hoặc preview layout | `.agents/skills/bmad-adapter/SKILL.md`, `kb/shared/patterns/bmad-delivery.md` | Không tương thích file-for-file với official distribution |
| Impact-aware change contract | Implemented as contract | Freeze current/desired state, non-goals, impact, migration, rollout/rollback và acceptance trước code | `.agents/skills/change-request/SKILL.md`, `.agents/skills/change-request/references/change-contract.md` | Planning overhead cho change nhỏ |
| Smallest coherent change + targeted-to-broad checks | Implemented as workflow | Sửa phạm vi nhỏ nhất rồi chạy focused checks trước broader suite | `.agents/skills/gen-code/SKILL.md`, `.agents/skills/gen-code/references/delivery-contract.md` | Có thể bỏ sót coupling ngoài phạm vi nếu impact analysis kém |
| Risk-ordered evidence-based code review | Implemented as workflow | Review correctness/data/security trước style, finding có condition/impact/evidence | `.agents/skills/review-code/SKILL.md`, `.agents/skills/review-code/references/review-rubric.md` | Reviewer vẫn có thể bỏ sót path hiếm |
| Multidimensional documentation review | Implemented as workflow | Audit accuracy, provenance, freshness, navigation, accessibility và ownership | `.agents/skills/review-doc/SKILL.md`, `.agents/skills/review-doc/references/doc-rubric.md` | Cần source of truth rõ để kết luận |
| MCP tool/resource interoperability | Blueprint | Chuẩn hóa agent-to-tool/data với capability/version/auth boundary | `kb/shared/patterns/interoperable-agent-runtime.md`, `kb/shared/standards/policy-enforcement.md` | Remote server mở thêm supply-chain và injection surface |
| A2A remote-agent interoperability | Blueprint | Discover capability và quản lý remote agent task mà không chia sẻ internal state | `kb/shared/patterns/interoperable-agent-runtime.md` | Identity, artifact integrity và cancellation phức tạp |
| Durable event-sourced agent execution | Blueprint | Resume workflow sau crash/wait mà không replay committed effect | `kb/shared/patterns/interoperable-agent-runtime.md`, `kb/shared/patterns/agent-orchestration.md` | Workflow versioning và history storage |
| Executable Saga compensation | Blueprint | Compensate/reconcile external side effects theo reverse commit order | `kb/shared/patterns/interoperable-agent-runtime.md` | Không phải effect nào cũng đảo ngược được |
| OpenTelemetry GenAI trace profile | Blueprint | Portable spans cho model, retrieval, agent, workflow và tool | `kb/shared/patterns/interoperable-agent-runtime.md`, `kb/shared/standards/evaluation.md` | Semantic conventions evolve và trace có thể leak content |
| Schema-constrained decoding | Blueprint | Enforce JSON Schema khi sinh output, sau đó vẫn validate semantics/authority | `kb/shared/standards/policy-enforcement.md`, `kb/sources/registry.json` | Provider coupling và schema-compliant output vẫn có thể sai nghĩa |

## Evaluation và self-improvement

| Kỹ thuật | Maturity | Cách dùng | Vị trí source | Trade-off chính |
|---|---|---|---|---|
| Golden queries | Implemented | JSONL dataset versioned theo project | `evals/datasets/golden.jsonl`, `kb/evals/README.md` | Tốn công label |
| Sealed holdout | Implemented as governance | Chống tối ưu quá mức vào golden set | `kb/shared/standards/evaluation.md`, `evals/datasets/holdout.example.jsonl` | Feedback loop chậm hơn |
| Adversarial/red-team set | Implemented | Injection, poisoning, ACL leak, exfiltration | `governance/red-team-cases.jsonl`, `evals/datasets/adversarial.jsonl` | Phải cập nhật threat landscape |
| Retrieval metrics | Blueprint | Recall@k, Precision@k, MRR, nDCG | `kb/shared/standards/evaluation.md`, `evals/rubrics/` | Cần relevance judgments |
| Multi-hop evidence coverage | Blueprint | Chấm đủ tập evidence cần thiết | `kb/shared/standards/evaluation.md` | Labeling phức tạp |
| Generation/grounding metrics | Blueprint | Faithfulness, claim support, completeness | `kb/shared/standards/evaluation.md`, `evals/rubrics/` | Judge variance |
| Citation precision/recall | Blueprint | Link claim ↔ evidence | `kb/shared/standards/evaluation.md` | Claim segmentation khó |
| RAGAS-style reference-free eval | Experimental | Fast feedback khi thiếu gold answer | `kb/shared/standards/evaluation.md`, `kb/sources/registry.json` | Không thay human calibration |
| ARES/PPI-style calibrated eval | Experimental | Judge + human labels + confidence intervals | `kb/shared/standards/evaluation.md`, `kb/sources/registry.json` | Setup/statistical complexity |
| Deterministic graders first | Implemented | Schema, files, commands, links trước LLM judge | `scripts/kb.py`, `tests/test_kb.py`, `kb/shared/standards/evaluation.md` | Không đo nuance |
| Calibrated LLM-as-judge | Blueprint | Fixed rubric, evidence, swap order, human agreement | `kb/shared/standards/evaluation.md`, `evals/rubrics/` | Position/self-preference bias |
| Pairwise order swapping | Blueprint | A/B và B/A để phát hiện position bias | `kb/shared/standards/evaluation.md` | Gấp đôi judge calls |
| Human disagreement routing | Implemented as policy | Low confidence/disagreement → review | `kb/shared/standards/evaluation.md` | Cần reviewer capacity |
| Trace grading | Blueprint | Tìm lỗi routing, tool use và handoff | `kb/shared/standards/evaluation.md`, `evals/rubrics/workflow.md` | Backend coupling nếu không có adapter |
| Failure taxonomy | Implemented | Nhóm lỗi trước khi sửa prompt/retriever | `evals/rubrics/workflow.md`, `evals/reports/README.md` | Taxonomy cần evolve |
| Active error sampling | Blueprint | Chọn uncertainty/judge-disagreement cases | `kb/shared/standards/evaluation.md` | Sampling bias |
| Risk–coverage/abstention evaluation | Blueprint | Đo an toàn khi từ chối | `kb/shared/standards/evaluation.md` | Cần calibration set đại diện |
| Canary + rollback | Implemented as policy | Promote thay đổi qua gate | `kb/shared/runbooks/maintenance.md`, `.agents/skills/kb-curator/` | Vận hành phức tạp hơn |
| Evaluation-driven promotion | Implemented as policy | Kỹ thuật mới phải thắng baseline | `.agents/skills/kb-curator/`, `orchestration/workflows/kb-curator.json` | Có thể chậm adoption |
| Acceptance-to-evidence matrix | Implemented as workflow | Mỗi criterion map tới observed check; stale pre-integration evidence bị reject | `.agents/skills/verify-delivery/SKILL.md`, `.agents/skills/verify-delivery/references/verification-rubric.md` | Verification tốn thêm thời gian |
| Metamorphic testing | Blueprint | Kiểm invariants qua paraphrase, reorder, as-of, ACL và retry transformations | `kb/shared/standards/evaluation.md`, `kb/sources/registry.json` | Transformation có thể không thật sự giữ nghĩa |
| GEPA-style trajectory prompt evolution | Experimental | Học prompt/skill candidate từ trace reflection trong sandbox | `kb/shared/standards/evaluation.md`, `kb/sources/registry.json` | Eval leakage, overfit và malicious traces |

## Security, governance và reliability

| Kỹ thuật | Maturity | Cách dùng | Vị trí source | Trade-off chính |
|---|---|---|---|---|
| Retrieved-content/data boundary | Implemented | Nội dung KB không được xem là instruction | `kb/shared/standards/security.md`, `AGENTS.md` | Model vẫn cần guardrails |
| Source allowlist + trust tier | Implemented | Registry phân authority/sensitivity | `kb/sources/registry.json`, `governance/source-trust-policy.json` | Nguồn mới phải review |
| Quarantine/promotion queue | Implemented | Chặn poison đi thẳng vào canonical | `kb/memory/promotion-queue/`, `.agents/skills/kb-curator/` | Tăng moderation workload |
| Permission-aware retrieval | Implemented as adapter | Filter trusted scope/sensitivity/status/time/source trước scoring và sau vector search | `integrations/langchain_rag/security.py`, `integrations/langchain_rag/retrieval.py` | Provider filter cần mapping riêng |
| Tenant/project isolation | Implemented as filter | Access context fail-closed theo scope; shared phải được cấp rõ | `integrations/langchain_rag/models.py`, `integrations/langchain_rag/security.py` | Production vẫn nên tách index khi risk yêu cầu |
| Sensitivity labels | Implemented | `public/internal/confidential/restricted` | `kb/schemas/knowledge.schema.json`, `kb/shared/standards/security.md` | Classification có thể sai |
| Structured outputs between agents | Implemented as contract | Giảm injection qua free-form handoff | `orchestration/schemas/workflow.schema.json`, `.agents/skills/kb-orchestrator/references/orchestration-contract.md` | Schema evolution |
| Least-privilege tools | Implemented as policy | Specialist chỉ có capability cần thiết | `kb/shared/standards/security.md`, `orchestration/policy.json` | Tool setup phức tạp |
| Human approval for high impact | Implemented as policy | Migration, deploy, external writes | `orchestration/policy.json`, `scripts/kb.py`, trường `required_authorities` trong workflow | Giảm autonomy |
| Threat modeling | Implemented | `governance/threat-model.md` | `governance/threat-model.md`, `governance/risk-register.json` | Cần refresh định kỳ |
| Prompt-injection red teaming | Implemented dataset | Direct/indirect/poisoned KB cases | `governance/red-team-cases.jsonl`, `evals/datasets/adversarial.jsonl` | Không bao phủ mọi attack |
| Immutable/auditable provenance | Blueprint | Hash và lineage của content/index/run | `kb/shared/standards/knowledge-contract.md`, `kb/shared/patterns/retrieval.md` | Storage và privacy considerations |
| Freshness SLA + stale audit | Implemented as schema/policy | `review_by`, owner, valid time | `kb/schemas/knowledge.schema.json`, `scripts/kb.py`, `kb/shared/runbooks/maintenance.md` | Cần scheduler để tự động cảnh báo |
| Graceful degradation | Implemented as policy | Correct/retry/abstain thay vì guess | `kb/shared/patterns/retrieval.md`, `orchestration/policy.json` | Có thể giảm answer rate |
| Budget/token/time stopping | Implemented as policy | Ngăn agent loop không giới hạn | `orchestration/policy.json`, trường `budget` trong workflow | Dừng sớm nếu budget đặt sai |
| Monotonic derivative classification | Implemented as policy | Derivative nhận sensitivity nghiêm nhất; summary/embedding/graph không declassify | `kb/shared/standards/security.md`, `governance/access-control.md` | Classification sai ở input lan sang derivative |
| Identity-scoped versioned cache keys | Implemented as policy | Cache key gồm identity/authority, policy/index version và validity | `governance/access-control.md`, `kb/shared/standards/security.md` | Cardinality và cache hit rate giảm |
| Privacy-minimized audit records | Implemented as policy | Trace stable IDs/reason codes thay raw sensitive query/payload | `governance/access-control.md`, `kb/shared/standards/security.md` | Điều tra sâu có thể cần protected payload store |
| Deterministic policy-as-code enforcement | Blueprint | PDP/PEP quyết định allow/deny/escalate trước retrieval/tool/write | `kb/shared/standards/policy-enforcement.md`, `kb/shared/standards/security.md` | Policy drift và enforcement availability |

## Nguồn thiết kế chính

Danh mục nguồn có machine-readable ID, URL và authority tier tại `kb/sources/registry.json`. Nguồn nền tảng gồm OpenAI Skills/Multi-agent/Agent evals/Safety, W3C PROV-O, RAG, Contextual Retrieval, RRF, ColBERTv2, SPLADE, RAPTOR, GraphRAG, Self-RAG, CRAG, RAGAS và ARES.

Nguyên tắc áp dụng xuyên suốt: kỹ thuật phức tạp không mặc nhiên tốt hơn. Hybrid retrieval + metadata + reranking là baseline; graph, hierarchy, late interaction và self-correction chỉ được bật khi corpus/query thực sự cần và eval chứng minh lợi ích sau khi tính cả latency, cost, freshness và failure modes.
