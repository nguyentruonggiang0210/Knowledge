# RAG Workspace

Workspace hỏi đáp tài liệu có giao diện lấy cảm hứng từ VS Code: Explorer bên trái, Monaco Editor ở giữa, terminal phía dưới và RAG Assistant bên phải giống GitHub Copilot.

## Cấu trúc

```text
rag_utils/   RAG engine, indexing, retrieval, cache và CLI
backend/     FastAPI upload/index/search/chat SSE
frontend/    React + Vite + Monaco Editor
deploy/      Hướng dẫn triển khai Oracle Cloud
document/    Tài liệu local
.rag_index/  Persistent index và answer cache
data/        SQLite conversation history (tạo khi chạy)
```

## Chạy local

### 1. Backend

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
ollama pull qwen3-embedding:0.6b
ollama pull qwen3:4b-instruct
.\.venv\Scripts\python.exe -m rag_utils.rag_v2 index .\document
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
```

API docs:

```text
http://127.0.0.1:8000/docs
```

### 2. Frontend

Mở terminal khác:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Ứng dụng:

```text
http://127.0.0.1:5173
```

Vite proxy `/api` sang FastAPI tại port 8000.

Kiểm tra nhanh UI bằng Edge/Chromium khi hai server đang chạy:

```powershell
cd frontend
$env:SCREENSHOT_PATH="..\artifacts\rag-workspace.png"
npm.cmd run smoke:ui
```

## Flow upload và chat

```text
Upload PDF/MD/TXT
  → FastAPI lưu file an toàn
  → background incremental index
  → frontend poll trạng thái
  → người dùng đặt câu hỏi
  → hybrid retrieval + RRF + MMR
  → Ollama generation
  → SSE token stream sang panel bên phải
```

Khi người dùng đính kèm file ngay trong chat, tên file được gửi thành `source_filters`; retrieval chỉ tìm trong các file đã đính kèm.

## API chính

| Method | Endpoint | Công dụng |
|---|---|---|
| GET | `/api/health` | API/Ollama/index health |
| GET | `/api/files` | Danh sách tài liệu |
| POST | `/api/files/upload` | Upload và tự động index |
| GET | `/api/files/{name}/content` | Nội dung để mở trong editor |
| DELETE | `/api/files/{name}` | Xóa và reindex |
| POST | `/api/index` | Bắt đầu index job |
| GET | `/api/index/status` | Theo dõi index job |
| POST | `/api/search` | Retrieval không gọi LLM |
| POST | `/api/chat` | Chat JSON hoặc SSE |
| POST | `/api/devices/register` | Đăng ký browser/device và MAC tùy chọn |
| GET | `/api/conversations` | Danh sách lịch sử của một thiết bị |
| GET | `/api/conversations/{id}` | Nội dung một cuộc trò chuyện |
| DELETE | `/api/conversations/{id}` | Xóa cuộc trò chuyện của thiết bị |

## Lịch sử theo thiết bị

Frontend tạo `device_id` một lần và giữ trong `localStorage`. SQLite lưu ba bảng
`devices`, `conversations` và `messages`; panel đồng hồ trong RAG Assistant dùng
ID này để chỉ hiển thị lịch sử của trình duyệt hiện tại.

Web browser không thể đọc MAC address thật. Vì vậy `devices.mac_address` là cột
nullable, chỉ dành cho desktop agent hoặc trusted proxy có thể cung cấp MAC.
Không dùng `device_id` hoặc MAC như cơ chế đăng nhập/phân quyền.

## Docker Compose

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec ollama ollama pull qwen3-embedding:0.6b
docker compose exec ollama ollama pull qwen3:4b-instruct
```

Sau đó truy cập `http://localhost` và upload tài liệu từ giao diện.

Chi tiết triển khai xem [deploy/ORACLE_CLOUD.md](deploy/ORACLE_CLOUD.md).

## Lưu ý production

Backend hiện chưa có đăng nhập hoặc tenant ACL. Không expose trực tiếp ra Internet với tài liệu nhạy cảm. Trước production cần thêm OIDC/JWT, rate limit, antivirus/file scanning, HTTPS và backup volume.
