# Restaurant Admin Dashboard: Interview Preparation Guide

This guide is based on the current Restaurant Admin Dashboard application. It includes the technology stack, architecture, request flows, database plan, deployment model, testing strategy, and realistic follow-up questions.

## 1. Project summary

### Q1. What does this application do?

**Answer:**

It is a restaurant administration dashboard for managing:

- Dashboard statistics and latest orders
- Menu items and categories
- Dish add-ons
- Active orders and order status transitions
- Restaurant tables and occupancy
- Order history
- KOT, customer, CA, and restaurant bills
- Staff login and guest ordering

The current backend is a dependency-free in-memory mock API. The planned production direction is to replace it with REST microservices backed by PostgreSQL while preserving the frontend API contracts.

### Q2. What is the current technology stack?

**Answer:**

- **Frontend:** React 19, TypeScript, Vite, React Router, TanStack React Query, Lucide React
- **Backend:** Node.js 20+, native `node:http`, ECMAScript modules, no runtime dependencies
- **API documentation:** OpenAPI 3.1 in `mock-api/openapi.yaml`
- **Testing:** Node.js built-in test runner and assertions
- **Code quality:** TypeScript build and Oxlint
- **Containers:** Docker and Docker Compose
- **Orchestration:** Kubernetes manifests managed with Kustomize
- **Cloud target:** Azure Kubernetes Service and Azure Container Registry
- **Future persistence:** PostgreSQL with service-owned schemas or databases

The mock API intentionally has no framework dependency so the domain behavior is easy to inspect and replace during the microservice implementation.

### Q3. Why was Vite used for the frontend?

**Answer:**

Vite provides fast development startup, native ES module support, efficient TypeScript/React integration, and a straightforward production build. It also provides the development proxy that forwards `/api` requests to the mock API, avoiding cross-origin issues during local development.

The Vite proxy target defaults to `http://localhost:4000` and can be overridden with `MOCK_API_URL`.

### Q4. Why use React Query instead of manually fetching data in every component?

**Answer:**

TanStack React Query centralizes server-state behavior. It provides:

- Query caching
- Loading and error states
- Refetching and invalidation
- Mutation handling
- Consistent request lifecycle behavior

For example, after changing a menu item or order status, the application can invalidate the relevant query and refresh the server state instead of manually synchronizing multiple components.

React local state is still appropriate for transient UI state such as form values, modal visibility, password visibility, and submission state.

## React.js and TypeScript interview questions

### R1. Why use functional components in this application?

**Answer:**

Functional components are the standard modern React model and work naturally with hooks. They keep component logic close to the rendered UI without requiring class lifecycle methods. This project uses functional components for pages, layout, authentication, and reusable UI components.

They also make it straightforward to compose custom hooks such as `useMenu`, `useOrders`, and `useAuth` around shared behavior.

### R2. What is the difference between props and state?

**Answer:**

Props are read-only inputs passed from a parent to a child. State is data owned and changed by a component or hook. For example, a page may receive a menu item through props, while a modal owns temporary form values such as the entered name and price.

State changes trigger a re-render. Props should not be mutated by the child; the child should call a callback supplied by the parent when it needs to request a change.

### R3. How do you decide between local state, context, and React Query?

**Answer:**

- **Local state:** transient UI state such as modal visibility, input values, selected tabs, or password visibility.
- **React context:** cross-cutting client state needed by many components, such as the current authentication status and sign-in/sign-out functions.
- **React Query:** server state such as menu items, dashboard data, orders, tables, and bills.

Putting server data in local component state creates synchronization problems. Putting every input value in global context creates unnecessary coupling. Each state mechanism should match the lifetime and ownership of the data.

### R4. What does `useEffect` do, and where is it used here?

**Answer:**

`useEffect` runs a side effect after React commits a render. In this application, the authentication provider uses it to check an existing token with `GET /api/auth/me` when the provider mounts.

Effects should be used for external synchronization such as network requests, subscriptions, timers, or browser APIs. They should not be used to derive values that can be calculated during rendering. The dependency array must describe the values captured by the effect.

