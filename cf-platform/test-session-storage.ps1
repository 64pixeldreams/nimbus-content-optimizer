$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "Testing session storage..."

try {
    # Test login and check logs
    $loginBody = '{"email":"newuser_1118197149@example.com","password":"TestPassword123!"}'
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    Write-Host "Login successful: $($loginData.session_token.Substring(0,10))..."
    
    # Check logs
    $logsResponse = Invoke-WebRequest -Uri "$baseUrl/debug/logs" -Method GET
    $logsData = $logsResponse.Content | ConvertFrom-Json
    
    Write-Host "`nSession storage logs:"
    if ($logsData.logs.Count -gt 0) {
        $logsData.logs | Where-Object { $_.message -like "*session*" -or $_.message -like "*Session*" } | ForEach-Object {
            Write-Host "[$($_.level)] $($_.context): $($_.message)"
            if ($_.data) {
                Write-Host "  Data: $($_.data | ConvertTo-Json -Compress)"
            }
        }
    } else {
        Write-Host "No logs found"
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}
