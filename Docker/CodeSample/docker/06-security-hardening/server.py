import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/healthz":
            self.send_json(200, {"status": "ok"})
        elif self.path == "/identity":
            self.send_json(200, {"uid": os.getuid(), "gid": os.getgid()})
        else:
            self.send_json(404, {"error": "not_found"})

    def do_POST(self):
        target = {"/write-root": "/proof.txt", "/write-tmp": "/tmp/proof.txt"}.get(self.path)
        if target is None:
            self.send_json(404, {"error": "not_found"})
            return
        try:
            with open(target, "w", encoding="utf-8") as output:
                output.write("runtime write probe\n")
            self.send_json(200, {"writable": True, "target": target})
        except OSError as error:
            self.send_json(403, {"writable": False, "target": target, "error_type": type(error).__name__})

    def log_message(self, message_format, *args):
        print(json.dumps({"event": "http_request", "client": self.client_address[0], "message": message_format % args}), flush=True)


server = ThreadingHTTPServer(("0.0.0.0", 8080), Handler)
print(json.dumps({"event": "server_started", "uid": os.getuid(), "gid": os.getgid()}), flush=True)
server.serve_forever()
