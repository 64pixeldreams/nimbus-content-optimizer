# Project Creation Test
$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "Testing Project Creation" -ForegroundColor Cyan

# Step 1: Signup User
Write-Host "`n1. Creating Test User..." -ForegroundColor Yellow
$testEmail = "projecttest_$(Get-Random -Maximum 99999)@example.com"
$signupBody = @{
    email = $testEmail
    password = "TestPassword123!"
    name = "Project Test User"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/signup" -Method POST -Body $signupBody -ContentType "application/json"
    Write-Host "✅ User Created: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ User Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Login User
Write-Host "`n2. Logging In User..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = "TestPassword123!"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ User Logged In: $($response.StatusCode)" -ForegroundColor Green
    $loginData = $response.Content | ConvertFrom-Json
    $sessionCookie = $response.Headers['Set-Cookie']
    Write-Host "   Session: $($loginData.session_token.Substring(0,10))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Create Project
Write-Host "`n3. Creating Project..." -ForegroundColor Yellow
$projectBody = @{
    action = "project.create"
    payload = @{
        name = "Test Project"
        domain = "test-project.com"
        description = "A test project"
    }
} | ConvertTo-Json

try {
    $headers = @{ 'Cookie' = $sessionCookie }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $projectBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ Project Created: $($response.StatusCode)" -ForegroundColor Green
    $projectData = $response.Content | ConvertFrom-Json
    Write-Host "   Project ID: $($projectData.data.project.project_id)" -ForegroundColor Gray
    Write-Host "   Project Name: $($projectData.data.project.name)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Project Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "   Error Details: $errorContent" -ForegroundColor Red
    }
    exit 1
}

# Step 4: List Projects
Write-Host "`n4. Listing Projects..." -ForegroundColor Yellow
$listBody = @{
    action = "project.list"
    payload = @{}
} | ConvertTo-Json

try {
    $headers = @{ 'Cookie' = $sessionCookie }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $listBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ Projects Listed: $($response.StatusCode)" -ForegroundColor Green
    $listData = $response.Content | ConvertFrom-Json
    Write-Host "   Found $($listData.data.projects.Count) project(s)" -ForegroundColor Gray
    foreach ($project in $listData.data.projects) {
        Write-Host "   - $($project.name) ($($project.domain))" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Project Listing Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "   Error Details: $errorContent" -ForegroundColor Red
    }
    exit 1
}

Write-Host "`n🎉 PROJECT CREATION TEST PASSED!" -ForegroundColor Green
Write-Host "Your platform can:" -ForegroundColor White
Write-Host "  ✅ Create users" -ForegroundColor Green
Write-Host "  ✅ Login users" -ForegroundColor Green
Write-Host "  ✅ Create projects" -ForegroundColor Green
Write-Host "  ✅ List projects" -ForegroundColor Green
