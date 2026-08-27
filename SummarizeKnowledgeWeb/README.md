# Knowledge Atlas

Ứng dụng React một trang để học toàn bộ kiến thức trong workspace `E:\SourceCode`. Nội dung giao nhau được gom vào 12 chủ đề chuẩn; mỗi tab có ba chế độ:

- **Tóm tắt:** bài học cô đọng để ôn nhanh.
- **Tài liệu chi tiết:** đọc nguyên bản toàn bộ Markdown đã được gán cho chủ đề, tải theo nhu cầu thay vì nhét hết vào JavaScript bundle.
- **Kiểm tra Q&A:** 16 câu mỗi chủ đề, chấm điểm, giải thích đáp án, dẫn nguồn, ôn lại câu sai và lưu điểm tốt nhất.

Hiện catalog kiểm soát coverage của **376 file Markdown**, **699.575 từ nguồn thô**, **633.759 từ học tập sau khử trùng/loại tài liệu tổng hợp khỏi tổng**, và **192 câu hỏi**. Tài liệu tổng hợp vẫn đọc được trong tab nguồn dù không được cộng lặp vào learning total.

## Chạy dự án

Yêu cầu Node.js `20.19+`, `22.13+` hoặc `24+`.

```bash
npm install
npm run dev
```

`predev` tự đồng bộ và kiểm tra tài liệu nguồn. Kiểm tra toàn bộ lint, test, TypeScript, coverage nội dung và production build:

```bash
npm run check
```

Các lệnh riêng:

```bash
npm run sync:sources
npm run validate:content
npm run test
npm run build
```

## Thêm một kiến thức mới

Nếu đã tạo một folder Markdown mới trực tiếp trong `E:\SourceCode`, scaffold topic và mapping chỉ bằng một lệnh:

```bash
npm run topic:new -- "Event Sourcing" --source-root EventSourcing
```

Lệnh tạo:

```text
src/content/knowledge/event-sourcing/
├── meta.json
├── content.md
└── questions.json
```

Nó cũng thêm source root vào `scripts/source-topic-map.json`; tab, menu và search được tự phát hiện, không cần sửa router hoặc registry. Sau đó:

1. Hoàn thiện metadata và bài tóm tắt.
2. Tạo ít nhất 15 câu hỏi có đúng bốn lựa chọn, giải thích, độ khó và đường dẫn Markdown nguồn.
3. Chạy `npm run check`.

Nếu tài liệu mới thuộc chủ đề đã có, không tạo tab trùng. Chỉ thêm source root/rule vào `scripts/source-topic-map.json` để gom tài liệu về canonical topic hiện hữu. Generator cũng cảnh báo tên gần giống; chỉ dùng `--force` khi đã xác nhận là kiến thức khác.

## Quy tắc coverage nguồn

`scripts/source-topic-map.json` là nơi duy nhất khai báo quyền sở hữu Markdown:

- `sourceRoots`: các folder được quét.
- `rules`: ngoại lệ chi tiết bằng regular expression.
- `fallbacks`: topic mặc định của từng source root.
- `aggregatePatterns`: đánh dấu tài liệu gộp vẫn cho phép đọc nhưng không cộng lặp vào learning word count.

`npm run sync:sources` loại `.git`, `node_modules`, `bin/obj`, `.terraform`, virtual environment, cache và build artifact; sau đó:

1. Gán mỗi Markdown vào đúng một canonical topic.
2. Phát hiện file chưa phân loại hoặc một file khớp nhiều rule.
3. Gom file trùng nội dung chính xác thành một document có nhiều provenance path.
4. Copy tài liệu theo topic vào `public/knowledge-sources` và sinh catalog metadata ở `src/content/generated/sourceCatalog.json`.

Hai folder sinh tự động trên không nên sửa thủ công. Markdown gốc không bị di chuyển, sửa hay xóa.

> [!WARNING]
> Source sync sao chép **nguyên văn toàn bộ Markdown** đã map vào `public/knowledge-sources` (và sau đó vào production build). Bất kỳ ai truy cập được deployment đều có thể tải các file này. Nếu nguồn chứa dữ liệu nội bộ, bí mật hoặc thông tin nhạy cảm, chỉ chạy/deploy ứng dụng ở môi trường local/private; hãy loại bỏ hoặc làm sạch dữ liệu đó trước khi public hosting.

`validate:content` tiếp tục kiểm tra mỗi topic có đủ ba file, metadata hợp lệ, bài tóm tắt ít nhất 1.000 từ và sáu heading H2, ít nhất 15 câu Q&A, ID/đáp án/độ khó hợp lệ, ownership và `sourceFolders` nhất quán, mọi câu hỏi dẫn tới đúng source của topic, đồng thời hash asset public phải khớp Markdown nguồn.

## Kiến trúc

```text
src/
├── domain/             # Entity/type thuần: topic, quiz, source document
├── application/        # Port và use case lấy/tìm catalog
├── infrastructure/     # Adapter import Markdown, Q&A và catalog sinh tự động
├── content/knowledge/  # Một folder = một knowledge tab chuẩn
└── presentation/       # Component, page, hook và responsive styles
```

Dependency hướng vào application/domain; `App.tsx` là composition root. Search, theme, tiến độ học và điểm quiz chạy cục bộ. Giao diện responsive từ mobile 320 px tới desktop, có keyboard tab navigation, focus state, semantic controls và hỗ trợ reduced motion.

Chi tiết phân loại nằm tại [docs/CONTENT_MAP.md](docs/CONTENT_MAP.md).
