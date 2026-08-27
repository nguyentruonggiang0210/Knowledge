# 27. 0/1 Knapsack và Subset Sum

## Mục tiêu

Sau bài này, bạn có thể:

- Nhận diện họ bài “mỗi phần tử chọn tối đa một lần”.
- Xây state theo prefix và capacity/tổng đích.
- Giải thích vì sao 0/1 knapsack phải cập nhật capacity giảm dần khi nén bộ nhớ.
- Phân biệt 0/1, unbounded, bounded knapsack và giới hạn pseudo-polynomial.

## Nhận diện bài toán

Các tín hiệu phổ biến:

- Mỗi món có weight/cost và value/profit.
- Có giới hạn capacity/budget và cần tối đa tổng value.
- Cần biết có subset đạt đúng một tổng hay không.
- Mỗi phần tử được dùng một lần, không phụ thuộc thứ tự.

### Các biến thể

| Biến thể | Số lần dùng một món | Hướng cập nhật khi dùng DP 1D |
|---|---:|---|
| 0/1 knapsack | Tối đa 1 | Capacity giảm dần |
| Unbounded knapsack | Không giới hạn | Capacity tăng dần |
| Bounded knapsack | Có giới hạn cụ thể | Binary splitting hoặc kỹ thuật khác |
| Subset sum | Tối đa 1, chỉ cần reachable | Tổng giảm dần |

## State và transition

Với bảng 2D:

`dp[i, c]` là value lớn nhất dùng các món `0..i-1` với tổng weight không vượt `c`.

- Bỏ món `i`: `dp[i, c]`.
- Chọn món `i` nếu `weight[i] ≤ c`: `dp[i, c - weight[i]] + value[i]`.

Khi nén còn `dp[c]`, phải duyệt `c` từ capacity xuống weight. Như vậy `dp[c - weight]` vẫn thuộc “hàng trước”, nên món hiện tại chưa bị dùng lại.

## Invariant của vòng lặp giảm dần

Trước khi xử lý món `i`, mọi `dp[c]` là đáp án tối ưu chỉ dùng các món trước `i`.

Trong lúc duyệt giảm:

- `dp[c - weight[i]]` chưa được cập nhật bởi món `i`.
- Transition “chọn” vì vậy dùng món `i` đúng một lần.
- Sau khi hoàn tất, mọi `dp[c]` là tối ưu dùng các món đến `i`.

Nếu duyệt tăng dần, state nhỏ đã chứa món hiện tại và có thể được dùng lại; thuật toán vô tình biến thành unbounded knapsack.

## Dry run 0/1 knapsack

Các món `(weight,value) = (2,4), (3,5), (4,7)`, capacity `5`:

| Sau khi xử lý | `dp[0..5]` |
|---|---|
| Chưa có món | `[0,0,0,0,0,0]` |
| `(2,4)` | `[0,0,4,4,4,4]` |
| `(3,5)` | `[0,0,4,5,5,9]` |
| `(4,7)` | `[0,0,4,5,7,9]` |

Đáp án `9` đến từ hai món có weight `2 + 3 = 5`.

## C# 12 sample độc lập

Sample gồm cả tối đa value cho 0/1 knapsack và kiểm tra subset sum với số không âm.

```csharp
using System;
using System.Collections.Generic;

public static class KnapsackAlgorithms
{
    public static long MaxValue(
        int capacity,
        IReadOnlyList<int> weights,
        IReadOnlyList<long> values)
    {
        if (capacity < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(capacity));
        }

        ArgumentNullException.ThrowIfNull(weights);
        ArgumentNullException.ThrowIfNull(values);
        if (weights.Count != values.Count)
        {
            throw new ArgumentException(
                "weights và values phải cùng số phần tử.");
        }

        var dp = new long[capacity + 1];

        for (int item = 0; item < weights.Count; item++)
        {
            int weight = weights[item];
            long value = values[item];
            if (weight <= 0)
            {
                throw new ArgumentException("Weight phải dương.");
            }

            if (value < 0)
            {
                throw new ArgumentException(
                    "Sample này yêu cầu value không âm.");
            }

            for (int current = capacity;
                 current >= weight;
                 current--)
            {
                long take = checked(
                    dp[current - weight] + value);
                dp[current] = Math.Max(dp[current], take);
            }
        }

        return dp[capacity];
    }

    public static bool CanReachExactSum(
        IReadOnlyList<int> numbers,
        int target)
    {
        if (target < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(target));
        }

        ArgumentNullException.ThrowIfNull(numbers);
        var reachable = new bool[target + 1];
        reachable[0] = true;

        foreach (int number in numbers)
        {
            if (number < 0)
            {
                throw new ArgumentException(
                    "Subset-sum sample chỉ hỗ trợ số không âm.");
            }

            for (int sum = target; sum >= number; sum--)
            {
                reachable[sum] =
                    reachable[sum] || reachable[sum - number];
            }
        }

        return reachable[target];
    }
}

public static class Program
{
    public static void Main()
    {
        int[] weights = [2, 3, 4];
        long[] values = [4, 5, 7];

        Console.WriteLine(
            KnapsackAlgorithms.MaxValue(5, weights, values)); // 9

        Console.WriteLine(
            KnapsackAlgorithms.CanReachExactSum(
                [3, 1, 5, 9, 12],
                10)); // True: 1 + 9
    }
}
```

