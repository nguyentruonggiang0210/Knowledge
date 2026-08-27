package course.messaging;

import java.math.BigDecimal;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

public final class MessagingDemo {
    record PaymentCaptured(String eventId, String orderId, BigDecimal amount) {
        PaymentCaptured {
            if (eventId == null || eventId.isBlank()) throw new IllegalArgumentException("eventId required");
            if (orderId == null || orderId.isBlank()) throw new IllegalArgumentException("orderId required");
            Objects.requireNonNull(amount, "amount");
            if (amount.signum() <= 0) throw new IllegalArgumentException("amount must be positive");
        }
    }

    static final class DuplicateEventConflict extends RuntimeException {
        DuplicateEventConflict(String message) { super(message); }
    }

    static final class IdempotentLedgerConsumer {
        private final ConcurrentHashMap<String, PaymentCaptured> inbox = new ConcurrentHashMap<>();
        private final ConcurrentHashMap<String, BigDecimal> capturedByOrder = new ConcurrentHashMap<>();

        boolean handle(PaymentCaptured event) {
            var result = new AtomicReference<>(false);
            inbox.compute(event.eventId(), (id, alreadyProcessed) -> {
                if (alreadyProcessed == null) {
                    capturedByOrder.merge(event.orderId(), event.amount(), BigDecimal::add);
                    result.set(true);
                    return event;
                }
                if (!alreadyProcessed.orderId().equals(event.orderId())
                        || alreadyProcessed.amount().compareTo(event.amount()) != 0)
                    throw new DuplicateEventConflict("same eventId arrived with a different payload");
                return alreadyProcessed;
            });
            return result.get();
        }

        BigDecimal captured(String orderId) { return capturedByOrder.getOrDefault(orderId, BigDecimal.ZERO); }
    }

    public static void main(String[] args) {
        var consumer = new IdempotentLedgerConsumer();
        var event = new PaymentCaptured("EVT-1", "ORD-42", new BigDecimal("25.00"));
        System.out.println("first delivery applied=" + consumer.handle(event));
        System.out.println("duplicate applied=" + consumer.handle(event));
        System.out.println("captured once=" + consumer.captured("ORD-42"));
        try {
            consumer.handle(new PaymentCaptured("EVT-1", "ORD-42", new BigDecimal("99.00")));
        } catch (DuplicateEventConflict conflict) {
            System.out.println("conflicting duplicate rejected=" + conflict.getMessage());
        }
        System.out.println("Production: fingerprint + inbox + side effect share one DB transaction; offsets are separate broker progress.");
    }
}
