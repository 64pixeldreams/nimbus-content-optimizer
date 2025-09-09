# Debug Function Metadata and Auth
$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "Debug Function Metadata and Auth" -ForegroundColor Cyan

# Setup session
$testEmail = "debug_$(Get-Random -Maximum 99999)@example.com"
$signupBody = @{
    email = $testEmail
    password = "TestPassword123!"
    name = "Debug User"
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

# Create a debug function to inspect metadata
Write-Host "`n1. Testing with debug function..." -ForegroundColor Yellow
$debugBody = @{
    action = "debug.session"
    payload = @{}
} | ConvertTo-Json

try {
    $headers = @{ 'Cookie' = $sessionCookie }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $debugBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ debug.session: $($response.StatusCode)" -ForegroundColor Green
    $debugData = $response.Content | ConvertFrom-Json
    Write-Host "   Response: $($debugData | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
} catch {
    Write-Host "❌ debug.session failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "   Error: $errorContent" -ForegroundColor Red
    }
}

# Test hello.world to see exact auth context
Write-Host "`n2. Testing hello.world for auth context..." -ForegroundColor Yellow
$helloBody = @{
    action = "hello.world"
    payload = @{}
} | ConvertTo-Json

try {
    $headers = @{ 'Cookie' = $sessionCookie }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $helloBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ hello.world: $($response.StatusCode)" -ForegroundColor Green
    $helloData = $response.Content | ConvertFrom-Json
    Write-Host "   User: $($helloData.data.user)" -ForegroundColor Gray
    Write-Host "   Message: $($helloData.data.message)" -ForegroundColor Gray
    
    # Look for auth-related logs
    if ($helloData.logs) {
        Write-Host "`n   Auth-related logs:" -ForegroundColor Yellow
        $helloData.logs | Where-Object { $_.context -like "*auth*" -or $_.message -like "*auth*" -or $_.message -like "*session*" } | ForEach-Object {
            Write-Host "     [$($_.level)] $($_.context): $($_.message)" -ForegroundColor DarkGray
            if ($_.data) {
                Write-Host "       Data: $($_.data | ConvertTo-Json -Compress)" -ForegroundColor DarkGray
            }
        }
    }
} catch {
    Write-Host "❌ hello.world failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nDebug completed!" -ForegroundColor Cyan
