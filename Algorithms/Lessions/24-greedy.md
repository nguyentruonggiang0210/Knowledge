# 24. Greedy: chọn tối ưu cục bộ có chứng minh

## Mục tiêu

Sau bài này, bạn có thể:

- Nhận diện bài toán có khả năng dùng greedy thay vì backtracking hoặc dynamic programming.
- Phát biểu lựa chọn greedy, invariant và chứng minh bằng exchange argument.
- Giải bài interval scheduling bằng chiến lược kết thúc sớm nhất.
- Tạo phản ví dụ khi một quy tắc greedy không đúng.

## Nhận diện bài toán

Greedy xây lời giải từng bước và không quay lại quyết định cũ. Nó là ứng viên tốt khi:

- Có thể mô tả một lựa chọn cục bộ rõ ràng: nhẹ nhất, kết thúc sớm nhất, lợi ích lớn nhất…
- Sau lựa chọn đó, phần còn lại có cùng cấu trúc với bài toán ban đầu.
- Có **greedy-choice property**: tồn tại một lời giải tối ưu bắt đầu bằng lựa chọn greedy.
- Có thể chứng minh bằng exchange argument, cut property hoặc invariant.

Không chọn greedy chỉ vì “lấy phần tử tốt nhất trước có vẻ hợp lý”. Nếu không chứng minh được, hãy tìm phản ví dụ nhỏ và cân nhắc DP.

## Bài mẫu: chọn nhiều khoảng không giao nhau nhất

Cho các khoảng thời gian dạng nửa mở `[start, end)` trên một tài nguyên. Hai khoảng chạm nhau, chẳng hạn `[1,3)` và `[3,5)`, là tương thích. Mục tiêu là chọn **nhiều khoảng nhất**, mọi khoảng có giá trị như nhau.

Quy tắc đúng: luôn chọn khoảng chưa xung đột có thời điểm kết thúc sớm nhất.

Các quy tắc “bắt đầu sớm nhất”, “ngắn nhất” hoặc “có ít xung đột nhất” không đúng trong mọi trường hợp.

## Invariant và chứng minh

Sau mỗi bước:

- Các khoảng đã chọn không giao nhau.
- Trong số mọi lịch chọn cùng số khoảng đã xử lý, lịch greedy để lại thời điểm kết thúc không muộn hơn; vì vậy nó giữ lại nhiều không gian nhất cho phần còn lại.

**Exchange argument:**

1. Gọi `g` là khoảng kết thúc sớm nhất, `o` là khoảng đầu tiên của một lời giải tối ưu bất kỳ.
2. Vì `end(g) ≤ end(o)`, thay `o` bằng `g` không làm bất kỳ khoảng còn lại nào mất tính tương thích.
3. Do đó tồn tại một lời giải tối ưu bắt đầu bằng `g`.
4. Lặp lại lập luận trên các khoảng bắt đầu sau `end(g)`.

Đây là phần quan trọng trong phỏng vấn: code ngắn không thay thế cho chứng minh lựa chọn greedy.

## Các bước

1. Xác nhận mục tiêu là tối đa **số lượng**, không phải tổng giá trị.
2. Sắp xếp khoảng tăng dần theo `End`.
3. Duyệt theo thứ tự đó.
4. Nếu `Start >= lastEnd`, chọn khoảng và cập nhật `lastEnd`.
5. Trả về danh sách được chọn.

## Dry run

Với `A[1,4), B[3,5), C[0,6), D[5,7), E[3,9), F[8,9)`:

| Khoảng theo `End` | Quyết định | `lastEnd` |
|---|---|---:|
| `A[1,4)` | Chọn | 4 |
| `B[3,5)` | Bỏ vì `3 < 4` | 4 |
| `C[0,6)` | Bỏ | 4 |
| `D[5,7)` | Chọn | 7 |
| `E[3,9)` | Bỏ | 7 |
| `F[8,9)` | Chọn | 9 |

Kết quả `A, D, F` có 3 khoảng.

## C# 12 sample độc lập

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

public readonly record struct Interval(
    int Start,
    int End,
    string Name);

public static class IntervalScheduling
{
    public static IReadOnlyList<Interval> SelectMaximumCount(
        IReadOnlyList<Interval> intervals)
    {
        ArgumentNullException.ThrowIfNull(intervals);

        foreach (Interval interval in intervals)
        {
            if (interval.Start >= interval.End)
            {
                throw new ArgumentException(
                    "Mỗi khoảng phải thỏa Start < End.");
            }
        }

        var selected = new List<Interval>();
        int lastEnd = int.MinValue;

        foreach (Interval interval in intervals
                     .OrderBy(interval => interval.End)
                     .ThenBy(interval => interval.Start))
        {
            if (interval.Start < lastEnd)
            {
                continue;
            }

            selected.Add(interval);
            lastEnd = interval.End;
        }

        return selected;
    }
}

