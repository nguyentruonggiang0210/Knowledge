# 03. Sliding Window

## Mục tiêu

- Nhận diện bài toán trên **đoạn liên tiếp** có thể dùng cửa sổ trượt.
- Phân biệt cửa sổ cố định và cửa sổ co giãn.
- Xây dựng invariant, điều kiện mở rộng/co cửa sổ và cách cập nhật đáp án.
- Tránh lời giải kiểm tra mọi đoạn con `O(n²)` hoặc `O(n³)`.

## Trực giác

Các cửa sổ liên tiếp thường chồng lấn rất nhiều. Thay vì tính lại toàn bộ khi chuyển từ `[left..right]` sang cửa sổ kế tiếp, ta:

- thêm ảnh hưởng của phần tử mới ở `right`;
- loại ảnh hưởng của phần tử rời đi ở `left`;
- duy trì một trạng thái đủ nhỏ như tổng, tần suất, số phần tử khác nhau hoặc deque đơn điệu.

Vì `left` và `right` thường chỉ đi sang phải, tổng số lần dịch chuyển là `O(n)`, dù có một vòng `while` nằm trong vòng `for`.

Hai biến thể:

- **Fixed-size window**: độ dài `k` không đổi; ví dụ tổng lớn nhất của `k` phần tử liên tiếp.
- **Variable-size window**: mở rộng `right`, rồi co `left` đến khi cửa sổ hợp lệ; ví dụ chuỗi con dài nhất không lặp ký tự.

## Khi dùng / dấu hiệu nhận diện

- Đề nói `subarray` hoặc `substring`: phần tử phải liên tiếp.
- Cần max/min/đếm trên mọi đoạn có độ dài `k`.
- Cần đoạn ngắn nhất/dài nhất thỏa một điều kiện có thể cập nhật tăng dần.
- Trạng thái cửa sổ có thể thêm/xóa một phần tử hiệu quả.
- Có tính đơn điệu cho phép co cửa sổ: khi mở rộng làm vi phạm, bỏ dần bên trái có thể phục hồi.

Không nhầm `subarray` với `subsequence`. Sliding window thông thường không giải quyết việc chọn các phần tử rời rạc.

### Khi sliding window không áp dụng trực tiếp

Ví dụ tìm đoạn ngắn nhất có tổng ít nhất `target`: với **toàn số không âm**, tổng tăng khi mở rộng và giảm khi co, nên cửa sổ co giãn hoạt động. Nếu có số âm, tính đơn điệu mất; lúc đó thường cần prefix sum + monotonic deque hoặc kỹ thuật khác.

## Thuật toán từng bước: chuỗi con dài nhất không lặp

Ta lưu index xuất hiện gần nhất của mỗi ký tự.

1. `left = 0`, `best = 0`.
2. Duyệt `right` từ trái sang phải.
3. Nếu ký tự hiện tại từng xuất hiện tại `previous` và `previous >= left`, nhảy `left` đến `previous + 1`.
4. Ghi đè vị trí gần nhất của ký tự bằng `right`.
5. Cửa sổ `[left..right]` lúc này không lặp; cập nhật `best` bằng độ dài `right - left + 1`.

**Invariant:** sau bước 3, cửa sổ `[left..right]` không chứa ký tự lặp.

Việc dùng index gần nhất cho phép `left` nhảy thẳng, nhưng bắt buộc dùng `Math.Max(left, previous + 1)` hoặc kiểm tra `previous >= left`; `left` không bao giờ được lùi.

## Độ phức tạp

- Thời gian: `O(n)` trung bình với dictionary; mỗi ký tự được xử lý một lần.
- Bộ nhớ phụ: `O(min(n, a))`, với `a` là số ký tự khác nhau trong alphabet.
- Nếu alphabet cố định nhỏ (ví dụ ASCII), có thể dùng mảng index kích thước cố định để có bộ nhớ `O(1)` theo `n`.

## C# 12 sample hoàn chỉnh

