"""Ghi kết quả xuống Postgres qua JDBC, batch write."""
from __future__ import annotations

from pyspark.sql import DataFrame

from config.spark_config import jdbc_properties, jdbc_url


def load(df: DataFrame, table: str, mode: str = "append") -> None:
    """Ghi DataFrame xuống bảng Postgres qua JDBC."""
    (
        df.write.format("jdbc")
        .option("url", jdbc_url())
        .option("dbtable", table)
        .option("batchsize", 10_000)
        .options(**jdbc_properties())
        .mode(mode)
        .save()
    )
