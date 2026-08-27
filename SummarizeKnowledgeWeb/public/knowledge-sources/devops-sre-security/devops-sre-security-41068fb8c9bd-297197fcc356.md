# Level 1 – Foundation

Tổng: **20 câu / 38 điểm**. Không mở thư mục `answers/` khi làm bài.

## F01 — Trắc nghiệm (1 điểm) · D01

Chỉ báo nào phản ánh DevOps tốt nhất?

A. Một “DevOps team” nhận mọi ticket deploy từ dev và ops  
B. Đội liên chức năng cùng chịu trách nhiệm flow, reliability và outcome; tự động hóa để rút ngắn feedback an toàn  
C. Số lượng tool được mua  
D. Số lần họp handoff giữa các silo

## F02 — Đúng/Sai (1 điểm) · D01

Tách một nhóm mang tên “DevOps” ở giữa development và operations luôn loại bỏ silo, dù ownership và quy trình handoff không đổi.

## F03 — Trắc nghiệm (1 điểm) · D02

Permission `640` trên file thường có nghĩa gì?

A. Owner đọc/ghi, group đọc, others không quyền  
B. Owner mọi quyền, group đọc, others ghi  
C. Mọi người đọc/ghi  
D. Chỉ root mới thấy file

## F04 — Đúng/Sai (1 điểm) · D02

`kill -9` nên luôn là bước đầu tiên khi dừng service vì nó cho process cơ hội flush dữ liệu và cleanup.

## F05 — Trắc nghiệm (1 điểm) · D03

DNS TTL chủ yếu ảnh hưởng điều gì?

A. Kích thước TLS key  
B. Thời gian resolver/cache có thể giữ một record trước khi truy vấn lại  
C. Số TCP port mở  
D. Quyền Linux của `/etc/hosts`

## F06 — Trắc nghiệm (1 điểm) · D03

Trong TLS, client thường kiểm tra điều gì để xác nhận server?

A. Certificate chain tin cậy, hostname/SAN, thời hạn và policy liên quan  
B. Server có chạy bằng root hay không  
C. DNS TTL luôn bằng 0  
D. HTTP body có JSON hợp lệ

## F07 — Trắc nghiệm (1 điểm) · D04

Trên shared branch đã có người khác pull, cách an toàn/audit-friendly để đảo một commit xấu thường là:

A. `git reset --hard` rồi force-push ngay  
B. Tạo commit mới bằng `git revert` và review  
C. Xóa thư mục `.git`  
D. Sửa tag cũ mà không thông báo

## F08 — Đúng/Sai (1 điểm) · D05

Một script trả exit code khác 0 khi thất bại giúp CI và automation phía gọi phân biệt success/failure.

## F09 — Giải thích (2 điểm) · D01

Giải thích ba vòng tư duy: flow nhanh, feedback nhanh và học hỏi liên tục. Nêu hai metric delivery/reliability có thể dùng, đồng thời chỉ ra vì sao tối ưu một metric đơn lẻ dễ gây hành vi xấu.

## F10 — Giải thích Linux (2 điểm) · D02

Một systemd service không start. Hãy nêu thứ tự kiểm tra status, journal, unit file, user/permission, port/process và dependency. Vì sao “reboot thử” không phải chẩn đoán đủ?

## F11 — Giải thích network path (2 điểm) · D03

Vẽ hoặc mô tả đường đi từ browser nhập `https://app.example.com` tới backend: DNS, TCP, TLS/SNI, load balancer/proxy, route/firewall và HTTP. Ở mỗi lớp nêu một loại lỗi điển hình.

## F12 — Giải thích Git/release (2 điểm) · D04

Phân biệt commit, branch, tag và release. Theo SemVer, khi nào tăng major/minor/patch? Vì sao tag release nên bất biến và gắn với artifact cụ thể?

## F13 — Giải thích automation (2 điểm) · D05

Thế nào là script idempotent? Nêu cách xử lý timeout, retry có backoff/jitter và exit code sao cho chạy lại không nhân đôi side effect.

## F14 — Giải thích cloud (2 điểm) · D06

Phân biệt region, availability/fault domain và account/tenancy/subscription/compartment về failure và governance. Shared responsibility thay đổi những gì khi dùng IaaS so với managed service?

## F15 — Debug script (3 điểm) · D05, D11

Đoạn Bash backup sau có nhiều rủi ro. Chỉ ra ít nhất bốn lỗi và viết khung an toàn hơn; không cần triển khai uploader thật.

```bash
#!/usr/bin/env bash
backup_dir=$1
rm -rf $backup_dir/*
tar -czf $backup_dir/app.tgz /srv/app
curl -s -X PUT -H "Authorization: Bearer $TOKEN" --data-binary @$backup_dir/app.tgz "$URL"
echo "backup successful"
```

## F16 — Tình huống 502 (3 điểm) · D02, D03

Người dùng nhận HTTP 502 từ load balancer sau deploy. Backend process “có vẻ đang chạy”. Hãy lập cây giả thuyết và thứ tự evidence để phân biệt DNS/client, LB listener, health check, route/firewall, port bind, application dependency và timeout.

## F17 — Tình huống secret trong Git (3 điểm) · D04, D11

Một API token thật vừa được commit lên repository nội bộ rồi xóa ở commit kế tiếp. Hãy mô tả hành động containment/rotation, xác định phạm vi clone/cache/log, xử lý history theo policy và guardrail ngăn tái diễn. Vì sao xóa ở commit mới là chưa đủ?

## F18 — Debug Linux (3 điểm) · D02

Ứng dụng chạy được khi gọi bằng tay nhưng systemd báo `Permission denied` khi đọc `/opt/app/config.yaml`. Nêu evidence/lệnh kiểm tra owner, mode, service user, parent-directory execute bit, SELinux/AppArmor nếu có và cách sửa least privilege.

## F19 — Tình huống CI flaky (3 điểm) · D01, D08

Test CI fail ngẫu nhiên 1/10 lần nên team thêm retry vô hạn. Phân tích tác hại tới lead time và niềm tin, cách thu evidence/phân loại flaky test, quarantine có thời hạn, owner/SLO sửa lỗi và giới hạn retry.

## F20 — Tình huống cloud foundation (3 điểm) · D06

Một đội chuẩn bị đưa workload đầu tiên lên OCI/AWS/Azure. Hãy đề xuất checklist landing-zone tối thiểu: identity/federation, account/compartment/subscription, network, logging/audit, budget/quota, naming/tagging, break-glass và separation giữa dev/prod.

