# Docker & Kubernetes Deep-Dive

Bộ tài liệu này là một lộ trình thực hành từ nền tảng Linux container đến vận hành Kubernetes production. Mục tiêu không phải học thuộc lệnh, mà là có thể **giải thích cơ chế**, **chọn đúng công cụ**, **tự debug sự cố** và **đưa một dịch vụ qua đầy đủ vòng đời build → test → ship → run → observe → recover**.

> Baseline tài liệu được rà soát ngày **2026-08-28**. Kubernetes phát hành nhanh; hãy luôn kiểm tra release đang được hỗ trợ và version-skew của cluster trước khi áp dụng vào production.

## Bắt đầu trong 10 phút

1. Làm [bài đánh giá đầu vào](QA/README.md), không xem đáp án.
2. Chọn nhịp học trong [ROADMAP.md](ROADMAP.md).
3. Học theo [mục lục bài học](Lessions/README.md); mỗi chủ đề phải làm lab thay vì chỉ đọc.
4. Chạy sample trong [CodeSample](CodeSample/README.md), sau đó cố tình làm hỏng để luyện debug.
5. Đánh dấu bằng chứng trong [KNOWLEDGE-CHECKLIST.md](KNOWLEDGE-CHECKLIST.md).
6. Khi vượt qua các gate, luyện [Interview](Interview/README.md) và trình bày capstone như một dự án thật.

## Cấu trúc

```text
.
├── README.md                         # Điểm vào
├── ROADMAP.md                        # Lộ trình 24 tuần và các learning gate
├── KNOWLEDGE-CHECKLIST.md            # Bản đồ kiến thức + bằng chứng năng lực
├── REFERENCES.md                     # Tài liệu chính thức và cách kiểm tra độ mới
├── Lessions/
│   ├── Docker/                       # Bài Docker từ internals đến production
│   └── Kubernetes/                   # Bài Kubernetes từ API đến cluster operations
├── CodeSample/
│   ├── docker/                       # Lab Docker độc lập
│   ├── kubernetes/                   # Lab Kubernetes độc lập
│   └── capstone/                     # Dịch vụ xuyên suốt Compose và Kubernetes
├── QA/                               # Quiz, đáp án, scenario, rubric thực hành
└── Interview/                        # Junior/Middle/Senior, system design, mock interview
```

Tên `Lessions` được giữ theo yêu cầu. Trong tiếng Anh chuẩn thường viết là `Lessons`.

## “Biết sâu” được đo như thế nào?

Một chủ đề chỉ được coi là hoàn thành khi bạn có đủ bốn lớp bằng chứng:

- **Explain:** vẽ/giải thích được data flow và trade-off mà không nhìn tài liệu.
- **Build:** tự tạo manifest/Dockerfile từ file trống, không copy mù quáng.
- **Break/Fix:** tái tạo ít nhất hai lỗi và chẩn đoán bằng tín hiệu đúng.
- **Operate:** nêu được SLO, rollback, security boundary, capacity và failure mode.

Điểm quiz cao nhưng chưa làm lab không được tính là thành thạo. Ngược lại, chạy được sample nhưng không giải thích được namespace, cgroup, reconciliation, Service routing hoặc storage semantics cũng chưa đạt.

## Chọn Docker, Compose hay Kubernetes?

| Bối cảnh | Lựa chọn khởi đầu | Vì sao | Khi cần nâng cấp |
|---|---|---|---|
| Một process cần đóng gói nhất quán | Docker/OCI image | Artifact bất biến, chạy nhất quán | Cần nhiều service hoặc orchestration |
| Dev/test có vài service phụ thuộc nhau | Docker Compose | Setup nhanh, service discovery và volume declarative | Cần multi-node, HA, autoscaling, policy |
| Một VM, tải vừa, downtime chấp nhận được | Compose + systemd/backup | Ít vận hành hơn Kubernetes | SLO/scale/team boundaries vượt khả năng một host |
| Nhiều workload, rolling update, self-healing | Kubernetes managed | Reconciliation, scheduling, ecosystem policy | Chỉ chọn sau khi tính cả chi phí vận hành |
| Batch đơn giản hoặc event-driven nhỏ | Managed job/serverless có thể tốt hơn | Giảm platform burden | Cần portability/control đặc thù |

Kubernetes không tự động làm ứng dụng “microservice-ready”. Nếu chưa có health check, timeout, idempotency, resource profile, telemetry và runbook, đưa ứng dụng lên Kubernetes thường chỉ làm failure mode phức tạp hơn.

## Môi trường đề xuất

- Docker Engine hoặc Docker Desktop có Compose v2 và BuildKit.
- `kubectl` tương thích với cluster; cluster local có thể dùng kind, minikube, k3d hoặc Kubernetes của Docker Desktop.
- `helm`, `kustomize` (đã tích hợp trong `kubectl`) và một registry test khi đến phần nâng cao.
- Tối thiểu 4 CPU/8 GB RAM cho lab cơ bản; 8 CPU/16 GB RAM dễ chịu hơn cho multi-node + observability.
- Git, `curl`, một editor có YAML validation. Windows nên dùng PowerShell 7 hoặc WSL2 cho các lab shell.

Không cần cài mọi công cụ ngay ngày đầu. Mỗi module ghi rõ prerequisites của lab.

## Quy tắc an toàn khi thực hành

- Không dùng secret production trong `.env`, YAML, command history hoặc image layer.
- Không chạy container `--privileged`, mount Docker socket hay host filesystem nếu chưa hiểu đầy đủ trust boundary.
- Dùng namespace/cluster lab riêng; luôn xem `kubectl diff` và context hiện tại trước khi apply/delete.
- Không chạy load test, chaos test hoặc policy thử nghiệm trên cluster dùng chung nếu chưa được cho phép.
- Mọi lệnh cleanup trong tài liệu chỉ nhắm vào resource có label/namespace của lab.

## Phạm vi và cách tránh “học thiếu”

Không có tài liệu tĩnh nào cam kết bao phủ mọi CRD, cloud provider, CNI/CSI hoặc feature mới trong tương lai. Bộ này giải quyết yêu cầu theo cách có thể kiểm chứng: một **coverage ledger** trong [KNOWLEDGE-CHECKLIST.md](KNOWLEDGE-CHECKLIST.md), nguồn chính thức trong [REFERENCES.md](REFERENCES.md), gate thực hành, và quy trình rà soát release/deprecation trước mỗi dự án.

