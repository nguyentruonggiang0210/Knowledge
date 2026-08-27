"""Entrypoint: chạy tuần tự clean -> transform -> load.

Usage:
    spark-submit run_pipeline.py --csv data/raw/github_trending.csv
"""
from __future__ import annotations

import argparse
import time

from config.spark_config import get_spark
from jobs import (
    clean_data,
    load_to_postgres,
    transform_growth,
    transform_language,
    transform_trending,
)
from utils.metrics_pushgateway import push_job_metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="GitHub Trending ETL pipeline")
    parser.add_argument("--csv", default="DataEngineerTutorial\data\data_preprocessing_tool.py")
    args = parser.parse_args()

    spark = get_spark()
    started = time.time()

    cleaned = clean_data.clean(spark, args.csv).cache()
    rows = cleaned.count()

    load_to_postgres.load(transform_trending.transform(cleaned), "repo_trending_daily")
    load_to_postgres.load(transform_growth.transform(cleaned), "repo_growth")
    load_to_postgres.load(transform_language.transform(cleaned), "language_monthly_stats")

    push_job_metrics("etl_pipeline", rows, time.time() - started)
    spark.stop()


if __name__ == "__main__":
    main()