public static class Program
{
    public static void Main()
    {
        Interval[] intervals =
        [
            new(1, 4, "A"),
            new(3, 5, "B"),
            new(0, 6, "C"),
            new(5, 7, "D"),
            new(3, 9, "E"),
            new(8, 9, "F")
        ];

        IReadOnlyList<Interval> selected =
            IntervalScheduling.SelectMaximumCount(intervals);

        Console.WriteLine($"Số khoảng: {selected.Count}");
        foreach (Interval interval in selected)
        {
            Console.WriteLine(
                $"{interval.Name}: [{interval.Start}, {interval.End})");
        }
    }
}
```

Kết quả:

```text
Số khoảng: 3
A: [1, 4)
D: [5, 7)
F: [8, 9)
```

## Độ phức tạp

- Sắp xếp: `O(n log n)`.
- Duyệt: `O(n)`.
- Tổng: `O(n log n)` thời gian.
- Bộ nhớ phụ của cách viết trên: `O(n)` cho bản sắp xếp và kết quả. Nếu được phép sort input tại chỗ thì phần sắp xếp có thể dùng ít bộ nhớ phụ hơn tùy implementation.

## Khi greedy không đủ

- **Weighted interval scheduling:** mỗi khoảng có lợi ích khác nhau; chọn kết thúc sớm nhất có thể bỏ lỡ tổng lợi ích lớn hơn. Bài này thường dùng DP.
- **Coin change với bộ xu tùy ý:** chọn xu lớn nhất trước sai với bộ `{1,3,4}` và số tiền `6`; greedy cho `4+1+1`, tối ưu là `3+3`.
- **0/1 knapsack:** chọn tỷ lệ value/weight lớn nhất chỉ đúng cho fractional knapsack, không đúng tổng quát khi không được chia món.
- **Nhiều ràng buộc phụ:** capacity, dependency hoặc fairness có thể phá vỡ greedy-choice property.

## Giới hạn thuật toán

- Không tồn tại một “thuật toán greedy chung”; mỗi bài cần quy tắc và chứng minh riêng.
- Tie-breaking có thể ảnh hưởng lời giải cụ thể dù không ảnh hưởng số lượng tối ưu trong bài mẫu.
- Sample dùng khoảng `[start, end)` và yêu cầu thời lượng dương. Nếu đề dùng khoảng đóng, điều kiện tương thích phải đổi.
- Nếu cần duy trì lịch online khi khoảng đến liên tục, việc sort toàn bộ trước không còn áp dụng trực tiếp.
- Chứng minh của interval scheduling chỉ tối ưu **số khoảng**, không tối ưu thời gian sử dụng hoặc tổng giá trị.

## Ứng dụng thực tế

- Chọn số lượng phiên sử dụng tối đa cho một phòng hoặc một thiết bị duy nhất khi mọi phiên có cùng mức ưu tiên.
- Lập lịch tác vụ không preemptive trong mô hình đơn giản.
- Các thuật toán greedy khác xuất hiện trong nén Huffman, MST, routing và phân bổ tài nguyên, nhưng mỗi ứng dụng có invariant riêng.

Hệ thống lịch thật thường có mức ưu tiên, nhiều tài nguyên và thay đổi online; khi đó cần mô hình mạnh hơn interval scheduling cơ bản.

## Lỗi thường gặp

- Viết quy tắc greedy nhưng không chứng minh hoặc không thử phản ví dụ.
- Sort theo thời điểm bắt đầu thay vì kết thúc.
- Nhầm “maximum non-overlapping intervals” với “minimum meeting rooms”.
- Không thống nhất khoảng đóng hay nửa mở, dẫn đến sai điều kiện `>`/`>=`.
- Dùng greedy ratio cho 0/1 knapsack.
- Cho rằng local optimum luôn dẫn tới global optimum.
- Bỏ chi phí sort và báo `O(n)`.

## Câu hỏi luyện tập

1. Tạo phản ví dụ cho chiến lược chọn khoảng ngắn nhất trước.
2. Viết phiên bản trả về số khoảng tối thiểu cần xóa để phần còn lại không giao nhau.
3. Vì sao fractional knapsack dùng greedy được còn 0/1 knapsack thì không?
4. Giải thích greedy invariant của Jump Game.
5. Chứng minh quy tắc chọn cạnh của Kruskal bằng cut property.
6. Chuyển bài mẫu thành weighted interval scheduling và xác định state DP.

## Checklist phỏng vấn

- [ ] Tôi phát biểu chính xác lựa chọn greedy.
- [ ] Tôi có exchange argument hoặc invariant, không chỉ dựa vào trực giác.
- [ ] Tôi xác nhận mục tiêu tối đa số lượng hay tổng giá trị.
- [ ] Tôi thử ít nhất một phản ví dụ cho quy tắc thay thế.
- [ ] Tôi thống nhất semantics của interval.
- [ ] Tôi báo cả chi phí sort.
- [ ] Tôi biết khi nào phải chuyển sang DP.

Greedy là chủ đề dễ tạo code ngắn nhưng phần đánh giá thường nằm ở lập luận. Thành thạo bài này không đảm bảo tuyệt đối kết quả phỏng vấn.

