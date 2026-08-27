# 25. Dynamic Programming 1D

## Mục tiêu

Sau bài này, bạn có thể:

- Nhận diện overlapping subproblems và optimal substructure.
- Thiết kế state, transition, base case và thứ tự tính.
- Chuyển từ recursion + memoization sang tabulation và tối ưu bộ nhớ.
- Giải thích invariant của DP thay vì chỉ ghi nhớ công thức.

## Nhận diện bài toán

DP thường phù hợp khi:

- Bài toán yêu cầu số cách, chi phí nhỏ nhất/lớn nhất hoặc có tồn tại lời giải.
- Quyết định tại vị trí `i` phụ thuộc vào một số trạng thái trước đó.
- Nhiều nhánh đệ quy lặp lại cùng một bài toán con.
- Lời giải tối ưu toàn cục có thể ghép từ lời giải tối ưu của bài toán con.

Dấu hiệu câu chữ: “tối đa/tối thiểu”, “bao nhiêu cách”, “không được chọn hai phần tử kề nhau”, “đến vị trí `i`”, hoặc constraint khiến brute force `2ⁿ` không thể chạy.

DP không bắt đầu từ việc tạo một mảng `dp`. Hãy định nghĩa state bằng một câu hoàn chỉnh trước.

## Bài mẫu: tổng lớn nhất của các phần tử không kề nhau

Cho mảng giá trị không âm. Có thể chọn hoặc bỏ mỗi phần tử nhưng không được chọn hai vị trí kề nhau. Được phép không chọn phần tử nào.

### State

`dp[i]` là tổng lớn nhất có thể đạt khi chỉ xét các vị trí từ `0` đến `i`.

### Transition

Tại `i` có hai lựa chọn:

- Bỏ `i`: nhận `dp[i - 1]`.
- Chọn `i`: nhận `dp[i - 2] + values[i]`.

Vì vậy:

`dp[i] = max(dp[i - 1], dp[i - 2] + values[i])`.

Base case thuận tiện là coi `dp[-1] = dp[-2] = 0`. Vì transition chỉ dùng hai state trước, có thể nén bộ nhớ thành hai biến.

## Invariant

Trước khi xử lý `values[i]`:

- `oneBack` là đáp án tối ưu cho prefix kết thúc tại `i - 1`.
- `twoBack` là đáp án tối ưu cho prefix kết thúc tại `i - 2`.

Sau khi lấy max giữa “bỏ” và “chọn”, `current` là tối ưu cho prefix kết thúc tại `i`. Hai trường hợp bao phủ mọi lời giải hợp lệ và không giao nhau, nên transition đúng.

## Quy trình thiết kế DP

1. Viết state bằng lời và ghi rõ state chứa đủ thông tin gì.
2. Liệt kê lựa chọn cuối cùng.
3. Viết transition từ các lựa chọn đó.
4. Xác định base case.
5. Chọn thứ tự tính sao cho dependency đã có.
6. Tính time/space theo số state × chi phí mỗi transition.
7. Chỉ nén bộ nhớ sau khi lời giải đầy đủ đã đúng.
8. Nếu cần dựng lại lựa chọn, giữ bảng hoặc parent thay vì nén quá sớm.

## Dry run

Với `[2, 7, 9, 3, 1]`:

| Giá trị đang xét | `twoBack` | `oneBack` | Chọn | Bỏ | `current` |
|---:|---:|---:|---:|---:|---:|
| 2 | 0 | 0 | 2 | 0 | 2 |
| 7 | 0 | 2 | 7 | 2 | 7 |
| 9 | 2 | 7 | 11 | 7 | 11 |
| 3 | 7 | 11 | 10 | 11 | 11 |
| 1 | 11 | 11 | 12 | 11 | 12 |

Đáp án là `12`, tương ứng chọn `2 + 9 + 1`.

## C# 12 sample độc lập

```csharp
using System;
using System.Collections.Generic;

public static class OneDimensionalDp
{
    public static long MaxNonAdjacentSum(
        IReadOnlyList<long> values)
    {
        ArgumentNullException.ThrowIfNull(values);

        long twoBack = 0;
        long oneBack = 0;

        foreach (long value in values)
        {
            if (value < 0)
            {
                throw new ArgumentException(
                    "Sample này yêu cầu giá trị không âm.");
            }

            long take = checked(twoBack + value);
            long skip = oneBack;
            long current = Math.Max(take, skip);

            twoBack = oneBack;
            oneBack = current;
        }

        return oneBack;
    }
}

public static class Program
{
    public static void Main()
    {
        long[] values = [2, 7, 9, 3, 1];

        Console.WriteLine(
            OneDimensionalDp.MaxNonAdjacentSum(values)); // 12
        Console.WriteLine(
            OneDimensionalDp.MaxNonAdjacentSum([]));     // 0
        Console.WriteLine(
            OneDimensionalDp.MaxNonAdjacentSum([5]));    // 5
    }
}
```

