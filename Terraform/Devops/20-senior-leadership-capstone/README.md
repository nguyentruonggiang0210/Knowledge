# D20 - Senior DevOps leadership và capstone

## Mục tiêu

- Chuyển business outcome/risk thành technical decision và roadmap.
- Review architecture/change/incident bằng evidence và trade-off.
- Mentoring, giao tiếp và làm tăng năng lực của cả team.
- Hoàn thành capstone production có delivery, security, reliability, data, cost và recovery.

## Senior khác “biết nhiều tool”

Senior engineer tạo outcome qua hệ thống và con người:

- làm rõ ambiguity/constraint, không vội chọn tool;
- nhìn end-to-end từ product đến packet/runtime/data/finance;
- giảm blast radius và tạo recovery path trước change;
- đưa reliability/security/cost/operability vào thiết kế;
- dẫn incident, review và quyết định dưới uncertainty;
- biến recurring pain thành standard/platform/automation;
- nâng autonomy của người khác qua mentoring/docs/feedback.

Mastery không phải luôn có đáp án. Đó là biết tìm evidence, gọi đúng specialist, nêu
assumption, quản risk và cập nhật quyết định khi context đổi.

## Technical strategy

~~~text
Business outcome
  -> current constraints and capabilities
  -> principles and target outcomes
  -> options and trade-offs
  -> incremental roadmap with leading signals
  -> delivery, adoption and operating model
  -> measure outcome and revise
~~~

Roadmap không phải danh sách migrate Kubernetes/mua tool. Mỗi initiative có problem, expected
outcome, dependency, owner, capacity/cost, risk, success/stop signal và migration/exit.

## Architecture review

Review theo câu hỏi:

1. User/business outcome, SLO và non-functional requirement?
2. Assumption/constraint/data classification/compliance?
3. Component/ownership/dependency/trust/failure boundary?
4. Capacity/performance/cost model?
5. Deploy/config/schema compatibility và recovery?
6. Detection/on-call/runbook/incident/DR?
7. Alternatives, reversible/irreversible decision và exit?
8. Evidence/prototype và unknown nào cần experiment?

ADR ngắn cho decision quan trọng; architecture diagram phải thể hiện data/trust/failure path,
không chỉ icon cloud. Dissent được ghi, decision owner rõ và revisit trigger.

## Risk và technical debt

Risk record: scenario, asset/outcome, likelihood, impact, existing control, residual risk,
option, owner, review date. Technical debt chỉ có ý nghĩa khi nối friction/failure/cost/risk.
Ưu tiên theo expected impact/urgency/option value, không theo người nói to nhất.

Một senior biết chấp nhận risk có thời hạn khi business cần, nhưng làm rõ người có authority,
compensating control và expiry. Silent risk acceptance là anti-pattern.

## Mentoring và review

- Hỏi mental model/hypothesis trước khi đưa lệnh.
- Feedback cụ thể theo behavior/impact/next step, gần thời điểm.
- Giao task có stretch nhưng safety net; tăng decision scope dần.
- Pair trong incident/design, sau đó để mentee dẫn và debrief.
- Review code/config tập trung correctness/risk/maintainability; tránh gatekeeping/style war.
- Docs/runbook/lab và rotation giảm bus factor/hero dependency.

Senior không giữ quyền bằng cách là người duy nhất biết production.

## Stakeholder communication

| Đối tượng | Cần nghe |
|---|---|
| Engineer | constraint, interface, failure, migration, evidence |
| Product | user impact, option/scope/time/risk |
| Security/compliance | threat/control/evidence/residual risk |
| Finance/procurement | unit economics, TCO, commitment/vendor/exit |
| Executive | outcome, material risk, decision/ask và confidence |
| Incident stakeholder | impact, mitigation, uncertainty, next update |

Giữ một source of truth nhưng điều chỉnh mức chi tiết. Nói “chưa biết” kèm cách/timeline tìm
hiểu tốt hơn ETA đoán.

## Build versus buy và vendor

Đánh giá capability khác biệt, integration, security/data, reliability/SLA, roadmap, support,
license + implementation + operations TCO, migration, skills, lock-in và exit. Proof-of-concept
phải test critical workflow/failure/export/identity, không chỉ happy-path demo.

Contract không thay architecture: service credit không bù data/user loss. Quản renewal,
usage/commitment, vulnerability, deprecation và concentration risk.

