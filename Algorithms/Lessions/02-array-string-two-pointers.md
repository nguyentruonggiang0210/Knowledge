# 02. Array, String và kỹ thuật Two Pointers

## Mục tiêu

- Nắm các đặc tính quan trọng của mảng và chuỗi trong C#.
- Nhận diện khi hai con trỏ biến lời giải `O(n²)` thành `O(n)`.
- Phân biệt hai con trỏ đối đầu, cùng chiều và hai con trỏ trên hai nguồn dữ liệu.
- Trình bày invariant để chứng minh không bỏ sót đáp án.

## Trực giác

Mảng cho phép truy cập index `O(1)` và dữ liệu liên tiếp nên cache-friendly, nhưng chèn/xóa ở giữa cần dịch phần tử `O(n)`. `string` trong C# là immutable; tạo nhiều chuỗi trung gian trong vòng lặp có thể tốn `O(n²)` thời gian và nhiều allocation. Khi cần ghép chuỗi nhiều lần, cân nhắc `StringBuilder`.

Two pointers duy trì hai vị trí mang ý nghĩa rõ ràng. Mỗi quyết định sẽ loại bỏ một vùng không thể chứa đáp án, nên mỗi con trỏ thường chỉ đi qua dữ liệu một lần.

Ba mẫu chính:

1. **Đối đầu**: `left` ở đầu, `right` ở cuối; palindrome, two sum trên mảng đã sort.
2. **Cùng chiều**: một con trỏ đọc, một con trỏ ghi; remove duplicates, partition.
3. **Hai nguồn**: mỗi con trỏ cho một mảng/chuỗi; merge hai mảng sort, subsequence.

## Khi dùng / dấu hiệu nhận diện

- Đầu vào đã sắp xếp hoặc có thể tận dụng thứ tự.
- Bài toán hỏi cặp phần tử, palindrome, đảo ngược, xóa trùng in-place.
- Cần giữ một đoạn hoặc phân hoạch mảng mà không muốn cấp phát thêm.
- Có hai danh sách đã sort cần merge/intersection.
- Một lời giải brute force đang xét mọi cặp `O(n²)`, nhưng so sánh cho biết nên bỏ đầu trái hay phải.

Không ép dùng two pointers nếu không có tính đơn điệu/invariant để quyết định di chuyển con trỏ nào. Với Two Sum trên mảng chưa sort và phải trả index gốc, hash map thường phù hợp hơn.

## Thuật toán từng bước: Two Sum trên mảng đã sort

Yêu cầu: tìm hai số có tổng bằng `target` trong mảng tăng dần.

1. Đặt `left = 0`, `right = n - 1`.
2. Tính tổng bằng `long` để tránh overflow khi hai `int` lớn.
3. Nếu tổng bằng target, trả cặp index.
4. Nếu tổng nhỏ hơn target, tăng `left`: mọi cặp dùng giá trị trái hiện tại với index nhỏ hơn/equal `right` đều không đủ lớn.
5. Nếu tổng lớn hơn target, giảm `right` theo lập luận đối xứng.
6. Dừng khi `left >= right`.

**Invariant:** trước mỗi vòng lặp, nếu đáp án tồn tại thì vẫn nằm trong vùng index `[left, right]`.

## Thuật toán từng bước: Valid Palindrome

1. Đặt hai con trỏ ở hai đầu chuỗi.
2. Bỏ qua ký tự không phải chữ/số ở mỗi phía.
3. So sánh không phân biệt hoa thường.
4. Khác nhau thì trả `false`; giống nhau thì tiến vào trong.
5. Hai con trỏ gặp nhau nghĩa là mọi cặp đã hợp lệ.

## Độ phức tạp

| Bài toán | Thời gian | Bộ nhớ phụ |
|---|---:|---:|
| Two Sum trên mảng sort | `O(n)` | `O(1)` |
| Valid Palindrome | `O(n)` | `O(1)` |
| Remove duplicates in-place | `O(n)` | `O(1)` |

Mỗi con trỏ di chuyển tối đa `n` bước. Hai con trỏ không có nghĩa là `O(2n)` theo cách ghi Big O; vẫn là `O(n)`.

## C# 12 sample hoàn chỉnh

