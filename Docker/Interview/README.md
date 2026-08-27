# Interview Kit — Docker & Kubernetes

Bộ này dùng cho cả ứng viên lẫn người phỏng vấn. Câu hỏi được tách khỏi đáp án để tự luyện; mục tiêu là kiểm tra **mental model, evidence, trade-off và an toàn vận hành**, không kiểm tra khả năng nhớ cờ lệnh.

## Danh mục

| File | Nội dung |
|---|---|
| `01-junior-question-bank.md` | Nền tảng, lệnh thường dùng, object cơ bản |
| `02-mid-question-bank.md` | Production delivery, security, debug, reliability |
| `03-senior-question-bank.md` | Architecture, platform, multi-tenancy, HA/DR, leadership |
| `04-system-design-exercises.md` | Bài thiết kế 45–90 phút |
| `05-troubleshooting-drills.md` | Incident drills có dữ kiện mở dần |
| `90-model-answers.md` | Đáp án mẫu ngắn + điểm đào sâu cho J/M/S |
| `91-system-design-models.md` | Khung thiết kế tốt và rubric |
| `92-troubleshooting-models.md` | Hướng chẩn đoán và evidence cho drills |
| `93-red-flags-evaluation.md` | Red flags, scorecard và cách giảm bias |
| `94-study-checklist.md` | Checklist ôn tập và mock interview |

## Cách luyện cho ứng viên

1. Trả lời câu chính trong 90 giây: **định nghĩa → khi dùng → trade-off/failure mode → cách xác minh**.
2. Trả lời follow-up mà không mở đáp án. Nếu cần câu lệnh, nói mục đích và output mong đợi thay vì đoán cờ.
3. Mở `90-model-answers.md`, tự đánh dấu: đúng cơ chế, có trade-off, có evidence, có safety.
4. Với system design, bắt đầu bằng requirements/SLO/RPO/RTO/threat model; không nhảy thẳng vào tên công cụ.
5. Với troubleshooting, không sửa ngay. Nêu scope, recent change, giả thuyết xếp hạng, evidence phân nhánh, mitigation, root fix và prevention.

## Cách dùng cho interviewer

- Chọn 6–8 câu phù hợp level, 1 drill và 1 phần design; không hỏi toàn bộ.
- Cho ứng viên biết giả định: Linux/Windows, managed/self-hosted, cluster version, CNI/CSI/cloud.
- Follow-up theo câu trả lời thật, không dùng trivia làm bẫy.
- Cho tài liệu/API reference trong bài thực tế; chấm khả năng tra đúng và validate.
- Không coi một tên tool cụ thể là đáp án duy nhất. Chấm outcome/constraint/trade-off.
- Dùng rubric trong `93-red-flags-evaluation.md`, ghi evidence trước khi đưa kết luận.

## Kỳ vọng theo level

| Level | Kỳ vọng |
|---|---|
| Junior | Giải thích đúng container/image/Pod/Service, build/deploy cơ bản, biết đọc log/event và xin hỗ trợ trước thao tác rủi ro |
| Mid | Tự ship service production thông thường, debug theo lớp, hiểu security/resources/rollout/storage/network và viết runbook |
| Senior | Thiết kế platform/HA/DR/multi-tenancy, lượng hóa SLO/cost/risk, dẫn incident/upgrade và nâng năng lực đội |

## Nguồn chuẩn

- [Docker build best practices](https://docs.docker.com/build/building/best-practices/), [storage](https://docs.docker.com/engine/storage/), [network drivers](https://docs.docker.com/engine/network/drivers/), [security](https://docs.docker.com/engine/security/) và [Compose](https://docs.docker.com/compose/).
- [Kubernetes components](https://kubernetes.io/docs/concepts/overview/components/), [workloads](https://kubernetes.io/docs/concepts/workloads/), [networking](https://kubernetes.io/docs/concepts/services-networking/), [storage](https://kubernetes.io/docs/concepts/storage/), [scheduling](https://kubernetes.io/docs/concepts/scheduling-eviction/), [security](https://kubernetes.io/docs/concepts/security/) và [observability](https://kubernetes.io/docs/concepts/cluster-administration/observability/).

Phiên bản API/tool thay đổi. Câu trả lời tốt sẽ nói rõ giả định và dùng `kubectl explain`, API discovery hoặc tài liệu versioned khi syntax quan trọng.
