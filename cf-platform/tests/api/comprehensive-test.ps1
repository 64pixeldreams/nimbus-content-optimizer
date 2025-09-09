# Comprehensive Test Suite for NimbusAI Platform
# This script tests all API endpoints and functionality

$baseUrl = "https://nimbus-platform.martin-598.workers.dev"
$testResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body = @{},
        [hashtable]$Headers = @{},
        [bool]$ExpectSuccess = $true
    )
    
    Write-Host "`nTesting: $Name" -ForegroundColor Yellow
    Write-Host "Endpoint: $Method $Endpoint" -ForegroundColor Gray
    
    $result = @{
        TestName = $Name
        Endpoint = "$Method $Endpoint"
        Success = $false
        Response = $null
        Error = $null
        StatusCode = $null
    }
    
    try {
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body.Count -gt 0) {
            $params.Body = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        $result.Success = $true
        $result.Response = $response
        $result.StatusCode = 200
        
        Write-Host "✓ Success" -ForegroundColor Green
        if ($response) {
            Write-Host "Response:" -ForegroundColor Gray
            $response | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor DarkGray
        }
    }
    catch {
        $result.Error = $_.Exception.Message
        if ($_.Exception.Response) {
            $result.StatusCode = [int]$_.Exception.Response.StatusCode
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            $result.Response = $errorBody
            Write-Host "✗ Failed (Status: $($result.StatusCode))" -ForegroundColor Red
            Write-Host "Error: $errorBody" -ForegroundColor Red
        } else {
            Write-Host "✗ Failed" -ForegroundColor Red
            Write-Host "Error: $_" -ForegroundColor Red
        }
    }
    
    $script:testResults += $result
    return $result
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NimbusAI Platform Comprehensive Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Target: $baseUrl" -ForegroundColor Gray
Write-Host "Time: $(Get-Date)" -ForegroundColor Gray

# Test 1: Health Check
Test-Endpoint -Name "Health Check" -Method "GET" -Endpoint "/health"

# Test 2: Invalid Endpoint
Test-Endpoint -Name "Invalid Endpoint (404)" -Method "GET" -Endpoint "/invalid" -ExpectSuccess $false

# Test 3: Signup Tests
$testEmail = "test_$(Get-Random -Maximum 99999)@example.com"
$signupResult = Test-Endpoint -Name "User Signup" -Method "POST" -Endpoint "/auth/signup" -Body @{
    email = $testEmail
    password = "TestPassword123!"
    name = "Test User"
}

# Test 4: Duplicate Signup
Test-Endpoint -Name "Duplicate Signup (Should Fail)" -Method "POST" -Endpoint "/auth/signup" -Body @{
    email = $testEmail
    password = "TestPassword123!"
    name = "Test User"
} -ExpectSuccess $false

# Test 5: Invalid Signup Data
Test-Endpoint -Name "Invalid Email Format" -Method "POST" -Endpoint "/auth/signup" -Body @{
    email = "invalid-email"
    password = "TestPassword123!"
} -ExpectSuccess $false

Test-Endpoint -Name "Weak Password" -Method "POST" -Endpoint "/auth/signup" -Body @{
    email = "another@example.com"
    password = "weak"
} -ExpectSuccess $false

Test-Endpoint -Name "Missing Required Fields" -Method "POST" -Endpoint "/auth/signup" -Body @{
    email = "missing@example.com"
} -ExpectSuccess $false

# Test 6: Login Tests
$loginResult = Test-Endpoint -Name "User Login" -Method "POST" -Endpoint "/auth/login" -Body @{
    email = $testEmail
    password = "TestPassword123!"
}

# Extract session cookie if available
$sessionToken = $null
if ($loginResult.Success -and $loginResult.Response) {
    # Session might be in cookie or response body
    $sessionToken = $loginResult.Response.sessionToken
}

# Test 7: Invalid Login
Test-Endpoint -Name "Invalid Password" -Method "POST" -Endpoint "/auth/login" -Body @{
    email = $testEmail
    password = "WrongPassword"
} -ExpectSuccess $false

Test-Endpoint -Name "Non-existent User Login" -Method "POST" -Endpoint "/auth/login" -Body @{
    email = "nonexistent@example.com"
    password = "TestPassword123!"
} -ExpectSuccess $false