### R5. Why should a component not fetch data directly during rendering?

**Answer:**

Rendering should remain a predictable calculation. Fetching during render can cause repeated requests, race conditions, and side effects during React's rendering process. This application puts API calls in React Query hooks, which manage caching, loading, retries, and request lifecycles.

For a simple one-off side effect, `useEffect` can be used, but server-state libraries are preferable for reusable data fetching.

### R6. What is a custom hook, and why are the API hooks useful?

**Answer:**

A custom hook is a function that starts with `use` and composes React hooks into reusable behavior. The API hooks in `web/src/api/hooks.ts` keep query keys, endpoint paths, response types, mutations, and cache invalidation in one place.

For example, `useToggleMenuItem` performs the patch request and invalidates the `menu` query after success. Pages do not need to know how the request is built or how other menu views are refreshed.

### R7. How does React Query cache data in this project?

**Answer:**

Each query has a `queryKey`, such as `['menu', filters]`, `['orders']`, or `['bill', orderNo, format]`. React Query uses the key to identify cached data. When a mutation succeeds, the hook calls `queryClient.invalidateQueries` for the affected key.

The invalidation marks data as stale and allows React Query to refetch it. Including filters in the key is important because different category or search values represent different server results.

### R8. What is the purpose of `useMemo` and `useCallback` in `AuthProvider`?

**Answer:**

`useCallback` keeps the `signIn` and `signOut` function references stable between renders when their dependencies have not changed. `useMemo` keeps the context value object stable unless `user`, `status`, or the auth functions change.

This can reduce unnecessary re-renders for consumers of the authentication context. These hooks should not be added everywhere by default; they are useful when referential identity affects dependencies, memoized children, or context consumers.

### R9. How does React preserve component identity when rendering lists?

**Answer:**

React uses the `key` prop to identify list items between renders. A stable database ID is preferred, for example `item.id` or `order.id`. Array indexes are unsafe when items can be inserted, removed, filtered, or reordered because React may associate the wrong state with a row.

Keys should be unique among siblings and should not be randomly generated during rendering.

### R10. How would you prevent unnecessary re-renders in this dashboard?

**Answer:**

First, measure the issue rather than optimizing blindly. Then:

- Keep state close to the components that use it.
- Avoid recreating context values unnecessarily.
- Use stable list keys.
- Split large pages into focused components.
- Use React Query cache data instead of duplicate local copies.
- Memoize expensive calculations only when profiling shows a benefit.
- Virtualize very large lists such as order history if required.

`React.memo`, `useMemo`, and `useCallback` are tools for specific bottlenecks, not replacements for good state ownership.

### R11. How are protected and public routes represented?

**Answer:**

The application defines public `/login` and `/guest` routes. The remaining application routes are nested under `RequireAuth`, which checks the authentication context and redirects anonymous users to `/login`.

The route guard improves user experience, but it is not a security boundary. The backend must still validate bearer tokens and authorize every protected operation.

### R12. How would you handle a form submission in React?

**Answer:**

The form should use `onSubmit`, call `event.preventDefault()`, validate the input, set a submitting state, invoke a mutation, display errors, and restore the submitting state in a `finally` block. The login page follows this pattern and disables the submit button while the request is pending.

The server must repeat validation because browser validation and client-side TypeScript checks can be bypassed.

### R13. What is the difference between controlled and uncontrolled inputs?

**Answer:**

A controlled input gets its value from React state and reports changes through `onChange`. An uncontrolled input stores its value in the DOM and is read through a ref or form data. The login form uses controlled inputs because it needs current username and password values for submission and validation.

Controlled inputs are convenient for dynamic validation and conditional UI, while uncontrolled inputs can reduce re-renders for very large forms. The choice should match the form's complexity.

### R14. Why is TypeScript useful in this project?

**Answer:**

TypeScript makes API contracts explicit. Types such as `MenuItem`, `Order`, `Dashboard`, `Bill`, and `RestaurantTable` document the data expected by components and API hooks. Generic methods such as `api.get<Dashboard>()` connect an endpoint call to the expected response type.

