package course.systemdesign;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class SystemDesignDemoTest {
    @Test
    void littleLawEstimateUsesMeanTimeInSystem() {
        var traffic = new SystemDesignDemo.Traffic(86_400, 10, 1_000, 0.2);

        assertEquals(10.0, traffic.peakQps());
        assertEquals(2.0, traffic.approximateMeanConcurrencyAtPeakRate());
        assertEquals(0.01, traffic.peakMegabytesPerSecond());
    }
}
