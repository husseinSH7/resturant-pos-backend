# Production Deployment Guide

This guide covers deploying to:
- **Dashboard**: Vercel
- **API**: Fly.io

## Dashboard (Vercel)

Vercel handles builds automatically - no Dockerfile needed.

### Setup

1. **Connect your repository to Vercel**
   - Go to vercel.com
   - Import your repository
   - **Important**: Set "Root Directory" to `apps/dashboard-web`
   - Vercel will detect the `vercel.json` file automatically

2. **Configure environment variables in Vercel**
   ```
   VITE_API_URL=https://your-fly-io-app.fly.dev/api/v1
   ```

3. **Deploy**
   - Vercel will auto-deploy on git push
   - Or click "Deploy" in Vercel dashboard

### Vercel Configuration

The `apps/dashboard-web/vercel.json` file is already configured with:
- Build command: `npm run build`
- Output directory: `dist`
- Framework: Vite

Vercel will automatically use this configuration when you set the root directory to `apps/dashboard-web`.

## API (Fly.io)

Fly.io uses the Dockerfile we created.

### Setup

1. **Install Fly CLI**
   ```bash
   npm install -g flyctl
   ```

2. **Login to Fly**
   ```bash
   flyctl auth login
   ```

3. **Initialize Fly app**
   ```bash
   cd apps/api
   flyctl launch
   ```
   - Select region (e.g., iad for US East)
   - Don't create a PostgreSQL database (you're using Neon)
   - Don't create a Redis instance (you're using Upstash)

4. **Set environment variables**
   ```bash
   flyctl secrets set DATABASE_URL="your-neon-connection-string"
   flyctl secrets set UPSTASH_REDIS_REST_URL="your-upstash-url"
   flyctl secrets set UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
   flyctl secrets set JWT_SECRET="your-jwt-secret"
   flyctl secrets set JWT_REFRESH_SECRET="your-refresh-secret"
   flyctl secrets set RESEND_API_KEY="your-resend-key"
   flyctl secrets set RESEND_FROM_EMAIL="onboarding@resend.dev"
   flyctl secrets set FRONTEND_URL="https://your-vercel-app.vercel.app"
   flyctl secrets set BASE_URL="https://your-fly-app.fly.dev"
   flyctl secrets set ALLOWED_ORIGINS="https://your-vercel-app.vercel.app,exp://*"
   flyctl secrets set STORAGE_BUCKET="restaurant-pos-assets"
   ```

5. **Deploy**
   ```bash
   flyctl deploy
   ```

6. **Run database migrations**
   ```bash
   flyctl ssh console
   npx prisma migrate deploy
   npx prisma db seed
   exit
   ```

### Fly.io Configuration

The `fly.toml` file is already configured with:
- Auto-scaling (0 to N machines)
- Health checks on `/health`
- HTTPS enabled
- 512MB RAM, 1 CPU

## Environment Variables Reference

### API (Fly.io)
```
DATABASE_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=onboarding@resend.dev
FRONTEND_URL=https://your-vercel-app.vercel.app
BASE_URL=https://your-fly-app.fly.dev
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,exp://*
STORAGE_BUCKET=restaurant-pos-assets
```

### Dashboard (Vercel)
```
VITE_API_URL=https://your-fly-app.fly.dev/api/v1
```

## Local Development (Docker Compose)

For local development, use Docker Compose with your `.env` files:

```bash
cd restaurant_POS/resturant_POS

# Setup env files
cp apps/api/.env.example apps/api/.env
cp apps/dashboard-web/.env.example apps/dashboard-web/.env

# Edit with local credentials
# apps/api/.env should point to Neon and Upstash

# Start services
docker-compose up -d --build

# Run migrations
docker-compose exec api npx prisma migrate deploy
```

## Workflow Summary

| Environment | Dashboard | API |
|-------------|-----------|-----|
| **Local** | Docker Compose | Docker Compose |
| **Production** | Vercel (auto-build) | Fly.io (Dockerfile) |

## Updating Production

### Dashboard (Vercel)
- Push to git → Vercel auto-deploys
- Or deploy via Vercel dashboard

### API (Fly.io)
```bash
cd apps/api
git pull
flyctl deploy
```

## Monitoring

### Vercel
- View logs in Vercel dashboard
- Analytics included

### Fly.io
```bash
flyctl logs
flyctl status
```

## Troubleshooting

### API not connecting to Neon
- Check `DATABASE_URL` in Fly secrets
- Ensure Neon allows connections from Fly.io IP ranges

### CORS errors
- Update `ALLOWED_ORIGINS` in Fly secrets
- Include your Vercel domain

### Dashboard can't reach API
- Check `VITE_API_URL` in Vercel
- Ensure Fly.io app is running: `flyctl status`