This catches misspelled properties, invalid status values, missing fields, and incompatible component props during the build instead of after deployment.

TypeScript does not validate data received over the network at runtime, so the backend must still validate input and response contracts should be tested.

### R15. What is the difference between `type` and `interface` in TypeScript?

**Answer:**

Both can describe object shapes. Interfaces are commonly used for extendable object contracts, while type aliases are especially convenient for unions, intersections, tuples, and mapped types.

This project uses interfaces for API entities such as `Order` and `MenuItem`, and type aliases for finite values such as `OrderStatus`, `TableStatus`, `BillFormat`, and `PaymentMode`. The important rule is consistency and choosing the construct that best expresses the contract.

### R16. Why use union types for order and table statuses?

**Answer:**

`type OrderStatus = 'new' | 'kot-printed' | 'served'` restricts values to valid states at compile time. Editors can provide autocomplete, and a function accepting `OrderStatus` cannot be called with an arbitrary string without an explicit unsafe cast.

The union is still only a compile-time guarantee. The API validates the same values at runtime because JavaScript clients, network requests, and malicious input can bypass TypeScript.

### R17. What are generics doing in the API client?

**Answer:**

The request function is generic: `request<T>(...)` returns `Promise<T>`. A call such as `api.get<MenuItem[]>('/menu')` tells TypeScript that the resolved value is an array of `MenuItem` objects. This allows the hooks and components to receive typed data without duplicating request logic.

Generics describe the expected shape to the compiler; they do not parse or validate JSON at runtime. Runtime schemas such as Zod could be added at the API boundary if the application needs client-side response validation.

### R18. Why is `unknown` safer than `any` for API input?

**Answer:**

`unknown` means the value exists but must be narrowed before use. `any` disables type checking and allows unsafe property access to spread through the codebase. The API client's `post` method accepts `body?: unknown`, which is appropriate because request payloads vary and the specific hook supplies the correct structure.

The best approach is to type each mutation payload and validate external data before treating it as a domain type.

### R19. How do optional properties differ from nullable properties?

**Answer:**

An optional property such as `notes?: string` may be absent. A nullable property such as `notes: string | null` must exist but may explicitly contain `null`. This distinction matters for JSON API contracts and database mapping.

The bill model uses `notes: string | null` because the API returns a `notes` field with `null` when no note exists, while order notes are optional because they may be omitted from the response.

### R20. What are type guards and discriminated unions?

**Answer:**

A type guard narrows a broad value to a safer type, such as checking `cause instanceof Error` before reading `cause.message` in the login page. A discriminated union uses a shared literal field, such as `status` or `format`, to let TypeScript narrow the available fields.

For a more complex billing model, formats could be represented as a discriminated union so a `ca` bill requires GST fields while a KOT bill requires `showPricing: false`.

### R21. How would you share types between the frontend and backend?

**Answer:**

The current frontend types are maintained in `web/src/api/types.ts`, while the backend is JavaScript and the OpenAPI document is the contract. A stronger production approach is to make OpenAPI the source of truth and generate TypeScript client types, or publish a versioned shared contract package.

The generated types should be reviewed and versioned. Sharing internal database models directly with the frontend is not recommended because persistence details and public API contracts have different responsibilities.

### R22. What does `strict` TypeScript checking protect against?

**Answer:**

Strict checking catches implicit `any` values, unsafe null access, incorrect function parameters, missing properties, and incompatible assignments. It encourages explicit handling of loading, error, and absent-data states.

It does not eliminate all bugs. Business rules, runtime input validation, authorization, database constraints, and integration tests are still required.

### R23. How would you type a reusable component?

**Answer:**

Define a small props interface and keep the public contract focused. For example:

```ts
interface StatusBadgeProps {
   status: OrderStatus;
   label?: string;
}

const StatusBadge = ({ status, label }: StatusBadgeProps) => {
   // Render based on the known status union.
};
```

Use `React.ComponentProps` or generic props only when the component genuinely forwards or transforms another component's contract. Avoid making every component maximally generic because that can make usage harder to understand.

