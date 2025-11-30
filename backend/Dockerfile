# Multi-stage Dockerfile for backend (monorepo: this Dockerfile lives in backend/)

# Stage 1: Build (install dev deps, compile TypeScript, generate Prisma client)
FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client (ensure prisma schema is available) before compiling
RUN npx prisma generate --schema=./prisma/schema.prisma || true

# Build the TypeScript code
RUN npm run build


# Stage 2: Production image
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy package.json (optional) and production node_modules from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Copy built output and Prisma client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma


# Do NOT copy local .env into the image. Provide env vars at runtime (Fly secrets, etc.)

# Expose port (use PORT env or default 3001)
EXPOSE 3001

# Start the app (use npm start which runs node dist/server.js)
CMD ["npm", "start"]
