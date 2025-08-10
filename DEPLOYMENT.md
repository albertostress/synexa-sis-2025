# 🚀 Synexa-SIS Deployment Guide for Dokploy

## Prerequisites

- Dokploy installed on your VPS
- Domain names configured (pointing to your VPS IP)
- GitHub repository access

## 📋 Step-by-Step Deployment

### 1. Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.dokploy.example .env.dokploy
```

2. Edit `.env.dokploy` with your actual values:
```bash
# Required configurations:
FRONTEND_DOMAIN=escola.yourdomain.com    # Your frontend domain
BACKEND_DOMAIN=api.escola.yourdomain.com # Your API domain
DB_PASSWORD=generate_secure_password     # Strong database password
JWT_SECRET=generate_32_char_secret       # JWT secret (min 32 chars)
```

### 2. Deploy on Dokploy

#### Option A: Via Dokploy UI

1. **Login to Dokploy Dashboard**
   - Access: `https://your-vps-ip:3000`

2. **Create New Project**
   - Click "New Project"
   - Name: `synexa-sis`
   - Type: `Docker Compose`

3. **Configure Repository**
   - Repository URL: `https://github.com/albertostress/synexa-sis-2025`
   - Branch: `main`
   - Docker Compose File: `docker-compose.dokploy.yml`

4. **Set Environment Variables**
   - Click "Environment Variables"
   - Add all variables from your `.env.dokploy` file

5. **Deploy**
   - Click "Deploy"
   - Monitor logs for deployment progress

#### Option B: Via Dokploy CLI

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Clone repository
cd /var/lib/dokploy/projects
git clone https://github.com/albertostress/synexa-sis-2025 synexa-sis

# Copy environment file
cd synexa-sis
cp .env.dokploy.example .env.dokploy
nano .env.dokploy  # Edit with your values

# Deploy using Dokploy CLI
dokploy deploy --compose docker-compose.dokploy.yml --env .env.dokploy
```

### 3. Post-Deployment Setup

#### Initialize Database and Create Admin User

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Navigate to project directory
cd /var/lib/dokploy/projects/synexa-sis

# Run initialization script
./scripts/init-dokploy.sh
```

The script will:
1. Wait for services to be ready
2. Run database migrations
3. Optionally seed initial data
4. Create an admin user (you'll be prompted for email/password)

#### Manual Database Setup (if script fails)

```bash
# Get container name
docker ps | grep escola-backend

# Run migrations
docker exec [container-name] npx prisma migrate deploy

# Create admin user manually
docker exec -it [container-name] npx prisma studio
# Then create user via Prisma Studio UI
```

### 4. Configure DNS

Add these DNS records to your domain:

```
Type  Name     Value           TTL
A     escola   YOUR_VPS_IP     300
A     api      YOUR_VPS_IP     300
```

Or for subdomains:
```
CNAME escola.yourdomain.com  → your-vps.com
CNAME api.escola.yourdomain.com → your-vps.com
```

### 5. SSL Configuration

Dokploy automatically handles SSL certificates via Let's Encrypt. Ensure:

1. Domains are properly pointed to your VPS
2. Ports 80 and 443 are open
3. Wait 2-5 minutes for certificates to be issued

### 6. Verify Deployment

1. **Check Services Status**:
```bash
docker ps
# Should show: postgres, escola-backend, escola-frontend, redis, playwright-service
```

2. **Test Health Endpoints**:
```bash
# Backend health check
curl https://api.escola.yourdomain.com/health

# Expected response:
# {"status":"ok","database":"connected"...}
```

3. **Access Application**:
- Frontend: `https://escola.yourdomain.com`
- API Docs: `https://api.escola.yourdomain.com/api`

## 🔧 Troubleshooting

### Container Not Starting

```bash
# Check logs
docker logs escola-backend-1
docker logs escola-frontend-1

# Common issues:
# - Database connection: Check DATABASE_URL in env
# - Port conflicts: Ensure ports 3000, 3001 are free
```

### Database Connection Issues

```bash
# Test database connection
docker exec postgres-1 psql -U escola_user -d escola_db -c "SELECT 1"

# Reset database if needed
docker exec escola-backend-1 npx prisma migrate reset --force
```

### CORS Issues

Ensure environment variables are set:
- `FRONTEND_URL` in backend must match your frontend domain
- Check Traefik labels in docker-compose.dokploy.yml

### Clear Cache/Rebuild

```bash
# Stop all containers
docker-compose -f docker-compose.dokploy.yml down

# Remove volumes (WARNING: deletes data)
docker volume prune

# Rebuild and start
docker-compose -f docker-compose.dokploy.yml up -d --build
```

## 📊 Monitoring

### View Logs

Via Dokploy UI:
- Navigate to your project
- Click "Logs" tab
- Filter by service

Via CLI:
```bash
# All services
docker-compose -f docker-compose.dokploy.yml logs -f

# Specific service
docker-compose -f docker-compose.dokploy.yml logs -f escola-backend
```

### Resource Usage

```bash
# Check container stats
docker stats

# Check disk usage
df -h
du -sh /var/lib/dokploy/projects/synexa-sis/files/*
```

## 🔄 Updates and Maintenance

### Deploy Updates

1. **Via Dokploy UI**:
   - Navigate to project
   - Click "Redeploy"

2. **Via CLI**:
```bash
cd /var/lib/dokploy/projects/synexa-sis
git pull
docker-compose -f docker-compose.dokploy.yml up -d --build
```

### Backup Database

```bash
# Manual backup
docker exec postgres-1 pg_dump -U escola_user escola_db > backup_$(date +%Y%m%d).sql

# Restore backup
docker exec -i postgres-1 psql -U escola_user escola_db < backup_20240101.sql
```

### Automated Backups

Create cronjob:
```bash
crontab -e
# Add line:
0 2 * * * docker exec postgres-1 pg_dump -U escola_user escola_db > /backups/escola_$(date +\%Y\%m\%d).sql
```

## 🔒 Security Recommendations

1. **Change Default Passwords**
   - Database password
   - JWT secret
   - Admin user password

2. **Configure Firewall**
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

3. **Regular Updates**
```bash
# Update system
apt update && apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.dokploy.yml pull
docker-compose -f docker-compose.dokploy.yml up -d
```

4. **Monitor Access Logs**
```bash
# Check nginx access logs
docker logs escola-frontend-1 | grep -E "4[0-9]{2}|5[0-9]{2}"

# Check failed login attempts
docker logs escola-backend-1 | grep "Failed login"
```

## 📞 Support

- **Dokploy Issues**: Check [Dokploy Docs](https://docs.dokploy.com)
- **Application Issues**: Create issue on [GitHub](https://github.com/albertostress/synexa-sis-2025)

## Quick Commands Reference

```bash
# Status
docker ps
docker-compose -f docker-compose.dokploy.yml ps

# Logs
docker-compose -f docker-compose.dokploy.yml logs -f [service]

# Restart
docker-compose -f docker-compose.dokploy.yml restart [service]

# Shell access
docker exec -it escola-backend-1 sh
docker exec -it postgres-1 psql -U escola_user -d escola_db

# Database operations
docker exec escola-backend-1 npx prisma studio
docker exec escola-backend-1 npx prisma migrate deploy
docker exec escola-backend-1 npx prisma db seed
```

---

Last updated: 2025-01-10