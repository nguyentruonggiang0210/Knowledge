# DevOps từ nền tảng đến Senior/Master

Đây là curriculum DevOps độc lập, học theo hướng production và dùng được cùng track
Terraform/OCI của repository. Mục tiêu không phải thuộc thật nhiều tên công cụ mà là hiểu
được toàn bộ dòng chảy từ yêu cầu kinh doanh đến code, hạ tầng, runtime, dữ liệu, tín hiệu
vận hành và cải tiến sau sự cố.

Không có bộ tài liệu hữu hạn nào tự động biến một người thành Senior. Cấp độ senior cần
thêm thời gian sở hữu hệ thống thật, trực on-call, xử lý incident, review thiết kế và hướng
dẫn đồng đội. Bộ này cung cấp kiến thức, lab, dự án và tiêu chí evidence để rút ngắn con
đường đó và tránh học lệch chỉ theo công cụ.

## Bắt đầu ở đâu?

1. Đọc [D00 - Roadmap và cách học](00-roadmap/README.md).
2. Học D01 đến D20 theo thứ tự; có thể học song song lesson Terraform tương ứng.
3. Sau mỗi lesson, làm lab, lưu evidence và làm quiz không xem đáp án.
4. Hoàn thành ba [dự án portfolio](Projects/README.md), rồi làm capstone.
5. Dùng [mastery checklist](MASTERY-CHECKLIST.md) để tìm lỗ hổng thay vì chỉ đếm bài đã đọc.

Tài liệu hỗ trợ:

- [Cheatsheet](CHEATSHEET.md): lệnh điều tra và vận hành thường dùng.
- [Glossary](GLOSSARY.md): giải nghĩa thuật ngữ.
- [Nguồn chính thức](SOURCES.md): nơi kiểm tra lại phiên bản và đào sâu.
- [Quiz DevOps](Quiz/README.md): câu hỏi, tình huống, debug và bài thực hành.
- [Templates production](Templates/README.md): ADR, SLO, runbook, postmortem, DR.
- [Terraform/OCI lessons](../Lessions/README.md) và [so sánh cloud](../Refer/README.md).

## Bản đồ năng lực D00-D20

| ID | Chủ đề | Bạn phải tạo được |
|---|---|---|
| D00 | [Roadmap và môi trường học](00-roadmap/README.md) | Kế hoạch, baseline và evidence repository |
| D01 | [DevOps culture, product và SDLC](01-devops-culture-sdlc/README.md) | Value-stream map, Definition of Done |
| D02 | [Linux và hệ thống](02-linux-systems/README.md) | System audit, service và runbook debug |
| D03 | [Network, DNS, HTTP và TLS](03-networking-dns-http-tls/README.md) | Packet path và playbook điều tra |
| D04 | [Git và collaboration](04-git-collaboration/README.md) | PR sạch, recovery và release tag |
| D05 | [Scripting và automation](05-scripting-automation/README.md) | Script idempotent, test được, exit code đúng |
| D06 | [Cloud architecture](06-cloud-architecture/README.md) | Landing-zone và shared-responsibility design |
| D07 | [IaC, configuration và image](07-iac-configuration-images/README.md) | Ranh giới Terraform/Ansible/Packer và pipeline |
| D08 | [CI/CD, artifact và release](08-cicd-artifacts-release/README.md) | Pipeline promote một immutable artifact |
| D09 | [Container và Docker](09-containers-docker/README.md) | Image nhỏ, non-root, Compose health tốt |
| D10 | [Kubernetes, Helm và GitOps](10-kubernetes-helm-gitops/README.md) | Workload an toàn, rollout/rollback và policy |
| D11 | [DevSecOps và supply chain](11-devsecops-supply-chain/README.md) | Threat model, SBOM, provenance và security gates |
| D12 | [Observability và OpenTelemetry](12-observability-opentelemetry/README.md) | Correlated metrics/logs/traces và actionable alert |
| D13 | [SRE, reliability và performance](13-sre-reliability-performance/README.md) | SLI/SLO, error budget, load/chaos experiment |
| D14 | [Data, database và messaging](14-data-databases-messaging/README.md) | Migration tương thích và restore đã kiểm chứng |
| D15 | [Platform engineering và DX](15-platform-engineering-dx/README.md) | Golden path có guardrail và product metrics |
| D16 | [FinOps, capacity và sustainability](16-finops-capacity-sustainability/README.md) | Unit cost, forecast và optimization decision |
| D17 | [Incident, change và problem](17-incident-change-problem/README.md) | Incident command, postmortem và action tracking |
| D18 | [HA, backup và disaster recovery](18-ha-backup-disaster-recovery/README.md) | RTO/RPO, restore, failover/failback game day |
| D19 | [Distributed, hybrid và multi-cloud](19-distributed-hybrid-multicloud/README.md) | Trade-off consistency, resilience và portability |
| D20 | [Senior leadership và capstone](20-senior-leadership-capstone/README.md) | Architecture review, roadmap, mentoring và demo |

