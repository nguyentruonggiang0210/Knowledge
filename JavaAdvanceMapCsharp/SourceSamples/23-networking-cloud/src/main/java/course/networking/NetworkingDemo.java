package course.networking;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

public final class NetworkingDemo {
    // JDK HttpServer keeps the request/probe semantics visible; it is not a hardened production server.
    private static final AtomicBoolean ACCEPTING_TRAFFIC = new AtomicBoolean(true);

    public static void main(String[] args) throws Exception {
        if (args.length > 0 && "--serve".equals(args[0])) {
            serveUntilShutdown();
            return;
        }
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 32);
        try (var executor = Executors.newVirtualThreadPerTaskExecutor();
             var client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(1)).executor(executor).build()) {
            server.setExecutor(executor);
            ACCEPTING_TRAFFIC.set(true);
            server.createContext("/health/ready", NetworkingDemo::ready);
            server.createContext("/health/live", NetworkingDemo::live);
            server.start();

            var request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/health/ready"))
                .timeout(Duration.ofSeconds(2)).GET().build();
            var response = client.send(request, HttpResponse.BodyHandlers.ofString());
            System.out.println("status=" + response.statusCode() + ", body=" + response.body());
        } finally {
            server.stop(1);
        }
    }

    private static void serveUntilShutdown() throws Exception {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        var server = HttpServer.create(new InetSocketAddress("0.0.0.0", port), 128);
        ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
        var stopped = new CountDownLatch(1);
        ACCEPTING_TRAFFIC.set(true);
        server.setExecutor(executor);
        server.createContext("/health/ready", NetworkingDemo::ready);
        server.createContext("/health/live", NetworkingDemo::live);
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            // Readiness goes false before draining; liveness remains true until the process exits.
            ACCEPTING_TRAFFIC.set(false);
            server.stop(5);
            executor.shutdown();
            stopped.countDown();
        }, "graceful-shutdown"));
        server.start();
        System.out.println("listening on port " + port);
        stopped.await();
    }

    private static void ready(HttpExchange exchange) throws IOException {
        if (!"GET".equals(exchange.getRequestMethod())) {
            exchange.getResponseHeaders().set("Allow", "GET");
            exchange.sendResponseHeaders(405, -1);
            exchange.close();
            return;
        }
        boolean ready = ACCEPTING_TRAFFIC.get();
        sendJson(exchange, ready ? 200 : 503, ready ? "{\"status\":\"ready\"}" : "{\"status\":\"draining\"}");
    }

    private static void live(HttpExchange exchange) throws IOException {
        if (!"GET".equals(exchange.getRequestMethod())) {
            exchange.getResponseHeaders().set("Allow", "GET");
            exchange.sendResponseHeaders(405, -1);
            exchange.close();
            return;
        }
        sendJson(exchange, 200, "{\"status\":\"live\"}");
    }

    private static void sendJson(HttpExchange exchange, int status, String json) throws IOException {
        byte[] body = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.getResponseHeaders().set("Cache-Control", "no-store");
        exchange.sendResponseHeaders(status, body.length);
        try (var output = exchange.getResponseBody()) { output.write(body); }
    }
}
