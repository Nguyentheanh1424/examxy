$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$project = Join-Path $repoRoot "examxy.Infrastructure\examxy.Infrastructure.csproj"
$startupProject = Join-Path $repoRoot "examxy.Server\examxy.Server.csproj"
$context = "AppDbContext"

function Assert-LastExitCode {
    param([string]$CommandName)

    if ($LASTEXITCODE -ne 0) {
        throw "$CommandName failed with exit code $LASTEXITCODE."
    }
}

Write-Host "Listing migrations..." -ForegroundColor Cyan

dotnet ef migrations list `
  --project $project `
  --startup-project $startupProject `
  --context $context

Assert-LastExitCode "dotnet ef migrations list"
