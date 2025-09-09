# Simple Platform Test
$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "Testing Platform: $baseUrl" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Health Check: $($response.StatusCode)" -ForegroundColor Green
    $healthData = $response.Content | ConvertFrom-Json
    Write-Host "   Status: $($healthData.status)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Auth Signup
Write-Host "`n2. Testing Auth Signup..." -ForegroundColor Yellow
$testEmail = "test_$(Get-Random -Maximum 99999)@example.com"
$signupBody = @{
    email = $testEmail
    password = "TestPassword123!"
    name = "Test User"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/signup" -Method POST -Body $signupBody -ContentType "application/json"
    Write-Host "✅ Signup: $($response.StatusCode)" -ForegroundColor Green
    $signupData = $response.Content | ConvertFrom-Json
    Write-Host "   User ID: $($signupData.user_id)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Signup Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "   Error Details: $errorContent" -ForegroundColor Red
    }
}

# Test 3: Auth Login
Write-Host "`n3. Testing Auth Login..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = "TestPassword123!"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Login: $($response.StatusCode)" -ForegroundColor Green
    $loginData = $response.Content | ConvertFrom-Json
    $sessionCookie = $response.Headers['Set-Cookie']
    Write-Host "   Session: $($loginData.session_token.Substring(0,10))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "   Error Details: $errorContent" -ForegroundColor Red
    }
}

# Test 4: CloudFunction API
Write-Host "`n4. Testing CloudFunction API..." -ForegroundColor Yellow
$cfBody = @{
    action = "hello.world"
    payload = @{}
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $cfBody -ContentType "application/json"
    Write-Host "✅ CloudFunction: $($response.StatusCode)" -ForegroundColor Green
    $cfData = $response.Content | ConvertFrom-Json
    Write-Host "   Message: $($cfData.data.message)" -ForegroundColor Gray
} catch {
    Write-Host "❌ CloudFunction Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "   Error Details: $errorContent" -ForegroundColor Red
    }
}

Write-Host "`nTest completed!" -ForegroundColor Cyan
