# Complete User Journey E2E Test
# Tests: Signup → Login → Create Project → List → Logout → Login → List
# Validates: Auth, Sessions, Project Management, User Isolation

$baseUrl = "https://nimbus-platform.martin-598.workers.dev"
$testResults = @()

# Test data
$user1 = @{
    email = "testuser1_$(Get-Random -Maximum 99999)@example.com"
    password = "TestPassword123!"
    name = "Test User 1"
}

$user2 = @{
    email = "testuser2_$(Get-Random -Maximum 99999)@example.com"
    password = "TestPassword123!"
    name = "Test User 2"
}

$project1 = @{
    name = "User 1 Project"
    domain = "user1-project.com"
    description = "Test project for user 1"
}

$project2 = @{
    name = "User 2 Project"
    domain = "user2-project.com"
    description = "Test project for user 2"
}

function Test-Step {
    param(
        [string]$Name,
        [scriptblock]$TestBlock
    )
    
    Write-Host "`n🧪 Testing: $Name" -ForegroundColor Yellow
    Write-Host "=" * 50 -ForegroundColor Gray
    
    $result = @{
        Name = $Name
        Success = $false
        Error = $null
        Data = $null
    }
    
    try {
        $result.Data = & $TestBlock
        $result.Success = $true
        Write-Host "✅ PASSED: $Name" -ForegroundColor Green
    }
    catch {
        $result.Error = $_.Exception.Message
        Write-Host "❌ FAILED: $Name" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    $script:testResults += $result
    return $result
}

Write-Host "🚀 COMPLETE USER JOURNEY E2E TEST" -ForegroundColor Cyan
Write-Host "Target: $baseUrl" -ForegroundColor Gray
Write-Host "Time: $(Get-Date)" -ForegroundColor Gray

# =============================================================================
# PHASE 1: USER 1 SETUP
# =============================================================================

Write-Host "`n📋 PHASE 1: USER 1 SETUP" -ForegroundColor Magenta

# Step 1: Signup User 1
$user1Signup = Test-Step "User 1 Signup" {
    $body = @{
        email = $user1.email
        password = $user1.password
        name = $user1.name
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method POST -Body $body -ContentType "application/json"
    
    if (-not $response.success) {
        throw "Signup failed: $($response.error)"
    }
    
    return $response
}

if (-not $user1Signup.Success) {
    Write-Host "❌ Cannot continue - User 1 signup failed" -ForegroundColor Red
    exit 1
}

# Step 2: Login User 1
$user1Login = Test-Step "User 1 Login" {
    $body = @{
        email = $user1.email
        password = $user1.password
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $body -ContentType "application/json"
    $loginData = $response.Content | ConvertFrom-Json
    $sessionCookie = $response.Headers['Set-Cookie']
    
    if (-not $loginData.success) {
        throw "Login failed: $($loginData.error)"
    }
    
    return @{
        data = $loginData
        cookie = $sessionCookie
    }
}

if (-not $user1Login.Success) {
    Write-Host "❌ Cannot continue - User 1 login failed" -ForegroundColor Red
    exit 1
}

$user1Cookie = $user1Login.Data.cookie

# Step 3: Create Project for User 1
$user1Project = Test-Step "User 1 Create Project" {
    $body = @{
        action = "project.create"
        payload = $project1
    } | ConvertTo-Json
    
    $headers = @{ 'Cookie' = $user1Cookie }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/function" -Method POST -Body $body -ContentType "application/json" -Headers $headers
    
    if (-not $response.success) {
        throw "Project creation failed: $($response.error)"
    }
    
    return $response
}

if (-not $user1Project.Success) {
    Write-Host "❌ Cannot continue - User 1 project creation failed" -ForegroundColor Red
    exit 1
}

$user1ProjectId = $user1Project.Data.data.project.project_id

# Step 4: List Projects for User 1
$user1List = Test-Step "User 1 List Projects" {
    $body = @{
        action = "project.list"
        payload = @{}
    } | ConvertTo-Json
    
    $headers = @{ 'Cookie' = $user1Cookie }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/function" -Method POST -Body $body -ContentType "application/json" -Headers $headers
    
    if (-not $response.success) {
        throw "Project listing failed: $($response.error)"
    }
    
    if ($response.data.projects.Count -ne 1) {
        throw "Expected 1 project, found $($response.data.projects.Count)"
    }
    
    return $response
}

# =============================================================================
# PHASE 2: USER 2 SETUP
# =============================================================================

Write-Host "`n📋 PHASE 2: USER 2 SETUP" -ForegroundColor Magenta

# Step 5: Signup User 2
$user2Signup = Test-Step "User 2 Signup" {
    $body = @{
        email = $user2.email
        password = $user2.password
        name = $user2.name
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method POST -Body $body -ContentType "application/json"
    
    if (-not $response.success) {
        throw "Signup failed: $($response.error)"
    }
    
    return $response
}

# Step 6: Login User 2
$user2Login = Test-Step "User 2 Login" {
    $body = @{
        email = $user2.email
        password = $user2.password
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $body -ContentType "application/json"
    $loginData = $response.Content | ConvertFrom-Json
    $sessionCookie = $response.Headers['Set-Cookie']
    
    if (-not $loginData.success) {
        throw "Login failed: $($loginData.error)"
    }
    
    return @{
        data = $loginData
        cookie = $sessionCookie
    }
}

$user2Cookie = $user2Login.Data.cookie

# Step 7: Create Project for User 2
$user2Project = Test-Step "User 2 Create Project" {
    $body = @{
        action = "project.create"
        payload = $project2
    } | ConvertTo-Json
    
    $headers = @{ 'Cookie' = $user2Cookie }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/function" -Method POST -Body $body -ContentType "application/json" -Headers $headers
    
    if (-not $response.success) {
        throw "Project creation failed: $($response.error)"
    }
    
    return $response
}

# =============================================================================
# PHASE 3: USER ISOLATION TEST
# =============================================================================

Write-Host "`n📋 PHASE 3: USER ISOLATION TEST" -ForegroundColor Magenta

# Step 8: User 2 List Projects (should only see their own)
$user2List = Test-Step "User 2 List Projects (Isolation Test)" {
    $body = @{
        action = "project.list"
        payload = @{}
    } | ConvertTo-Json
    
    $headers = @{ 'Cookie' = $user2Cookie }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/function" -Method POST -Body $body -ContentType "application/json" -Headers $headers
    
    if (-not $response.success) {
        throw "Project listing failed: $($response.error)"
    }
    
    if ($response.data.projects.Count -ne 1) {
        throw "Expected 1 project for User 2, found $($response.data.projects.Count)"
    }
    
    # Verify it's User 2's project, not User 1's
    if ($response.data.projects[0].name -ne $project2.name) {
        throw "User 2 can see wrong project: $($response.data.projects[0].name)"
    }
    
    return $response
}

# Step 9: User 1 List Projects Again (should still see their project)
$user1List2 = Test-Step "User 1 List Projects Again" {
    $body = @{
        action = "project.list"
        payload = @{}
    } | ConvertTo-Json
    
    $headers = @{ 'Cookie' = $user1Cookie }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/function" -Method POST -Body $body -ContentType "application/json" -Headers $headers
    
    if (-not $response.success) {
        throw "Project listing failed: $($response.error)"
    }
    
    if ($response.data.projects.Count -ne 1) {
        throw "Expected 1 project for User 1, found $($response.data.projects.Count)"
    }
    
    return $response
}

# =============================================================================
# PHASE 4: SESSION PERSISTENCE TEST
# =============================================================================

Write-Host "`n📋 PHASE 4: SESSION PERSISTENCE TEST" -ForegroundColor Magenta

# Step 10: User 1 Logout
$user1Logout = Test-Step "User 1 Logout" {
    $headers = @{ 'Cookie' = $user1Cookie }
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/logout" -Method POST -Headers $headers
    
    if (-not $response.success) {
        throw "Logout failed: $($response.error)"
    }
    
    return $response
}

# Step 11: User 1 Login Again
$user1Login2 = Test-Step "User 1 Login Again" {
    $body = @{
        email = $user1.email
        password = $user1.password
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $body -ContentType "application/json"
    $loginData = $response.Content | ConvertFrom-Json
    $sessionCookie = $response.Headers['Set-Cookie']
    
    if (-not $loginData.success) {
        throw "Login failed: $($response.error)"
    }
    
    return @{
        data = $loginData
        cookie = $sessionCookie
    }
}

$user1Cookie2 = $user1Login2.Data.cookie

# Step 12: User 1 List Projects After Re-login
$user1List3 = Test-Step "User 1 List Projects After Re-login" {
    $body = @{
        action = "project.list"
        payload = @{}
    } | ConvertTo-Json
    
    $headers = @{ 'Cookie' = $user1Cookie2 }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/function" -Method POST -Body $body -ContentType "application/json" -Headers $headers
    
    if (-not $response.success) {
        throw "Project listing failed: $($response.error)"
    }
    
    if ($response.data.projects.Count -ne 1) {
        throw "Expected 1 project for User 1 after re-login, found $($response.data.projects.Count)"
    }
    
    return $response
}

# =============================================================================
# RESULTS
# =============================================================================

Write-Host "`n📊 TEST RESULTS" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

$passed = ($testResults | Where-Object { $_.Success }).Count
$total = $testResults.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $($total - $passed)" -ForegroundColor Red

if ($passed -eq $total) {
    Write-Host "`n🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "Your platform is ready for locking! 🚀" -ForegroundColor Green
} else {
    Write-Host "`n❌ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "Please fix issues before locking modules." -ForegroundColor Red
}

Write-Host "`n📋 Detailed Results:" -ForegroundColor Yellow
foreach ($result in $testResults) {
    $status = if ($result.Success) { "✅" } else { "❌" }
    Write-Host "$status $($result.Name)" -ForegroundColor $(if ($result.Success) { "Green" } else { "Red" })
    if ($result.Error) {
        Write-Host "   Error: $($result.Error)" -ForegroundColor Red
    }
}
