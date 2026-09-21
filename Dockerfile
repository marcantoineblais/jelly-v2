FROM node:24-bookworm-slim AS builder

WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
RUN pnpm build:servers


FROM node:24-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/dist-servers ./dist-servers
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./

# Install dependencies for the server
RUN corepack enable
RUN pnpm install --prod --frozen-lockfile

CMD ["node", "server.js"]