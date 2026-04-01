FROM node:18-alpine

# Install dependencies for node-gyp (needed for bcrypt, sqlite3)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /app/src/public/uploads

# Set ownership (non-root user for security)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port (Internal to Docker network)
EXPOSE 3000

# Health check setup for internal API health route
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "start"]
