# Test Headers Being Passed to CloudFunction
$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "Testing Headers Passed to CloudFunction" -ForegroundColor Cyan

# Setup session
$testEmail = "headers_$(Get-Random -Maximum 99999)@example.com"
$signupBody = @{
    email = $testEmail
    password = "TestPassword123!"
    name = "Headers Test User"
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
Write-Host "Cookie: $sessionCookie" -ForegroundColor Gray

# Create a simple debug function call to see what headers are received
$debugBody = @{
    action = "debug.headers"
    payload = @{}
} | ConvertTo-Json

Write-Host "`nTesting CloudFunction with headers..." -ForegroundColor Yellow
try {
    $headers = @{ 
        'Cookie' = $sessionCookie
        'X-Test-Header' = 'test-value'
    }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $debugBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ CloudFunction response: $($response.StatusCode)" -ForegroundColor Green
    $debugData = $response.Content | ConvertFrom-Json
    
    if ($debugData.success) {
        Write-Host "   Headers received by CloudFunction:" -ForegroundColor Yellow
        if ($debugData.data.headers) {
            $debugData.data.headers | Get-Member -MemberType NoteProperty | ForEach-Object {
                $name = $_.Name
                $value = $debugData.data.headers.$name
                Write-Host "     $name : $value" -ForegroundColor Gray
            }
        }
        
        Write-Host "`n   Cookie analysis:" -ForegroundColor Yellow
        Write-Host "     Has Cookie header: $($debugData.data.hasCookieHeader)" -ForegroundColor Gray
        Write-Host "     Cookie content: $($debugData.data.cookieContent)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ CloudFunction call failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   debug.headers function not found - this is expected" -ForegroundColor Yellow
    }
}

Write-Host "`nHeaders test completed!" -ForegroundColor Cyan
