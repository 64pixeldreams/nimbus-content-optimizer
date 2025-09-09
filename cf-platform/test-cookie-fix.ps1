# Test Cookie Fix - Different PowerShell Cookie Methods
$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "Testing Different Cookie Methods" -ForegroundColor Cyan

# Setup session
$testEmail = "cookiefix_$(Get-Random -Maximum 99999)@example.com"
$signupBody = @{
    email = $testEmail
    password = "TestPassword123!"
    name = "Cookie Fix User"
} | ConvertTo-Json

Invoke-WebRequest -Uri "$baseUrl/auth/signup" -Method POST -Body $signupBody -ContentType "application/json" | Out-Null

$loginBody = @{
    email = $testEmail
    password = "TestPassword123!"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$loginData = $response.Content | ConvertFrom-Json
$fullCookie = $response.Headers['Set-Cookie']

# Extract just the session token
$sessionToken = $loginData.session_token
Write-Host "Session Token: $($sessionToken.Substring(0,20))..." -ForegroundColor Gray
Write-Host "Full Cookie: $fullCookie" -ForegroundColor Gray

$projectBody = @{
    action = "project.create"
    payload = @{
        name = "Cookie Fix Project"
        domain = "cookie-fix.com"
        description = "Testing cookie fix"
    }
} | ConvertTo-Json

# Method 1: Using WebRequestSession (proper way)
Write-Host "`n1. Testing with WebRequestSession..." -ForegroundColor Yellow
try {
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $cookie = New-Object System.Net.Cookie("nimbus_session", $sessionToken, "/", "nimbus-platform.martin-598.workers.dev")
    $session.Cookies.Add($cookie)
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $projectBody -ContentType "application/json" -WebSession $session
    Write-Host "✅ WebRequestSession method: $($response.StatusCode)" -ForegroundColor Green
    $projectData = $response.Content | ConvertFrom-Json
    Write-Host "   Project: $($projectData.data.project.name)" -ForegroundColor Gray
} catch {
    Write-Host "❌ WebRequestSession method failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Method 2: Manual Cookie header
Write-Host "`n2. Testing with manual Cookie header..." -ForegroundColor Yellow
try {
    $headers = @{ 
        'Cookie' = "nimbus_session=$sessionToken"
    }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $projectBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ Manual Cookie header: $($response.StatusCode)" -ForegroundColor Green
    $projectData = $response.Content | ConvertFrom-Json
    Write-Host "   Project: $($projectData.data.project.name)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Manual Cookie header failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host "`nCookie fix test completed!" -ForegroundColor Cyan