### R24. How would you handle an API response that does not match its TypeScript type?

**Answer:**

At minimum, the API client should surface the request failure and the UI should render an error state. For high-risk or external APIs, validate the parsed JSON with a runtime schema before returning it as a domain type. Log the endpoint, request ID, and validation failure without logging passwords or tokens.

The long-term fix is contract testing between the OpenAPI document, backend responses, and generated frontend types.

## 2. Architecture questions

### Q5. Describe the current high-level architecture.

**Answer:**

The current system has two runtime applications:

```text
Browser
   |
   v
React + Vite frontend (:5173)
   |
   | /api proxy during development
   v
Node mock API (:4000)
   |
   v
In-memory JavaScript store
```

For containers, the shape is:

```text
Browser
   |
   v
Nginx web container (:8080)
   |
   | /api reverse proxy
   v
Mock API container (:4000)
```

The frontend owns presentation and client-side navigation. The API owns validation, mutations, status transitions, and bill construction. The current store is in memory, so data is lost when the API restarts.

### Q6. How would you evolve this into microservices?

**Answer:**

I would begin with a modular monolith or one PostgreSQL instance with service-owned schemas, then extract services only when there is an operational reason. The proposed boundaries are:

- **Identity service:** restaurants, staff users, roles, sessions
- **Catalog service:** categories, menu items, add-ons, menu relationships
- **Floor service:** tables and occupancy
- **Ordering service:** orders, order items, status history
- **Billing service:** invoices, invoice lines, payments, tax snapshots
- **Reporting service:** dashboard and order-history read models
- **Platform concerns:** outbox events, idempotency, audit records

Each service owns its writes. Services communicate through REST for synchronous validation and events for asynchronous propagation. I would avoid starting with many independently deployed services before the domain boundaries and operational requirements are proven.

### Q7. Why is a modular monolith a reasonable first production step?

**Answer:**

The application is small and the domains are still evolving. A modular monolith gives:

- One deployment and simpler local development
- Transactions across related operations
- Easier debugging and testing
- Clear module ownership before network boundaries are introduced

The code can still use service interfaces and domain modules. Later, a module can be extracted behind an HTTP or messaging contract without changing the frontend.

### Q8. What is the difference between service ownership and database ownership?

**Answer:**

Service ownership means one service controls the business rules and writes for a data set. Database ownership means the service controls the physical tables or database. In the first PostgreSQL phase, schemas can separate ownership inside one database. When services are extracted, each service should ideally have its own database and other services should refer to IDs and APIs/events rather than cross-database foreign keys.

This avoids hidden coupling where one service directly updates another service's tables.

## 3. Request and application flows

### Q9. Explain the staff login flow.

**Answer:**

1. The user submits username and password on the login page.
2. `AuthProvider.signIn` calls `POST /api/auth/login`.
3. Vite proxies the request to the mock API in development.
4. The API validates the body and compares it with a seeded user.
5. The API creates a random session token and returns `{ token, user }`.
6. The frontend stores the token in its token store and updates auth context.
7. Protected routes render the dashboard.
8. On a later load, the frontend calls `GET /api/auth/me` with `Authorization: Bearer <token>`.
9. Logout calls `POST /api/auth/logout`, clears the token, and clears React Query data.

In production, passwords must be stored as Argon2id or bcrypt hashes, tokens must be hashed at rest, sessions must expire, and HTTPS must be mandatory.

### Q10. Explain the guest order flow.

**Answer:**

1. A guest opens the public guest page without staff authentication.
2. The frontend loads available menu data from the catalog endpoint.
3. The guest selects a table and menu items.
4. The frontend sends `POST /api/guest/orders`.
5. The API validates the table, item list, quantities, and current menu availability.
6. The API creates an order with status `new` and source `guest`.
7. If the table exists, it becomes `occupied` and stores the current order number.
8. In the PostgreSQL design, this should be a transaction or coordinated workflow between ordering and floor services.

The request should receive an idempotency key in production so a retry does not create duplicate orders.

### Q11. Explain the order status flow.

**Answer:**

