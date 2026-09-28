# Restaurant Admin Dashboard UI

Café Admin — a React restaurant management dashboard built to the Figma "Restaurant Admin Dashboard UI"
design, talking to the [Spring Boot backend](https://github.com/kanwar007/Restaurant-Admin-Dashboard-BackEnd)
and packaged for Azure Kubernetes Service. A dependency-free mock API implementing the same contract is
kept for offline UI work.

Staff screens (sign-in required): Dashboard Overview, Menu Management, Order Rail, Table Management,
Addon Management, Billing & Printing (KOT / Customer / CA / Restaurant copy), Order History.

Public screens: `/login` for staff and `/guest`, where a customer browses the menu and places an order
from their table without signing in.

```
web/                     React 19 + TypeScript + Vite SPA (nginx image)
mock-api/                Node http mock API implementing the same contract, no runtime dependencies
deploy/k8s/base/         Kubernetes manifests for the SPA (proxies /api to the backend gateway)
deploy/k8s/overlays/mock Same SPA, but pointed at the mock API deployed alongside it
```

The SPA itself is backend-agnostic: it always calls relative `/api/...`, and Vite (dev) or nginx (image)
proxies that to whatever `API_URL` / `API_UPSTREAM` points at.

## Run locally

Prerequisite: Node.js >= 20 (`node -v`). npm ships with Node.

1. Clone and enter the repo

   ```bash
   git clone https://github.com/kanwar007/Restaurant-Admin-Dashboard-UI.git
   cd Restaurant-Admin-Dashboard-UI
   ```

2. Install frontend dependencies, then start the UI

   ```bash
   npm run install:all

   # against the real backend (run `docker compose up -d --build` in the backend repo first)
   API_URL=http://127.0.0.1:4000 npm run dev

   # or fully offline, against the bundled mock
   npm run dev      # mock API on :4000 + Vite on :5173
   ```

   Setting `API_URL` skips starting the mock and just points the Vite proxy at the running gateway.
   Then open http://localhost:5173 and skip to step 5. To run the mock separately instead, use steps 3-4.

3. Start the mock API (terminal 1) — no dependencies to install

   ```bash
   cd mock-api
   npm start        # Mock API listening on http://0.0.0.0:4000
   ```

4. Start the frontend (terminal 2)

   ```bash
   cd web
   npm install
   npm run dev      # http://localhost:5173
   ```

5. Sign in at http://localhost:5173/login with a demo account (mock credentials, no real auth):

   | Username | Password | Role |
   | --- | --- | --- |
   | `admin` | `admin123` | Manager |
   | `cashier` | `cashier123` | Cashier |

   Customers can skip the login entirely and order from http://localhost:5173/guest.

6. Open http://localhost:5173. Vite proxies `/api` to the upstream on `:4000`, so the dashboard loads live
   data. Verify the API directly with `curl http://127.0.0.1:4000/api/health`.

7. Reset the data at any time (mutations are in-memory)

   ```bash
   curl -X POST http://localhost:4000/api/reset
   ```

To run the whole stack in containers instead, see [Docker](#docker).

Useful scripts:

```bash
cd web      && npm run lint && npm run build   # lint + production build into web/dist
cd web      && npm run preview                 # serve the production build
cd mock-api && npm run dev                     # mock API with file watching
cd mock-api && npm test                        # mock API test suite
```

Troubleshooting:

- `[vite] http proxy error: /api/... ECONNREFUSED`: the mock API is not running on port 4000. Start it
  (`cd mock-api && npm start`) or use `npm run dev` from the repo root, which starts both.
- Port already in use: `PORT=4100 npm start` in `mock-api`, then `API_URL=http://127.0.0.1:4100 npm run dev` in `web`.

`MOCK_LATENCY_MS` (default `120`) adds artificial latency to every mock endpoint except `/api/health`.
`VITE_API_BASE_URL` overrides the API base path (default `/api`).

## API contract

The backend's `docs/openapi.yaml` and `mock-api/openapi.yaml` describe the same 25 operations and the
same schemas, so switching between them needs no frontend change.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness/readiness probe |
| POST | `/api/auth/login` | Exchange username/password for a bearer token |
| GET | `/api/auth/me` | Resolve the signed-in user from the bearer token |
| POST | `/api/auth/logout` | Drop the session |
| POST | `/api/guest/orders` | Place a guest order — no token required |
| GET | `/api/profile` | Restaurant + signed-in user |
| GET | `/api/dashboard` | Stat cards and latest orders |
| GET | `/api/menu?category=&search=` | Menu items |
| POST/PATCH/DELETE | `/api/menu[/:id]` | Create, edit, toggle availability, delete |
| GET | `/api/menu/categories` | Category chips |
| GET/POST/PATCH/DELETE | `/api/addons[/:id]` | Add-ons and their linked dishes |
| GET | `/api/orders` | Order rail |
| PATCH | `/api/orders/:id/status` | `new` → `kot-printed` → `served` |
| DELETE | `/api/orders/:id` | Cancel an order |
| GET/POST/PATCH | `/api/tables[/:id]` | Table status, capacity, QR-ready records |
| GET | `/api/order-history?search=&status=` | History rows plus summary totals |
| GET | `/api/bills/:orderNo?format=kot\|customer\|ca\|restaurant` | Rendered bill with GST split |
| POST | `/api/reset` | Restore the seeded dataset |

Mock state is in-memory, so mutations survive until the pod restarts or `/api/reset` is called. Mock auth
seeds credentials in plain text and keeps random-UUID tokens in memory — use the real backend for anything
beyond UI work.

## Docker

```bash
# real backend: start it first (docker compose up -d --build in the backend repo)
docker compose up --build                                                    # web on :8080

# offline: mock API in the same compose project
API_UPSTREAM=http://mock-api:4000 docker compose --profile mock up --build   # web :8080, mock :4000
```

`API_UPSTREAM` defaults to `http://host.docker.internal:4000`, i.e. the backend gateway published on the
host.

## Deploy to AKS

Deploy the [backend](https://github.com/kanwar007/Restaurant-Admin-Dashboard-BackEnd) into the same
`cafe-admin` namespace first (`kubectl apply -k deploy/k8s/overlays/aks` in that repo); the web pod proxies
`/api` to its `api-gateway` Service, so only the web Service is exposed.

```bash
ACR=myacr
RG=my-resource-group
AKS=my-aks-cluster

az acr build -r $ACR -t cafe-admin-web:v1 ./web

az aks update -g $RG -n $AKS --attach-acr $ACR
az aks get-credentials -g $RG -n $AKS

cd deploy/k8s/base
kustomize edit set image ACRNAME.azurecr.io/cafe-admin-web=$ACR.azurecr.io/cafe-admin-web:v1
kubectl apply -k .

kubectl -n cafe-admin get ingress cafe-admin
```

For a backend-free demo, build `./mock-api` too and apply `deploy/k8s/overlays/mock`, which deploys the
mock and repoints `API_UPSTREAM` at it.

The Ingress uses the AKS managed ingress controller (`webapprouting.kubernetes.azure.com`); enable it with
`az aks approuting enable -g $RG -n $AKS`, or swap `ingressClassName` for your own controller.

## GitHub Actions

`.github/workflows/ci.yml` runs on every pull request and push to `main`: web lint + production build,
mock-API tests, both Docker image builds, and a `kubectl kustomize` render of both manifest variants.

`.github/workflows/deploy-aks.yml` is manual (`workflow_dispatch`, inputs `image_tag` and `overlay`). It
builds the web image (plus the mock image when the mock overlay is selected) with `az acr build`, points the
manifests at that tag, applies them, and waits for the rollouts. It needs an `aks` environment with:

| Kind | Name |
| --- | --- |
| Secret | `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` (OIDC federated credential) |
| Variable | `ACR_NAME`, `AKS_RESOURCE_GROUP`, `AKS_CLUSTER_NAME` |
