# Runbook - <Alert/sự cố hoặc thao tác>

> Status: `UNVERIFIED / VERIFIED`. Không gắn VERIFIED nếu chưa diễn tập bằng quyền và môi trường tương đương.

## Metadata

| Trường | Giá trị |
|---|---|
| Service / environment | `<...>` |
| Owner / on-call / escalation | `<...>` |
| Trigger/alert | `<link + condition>` |
| Dashboard/log/trace | `<links>` |
| Change/deploy history | `<link>` |
| Required role/access | `<role, không ghi credential>` |
| Last tested / tester | `<timestamp/result>` |
| Expected duration | `<minutes>` |

## Purpose và expected outcome

- Dùng khi: `<triệu chứng/alert>`
- Không dùng khi: `<security incident/data corruption/khác>`
- Outcome: `<user impact giảm hoặc task hoàn tất>`
- Maximum acceptable impact/time: `<...>`

## Safety, prerequisites và stop conditions

- [ ] Đúng account/subscription/tenancy, environment, region và state.
- [ ] Incident/change ID đã mở nếu yêu cầu.
- [ ] Backup/checkpoint/known-good artifact sẵn sàng.
- [ ] Không có writer/deploy khác xung đột.
- [ ] Command không in secret/PII và output được lưu ở nơi kiểm soát.

**Dừng và escalate nếu:** `<data corruption, scope không rõ, blast radius tăng, timeout, security signal...>`.

## Quick diagnosis

| Câu hỏi | Query/command/link | Expected | Nếu bất thường |
|---|---|---|---|
| User có bị ảnh hưởng? | `<synthetic/SLI>` | `<...>` | `<...>` |
| Scope ở đâu? | `<region/version/route>` | `<...>` | `<...>` |
| Có change gần đây? | `<deployment/change>` | `<...>` | `<...>` |
| Dependency/capacity? | `<metric/query>` | `<...>` | `<...>` |
| Có security/data risk? | `<signal>` | `<...>` | Chuyển security/data incident |

Phân biệt fact và hypothesis. Ghi timestamp + nguồn vào incident timeline.

## Mitigation procedure

### Bước 1 - `<action nhỏ, reversible>`

```text
<command hoặc UI path; dùng placeholder, không chứa secret>
```

- Expected result: `<...>`
- Verify: `<query/test>`
- Timeout: `<duration>`
- Abort/rollback: `<...>`

### Bước 2 - `<action tiếp theo>`

- Preconditions: `<...>`
- Action: `<...>`
- Expected/verify: `<...>`
- Abort/rollback: `<...>`

### Bước 3 - `<high-risk action nếu cần>`

Ghi required approval và blast radius. Không dùng “restart mọi thứ” hoặc `-lock=false` làm bước mặc định.

## Recovery verification

- [ ] Critical user journey pass từ ngoài hệ thống.
- [ ] SLI/error/latency/saturation ổn định trong `<observation window>`.
- [ ] Data consistency/business invariant pass.
- [ ] Queue/backlog/replication lag đang giảm.
- [ ] Artifact/config/schema/infrastructure đúng version.
- [ ] Không có security finding, orphan hoặc temporary rule/access chưa có expiry.

## Rollback

| Trigger rollback | Action | Verify | Owner |
|---|---|---|---|
| `<abort threshold>` | `<reversible steps>` | `<...>` | `<...>` |

Nếu rollback không tương thích schema/data, link change/restore plan riêng; không viết “rollback DB” chung chung.

## Escalation và communication

| Khi nào | Escalate tới | Thông tin cần gửi | Cadence |
|---|---|---|---|
| `<condition>` | `<team/role>` | impact, scope, actions, asks | `<minutes>` |

Status update mẫu:

```text
<timestamp timezone> — Impact: <...>. Scope: <...>. Mitigation: <...>.
Next update: <time>. Không đưa secret hoặc giả thuyết chưa gắn nhãn.
```

## Sau khi hoàn tất

- Reconcile manual change về Git/IaC.
- Thu hồi temporary access/rule/capacity và kiểm tra cost/orphan.
- Hoàn thiện timeline/postmortem theo policy.
- Tạo action item có owner/due/evidence.
- Cập nhật runbook, tăng version và diễn tập lại.

## Test history

| Date/scenario | Environment | Result/time | Gaps/actions | Tester/reviewer |
|---|---|---|---|---|
| `<...>` | `<...>` | `<...>` | `<...>` | `<...>` |
