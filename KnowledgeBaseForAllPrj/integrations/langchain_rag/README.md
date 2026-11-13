# LangChain/LangGraph RAG adapter

This adapter turns canonical KB pages into derived retrieval chunks, applies trusted access filters before scoring, supports lexical+dense Reciprocal Rank Fusion, creates LangChain `Document` objects, and exposes a typed LangGraph shared-state pipeline.

It does **not** replace canonical Markdown, bypass `$kb-curator`, or let an agent choose its own project/sensitivity authority.

## Runtime layers

| Layer | Implementation |
|---|---|
| Canonical loader | `canonical.py`; reuses `scripts.kb.load_pages` so templates and episodic memory are excluded |
| Security filter | `security.py`; scope, status, sensitivity, validity and optional source allowlist |
| Retrieval | `retrieval.py`; BM25, optional dense backend, RRF and reranker hook |
| LangChain bridge | `langchain_adapter.py`; `Document`, vector-store adapter and frozen-authority retrieval tool |
| Shared context | `context.py`; typed state, deduplicating reducers and least-privilege role projections |
| LangGraph pipeline | `graph.py`; retrieve → answer → optional independent verifier |
| Service/CLI | `runtime.py`, `cli.py` |

## Quick start without optional dependencies

The deterministic lexical/RRF baseline runs on Python 3.10+:

```powershell
python -m integrations.langchain_rag.cli check
python -m integrations.langchain_rag.cli search "agent write conflict" --scopes shared
```

## Enable LangChain and LangGraph

Use Python 3.11+ in an isolated environment:

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r integrations/langchain_rag/requirements.txt
.venv\Scripts\python -m integrations.langchain_rag.cli check
```

Create a dense adapter around any compatible vector store. Provider-specific filter syntax stays outside the KB core:

```python
from pathlib import Path

from integrations.langchain_rag.langchain_adapter import LangChainVectorStoreBackend
from integrations.langchain_rag.models import AccessContext
from integrations.langchain_rag.runtime import KBRagRuntime

backend = LangChainVectorStoreBackend(
    vector_store,
    filter_builder=lambda filters: provider_specific_filter(filters),
    metadata_transform=lambda metadata: provider_compatible_metadata(metadata),
)
runtime = KBRagRuntime.from_repository(Path("."), dense_backend=backend)
backend.add_chunks(runtime.chunks)

access = AccessContext(scopes=("shared", "payments"), sensitivities=("internal",))
hits = runtime.search("How are duplicate webhooks handled?", access)
evidence = runtime.pack_evidence(hits)
```

For 2-step RAG, inject `evidence.context` as untrusted evidence into your model call. For agentic RAG, use `make_retrieval_tool(runtime, access)`; the closure freezes access authority so the model cannot widen scope.

## Shared context with LangGraph

```python
from integrations.langchain_rag.graph import build_rag_graph

def answer(state):
    # Call your model with state["query"] and state["evidence_context"].
    return {"answer": "model output"}

def verify(state):
    # Independent verifier; do not mutate canonical knowledge here.
    return {"verification": {"verdict": "PASS", "citations": state["citations"]}}

graph = build_rag_graph(runtime, answer, verifier_node=verify)
result = graph.invoke({
    "request_id": "run-001",
    "query": "When may two agents run in parallel?",
    "access": access.to_dict(),
})
```

Shared state is working memory. Persist run traces to `kb/memory/episodic/` only when authorized; reusable claims must enter `kb/memory/promotion-queue/` and pass `$kb-curator` before becoming canonical.

## Required production gates

1. Map the chosen vector store's native ACL filter and test cross-project leakage.
2. Keep chunk IDs, page IDs, source IDs, validity and sensitivity in every derived document.
3. Run `evals/datasets/golden.jsonl`, holdout and adversarial cases against lexical and hybrid variants.
4. Record latency, retrieval coverage, citation correctness and unsupported-claim rate.
5. Promote dense/hybrid as default only when it beats the lexical baseline within security and cost tolerances.
