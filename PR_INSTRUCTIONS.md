# PR: Fix Railway Deployment

## Description

This PR fixes all Railway deployment issues and properly configures the app for Railway's native Next.js builder.

## Problem Summary

### Original Issues:
1. ❌ Railway.json referenced deprecated Nixpacks
2. ❌ Dockerfile tried to run `node server.js` (file doesn't exist)
3. ❌ File uploads used local filesystem (ephemeral on Railway)
4. ❌ Next.js `output: 'standalone'` incompatible with Railway builder
5. ❌ Missing deployment documentation

### Fixed Issues:
1. ✅ Configured Railway for native Next.js builder
2. ✅ File uploads now use AWS S3 (persistent storage)
3. ✅ Removed incompatible `standalone` output mode
4. ✅ Added comprehensive deployment guide
5. ✅ Added Prisma migrations for Railway

## Changes

### Deployment Configuration
- `railway.json`: Configure for native Next.js auto-detection
- `railway.toml`: Simplify minimal config
- `next.config.js`: Remove `output: 'standalone'` (Railway incompatibility)

### File Storage (Critical)
- `src/app/api/content/route.ts`: Replace local filesystem with S3 uploads
- Added proper error handling for missing S3 credentials
- Files now persist across deployments

### Package Management
- `package.json`: Add `postinstall` script for Prisma
- Add `railway:start` script for migrations + start

### Documentation
- `RAILWAY_DEPLOYMENT.md`: Complete deployment guide
- `Procfile`: Fallback configuration

## Railway Setup Required

### Environment Variables
Add these in Railway Variables tab:

```
JWT_SECRET = generate with: openssl rand -base64 32
OPENAI_API_KEY = sk-your-openai-key
DATABASE_URL = ${Postgres.DATABASE_URL} (auto-added)
REDIS_URL = ${Redis.REDIS_URL} (auto-added)
AWS_ACCESS_KEY_ID = your-key (required for uploads)
AWS_SECRET_ACCESS_KEY = your-secret (required for uploads)
AWS_REGION = us-east-1
S3_BUCKET = your-bucket-name
```

### Services Required
1. PostgreSQL (add in Railway)
2. Redis (add in Railway)
3. AWS S3 (configure credentials manually)

## Testing

After deployment:
1. Health check: `https://your-app.railway.app/api/health`
2. Test signup/login flow
3. Test file upload (requires S3 credentials)
4. Test YouTube URL processing

## Breaking Changes

⚠️ **File uploads require S3 configuration**

Railway's filesystem is ephemeral. File uploads will fail without AWS S3 credentials. This is intentional - local filesystem is not persistent on Railway.

**Setup S3 before testing uploads:**
1. Create AWS S3 bucket
2. Add credentials to Railway Variables
3. Test file upload

## Migration Notes

From local development to Railway:
1. Add PostgreSQL service in Railway
2. Add Redis service in Railway
3. Configure AWS S3 credentials
4. Set JWT_SECRET and OPENAI_API_KEY
5. Deploy from this branch

## Checklist

- [x] Fix Railway configuration
- [x] Replace local filesystem with S3
- [x] Add deployment documentation
- [x] Update package.json scripts
- [ ] Test on Railway (requires user deployment)
- [ ] Update README with Railway section

## Related Issues

Fixes Railway deployment errors due to:
- Deprecated Nixpacks
- Missing server.js
- Local filesystem incompatibility
- Next.js configuration issues

## How to Raise This PR

### Method 1: GitHub CLI
```bash
git checkout -b fix/railway-deployment
git push -u origin fix/railway-deployment
gh pr create --title "Fix Railway deployment configuration" --body "See PR details"
```

### Method 2: GitHub Web
1. Push this branch to GitHub:
   ```bash
   git push origin fix/railway-deployment
   ```
2. Go to: https://github.com/vignu10/contento/compare/main...fix/railway-deployment
3. Click "Create Pull Request"
4. Copy description from this file

### Method 3: From Current Branch
1. Create branch locally (already done):
   ```bash
   git checkout fix/railway-deployment
   ```
2. Push to origin (requires git credentials):
   ```bash
   git push origin fix/railway-deployment
   ```
3. Open PR on GitHub

---

## Current Git Status

You're currently on: `fix/railway-deployment` branch

To push and create PR:
```bash
git push -u origin fix/railway-deployment
```

Then visit: https://github.com/vignu10/contento/new/pull
