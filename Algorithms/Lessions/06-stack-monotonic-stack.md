# 06. Stack và Monotonic Stack

## Mục tiêu

- Dùng stack cho dữ liệu có tính LIFO, matching và xử lý trạng thái lồng nhau.
- Nhận diện bài toán nearest greater/smaller để dùng monotonic stack.
- Hiểu vì sao vòng `while` pop bên trong vẫn có tổng thời gian `O(n)`.
- Chọn lưu value hay index và xử lý duplicate đúng quy ước.

## Trực giác

Stack là Last-In, First-Out: phần tử vào sau được xử lý trước. Nó phù hợp khi một tác vụ mới “lồng” bên trong tác vụ trước, hoặc khi cần quay lại trạng thái gần nhất chưa hoàn tất.

Monotonic stack giữ các phần tử theo một thứ tự đơn điệu:

- stack giảm dần thường giúp tìm **next greater**;
- stack tăng dần thường giúp tìm **next smaller**.

Khi phần tử mới phá thứ tự, ta pop các phần tử mà phần tử mới đã giải quyết được. Mỗi index được push đúng một lần và pop nhiều nhất một lần, nên tổng là `O(n)`.

Trong nhiều bài, stack lưu **index** thay vì value vì index cho phép:

- tính khoảng cách;
- truy cập lại giá trị;
- phân biệt các duplicate;
- xác định biên trái/phải.

## Khi dùng / dấu hiệu nhận diện

### Stack thường

- Dấu ngoặc hợp lệ, biểu thức lồng nhau.
- Undo/redo, backtracking lặp.
- DFS iterative.
- Evaluate expression, parse syntax.
- Canonical path, remove adjacent items.

### Monotonic stack

- “Phần tử lớn/nhỏ hơn gần nhất bên trái/phải”.
- “Bao nhiêu bước/ngày cho đến khi…”
- Histogram rectangle, stock span, trapping rain water.
- Mỗi phần tử cần tìm một boundary đầu tiên thỏa bất đẳng thức.

Nếu chỉ cần max/min của **cửa sổ đang trượt**, monotonic deque thường đúng hơn stack vì cần loại phần tử hết hạn ở đầu.

## Thuật toán từng bước: Daily Temperatures

Với mỗi ngày, tìm số ngày phải chờ đến nhiệt độ cao hơn.

1. Tạo `answer` toàn 0 và stack lưu index các ngày chưa có đáp án.
2. Duyệt `current` từ trái sang phải.
3. Trong khi stack không rỗng và nhiệt độ hiện tại **lớn hơn** nhiệt độ tại index đỉnh:
   - pop `previous`;
   - `answer[previous] = current - previous`.
4. Push `current`.
5. Cuối cùng, các index còn lại không có ngày ấm hơn nên giữ 0.

**Invariant:** nhiệt độ tại các index trong stack là không tăng từ đáy lên đỉnh, và tất cả vẫn đang chờ ngày ấm hơn đầu tiên.

Ta dùng `<` chứ không dùng `<=`, vì nhiệt độ bằng nhau không phải “ấm hơn”.

## Độ phức tạp

- Thời gian `O(n)`: mỗi index push một lần, pop tối đa một lần.
- Bộ nhớ phụ `O(n)` cho stack và `O(n)` output.
- Nếu interviewer tách output space, auxiliary stack vẫn là `O(n)`.

## C# 12 sample hoàn chỉnh

```csharp
using System;
using System.Collections.Generic;

public static class Program
{
    public static int[] DaysUntilWarmer(int[] temperatures)
    {
        int[] answer = new int[temperatures.Length];
        var unresolvedIndices = new Stack<int>();

        for (int current = 0; current < temperatures.Length; current++)
        {
            while (unresolvedIndices.Count > 0 &&
                   temperatures[unresolvedIndices.Peek()] < temperatures[current])
            {
                int previous = unresolvedIndices.Pop();
                answer[previous] = current - previous;
            }

            unresolvedIndices.Push(current);
        }

        return answer;
    }

    public static bool HasValidBrackets(string text)
    {
        var opening = new Stack<char>();

        foreach (char character in text)
        {
            if (character is '(' or '[' or '{')
            {
                opening.Push(character);
                continue;
            }

            if (character is not (')' or ']' or '}'))
            {
                continue;
            }

            if (opening.Count == 0)
            {
                return false;
            }

            char expected = character switch
            {
                ')' => '(',
                ']' => '[',
                '}' => '{',
                _ => throw new InvalidOperationException()
            };

            if (opening.Pop() != expected)
            {
                return false;
            }
        }

        return opening.Count == 0;
    }

    public static void Main()
    {
        int[] temperatures = [73, 74, 75, 71, 69, 72, 76, 73];
        Console.WriteLine(string.Join(", ", DaysUntilWarmer(temperatures)));
        // 1, 1, 4, 2, 1, 1, 0, 0

        Console.WriteLine(HasValidBrackets("function(a[0]) { return a; }")); // True
        Console.WriteLine(HasValidBrackets("([)]")); // False
    }
}
```

