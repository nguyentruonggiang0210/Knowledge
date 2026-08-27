# 01. Big O và phân tích độ phức tạp

## Mục tiêu

Sau bài này, bạn có thể:

- Ước lượng thời gian và bộ nhớ của một đoạn code theo kích thước đầu vào `n`.
- Phân biệt `O`, `Ω`, `Θ`; trình bày best/average/worst case mà không đánh tráo khái niệm.
- Nhận ra các mẫu thường gặp: vòng lặp nối tiếp, lồng nhau, chia đôi, đệ quy và chi phí khấu hao.
- So sánh các lời giải phỏng vấn bằng cả độ phức tạp lẫn ràng buộc thực tế.

## Trực giác cốt lõi

Big O mô tả **tốc độ tăng** của tài nguyên khi đầu vào lớn lên, không phải số mili-giây chính xác. Ta bỏ hằng số và hạng bậc thấp vì khi `n` đủ lớn, hạng tăng nhanh nhất chi phối kết quả.

Ví dụ `3n² + 10n + 20` thuộc `O(n²)`. Tuy vậy, hai thuật toán cùng `O(n)` vẫn có thể khác đáng kể về hằng số, locality của cache, cấp phát bộ nhớ và khả năng song song.

- `O(f(n))`: cận trên tiệm cận.
- `Ω(f(n))`: cận dưới tiệm cận.
- `Θ(f(n))`: cận chặt, vừa trên vừa dưới.
- Trong phỏng vấn, nếu chỉ nói “độ phức tạp”, hãy nêu rõ đang xét worst case hay average case.

Thứ tự tăng thường gặp:

`O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!)`.

## Khi dùng / cách nhận diện

Luôn phân tích trước khi chốt lời giải, đặc biệt khi đề có ràng buộc lớn:

- Một vòng duyệt hết mảng: thường `O(n)`.
- Hai vòng **nối tiếp**: cộng lại, `O(n) + O(n) = O(n)`.
- Hai vòng **lồng nhau**, mỗi vòng chạy `n`: thường `O(n²)`.
- Mỗi bước giảm không gian còn một nửa: `O(log n)`.
- Chia thành các bài toán con rồi trộn tuyến tính: thường `O(n log n)` như merge sort.
- Liệt kê mọi tập con: `O(2ⁿ)`; mọi hoán vị: `O(n!)`.
- Hash table: tra cứu trung bình `O(1)`, worst case về lý thuyết có thể `O(n)`.
- `List<T>.Add` ở cuối: `O(1)` khấu hao, một lần resize riêng lẻ là `O(n)`.

Đừng dùng duy nhất một biến `n` nếu có hai đầu vào độc lập. Duyệt ma trận `rows × cols` là `O(rows * cols)`, không nhất thiết là `O(n²)`. Hai vòng lần lượt qua mảng dài `n` và `m` là `O(n + m)`.

## Quy trình phân tích từng bước

1. Xác định kích thước đầu vào: `n`, hoặc `n` và `m`.
2. Chọn phép toán chính cần đếm: so sánh, truy cập, push/pop…
3. Đếm số lần phép toán chạy theo đầu vào.
4. Với khối nối tiếp thì cộng; với khối lồng nhau thì nhân.
5. Với đệ quy, viết recurrence, ví dụ `T(n) = 2T(n/2) + O(n)`.
6. Giữ hạng tăng nhanh nhất, bỏ hằng số.
7. Phân tích **auxiliary space** riêng; nói rõ có tính output hay call stack không.
8. Kiểm tra worst case, average case và chi phí khấu hao nếu liên quan.

### Một vài recurrence quan trọng

- Binary search: `T(n) = T(n/2) + O(1) = O(log n)`.
- Merge sort: `T(n) = 2T(n/2) + O(n) = O(n log n)`.
- Fibonacci ngây thơ: `T(n) = T(n-1) + T(n-2) + O(1) = O(φⁿ)`, thường ghi gọn `O(2ⁿ)`.

## Độ phức tạp các thao tác minh họa

| Hàm | Thời gian | Bộ nhớ phụ | Lý do |
|---|---:|---:|---|
| `Sum` | `O(n)` | `O(1)` | Đọc mỗi phần tử một lần |
| `BinarySearch` | `O(log n)` | `O(1)` | Mỗi vòng loại nửa khoảng tìm kiếm |
| `ContainsDuplicate` | Trung bình `O(n)` | `O(n)` | Hash set lưu tối đa `n` phần tử |
| `CountEqualPairs` | `O(n²)` | `O(1)` | Xét `n(n-1)/2` cặp |

## C# 12 sample hoàn chỉnh

