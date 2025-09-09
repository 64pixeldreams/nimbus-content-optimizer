# Test with Logs to Debug Session Issue
$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "Testing with Logs to Debug Session Issue" -ForegroundColor Cyan

# Step 1: Login to get session
Write-Host "`n1. Getting Session..." -ForegroundColor Yellow
$testEmail = "logtest_$(Get-Random -Maximum 99999)@example.com"
$signupBody = @{
    email = $testEmail
    password = "TestPassword123!"
    name = "Log Test User"
} | ConvertTo-Json

# Signup
Invoke-WebRequest -Uri "$baseUrl/auth/signup" -Method POST -Body $signupBody -ContentType "application/json" | Out-Null

# Login
$loginBody = @{
    email = $testEmail
    password = "TestPassword123!"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$loginData = $response.Content | ConvertFrom-Json
$sessionCookie = $response.Headers['Set-Cookie']

Write-Host "✅ Session obtained: $($loginData.session_token.Substring(0,10))..." -ForegroundColor Green
Write-Host "Cookie: $($sessionCookie.Substring(0,60))..." -ForegroundColor Gray

# Step 2: Try project.create and capture any logs
Write-Host "`n2. Testing project.create..." -ForegroundColor Yellow
$projectBody = @{
    action = "project.create"
    payload = @{
        name = "Log Test Project"
        domain = "log-test.com"
        description = "Testing with logs"
    }
} | ConvertTo-Json

try {
    $headers = @{ 'cookie' = $sessionCookie }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $projectBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ project.create worked: $($response.StatusCode)" -ForegroundColor Green
    $projectData = $response.Content | ConvertFrom-Json
    
    if ($projectData.logs) {
        Write-Host "`nLogs from successful request:" -ForegroundColor Yellow
        foreach ($log in $projectData.logs) {
            Write-Host "[$($log.level)] $($log.context): $($log.message)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ project.create failed: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "Error Response: $errorContent" -ForegroundColor Red
        
        try {
            $errorData = $errorContent | ConvertFrom-Json
            if ($errorData.logs) {
                Write-Host "`nLogs from failed request:" -ForegroundColor Yellow
                foreach ($log in $errorData.logs) {
                    Write-Host "[$($log.level)] $($log.context): $($log.message)" -ForegroundColor Gray
                }
            }
        } catch {
            Write-Host "Could not parse error response as JSON" -ForegroundColor Red
        }
    }
}

# Step 3: Get platform logs
Write-Host "`n3. Getting platform logs..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/debug/logs" -Method GET
    $logsData = $response.Content | ConvertFrom-Json
    
    Write-Host "`nRecent platform logs:" -ForegroundColor Yellow
    $logsData.logs | Select-Object -Last 10 | ForEach-Object {
        Write-Host "[$($_.level)] $($_.context): $($_.message)" -ForegroundColor Gray
        if ($_.data) {
            Write-Host "  Data: $($_.data | ConvertTo-Json -Compress)" -ForegroundColor DarkGray
        }
    }
} catch {
    Write-Host "❌ Could not get platform logs: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nLog test completed!" -ForegroundColor Cyan