The current order rail supports:

```text
new -> kot-printed -> served
```

The API validates allowed status values, finds the order, updates it, and returns the updated record. In a durable implementation, every transition should also insert an `order_status_history` record containing the previous status, new status, actor, reason, and timestamp.

A production implementation should enforce valid transitions rather than accepting every pair of statuses. For example, a served order should not move back to new unless a specific correction workflow allows it.

### Q12. Explain how the frontend handles API errors.

**Answer:**

The API client converts non-success responses into errors. Query and mutation hooks expose error and loading states to pages and components. The login page displays a useful sign-in error, while protected application screens can show an error state or redirect when the session is invalid.

A production API should return a consistent error structure, for example:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password",
    "requestId": "..."
  }
}
```

The frontend should display safe user-facing messages while logging the request ID for support.

### Q13. What caused the earlier `ECONNREFUSED` problem and how would you troubleshoot it?

**Answer:**

`ECONNREFUSED` means Vite could not connect to its configured API target. The troubleshooting sequence is:

1. Check that the mock API process is running.
2. Check that it is listening on port `4000`.
3. Call `GET http://localhost:4000/api/health` directly.
4. Confirm Vite's `MOCK_API_URL` matches the API port.
5. Check Docker service names and port mappings if containers are used.
6. Inspect whether the Node entrypoint condition prevents the server from calling `listen()` on Windows.

This is different from a 404. A refused connection means no reachable process; a 404 means a process responded but did not match the route.

## 4. Data and PostgreSQL questions

### Q14. Why should the PostgreSQL model be normalized?

**Answer:**

The current mock data embeds relationships in arrays and strings. For example, add-ons contain dish names in `linkedDishes`, and orders contain item names and add-on names. A normalized design uses foreign keys and join tables:

- `menu_items.category_id` links an item to a category.
- `menu_item_addons` links menu items to add-ons.
- `order_items` links an order to purchased items.
- `order_item_addons` links selected add-ons to an order line.

This prevents inconsistent names, supports efficient filtering, and makes updates safe.

### Q15. Why store snapshots of item names and prices on order lines?

**Answer:**

A menu price can change after an order is placed. Historical orders and invoices must continue to show what the customer actually purchased. Therefore `order_items` and `order_item_addons` store:

- Name snapshot
- Unit price snapshot
- Quantity
- Calculated line amount

The catalog relationship remains useful for analytics, but billing must rely on immutable purchase-time values.

### Q16. Why use `numeric(12,2)` instead of `float` for money?

**Answer:**

Binary floating-point values cannot represent many decimal fractions exactly. That can produce incorrect totals and tax calculations. PostgreSQL `numeric(12,2)` provides exact decimal arithmetic appropriate for currency. The application should also define a consistent rounding policy for GST and line totals.

### Q17. How should order creation update table occupancy safely?

**Answer:**

In a single database, order creation and table occupancy should occur in one transaction:

1. Lock or compare-and-update the table row.
2. Confirm the table is available for the requested operation.
3. Insert the order and order lines.
4. Update table status and current order ID.
5. Insert an outbox event.
6. Commit.

If ordering and floor are separate services, use a workflow or reservation operation. Do not let two services independently overwrite table state without concurrency control.

### Q18. How would you generate order numbers?

**Answer:**

Use a database sequence or a restaurant-scoped allocation table for numeric order numbers. Store the numeric value, such as `1`, and format it for the API as `#001`. The order's UUID remains the stable internal identifier. The unique constraint should be `(restaurant_id, order_number)`.

This avoids parsing and incrementing display strings such as `#009` in application memory.

### Q19. Should dashboard statistics be stored in primary tables?

**Answer:**

Usually not. Dashboard values such as total orders, revenue, pending KOT count, and occupancy are derived data. They can be calculated from transactional tables or maintained in a reporting read model. A reporting model is useful when queries become expensive, but it should be rebuilt from events or source records rather than treated as the only source of truth.

### Q20. How would you represent order history?

**Answer:**

