$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "Testing CloudFunction with API key auth..."

# First get a session to create an API key
$loginBody = '{"email":"newuser_1118197149@example.com","password":"TestPassword123!"}'

try {
    Write-Host "1. Getting session..."
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $sessionCookie = $loginResponse.Headers['Set-Cookie']
    
    Write-Host "✅ Session obtained"
    
    # Create API key using REST endpoint (should work)
    Write-Host "`n2. Creating API key via REST..."
    $createKeyBody = '{"name":"Test Key","permissions":["read","write"]}'
    $headers = @{ 'Cookie' = $sessionCookie }
    
    $keyResponse = Invoke-WebRequest -Uri "$baseUrl/api-keys" -Method POST -Body $createKeyBody -ContentType "application/json" -Headers $headers
    $keyData = $keyResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ API key created: $($keyData.api_key.Substring(0,15))..."
    
    # Test CloudFunction with API key
    Write-Host "`n3. Testing CloudFunction with API key..."
    $cfBody = '{"action":"project.create","payload":{"name":"API Test Project","domain":"apitest.com"}}'
    $apiHeaders = @{ 'Authorization' = "Bearer $($keyData.api_key)" }
    
    $cfResponse = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $cfBody -ContentType "application/json" -Headers $apiHeaders
    $cfData = $cfResponse.Content | ConvertFrom-Json
    
    if ($cfData.success) {
        Write-Host "✅ CLOUDFUNCTION WITH API KEY WORKS!"
        Write-Host "Project ID: $($cfData.data.project.project_id)"
    } else {
        Write-Host "❌ CloudFunction failed: $($cfData.error)"
    }
    
} catch {
    Write-Host "❌ TEST FAILED: $($_.Exception.Message)"
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
}
