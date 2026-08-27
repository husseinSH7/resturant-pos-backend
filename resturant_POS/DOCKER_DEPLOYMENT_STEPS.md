# Docker Deployment Steps

This guide shows you how to deploy both the API and Dashboard using Docker.

## Option 1: Local Development (Docker Compose)

### Step 1: Setup Environment Files

```bash
cd c:\Users\Alish\OneDrive\Desktop\projects\restaurant_POS\resturant_POS

# Create API env file
copy apps\api\.env.example apps\api\.env

# Create Dashboard env file
copy apps\dashboard-web\.env.example apps\dashboard-web\.env
```

### Step 2: Edit Environment Files

**Edit `apps/api/.env`:**
```env
NODE_ENV=development
PORT=4000

# Your Neon database
DATABASE_URL="postgresql://neondb_owner:npg_ypV5zUshvf9X@ep-damp-brook-ayeca436-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Your Upstash Redis
UPSTASH_REDIS_REST_URL="https://game-hamster-165103.upstash.io"
UPSTASH_REDIS_REST_TOKEN="gQAAAAAAAoTvAAIgcDE5MjQ2YjllMTA2YzY0MDExODlhMWQxYWE2ODRlZWEzYQ"

# Other settings
JWT_SECRET=change_this_secret
JWT_REFRESH_SECRET=change_this_secret_refresh
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev
FRONTEND_URL=http://localhost:5173
BASE_URL=http://localhost:4000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:19006,exp://*,http://192.168.*:*
STORAGE_BUCKET=restaurant-pos-assets
```

**Edit `apps/dashboard-web/.env`:**
```env
NODE_ENV=development
VITE_API_URL=http://localhost:4000/api/v1
```

### Step 3: Build and Start Services

```bash
# Build and start both services
docker-compose up -d --build
```

### Step 4: Run Database Migrations

```bash
# Run migrations in the API container
docker-compose exec api npx prisma migrate deploy
```

### Step 5: Seed Database (Optional)

```bash
# Seed with sample data
docker-compose exec api npx prisma db seed
```

### Step 6: Access Applications

- **API**: http://localhost:4000
- **Dashboard**: http://localhost:5173
- **Health Check**: http://localhost:4000/health

### Step 7: View Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f dashboard
```

### Step 8: Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Option 2: Production Docker Deployment

### Step 1: Build Images

```bash
# Build API image
docker build -t restaurant-pos-api ./apps/api

# Build Dashboard image
docker build -t restaurant-pos-dashboard ./apps/dashboard-web
```

### Step 2: Push to Registry (Optional)

If using Docker Hub or another registry:

```bash
# Tag images
docker tag restaurant-pos-api yourusername/restaurant-pos-api:latest
docker tag restaurant-pos-dashboard yourusername/restaurant-pos-dashboard:latest

# Push to registry
docker push yourusername/restaurant-pos-api:latest
docker push yourusername/restaurant-pos-dashboard:latest
```

### Step 3: Run Containers with Production Environment

```bash
# Run API
docker run -d \
  --name restaurant-pos-api \
  -p 4000:4000 \
  --env-file apps/api/.env \
  --restart always \
  restaurant-pos-api

# Run Dashboard
docker run -d \
  --name restaurant-pos-dashboard \
  -p 5173:5173 \
  --env-file apps/dashboard-web/.env \
  --restart always \
  restaurant-pos-dashboard
```

### Step 4: Run Migrations

```bash
docker exec restaurant-pos-api npx prisma migrate deploy
```

## Common Docker Commands

### Check Container Status
```bash
docker ps
```

### View Container Logs
```bash
docker logs restaurant-pos-api
docker logs restaurant-pos-dashboard
```

### Restart Containers
```bash
docker restart restaurant-pos-api
docker restart restaurant-pos-dashboard
```

### Stop and Remove Containers
```bash
docker stop restaurant-pos-api restaurant-pos-dashboard
docker rm restaurant-pos-api restaurant-pos-dashboard
```

### Execute Commands in Container
```bash
docker exec -it restaurant-pos-api sh
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build api
docker-compose up -d --build dashboard
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs api

# Check container status
docker-compose ps
```

### Database Connection Issues
```bash
# Verify DATABASE_URL in apps/api/.env
# Ensure Neon database is accessible
# Check API logs for connection errors
```

### Port Already in Use
```bash
# Find what's using the port
netstat -ano | findstr :4000

# Kill the process or change the port in docker-compose.yml
```

### Build Failures
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

## Production vs Local

| Setting | Local (Docker Compose) | Production |
|---------|----------------------|------------|
| **NODE_ENV** | `development` | `production` |
| **DATABASE_URL** | Neon (same) | Neon (same) |
| **REDIS** | Upstash (same) | Upstash (same) |
| **FRONTEND_URL** | `http://localhost:5173` | `https://your-domain.com` |
| **BASE_URL** | `http://localhost:4000` | `https://your-api-domain.com` |
| **ALLOWED_ORIGINS** | Local URLs | Production URLs |

## Quick Reference

### Start Everything
```bash
docker-compose up -d --build
docker-compose exec api npx prisma migrate deploy
```

### Stop Everything
```bash
docker-compose down
```

### Restart Everything
```bash
docker-compose restart
```

### Update After Code Changes
```bash
docker-compose up -d --build
```
