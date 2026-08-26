# Deployment Guide

This guide covers deploying the Restaurant POS system using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Hosted PostgreSQL database (e.g., Neon)
- Hosted Redis instance (e.g., Upstash)
- At least 1GB RAM available
- 5GB free disk space

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd restaurant_POS/resturant_POS
   ```

2. **Configure environment variables**
   
   Create `.env` files for each service:
   
   **API** (`apps/api/.env`):
   ```bash
   cp apps/api/.env.example apps/api/.env
   # Edit apps/api/.env with your Neon and Upstash credentials
   ```
   
   **Dashboard** (`apps/dashboard-web/.env`):
   ```bash
   cp apps/dashboard-web/.env.example apps/dashboard-web/.env
   # Edit apps/dashboard-web/.env if needed
   ```

   Required environment variables for API:
   - `DATABASE_URL` - Your Neon PostgreSQL connection string
   - `REDIS_URL` - Your Upstash Redis connection string
   - `JWT_SECRET` - A strong random string for JWT signing
   - `RESEND_API_KEY` - Your Resend API key for emails

3. **Build and start all services**
   ```bash
   docker-compose up -d --build
   ```

4. **Run database migrations**
   ```bash
   docker-compose exec api npx prisma migrate deploy
   ```

5. **Seed the database (optional)**
   ```bash
   docker-compose exec api npx prisma db seed
   ```

6. **Access the applications**
   - API: http://localhost:4000
   - Dashboard: http://localhost:5173
   - Health Check: http://localhost:4000/health

## Services

The docker-compose.yml includes the following services:

### API
- **Port**: 4000
- **Build Context**: ./apps/api
- **Environment**: Loaded from `apps/api/.env`
- **Purpose**: Backend API server
- **External Dependencies**: Neon PostgreSQL, Upstash Redis

### Dashboard
- **Port**: 5173
- **Build Context**: ./apps/dashboard-web
- **Environment**: Loaded from `apps/dashboard-web/.env`
- **Depends on**: api
- **Purpose**: Admin dashboard web application

## Management Commands

### Start all services
```bash
docker-compose up -d
```

### Stop all services
```bash
docker-compose down
```

### Stop and remove volumes
```bash
docker-compose down -v
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f dashboard
```

### Rebuild a specific service
```bash
docker-compose up -d --build api
docker-compose up -d --build dashboard
```

### Run database migrations
```bash
docker-compose exec api npx prisma migrate deploy
```

### Access Prisma Studio
```bash
docker-compose exec api npx prisma studio
```

### Execute commands in containers
```bash
# API container
docker-compose exec api sh

# Dashboard container
docker-compose exec dashboard sh
```

## Production Deployment

### Security Considerations

1. **Change default passwords**
   - Update PostgreSQL password in docker-compose.yml
   - Set strong JWT_SECRET in environment variables

2. **Use environment files**
   - Never commit `.env` files to version control
   - Use `.env.example` as a template

3. **Network security**
   - Don't expose PostgreSQL and Redis ports in production
   - Use reverse proxy (nginx) for SSL/TLS

4. **Resource limits**
   - Add resource limits to docker-compose.yml for production

### Example Production docker-compose.yml

```yaml
services:
  api:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
    networks:
      - external

  dashboard:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
    networks:
      - external

networks:
  external:
    driver: bridge
```

### Using a Reverse Proxy (nginx)

Create an nginx configuration file:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs <service-name>

# Check container status
docker-compose ps
```

### Database connection issues
```bash
# Check API logs for connection errors
docker-compose logs api

# Verify your DATABASE_URL in apps/api/.env is correct
# Ensure Neon database is accessible from your network
```

### Build failures
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

### Permission issues
```bash
# Fix volume permissions
docker-compose down
sudo chown -R $USER:$USER ./postgres_data
docker-compose up -d
```

## Monitoring

### Health Checks
- API: `GET /health`
- Returns: `{ status: "ok", service: "restaurant-pos-api" }`

### View resource usage
```bash
docker stats
```

## Backup and Restore

### Backup database
```bash
# Use Neon's backup features or pg_dump directly
pg_dump $DATABASE_URL > backup.sql
```

### Restore database
```bash
# Restore to Neon
psql $DATABASE_URL < backup.sql
```

## Scaling

### Scale API (with load balancer)
```bash
docker-compose up -d --scale api=3
```

Note: You'll need a load balancer (nginx, HAProxy) to distribute traffic.

## Updates

### Update application code
```bash
git pull
docker-compose up -d --build
```

### Update dependencies
```bash
# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Support

For issues or questions:
- Check logs: `docker-compose logs`
- Verify health: `curl http://localhost:4000/health`
- Review documentation in the repository
