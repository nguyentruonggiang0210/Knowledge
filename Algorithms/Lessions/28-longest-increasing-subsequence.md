# 28. Longest Increasing Subsequence (LIS)

## Mục tiêu

Sau bài này, bạn có thể:

- Phân biệt subsequence với subarray/substring.
- Giải LIS bằng DP `O(n²)` và tối ưu xuống `O(n log n)`.
- Giải thích invariant của mảng `tails` và dùng đúng lower bound.
- Dựng lại một LIS thực sự, không nhầm `tails` là đáp án cần in.

## Nhận diện bài toán

LIS yêu cầu tìm dãy con:

- Giữ nguyên thứ tự tương đối của input.
- Không bắt buộc liên tiếp.
- Tăng **nghiêm ngặt**: phần tử sau lớn hơn phần tử trước.
- Có độ dài lớn nhất.

Các biến thể thường ẩn dưới câu chữ “chuỗi tương thích dài nhất”, “xếp lồng”, “chuỗi tăng theo thời gian” hoặc “loại ít phần tử nhất để phần còn lại tăng”.

Nếu cần đoạn liên tiếp, đó là subarray và thường có lời giải khác đơn giản hơn.

## Từ DP `O(n²)` đến `O(n log n)`

### DP cơ bản

`dp[i]` là độ dài LIS kết thúc **đúng tại** `i`:

`dp[i] = 1 + max(dp[j])` với mọi `j < i` và `a[j] < a[i]`.

Đáp án là max của mọi `dp[i]`. Có `O(n²)` cặp `(j,i)`.

### Tối ưu bằng `tails`

`tails[len - 1]` lưu giá trị đuôi nhỏ nhất có thể của một increasing subsequence dài `len` đã gặp.

Với mỗi `x`:

1. Tìm vị trí đầu tiên có tail `>= x` bằng lower bound.
2. Thay tail đó bằng `x`.
3. Nếu không có tail như vậy, nối `x` vào cuối và tăng độ dài.

Đuôi nhỏ hơn luôn có ít nhất nhiều cơ hội nối tiếp như đuôi lớn hơn.

## Invariant

Sau khi xử lý một prefix:

- Các tail đang xét tăng nghiêm ngặt.
- Với mỗi độ dài `len`, tail lưu là giá trị kết thúc nhỏ nhất có thể của một subsequence dài `len`.
- Số tail chính là độ dài LIS của prefix.

Mảng các **giá trị** tail là công cụ tối ưu, không đảm bảo tự nó là các phần tử thuộc cùng một subsequence cần trả về. Để reconstruct chắc chắn, sample lưu index tail và predecessor.

## Dry run

Với `[10, 9, 2, 5, 3, 7, 101, 18]`:

| `x` | Tail values sau bước |
|---:|---|
| 10 | `[10]` |
| 9 | `[9]` |
| 2 | `[2]` |
| 5 | `[2,5]` |
| 3 | `[2,3]` |
| 7 | `[2,3,7]` |
| 101 | `[2,3,7,101]` |
| 18 | `[2,3,7,18]` |

Độ dài là `4`. Một LIS được reconstruct là `[2,3,7,18]`.

## C# 12 sample độc lập

Sample trả về một LIS tăng nghiêm ngặt trong `O(n log n)`.

```csharp
using System;
using System.Collections.Generic;

public static class LongestIncreasingSubsequence
{
    public static int LengthQuadratic(IReadOnlyList<int> values)
    {
        ArgumentNullException.ThrowIfNull(values);
        if (values.Count == 0) return 0;

        var bestEndingAt = new int[values.Count];
        int answer = 1;
        for (int i = 0; i < values.Count; i++)
        {
            bestEndingAt[i] = 1;
            for (int j = 0; j < i; j++)
                if (values[j] < values[i])
                    bestEndingAt[i] = Math.Max(bestEndingAt[i], bestEndingAt[j] + 1);
            answer = Math.Max(answer, bestEndingAt[i]);
        }
        return answer;
    }

    public static int[] Find(IReadOnlyList<int> values)
    {
        ArgumentNullException.ThrowIfNull(values);
        int count = values.Count;
        if (count == 0)
        {
            return [];
        }

        // tails[position] là index của tail tốt nhất cho độ dài position + 1.
        var tails = new int[count];
        var previous = new int[count];
        Array.Fill(previous, -1);

        int length = 0;
        for (int index = 0; index < count; index++)
        {
            int left = 0;
            int right = length;

            // lower_bound: vị trí đầu tiên có value >= values[index].
            while (left < right)
            {
                int middle = left + (right - left) / 2;
                if (values[tails[middle]] < values[index])
                {
                    left = middle + 1;
                }
                else
                {
                    right = middle;
                }
            }

            int position = left;
            if (position > 0)
            {
                previous[index] = tails[position - 1];
            }

            tails[position] = index;
            if (position == length)
            {
                length++;
            }
        }

        var sequence = new int[length];
        int currentIndex = tails[length - 1];
        for (int position = length - 1; position >= 0; position--)
        {
            sequence[position] = values[currentIndex];
            currentIndex = previous[currentIndex];
        }

        return sequence;
    }
}

public static class Program
{
    public static void Main()
    {
        int[] values = [10, 9, 2, 5, 3, 7, 101, 18];
        int[] lis = LongestIncreasingSubsequence.Find(values);

        Console.WriteLine(LongestIncreasingSubsequence.LengthQuadratic(values)); // 4
        Console.WriteLine($"Length: {lis.Length}");
        Console.WriteLine(string.Join(", ", lis));
    }
}
```

