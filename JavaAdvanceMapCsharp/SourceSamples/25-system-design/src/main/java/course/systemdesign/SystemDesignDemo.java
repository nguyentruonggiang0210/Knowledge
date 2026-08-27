package course.systemdesign;

public final class SystemDesignDemo {
    record Traffic(long dailyRequests, double peakFactor, int payloadBytes, double meanTimeInSystemSeconds) {
        Traffic {
            if (dailyRequests < 0 || peakFactor < 1 || payloadBytes < 0 || meanTimeInSystemSeconds < 0)
                throw new IllegalArgumentException("invalid sizing input");
        }
        double averageQps() { return dailyRequests / 86_400d; }
        double peakQps() { return averageQps() * peakFactor; }
        // Little's Law uses mean time in system under a stable-state assumption, not p99 latency.
        double approximateMeanConcurrencyAtPeakRate() { return peakQps() * meanTimeInSystemSeconds; }
        double peakMegabytesPerSecond() { return peakQps() * payloadBytes / 1_000_000d; }
    }

    public static void main(String[] args) {
        var traffic = new Traffic(100_000_000, 8, 1_200, 0.08);
        System.out.printf("average=%.0f qps, peak=%.0f qps, mean-concurrency-at-peak~%.0f, bandwidth=%.1f MB/s%n",
            traffic.averageQps(), traffic.peakQps(), traffic.approximateMeanConcurrencyAtPeakRate(), traffic.peakMegabytesPerSecond());
        System.out.println("Little's Law uses mean time; size tail/headroom with measured distributions and load tests.");
    }
}
