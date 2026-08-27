param(
  [Parameter(Mandatory = $false)]
  [string]$TerraformExecutable = "terraform"
)

$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$failures = [System.Collections.Generic.List[string]]::new()

function Get-RepositoryRelativePath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  $fullPath = [IO.Path]::GetFullPath($Path)
  if (-not $fullPath.StartsWith($repositoryRoot, [StringComparison]::OrdinalIgnoreCase)) {
    return $fullPath
  }

  return $fullPath.Substring($repositoryRoot.Length).TrimStart(
    [IO.Path]::DirectorySeparatorChar,
    [IO.Path]::AltDirectorySeparatorChar
  )
}

Write-Output "Checking Markdown links..."
$markdownFiles = Get-ChildItem -LiteralPath $repositoryRoot -Recurse -File -Filter "*.md"

foreach ($file in $markdownFiles) {
  $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
  $matches = [regex]::Matches($content, '\[[^\]]*\]\(([^)]+)\)')

  foreach ($match in $matches) {
    $target = $match.Groups[1].Value.Trim().Trim('<', '>')
    if (
      $target -eq "" -or
      $target.StartsWith("#") -or
      $target -match '^(https?|mailto|app):'
    ) {
      continue
    }

    $targetWithoutAnchor = ($target -split '#', 2)[0]
    $decodedTarget = [uri]::UnescapeDataString($targetWithoutAnchor)
    $absoluteTarget = Join-Path $file.DirectoryName $decodedTarget

    if (-not (Test-Path -LiteralPath $absoluteTarget)) {
      $relativeFile = Get-RepositoryRelativePath -Path $file.FullName
      $failures.Add("Broken link in $relativeFile -> $target")
    }
  }
}

Write-Output "Checking Markdown code fences..."
foreach ($file in $markdownFiles) {
  $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
  $backtickFenceCount = [regex]::Matches($content, '(?m)^\s*```').Count
  $tildeFenceCount = [regex]::Matches($content, '(?m)^\s*~~~').Count

  if (($backtickFenceCount % 2) -ne 0 -or ($tildeFenceCount % 2) -ne 0) {
    $relativeFile = Get-RepositoryRelativePath -Path $file.FullName
    $failures.Add(
      "Unbalanced Markdown code fences in ${relativeFile}: backticks=$backtickFenceCount, tildes=$tildeFenceCount"
    )
  }
}

Write-Output "Checking lesson structure..."
foreach ($number in 0..17) {
  $prefix = "{0:d2}-" -f $number
  $lessons = Get-ChildItem -LiteralPath (Join-Path $repositoryRoot "Lessions") -Directory |
    Where-Object { $_.Name.StartsWith($prefix) }

  if ($lessons.Count -ne 1) {
    $failures.Add("Expected one lesson with prefix $prefix, found $($lessons.Count)")
    continue
  }

  if (-not (Test-Path -LiteralPath (Join-Path $lessons[0].FullName "README.md"))) {
    $failures.Add("Missing README.md in $($lessons[0].Name)")
  }
}

Write-Output "Checking DevOps lesson structure..."
foreach ($number in 0..20) {
  $prefix = "{0:d2}-" -f $number
  $lessons = Get-ChildItem -LiteralPath (Join-Path $repositoryRoot "Devops") -Directory |
    Where-Object { $_.Name.StartsWith($prefix) }

  if ($lessons.Count -ne 1) {
    $failures.Add("Expected one DevOps lesson with prefix $prefix, found $($lessons.Count)")
    continue
  }

  if (-not (Test-Path -LiteralPath (Join-Path $lessons[0].FullName "README.md"))) {
    $failures.Add("Missing README.md in Devops/$($lessons[0].Name)")
  }
}

Write-Output "Checking DevOps quiz mapping..."
$devopsQuizRoot = Join-Path $repositoryRoot "Devops\Quiz"
$quizLevelFiles = Get-ChildItem -LiteralPath (Join-Path $devopsQuizRoot "levels") -File -Filter "*.md"
$quizAnswerFiles = Get-ChildItem -LiteralPath (Join-Path $devopsQuizRoot "answers") -File -Filter "*.md"
$quizHeadingPattern = '(?m)^## ([FCNPS]\d{2})\b'

