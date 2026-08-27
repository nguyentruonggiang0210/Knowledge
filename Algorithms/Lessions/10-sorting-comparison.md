# 10. Sorting và cách so sánh thuật toán

## Mục tiêu

- Chọn thuật toán sort dựa trên kích thước, stability, bộ nhớ và đặc điểm key.
- Hiểu lower bound `Ω(n log n)` của comparison sort tổng quát.
- Cài đặt merge sort ổn định và phân tích chính xác.
- Biết khi nào dùng API sort chuẩn thay vì tự cài đặt.

## Trực giác

Sorting biến dữ liệu thành thứ tự để nhiều bài toán sau đó dễ hơn: binary search, two pointers, deduplication, interval processing. Chi phí sort `O(n log n)` đôi khi đáng giá vì làm phần còn lại tuyến tính.

Một comparison sort quyết định thứ tự bằng các phép so sánh. Có `n!` hoán vị có thể xảy ra; cây quyết định cần chiều cao ít nhất `log₂(n!) = Ω(n log n)`. Vì vậy không có comparison sort tổng quát nào bảo đảm nhanh hơn bậc này cho mọi input.

Counting/radix/bucket sort vượt mốc đó bằng cách khai thác cấu trúc của key, không chỉ dùng phép so sánh; chúng có điều kiện và chi phí bộ nhớ riêng.

## Thuộc tính cần hỏi trước khi chọn

- Dữ liệu có bao nhiêu phần tử? Gần sort sẵn không?
- Có cần **stable**: các phần tử bằng key giữ nguyên thứ tự tương đối?
- Có cần in-place/giới hạn memory không?
- Cần worst-case guarantee hay average case đủ tốt?
- Key có miền nhỏ, integer cố định, hay object với comparer đắt?
- Dữ liệu nằm trong RAM hay external storage?
- Chỉ cần top `k`/k-th element thay vì sort toàn bộ không?

## Bảng so sánh

| Thuật toán | Best | Average | Worst | Bộ nhớ phụ | Stable | Ghi chú |
|---|---:|---:|---:|---:|:---:|---|
| Bubble sort (có cờ) | `O(n)` | `O(n²)` | `O(n²)` | `O(1)` | Có | Chủ yếu để học |
| Selection sort | `O(n²)` | `O(n²)` | `O(n²)` | `O(1)` | Không | Ít swap |
| Insertion sort | `O(n)` | `O(n²)` | `O(n²)` | `O(1)` | Có | Tốt cho input nhỏ/gần sort |
| Merge sort | `O(n log n)` | `O(n log n)` | `O(n log n)` | `O(n)` | Có | Predictable, hợp linked/external sort |
| Quicksort | `O(n log n)` | `O(n log n)` | `O(n²)` | TB `O(log n)` stack | Thường không | Cache-friendly; pivot quan trọng |
| Heapsort | `O(n log n)` | `O(n log n)` | `O(n log n)` | `O(1)` | Không | Worst-case tốt, locality kém hơn |
| Counting sort | `O(n + R)` | `O(n + R)` | `O(n + R)` | `O(R)` | Có thể | Chỉ khi miền key `R` hợp lý |

“In-place” và recursion stack đôi khi được báo theo convention khác nhau; hãy nói rõ cách tính. Stability cũng phụ thuộc implementation cụ thể, không chỉ tên ý tưởng nếu code đã bị biến đổi.

## Khi dùng / dấu hiệu nhận diện

- Sort + scan: merge intervals, three sum, loại duplicate.
- Sort + two pointers: tìm cặp/bộ thỏa điều kiện.
- Sort theo nhiều field: scheduling, ranking.
- Offline processing: sắp event theo timestamp hoặc endpoint.
- Cần stable sort khi nhiều lần sort theo các key hoặc muốn giữ thứ tự đến.

Nếu chỉ cần `k` phần tử lớn nhất, heap `O(n log k)` có thể tốt hơn sort `O(n log n)`. Nếu cần phần tử thứ `k`, quickselect average `O(n)` là ứng viên. Nếu dữ liệu liên tục đến, cấu trúc ordered/heap thường phù hợp hơn re-sort toàn bộ.