## Mô hình DevOps end-to-end

~~~mermaid
flowchart LR
  Need[Business need] --> Plan[Product and design]
  Plan --> Code[Code and review]
  Code --> Build[Build test scan]
  Build --> Artifact[Immutable artifact]
  Artifact --> Deploy[Progressive delivery]
  Deploy --> Runtime[Cloud VM containers Kubernetes]
  Runtime --> User[User outcome]
  Runtime --> Signals[Metrics logs traces profiles]
  Signals --> SLO[SLI SLO error budget]
  SLO --> Learn[Incident cost security feedback]
  Learn --> Plan
  Policy[Security reliability cost guardrails] -.-> Plan
  Policy -.-> Build
  Policy -.-> Deploy
~~~

DevOps là vòng phản hồi chung của product, development, security, operations và business;
không phải một team nhận ticket để “deploy hộ”.

## Nhịp học đề xuất: 40 tuần

| Giai đoạn | Tuần | Nội dung | Gate |
|---|---:|---|---|
| Foundation | 1-10 | D00-D05 | Project 1 chạy local, debug bằng evidence |
| Delivery and cloud | 11-20 | D06-D10 | Project 2 có CI/CD, IaC, container/Kubernetes |
| Production engineering | 21-32 | D11-D16 | SLO, security, observability, data và cost review |
| Senior ownership | 33-40 | D17-D20 | Game day, DR test, capstone và architecture review |

Nếu đã có kinh nghiệm, làm pre-test và lab challenge trước. Chỉ bỏ qua lesson khi vừa giải
thích được nguyên lý, vừa hoàn thành practical gate. Tốc độ tham khảo là 8-12 giờ mỗi tuần;
lab cloud trả phí luôn là opt-in, còn đường học local-first là mặc định.

## Chu kỳ học cho từng lesson

~~~text
Định nghĩa -> mental model -> sample -> lab -> phá có chủ đích
           -> quan sát evidence -> khôi phục -> quiz -> ghi bài học
~~~

Evidence nên commit vào repository riêng của bạn:

- README ghi assumption, cách chạy và cách cleanup;
- sơ đồ kiến trúc và ADR giải thích trade-off;
- test output, pipeline run và ảnh dashboard đã loại dữ liệu nhạy cảm;
- SLO, runbook, postmortem/game-day report;
- chi phí ước tính, threat model và production-readiness review.

## Môi trường thực hành

Tối thiểu: Git, một terminal PowerShell hoặc Bash, Python 3, Docker và editor. Các lesson
Kubernetes có thể dùng kind, minikube hoặc k3d. Phần cloud ưu tiên OCI để khớp track
Terraform, nhưng mọi nguyên lý đều có bài đối chiếu AWS/Azure.

Trước khi chạy một lệnh:

1. đọc script/config và hiểu resource nào sẽ đổi;
2. không dùng credential thật trong Git, log, screenshot hoặc artifact;
3. pin version, dùng sandbox riêng, budget/TTL và least privilege;
4. có cách dừng và cleanup; backup không được coi là hợp lệ trước khi restore test;
5. production change phải có reviewer, monitoring và rollback hoặc roll-forward plan.

## Khi nào đạt Senior?

Bạn ở mức senior thực dụng khi có thể độc lập:

- đi từ triệu chứng tới root cause bằng hypothesis và evidence, không đoán mò;
- thiết kế thay đổi nhỏ, audit được, chịu lỗi và có đường phục hồi;
- cân bằng delivery speed với reliability, security, cost và trải nghiệm developer;
- xử lý incident bình tĩnh, giao tiếp rõ, tạo corrective action có owner;
- review kiến trúc/code, nêu trade-off và nói “không cần công cụ này” khi phù hợp;
- biến bài học cá nhân thành automation, guardrail, runbook và năng lực của cả team.

“Master” không phải cấp cuối của checklist. Đó là khả năng liên tục học, giảm rủi ro hệ
thống và làm người khác thành công hơn qua những bối cảnh mới.
