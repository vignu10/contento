# Railway Deployment Guide

This guide covers deploying Contento to Railway.app.

## Prerequisites

- Railway account (free tier works for development)
- GitHub repository connected to Railway
- PostgreSQL database on Railway
- Redis on Railway
- AWS S3 or compatible storage (required for file uploads)

## Quick Deploy

### Step 1: Connect Repository

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `vignu10/contento` repository
4. Click "Deploy Now"

### Step 2: Add Services

After deployment starts, add these services:

**PostgreSQL Database**
- Click "+ New" → "Database" → "PostgreSQL"
- Railway will automatically add `DATABASE_URL` variable

**Redis**
- Click "+ New" → "Database" → "Redis"
- Railway will automatically add `REDIS_URL` variable

**AWS S3 (Manual)**
- Go to Variables tab
- Add these variables manually:
  ```
  AWS_ACCESS_KEY_ID = your-access-key
  AWS_SECRET_ACCESS_KEY = your-secret-key
  AWS_REGION = us-east-1
  S3_BUCKET = content-repurposing
  ```

### Step 3: Add Environment Variables

In your app's Variables tab:

**Required:**
```
JWT_SECRET = generate with: openssl rand -base64 32
OPENAI_API_KEY = sk-your-openai-key
```

**Auto-added by Railway:**
```
DATABASE_URL = ${Postgres.DATABASE_URL}
REDIS_URL = ${Redis.REDIS_URL}
```

**Optional:**
```
NEXT_PUBLIC_APP_URL = https://your-app.railway.app
```

## Deployment Configuration

The app uses Railway's native Next.js builder:

- **No Dockerfile needed** - Railway auto-detects Next.js
- **Build command:** `npm run build`
- **Start command:** `npm start`
- **Health check:** `/api/health`

## Database Migrations

Prisma migrations run automatically on deploy via the `postinstall` script:
```json
"postinstall": "prisma generate"
```

For production, run migrations manually:
```bash
npx prisma migrate deploy
```

## File Storage

⚠️ **Important:** Railway's filesystem is ephemeral. Files uploaded to local storage are lost on redeploy.

**Solution:** The app is configured to use AWS S3 for persistent file storage. You must configure AWS credentials for uploads to work.

Alternative S3-compatible services:
- AWS S3
- DigitalOcean Spaces
- MinIO (self-hosted)
- Cloudflare R2

## Troubleshooting

### Build Fails

**Error:** `Missing required environment variable`
- **Fix:** Ensure `JWT_SECRET` and `OPENAI_API_KEY` are set in Variables tab

**Error:** `PrismaClientInitializationError`
- **Fix:** Check DATABASE_URL is linked from PostgreSQL service

### Runtime Errors

**Error:** `S3 credentials not configured`
- **Fix:** Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

**Error:** `Failed to upload file`
- **Fix:** Verify S3 bucket exists and credentials are correct

### Health Check Fails

**Symptoms:** Deployment keeps restarting
- **Fix:** Check `/api/health` is responding (it should return `{"status":"ok"}`)

## Scaling

For production scaling:

1. **Workers:** Deploy Bull workers as separate service
   - Create new service with `npm run worker`
   - Connect to same Redis

2. **Database:** Enable PostgreSQL auto-scaling
   - Go to PostgreSQL service → Settings
   - Enable "Auto-scale"

3. **Storage:** Use CDN for static assets
   - Configure CloudFront for S3 bucket

## Monitoring

Railway provides:
- Real-time logs
- Metrics (CPU, memory, requests)
- Traces (with APM)
- Health status

## Cost Optimization

**Free Tier Limits:**
- $5/month credit (generous for testing)
- PostgreSQL included
- Redis included

**Production Recommendations:**
- Enable auto-scale for databases
- Monitor S3 costs (upload/download + storage)
- Set up alerts for high usage

## Updates

To update after code changes:
```bash
git push origin main
```

Railway automatically detects and redeploys on push to main branch.

## Security Notes

- Never commit `.env` files
- Use Railway's Variables for secrets
- Rotate JWT_SECRET periodically
- Use least-privilege AWS IAM policies
- Enable railway.app HTTPS (automatic)

## Support

For issues:
- Check Railway logs: Your Service → Logs
- Check build logs: Deployments → Click a build
- Review this guide's troubleshooting section
