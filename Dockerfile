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

# Install su-exec to allow switching from root to app user
RUN apk add --no-cache su-exec

# create a non-root user for improved security
RUN addgroup -S app && adduser -S app -G app

# Install only production dependencies (cached by package files)
COPY package*.json ./
RUN npm ci --only=production --silent --no-audit --no-fund

# Copy built artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# Prepare uploads directory and set ownership to non-root user
RUN mkdir -p uploads

# Copy and prepare the entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 3000

# Start via entrypoint to fix permissions, then run the app
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "dist/index.js"]