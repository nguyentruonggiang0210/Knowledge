package course.concurrencydeep;

import java.time.Duration;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.LongAdder;

public final class ConcurrencyDeepDemo {
    private static final class Configuration {
        final String endpoint;
        Configuration(String endpoint) { this.endpoint = endpoint; }
    }

    // Volatile makes the reference publication visible and ordered for readers.
    private static volatile Configuration configuration;

    static Configuration configuration() {
        var current = configuration;
        if (current == null) {
            synchronized (ConcurrencyDeepDemo.class) {
                current = configuration;
                if (current == null) configuration = current = new Configuration("https://example.invalid");
            }
        }
        return current;
    }

    public static void main(String[] args) throws InterruptedException {
        var completed = new LongAdder();
        var done = new CountDownLatch(8);
        var executor = new ThreadPoolExecutor(
            2, 2, 0, TimeUnit.MILLISECONDS,
            new ArrayBlockingQueue<>(2),
            Thread.ofPlatform().name("bounded-worker-", 0).factory(),
            new ThreadPoolExecutor.CallerRunsPolicy()); // deliberate backpressure to submitter

        try {
            for (int i = 0; i < 8; i++) {
                int task = i;
                executor.execute(() -> {
                    try {
                        Thread.sleep(Duration.ofMillis(25));
                        completed.increment();
                        System.out.println("task=" + task + " thread=" + Thread.currentThread().getName());
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    } finally {
                        done.countDown();
                    }
                });
            }
            if (!done.await(2, TimeUnit.SECONDS)) throw new IllegalStateException("deadline exceeded");
            System.out.println("completed=" + completed.sum() + ", endpoint=" + configuration().endpoint);
        } finally {
            executor.shutdown();
            if (!executor.awaitTermination(1, TimeUnit.SECONDS)) executor.shutdownNow();
        }
    }
}
