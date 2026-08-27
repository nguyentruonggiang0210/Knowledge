# 05. Hash Table và Frequency Counting

## Mục tiêu

- Dùng `Dictionary<TKey,TValue>` và `HashSet<T>` đúng tình huống.
- Chuyển bài toán tìm kiếm lặp lại từ `O(n²)` thành trung bình `O(n)`.
- Thiết kế key, quản lý frequency map và xử lý duplicate chính xác.
- Trình bày rõ average/worst case, bộ nhớ và ảnh hưởng của equality/hash code.

## Trực giác

Hash table dùng hàm băm để ánh xạ key đến bucket. Với phân bố hash tốt và load factor được kiểm soát, insert/search/delete có thời gian trung bình `O(1)`. Vì vậy ta có thể “ghi nhớ những gì đã thấy” thay vì quét lại phần trước của dữ liệu.

- `HashSet<T>`: chỉ quan tâm một giá trị đã tồn tại hay chưa.
- `Dictionary<TKey,TValue>`: cần ánh xạ key sang index, count, object hoặc trạng thái.
- Frequency map là dictionary `giá trị -> số lần xuất hiện`.

Hash table đánh đổi thêm `O(n)` bộ nhớ để giảm thời gian. Nó không duy trì thứ tự sort; nếu cần min/max hoặc ordered traversal, cấu trúc khác có thể phù hợp hơn.

## Khi dùng / dấu hiệu nhận diện

- Cần membership/duplicate nhanh.
- Đề hỏi tần suất, majority, anagram, nhóm các phần tử tương đương.
- Cần tìm complement như `target - current`.
- Cần cache kết quả theo key hoặc memoization.
- Cần đếm prefix state: prefix sum, remainder, XOR đã xuất hiện bao nhiêu lần.
- Brute force đang tìm lại một giá trị trong phần mảng đã duyệt.

### Thiết kế key

Key phải biểu diễn chính xác quan hệ tương đương của bài toán:

- Group Anagrams: key có thể là chuỗi ký tự đã sort `O(k log k)`, hoặc vector 26 tần suất `O(k)` nếu chỉ có `a-z`.
- Tọa độ: dùng value tuple `(row, col)` hoặc record struct.
- Object mutable là key nguy hiểm nếu các field tham gia equality/hash bị đổi sau khi insert.
- Chuỗi cần so sánh không phân biệt hoa thường: truyền `StringComparer.OrdinalIgnoreCase` thay vì tự xử lý rời rạc.

Trong phỏng vấn, hãy xác nhận alphabet, case sensitivity, Unicode và output order.

## Thuật toán từng bước: Two Sum chưa sắp xếp

1. Tạo dictionary `value -> index` cho các phần tử đã duyệt.
2. Ở index `i`, tính `complement = target - numbers[i]` bằng `long` để tránh overflow.
3. Nếu complement nằm trong phạm vi `int` và đã có trong dictionary, trả index cũ và `i`.
4. Nếu chưa thấy, lưu `numbers[i] -> i`.
5. Quan trọng: kiểm tra complement **trước khi insert current** để không dùng cùng một phần tử hai lần.

**Invariant:** trước mỗi iteration, dictionary chỉ chứa các index nhỏ hơn `i`.

## Thuật toán từng bước: frequency counting

1. Duyệt dữ liệu, tăng `count[key]`; key mới bắt đầu từ 1.
2. Duyệt lại theo thứ tự gốc nếu output phụ thuộc thứ tự.
3. Đọc count để tìm phần tử đầu tiên duy nhất, majority hoặc bucket theo tần suất.
4. Nếu đang dùng sliding window, giảm count khi phần tử rời cửa sổ và có thể xóa key khi count bằng 0.

## Độ phức tạp

| Bài toán | Thời gian trung bình | Worst case lý thuyết | Bộ nhớ phụ |
|---|---:|---:|---:|
| Two Sum hash map | `O(n)` | `O(n²)` nếu collision cực xấu | `O(n)` |
| Đếm tần suất | `O(n)` | `O(n²)` lý thuyết | `O(k)` |
| HashSet duplicate | `O(n)` | `O(n²)` lý thuyết | `O(k)` |

`k` là số key khác nhau. Với comparer/hash chuẩn của .NET, ta thường báo average `O(n)` và nói rõ giả định.

## C# 12 sample hoàn chỉnh

