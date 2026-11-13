window.KB_TECHNIQUES = [
  {
    "id": "canonical-markdown",
    "name": "Canonical Markdown",
    "category": "knowledge",
    "maturity": "Implemented",
    "use_case": "Source of truth đọc được bởi người và model",
    "source": "kb/index.md, kb/shared/**, kb/projects/**",
    "tradeoff": "Cần kỷ luật schema",
    "flow": "Owner-approved claim → Markdown + frontmatter → validate → index dẫn xuất → retrieve có citation"
  },
  {
    "id": "stable-semantic-ids",
    "name": "Stable semantic IDs",
    "category": "knowledge",
    "maturity": "Implemented",
    "use_case": "Danh tính không phụ thuộc path",
    "source": "kb/schemas/knowledge.schema.json, scripts/kb.py",
    "tradeoff": "Cần registry và uniqueness check",
    "flow": "Tạo ID theo nghĩa → giữ ID khi rename/move → relations/index tham chiếu ID → validator chặn trùng"
  },
  {
    "id": "wiki-links-typed-relations",
    "name": "Wiki links + typed relations",
    "category": "knowledge",
    "maturity": "Implemented",
    "use_case": "Điều hướng cho người và graph adapter",
    "source": "kb/schemas/knowledge.schema.json, scripts/kb.py",
    "tradeoff": "Quan hệ phải được curate",
    "flow": "Nguồn → chuẩn hóa/provenance → Wiki links + typed relations → canonical hoặc derived artifact → validator"
  },
  {
    "id": "progressive-disclosure",
    "name": "Progressive disclosure",
    "category": "knowledge",
    "maturity": "Implemented",
    "use_case": "Catalog → page → evidence; skill → reference",
    "source": "kb/index.md, .agents/skills/*/SKILL.md",
    "tradeoff": "Có thể thiếu context nếu routing kém",
    "flow": "Nguồn → chuẩn hóa/provenance → Progressive disclosure → canonical hoặc derived artifact → validator"
  },
  {
    "id": "project-over-shared-precedence",
    "name": "Project-over-shared precedence",
    "category": "knowledge",
    "maturity": "Implemented",
    "use_case": "Local override có kiểm soát",
    "source": "kb/shared/principles/source-of-truth.md, AGENTS.md",
    "tradeoff": "Cần phát hiện conflict",
    "flow": "Nguồn → chuẩn hóa/provenance → Project-over-shared precedence → canonical hoặc derived artifact → validator"
  },
  {
    "id": "bitemporal-knowledge",
    "name": "Bitemporal knowledge",
    "category": "knowledge",
    "maturity": "Implemented",
    "use_case": "valid_* tách khỏi recorded_at",
    "source": "kb/shared/standards/knowledge-contract.md, kb/schemas/knowledge.schema.json",
    "tradeoff": "Query phức tạp hơn",
    "flow": "Fact có hiệu lực (valid time) → KB ghi nhận (recorded time) → query chọn as-of → trả đúng phiên bản"
  },
  {
    "id": "explicit-supersession",
    "name": "Explicit supersession",
    "category": "knowledge",
    "maturity": "Implemented",
    "use_case": "Giữ lịch sử thay vì overwrite",
    "source": "kb/shared/standards/knowledge-contract.md, scripts/kb.py",
    "tradeoff": "Tăng số phiên bản cần quản lý",
    "flow": "Nguồn → chuẩn hóa/provenance → Explicit supersession → canonical hoặc derived artifact → validator"
  },
  {
    "id": "w3c-prov-inspired-provenance",
    "name": "W3C PROV-inspired provenance",
    "category": "knowledge",
    "maturity": "Implemented",
    "use_case": "Source/entity/activity/agent lineage",
    "source": "kb/shared/standards/knowledge-contract.md, kb/sources/registry.json",
    "tradeoff": "Metadata overhead",
    "flow": "Nguồn → chuẩn hóa/provenance → W3C PROV-inspired provenance → canonical hoặc derived artifact → validator"
  },
  {
    "id": "authority-tiers",
    "name": "Authority tiers",
    "category": "knowledge",
    "maturity": "Implemented",
    "use_case": "Ưu tiên spec/official/source code",
    "source": "kb/sources/registry.json, governance/source-trust-policy.json",
    "tradeoff": "Authority không đồng nghĩa đúng tuyệt đối",
    "flow": "Nguồn → chuẩn hóa/provenance → Authority tiers → canonical hoặc derived artifact → validator"
  },
  {
    "id": "content-addressed-incremental-index",
    "name": "Content-addressed incremental index",
    "category": "knowledge",
    "maturity": "Blueprint",
    "use_case": "Reindex theo hash và dependency",
    "source": "kb/shared/patterns/retrieval.md",
    "tradeoff": "Phải quản lý index version",
    "flow": "Nguồn → chuẩn hóa/provenance → Content-addressed incremental index → canonical hoặc derived artifact → validator"
  },
  {
    "id": "knowledge-graph-projection",
    "name": "Knowledge graph projection",
    "category": "knowledge",
    "maturity": "Blueprint",
    "use_case": "Sinh entity/relation graph từ canonical pages",
    "source": "kb/shared/patterns/retrieval.md",
    "tradeoff": "Entity resolution và rebuild đắt",
    "flow": "Nguồn → chuẩn hóa/provenance → Knowledge graph projection → canonical hoặc derived artifact → validator"
  },
  {
    "id": "working-episodic-semantic-procedural-memory-split",
    "name": "Working/episodic/semantic/procedural memory split",
    "category": "knowledge",
    "maturity": "Implemented",
    "use_case": "Không trộn trace với facts hoặc skills",
    "source": "kb/memory/README.md, .agents/skills/**",
    "tradeoff": "Promotion pipeline thêm bước",
    "flow": "Nguồn → chuẩn hóa/provenance → Working/episodic/semantic/procedural memory split → canonical hoặc derived artifact → validator"
  },
  {
    "id": "human-reviewed-memory-promotion",
    "name": "Human-reviewed memory promotion",
    "category": "knowledge",
    "maturity": "Implemented",
    "use_case": "Queue → provenance/conflict check → canonical",
    "source": ".agents/skills/kb-curator/, orchestration/workflows/kb-curator.json",
    "tradeoff": "Chậm hơn auto-memory",
    "flow": "Trace/lesson → promotion queue → provenance/conflict/security check → owner approve → canonical"
  },
  {
    "id": "source-first-claim-ledger",
    "name": "Source-first claim ledger",
    "category": "knowledge",
    "maturity": "Implemented as workflow",
    "use_case": "Tách claim, evidence, source type, date, confidence, disagreement và inference trước synthesis",
    "source": ".agents/skills/study/references/research-protocol.md",
    "tradeoff": "Tốn công với nghiên cứu nhỏ",
    "flow": "Nguồn → chuẩn hóa/provenance → Source-first claim ledger → canonical hoặc derived artifact → validator"
  },
  {
    "id": "validate-before-index-fail-closed",
    "name": "Validate-before-index fail-closed",
    "category": "knowledge",
    "maturity": "Implemented",
    "use_case": "Từ chối index canonical repository đang invalid",
    "source": "integrations/langchain_rag/canonical.py, scripts/kb.py",
    "tradeoff": "Một lỗi metadata có thể chặn toàn batch",
    "flow": "Nguồn → chuẩn hóa/provenance → Validate-before-index fail-closed → canonical hoặc derived artifact → validator"
  },
  {
    "id": "rdf-json-ld-graph-projection-shacl",
    "name": "RDF/JSON-LD graph projection + SHACL",
    "category": "knowledge",
    "maturity": "Blueprint",
    "use_case": "Chiếu typed relations sang graph chuẩn và validate graph-specific invariants",
    "source": "kb/shared/patterns/knowledge-graph-and-provenance.md, kb/sources/registry.json",
    "tradeoff": "Mapping/round-trip và shape governance phức tạp",
    "flow": "Nguồn → chuẩn hóa/provenance → RDF/JSON-LD graph projection + SHACL → canonical hoặc derived artifact → validator"
  },
  {
    "id": "cryptographic-provenance-attestations",
    "name": "Cryptographic provenance attestations",
    "category": "knowledge",
    "maturity": "Blueprint",
    "use_case": "Ký subject digest, builder/source identity và input lineage cho index/report/release",
    "source": "kb/shared/patterns/knowledge-graph-and-provenance.md, kb/sources/registry.json",
    "tradeoff": "Key rotation, revocation và trust-root operations",
    "flow": "Nguồn → chuẩn hóa/provenance → Cryptographic provenance attestations → canonical hoặc derived artifact → validator"
  },
  {
    "id": "exact-deletion-tombstones",
    "name": "Exact deletion + tombstones",
    "category": "knowledge",
    "maturity": "Blueprint",
    "use_case": "Propagate authorized erasure qua canonical copy và mọi derived artifact",
    "source": "kb/shared/patterns/knowledge-graph-and-provenance.md, kb/shared/standards/knowledge-contract.md",
    "tradeoff": "Xung đột retention/legal hold và audit history",
    "flow": "Nguồn → chuẩn hóa/provenance → Exact deletion + tombstones → canonical hoặc derived artifact → validator"
  },
  {
    "id": "structure-aware-chunking",
    "name": "Structure-aware chunking",
    "category": "retrieval",
    "maturity": "Implemented",
    "use_case": "Chia theo heading/blank block, giữ fenced code nguyên khối và gắn parent locator",
    "source": "integrations/langchain_rag/canonical.py, kb/shared/patterns/retrieval.md",
    "tradeoff": "Block quá lớn được giữ nguyên thay vì cắt mù",
    "flow": "Query → ACL/time filter → Structure-aware chunking → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "parent-child-chunks",
    "name": "Parent-child chunks",
    "category": "retrieval",
    "maturity": "Blueprint",
    "use_case": "Retrieve nhỏ, pack parent context",
    "source": "kb/shared/patterns/retrieval.md",
    "tradeoff": "Dễ tăng token context",
    "flow": "Query → ACL/time filter → Parent-child chunks → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "contextual-chunking",
    "name": "Contextual chunking",
    "category": "retrieval",
    "maturity": "Blueprint",
    "use_case": "Thêm ngữ cảnh document vào chunk trước index",
    "source": "kb/shared/patterns/retrieval.md, kb/sources/registry.json",
    "tradeoff": "Chi phí index và summary drift",
    "flow": "Query → ACL/time filter → Contextual chunking → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "late-chunking",
    "name": "Late Chunking",
    "category": "retrieval",
    "maturity": "Experimental",
    "use_case": "Encode long document trước rồi pool thành contextual chunk vectors",
    "source": "kb/shared/patterns/retrieval.md, kb/sources/registry.json",
    "tradeoff": "Long-context compute và context bleed",
    "flow": "Query → ACL/time filter → Late Chunking → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "deterministic-content-hashed-chunk-ids",
    "name": "Deterministic content-hashed chunk IDs",
    "category": "retrieval",
    "maturity": "Implemented",
    "use_case": "SHA-256 page ID + heading + content giữ chunk identity ổn định và dedupe được",
    "source": "integrations/langchain_rag/canonical.py, tests/test_langchain_rag.py",
    "tradeoff": "Content edit chủ đích tạo ID mới",
    "flow": "Query → ACL/time filter → Deterministic content-hashed chunk IDs → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "bm25-lexical-retrieval",
    "name": "BM25 / lexical retrieval",
    "category": "retrieval",
    "maturity": "Implemented",
    "use_case": "scripts/kb.py search là offline baseline",
    "source": "scripts/kb.py (rank_pages, command_search)",
    "tradeoff": "Kém paraphrase",
    "flow": "Query → ACL/time filter → BM25 / lexical retrieval → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "dense-embedding-retrieval",
    "name": "Dense embedding retrieval",
    "category": "retrieval",
    "maturity": "Implemented as adapter",
    "use_case": "LangChain-compatible vector store cung cấp dense candidates",
    "source": "integrations/langchain_rag/langchain_adapter.py, integrations/langchain_rag/retrieval.py",
    "tradeoff": "Cần chọn embedding/vector backend riêng",
    "flow": "Query → ACL/time filter → Dense embedding retrieval → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "hybrid-sparse-dense",
    "name": "Hybrid sparse+dense",
    "category": "retrieval",
    "maturity": "Implemented as adapter",
    "use_case": "BM25 và dense chạy song song, post-filter rồi fuse",
    "source": "integrations/langchain_rag/retrieval.py",
    "tradeoff": "Hai index cần vận hành",
    "flow": "Query → BM25 và vector search song song → post-filter ACL → RRF → rerank → evidence pack"
  },
  {
    "id": "reciprocal-rank-fusion",
    "name": "Reciprocal Rank Fusion",
    "category": "retrieval",
    "maturity": "Implemented",
    "use_case": "Hợp nhất ranking không cần calibrate score",
    "source": "integrations/langchain_rag/retrieval.py, kb/sources/registry.json",
    "tradeoff": "Không học domain weights",
    "flow": "Hai ranking độc lập → đổi rank thành 1/(k+rank) → cộng theo chunk ID → sort → top evidence"
  },
  {
    "id": "langchain-document-vector-store-bridge",
    "name": "LangChain Document/vector-store bridge",
    "category": "retrieval",
    "maturity": "Implemented as adapter",
    "use_case": "Chuyển canonical chunks sang Document, add/search qua vector-store interface",
    "source": "integrations/langchain_rag/langchain_adapter.py",
    "tradeoff": "Filter syntax vẫn phụ thuộc provider",
    "flow": "Query → ACL/time filter → LangChain Document/vector-store bridge → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "2-step-rag-execution-graph",
    "name": "2-Step RAG execution graph",
    "category": "retrieval",
    "maturity": "Implemented as adapter",
    "use_case": "Retrieve → answer → independent verify với model do runtime owner cấp",
    "source": "integrations/langchain_rag/graph.py",
    "tradeoff": "Chưa kèm model/provider mặc định",
    "flow": "Trusted access context → retrieve → evidence envelope → model answer → verifier → pass/abstain"
  },
  {
    "id": "agentic-retrieval-tool-with-frozen-authority",
    "name": "Agentic retrieval tool with frozen authority",
    "category": "retrieval",
    "maturity": "Implemented as adapter",
    "use_case": "Agent chọn query nhưng không tự mở rộng ACL/scope",
    "source": "integrations/langchain_rag/langchain_adapter.py",
    "tradeoff": "Access context phải do trusted caller cấp",
    "flow": "Query → ACL/time filter → Agentic retrieval tool with frozen authority → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "learned-sparse-retrieval-splade",
    "name": "Learned sparse retrieval/SPLADE",
    "category": "retrieval",
    "maturity": "Experimental",
    "use_case": "Semantic expansion nhưng vẫn inverted index",
    "source": "kb/shared/patterns/retrieval.md, kb/sources/registry.json",
    "tradeoff": "Model/index phức tạp",
    "flow": "Query → ACL/time filter → Learned sparse retrieval/SPLADE → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "cross-encoder-reranking",
    "name": "Cross-encoder reranking",
    "category": "retrieval",
    "maturity": "Blueprint",
    "use_case": "Rerank candidate set nhỏ",
    "source": "kb/shared/patterns/retrieval.md",
    "tradeoff": "Latency runtime",
    "flow": "Query → ACL/time filter → Cross-encoder reranking → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "colbert-late-interaction",
    "name": "ColBERT late interaction",
    "category": "retrieval",
    "maturity": "Experimental",
    "use_case": "Token-level matching chính xác hơn",
    "source": "kb/shared/patterns/retrieval.md, kb/sources/registry.json",
    "tradeoff": "Storage và index lớn",
    "flow": "Query → ACL/time filter → ColBERT late interaction → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "mmr-diversity-selection",
    "name": "MMR/diversity selection",
    "category": "retrieval",
    "maturity": "Blueprint",
    "use_case": "Giảm chunk trùng lặp",
    "source": "kb/shared/patterns/retrieval.md",
    "tradeoff": "Có thể hy sinh relevance thuần",
    "flow": "Query → ACL/time filter → MMR/diversity selection → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "query-routing",
    "name": "Query routing",
    "category": "retrieval",
    "maturity": "Blueprint",
    "use_case": "Local fact/hierarchy/graph/web theo intent",
    "source": "kb/shared/patterns/retrieval.md",
    "tradeoff": "Router sai gây recall loss",
    "flow": "Query → ACL/time filter → Query routing → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "query-decomposition",
    "name": "Query decomposition",
    "category": "retrieval",
    "maturity": "Blueprint",
    "use_case": "Chia multi-constraint/multi-hop query",
    "source": "kb/shared/patterns/retrieval.md",
    "tradeoff": "Tăng latency và merge complexity",
    "flow": "Query → ACL/time filter → Query decomposition → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "multi-query-retrieval",
    "name": "Multi-query retrieval",
    "category": "retrieval",
    "maturity": "Experimental",
    "use_case": "Nhiều paraphrase rồi fusion",
    "source": "kb/shared/patterns/retrieval.md",
    "tradeoff": "Query drift và chi phí",
    "flow": "Query → ACL/time filter → Multi-query retrieval → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "hyde",
    "name": "HyDE",
    "category": "retrieval",
    "maturity": "Experimental",
    "use_case": "Hypothetical answer làm retrieval query",
    "source": "kb/shared/patterns/retrieval.md",
    "tradeoff": "Hallucinated query features",
    "flow": "Query → ACL/time filter → HyDE → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "raptor",
    "name": "RAPTOR",
    "category": "retrieval",
    "maturity": "Experimental",
    "use_case": "Summary tree cho long-document/global QA",
    "source": "kb/shared/patterns/retrieval.md, kb/sources/registry.json",
    "tradeoff": "Index đắt, summary distortion",
    "flow": "Query → ACL/time filter → RAPTOR → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "graphrag-local-global",
    "name": "GraphRAG local/global",
    "category": "retrieval",
    "maturity": "Experimental",
    "use_case": "Multi-hop và corpus-level questions",
    "source": "kb/shared/patterns/retrieval.md, kb/sources/registry.json",
    "tradeoff": "Extraction/entity resolution đắt",
    "flow": "Query multi-hop/global → entity/relation graph → neighborhood/community expansion → source leaves → answer"
  },
  {
    "id": "hipporag-2-graph-memory",
    "name": "HippoRAG 2 graph memory",
    "category": "retrieval",
    "maturity": "Experimental",
    "use_case": "Factual, associative và multi-hop retrieval bằng passage/graph/PageRank",
    "source": "kb/shared/patterns/retrieval.md, kb/sources/registry.json",
    "tradeoff": "Graph poisoning, freshness và entity resolution",
    "flow": "Query → ACL/time filter → HippoRAG 2 graph memory → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "lightrag-literag-graph-retrieval-family",
    "name": "LightRAG/LiteRAG graph retrieval family",
    "category": "retrieval",
    "maturity": "Experimental",
    "use_case": "Dual-level hoặc algorithmic graph exploration nhằm giảm token/latency",
    "source": "kb/shared/patterns/retrieval.md, kb/sources/registry.json",
    "tradeoff": "Hai biến thể khác nhau, phải benchmark ngang baseline",
    "flow": "Query → ACL/time filter → LightRAG/LiteRAG graph retrieval family → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "visual-rag-with-colpali",
    "name": "Visual RAG with ColPali",
    "category": "retrieval",
    "maturity": "Experimental",
    "use_case": "Retrieve trực tiếp page image/layout/table/figure bằng multi-vector late interaction",
    "source": "kb/shared/patterns/retrieval.md, kb/sources/registry.json",
    "tradeoff": "Visual PII, storage lớn và region citation",
    "flow": "Query → ACL/time filter → Visual RAG with ColPali → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "matryoshka-multi-resolution-embeddings",
    "name": "Matryoshka multi-resolution embeddings",
    "category": "retrieval",
    "maturity": "Experimental",
    "use_case": "Coarse dimensions cho candidate search, full dimensions cho rerank",
    "source": "kb/shared/patterns/retrieval.md, kb/sources/registry.json",
    "tradeoff": "Model/dimension coupling và recall trade-off",
    "flow": "Query → ACL/time filter → Matryoshka multi-resolution embeddings → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "adaptive-retrieval-self-rag-pattern",
    "name": "Adaptive retrieval / Self-RAG pattern",
    "category": "retrieval",
    "maturity": "Experimental",
    "use_case": "Chỉ retrieve khi cần, critique support",
    "source": "kb/shared/patterns/retrieval.md, kb/sources/registry.json",
    "tradeoff": "Cần model/training hoặc controller đáng tin",
    "flow": "Query → ACL/time filter → Adaptive retrieval / Self-RAG pattern → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "corrective-rag-pattern",
    "name": "Corrective RAG pattern",
    "category": "retrieval",
    "maturity": "Experimental",
    "use_case": "Grade retrieval rồi retry/switch/abstain",
    "source": "kb/shared/patterns/retrieval.md, kb/sources/registry.json",
    "tradeoff": "Judge lỗi có thể khuếch đại lỗi",
    "flow": "Query → ACL/time filter → Corrective RAG pattern → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "claim-level-evidence-packing",
    "name": "Claim-level evidence packing",
    "category": "retrieval",
    "maturity": "Implemented",
    "use_case": "Evidence envelope giữ chunk/page/source/locator và trust boundary",
    "source": "integrations/langchain_rag/runtime.py, kb/shared/standards/knowledge-contract.md",
    "tradeoff": "Token và implementation overhead",
    "flow": "Query → ACL/time filter → Claim-level evidence packing → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "evidence-conflict-detection",
    "name": "Evidence conflict detection",
    "category": "retrieval",
    "maturity": "Blueprint",
    "use_case": "Hiển thị mâu thuẫn thay vì chọn im lặng",
    "source": "kb/shared/patterns/retrieval.md, kb/shared/principles/source-of-truth.md",
    "tradeoff": "Cần temporal/authority policy",
    "flow": "Query → ACL/time filter → Evidence conflict detection → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "evidence-aware-abstention",
    "name": "Evidence-aware abstention",
    "category": "retrieval",
    "maturity": "Implemented as policy",
    "use_case": "Thiếu/mâu thuẫn evidence thì dừng",
    "source": "kb/shared/principles/source-of-truth.md, kb/shared/patterns/retrieval.md",
    "tradeoff": "Coverage thấp hơn nhưng an toàn hơn",
    "flow": "Query → ACL/time filter → Evidence-aware abstention → evidence có locator → answer hoặc abstain"
  },
  {
    "id": "manager-agents-as-tools",
    "name": "Manager + agents-as-tools",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "Manager giữ scope, integration và final answer",
    "source": ".agents/skills/kb-orchestrator/, kb/shared/patterns/agent-orchestration.md",
    "tradeoff": "Manager có thể thành bottleneck",
    "flow": "Manager giữ intent → gọi specialist có scope hẹp → nhận structured result → integrate → trả lời cuối"
  },
  {
    "id": "langgraph-typed-shared-state",
    "name": "LangGraph typed shared state",
    "category": "agents",
    "maturity": "Implemented as adapter",
    "use_case": "Agent chia sẻ evidence/result qua typed channels thay vì prompt toàn cục",
    "source": "integrations/langchain_rag/context.py, integrations/langchain_rag/graph.py",
    "tradeoff": "State schema phải evolve có version",
    "flow": "Intent → task contract/DAG → LangGraph typed shared state → integrate tuần tự → independent verification"
  },
  {
    "id": "deduplicating-context-reducers",
    "name": "Deduplicating context reducers",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "Merge evidence/result theo stable contract ID",
    "source": "integrations/langchain_rag/context.py",
    "tradeoff": "Cần định nghĩa merge semantics cho field mới",
    "flow": "Intent → task contract/DAG → Deduplicating context reducers → integrate tuần tự → independent verification"
  },
  {
    "id": "least-privilege-context-projection",
    "name": "Least-privilege context projection",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "Researcher/implementer/reviewer/verifier chỉ thấy field cần thiết",
    "source": "integrations/langchain_rag/context.py",
    "tradeoff": "Role mới cần explicit field policy",
    "flow": "Intent → task contract/DAG → Least-privilege context projection → integrate tuần tự → independent verification"
  },
  {
    "id": "intent-based-skill-routing",
    "name": "Intent-based skill routing",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "9 description phân biệt rõ workflow",
    "source": ".agents/skills/*/SKILL.md, evals/datasets/skill-routing.jsonl",
    "tradeoff": "Metadata phải được eval",
    "flow": "Intent → task contract/DAG → Intent-based skill routing → integrate tuần tự → independent verification"
  },
  {
    "id": "progressive-skill-disclosure",
    "name": "Progressive skill disclosure",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "Chỉ nạp SKILL.md/reference cần thiết",
    "source": ".agents/skills/*/SKILL.md, .agents/skills/*/references/",
    "tradeoff": "Reference link phải đúng",
    "flow": "Intent → task contract/DAG → Progressive skill disclosure → integrate tuần tự → independent verification"
  },
  {
    "id": "dependency-dag",
    "name": "Dependency DAG",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "Workflow JSON + cycle/dependency checks",
    "source": "orchestration/workflows/**, scripts/kb.py (validate_workflow_data)",
    "tradeoff": "Planning overhead với task nhỏ",
    "flow": "Tách task thành nodes → khai báo depends_on/read/write → topo waves → execute → join"
  },
  {
    "id": "topological-execution-waves",
    "name": "Topological execution waves",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "Chạy node ready và conflict-free",
    "source": "scripts/kb.py (compile_fanout_plan), orchestration/policy.json",
    "tradeoff": "Cần state tracking runtime",
    "flow": "Intent → task contract/DAG → Topological execution waves → integrate tuần tự → independent verification"
  },
  {
    "id": "machine-readable-hierarchical-fan-out-join",
    "name": "Machine-readable hierarchical fan-out/join",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "Project → epic → story bằng subworkflow, completion barrier và bounded concurrency",
    "source": "orchestration/workflows/bmad-project.json, orchestration/workflows/bmad-epic.json, orchestration/workflows/bmad-story.json, orchestration/schemas/work-item-inventory.schema.json, scripts/kb.py",
    "tradeoff": "Runtime phải cấp inventory/write scope đúng contract",
    "flow": "Inventory JSON → validate dependency/write scope → fan-out subworkflows → all-accepted join → integrate"
  },
  {
    "id": "read-write-set-conflict-detection",
    "name": "Read/write-set conflict detection",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "Validator chặn overlapping writes trong một wave",
    "source": "scripts/kb.py (write_patterns_overlap, validate_work_item_inventory)",
    "tradeoff": "Glob pattern chỉ là approximation",
    "flow": "Hai node ready → so static write prefixes/resources/locks → conflict thì tuần tự, không conflict thì song song"
  },
  {
    "id": "parallel-read-only-specialist-lenses",
    "name": "Parallel read-only specialist lenses",
    "category": "agents",
    "maturity": "Implemented as workflow",
    "use_case": "Review/research độc lập rồi dedupe",
    "source": "orchestration/workflows/review-code.json, orchestration/workflows/review-doc.json, orchestration/workflows/study.json, orchestration/workflows/bmad-project.json",
    "tradeoff": "Có thể lặp evidence",
    "flow": "Intent → task contract/DAG → Parallel read-only specialist lenses → integrate tuần tự → independent verification"
  },
  {
    "id": "sequential-integration-gates",
    "name": "Sequential integration gates",
    "category": "agents",
    "maturity": "Implemented as policy",
    "use_case": "Merge/migration/approval/verify không chạy song song",
    "source": "orchestration/policy.json, kb/shared/patterns/agent-orchestration.md",
    "tradeoff": "Tăng elapsed time",
    "flow": "Intent → task contract/DAG → Sequential integration gates → integrate tuần tự → independent verification"
  },
  {
    "id": "integration-before-system-verification",
    "name": "Integration-before-system-verification",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "Join mọi unit accepted, merge tuần tự, chạy integration checks rồi mới verify",
    "source": "orchestration/workflows/bmad-epic.json, orchestration/workflows/bmad-project.json, scripts/kb.py",
    "tradeoff": "Integration vẫn có thể phát hiện lỗi muộn",
    "flow": "Intent → task contract/DAG → Integration-before-system-verification → integrate tuần tự → independent verification"
  },
  {
    "id": "isolated-worktree-branch-and-merge",
    "name": "Isolated worktree branch-and-merge",
    "category": "agents",
    "maturity": "Blueprint",
    "use_case": "Parallel implementation khi write scope disjoint",
    "source": "kb/shared/patterns/agent-orchestration.md, orchestration/workflows/bmad-story.json",
    "tradeoff": "Merge và environment cost",
    "flow": "Intent → task contract/DAG → Isolated worktree branch-and-merge → integrate tuần tự → independent verification"
  },
  {
    "id": "structured-inter-agent-contracts",
    "name": "Structured inter-agent contracts",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "Objective/input/output/evidence/stop",
    "source": ".agents/skills/kb-orchestrator/references/orchestration-contract.md, orchestration/schemas/workflow.schema.json",
    "tradeoff": "Hợp đồng tệ vẫn cho kết quả tệ",
    "flow": "Intent → task contract/DAG → Structured inter-agent contracts → integrate tuần tự → independent verification"
  },
  {
    "id": "bounded-concurrency",
    "name": "Bounded concurrency",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "Default 3 specialist, override theo risk",
    "source": "orchestration/policy.json, trường budget/fanout.max_concurrency trong workflow",
    "tradeoff": "Không luôn tối ưu throughput",
    "flow": "Intent → task contract/DAG → Bounded concurrency → integrate tuần tự → independent verification"
  },
  {
    "id": "bounded-retry-reconciliation",
    "name": "Bounded retry + reconciliation",
    "category": "agents",
    "maturity": "Implemented as policy",
    "use_case": "Retry transient unfinished node sau state check",
    "source": "orchestration/policy.json, trường retry trong workflow",
    "tradeoff": "Phải phân loại lỗi đúng",
    "flow": "Intent → task contract/DAG → Bounded retry + reconciliation → integrate tuần tự → independent verification"
  },
  {
    "id": "idempotency-aware-side-effects",
    "name": "Idempotency-aware side effects",
    "category": "agents",
    "maturity": "Implemented as policy",
    "use_case": "Không replay side effect đã thành công",
    "source": "orchestration/schemas/workflow.schema.json, scripts/kb.py, orchestration/policy.json",
    "tradeoff": "Cần idempotency key/audit",
    "flow": "Intent → task contract/DAG → Idempotency-aware side effects → integrate tuần tự → independent verification"
  },
  {
    "id": "evidence-gated-completion",
    "name": "Evidence-gated completion",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "Không claim done khi thiếu observed proof",
    "source": "trường acceptance/completion_contract trong orchestration/workflows/**",
    "tradeoff": "Có thể để trạng thái blocked lâu hơn",
    "flow": "Intent → task contract/DAG → Evidence-gated completion → integrate tuần tự → independent verification"
  },
  {
    "id": "role-specific-approval-authorities",
    "name": "Role-specific approval authorities",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "High-risk human gate nêu product/architecture/security/privacy/ops owner áp dụng",
    "source": "orchestration/policy.json, scripts/kb.py, required_authorities trong workflow",
    "tradeoff": "Cần mapping vai trò theo từng tổ chức",
    "flow": "Intent → task contract/DAG → Role-specific approval authorities → integrate tuần tự → independent verification"
  },
  {
    "id": "independent-verifier-critic",
    "name": "Independent verifier/critic",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "$verify-delivery không tự sửa",
    "source": ".agents/skills/verify-delivery/, scripts/kb.py, workflow verify-delivery nodes",
    "tradeoff": "Thêm cost và latency",
    "flow": "Intent → task contract/DAG → Independent verifier/critic → integrate tuần tự → independent verification"
  },
  {
    "id": "handoff-only-for-ownership-transfer",
    "name": "Handoff only for ownership transfer",
    "category": "agents",
    "maturity": "Implemented as policy",
    "use_case": "Specialist không chiếm final response mặc định",
    "source": ".agents/skills/kb-orchestrator/SKILL.md, AGENTS.md",
    "tradeoff": "Manager phải tổng hợp tốt",
    "flow": "Intent → task contract/DAG → Handoff only for ownership transfer → integrate tuần tự → independent verification"
  },
  {
    "id": "trace-based-workflow-evaluation",
    "name": "Trace-based workflow evaluation",
    "category": "agents",
    "maturity": "Blueprint",
    "use_case": "Chấm routing/tool/handoff, không chỉ output",
    "source": "kb/shared/standards/evaluation.md, evals/rubrics/workflow.md",
    "tradeoff": "Cần trace backend hoặc JSONL adapter",
    "flow": "Intent → task contract/DAG → Trace-based workflow evaluation → integrate tuần tự → independent verification"
  },
  {
    "id": "bmad-compatible-right-sized-planning",
    "name": "BMAD-compatible right-sized planning",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "Direct bypass/quick/epic/project theo intent, risk và coordination",
    "source": ".agents/skills/bmad-adapter/, kb/shared/patterns/bmad-delivery.md",
    "tradeoff": "Path classification sai có thể thừa hoặc thiếu process",
    "flow": "Classify Direct/Quick/Epic/Project → tạo artifact tối thiểu → readiness → build → verify/retro"
  },
  {
    "id": "anti-ceremony-direct-bypass",
    "name": "Anti-ceremony direct bypass",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "Local low-risk edit route thẳng đến specialist, không tạo BMAD artifact",
    "source": ".agents/skills/bmad-adapter/SKILL.md, .agents/skills/bmad-adapter/references/planning-paths.md",
    "tradeoff": "Phải escalate khi phát hiện quyết định/rủi ro mới",
    "flow": "Intent → task contract/DAG → Anti-ceremony direct bypass → integrate tuần tự → independent verification"
  },
  {
    "id": "requirement-epic-story-traceability",
    "name": "Requirement → epic → story traceability",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "Stable IDs, coverage, dependency và integrated checks",
    "source": "kb/projects/_template/delivery/, orchestration/workflows/bmad-*.json",
    "tradeoff": "Cần maintain khi scope đổi",
    "flow": "Intent → task contract/DAG → Requirement → epic → story traceability → integrate tuần tự → independent verification"
  },
  {
    "id": "implementation-readiness-gate",
    "name": "Implementation readiness gate",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "Read-only PASS/CONCERNS/FAIL trước build",
    "source": "kb/projects/_template/delivery/readiness-review-template.md, orchestration/workflows/bmad-*.json",
    "tradeoff": "Gate tệ có thể thành ceremony",
    "flow": "Artifact versions → coverage/dependency/risk checks → PASS/CONCERNS/FAIL → owner disposition"
  },
  {
    "id": "bounded-story-build",
    "name": "Bounded story build",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "Một story/một session; parallel chỉ khi isolated/disjoint",
    "source": "orchestration/workflows/bmad-story.json, kb/projects/_template/delivery/story-inventory.template.json",
    "tradeoff": "Integration vẫn là sequential gate",
    "flow": "Intent → task contract/DAG → Bounded story build → integrate tuần tự → independent verification"
  },
  {
    "id": "evidence-backed-retrospective",
    "name": "Evidence-backed retrospective",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "Giữ unfinished work, deviations, follow-up và lesson candidates",
    "source": "kb/memory/episodic/retrospective-template.md, orchestration/workflows/bmad-epic.json, orchestration/workflows/bmad-project.json",
    "tradeoff": "Không tự động chứng minh quan hệ nhân quả",
    "flow": "Intent → task contract/DAG → Evidence-backed retrospective → integrate tuần tự → independent verification"
  },
  {
    "id": "bmad-official-runtime-boundary",
    "name": "BMAD official-runtime boundary",
    "category": "agents",
    "maturity": "Implemented",
    "use_case": "Adapter không copy _bmad/, personas hoặc preview layout",
    "source": ".agents/skills/bmad-adapter/SKILL.md, kb/shared/patterns/bmad-delivery.md",
    "tradeoff": "Không tương thích file-for-file với official distribution",
    "flow": "Intent → task contract/DAG → BMAD official-runtime boundary → integrate tuần tự → independent verification"
  },
  {
    "id": "impact-aware-change-contract",
    "name": "Impact-aware change contract",
    "category": "agents",
    "maturity": "Implemented as contract",
    "use_case": "Freeze current/desired state, non-goals, impact, migration, rollout/rollback và acceptance trước code",
    "source": ".agents/skills/change-request/SKILL.md, .agents/skills/change-request/references/change-contract.md",
    "tradeoff": "Planning overhead cho change nhỏ",
    "flow": "Intent → task contract/DAG → Impact-aware change contract → integrate tuần tự → independent verification"
  },
  {
    "id": "smallest-coherent-change-targeted-to-broad-checks",
    "name": "Smallest coherent change + targeted-to-broad checks",
    "category": "agents",
    "maturity": "Implemented as workflow",
    "use_case": "Sửa phạm vi nhỏ nhất rồi chạy focused checks trước broader suite",
    "source": ".agents/skills/gen-code/SKILL.md, .agents/skills/gen-code/references/delivery-contract.md",
    "tradeoff": "Có thể bỏ sót coupling ngoài phạm vi nếu impact analysis kém",
    "flow": "Intent → task contract/DAG → Smallest coherent change + targeted-to-broad checks → integrate tuần tự → independent verification"
  },
  {
    "id": "risk-ordered-evidence-based-code-review",
    "name": "Risk-ordered evidence-based code review",
    "category": "agents",
    "maturity": "Implemented as workflow",
    "use_case": "Review correctness/data/security trước style, finding có condition/impact/evidence",
    "source": ".agents/skills/review-code/SKILL.md, .agents/skills/review-code/references/review-rubric.md",
    "tradeoff": "Reviewer vẫn có thể bỏ sót path hiếm",
    "flow": "Intent → task contract/DAG → Risk-ordered evidence-based code review → integrate tuần tự → independent verification"
  },
  {
    "id": "multidimensional-documentation-review",
    "name": "Multidimensional documentation review",
    "category": "agents",
    "maturity": "Implemented as workflow",
    "use_case": "Audit accuracy, provenance, freshness, navigation, accessibility và ownership",
    "source": ".agents/skills/review-doc/SKILL.md, .agents/skills/review-doc/references/doc-rubric.md",
    "tradeoff": "Cần source of truth rõ để kết luận",
    "flow": "Intent → task contract/DAG → Multidimensional documentation review → integrate tuần tự → independent verification"
  },
  {
    "id": "mcp-tool-resource-interoperability",
    "name": "MCP tool/resource interoperability",
    "category": "agents",
    "maturity": "Blueprint",
    "use_case": "Chuẩn hóa agent-to-tool/data với capability/version/auth boundary",
    "source": "kb/shared/patterns/interoperable-agent-runtime.md, kb/shared/standards/policy-enforcement.md",
    "tradeoff": "Remote server mở thêm supply-chain và injection surface",
    "flow": "Intent → task contract/DAG → MCP tool/resource interoperability → integrate tuần tự → independent verification"
  },
  {
    "id": "a2a-remote-agent-interoperability",
    "name": "A2A remote-agent interoperability",
    "category": "agents",
    "maturity": "Blueprint",
    "use_case": "Discover capability và quản lý remote agent task mà không chia sẻ internal state",
    "source": "kb/shared/patterns/interoperable-agent-runtime.md",
    "tradeoff": "Identity, artifact integrity và cancellation phức tạp",
    "flow": "Intent → task contract/DAG → A2A remote-agent interoperability → integrate tuần tự → independent verification"
  },
  {
    "id": "durable-event-sourced-agent-execution",
    "name": "Durable event-sourced agent execution",
    "category": "agents",
    "maturity": "Blueprint",
    "use_case": "Resume workflow sau crash/wait mà không replay committed effect",
    "source": "kb/shared/patterns/interoperable-agent-runtime.md, kb/shared/patterns/agent-orchestration.md",
    "tradeoff": "Workflow versioning và history storage",
    "flow": "Intent → task contract/DAG → Durable event-sourced agent execution → integrate tuần tự → independent verification"
  },
  {
    "id": "executable-saga-compensation",
    "name": "Executable Saga compensation",
    "category": "agents",
    "maturity": "Blueprint",
    "use_case": "Compensate/reconcile external side effects theo reverse commit order",
    "source": "kb/shared/patterns/interoperable-agent-runtime.md",
    "tradeoff": "Không phải effect nào cũng đảo ngược được",
    "flow": "Intent → task contract/DAG → Executable Saga compensation → integrate tuần tự → independent verification"
  },
  {
    "id": "opentelemetry-genai-trace-profile",
    "name": "OpenTelemetry GenAI trace profile",
    "category": "agents",
    "maturity": "Blueprint",
    "use_case": "Portable spans cho model, retrieval, agent, workflow và tool",
    "source": "kb/shared/patterns/interoperable-agent-runtime.md, kb/shared/standards/evaluation.md",
    "tradeoff": "Semantic conventions evolve và trace có thể leak content",
    "flow": "Intent → task contract/DAG → OpenTelemetry GenAI trace profile → integrate tuần tự → independent verification"
  },
  {
    "id": "schema-constrained-decoding",
    "name": "Schema-constrained decoding",
    "category": "agents",
    "maturity": "Blueprint",
    "use_case": "Enforce JSON Schema khi sinh output, sau đó vẫn validate semantics/authority",
    "source": "kb/shared/standards/policy-enforcement.md, kb/sources/registry.json",
    "tradeoff": "Provider coupling và schema-compliant output vẫn có thể sai nghĩa",
    "flow": "Intent → task contract/DAG → Schema-constrained decoding → integrate tuần tự → independent verification"
  },
  {
    "id": "golden-queries",
    "name": "Golden queries",
    "category": "evaluation",
    "maturity": "Implemented",
    "use_case": "JSONL dataset versioned theo project",
    "source": "evals/datasets/golden.jsonl, kb/evals/README.md",
    "tradeoff": "Tốn công label",
    "flow": "Câu hỏi thật + relevant pages/claims → chạy candidate → score → regression gate"
  },
  {
    "id": "sealed-holdout",
    "name": "Sealed holdout",
    "category": "evaluation",
    "maturity": "Implemented as governance",
    "use_case": "Chống tối ưu quá mức vào golden set",
    "source": "kb/shared/standards/evaluation.md, evals/datasets/holdout.example.jsonl",
    "tradeoff": "Feedback loop chậm hơn",
    "flow": "Trace/output → dataset/rubric → Sealed holdout → release decision → promote hoặc rollback"
  },
  {
    "id": "adversarial-red-team-set",
    "name": "Adversarial/red-team set",
    "category": "evaluation",
    "maturity": "Implemented",
    "use_case": "Injection, poisoning, ACL leak, exfiltration",
    "source": "governance/red-team-cases.jsonl, evals/datasets/adversarial.jsonl",
    "tradeoff": "Phải cập nhật threat landscape",
    "flow": "Trace/output → dataset/rubric → Adversarial/red-team set → release decision → promote hoặc rollback"
  },
  {
    "id": "retrieval-metrics",
    "name": "Retrieval metrics",
    "category": "evaluation",
    "maturity": "Blueprint",
    "use_case": "Recall@k, Precision@k, MRR, nDCG",
    "source": "kb/shared/standards/evaluation.md, evals/rubrics/",
    "tradeoff": "Cần relevance judgments",
    "flow": "Trace/output → dataset/rubric → Retrieval metrics → release decision → promote hoặc rollback"
  },
  {
    "id": "multi-hop-evidence-coverage",
    "name": "Multi-hop evidence coverage",
    "category": "evaluation",
    "maturity": "Blueprint",
    "use_case": "Chấm đủ tập evidence cần thiết",
    "source": "kb/shared/standards/evaluation.md",
    "tradeoff": "Labeling phức tạp",
    "flow": "Trace/output → dataset/rubric → Multi-hop evidence coverage → release decision → promote hoặc rollback"
  },
  {
    "id": "generation-grounding-metrics",
    "name": "Generation/grounding metrics",
    "category": "evaluation",
    "maturity": "Blueprint",
    "use_case": "Faithfulness, claim support, completeness",
    "source": "kb/shared/standards/evaluation.md, evals/rubrics/",
    "tradeoff": "Judge variance",
    "flow": "Trace/output → dataset/rubric → Generation/grounding metrics → release decision → promote hoặc rollback"
  },
  {
    "id": "citation-precision-recall",
    "name": "Citation precision/recall",
    "category": "evaluation",
    "maturity": "Blueprint",
    "use_case": "Link claim ↔ evidence",
    "source": "kb/shared/standards/evaluation.md",
    "tradeoff": "Claim segmentation khó",
    "flow": "Trace/output → dataset/rubric → Citation precision/recall → release decision → promote hoặc rollback"
  },
  {
    "id": "ragas-style-reference-free-eval",
    "name": "RAGAS-style reference-free eval",
    "category": "evaluation",
    "maturity": "Experimental",
    "use_case": "Fast feedback khi thiếu gold answer",
    "source": "kb/shared/standards/evaluation.md, kb/sources/registry.json",
    "tradeoff": "Không thay human calibration",
    "flow": "Trace/output → dataset/rubric → RAGAS-style reference-free eval → release decision → promote hoặc rollback"
  },
  {
    "id": "ares-ppi-style-calibrated-eval",
    "name": "ARES/PPI-style calibrated eval",
    "category": "evaluation",
    "maturity": "Experimental",
    "use_case": "Judge + human labels + confidence intervals",
    "source": "kb/shared/standards/evaluation.md, kb/sources/registry.json",
    "tradeoff": "Setup/statistical complexity",
    "flow": "Trace/output → dataset/rubric → ARES/PPI-style calibrated eval → release decision → promote hoặc rollback"
  },
  {
    "id": "deterministic-graders-first",
    "name": "Deterministic graders first",
    "category": "evaluation",
    "maturity": "Implemented",
    "use_case": "Schema, files, commands, links trước LLM judge",
    "source": "scripts/kb.py, tests/test_kb.py, kb/shared/standards/evaluation.md",
    "tradeoff": "Không đo nuance",
    "flow": "Schema/link/test/command checks → chỉ phần nuance mới dùng LLM judge → human review khi low confidence"
  },
  {
    "id": "calibrated-llm-as-judge",
    "name": "Calibrated LLM-as-judge",
    "category": "evaluation",
    "maturity": "Blueprint",
    "use_case": "Fixed rubric, evidence, swap order, human agreement",
    "source": "kb/shared/standards/evaluation.md, evals/rubrics/",
    "tradeoff": "Position/self-preference bias",
    "flow": "Trace/output → dataset/rubric → Calibrated LLM-as-judge → release decision → promote hoặc rollback"
  },
  {
    "id": "pairwise-order-swapping",
    "name": "Pairwise order swapping",
    "category": "evaluation",
    "maturity": "Blueprint",
    "use_case": "A/B và B/A để phát hiện position bias",
    "source": "kb/shared/standards/evaluation.md",
    "tradeoff": "Gấp đôi judge calls",
    "flow": "Trace/output → dataset/rubric → Pairwise order swapping → release decision → promote hoặc rollback"
  },
  {
    "id": "human-disagreement-routing",
    "name": "Human disagreement routing",
    "category": "evaluation",
    "maturity": "Implemented as policy",
    "use_case": "Low confidence/disagreement → review",
    "source": "kb/shared/standards/evaluation.md",
    "tradeoff": "Cần reviewer capacity",
    "flow": "Trace/output → dataset/rubric → Human disagreement routing → release decision → promote hoặc rollback"
  },
  {
    "id": "trace-grading",
    "name": "Trace grading",
    "category": "evaluation",
    "maturity": "Blueprint",
    "use_case": "Tìm lỗi routing, tool use và handoff",
    "source": "kb/shared/standards/evaluation.md, evals/rubrics/workflow.md",
    "tradeoff": "Backend coupling nếu không có adapter",
    "flow": "Trace/output → dataset/rubric → Trace grading → release decision → promote hoặc rollback"
  },
  {
    "id": "failure-taxonomy",
    "name": "Failure taxonomy",
    "category": "evaluation",
    "maturity": "Implemented",
    "use_case": "Nhóm lỗi trước khi sửa prompt/retriever",
    "source": "evals/rubrics/workflow.md, evals/reports/README.md",
    "tradeoff": "Taxonomy cần evolve",
    "flow": "Trace/output → dataset/rubric → Failure taxonomy → release decision → promote hoặc rollback"
  },
  {
    "id": "active-error-sampling",
    "name": "Active error sampling",
    "category": "evaluation",
    "maturity": "Blueprint",
    "use_case": "Chọn uncertainty/judge-disagreement cases",
    "source": "kb/shared/standards/evaluation.md",
    "tradeoff": "Sampling bias",
    "flow": "Trace/output → dataset/rubric → Active error sampling → release decision → promote hoặc rollback"
  },
  {
    "id": "risk-coverage-abstention-evaluation",
    "name": "Risk–coverage/abstention evaluation",
    "category": "evaluation",
    "maturity": "Blueprint",
    "use_case": "Đo an toàn khi từ chối",
    "source": "kb/shared/standards/evaluation.md",
    "tradeoff": "Cần calibration set đại diện",
    "flow": "Trace/output → dataset/rubric → Risk–coverage/abstention evaluation → release decision → promote hoặc rollback"
  },
  {
    "id": "canary-rollback",
    "name": "Canary + rollback",
    "category": "evaluation",
    "maturity": "Implemented as policy",
    "use_case": "Promote thay đổi qua gate",
    "source": "kb/shared/runbooks/maintenance.md, .agents/skills/kb-curator/",
    "tradeoff": "Vận hành phức tạp hơn",
    "flow": "Trace/output → dataset/rubric → Canary + rollback → release decision → promote hoặc rollback"
  },
  {
    "id": "evaluation-driven-promotion",
    "name": "Evaluation-driven promotion",
    "category": "evaluation",
    "maturity": "Implemented as policy",
    "use_case": "Kỹ thuật mới phải thắng baseline",
    "source": ".agents/skills/kb-curator/, orchestration/workflows/kb-curator.json",
    "tradeoff": "Có thể chậm adoption",
    "flow": "Candidate technique → golden + holdout + red-team → compare baseline → approve → canary → promote/rollback"
  },
  {
    "id": "acceptance-to-evidence-matrix",
    "name": "Acceptance-to-evidence matrix",
    "category": "evaluation",
    "maturity": "Implemented as workflow",
    "use_case": "Mỗi criterion map tới observed check; stale pre-integration evidence bị reject",
    "source": ".agents/skills/verify-delivery/SKILL.md, .agents/skills/verify-delivery/references/verification-rubric.md",
    "tradeoff": "Verification tốn thêm thời gian",
    "flow": "Trace/output → dataset/rubric → Acceptance-to-evidence matrix → release decision → promote hoặc rollback"
  },
  {
    "id": "metamorphic-testing",
    "name": "Metamorphic testing",
    "category": "evaluation",
    "maturity": "Blueprint",
    "use_case": "Kiểm invariants qua paraphrase, reorder, as-of, ACL và retry transformations",
    "source": "kb/shared/standards/evaluation.md, kb/sources/registry.json",
    "tradeoff": "Transformation có thể không thật sự giữ nghĩa",
    "flow": "Trace/output → dataset/rubric → Metamorphic testing → release decision → promote hoặc rollback"
  },
  {
    "id": "gepa-style-trajectory-prompt-evolution",
    "name": "GEPA-style trajectory prompt evolution",
    "category": "evaluation",
    "maturity": "Experimental",
    "use_case": "Học prompt/skill candidate từ trace reflection trong sandbox",
    "source": "kb/shared/standards/evaluation.md, kb/sources/registry.json",
    "tradeoff": "Eval leakage, overfit và malicious traces",
    "flow": "Trace/output → dataset/rubric → GEPA-style trajectory prompt evolution → release decision → promote hoặc rollback"
  },
  {
    "id": "retrieved-content-data-boundary",
    "name": "Retrieved-content/data boundary",
    "category": "security",
    "maturity": "Implemented",
    "use_case": "Nội dung KB không được xem là instruction",
    "source": "kb/shared/standards/security.md, AGENTS.md",
    "tradeoff": "Model vẫn cần guardrails",
    "flow": "Retrieved text → mark untrusted data → escape envelope → model không nhận instruction authority → cite/abstain"
  },
  {
    "id": "source-allowlist-trust-tier",
    "name": "Source allowlist + trust tier",
    "category": "security",
    "maturity": "Implemented",
    "use_case": "Registry phân authority/sensitivity",
    "source": "kb/sources/registry.json, governance/source-trust-policy.json",
    "tradeoff": "Nguồn mới phải review",
    "flow": "Input/retrieved data → trust boundary → Source allowlist + trust tier → allow/deny/escalate → audit evidence"
  },
  {
    "id": "quarantine-promotion-queue",
    "name": "Quarantine/promotion queue",
    "category": "security",
    "maturity": "Implemented",
    "use_case": "Chặn poison đi thẳng vào canonical",
    "source": "kb/memory/promotion-queue/, .agents/skills/kb-curator/",
    "tradeoff": "Tăng moderation workload",
    "flow": "Input/retrieved data → trust boundary → Quarantine/promotion queue → allow/deny/escalate → audit evidence"
  },
  {
    "id": "permission-aware-retrieval",
    "name": "Permission-aware retrieval",
    "category": "security",
    "maturity": "Implemented as adapter",
    "use_case": "Filter trusted scope/sensitivity/status/time/source trước scoring và sau vector search",
    "source": "integrations/langchain_rag/security.py, integrations/langchain_rag/retrieval.py",
    "tradeoff": "Provider filter cần mapping riêng",
    "flow": "Trusted caller cấp scope → pre-filter candidates → vector/lexical search → post-filter → evidence"
  },
  {
    "id": "tenant-project-isolation",
    "name": "Tenant/project isolation",
    "category": "security",
    "maturity": "Implemented as filter",
    "use_case": "Access context fail-closed theo scope; shared phải được cấp rõ",
    "source": "integrations/langchain_rag/models.py, integrations/langchain_rag/security.py",
    "tradeoff": "Production vẫn nên tách index khi risk yêu cầu",
    "flow": "Input/retrieved data → trust boundary → Tenant/project isolation → allow/deny/escalate → audit evidence"
  },
  {
    "id": "sensitivity-labels",
    "name": "Sensitivity labels",
    "category": "security",
    "maturity": "Implemented",
    "use_case": "public/internal/confidential/restricted",
    "source": "kb/schemas/knowledge.schema.json, kb/shared/standards/security.md",
    "tradeoff": "Classification có thể sai",
    "flow": "Input/retrieved data → trust boundary → Sensitivity labels → allow/deny/escalate → audit evidence"
  },
  {
    "id": "structured-outputs-between-agents",
    "name": "Structured outputs between agents",
    "category": "security",
    "maturity": "Implemented as contract",
    "use_case": "Giảm injection qua free-form handoff",
    "source": "orchestration/schemas/workflow.schema.json, .agents/skills/kb-orchestrator/references/orchestration-contract.md",
    "tradeoff": "Schema evolution",
    "flow": "Input/retrieved data → trust boundary → Structured outputs between agents → allow/deny/escalate → audit evidence"
  },
  {
    "id": "least-privilege-tools",
    "name": "Least-privilege tools",
    "category": "security",
    "maturity": "Implemented as policy",
    "use_case": "Specialist chỉ có capability cần thiết",
    "source": "kb/shared/standards/security.md, orchestration/policy.json",
    "tradeoff": "Tool setup phức tạp",
    "flow": "Input/retrieved data → trust boundary → Least-privilege tools → allow/deny/escalate → audit evidence"
  },
  {
    "id": "human-approval-for-high-impact",
    "name": "Human approval for high impact",
    "category": "security",
    "maturity": "Implemented as policy",
    "use_case": "Migration, deploy, external writes",
    "source": "orchestration/policy.json, scripts/kb.py, trường required_authorities trong workflow",
    "tradeoff": "Giảm autonomy",
    "flow": "Input/retrieved data → trust boundary → Human approval for high impact → allow/deny/escalate → audit evidence"
  },
  {
    "id": "threat-modeling",
    "name": "Threat modeling",
    "category": "security",
    "maturity": "Implemented",
    "use_case": "governance/threat-model.md",
    "source": "governance/threat-model.md, governance/risk-register.json",
    "tradeoff": "Cần refresh định kỳ",
    "flow": "Input/retrieved data → trust boundary → Threat modeling → allow/deny/escalate → audit evidence"
  },
  {
    "id": "prompt-injection-red-teaming",
    "name": "Prompt-injection red teaming",
    "category": "security",
    "maturity": "Implemented dataset",
    "use_case": "Direct/indirect/poisoned KB cases",
    "source": "governance/red-team-cases.jsonl, evals/datasets/adversarial.jsonl",
    "tradeoff": "Không bao phủ mọi attack",
    "flow": "Malicious document/query → retrieval path → guardrails/ACL/tool checks → detect leak/bypass → regression case"
  },
  {
    "id": "immutable-auditable-provenance",
    "name": "Immutable/auditable provenance",
    "category": "security",
    "maturity": "Blueprint",
    "use_case": "Hash và lineage của content/index/run",
    "source": "kb/shared/standards/knowledge-contract.md, kb/shared/patterns/retrieval.md",
    "tradeoff": "Storage và privacy considerations",
    "flow": "Input/retrieved data → trust boundary → Immutable/auditable provenance → allow/deny/escalate → audit evidence"
  },
  {
    "id": "freshness-sla-stale-audit",
    "name": "Freshness SLA + stale audit",
    "category": "security",
    "maturity": "Implemented as schema/policy",
    "use_case": "review_by, owner, valid time",
    "source": "kb/schemas/knowledge.schema.json, scripts/kb.py, kb/shared/runbooks/maintenance.md",
    "tradeoff": "Cần scheduler để tự động cảnh báo",
    "flow": "Input/retrieved data → trust boundary → Freshness SLA + stale audit → allow/deny/escalate → audit evidence"
  },
  {
    "id": "graceful-degradation",
    "name": "Graceful degradation",
    "category": "security",
    "maturity": "Implemented as policy",
    "use_case": "Correct/retry/abstain thay vì guess",
    "source": "kb/shared/patterns/retrieval.md, orchestration/policy.json",
    "tradeoff": "Có thể giảm answer rate",
    "flow": "Input/retrieved data → trust boundary → Graceful degradation → allow/deny/escalate → audit evidence"
  },
  {
    "id": "budget-token-time-stopping",
    "name": "Budget/token/time stopping",
    "category": "security",
    "maturity": "Implemented as policy",
    "use_case": "Ngăn agent loop không giới hạn",
    "source": "orchestration/policy.json, trường budget trong workflow",
    "tradeoff": "Dừng sớm nếu budget đặt sai",
    "flow": "Input/retrieved data → trust boundary → Budget/token/time stopping → allow/deny/escalate → audit evidence"
  },
  {
    "id": "monotonic-derivative-classification",
    "name": "Monotonic derivative classification",
    "category": "security",
    "maturity": "Implemented as policy",
    "use_case": "Derivative nhận sensitivity nghiêm nhất; summary/embedding/graph không declassify",
    "source": "kb/shared/standards/security.md, governance/access-control.md",
    "tradeoff": "Classification sai ở input lan sang derivative",
    "flow": "Input/retrieved data → trust boundary → Monotonic derivative classification → allow/deny/escalate → audit evidence"
  },
  {
    "id": "identity-scoped-versioned-cache-keys",
    "name": "Identity-scoped versioned cache keys",
    "category": "security",
    "maturity": "Implemented as policy",
    "use_case": "Cache key gồm identity/authority, policy/index version và validity",
    "source": "governance/access-control.md, kb/shared/standards/security.md",
    "tradeoff": "Cardinality và cache hit rate giảm",
    "flow": "Input/retrieved data → trust boundary → Identity-scoped versioned cache keys → allow/deny/escalate → audit evidence"
  },
  {
    "id": "privacy-minimized-audit-records",
    "name": "Privacy-minimized audit records",
    "category": "security",
    "maturity": "Implemented as policy",
    "use_case": "Trace stable IDs/reason codes thay raw sensitive query/payload",
    "source": "governance/access-control.md, kb/shared/standards/security.md",
    "tradeoff": "Điều tra sâu có thể cần protected payload store",
    "flow": "Input/retrieved data → trust boundary → Privacy-minimized audit records → allow/deny/escalate → audit evidence"
  },
  {
    "id": "deterministic-policy-as-code-enforcement",
    "name": "Deterministic policy-as-code enforcement",
    "category": "security",
    "maturity": "Blueprint",
    "use_case": "PDP/PEP quyết định allow/deny/escalate trước retrieval/tool/write",
    "source": "kb/shared/standards/policy-enforcement.md, kb/shared/standards/security.md",
    "tradeoff": "Policy drift và enforcement availability",
    "flow": "Input/retrieved data → trust boundary → Deterministic policy-as-code enforcement → allow/deny/escalate → audit evidence"
  }
];
window.KB_LESSON_BUILD = "2026-11-13";
