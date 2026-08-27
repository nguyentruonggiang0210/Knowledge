import json
import threading
import time
from collections import Counter
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

lock = threading.Lock()
requests_total = Counter()
duration_sum = Counter()


def emit(event, **fields):
    print(
        json.dumps(
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "info",
                "service": "observable-app",
                "event": event,
                **fields,
            },
            separators=(",", ":"),
        ),
        flush=True,
    )


class Handler(BaseHTTPRequestHandler):
    def send_body(self, status, body, content_type="application/json"):
        encoded = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self):
        started = time.monotonic()
        parsed = urlparse(self.path)
        route = parsed.path if parsed.path in {"/", "/work", "/healthz", "/metrics"} else "/other"
        status = 200

        if parsed.path == "/":
            self.send_body(200, json.dumps({"message": "observable app"}))
        elif parsed.path == "/work":
            try:
                milliseconds = min(max(int(parse_qs(parsed.query).get("ms", ["0"])[0]), 0), 2000)
            except ValueError:
                milliseconds = 0
            time.sleep(milliseconds / 1000)
            self.send_body(200, json.dumps({"slept_ms": milliseconds}))
        elif parsed.path == "/healthz":
            self.send_body(200, json.dumps({"status": "ok"}))
        elif parsed.path == "/metrics":
            self.send_body(200, self.metrics(), "text/plain; version=0.0.4")
        else:
            status = 404
            self.send_body(404, json.dumps({"error": "not_found"}))

        elapsed = time.monotonic() - started
        if parsed.path != "/metrics":
            with lock:
                requests_total[(route, str(status))] += 1
                duration_sum[route] += elapsed
        emit("http_request", method="GET", route=route, status=status, latency_ms=round(elapsed * 1000, 2))

    def metrics(self):
        lines = [
            "# HELP sample_http_requests_total Total HTTP requests.",
            "# TYPE sample_http_requests_total counter",
        ]
        with lock:
            for (route, status), value in sorted(requests_total.items()):
                lines.append(f'sample_http_requests_total{{route="{route}",status="{status}"}} {value}')
            lines.extend(
                [
                    "# HELP sample_http_request_duration_seconds Request duration sum and count.",
                    "# TYPE sample_http_request_duration_seconds summary",
                ]
            )
            for route, value in sorted(duration_sum.items()):
                count = sum(v for (candidate, _), v in requests_total.items() if candidate == route)
                lines.append(f'sample_http_request_duration_seconds_sum{{route="{route}"}} {value}')
                lines.append(f'sample_http_request_duration_seconds_count{{route="{route}"}} {count}')
        return "\n".join(lines) + "\n"

    def log_message(self, *_):
        return


emit("server_started", port=8080)
ThreadingHTTPServer(("0.0.0.0", 8080), Handler).serve_forever()
