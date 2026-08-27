# D15 - Platform engineering và Developer Experience

## Mục tiêu

- Xem internal platform như product phục vụ developer, không như collection tool.
- Thiết kế golden path self-service có guardrail, ownership và escape hatch.
- Giảm cognitive load mà không che mất failure/operating model quan trọng.
- Đo adoption, flow, reliability và outcome thay vì chỉ số lần mở portal.

## Platform là gì?

Platform cung cấp reusable capabilities qua API/template/workflow/documentation/support để
stream-aligned team tự phục vụ an toàn: repository, pipeline, runtime, data, identity,
observability, security, cost và lifecycle. Internal Developer Portal có thể là giao diện của
platform; cài portal không tự tạo platform.

~~~mermaid
flowchart TB
  Dev[Internal developer] --> Portal[CLI portal templates APIs]
  Portal --> Catalog[Catalog ownership dependencies]
  Portal --> Delivery[CI CD artifact]
  Portal --> Runtime[Cloud Kubernetes serverless VM]
  Portal --> Data[Database messaging]
  Portal --> Obs[Telemetry SLO]
  Guard[Security cost reliability policy] -.-> Portal
  Team[Platform product team] --> Portal
  Feedback[Research support metrics incidents] --> Team
  Team --> Roadmap[Outcome roadmap]
  Roadmap --> Portal
~~~

Platform giảm cognitive load ngoại lai nhưng không tước quyền hiểu service. Developer vẫn
sở hữu application behavior, on-call và decision trong boundary đã thống nhất.

## Platform-as-product

1. Xác định internal customer/persona và top pain.
2. Map user journey/time-to-first-production/incident journey.
3. Chọn outcome và guardrail.
4. Làm thin slice/golden path nhỏ.
5. Onboard với docs/support/migration.
6. Đo adoption, success, satisfaction và operational impact.
7. Sửa/retire capability dựa trên evidence.

Không bắt mọi team chuyển cùng lúc. Co-design với early adopter; platform mandatory chỉ khi
risk/value đã rõ và trải nghiệm đủ tốt.

## Golden path

Một golden path cho HTTP service có thể:

- scaffold source + owner/catalog metadata;
- tạo CI test/scan/build/provenance;
- cấp runtime/database/identity bằng API/module;
- cấu hình deployment, policy và environment promotion;
- tạo telemetry, SLO, alert, runbook và dashboard;
- gắn budget/tag/TTL;
- cung cấp upgrade/deprecation/cleanup.

Paved road là cách được hỗ trợ tốt, không phải prison. Escape hatch cần justification,
security/reliability ownership, expiry/review và đường quay lại.

## Service catalog và ownership

Catalog trả lời:

- service/component/API/data nào tồn tại;
- owner/on-call/tier/lifecycle;
- source, artifact, deployment và environment;
- dependency upstream/downstream;
- SLO, dashboard, runbook, cost và data classification.

Metadata stale nguy hiểm hơn thiếu. Đồng bộ từ source/runtime/API, validate trong CI và có
owner. Xem [service contract mẫu](service-contract.example.yaml).

## Self-service contract

Platform API cần:

- input schema/default/validation;
- output/reference và trạng thái async;
- SLO/support/escalation;
- versioning/deprecation/migration;
- quota/cost và tenant isolation;
- error message có remediation;
- audit/idempotency/retry;
- escape hatch và ownership boundary.

Template copy code một lần dễ drift; managed component/controller/module có upgrade path tốt
hơn nhưng tăng coupling. Chọn lifecycle phù hợp.

## Multi-tenancy và guardrail

- Tách tenant bằng account/project/namespace/identity/network/data theo risk.
- Quota/fairness/noisy-neighbor và charge allocation.
- Policy-as-code có reason, docs, test và exception.
- Platform credential không được thành đường lateral movement toàn organization.
- Control plane platform cần HA/SLO/DR và change discipline như product production.
- Supply-chain trust của template/plugin/action phải được quản.

## Developer Experience metrics

Kết hợp:

- outcome: lead time, change failure/rework, reliability, time-to-restore;
- journey: setup time, PR wait, deploy wait, time tìm owner/docs;
- platform: successful self-service, error/support volume, SLO, upgrade adoption;
- sentiment: cognitive load, satisfaction, friction qualitative;
- business: feature/user/cost outcome.

Metric là tín hiệu cải tiến, không xếp hạng developer. Adoption cao có thể do bắt buộc chứ
không phải value; support ticket giảm có thể vì user bỏ cuộc.

## Build versus buy

Đánh giá capability khác biệt business, integration, security/compliance, extensibility,
operating skill, vendor roadmap, license + people + migration TCO, data/identity lock-in và
exit plan. Mua tool vẫn cần product ownership, integration và operation.

## AI-assisted delivery

AI coding/operations assistant cần policy:

- data/source nào được gửi tới model/provider;
- machine identity, tool/action scope và human approval;
- generated code/config phải review/test/scan như untrusted contribution;
- prompt/model/tool version và provenance khi ảnh hưởng artifact;
- eval cho correctness/security/reliability, không chỉ demo;
- hallucination/automation blast radius, audit/kill switch;
- latency/token/license/data egress cost.

AI không được nhận production admin chỉ vì “agent cần tự động”.

## Lab: golden path MVP

1. Interview ba “internal customers”; chọn một journey pain lớn nhất.
2. Dùng Order API tạo template source/catalog/pipeline/Kubernetes/IaC/SLO/runbook.
3. Một command/request tạo sandbox có TTL; output link và owner rõ.
4. Failure injection: quota, policy deny, build fail, platform API timeout; error actionable.
5. Onboard một user không tham gia xây; đo time/step/support.
6. Tạo version 2, deprecation và migration không break service cũ.
7. Viết platform SLO, threat model, cost allocation và roadmap.

Project senior trong [Projects](../Projects/README.md) là implementation mở rộng.

## Hoàn thành D15 khi

- Problem/outcome được xác nhận trước tool/portal.
- Golden path end-to-end, self-service và có escape hatch.
- Catalog metadata sống, nối owner/SLO/runbook/cost/dependency.
- Platform có SLO, security boundary, tenant quota và DR.
- Có adoption/journey/outcome evidence và deprecation lifecycle.
- AI/tool automation bị giới hạn bởi trust/risk như mọi supply-chain component.

Nguồn: [CNCF Platforms White Paper](https://tag-app-delivery.cncf.io/whitepapers/platforms/),
[Backstage Software Templates](https://backstage.io/docs/features/software-templates/) và
[DORA platform engineering capability](https://dora.dev/capabilities/platform-engineering/).

Tiếp theo: [D16 - FinOps, capacity và sustainability](../16-finops-capacity-sustainability/README.md).
