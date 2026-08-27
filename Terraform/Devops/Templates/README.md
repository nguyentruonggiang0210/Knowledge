# DevOps document templates

Đây là các biểu mẫu thực chiến. Sao chép template vào repository của dịch vụ, thay toàn bộ phần trong dấu `<...>`, xóa mục không áp dụng kèm lý do, rồi review qua pull request.

| Template | Dùng khi nào | Output chính |
|---|---|---|
| [ADR](./ADR.md) | Có quyết định kiến trúc khó đảo ngược hoặc nhiều trade-off | Quyết định, lựa chọn bị loại, hệ quả và điều kiện xem xét lại |
| [SLO](./SLO.md) | Định nghĩa độ tin cậy nhìn từ người dùng | SLI, mục tiêu, error budget và alert policy |
| [Runbook](./RUNBOOK.md) | Có alert hoặc thao tác vận hành lặp lại | Chẩn đoán, giảm thiểu, xác minh, rollback/escalation |
| [Postmortem blameless](./POSTMORTEM-BLAMELESS.md) | Sau incident đáng kể hoặc near miss | Impact, nguyên nhân hệ thống, bài học, action item |
| [Incident timeline](./INCIDENT-TIMELINE.md) | Trong và sau incident | Dòng thời gian fact-based có nguồn bằng chứng |
| [Change plan/rollback](./CHANGE-PLAN-ROLLBACK.md) | Trước thay đổi production | Precheck, bước đổi, abort threshold, rollback và communication |
| [DR test](./DR-TEST.md) | Diễn tập restore/failover/failback | RTO/RPO thực đo, consistency evidence và gap |
| [Threat model](./THREAT-MODEL.md) | Thiết kế mới hoặc thay đổi trust/data flow | Asset, boundary, threat, control và residual risk |
| [Capacity/cost review](./CAPACITY-COST-REVIEW.md) | Review tháng/quý hoặc trước peak | Demand forecast, headroom, unit cost và action |
| [Production readiness](./PRODUCTION-READINESS.md) | Trước go-live hoặc thay đổi lớn | Checklist, exception, risk acceptance và sign-off |

## Nguyên tắc điền template

- Viết để người trực ca không có bối cảnh vẫn thực hiện được.
- Dùng timestamp có timezone; incident đa vùng nên lưu UTC làm chuẩn.
- Phân biệt **fact**, **giả thuyết** và **quyết định**.
- Link dashboard/query/change/commit thay vì chép secret hoặc dữ liệu nhạy cảm.
- Action item phải có owner, hạn, kết quả kiểm chứng; “cẩn thận hơn” không phải action tốt.
- Template không thay judgment. Nếu một mục không áp dụng, ghi `N/A - <lý do>`.

## Quy ước trạng thái

```text
Draft → In review → Approved → Implemented → Superseded/Retired
```

Tài liệu production cần owner và ngày review tiếp theo. Một runbook chưa từng diễn tập phải được gắn nhãn `UNVERIFIED`.
