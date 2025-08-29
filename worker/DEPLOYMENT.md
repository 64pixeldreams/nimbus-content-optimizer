# Nimbus Cloudflare Worker Deployment Guide

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **OpenAI API Key**: Get from [platform.openai.com](https://platform.openai.com/api-keys)
3. **Wrangler CLI**: Install globally
   ```bash
   npm install -g wrangler
   ```

## Setup Steps

### 1. Login to Cloudflare
```bash
wrangler login
```

### 2. Set OpenAI API Key
```bash
# Set the secret (recommended - more secure)
wrangler secret put OPENAI_API_KEY

# Or set as environment variable in dashboard
# Cloudflare Dashboard > Workers > nimbus-content-optimizer > Settings > Environment Variables
```

### 3. Deploy Worker
```bash
# Deploy to staging
wrangler deploy --env staging

# Deploy to production
wrangler deploy --env production
```

### 4. Get Worker URL
After deployment, you'll get a URL like:
```
https://nimbus-content-optimizer.your-account.workers.dev
```

### 5. Update Nimbus Configuration
Update the worker URL in your Nimbus configuration:

```javascript
// In gulp/tasks/propose.js
getDefaultWorkerUrl() {
  return 'https://nimbus-content-optimizer.your-account.workers.dev';
}
```

## Testing the Worker

### Test with curl:
```bash
curl -X POST https://nimbus-content-optimizer.your-account.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "name": "Test Business",
      "domain": "test.com",
      "goal": "Increase conversions"
    },
    "directive": {
      "type": "local",
      "tone": "professional",
      "schema_types": ["LocalBusiness"]
    },
    "content_map": {
      "route": "/test-page",
      "head": {"title": "Test Page"},
      "blocks": [{"selector": "h1", "text": "Test Heading"}]
    }
  }'
```

### Test with Nimbus:
```bash
# Use the real worker instead of mock
gulp nimbus:propose --batch test-batch --worker-url https://nimbus-content-optimizer.your-account.workers.dev
```

## Environment Variables

Set these in Cloudflare Dashboard > Workers > Settings > Environment Variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins | No |
| `MAX_TOKENS` | Max tokens per request (default: 4000) | No |
| `TEMPERATURE` | AI temperature (default: 0.3) | No |

## Monitoring & Debugging

### View Logs
```bash
wrangler tail
```

### Check Analytics
- Cloudflare Dashboard > Workers > nimbus-content-optimizer > Analytics

### Common Issues

1. **"OpenAI API key not configured"**
   - Set the `OPENAI_API_KEY` environment variable

2. **"Invalid JSON response from AI"**
   - Check OpenAI API limits and model availability
   - Review system prompt formatting

3. **"Worker exceeded CPU time limit"**
   - Reduce content_map.blocks size in the request
   - Consider using gpt-3.5-turbo for faster responses

## Cost Optimization

### OpenAI API Costs
- **GPT-4 Turbo**: ~$0.01-0.03 per page optimization
- **GPT-3.5 Turbo**: ~$0.001-0.003 per page optimization

### Cloudflare Worker Costs
- **Free Tier**: 100,000 requests/day
- **Paid**: $5/month for 10M requests

### Recommendations
1. Use GPT-3.5 Turbo for development/testing
2. Use GPT-4 Turbo for production optimization
3. Implement caching for repeated optimizations
4. Batch multiple pages when possible

## Security

1. **API Key Protection**: Use Wrangler secrets, never commit keys
2. **CORS**: Configure allowed origins for production
3. **Rate Limiting**: Implement if needed for high-traffic sites
4. **Input Validation**: Worker validates all inputs

## Scaling

For high-volume usage:
1. **Implement KV caching** for repeated optimizations
2. **Add rate limiting** to prevent abuse
3. **Use Durable Objects** for stateful operations
4. **Consider multiple workers** for different regions
