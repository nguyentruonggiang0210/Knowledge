package course.testing;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class PriceCalculatorTest {
    private final Clock clock = Clock.fixed(Instant.parse("2026-08-01T00:00:00Z"), ZoneOffset.UTC);
    private final PriceCalculator calculator = new PriceCalculator(clock);

    @Test void calculatesMoneyWithExplicitRounding() {
        assertEquals(new BigDecimal("90.00"), calculator.finalPrice(new BigDecimal("100.00"), new BigDecimal("10")));
    }

    @Test void rejectsInvalidDiscount() {
        assertThrows(IllegalArgumentException.class,
            () -> calculator.finalPrice(BigDecimal.TEN, new BigDecimal("101")));
    }

    @Test void timeDependentRuleIsDeterministic() {
        assertTrue(calculator.isCampaignDay());
    }
}
