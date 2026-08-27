# Lesson 11 — OCI data services, load balancing và DNS

## Mục tiêu

- Chọn data service theo responsibility, HA, RPO/RTO và operating model.
- Thiết kế LB/NLB, backend health, TLS và connection draining.
- Quản lý public/private DNS, TTL và failover.
- Nhận biết tài nguyên đắt/rủi ro và dùng plan/mock trước live test.

## Kiến trúc service/data layer

~~~mermaid
flowchart LR
  DNS[OCI DNS] --> WAF[WAF optional]
  WAF --> LB[Flexible Load Balancer]
  LB --> A1[App pool AD/FD A]
  LB --> A2[App pool AD/FD B]
  A1 --> DB[(Managed database/private endpoint)]
  A2 --> DB
  A1 --> OBJ[Object Storage via Service Gateway]
  MON[Monitoring/Logging] -. health .-> LB
  MON -. metrics/audit .-> DB
~~~

## Chọn data service

| Nhu cầu | Dịch vụ OCI tham khảo | Câu hỏi bắt buộc |
|---|---|---|
| Oracle managed/auto | Autonomous AI Database | workload, ECPU/OCPU model, network, backup, license |
| Oracle toàn quyền hơn | Base Database/Exadata | patching, Data Guard, backup, ops burden |
| MySQL | MySQL HeatWave | HA, analytics, compatibility |
| Key/document at scale | NoSQL | consistency, capacity mode, access pattern |
| Object/blob | Object Storage | tier, retention, version, replication |

Terraform tạo control-plane resource; migration schema/data, logical backup,
replication health và restore verification cần công cụ/runbook khác.

Database password trong variable sensitive vẫn có thể vào state. Ưu tiên API tạo/
rotate secret và runtime workload đọc từ OCI Vault bằng principal. Nếu resource
API bắt buộc password lúc create, state/backend access phải được coi là secret
access; dùng ephemeral/write-only chỉ khi Terraform và provider attribute thực sự
hỗ trợ.

Không apply database sample chỉ để học cú pháp: có thể tốn phí lớn, mất thời gian
provision/delete và cần network/quota. Dùng mock/plan trong compartment sandbox.

## Load Balancer và Network Load Balancer

| OCI Load Balancer | OCI Network Load Balancer |
|---|---|
| L7 HTTP/HTTPS, TLS, cookie/routing policy | L3/L4, TCP/UDP, high-throughput/low latency |
| Flexible bandwidth min/max | Preserve source/flow-oriented features |
| Header/path/hostname logic | Ít application awareness hơn |

Thiết kế:

- public LB ở public subnet hoặc private LB trong private subnet;
- backend app không public IP, chỉ nhận từ LB NSG;
- health endpoint kiểm dependency vừa đủ, nhanh, không leak data;
- listener HTTPS dùng OCI Certificates/Vault, TLS policy và rotation;
- drain backend trước rollout, min healthy capacity và rollback/roll-forward;
- access/error log, request ID, metrics và alarm;
- delete protection/policy gate cho production.

Plan tạo LB chưa chứng minh backend healthy. Sau apply kiểm work request, IP, NSG,
route, app listen, health status và smoke test.

## DNS

- Public zone authoritative cho Internet; registrar delegation/NS records phải đúng.
- Private zone gắn DNS view/resolver cho VCN/hybrid.
- RRset resource quản lý cả record set cùng domain/type; tránh hai state cùng sửa.
- TTL thấp trước migration, tăng lại sau ổn định; TTL thấp không xóa cache ngay.
- DNS steering/health policies cần test failure thật và chống split-brain.
- Private/public cùng tên tạo split-horizon; document rõ query path.

Terraform destroy zone/record production là thay đổi nguy hiểm. Dùng policy,
prevent_destroy phụ trợ và approval; source-of-truth ownership phải duy nhất.

## Sample code

Thư mục [lab/examples](lab/examples) chứa ba template review-only:

- load-balancer.tf.example: flexible LB, backend set, listener.
- private-dns.tf.example: private zone và A RRset.
- autonomous-database.tf.example: cấu trúc tối thiểu, mặc định không dùng trực tiếp.

Đổi đuôi sang .tf chỉ trong root module sandbox và bổ sung versions/provider/
variables. Chạy terraform providers schema -json để đối chiếu provider version
trước khi dùng.

## Hoạt động

1. Lập decision record chọn Autonomous DB so với Base DB cho một workload.
2. Vẽ health-check path; phân biệt liveness, readiness và deep dependency.
3. Mô phỏng một backend unhealthy, quan sát drain/health/metric/alarm.
4. Thiết kế TLS rotation không lưu private key trong repo/state.
5. Hạ TTL trước DNS cutover, mô tả rollback trong thời gian cache cũ còn sống.
6. Diễn tập database restore và đo RPO/RTO; không chỉ kiểm “backup succeeded”.

## Lỗi thường gặp

- LB public nhưng backend cũng có public IP và mở 0.0.0.0/0.
- Health check path cần database nên toàn fleet bị loại khi DB chậm thoáng qua.
- Certificate/private key hard-code trong HCL.
- Hai module quản lý cùng RRset.
- Admin password trong tfvars/repo; output connection wallet/material.
- Chọn dịch vụ theo tên thay vì SLO, data model, ops và cost.

## Tiêu chí hoàn thành

- Chọn data/LB/DNS pattern và nêu trade-off.
- Trace request DNS → LB → backend → DB và failure signal.
- Có TLS/secret/backup/restore/failover runbook kiểm chứng được.

