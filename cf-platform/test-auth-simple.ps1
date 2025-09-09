$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "Testing auth with fresh session..."

try {
    # Get fresh session
    $loginBody = '{"email":"newuser_1118197149@example.com","password":"TestPassword123!"}'
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $sessionCookie = $loginResponse.Headers['Set-Cookie']
    
    Write-Host "Fresh session: $($loginData.session_token.Substring(0,10))..."
    
    # Test authenticated endpoint immediately
    $headers = @{ 'Cookie' = $sessionCookie }
    $meResponse = Invoke-WebRequest -Uri "$baseUrl/auth/me" -Method GET -Headers $headers
    $meData = $meResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ AUTH WORKS: $($meData.email)"
    
} catch {
    Write-Host "❌ AUTH FAILED: $($_.Exception.Message)"
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
}
