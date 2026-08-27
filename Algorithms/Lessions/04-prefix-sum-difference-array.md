# 04. Prefix Sum và Difference Array

## Mục tiêu

- Trả lời nhiều truy vấn tổng đoạn tĩnh trong `O(1)` sau bước tiền xử lý.
- Dùng difference array để áp dụng nhiều cập nhật theo đoạn trong `O(1)` mỗi cập nhật.
- Làm chủ quy ước index và khoảng inclusive/half-open.
- Mở rộng tư duy sang prefix 2D, prefix count và sweep line.

## Trực giác

### Prefix sum

`prefix[i]` lưu tổng của **`i` phần tử đầu tiên**, không phải tổng đến index `i`. Ta dùng mảng dài `n + 1`:

`prefix[0] = 0` và `prefix[i + 1] = prefix[i] + numbers[i]`.

Tổng đoạn inclusive `[left..right]` là:

`prefix[right + 1] - prefix[left]`.

Hai prefix lớn chứa cùng phần trước `left`; phép trừ triệt tiêu phần đó. Quy ước `n + 1` tạo sentinel giúp không phải xử lý riêng `left = 0`.

### Difference array

Thay vì sửa mọi phần tử trong `[left..right]`, ghi nhận hai “sự kiện”:

- bắt đầu cộng `delta` tại `left`;
- ngừng cộng sau `right`, tức trừ `delta` tại `right + 1` nếu còn trong mảng.

Sau mọi cập nhật, prefix sum của mảng difference cho biết tổng delta tại từng vị trí.

Prefix sum tối ưu **nhiều query, ít/no update**. Difference array tối ưu **nhiều range update offline, rồi materialize một lần**.

## Khi dùng / dấu hiệu nhận diện

- Có nhiều truy vấn tổng/count trên đoạn của dữ liệu không đổi.
- Cần đếm số phần tử thỏa điều kiện trong mọi đoạn: prefix count.
- Cần tính tổng đoạn con nhanh trong bước kiểm tra của thuật toán khác.
- Có hàng loạt thao tác “cộng `x` vào mọi phần tử từ `l` đến `r`” và không cần đọc kết quả xen kẽ.
- Bài toán booking/capacity/độ phủ có điểm bắt đầu-kết thúc.
- Ma trận có nhiều truy vấn tổng hình chữ nhật: prefix sum 2D.

Nếu update và query xen kẽ online, hãy cân nhắc Fenwick Tree hoặc Segment Tree thay vì rebuild prefix.

## Thuật toán từng bước: range sum

1. Tạo `prefix` dài `n + 1`, kiểu `long`.
2. Với mỗi `i`, đặt `prefix[i + 1] = prefix[i] + numbers[i]`.
3. Với query `[left..right]`, kiểm tra `0 <= left <= right < n`.
4. Trả `prefix[right + 1] - prefix[left]`.

Tiền xử lý `O(n)`, mỗi query `O(1)`, bộ nhớ `O(n)`.

## Thuật toán từng bước: range updates offline

1. Tạo `difference` dài `n + 1`, ban đầu bằng 0.
2. Với update inclusive `(left, right, delta)`, cộng tại `difference[left]`.
3. Trừ tại `difference[right + 1]`; nhờ mảng dài `n + 1`, index này luôn hợp lệ.
4. Chạy prefix trên `difference[0..n-1]` để có delta đang hoạt động.
5. Cộng delta đó vào phần tử gốc tương ứng.

`u` cập nhật tốn `O(u)`, khôi phục tốn `O(n)`, tổng `O(n + u)` thay vì `O(nu)`.

## Độ phức tạp

| Kỹ thuật | Xây dựng | Mỗi query/update | Xuất kết quả | Bộ nhớ phụ |
|---|---:|---:|---:|---:|
| Prefix sum | `O(n)` | query `O(1)` | — | `O(n)` |
| Difference array | `O(n)` cấp phát/zero-init trong .NET | update `O(1)` | `O(n)` | `O(n)` |
| Cập nhật từng phần tử | — | update `O(length)` | — | `O(1)` |

## C# 12 sample hoàn chỉnh

```csharp
using System;

public readonly record struct RangeUpdate(int Left, int Right, long Delta);

public sealed class RangeSum
{
    private readonly long[] _prefix;

    public RangeSum(int[] numbers)
    {
        _prefix = new long[numbers.Length + 1];
        for (int i = 0; i < numbers.Length; i++)
        {
            _prefix[i + 1] = _prefix[i] + numbers[i];
        }
    }

    // Cả hai đầu đều inclusive.
    public long Query(int left, int right)
    {
        int length = _prefix.Length - 1;
        if (left < 0 || right < left || right >= length)
        {
            throw new ArgumentOutOfRangeException(nameof(left));
        }

        return _prefix[right + 1] - _prefix[left];
    }
}

public static class DifferenceArray
{
    public static long[] Apply(int[] original, RangeUpdate[] updates)
    {
        int n = original.Length;
        var difference = new long[n + 1];

        foreach (RangeUpdate update in updates)
        {
            if (update.Left < 0 || update.Right < update.Left || update.Right >= n)
            {
                throw new ArgumentOutOfRangeException(nameof(updates));
            }

            difference[update.Left] += update.Delta;
            difference[update.Right + 1] -= update.Delta;
        }

        var result = new long[n];
        long activeDelta = 0;
        for (int i = 0; i < n; i++)
        {
            activeDelta += difference[i];
            result[i] = original[i] + activeDelta;
        }

        return result;
    }
}

public static class Program
{
    public static void Main()
    {
        int[] numbers = [2, 4, 1, 7, 3];
        var rangeSum = new RangeSum(numbers);
        Console.WriteLine(rangeSum.Query(1, 3)); // 4 + 1 + 7 = 12

        RangeUpdate[] updates =
        [
            new(1, 3, 5),
            new(2, 4, -2)
        ];

        long[] updated = DifferenceArray.Apply(numbers, updates);
        Console.WriteLine(string.Join(", ", updated)); // 2, 9, 4, 10, 1
    }
}
```

