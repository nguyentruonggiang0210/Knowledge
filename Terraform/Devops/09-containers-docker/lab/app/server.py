from __future__ import annotations

import json
import os
import signal
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


PORT = int(os.environ.get("PORT", "8080"))
ENVIRONMENT = os.environ.get("APP_ENV", "local")
ready = True
server: ThreadingHTTPServer | None = None


def emit(event: str, **fields: object) -> None:
    record = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "event": event,
        "environment": ENVIRONMENT,
        **fields,
    }
    print(json.dumps(record, separators=(",", ":")), flush=True)


class Handler(BaseHTTPRequestHandler):
    server_version = "DevOpsDemo/1.0"

    def do_GET(self) -> None:
        if self.path == "/healthz":
            self._json(200, {"status": "healthy"})
        elif self.path == "/readyz":
            self._json(200 if ready else 503, {"ready": ready})
        elif self.path == "/":
            self._json(200, {"service": "devops-demo", "environment": ENVIRONMENT})
        else:
            self._json(404, {"error": "not_found"})

    def _json(self, status: int, payload: dict[str, object]) -> None:
        body = json.dumps(payload, separators=(",", ":")).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
        emit("request", method="GET", path=self.path, status=status)

    def log_message(self, format: str, *args: object) -> None:
        # Access logs are emitted as structured JSON in _json.
        return


def stop(signum: int, _frame: object) -> None:
    global ready
    ready = False
    emit("shutdown_started", signal=signum)
    if server is not None:
        # shutdown must run on a different thread from serve_forever.
        threading.Thread(target=server.shutdown, daemon=True).start()


def main() -> None:
    global server
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    emit("server_started", port=PORT)
    server.serve_forever(poll_interval=0.2)
    server.server_close()
    emit("shutdown_complete")


if __name__ == "__main__":
    main()
