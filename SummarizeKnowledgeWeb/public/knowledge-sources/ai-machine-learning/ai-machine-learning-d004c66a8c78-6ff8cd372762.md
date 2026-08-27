# Nguồn học và chính sách cập nhật

Snapshot kiểm chứng: **2026-08-27**. Ưu tiên documentation chính thức, standards và paper/repository gốc. Tính năng, model, quota và giá của sản phẩm thay đổi nhanh; lesson 47 phải được kiểm tra lại trước mỗi lần benchmark, không dùng bảng trong giáo trình như cam kết vĩnh viễn.

## Nền tảng phần mềm và parser

- [Python tutorial](https://docs.python.org/3/tutorial/) và [Python AST](https://docs.python.org/3/library/ast.html)
- [Git documentation](https://git-scm.com/doc)
- [SQLite documentation](https://www.sqlite.org/docs.html)
- [Tree-sitter introduction](https://tree-sitter.github.io/tree-sitter/index.html)
- [Unstructured document partitioning](https://docs.unstructured.io/open-source/core-functionality/partitioning)
- [spaCy dependency parser](https://spacy.io/api/dependencyparser/)

Parser trong giáo trình có nhiều nghĩa: code → AST/CST; output model → typed object/schema; document → text/table/metadata; NLP → dependency/constituency structure; CLI/protocol → request object. Tokenizer và chunker là các bước khác, dù một library có thể đóng gói chung.

## ML, Deep Learning và LLM

- [scikit-learn user guide](https://scikit-learn.org/stable/user_guide.html)
- [PyTorch documentation](https://pytorch.org/docs/stable/index.html)
- [Hugging Face tokenizers](https://huggingface.co/docs/transformers/fast_tokenizers)
- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [LoRA](https://arxiv.org/abs/2106.09685), [QLoRA](https://arxiv.org/abs/2305.14314), [DPO](https://arxiv.org/abs/2305.18290)

Demo core cố ý dùng standard library để luôn chạy offline. Những nguồn trên là bước tiếp theo để thay implementation giáo dục bằng stack production; không copy API theo trí nhớ, luôn đọc version docs đang cài.

## OpenAI, agent và interoperability

- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI Agents SDK quickstart](https://developers.openai.com/api/docs/guides/agents/quickstart)
- [OpenAI MCP and Connectors](https://developers.openai.com/api/docs/guides/tools-connectors-mcp)
- [Official Codex documentation](https://learn.chatgpt.com/docs)
- [Codex CLI](https://learn.chatgpt.com/docs/codex/cli), [IDE extension](https://learn.chatgpt.com/docs/codex/ide), [cloud](https://learn.chatgpt.com/docs/cloud)
- [Codex App Server](https://learn.chatgpt.com/docs/app-server), [sandboxing](https://learn.chatgpt.com/docs/sandboxing), [agent approvals and security](https://learn.chatgpt.com/docs/agent-approvals-security)
- [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp), [subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents), [open-source components](https://learn.chatgpt.com/docs/open-source)
- [Codex as a platform: open agent harness](https://developers.openai.com/blog/codex-as-a-platform)
- [Microsoft Agent Framework: agent harness](https://learn.microsoft.com/en-us/agent-framework/concepts/harness)

Định nghĩa làm việc: **agent harness** là runtime/scaffolding bao quanh model—context/instructions, model adapter, tool registry/dispatch, control loop, state/memory, budget/retry/termination, sandbox/permission/approval, tracing/eval và interface. Harness không phải model và không chỉ là prompt.

## Coding agents — nguồn chính thức cho lesson 47

### GitHub Copilot

- [Copilot concepts](https://docs.github.com/en/copilot/concepts)
- [Cloud coding agent](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent)
- [Chat modes in IDE](https://docs.github.com/en/copilot/how-tos/chat-with-copilot/chat-in-ide)
- [Supported models](https://docs.github.com/en/copilot/reference/ai-models/supported-models)
- [Copilot plugins](https://docs.github.com/en/copilot/concepts/agents/about-plugins)

### Anthropic Claude Code

- [Claude Code overview](https://code.claude.com/docs/en/overview)
- [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works)
- [Features and extensions](https://code.claude.com/docs/en/features-overview)
- [Sandboxing](https://code.claude.com/docs/en/sandboxing) và [permissions](https://code.claude.com/docs/en/permissions)

### Các lựa chọn khác để benchmark

- [Google Antigravity surfaces](https://cloud.google.com/blog/topics/developers-practitioners/choosing-your-surface-antigravity-20-antigravity-cli-antigravity-ide-or-antigravity-sdk)
- [Cursor Agent](https://cursor.com/docs/agent/overview)
- [Devin](https://docs.devin.ai/get-started/devin-intro) và [Devin Desktop Cascade](https://docs.devin.ai/desktop/cascade/cascade)
- [JetBrains Junie](https://www.jetbrains.com/help/ai-assistant/junie-agent.html)
- [Cline repository](https://github.com/cline/cline)
- [Aider documentation](https://aider.chat/docs/) và [repository map](https://aider.chat/docs/repomap.html)
- [Amazon Q Developer](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/what-is.html)

Không có một “agent tốt nhất” độc lập với task. Benchmark phải cố định commit, task, acceptance tests, quyền, instruction và ghi model/version/reasoning/date; chạy nhiều lần rồi đo pass rate, regression, human intervention, unsafe calls, diff quality, time và cost.

## “Metis” — case study về thuật ngữ nhập nhằng

`Metis` **không phải khái niệm nền tảng hay chuẩn chung của AI**. Nếu thiếu URL/repo/context, cần hỏi hoặc tra cứu thay vì đoán. Các tên đã xác minh nhưng không đồng nghĩa:

- [colliery-io/metis](https://github.com/colliery-io/metis): planning/memory dạng file cho coding agents.
- [Wholiver/metis](https://github.com/Wholiver/metis): coding agent terminal/desktop.
- [Arm Metis](https://github.com/arm/metis): agentic security code-review framework.
- [Metis Layer](https://www.metislayer.com/): design-system/UI MCP tooling.
- [MemTensor/Metis](https://github.com/MemTensor/Metis): research preview về memory foundation model.
- [Metis: text/code memory for self-evolving agents](https://arxiv.org/abs/2606.24151).

Ngoài ra `METIS` còn là graph partitioner cổ điển, và trong hội thoại có thể là lỗi gõ của `metrics`. Lesson 33 dùng sự nhập nhằng này để dạy quy trình xác minh danh từ riêng, không dạy “Metis” như một tầng bắt buộc của mọi agent.

## Evals, safety, security và governance

- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [MITRE ATLAS](https://atlas.mitre.org/)
- [OpenAI safety best practices](https://developers.openai.com/api/docs/guides/safety-best-practices)
- [OpenAI evals documentation](https://developers.openai.com/api/docs/guides/evals)

Các checklist trong course là tài liệu kỹ thuật/giáo dục, không thay thế tư vấn pháp lý, privacy, compliance, y tế hay an toàn theo domain/quốc gia cụ thể.

