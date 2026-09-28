# Docker in This Project

This guide explains how Docker packages and runs the Restaurant Admin Dashboard UI, then answers common beginner and advanced Docker questions using this repository's actual configuration.

## What Docker Runs

The project has two container images:

- **Web:** the React/Vite application is built into static files, then served by Nginx. Nginx also forwards API requests to the configured backend.
- **Mock API:** an optional Node.js service for offline demos and development. It keeps its data in memory, so changes are lost when the container restarts.

The Compose file starts the `web` service by default. The mock API has the `mock` profile and starts only when explicitly enabled.

```text
Browser
  | http://localhost:8080
  v
web container: Nginx serves React files
  | /api/* forwarded to API_UPSTREAM
  +--> host backend at host.docker.internal:4000 (default)
  `--> mock-api:4000 (mock profile)
```

## How the Web Image Is Built

[`web/Dockerfile`](../web/Dockerfile) uses a **multi-stage build**:

1. The `node:22-alpine` build stage installs the locked npm dependencies with `npm ci`, copies the frontend source, and runs `npm run build`.
2. The `nginx:1.27-alpine` runtime stage copies only the generated `dist` files and Nginx configuration. It does not include Node.js, npm dependencies, or the source tree needed to build the UI.

This keeps the runtime image focused on serving the compiled frontend. `EXPOSE 8080` documents the port the web container listens on; Compose publishes that container port to host port 8080.

The frontend calls relative `/api/...` URLs. [`web/nginx.conf.template`](../web/nginx.conf.template) handles the production routing:

- `/` serves the SPA, with unknown paths falling back to `index.html` so React Router can resolve client-side routes.
- `/assets/` gives built assets long-lived immutable cache headers.
- `/api/` is proxied to the runtime value of `API_UPSTREAM`.
- `/healthz` returns a simple `200` response for a basic liveness check.

The official Nginx image expands environment variables in files under `/etc/nginx/templates` when the container starts. This makes `API_UPSTREAM` a **runtime** setting: the same web image can point to different backends without rebuilding the frontend image.

## How the Mock API Image Is Built

[`mock-api/Dockerfile`](../mock-api/Dockerfile) uses `node:22-alpine`, copies the API package file and source, sets production mode and port 4000, switches to the built-in unprivileged `node` user, and starts `src/server.js`.

The mock server has no runtime npm dependencies and stores mutable state in memory. Its container does not define a persistent volume, so recreating or restarting it resets that state to the seed data.

## Compose Configuration

[`docker-compose.yml`](../docker-compose.yml) defines these services:

- `web` builds from `./web`, publishes `8080:8080`, and sets `API_UPSTREAM`. If no override is provided, it targets `http://host.docker.internal:4000`.
- `mock-api` builds from `./mock-api`, publishes `4000:4000`, and is enabled only by the `mock` profile.
- `extra_hosts` maps `host.docker.internal` to the host gateway, allowing the web container to reach a backend process running on the host, including on Linux environments that need an explicit mapping.

When using the mock profile, Compose creates a network where services can address each other by service name. Thus the web container uses `http://mock-api:4000`, not `localhost:4000`. Inside a container, `localhost` refers to that same container.

## Run the Containers

Run from the repository root. The examples use PowerShell-compatible syntax.

### Use a backend running on the host

Start the backend on host port 4000, then run:

```powershell
docker compose up --build
```

Open <http://localhost:8080>. The web container forwards API calls to `http://host.docker.internal:4000` by default.

To point at a backend on a different host port:

```powershell
$env:API_UPSTREAM = "http://host.docker.internal:4100"
docker compose up --build
Remove-Item Env:API_UPSTREAM
```

### Use the bundled mock API

```powershell
$env:API_UPSTREAM = "http://mock-api:4000"
docker compose --profile mock up --build
```

Open <http://localhost:8080> for the frontend. The mock API is also published on <http://localhost:4000> for direct testing. Stop the containers with `Ctrl+C`; if they were detached, use `docker compose down`.

The short form from the repository README is:

```bash
API_UPSTREAM=http://mock-api:4000 docker compose --profile mock up --build
```

On macOS/Linux that environment assignment applies to one command. In PowerShell, set `$env:API_UPSTREAM` as shown above.

Useful commands:

```powershell
docker compose ps
docker compose logs -f web
docker compose logs -f mock-api
docker compose down
```

## Basic Docker Questions and Answers

### 1. What is Docker?

Docker packages an application and its runtime requirements into an image. A container is a running instance of an image. Here, Docker lets the frontend run in Nginx and the mock API run in Node without installing those production runtimes directly on the host.

