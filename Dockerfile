# Build stage (Debian base: npm ci works reliably; Alpine often fails on optional/native deps)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# npm install: more tolerant than npm ci (optional/native deps often fail in CI/Docker)
RUN npm install --omit=optional

COPY . .
RUN npm run build
RUN npm prune --omit=dev

# Production stage (Alpine = smaller image; we only copy built artifacts, no npm run)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/file-server.js ./
COPY --from=builder /app/socket-server.js ./

# Default when running this image alone; docker-compose overrides per service (next / file-server / socket-server)
CMD ["node", "node_modules/next/dist/bin/next", "start"]
