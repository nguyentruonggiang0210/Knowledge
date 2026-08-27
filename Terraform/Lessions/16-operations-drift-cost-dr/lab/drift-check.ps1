param(
  [Parameter(Mandatory = $false)]
  [string]$VariableFile = ""
)

$ErrorActionPreference = "Stop"
$arguments = @("plan", "-input=false", "-detailed-exitcode", "-out=drift.tfplan")
if ($VariableFile -ne "") {
  $arguments += "-var-file=$VariableFile"
}

& terraform @arguments
$result = $LASTEXITCODE

switch ($result) {
  0 {
    Write-Output "DRIFT_STATUS=clean"
    exit 0
  }
  2 {
    Write-Output "DRIFT_STATUS=changes_detected"
    terraform show -no-color drift.tfplan
    exit 2
  }
  default {
    Write-Error "DRIFT_STATUS=error exit_code=$result"
    exit $result
  }
}

