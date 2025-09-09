# Basic Project Creation Test
# Tests: Login existing user → Create project → List projects
# This is the first test to run before the full journey

$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "🧪 BASIC PROJECT CREATION TEST" -ForegroundColor Cyan
Write-Host "Target: $baseUrl" -ForegroundColor Gray
Write-Host "Time: $(Get-Date)" -ForegroundColor Gray

# Test data
$testUser = @{
    email = "testuser_$(Get-Random -Maximum 99999)@example.com"
    password = "TestPassword123!"
    name = "Test User"
}

$testProject = @{
    name = "Test Project"
    domain = "test-project.com"
    description = "A test project"
}

Write-Host "`n📋 STEP 1: Signup Test User" -ForegroundColor Yellow
try {
    $body = @{
        email = $testUser.email
        password = $testUser.password
        name = $testUser.name
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method POST -Body $body -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ User signup successful" -ForegroundColor Green
        Write-Host "User ID: $($response.user_id)" -ForegroundColor Gray
    } else {
        throw "Signup failed: $($response.error)"
    }
} catch {
    Write-Host "❌ User signup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 STEP 2: Login Test User" -ForegroundColor Yellow
try {
    $body = @{
        email = $testUser.email
        password = $testUser.password
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $body -ContentType "application/json"
    $loginData = $response.Content | ConvertFrom-Json
    $sessionCookie = $response.Headers['Set-Cookie']
    
    if ($loginData.success) {
        Write-Host "✅ User login successful" -ForegroundColor Green
        Write-Host "Session token: $($loginData.session_token.Substring(0,10))..." -ForegroundColor Gray
    } else {
        throw "Login failed: $($loginData.error)"
    }
} catch {
    Write-Host "❌ User login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 STEP 3: Create Project" -ForegroundColor Yellow
try {
    $body = @{
        action = "project.create"
        payload = $testProject
    } | ConvertTo-Json
    
    # Use WebRequestSession for proper cookie handling
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $cookie = New-Object System.Net.Cookie("nimbus_session", $loginData.session_token, "/", "nimbus-platform.martin-598.workers.dev")
    $session.Cookies.Add($cookie)
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/function" -Method POST -Body $body -ContentType "application/json" -WebSession $session
    
    if ($response.success) {
        Write-Host "✅ Project creation successful" -ForegroundColor Green
        Write-Host "Project ID: $($response.data.project.project_id)" -ForegroundColor Gray
        Write-Host "Project Name: $($response.data.project.name)" -ForegroundColor Gray
    } else {
        throw "Project creation failed: $($response.error)"
    }
} catch {
    Write-Host "❌ Project creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 STEP 4: List Projects" -ForegroundColor Yellow
try {
    $body = @{
        action = "project.list"
        payload = @{}
    } | ConvertTo-Json
    
    # Use the same WebSession for cookie handling
    $response = Invoke-RestMethod -Uri "$baseUrl/api/function" -Method POST -Body $body -ContentType "application/json" -WebSession $session
    
    if ($response.success) {
        Write-Host "✅ Project listing successful" -ForegroundColor Green
        Write-Host "Found $($response.data.projects.Count) project(s)" -ForegroundColor Gray
        
        foreach ($project in $response.data.projects) {
            Write-Host "  - $($project.name) ($($project.domain))" -ForegroundColor Gray
        }
        
        if ($response.data.projects.Count -ne 1) {
            throw "Expected 1 project, found $($response.data.projects.Count)"
        }
    } else {
        throw "Project listing failed: $($response.error)"
    }
} catch {
    Write-Host "❌ Project listing failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 BASIC PROJECT TEST PASSED!" -ForegroundColor Green
Write-Host "Your platform can:" -ForegroundColor White
Write-Host "  ✅ Signup users" -ForegroundColor Green
Write-Host "  ✅ Login users" -ForegroundColor Green
Write-Host "  ✅ Create projects" -ForegroundColor Green
Write-Host "  ✅ List projects" -ForegroundColor Green
Write-Host "`nReady for the complete user journey test! 🚀" -ForegroundColor Cyan
