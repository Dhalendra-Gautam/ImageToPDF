# Multi-stage build for production
# Stage 1: Build the React app
FROM node:18-alpine AS builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install dependencies
RUN npm install

# Copy client source
COPY client/public ./public
COPY client/src ./src

# Build the React app
RUN npm run build

# Stage 2: Server
FROM node:18-alpine

WORKDIR /app

# Create uploads directory
RUN mkdir -p /app/server/uploads

# Copy server package files
COPY server/package*.json ./server/

# Install server dependencies
WORKDIR /app/server
RUN npm install --production

# Copy server source
COPY server/server.js .
COPY server/index.js .

# Copy built client from previous stage
WORKDIR /app/client
COPY --from=builder /app/client/build ./build

# Create static directory symlink
RUN ln -sf /app/client/build/static/static 2>/dev/null || mkdir -p /app/public && cp -r /app/client/build/* /app/public/ 2>/dev/null || true

# Set NODE_ENV to production
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
