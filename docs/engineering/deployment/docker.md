# 🐳 Docker Deployment Guide

## Overview

This guide covers the Docker-based deployment strategy for the Strategyzer AI Platform, including security best practices, production optimization, and Google Cloud Platform deployment.

---

## 🏗️ Docker Architecture

### Multi-Stage Build Strategy

```dockerfile
# Builder stage - Install dependencies and build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile --prod
COPY . .
RUN corepack enable pnpm && pnpm run build || true

# Production stage - Optimized runtime
FROM node:22-alpine AS production
# Security: Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S strategyzer -u 1001
WORKDIR /app
COPY --from=builder --chown=strategyzer:nodejs /app .
USER strategyzer
EXPOSE 4000
CMD ["node", "server/index.js"]
```

### Security Features

- **Non-root user**: Application runs as `strategyzer` user (UID 1001)
- **Minimal base image**: Alpine Linux for reduced attack surface
- **Read-only filesystem**: Container filesystem is read-only with specific tmpfs mounts
- **Capability dropping**: Removes all capabilities except essential ones
- **Health checks**: Built-in health monitoring
- **Signal handling**: Proper signal handling with dumb-init

---

## 🔒 Security Configuration

### Container Security

```yaml
# docker-compose.yaml security settings
security:
  cap_drop:
    - ALL
  cap_add:
    - CHOWN
    - SETGID
    - SETUID
  read_only: true
  tmpfs:
    - /tmp:noexec,nosuid,size=100m
    - /app/security-reports:noexec,nosuid,size=50m
    - /app/audit-logs:noexec,nosuid,size=100m
```

### Environment Variables

```bash
# Security Configuration
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters-long
MASTER_ENCRYPTION_KEY=your-super-secure-encryption-key-minimum-32-characters
FORCE_HTTPS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Security Scanning
ENABLE_SECURITY_SCANNING=true
SECURITY_SCAN_INTERVAL=86400000  # 24 hours
```

---

## 🚀 Production Deployment

### Prerequisites

1. **Google Cloud SDK** installed and configured
2. **Docker** installed and running
3. **Production environment** variables configured
4. **GCP project** with required APIs enabled

### Deployment Steps

1. **Prepare Environment**

   ```bash
   # Copy and configure production environment
   cp .env.production.template .env.production
   # Edit .env.production with your values
   ```

2. **Run Deployment Script**

   ```bash
   # Full deployment
   ./scripts/deploy-production.sh

   # Build only
   ./scripts/deploy-production.sh build-only

   # Deploy only (if images already built)
   ./scripts/deploy-production.sh deploy-only
   ```

3. **Verify Deployment**

   ```bash
   # Check deployment health
   ./scripts/deploy-production.sh verify
   ```

### Manual Deployment

If you prefer manual deployment:

```bash
# 1. Authenticate with GCP
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Configure Docker for GCR
gcloud auth configure-docker

# 3. Build and push backend
cd backend
docker build -t gcr.io/YOUR_PROJECT_ID/strategyzer-ai-backend:latest .
docker push gcr.io/YOUR_PROJECT_ID/strategyzer-ai-backend:latest

# 4. Deploy to Cloud Run
gcloud run deploy strategyzer-ai-backend \
  --image gcr.io/YOUR_PROJECT_ID/strategyzer-ai-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 4000 \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars "NODE_ENV=production,PORT=4000"
```

---

## 📊 Monitoring and Health Checks

### Built-in Health Checks

```dockerfile
# Dockerfile health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"
```

### Docker Compose Health Checks

