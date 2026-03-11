# Dockerfile for Railway deployment
# Simplified, reliable Next.js build

FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Create a startup script that runs migrations before starting
RUN echo '#!/bin/sh\nnpx prisma migrate deploy\nexec npm start' > /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

# Create uploads directory for local storage fallback
RUN mkdir -p /app/uploads

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Expose port
EXPOSE 3000

# Start application
CMD ["/app/docker-entrypoint.sh"]
