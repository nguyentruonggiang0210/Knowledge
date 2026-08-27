# Incident timeline - <Incident ID/title>

## Conventions

- Canonical timezone: `UTC` hoặc `<timezone>`; ghi timezone trên mọi timestamp.
- Một dòng = một event/observation/decision/action có nguồn.
- Nhãn: `FACT`, `HYPOTHESIS`, `DECISION`, `ACTION`, `COMMUNICATION`.
- Không sửa fact cũ im lặng. Thêm dòng correction và link evidence mới.
- Redact secret, token, PII và payload nhạy cảm; link đến evidence có access control.

## Metadata

| Trường | Giá trị |
|---|---|
| Incident / severity | `<ID> / <SEV>` |
| Service/environment | `<...>` |
| Incident Commander / scribe | `<...>` |
| Start / declaration / mitigation / end | `<timestamps>` |
| Communication channel | `<link>` |
| Dashboard/change/deploy | `<links>` |

## Current status

```text
As of <timestamp timezone>
Impact: <who/what/how much>
Scope: <region/version/tenant/journey>
Mitigation: <in progress/completed>
Known facts: <...>
Open hypotheses: <...>
Next action/owner: <...>
Next update: <timestamp>
```

## Timeline

| Time | Type | Observation/action/decision | Evidence | Owner | Result/next step |
|---|---|---|---|---|---|
| `<HH:MM>` | FACT | `<SLI crossed threshold>` | `<dashboard/query>` | `<...>` | `<...>` |
| `<HH:MM>` | ACTION | `<rollout paused>` | `<run/change>` | `<...>` | `<result>` |
| `<HH:MM>` | HYPOTHESIS | `<dependency saturation>` | `<why suspected>` | `<...>` | `<test to falsify>` |
| `<HH:MM>` | DECISION | `<rollback>` | `<criteria/trade-off>` | `<IC>` | `<...>` |
| `<HH:MM>` | COMMUNICATION | `<status update sent>` | `<link>` | `<...>` | next `<time>` |

## Decision log

| Time | Decision | Options considered | Evidence/uncertainty | Decider | Revisit condition |
|---|---|---|---|---|---|
| `<...>` | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |

## Hypothesis board

| Hypothesis | Supporting evidence | Falsifying test | Status | Owner |
|---|---|---|---|---|
| `<...>` | `<...>` | `<...>` | `open/confirmed/rejected` | `<...>` |

Không chạy nhiều high-risk test đồng thời nếu sẽ làm mất khả năng biết action nào có hiệu quả.

## Impact checkpoints

| Time | Availability/error | Latency | Affected scope | Data/security status | Source |
|---|---:|---:|---|---|---|
| `<...>` | `<...>` | `<...>` | `<...>` | `<known/unknown>` | `<...>` |

## Handoff

```text
Outgoing → incoming: <names/time>
User impact now: <...>
Completed actions/results: <...>
Open risks/hypotheses: <...>
In-flight changes and owners: <...>
Access/links needed: <...>
Next update/deadline: <...>
```

## Closure checkpoints

- [ ] User impact ended và observation window hoàn tất.
- [ ] Data/security impact known hoặc investigation owner được chỉ định.
- [ ] Temporary access/rule/capacity có owner/expiry.
- [ ] Manual mitigation cần reconcile đã tracking.
- [ ] Timeline/evidence được giữ và redact đúng policy.
- [ ] Postmortem owner/date được đặt.
