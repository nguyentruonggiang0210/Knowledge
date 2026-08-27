import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

bind_host = os.environ.get("BIND_HOST", "127.0.0.1")


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        status = 200 if self.path in {"/", "/healthz"} else 404
        body = json.dumps({"status": "ok"} if status == 200 else {"error": "not_found"}).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, message_format, *args):
        print(json.dumps({"event": "http_request", "message": message_format % args}), flush=True)


print(json.dumps({"event": "server_starting", "bind_host": bind_host, "port": 8080}), flush=True)
ThreadingHTTPServer((bind_host, 8080), Handler).serve_forever()
