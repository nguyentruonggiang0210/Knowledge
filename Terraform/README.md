# Terraform Mastery Roadmap — Oracle Cloud làm trọng tâm

Repository này là một lộ trình tự học Terraform từ số 0 đến mức có thể thiết kế,
review và vận hành Infrastructure as Code trong đội DevOps. Oracle Cloud
Infrastructure (OCI) là môi trường thực hành chính; AWS và Azure được ánh xạ trong
phần tham chiếu để bạn chuyển đổi tư duy giữa các cloud.

## Bắt đầu ở đâu?

1. Đọc [lộ trình và cách học](Lessions/00-roadmap/README.md).
2. Học tuần tự từ [Lesson 01](Lessions/01-iac-terraform-foundations/README.md).
3. Chạy lab trong mỗi bài, ghi lại bằng chứng vào nhật ký học tập.
4. Làm quiz tương ứng trong [Quiz](Quiz/README.md), rồi mới xem đáp án.
5. Dùng [Refer](Refer/README.md) khi cần đối chiếu OCI với AWS/Azure.
6. Theo dõi [mastery checklist](Lessions/MASTERY-CHECKLIST.md) và dùng
   [CLI cheatsheet](Lessions/CHEATSHEET.md) khi thực hành.
7. Học curriculum [DevOps D00–D20](Devops/README.md), làm
   [DevOps Quiz](Devops/Quiz/README.md) và các project portfolio.
8. Hoàn thành [capstone production](Lessions/17-capstone-production/README.md).

## Cấu trúc

~~~text
.
├── Lessions/  # Tên giữ theo yêu cầu; 17 chặng, OCI labs và capstone
├── Refer/     # AWS/Azure samples và bảng so sánh đa cloud
├── Quiz/      # Câu hỏi, tình huống, practical assessment, đáp án
├── Devops/    # 21 chặng, labs, 100 quiz, templates và 4 project portfolio
└── scripts/   # Công cụ kiểm tra repository
~~~

## Nguyên tắc an toàn

- Đọc plan trước apply; production phải có code review và phê duyệt.
- Không commit private key, token, password, file .tfstate hoặc saved plan.
- Mọi lab tạo cloud resource đều có thể phát sinh phí. Dùng compartment/project
  riêng, budget/alert, tag owner và chạy destroy khi học xong.
- Không chạy destroy nếu đang trỏ tới tenancy/subscription/account dùng chung.
- Giá, quota, image OCID và khả năng cung cấp dịch vụ thay đổi theo region; kiểm
  tra lại console/tài liệu cloud trước khi apply.

## Phạm vi “master”

Không có một giáo trình hữu hạn nào bảo đảm bao phủ mọi dịch vụ cloud. Bộ này bao
phủ đầy đủ năng lực Terraform cốt lõi và production: HCL, dependency graph, state,
import/refactor, modules, OCI, security, test/policy, CI/CD, drift, cost, DR và
troubleshooting. Curriculum Devops bổ sung Linux, network, Git/scripting, cloud,
delivery, containers/Kubernetes, security, observability/SRE, data, platform,
FinOps, incident, DR, distributed systems và senior leadership. Lý thuyết không
thay thế production ownership, on-call, restore drill và mentoring thực tế.

## Phiên bản mục tiêu

- Terraform CLI: nên dùng 1.12 trở lên vì native OCI backend cần mốc này; các lab
  core không dùng backend mới vẫn hỗ trợ từ 1.7 để thực hành provider mocking.
  Samples đặt constraint nhỏ hơn 2.0 và nên được khóa bằng dependency lock file.
- OCI provider: major version hiện hành được constraint trong từng sample; luôn
  review changelog khi nâng major.

Tài liệu được thiết kế để đọc trên Windows PowerShell, Linux hoặc macOS. Lệnh
Terraform giống nhau; chỉ phần thiết lập biến môi trường khác nhau.
