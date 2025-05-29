# Dockerfile for full-stack deployment (Render, Railway, etc.)
FROM node:20-alpine as builder
WORKDIR /app

# Install root dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all files and build server
COPY . .
RUN npm run build

# Build client
# WORKDIR /app/client
# RUN npm install
# RUN npm run build

# --- Production image ---
FROM node:20-alpine
WORKDIR /app

# Copy server build and production node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy client build to server's public directory (adjust if your server expects a different path)
# COPY --from=builder /app/client/dist ./server/public

# Expose port (change if your server uses a different port)
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
