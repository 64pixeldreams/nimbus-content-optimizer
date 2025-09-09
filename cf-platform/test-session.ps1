# Session Authentication Test
$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "Testing Session Authentication" -ForegroundColor Cyan

# Step 1: Signup and Login
Write-Host "`n1. Creating User and Getting Session..." -ForegroundColor Yellow
$testEmail = "sessiontest_$(Get-Random -Maximum 99999)@example.com"
$signupBody = @{
    email = $testEmail
    password = "TestPassword123!"
    name = "Session Test User"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/signup" -Method POST -Body $signupBody -ContentType "application/json"
    Write-Host "✅ User Created" -ForegroundColor Green
} catch {
    Write-Host "❌ User Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$loginBody = @{
    email = $testEmail
    password = "TestPassword123!"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ User Logged In" -ForegroundColor Green
    $loginData = $response.Content | ConvertFrom-Json
    $sessionCookie = $response.Headers['Set-Cookie']
    Write-Host "   Session Token: $($loginData.session_token.Substring(0,20))..." -ForegroundColor Gray
    Write-Host "   Cookie: $($sessionCookie.Substring(0,50))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Test /auth/me endpoint (should work with session)
Write-Host "`n2. Testing /auth/me with session..." -ForegroundColor Yellow
try {
    $headers = @{ 'Cookie' = $sessionCookie }
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/me" -Method GET -Headers $headers
    Write-Host "✅ /auth/me worked: $($response.StatusCode)" -ForegroundColor Green
    $meData = $response.Content | ConvertFrom-Json
    Write-Host "   User: $($meData.email)" -ForegroundColor Gray
} catch {
    Write-Host "❌ /auth/me failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "   Error Details: $errorContent" -ForegroundColor Red
    }
}

# Step 3: Test CloudFunction with session
Write-Host "`n3. Testing CloudFunction with session..." -ForegroundColor Yellow
$cfBody = @{
    action = "hello.world"
    payload = @{}
} | ConvertTo-Json

try {
    $headers = @{ 'Cookie' = $sessionCookie }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $cfBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ CloudFunction worked: $($response.StatusCode)" -ForegroundColor Green
    $cfData = $response.Content | ConvertFrom-Json
    Write-Host "   Message: $($cfData.data.message)" -ForegroundColor Gray
} catch {
    Write-Host "❌ CloudFunction failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "   Error Details: $errorContent" -ForegroundColor Red
    }
}

# Step 4: Test project.create with session
Write-Host "`n4. Testing project.create with session..." -ForegroundColor Yellow
$projectBody = @{
    action = "project.create"
    payload = @{
        name = "Session Test Project"
        domain = "session-test.com"
        description = "Testing session auth"
    }
} | ConvertTo-Json

try {
    $headers = @{ 'Cookie' = $sessionCookie }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $projectBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ project.create worked: $($response.StatusCode)" -ForegroundColor Green
    $projectData = $response.Content | ConvertFrom-Json
    Write-Host "   Project: $($projectData.data.project.name)" -ForegroundColor Gray
} catch {
    Write-Host "❌ project.create failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "   Error Details: $errorContent" -ForegroundColor Red
    }
}

Write-Host "`nSession test completed!" -ForegroundColor Cyan
