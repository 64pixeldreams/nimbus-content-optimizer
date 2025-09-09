# Debug Project Creation Issue
$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "Debug Project Creation" -ForegroundColor Cyan

# Setup user and session
$testEmail = "projdebug_$(Get-Random -Maximum 99999)@example.com"
$signupBody = @{
    email = $testEmail
    password = "TestPassword123!"
    name = "Project Debug User"
} | ConvertTo-Json

Invoke-WebRequest -Uri "$baseUrl/auth/signup" -Method POST -Body $signupBody -ContentType "application/json" | Out-Null

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

Write-Host "User: $($loginData.email)" -ForegroundColor Gray
Write-Host "Session: $($sessionToken.Substring(0,10))..." -ForegroundColor Gray

# Test project creation with detailed response
Write-Host "`nTesting project creation..." -ForegroundColor Yellow
$projectBody = @{
    action = "project.create"
    payload = @{
        name = "Debug Project"
        domain = "debug-project.com"
        description = "Testing project creation"
    }
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $projectBody -ContentType "application/json" -WebSession $session
    $projectData = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Project creation response: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Full response:" -ForegroundColor Yellow
    Write-Host ($projectData | ConvertTo-Json -Depth 5) -ForegroundColor Gray
    
    if ($projectData.logs) {
        Write-Host "`nLogs from project creation:" -ForegroundColor Yellow
        $projectData.logs | Select-Object -Last 5 | ForEach-Object {
            Write-Host "[$($_.level)] $($_.context): $($_.message)" -ForegroundColor DarkGray
        }
    }
} catch {
    Write-Host "❌ Project creation failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "Error details: $errorContent" -ForegroundColor Red
    }
}

Write-Host "`nProject debug completed!" -ForegroundColor Cyan
