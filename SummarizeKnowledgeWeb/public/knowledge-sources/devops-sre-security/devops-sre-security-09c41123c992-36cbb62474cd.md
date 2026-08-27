# D17 - Incident, change và problem management

## Mục tiêu

- Dẫn incident bằng role, priority và communication rõ.
- Phân biệt incident, problem, change và security incident.
- Viết blameless postmortem với corrective action hệ thống.
- Tạo change flow nhanh theo risk và reconcile emergency action.

## Khái niệm

- Incident: service bị gián đoạn/suy giảm hoặc rủi ro sắp xảy ra cần khôi phục.
- Problem: nguyên nhân hoặc pattern nền của một hay nhiều incident.
- Change: thêm/sửa/xóa có thể ảnh hưởng service.
- Security incident: event vi phạm/đe dọa confidentiality, integrity hoặc availability và
  cần playbook/evidence/legal communication chuyên biệt.

Khôi phục trước, root-cause analysis sâu sau khi ổn định. “Restart đã hết” là mitigation,
không tự là root cause.

## Severity

Severity dựa user/business/data/safety/scope/duration và khả năng workaround, không dựa
chức danh người báo. Ví dụ local:

- SEV1: critical business/user/data impact diện rộng, cần command và comms liên tục.
- SEV2: impact đáng kể nhưng có giới hạn/workaround.
- SEV3: nhỏ, không cần incident command đầy đủ.

Mỗi tổ chức phải định nghĩa cụ thể, escalation và response target; không copy số SEV mơ hồ.

## Incident roles

- Incident Commander: giữ mục tiêu/priority/role/decision, không tự debug mọi thứ.
- Operations/Technical Lead: điều phối hypothesis và mitigation.
- Communications Lead: status tới stakeholder/customer.
- Scribe: timeline/decision/evidence/action.
- Subject Matter Expert: điều tra theo workstream.

Một người có thể kiêm role lúc incident nhỏ, nhưng role phải nói rõ. Handoff ghi current
state, impact, action in-flight, risk và next update.

## Response lifecycle

~~~mermaid
flowchart LR
  Detect --> Triage --> Declare --> Stabilize --> Recover --> Validate --> Close
  Close --> Review[Postmortem/problem]
  Review --> Actions[Corrective actions]
  Actions --> Verify[Verify effectiveness]
~~~

### First 15 minutes

1. Xác nhận symptom/user impact và time window.
2. Declare severity/channel/commander/scribe.
3. Freeze hoặc kiểm change gần nhất nếu phù hợp; không assume change là root cause.
4. Chọn mitigation có blast radius thấp.
5. Tạo update cadence và escalation.
6. Bảo vệ evidence; không paste secret/PII.

### Technical investigation

Ghi hypothesis → prediction → query/evidence → conclusion. Chia workstream không trùng.
Ưu tiên restore service: rollback/roll-forward, traffic shift, disable feature, scale, load
shed hoặc failover theo runbook. Mọi action ghi ai/khi nào/kết quả/cách undo.

## Status update

~~~text
Time UTC:
Status/severity:
User/business impact:
What we know:
Mitigation/current result:
What we are doing next:
Risk/workaround:
Next update:
~~~

Không hứa ETA không có evidence; nói điều biết/chưa biết. Technical channel khác stakeholder
update nhưng source of truth/timeline thống nhất.

## Blameless postmortem

Blameless không nghĩa không accountability. Nó tránh kết luận “người A bất cẩn” và hỏi vì
sao action hợp lý với information/tool/incentive lúc đó, control nào thiếu, detection/recovery
nào yếu.

Nội dung:

- summary/impact/duration/SLI/error budget;
- timeline UTC gồm deploy/alert/decision;
- contributing technical/organizational factors;
- detection, response và điều gì diễn ra tốt;
- root/system condition, không ép một “root cause” duy nhất;
- action phòng ngừa/phát hiện/giảm impact/phục hồi, owner/deadline/priority;
- lesson phổ biến và cách verify action hiệu quả.

Five Whys chỉ là prompt; hệ thống phức tạp thường nhiều factor.

Corrective action tốt là specific, funded, testable. “Nhắc mọi người cẩn thận” yếu hơn
constraint/test/automation/safer default. Theo action đến closure và đo recurrence.

## Change management theo risk

- Standard: lặp, low-risk, pre-authorized, automation/test/runbook đã chứng minh.
- Normal: đánh giá/approval theo risk và evidence.
- Emergency: restore/protect ngay với authority rõ; review/reconcile sau.

Mỗi change có exact scope/artifact, reason, dependency, blast radius, test, monitor, rollout,
rollback/roll-forward, owner và schedule. Approval không nên chờ CAB lịch cố định cho mọi
thay đổi nhỏ. Tự động hóa evidence và dùng progressive delivery.

Console/kubectl/SQL emergency change phải ghi timeline và reconcile về Git/IaC/config source
of truth sau incident; nếu không drift sẽ quay lại gây lỗi.

## Problem management

Nhóm incident theo service/failure/trigger, ưu tiên theo frequency × impact × detect/recover
cost. Known error/workaround có owner/expiry. Problem record không được thành backlog vô hạn;
gắn roadmap/error budget/risk và verify khi action đóng.

## Metrics

- Time to detect/declare/engage/mitigate/restore, luôn viết rõ tên thay “MTTR”.
- User-impact duration/events và error-budget consumed.
- Alert precision/actionability và escalation/handoff quality.
- Change fail/rework rate.
- Repeated incident và corrective action age/effectiveness.

Không dùng metric để phạt người on-call; sẽ tạo under-reporting.

## Lab: SEV1 game day

Chạy [scenario OrderFlow](lab/sev1-scenario.md), dùng template:

- [Incident timeline](../Templates/INCIDENT-TIMELINE.md)
- [Postmortem](../Templates/POSTMORTEM-BLAMELESS.md)
- [Change/rollback](../Templates/CHANGE-PLAN-ROLLBACK.md)

Các mẫu khác được liệt kê ở [Templates index](../Templates/README.md).

## Hoàn thành D17 khi

- Declare/role/severity/update cadence trong thời gian mục tiêu.
- Timeline và action có owner/result, không làm nhiều thay đổi mù.
- Service restore và user-facing/data validation hoàn tất.
- Emergency change được reconcile về source of truth.
- Postmortem systemic, action được ưu tiên/theo dõi/verify.
- Phân luồng security incident và preserve evidence đúng.

Nguồn: [NIST Incident Response SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final),
[Google SRE incident response](https://sre.google/sre-book/managing-incidents/) và
[Google SRE postmortem culture](https://sre.google/sre-book/postmortem-culture/).

Tiếp theo: [D18 - HA, backup và disaster recovery](../18-ha-backup-disaster-recovery/README.md).