Kết quả:

```text
Length: 4
2, 3, 7, 18
```

## Độ phức tạp

| Cách | Thời gian | Bộ nhớ phụ |
|---|---:|---:|
| DP xét mọi cặp | `O(n²)` | `O(n)` |
| Tails, chỉ lấy độ dài | `O(n log n)` | `O(L)`, với `L` là độ dài LIS |
| Tails + reconstruct như sample | `O(n log n)` | `O(n)` |

Mỗi phần tử thực hiện một binary search trên tối đa `n` tail.

## Strictly increasing và non-decreasing

- **Tăng nghiêm ngặt:** thay vị trí đầu tiên `>= x`, tức lower bound.
- **Không giảm:** thay vị trí đầu tiên `> x`, tức upper bound.

Ví dụ `[2,2,2]` có LIS nghiêm ngặt dài `1` nhưng longest non-decreasing subsequence dài `3`. Chỉ một dấu so sánh sai có thể làm hỏng toàn bộ duplicate case.

## Giới hạn và biến thể

- Nếu chỉ cần độ dài và `n` nhỏ, DP `O(n²)` thường dễ giải thích và ít bug hơn.
- Tìm **số lượng** LIS không được giải trực tiếp chỉ bằng mảng tails; thường dùng DP `O(n²)` hoặc Fenwick/segment tree có lưu cặp length/count.
- Dữ liệu đến online nhưng có update/xóa phần tử cần cấu trúc khác; thuật toán batch không giải đầy đủ.
- Với Russian Doll Envelopes, phải sort một chiều tăng và chiều kia giảm khi bằng nhau trước khi chạy LIS.
- Với phần tử đa chiều hoặc quan hệ không phải total order, không thể áp dụng tails nguyên trạng.
- Có thể tồn tại nhiều LIS; sample chỉ trả về một dãy hợp lệ.

## Ứng dụng thực tế

- Tìm chuỗi phiên bản/sự kiện tương thích dài nhất khi thứ tự thời gian phải được giữ.
- Phân tích một xu hướng tăng sau khi cho phép bỏ các điểm nhiễu, trong mô hình đơn giản.
- Bài toán nesting và chain sau khi chuyển quan hệ hai chiều về sorting + LIS.
- LIS liên hệ với bài minimum deletions để tạo dãy tăng.

Trong phân tích dữ liệu thật, “xu hướng” thường có tolerance, noise và trọng số; LIS cơ bản không tự xử lý các yếu tố đó.

## Lỗi thường gặp

- Nhầm subsequence với subarray và yêu cầu phần tử liên tiếp.
- Trả trực tiếp mảng tail như một LIS mà không lưu predecessor.
- Dùng upper bound cho bài tăng nghiêm ngặt.
- Báo `O(n log n)` nhưng thực tế chèn/xóa giữa `List<T>` làm `O(n)` mỗi bước.
- Với DP `O(n²)`, trả `dp[n-1]` thay vì max toàn bộ.
- Sort input trước khi chạy và làm mất thứ tự subsequence gốc.
- Không xử lý mảng rỗng hoặc duplicate.
- Trong bài envelope, sort tie sai làm chọn hai envelope cùng chiều rộng.

## Câu hỏi luyện tập

1. Viết bản DP `O(n²)` và reconstruct bằng parent.
2. Đổi sample thành longest non-decreasing subsequence.
3. Tìm số phần tử ít nhất cần xóa để dãy tăng nghiêm ngặt.
4. Giải Russian Doll Envelopes và giải thích tie-breaking.
5. Tìm độ dài longest bitonic subsequence.
6. Đếm số lượng LIS và nêu vì sao tails đơn thuần không đủ.

## Checklist phỏng vấn

- [ ] Tôi xác nhận strict hay non-decreasing.
- [ ] Tôi phân biệt subsequence với đoạn liên tiếp.
- [ ] Tôi trình bày được DP `O(n²)` trước khi tối ưu nếu cần.
- [ ] Tôi phát biểu invariant “tail nhỏ nhất cho mỗi độ dài”.
- [ ] Tôi dùng lower bound đúng với duplicate.
- [ ] Tôi không nhầm tails với sequence reconstruct.
- [ ] Tôi test rỗng, giảm hoàn toàn, tăng hoàn toàn, toàn duplicate và giá trị âm.

LIS là một pattern mạnh nhưng chỉ là một phần của năng lực phỏng vấn tổng thể; không có curriculum nào đảm bảo tuyệt đối kết quả hoặc “full điểm”.
