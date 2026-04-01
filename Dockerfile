# Step 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

# Step 2: Run the application
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# create a non-root user for improved security
RUN addgroup -S app && adduser -S app -G app

# Install only production dependencies (cached by package files)
COPY package*.json ./
RUN npm ci --only=production --silent --no-audit --no-fund

# Copy built artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# Prepare uploads directory and set ownership to non-root user
RUN mkdir -p uploads && chown -R app:app /app

USER app

EXPOSE 3000
CMD ["node", "dist/index.js"]