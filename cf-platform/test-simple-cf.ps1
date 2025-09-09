$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "Testing basic CloudFunction..."

try {
    $body = '{"action":"hello.world","payload":{}}'
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $body -ContentType "application/json"
    Write-Host "SUCCESS: $($response.StatusCode)"
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Message: $($data.data.message)"
    Write-Host "User: $($data.data.user)"
} catch {
    Write-Host "FAILED: $($_.Exception.Message)"
}