```csharp
using System;
using System.Collections.Generic;

public static class Program
{
    public static (int First, int Second)? TwoSum(int[] numbers, int target)
    {
        var indexByValue = new Dictionary<int, int>();

        for (int i = 0; i < numbers.Length; i++)
        {
            long complement = (long)target - numbers[i];
            if (complement >= int.MinValue && complement <= int.MaxValue &&
                indexByValue.TryGetValue((int)complement, out int firstIndex))
            {
                return (firstIndex, i);
            }

            // Giữ index đầu tiên; đáp án nào hợp lệ cũng được trong ví dụ này.
            indexByValue.TryAdd(numbers[i], i);
        }

        return null;
    }

    public static Dictionary<T, int> CountFrequencies<T>(IEnumerable<T> items)
        where T : notnull
    {
        var counts = new Dictionary<T, int>();
        foreach (T item in items)
        {
            counts[item] = counts.GetValueOrDefault(item) + 1;
        }

        return counts;
    }

    public static char? FirstUniqueCharacter(string text)
    {
        Dictionary<char, int> counts = CountFrequencies(text);
        foreach (char character in text)
        {
            if (counts[character] == 1)
            {
                return character;
            }
        }

        return null;
    }

    // Phiên bản này định nghĩa anagram theo char UTF-16, phân biệt hoa thường.
    public static bool AreAnagrams(string first, string second)
    {
        if (first.Length != second.Length)
        {
            return false;
        }

        var balance = new Dictionary<char, int>();
        foreach (char character in first)
        {
            balance[character] = balance.GetValueOrDefault(character) + 1;
        }

        foreach (char character in second)
        {
            if (!balance.TryGetValue(character, out int count))
            {
                return false;
            }

            if (count == 1)
            {
                balance.Remove(character);
            }
            else
            {
                balance[character] = count - 1;
            }
        }

        return balance.Count == 0;
    }

    public static void Main()
    {
        int[] values = [2, 7, 11, 15];
        var pair = TwoSum(values, 9);
        Console.WriteLine(pair is null ? "Not found" : $"{pair.Value.First}, {pair.Value.Second}");

        Console.WriteLine(FirstUniqueCharacter("swiss")); // w
        Console.WriteLine(AreAnagrams("listen", "silent")); // True
    }
}
```

## Dry run: Two Sum

Đầu vào `[3,2,4]`, target `6`:

| `i` | Giá trị | Complement | Map trước bước | Kết quả |
|---:|---:|---:|---|---|
| 0 | 3 | 3 | `{}` | Chưa có; thêm `3 -> 0` |
| 1 | 2 | 4 | `{3:0}` | Chưa có; thêm `2 -> 1` |
| 2 | 4 | 2 | `{3:0, 2:1}` | Thấy `2`; trả `(1,2)` |

Với `[3,3]`, target `6`, bước đầu chỉ lưu index 0; bước thứ hai mới tìm thấy complement, nên không tái sử dụng cùng index.

## Lỗi thường gặp

- Insert current trước khi lookup trong Two Sum, rồi trả cùng một index hai lần.
- Dùng `dictionary[key]` để kiểm tra tồn tại và gặp `KeyNotFoundException`; dùng `TryGetValue`.
- Quên duplicate: gán index mới có thể thay đổi đáp án kỳ vọng.
- Không giảm/xóa frequency khi phần tử rời sliding window.
- Cho rằng dictionary có iteration order phục vụ logic thuật toán; đừng dựa vào thứ tự trừ khi contract bảo đảm và đó thật sự là yêu cầu phù hợp.
- Viết `Equals` mà không viết `GetHashCode` nhất quán cho custom key.
- Thay đổi key sau khi insert, khiến không lookup được bucket cũ.
- Dùng key chuỗi nối mơ hồ, ví dụ `"1,23"` và `"12,3"` nếu delimiter/escaping không chặt.
- Tuyên bố worst-case `O(1)` thay vì average `O(1)`.

## Ứng dụng thực tế

- Index và cache theo ID, deduplication request/event.
- Đếm lượt xem, từ khóa, lỗi theo mã, histogram.
- Join hai tập dữ liệu in-memory theo key.
- Idempotency key để ngăn xử lý request lặp.
- Memoization kết quả tính toán đắt đỏ.
- Phát hiện fraud/anomaly dựa trên frequency trong một khoảng.

Trong production, cần cân nhắc giới hạn bộ nhớ, eviction, concurrency và hash-flooding từ input không tin cậy. `Dictionary` thường không an toàn cho concurrent writes; dùng đồng bộ hoặc `ConcurrentDictionary` khi phù hợp.

## Câu hỏi phỏng vấn tự luyện

1. Contains Duplicate và Contains Duplicate II.
2. Group Anagrams; so sánh key sort với key frequency.
3. Top K Frequent Elements bằng heap hoặc bucket sort.
4. Longest Consecutive Sequence trong `O(n)` trung bình.
5. Subarray Sum Equals K bằng prefix-frequency map.
6. Isomorphic Strings/Bijection cần một hay hai map?
7. LRU Cache cần kết hợp hash map với cấu trúc nào?
8. Điều kiện của `Equals` và `GetHashCode` là gì?

## Checklist

- [ ] Tôi chọn đúng `HashSet` hay `Dictionary`.
- [ ] Tôi nêu rõ thao tác `O(1)` là trung bình/amortized.
- [ ] Tôi thiết kế key không mơ hồ và không mutable.
- [ ] Tôi xử lý duplicate, missing key và count về 0.
- [ ] Tôi dùng `TryGetValue`, `TryAdd` hoặc `GetValueOrDefault` phù hợp.
- [ ] Tôi xác nhận case sensitivity, alphabet và output order.
- [ ] Tôi giải thích trade-off `O(n)` memory để lấy `O(n)` time.
- [ ] Tôi có thể code Two Sum và frequency map sạch trong 10 phút.

