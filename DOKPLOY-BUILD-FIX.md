# 🔧 Fix for Dokploy Build Errors

## Error 1: Missing package-lock.json
```
npm error The `npm ci` command can only install with an existing package-lock.json
```

## Error 2: Missing Environment Variables
```
warning msg="The \"BACKEND_DOMAIN\" variable is not set. Defaulting to a blank string."
```

## 🚀 Quick Solution

### Step 1: Set Environment Variables in Dokploy

**In Dokploy UI**, go to your project and add these environment variables:

```env
FRONTEND_DOMAIN=escola.yourdomain.com
BACKEND_DOMAIN=api.escola.yourdomain.com
DB_USER=escola_user
DB_PASSWORD=YourSecurePassword123!
DB_NAME=escola_db
JWT_SECRET=your32characterrandomstringhere1234567890
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=yourapppassword
SMTP_FROM=noreply@yourdomain.com
```

### Step 2: Pull Latest Fixes

The `Dockerfile.dokploy` has been updated to handle missing package-lock.json. Pull the latest changes:

```bash
git pull origin main
```

### Option 2: Use Simple Dockerfile

If the multi-stage build still fails, use the simpler version:

1. **In Dokploy UI**, change the dockerfile:
   ```yaml
   # In docker-compose.dokploy.yml, change:
   dockerfile: Dockerfile.dokploy
   # To:
   dockerfile: Dockerfile.simple
   ```

2. **Or via SSH**, edit the file:
   ```bash
   cd /var/lib/dokploy/projects/synexa-sis
   nano docker-compose.dokploy.yml
   # Change line 26: dockerfile: Dockerfile.simple
   ```

### Option 3: Manual Fix

If you can't pull updates, manually fix the Dockerfile:

```bash
cd /var/lib/dokploy/projects/synexa-sis/escola-backend
nano Dockerfile.dokploy
```

Replace lines 10-13 with:
```dockerfile
# Install all dependencies (including dev) for build stage
RUN npm ci
```

## 🔍 Root Cause

The error occurs because:
1. `npm ci --only=production` doesn't install devDependencies
2. NestJS needs devDependencies to build the application
3. The build stage requires all dependencies, not just production ones

## ✅ Complete Fix Applied

The updated `Dockerfile.dokploy` now uses a 3-stage build:
1. **Builder stage**: Installs ALL dependencies and builds the app
2. **Deps stage**: Installs ONLY production dependencies
3. **Production stage**: Combines built app with production dependencies

## 🛠️ Build Commands

After fixing, rebuild:

```bash
# Option 1: Via Dokploy UI
# Click "Redeploy" button

# Option 2: Via CLI
cd /var/lib/dokploy/projects/synexa-sis
docker-compose -f docker-compose.dokploy.yml build --no-cache escola-backend
docker-compose -f docker-compose.dokploy.yml up -d escola-backend
```

## 📝 Verify Fix

Check if backend is running:

```bash
# Check container status
docker ps | grep escola-backend

# Check build logs
docker logs synexa-sis_escola-backend_1 --tail 50

# Test health endpoint
curl http://localhost:3000/health
```

## 🆘 Still Having Issues?

Try these steps in order:

1. **Clear Docker cache**:
   ```bash
   docker system prune -a
   docker volume prune
   ```

2. **Check package-lock.json**:
   ```bash
   # Ensure package-lock.json exists and is valid
   cd escola-backend
   rm -rf node_modules package-lock.json
   npm install
   git add package-lock.json
   git commit -m "fix: regenerate package-lock.json"
   ```

3. **Use Node 18 explicitly**:
   ```dockerfile
   # Change in Dockerfile first line:
   FROM node:18.19.0-alpine AS builder
   ```

4. **Increase Docker memory** (if on VPS with limited resources):
   ```bash
   # Check available memory
   free -m
   
   # If less than 1GB available, add swap:
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

5. **Build locally and push image**:
   ```bash
   # On your local machine
   docker build -t your-registry/escola-backend:latest ./escola-backend
   docker push your-registry/escola-backend:latest
   
   # Then in docker-compose.dokploy.yml, replace build with:
   image: your-registry/escola-backend:latest
   ```

## ✅ Verification Steps

Once fixed and deployed:

```bash
# All these should work:
curl http://localhost:3000/health
curl https://api.escola.yourdomain.com/health
curl https://api.escola.yourdomain.com/api
```

## 📚 Additional Resources

- Full deployment guide: `DOKPLOY-MANUAL.md`
- Quick deployment: `DOKPLOY-QUICK-START.md`
- Health check: `./scripts/health-check.sh`

---

*If this fix doesn't work, please share the complete error log from:*
```bash
docker-compose -f docker-compose.dokploy.yml logs escola-backend
```