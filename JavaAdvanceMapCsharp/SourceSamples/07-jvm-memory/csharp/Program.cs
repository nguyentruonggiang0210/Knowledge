using System;
using System.Collections.Generic;

static class Program
{
    public static void Main()
    {
        // .NET GC and JVM GC share managed-memory ideas, but diagnostics/tuning are not interchangeable.
        var bounded = new Dictionary<int, byte[]>();
        for (var i = 0; i < 10_000; i++)
        {
            bounded[i] = new byte[1024];
            if (bounded.Count > 100) bounded.Remove(i - 100);
        }
        Console.WriteLine($"entries={bounded.Count}, managed={GC.GetTotalMemory(false)}");
    }
}
