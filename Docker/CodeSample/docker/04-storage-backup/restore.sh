#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
backup_dir="$script_dir/backups"
test -f "$backup_dir/app-data.tgz" || { echo 'Run backup.sh first' >&2; exit 1; }

docker volume create docker-storage-lab_restore-data >/dev/null
docker run --rm \
  --mount type=volume,src=docker-storage-lab_restore-data,dst=/restore \
  --mount type=bind,src="$backup_dir",dst=/backup,readonly \
  alpine:3.23 sh -c 'tar xzf /backup/app-data.tgz -C /restore && tail -n 5 /restore/events.log'

echo 'Restore verified in volume docker-storage-lab_restore-data'
