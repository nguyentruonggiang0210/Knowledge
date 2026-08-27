# 31. String Matching: KMP và Rabin–Karp

## Mục tiêu

- Tìm pattern trong text tuyến tính bằng KMP.
- Hiểu prefix function/LPS và không lùi con trỏ text.
- Biết rolling hash của Rabin–Karp cần xác minh collision.

## Khi dùng

Built-in `IndexOf` là lựa chọn production tốt cho tìm kiếm thông thường. Phỏng vấn hỏi KMP/Rabin–Karp để kiểm tra invariant, preprocessing và trade-off; chúng hữu ích khi cần kiểm soát thuật toán hoặc tìm nhiều pattern/window hash.

## KMP trực giác

`lps[i]` là độ dài proper prefix dài nhất của `pattern[0..i]` đồng thời là suffix. Khi mismatch tại pattern index `j`, thử lại từ `lps[j-1]` thay vì bỏ thông tin và lùi text.

## C# 12 sample: KMP

```csharp
using System;

public static class StringMatching
{
    public static int KmpIndexOf(string text, string pattern)
    {
        ArgumentNullException.ThrowIfNull(text);
        ArgumentNullException.ThrowIfNull(pattern);
        if (pattern.Length == 0) return 0;

        int[] lps = BuildLps(pattern);
        int i = 0, j = 0;
        while (i < text.Length)
        {
            if (text[i] == pattern[j])
            {
                i++;
                if (++j == pattern.Length) return i - j;
            }
            else if (j > 0)
            {
                j = lps[j - 1];
            }
            else
            {
                i++;
            }
        }
        return -1;
    }

    private static int[] BuildLps(string pattern)
    {
        var lps = new int[pattern.Length];
        for (int i = 1, length = 0; i < pattern.Length;)
        {
            if (pattern[i] == pattern[length]) lps[i++] = ++length;
            else if (length > 0) length = lps[length - 1];
            else lps[i++] = 0;
        }
        return lps;
    }
}
```

## Dry run

Pattern `ababaca` có LPS `[0,0,1,2,3,0,1]`. Khi đã match `ababa` rồi mismatch, KMP biết suffix `aba` cũng là prefix và tiếp tục từ đó.

## Độ phức tạp

Build LPS `O(m)`, scan `O(n)`, memory `O(m)`. Mỗi con trỏ không gây lặp bậc hai vì tổng số lần tăng/giảm hữu hạn tuyến tính.

## Rabin–Karp

Hash pattern và từng window độ dài `m`; cập nhật hash khi bỏ ký tự trái/thêm ký tự phải. Expected `O(n+m)`, worst `O(nm)` nếu nhiều collision. **Hash bằng nhau phải so sánh chuỗi thật** hoặc dùng double hash khi xác suất được chấp nhận.

### C# 12 sample: Rabin–Karp có xác minh collision

Khối dưới đây chạy độc lập. Hash chỉ dùng để lọc ứng viên; `SequenceEqual` mới là bước xác nhận kết quả, vì hai chuỗi khác nhau vẫn có thể trùng hash.

```csharp
#nullable enable
using System;

public static class RabinKarp
{
    private const long Modulus = 1_000_000_007;
    private const long AlphabetBase = 257;

    public static int IndexOf(string text, string pattern)
    {
        ArgumentNullException.ThrowIfNull(text);
        ArgumentNullException.ThrowIfNull(pattern);

        int patternLength = pattern.Length;
        if (patternLength == 0)
        {
            return 0;
        }

        if (patternLength > text.Length)
        {
            return -1;
        }

        long highestPower = 1;
        for (int i = 1; i < patternLength; i++)
        {
            highestPower = highestPower * AlphabetBase % Modulus;
        }

        long patternHash = 0;
        long windowHash = 0;
        for (int i = 0; i < patternLength; i++)
        {
            patternHash = (patternHash * AlphabetBase + pattern[i]) % Modulus;
            windowHash = (windowHash * AlphabetBase + text[i]) % Modulus;
        }

        int lastStart = text.Length - patternLength;
        for (int start = 0; start <= lastStart; start++)
        {
            // Không được trả kết quả chỉ vì hash bằng nhau.
            if (windowHash == patternHash &&
                text.AsSpan(start, patternLength).SequenceEqual(pattern.AsSpan()))
            {
                return start;
            }

            if (start == lastStart)
            {
                break;
            }

            long outgoing = text[start] * highestPower % Modulus;
            windowHash = (windowHash - outgoing + Modulus) % Modulus;
            windowHash =
                (windowHash * AlphabetBase + text[start + patternLength]) % Modulus;
        }

        return -1;
    }
}

public static class Program
{
    public static void Main()
    {
        Console.WriteLine(RabinKarp.IndexOf("abracadabra", "cada")); // 4
        Console.WriteLine(RabinKarp.IndexOf("aaaaa", "bba"));       // -1
        Console.WriteLine(RabinKarp.IndexOf("abc", ""));            // 0
    }
}
```

Ở mỗi lần trượt, ký tự trái đóng góp `text[start] * base^(m-1)` nên được trừ trước; sau đó hash được nhân `base` và cộng ký tự mới. Cộng `Modulus` trước phép `%` tránh hash âm trong C#.

## C# và Unicode

`char` là UTF-16 code unit, không đảm bảo là một Unicode scalar/grapheme hoàn chỉnh. Nếu đề nói ký tự ASCII/lowercase thì nêu giả định; production text có thể cần `Rune` và normalization.

## Ứng dụng thực tế

- Search trong log/text và phát hiện signature.
- Plagiarism/duplicate chunks bằng rolling hash.
- KMP state dùng trong stream vì không cần giữ lại toàn bộ text.

## Lỗi thường gặp

- Xây LPS sai khi mismatch lồng nhau.
- Quên pattern rỗng.
- Coi rolling hash là bằng chứng tuyệt đối.
- Cập nhật rolling hash sai thứ tự hoặc quên chuẩn hóa số âm sau phép trừ.
- Dùng số học không đủ rộng làm overflow trước khi lấy modulo.
- Không nói rõ Unicode/case sensitivity.

## Câu hỏi phỏng vấn

1. Implement `strStr` bằng KMP.
2. Repeated Substring Pattern dùng LPS.
3. Longest Happy Prefix.
4. Tìm nhiều pattern: khi nào cân nhắc trie/Aho–Corasick?

## Checklist

- [ ] Giải thích ý nghĩa LPS bằng lời.
- [ ] Code KMP không lùi `i`.
- [ ] Nêu collision của rolling hash.
- [ ] Chốt giả định encoding.
