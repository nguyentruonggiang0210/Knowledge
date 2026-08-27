# Content map và coverage

Ứng dụng không di chuyển hay xóa source gốc. Toàn bộ 376 file Markdown trong phạm vi source (kể cả answer key, draft và bản tổng hợp) được gán duy nhất vào một trong 12 chủ đề chuẩn. `node_modules`, `.git`, `.vs`, `.m2`, `.venv`, `bin`, `obj`, `target`, `.terraform`, `dist`, cache và binary artifact không thuộc phạm vi kiến thức.

## Coverage hiện tại

| Chủ đề chuẩn | File Markdown | Số từ xấp xỉ | Nguồn chính |
|---|---:|---:|---|
| AI & Machine Learning | 40 | 16.033 | `AIEngineer` foundations, ML/DL, serving, distributed AI |
| RAG & Agent Systems | 32 | 123.449 | `RAG`, Claude foundations, AI RAG/agent lessons |
| Data Engineering | 9 | 4.672 | `DataEngineerTutorial`, AI SQL/ETL/API lessons |
| Algorithms & Data Structures | 51 | 70.249 | `Algorithms`, Interview algorithms, AI/Java DSA |
| Advanced Databases | 52 | 118.928 | `DatabaseAdvance`, Interview database |
| Java, JVM & Spring | 22 | 41.480 | `JavaAdvanceMapCsharp`, Interview Java/JVM/Spring |
| C#/.NET, APIs & Containers | 4 | 26.789 | Interview C#/.NET; source code ASP.NET được tóm tắt trong bài |
| Concurrency & Messaging | 11 | 15.893 | `MultiThreadDotnet`, Java concurrency/distributed/messaging |
| Terraform & Cloud | 52 | 41.673 | `Terraform/Lessions`, `Terraform/Refer`, quiz và capstone |
| DevOps, SRE & Security | 71 | 89.009 | `Terraform/Devops`, Interview infra/security, deploy guide |
| System Design & Interview | 23 | 73.993 | Interview hub, Java/AI interview và system-design lessons |
| Software Engineering & Quality | 9 | 11.591 | Testing/modeling, clean architecture, ADR/readiness/runbook |
| **Tổng không tính lại bản tổng hợp** | **376** | **633.759** | Mỗi file có đúng một owner |

Các con số được sinh lại bằng `npm run sync:sources`; catalog máy đọc nằm tại `src/content/generated/sourceCatalog.json`. Tổng thô của mọi file là 699.575 từ. `ALL_DOMAINS.md` (65.816 từ) vẫn đọc được trong thư viện nhưng được đánh dấu là bản tổng hợp và không cộng lại vì đã chứa D1–D5.

## Quy tắc xử lý trùng

1. File trùng nội dung chính xác được gom thành một document, giữ tất cả provenance path.
2. File aggregate chứa lại các tài liệu con vẫn được lập chỉ mục để tra cứu, nhưng có `isAggregate: true` và không được cộng vào số từ kiến thức.
3. Nội dung giao nhau chỉ có một canonical owner; tab khác dùng phần tóm tắt hoặc cross-reference, không copy source thêm lần nữa.
4. Overview, implementation, answer key, quiz và bản dịch của cùng miền nằm chung một tab theo lộ trình nền tảng → nâng cao → thực hành.
5. Công nghệ khác nhau nhưng chung mental model như backpressure, idempotency hay observability được giải thích ở owner chính, sau đó nêu khác biệt nền tảng.
6. Demo, draft và skeleton phải được nói rõ giới hạn, không trình bày như production reference.

Các ngoại lệ ownership cụ thể được khai báo có thứ tự trong `scripts/source-topic-map.json`. Sync thất bại nếu một file khớp nhiều rule, source root không tồn tại, rule trỏ tới topic không có, hoặc hai file giống hệt bị gán sang hai topic khác nhau.

## Quy ước topic mới

Mỗi folder dưới `src/content/knowledge` là một tab:

```text
my-topic/
├── meta.json       # title, thứ tự, tag, outcome và provenance
├── content.md      # bài tóm tắt canonical
└── questions.json  # tối thiểu 15 câu có đáp án, giải thích và source
```

Vite tự tìm ba file bằng `import.meta.glob`. Với một source root mới, dùng:

```bash
npm run topic:new -- "Tên chủ đề" --source-root TenFolderNguon
```

Sau khi hoàn thiện template, `npm run check` là quality gate bắt buộc. Việc thêm Markdown vào source root đã map chỉ cần chạy lại sync/build; tài liệu tự xuất hiện trong chế độ **Tài liệu chi tiết** của đúng tab.
