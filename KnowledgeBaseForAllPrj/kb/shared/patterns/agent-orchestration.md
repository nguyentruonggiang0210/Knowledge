---
id: kb.pattern.agent-orchestration
title: Dependency-aware multi-agent orchestration
summary: Manager điều phối specialist bằng task DAG, conflict detection, bounded retry và independent verification.
kind: pattern
scope: shared
status: approved
owners: [kb-maintainers]
tags: [agents, orchestration, dag, parallelism]
valid_from: 2026-11-12
valid_to: null
recorded_at: 2026-11-12
last_verified: 2026-11-13
review_by: 2027-02-12
confidence: high
sensitivity: internal
sources: [openai-multi-agent, openai-orchestration, openai-agent-evals, openai-skill-guidance]
relations: [implemented-by:skill.kb-orchestrator, extended-by:kb.pattern.interoperable-agent-runtime, constrained-by:kb.standard.policy-enforcement, validated-by:kb.standard.evaluation]
---

# Dependency-aware multi-agent orchestration

Manager giữ quyền sở hữu task, final response, approval, integration và budget. Specialist chỉ sở hữu một bounded capability; handoff chỉ phù hợp khi specialist phải tiếp quản hội thoại.

Mỗi node cần `objective`, `depends_on`, frozen `inputs`, `read_set`, `write_set`, external resources/side effects, idempotency key hoặc exclusive lock khi cần, output schema, acceptance, risk, approval, budget và retry rule. Scheduler tạo execution waves theo topological order.

## Parallel gate

Hai node có thể overlap khi không có dependency path, không có write conflict, không dùng chung mutable non-idempotent resource, input đã stable, và có thể verify độc lập. Read-only analysis thường an toàn nhất để parallelize.

Dependency, same-file/schema edits, migration, external side effect, approval, integration, review-fix loop và final verification chạy tuần tự. Nếu nhiều agent phải code, dùng isolated worktrees và manager merge từng nhánh.

## Reliability

Lifecycle: `pending → ready → running → produced → verified → accepted`; alternatives: `failed`, `blocked`, `superseded`. Retry chỉ dành cho transient unfinished work; kiểm tra artifact và side effect trước retry. Completion phải dựa trên evidence của final integrated state.

Default concurrency là 3 specialist; task nhỏ không spawn agent. Kết thúc khi acceptance đạt, cần authority mới, budget hết, hoặc không còn progress có bằng chứng.

Remote agent/tool interoperability, event-sourced resume, OpenTelemetry trace profile và executable compensation được đặc tả tại `kb.pattern.interoperable-agent-runtime`. Các capability đó là Blueprint; state machine local hiện tại không được gọi nhầm là durable runtime.