## Dry run

Với `numbers = [2,4,1,7,3]`:

`prefix = [0,2,6,7,14,17]`.

Query `[1..3]` trả `prefix[4] - prefix[1] = 14 - 2 = 12`.

Hai update `+5` trên `[1..3]`, `-2` trên `[2..4]` tạo:

| Index | 0 | 1 | 2 | 3 | 4 | sentinel 5 |
|---:|---:|---:|---:|---:|---:|---:|
| Difference sau update | 0 | +5 | -2 | 0 | -5 | +2 |
| Delta tích lũy | 0 | 5 | 3 | 3 | -2 | — |
| Gốc + delta | 2 | 9 | 4 | 10 | 1 | — |

Sentinel tại index 5 chỉ đánh dấu kết thúc update cuối; không tạo phần tử kết quả.

## Mở rộng quan trọng

- **Prefix count:** `prefix[i + 1] = prefix[i] + (condition ? 1 : 0)`.
- **Prefix XOR:** XOR đoạn là `prefixXor[right + 1] ^ prefixXor[left]`.
- **Prefix 2D:** tổng hình chữ nhật dùng inclusion-exclusion của bốn prefix.
- **Prefix modulo:** hai prefix có cùng remainder cho một đoạn có tổng chia hết cho `k`.
- **Difference theo timeline:** `+1` tại start, `-1` tại end để tìm số interval đồng thời; phải chốt interval là `[start,end)` hay inclusive.

## Lỗi thường gặp

- Trộn quy ước `prefix[i]` là “đến i” với “i phần tử đầu”, gây off-by-one.
- Quên rằng query đang inclusive hay half-open.
- Trừ `difference[right]` thay vì `right + 1` cho khoảng inclusive.
- Truy cập `right + 1` vượt mảng vì không dùng sentinel hoặc không kiểm tra.
- Dùng `int` cho tổng; `n * maxValue` có thể vượt `2,147,483,647`.
- Dùng prefix trên dữ liệu thay đổi nhưng không rebuild, trả kết quả stale.
- Dùng difference array khi cần query xen giữa các update.
- Với modulo âm trong C#, quên chuẩn hóa remainder nếu dữ liệu có số âm.

## Ứng dụng thực tế

- Tổng doanh thu/traffic theo khoảng ngày trên snapshot dữ liệu.
- Histogram tích lũy, prefix count trong analytics.
- Áp dụng hàng loạt adjustment lên các giai đoạn giá hoặc quota.
- Đếm số lịch họp/booking đang hoạt động tại từng thời điểm.
- Heatmap và tổng vùng chữ nhật trong xử lý ảnh.
- Imos method cho độ phủ bản đồ/game grid.

Trong database production, index/materialized view thường đảm nhận vai trò tương tự ở quy mô lớn; prefix array hữu ích khi dữ liệu nằm trong memory và snapshot tương đối ổn định.

## Câu hỏi phỏng vấn tự luyện

1. Subarray Sum Equals K bằng prefix sum + hash map.
2. Product of Array Except Self mà không dùng phép chia.
3. Tìm pivot index nơi tổng trái bằng tổng phải.
4. Range Sum Query 2D bằng ma trận prefix.
5. Corporate Flight Bookings bằng difference array.
6. Car Pooling: xác định capacity có bị vượt không.
7. Vì sao hai prefix cùng remainder modulo `k` tạo đoạn chia hết cho `k`?
8. Khi nào chọn Fenwick Tree thay cho prefix sum?

## Checklist

- [ ] Tôi dùng prefix dài `n + 1` và giải thích sentinel.
- [ ] Tôi viết đúng công thức đoạn inclusive `[l..r]`.
- [ ] Tôi dùng `long` khi tổng có thể lớn.
- [ ] Tôi phân biệt query tĩnh với update/query online.
- [ ] Tôi triển khai difference bằng hai điểm biên và reconstruct một lần.
- [ ] Tôi chốt rõ quy ước inclusive hay half-open.
- [ ] Tôi hiểu prefix count, prefix modulo và prefix 2D ở mức ý tưởng.
- [ ] Tôi kiểm tra mảng rỗng, index biên và update phủ toàn mảng.
