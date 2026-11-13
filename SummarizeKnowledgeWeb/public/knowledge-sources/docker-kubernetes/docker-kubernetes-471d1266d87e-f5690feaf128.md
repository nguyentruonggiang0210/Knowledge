# Interview scorecard, red flags và calibration

Red flag là **tín hiệu cần probe**, không phải kết luận về con người. Ghi câu nói/hành vi cụ thể, context và follow-up; không chấm accent, tốc độ nói, trí nhớ syntax hay mức quen một vendor.

## Scorecard 1–4

| Trục | 1 — Không đạt | 2 — Cần hỗ trợ | 3 — Đạt level | 4 — Vượt level |
|---|---|---|---|---|
| Mental model | Nhầm cơ chế cốt lõi | Đúng happy path, mơ hồ failure | Giải thích đúng cơ chế/failure | Nối nhiều lớp, chỉ rõ giới hạn/version |
| Troubleshooting | Đoán và restart/xóa | Có vài lệnh nhưng không phân nhánh | Hypothesis → evidence → mitigation → verify | Khoanh vùng nhanh, quản rủi ro/forensics/comms |
| Reliability/data | Không xét downtime/data | Nêu replicas/backup chung chung | SLO, topology, graceful, restore | Lượng hóa correlated failure/RPO/RTO/capacity |
| Security | Dùng quyền rộng/secret sai | Biết non-root/RBAC nhưng rời rạc | Defense-in-depth/least privilege/rotation | Threat model/escalation/supply chain/incident |
| Delivery/operations | Sửa tay, mutable | Có CI/YAML, rollback mỏng | Immutable promotion, rollout/rollback, observability | Fleet policy/upgrade/DR và org ownership |
| Trade-off/communication | Khẳng định tuyệt đối | Nêu một phương án | Assumptions, alternatives, concise structure | Điều chỉnh theo constraint, làm rõ unknown/risk |

### Quyết định gợi ý

- **Junior:** không trục cốt lõi nào =1; mental model/troubleshooting ≥2; tổng trung bình ≥2.3.
- **Mid:** mental model, troubleshooting, reliability, security đều ≥3; trung bình ≥3.0.
- **Senior:** reliability, security, trade-off và operations ≥3; ít nhất ba trục =4; trung bình ≥3.5. Senior không nhất thiết nhớ mọi command.
- Safety red flag nghiêm trọng chưa được sửa sau follow-up có thể no-hire bất kể trung bình.

## Red flags kỹ thuật và follow-up công bằng

| Tín hiệu | Vì sao đáng lo | Follow-up để xác minh |
|---|---|---|
| “Container là VM nhỏ, có kernel riêng” | Sai isolation/compatibility model | “Bạn kiểm tra kernel version từ container thấy gì; Windows/Linux image thì sao?” |
| Dùng `latest` làm rollback/version | Tag mutable, không artifact identity | “Nếu tag bị overwrite, bạn biết binary nào đang chạy bằng gì?” |
| Secret qua ARG/ENV/Git | Leak layer/history/log/process metadata | “Nếu đã leak hôm qua, hành động đầu tiên?” |
| `privileged`, cluster-admin, wildcard để fix | Mở blast radius/escalation | “Quyền tối thiểu nào và negative test gì?” |
| Mount Docker socket bình thường hóa | Gần quyền host root | “Container compromise có thể gọi API nào?” |
| Xóa volume/PVC/namespace để thử | Data loss, không evidence/rollback | “Reclaim policy/backup/target xác minh ra sao?” |
| `prune -a --volumes` khi disk đầy | Destructive, scope rộng | “Bạn inventory bytes và rollback artifacts thế nào?” |
| Restart/scale là root fix duy nhất | Che nguyên nhân, có thể amplify | “Signal nào chứng minh bottleneck và fix?” |
| Liveness phụ thuộc mọi downstream | Restart cascade | “DB outage sẽ tác động toàn fleet thế nào?” |
| PDB được mô tả là chống mọi failure | Hiểu sai availability | “Node mất điện/direct delete thì sao?” |
| Namespace được coi hard security boundary | Thiếu network/node/cluster-scope model | “Hai hostile tenants cần controls nào?” |
| Snapshot = backup, chưa restore | Không biết consistency/failure domain | “Nếu account/zone bị xóa, key ở đâu và RTO đo chưa?” |
| HPA sẽ giải quyết mọi tải | Không xét lag/downstream/backpressure | “DB max connections và cold start giới hạn gì?” |
| “Kubernetes tự healing nên không cần on-call” | Bỏ qua app/data/control failures | “CrashLoop/config corruption/quorum sẽ tự sửa thế nào?” |
| Tắt TLS/policy/firewall để debug production | Tạo incident thứ hai | “Cách test hẹp hơn và rollback?” |
| Không thay đổi hypothesis sau evidence | Tunnel vision | “Dữ kiện nào bác bỏ giả thuyết ban đầu?” |

