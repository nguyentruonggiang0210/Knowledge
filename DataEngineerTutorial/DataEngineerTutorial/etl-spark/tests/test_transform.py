"""Unit test transform logic bằng pytest + chispa + spark local session."""
from __future__ import annotations

import datetime as dt

import pytest
from pyspark.sql import SparkSession

from jobs import transform_growth


@pytest.fixture(scope="session")
def spark() -> SparkSession:
    return (
        SparkSession.builder.master("local[1]")
        .appName("etl-tests")
        .getOrCreate()
    )


def test_growth_rate(spark: SparkSession) -> None:
    rows = [
        (1, "repo-a", dt.datetime(2026, 7, 1), 100),
        (1, "repo-a", dt.datetime(2026, 7, 2), 150),
    ]
    df = spark.createDataFrame(rows, ["repo_id", "repo_name", "recorded_at", "stars"])

    result = {r["recorded_at"].day: r for r in transform_growth.transform(df).collect()}

    assert result[2]["star_delta"] == 50
    assert result[2]["growth_rate"] == pytest.approx(0.5)
