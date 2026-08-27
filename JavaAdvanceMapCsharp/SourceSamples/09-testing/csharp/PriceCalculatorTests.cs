using System;
using Xunit;

public sealed class PriceCalculatorTests
{
    [Fact]
    public void CalculatesMoneyWithDecimal() => Assert.Equal(90.00m, 100.00m * (1m - 10m / 100m));

    [Fact]
    public void TimeShouldBeInjected()
    {
        TimeProvider clock = new FakeTimeProvider(new DateTimeOffset(2026, 8, 1, 0, 0, 0, TimeSpan.Zero));
        Assert.Equal(1, clock.GetUtcNow().Day);
    }
}

// Minimal fake; production tests can use Microsoft.Extensions.TimeProvider.Testing.
sealed class FakeTimeProvider(DateTimeOffset now) : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => now;
}
