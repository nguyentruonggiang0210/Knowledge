# 05 — Lexer, parser, AST và schema validator

## Mục tiêu

Bạn sẽ phân biệt lexer, parser, AST và schema validator; hiểu pipeline từ text đến cấu trúc có nghĩa; tự viết recursive-descent parser cho biểu thức số học mà tuyệt đối không dùng eval. Đây là nền cho compiler, file cấu hình, structured output của LLM và tool calling.

## Bản chất và cách hoạt động

Bốn khái niệm giải quyết bốn việc khác nhau:

- Lexer/tokenizer biến ký tự thành token: số, dấu cộng, ngoặc. Nó nhận biết “từ vựng” nhưng chưa quyết định phép nhân ưu tiên hơn cộng.
- Parser nhận token, áp dụng grammar và tạo cấu trúc. Recursive descent thường có một hàm cho mỗi mức ưu tiên.
- AST (Abstract Syntax Tree) là cây ý nghĩa đã bỏ chi tiết cú pháp thừa. Biểu thức 2 + 3 * 4 thành Add(Number(2), Multiply(Number(3), Number(4))).
- Schema validator kiểm tra dữ liệu đã parse đúng hợp đồng hay không, ví dụ request phải có expression dạng chuỗi và precision là số nguyên hợp lệ. Nó không thay parser và không hiểu precedence số học.

Grammar của demo:

~~~text
expression := term (("+" | "-") term)*
term       := unary (("*" | "/") unary)*
unary      := "-" unary | primary
primary    := NUMBER | "(" expression ")"
~~~

Tách tầng làm precedence xuất hiện tự nhiên: term được parse trọn trước khi expression ghép cộng/trừ. Evaluator duyệt AST theo whitelist node; không có đường thực thi Python tùy ý.

## Khi nào dùng / không dùng

Dùng parser khi input là ngôn ngữ có grammar: query, filter, DSL, prompt template, expression. Dùng schema validator ở biên API/config/tool call sau decode JSON. Không dùng regex đơn lẻ cho cú pháp lồng nhau; không dùng eval/exec với input người dùng; không nghĩ JSON parser đã đảm bảo field đúng nghiệp vụ.

## Ví dụ thực tế

AI agent nhận tool call dạng JSON. JSON decoder chỉ chứng minh text là JSON; schema validator mới đảm bảo amount dương và currency thuộc allowlist. Nếu tool cho phép công thức giá, parser riêng phải giới hạn toán tử. Eval trên chuỗi do model tạo có thể biến hallucination thành thực thi mã.

## Chạy demo

~~~powershell
python .\Lessions\05-parsers-ast-schemas\src\demo.py
~~~

Demo tokenize, parse và evaluate hai biểu thức, đồng thời validate schema request. Mọi phép tính đi qua AST an toàn.

## Bài tập

1. Thêm lũy thừa có tính kết hợp phải.
2. In AST dạng cây và thêm vị trí ký tự vào mọi lỗi.
3. Mở rộng schema với tên biến thuộc allowlist.
4. Fuzz parser và bảo đảm chỉ trả kết quả hoặc ValueError có kiểm soát.

## Checklist

- [ ] Tôi giải thích riêng vai trò lexer, parser, AST và validator.
- [ ] Tôi đọc được grammar và hiểu precedence nằm ở đâu.
- [ ] Tôi không dùng eval cho input không tin cậy.
- [ ] Tôi validate syntax và nghiệp vụ ở đúng tầng.

## Liên kết bài trước / sau

- Bài trước: 04 — cây, recursion và độ phức tạp.
- Bài sau: 06 — đại số tuyến tính.
