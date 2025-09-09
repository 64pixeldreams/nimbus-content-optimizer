# Compare hello.world vs project.create
$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "Comparing hello.world vs project.create" -ForegroundColor Cyan

# Setup: Create user and get session
$testEmail = "compare_$(Get-Random -Maximum 99999)@example.com"
$signupBody = @{
    email = $testEmail
    password = "TestPassword123!"
    name = "Compare Test User"
} | ConvertTo-Json

Invoke-WebRequest -Uri "$baseUrl/auth/signup" -Method POST -Body $signupBody -ContentType "application/json" | Out-Null

$loginBody = @{
    email = $testEmail
    password = "TestPassword123!"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$loginData = $response.Content | ConvertFrom-Json
$sessionCookie = $response.Headers['Set-Cookie']

Write-Host "Session: $($loginData.session_token.Substring(0,10))..." -ForegroundColor Gray

# Test 1: hello.world (should work)
Write-Host "`n1. Testing hello.world..." -ForegroundColor Yellow
$helloBody = @{
    action = "hello.world"
    payload = @{}
} | ConvertTo-Json

try {
    $headers = @{ 'Cookie' = $sessionCookie }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $helloBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ hello.world: $($response.StatusCode)" -ForegroundColor Green
    $helloData = $response.Content | ConvertFrom-Json
    Write-Host "   Message: $($helloData.data.message)" -ForegroundColor Gray
    Write-Host "   User: $($helloData.data.user)" -ForegroundColor Gray
    
    if ($helloData.logs) {
        Write-Host "   Logs:" -ForegroundColor Gray
        $helloData.logs | Where-Object { $_.context -like "*auth*" } | ForEach-Object {
            Write-Host "     [$($_.level)] $($_.context): $($_.message)" -ForegroundColor DarkGray
        }
    }
} catch {
    Write-Host "❌ hello.world failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "   Error: $errorContent" -ForegroundColor Red
    }
}

# Test 2: project.create (currently fails)
Write-Host "`n2. Testing project.create..." -ForegroundColor Yellow
$projectBody = @{
    action = "project.create"
    payload = @{
        name = "Compare Test Project"
        domain = "compare-test.com"
        description = "Testing comparison"
    }
} | ConvertTo-Json

try {
    $headers = @{ 'Cookie' = $sessionCookie }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $projectBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ project.create: $($response.StatusCode)" -ForegroundColor Green
    $projectData = $response.Content | ConvertFrom-Json
    Write-Host "   Project: $($projectData.data.project.name)" -ForegroundColor Gray
    
    if ($projectData.logs) {
        Write-Host "   Logs:" -ForegroundColor Gray
        $projectData.logs | Where-Object { $_.context -like "*auth*" } | ForEach-Object {
            Write-Host "     [$($_.level)] $($_.context): $($_.message)" -ForegroundColor DarkGray
        }
    }
} catch {
    Write-Host "❌ project.create failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "   Error: $errorContent" -ForegroundColor Red
        
        try {
            $errorData = $errorContent | ConvertFrom-Json
            if ($errorData.logs) {
                Write-Host "   Auth Logs:" -ForegroundColor Gray
                $errorData.logs | Where-Object { $_.context -like "*auth*" } | ForEach-Object {
                    Write-Host "     [$($_.level)] $($_.context): $($_.message)" -ForegroundColor DarkGray
                    if ($_.data) {
                        Write-Host "       Data: $($_.data | ConvertTo-Json -Compress)" -ForegroundColor DarkGray
                    }
                }
            }
        } catch {
            # Could not parse as JSON
        }
    }
}

Write-Host "`nComparison completed!" -ForegroundColor Cyan
