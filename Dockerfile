FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
# npm ci fails when package-lock.json doesn't match package.json. Use npm install
# so the build succeeds. Run `npm install` locally and commit to re-enable npm ci.
RUN npm install

COPY . .
RUN mkdir -p public
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Standalone output is self-contained; no npm ci needed
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

COPY --from=builder /app/file-server.js ./
COPY --from=builder /app/socket-server.js ./

# Env file for runtime (SERVER_URL, DOMAIN_NAME, etc.)
COPY stack.env .env

CMD ["node", "server.js"]