# Debug Session Storage vs Retrieval
$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "Debugging Session Storage vs Retrieval" -ForegroundColor Cyan

# Step 1: Create user and login
$testEmail = "debug_$(Get-Random -Maximum 99999)@example.com"
$signupBody = @{
    email = $testEmail
    password = "TestPassword123!"
    name = "Debug User"
} | ConvertTo-Json

Invoke-WebRequest -Uri "$baseUrl/auth/signup" -Method POST -Body $signupBody -ContentType "application/json" | Out-Null

$loginBody = @{
    email = $testEmail
    password = "TestPassword123!"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$loginData = $response.Content | ConvertFrom-Json
$sessionCookie = $response.Headers['Set-Cookie']

Write-Host "Session Token: $($loginData.session_token)" -ForegroundColor Gray
Write-Host "Cookie: $sessionCookie" -ForegroundColor Gray

# Step 2: Use the debug.session function to test session storage/retrieval
$debugBody = @{
    action = "debug.session"
    payload = @{}
} | ConvertTo-Json

Write-Host "`nTesting session storage/retrieval..." -ForegroundColor Yellow
try {
    # Test without auth first
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $debugBody -ContentType "application/json"
    Write-Host "✅ debug.session (no auth): $($response.StatusCode)" -ForegroundColor Green
    $debugData = $response.Content | ConvertFrom-Json
    
    Write-Host "`nSession storage test results:" -ForegroundColor Yellow
    Write-Host "  Session created: $($debugData.data.sessionCreated)" -ForegroundColor Gray
    Write-Host "  Session stored: $($debugData.data.sessionStored)" -ForegroundColor Gray
    Write-Host "  KV namespace: $($debugData.data.kvNamespace)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ debug.session failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nDebug completed!" -ForegroundColor Cyan
