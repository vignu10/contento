# Dockerfile for Railway deployment
# Simple, reliable Next.js build

FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client with explicit schema path
ENV PRISMA_SCHEMA_PATH=/app/prisma/schema.prisma
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Create uploads directory for local storage fallback
RUN mkdir -p /app/uploads

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Expose port
EXPOSE 3000

# Start of application
CMD ["npm", "start"]
