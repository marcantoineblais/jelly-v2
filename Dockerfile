FROM node:20-bookworm AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-bookworm AS runner
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
CMD ["npm", "start"]
