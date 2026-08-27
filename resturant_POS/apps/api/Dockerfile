# Stage 1: Build the Application
FROM node:20 AS builder

WORKDIR /usr/src/app

# Copy package files (now relative to apps/api)
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 2: Create Production Image
FROM node:20

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm install --production

# Copy built application from builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Set environment variables
ENV PORT=4000
ENV NODE_ENV=production

# Expose port
EXPOSE $PORT

# Use non-root user
USER node

# Start the application
CMD ["node", "dist/server.js"]