## Thuật toán từng bước: Merge Sort

1. Nếu đoạn có 0 hoặc 1 phần tử, nó đã sort.
2. Chia đoạn `[left..right]` tại `middle`.
3. Sort đệ quy nửa trái và nửa phải.
4. Merge hai đoạn đã sort vào buffer:
   - so sánh phần tử đầu chưa dùng của hai nửa;
   - lấy phần tử nhỏ hơn;
   - nếu bằng nhau, lấy bên trái trước để giữ stability.
5. Copy vùng đã merge từ buffer về mảng.

**Invariant lúc merge:** trước mỗi bước, buffer đã chứa đúng các phần tử nhỏ nhất đã xử lý theo thứ tự, và hai con trỏ trỏ vào phần tử nhỏ nhất chưa dùng của mỗi nửa.

Recurrence: `T(n) = 2T(n/2) + O(n) = O(n log n)` ở mọi trường hợp.

## Độ phức tạp của sample

- Thời gian `O(n log n)` best/average/worst.
- Buffer `O(n)`.
- Call stack `O(log n)`.
- Tổng auxiliary space vẫn `O(n)` vì buffer chi phối.

## C# 12 sample hoàn chỉnh

```csharp
using System;

public static class MergeSorter
{
    public static void Sort(int[] numbers)
    {
        if (numbers.Length < 2)
        {
            return;
        }

        var buffer = new int[numbers.Length];
        SortRange(numbers, buffer, 0, numbers.Length - 1);
    }

    private static void SortRange(int[] numbers, int[] buffer, int left, int right)
    {
        if (left >= right)
        {
            return;
        }

        int middle = left + (right - left) / 2;
        SortRange(numbers, buffer, left, middle);
        SortRange(numbers, buffer, middle + 1, right);

        // Tối ưu hợp lệ: hai nửa đã nối đúng thứ tự.
        if (numbers[middle] <= numbers[middle + 1])
        {
            return;
        }

        Merge(numbers, buffer, left, middle, right);
    }

    private static void Merge(
        int[] numbers,
        int[] buffer,
        int left,
        int middle,
        int right)
    {
        int first = left;
        int second = middle + 1;
        int write = left;

        while (first <= middle && second <= right)
        {
            // Lấy bên trái khi bằng nhau để merge ổn định.
            if (numbers[first] <= numbers[second])
            {
                buffer[write++] = numbers[first++];
            }
            else
            {
                buffer[write++] = numbers[second++];
            }
        }

        while (first <= middle)
        {
            buffer[write++] = numbers[first++];
        }

        while (second <= right)
        {
            buffer[write++] = numbers[second++];
        }

        for (int i = left; i <= right; i++)
        {
            numbers[i] = buffer[i];
        }
    }
}

public readonly record struct Candidate(string Name, int Score, int OriginalOrder);

public static class Program
{
    public static void Main()
    {
        int[] values = [5, 2, 4, 1, 3, 2];
        MergeSorter.Sort(values);
        Console.WriteLine(string.Join(", ", values)); // 1, 2, 2, 3, 4, 5

        Candidate[] candidates =
        [
            new("An", 90, 0),
            new("Binh", 95, 1),
            new("Chi", 90, 2)
        ];

        // Thêm tie-breaker rõ ràng; không phụ thuộc sort có stable hay không.
        Array.Sort(candidates, (a, b) =>
        {
            int byScoreDescending = b.Score.CompareTo(a.Score);
            return byScoreDescending != 0
                ? byScoreDescending
                : a.OriginalOrder.CompareTo(b.OriginalOrder);
        });

        Console.WriteLine(string.Join(", ", candidates));
    }
}
```

## Dry run: Merge Sort

Với `[5,2,4,1]`:

1. Chia thành `[5,2]` và `[4,1]`.
2. `[5,2]` chia thành `[5]`, `[2]`, merge thành `[2,5]`.
3. `[4,1]` chia thành `[4]`, `[1]`, merge thành `[1,4]`.
4. Merge `[2,5]` với `[1,4]`:

