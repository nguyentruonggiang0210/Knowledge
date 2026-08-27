package course.resilience;

import java.time.Duration;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.function.LongSupplier;
import java.util.function.Supplier;

public final class ResilienceDemo {
    record Entry<V>(V value, long expiresAtNanos) { }

    static final class TtlCache<K, V> {
        private final Map<K, Entry<V>> data = new ConcurrentHashMap<>();
        private final LongSupplier nanoTime;
        private final int maxEntries;

        TtlCache(LongSupplier nanoTime, int maxEntries) {
            if (maxEntries < 1) throw new IllegalArgumentException("maxEntries must be positive");
            this.nanoTime = Objects.requireNonNull(nanoTime, "nanoTime");
            this.maxEntries = maxEntries;
        }

        V get(K key, Duration ttl, Function<K, V> loader) {
            Objects.requireNonNull(key, "key");
            Objects.requireNonNull(loader, "loader");
            long ttlNanos = Objects.requireNonNull(ttl, "ttl").toNanos();
            if (ttlNanos <= 0) throw new IllegalArgumentException("ttl must be positive");
            Entry<V> result = data.compute(key, (ignored, entry) -> {
                // Read time after acquiring compute's per-bin coordination; a caller may have waited longer than TTL.
                long checkedAt = nanoTime.getAsLong();
                if (entry == null || entry.expiresAtNanos() <= checkedAt) {
                    V value = Objects.requireNonNull(loader.apply(key), "loader result");
                    // TTL begins after a successful load, so a slow loader does not return an already-expired value.
                    return new Entry<>(value, Math.addExact(nanoTime.getAsLong(), ttlNanos));
                }
                return entry;
            });
            enforceApproximateBound(nanoTime.getAsLong());
            return result.value();
        }

        int size() { return data.size(); }

        private void enforceApproximateBound(long now) {
            data.entrySet().removeIf(entry -> entry.getValue().expiresAtNanos() <= now);
            while (data.size() > maxEntries) {
                var earliest = data.entrySet().stream()
                    .min(Map.Entry.comparingByValue((left, right) ->
                        Long.compare(left.expiresAtNanos(), right.expiresAtNanos())))
                    .orElse(null);
                if (earliest == null || !data.remove(earliest.getKey(), earliest.getValue())) break;
            }
        }
    }

    static final class TokenBucket {
        private final long capacity;
        private final double refillPerNano;
        private final LongSupplier nanoTime;
        private double tokens;
        private long lastRefill;

        TokenBucket(long capacity, double tokensPerSecond, LongSupplier nanoTime) {
            if (capacity < 1) throw new IllegalArgumentException("capacity must be positive");
            if (!Double.isFinite(tokensPerSecond) || tokensPerSecond <= 0)
                throw new IllegalArgumentException("tokensPerSecond must be finite and positive");
            this.capacity = capacity; this.tokens = capacity;
            this.refillPerNano = tokensPerSecond / 1_000_000_000d;
            this.nanoTime = Objects.requireNonNull(nanoTime, "nanoTime");
            this.lastRefill = nanoTime.getAsLong();
        }

        synchronized boolean tryAcquire() {
            long now = nanoTime.getAsLong();
            tokens = Math.min(capacity, tokens + Math.max(0, now - lastRefill) * refillPerNano);
            lastRefill = now;
            if (tokens < 1) return false;
            tokens -= 1; return true;
        }
    }

    /**
     * A deliberately small state-machine demo. Production breakers normally use a rolling
     * failure/slow-call window, exception classification, metrics and a proven library.
     */
    static final class CircuitBreaker {
        enum State { CLOSED, OPEN, HALF_OPEN }

        static final class CallNotPermittedException extends RuntimeException {
            CallNotPermittedException() { super("circuit breaker is open"); }
        }

        private final int failureThreshold;
        private final long openDurationNanos;
        private final LongSupplier nanoTime;
        private State state = State.CLOSED;
        private int consecutiveFailures;
        private long openedAtNanos;
        private boolean halfOpenTrialInFlight;

        CircuitBreaker(int failureThreshold, Duration openDuration, LongSupplier nanoTime) {
            if (failureThreshold < 1) throw new IllegalArgumentException("failureThreshold must be positive");
            if (openDuration.isZero() || openDuration.isNegative())
                throw new IllegalArgumentException("openDuration must be positive");
            this.failureThreshold = failureThreshold;
            this.openDurationNanos = openDuration.toNanos();
            this.nanoTime = nanoTime;
        }

        <T> T execute(Supplier<T> operation) {
            beforeCall();
            try {
                T result = operation.get();
                onSuccess();
                return result;
            } catch (RuntimeException failure) {
                onFailure();
                throw failure;
            }
        }

        synchronized State state() { return state; }

        private synchronized void beforeCall() {
            if (state == State.OPEN) {
                if (nanoTime.getAsLong() - openedAtNanos < openDurationNanos)
                    throw new CallNotPermittedException();
                state = State.HALF_OPEN;
                halfOpenTrialInFlight = true;
                return;
            }
            if (state == State.HALF_OPEN) {
                if (halfOpenTrialInFlight) throw new CallNotPermittedException();
                halfOpenTrialInFlight = true;
            }
        }

        private synchronized void onSuccess() {
            consecutiveFailures = 0;
            if (state == State.HALF_OPEN) {
                state = State.CLOSED;
                halfOpenTrialInFlight = false;
            }
        }

        private synchronized void onFailure() {
            if (state == State.HALF_OPEN || ++consecutiveFailures >= failureThreshold) {
                state = State.OPEN;
                openedAtNanos = nanoTime.getAsLong();
                halfOpenTrialInFlight = false;
            }
        }
    }

    public static void main(String[] args) {
        var cache = new TtlCache<String, String>(System::nanoTime, 100);
        var loads = new int[] { 0 };
        System.out.println(cache.get("order:42", Duration.ofSeconds(1), key -> "value-load-" + ++loads[0]));
        System.out.println(cache.get("order:42", Duration.ofSeconds(1), key -> "value-load-" + ++loads[0]));
        System.out.println("loader calls=" + loads[0] + " (single-flight per key in this process)");

        var bucket = new TokenBucket(2, 1, System::nanoTime);
        System.out.println("admission=" + bucket.tryAcquire() + "," + bucket.tryAcquire() + "," + bucket.tryAcquire());

        long[] clock = { 0L };
        var breaker = new CircuitBreaker(2, Duration.ofSeconds(5), () -> clock[0]);
        for (int attempt = 0; attempt < 2; attempt++) {
            try { breaker.execute(() -> { throw new IllegalStateException("dependency unavailable"); }); }
            catch (IllegalStateException ignored) { /* expected in this failure simulation */ }
        }
        System.out.println("after failures=" + breaker.state());
        try { breaker.execute(() -> "not called"); }
        catch (CircuitBreaker.CallNotPermittedException ignored) { System.out.println("open call rejected"); }
        clock[0] += Duration.ofSeconds(5).toNanos();
        System.out.println("half-open result=" + breaker.execute(() -> "recovered") + ", state=" + breaker.state());
    }
}