```csharp
using System;

public static class Program
{
    public static (int Left, int Right)? TwoSumSorted(
        int[] sortedNumbers,
        int target)
    {
        int left = 0;
        int right = sortedNumbers.Length - 1;

        while (left < right)
        {
            long sum = (long)sortedNumbers[left] + sortedNumbers[right];
            if (sum == target)
            {
                return (left, right);
            }

            if (sum < target)
            {
                left++;
            }
            else
            {
                right--;
            }
        }

        return null;
    }

    public static bool IsPalindrome(string text)
    {
        int left = 0;
        int right = text.Length - 1;

        while (left < right)
        {
            while (left < right && !char.IsLetterOrDigit(text[left]))
            {
                left++;
            }

            while (left < right && !char.IsLetterOrDigit(text[right]))
            {
                right--;
            }

            if (char.ToLowerInvariant(text[left]) !=
                char.ToLowerInvariant(text[right]))
            {
                return false;
            }

            left++;
            right--;
        }

        return true;
    }

    // Mảng phải được sort. Trả về độ dài vùng duy nhất ở đầu mảng.
    public static int RemoveDuplicates(int[] sortedNumbers)
    {
        if (sortedNumbers.Length == 0)
        {
            return 0;
        }

        int write = 1;
        for (int read = 1; read < sortedNumbers.Length; read++)
        {
            if (sortedNumbers[read] != sortedNumbers[write - 1])
            {
                sortedNumbers[write] = sortedNumbers[read];
                write++;
            }
        }

        return write;
    }

    public static void Main()
    {
        int[] numbers = [1, 2, 4, 6, 10, 13];
        var pair = TwoSumSorted(numbers, 16);
        Console.WriteLine(pair is null ? "Not found" : $"{pair.Value.Left}, {pair.Value.Right}");

        Console.WriteLine(IsPalindrome("A man, a plan, a canal: Panama")); // True

        int[] duplicated = [1, 1, 2, 2, 2, 5];
        int length = RemoveDuplicates(duplicated);
        Console.WriteLine(string.Join(", ", duplicated.AsSpan(0, length).ToArray())); // 1, 2, 5
    }
}
```

## Dry run: Two Sum

Đầu vào `[1,2,4,6,10,13]`, target `16`:

| Bước | `left`/giá trị | `right`/giá trị | Tổng | Quyết định |
|---:|---|---|---:|---|
| 1 | 0 / 1 | 5 / 13 | 14 | Nhỏ, tăng `left` |
| 2 | 1 / 2 | 5 / 13 | 15 | Nhỏ, tăng `left` |
| 3 | 2 / 4 | 5 / 13 | 17 | Lớn, giảm `right` |
| 4 | 2 / 4 | 4 / 10 | 14 | Nhỏ, tăng `left` |
| 5 | 3 / 6 | 4 / 10 | 16 | Trả `(3, 4)` |

Mỗi bước loại được ít nhất một index khỏi không gian tìm kiếm.

## Lỗi thường gặp

- Dùng two pointers trên dữ liệu chưa sort nhưng vẫn dựa vào quy tắc “tổng nhỏ thì tăng trái”.
- Điều kiện `left <= right` trong bài cần hai phần tử khác nhau, dẫn đến dùng một phần tử hai lần.
- Sort mảng để dùng two pointers nhưng làm mất index gốc mà đề yêu cầu.
- Quên `long` khi cộng hai `int` có thể overflow.
- Dùng `ToLower()` cho cả chuỗi, tạo thêm bộ nhớ không cần thiết; hoặc xử lý culture không nhất quán.
- Trong remove-in-place, trả cả mảng thay vì độ dài logical; phần đuôi không còn ý nghĩa.
- Không nói invariant, khiến quyết định di chuyển con trỏ trông như phỏng đoán.

## Ứng dụng thực tế

- Merge các stream/batch sự kiện đã sắp theo timestamp.
- So sánh hai phiên bản danh sách ID đã sort để tìm thêm/xóa.
- Làm sạch dữ liệu compact in-place nhằm giảm allocation và áp lực GC.
- Kiểm tra định dạng đối xứng, xử lý chuỗi và token từ hai đầu.
- Tìm cặp ngưỡng giá/giá trị trong dữ liệu đã lập chỉ mục theo thứ tự.

Với Unicode đầy đủ, `char` là một UTF-16 code unit chứ không luôn là một ký tự người dùng nhìn thấy. Bài production xử lý emoji/grapheme có thể cần `Rune` hoặc `StringInfo`; hãy hỏi phạm vi ký tự trong phỏng vấn.

## Câu hỏi phỏng vấn tự luyện

1. Chứng minh vì sao khi tổng nhỏ hơn target ta có thể bỏ `sorted[left]`.
2. Viết `MoveZeroes` in-place và giữ thứ tự tương đối.
3. Merge hai mảng sort vào buffer của mảng thứ nhất từ phía cuối.
4. Kiểm tra một chuỗi có là subsequence của chuỗi khác không.
5. Tìm container chứa nhiều nước nhất; vì sao di chuyển cạnh ngắn hơn?
6. Sort Colors bằng three pointers/Dutch National Flag.
7. Khi nào hash map tốt hơn two pointers cho Two Sum?
8. Phân biệt sliding window với two pointers thông thường.

## Checklist

- [ ] Tôi xác định được ý nghĩa chính xác của từng con trỏ.
- [ ] Tôi phát biểu được invariant và lý do không bỏ sót đáp án.
- [ ] Tôi chọn đúng `<` hay `<=` ở điều kiện dừng.
- [ ] Tôi xử lý mảng rỗng, một phần tử, duplicate và overflow.
- [ ] Tôi nhớ rằng sort có chi phí và có thể phá index/thứ tự gốc.
- [ ] Tôi phân biệt ba mẫu: đối đầu, cùng chiều, hai nguồn.
- [ ] Tôi có thể code Two Sum sorted và Valid Palindrome không cần gợi ý.

