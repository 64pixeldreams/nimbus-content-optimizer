# E2E Test Runner
# Runs all end-to-end tests in sequence

$baseUrl = "https://nimbus-platform.martin-598.workers.dev"

Write-Host "🚀 NIMBUS AI PLATFORM - E2E TEST SUITE" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "Target: $baseUrl" -ForegroundColor Gray
Write-Host "Time: $(Get-Date)" -ForegroundColor Gray
Write-Host "=" * 60 -ForegroundColor Gray

$testResults = @()

function Run-Test {
    param(
        [string]$TestName,
        [string]$TestFile,
        [string]$Description
    )
    
    Write-Host "`n🧪 RUNNING: $TestName" -ForegroundColor Yellow
    Write-Host "Description: $Description" -ForegroundColor Gray
    Write-Host "-" * 50 -ForegroundColor Gray
    
    $result = @{
        Name = $TestName
        File = $TestFile
        Success = $false
        Error = $null
        Duration = 0
    }
    
    $startTime = Get-Date
    
    try {
        # Run the test
        & $TestFile
        
        $result.Success = $true
        $result.Duration = (Get-Date) - $startTime
        Write-Host "`n✅ PASSED: $TestName" -ForegroundColor Green
        Write-Host "Duration: $($result.Duration.TotalSeconds.ToString('F2'))s" -ForegroundColor Gray
        
    } catch {
        $result.Success = $false
        $result.Error = $_.Exception.Message
        $result.Duration = (Get-Date) - $startTime
        Write-Host "`n❌ FAILED: $TestName" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Duration: $($result.Duration.TotalSeconds.ToString('F2'))s" -ForegroundColor Gray
    }
    
    $script:testResults += $result
    return $result
}

# Test 1: Basic Project Creation
$basicTest = Run-Test -TestName "Basic Project Test" -TestFile ".\tests\e2e\basic-project-test.ps1" -Description "Signup → Login → Create Project → List Projects"

if (-not $basicTest.Success) {
    Write-Host "`n❌ BASIC TEST FAILED - Stopping here" -ForegroundColor Red
    Write-Host "Please fix the basic functionality before running the complete test." -ForegroundColor Red
    exit 1
}

# Test 2: Complete User Journey
$completeTest = Run-Test -TestName "Complete User Journey" -TestFile ".\tests\e2e\complete-user-journey.ps1" -Description "Full multi-user flow with isolation and session persistence"

# Test 3: Health Check
$healthTest = Run-Test -TestName "Health Check" -TestFile ".\tests\api\test-health.ps1" -Description "Platform health and connectivity"

# Test 4: Auth Flow
$authTest = Run-Test -TestName "Auth Flow" -TestFile ".\tests\api\test-auth.ps1" -Description "Authentication and session management"

# Test 5: CloudFunction API
$cfTest = Run-Test -TestName "CloudFunction API" -TestFile ".\tests\api\test-cloudfunction.ps1" -Description "CloudFunction endpoint functionality"

# =============================================================================
# RESULTS SUMMARY
# =============================================================================

Write-Host "`n📊 TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$passed = ($testResults | Where-Object { $_.Success }).Count
$total = $testResults.Count
$totalDuration = ($testResults | Measure-Object -Property Duration -Sum).Sum

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $($total - $passed)" -ForegroundColor Red
Write-Host "Total Duration: $($totalDuration.TotalMinutes.ToString('F2')) minutes" -ForegroundColor Gray

Write-Host "`n📋 Detailed Results:" -ForegroundColor Yellow
foreach ($result in $testResults) {
    $status = if ($result.Success) { "✅" } else { "❌" }
    $duration = $result.Duration.TotalSeconds.ToString('F2') + "s"
    Write-Host "$status $($result.Name) ($duration)" -ForegroundColor $(if ($result.Success) { "Green" } else { "Red" })
    if ($result.Error) {
        Write-Host "   Error: $($result.Error)" -ForegroundColor Red
    }
}

Write-Host "`n" + "=" * 60 -ForegroundColor Gray

if ($passed -eq $total) {
    Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "Your platform is fully validated and ready for locking! 🚀" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor White
    Write-Host "1. Run: node scripts/lock-foundation.js" -ForegroundColor Cyan
    Write-Host "2. Push changes: git push origin --all --tags" -ForegroundColor Cyan
    Write-Host "3. Deploy to production" -ForegroundColor Cyan
} else {
    Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "Please fix the failing tests before locking modules." -ForegroundColor Red
    Write-Host "`nFailed tests:" -ForegroundColor Yellow
    foreach ($result in $testResults | Where-Object { -not $_.Success }) {
        Write-Host "  - $($result.Name): $($result.Error)" -ForegroundColor Red
    }
}

Write-Host "`nTest completed at: $(Get-Date)" -ForegroundColor Gray
