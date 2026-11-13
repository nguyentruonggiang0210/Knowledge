---
id: kb.pattern.retrieval
title: Layered retrieval architecture
summary: Kiến trúc retrieval baseline, optional LangChain/LangGraph runtime và các adapter graph, hierarchy, late interaction có eval gate.
kind: pattern
scope: shared
status: approved
owners: [kb-maintainers]
tags: [rag, retrieval, hybrid, langchain, langgraph, shared-context, graphrag, raptor, multimodal, frontier]
valid_from: 2026-11-12
valid_to: null
recorded_at: 2026-11-12
last_verified: 2026-11-13
review_by: 2027-02-12
confidence: high
sensitivity: internal
sources: [rag-paper, contextual-retrieval, rrf-paper, colbertv2, splade, raptor, graphrag, self-rag, crag, langchain-retrieval, langchain-multi-agent, langgraph-graph-api, late-chunking, colpali, hipporag2, lightrag, literag, matryoshka-representation]
relations: [depends-on:kb.standard.knowledge-contract, constrained-by:kb.standard.policy-enforcement, related-to:kb.pattern.knowledge-graph-and-provenance, validated-by:kb.standard.evaluation]
---

# Layered retrieval architecture

## Baseline

1. Filter trước theo project/tenant, sensitivity/ACL, status và valid time.
2. Route query: exact/local, semantic, multi-hop/global, long-document hoặc external-current.
3. Retrieve song song bằng lexical BM25 và dense embeddings.
4. Fuse bằng Reciprocal Rank Fusion, deduplicate theo stable page/chunk ID.
5. Rerank candidate set nhỏ; áp dụng diversity để không pack nhiều đoạn trùng nhau.
6. Pack evidence với page ID, heading, version, source và locator.
7. Generate claim-by-claim citations; corrective retry hoặc abstain nếu evidence yếu/mâu thuẫn.

Local CLI triển khai lexical baseline. Dense index phải giữ cùng filters và stable IDs; embedding không được làm mất sensitivity hoặc provenance.

## Optional LangChain/LangGraph runtime

`integrations/langchain_rag/` triển khai adapter tùy chọn mà không thay canonical format:

1. Canonical loader dùng cùng `scripts.kb.load_pages`, nên project template, episodic memory và derived indexes không bị ingest như facts.
2. Heading-aware chunks kế thừa stable page/chunk ID, source, scope, status, sensitivity và valid time.
3. Scope/sensitivity/status/time/source filter chạy trước lexical scoring và được post-filter lại sau external vector retrieval.
4. Lexical và dense candidates được fuse bằng RRF; vector store và reranker vẫn là provider adapters.
5. Evidence được đóng gói như untrusted data với locator/citation, không có instruction authority.
6. LangGraph state dùng typed channels và deduplicating reducers; mỗi specialist nhận một least-privilege projection thay vì toàn bộ context.
7. Graph mặc định là `retrieve → answer → independent verify`; model, vector store và persistence do runtime owner chọn.

LangChain/LangGraph là execution adapter. Model output, checkpoint và trace không trở thành canonical knowledge; chúng chỉ vào episodic memory hoặc promotion queue trước khi `$kb-curator` review.

## Chunking

Chunk theo heading, semantic boundary, code/table và parent-child relation. Contextualize chunk bằng một mô tả ngắn về document/project trước khi tạo lexical và dense indexes. Không tạo chunk cắt rời điều kiện, exception hoặc bảng khỏi heading của nó.

**Late Chunking** là adapter experimental khác contextual chunking: long-context embedding model encode document trước, sau đó mới pool token thành chunk vector. Chỉ dùng khi corpus dài chứng minh tăng recall/nDCG mà không gây context bleed hoặc index cost vượt tolerance.

Chunk ID runtime hiện dùng hash của page ID, heading và content nên deterministic/content-addressed. Loader phải validate repository trước index và fail closed nếu canonical state invalid.

## Frontier retrieval adapters

- **Visual RAG/ColPali:** retrieve ảnh trang bằng multi-vector late interaction để giữ layout, table, figure và typography. Citation phải có document ID, page và region/bounding box; OCR text là fallback/evidence bổ sung, không được silently thay visual source.
- **HippoRAG 2:** graph-memory adapter cho factual, associative và multi-hop retrieval. Benchmark riêng entity resolution, graph poisoning, update và deletion.
- **LightRAG/LiteRAG family:** graph/vector retrieval với dual-level hoặc algorithmic exploration để giảm token/cost so GraphRAG global. Không dùng tên gần giống như bằng chứng hai implementation tương đương.
- **Matryoshka embeddings:** index nhiều dimension từ một representation; coarse vector cho candidate search, full vector cho rerank. Đo recall theo dimension và giữ model/dimension trong index version.
- **Exact deletion:** mọi adapter phải nhận tombstone và xóa chunk/vector/edge/community summary/cache; xem `kb.pattern.knowledge-graph-and-provenance`.

## Conditional adapters

- **GraphRAG:** dùng cho dependency, impact, multi-hop và câu hỏi global. Không dùng mặc định cho exact/local lookup.
- **RAPTOR/hierarchical retrieval:** dùng cho tài liệu dài và câu hỏi tổng hợp nhiều mức. Summary node là derived, phải trỏ về leaves.
- **ColBERT/late interaction:** dùng khi token-level matching thắng single-vector baseline đủ lớn để bù storage/latency.
- **HyDE/multi-query:** chỉ experimental; theo dõi query drift.
- **Self-RAG/CRAG patterns:** controller quyết định retrieve/correct/abstain; không coi self-critique là proof.

## Promotion gate

Adapter chỉ trở thành default khi cải thiện golden + holdout trên retrieval recall/nDCG, claim support, citation correctness hoặc cost-adjusted task success; không được làm tăng ACL leakage, stale answer, critical latency hoặc unsupported claims quá tolerance.
