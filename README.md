# Restaurant Admin Dashboard UI

Café Admin — a React restaurant management dashboard built to the Figma "Restaurant Admin Dashboard UI"
design, backed by a dependency-free mock API and packaged for Azure Kubernetes Service.

Screens: Dashboard Overview, Menu Management, Order Rail, Table Management, Addon Management,
Billing & Printing (KOT / Customer / CA / Restaurant copy), Order History.

```
web/        React 19 + TypeScript + Vite SPA (nginx image)
mock-api/   Node http mock API, no runtime dependencies
deploy/k8s/ Kubernetes manifests (Deployments, Services, Ingress, HPAs)
```

## Local development

```bash
cd mock-api && npm start          # http://localhost:4000
cd web && npm install && npm run dev   # http://localhost:5173, /api proxied to the mock API
```

Useful scripts:

```bash
cd web      && npm run lint && npm run build
cd mock-api && npm test
```

`MOCK_LATENCY_MS` (default `120`) adds artificial latency to every mock endpoint except `/api/health`.
`VITE_API_BASE_URL` overrides the API base path (default `/api`).

## Mock API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness/readiness probe |
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

State is in-memory, so mutations survive until the pod restarts or `/api/reset` is called.

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
