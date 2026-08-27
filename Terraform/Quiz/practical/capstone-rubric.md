# Rubric chấm Capstone OCI

Tổng **100 điểm**. Đạt khi từ **80 điểm**, đồng thời vượt tất cả safety gate.

## Safety gate (bắt buộc)

Bài **chưa đạt**, bất kể tổng điểm, nếu có một trong các lỗi sau mà chưa xử lý:

- Credential/private key/password thật được commit hoặc in trong deliverable/log.
- App private tier mở trực tiếp inbound Internet rộng không có lý do và compensating control.
- State production/team dùng local file chia sẻ thủ công hoặc remote state public/không kiểm soát truy cập.
- Plan có destroy/replace dữ liệu quan trọng nhưng không nhận diện, backup hay approval.
- Người học không thể giải thích principal đang apply và scope quyền của nó.
- Không có bằng chứng code ít nhất chạy được `fmt` + `validate`, hoặc không nói rõ phần bị mock do quota.

## 1. Thiết kế và giải thích kiến trúc — 10 điểm

| Mức | Tiêu chí |
|---|---|
| 0–3 | Sơ đồ thiếu trust/data flow; quyết định không có giả định |
| 4–7 | Thành phần chính đúng, có failure domain/module boundary nhưng trade-off còn mờ |
| 8–10 | Kiến trúc mạch lạc, assumption/SLO/RTO/RPO rõ; ADR giải thích trade-off và giới hạn |

## 2. Chất lượng Terraform/HCL/module — 15 điểm

- 3: version/provider/lock file hợp lý.
- 4: module interface nhỏ, typed, documented; composition không coupling xuyên module.
- 3: stable `for_each` keys, locals/expressions rõ; dependency đúng, không lạm dụng `depends_on`.
- 3: validation/precondition/output phù hợp, không output secret.
- 2: format/validate, naming/comment/doc và no-op plan sạch.

## 3. OCI networking và availability — 15 điểm

- 4: VCN/subnet public-private/CIDR/routing/gateway chính xác.
- 4: NSG/security flow tối thiểu, return path và host/app port đúng.
- 3: LB listener/backend/health check và TLS/DNS assumption rõ.
- 4: nhiều failure domain/instance, private access/service path và test failure hợp lý.

## 4. IAM, secret và data security — 15 điểm

- 4: instance principal/dynamic group/policy đúng scope và least privilege.
- 3: pipeline/workload/human principal tách biệt, auth không hard-code.
- 4: secret lifecycle, state/plan/log protection và incident response.
- 4: Object Storage private, encryption/version/retention/restore test theo RPO.

## 5. State, lifecycle và refactor — 15 điểm

- 4: remote backend, access/version/backup/locking hoặc serialization được kiểm chứng.
- 3: dev/prod state và blast radius tách rõ.
- 4: drill `moved`/state migration có backup, mapping và no-recreate evidence.
- 4: runbook lock/backend/state recovery nêu serial/lineage, writer freeze và validation plan.

## 6. CI/CD, test và governance — 10 điểm

- 3: format/validate/lint/security/policy gates.
- 3: plan-review-apply gắn commit/artifact, approval và separation of duties.
- 2: concurrency/stale-plan/fork-PR/credential control.
- 2: post-deploy check, audit trail và policy exception process.

## 7. Operations, observability, DR và FinOps — 10 điểm

- 3: metric/log/audit/health/SLO gắn change ID.
- 2: failed-change runbook hiểu rằng Git revert tạo plan mới.
- 3: backup restore/DR/failback có RTO/RPO và tránh split-brain.
- 2: cost assumption/budget/cleanup và resource protection phù hợp.

## 8. Tài liệu, bằng chứng và oral defense — 10 điểm

- 3: README có thể tái lập, command/variable/prerequisite rõ và an toàn.
- 2: evidence redacted, truy vết được commit/run/environment.
- 2: drift drill có detection, audit, decision và post-incident note.
- 3: trả lời đúng ít nhất 4/5 câu oral defense, vẽ được dependency/trust flow khi hỏi.

## Mức đánh giá cuối

| Điểm | Kết quả |
|---:|---|
| < 60 | Chưa sẵn sàng: quay lại lesson/câu hỏi có điểm thấp |
| 60–79 | Có nền tảng nhưng chưa đạt chuẩn vận hành production |
| 80–89 | Đạt: có thể tự triển khai dưới quy trình review |
| 90–95 | Rất tốt: thiết kế và xử lý failure có hệ thống |
| 96–100 | Xuất sắc: bằng chứng chặt, trade-off sâu, có thể mentor người khác |

## Phiếu phản hồi

| Nhóm | Điểm | Bằng chứng | Lỗ hổng | Hành động tiếp theo |
|---|---:|---|---|---|
| Thiết kế | /10 |  |  |  |
| HCL/module | /15 |  |  |  |
| Network/HA | /15 |  |  |  |
| IAM/security | /15 |  |  |  |
| State/refactor | /15 |  |  |  |
| CI/CD/governance | /10 |  |  |  |
| Operations/DR/cost | /10 |  |  |  |
| Docs/defense | /10 |  |  |  |
| **Tổng** | **/100** |  |  |  |

