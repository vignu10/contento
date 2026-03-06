# Force cache invalidation - v2
FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
# Cache bust: force rebuild
ARG CACHE_BUST=1
RUN apt-get update && apt-get install -y \
    libc6 \
    openssl \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Clean install
RUN npm ci

# Generate Prisma Client for Debian
RUN npx prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y \
    openssl \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Generate Prisma Client again for production
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y \
    openssl \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy the standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files explicitly
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
