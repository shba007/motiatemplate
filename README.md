# iii TypeScript Worker Template

Event-driven, distributed service template built on [iii](https://iii.dev).

## Architecture

- **Engine Ports:**
  - `49134`: WebSocket interface for Workers
  - `3111`: Ingress gateway for HTTP Triggers
  - `3113`: Developer Observability & Flow Console
- **Worker Primitives:**
  - `api::health` (HTTP Trigger: `GET /health`)
  - `math::add` (Direct invocation)
  - `http::add_two_numbers` (HTTP Trigger: `POST /math/add`)

## Prerequisites

1. Install Bun: `curl -fsSL https://bun.sh/install | bash`
2. Install iii CLI: `curl -fsSL https://install.iii.dev/iii/main/install.sh | sh`

## Local Development

Start the engine:

```bash
iii
Start the console:
code
Bash
iii console
In another terminal, start the TypeScript worker:
code
Bash
bun run worker:dev
Verify Endpoints
code
Bash
# Health check
curl http://localhost:3111/health

# Post math operation
curl -X POST http://localhost:3111/math/add \
  -H "Content-Type: application/json" \
  -d '{"a": 10, "b": 20}'
Docker Deployment
code
Bash
docker compose up -d --build
code
Code
```