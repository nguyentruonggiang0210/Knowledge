---
id: kb.pattern.knowledge-graph-and-provenance
title: Formal knowledge graph, attestations and deletion
summary: Projection RDF/JSON-LD, SHACL validation, signed provenance và exact deletion cho derived knowledge artifacts.
kind: pattern
scope: shared
status: approved
owners: [kb-maintainers, security]
tags: [knowledge-graph, rdf, json-ld, shacl, provenance, deletion, attestation]
valid_from: 2026-11-13
valid_to: null
recorded_at: 2026-11-13
last_verified: 2026-11-13
review_by: 2027-02-13
confidence: high
sensitivity: internal
sources: [w3c-prov, w3c-shacl, slsa-1.2, c2pa-2.4, lightfoot-deletion]
relations: [depends-on:kb.standard.knowledge-contract, validated-by:kb.standard.evaluation, constrains:kb.pattern.retrieval]
---

# Formal knowledge graph, attestations and deletion

Canonical Markdown và source registry vẫn là truth. RDF/JSON-LD graph, SHACL report, signatures, embeddings và deletion indexes là derived artifacts hoặc verification evidence; phải rebuild được và trỏ về stable page/source IDs.

## RDF/JSON-LD projection and SHACL

Projection ánh xạ page thành entity, typed relation thành edge, provenance thành PROV-compatible activity/entity/agent và temporal/sensitivity thành explicit properties. Mỗi triple/edge phải giữ locator về canonical page hoặc registered source.

SHACL shapes dùng để kiểm tra graph-specific invariants mà JSON frontmatter schema không diễn tả tốt: relation target class, required provenance path, supersession cardinality, temporal consistency và sensitivity propagation. Promotion gate cần round-trip test: projection không được tạo fact mới, làm mất ID hoặc hạ classification.

## Cryptographic attestations

Content hash phát hiện thay đổi nhưng không nói ai tạo artifact. Attestation envelope cho source snapshot, catalog/index build, eval report hoặc release nên ghi:

- subject stable ID + digest;
- source/builder identity và build recipe/version;
- input digests, timestamp và environment class;
- signature, trust root, expiration/revocation status;
- link tới canonical provenance và sensitivity.

SLSA-style provenance phù hợp pipeline/build artifact; C2PA phù hợp media/document có content credentials. W3C PROV mô tả lineage ngữ nghĩa, không thay chữ ký. Nếu signature không verify được, artifact bị quarantine chứ không tự động coi là giả hay thật.

## Deletion and tombstone semantics

Supersession giữ lịch sử; deletion phục vụ legal/privacy/security erasure và khác hoàn toàn supersession. Delete request cần target stable IDs, authority, reason, scope, retention/legal-hold disposition và evidence.

Tombstone không chứa nội dung đã xóa; nó giữ identifier/hash tối thiểu, deletion time, authority và propagation status. Propagation phải bao phủ canonical copy khi được phép, chunks, lexical/vector index, graph edge/community summary, cache, checkpoint, eval fixture và backup theo retention policy.

Completion chỉ đạt khi negative retrieval test chứng minh không còn stale hit trong mọi serving path, đồng thời audit chứng minh artifact nào được giữ do legal hold. Exact deletion adapter cho GraphRAG vẫn là experimental cho đến khi corpus-specific test xác nhận không còn derived knowledge “ma”.

## Promotion gates

| Capability | Gate |
|---|---|
| RDF/JSON-LD + SHACL | deterministic projection, shape validation, round-trip fidelity, ACL-safe graph query |
| Signed attestation | signature/trust/revocation verification, reproducible subject digest, key rotation runbook |
| Exact deletion | full derivative inventory, idempotent propagation, negative retrieval proof, retention/legal-hold audit |
