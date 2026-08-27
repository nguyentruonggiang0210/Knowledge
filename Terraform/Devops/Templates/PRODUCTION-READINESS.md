# Production Readiness Review - <Service/release>

## Metadata

| Trường | Giá trị |
|---|---|
| Service / release | `<...>` |
| Owner / on-call | `<...>` |
| Tier / data classification | `<...>` |
| Target environments/regions | `<...>` |
| Planned go-live | `<timestamp + timezone>` |
| Reviewers | `<product/SRE/security/data/platform>` |
| Architecture/ADR/change | `<links>` |
| Status | `Draft / Blocked / Conditional / Ready` |

## Review rules

- `BLOCKER`: phải đóng trước go-live.
- `EXCEPTION`: authorized risk owner, compensating control, expiry và tracking.
- `N/A`: phải có lý do.
- Evidence là link/query/test report; “đã làm” không đủ.

## Executive decision

| Kết quả | Chi tiết |
|---|---|
| Readiness | `<Ready / Conditional / Blocked>` |
| Open blockers | `<count + links>` |
| Accepted exceptions | `<count + nearest expiry>` |
| Rollout scope | `<canary/users/regions>` |
| Abort authority | `<role>` |

## 1. Ownership và service contract

| Check | Status | Evidence | Owner/gap |
|---|---|---|---|
| User outcome, critical journeys và non-goals rõ | `<...>` | `<...>` | `<...>` |
| Service owner, on-call, escalation và dependency owners rõ | `<...>` | `<...>` | `<...>` |
| SLO/SLI/error budget được product + engineering đồng ý | `<...>` | `<...>` | `<...>` |
| Support/status/comms path và maintenance policy rõ | `<...>` | `<...>` | `<...>` |

## 2. Architecture và dependencies

| Check | Status | Evidence | Owner/gap |
|---|---|---|---|
| Diagram/data flow/trust boundary khớp deployment | `<...>` | `<...>` | `<...>` |
| Failure modes/SPOF/blast radius và dependency contract đã review | `<...>` | `<...>` | `<...>` |
| Account/subscription/tenancy/region/state boundaries đúng | `<...>` | `<...>` | `<...>` |
| DNS/certificate/network/IP/quota/service availability kiểm tra | `<...>` | `<...>` | `<...>` |
| ADR cho quyết định khó đảo ngược/managed-service lock-in | `<...>` | `<...>` | `<...>` |

## 3. Build, supply chain và deployment

| Check | Status | Evidence | Owner/gap |
|---|---|---|---|
| Reproducible build, unit/integration/contract/smoke tests | `<...>` | `<...>` | `<...>` |
| Artifact immutable, version/digest, SBOM, scan/provenance/sign | `<...>` | `<...>` | `<...>` |
| Artifact được promote, không rebuild riêng production | `<...>` | `<...>` | `<...>` |
| IaC version/lock/test/policy/saved plan và state lock | `<...>` | `<...>` | `<...>` |
| Progressive rollout, health/SLO gate và rollback đã diễn tập | `<...>` | `<...>` | `<...>` |
| Schema/config compatibility và migration/rollback strategy | `<...>` | `<...>` | `<...>` |

## 4. Security, privacy và compliance

| Check | Status | Evidence | Owner/gap |
|---|---|---|---|
| Threat model reviewed; high risks closed/accepted có expiry | `<...>` | `<...>` | `<...>` |
| Human/workload/CI identities least privilege, short-lived, audited | `<...>` | `<...>` | `<...>` |
| Không secret trong code/image/log/plan; rotation/revoke test | `<...>` | `<...>` | `<...>` |
| Network exposure, authn/authz, input validation/rate limit đúng | `<...>` | `<...>` | `<...>` |
| Encryption/key ownership/backup/state/log access đúng | `<...>` | `<...>` | `<...>` |
| Data residency/retention/deletion/privacy/legal requirements | `<...>` | `<...>` | `<...>` |
| Vulnerability/dependency exceptions có owner/expiry/control | `<...>` | `<...>` | `<...>` |

## 5. Reliability và resilience

