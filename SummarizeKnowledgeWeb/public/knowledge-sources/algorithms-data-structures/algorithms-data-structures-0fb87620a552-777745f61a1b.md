# 09. Binary Search

## Mục tiêu

- Viết binary search không lỗi biên trên dữ liệu đã sắp xếp.
- Thành thạo `lower_bound`, `upper_bound`, first/last occurrence.
- Nhận diện binary search trên **không gian đáp án** qua predicate đơn điệu.
- Phát biểu invariant và chứng minh thuật toán kết thúc.

## Trực giác

Binary search không đơn thuần là “tìm trong mảng sort”. Bản chất là tìm **ranh giới nơi một predicate đơn điệu đổi trạng thái**:

`false, false, ..., false, true, true, ..., true`.

Mỗi lần kiểm tra midpoint, ta loại chắc chắn một nửa không gian còn lại. Vì sau `t` bước còn khoảng `n / 2ᵗ` phần tử, đến một phần tử khi `t ≈ log₂ n`.

Hai template phổ biến:

- Khoảng đóng `[left, right]`, điều kiện `left <= right`: exact search.
- Khoảng nửa mở `[left, right)`, điều kiện `left < right`: tìm boundary/lower bound.

Đừng trộn update rule của hai template trong cùng một hàm.

## Khi dùng / dấu hiệu nhận diện

- Mảng/danh sách đã sort và cần tìm kiếm hoặc vị trí chèn.
- Tìm first/last occurrence của duplicate.
- Tìm min/max khả thi: “tốc độ nhỏ nhất”, “capacity tối thiểu”, “khoảng cách lớn nhất”.
- Có hàm `Can(x)` đơn điệu: nếu `x` khả thi thì mọi giá trị lớn hơn cũng khả thi, hoặc chiều ngược lại.
- Search trong cấu trúc có tính thứ tự: rotated array, ma trận sort, implicit range.

Không dùng binary search chỉ vì output là một con số. Phải chỉ ra được thứ tự và tính đơn điệu của predicate.

## Thuật toán từng bước: Lower Bound

`LowerBound(sorted, target)` trả index đầu tiên có giá trị `>= target`; nếu không có, trả `n`.

1. Khởi tạo khoảng tìm kiếm nửa mở `[left, right) = [0, n)`.
2. Trong khi `left < right`, lấy `middle = left + (right - left) / 2`.
3. Nếu `sorted[middle] < target`, midpoint chưa đủ lớn; đặt `left = middle + 1`.
4. Ngược lại, midpoint có thể là đáp án; giữ lại nó bằng `right = middle`.
5. Khi `left == right`, đó là boundary đầu tiên.

**Invariant:** mọi index `< left` chắc chắn có giá trị `< target`; mọi index `>= right` chắc chắn có giá trị `>= target`. Vùng `[left, right)` còn chưa quyết định.

Từ lower bound:

- exact match tồn tại khi `index < n && sorted[index] == target`;
- first occurrence chính là lower bound nếu match;
- upper bound là index đầu tiên có giá trị `> target`;
- last occurrence là `UpperBound(target) - 1` nếu hợp lệ.

## Thuật toán từng bước: Binary Search on Answer

Ví dụ Koko Eating Bananas: tìm tốc độ nguyên nhỏ nhất để ăn hết các pile trong `hoursLimit` giờ.

1. Không gian đáp án: từ `1` đến `max(piles)`.
2. Predicate `CanFinish(speed)`: tổng `ceil(pile / speed)` có `<= hoursLimit` không.
3. Predicate đơn điệu: tốc độ khả thi thì mọi tốc độ lớn hơn cũng khả thi.
4. Tìm giá trị đầu tiên làm predicate `true` bằng template lower bound.
5. Dùng phép chia trần an toàn: `pile / speed + (pile % speed == 0 ? 0 : 1)`.

## Độ phức tạp

| Bài toán | Thời gian | Bộ nhớ phụ |
|---|---:|---:|
| Exact/lower bound trên `n` phần tử | `O(log n)` | `O(1)` iterative |
| Min eating speed | `O(n log M)` | `O(1)` |

`M = max(piles)`. Mỗi predicate quét `n` pile và binary search thử `O(log M)` tốc độ.

## C# 12 sample hoàn chỉnh

