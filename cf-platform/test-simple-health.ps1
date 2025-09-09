$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "Testing platform health..."

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET
    Write-Host "SUCCESS: $($response.StatusCode)"
    Write-Host $response.Content
} catch {
    Write-Host "FAILED: $($_.Exception.Message)"
}
