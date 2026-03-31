param(
    [Parameter(Mandatory = $true)]
    [string]$Name
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$project = Join-Path $repoRoot "examxy.Infrastructure\examxy.Infrastructure.csproj"
$startupProject = Join-Path $repoRoot "examxy.Server\examxy.Server.csproj"
$context = "AppDbContext"
$outputDir = "Persistence\Migrations"

function Assert-LastExitCode {
    param([string]$CommandName)

    if ($LASTEXITCODE -ne 0) {
        throw "$CommandName failed with exit code $LASTEXITCODE."
    }
}

Write-Host "Adding migration: $Name" -ForegroundColor Cyan

dotnet ef migrations add $Name `
  --project $project `
  --startup-project $startupProject `
  --context $context `
  --output-dir $outputDir

Assert-LastExitCode "dotnet ef migrations add"

Write-Host "Migration '$Name' created successfully." -ForegroundColor Green