## Red flags về seniority

Senior/Staff cần probe thêm nếu:

- nhảy vào tên product trước requirements/SLO/RPO/RTO;
- thiết kế vượt quá năng lực team mà không có build-vs-buy/phased plan;
- không model correlated failure, quorum, data consistency, external dependency;
- không có ownership, upgrade/deprecation, incident hoặc cost model;
- nói “multi-cluster/multi-region” nhưng không xử lý config/data/identity/observability/failback;
- coi compliance checklist thay cho threat model;
- chỉ nói technical và bỏ communication/change management trong incident/migration.

## Không nên coi là red flag

- Không nhớ chính xác tên cờ/API field nhưng biết dùng `--help`, `kubectl explain` và validate.
- Kinh nghiệm CNI/CSI/cloud khác stack của công ty nhưng hiểu interfaces/failure modes.
- Hỏi lại requirement hoặc nói “chưa biết” rồi đưa cách tìm evidence.
- Chọn giải pháp đơn giản hơn Kubernetes khi requirements cho phép.
- Cần vài phút vẽ/ghi assumption; interview không phải cuộc thi phản xạ.
- Không dùng thuật ngữ tiếng Anh hoàn hảo nhưng mental model đúng.

## Strong signals

- Luôn phân biệt mitigation với root fix; nói abort/rollback và validate user impact.
- Trước destructive command, xác minh exact target/reclaim/backup và blast radius.
- Dùng immutable artifact, same-digest promotion, restore/game day thực tế.
- Nói rõ điều không được Kubernetes/Docker tự giải quyết.
- Lượng hóa capacity/connection/replica/error budget dù bằng estimate.
- Đề cập negative tests cho RBAC/network/security.
- Trong incident, giữ hypothesis/action log, bảo tồn evidence và giao tiếp.
- Biết khi nào không nên dùng Kubernetes/tự host stateful system.

## Interview notes template

```text
Candidate / Level / Date:
Question IDs:

Mental model (1-4) — evidence quote:
Troubleshooting (1-4) — evidence quote:
Reliability/data (1-4) — evidence quote:
Security (1-4) — evidence quote:
Delivery/operations (1-4) — evidence quote:
Trade-off/communication (1-4) — evidence quote:

Safety red flag? Follow-up and response:
Strongest evidence:
Biggest level gap:
Independent recommendation before debrief:
```

## Practical pass/fail

Nếu có take-home/live lab, pass khi:

- artifact chạy từ clone sạch và candidate giải thích được code của mình;
- có test/health/resources/non-root/secret hygiene;
- debug dựa evidence, không sửa tay production state;
- có rollback và với data task có restore đã chạy;
- không destructive/over-privileged shortcut.

Không yêu cầu ứng viên làm bài dài miễn phí: giới hạn scope/thời gian, cho môi trường disposable và chấm cùng rubric công bố trước.