```csharp
using System;
using System.Collections.Generic;

public static class Program
{
    public static long Sum(int[] numbers)
    {
        long total = 0;
        foreach (int number in numbers)
        {
            total += number;
        }

        return total;
    }

    // Yêu cầu mảng đã được sắp xếp tăng dần.
    public static int BinarySearch(int[] sorted, int target)
    {
        int left = 0;
        int right = sorted.Length - 1;

        while (left <= right)
        {
            // Tránh nguy cơ tràn số của (left + right) / 2.
            int middle = left + (right - left) / 2;
            if (sorted[middle] == target)
            {
                return middle;
            }

            if (sorted[middle] < target)
            {
                left = middle + 1;
            }
            else
            {
                right = middle - 1;
            }
        }

        return -1;
    }

    public static bool ContainsDuplicate(int[] numbers)
    {
        var seen = new HashSet<int>();
        foreach (int number in numbers)
        {
            if (!seen.Add(number))
            {
                return true;
            }
        }

        return false;
    }

    public static long CountEqualPairs(int[] numbers)
    {
        long count = 0;
        for (int i = 0; i < numbers.Length; i++)
        {
            for (int j = i + 1; j < numbers.Length; j++)
            {
                if (numbers[i] == numbers[j])
                {
                    count++;
                }
            }
        }

        return count;
    }

    public static void Main()
    {
        int[] values = [4, 2, 7, 2, 9];
        int[] sorted = [2, 4, 7, 9, 12, 18];

        Console.WriteLine(Sum(values));                 // 24
        Console.WriteLine(BinarySearch(sorted, 9));    // 3
        Console.WriteLine(ContainsDuplicate(values));  // True
        Console.WriteLine(CountEqualPairs(values));    // 1
    }
}
```

## Dry run

Với `BinarySearch([2,4,7,9,12,18], 9)`:

| Bước | `left` | `right` | `middle` | Giá trị | Hành động |
|---:|---:|---:|---:|---:|---|
| 1 | 0 | 5 | 2 | 7 | `7 < 9`, đặt `left = 3` |
| 2 | 3 | 5 | 4 | 12 | `12 > 9`, đặt `right = 3` |
| 3 | 3 | 3 | 3 | 9 | Tìm thấy tại index 3 |

Chỉ 3 lần so sánh thay vì có thể phải duyệt 6 phần tử. Với đầu vào gấp đôi, binary search chỉ tăng xấp xỉ một bước.

## Lỗi thường gặp

- Nói `O(2n)` thay vì rút gọn thành `O(n)`.
- Cộng độ phức tạp của vòng lồng nhau thay vì nhân.
- Tuyên bố mọi thao tác hash là worst-case `O(1)`; đây thường là average/amortized.
- Bỏ quên bộ nhớ của recursion stack, substring/copy hoặc cấu trúc dữ liệu phụ.
- Gọi sort rồi chỉ báo chi phí của bước quét; tổng thường bị chi phối bởi `O(n log n)`.
- Cho rằng `O(1)` nghĩa là “một phép toán”; nó chỉ nghĩa là không tăng theo `n`.
- Dùng `n` cho mọi chiều khiến `O(n + m)` bị báo sai thành `O(n)`.
- Tối ưu Big O quá sớm mà bỏ qua ràng buộc nhỏ, độ dễ kiểm chứng và hằng số thực tế.

## Ứng dụng thực tế

- Chọn cấu trúc dữ liệu cho endpoint có hàng triệu bản ghi.
- Ước tính liệu một tác vụ batch hoàn thành trong SLA hay không.
- Nhận ra truy vấn kiểu N+1 hoặc hai vòng join phía ứng dụng có thể tăng bậc hai.
- Cân bằng CPU và RAM: hash set dùng thêm `O(n)` bộ nhớ để loại vòng lặp `O(n²)`.
- Đánh giá khả năng mở rộng của index, cache, tìm kiếm và pipeline xử lý sự kiện.

Big O không thay thế benchmark. Sau khi chọn được bậc tăng phù hợp, hãy đo trên dữ liệu đại diện và chú ý GC, cache CPU, I/O, concurrency.

## Câu hỏi phỏng vấn tự luyện

1. Vì sao hai vòng nối tiếp không luôn là `O(n²)`?
2. Phân tích thời gian và bộ nhớ của merge sort, quicksort ở average/worst case.
3. Vì sao `List<T>.Add` được gọi là `O(1)` amortized?
4. Nếu có mảng `n × m`, duyệt mọi ô có độ phức tạp gì?
5. Khi nào một lời giải `O(n log n)` có thể nhanh hơn một lời giải `O(n)` trong thực tế?
6. Viết recurrence cho binary search và giải thích số tầng.
7. Hash table đổi thời gian lấy bộ nhớ như thế nào?
8. Output chứa `k` phần tử thì có thể tuyên bố bộ nhớ tổng là `O(1)` không?

Khi trả lời, luôn nêu giả định, trường hợp đang xét và giải thích phép đếm thay vì chỉ đọc kết quả Big O.

## Checklist trước khi chuyển bài

- [ ] Tôi phân biệt được `O`, `Ω`, `Θ` và worst/average/best case.
- [ ] Tôi phân tích đúng vòng nối tiếp, vòng lồng nhau và vòng giảm một nửa.
- [ ] Tôi dùng nhiều biến cho nhiều kích thước đầu vào độc lập.
- [ ] Tôi tính riêng time, auxiliary space, output space và recursion stack.
- [ ] Tôi giải thích được amortized analysis bằng ví dụ dynamic array.
- [ ] Tôi không bỏ quên chi phí sort, copy và thao tác thư viện.
- [ ] Tôi có thể nói trade-off rõ ràng trong khoảng 60–90 giây.