```yaml
# docker-compose.yaml health check
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:4000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Monitoring Endpoints

- **Health Check**: `GET /api/health`
- **Security Status**: `GET /api/security/health`
- **Monitoring Dashboard**: `GET /api/monitoring/dashboard`
- **Prometheus Metrics**: `GET /api/monitoring/metrics/prometheus`

---

## 🔧 Local Development

### Development Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Base Image | node:22-alpine | node:22-alpine (multi-stage) |
| User | root | strategyzer (non-root) |
| Filesystem | read-write | read-only |
| Capabilities | all | minimal |
| Health Checks | basic | comprehensive |
| Security Scanning | optional | enabled |
| Monitoring | basic | full APM |

---

## 🛡️ Security Best Practices

### Container Security (Production)

1. **Non-root User**
   - Application runs as `strategyzer` user
   - UID/GID 1001 for consistency

2. **Minimal Capabilities**
   - Drop all capabilities by default
   - Add only essential capabilities

3. **Read-only Filesystem**
   - Container filesystem is read-only
   - Specific tmpfs mounts for writable areas

4. **Resource Limits**

   ```yaml
   deploy:
     resources:
       limits:
         memory: 2G
         cpus: '2'
       reservations:
         memory: 1G
         cpus: '1'
   ```

### Image Security

1. **Base Image**
   - Use official Alpine Linux images
   - Regular security updates
   - Minimal attack surface

2. **Dependency Management**
   - Use `pnpm install --frozen-lockfile` for reproducible builds
   - Regular dependency updates
   - Security vulnerability scanning

3. **Secrets Management**
   - Never include secrets in images
   - Use environment variables
   - Rotate secrets regularly

---

## 📈 Performance Optimization

### Build Optimization

1. **Multi-stage Builds**
   - Separate build and runtime stages
   - Smaller production images
   - Faster deployments

2. **Layer Caching**
   - Optimize Dockerfile layer order
   - Copy package.json first
   - Leverage Docker build cache

3. **Image Size**
   - Use Alpine Linux base images
   - Remove unnecessary files
   - Optimize .dockerignore

### Runtime Optimization

1. **Resource Allocation**

   ```yaml
   # Cloud Run configuration
   memory: 2Gi
   cpu: 2
   max-instances: 10
   min-instances: 1
   concurrency: 80
   ```

2. **Startup Time**
   - Optimize application startup
   - Use health checks for readiness
   - Proper signal handling

---

## 🔍 Troubleshooting

### Common Issues

1. **Container Won't Start**

   ```bash
   # Check logs
   docker logs container-name
   
   # Check health status
   docker inspect --format='{{.State.Health.Status}}' container-name
   ```

2. **Permission Issues**

   ```bash
   # Check file ownership
   docker exec container-name ls -la /app
   
   # Verify user
   docker exec container-name whoami
   ```

3. **Network Issues**

   ```bash
   # Test connectivity
   docker exec container-name wget -qO- http://localhost:4000/api/health
   
   # Check port binding
   docker port container-name
   ```

### Debug Mode

```bash
# Run container in debug mode
docker run -it --rm \
  -e DEBUG_MODE=true \
  -e NODE_ENV=development \
  gcr.io/your-project/strategyzer-ai-backend:latest \
  /bin/sh
```

---

## 📋 Deployment Checklist

### Pre-deployment

- [ ] Environment variables configured
- [ ] Secrets properly set
- [ ] Database connection tested
- [ ] Security scan passed
- [ ] Tests passing

### Deployment

- [ ] Images built successfully
- [ ] Images pushed to registry
- [ ] Services deployed to Cloud Run
- [ ] Health checks passing
- [ ] Monitoring configured

### Post-deployment

- [ ] End-to-end tests passed
- [ ] Performance metrics normal
- [ ] Security alerts configured
- [ ] Backup strategy verified
- [ ] Documentation updated

---

## 🎯 Next Steps

1. **Custom Domain Setup**
   - Configure DNS records
   - Set up SSL certificates
   - Update CORS settings

2. **Advanced Monitoring**
   - Set up custom dashboards
   - Configure alerting rules
   - Implement log aggregation

3. **Scaling Strategy**
   - Configure auto-scaling
   - Implement load balancing
   - Plan for high availability

4. **Disaster Recovery**
   - Set up automated backups
   - Test recovery procedures
   - Document runbooks

This Docker deployment strategy provides enterprise-grade security, monitoring, and scalability for the Strategyzer AI Platform while maintaining simplicity and reliability.
