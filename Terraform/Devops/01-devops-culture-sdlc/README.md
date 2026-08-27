# D01 - DevOps culture, product và SDLC

## Mục tiêu

- Hiểu DevOps là operating model cho dòng giá trị, không phải một bộ công cụ.
- Phân biệt Agile, Lean, CI, Continuous Delivery, Continuous Deployment và SRE.
- Vẽ value stream và tìm constraint bằng dữ liệu.
- Thiết kế SDLC có security, reliability, operability và feedback ngay từ đầu.
- Dùng delivery metrics để cải tiến, không để xếp hạng hay phạt cá nhân.

## Mental model

~~~mermaid
flowchart LR
  Idea --> Discover --> Design --> Code --> Review --> Build --> Verify
  Verify --> Deploy --> Release --> Operate --> Learn --> Idea
  User[User outcome] -. feedback .-> Discover
  Security[Security] -. guardrail .-> Design
  SRE[Reliability] -. SLO .-> Design
  Ops[Operability] -. runbook telemetry recovery .-> Code
~~~

- Flow: làm batch nhỏ, giảm work-in-progress, handoff và thời gian chờ.
- Feedback: phát hiện sai sớm từ test, user, telemetry và incident.
- Learning: experiment an toàn, postmortem không đổ lỗi và cải tiến hệ thống.

DevOps bổ sung cho Agile/Lean: Agile tập trung thích nghi và giao giá trị; Lean loại lãng
phí và tối ưu flow; DevOps mở ownership qua build, delivery và operations; SRE cung cấp
phương pháp engineering cho reliability.

## Từ ý tưởng đến production

| Bước | Câu hỏi bắt buộc | Evidence |
|---|---|---|
| Discovery | Người dùng cần outcome nào? | Problem statement, success metric |
| Design | Failure, threat, data, cost model? | ADR, diagram, SLO, threat model |
| Code | Thay đổi có nhỏ và reviewable? | Commit/PR, unit test |
| Build | Có tái lập và truy nguồn được? | Artifact digest, SBOM, provenance |
| Verify | Functional và non-functional đạt? | Test/scan/policy results |
| Deploy | Blast radius và đường phục hồi? | Change plan, canary signals |
| Release | Ai được thấy tính năng? | Feature flag/audience record |
| Operate | Owner biết hệ thống đang khỏe? | Dashboard, alert, runbook |
| Learn | Cải tiến nào có tác động? | Metrics, retro/postmortem actions |

Deployment là đưa code vào môi trường. Release là cho người dùng tiếp cận behavior mới.
Feature flag có thể tách hai việc này, nhưng flag cũng cần owner và ngày xóa.

## Continuous Delivery và Deployment

- CI: merge thường xuyên, build/test tự động, main luôn ở trạng thái có thể sửa nhanh.
- Continuous Delivery: artifact luôn sẵn sàng deploy; production có thể cần phê duyệt.
- Continuous Deployment: thay đổi đạt mọi gate được tự động đưa tới production.
- CD không có nghĩa bỏ kiểm soát. Kiểm soát tốt được mã hóa, nhanh, audit được và tỷ lệ với
  rủi ro.

## Năm software delivery metrics hiện hành của DORA

Nhóm throughput:

1. Change lead time: từ commit đến deploy production thành công.
2. Deployment frequency: số lần deploy trong một khoảng hoặc khoảng cách giữa hai lần.
3. Failed deployment recovery time: thời gian phục hồi deployment cần can thiệp ngay.

Nhóm instability:

4. Change fail rate: tỷ lệ deployment cần rollback, hotfix hoặc can thiệp ngay.
5. Deployment rework rate: tỷ lệ deployment ngoài kế hoạch do incident production.

Đo theo từng application/service và xu hướng của chính team. Không gộp hệ thống khác bản
chất, không đặt metric thành quota cá nhân, không tối ưu một metric bằng cách làm xấu
outcome. Bắt đầu bằng dữ liệu đủ dùng rồi sửa constraint lớn nhất.

