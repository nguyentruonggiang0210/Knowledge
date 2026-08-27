package course.spring;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class OrderServiceTest {
    private final OrderService service = new OrderService(
        Clock.fixed(Instant.parse("2026-08-27T00:00:00Z"), ZoneOffset.UTC));

    @Test void sameRequestAndPayloadIsIdempotent() {
        var first = service.create("REQ-1", new BigDecimal("10.00"));
        var retry = service.create("REQ-1", new BigDecimal("10.0"));
        assertSame(first, retry);
    }

    @Test void sameKeyWithDifferentPayloadConflicts() {
        service.create("REQ-2", BigDecimal.TEN);
        var error = assertThrows(OrderService.IdempotencyConflict.class,
            () -> service.create("REQ-2", new BigDecimal("11")));
        assertEquals("requestId was already used with a different payload", error.getMessage());
    }

    @Test void internalBoundaryRejectsNullAndNegativeTotal() {
        assertThrows(NullPointerException.class, () -> service.create("REQ-3", null));
        assertThrows(IllegalArgumentException.class,
            () -> service.create("REQ-3", new BigDecimal("-0.01")));
    }
}
