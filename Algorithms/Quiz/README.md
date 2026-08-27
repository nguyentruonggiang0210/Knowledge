# Bộ Quiz giải thuật phỏng vấn

Thư mục này dùng để **đo mức hiểu và khả năng trình bày**, không chỉ đo khả năng nhớ code. Không bộ câu hỏi nào có thể đảm bảo kết quả tuyển dụng; mục tiêu ở đây là tạo một quy trình luyện tập có số liệu để tìm lỗ hổng trước khi phỏng vấn.

## Cấu trúc

| Tệp | Nội dung | Điểm tối đa |
|---|---|---:|
| [01-foundations.md](01-foundations.md) | Big-O, array/string, hashing, linked list, stack/queue, binary search/sort, bit, interval, Kadane | 100 |
| [02-trees-graphs.md](02-trees-graphs.md) | Tree, BST, trie, heap, BFS/DFS, topo sort, union-find, shortest path, MST | 120 |
| [03-dp-greedy-advanced.md](03-dp-greedy-advanced.md) | Recursion/backtracking, greedy, DP 1D/2D, knapsack, LIS, string algorithms | 120 |
| [04-big-tech-mock-interview.md](04-big-tech-mock-interview.md) | Bốn buổi mock có yêu cầu và follow-up kiểu phỏng vấn | 100/buổi |
| [05-advanced-coverage-checkpoint.md](05-advanced-coverage-checkpoint.md) | Difference array, deque, 0–1 BFS, Floyd, range tree, graph/math/design nâng cao | 100 |
| [answer-key.md](answer-key.md) | Đáp án, lời giải thích, oracle test và rubric | — |
| [progress-tracker.md](progress-tracker.md) | Theo dõi lần làm, lỗi sai và lịch ôn cách quãng | — |
| [lesson-coverage-map.md](lesson-coverage-map.md) | Ánh xạ đủ 36 lesson sang câu quiz/retest tương ứng | — |

> `answer-key.md` được tách riêng có chủ đích. Đừng mở tệp này trong lúc làm closed-book hoặc mock.

Quiz 05 vẫn chấm trên thang 100, nhưng ba cổng `CG01–CG03` là pass/fail bắt buộc để xác nhận prefix sum, grid DP và GCD/fast power; điểm ở chủ đề khác không được bù cho các cổng này.

## Ba chế độ luyện

### 1. Closed-book diagnostic

1. Chọn đúng một module, đóng lesson, IDE autocomplete và internet.
2. Bật đồng hồ: module 01 là 90 phút; module 02 và 03 là 120 phút; module 05 là 110 phút.
3. Trả lời MCQ trước, trace trên giấy, sau đó code trong một project C# scratch.
4. Với câu coding, luôn nói/ghi: giả định, brute force, invariant, thuật toán tối ưu, độ phức tạp, test biên.
5. Hết giờ thì dừng, kể cả code chưa hoàn thành. Ghi điểm lần đầu vào tracker trước khi xem đáp án.

### 2. Review có chủ đích

1. Mở `answer-key.md`, tự chấm bằng rubric; không cho điểm một ý “gần đúng” nếu rubric yêu cầu code chạy đúng.
2. Gắn mỗi lỗi vào một nhóm: **concept**, **pattern recognition**, **implementation**, **complexity**, **edge case**, hoặc **communication**.
3. Viết lại nguyên nhân sai bằng một câu và một hành động sửa cụ thể.
4. Làm lại chỉ các câu sai sau 48 giờ, rồi sau 7 ngày và 21 ngày. Lần làm lại phải dùng input mới.

### 3. Coding mock interview

- Nhờ một người đóng vai interviewer nếu có thể. Nếu tự luyện, ghi màn hình và nói thành tiếng.
- Mỗi buổi trong `04-big-tech-mock-interview.md` kéo dài 60 phút: 5 phút làm rõ, 8 phút nêu baseline và tối ưu, 32 phút code, 10 phút test, 5 phút follow-up.
- Interviewer chỉ đưa gợi ý trong `answer-key.md` khi ứng viên kẹt; mỗi gợi ý làm giảm điểm theo rubric.
- Không chạy code cho đến khi đã dry-run ít nhất một ví dụ bình thường và một edge case.

## Cách chấm và ngưỡng hành động

Tính phần trăm: `điểm đạt / điểm tối đa * 100`.

| Tỷ lệ | Diễn giải | Việc tiếp theo |
|---:|---|---|
| 90–100% | Nắm tốt module ở điều kiện hiện tại | Làm lại dưới áp lực thời gian hoặc chuyển sang mock |
| 75–89% | Nền khá nhưng còn lỗ hổng có thể bị hỏi sâu | Ôn các lỗi, làm lại sau 48 giờ |
| 60–74% | Nhận diện được pattern nhưng độ tin cậy chưa đủ | Học lại các lesson liên quan rồi retest |
| < 60% | Kiến thức hoặc triển khai còn thiếu hệ thống | Chia nhỏ module, luyện từng pattern |

Để đánh giá “mock-ready”, nên đạt đồng thời: ít nhất 85% ở ba module chính trong hai lần cách nhau tối thiểu 7 ngày; ít nhất 80/100 ở ba mock liên tiếp; không có lỗi nghiêm trọng về complexity hoặc edge case lặp lại. Với mục tiêu điểm thuật toán rất cao, dùng cổng chặt hơn trong roadmap: ≥90% ở **cả bốn** quiz chấm điểm (01, 02, 03, 05), hai mock liên tiếp ≥90, và mọi bài coding phải compile đúng. Đây là ngưỡng luyện tập, không phải dự đoán tuyển dụng.

## Quy ước khi code C#

- Có thể dùng .NET hiện hành và thư viện chuẩn (`Dictionary`, `HashSet`, `Queue`, `Stack`, `PriorityQueue`).
- Không dùng LINQ để che khuất phần thuật toán đang được kiểm tra.
- Nêu rõ cách xử lý `null`, input rỗng, overflow và Unicode nếu liên quan.
- Nếu dùng `PriorityQueue<TElement, TPriority>`, nhớ rằng mặc định là min-heap.
- Mỗi lời giải cần có time/space complexity theo kích thước input, không chỉ nói “nhanh”.

## Quy tắc chống học thuộc đáp án

- Mỗi lần retest hãy đổi ít nhất một input và tự tính oracle trước khi chạy code.
- Nếu nhớ nguyên code, hãy giải bằng invariant và viết lại từ file trống.
- Một câu chỉ được đánh dấu “mastered” khi giải thích được tại sao đúng, đưa được counterexample cho cách sai phổ biến và code lại trong thời gian quy định.