$quizLevelIds = @(
  foreach ($file in $quizLevelFiles) {
    $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
    foreach ($match in [regex]::Matches($content, $quizHeadingPattern)) {
      $match.Groups[1].Value
    }
  }
)

$quizAnswerIds = @(
  foreach ($file in $quizAnswerFiles) {
    $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
    foreach ($match in [regex]::Matches($content, $quizHeadingPattern)) {
      $match.Groups[1].Value
    }
  }
)

$quizBankContent = Get-Content -LiteralPath (Join-Path $devopsQuizRoot "question-bank.md") -Raw -Encoding UTF8
$quizBankIds = @(
  foreach ($match in [regex]::Matches($quizBankContent, '(?m)^\| ([FCNPS]\d{2}) \|')) {
    $match.Groups[1].Value
  }
)

foreach ($idSet in @(
  [pscustomobject]@{ Name = "questions"; Ids = $quizLevelIds },
  [pscustomobject]@{ Name = "answers"; Ids = $quizAnswerIds },
  [pscustomobject]@{ Name = "question bank"; Ids = $quizBankIds }
)) {
  $duplicates = @($idSet.Ids | Group-Object | Where-Object { $_.Count -gt 1 })
  if ($duplicates.Count -gt 0) {
    $failures.Add("Duplicate DevOps quiz IDs in $($idSet.Name): $($duplicates.Name -join ', ')")
  }

  if ($idSet.Ids.Count -ne 100) {
    $failures.Add("Expected 100 DevOps quiz IDs in $($idSet.Name), found $($idSet.Ids.Count)")
  }
}

$questionAnswerDiff = @(Compare-Object ($quizLevelIds | Sort-Object) ($quizAnswerIds | Sort-Object))
if ($questionAnswerDiff.Count -gt 0) {
  $failures.Add("DevOps quiz question and answer IDs do not match")
}

$questionBankDiff = @(Compare-Object ($quizLevelIds | Sort-Object) ($quizBankIds | Sort-Object))
if ($questionBankDiff.Count -gt 0) {
  $failures.Add("DevOps quiz question and question-bank IDs do not match")
}

foreach ($number in 1..20) {
  $lessonId = "D{0:d2}" -f $number
  if ($quizBankContent -notmatch "\b$lessonId\b") {
    $failures.Add("DevOps question bank does not cover $lessonId")
  }
}

Write-Output "Checking forbidden generated/sensitive filenames..."
$forbiddenFiles = Get-ChildItem -LiteralPath $repositoryRoot -Recurse -Force -File |
  Where-Object {
    $_.FullName -notmatch '[\\/]\.terraform[\\/]' -and (
      $_.Name -match '\.tfstate(\..*)?$' -or
      $_.Extension -in @(".pem", ".pfx", ".tfplan", ".plan") -or
      ($_.Extension -eq ".key" -and $_.Name -notmatch 'public')
    )
  }

foreach ($file in $forbiddenFiles) {
  $relativeFile = Get-RepositoryRelativePath -Path $file.FullName
  $failures.Add("Forbidden generated/sensitive filename: $relativeFile")
}

Write-Output "Checking Terraform formatting..."
$terraformCommand = Get-Command $TerraformExecutable -ErrorAction SilentlyContinue
if ($null -eq $terraformCommand) {
  Write-Warning "Terraform CLI not found; skipped terraform fmt -check -recursive."
} else {
  Push-Location $repositoryRoot
  try {
    & $terraformCommand.Source fmt -check -recursive
    if ($LASTEXITCODE -ne 0) {
      $failures.Add("terraform fmt -check -recursive failed")
    }
  } finally {
    Pop-Location
  }
}

if ($failures.Count -gt 0) {
  Write-Error ("Repository checks failed:`n- " + ($failures -join "`n- "))
  exit 1
}

Write-Output "Repository checks passed."
