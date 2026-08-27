# DevOps Glossary

| Thuật ngữ | Giải nghĩa ngắn |
|---|---|
| ADR | Architecture Decision Record: bối cảnh, lựa chọn, quyết định và hệ quả |
| Artifact | Kết quả build bất biến như image, package, binary hoặc module |
| Availability | Tỷ lệ service đáp ứng tiêu chí thành công trong cửa sổ đo |
| Backoff | Tăng thời gian chờ giữa các lần retry |
| Blast radius | Phạm vi người dùng/hệ thống bị ảnh hưởng khi có lỗi |
| Blue-green | Hai môi trường tương đương; chuyển traffic giữa old và new |
| Burn rate | Tốc độ tiêu error budget so với tốc độ cho phép |
| Canary | Đưa phiên bản mới tới phần nhỏ traffic rồi tăng dần |
| Capacity | Khả năng hệ thống xử lý load với SLO đã định |
| Cardinality | Số tổ hợp giá trị label; quá cao làm telemetry tốn kém |
| Circuit breaker | Tạm ngừng gọi dependency đang lỗi để tránh lỗi dây chuyền |
| CI | Tích hợp thay đổi thường xuyên với build/test tự động |
| CD | Continuous Delivery hoặc Deployment; luôn deployable hoặc tự deploy |
| Change failure | Deployment gây suy giảm cần mitigation, rollback hoặc hotfix |
| Cgroups | Cơ chế Linux giới hạn/đo tài nguyên cho process group |
| Config drift | Trạng thái thực khác desired state |
| Control plane | Thành phần đưa quyết định/quản lý; khác data plane xử lý workload |
| DAST | Kiểm thử an ninh trên ứng dụng đang chạy |
| Dead-letter queue | Nơi giữ message không xử lý được sau policy retry |
| Declarative | Mô tả trạng thái mong muốn; controller tìm cách hội tụ |
| Deployment frequency | Mức thường xuyên đưa thay đổi vào production |
| Desired state | Trạng thái hệ thống mà config/controller muốn đạt |
| Error budget | Phần không tin cậy được phép: 1 trừ SLO |
| Eventual consistency | Các replica có thể tạm lệch rồi hội tụ nếu không có update mới |
| Feature flag | Tách việc deploy code khỏi bật chức năng |
| Golden path | Cách làm được platform hỗ trợ tốt cho use case phổ biến |
| GitOps | Git lưu desired state; controller reconcile môi trường theo state đó |
| HA | High Availability: chịu lỗi trong phạm vi thiết kế, giảm downtime |
| Idempotency | Thực hiện lặp cùng request không tạo thêm hiệu ứng ngoài ý muốn |
| Immutable infrastructure | Thay instance/image thay vì sửa thủ công tại chỗ |
| Incident | Gián đoạn/suy giảm cần phối hợp khôi phục service |
| Jitter | Nhiễu ngẫu nhiên vào backoff để client không retry cùng lúc |
| Lead time for changes | Thời gian từ thay đổi được commit đến chạy thành công production |
| Least privilege | Chỉ cấp quyền cần thiết, đúng scope và thời gian |
| MTTR | Tên metric dễ mơ hồ; luôn nói rõ mean time to restore/repair/resolution |
| Namespace | Cơ chế Linux cô lập view của process; cũng là logical scope trong K8s |
| Non-functional requirement | Yêu cầu như reliability, security, latency, cost, compliance |
| Observability | Khả năng suy luận trạng thái nội tại từ output/signal hệ thống |
| OPA | Open Policy Agent, engine đánh giá policy-as-code |
| PII | Dữ liệu nhận diện cá nhân cần phân loại và bảo vệ |
| Progressive delivery | Phát hành từng bước với tín hiệu và điều kiện dừng |
| Provenance | Bằng chứng artifact được tạo ở đâu, từ source/input nào |
| RACI | Responsible, Accountable, Consulted, Informed |
| RED | Rate, Errors, Duration cho request-driven service |
| Reconciliation | Controller liên tục đưa actual state về desired state |
| RPO | Điểm dữ liệu tối đa có thể mất, đo bằng thời gian |
| RTO | Thời gian mục tiêu để khôi phục capability sau disruption |
| Runbook | Hướng dẫn thao tác có điều kiện, verify, rollback và escalation |
| SAST | Phân tích source/binary mà không cần chạy ứng dụng |
| SBOM | Danh sách thành phần/phụ thuộc của phần mềm |
| SLA | Cam kết service với hệ quả khi vi phạm |
| SLI | Chỉ số định lượng một khía cạnh service người dùng quan tâm |
| SLO | Mục tiêu cho SLI trong cửa sổ thời gian |
| SRE | Áp dụng software engineering cho vấn đề vận hành/reliability |
| Supply chain | Chuỗi source, dependency, build, registry, deploy và runtime |
| Toil | Việc vận hành lặp, thủ công, phản ứng và tăng tuyến tính theo quy mô |
| Tracing | Theo dấu causal path của request qua các component |
| Trunk-based | Tích hợp thường xuyên vào nhánh chính với branch ngắn |
| Unit economics | Chi phí cho một đơn vị giá trị như request, tenant hoặc order |
| USE | Utilization, Saturation, Errors cho tài nguyên |
| Value stream | Toàn bộ bước từ nhu cầu đến giá trị chạy thực tế |
| Workload identity | Cấp identity ngắn hạn cho workload thay static credential |

Nếu một thuật ngữ ảnh hưởng quyết định production, luôn ghi định nghĩa đo được trong ADR,
SLO hoặc runbook; đừng dựa vào tên viết tắt mơ hồ.
