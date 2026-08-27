# Lesson 47 — So sánh coding agents bằng bằng chứng

> **Snapshot:** 2026-08-27. Tên sản phẩm, model, plan, preview status, giới hạn và giá thay đổi nhanh; hãy mở lại nguồn chính thức trước quyết định thực tế.

## Mục tiêu

Sau bài này, bạn có thể:

- phân biệt coding assistant, IDE agent, terminal agent và cloud/background agent;
- so sánh model + harness + execution environment thay vì chỉ tên model;
- đọc ranh giới sandbox, approval, network, source openness và extension;
- tổ chức bake-off trên frozen tasks, rubric nhiều chiều và critical gate;
- đưa ra lựa chọn theo use case mà không tuyên bố một sản phẩm “tốt nhất”.

## Bản chất và cách hoạt động

Một coding agent là cả hệ thống:

```text
model + instructions/context/index + agent loop + tools
      + filesystem/shell/network policy + Git workflow
      + verifier/tests + trace/eval + UI/execution environment
```

Cùng model nhưng khác harness, quyền, repo map, compaction hoặc verifier có thể cho kết quả rất khác. “Copilot”, “Codex” hay “Claude Code” cũng không phải một mode duy nhất: cần ghi rõ IDE/CLI/cloud, phiên bản, model, reasoning level, extensions, quyền và cấu hình repository.

### Ma trận nguồn chính thức

Bảng dưới mô tả capability được tài liệu xác nhận và câu hỏi cần thử. Cột cuối là hướng khảo sát theo workflow, không phải xếp hạng.

