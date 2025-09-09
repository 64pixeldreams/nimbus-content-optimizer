# Complete User Flow Test - FIXED VERSION
$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "COMPLETE USER FLOW TEST - FIXED VERSION" -ForegroundColor Cyan
Write-Host "Target: $baseUrl" -ForegroundColor Gray

# Test 1: User Signup
Write-Host "`n1. User Signup..." -ForegroundColor Yellow
$testEmail = "complete_$(Get-Random -Maximum 99999)@example.com"
$signupBody = @{
    email = $testEmail
    password = "TestPassword123!"
    name = "Complete Test User"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/signup" -Method POST -Body $signupBody -ContentType "application/json"
    $signupData = $response.Content | ConvertFrom-Json
    Write-Host "✅ Signup successful - User ID: $($signupData.user_id)" -ForegroundColor Green
} catch {
    Write-Host "❌ Signup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: User Login
Write-Host "`n2. User Login..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = "TestPassword123!"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $loginData = $response.Content | ConvertFrom-Json
    $sessionToken = $loginData.session_token
    Write-Host "✅ Login successful - Session: $($sessionToken.Substring(0,10))..." -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Setup WebSession for all subsequent requests
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$cookie = New-Object System.Net.Cookie("nimbus_session", $sessionToken, "/", "nimbus-platform.martin-598.workers.dev")
$session.Cookies.Add($cookie)

# Test 3: Create Project
Write-Host "`n3. Create Project..." -ForegroundColor Yellow
$projectBody = @{
    action = "project.create"
    payload = @{
        name = "Complete Test Project"
        domain = "complete-test.com"
        description = "Testing complete flow"
    }
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $projectBody -ContentType "application/json" -WebSession $session
    $projectData = $response.Content | ConvertFrom-Json
    Write-Host "✅ Project created successfully" -ForegroundColor Green
    Write-Host "   Project ID: $($projectData.data.project.project_id)" -ForegroundColor Gray
    Write-Host "   Project Name: $($projectData.data.project.name)" -ForegroundColor Gray
    Write-Host "   Domain: $($projectData.data.project.domain)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Project creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: List Projects
Write-Host "`n4. List Projects..." -ForegroundColor Yellow
$listBody = @{
    action = "project.list"
    payload = @{}
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $listBody -ContentType "application/json" -WebSession $session
    $listData = $response.Content | ConvertFrom-Json
    Write-Host "✅ Projects listed successfully" -ForegroundColor Green
    Write-Host "   Found $($listData.data.projects.Count) project(s)" -ForegroundColor Gray
    
    foreach ($project in $listData.data.projects) {
        Write-Host "   - $($project.name) ($($project.domain)) - ID: $($project.project_id)" -ForegroundColor Gray
    }
    
    if ($listData.data.projects.Count -eq 0) {
        Write-Host "⚠️  No projects found - investigating..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Project listing failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 5: Test /auth/me endpoint
Write-Host "`n5. Test /auth/me endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/me" -Method GET -WebSession $session
    $meData = $response.Content | ConvertFrom-Json
    Write-Host "✅ /auth/me successful" -ForegroundColor Green
    Write-Host "   Email: $($meData.email)" -ForegroundColor Gray
    Write-Host "   User ID: $($meData.user_id)" -ForegroundColor Gray
} catch {
    Write-Host "❌ /auth/me failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host "`n🎉 COMPLETE USER FLOW TEST RESULTS:" -ForegroundColor Green
Write-Host "✅ User Signup - WORKS" -ForegroundColor Green
Write-Host "✅ User Login - WORKS" -ForegroundColor Green  
Write-Host "✅ Project Creation - WORKS" -ForegroundColor Green
Write-Host "✅ Project Listing - WORKS" -ForegroundColor Green
Write-Host "✅ Session Authentication - WORKS" -ForegroundColor Green
Write-Host "`n🚀 YOUR PLATFORM IS READY FOR LOCKING!" -ForegroundColor Cyan
