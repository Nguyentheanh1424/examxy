$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$project = Join-Path $repoRoot "examxy.Infrastructure\examxy.Infrastructure.csproj"
$startupProject = Join-Path $repoRoot "examxy.Server\examxy.Server.csproj"
$context = "AppDbContext"
$environmentName = "Development"
$appSettingsPath = Join-Path $repoRoot "examxy.Server\appsettings.$environmentName.json"

function Assert-LastExitCode {
    param([string]$CommandName)

    if ($LASTEXITCODE -ne 0) {
        throw "$CommandName failed with exit code $LASTEXITCODE."
    }
}

if (-not (Test-Path $appSettingsPath)) {
    throw "Development settings file not found: $appSettingsPath"
}

$appSettings = Get-Content $appSettingsPath -Raw | ConvertFrom-Json
$connectionString = $appSettings.ConnectionStrings.DefaultConnection

if ([string]::IsNullOrWhiteSpace($connectionString)) {
    throw "DefaultConnection is missing from $appSettingsPath"
}

if ($connectionString -notmatch '(?i)(Host|Server)=localhost\b') {
    throw "Safety check failed: reset-dev only allows localhost databases. Connection string: $connectionString"
}

if ($connectionString -notmatch '(?i)(Database|Initial Catalog)=([^;]+)') {
    throw "Safety check failed: unable to determine database name from connection string."
}

$databaseName = $Matches[2]

Write-Host "Using environment: $environmentName" -ForegroundColor Cyan
Write-Host "Target database: $databaseName" -ForegroundColor Cyan
Write-Host "Connection source: $appSettingsPath" -ForegroundColor DarkCyan

Write-Host "Dropping database..." -ForegroundColor Yellow

$env:ASPNETCORE_ENVIRONMENT = $environmentName

dotnet ef database drop --force `
  --project $project `
  --startup-project $startupProject `
  --context $context

Assert-LastExitCode "dotnet ef database drop"

Write-Host "Re-applying migrations..." -ForegroundColor Cyan

dotnet ef database update `
  --project $project `
  --startup-project $startupProject `
  --context $context

Assert-LastExitCode "dotnet ef database update"

Write-Host "Database reset completed." -ForegroundColor Green
