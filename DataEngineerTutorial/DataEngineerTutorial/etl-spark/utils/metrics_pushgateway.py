"""Đẩy custom metrics (số row xử lý, thời gian job) lên Prometheus Pushgateway."""
from __future__ import annotations

import os

from prometheus_client import CollectorRegistry, Gauge, push_to_gateway


def push_job_metrics(job_name: str, rows_processed: int, duration_seconds: float) -> None:
    """Đẩy metrics của 1 Spark job lên Pushgateway."""
    registry = CollectorRegistry()
    Gauge("etl_rows_processed", "Số row xử lý", registry=registry).set(rows_processed)
    Gauge("etl_job_duration_seconds", "Thời gian chạy job", registry=registry).set(
        duration_seconds
    )
    gateway = os.getenv("PUSHGATEWAY_URL", "http://localhost:9091")
    push_to_gateway(gateway, job=job_name, registry=registry)
