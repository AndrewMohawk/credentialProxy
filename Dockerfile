FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

# Create production image
FROM node:18-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Create logs directory
RUN mkdir -p logs

# Create entrypoint script
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'if [ "$NODE_ENV" = "production" ]; then' >> /entrypoint.sh && \
    echo '  if [ -z "$JWT_SECRET" ]; then' >> /entrypoint.sh && \
    echo '    echo "ERROR: JWT_SECRET environment variable is required in production mode"' >> /entrypoint.sh && \
    echo '    exit 1' >> /entrypoint.sh && \
    echo '  fi' >> /entrypoint.sh && \
    echo '  if [ -z "$ENCRYPTION_KEY" ]; then' >> /entrypoint.sh && \
    echo '    echo "ERROR: ENCRYPTION_KEY environment variable is required in production mode"' >> /entrypoint.sh && \
    echo '    exit 1' >> /entrypoint.sh && \
    echo '  fi' >> /entrypoint.sh && \
    echo 'fi' >> /entrypoint.sh && \
    echo 'exec node dist/index.js' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=3000

# Expose the application port
EXPOSE ${PORT}

# Set entrypoint
ENTRYPOINT ["/entrypoint.sh"] 