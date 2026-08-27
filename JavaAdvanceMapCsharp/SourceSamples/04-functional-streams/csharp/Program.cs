using System;
using System.Linq;

record Order(string Customer, string Category, decimal Total);
static class Program
{
    public static void Main()
    {
        var orders = new[] { new Order("Ada", "book", 40m), new("Ada", "tool", 70m), new("Linus", "book", 25m) };
        var spend = orders.Where(x => x.Total >= 30m)
            .GroupBy(x => x.Customer)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Total));
        Console.WriteLine(spend["Ada"]);
        // LINQ IEnumerable is deferred too, but unlike Java Stream it may be enumerated again.
    }
}
