# Access-control contract

Authorization is evaluated before retrieval. Every page and derived chunk carries `scope`, `sensitivity`, project/tenant identity and any local ACL. Fusion, graph expansion, reranking and caching operate only on already-authorized candidates.

The effective classification of a derivative is the strictest classification of all contributing sources. A summary or embedding never declassifies content. Cache keys include identity scope and index version; audit records capture query scope and returned stable IDs without unnecessarily storing sensitive query text.

When identity, tenancy or classification cannot be established, fail closed and request the missing context.