## Độ phức tạp

- Số state: `n`.
- Mỗi state có hai transition `O(1)`.
- Thời gian: `O(n)`.
- Bộ nhớ phụ: `O(1)` với hai biến.
- Nếu lưu bảng để reconstruct các vị trí đã chọn: thường `O(n)` bộ nhớ.

## Memoization, tabulation và nén state

| Cách | Ưu điểm | Hạn chế |
|---|---|---|
| Top-down + memo | Gần với recurrence, chỉ tính state cần | Recursion stack, overhead lời gọi |
| Bottom-up table | Thứ tự rõ, dễ reconstruct | Dùng `O(n)` bộ nhớ |
| Bottom-up nén | `O(1)` bộ nhớ | Khó reconstruct, dễ cập nhật sai biến |

Trong C#, recursion sâu có thể gây `StackOverflowException` và không thể xử lý an toàn bằng `try/catch` thông thường. Với state tuyến tính lớn, tabulation thường an toàn hơn.

## Giới hạn và biến thể

- Sample định nghĩa đầu vào không âm và cho phép chọn rỗng. Nếu đề bắt buộc chọn ít nhất một phần tử hoặc cho số âm, base case phải đổi.
- Nếu vị trí đầu và cuối được coi là kề nhau, đây là biến thể vòng tròn: giải hai đoạn `[0..n-2]` và `[1..n-1]`.
- Nếu không được chọn các phần tử cách nhau dưới `k` vị trí, transition phải lùi `k`.
- Nếu cần chính danh sách được chọn, hai biến là không đủ; cần lưu quyết định hoặc chạy reconstruct phù hợp.
- DP không tự động là cách tốt nhất. Một số bài có greedy hoặc công thức toán học nhanh hơn.
- `checked` phát hiện tổng vượt `long`; hệ thống thật cần miền dữ liệu rõ ràng.

## Ứng dụng thực tế

- Chọn các đợt bảo trì/lợi ích trên timeline khi hai slot liền nhau xung đột.
- Chọn vị trí đặt quảng cáo hoặc cảm biến với khoảng nghỉ tối thiểu trong mô hình đơn giản.
- Tối ưu quyết định tuần tự hữu hạn trong budgeting và planning.

Ứng dụng thật có thể thêm dependency, nhiều tài nguyên hoặc xác suất; recurrence lúc đó phải mô hình hóa đủ trạng thái.

## Lỗi thường gặp

- Không định nghĩa `dp[i]` là gì nhưng bắt đầu viết công thức.
- Dùng kết quả greedy “chọn giá trị lớn nhất trước”.
- Sai base case cho mảng rỗng hoặc một phần tử.
- Cập nhật `twoBack` trước khi dùng nó để tính `take`.
- Nén bộ nhớ rồi không thể reconstruct dù đề yêu cầu danh sách.
- Quên làm rõ có được chọn rỗng hay không khi có số âm.
- Tuyên bố `O(1)` space cho phiên bản recursion mà bỏ qua call stack.
- Dùng `int` cho tổng có thể vượt giới hạn.

## Câu hỏi luyện tập

1. Viết bản memoization và bản table `O(n)` bộ nhớ cho bài mẫu.
2. Mở rộng code để trả về các index đã chọn.
3. Giải House Robber II khi đầu và cuối kề nhau.
4. Thiết kế state cho Min Cost Climbing Stairs.
5. Với Decode Ways, vì sao chỉ nhìn một ký tự trước là chưa đủ?
6. Tạo một bài mà DP 1D dùng rolling window dài hơn hai state.

## Checklist phỏng vấn

- [ ] Tôi định nghĩa state bằng một câu không mơ hồ.
- [ ] Tôi suy ra transition từ các lựa chọn cuối cùng.
- [ ] Tôi nêu base case và semantics của input rỗng.
- [ ] Tôi giải thích invariant của biến rolling.
- [ ] Tôi báo số state × số transition.
- [ ] Tôi không quên recursion stack hoặc yêu cầu reconstruct.
- [ ] Tôi test rỗng, một phần tử, hai phần tử, toàn số 0 và giá trị lớn.

DP cần luyện khả năng mô hình hóa, không chỉ thuộc recurrence. Bài học này giúp chuẩn bị nhưng không bảo đảm tuyệt đối điểm số hay kết quả phỏng vấn.

