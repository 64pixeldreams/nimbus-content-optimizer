# NimbusAI Deployment Guide

## Quick Deploy Commands

### Backend (CF Worker)
```powershell
cd cf-platform
wrangler deploy
```

### Frontend (CF Pages)  
```powershell
cd www
wrangler pages deploy . --project-name=nimbus360-dashboard
```

### Check Status
```powershell
# Worker status
wrangler deployments list

# Pages status  
wrangler pages deployment list --project-name=nimbus360-dashboard
```

## Troubleshooting

### Commands Hanging
- If wrangler commands hang, try Ctrl+C and retry
- Use `--verbose` flag for debugging: `wrangler deploy --verbose`
- Check internet connection and CF account status

### PowerShell vs Bash
- PowerShell: Use `;` not `&&` for command chaining
- Good: `cd cf-platform; wrangler deploy`  
- Bad: `cd cf-platform && wrangler deploy`

### Authentication Issues
```powershell
wrangler whoami
wrangler login  # if needed
```

## Production URLs
- **Backend API**: https://nimbus-platform.martin-598.workers.dev
- **Frontend**: https://nimbus360-dashboard.pages.dev
- **Custom Domains**: 
  - API: api.nimbus360.io (planned)
  - Dashboard: dashboard.nimbus360.io (planned)

## Deployment Checklist
1. ✅ Test locally first
2. ✅ Commit changes to git
3. ✅ Deploy backend first (worker)
4. ✅ Deploy frontend second (pages)
5. ✅ Test production URLs
6. ✅ Check logs for errors

## Emergency Rollback
```powershell
# Rollback worker to previous version
wrangler rollback

# Rollback pages (redeploy previous version)
cd www
git checkout HEAD~1 -- .
wrangler pages deploy . --project-name=nimbus360-dashboard
git checkout HEAD -- .
```


