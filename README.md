# Jelly - Production Deployment Guide

Jelly is a media management application built with Next.js, designed for handling torrents, downloads, and media libraries. This guide focuses on deploying the application in a production environment.

## Prerequisites

- Docker and Docker Compose installed on your server.
- A reverse proxy (e.g., Caddy, Nginx, or Traefik) for handling HTTPS and routing.
- SSL certificates for secure access.
- Sufficient storage for downloads and media libraries.
- Optional: VPN setup for torrenting (Gluetun is included in the provided docker-compose.yml).

## Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

- `WIREGUARD_PRIVATE_KEY`: Your ProtonVPN WireGuard private key (for VPN).
- `SERVER_COUNTRIES`: VPN server countries (default: Canada).
- `QBITTORRENT_WEBUI_PORT`: Port for qBittorrent Web UI (default: 8080).
- `JACKETT_PORT`: Port for Jackett (default: 9117).
- `FLARESOLVERR_PORT`: Port for FlareSolverr (default: 8191).
- `PUID` and `PGID`: User and group IDs for file permissions (default: 1000).
- Other app-specific variables as needed.

### App Configuration

Copy `example.config.json` to `config.json` and customize:

- `download_paths`: Array of paths where downloads are stored.
- `libraries`: Array of media libraries with name, path, and type (show or movie).
- `videos_ext`: Supported video file extensions.

Ensure paths are accessible within the Docker containers or mounted volumes.

## Building and Running

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd jelly
   ```

2. **Configure environment and config files** as described above.

3. **Build the Docker image** (if using a custom build):
   ```bash
   docker build -t jelly:latest .
   ```
   Or pull the pre-built image: `ghcr.io/marcantoineblais/jelly:latest`

4. **Run the services**:
   ```bash
   docker-compose up -d
   ```

   This starts:
   - Gluetun (VPN)
   - FlareSolverr (anti-bot service)
   - Jackett (torrent indexer)
   - qBittorrent (torrent client)
   - Jelly app (via the image)

   Note: The Jelly app container is not explicitly in docker-compose.yml; ensure it's included or run separately.

## Networking and Security

- **Ports**: Expose necessary ports through your reverse proxy or firewall.
  - Jelly app: Typically port 3000 (internal).
  - qBittorrent: 8080
  - Jackett: 9117
  - FlareSolverr: 8191

- **Reverse Proxy**: Configure your reverse proxy to route traffic to the containers. Enable HTTPS with SSL certificates.

- **VPN**: Gluetun provides VPN connectivity for torrenting. Ensure `WIREGUARD_PRIVATE_KEY` is set securely.

- **Firewall**: Configure firewall rules to allow only necessary inbound traffic.

- **Secrets**: Store sensitive data (keys, passwords) securely, e.g., using Docker secrets or environment variable managers.

## Post-Deployment Setup

1. **Access the app**: Navigate to your domain/IP and set up authentication via `/setup`.

2. **Configure qBittorrent**:
   - Access Web UI at configured port.
   - Set Default Save Path to `/downloads`.

3. **Configure Jackett**:
   - Access Web UI.
   - Add indexers and note the API key.

4. **Mount Volumes**: Ensure download and media paths are properly mounted and accessible.

## Monitoring and Maintenance

- **Logs**: Monitor container logs with `docker-compose logs`.
- **Updates**: Regularly update images and dependencies.
- **Backups**: Backup configuration, databases, and media data.

## Troubleshooting

- **Common Issues**:
  - VPN connection fails: Verify `WIREGUARD_PRIVATE_KEY`.
  - Permission errors: Check PUID/PGID and volume permissions.
  - Service unreachable: Ensure ports are correctly exposed and firewall rules are set.

- **Support**: Refer to the project's issue tracker for bugs or feature requests.

