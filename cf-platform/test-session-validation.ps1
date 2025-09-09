# Test Session Validation Step by Step
$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "Testing Session Validation Step by Step" -ForegroundColor Cyan

# Step 1: Create user and login
$testEmail = "validate_$(Get-Random -Maximum 99999)@example.com"
$signupBody = @{
    email = $testEmail
    password = "TestPassword123!"
    name = "Validation Test User"
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

# Step 2: Test different endpoints to isolate the issue
Write-Host "`n1. Testing /auth/me (REST endpoint with session)..." -ForegroundColor Yellow
try {
    $headers = @{ 'Cookie' = $sessionCookie }
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/me" -Method GET -Headers $headers
    Write-Host "✅ /auth/me works: $($response.StatusCode)" -ForegroundColor Green
    $meData = $response.Content | ConvertFrom-Json
    Write-Host "   User: $($meData.email)" -ForegroundColor Gray
} catch {
    Write-Host "❌ /auth/me failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host "`n2. Testing hello.world (CloudFunction with auth=true)..." -ForegroundColor Yellow
$helloBody = @{
    action = "hello.world"
    payload = @{}
} | ConvertTo-Json

try {
    $headers = @{ 'Cookie' = $sessionCookie }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $helloBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ hello.world works: $($response.StatusCode)" -ForegroundColor Green
    $helloData = $response.Content | ConvertFrom-Json
    Write-Host "   User: $($helloData.data.user)" -ForegroundColor Gray
} catch {
    Write-Host "❌ hello.world failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host "`n3. Testing debug.session (CloudFunction with auth=false)..." -ForegroundColor Yellow
$debugBody = @{
    action = "debug.session"
    payload = @{}
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $debugBody -ContentType "application/json"
    Write-Host "✅ debug.session works: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ debug.session failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4. Testing manual session lookup..." -ForegroundColor Yellow
$lookupBody = @{
    action = "debug.lookup"
    payload = @{
        sessionToken = $loginData.session_token
    }
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $lookupBody -ContentType "application/json"
    Write-Host "✅ debug.lookup works: $($response.StatusCode)" -ForegroundColor Green
    $lookupData = $response.Content | ConvertFrom-Json
    Write-Host "   Found session: $($lookupData.data.found)" -ForegroundColor Gray
} catch {
    Write-Host "❌ debug.lookup failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   (debug.lookup function doesn't exist - expected)" -ForegroundColor Yellow
    }
}

Write-Host "`nValidation test completed!" -ForegroundColor Cyan
