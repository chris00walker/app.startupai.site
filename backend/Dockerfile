# Multi-stage build for production optimization
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with security optimizations
RUN npm ci --only=production --legacy-peer-deps && \
    npm cache clean --force

# Copy source code
COPY . .

# Build application (if build script exists)
RUN npm run build || true

# Production stage
FROM node:22-alpine AS production

# Install Chrome dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Tell Puppeteer to use the installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S strategyzer -u 1001

# Set working directory
WORKDIR /app

# Security: Set proper ownership
RUN chown -R strategyzer:nodejs /app

# Copy built application from builder stage
COPY --from=builder --chown=strategyzer:nodejs /app .

# Create directories for security services
RUN mkdir -p /app/security-reports /app/audit-logs && \
    chown -R strategyzer:nodejs /app/security-reports /app/audit-logs

# Security: Remove unnecessary packages and update
RUN apk update && \
    apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Security: Switch to non-root user
USER strategyzer

# Health check for monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Expose port
EXPOSE 4000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "server/index.js"]
