[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

function Show-Section {
  param([Parameter(Mandatory)][string]$Name)
  Write-Output ""
  Write-Output "== $Name =="
}

Show-Section "Host and operating system"
Get-ComputerInfo |
  Select-Object CsName, OsName, OsVersion, OsArchitecture, CsTotalPhysicalMemory

Show-Section "Clock"
(Get-Date).ToUniversalTime()
Get-TimeZone

Show-Section "Volumes"
Get-Volume |
  Select-Object DriveLetter, FileSystem, HealthStatus, Size, SizeRemaining

Show-Section "Top processes"
Get-Process |
  Sort-Object CPU -Descending |
  Select-Object -First 10 Id, ProcessName, CPU, WorkingSet64, Handles

Show-Section "Listening TCP endpoints"
Get-NetTCPConnection -State Listen |
  Sort-Object LocalPort |
  Select-Object LocalAddress, LocalPort, OwningProcess

Show-Section "Automatic services not running"
Get-CimInstance Win32_Service |
  Where-Object { $_.StartMode -eq "Auto" -and $_.State -ne "Running" } |
  Select-Object Name, State, StartMode, ExitCode

Show-Section "Recent system errors"
Get-WinEvent -FilterHashtable @{
  LogName   = "System"
  Level     = 2
  StartTime = (Get-Date).AddMinutes(-30)
} -ErrorAction SilentlyContinue |
  Select-Object -First 20 TimeCreated, Id, ProviderName, Message

Write-Output ""
Write-Output "Audit complete. Interpret this snapshot with trends and user symptoms."
