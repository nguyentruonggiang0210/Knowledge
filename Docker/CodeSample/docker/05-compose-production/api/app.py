import json
import os
import time
from datetime import datetime, timezone

import pg8000.dbapi
from flask import Flask, g, jsonify, request

app = Flask(__name__)


def emit(event, **fields):
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "level": fields.pop("level", "info"),
        "service": "compose-api",
        "event": event,
        **fields,
    }
    print(json.dumps(record, separators=(",", ":")), flush=True)


def read_secret(path):
    if not path:
        raise RuntimeError("DB_PASSWORD_FILE is required")
    with open(path, encoding="utf-8") as secret_file:
        return secret_file.read().strip()


def connect():
    return pg8000.dbapi.connect(
        host=os.environ.get("DB_HOST", "db"),
        port=int(os.environ.get("DB_PORT", "5432")),
        database=os.environ.get("DB_NAME", "app"),
        user=os.environ.get("DB_USER", "app"),
        password=read_secret(os.environ.get("DB_PASSWORD_FILE")),
        timeout=3,
    )


@app.before_request
def before_request():
    g.started_at = time.monotonic()


@app.after_request
def after_request(response):
    emit(
        "http_request",
        method=request.method,
        path=request.path,
        status=response.status_code,
        latency_ms=round((time.monotonic() - g.started_at) * 1000, 2),
    )
    return response


@app.get("/live")
def live():
    return jsonify(status="ok")


@app.get("/ready")
def ready():
    connection = None
    try:
        connection = connect()
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        return jsonify(status="ready")
    except Exception as error:  # The response and log deliberately redact credentials.
        emit("readiness_failed", level="warning", error_type=type(error).__name__)
        return jsonify(status="not_ready"), 503
    finally:
        if connection is not None:
            connection.close()


@app.post("/visits")
def add_visit():
    connection = connect()
    try:
        cursor = connection.cursor()
        cursor.execute("INSERT INTO visits DEFAULT VALUES RETURNING id, created_at")
        visit_id, created_at = cursor.fetchone()
        connection.commit()
        return jsonify(id=visit_id, created_at=created_at.isoformat()), 201
    finally:
        connection.close()


@app.get("/visits")
def list_visits():
    connection = connect()
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id, created_at FROM visits ORDER BY id DESC LIMIT 20")
        visits = [{"id": row[0], "created_at": row[1].isoformat()} for row in cursor.fetchall()]
        return jsonify(visits=visits)
    finally:
        connection.close()
