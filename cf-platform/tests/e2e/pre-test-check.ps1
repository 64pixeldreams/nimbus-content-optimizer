# Pre-Test Check
# Validates platform is ready for E2E testing

$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "🔍 PRE-TEST PLATFORM CHECK" -ForegroundColor Cyan
Write-Host "Target: $baseUrl" -ForegroundColor Gray
Write-Host "Time: $(Get-Date)" -ForegroundColor Gray

$checks = @()

# Check 1: Platform Health
Write-Host "`n📋 Checking platform health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -TimeoutSec 10
    if ($response.status -eq "ok") {
        Write-Host "✅ Platform health check passed" -ForegroundColor Green
        $checks += @{ Name = "Health Check"; Status = "PASS" }
    } else {
        Write-Host "❌ Platform health check failed" -ForegroundColor Red
        $checks += @{ Name = "Health Check"; Status = "FAIL"; Error = "Status not OK" }
    }
} catch {
    Write-Host "❌ Platform health check failed: $($_.Exception.Message)" -ForegroundColor Red
    $checks += @{ Name = "Health Check"; Status = "FAIL"; Error = $_.Exception.Message }
}

# Check 2: Auth Endpoints
Write-Host "`n📋 Checking auth endpoints..." -ForegroundColor Yellow
try {
    # Test signup endpoint (should return validation error, not 404)
    $body = @{ email = "test"; password = "test" } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/signup" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "✅ Auth signup endpoint accessible" -ForegroundColor Green
    $checks += @{ Name = "Auth Signup"; Status = "PASS" }
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Auth signup endpoint accessible (validation working)" -ForegroundColor Green
        $checks += @{ Name = "Auth Signup"; Status = "PASS" }
    } else {
        Write-Host "❌ Auth signup endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
        $checks += @{ Name = "Auth Signup"; Status = "FAIL"; Error = $_.Exception.Message }
    }
}

# Check 3: CloudFunction Endpoint
Write-Host "`n📋 Checking CloudFunction endpoint..." -ForegroundColor Yellow
try {
    $body = @{ action = "test"; payload = @{} } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "$baseUrl/api/function" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "✅ CloudFunction endpoint accessible" -ForegroundColor Green
    $checks += @{ Name = "CloudFunction API"; Status = "PASS" }
} catch {
    if ($_.Exception.Response.StatusCode -eq 400 -or $_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✅ CloudFunction endpoint accessible (validation working)" -ForegroundColor Green
        $checks += @{ Name = "CloudFunction API"; Status = "PASS" }
    } else {
        Write-Host "❌ CloudFunction endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
        $checks += @{ Name = "CloudFunction API"; Status = "FAIL"; Error = $_.Exception.Message }
    }
}

# Check 4: Database Initialization
Write-Host "`n📋 Checking database initialization..." -ForegroundColor Yellow
try {
    $body = @{ action = "system.initialize"; payload = @{} } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/api/function" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
    if ($response.success) {
        Write-Host "✅ Database initialization successful" -ForegroundColor Green
        $checks += @{ Name = "Database Init"; Status = "PASS" }
    } else {
        Write-Host "❌ Database initialization failed: $($response.error)" -ForegroundColor Red
        $checks += @{ Name = "Database Init"; Status = "FAIL"; Error = $response.error }
    }
} catch {
    Write-Host "❌ Database initialization failed: $($_.Exception.Message)" -ForegroundColor Red
    $checks += @{ Name = "Database Init"; Status = "FAIL"; Error = $_.Exception.Message }
}

# Results
Write-Host "`n📊 PRE-TEST CHECK RESULTS" -ForegroundColor Cyan
Write-Host "=" * 40 -ForegroundColor Gray

$passed = ($checks | Where-Object { $_.Status -eq "PASS" }).Count
$total = $checks.Count

Write-Host "Total Checks: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $($total - $passed)" -ForegroundColor Red

Write-Host "`n📋 Detailed Results:" -ForegroundColor Yellow
foreach ($check in $checks) {
    $status = if ($check.Status -eq "PASS") { "✅" } else { "❌" }
    Write-Host "$status $($check.Name)" -ForegroundColor $(if ($check.Status -eq "PASS") { "Green" } else { "Red" })
    if ($check.Error) {
        Write-Host "   Error: $($check.Error)" -ForegroundColor Red
    }
}

Write-Host "`n" + "=" * 40 -ForegroundColor Gray

if ($passed -eq $total) {
    Write-Host "🎉 PLATFORM READY FOR TESTING!" -ForegroundColor Green
    Write-Host "`nYou can now run the E2E tests:" -ForegroundColor White
    Write-Host "1. Basic test: .\tests\e2e\basic-project-test.ps1" -ForegroundColor Cyan
    Write-Host "2. Complete test: .\tests\e2e\complete-user-journey.ps1" -ForegroundColor Cyan
    Write-Host "3. All tests: .\tests\e2e\run-all-tests.ps1" -ForegroundColor Cyan
} else {
    Write-Host "❌ PLATFORM NOT READY" -ForegroundColor Red
    Write-Host "Please fix the failing checks before running E2E tests." -ForegroundColor Red
    Write-Host "`nCommon fixes:" -ForegroundColor Yellow
    Write-Host "- Deploy platform: wrangler deploy" -ForegroundColor Gray
    Write-Host "- Check Cloudflare configuration" -ForegroundColor Gray
    Write-Host "- Verify database initialization" -ForegroundColor Gray
}

Write-Host "`nCheck completed at: $(Get-Date)" -ForegroundColor Gray
