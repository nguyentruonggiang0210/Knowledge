[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [uri]$Url,

  [ValidateRange(1, 10)]
  [int]$MaxAttempts = 3
)

$ErrorActionPreference = "Stop"

if ($Url.Scheme -ne "https") {
  [Console]::Error.WriteLine("configuration error: URL must use https")
  exit 2
}

for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
  $timer = [System.Diagnostics.Stopwatch]::StartNew()

  try {
    $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 10
    $timer.Stop()

    [pscustomobject]@{
      event               = "health_check"
      attempt             = $attempt
      duration_milliseconds = $timer.ElapsedMilliseconds
      status_code         = [int]$response.StatusCode
      status              = "healthy"
    } | ConvertTo-Json -Compress

    exit 0
  } catch {
    $timer.Stop()
    $statusCode = $null
    if ($null -ne $_.Exception.Response -and $null -ne $_.Exception.Response.StatusCode) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }

    $retryable = (
      $null -eq $statusCode -or
      $statusCode -eq 408 -or
      $statusCode -eq 429 -or
      $statusCode -ge 500
    )

    if (-not $retryable) {
      $terminalMessage = [pscustomobject]@{
        event       = "health_check"
        attempt     = $attempt
        status      = "unhealthy"
        status_code = $statusCode
      } | ConvertTo-Json -Compress
      [Console]::Error.WriteLine($terminalMessage)
      break
    }

    if ($attempt -lt $MaxAttempts) {
      $delaySeconds = [math]::Pow(2, $attempt - 1) + (Get-Random -Minimum 0 -Maximum 2)
      $retryMessage = [pscustomobject]@{
        event         = "health_check"
        attempt       = $attempt
        status        = "retry"
        delay_seconds = $delaySeconds
        error_type    = $_.Exception.GetType().Name
      } | ConvertTo-Json -Compress
      [Console]::Error.WriteLine($retryMessage)

      Start-Sleep -Seconds $delaySeconds
    }
  }
}

$failureMessage = [pscustomobject]@{
  event    = "health_check"
  attempts = $MaxAttempts
  status   = "unhealthy"
} | ConvertTo-Json -Compress
[Console]::Error.WriteLine($failureMessage)
exit 3
