This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Run the full dev stack (Next.js, Jackett, qBittorrent, socket-server, files-server):

```bash
cp .env.dev .env
# Edit .env and set JACKETT_API_KEY (from Jackett UI after first start)
docker compose -f docker-compose.dev.yml up --build
```

- **App:** http://localhost:3000 (Next.js dev with hot reload)
- **Jackett:** http://localhost:9117 — add indexers, copy API key into `.env`
- **qBittorrent:** http://localhost:8080 — set Default save path to `/downloads` in Options

The app uses `config.dev.json` for download/library paths (dev volumes: `downloads-dev`, `encodes-dev`, `media-dev`).

### qBittorrent (Docker)

When using the optional qBittorrent service, completed downloads are written to the same path the app uses for transfers (`/mnt/downloads` on the host). Incomplete torrents use the default `downloads/temp` subfolder. After first start:

1. Open the qBittorrent Web UI (port 8080).
2. Go to **Tools → Options → Downloads** and set **Default Save Path** to `/downloads`.

Completed files will then appear under `/mnt/downloads` and show up in the app.

### Jackett (Docker)

The optional Jackett service provides torrent search via the Torrents page. It proxies multiple indexers (1337x, Torlock, etc.) through one API. After first start:

1. Open the Jackett Web UI (port 9117).
2. Add indexers (e.g. **Add indexer** → choose one, configure if needed).
3. Copy your **API key** from the top-right of the Jackett UI and set `JACKETT_API_KEY` in your env (and `JACKETT_URL=http://jackett:9117` when using Docker).

Then use the **Torrents** page: enter a title and click Search to query all configured indexers.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
