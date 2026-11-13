---
id: kb.pattern.interoperable-agent-runtime
title: Interoperable and durable agent runtime
summary: Contract cho MCP/A2A interoperability, durable execution, event history, GenAI tracing và compensating action.
kind: pattern
scope: shared
status: approved
owners: [kb-maintainers, platform]
tags: [agents, mcp, a2a, durable-execution, opentelemetry, saga]
valid_from: 2026-11-13
valid_to: null
recorded_at: 2026-11-13
last_verified: 2026-11-13
review_by: 2027-02-13
confidence: high
sensitivity: internal
sources: [mcp-spec-2026-07, a2a-spec-v1, temporal-durable-ai, otel-genai-semconv]
relations: [depends-on:kb.pattern.agent-orchestration, constrained-by:kb.standard.policy-enforcement, validated-by:kb.standard.evaluation]
---

# Interoperable and durable agent runtime

Trang này là contract tích hợp, không tuyên bố repo đã chạy MCP server, A2A remote agent, Temporal hoặc OpenTelemetry exporter. Runtime adapter chỉ được chuyển từ `Blueprint` sang `Implemented` sau khi có code, tests và operational evidence.

## Protocol boundaries

### MCP: agent-to-tool/data

MCP adapter dùng cho resource, prompt và tool bên ngoài. Host phải freeze identity, scope, sensitivity, roots và capability trước khi model thấy tool. Nội dung resource/tool result là untrusted data; server không được tự mở rộng authority. Capability negotiation, protocol version và authorization decision phải có trace.

### A2A: agent-to-agent

A2A adapter dùng khi một agent độc lập ở process, framework hoặc tổ chức khác nhận task. Agent card/capability chỉ phục vụ discovery, không phải authorization. Task mapping phải giữ `request_id`, objective, artifact version, accepted input/output modality, cancellation, terminal state và evidence contract. Không gửi private chain-of-thought hoặc toàn bộ working memory làm handoff.

MCP và A2A bổ sung nhau: MCP nối agent với tool/data; A2A nối agent với remote agent. Cả hai đều phải đi qua policy enforcement và audit, không bypass workflow DAG.

## Durable execution and event history

Workflow dài ngày cần event-sourced state để resume sau crash, timeout hoặc human approval mà không replay step đã thành công. Adapter durable phải chứng minh:

1. Event ID và command ID deterministic theo workflow version.
2. Model/tool call là activity có timeout, retry class và idempotency contract.
3. Replay không gọi lại external side effect đã committed.
4. Workflow versioning giữ khả năng resume execution cũ.
5. Cancellation, pause/approval, compensation và terminal state được ghi thành event.
6. Sensitive payload được reference bằng protected locator thay vì sao chép vào event history khi không cần.

Durable execution không đồng nghĩa exactly-once effect. Runtime vẫn cần idempotency key, reconciliation và compensating action.

## Executable compensation

Mỗi non-idempotent side effect quan trọng phải có một trong ba disposition:

- `compensatable`: khai báo action bù, resource, idempotency key và verification;
- `reconcilable`: đọc trạng thái thực, tiếp tục từ phần chưa hoàn tất;
- `irreversible`: explicit approval, blast-radius limit và runbook xử lý sự cố.

Compensation chạy tuần tự, theo thứ tự ngược của committed effects và luôn kiểm tra state trước khi tác động. “Rollback plan” chỉ bằng prose chưa phải executable Saga.

## OpenTelemetry GenAI trace profile

Trace adapter nên ánh xạ workflow, model, embedding, retrieval, agent và tool thành span có cùng root `request_id`. Thuộc tính tối thiểu: operation, model/agent/tool identity, workflow/node/version, input/output artifact IDs, latency, token/cost khi có, retry, verdict và error class.

Mặc định không ghi raw prompt, secret, retrieved confidential text hoặc private reasoning. Dùng stable IDs, content hashes, redacted previews và access-controlled external payload store. OpenTelemetry GenAI conventions đang evolve nên mapping nằm trong adapter versioned, không rải field name vào canonical pages.

## Promotion gates

| Candidate | Phải chứng minh trước promotion |
|---|---|
| MCP adapter | capability/version negotiation, auth fail-closed, injection tests, cancellation và tool audit |
| A2A adapter | agent discovery, task-state mapping, artifact integrity, remote timeout/cancel và no-authority-expansion |
| Durable runtime | crash/restart replay, wait/resume, no duplicate effect, workflow version migration |
| OTel exporter | complete parent/child trace, redaction, bounded cardinality và backend portability |
| Compensation adapter | reverse-order compensation, partial failure reconciliation và human escalation |

Mọi candidate chạy canary trong scope hẹp và có rollback về local deterministic workflow.