The current mock API has a separate `orderHistory` array. In PostgreSQL, completed and cancelled orders should remain in the durable `orders` table, with invoice and payment records as applicable. The order-history endpoint can query a view or reporting read model filtered by status and date.

This preserves auditability and avoids duplicating mutable order data.

## 5. API and security questions

### Q21. What makes a REST API resource-oriented?

**Answer:**

The API exposes resources and uses HTTP methods consistently:

- `GET /api/menu` reads menu items.
- `POST /api/menu` creates an item.
- `PATCH /api/menu/:id` partially updates an item.
- `DELETE /api/menu/:id` removes or deactivates an item.
- `GET /api/orders` lists orders.
- `PATCH /api/orders/:id/status` changes an order state.

The API should use meaningful status codes, stable response schemas, validation, pagination for large lists, and consistent errors.

### Q22. What security weaknesses exist in the current mock authentication?

**Answer:**

The mock implementation is intentionally not production authentication:

- Demo passwords are seeded in plain text.
- Session tokens are random UUIDs kept only in memory.
- Sessions disappear when the process restarts.
- The token itself is used as the session lookup key.
- There is no password hashing, token rotation, expiry enforcement, or refresh flow.
- The mock API allows permissive CORS.

For production, use a managed identity provider or hashed passwords, short-lived access tokens or secure sessions, HTTPS, restricted CORS, rate limiting, audit logging, and secret management.

### Q23. How would you secure staff and guest endpoints differently?

**Answer:**

Staff endpoints should require authentication and authorization. Managers may manage menu items, tables, and users, while cashiers may have a narrower permission set. Guest ordering should be public but protected by:

- Input validation
- Rate limiting
- Table/order business rules
- Idempotency keys
- Abuse monitoring
- Maximum item and quantity limits

Public access does not mean unrestricted access to internal administrative operations.

### Q24. How would you version the API?

**Answer:**

Use an explicit version such as `/api/v1` when the contract is expected to evolve. Maintain backward compatibility for additive changes, deprecate fields before removal, and publish the OpenAPI document for each supported version. The frontend should use typed API models and contract tests to detect incompatible changes.

### Q25. Why create an OpenAPI specification?

**Answer:**

The OpenAPI file provides a machine-readable contract for endpoints, parameters, request bodies, responses, authentication, and schemas. It can be used to:

- Review API design before implementation
- Generate client types or SDKs
- Generate interactive documentation
- Validate requests and responses
- Support contract testing between frontend and backend

The repository's `mock-api/openapi.yaml` documents the current mock API.

## 6. Reliability and distributed systems questions

### Q26. What is the transactional outbox pattern and why would this project need it?

**Answer:**

When a service changes its database and must publish an event, it writes both the business change and an outbox record in the same database transaction. A publisher later sends the outbox event to a broker and marks it published.

For this project, an order creation transaction could write:

- The order
- Order items
- Table assignment change
- `order.created` outbox event

This prevents the failure case where the database commit succeeds but event publication fails, or an event is published for a transaction that later rolls back.

### Q27. How would you make guest order creation idempotent?

**Answer:**

Require an `Idempotency-Key` header. Store the key, request hash, response status, and response body in an idempotency table. If the same key is retried with the same request, return the original response. If the same key is reused with a different request body, return a conflict.

This matters because browsers, mobile clients, gateways, or proxies can retry a POST after a timeout even when the server already created the order.

### Q28. How would you handle concurrency when two staff members update the same order?

**Answer:**

Use optimistic concurrency with a `version` column or `updated_at` condition:

```sql
UPDATE ordering.orders
SET status = $new_status,
    version = version + 1,
    updated_at = now()
WHERE id = $id AND version = $expected_version;
```

If no row is updated, return a conflict and ask the client to refresh. For critical table assignment operations, row locks or serializable transactions may be more appropriate.

### Q29. How should microservices communicate?

**Answer:**

Use synchronous REST when the caller needs an immediate answer, such as catalog validation or requesting current table availability. Use asynchronous events for side effects such as updating reporting projections, sending notifications, or recording audit information.

Events should be versioned, contain an event ID, include the aggregate ID and tenant ID, and be processed idempotently.

