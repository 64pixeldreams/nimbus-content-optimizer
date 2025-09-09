# Test the debug auth endpoint
$baseUrl = "https://nimbus-platform.martin-598.workers.dev"
$sessionToken = "07363ff4d4b543cfbba744e7fdc233ea6cc006aede78d1d491a210e33bd3cf1e"

Write-Host "Testing debug auth endpoint..." -ForegroundColor Cyan

try {
    $uri = "$baseUrl/debug/test-auth"
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $cookie = New-Object System.Net.Cookie("nimbus_session", $sessionToken, "/", "nimbus-platform.martin-598.workers.dev")
    $session.Cookies.Add($cookie)
    
    $response = Invoke-WebRequest -Uri $uri -WebSession $session -Method GET
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host "Success! Auth worked!" -ForegroundColor Green
    Write-Host ($result | ConvertTo-Json -Depth 10)
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "Authentication failed (401)" -ForegroundColor Red
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd() | ConvertFrom-Json
        
        if ($responseBody.logs) {
            Write-Host "`nDetailed logs:" -ForegroundColor Yellow
            foreach ($log in $responseBody.logs) {
                Write-Host "[$($log.level)] $($log.context): $($log.message)" -ForegroundColor Gray
                if ($log.data) {
                    Write-Host "  Data: $($log.data | ConvertTo-Json -Compress)" -ForegroundColor DarkGray
                }
            }
        }
    } else {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}
