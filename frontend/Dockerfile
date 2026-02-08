# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (ensure devDependencies are installed for build)
RUN npm ci

# Copy source code
COPY . .

# IMPORTANT: Ensure prisma directory is copied BEFORE generate
COPY prisma ./prisma/

# Generate Prisma Client (Explicitly)
RUN npx prisma generate

# Build application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
# Copy prisma schema for runtime migrations
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "run", "start:prod"]