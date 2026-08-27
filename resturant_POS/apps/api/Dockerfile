# Build stage
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy root + api package.json first (better layer caching)
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Copy prisma schema (adjust path if it's elsewhere)
COPY apps/api/prisma ./apps/api/prisma/

# Install deps for the whole workspace
RUN npm install --legacy-peer-deps

# Copy the api app source
COPY apps/api ./apps/api

# Generate Prisma client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build only the api app
RUN npm run build --workspace=apps/api

# ---------------------------------------------

# Production stage
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package*.json ./apps/api/
COPY --from=builder /app/package*.json ./

WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && npm run seed && node dist/server.js"]