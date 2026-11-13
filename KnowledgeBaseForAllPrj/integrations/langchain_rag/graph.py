"""Optional LangGraph 2-step RAG graph over structured shared context."""

from __future__ import annotations

from typing import Any, Callable, Mapping

from .context import KBGraphState
from .models import AccessContext


StateNode = Callable[[KBGraphState], Mapping[str, Any]]


def build_rag_graph(
    runtime: Any,
    answer_node: StateNode,
    *,
    verifier_node: StateNode | None = None,
    checkpointer: Any = None,
):
    """Build retrieve -> answer -> optional independent verify.

    The caller owns model selection. Retrieval authority comes only from the
    trusted ``access`` field provided at invocation time.
    """

    try:
        from langgraph.graph import END, START, StateGraph
    except ImportError as exc:
        raise RuntimeError(
            "LangGraph integration is optional. Install integrations/langchain_rag/requirements.txt "
            "with Python 3.11+."
        ) from exc

    def retrieve(state: KBGraphState) -> Mapping[str, Any]:
        access = AccessContext.from_mapping(state.get("access"))
        hits = runtime.search(state.get("query", ""), access)
        pack = runtime.pack_evidence(hits)
        evidence = [
            {
                "chunk_id": hit.chunk.chunk_id,
                "page_id": hit.chunk.page_id,
                "score": hit.score,
                "channels": list(hit.channels),
                "metadata": dict(hit.chunk.metadata),
                "content": hit.chunk.content,
            }
            for hit in hits
        ]
        return {
            "evidence": evidence,
            "evidence_context": pack.context,
            "citations": list(pack.citations),
        }

    builder = StateGraph(KBGraphState)
    builder.add_node("retrieve", retrieve)
    builder.add_node("answer", answer_node)
    builder.add_edge(START, "retrieve")
    builder.add_edge("retrieve", "answer")
    if verifier_node:
        builder.add_node("verify", verifier_node)
        builder.add_edge("answer", "verify")
        builder.add_edge("verify", END)
    else:
        builder.add_edge("answer", END)
    return builder.compile(checkpointer=checkpointer)
