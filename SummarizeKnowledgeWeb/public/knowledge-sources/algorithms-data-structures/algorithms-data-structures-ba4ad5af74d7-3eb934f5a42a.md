# Quiz 04 — Big-tech-style Mock Interviews

Mỗi mock độc lập, **60 phút**, **100 điểm**. Không mở `answer-key.md`; nếu tự luyện, quay màn hình và nói thành tiếng. Các bài mô phỏng kỹ năng thường được đánh giá trong vòng thuật toán, không đại diện cho đề của một công ty cụ thể và không bảo đảm kết quả tuyển dụng.

## Protocol chung

1. Interviewer chỉ đọc phần **Core prompt** lúc bắt đầu.
2. Ứng viên phải tự hỏi constraints/semantics; interviewer trả lời đúng theo mục “Thông tin khi được hỏi”.
3. Chỉ mở follow-up khi core solution đã đúng hoặc còn 15 phút.
4. Không chạy code trước dry-run. Compiler/test runner chỉ được dùng trong 10 phút cuối.
5. Nếu cần gợi ý, interviewer dùng hint ladder trong `answer-key.md` và ghi mức gợi ý.

Timebox gợi ý: clarify 5 phút, baseline + optimal 8 phút, code 32 phút, test 10 phút, follow-up/complexity 5 phút.

## M1 — Meeting Rooms + Deterministic Assignment

### Core prompt

Cho các cuộc họp dạng half-open interval `[start,end)`. Hãy trả số phòng tối thiểu để tổ chức tất cả cuộc họp.

```csharp
int MinMeetingRooms(int[][] meetings)
```

Ví dụ:

```text
[[0,30],[5,10],[15,20]] -> 2
[[1,5],[5,8]]           -> 1
[]                      -> 0
```

### Thông tin khi được hỏi

- `0 <= meetings.Length <= 200_000`.
- `start < end`; endpoint là `int`; input chưa sort.
- `[1,5)` và `[5,8)` không overlap.
- Không được sửa các inner array của caller; có thể tạo index/order phụ.
- Phải tốt hơn `O(n²)`.

### Follow-up

Trả thêm room id cho từng meeting theo **thứ tự input**:

```csharp
int[] AssignRooms(int[][] meetings)
```

Phải dùng đúng số phòng tối thiểu. Room id bắt đầu từ `0`. Nếu nhiều room cùng rảnh tại thời điểm bắt đầu, chọn id nhỏ nhất. Khi nhiều meeting cùng start, xử lý theo input index tăng dần để output deterministic.

### Ứng viên phải tự test

- Hai meeting chỉ chạm endpoint.
- Nhiều meeting cùng start/end.
- Tất cả overlap; không cái nào overlap.
- Endpoint âm và gần `int` boundary.
- Input không bị thay đổi sau lời gọi.

## M2 — Word Ladder + Path Reconstruction

### Core prompt

Mỗi bước được đổi đúng một ký tự; mọi từ trung gian phải thuộc dictionary. `beginWord` không bắt buộc nằm trong dictionary, `endWord` bắt buộc có. Trả số **từ** trong shortest transformation sequence, hoặc `0` nếu không có.

```csharp
int LadderLength(string beginWord, string endWord, IList<string> wordList)
```

Ví dụ:

```text
begin = "hit", end = "cog"
dict  = ["hot","dot","dog","lot","log","cog"]
result = 5  // hit -> hot -> dot -> dog -> cog (một shortest path)
```

### Thông tin khi được hỏi

- Mọi từ gồm `a`–`z`, cùng độ dài `L`; `1 <= L <= 10`.
- Dictionary có tối đa `20_000` từ và có thể có duplicate.
- `beginWord == endWord` trả `1`.
- Không sửa collection của caller.
- Một từ không được xem là neighbor của chính nó.

### Follow-up

Trả **một** shortest path, hoặc list rỗng nếu không có:

```csharp
IList<string> LadderPath(
    string beginWord,
    string endWord,
    IList<string> wordList)
```

Nếu có nhiều path, path nào cũng hợp lệ. Sau khi code, thảo luận bidirectional BFS: khi nào hữu ích và reconstruction phức tạp thêm ở đâu.

### Ứng viên phải tự test

- `endWord` vắng mặt; begin bằng end.
- Dictionary duplicate.
- Có cycle giữa các từ.
- Nhiều shortest path.
- Không có neighbor từ begin.

