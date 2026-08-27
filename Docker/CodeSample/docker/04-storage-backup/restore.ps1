$ErrorActionPreference = 'Stop'
$backupFile = Join-Path $PSScriptRoot 'backups/app-data.tgz'
if (-not (Test-Path -LiteralPath $backupFile)) { throw 'Run backup.ps1 first' }

$backupDir = Split-Path -Parent $backupFile
docker volume create docker-storage-lab_restore-data | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not create restore volume' }

docker run --rm `
  --mount 'type=volume,src=docker-storage-lab_restore-data,dst=/restore' `
  --mount "type=bind,src=$backupDir,dst=/backup,readonly" `
  alpine:3.23 sh -c 'tar xzf /backup/app-data.tgz -C /restore && tail -n 5 /restore/events.log'

if ($LASTEXITCODE -ne 0) { throw 'Restore verification failed' }
Write-Host 'Restore verified in volume docker-storage-lab_restore-data'
