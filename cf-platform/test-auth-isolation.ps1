# Isolated test to compare working REST auth vs failing CloudFunction auth
$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "=== AUTH ISOLATION TEST ==="

# Step 1: Get a valid session (we know this works)
$loginBody = '{"email":"newuser_1118197149@example.com","password":"TestPassword123!"}'

try {
    Write-Host "1. Getting valid session (WORKING component)..."
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $sessionCookie = $loginResponse.Headers['Set-Cookie']
    
    Write-Host "✅ Session obtained: $($loginData.session_token.Substring(0,10))..."
    Write-Host "Cookie format: $($sessionCookie.Substring(0,50))..."
    
    # Step 2: Test REST endpoint with session (should work)
    Write-Host "`n2. Testing REST auth with session..."
    $headers = @{ 'Cookie' = $sessionCookie }
    
    try {
        $restResponse = Invoke-WebRequest -Uri "$baseUrl/auth/me" -Method GET -Headers $headers -ErrorAction Stop
        $restData = $restResponse.Content | ConvertFrom-Json
        Write-Host "✅ REST AUTH WORKS: $($restData.email)"
    } catch {
        Write-Host "❌ REST AUTH FAILED: $($_.Exception.Response.StatusCode)"
        Write-Host "This means our session/auth system is broken"
        exit 1
    }
    
    # Step 3: Test CloudFunction with same session (currently fails)
    Write-Host "`n3. Testing CloudFunction auth with same session..."
    $cfBody = '{"action":"hello.world","payload":{}}'
    
    try {
        $cfResponse = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $cfBody -ContentType "application/json" -Headers $headers -ErrorAction Stop
        $cfData = $cfResponse.Content | ConvertFrom-Json
        Write-Host "✅ CLOUDFUNCTION AUTH WORKS!"
    } catch {
        Write-Host "❌ CLOUDFUNCTION AUTH FAILED: $($_.Exception.Response.StatusCode)"
        Write-Host "This isolates the issue to CloudFunction auth middleware"
        
        # Get CloudFunction logs for analysis
        try {
            $logsResponse = Invoke-WebRequest -Uri "$baseUrl/debug/logs" -Method GET
            $logsData = $logsResponse.Content | ConvertFrom-Json
            Write-Host "`nCloudFunction logs:"
            $logsData.logs | Select-Object -Last 5 | ForEach-Object {
                Write-Host "[$($_.level)] $($_.context): $($_.message)"
            }
        } catch {
            Write-Host "Could not get logs"
        }
    }
    
    Write-Host "`n=== AUTH ISOLATION COMPLETE ==="
    
} catch {
    Write-Host "❌ ISOLATION TEST FAILED: $($_.Exception.Message)"
}
