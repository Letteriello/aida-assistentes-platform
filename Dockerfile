# =============================================================================
# AIDA PLATFORM - DOCKER BUILD FOR EASYPANEL (100% FREE STACK)
# =============================================================================
# This Dockerfile creates a unified container with:
# - Node.js + Express backend (FREE alternative to Cloudflare Workers)
# - Next.js frontend
# - Neo4j database for knowledge graphs
# - Optimized for EasyPanel deployment - ZERO PAID SERVICES
# =============================================================================

# Stage 1: Build environment
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    linux-headers

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Build backend (Node.js + Express)
WORKDIR /app/backend
RUN npm run build

# =============================================================================
# Stage 2: Neo4j Database
# =============================================================================
FROM neo4j:5.15-community AS neo4j-base

# Copy Neo4j configuration
COPY docker/neo4j/neo4j.conf /etc/neo4j/neo4j.conf
COPY docker/neo4j/init.cypher /docker-entrypoint-initdb.d/

# Set environment variables
ENV NEO4J_AUTH=neo4j/${NEO4J_PASSWORD}
ENV NEO4J_PLUGINS=["apoc", "graph-data-science"]
ENV NEO4J_apoc_export_file_enabled=true
ENV NEO4J_apoc_import_file_enabled=true
ENV NEO4J_apoc_import_file_use__neo4j__config=true

# =============================================================================
# Stage 3: Runtime environment
# =============================================================================
FROM node:18-alpine AS runtime

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    supervisor \
    nginx \
    java-jre-headless

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S aida -u 1001

# Set working directory
WORKDIR /app

# Copy built applications
COPY --from=builder --chown=aida:nodejs /app/backend/dist ./backend
COPY --from=builder --chown=aida:nodejs /app/frontend/.next ./frontend
COPY --from=builder --chown=aida:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=aida:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=builder --chown=aida:nodejs /app/frontend/node_modules ./frontend/node_modules

# Copy configuration files
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/scripts/ ./scripts/

# Make scripts executable
RUN chmod +x ./scripts/*.sh

# Create necessary directories
RUN mkdir -p /var/log/supervisor \
    /var/log/nginx \
    /app/logs \
    /app/data

# Set ownership
RUN chown -R aida:nodejs /app /var/log/supervisor /var/log/nginx

# =============================================================================
# Stage 4: Final multi-service container
# =============================================================================
FROM runtime AS final

USER root

# Install and configure Neo4j
RUN apk add --no-cache openjdk11-jre
RUN wget -O - https://debian.neo4j.com/neotechnology.gpg.key | apk add --allow-untrusted -
RUN echo "http://debian.neo4j.com/repo stable/" >> /etc/apk/repositories
RUN apk update && apk add --no-cache neo4j

# Copy Neo4j configuration
COPY --from=neo4j-base /etc/neo4j/neo4j.conf /etc/neo4j/neo4j.conf
COPY docker/neo4j/init.cypher /var/lib/neo4j/scripts/

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV BACKEND_PORT=8787
ENV NEO4J_PORT=7687
ENV NEO4J_HTTP_PORT=7474
ENV FRONTEND_URL=http://localhost:3000
ENV BACKEND_URL=http://localhost:8787

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health && \
      curl -f http://localhost:8787/health && \
      curl -f http://localhost:7474/browser/ || exit 1

# Expose ports
EXPOSE 3000 8787 7687 7474 80

# Use supervisor to manage all services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

# =============================================================================
# LABELS FOR EASYPANEL
# =============================================================================
LABEL maintainer="AIDA Platform"
LABEL version="1.0.0"
LABEL description="AIDA Platform - AI Assistant Management System"
LABEL org.opencontainers.image.title="AIDA Platform"
LABEL org.opencontainers.image.description="Complete AI Assistant platform with Evolution API integration"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="AIDA Platform"