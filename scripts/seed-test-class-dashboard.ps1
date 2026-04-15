param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$ApiBaseUrl,

    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$SharedSecret,

    [int]$StudentCount = 30,

    [ValidateNotNullOrEmpty()]
    [string]$DatasetKey = "class-dashboard-v1"
)

$ErrorActionPreference = "Stop"

if ($StudentCount -lt 1) {
    throw "StudentCount must be greater than or equal to 1."
}

$headerName = "X-Examxy-Internal-Test-Data-Secret"
$seedEndpoint = "{0}/internal/test-data/class-dashboard-v1-seed" -f $ApiBaseUrl.TrimEnd("/")

$requestBody = @{
    datasetKey = $DatasetKey
    studentCount = $StudentCount
} | ConvertTo-Json -Depth 4

Write-Host "Seeding test dataset..." -ForegroundColor Cyan
Write-Host "Endpoint: $seedEndpoint" -ForegroundColor DarkGray
Write-Host "DatasetKey: $DatasetKey | StudentCount: $StudentCount" -ForegroundColor DarkGray

try {
    $response = Invoke-RestMethod `
        -Method Post `
        -Uri $seedEndpoint `
        -Headers @{ $headerName = $SharedSecret } `
        -ContentType "application/json" `
        -Body $requestBody
}
catch {
    $errorMessage = $_.Exception.Message
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
        $errorMessage = "$errorMessage`n$($_.ErrorDetails.Message)"
    }

    throw "Seed request failed. $errorMessage"
}

if (-not $response) {
    throw "Seed endpoint returned an empty response."
}

$students = @($response.students)
$previewCount = [Math]::Min(10, $students.Count)

Write-Host "Seed completed successfully." -ForegroundColor Green
Write-Host "Dataset: $($response.datasetKey)" -ForegroundColor Green
Write-Host "Class: $($response.class.name) [$($response.class.code)]" -ForegroundColor Green
Write-Host "Teacher: $($response.teacher.email) ($($response.teacher.userName))" -ForegroundColor Green
Write-Host "Students seeded: $($response.seededStudentCount)" -ForegroundColor Green

if ($previewCount -gt 0) {
    Write-Host ""
    Write-Host "Student account preview:" -ForegroundColor Cyan
    $students | Select-Object -First $previewCount | ForEach-Object {
        Write-Host ("- {0} ({1})" -f $_.email, $_.userName)
    }

    if ($students.Count -gt $previewCount) {
        Write-Host ("... and {0} more." -f ($students.Count - $previewCount)) -ForegroundColor DarkGray
    }
}

$response
