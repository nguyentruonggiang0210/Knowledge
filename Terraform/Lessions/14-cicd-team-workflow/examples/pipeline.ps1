param(
  [Parameter(Mandatory = $false)]
  [string]$VariableFile = ""
)

$ErrorActionPreference = "Stop"

terraform fmt -check -recursive
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

terraform init -input=false
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

terraform validate -no-color
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

terraform test -no-color
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$planArguments = @("plan", "-input=false", "-detailed-exitcode", "-out=tfplan")
if ($VariableFile -ne "") {
  $planArguments += "-var-file=$VariableFile"
}

& terraform @planArguments
$planExitCode = $LASTEXITCODE

switch ($planExitCode) {
  0 {
    Write-Output "PLAN_STATUS=no_changes"
    exit 0
  }
  2 {
    Write-Output "PLAN_STATUS=changes"
    terraform show -no-color tfplan
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    exit 0
  }
  default {
    Write-Error "terraform plan failed with exit code $planExitCode"
    exit $planExitCode
  }
}

