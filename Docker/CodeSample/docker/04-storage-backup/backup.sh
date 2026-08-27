#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
backup_dir="$script_dir/backups"
mkdir -p "$backup_dir"

docker run --rm \
  --mount type=volume,src=docker-storage-lab_app-data,dst=/data,readonly \
  --mount type=bind,src="$backup_dir",dst=/backup \
  alpine:3.23 tar czf /backup/app-data.tgz -C /data .

echo "Backup created at $backup_dir/app-data.tgz"
