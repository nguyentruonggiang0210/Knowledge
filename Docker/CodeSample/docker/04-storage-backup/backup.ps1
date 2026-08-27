$ErrorActionPreference = 'Stop'
$backupDir = Join-Path $PSScriptRoot 'backups'
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

docker run --rm `
  --mount 'type=volume,src=docker-storage-lab_app-data,dst=/data,readonly' `
  --mount "type=bind,src=$backupDir,dst=/backup" `
  alpine:3.23 tar czf /backup/app-data.tgz -C /data .

if ($LASTEXITCODE -ne 0) { throw 'Backup failed' }
Write-Host "Backup created at $backupDir\app-data.tgz"
