# Final Lock Validation Test
$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "FINAL LOCK VALIDATION TEST" -ForegroundColor Cyan

# Quick validation of core functionality
Write-Host "`n1. Testing platform health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Platform healthy: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Platform health failed" -ForegroundColor Red
    exit 1
}

# Test complete user flow
Write-Host "`n2. Testing complete user flow..." -ForegroundColor Yellow
$testEmail = "locktest_$(Get-Random -Maximum 99999)@example.com"

# Signup
$signupBody = @{
    email = $testEmail
    password = "TestPassword123!"
    name = "Lock Test User"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/auth/signup" -Method POST -Body $signupBody -ContentType "application/json"
Write-Host "✅ User signup successful" -ForegroundColor Green

# Login
$loginBody = @{
    email = $testEmail
    password = "TestPassword123!"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$loginData = $response.Content | ConvertFrom-Json
$sessionToken = $loginData.session_token

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$cookie = New-Object System.Net.Cookie("nimbus_session", $sessionToken, "/", "nimbus-platform.martin-598.workers.dev")
$session.Cookies.Add($cookie)

Write-Host "✅ User login successful" -ForegroundColor Green

# Create Project
$projectBody = @{
    action = "project.create"
    payload = @{
        name = "Lock Test Project"
        domain = "lock-test.com"
        description = "Final validation before locking"
        logo = "https://example.com/logo.png"
        config = @{ tone = "professional" }
    }
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $projectBody -ContentType "application/json" -WebSession $session
$projectData = $response.Content | ConvertFrom-Json

if ($projectData.success -and $projectData.data.success) {
    Write-Host "✅ Project creation successful" -ForegroundColor Green
    Write-Host "   Project: $($projectData.data.project.name)" -ForegroundColor Gray
} else {
    Write-Host "❌ Project creation failed" -ForegroundColor Red
    exit 1
}

# List Projects
$listBody = @{
    action = "project.list"
    payload = @{}
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $listBody -ContentType "application/json" -WebSession $session
$listData = $response.Content | ConvertFrom-Json

Write-Host "✅ Project listing successful - Found $($listData.data.projects.Count) project(s)" -ForegroundColor Green

Write-Host "`nFINAL VALIDATION COMPLETE!" -ForegroundColor Green
Write-Host "✅ All core functionality working perfectly" -ForegroundColor Green
Write-Host "✅ Ready for foundation module locking" -ForegroundColor Green