| So sánh | Chọn | Buffer hiện tại |
|---|---:|---|
| 2 và 1 | 1 (phải) | `[1]` |
| 2 và 4 | 2 (trái) | `[1,2]` |
| 5 và 4 | 4 (phải) | `[1,2,4]` |
| Nửa phải hết | 5 | `[1,2,4,5]` |

Mỗi tầng recursion merge tổng cộng `n` phần tử; có `log n` tầng.

## Comparator đúng chuẩn

Comparer phải nhất quán:

- trả số âm nếu `a` đứng trước `b`, 0 nếu tương đương theo sort key, số dương nếu đứng sau;
- có tính phản đối xứng và bắc cầu;
- tránh `return a.Value - b.Value` vì có thể overflow; dùng `CompareTo`;
- với nhiều field, so key chính rồi tie-breaker.

Không giả định mọi API sort đều stable. Khi stability là yêu cầu nghiệp vụ, dùng API có contract stable hoặc thêm original index làm tie-breaker rõ ràng.

## Lỗi thường gặp

- Quên tính `O(n log n)` của bước sort trong lời giải “sort rồi scan”.
- Nói quicksort luôn `O(n log n)` mà bỏ worst case `O(n²)`.
- Tạo buffer mới ở mỗi lời gọi merge, làm nhiều allocation dù Big O tổng có thể vẫn `O(n log n)` allocation volume.
- Merge dùng `<` thay vì `<=` khi muốn lấy bên trái trước và giữ stability.
- Sai biên giữa hai nửa: `[left..middle]` và `[middle+1..right]`.
- Comparator dùng phép trừ gây overflow hoặc vi phạm tính bắc cầu.
- Sort input in-place mà đề/caller cần giữ nguyên dữ liệu.
- Dùng counting sort khi miền key `R` quá lớn so với `n`.
- Sort toàn bộ dù chỉ cần top `k` hoặc median.

## Ứng dụng thực tế

- Xếp hạng, báo cáo và UI table theo nhiều tiêu chí.
- Chuẩn hóa thứ tự để deduplicate/diff hai dataset.
- Sắp event cho sweep line, interval scheduling và log replay.
- Sort-merge join và external merge sort khi dữ liệu lớn hơn RAM.
- Tạo run đã sort trong storage/index pipeline.
- Tiền xử lý để binary search hoặc two pointers.

Trong code production, ưu tiên thư viện chuẩn đã được tối ưu và kiểm thử. Tự cài sort chủ yếu dành cho học thuật, yêu cầu đặc biệt, hoặc khi interviewer muốn đánh giá invariant và trade-off.

## Câu hỏi phỏng vấn tự luyện

1. Implement merge sort và quicksort; phân tích recursion stack.
2. Sort Colors trong `O(n)`, `O(1)` bằng Dutch National Flag.
3. Merge Intervals: vì sao sort theo start giúp xử lý tuyến tính?
4. Kth Largest Element: sort, heap và quickselect trade-off thế nào?
5. Top K Frequent Elements bằng bucket sort.
6. Count Inversions bằng merge sort biến đổi.
7. Largest Number: comparator cho hai chuỗi `a+b` và `b+a`.
8. Sort một dataset không vừa RAM bằng external merge sort.

## Checklist

- [ ] Tôi biết các trục so sánh: time, space, stable, in-place, worst case.
- [ ] Tôi giải thích được lower bound của comparison sort ở mức cây quyết định.
- [ ] Tôi chọn sort phù hợp với input gần sort, miền key nhỏ hoặc memory hạn chế.
- [ ] Tôi cài merge sort đúng biên và tái sử dụng một buffer.
- [ ] Tôi viết comparator không overflow, có tie-breaker rõ.
- [ ] Tôi tính cả chi phí sort trong thuật toán tổng.
- [ ] Tôi cân nhắc heap/quickselect nếu chỉ cần top/k-th.
- [ ] Tôi ưu tiên API chuẩn trong production và không giả định stability nếu contract không nói.

