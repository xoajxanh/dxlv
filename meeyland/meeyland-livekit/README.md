# LiveKit Server Setup (Development)

This folder contains the minimum configuration required to run a LiveKit server locally or on a physical server using Docker.

## Prerequisites
- Docker
- Docker Compose

## Start the Server
1. Open a terminal in this directory.
2. Run the following command:
```bash
docker-compose up -d
```
3. The LiveKit server will start in the background and listen on port `7880`.

## Ports to Open in Firewall
If you are running this on a physical server (not your local PC), you **must** open the following ports in your firewall to allow video traffic:
- **7880/TCP**: HTTP/WebSocket for signaling
- **7881/TCP**: TCP fallback for WebRTC
- **50000-60000/UDP**: WebRTC UDP media ports

## Connect from Frontend & Backend
- **Frontend (`NEXT_PUBLIC_LIVEKIT_URL`)**: `ws://YOUR_SERVER_IP:7880` (or `ws://127.0.0.1:7880` if running locally). Note: Browsers require HTTPS/WSS for camera access unless you are on `localhost` or `127.0.0.1`.
- **Backend API Key & Secret**: The default configured key is `devkey` and secret is `secret`. Ensure your `meeyland-be/appsettings.json` matches this exactly.
