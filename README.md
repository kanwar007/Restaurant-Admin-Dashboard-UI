# Restaurant Admin Dashboard UI

Café Admin — a React restaurant management dashboard built to the Figma "Restaurant Admin Dashboard UI"
design, backed by a dependency-free mock API and packaged for Azure Kubernetes Service.

Staff screens (sign-in required): Dashboard Overview, Menu Management, Order Rail, Table Management,
Addon Management, Billing & Printing (KOT / Customer / CA / Restaurant copy), Order History.

Public screens: `/login` for staff and `/guest`, where a customer browses the menu and places an order
from their table without signing in.

```
web/        React 19 + TypeScript + Vite SPA (nginx image)
mock-api/   Node http mock API, no runtime dependencies
deploy/k8s/ Kubernetes manifests (Deployments, Services, Ingress, HPAs)
```

## Run locally

Prerequisite: Node.js >= 20 (`node -v`). npm ships with Node.

1. Clone and enter the repo

   ```bash
   git clone https://github.com/kanwar007/Restaurant-Admin-Dashboard-UI.git
   cd Restaurant-Admin-Dashboard-UI
   ```

2. Install frontend dependencies and start both processes with one command

   ```bash
   npm run install:all
   npm run dev      # mock API on :4000 + Vite on :5173
   ```

   Then open http://localhost:5173 and skip to step 5. To run them separately instead, use steps 3-4.

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

6. Open http://localhost:5173. Vite proxies `/api` to `http://127.0.0.1:4000`, so the dashboard loads
   live mock data. Verify the API directly with `curl http://127.0.0.1:4000/api/health`.

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
- Port already in use: `PORT=4100 npm start` in `mock-api`, then `MOCK_API_URL=http://127.0.0.1:4100 npm run dev` in `web`.

`MOCK_LATENCY_MS` (default `120`) adds artificial latency to every mock endpoint except `/api/health`.
`VITE_API_BASE_URL` overrides the API base path (default `/api`).

## Mock API

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

State is in-memory, so mutations survive until the pod restarts or `/api/reset` is called. Auth is a mock:
credentials are seeded in plain text and tokens are random UUIDs kept in memory — do not use it as-is in
production.

## Docker

```bash
docker compose up --build    # web on :8080, mock API on :4000
```

## Deploy to AKS

```bash
ACR=myacr
RG=my-resource-group
AKS=my-aks-cluster

az acr build -r $ACR -t cafe-admin-web:v1 ./web
az acr build -r $ACR -t cafe-admin-mock-api:v1 ./mock-api

az aks update -g $RG -n $AKS --attach-acr $ACR
az aks get-credentials -g $RG -n $AKS

cd deploy/k8s
kustomize edit set image \
  ACRNAME.azurecr.io/cafe-admin-web=$ACR.azurecr.io/cafe-admin-web:v1 \
  ACRNAME.azurecr.io/cafe-admin-mock-api=$ACR.azurecr.io/cafe-admin-mock-api:v1
kubectl apply -k .

kubectl -n cafe-admin get ingress cafe-admin
```

The Ingress uses the AKS managed ingress controller (`webapprouting.kubernetes.azure.com`); enable it with
`az aks approuting enable -g $RG -n $AKS`, or swap `ingressClassName` for your own controller. The web pod
proxies `/api` to the `cafe-admin-mock-api` Service, so only the web Service needs to be exposed.

## GitHub Actions

`.github/workflows/ci.yml` runs on every pull request and push to `main`: web lint + production build,
mock-API tests, both Docker image builds, and a `kubectl kustomize` render of the AKS manifests.

`.github/workflows/deploy-aks.yml` is manual (`workflow_dispatch`, input `image_tag`). It builds both images
with `az acr build`, points the manifests at that tag, applies them, and waits for both rollouts. It needs an
`aks` environment with:

| Kind | Name |
| --- | --- |
| Secret | `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` (OIDC federated credential) |
| Variable | `ACR_NAME`, `AKS_RESOURCE_GROUP`, `AKS_CLUSTER_NAME` |