### Q30. What observability would you add?

**Answer:**

At minimum:

- Structured JSON logs
- Request ID and correlation ID propagation
- HTTP method, route, status, and latency metrics
- Database query duration metrics
- Error rate and dependency failure metrics
- Health and readiness endpoints
- Distributed tracing across API, database, and message broker

For Kubernetes, readiness should indicate whether the service can receive traffic, while liveness should detect an unhealthy process that needs restarting.

## 7. Deployment and DevOps questions

### Q31. Explain the Docker Compose setup.

**Answer:**

Docker Compose defines two services:

- `mock-api`, built from `./mock-api`, exposed on port `4000`.
- `web`, built from `./web`, exposed on port `8080`.

The web container receives `MOCK_API_UPSTREAM=http://mock-api:4000`, using the Compose service name for container-to-container networking. `depends_on` controls startup ordering, but it does not by itself guarantee that the API is ready, so health checks should be added for production-like local environments.

### Q32. How does the Kubernetes deployment work?

**Answer:**

The deployment uses Kustomize to combine a namespace, mock API deployment/service, web deployment/service, and HPA. Images are configured for Azure Container Registry through the `images` section. The web service is the externally exposed application, while the API remains internal and is reached through the web reverse proxy.

In a production cluster I would add:

- Readiness and liveness probes
- Resource requests and limits
- Secrets and ConfigMaps
- Network policies
- Pod disruption budgets
- Rolling update strategy
- Managed PostgreSQL connection configuration
- External ingress/TLS configuration

### Q33. What is the difference between a liveness probe and a readiness probe?

**Answer:**

A liveness probe answers whether the process should be restarted. A readiness probe answers whether the pod should receive traffic. A service can be alive but not ready while waiting for a database connection or completing startup.

The API's `/api/health` endpoint is a starting point, but readiness should also verify required dependencies when appropriate.

### Q34. How would you deploy PostgreSQL for this system on Azure?

**Answer:**

For production, use Azure Database for PostgreSQL Flexible Server rather than running PostgreSQL inside the application Kubernetes cluster unless there is a strong operational reason. Use private networking, backups, high availability where required, TLS, managed identities or secure secret retrieval, connection pooling, and migration automation.

The application should run database migrations as a controlled deployment step, not every time a web pod starts.

## 8. Testing questions

### Q35. What is currently tested?

**Answer:**

The mock API uses Node's built-in test runner. Tests cover:

- Health endpoint
- Menu filtering
- Menu availability updates
- Order status transitions and invalid status rejection
- Bill creation and GST split
- KOT pricing behavior
- Order-history summaries
- Table/order clearing behavior
- Authentication and session resolution
- Guest order validation and table seating
- Unknown endpoint handling

The frontend has TypeScript compilation and linting available, and the OpenAPI document can be validated with an OpenAPI linter.

### Q36. What tests should be added before replacing the mock API?

**Answer:**

1. **Unit tests:** pricing, GST rounding, status transition rules, authorization policies.
2. **Repository tests:** PostgreSQL queries and constraints using a disposable database.
3. **API integration tests:** request validation, authentication, pagination, error contracts.
4. **Contract tests:** frontend expectations against the OpenAPI schemas.
5. **Workflow tests:** guest order plus table occupancy, order lifecycle, invoice/payment flow.
6. **End-to-end tests:** login, menu editing, order movement, billing, and guest ordering.
7. **Load tests:** concurrent guest orders, dashboard reads, and order rail polling.
8. **Migration tests:** upgrade from an empty database and from a prior schema version.

### Q37. What is the difference between unit, integration, contract, and end-to-end tests here?

**Answer:**

- **Unit:** Tests one function in isolation, such as GST calculation.
- **Integration:** Tests multiple components together, such as an API handler with PostgreSQL.
- **Contract:** Verifies that the API response matches the OpenAPI contract expected by the frontend.
- **End-to-end:** Exercises the full browser-to-API workflow, such as staff login and changing an order status.

A balanced test suite keeps most tests fast and lower-level while reserving end-to-end tests for the highest-value workflows.