```csharp
using System;
using System.Collections.Generic;

public static class Program
{
    public static int LongestSubstringWithoutRepeating(string text)
    {
        var lastSeen = new Dictionary<char, int>();
        int left = 0;
        int bestLength = 0;

        for (int right = 0; right < text.Length; right++)
        {
            char current = text[right];
            if (lastSeen.TryGetValue(current, out int previousIndex) &&
                previousIndex >= left)
            {
                left = previousIndex + 1;
            }

            lastSeen[current] = right;
            bestLength = Math.Max(bestLength, right - left + 1);
        }

        return bestLength;
    }

    public static long MaxFixedWindowSum(int[] numbers, int windowSize)
    {
        if (windowSize <= 0 || windowSize > numbers.Length)
        {
            throw new ArgumentOutOfRangeException(nameof(windowSize));
        }

        long windowSum = 0;
        for (int i = 0; i < windowSize; i++)
        {
            windowSum += numbers[i];
        }

        long best = windowSum;
        for (int right = windowSize; right < numbers.Length; right++)
        {
            windowSum += numbers[right];
            windowSum -= numbers[right - windowSize];
            best = Math.Max(best, windowSum);
        }

        return best;
    }

    public static int MinLengthAtLeastTarget(int[] positiveNumbers, long target)
    {
        if (target <= 0)
            throw new ArgumentOutOfRangeException(nameof(target), "Target must be positive.");
        int left = 0;
        int best = int.MaxValue;
        long sum = 0;

        for (int right = 0; right < positiveNumbers.Length; right++)
        {
            if (positiveNumbers[right] < 0)
            {
                throw new ArgumentException("Các phần tử phải không âm.");
            }

            sum += positiveNumbers[right];
            while (sum >= target && left <= right)
            {
                best = Math.Min(best, right - left + 1);
                sum -= positiveNumbers[left];
                left++;
            }
        }

        return best == int.MaxValue ? 0 : best;
    }

    public static void Main()
    {
        Console.WriteLine(LongestSubstringWithoutRepeating("abba")); // 2

        int[] values = [2, 1, 5, 1, 3, 2];
        Console.WriteLine(MaxFixedWindowSum(values, 3)); // 9: [5,1,3]

        int[] positive = [2, 3, 1, 2, 4, 3];
        Console.WriteLine(MinLengthAtLeastTarget(positive, 7)); // 2: [4,3]
    }
}
```

## Dry run: `"abba"`

| `right` | Ký tự | `left` trước | Lần trước | `left` sau | Cửa sổ hợp lệ | `best` |
|---:|:---:|---:|---:|---:|---|---:|
| 0 | a | 0 | chưa có | 0 | `a` | 1 |
| 1 | b | 0 | chưa có | 0 | `ab` | 2 |
| 2 | b | 0 | 1 | 2 | `b` | 2 |
| 3 | a | 2 | 0 | 2 | `ba` | 2 |

Ở bước cuối, `a` cũ nằm ngoài cửa sổ hiện tại. Nếu đặt thẳng `left = previous + 1 = 1`, cửa sổ sẽ lùi và chứa hai `b`; vì vậy phải giữ `left` không giảm.

## Lỗi thường gặp

- Áp dụng cửa sổ tổng co giãn khi có số âm mà không chứng minh tính đơn điệu.
- Cập nhật đáp án trước khi cửa sổ trở lại hợp lệ, hoặc co quá một bước rồi mới cập nhật.
- Tính độ dài nhầm thành `right - left` thay vì `right - left + 1` cho khoảng inclusive.
- Quên loại phần tử rời cửa sổ khỏi frequency map, hoặc giữ key có count 0 làm sai số distinct.
- Để `left` lùi khi gặp ký tự đã xuất hiện nhưng nằm ngoài cửa sổ.
- Dùng `int` cho tổng của nhiều số lớn và bị overflow.
- Thấy vòng `while` trong `for` rồi kết luận `O(n²)`; cần đếm tổng số lần `left` tăng.
- Không quy định `k = 0`, `k > n`, chuỗi rỗng hay target không đạt được.

## Ứng dụng thực tế

- Tính moving average, moving maximum cho metric/telemetry.
- Rate limiting theo cửa sổ thời gian và phát hiện burst traffic.
- Phân tích log trong `N` phút gần nhất.
- Phát hiện chuỗi hành vi bất thường hoặc duplicate gần nhau.
- Streaming analytics: duy trì thống kê mà không đọc lại toàn bộ lịch sử.
- Xử lý tín hiệu, ảnh và dữ liệu time-series theo khung liên tiếp.

Trong hệ thống phân tán, “sliding time window” còn phải xử lý event time, dữ liệu đến trễ và đồng hồ lệch; kỹ thuật thuật toán là nền tảng nhưng chưa giải quyết các vấn đề đó.

## Câu hỏi phỏng vấn tự luyện

1. Maximum Average Subarray với cửa sổ cố định `k`.
2. Longest Repeating Character Replacement.
3. Minimum Window Substring; trạng thái nào cho biết cửa sổ đã đủ?
4. Permutation in String bằng frequency array.
5. Fruit Into Baskets: tối đa hai loại trong cửa sổ.
6. Minimum Size Subarray Sum; điều kiện nào về dữ liệu là quan trọng?
7. Vì sao tổng số lần chạy của vòng co vẫn là `O(n)`?
8. Khi nào phải kết hợp sliding window với monotonic deque?

## Checklist

- [ ] Tôi xác nhận bài toán yêu cầu đoạn **liên tiếp**.
- [ ] Tôi phân biệt fixed window và variable window.
- [ ] Tôi mô tả được trạng thái thêm/xóa khi biên dịch chuyển.
- [ ] Tôi phát biểu invariant của cửa sổ hợp lệ.
- [ ] Tôi biết cập nhật đáp án trước hay sau khi co và giải thích được.
- [ ] Tôi xử lý đúng empty input, `k`, duplicate và overflow.
- [ ] Tôi kiểm tra tính đơn điệu trước khi dùng cửa sổ với tổng.
- [ ] Tôi có thể giải thích vì sao hai con trỏ tổng cộng chỉ đi `O(n)` bước.
