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
ENV HOSTNAME=0.0.0.0

COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/file-server.js ./
COPY --from=builder /app/socket-server.js ./

CMD ["npm", "start"]