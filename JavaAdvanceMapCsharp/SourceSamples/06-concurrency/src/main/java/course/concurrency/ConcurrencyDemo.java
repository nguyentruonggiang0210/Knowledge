package course.concurrency;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.CancellationException;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

public final class ConcurrencyDemo {
    public static void main(String[] args) throws Exception {
        runBlockingIoWithVirtualThreads();
        demonstrateWrapperTimeoutDoesNotStopWork();
        demonstrateCooperativeCancellation();
    }

    private static void runBlockingIoWithVirtualThreads() throws Exception {
        var downstreamLimit = new Semaphore(3);

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var calls = List.of("catalog", "price", "stock", "shipping").stream()
                .map(name -> executor.submit(() -> call(name, downstreamLimit, Duration.ofMillis(50))))
                .toList();

            var results = new java.util.ArrayList<String>();
            for (var call : calls) results.add(call.get());
            System.out.println("virtual-thread fan-out=" + results);
        }
    }

    private static void demonstrateWrapperTimeoutDoesNotStopWork() throws InterruptedException {
        var operationExited = new CountDownLatch(1);
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var operation = CompletableFuture.supplyAsync(() -> {
                try {
                    Thread.sleep(Duration.ofMillis(150));
                    return "slow-result";
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException("unexpected interrupt", e);
                } finally {
                    System.out.println("Java underlying operation exited");
                    operationExited.countDown();
                }
            }, executor);

            try {
                operation.orTimeout(30, TimeUnit.MILLISECONDS).join();
            } catch (CompletionException expected) {
                System.out.println("Java wrapper timed out: " + expected.getCause().getClass().getSimpleName());
            }

            if (!operationExited.await(1, TimeUnit.SECONDS)) {
                throw new IllegalStateException("underlying operation did not exit");
            }
        }
    }

    private static void demonstrateCooperativeCancellation() throws InterruptedException {
        var operationExited = new CountDownLatch(1);
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var operation = executor.submit(() -> {
                try {
                    Thread.sleep(Duration.ofSeconds(5));
                } catch (InterruptedException expected) {
                    Thread.currentThread().interrupt();
                    System.out.println("Java operation observed interrupt");
                } finally {
                    operationExited.countDown();
                }
            });

            Thread.sleep(Duration.ofMillis(30));
            operation.cancel(true); // FutureTask can interrupt its running thread.
            try {
                operation.get();
            } catch (CancellationException expected) {
                System.out.println("Java Future is cancelled");
            } catch (java.util.concurrent.ExecutionException impossible) {
                throw new IllegalStateException(impossible);
            }

            if (!operationExited.await(1, TimeUnit.SECONDS)) {
                throw new IllegalStateException("cancelled operation did not clean up");
            }
        }
    }

    private static String call(String name, Semaphore limit, Duration latency) {
        boolean acquired = false;
        try {
            limit.acquire(); acquired = true;
            Thread.sleep(latency);
            return name + ":ok on " + Thread.currentThread();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("cancelled", e);
        } finally {
            if (acquired) limit.release();
        }
    }
}
