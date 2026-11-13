# KB Learning Lab

Đây là lớp tài liệu học dẫn xuất từ KB, dành để hiểu kiến trúc, kỹ thuật, use case và flow thực tế. Source of truth vẫn là Markdown/JSON dưới `kb/`, `orchestration/`, `governance/`, `evals/`, `.agents/skills/` và danh mục `TECHNIQUES.md`.

## Xem local

```powershell
python scripts/build_lessons.py
python -m http.server 8000 --directory kb_lessions
```

Mở `http://localhost:8000`. Không cần build frontend hay cài package JavaScript.

## Cấu trúc

- `index.html`: mental model toàn hệ thống và learning path.
- `01`–`07`: bài học từ truth/memory đến retrieval, agents, BMAD, assurance, end-to-end và labs.
- `techniques.html`: atlas search/filter của toàn bộ kỹ thuật.
- `assets/techniques-data.js`: file sinh tự động từ `TECHNIQUES.md`; không sửa tay.
- `assets/styles.css`, `assets/app.js`: presentation, navigation, progress và atlas UI.

Sau khi sửa `TECHNIQUES.md`, chạy lại `python scripts/build_lessons.py`. Dùng `python scripts/build_lessons.py --check` để kiểm đủ page và local references.
