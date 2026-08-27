# CCAR-F five-domain coverage audit

Nguồn đối chiếu: năm file Markdown trong `Tool2/Output`. Website giữ nguyên 12 lesson hiện có; không tạo lesson mới. Các section kiến thức cốt lõi được map như sau.

## D1 — Agentic Architecture & Orchestration (10/10)

| Source section | Existing lesson receiving coverage |
|---|---|
| A. Foundations of Agentic Architecture | Agent hoạt động thế nào? |
| B. Agentic Loop Lifecycle | Agent hoạt động thế nào? |
| C. Coordinator-Subagent Orchestration | Điều phối multi-agent |
| D. Subagent Invocation & Context Passing | Điều phối multi-agent |
| E. Multi-Step Workflow Enforcement & Handoff | Safety & enforcement; Hội thoại & escalation |
| F. Agent SDK Hooks for Tool Interception & Data Normalization | Safety & enforcement; Output & xử lý lỗi |
| G. Task Decomposition Strategies | Khám phá codebase; Điều phối multi-agent |
| H. Session State, Resumption & Forking | Plan, Execute, Resume & Fork; Context & memory |
| Sample Questions | Luyện tập và Tra cứu |
| Nguồn tham khảo | Domain coverage/reference metadata |

## D2 — Tool Design & MCP Integration (13/13)

| Source section | Existing lesson receiving coverage |
|---|---|
| A. Foundations of Tool Design | Thiết kế Tool & MCP |
| B. Tool Descriptions and Boundaries | Thiết kế Tool & MCP |
| C. Structured Error Responses | Output & xử lý lỗi |
| D. Tool Distribution Across Agents | Tool & MCP; Multi-agent |
| E. `tool_choice` | Structured extraction |
| F. MCP Architecture and Integration | Thiết kế Tool & MCP |
| G. MCP Error Patterns | Output & xử lý lỗi |
| H. Built-in Tool Selection | Khám phá codebase |
| Worked Examples | Ví dụ và Áp dụng thực tế trong các lesson trên |
| Services Appendix | Tra cứu/reference metadata |
| Sample Questions | Luyện tập và Tra cứu |
| Additional Exam Guidance | Deep-dive và quy tắc làm bài |
| Nguồn tham khảo | Domain coverage/reference metadata |

## D3 — Claude Code Configuration & Workflows (18/18)

| Source section | Existing lesson receiving coverage |
|---|---|
| A. CLAUDE.md Hierarchy | Plan, Execute, Resume & Fork |
| B. Path-Scoped Rules | Plan, Execute, Resume & Fork |
| C. Slash Commands and Skills | Plan, Execute, Resume & Fork |
| D. Hooks | Safety & enforcement |
| E. Permissions | Safety & enforcement |
| F. MCP Configuration | Thiết kế Tool & MCP |
| G. Plan vs Direct | Plan, Execute, Resume & Fork |
| H. Iterative Workflows | Plan, Execute, Resume & Fork |
| I. Session Management | Workflow; Context & memory |
| J. CI/CD Pipelines | Chi phí, latency & chiến thuật thi |
| K. Automated Code Review | Đánh giá & code review |
| L. Message Batches API | Chi phí, latency & chiến thuật thi |
| M. Built-in Tools | Khám phá codebase |
| N. Codebase Exploration | Khám phá codebase |
| O. Self-Review Limitation | Đánh giá & code review |
| Services Appendix | Tra cứu/reference metadata |
| Sample Questions | Luyện tập và Tra cứu |
| Nguồn tham khảo | Domain coverage/reference metadata |

## D4 — Prompt Engineering & Structured Output (11/11)

| Source section | Existing lesson receiving coverage |
|---|---|
| A. Prompt Engineering Foundations | Đánh giá & code review; Hội thoại |
| B. Explicit Criteria | Đánh giá & code review |
| C. Few-Shot Prompting | Đánh giá & code review |
| D. Tool Use and JSON Schema | Structured extraction |
| E. Schema Design | Structured extraction |
| F. Validation and Retry | Structured extraction |
| G. Batch Processing | Chi phí, latency & chiến thuật thi |
| H. Multi-Instance and Multi-Pass Review | Đánh giá & code review |
| Services Appendix | Tra cứu/reference metadata |
| Sample Questions | Luyện tập và Tra cứu |
| Nguồn tham khảo | Domain coverage/reference metadata |

## D5 — Context Management & Reliability (12/12)

| Source section | Existing lesson receiving coverage |
|---|---|
| A. Context Foundations | Quản lý context & memory |
| B. Preserving Critical Information | Quản lý context & memory |
| C. Escalation and Ambiguity | Hội thoại & escalation |
| D. Error Propagation | Output & xử lý lỗi; Multi-agent |
| E. Large Codebase Context | Khám phá codebase; Context & memory |
| F. Human Review and Calibration | Đánh giá & code review |
| G. Information Provenance | Điều phối multi-agent |
| Worked Examples | Ví dụ và Áp dụng thực tế trong các lesson trên |
| Services Appendix | Tra cứu/reference metadata |
| Sample Questions | Luyện tập và Tra cứu |
| Additional Exam Guidance | Deep-dive và quy tắc làm bài |
| Nguồn tham khảo | Domain coverage/reference metadata |

## Verification result

- Source sections audited: **64/64**.
- Existing lessons retained: **12/12**.
- New duplicate lessons created: **0**.
- Supplemental deep-dive topics added: **38**.
- Duplicate supplemental titles: **0**.
