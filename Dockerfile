# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy app and dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/file-server.js ./
COPY --from=builder /app/socket-server.js ./

# Ports are set at runtime via .env (PORT, SOCKET_SERVER_PORT, FILE_SERVER_PORT)
EXPOSE 4000 4001 4002
# Next reads PORT from env; docker-compose overrides CMD per service
CMD ["node", "node_modules/next/dist/bin/next", "start"]
