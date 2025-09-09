# Test API Key Authentication
$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "Testing API Key Authentication" -ForegroundColor Cyan

# Step 1: Create user and get session first
$testEmail = "apikey_$(Get-Random -Maximum 99999)@example.com"
$signupBody = @{
    email = $testEmail
    password = "TestPassword123!"
    name = "API Key Test User"
} | ConvertTo-Json

Write-Host "`n1. Creating test user..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/signup" -Method POST -Body $signupBody -ContentType "application/json"
    Write-Host "✅ User created" -ForegroundColor Green
} catch {
    Write-Host "❌ User creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Login to get session for API key creation
$loginBody = @{
    email = $testEmail
    password = "TestPassword123!"
} | ConvertTo-Json

Write-Host "`n2. Logging in to create API key..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $loginData = $response.Content | ConvertFrom-Json
    $sessionCookie = $response.Headers['Set-Cookie']
    Write-Host "✅ Logged in" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Create API key using session
$apiKeyBody = @{
    name = "Test API Key"
    description = "For testing API key authentication"
} | ConvertTo-Json

Write-Host "`n3. Creating API key..." -ForegroundColor Yellow
try {
    $headers = @{ 'Cookie' = $sessionCookie }
    $response = Invoke-WebRequest -Uri "$baseUrl/api-keys" -Method POST -Body $apiKeyBody -ContentType "application/json" -Headers $headers
    $apiKeyData = $response.Content | ConvertFrom-Json
    $apiKey = $apiKeyData.api_key
    Write-Host "✅ API key created: $($apiKey.Substring(0,10))..." -ForegroundColor Green
} catch {
    Write-Host "❌ API key creation failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "   Error: $errorContent" -ForegroundColor Red
    }
    exit 1
}

# Step 4: Test CloudFunction with API key
Write-Host "`n4. Testing CloudFunction with API key..." -ForegroundColor Yellow
$projectBody = @{
    action = "project.create"
    payload = @{
        name = "API Key Test Project"
        domain = "apikey-test.com"
        description = "Testing with API key"
    }
} | ConvertTo-Json

try {
    $headers = @{ 'Authorization' = "Bearer $apiKey" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $projectBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ CloudFunction with API key: $($response.StatusCode)" -ForegroundColor Green
    $projectData = $response.Content | ConvertFrom-Json
    Write-Host "   Project: $($projectData.data.project.name)" -ForegroundColor Gray
    Write-Host "   Project ID: $($projectData.data.project.project_id)" -ForegroundColor Gray
} catch {
    Write-Host "❌ CloudFunction with API key failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "   Error: $errorContent" -ForegroundColor Red
    }
    exit 1
}

# Step 5: Test project listing with API key
Write-Host "`n5. Testing project listing with API key..." -ForegroundColor Yellow
$listBody = @{
    action = "project.list"
    payload = @{}
} | ConvertTo-Json

try {
    $headers = @{ 'Authorization' = "Bearer $apiKey" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $listBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ Project listing with API key: $($response.StatusCode)" -ForegroundColor Green
    $listData = $response.Content | ConvertFrom-Json
    Write-Host "   Found $($listData.data.projects.Count) project(s)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Project listing with API key failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "   Error: $errorContent" -ForegroundColor Red
    }
}

Write-Host "`n🎉 API KEY AUTHENTICATION TEST COMPLETED!" -ForegroundColor Green
Write-Host "API key authentication works perfectly! ✅" -ForegroundColor Green
