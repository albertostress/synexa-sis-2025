# Dokploy Deployment Guide for Synexa-SIS

## Prerequisites

1. Dokploy instance running with Traefik
2. Domains configured:
   - `escola.kiandaedge.online` → Frontend
   - `api.kiandaedge.online` → Backend API

## Environment Variables in Dokploy

Configure these in your Dokploy project settings:

```env
# Database
DB_USER=escola_user
DB_PASSWORD=uma_senha_forte
DB_NAME=escola_db

# JWT
JWT_SECRET=983cc770545ec209d12cbfa39e6a83618e14bed69c07a3e81303d15cef2fc7bb

# Domains
FRONTEND_DOMAIN=escola.kiandaedge.online
BACKEND_DOMAIN=api.kiandaedge.online

# Node
NODE_ENV=production
PORT=3000

# Optional SMTP (leave empty if not using)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@kiandaedge.online
```

## Deployment Steps

### 1. Initial Setup in Dokploy

1. Create a new project in Dokploy
2. Set the Git repository URL
3. Configure environment variables (above)
4. Set the docker-compose file: `docker-compose.dokploy.yml`

### 2. Deploy

In Dokploy UI:
1. Click "Deploy" button
2. Monitor the build logs
3. Wait for all services to be healthy

### 3. Post-Deployment Setup

After deployment, run these commands in the backend container:

```bash
# Run database migrations
npx prisma migrate deploy

# Create test users
node scripts/create-dokploy-users.js
```

Or use the Dokploy terminal to execute:

```bash
docker exec [backend-container-name] npx prisma migrate deploy
docker exec [backend-container-name] node scripts/create-dokploy-users.js
```

## Test Accounts

After running the setup script:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@escola.com | admin123 |
| Secretária | secretaria@escola.com | secretaria123 |
| Professor | professor@escola.com | professor123 |

## Verify Deployment

1. **Frontend**: https://escola.kiandaedge.online
2. **API Health**: https://api.kiandaedge.online/health
3. **API Docs**: https://api.kiandaedge.online/api

## Troubleshooting

### Frontend shows 405 error on login
- Check if `BACKEND_DOMAIN` is set correctly
- Verify CORS configuration in docker-compose.dokploy.yml
- Check browser console for the actual API URL being called

### Database connection errors
- Verify `DB_USER`, `DB_PASSWORD`, and `DB_NAME` match in all services
- Check if postgres container is healthy
- Run migrations: `npx prisma migrate deploy`

### Build failures
- Check if package-lock.json exists (run `npm install` locally first)
- Verify Node version compatibility (18.x required)
- Check Dockerfile.dev-prod for the correct build process

### Users can't login
- Run the user creation script: `node scripts/create-dokploy-users.js`
- Check JWT_SECRET is set and consistent
- Verify bcrypt is working correctly

## Monitoring

Check container health:
```bash
docker ps
docker logs [container-name]
```

Check API health:
```bash
curl https://api.kiandaedge.online/health
```

## Updates

To update the deployment:
1. Push changes to Git repository
2. Click "Redeploy" in Dokploy
3. Run migrations if schema changed
4. Clear browser cache if frontend changes don't appear

## Security Notes

- Change default passwords immediately after deployment
- Use strong JWT_SECRET (minimum 32 characters)
- Configure SMTP for password recovery emails
- Enable rate limiting in production
- Set up backup strategy for PostgreSQL data

## Support

For issues specific to:
- **Dokploy**: Check Dokploy documentation
- **Application**: Check logs in Dokploy UI
- **Database**: Access postgres container logs
- **Frontend 405 errors**: Verify API URL configuration