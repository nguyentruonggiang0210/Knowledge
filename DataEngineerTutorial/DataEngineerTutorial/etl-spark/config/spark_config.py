"""Cấu hình SparkSession và JDBC connection string tới Postgres."""
from __future__ import annotations

import os

from pyspark.sql import SparkSession


def get_spark(app_name: str = "github-trending-etl") -> SparkSession:
    """Tạo (hoặc lấy) SparkSession dùng chung cho các job."""
    return (
        SparkSession.builder.appName(app_name)
        .config("spark.sql.session.timeZone", "UTC")
        .config("spark.jars.packages", "org.postgresql:postgresql:42.7.3")
        .getOrCreate()
    )


def jdbc_properties() -> dict[str, str]:
    """Thuộc tính kết nối JDBC tới Postgres."""
    return {
        "user": os.getenv("POSTGRES_USER", "gtp"),
        "password": os.getenv("POSTGRES_PASSWORD", "gtp"),
        "driver": "org.postgresql.Driver",
    }


def jdbc_url() -> str:
    return os.getenv("JDBC_URL", "jdbc:postgresql://localhost:5432/github_trending")