| Check | Status | Evidence | Owner/gap |
|---|---|---|---|
| Replica/zone/fault-domain topology khớp region thật | `<...>` | `<...>` | `<...>` |
| Timeout/retry/idempotency/circuit breaker/degradation strategy | `<...>` | `<...>` | `<...>` |
| Health checks, graceful shutdown và self-healing test | `<...>` | `<...>` | `<...>` |
| Dependency/zone/replica/bad-release game days pass | `<...>` | `<...>` | `<...>` |
| Capacity khi mất failure domain vẫn đáp ứng target | `<...>` | `<...>` | `<...>` |

## 6. Data, backup và DR

| Check | Status | Evidence | Owner/gap |
|---|---|---|---|
| Data owner/classification/schema/consistency/source of truth rõ | `<...>` | `<...>` | `<...>` |
| Backup/PITR freshness, encryption, retention, immutability | `<...>` | `<...>` | `<...>` |
| Restore test có checksum/business/security validation | `<...>` | `<...>` | `<...>` |
| RTO/RPO được business chấp nhận và DR test thực đo | `<...>` | `<...>` | `<...>` |
| Failover/fencing/failback và split-brain prevention test | `<...>` | `<...>` | `<...>` |

## 7. Observability và incident operations

| Check | Status | Evidence | Owner/gap |
|---|---|---|---|
| User-centric SLI query versioned và telemetry quality test | `<...>` | `<...>` | `<...>` |
| RED + saturation + dependency + deploy markers dashboard | `<...>` | `<...>` | `<...>` |
| Alerts có severity/duration/routing/runbook; firing/recovery test | `<...>` | `<...>` | `<...>` |
| Logs/traces/audit có correlation, redaction, retention/cost limit | `<...>` | `<...>` | `<...>` |
| Runbooks verified, access/break-glass và incident roles sẵn | `<...>` | `<...>` | `<...>` |
| Incident drill/timeline/comms/postmortem process test | `<...>` | `<...>` | `<...>` |

## 8. Performance, capacity và cost

| Check | Status | Evidence | Owner/gap |
|---|---|---|---|
| Load/soak test gần production và bottleneck đã biết | `<...>` | `<...>` | `<...>` |
| Peak/growth/failure capacity model, headroom, scale time/quota | `<...>` | `<...>` | `<...>` |
| Rate/connection/body/concurrency limits bảo vệ hệ thống | `<...>` | `<...>` | `<...>` |
| Cost model gồm compute/data/IP/NAT/LB/log/egress/DR/support | `<...>` | `<...>` | `<...>` |
| Budget/anomaly/owner/tags/sandbox TTL và unit economics | `<...>` | `<...>` | `<...>` |

## 9. Launch, rollback và lifecycle

| Check | Status | Evidence | Owner/gap |
|---|---|---|---|
| Change window, prechecks, communication và dependency readiness | `<...>` | `<...>` | `<...>` |
| Canary cohort/traffic steps, success và immutable abort thresholds | `<...>` | `<...>` | `<...>` |
| Rollback/roll-forward/data recovery được time-box/test | `<...>` | `<...>` | `<...>` |
| Observation period, handover và increased monitoring owner | `<...>` | `<...>` | `<...>` |
| Decommission/retention/orphan/billing/state lifecycle có owner | `<...>` | `<...>` | `<...>` |

## Blockers và exceptions

| ID | Gap/risk | Severity | Compensating control | Owner | Due/expiry | Approval/status |
|---|---|---|---|---|---|---|
| `<...>` | `<...>` | `BLOCKER/EXCEPTION` | `<...>` | `<...>` | `<...>` | `<...>` |

## Launch plan summary

| Phase | Scope/traffic | Duration/gate | Success | Abort/rollback | Owner |
|---|---|---|---|---|---|
| Preflight | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| Canary | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| Ramp | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
| Full/observe | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |

## Sign-off

| Role | Decision | Người/nhóm | Date | Conditions/expiry |
|---|---|---|---|---|
| Product/business owner | `<...>` | `<...>` | `<...>` | `<...>` |
| Service/SRE owner | `<...>` | `<...>` | `<...>` | `<...>` |
| Security/data owner | `<...>` | `<...>` | `<...>` | `<...>` |
| Platform/architecture | `<...>` | `<...>` | `<...>` | `<...>` |

`Conditional` không tự chuyển thành `Ready`; owner phải cập nhật evidence, đóng blocker hoặc có risk acceptance hợp lệ.
