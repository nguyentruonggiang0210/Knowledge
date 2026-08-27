# Triển khai RAG Workspace lên Oracle Cloud Infrastructure

Tài liệu này mô tả phương án đơn giản: một OCI Compute VM chạy Docker Compose gồm frontend Nginx, FastAPI và Ollama. Đây là điểm khởi đầu phù hợp cho một instance; khi tải tăng nên tách Ollama, storage và API thành các dịch vụ riêng.

## 1. Kiến trúc

```text
Internet
   ↓ HTTPS
OCI Load Balancer hoặc reverse proxy TLS
   ↓
Frontend Nginx :80
   ├── static React
   └── /api → FastAPI :8000
                    ↓
               Ollama :11434
                    ↓
        Block Volume / Docker volumes
```

OCI Compute cung cấp VM/bare-metal instance và cần VCN, subnet cùng SSH key cho Linux instance. Xem [Oracle Compute instances](https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/instances.htm).

## 2. Chọn máy

Điểm khởi đầu thực tế cho hai model Qwen 4B/embedding chạy CPU:

- 4 OCPU.
- 24 GB RAM trở lên.
- 80–120 GB boot/block storage.
- Ubuntu 24.04 hoặc Oracle Linux 9.

Đây là cấu hình khởi điểm, không phải cam kết hiệu năng. Hãy đo p95 latency với tài liệu và lượng người dùng thật. Nếu cần nhiều request đồng thời, dùng GPU instance hoặc tách inference sang máy riêng.

OCI Compute hỗ trợ nhiều loại VM và cho phép chọn CPU/RAM theo nhu cầu. [Compute overview](https://docs.oracle.com/en-us/iaas/Content/Compute/Concepts/computeoverview.htm)

## 3. Network

Trong VCN/Network Security Group:

- Port `22`: chỉ cho IP quản trị.
- Port `80`: cho HTTP hoặc redirect sang HTTPS.
- Port `443`: cho HTTPS.
- Không mở `8000` và `11434` ra Internet.

OCI security lists/NSG kiểm soát ingress ở subnet/instance. Oracle khuyến nghị giới hạn source CIDR thay vì mở rộng `0.0.0.0/0` nếu không cần thiết. [OCI network security guidance](https://docs.oracle.com/en-us/iaas/Content/Security/Reference/configuration_tasks.htm)

Máy Linux cũng phải cho phép port 80/443 trong firewall của hệ điều hành.

## 4. Cài Docker trên VM

SSH vào VM, cài Docker Engine và Compose plugin theo tài liệu của Docker dành cho hệ điều hành đã chọn. Sau đó kiểm tra:

```bash
docker --version
docker compose version
```

Clone source:

```bash
git clone <YOUR_REPOSITORY_URL> rag-workspace
cd rag-workspace
cp .env.example .env
```

Chỉnh `.env`:

```dotenv
WEB_PORT=80
RAG_EMBEDDING_MODEL=qwen3-embedding:0.6b
RAG_GENERATION_MODEL=qwen3:4b-instruct
RAG_MAX_UPLOAD_MB=25
RAG_CACHE_TTL=86400
RAG_CORS_ORIGINS=https://rag.example.com
```

## 5. Build và chạy

```bash
docker compose up -d --build
docker compose ps
```

Tải model vào Ollama volume:

```bash
docker compose exec ollama ollama pull qwen3-embedding:0.6b
docker compose exec ollama ollama pull qwen3:4b-instruct
docker compose exec ollama ollama list
```

Kiểm tra:

```bash
curl http://127.0.0.1/api/health
docker compose logs -f backend
```

Upload tài liệu từ giao diện. Backend sẽ tạo index trong volume `rag_index`.

## 6. HTTPS

Không dùng HTTP thuần cho production. Có thể chọn:

1. OCI Load Balancer quản lý TLS certificate và forward tới port 80 của VM.
2. Caddy/Traefik/Nginx reverse proxy trên VM với certificate tự động.

Chỉ public frontend proxy. FastAPI và Ollama tiếp tục nằm trong private Docker network.

## 7. Persistent storage và backup

Compose tạo bốn volume:

```text
ollama_models  model weights
rag_documents tài liệu upload
rag_index     vector/index/cache
rag_history   SQLite conversation history
```

Production nên đặt Docker data hoặc các bind mount này trên OCI Block Volume. Block Volume là storage có thể attach/detach và mở rộng độc lập với VM. [OCI Block Volume overview](https://docs.oracle.com/en-us/iaas/Content/Block/Concepts/overview.htm)

Thiết lập backup policy định kỳ. OCI hỗ trợ manual và policy-based backup; lịch backup cần dựa trên RPO/RTO của hệ thống. [Block Volume backups](https://docs.oracle.com/en-us/iaas/Content/Block/Concepts/blockvolumebackups.htm)

Tối thiểu cần backup:

- `rag_documents`: dữ liệu gốc, quan trọng nhất.
- Cấu hình và secrets.
- `rag_index` có thể tái tạo nhưng backup giúp phục hồi nhanh.
- `rag_history` chứa SQLite DB; cần backup nhất quán cùng file WAL nếu đang chạy.
- Ollama models có thể tải lại, thường không cần backup thường xuyên.

## 8. Security checklist trước khi public

Source hiện là nền tảng kỹ thuật, chưa có authentication. Trước khi expose Internet:

- Thêm OIDC/JWT và phân quyền document/tenant.
- Quét malware cho file upload.
- Xác minh MIME/magic bytes, không chỉ extension.
- Giới hạn request body ở Nginx/FastAPI.
- Rate limit `/api/chat` và `/api/files/upload`.
- Lưu secrets trong OCI Vault hoặc secret manager tương đương.
- Chạy container non-root; backend Dockerfile đã dùng user `appuser`.
- Không public Ollama port 11434.
- Bật HTTPS, access log và audit log.
- Chỉ cấp IAM quyền tối thiểu.

Oracle khuyến nghị giới hạn quyền xóa volume/backup và thực hiện backup định kỳ. [OCI Block Volume security](https://docs.oracle.com/en-us/iaas/Content/Security/Reference/blockstorage_security.htm)

## 9. Update ứng dụng

```bash
git pull
docker compose build
docker compose up -d
docker image prune
```

Trước update lớn:

1. Backup documents/index volume.
2. Ghi lại model tags đang dùng.
3. Build image mới.
4. Kiểm tra `/api/health`.
5. Chạy một bộ câu hỏi smoke test.

## 10. Hướng scale tiếp theo

Khi một VM không còn đủ:

- Thay exact dense scan bằng Qdrant hoặc pgvector/HNSW.
- Chuyển documents sang Object Storage.
- Dùng queue cho ingestion/index jobs.
- Tách embedding và generation inference.
- Đưa FastAPI vào instance pool/Kubernetes.
- Dùng Redis cho response cache và distributed lock.
- Lưu conversation vào PostgreSQL.
- Thêm OpenTelemetry, metrics và centralized logs.