## Độ phức tạp

Với `n` món và capacity/target `C`:

- Thời gian: `O(nC)`.
- Bộ nhớ phụ: `O(C)`.

Đây là **pseudo-polynomial**, không phải polynomial theo số bit của `C`. Nếu capacity là `10⁹`, thuật toán không khả thi dù `n` nhỏ.

## Giới hạn và hướng thay thế

- Sample subset sum chỉ hỗ trợ số không âm. Có số âm cần offset, hash set state hoặc cách khác tùy miền tổng.
- Capacity lớn nhưng `n ≈ 40` có thể phù hợp với meet-in-the-middle `O(2^(n/2))`.
- Nếu tổng value nhỏ hơn tổng weight rất nhiều, có thể đảo state: minimum weight để đạt một value.
- Nếu chỉ cần subset sum và ngôn ngữ hỗ trợ bitset hiệu quả, bitset có thể giảm hằng số đáng kể.
- Muốn reconstruct các món đã chọn thường cần bảng/parent bổ sung hoặc kỹ thuật tái dựng.
- Value/weight ratio greedy chỉ đúng cho fractional knapsack, không đúng cho 0/1.
- Code coi capacity là “không vượt quá”, không yêu cầu dùng đầy capacity.

## Ứng dụng thực tế

- Chọn tập feature/project dưới một ngân sách nguyên rời rạc.
- Đóng gói hàng trong mô hình một capacity và một tiêu chí value đơn giản.
- Kiểm tra một tập giao dịch có thể ghép thành đúng một tổng trong dữ liệu nhỏ.
- Phân bổ tài nguyên batch khi mỗi lựa chọn chỉ được dùng một lần.

Hệ thống thật thường có nhiều constraint, capacity lớn hoặc mục tiêu đa chiều; knapsack một chiều khi đó chỉ là mô hình khởi đầu.

## Lỗi thường gặp

- Duyệt capacity tăng dần trong 0/1 knapsack và vô tình dùng một món nhiều lần.
- Nhầm `dp[c]` là “đúng bằng `c`” với “không vượt `c`”.
- Khởi tạo mọi exact-state là reachable/0, tạo lời giải giả.
- Dùng greedy theo value hoặc ratio mà không chứng minh.
- Báo `O(nC)` là polynomial mà bỏ qua tính pseudo-polynomial.
- Không kiểm soát tràn tổng value.
- Không làm rõ mỗi món được chọn bao nhiêu lần.
- Nén state rồi vẫn cố reconstruct mà không lưu đủ thông tin.

## Câu hỏi luyện tập

1. Giải Partition Equal Subset Sum bằng hàm subset sum.
2. Đổi vòng lặp để giải unbounded coin change và giải thích vì sao phải duyệt tăng.
3. Trả về danh sách index của các món trong một lời giải tối ưu.
4. Thiết kế meet-in-the-middle cho subset sum khi `n ≤ 40` nhưng target rất lớn.
5. Giải Target Sum và nêu điều kiện để biến đổi thành subset sum.
6. Với hai capacity weight/volume, state và độ phức tạp thay đổi thế nào?

## Checklist phỏng vấn

- [ ] Tôi hỏi rõ 0/1, unbounded hay bounded.
- [ ] Tôi định nghĩa `dp[c]` là at-most hay exact.
- [ ] Tôi giải thích hướng duyệt bằng invariant, không học thuộc máy móc.
- [ ] Tôi nhận ra `O(nC)` là pseudo-polynomial.
- [ ] Tôi cân nhắc capacity, tổng value và `n` để chọn dimension/thuật toán.
- [ ] Tôi làm rõ có số âm, zero-weight hoặc value âm không.
- [ ] Tôi test capacity 0, không có món, món quá nặng và nhiều món cùng weight.

Nắm vững knapsack giúp xử lý nhiều bài DP, nhưng không thể đảm bảo tuyệt đối thành công ở mọi cuộc phỏng vấn.