# Test 8: Protected Endpoints Without Auth
Test-Endpoint -Name "Get Profile (No Auth)" -Method "GET" -Endpoint "/auth/me" -ExpectSuccess $false
Test-Endpoint -Name "List API Keys (No Auth)" -Method "GET" -Endpoint "/api-keys" -ExpectSuccess $false
Test-Endpoint -Name "Create API Key (No Auth)" -Method "POST" -Endpoint "/api-keys" -ExpectSuccess $false

# Test 9: Protected Endpoints With Session (if we have one)
if ($sessionToken) {
    $authHeaders = @{
        "Cookie" = "session=$sessionToken"
    }
    
    Test-Endpoint -Name "Get Profile (With Session)" -Method "GET" -Endpoint "/auth/me" -Headers $authHeaders
    Test-Endpoint -Name "List API Keys (With Session)" -Method "GET" -Endpoint "/api-keys" -Headers $authHeaders
    
    # Create API Key
    $apiKeyResult = Test-Endpoint -Name "Create API Key" -Method "POST" -Endpoint "/api-keys" -Headers $authHeaders -Body @{
        name = "Test API Key"
        permissions = @("read", "write")
    }
    
    if ($apiKeyResult.Success -and $apiKeyResult.Response.key) {
        # Test with API Key
        $apiHeaders = @{
            "Authorization" = "Bearer $($apiKeyResult.Response.key)"
        }
        
        Test-Endpoint -Name "Get Profile (With API Key)" -Method "GET" -Endpoint "/auth/me" -Headers $apiHeaders
        Test-Endpoint -Name "List API Keys (With API Key)" -Method "GET" -Endpoint "/api-keys" -Headers $apiHeaders
    }
    
    # Logout
    Test-Endpoint -Name "Logout" -Method "POST" -Endpoint "/auth/logout" -Headers $authHeaders
}

# Test 10: User Management Endpoints
$userHeaders = if ($sessionToken) { @{"Cookie" = "session=$sessionToken"} } else { @{} }

Test-Endpoint -Name "Get User Profile" -Method "GET" -Endpoint "/users/profile" -Headers $userHeaders
Test-Endpoint -Name "Update User Profile" -Method "PATCH" -Endpoint "/users/profile" -Headers $userHeaders -Body @{
    profile = @{
        name = "Updated Name"
        company = "Test Company"
    }
}

# Test 11: Password Management
Test-Endpoint -Name "Change Password (No Old Password)" -Method "POST" -Endpoint "/users/password" -Headers $userHeaders -Body @{
    newPassword = "NewPassword123!"
} -ExpectSuccess $false

# Test 12: Method Not Allowed
Test-Endpoint -Name "Wrong Method on Login" -Method "GET" -Endpoint "/auth/login" -ExpectSuccess $false
Test-Endpoint -Name "Wrong Method on Signup" -Method "DELETE" -Endpoint "/auth/signup" -ExpectSuccess $false

# Test 13: Large Payload
$largePayload = @{
    email = "large@example.com"
    password = "TestPassword123!"
    name = "A" * 10000  # 10KB name
}
Test-Endpoint -Name "Large Payload Test" -Method "POST" -Endpoint "/auth/signup" -Body $largePayload

# Test 14: Special Characters
Test-Endpoint -Name "Special Characters in Data" -Method "POST" -Endpoint "/auth/signup" -Body @{
    email = "special+test@example.com"
    password = "Test@#$%Password123!"
    name = "Test Script Alert XSS User"
}

# Generate Test Report
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Success }).Count
$failed = ($testResults | Where-Object { -not $_.Success }).Count
$total = $testResults.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($passed / $total) * 100, 2))%" -ForegroundColor Yellow

# Export detailed results
$testResults | Export-Csv -Path "test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').csv" -NoTypeInformation

# Show failed tests
if ($failed -gt 0) {
    Write-Host "`nFAILED TESTS:" -ForegroundColor Red
    $testResults | Where-Object { -not $_.Success } | ForEach-Object {
        Write-Host "- $($_.TestName): $($_.Error)" -ForegroundColor Red
    }
}

Write-Host "`nDetailed results saved to CSV file" -ForegroundColor Gray
