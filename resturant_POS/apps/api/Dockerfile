# Stage 1: Build the application
FROM node:20 AS builder

WORKDIR /usr/src/app

# Copy API package files
COPY apps/api/package*.json ./apps/api/

# Install dependencies
WORKDIR /usr/src/app/apps/api
RUN npm install

# Copy API source code
COPY apps/api/ .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build


# Stage 2: Production image
FROM node:20

WORKDIR /usr/src/app

# Copy package files
COPY apps/api/package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy built application
COPY --from=builder /usr/src/app/apps/api/dist ./dist

# Copy Prisma files
COPY --from=builder /usr/src/app/apps/api/prisma ./prisma

# Copy generated Prisma client
COPY --from=builder /usr/src/app/apps/api/node_modules/.prisma ./node_modules/.prisma

# Production environment
ENV NODE_ENV=production
ENV PORT=4000

# Expose API port
EXPOSE 4000

# Run as non-root user
USER node

# Start application
CMD ["node", "dist/server.js"]