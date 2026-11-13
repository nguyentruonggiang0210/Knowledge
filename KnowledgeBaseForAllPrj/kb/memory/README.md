# Memory layers

- `episodic/`: trace, quyết định và kết quả theo run; không phải canonical facts.
- `promotion-queue/`: candidate claims chờ provenance, conflict check và owner review.
- Semantic memory: các page đã promote trong `kb/shared/` hoặc `kb/projects/`.
- Procedural memory: skills trong `.agents/skills/`.

Không copy tự động toàn bộ conversation vào semantic memory. Chỉ promote claim cần tái sử dụng và đã qua knowledge contract.
