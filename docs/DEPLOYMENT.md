# 🚀 Railway Deployment Guide

## Prerequisites
- GitHub account (you have this ✅)
- Railway account (free tier available)

## Step-by-Step Deployment

### 1. Create Railway Account

1. Go to **https://railway.app**
2. Click **"Start a New Project"**
3. Sign up with **GitHub** (recommended)
4. Authorize Railway to access your GitHub

### 2. Deploy from GitHub

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose **`vignu10/contento`**
4. Click **"Deploy Now"**

Railway will automatically:
- ✅ Detect Next.js
- ✅ Use the Dockerfile
- ✅ Build the app
- ✅ Deploy it

### 3. Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"**
3. Choose **"PostgreSQL"**
4. Railway will create and link it automatically

### 4. Set Environment Variables

Click on your **web service** → **Variables** tab → Add these:

```bash
# Required
JWT_SECRET=your-random-secret-key-here-min-32-chars
NEXT_PUBLIC_APP_URL=https://your-app-name.railway.app

# Optional (for real AI)
OPENAI_API_KEY=sk-proj-your-key-here

# Auto-linked (Railway sets these)
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

**Generate JWT_SECRET:**
```bash
openssl rand -base64 32
```

Or use any random string: `my-super-secret-jwt-key-change-this-in-production-12345`

### 5. Get Your URL

1. Click on your **web service**
2. Go to **"Settings"** → **"Domains"**
3. Click **"Generate Domain"**
4. Your app will be live at: `https://your-name.railway.app`

---

## 📊 Railway Dashboard

After deployment, you'll see:

```
Project: contento
├── Web Service (Next.js app)
│   ├── URL: https://your-app.railway.app
│   ├── Status: RUNNING ✅
│   └── Logs: [View real-time logs]
│
└── PostgreSQL Database
    ├── Status: RUNNING ✅
    └── Connection: Auto-linked
```

---

## 💰 Cost Estimate

### Free Tier ($0/month)
- **RAM:** 512 MB
- **CPU:** Shared
- **Storage:** 1 GB PostgreSQL
- **Bandwidth:** 1 GB/month
- **Good for:** Testing, demos, small apps

### Pro Tier ($20/month)
- **RAM:** Up to 8 GB
- **CPU:** Dedicated
- **Storage:** 100 GB PostgreSQL
- **Bandwidth:** 100 GB/month
- **Good for:** Production apps, scaling

**Recommendation:** Start with Free tier, upgrade when needed.

---

## 🔧 Post-Deployment

### 1. Test Your App
```
https://your-app.railway.app/api/health
```
Should return:
```json
{"status":"ok","timestamp":"..."}
```

### 2. Create First User
1. Go to your app URL
2. Sign up with email/password
3. Process some content
4. Verify all 7 outputs work

### 3. Check Logs
- Railway Dashboard → Web Service → **Logs** tab
- Monitor for errors
- Check build logs if deployment fails

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Check build logs in Railway
# Common issues:
- Missing environment variables
- Dockerfile errors
- Dependency issues
```

### Database Connection Error
```bash
# Verify DATABASE_URL is set
# Should be: ${{Postgres.DATABASE_URL}}
```

### App Not Loading
```bash
# Check logs for:
- Port binding issues
- Missing env vars
- Database connection
```

### 502 Bad Gateway
```bash
# Usually means:
- App is starting up (wait 1-2 min)
- Health check failing
- Memory limit exceeded
```

---

## 📱 Quick Commands

### View Logs
```bash
# In Railway dashboard → Logs tab
# Or use Railway CLI:
railway logs
```

### Restart Service
```bash
# Railway dashboard → Web Service → Settings → Restart
```

### Redeploy
```bash
# Push to GitHub main branch
git push origin main
# Railway auto-deploys
```

---

## 🎯 Deployment Checklist

- [ ] Railway account created
- [ ] Project deployed from GitHub
- [ ] PostgreSQL database added
- [ ] Environment variables set
  - [ ] JWT_SECRET
  - [ ] NEXT_PUBLIC_APP_URL
  - [ ] (Optional) OPENAI_API_KEY
- [ ] Custom domain generated
- [ ] Health check passing
- [ ] First user created
- [ ] Content processing tested

---

## 🔐 Security Notes

**Change these in production:**
1. `JWT_SECRET` - Use a strong random string
2. Database password - Railway auto-generates
3. Enable HTTPS - Railway does this automatically

**Don't commit to GitHub:**
- `.env` files (already in .gitignore ✅)
- API keys (use Railway variables ✅)
- Passwords/secrets (use Railway variables ✅)

---

## 🚀 Alternative: One-Click Deploy

If Railway supports it, you can add a button to your README:

```markdown
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/vignu10/contento)
```

---

## 📞 Need Help?

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **GitHub Issues:** https://github.com/vignu10/contento/issues

---

**Ready to deploy? Follow the steps above!** 🎯