## 9. Scenario and design questions

### Q38. A customer clicks “Place order” twice. What happens?

**Answer:**

The current mock API would create two orders because it has no idempotency protection. In production, the frontend sends an idempotency key, and the ordering service stores the first result. A duplicate request returns the original order instead of inserting another one.

The UI should also disable the submit button while the request is pending, but that is not sufficient by itself because network retries can occur outside the browser.

### Q39. The menu price changes while a customer is ordering. Which price should be charged?

**Answer:**

The service should validate the current price when the order is created, then snapshot that price into the order item. The bill uses the snapshot. The client-provided price must never be trusted for billing; it is only a display hint.

### Q40. Two guests try to order from the same vacant table at the same time. How do you prevent inconsistent state?

**Answer:**

Use a transaction with a row lock or optimistic concurrency on the table. The service must define whether multiple active orders can share a table. If only one active order is allowed, the second request should receive a conflict response. If shared ordering is allowed, the table assignment model should represent a session or dining session rather than one `current_order_id` field.

### Q41. The billing service is temporarily unavailable after an order is served. Should the order be lost?

**Answer:**

No. Order state and billing work should be durable and independently retryable. The ordering service records the served transition and emits an event. The billing service consumes the event, creates an invoice idempotently, and retries on failure. The UI can show a pending billing state rather than pretending the invoice was created.

### Q42. How would you paginate the menu and order history endpoints?

**Answer:**

Use cursor pagination for large or frequently changing data:

```text
GET /api/v1/orders?limit=50&after=<cursor>
```

The cursor should encode a stable ordering such as `(created_at, id)`. Return:

```json
{
  "items": [],
  "nextCursor": "..."
}
```

Offset pagination is simpler for small admin lists, but cursor pagination avoids duplicates and skips when new rows are inserted during browsing.

### Q43. How would you make the dashboard fast?

**Answer:**

Start with indexed queries and measured performance. If aggregation becomes expensive, publish domain events and maintain a reporting read model containing daily revenue, order counts, pending KOTs, and table occupancy. The dashboard reads the reporting model while transactional services remain the source of truth.

Use short query caching or React Query stale times for repeated reads, but do not hide correctness problems with caching.

### Q44. How would you handle a failed database migration?

**Answer:**

Migrations should be versioned, reviewed, and run by a controlled pipeline. Use backward-compatible expand-and-contract changes:

1. Add new nullable columns or tables.
2. Deploy code that can read old and new shapes.
3. Backfill data in batches.
4. Switch reads and writes.
5. Add constraints after validation.
6. Remove old fields in a later release.

Do not make destructive schema changes and application changes inseparable in one uncontrolled deployment.

## 10. Strong closing answer

### Q45. What would you improve first if you had more time?

**Answer:**

I would prioritize production correctness in this order:

1. Replace mock authentication with secure password/session or managed identity integration.
2. Add PostgreSQL persistence with migrations and transaction boundaries.
3. Preserve order and billing snapshots for auditability.
4. Add idempotency for guest orders and payments.
5. Add consistent API error contracts, pagination, authorization, and request IDs.
6. Add readiness probes, structured logging, metrics, tracing, and alerts.
7. Add API contract tests and browser end-to-end tests.
8. Extract services only after measuring the operational need and stabilizing boundaries.

This order reduces data-loss and security risk before optimizing deployment topology.

## Quick interview checklist

Before the interview, be ready to explain:

- Why React Query is used for server state.
- How Vite proxies `/api` to the Node API.
- The difference between `ECONNREFUSED` and HTTP 404.
- The staff login and guest order flows.
- Why the current mock store is not production persistence.
- Why prices and names are snapshotted on order and invoice lines.
- How table occupancy and order creation require concurrency control.
- Why PostgreSQL `numeric` is used for money.
- How service boundaries map to identity, catalog, floor, ordering, billing, and reporting.
- How outbox events and idempotency support reliable microservices.
- How Docker Compose differs from Kubernetes deployment.
- What the current tests cover and what production tests are still needed.
