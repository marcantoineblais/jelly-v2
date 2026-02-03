# Build stage (Debian base: npm ci works reliably; Alpine often fails on optional/native deps)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/file-server.js ./
COPY --from=builder /app/socket-server.js ./

# Default when running this image alone; docker-compose overrides per service (next / file-server / socket-server)
CMD ["node", "node_modules/next/dist/bin/next", "start"]
