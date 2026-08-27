param(
    [string]$RepositoryRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$lessonRoot = Join-Path $RepositoryRoot 'Lessions'
$temporaryRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('algorithms-csharp-validation-' + [Guid]::NewGuid().ToString('N'))

try {
    New-Item -ItemType Directory -Path $temporaryRoot | Out-Null
    $sourceFiles = New-Object System.Collections.Generic.List[string]
    $mainNamespaces = New-Object System.Collections.Generic.List[string]
    $sampleIndex = 0

    Get-ChildItem -LiteralPath $lessonRoot -Filter '*.md' | Sort-Object Name | ForEach-Object {
        $markdown = [System.IO.File]::ReadAllText($_.FullName)
        $matches = [regex]::Matches($markdown, '(?s)```csharp\s*\r?\n(.*?)\r?\n```')

        foreach ($match in $matches) {
            $sampleIndex++
            $namespaceName = '__LessonSample{0:D3}' -f $sampleIndex
            $source = "namespace $namespaceName`r`n{`r`n" + $match.Groups[1].Value + "`r`n}`r`n"
            $safeLessonName = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
            $sourcePath = Join-Path $temporaryRoot ('Sample{0:D3}-{1}.cs' -f $sampleIndex, $safeLessonName)
            [System.IO.File]::WriteAllText($sourcePath, $source, [System.Text.UTF8Encoding]::new($false))
            $sourceFiles.Add($sourcePath)
            if ([regex]::IsMatch($match.Groups[1].Value, 'public\s+static\s+void\s+Main\s*\(\s*\)')) {
                $mainNamespaces.Add($namespaceName)
            }
        }
    }

    if ($sampleIndex -eq 0) {
        throw 'No csharp code block was found in Lessions.'
    }

    $runnerPath = Join-Path $temporaryRoot 'RuntimeRunner.cs'
    $runnerCalls = ($mainNamespaces | ForEach-Object { "        $_.Program.Main();" }) -join "`r`n"
    $runner = "public static class __RuntimeRunner`r`n{`r`n    public static void Main()`r`n    {`r`n$runnerCalls`r`n    }`r`n}`r`n"
    [System.IO.File]::WriteAllText($runnerPath, $runner, [System.Text.UTF8Encoding]::new($false))

    $projectPath = Join-Path $temporaryRoot 'Samples.csproj'
    $project = @'
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <StartupObject>__RuntimeRunner</StartupObject>
    <TargetFramework>net8.0</TargetFramework>
    <LangVersion>12.0</LangVersion>
    <Nullable>enable</Nullable>
    <ImplicitUsings>disable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>
</Project>
'@
    [System.IO.File]::WriteAllText($projectPath, $project, [System.Text.UTF8Encoding]::new($false))

    & dotnet build $projectPath --nologo --verbosity quiet
    if ($LASTEXITCODE -ne 0) {
        throw "Code-sample compilation failed with exit code $LASTEXITCODE."
    }

    $assemblyPath = Join-Path $temporaryRoot 'bin\Debug\net8.0\Samples.dll'
    $runtimeOutput = (& dotnet $assemblyPath 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) {
        Write-Host $runtimeOutput
        throw "Code-sample smoke run failed with exit code $LASTEXITCODE."
    }

    Write-Host "PASS: Compiled $sampleIndex C# blocks and ran $($mainNamespaces.Count) Main samples from $((Get-ChildItem -LiteralPath $lessonRoot -Filter '*.md').Count) lessons."
}
finally {
    $resolvedTemp = [System.IO.Path]::GetFullPath($temporaryRoot)
    $systemTemp = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
    if ($resolvedTemp.StartsWith($systemTemp, [StringComparison]::OrdinalIgnoreCase) -and
        (Test-Path -LiteralPath $resolvedTemp)) {
        Remove-Item -LiteralPath $resolvedTemp -Recurse -Force
    }
}