```csharp
using System;

public static class Program
{
    // Index đầu tiên có giá trị >= target; có thể trả sorted.Length.
    public static int LowerBound(int[] sorted, int target)
    {
        int left = 0;
        int right = sorted.Length; // Khoảng [left, right).

        while (left < right)
        {
            int middle = left + (right - left) / 2;
            if (sorted[middle] < target)
            {
                left = middle + 1;
            }
            else
            {
                right = middle;
            }
        }

        return left;
    }

    // Index đầu tiên có giá trị > target.
    public static int UpperBound(int[] sorted, int target)
    {
        int left = 0;
        int right = sorted.Length;

        while (left < right)
        {
            int middle = left + (right - left) / 2;
            if (sorted[middle] <= target)
            {
                left = middle + 1;
            }
            else
            {
                right = middle;
            }
        }

        return left;
    }

    public static int MinEatingSpeed(int[] piles, long hoursLimit)
    {
        if (piles.Length == 0 || hoursLimit < piles.Length)
        {
            throw new ArgumentException("Không tồn tại tốc độ hợp lệ.");
        }

        int left = 1;
        int right = 0;
        foreach (int pile in piles)
        {
            if (pile <= 0)
            {
                throw new ArgumentException("Mỗi pile phải dương.");
            }

            right = Math.Max(right, pile);
        }

        // Khoảng đóng; lưu đáp án bằng cách giữ middle khi khả thi.
        while (left < right)
        {
            int middle = left + (right - left) / 2;
            if (CanFinish(piles, hoursLimit, middle))
            {
                right = middle;
            }
            else
            {
                left = middle + 1;
            }
        }

        return left;
    }

    private static bool CanFinish(int[] piles, long hoursLimit, int speed)
    {
        long hoursUsed = 0;
        foreach (int pile in piles)
        {
            hoursUsed += pile / speed + (pile % speed == 0 ? 0 : 1);
            if (hoursUsed > hoursLimit)
            {
                return false; // Early exit và tránh cộng không cần thiết.
            }
        }

        return true;
    }

    public static void Main()
    {
        int[] sorted = [1, 2, 2, 2, 5, 8];
        Console.WriteLine(LowerBound(sorted, 2));       // 1
        Console.WriteLine(UpperBound(sorted, 2) - 1);  // 3: last occurrence
        Console.WriteLine(LowerBound(sorted, 4));       // 4: vị trí chèn

        int[] piles = [3, 6, 7, 11];
        Console.WriteLine(MinEatingSpeed(piles, 8));    // 4
    }
}
```

## Dry run: Lower Bound

`sorted = [1,2,2,2,5,8]`, target `2`:

| Bước | `left` | `right` (exclusive) | `middle` | Giá trị | Cập nhật |
|---:|---:|---:|---:|---:|---|
| 1 | 0 | 6 | 3 | 2 | `right = 3` |
| 2 | 0 | 3 | 1 | 2 | `right = 1` |
| 3 | 0 | 1 | 0 | 1 | `left = 1` |

Dừng tại `left = right = 1`, là index đầu tiên có giá trị `>= 2`.

### Dry run trên không gian đáp án

Piles `[3,6,7,11]`, giới hạn 8 giờ, tốc độ trong `[1,11]`:

| Thử speed | Số giờ | Khả thi | Khoảng mới |
|---:|---:|:---:|---|
| 6 | `1+1+2+2=6` | Có | `[1,6]` |
| 3 | `1+2+3+4=10` | Không | `[4,6]` |
| 5 | `1+2+2+3=8` | Có | `[4,5]` |
| 4 | `1+2+2+3=8` | Có | `[4,4]` |

Đáp án nhỏ nhất khả thi là 4.

## Lỗi thường gặp

- Tính midpoint bằng `(left + right) / 2` trong miền số lớn và có thể overflow.
- Trộn khoảng đóng và nửa mở, dẫn đến skip đáp án hoặc vòng lặp vô hạn.
- Khi tìm first true, thấy predicate true rồi `right = middle - 1`, làm mất candidate trong template nửa mở.
- Không tiến biên qua midpoint ở nhánh loại bỏ (`left = middle`), khiến không thu hẹp khi còn hai phần tử.
- Tìm thấy duplicate rồi trả ngay dù đề hỏi first/last occurrence.
- Không kiểm tra `index == n` sau lower bound.
- Binary search trên answer nhưng không chứng minh predicate đơn điệu.
- Chọn sai cận thấp/cao nên đáp án không nằm trong search space.
- Phép tính trong predicate bị overflow hoặc quá chậm, phá tổng complexity.

## Ứng dụng thực tế

- Tra cứu và vị trí chèn trong index đã sắp xếp.
- Tìm timestamp/version gần nhất trước hoặc sau một mốc.
- Capacity planning: tài nguyên tối thiểu để hoàn thành trong deadline.
- Tuning threshold/rate sao cho đạt SLA.
- Bisection cho hàm đơn điệu và tìm nghiệm gần đúng (cần epsilon/giới hạn vòng lặp với số thực).
- Database/B-tree dùng ý tưởng phân vùng theo thứ tự, dù cấu trúc chi tiết khác binary search trên array.

## Câu hỏi phỏng vấn tự luyện

1. First and Last Position of Element in Sorted Array.
2. Search Insert Position.
3. Search in Rotated Sorted Array; nửa nào đang sorted?
4. Find Minimum in Rotated Sorted Array có duplicate và không duplicate.
5. Search a 2D Matrix.
6. Capacity To Ship Packages Within D Days.
7. Split Array Largest Sum.
8. Median of Two Sorted Arrays: binary search trên partition.

## Checklist

- [ ] Tôi chọn rõ interval `[l,r]` hay `[l,r)` trước khi code.
- [ ] Tôi phát biểu invariant của hai biên.
- [ ] Tôi dùng midpoint chống overflow.
- [ ] Mỗi nhánh chắc chắn thu hẹp khoảng và thuật toán kết thúc.
- [ ] Tôi xử lý empty, một phần tử, target ngoài range và duplicate.
- [ ] Tôi dùng lower/upper bound để tìm first/last occurrence.
- [ ] Với answer search, tôi xác định search space và chứng minh predicate đơn điệu.
- [ ] Tôi tính cả chi phí của predicate trong độ phức tạp tổng.

