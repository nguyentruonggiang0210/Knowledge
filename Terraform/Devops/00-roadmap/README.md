# D00 - Roadmap, baseline và cách học

## Mục tiêu

- Biết DevOps bao phủ people, process, product và technology.
- Đánh giá mức hiện tại bằng evidence thay vì cảm giác.
- Chuẩn bị môi trường local-first, an toàn và tái lập được.
- Lập kế hoạch học có checkpoint, project và phản hồi.

## DevOps không phải là gì?

DevOps không chỉ là CI/CD, Kubernetes, cloud hay chức danh của một người. Nó là cách các
nhóm cùng sở hữu dòng giá trị phần mềm và rút ngắn vòng phản hồi mà vẫn kiểm soát
reliability, security, cost và compliance. Automation chỉ khuếch đại một quy trình; nếu
quy trình sai, automation giúp sai nhanh hơn.

## Bốn cấp evidence

| Cấp | Dấu hiệu | Ví dụ |
|---|---|---|
| Biết | Giải thích được bằng lời của mình | Phân biệt SLI, SLO và SLA |
| Làm | Hoàn thành lab có output | Viết alert từ SLO |
| Vận hành | Xử lý failure và phục hồi | Điều tra alert giả, sửa rồi đo lại |
| Dẫn dắt | Tạo chuẩn cho nhiều team | Review SLO, coaching và cải thiện platform |

Không tự đánh dấu “mastered” nếu chỉ xem video hoặc copy lệnh thành công một lần.

## Baseline 90 phút

Không tra cứu, hãy thử:

1. Giải thích đường đi của một HTTPS request từ laptop đến API và database.
2. Tìm process đang nghe một port, log của nó và nguyên nhân một DNS lookup thất bại.
3. Tạo Git branch, gây conflict, resolve, revert một commit và gắn tag.
4. Viết script nhận URL, timeout, retry có giới hạn và trả exit code đúng.
5. Vẽ pipeline build một lần, promote cùng artifact qua dev/staging/prod.
6. Nêu SLI/SLO cho login API và cách xử lý khi sắp hết error budget.
7. Nêu RTO/RPO và chứng minh backup thật sự khôi phục được.
8. Review một kiến trúc theo security, reliability, cost và operability.

Ghi mỗi mục 0-3 theo bốn cấp evidence ở trên. Điểm thấp quyết định thời gian học, không
phải lý do để bỏ cuộc.

## Setup local-first

Kiểm tra công cụ, không cần tất cả ngay ngày đầu:

~~~powershell
git --version
python --version
docker version
terraform version
kubectl version --client
~~~

~~~bash
git --version
python3 --version
docker version
terraform version
kubectl version --client
~~~

Tạo một repository evidence riêng với cấu trúc:

~~~text
devops-portfolio/
├── labs/
├── projects/
├── diagrams/
├── adrs/
├── runbooks/
├── incidents/
└── evidence/
~~~

Không commit .env thật, token, key, kubeconfig, state, plan, database dump hay output có
PII. Dùng file .example và secret store.

## Kế hoạch 40 tuần

### Phase 1 - Foundation

- D01-D05, Project Foundation Automation.
- Gate: tự debug một service hỏng qua process, port, DNS, HTTP, TLS và log.
- Quiz Foundation tối thiểu 80%.

### Phase 2 - Delivery and cloud

- D06-D10 và track Terraform L01-L14.
- Gate: một commit tạo immutable artifact, qua test/scan, deploy local Kubernetes và có
  rollout/rollback evidence.
- Quiz Core và Cloud-Native tối thiểu 80%.

### Phase 3 - Production engineering

- D11-D16.
- Gate: threat model, SLO, dashboard, actionable alert, restore test và unit-cost review.
- Quiz Production tối thiểu 80%.

### Phase 4 - Senior ownership

- D17-D20.
- Gate: dẫn một game day, viết postmortem, bảo vệ architecture decision và capstone.
- Quiz Senior cùng practical rubric đạt ngưỡng.

## Nhật ký tuần

~~~markdown
# Tuần NN

- Outcome muốn đạt:
- Assumption:
- Việc đã làm:
- Evidence:
- Failure đã tạo:
- Root cause:
- Cách phục hồi:
- Điều chưa hiểu:
- Quyết định/ADR:
- Việc tuần sau:
~~~

## Nguyên tắc chọn công cụ

Đi từ constraint đến decision:

1. Outcome và SLO là gì?
2. Threat/failure/cost model là gì?
3. Team có năng lực vận hành gì?
4. Giải pháp đơn giản nhất đáp ứng yêu cầu là gì?
5. Exit strategy và blast radius ra sao?

Không chọn multi-cloud, Kubernetes hay microservices chỉ vì phổ biến. Một VM và managed
database có thể là thiết kế tốt hơn nếu đáp ứng outcome với ít gánh nặng vận hành hơn.

## Hoàn thành D00 khi

- Có baseline 0-3 cho tám bài kiểm tra.
- Có lịch học thực tế và checkpoint trong calendar.
- Có evidence repository cùng quy tắc không lưu secret.
- Có thể giải thích vì sao seniority cần production ownership, không chỉ chứng chỉ.

Tiếp theo: [D01 - DevOps culture, product và SDLC](../01-devops-culture-sdlc/README.md).
