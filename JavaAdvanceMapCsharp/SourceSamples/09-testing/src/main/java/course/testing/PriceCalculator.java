package course.testing;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;

public final class PriceCalculator {
    private final Clock clock;
    public PriceCalculator(Clock clock) { this.clock = clock; }

    public BigDecimal finalPrice(BigDecimal price, BigDecimal discountPercent) {
        if (price.signum() < 0) throw new IllegalArgumentException("negative price");
        if (discountPercent.signum() < 0 || discountPercent.compareTo(new BigDecimal("100")) > 0)
            throw new IllegalArgumentException("discount outside 0..100");
        var multiplier = BigDecimal.ONE.subtract(discountPercent.movePointLeft(2));
        return price.multiply(multiplier).setScale(2, RoundingMode.HALF_EVEN);
    }

    public boolean isCampaignDay() {
        return LocalDate.now(clock).getDayOfMonth() == 1;
    }
}
