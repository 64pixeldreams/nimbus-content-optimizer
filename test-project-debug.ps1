$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "=== Debug Project Authentication ==="

# Step 1: Login and get session
$loginBody = @{
    email = "newuser_1118197149@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

try {
    Write-Host "1. Getting session..."
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $sessionCookie = $loginResponse.Headers['Set-Cookie']
    
    Write-Host "✅ Login successful: $($loginData.email)"
    Write-Host "Session cookie: $($sessionCookie.Substring(0,50))..."
    
    # Step 2: Test CloudFunction with session
    Write-Host "`n2. Testing CloudFunction with session..."
    $projectBody = @{
        action = "project.create"
        payload = @{
            name = "Debug Test Project"
            domain = "debugtest.com"
            description = "Testing auth"
        }
    } | ConvertTo-Json
    
    $headers = @{ 'Cookie' = $sessionCookie }
    Write-Host "Headers: Cookie = $($sessionCookie.Substring(0,30))..."
    
    $projectResponse = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $projectBody -ContentType "application/json" -Headers $headers -ErrorAction Stop
    $projectData = $projectResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Project creation successful!"
    Write-Host "Project ID: $($projectData.data.project.project_id)"
    
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)"
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
    
    # Check if we can get logs
    try {
        $logsResponse = Invoke-WebRequest -Uri "$baseUrl/debug/logs" -Method GET
        $logsData = $logsResponse.Content | ConvertFrom-Json
        Write-Host "`nRecent logs:"
        $logsData.logs | Select-Object -Last 3 | ForEach-Object {
            Write-Host "[$($_.level)] $($_.context): $($_.message)"
        }
    } catch {
        Write-Host "Could not get logs"
    }
}
