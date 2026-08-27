using System;

sealed class DemoResource(string name) : IDisposable
{
    public void Use() => Console.WriteLine($"using {name}");
    public void Dispose() => Console.WriteLine($"closing {name}");
}

static class Program
{
    public static void Main()
    {
        try
        {
            using var first = new DemoResource("first");
            using var second = new DemoResource("second");
            first.Use(); second.Use();
            throw new InvalidOperationException("operation failed");
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.Message);
            // Use `throw;` inside a catch to preserve stack; `throw ex;` resets its origin.
        }
    }
}
