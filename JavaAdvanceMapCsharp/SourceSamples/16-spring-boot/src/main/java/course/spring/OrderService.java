package course.spring;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;

@Service
public final class OrderService {
    public record Order(String id, String requestId, BigDecimal total, Instant createdAt) { }
    public static final class IdempotencyConflict extends RuntimeException {
        public IdempotencyConflict(String message) { super(message); }
    }

    private final ConcurrentHashMap<String, Order> byRequest = new ConcurrentHashMap<>();
    private final AtomicLong sequence = new AtomicLong();
    private final Clock clock;

    public OrderService(Clock clock) { this.clock = Objects.requireNonNull(clock, "clock"); }

    public Order create(String requestId, BigDecimal total) {
        if (requestId == null || requestId.isBlank()) throw new IllegalArgumentException("requestId required");
        Objects.requireNonNull(total, "total");
        if (total.signum() < 0) throw new IllegalArgumentException("total must not be negative");
        return byRequest.compute(requestId, (key, existing) -> {
            if (existing == null)
                return new Order("ORD-" + sequence.incrementAndGet(), requestId, total, clock.instant());
            if (existing.total().compareTo(total) != 0)
                throw new IdempotencyConflict("requestId was already used with a different payload");
            return existing;
        });
    }

    public Optional<Order> findByRequest(String requestId) {
        Objects.requireNonNull(requestId, "requestId");
        return Optional.ofNullable(byRequest.get(requestId));
    }
}