### 2. What is the difference between an image and a container?

An image is the built, reusable package; a container is a running instance created from that image. `docker compose build` creates images, while `docker compose up` creates and starts containers from them.

### 3. What is a Dockerfile?

A Dockerfile describes how to build an image through instructions such as `FROM`, `COPY`, `RUN`, and `CMD`. This project has separate Dockerfiles because the frontend runtime and mock API have different responsibilities.

### 4. What does Docker Compose do?

Compose describes related services, their build contexts, ports, environment, profiles, and shared network. It starts the web and optional mock API together using one configuration file.

### 5. What is port mapping such as `8080:8080`?

The left side is the host port and the right side is the container port. `8080:8080` makes Nginx's port 8080 reachable at `http://localhost:8080` on the host.

### 6. Why does the frontend use Nginx in production?

Vite compiles the React application into static HTML, JavaScript, and CSS files. Nginx efficiently serves those files and also proxies API calls, so the browser can use one origin for the UI and API.

### 7. What does `docker compose --profile mock` do?

It enables services assigned to the `mock` profile. In this project, the mock API is opt-in, so normal Compose startup does not start it.

## Advanced Docker Questions and Answers

### 1. Why use a multi-stage build for the frontend?

The Node stage needs source code and build tooling to create the Vite bundle; the Nginx stage only needs the resulting static files. Copying `dist` between stages keeps build-time tools and dependencies out of the final runtime image, generally reducing its contents and attack surface.

### 2. Why is `API_UPSTREAM` configured at runtime instead of building it into the frontend?

The frontend makes relative requests to `/api`, and the Nginx template reads `API_UPSTREAM` when the container starts. This separates the compiled frontend from its deployment environment: one image can be configured for a host backend, a mock service, or another reachable backend without rebuilding the React bundle.

### 3. Why does Compose use `mock-api:4000` instead of `localhost:4000` between containers?

Compose provides DNS on its project network, using service names as hostnames. From the web container, `localhost` means the web container itself; `mock-api` resolves to the mock API container. Host port publishing is for connections from outside the Compose network, such as a browser or host-side API client.

### 4. What is the purpose of `host.docker.internal` and `extra_hosts` here?

The default backend is expected to run on the host machine. `host.docker.internal` gives a container a hostname for reaching that host. The Compose `extra_hosts` mapping provides the host-gateway address explicitly, which is useful on Linux environments where that hostname may not otherwise be configured.

### 5. What does the Nginx SPA fallback solve?

React Router handles routes such as `/menu` in the browser. When a browser directly requests `/menu`, the request first reaches Nginx. `try_files $uri $uri/ /index.html` falls back to the SPA entry document when there is no matching static file, allowing the client router to render the correct page.

### 6. Is `/healthz` the same as a Docker health check?

No. The Nginx configuration exposes an HTTP endpoint at `/healthz`, but the current Compose file does not declare a `healthcheck` instruction. An orchestrator or monitoring system can request the endpoint; Docker will not automatically mark the container healthy from this endpoint unless a health check is configured.

### 7. Does the mock API preserve data between restarts?

No. Its data lives in memory and there is no database or volume configured for it. A restart resets the mock state. This is suitable for demos and UI work, but not durable production data.

### 8. How can I troubleshoot a web container that loads but shows API errors?

First check `docker compose ps` and `docker compose logs -f web`. Then verify that the selected upstream is reachable from the web container: use the host gateway address for a host process, or the Compose service name for the mock. Also check that the upstream process is listening on the expected port and that the `API_UPSTREAM` value has the correct scheme, hostname, and port.

### 9. What is the difference between `EXPOSE` and publishing a port?

`EXPOSE` in a Dockerfile documents the port the image's process expects to use; it does not make that port reachable from the host by itself. Compose's `ports` mapping publishes a container port to the host. Here, `web` has `EXPOSE 8080` and Compose publishes it as `8080:8080`.

## Related Files

- [`docker-compose.yml`](../docker-compose.yml): service definitions, profiles, port mappings, and runtime upstream configuration.
- [`web/Dockerfile`](../web/Dockerfile): multi-stage frontend build and Nginx runtime image.
- [`web/nginx.conf.template`](../web/nginx.conf.template): static file serving, SPA fallback, API proxy, and health endpoint.
- [`mock-api/Dockerfile`](../mock-api/Dockerfile): Node-based mock API runtime image.
- [`README.md`](../README.md): broader project setup, local development, Docker, and deployment instructions.
