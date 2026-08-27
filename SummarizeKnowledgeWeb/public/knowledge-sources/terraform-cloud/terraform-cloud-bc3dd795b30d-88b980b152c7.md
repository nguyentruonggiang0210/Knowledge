# Level 3 – Terraform với Oracle Cloud Infrastructure

Tổng: **14 câu / 27 điểm**. Giả định kiến trúc cần least privilege, private tier và khả năng review plan.

## O01 — Trắc nghiệm (1 điểm) · L08

Compartment OCI chủ yếu giúp gì?

A. Thay thế hoàn toàn region  
B. Tổ chức/cô lập logic tài nguyên và làm scope cho IAM policy, quota, cost governance  
C. Mã hóa state Terraform  
D. Tự tạo kết nối Internet cho subnet

## O02 — Trắc nghiệm (1 điểm) · L09

Một instance trong private subnet cần truy cập Internet chiều ra để tải package nhưng không nhận kết nối Internet chiều vào. Gateway phù hợp nhất là:

A. Internet Gateway  
B. NAT Gateway  
C. Local Peering Gateway  
D. Dynamic Routing Gateway duy nhất, không cần route

## O03 — Đúng/Sai (1 điểm) · L09

Chỉ cần gán public IP cho VNIC là instance chắc chắn truy cập được từ Internet, bất kể route table, gateway, NSG/security list và host firewall.

## O04 — Trắc nghiệm (1 điểm) · L09

Lợi ích thực tế nổi bật của Network Security Group (NSG) so với chỉ dùng security list gắn subnet là gì?

A. NSG thay thế route table  
B. Có thể nhóm/chính sách theo VNIC/workload, giảm phụ thuộc ranh giới subnet  
C. NSG cấp public IP  
D. NSG là một loại VCN

## O05 — Giải thích đường đi gói tin (2 điểm) · L09

Để Internet client truy cập HTTPS tới public load balancer rồi chuyển tới backend private, hãy liệt kê các lớp định tuyến và kiểm soát lưu lượng cần kiểm tra. Phân biệt vai trò route với NSG/security rule.

## O06 — Debug network (3 điểm) · L09, L10

Compute trong private subnet không truy cập được OCI Object Storage. Kiến trúc dự định dùng Service Gateway, không đi Internet. Hãy nêu tối thiểu bốn điểm cần kiểm tra trong Terraform/OCI và cách khoanh vùng mà không mở `0.0.0.0/0` inbound.

## O07 — Trắc nghiệm (1 điểm) · L08, L12

Ứng dụng trên OCI Compute cần gọi OCI API mà không lưu user API private key trên máy. Mẫu xác thực phù hợp nhất là:

A. Hard-code auth token trong `user_data`  
B. Instance principal kết hợp dynamic group và IAM policy tối thiểu  
C. Commit file PEM vào module  
D. Cho phép anonymous access

## O08 — Giải thích IAM (2 điểm) · L08

Phân biệt IAM group và dynamic group trong OCI. Principal nào thường thuộc từng loại và policy sẽ liên hệ chúng với quyền truy cập ra sao?

## O09 — Tình huống compute (3 điểm) · L10, L12

Bạn cần bootstrap web server bằng cloud-init. Hãy mô tả cách truyền `user_data` trong Terraform, cách tránh lộ secret, cách xử lý thay đổi script có thể dẫn tới replace/reprovision, và tiêu chí để chuyển phần cấu hình dài hạn sang image pipeline/configuration management.

## O10 — Debug multi-region provider (3 điểm) · L03, L15

Root module khai báo provider OCI mặc định ở Singapore và alias `dr` ở Tokyo. Child module DR vẫn tạo resource tại Singapore. Viết khung cấu hình đúng ở root và lời gọi module để truyền provider alias; nêu yêu cầu child module đối với provider source/local name.

## O11 — Trắc nghiệm (1 điểm) · L10, L16

Đặc tính nào nên bật/cấu hình để tăng khả năng phục hồi khi dùng Object Storage lưu artifact quan trọng?

A. Public write cho mọi người  
B. Versioning/retention phù hợp, encryption và policy truy cập tối thiểu  
C. Lưu secret trong object name  
D. Chỉ dùng local-exec upload không kiểm tra lỗi

## O12 — Giải thích load balancer (2 điểm) · L11, L16

Backend đang chạy nhưng load balancer đánh dấu unhealthy. Ngoài tiến trình ứng dụng, hãy nêu các cấu hình Terraform/OCI cần đối chiếu: listener/backend set, health checker, port/path/status, network rule và timeout.

## O13 — Tình huống HA (3 điểm) · L09, L10, L11, L16

Thiết kế một dịch vụ web OCI chịu lỗi trong một region: public LB, app private, database/private service. Mô tả phân bố fault/availability domain, subnet/NSG, health check, stateful data, backup và những output/module boundary chính. Không cần viết toàn bộ code.

## O14 — Debug IAM policy (3 điểm) · L08, L12, L16

Pipeline chạy Terraform nhận lỗi `NotAuthorizedOrNotFound` khi tạo subnet trong compartment `app-prod`. Hãy đưa ra quy trình phân biệt: sai OCID/scope, tài nguyên không tồn tại, policy chưa đủ, principal/credential sai, region sai và eventual consistency. Nêu bằng chứng cần thu thập nhưng không làm lộ key/token.
