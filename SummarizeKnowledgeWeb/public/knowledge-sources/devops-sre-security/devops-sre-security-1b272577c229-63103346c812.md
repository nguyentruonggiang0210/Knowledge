# Runbook - Production high error rate hoặc latency

> Template này phải được tùy chỉnh bằng dashboard/query/command thật và diễn tập trong sandbox trước khi dùng. Không chạy fault injection trong production ngoài change đã duyệt.

## Metadata

| Trường | Giá trị cần điền |
|---|---|
| Service / tier | `<service> / tier-1|tier-2>` |
| SLO | `<link>` |
| Dashboard / logs / traces | `<links>` |
| On-call / escalation | `<contacts>` |
| Deployment history | `<link>` |
| Status communication | `<channel/page>` |
| Last verified | `<timestamp + scenario>` |

## Trigger và severity

- Fast/slow burn-rate alert của availability hoặc latency SLO;
- synthetic critical journey fail;
- saturation dự báo làm cạn capacity trong `<N>` phút;
- customer/support signal được xác minh.

Severity dựa trên user/business impact, không dựa trên độ “thú vị” của lỗi.

## Incident roles

- Incident Commander: quyết định ưu tiên, cadence và escalation.
- Operations Lead: thực hiện mitigation đã giao.
- Communications Lead: status nội/ngoại bộ.
- Scribe: timeline fact-based.

Một người có thể giữ nhiều vai trò ở incident nhỏ, nhưng Incident Commander không nên tự làm mọi command trong incident lớn.

## 0-5 phút: xác nhận và giới hạn impact

1. Acknowledge alert; mở incident/timeline; ghi thời gian phát hiện và declaration.
2. Xác nhận SLI từ ít nhất hai signal nếu có: real traffic, synthetic, LB/app metric.
3. Xác định scope: route/version/region/tenant/dependency; kiểm tra security incident signal.
4. Freeze deployment/change liên quan; không xóa evidence.
5. Chọn mitigation ít rủi ro nhất: stop rollout, rollback immutable artifact, shed optional traffic hoặc fail dependency có fallback.
6. Cập nhật status theo cadence `<15 phút>` ngay cả khi chưa biết root cause.

## Decision tree

| Quan sát | Mitigation ưu tiên | Không làm ngay |
|---|---|---|
| Lỗi bắt đầu cùng release | stop promotion, rollback digest | debug lâu trên canary trong khi impact tăng |
| Chỉ một replica/FD lỗi | remove khỏi backend, replace immutable | SSH sửa drift trực tiếp |
| DB latency/connection saturation | giảm writer/load, kiểm tra pool/query/failover criteria | tăng retry vô hạn |
| Toàn region/dependency control plane lỗi | đánh giá DR invocation theo RTO/RPO | failover khi data checkpoint chưa rõ |
| Nghi credential/data breach | kích hoạt security incident, revoke có kiểm soát, preserve evidence | đưa secret/log nhạy cảm vào chat/ticket |

## Rollback release

1. Xác minh known-good artifact digest, config và schema compatibility.
2. Tạo/ghi change ID; dùng deployment pipeline với protected role.
3. Rollback theo từng batch/canary; theo dõi SLI và saturation.
4. Dừng nếu abort threshold của rollback bị chạm.
5. Verify critical journey và error budget burn dừng.

Nếu rollback không giải quyết, đừng lặp lại. Quay về phân tích dependency/capacity/data.

## DR decision gate

Chỉ Incident Commander cùng service/data owner kích hoạt DR khi:

- failure dự kiến vượt RTO hoặc impact không thể giảm ở primary;
- replication/backup checkpoint và expected RPO đã biết;
- target capacity, identity, DNS/certificate và dependency sẵn sàng;
- split-brain/write fencing và failback owner được xác định.

Dùng [DR test/runbook](../../Templates/DR-TEST.md) đã tùy chỉnh, không ứng biến từ sơ đồ.

## Recovery verification

- [ ] Critical synthetic + real traffic SLI ổn định trong observation window.
- [ ] Error budget burn về dưới threshold; queue/backlog đang giảm.
- [ ] Không có replica restart loop hoặc hidden saturation.
- [ ] Data consistency/business transaction test pass.
- [ ] Đúng artifact/config/schema; infrastructure full plan không có unexpected diff.
- [ ] Security/audit signals bình thường.
- [ ] Stakeholder nhận recovery update và biết monitoring tiếp tục bao lâu.

## Sau incident

1. Giữ monitoring cao hơn baseline trong `<duration>`.
2. Reconcile manual action về Git/Terraform; thu hồi temporary access/rule/capacity.
3. Hoàn tất [incident timeline](../../Templates/INCIDENT-TIMELINE.md).
4. Viết [postmortem blameless](../../Templates/POSTMORTEM-BLAMELESS.md) theo severity/near-miss policy.
5. Action item phải ưu tiên giảm khả năng xảy ra, giảm impact hoặc giảm detection/recovery time; có owner/due/evidence.
