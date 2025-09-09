# Debug Cookie Parsing
$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "Debug Cookie Parsing" -ForegroundColor Cyan

# Setup session
$testEmail = "cookie_$(Get-Random -Maximum 99999)@example.com"
$signupBody = @{
    email = $testEmail
    password = "TestPassword123!"
    name = "Cookie Test User"
} | ConvertTo-Json

Invoke-WebRequest -Uri "$baseUrl/auth/signup" -Method POST -Body $signupBody -ContentType "application/json" | Out-Null

$loginBody = @{
    email = $testEmail
    password = "TestPassword123!"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$loginData = $response.Content | ConvertFrom-Json
$sessionCookie = $response.Headers['Set-Cookie']

Write-Host "Session Token: $($loginData.session_token.Substring(0,20))..." -ForegroundColor Gray
Write-Host "Cookie Header: $($sessionCookie)" -ForegroundColor Gray

# Parse the cookie to see the exact format
$cookieParts = $sessionCookie -split ';'
Write-Host "Cookie Parts:" -ForegroundColor Gray
foreach ($part in $cookieParts) {
    Write-Host "  $part" -ForegroundColor DarkGray
}

# Test with manual cookie construction
Write-Host "`nTesting with manual cookie..." -ForegroundColor Yellow
$manualCookie = "nimbus_session=$($loginData.session_token)"
Write-Host "Manual Cookie: $manualCookie" -ForegroundColor Gray

$helloBody = @{
    action = "hello.world"
    payload = @{}
} | ConvertTo-Json

try {
    $headers = @{ 'Cookie' = $manualCookie }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $helloBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ Manual cookie test: $($response.StatusCode)" -ForegroundColor Green
    $helloData = $response.Content | ConvertFrom-Json
    Write-Host "   User: $($helloData.data.user)" -ForegroundColor Gray
    
    if ($helloData.logs) {
        Write-Host "`n   Auth logs:" -ForegroundColor Yellow
        $helloData.logs | Where-Object { $_.context -like "*auth*" -or $_.message -like "*session*" -or $_.message -like "*cookie*" } | ForEach-Object {
            Write-Host "     [$($_.level)] $($_.context): $($_.message)" -ForegroundColor DarkGray
            if ($_.data) {
                Write-Host "       Data: $($_.data | ConvertTo-Json -Compress)" -ForegroundColor DarkGray
            }
        }
    }
} catch {
    Write-Host "❌ Manual cookie test failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorContent = $reader.ReadToEnd()
        Write-Host "   Error: $errorContent" -ForegroundColor Red
    }
}

Write-Host "`nCookie debug completed!" -ForegroundColor Cyan
