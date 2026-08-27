# 33. Dynamic Programming trên String

## Mục tiêu

- Thiết kế state 2D cho hai chuỗi hoặc hai biên của một chuỗi.
- Giải LCS, edit distance, palindrome và word break.
- Tối ưu memory khi transition chỉ phụ thuộc hàng trước.

## Ba họ state thường gặp

1. **Hai prefix:** `dp[i,j]` là đáp án cho `a[0..i)` và `b[0..j)` — LCS, edit distance.
2. **Một interval:** `dp[left,right]` mô tả substring — palindrome/interval DP.
3. **Một prefix + split:** `dp[i]` cho prefix độ dài `i`, thử mọi điểm cắt — word break.

Phải phát biểu state bằng câu hoàn chỉnh trước khi viết recurrence.

## C# 12 sample: Edit Distance

```csharp
using System;
using System.Collections.Generic;

public static class StringDynamicProgramming
{
    public static int EditDistance(string source, string target)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(target);

        var dp = new int[source.Length + 1, target.Length + 1];
        for (int i = 0; i <= source.Length; i++) dp[i, 0] = i;
        for (int j = 0; j <= target.Length; j++) dp[0, j] = j;

        for (int i = 1; i <= source.Length; i++)
        for (int j = 1; j <= target.Length; j++)
        {
            if (source[i - 1] == target[j - 1])
            {
                dp[i, j] = dp[i - 1, j - 1];
            }
            else
            {
                int delete = dp[i - 1, j];
                int insert = dp[i, j - 1];
                int replace = dp[i - 1, j - 1];
                dp[i, j] = 1 + Math.Min(delete, Math.Min(insert, replace));
            }
        }
        return dp[source.Length, target.Length];
    }

    public static string LongestCommonSubsequence(string first, string second)
    {
        ArgumentNullException.ThrowIfNull(first);
        ArgumentNullException.ThrowIfNull(second);

        var dp = new int[first.Length + 1, second.Length + 1];
        for (int i = 1; i <= first.Length; i++)
        for (int j = 1; j <= second.Length; j++)
            dp[i, j] = first[i - 1] == second[j - 1]
                ? dp[i - 1, j - 1] + 1
                : Math.Max(dp[i - 1, j], dp[i, j - 1]);

        var answer = new char[dp[first.Length, second.Length]];
        int row = first.Length, column = second.Length, write = answer.Length;
        while (row > 0 && column > 0)
        {
            if (first[row - 1] == second[column - 1])
            {
                answer[--write] = first[row - 1];
                row--;
                column--;
            }
            else if (dp[row - 1, column] >= dp[row, column - 1])
            {
                row--;
            }
            else
            {
                column--;
            }
        }
        return new string(answer);
    }

    public static int LongestPalindromicSubsequence(string text)
    {
        ArgumentNullException.ThrowIfNull(text);
        if (text.Length == 0) return 0;

        var dp = new int[text.Length, text.Length];
        for (int left = text.Length - 1; left >= 0; left--)
        {
            dp[left, left] = 1;
            for (int right = left + 1; right < text.Length; right++)
                dp[left, right] = text[left] == text[right]
                    ? 2 + (left + 1 < right ? dp[left + 1, right - 1] : 0)
                    : Math.Max(dp[left + 1, right], dp[left, right - 1]);
        }
        return dp[0, text.Length - 1];
    }

    public static bool CanWordBreak(string text, IReadOnlyCollection<string> words)
    {
        ArgumentNullException.ThrowIfNull(text);
        ArgumentNullException.ThrowIfNull(words);
        var reachable = new bool[text.Length + 1];
        reachable[0] = true;

        for (int start = 0; start < text.Length; start++)
        {
            if (!reachable[start]) continue;
            foreach (string word in words)
            {
                if (word is null)
                    throw new ArgumentException("Dictionary words must be non-null.", nameof(words));
                if (word.Length <= text.Length - start &&
                    text.AsSpan(start, word.Length).SequenceEqual(word.AsSpan()))
                    reachable[start + word.Length] = true;
            }
        }
        return reachable[text.Length];
    }
}
```

## Dry run

`horse → ros` cần 3 phép: replace `h→r`, delete một `r`, delete `e`. Base row/column biểu diễn biến chuỗi rỗng thành prefix bằng toàn insert/delete.

## Correctness trực giác

Xét thao tác cuối cùng của lời giải tối ưu. Nếu hai ký tự cuối bằng nhau, không cần thao tác và lùi cả hai. Nếu khác, thao tác cuối chỉ có thể là insert, delete hoặc replace; lấy min của ba bài con bao phủ mọi khả năng.

## Độ phức tạp

Edit distance và LCS: `O(mn)` time/memory. Longest palindromic subsequence: `O(n²)` time/memory. `CanWordBreak` duyệt mỗi reachable start qua toàn bộ từ điển và so ký tự, nên `O(n·(W+S))` với `W` là số từ và `S` là tổng độ dài các từ, memory `O(n)`. Chỉ cần LCS length/edit distance có thể dùng hai hàng `O(min(m,n))`; muốn reconstruct thường cần bảng/parent metadata hay kỹ thuật phức tạp hơn.

## Ứng dụng thực tế

- Diff/fuzzy match, typo correction và entity matching.
- LCS cho so sánh phiên bản/diff ở mức khái niệm.
- Word segmentation khi xử lý text không có khoảng trắng.

## Lỗi thường gặp

- State mơ hồ dẫn đến lệch index `i-1`/`j-1`.
- Base cases không đủ cho chuỗi rỗng.
- Tối ưu xuống một hàng nhưng update sai hướng/làm mất giá trị diagonal.
- Nhầm substring liên tiếp với subsequence.

## Câu hỏi phỏng vấn

1. Longest Common Subsequence.
2. Edit Distance và reconstruct operations.
3. Longest Palindromic Subsequence/Substring.
4. Word Break I/II.

## Checklist

- [ ] Viết state bằng lời.
- [ ] Suy recurrence từ lựa chọn cuối.
- [ ] Vẽ bảng và base row/column.
- [ ] Biết trade-off memory/reconstruction.