## Capstone OrderFlow

Core capstone là [Project 03 - OCI production platform](../Projects/03-senior-production-platform/README.md).
Chỉ thêm [Project 04 - multi-cloud resilience](../Projects/04-capstone-multicloud-resilience/README.md)
khi ADR chứng minh business/compliance/DR benefit lớn hơn complexity. AWS/Azure có thể ở mức
thiết kế/plan-only; không apply resource trả phí chỉ để đạt checklist.

### Required architecture

- Order API + worker + PostgreSQL + cache/broker, versioned API/schema.
- OCI landing zone, private data/app path, workload identity và Terraform state an toàn.
- VM pool hoặc OKE; immutable signed image promote bằng digest qua dev/staging/prod.
- CI gates: test, SAST/SCA/secret/IaC/image, SBOM/provenance/policy.
- GitOps hoặc controlled CD, canary và database expand-contract.
- OTel metrics/logs/traces, SLI/SLO/burn alert và telemetry-pipeline health.
- Idempotency/outbox/DLQ/backpressure; backup/PITR và integrity reconciliation.
- FinOps allocation, forecast, unit cost và N-1 capacity.
- Incident/game day, DR/failback; cross-cloud decision có business case.
- Service catalog, ADR, runbook, threat model, production-readiness và ownership.

### Required failure drills

1. Bad deployment/probe tự abort.
2. Payment latency + retry cascade.
3. Duplicate/out-of-order event.
4. Secret leak và zero-downtime rotation.
5. Node/zone loss và N-1 capacity.
6. Telemetry exporter loss.
7. Database corruption/PITR restore.
8. Region/identity/dependency disaster và failback.
9. Sudden cost anomaly/quota.
10. Emergency change rồi reconcile Git/IaC.

Mỗi drill có hypothesis, safety/abort, timeline, evidence, recovery/data verify và action.

## Defense panel

Không chỉ demo xanh. Trong 60-90 phút:

1. 10 phút: business outcome, users, SLO và constraints.
2. 15 phút: architecture/trust/data/failure/dependency.
3. 15 phút: source-to-production live evidence/digest.
4. 15 phút: một failure drill và recovery.
5. 15 phút: trade-off/cost/DR/multi-cloud.
6. 20 phút: panel hỏi “what if”, migration và rejected alternatives.

Rubric 100:

| Nhóm | Điểm |
|---|---:|
| Architecture và delivery | 20 |
| Security và supply chain | 15 |
| Observability/SRE/performance | 15 |
| Data/reliability/DR | 20 |
| Platform/FinOps/operability | 15 |
| Leadership, decision và communication | 15 |

Safety gate: secret thật/public data/destructive command không kiểm soát/không cleanup/không
restore evidence thì chưa đạt dù tổng điểm cao. So thêm
[Quiz practical rubric](../Quiz/practical/capstone-rubric.md).

## Portfolio handoff

README của mỗi project cần problem/outcome, architecture, prerequisites/version, one-command
hoặc rõ từng bước run, test/failure/recovery, cost/safety/cleanup, limitation và decisions.
Ẩn account/PII/credential trong evidence. Người khác phải fresh-clone và tái lập đường chính.

## Kế hoạch phát triển sau capstone

### 30 ngày

- Chọn một service/domain thật, shadow on-call và map value/dependency.
- Đóng một gap nhỏ bằng runbook/test/alert/automation.

### 60 ngày

- Sở hữu một change production và một game day có reviewer.
- Review design/PR và mentor một người theo evidence.

### 90 ngày

- Đề xuất roadmap outcome cho một reliability/security/cost/platform constraint.
- Đo before/after, chia sẻ lesson và cập nhật mastery checklist.

Lặp theo context mới. Chứng chỉ có thể cấu trúc kiến thức, không thay production ownership.

## Hoàn thành D20 khi

- Capstone đạt rubric/safety gate và người khác reproduce được.
- Bảo vệ được rejected options/unknown/exit, không chỉ tool choice.
- Dẫn failure/incident và recovery bình tĩnh bằng evidence.
- Có output mentoring/review giúp người khác tự chủ hơn.
- Roadmap nối business outcome, risk, capacity/cost và measurable learning.

Quay lại [DevOps Mastery Checklist](../MASTERY-CHECKLIST.md), làm
[Senior Quiz](../Quiz/levels/05-senior.md) và cập nhật gap mỗi quý.
