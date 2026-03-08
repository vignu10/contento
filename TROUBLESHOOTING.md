# Railway Deployment Troubleshooting Guide

## Problem: Build Keeps Failing

Even after all fixes, Railway is still showing build errors.

---

## 🔍 Diagnostic Steps

### 1. Check What Commit Railway Is Building

Run this command to see which commit Railway is actually using:
```bash
git log origin/main --oneline -1
```

If it shows an old commit (not `f80d171`), Railway is using a cached build.

### 2. Check Dockerfile Being Used

```bash
# View Dockerfile on GitHub
curl -s https://raw.githubusercontent.com/vignu10/contento/main/Dockerfile

# Compare with local
cat Dockerfile
```

If different, Railway is using cached version. Force a rebuild.

---

## 🚀 Immediate Solutions

### Solution 1: Force Rebuild (Recommended)

Railway might be caching the Docker build. Force a fresh rebuild:

1. Go to Railway Dashboard → contento service
2. Click "Settings" → "Deployments"
3. Click "Redeploy" button (this rebuilds from main branch)
4. Wait for build to complete

### Solution 2: Delete Build Cache

Railway might have a stale Docker build cache. Clear it:

1. Go to Railway Dashboard → contento service
2. Click "Settings" → "Variables"
3. Add new variable:
   ```
   CACHE_CLEAR = true
   ```
4. Redeploy

### Solution 3: Switch to Native Next.js Builder

Instead of Dockerfile, use Railway's built-in Next.js support. This is simpler and more reliable.

**Step 1: Create railway.json for native build**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  }
}
```

**Step 2: Remove Dockerfile**
```bash
git rm Dockerfile
git commit -m "Remove Dockerfile to use Railway native builder"
git push origin main
```

**Step 3: Redeploy on Railway**
- Railway will auto-detect Next.js
- No Dockerfile needed
- Simpler and more reliable

---

## 🐛 Common Issues & Fixes

### Issue: "npm ci" Fails

**Error:**
```
npm error command failed "npm ci"
```

**Cause:** `package-lock.json` is corrupted or missing dependencies.

**Fix:**
```bash
# Remove lock file and regenerate
rm package-lock.json
npm install
git add package-lock.json
git commit -m "Regenerate package-lock.json"
git push origin main
```

### Issue: "COPY --from=deps" Fails

**Error:**
```
COPY --from=deps /app/node_modules ./node_modules
```

**Cause:** Multi-stage build conflicts with Railway caching.

**Fix:** Use single-stage build (already done in latest Dockerfile).

### Issue: Prisma Schema Not Found

**Error:**
```
Error: Could not find Prisma Schema
```

**Fix:** The `PRISMA_SCHEMA_PATH` env var is already set to `/app/prisma/schema.prisma`.

This should now be working.

---

## 🔧 Advanced Troubleshooting

### Check Railway Build Logs

1. Go to Railway Dashboard → contento service
2. Click "Settings" → "Deployments"
3. Click on the latest failed build
4. Review full error logs

### Build Locally to Verify

```bash
# Clone the repo
git clone https://github.com/vignu10/contento.git
cd contento

# Test Docker build locally
docker build -t contento-test .

# Test if it works
docker run -p 3000:3000 contento-test
```

If local build works but Railway fails, it's a Railway caching issue.

---

## 📋 Checklist

Before redeploying:

- [ ] Check what commit Railway is building (`git log origin/main --oneline -1`)
- [ ] Verify Dockerfile matches GitHub (`curl -s https://raw.githubusercontent.com/vignu10/contento/main/Dockerfile`)
- [ ] Check Railway dashboard for error details
- [ ] Try force redeploy
- [ ] Consider switching to native Next.js builder

---

## 🚦 Alternative: Use Vercel Instead

If Railway continues to have issues, consider deploying to Vercel:

1. **Vercel is built for Next.js** - native support, no Dockerfile needed
2. **Auto-optimization** - automatic image optimization
3. **Edge network** - global CDN included
4. **Free tier** - generous free deployment

### Deploy to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

---

## 📞 Still Having Issues?

**Try this minimal Dockerfile:**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
```

This removes all multi-stage complexity.

---

## 💬 Need Help?

1. Check Railway status: https://status.railway.app/
2. Join Railway Discord: https://discord.gg/railway
3. Check Railway docs: https://docs.railway.app/

---

**Quick fix to try:**

Go to Railway Dashboard → contento service → Settings → Deployments → Click "Redeploy"

If that doesn't work, consider switching to native Next.js builder (remove Dockerfile).
