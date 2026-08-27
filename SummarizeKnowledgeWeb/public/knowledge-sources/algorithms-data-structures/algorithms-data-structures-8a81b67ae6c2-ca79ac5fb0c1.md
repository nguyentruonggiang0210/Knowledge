# 29. Kadane và Maximum Subarray

## Mục tiêu

- Tìm tổng lớn nhất của một subarray liên tiếp trong `O(n)`.
- Giữ được cả biên trái/phải, kể cả khi toàn số âm.
- Nhận ra Kadane là DP 1D được tối ưu còn `O(1)` state.

## State và recurrence

`bestEndingHere[i]` là tổng lớn nhất của subarray **bắt buộc kết thúc tại i**:

`bestEndingHere[i] = max(a[i], bestEndingHere[i-1] + a[i])`.

Tại mỗi vị trí, hoặc bắt đầu đoạn mới, hoặc nối vào đoạn tốt nhất kết thúc ngay trước đó. Global best là max của mọi state.

## C# 12 sample

```csharp
using System;

public static class KadaneAlgorithm
{
    public readonly record struct Result(long Sum, int Left, int Right);

    public static Result MaximumSubarray(int[] values)
    {
        ArgumentNullException.ThrowIfNull(values);
        if (values.Length == 0) throw new ArgumentException("Array must not be empty.");

        long current = values[0], best = values[0];
        int candidateLeft = 0, bestLeft = 0, bestRight = 0;

        for (int right = 1; right < values.Length; right++)
        {
            if (current + values[right] < values[right])
            {
                current = values[right];
                candidateLeft = right;
            }
            else
            {
                current += values[right];
            }

            if (current > best)
            {
                best = current;
                bestLeft = candidateLeft;
                bestRight = right;
            }
        }
        return new Result(best, bestLeft, bestRight);
    }
}
```

## Dry run

`[-2,1,-3,4,-1,2,1,-5,4]`: tại `4` ta bắt đầu lại; sau đó tích lũy `4,-1,2,1` thành `6`. Kết quả `(6,3,6)`. Khởi tạo từ phần tử đầu giúp `[-5,-2,-7]` trả `-2`, không trả sai `0`.

## Độ phức tạp

`O(n)` time, `O(1)` auxiliary space. Dùng `long` vì tổng nhiều `int` có thể overflow.

## Biến thể cần biết

- Maximum circular subarray: `max(normalMax, totalSum - minSubarray)`, xử lý riêng all-negative.
- Maximum product subarray: giữ cả max và min ending here vì số âm đảo dấu.
- Maximum submatrix: cố định hai hàng/cột rồi dùng Kadane, thường `O(R²C)`.

## Ứng dụng thực tế

- Tìm giai đoạn tăng trưởng/lợi nhuận ròng tốt nhất từ chuỗi delta.
- Phát hiện burst có score tích lũy cao trong telemetry.
- Tối ưu đoạn liên tục trong signal/time series sau khi chuyển thành contribution.

## Lỗi thường gặp

- Khởi tạo `best=0` khi không cho phép subarray rỗng.
- Không phân biệt contiguous subarray với subsequence.
- Overflow tổng.
- Công thức circular trả 0 sai khi tất cả âm.

## Câu hỏi phỏng vấn

1. Maximum Subarray và trả indices.
2. Maximum Sum Circular Subarray.
3. Maximum Product Subarray.
4. Best Time to Buy/Sell Stock liên hệ thế nào với Kadane trên delta?

## Checklist

- [ ] Nói được ý nghĩa state.
- [ ] Xử lý all-negative.
- [ ] Trả được boundaries.
- [ ] Phân biệt các biến thể sum/product/circular.

