package course.resilience;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import org.junit.jupiter.api.Test;

class ResilienceDemoTest {
    @Test
    void circuitOpensRejectsThenClosesAfterSuccessfulProbe() {
        long[] now = { 0L };
        var breaker = new ResilienceDemo.CircuitBreaker(2, Duration.ofSeconds(5), () -> now[0]);

        assertThrows(IllegalStateException.class,
            () -> breaker.execute(() -> { throw new IllegalStateException("first"); }));
        assertThrows(IllegalStateException.class,
            () -> breaker.execute(() -> { throw new IllegalStateException("second"); }));
        assertEquals(ResilienceDemo.CircuitBreaker.State.OPEN, breaker.state());
        assertThrows(ResilienceDemo.CircuitBreaker.CallNotPermittedException.class,
            () -> breaker.execute(() -> "must not run"));

        now[0] += Duration.ofSeconds(5).toNanos();
        assertEquals("recovered", breaker.execute(() -> "recovered"));
        assertEquals(ResilienceDemo.CircuitBreaker.State.CLOSED, breaker.state());
    }

    @Test
    void tokenBucketAllowsBurstThenRefillsFromMonotonicClock() {
        long[] now = { 0L };
        var bucket = new ResilienceDemo.TokenBucket(2, 1, () -> now[0]);

        assertTrue(bucket.tryAcquire());
        assertTrue(bucket.tryAcquire());
        assertFalse(bucket.tryAcquire());
        now[0] += Duration.ofSeconds(1).toNanos();
        assertTrue(bucket.tryAcquire());
    }

    @Test
    void cacheStartsTtlAfterSlowLoadAndKeepsAnApproximateBound() {
        long[] now = { 0L };
        int[] loads = { 0 };
        var cache = new ResilienceDemo.TtlCache<String, String>(() -> now[0], 2);

        assertEquals("value-1", cache.get("a", Duration.ofSeconds(5), key -> {
            now[0] += Duration.ofSeconds(10).toNanos();
            return "value-" + ++loads[0];
        }));
        assertEquals("value-1", cache.get("a", Duration.ofSeconds(5), key -> "unexpected"));
        cache.get("b", Duration.ofSeconds(5), key -> "b");
        cache.get("c", Duration.ofSeconds(5), key -> "c");
        assertTrue(cache.size() <= 2);
    }

    @Test
    void tokenBucketRejectsInvalidConfiguration() {
        assertThrows(IllegalArgumentException.class,
            () -> new ResilienceDemo.TokenBucket(1, Double.NaN, System::nanoTime));
    }
}
