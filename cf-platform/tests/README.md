# NimbusAI Platform Tests

## Quick Test Commands

### Unit Tests
```bash
# Test DataModel
node tests/test-datamodel.js

# Test Datastore  
node tests/test-datastore.js

# Test Logs
node tests/test-logs.js
```

### API Tests (PowerShell)
```powershell
# Basic API test
.\tests\api\test-api.ps1

# Full auth test
.\tests\api\test-auth.ps1

# All endpoints
.\tests\api\test-all-endpoints.ps1
```

## Before Deploying
1. Run unit tests to ensure modules work
2. Deploy with `wrangler deploy`
3. Run API tests to verify endpoints
