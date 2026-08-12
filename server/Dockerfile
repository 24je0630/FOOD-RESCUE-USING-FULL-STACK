# Use Node 22 LTS alpine as base
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies and generate prisma client
RUN npm ci

# Copy application source
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Expose port (must match the backend port, default 5000)
EXPOSE 5000

# Start server
CMD ["npm", "start"]