## Dry run: Daily Temperatures

Với `[73,74,75,71,69,72,76,73]`, stack dưới đây ghi index (nhiệt độ):

| Ngày hiện tại | Xử lý pop | Stack sau push | Answer vừa điền |
|---:|---|---|---|
| 0 / 73 | Không | `[0(73)]` | — |
| 1 / 74 | Pop 0 | `[1(74)]` | `ans[0]=1` |
| 2 / 75 | Pop 1 | `[2(75)]` | `ans[1]=1` |
| 3 / 71 | Không | `[2(75),3(71)]` | — |
| 4 / 69 | Không | `[2(75),3(71),4(69)]` | — |
| 5 / 72 | Pop 4, 3 | `[2(75),5(72)]` | `ans[4]=1`, `ans[3]=2` |
| 6 / 76 | Pop 5, 2 | `[6(76)]` | `ans[5]=1`, `ans[2]=4` |
| 7 / 73 | Không | `[6(76),7(73)]` | — |

Các index 6 và 7 còn lại nhận 0 vì không có nhiệt độ cao hơn bên phải.

## Chọn bất đẳng thức với duplicate

Đây là chi tiết thường được hỏi:

- Next **strictly greater**: pop khi `stackValue < current`.
- Next greater **or equal**: pop khi `stackValue <= current`.
- Khi tìm biên trái/phải cho histogram hoặc contribution, thường một phía strict và một phía non-strict để không đếm duplicate hai lần.

Không học thuộc dấu; hãy viết chính xác quan hệ đề yêu cầu rồi thử case `[2,2]`.

## Lỗi thường gặp

- Lưu value nhưng sau đó cần khoảng cách/index.
- Gọi `Peek`/`Pop` khi stack rỗng.
- Dùng sai `<` và `<=` với duplicate.
- Pop phần tử nhưng quên ghi đáp án ngay lúc tìm thấy boundary đầu tiên.
- Cho rằng nested `while` làm thuật toán `O(n²)` mà không phân tích amortized.
- Duyệt sai hướng: next greater right thường duyệt trái→phải để resolve, hoặc phải→trái để query; invariant phải tương ứng.
- Dùng `Stack<T>` để giải sliding maximum nhưng không thể xóa index hết hạn ở đáy.
- Trong valid parentheses, chỉ đếm số lượng mà không kiểm tra đúng loại/thứ tự ngoặc.

## Ứng dụng thực tế

- Parser/validator cho biểu thức và cấu trúc lồng nhau.
- Call stack, undo history và DFS iterative.
- Tính boundary gần nhất trong histogram/biểu đồ tài chính.
- Phân tích span: khoảng thời gian cho tới/ngược về event vượt ngưỡng.
- Loại bỏ phần tử bị “dominate” trong một pass để xử lý dữ liệu tuyến tính.

Monotonic stack thường xuất hiện như một tối ưu batch offline. Nếu dữ liệu streaming và cần cửa sổ thời gian hết hạn, deque hoặc cấu trúc ordered có thể thích hợp hơn.

## Câu hỏi phỏng vấn tự luyện

1. Valid Parentheses và Minimum Remove to Make Valid Parentheses.
2. Next Greater Element I/II; xử lý circular array thế nào?
3. Online Stock Span.
4. Largest Rectangle in Histogram; vì sao cần sentinel?
5. Trapping Rain Water bằng monotonic stack và bằng two pointers.
6. Remove K Digits để tạo số nhỏ nhất.
7. Sum of Subarray Minimums; xử lý duplicate ra sao?
8. Asteroid Collision dùng stack theo invariant nào?

## Checklist

- [ ] Tôi nhận ra LIFO/matching và nearest greater/smaller.
- [ ] Tôi xác định stack tăng hay giảm và theo hướng nào.
- [ ] Tôi biết vì sao nên lưu index.
- [ ] Tôi phát biểu invariant của các phần tử còn trong stack.
- [ ] Tôi chọn đúng strict/non-strict và thử duplicate.
- [ ] Tôi chứng minh amortized `O(n)` bằng số lần push/pop.
- [ ] Tôi xử lý stack rỗng và phần tử không bao giờ có đáp án.
- [ ] Tôi code được Daily Temperatures trong khoảng 15 phút.

