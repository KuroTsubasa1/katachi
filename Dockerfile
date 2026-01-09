# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install postgres client for migrations
RUN apk add --no-cache postgresql-client

# Copy package files for running migrations
COPY package*.json ./

# Install only production dependencies + drizzle-kit (skip scripts to avoid husky)
RUN npm install --legacy-peer-deps --omit=dev --ignore-scripts && \
    npm install drizzle-kit drizzle-orm postgres --legacy-peer-deps --ignore-scripts

# Copy built application
COPY --from=builder /app/.output /app/.output

# Copy database files for migrations
COPY --from=builder /app/server/db /app/server/db
COPY --from=builder /app/drizzle.config.ts /app/drizzle.config.ts

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Set environment variables
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
ENV NODE_ENV=production

# Start the application with migrations
ENTRYPOINT ["/app/docker-entrypoint.sh"]
