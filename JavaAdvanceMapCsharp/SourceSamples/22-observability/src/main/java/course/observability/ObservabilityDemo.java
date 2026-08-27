package course.observability;

import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.LongAdder;

public final class ObservabilityDemo {
    // Teaching correlation model only; real tracing needs W3C propagation, span/parent IDs and an OTel SDK/exporter.
    record TraceContext(String traceId) {
        static TraceContext create() { return new TraceContext(UUID.randomUUID().toString().replace("-", "")); }
    }
    record MetricKey(String route, String method, String outcome) {
        private static final Set<String> ROUTES = Set.of("/orders", "/orders/{id}");
        private static final Set<String> METHODS = Set.of("GET", "POST", "PUT", "DELETE");
        private static final Set<String> OUTCOMES = Set.of("success", "client_error", "server_error");
        MetricKey {
            if (!ROUTES.contains(route)) throw new IllegalArgumentException("use route template, not raw path/user ID");
            if (!METHODS.contains(method)) throw new IllegalArgumentException("method must come from a bounded set");
            if (!OUTCOMES.contains(outcome)) throw new IllegalArgumentException("outcome must come from a bounded set");
        }
    }

    static final class Metrics {
        private final Map<MetricKey, LongAdder> requests = new ConcurrentHashMap<>();
        void record(MetricKey key) { requests.computeIfAbsent(key, ignored -> new LongAdder()).increment(); }
        Map<MetricKey, Long> snapshot() {
            return requests.entrySet().stream().collect(java.util.stream.Collectors.toUnmodifiableMap(Map.Entry::getKey, e -> e.getValue().sum()));
        }
    }

    public static void main(String[] args) throws InterruptedException {
        var trace = TraceContext.create();
        var metrics = new Metrics();
        long startedAtNanos = System.nanoTime();
        Thread.sleep(Duration.ofMillis(15));
        metrics.record(new MetricKey("/orders/{id}", "GET", "success"));
        long millis = Duration.ofNanos(System.nanoTime() - startedAtNanos).toMillis();
        System.out.printf("{\"event\":\"order.read\",\"trace_id\":\"%s\",\"outcome\":\"success\",\"duration_ms\":%d}%n", trace.traceId(), millis);
        System.out.println(metrics.snapshot());
    }
}
