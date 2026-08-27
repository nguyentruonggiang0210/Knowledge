# 01 — Computing, CLI và Git

## Mục tiêu

Bạn sẽ hiểu chương trình, tiến trình, đường dẫn, biến môi trường, mã thoát và stdin/stdout/stderr; biết dùng CLI có kiểm soát và đọc trạng thái Git trước khi thay đổi mã nguồn. Mục tiêu không phải thuộc lệnh mà là hiểu trạng thái do mỗi lệnh tạo ra.

## Bản chất và cách hoạt động

Shell nhận lệnh, phân tách chương trình và đối số, khởi tạo tiến trình rồi trả exit code. Quy ước phổ biến: 0 thành công, khác 0 là lỗi. Đường dẫn tương đối phụ thuộc working directory, vì vậy cùng một lệnh có thể đọc file khác nhau khi chạy ở nơi khác.

Git lưu lịch sử dưới dạng snapshot. Working tree là file đang sửa; staging area là thay đổi dự kiến cho commit tiếp theo; repository chứa commit. Git status dạng short có hai cột: cột đầu cho staging area, cột hai cho working tree. Luôn xem diff trước commit để tránh đưa secret hoặc file ngoài ý muốn vào lịch sử.

Demo không chạy lệnh hệ thống. Nó ghép biểu diễn lệnh từ danh sách đối số và phân loại đầu ra Git porcelain, thay vì nối chuỗi tùy tiện dễ gây command injection.

## Khi nào dùng / không dùng

Dùng CLI để tái lập thao tác, tự động hóa, chạy test và điều tra môi trường. Dùng Git cho mọi thay đổi mã nguồn có giá trị. Không chạy lệnh xóa đệ quy khi chưa xác nhận đường dẫn tuyệt đối; không chèn input không tin cậy vào chuỗi shell; không commit khóa API, dữ liệu cá nhân hay model artifact lớn.

## Ví dụ thực tế

Trước khi agent sửa repository, harness thường gọi Git status để biết file nào người dùng đã chỉnh. Sau khi sửa, nó chạy test và đọc exit code. Nếu tự động hóa hiểu sai untracked thành modified, nó có thể bỏ sót file mới cần phát hành.

Workflow tối thiểu:

~~~powershell
Get-Location
git status --short
git diff
python .\path\to\demo.py
git diff --check
~~~

## Chạy demo

~~~powershell
python .\Lessions\01-computing-cli-git\src\demo.py
~~~

## Bài tập

1. Mở rộng bộ phân loại để tách staged và unstaged.
2. Tạo repo thử nghiệm, sửa một file, stage file khác rồi đối chiếu status.
3. Viết hàm từ chối đối số chứa ký tự xuống dòng trước khi ghi audit log.

## Checklist

- [ ] Tôi giải thích được working directory và đường dẫn tương đối.
- [ ] Tôi kiểm tra exit code thay vì chỉ nhìn output.
- [ ] Tôi phân biệt working tree, staging area và commit.
- [ ] Tôi không nối input không tin cậy thành lệnh shell.

## Liên kết bài trước / sau

- Bài trước: 00 — bản đồ năng lực.
- Bài sau: 02 — nền tảng Python.
