# NimbusAI Platform Deployment Guide

## Quick Start

### 1. Setup Environment

```bash
# Copy configuration template
cp wrangler.example.toml wrangler.toml

# Edit wrangler.toml with your Cloudflare account details:
# - account_id
# - KV namespace IDs  
# - D1 database ID
# - Environment variables (API keys)
```

### 2. Create Cloudflare Resources

```bash
# Create KV namespaces
wrangler kv namespace create NIMBUS_USERS
wrangler kv namespace create NIMBUS_PROJECTS  
wrangler kv namespace create NIMBUS_PAGES
wrangler kv namespace create NIMBUS_KEYS
wrangler kv namespace create NIMBUS_SESSIONS
wrangler kv namespace create NIMBUS_CACHE
wrangler kv namespace create NIMBUS_EMAILS
wrangler kv namespace create NIMBUS_LISTS

# Create D1 database
wrangler d1 create nimbus-production

# Update wrangler.toml with the generated IDs
```

### 3. Deploy Platform

```bash
# Deploy to Cloudflare Workers
wrangler deploy

# Initialize database (creates tables)
curl -X POST https://your-worker.workers.dev/api/function \
  -H "Content-Type: application/json" \
  -d '{"action": "system.initialize"}'
```

### 4. Test Platform

```bash
# Run health check
powershell tests/api/test-health.ps1

# Test signup flow
powershell tests/api/test-signup-flow.ps1

# Test CloudFunction framework
powershell tests/api/test-cloudfunction.ps1
```

## Environment Variables Required

```toml
# Development
ENVIRONMENT = "development"
APP_URL = "https://your-worker.workers.dev"
SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
MAILERSEND_API_KEY = "mlsn.YOUR_MAILERSEND_API_KEY"

# Production (add to [env.production.vars])
OPENAI_API_KEY = "sk-proj-YOUR_OPENAI_API_KEY"
```

## Platform Architecture

- **Cloudflare Workers** - Serverless compute
- **KV Storage** - Fast key-value store for full objects
- **D1 Database** - SQL database for metadata and queries
- **DataModel Framework** - ORM with lazy loading (DataProxy)
- **CloudFunction API** - Unified function-based API
- **Multi-channel Messaging** - Email (MailerSend) + Slack

## Key Features

- ✅ **User Management** - Signup, login, sessions, API keys
- ✅ **Project Management** - CRUD operations with ownership
- ✅ **Database Auto-Migration** - Schema updates on deployment
- ✅ **Comprehensive Logging** - Request tracking and debugging
- ✅ **Modular Architecture** - Small, focused files (<150 lines)
- ✅ **Production Ready** - Security, error handling, validation

## Support

- **Documentation**: See `specs/` folder for detailed specifications
- **Module READMEs**: Each module has usage documentation  
- **Tests**: Run tests in `tests/` folder for verification
- **Logs**: Use `/debug/logs` endpoint for troubleshooting
