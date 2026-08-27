using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Collections.Immutable;

static class Program
{
    public static void Main()
    {
        // IEnumerable<out T> is covariant; ICollection<T> stays invariant because it consumes T.
        IEnumerable<int> source = [1, 2, 3];
        var snapshot = source.ToImmutableArray();
        var hits = new ConcurrentDictionary<string, int>();
        foreach (var key in new[] { "java", "csharp", "java" })
            hits.AddOrUpdate(key, 1, (_, old) => old + 1);
        Console.WriteLine($"{string.Join(',', snapshot)}; java={hits["java"]}");
    }
}