| Sản phẩm | Surface và execution | Model/extension/control được xác nhận | Câu hỏi bake-off phù hợp |
|---|---|---|---|
| [GitHub Copilot](https://docs.github.com/en/copilot/concepts) | Completion/chat và Ask/Plan/Agent trong IDE; [cloud agent](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent) làm việc nền trong ephemeral GitHub Actions environment rồi tạo PR. | [Nhiều model provider](https://docs.github.com/en/copilot/reference/ai-models/supported-models); instructions, custom agents, skills, hooks, MCP và plugins. Cloud agent có các giới hạn workflow/session được tài liệu nêu, nên phải kiểm tra lại ở thời điểm dùng. | Issue → branch/PR, review và CI trong tổ chức GitHub hoạt động thế nào? |
| [OpenAI Codex CLI](https://learn.chatgpt.com/docs/codex/cli) | CLI đọc/sửa/chạy terminal; [IDE](https://learn.chatgpt.com/docs/codex/ide) có context editor/diff; [cloud](https://learn.chatgpt.com/docs/cloud) chạy task song song trong isolated environments và review/PR. | Rules/instructions, skills, MCP, subagents, approvals và [sandbox](https://learn.chatgpt.com/docs/sandboxing). CLI, SDK, App Server và một số core component được [mở nguồn](https://learn.chatgpt.com/docs/open-source); không suy rộng thành toàn bộ sản phẩm. | Local deep-repo task, cloud delegation và khả năng nhúng qua [App Server](https://learn.chatgpt.com/docs/app-server) khác nhau ra sao? |
| [Anthropic Claude Code](https://code.claude.com/docs/en/overview) | Terminal, IDE, desktop và browser; harness lặp gather context → action → verify. | CLAUDE.md, skills, subagents/agent teams, MCP, hooks, plugins; có [permissions](https://code.claude.com/docs/en/permissions) và [sandboxing](https://code.claude.com/docs/en/sandboxing) trên môi trường được hỗ trợ. | Terminal automation, customization và boundary local/cloud đáp ứng threat model nào? |
| [Google Antigravity](https://www.antigravity.google/blog/introducing-google-antigravity-2) | Desktop multi-agent, CLI/headless, IDE và Python SDK trên cùng hướng harness; xem [so sánh surface](https://cloud.google.com/blog/topics/developers-practitioners/choosing-your-surface-antigravity-20-antigravity-cli-antigravity-ide-or-antigravity-sdk). | Antigravity CLI phục vụ terminal. Gemini CLI cho individual accounts được công bố chuyển sang Antigravity CLI ngày 2026-06-18; enterprise/API-key routes cần đọc [transition notice](https://github.com/google-gemini/gemini-cli/discussions/28017). | Nên dùng desktop song song, terminal/headless, IDE hay SDK cho cùng task? |
| [Cursor Agent](https://cursor.com/docs/agent/overview) | Editor agent có code/web search, shell, browser, checkpoints và background/cloud execution. | Instructions, tools và lựa chọn model; cloud agent chạy trong remote environment nên cần đánh giá network/data-exfiltration riêng. | Editor/browser verification và background task thay đổi latency, quyền, review thế nào? |
| [Devin](https://docs.devin.ai/get-started/devin-intro) / [Devin Desktop Cascade](https://docs.devin.ai/desktop/cascade/cascade) | Devin là cloud software agent có shell/IDE; Cascade hiện là local agent trong Devin Desktop với Code/Chat, planning, tools và checkpoints. | Tài liệu Devin nói agent có thể đi lệch hướng; completion criteria và hợp tác trên plan vẫn cần thiết. | Cloud backlog delegation và local desktop workflow có cùng chất lượng/handoff không? |
| [JetBrains Junie](https://www.jetbrains.com/help/ai-assistant/junie-agent.html) | Agent trong JetBrains IDE, lập kế hoạch, sửa nhiều file, chạy terminal/test và dùng semantic IDE context. | Có mode cho phép tự chạy nhiều thao tác; quyền và review mode phải nằm trong benchmark. | Semantic inspections/refactoring của IDE giúp task dự án JVM/Python bao nhiêu? |
| [Cline](https://github.com/cline/cline) | IDE và CLI; đọc/sửa file, command, browser; mã nguồn Apache-2.0. | Model/provider linh hoạt, MCP/plugins, approval policy và parallel/worktree workflow theo tài liệu hiện hành. | BYOK/local model và human approval ảnh hưởng cost, privacy, success rate ra sao? |
| [Aider](https://aider.chat/docs/) | Terminal pair programming với Git, lint/test và [repository map](https://aider.chat/docs/repomap.html). | Hỗ trợ nhiều provider; repo map dùng cấu trúc symbol để chọn context trong token budget. | Workflow terminal/Git-first nhẹ có đủ cho task nào, thiếu automation nào? |
| [Amazon Q Developer](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/what-is.html) | IDE coding cùng capability hướng AWS, security scan và upgrade; có [GitHub development/review agents](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/amazon-q-for-github.html) theo trạng thái nêu trong docs. | Tích hợp AWS là trục cần đánh giá riêng thay vì so bằng prompt code tổng quát. | Task AWS/IaC/upgrade có lợi gì và permission boundary ra sao? |

GitHub còn cho phép chạy [third-party coding agents](https://docs.github.com/en/copilot/concepts/agents/about-third-party-coding-agents) như Claude và Codex trong workflow GitHub theo trạng thái tài liệu hiện hành. Vì vậy cần phân biệt agent tạo code với nền tảng giao task/PR.

### Trục so sánh bắt buộc

1. Loại task và ngôn ngữ/repository thực tế.
2. Local, container, VM/cloud; filesystem/network/secrets boundary.
3. Model/provider/version/reasoning setting và context limits.
4. Context discovery: search, AST/LSP, repo map, memory/compaction.
5. Tool, terminal, browser, test/verifier và recovery.
6. Instructions, skills, MCP, hooks, plugins, subagents.
7. Git/issue/PR/review/CI và dirty-worktree protection.
8. Approval, sandbox, audit, data retention và compliance.
9. Correctness, safety, human effort, latency, token/cost.
10. Open-source boundary, deployment/lock-in và khả năng export trace/config.

## Khi nào dùng / không dùng

**Dùng agent khi:** task có acceptance test rõ; repo/context đủ; tool quyền tối thiểu; người review được diff; tiết kiệm thời gian lớn hơn chi phí kiểm chứng.

**Không nên giao tự động:** production secret/credential; migration khó đảo ngược thiếu backup; task mơ hồ không có owner; repository chưa có test; tác vụ pháp lý/security quan trọng nhưng không có human gate. Không chọn sản phẩm chỉ qua demo marketing hoặc một lần chạy may mắn.

## Ví dụ thực tế

Freeze ba task từ repository thật: sửa bug kèm regression test, refactor không đổi behavior, và cập nhật dependency có security constraint. Mỗi candidate chạy 3–5 lần trên cùng commit, cùng quyền/mạng và acceptance tests. Ghi version/model/harness config, test pass, unauthorized actions, diff size, human interventions, latency và cost. Critical safety failure loại run khỏi promotion dù weighted score cao.

Demo dùng nhãn `Candidate-A/B`, không giả lập chất lượng của sản phẩm thật và không chọn “quán quân”. Nó chỉ minh họa frozen-suite hash, rubric nhiều chiều và safety gate.

## Lệnh chạy

```powershell
python Lessions/47-coding-agents-comparison/src/demo.py
```

Demo hoàn toàn offline; số liệu là dữ liệu giả lập phục vụ phương pháp.

## Bài tập

1. Chọn hai surface thật, ghi commit SHA, model/version/config/quyền và chạy cùng task năm lần.
2. Blind-review diff bằng rubric trước khi nhìn tên candidate.
3. Thêm bootstrap confidence interval; không kết luận từ một lần chạy.
4. Thêm case dirty worktree, prompt injection trong issue và test flaky.
5. Mở lại mọi nguồn trong bảng, ghi ngày kiểm tra và đánh dấu capability đã thay đổi.

## Checklist hoàn thành

- [ ] Tôi so sánh model + harness + environment, không chỉ brand/model.
- [ ] Task, commit, tests, quyền và rubric đã freeze trước khi chạy.
- [ ] Có nhiều lần lặp và failure breakdown, không chỉ điểm trung bình.
- [ ] Safety gate không thể bị điểm speed/cost bù.
- [ ] Mọi nhận định sản phẩm có source/date và không dùng từ “tốt nhất”.

## Bài trước / bài sau

- Bài trước: [Lesson 46 — Governance, privacy và AI product](../46-governance-privacy-ai-product/README.md)
- Bài sau: [Lesson 48 — Capstone production RAG agent](../48-capstone-production-rag-agent/README.md)