## M3 — Cheapest Route With One Discount

### Core prompt

Cho directed graph có `n` node đánh số `0..n-1`. Mỗi cạnh `[u,v,w]` có chi phí không âm. Bạn có **tối đa một** coupon; coupon dùng trên một cạnh làm chi phí cạnh đó thành `floor(w/2)`. Trả chi phí nhỏ nhất từ `source` tới `target`, hoặc `-1` nếu không tới được.

```csharp
long CheapestWithDiscount(
    int n,
    int[][] edges,
    int source,
    int target)
```

Ví dụ:

```text
n = 4
edges = [[0,1,8],[1,3,8],[0,2,3],[2,3,20]]
source = 0, target = 3
result = 12  // giảm cạnh 0->1 hoặc 1->3
```

### Thông tin khi được hỏi

- `1 <= n <= 200_000`, `0 <= edges.Length <= 400_000`.
- `0 <= w <= int.MaxValue`; có parallel edge và self-loop.
- Tổng chi phí có thể vượt `int`; không có cạnh âm.
- Coupon không bắt buộc phải dùng. Nếu `source == target`, kết quả là `0`.
- Mục tiêu phù hợp sparse graph; không materialize ma trận `n*n`.

### Follow-up

1. Reconstruct path và chỉ ra cạnh đã dùng coupon.
2. Nếu có tối đa `k` coupon (`k` nhỏ, ví dụ `<= 10`), state và complexity thay đổi thế nào?
3. Vì sao “tìm shortest path bình thường rồi giảm cạnh lớn nhất trên path đó” có thể sai? Hãy tạo counterexample.

### Ứng viên phải tự test

- Source bằng target; target unreachable.
- Zero-weight edge.
- Route tối ưu không dùng coupon (hãy suy nghĩ liệu có thể xảy ra với trọng số không âm và “tối đa một”).
- Parallel edges; overflow khi cộng distance.
- Một đường ít cạnh nhưng đắt hơn đường nhiều cạnh.

## M4 — Weighted Job Scheduling + Reconstruction

### Core prompt

Mỗi job có `id`, `start`, `end`, `profit`; interval là half-open `[start,end)`. Chọn tập job không overlap có tổng profit lớn nhất. Có thể chọn rỗng.

```csharp
public readonly record struct Job(int Id, int Start, int End, long Profit);

long MaxProfit(Job[] jobs)
```

Ví dụ:

```text
(id,start,end,profit)
(0,1,3,50), (1,2,4,10), (2,3,5,40), (3,3,6,70)
result = 120  // jobs 0 và 3
```

### Thông tin khi được hỏi

- `0 <= jobs.Length <= 200_000`, `start < end`.
- Endpoint là `int`; profit là `long` và có thể âm.
- Job kết thúc tại `t` tương thích với job bắt đầu tại `t`.
- `Id` là duy nhất nhưng không liên tiếp; không sửa input.
- Cần tốt hơn `O(n²)`.

### Follow-up

Trả cả tập `Id` của một nghiệm tối ưu theo thứ tự thời gian:

```csharp
(long Profit, int[] JobIds) MaxProfitSchedule(Job[] jobs)
```

Nếu có nhiều nghiệm tối ưu, nghiệm nào cũng được. Hãy giải thích cách binary search job tương thích gần nhất, DP recurrence, và metadata dùng để reconstruct.

### Ứng viên phải tự test

- Input rỗng; tất cả profit âm.
- Các job chỉ chạm endpoint.
- Một job dài cạnh tranh với nhiều job ngắn.
- Duplicate start/end nhưng id khác.
- Tổng profit vượt `int`.

## Phiếu chấm nhanh sau mỗi mock

Không tự ước lượng theo cảm giác; dùng rubric chi tiết trong answer key.

- Làm rõ đề và constraints: `/10`
- Baseline, lựa chọn thuật toán, invariant/proof: `/25`
- Code C# đúng và rõ: `/30`
- Complexity và trade-off: `/10`
- Dry-run, edge cases, test: `/15`
- Giao tiếp và follow-up: `/10`
- Trừ điểm gợi ý: `0 / -5 / -10 / -20`
- **Tổng:** `/100`
- Thời gian đến optimal idea:
- Thời gian đến code complete:
- Lỗi đầu tiên được test phát hiện:
- Một câu giải thích cần nói lại ngắn gọn hơn:
