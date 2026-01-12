# Multi-stage Dockerfile for Conflux DevKit
# Builds optimized production images for backend and frontend

# Stage 1: Base image with pnpm
FROM node:20-bookworm-slim AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/node/package.json ./packages/node/
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 3: Build all packages
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

COPY . .

# Build all packages
RUN pnpm build

# Stage 4: Backend production image
FROM base AS backend

# Install production dependencies only
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/node/package.json ./packages/node/
COPY packages/backend/package.json ./packages/backend/

RUN pnpm install --prod --frozen-lockfile

# Copy built artifacts
COPY --from=builder /app/packages/node/dist ./packages/node/dist
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/.env.example ./packages/backend/.env

# Expose ports
EXPOSE 3001 3002 8545 12537

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start backend
CMD ["node", "packages/backend/dist/index.js"]

# Stage 5: Frontend production image
FROM nginx:alpine AS frontend

# Copy built frontend
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

# Copy nginx config
COPY --from=builder /app/packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || echo "server { listen 3000; root /usr/share/nginx/html; location / { try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
