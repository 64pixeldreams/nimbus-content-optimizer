# Manual Cloudflare Worker Deployment

Since Wrangler requires Node.js v20+ and you have v18.19.0, here's how to deploy manually via the Cloudflare Dashboard.

## Quick Deployment Steps

### 1. Go to Cloudflare Dashboard
1. Visit [dash.cloudflare.com](https://dash.cloudflare.com)
2. Login with your account
3. Go to **Workers & Pages** → **Create Application** → **Create Worker**

### 2. Configure Worker
1. **Name**: `nimbus-content-optimizer`
2. **Click "Deploy"** to create the basic worker
3. **Click "Edit Code"** to open the editor

### 3. Copy Worker Code
1. **Delete** the default code in the editor
2. **Copy and paste** the entire contents of `worker-openai.js` into the editor
3. **Click "Save and Deploy"**

### 4. Set Environment Variables
1. In the worker dashboard, go to **Settings** → **Environment Variables**
2. **Add variable**:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `[YOUR_OPENAI_API_KEY_FROM_PLATFORM.OPENAI.COM]`
   - **Type**: Select "Secret" (encrypted)
3. **Click "Save"**

### 5. Get Worker URL
After deployment, you'll get a URL like:
```
https://nimbus-content-optimizer.your-subdomain.workers.dev
```

### 6. Test the Worker
Test with curl or Postman:
```bash
curl -X POST https://nimbus-content-optimizer.your-subdomain.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {"name": "Test Business", "domain": "test.com", "goal": "Increase conversions"},
    "directive": {"type": "local", "tone": "professional", "schema_types": ["LocalBusiness"]},
    "content_map": {"route": "/test", "head": {"title": "Test"}, "blocks": []}
  }'
```

### 7. Update Nimbus Configuration
1. **Edit** `gulp/tasks/propose.js`
2. **Replace** the `getDefaultWorkerUrl()` function:
```javascript
getDefaultWorkerUrl() {
  return 'https://nimbus-content-optimizer.your-subdomain.workers.dev';
}
```

### 8. Test with Nimbus
```bash
cd ../  # Back to gulp directory
gulp nimbus:propose --batch test-plan-002 --worker-url https://nimbus-content-optimizer.your-subdomain.workers.dev
```

## Alternative: Update Node.js

If you want to use Wrangler CLI:
1. **Install Node.js v20+** from [nodejs.org](https://nodejs.org)
2. **Restart** your terminal
3. **Run**: `npm install -g wrangler`
4. **Follow** the original DEPLOYMENT.md guide

## Expected Response Format

The worker should return JSON like:
```json
{
  "head": {
    "title": "Optimized Title",
    "metaDescription": "Optimized description"
  },
  "blocks": [
    {"selector": "h1", "new_text": "New heading"}
  ],
  "links": [],
  "alts": [],
  "schema": {...},
  "confidence": 0.85,
  "notes": ["Optimization applied"]
}
```

## Troubleshooting

**"OpenAI API key not configured"**
- Make sure you set the `OPENAI_API_KEY` environment variable as a Secret

**"Invalid JSON response from AI"**
- Check your OpenAI API key is valid
- Verify you have sufficient OpenAI credits

**CORS errors**
- The worker includes CORS headers, should work from any domain

**Worker URL not working**
- Make sure the worker is deployed and saved
- Check the URL format matches your actual worker URL
