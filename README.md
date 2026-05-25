# ✈ Flight Search MCP

A production-ready flight search app + MCP server using **Duffel** (fares) and **Flightradar24** (live status).

## Stack

| Layer | Tech |
|---|---|
| MCP Server | Node.js 22 + Fastify |
| Frontend | React 18 + Vite |
| Cache | Redis 7 |
| Proxy / TLS | Caddy (or Coolify) |
| Containerisation | Docker + Compose |

## Quick start (local)

```bash
# 1. Clone
git clone https://github.com/yourname/flight-search
cd flight-search

# 2. Install dependencies
cd mcp-server && npm install && cd ..
cd frontend   && npm install && cd ..

# 3. Configure env
cp .env.example .env
# Edit .env — add your DUFFEL_API_KEY and MCP_API_KEYS

# 4. Start Redis + server
docker compose up redis -d
cd mcp-server && npm run dev &

# 5. Start frontend dev server
cd frontend && npm run dev
# → http://localhost:5173
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DUFFEL_API_KEY` | ✅ | Duffel live/test token |
| `MCP_API_KEYS` | ✅ | Comma-separated API keys for MCP auth |
| `FRONTEND_MCP_KEY` | ✅ | Key used by the frontend (subset of MCP_API_KEYS) |
| `FR24_API_KEY` | ⬜ | Flightradar24 key (optional — degrades gracefully) |
| `REDIS_URL` | ✅ | Redis connection string |
| `PORT` | ⬜ | MCP server port (default 3001) |
| `LOG_LEVEL` | ⬜ | Pino log level (default `info`) |
| `CORS_ORIGINS` | ⬜ | Comma-separated allowed origins (default `*`) |

## Deploy on Coolify

1. **New Resource → Docker Compose** → point at this repo
2. Set env vars in the Coolify UI (no Caddy needed — Coolify handles TLS)
3. Remove or comment out the `caddy` service in `docker-compose.yml`
4. Set domain for `mcp` service → `api.yourdomain.com`
5. Set domain for `frontend` service → `flights.yourdomain.com`
6. Deploy 🚀

## API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/v1/search` | Search flights (one-way, round-trip, multi-city) |
| `GET` | `/v1/offers/:id` | Fetch/refresh a specific offer |
| `GET` | `/v1/live-status/:flightId` | Live flight status from FR24 |
| `GET` | `/v1/health` | Health check (public) |

All endpoints require `X-MCP-Key: <your_key>` header (except `/health`).

## Run tests

```bash
cd mcp-server && npm test
```

## Getting API keys

- **Duffel**: https://duffel.com → Dashboard → Access tokens → create token with `air:read`
- **Flightradar24**: https://fr24api.flightradar24.com → requires paid business plan
  - The app works fine without FR24 — live status will return `"status": "unknown"`

## Limitations

| Feature | Note |
|---|---|
| Loyalty club lookup | Pass `loyalty_programme_accounts` on the Duffel booking step |
| Seat maps | Backend ready (`getSeatMaps()`), expose `/v1/seat-map/:offerId` when needed |
| Actual booking | Expose offer `id` — complete via Duffel `/orders` endpoint separately |
| FR24 free tier | Does not include the search endpoint — commercial subscription required |
