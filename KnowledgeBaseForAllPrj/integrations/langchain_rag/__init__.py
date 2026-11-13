"""LangChain/LangGraph adapter for the repository knowledge base.

The canonical source of truth remains the Markdown/JSON repository. This package
only builds derived retrieval objects and structured run state.
"""

from .canonical import load_canonical_chunks
from .context import KBGraphState, merge_agent_results, merge_evidence, project_context
from .models import AccessContext, EvidenceChunk, EvidencePack, SearchHit
from .retrieval import HybridRetriever, LexicalRetriever, reciprocal_rank_fusion
from .runtime import KBRagRuntime, RuntimeConfig

__all__ = [
    "AccessContext",
    "EvidenceChunk",
    "EvidencePack",
    "HybridRetriever",
    "KBGraphState",
    "KBRagRuntime",
    "LexicalRetriever",
    "RuntimeConfig",
    "SearchHit",
    "load_canonical_chunks",
    "merge_agent_results",
    "merge_evidence",
    "project_context",
    "reciprocal_rank_fusion",
]
