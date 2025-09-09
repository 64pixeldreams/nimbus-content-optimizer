# Multi-User Isolation Test
$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "🧪 MULTI-USER ISOLATION TEST" -ForegroundColor Cyan
Write-Host "Target: $baseUrl" -ForegroundColor Gray

# User 1 Setup
Write-Host "`n👤 USER 1 SETUP" -ForegroundColor Magenta
$user1Email = "user1_$(Get-Random -Maximum 99999)@example.com"
$user1Body = @{
    email = $user1Email
    password = "TestPassword123!"
    name = "User 1"
} | ConvertTo-Json

# User 1 Signup
Invoke-WebRequest -Uri "$baseUrl/auth/signup" -Method POST -Body $user1Body -ContentType "application/json" | Out-Null
Write-Host "✅ User 1 signed up: $user1Email" -ForegroundColor Green

# User 1 Login
$loginBody = @{
    email = $user1Email
    password = "TestPassword123!"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$user1Login = $response.Content | ConvertFrom-Json
$user1Token = $user1Login.session_token

$user1Session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$user1Cookie = New-Object System.Net.Cookie("nimbus_session", $user1Token, "/", "nimbus-platform.martin-598.workers.dev")
$user1Session.Cookies.Add($user1Cookie)

Write-Host "✅ User 1 logged in" -ForegroundColor Green

# User 1 Create Project
$project1Body = @{
    action = "project.create"
    payload = @{
        name = "User 1 Project"
        domain = "user1-project.com"
        description = "Project for User 1"
        logo = "https://example.com/user1-logo.png"
        config = @{ tone = "professional" }
    }
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $project1Body -ContentType "application/json" -WebSession $user1Session
$user1Project = $response.Content | ConvertFrom-Json

if ($user1Project.success -and $user1Project.data.success) {
    Write-Host "✅ User 1 created project: $($user1Project.data.project.name)" -ForegroundColor Green
    $user1ProjectId = $user1Project.data.project.project_id
} else {
    Write-Host "❌ User 1 project creation failed: $($user1Project.data.error)" -ForegroundColor Red
    exit 1
}

# User 2 Setup
Write-Host "`n👤 USER 2 SETUP" -ForegroundColor Magenta
$user2Email = "user2_$(Get-Random -Maximum 99999)@example.com"
$user2Body = @{
    email = $user2Email
    password = "TestPassword123!"
    name = "User 2"
} | ConvertTo-Json

# User 2 Signup
Invoke-WebRequest -Uri "$baseUrl/auth/signup" -Method POST -Body $user2Body -ContentType "application/json" | Out-Null
Write-Host "✅ User 2 signed up: $user2Email" -ForegroundColor Green

# User 2 Login
$loginBody = @{
    email = $user2Email
    password = "TestPassword123!"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$user2Login = $response.Content | ConvertFrom-Json
$user2Token = $user2Login.session_token

$user2Session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$user2Cookie = New-Object System.Net.Cookie("nimbus_session", $user2Token, "/", "nimbus-platform.martin-598.workers.dev")
$user2Session.Cookies.Add($user2Cookie)

Write-Host "✅ User 2 logged in" -ForegroundColor Green

# User 2 Create Project
$project2Body = @{
    action = "project.create"
    payload = @{
        name = "User 2 Project"
        domain = "user2-project.com"
        description = "Project for User 2"
        logo = "https://example.com/user2-logo.png"
        config = @{ tone = "casual" }
    }
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $project2Body -ContentType "application/json" -WebSession $user2Session
$user2Project = $response.Content | ConvertFrom-Json

if ($user2Project.success -and $user2Project.data.success) {
    Write-Host "✅ User 2 created project: $($user2Project.data.project.name)" -ForegroundColor Green
    $user2ProjectId = $user2Project.data.project.project_id
} else {
    Write-Host "❌ User 2 project creation failed: $($user2Project.data.error)" -ForegroundColor Red
    exit 1
}

# ISOLATION TESTS
Write-Host "`n🔒 ISOLATION TESTS" -ForegroundColor Magenta

# User 1 List Projects (should see only their project)
Write-Host "`n1. User 1 lists projects..." -ForegroundColor Yellow
$listBody = @{
    action = "project.list"
    payload = @{}
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $listBody -ContentType "application/json" -WebSession $user1Session
$user1List = $response.Content | ConvertFrom-Json

Write-Host "   User 1 sees $($user1List.data.projects.Count) project(s):" -ForegroundColor Gray
foreach ($project in $user1List.data.projects) {
    Write-Host "   - $($project.name) ($($project.domain))" -ForegroundColor Gray
}

# User 2 List Projects (should see only their project)
Write-Host "`n2. User 2 lists projects..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $listBody -ContentType "application/json" -WebSession $user2Session
$user2List = $response.Content | ConvertFrom-Json

Write-Host "   User 2 sees $($user2List.data.projects.Count) project(s):" -ForegroundColor Gray
foreach ($project in $user2List.data.projects) {
    Write-Host "   - $($project.name) ($($project.domain))" -ForegroundColor Gray
}

# LOGOUT/LOGIN TEST
Write-Host "`n🔄 LOGOUT/LOGIN TEST" -ForegroundColor Magenta

# User 1 Logout
Write-Host "`n1. User 1 logout..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/auth/logout" -Method POST -WebSession $user1Session
Write-Host "✅ User 1 logged out" -ForegroundColor Green

# User 1 Login Again
Write-Host "`n2. User 1 login again..." -ForegroundColor Yellow
$loginBody = @{
    email = $user1Email
    password = "TestPassword123!"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$user1Login2 = $response.Content | ConvertFrom-Json
$user1Token2 = $user1Login2.session_token

$user1Session2 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$user1Cookie2 = New-Object System.Net.Cookie("nimbus_session", $user1Token2, "/", "nimbus-platform.martin-598.workers.dev")
$user1Session2.Cookies.Add($user1Cookie2)

Write-Host "✅ User 1 logged in again" -ForegroundColor Green

# User 1 List Projects Again (should still see their project)
Write-Host "`n3. User 1 lists projects after re-login..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $listBody -ContentType "application/json" -WebSession $user1Session2
$user1List2 = $response.Content | ConvertFrom-Json

Write-Host "   User 1 sees $($user1List2.data.projects.Count) project(s) after re-login:" -ForegroundColor Gray
foreach ($project in $user1List2.data.projects) {
    Write-Host "   - $($project.name) ($($project.domain))" -ForegroundColor Gray
}

# RESULTS
Write-Host "`n📊 MULTI-USER TEST RESULTS" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

$isolationWorking = ($user1List.data.projects.Count -eq 1) -and ($user2List.data.projects.Count -eq 1)
$persistenceWorking = ($user1List2.data.projects.Count -eq 1)

if ($isolationWorking) {
    Write-Host "✅ USER ISOLATION - WORKS PERFECTLY" -ForegroundColor Green
    Write-Host "   Each user sees only their own projects" -ForegroundColor Gray
} else {
    Write-Host "❌ USER ISOLATION - FAILED" -ForegroundColor Red
}

if ($persistenceWorking) {
    Write-Host "✅ SESSION PERSISTENCE - WORKS PERFECTLY" -ForegroundColor Green
    Write-Host "   Projects persist after logout/login" -ForegroundColor Gray
} else {
    Write-Host "❌ SESSION PERSISTENCE - FAILED" -ForegroundColor Red
}

if ($isolationWorking -and $persistenceWorking) {
    Write-Host "`n🎉 ALL MULTI-USER TESTS PASSED!" -ForegroundColor Green
    Write-Host "Your platform handles multi-user scenarios perfectly!" -ForegroundColor Green
} else {
    Write-Host "`n❌ SOME MULTI-USER TESTS FAILED" -ForegroundColor Red
}

Write-Host "`nTest completed: $(Get-Date)" -ForegroundColor Gray
