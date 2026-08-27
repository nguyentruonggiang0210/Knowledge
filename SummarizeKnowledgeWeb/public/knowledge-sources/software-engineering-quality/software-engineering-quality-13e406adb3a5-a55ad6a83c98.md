# ADR-<NNNN> - <Quyết định ngắn gọn>

## Metadata

| Trường | Giá trị |
|---|---|
| Status | `Draft / Proposed / Accepted / Rejected / Superseded` |
| Date | `<YYYY-MM-DD>` |
| Decision owners | `<names/teams>` |
| Reviewers | `<architecture/security/SRE/data/finance khi áp dụng>` |
| Scope | `<service/platform/environment>` |
| Related change/incident | `<links>` |
| Supersedes / superseded by | `<ADR links hoặc N/A>` |
| Review date/trigger | `<date hoặc điều kiện>` |

## Decision summary

> Chúng ta quyết định `<lựa chọn>` để đạt `<outcome>`, chấp nhận `<trade-off chính>`.

## Context và vấn đề

- Hiện trạng: `<hệ thống/quy trình đang hoạt động thế nào>`
- Vấn đề: `<điều gì không đáp ứng và evidence>`
- Ai bị ảnh hưởng: `<users/teams/business>`
- Tại sao quyết định cần đưa ra bây giờ: `<deadline/risk/opportunity>`
- Nếu không làm gì: `<impact và xác suất>`

## Scope và non-goals

### In scope

- `<...>`

### Không giải quyết trong ADR này

- `<...>`

## Constraints và assumptions

| Loại | Chi tiết | Evidence/owner xác minh |
|---|---|---|
| Compliance/data residency | `<...>` | `<...>` |
| SLO/RTO/RPO | `<...>` | `<...>` |
| Cost/budget | `<...>` | `<...>` |
| Skills/operations | `<...>` | `<...>` |
| Deadline/dependency | `<...>` | `<...>` |
| Assumption cần test | `<...>` | `<test + date>` |

## Decision drivers

Xếp trọng số trước khi chấm option để tránh chọn xong mới điều chỉnh tiêu chí.

| Driver | Trọng số 1-5 | Cách đo |
|---|---:|---|
| Reliability | `<n>` | `<SLO/failure test>` |
| Security/compliance | `<n>` | `<control/threat reduction>` |
| Cost | `<n>` | `<TCO/unit cost>` |
| Delivery speed | `<n>` | `<lead time>` |
| Operability | `<n>` | `<on-call toil/MTTR>` |
| Portability/exit | `<n>` | `<migration effort>` |

## Options considered

| Option | Mô tả | Weighted score | Risk lớn nhất | Estimated TCO/effort |
|---|---|---:|---|---|
| A - `<name>` | `<...>` | `<...>` | `<...>` | `<...>` |
| B - `<name>` | `<...>` | `<...>` | `<...>` | `<...>` |
| C - Do nothing | `<...>` | `<...>` | `<...>` | `<...>` |

### Option A - `<name>`

- Ưu điểm: `<...>`
- Nhược điểm: `<...>`
- Failure modes: `<...>`
- Security/data implications: `<...>`
- Migration/rollback: `<...>`
- Evidence/prototype: `<link/result>`

### Option B - `<name>`

- Ưu điểm: `<...>`
- Nhược điểm: `<...>`
- Failure modes: `<...>`
- Security/data implications: `<...>`
- Migration/rollback: `<...>`
- Evidence/prototype: `<link/result>`

## Decision

Chọn **`<option>`**.

Lý do:

1. `<liên hệ driver và evidence>`
2. `<...>`

Không chọn `<option khác>` vì `<lý do cụ thể>`, không phải vì “không thích” hoặc “không cloud-native”.

## Consequences

### Tích cực

- `<...>`

### Tiêu cực/technical debt chấp nhận

- `<...>`

### Risk và control

| Risk | Likelihood | Impact | Control | Residual risk | Owner |
|---|---|---|---|---|---|
| `<...>` | `<L/M/H>` | `<L/M/H>` | `<...>` | `<L/M/H>` | `<...>` |

## Security, reliability, cost và operations

- Identity/trust boundary thay đổi: `<...>`
- Data flow/classification/encryption: `<...>`
- SLO/RTO/RPO/failure modes: `<...>`
- Observability/runbook/on-call impact: `<...>`
- Capacity/TCO/unit cost/egress/license: `<...>`
- Vendor lock-in và exit strategy: `<...>`

## Implementation và rollout

| Phase | Thay đổi | Validation/acceptance | Rollback | Owner |
|---|---|---|---|---|
| 0 - Prototype | `<...>` | `<...>` | `<...>` | `<...>` |
| 1 - Nonprod | `<...>` | `<...>` | `<...>` | `<...>` |
| 2 - Canary | `<...>` | `<...>` | `<...>` | `<...>` |
| 3 - Full | `<...>` | `<...>` | `<...>` | `<...>` |

## Điều kiện xem xét lại

ADR cần review khi:

- `<cost/traffic/SLO/provider feature>` vượt `<threshold>`;
- assumption `<...>` bị chứng minh sai;
- incident `<type/severity>` xảy ra;
- trước `<date>` hoặc migration phase tiếp theo.

## Follow-up actions

| Action | Outcome kiểm chứng | Owner | Due | Status/link |
|---|---|---|---|---|
| `<...>` | `<...>` | `<...>` | `<YYYY-MM-DD>` | `<...>` |

## Approval

| Role | Người/nhóm | Quyết định | Date | Ghi chú/exception expiry |
|---|---|---|---|---|
| Architecture owner | `<...>` | `<approve/reject>` | `<...>` | `<...>` |
| Security/data owner | `<...>` | `<...>` | `<...>` | `<...>` |
| Service owner | `<...>` | `<...>` | `<...>` | `<...>` |