## Value-stream map mẫu

| Bước | Process time | Wait time | Rework | Vấn đề |
|---|---:|---:|---:|---|
| Code | 4 giờ | 0 | 5% | Batch lớn |
| Review | 30 phút | 2 ngày | 20% | Thiếu reviewer/DoD |
| Test | 20 phút | 1 ngày | 15% | Môi trường không ổn định |
| CAB/deploy | 10 phút | 5 ngày | 3% | Approval thủ công theo lịch |

Lead time gần 8 ngày dù thời gian tạo giá trị dưới 5 giờ. Constraint đầu tiên có thể là
queue approval hoặc review, không phải tốc độ build. Hãy giảm batch, tự động hóa evidence
và đo lại trước khi mua thêm công cụ.

## Ownership và Team Topologies cơ bản

- Stream-aligned team sở hữu outcome/service end-to-end.
- Platform team cung cấp capability self-service dùng lại được.
- Enabling team giúp nâng năng lực ở một domain, không tạo phụ thuộc vĩnh viễn.
- Complicated-subsystem team sở hữu phần cần chuyên môn sâu.

“You build it, you run it” chỉ hiệu quả khi team có quyền quyết định, telemetry, support
từ platform và workload on-call bền vững. Trách nhiệm mà không có quyền/công cụ là
anti-pattern.

## Definition of Done production-ready

Một thay đổi không “done” nếu thiếu các mục phù hợp với risk:

- acceptance test, review và traceability đến yêu cầu;
- security/data classification, dependency và secret handling;
- telemetry, SLI impact, dashboard/alert/runbook;
- rollout, backward compatibility, rollback hoặc roll-forward;
- documentation, owner, support và cleanup/deprecation;
- cost/capacity impact và evidence audit.

## Lab: map dòng giá trị của một service

1. Chọn một service thật hoặc project mẫu.
2. Mời product, developer, tester, security và operator cùng map từ yêu cầu đến user.
3. Ghi process time, wait time, rework, handoff và hệ thống evidence ở từng bước.
4. Baseline năm delivery metrics; nếu thiếu dữ liệu, ghi rõ proxy và độ tin cậy.
5. Chọn một constraint, tạo experiment hai tuần với outcome và guardrail.
6. Viết Definition of Done mới và RACI cho incident/change.
7. Đo lại; giữ, sửa hoặc bỏ experiment dựa trên evidence.

Ví dụ hypothesis: “Nếu PR dưới 300 dòng và có reviewer rotation, median review wait giảm
từ 16 giờ xuống dưới 6 giờ mà change fail rate không tăng.”

## Lỗi thường gặp

- Tạo “DevOps team” làm cổng nhận ticket, tăng thêm handoff.
- Tự động hóa quy trình không cần thiết trước khi xóa bước thừa.
- Mua Kubernetes/platform rồi gọi đó là transformation.
- Đo số ticket, commit hoặc deploy để so năng suất cá nhân.
- Bắt operations chịu on-call nhưng development không cùng sở hữu root cause.
- Dành riêng một sprint “hardening” thay vì đưa quality/security vào mọi thay đổi.

## Hoàn thành D01 khi

- Giải thích được deployment khác release và Delivery khác Deployment.
- Có value-stream map với process/wait/rework, không chỉ sơ đồ pipeline.
- Có baseline năm metrics theo một service và biết giới hạn dữ liệu.
- Có một experiment cải tiến nhỏ, owner, thời hạn và guardrail.
- Definition of Done bao gồm security, reliability, recovery và operability.

Nguồn: [DORA metrics](https://dora.dev/guides/dora-metrics/),
[DORA capabilities](https://dora.dev/capabilities/) và
[The Scrum Guide](https://scrumguides.org/scrum-guide.html).

Tiếp theo: [D02 - Linux và hệ thống](../02-linux-systems/README.md).
