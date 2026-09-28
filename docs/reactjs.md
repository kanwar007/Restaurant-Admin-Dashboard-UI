# React in This Project

This guide explains the React foundations used by the Restaurant Admin Dashboard and how they fit together in this application. It focuses on the code in `web/src` rather than covering every React feature.

## What React Does Here

The frontend is a single-page application (SPA) built with React 19, TypeScript, and Vite. React turns component functions and JSX into the interface shown in the browser. When component state or data changes, React updates the affected part of the page without reloading the whole document.

The application is organized as a component tree:

```text
main.tsx
└── App
    ├── LoginPage
    ├── GuestPage
    └── RequireAuth
        └── Layout
            └── Current staff page
```

`main.tsx` is the browser entry point. `App.tsx` declares which screen is rendered for each URL. Each page and reusable UI element is a React component.

## Application Startup

In [`main.tsx`](../web/src/main.tsx), `createRoot` mounts React into the HTML element with the id `root`. The app is wrapped in several providers before rendering:

- `StrictMode` enables extra development checks for common React issues. It does not add a visible part of the UI.
- `QueryClientProvider` makes the TanStack Query client available to components for API data and mutations.
- `BrowserRouter` enables client-side URL routing.
- `AuthProvider` makes the current user's authentication state available throughout the app.

These providers are nested because their descendants need to read the corresponding shared service or state.

## Components, JSX, Props, and Composition

A function component is a JavaScript/TypeScript function that returns JSX, React's syntax for describing UI. For example, `DashboardPage` reads dashboard data and returns headings, loading/error feedback, statistics, and order rows.

Components can accept **props**, which are inputs from their parent. [`PageHead`](../web/src/components/ui.tsx) accepts a title, optional subtitle, and optional actions. [`StatCard`](../web/src/pages/DashboardPage.tsx) accepts a `DashboardStat`. TypeScript declares these prop shapes so invalid or missing values can be caught during the build.

Components are composed by rendering one component inside another. Shared elements such as `PageHead`, `QueryState`, and `StatusPill` keep repeated interface behavior consistent. The `children` prop is used by [`AuthProvider`](../web/src/auth/AuthProvider.tsx) to wrap and provide context to the rest of the tree.

## Routing and Page Layout

[`App.tsx`](../web/src/App.tsx) uses React Router's `Routes` and `Route` components to map URLs to screens. `/login` and `/guest` are public. Staff routes are nested under `RequireAuth` and `Layout`:

- `RequireAuth` checks access and either renders the nested route or redirects to sign-in.
- `Layout` renders the shared header and sidebar.
- `Outlet` in `Layout` is the place where the active child page is rendered.
- `NavLink` provides navigation links that can reflect whether their route is active.

React Router changes the visible route within the SPA rather than asking the browser to download a separate page for every screen.

## State: Values That Change the UI

React state is data owned by a component that can change over time. Calling its setter schedules a render with the new value. This project uses `useState` for short-lived, interactive UI state:

- [`LoginPage`](../web/src/pages/LoginPage.tsx) stores username, password, password visibility, submission progress, and an error message.
- [`MenuPage`](../web/src/pages/MenuPage.tsx) stores the selected category, search text, and whether the add-dish modal is open.
- [`GuestPage`](../web/src/pages/GuestPage.tsx) stores menu filters, table and customer details, the order cart, and the order confirmation.
- [`BillingPage`](../web/src/pages/BillingPage.tsx) stores the selected bill format and order number.

Inputs whose `value` comes from state and whose `onChange` updates that state are **controlled inputs**. This keeps the displayed value and the React state in sync. `LoginPage` is one example; `SearchInput` in `components/ui.tsx` is a reusable controlled input that receives its value and change handler through props.

When state is based on its previous value, the app uses the functional setter form, for example `setCart((current) => ...)` in `GuestPage`. This ensures each update is calculated from the latest state.

## Effects and Context

### `useEffect`

[`AuthProvider`](../web/src/auth/AuthProvider.tsx) uses `useEffect` to check an existing saved token after the component mounts. It calls `/auth/me` to restore the signed-in user. If that request fails, it clears the invalid token and marks the session anonymous. Effects are used for work connected to component lifecycle or external systems; ordinary values derived from props or state should generally be calculated during rendering instead.

### Context

React Context shares a value with components below a provider without passing it through every intermediate component as props. [`AuthContext`](../web/src/auth/context.ts) defines the authentication value, and `AuthProvider` supplies it. [`useAuth`](../web/src/auth/useAuth.ts) is a small custom hook that reads the context and reports a clear error if used outside the provider.

The authentication context includes the user, authentication status, `signIn`, and `signOut`. `RequireAuth`, `Layout`, and `LoginPage` consume this shared state.

## API Data and Mutations

The application separates **server state** (data owned by the API) from local UI state. It uses TanStack Query for server state, rather than copying API responses into many `useState` calls.

[`api/hooks.ts`](../web/src/api/hooks.ts) defines reusable custom hooks such as `useDashboard`, `useMenu`, `useOrders`, and `useTables`. Query hooks identify data with a `queryKey` and load it with the shared API client. A page calls the relevant hook and receives values such as `data`, `isLoading`, and `error`.

For changes, hooks such as `useCreateMenuItem`, `useUpdateOrderStatus`, and `usePlaceGuestOrder` use `useMutation`. After a successful mutation they invalidate the affected query keys. TanStack Query then refreshes data that may have become stale. For example, placing a guest order invalidates the order and table data.

The shared [`QueryState`](../web/src/components/ui.tsx) component displays loading and error states. This keeps pages from treating an unfinished request as if its data were already available.

At startup, [`main.tsx`](../web/src/main.tsx) configures queries to stay fresh for 15 seconds and not automatically refetch just because the browser window regains focus.

## Derived Values and Memoization

Some displayed values are calculated from other state rather than stored independently. `GuestPage` calculates the cart total from cart lines and add-on prices. It uses `useMemo` for that calculation, with the cart and add-ons as dependencies. React recalculates the total when either dependency changes.

`AuthProvider` uses `useCallback` for the `signIn` and `signOut` functions and `useMemo` to create the context value. Their dependency arrays describe which values the callbacks or object rely on. These hooks keep the provided references stable when dependencies have not changed; they are not needed for every function or value in a component.

## Rendering Lists and Conditional UI

JSX can include JavaScript expressions in braces. The app uses these expressions to choose what to render:

- Conditional rendering shows loading and error messages, optional descriptions, and page states.
- `.map()` renders repeated UI, such as menu items, navigation entries, order rows, and cart lines.
- Each repeated element has a stable `key` (usually an API id or unique name) so React can track which item changed between renders.

For example, `DashboardPage` maps dashboard stats into `StatCard` components and maps latest orders into order rows.

## TypeScript with React

The frontend uses `.tsx` files for components containing JSX and `.ts` files for non-JSX TypeScript. API response and domain shapes are defined in [`api/types.ts`](../web/src/api/types.ts). Components and hooks use those types to check props, state, mutation arguments, and API results at compile time.

The app uses the modern JSX transform (`jsx: "react-jsx"` in [`tsconfig.app.json`](../web/tsconfig.app.json)), so components do not need to import `React` just to write JSX. React APIs such as hooks and types are imported when needed.

## A Useful Reading Path

1. Start with [`main.tsx`](../web/src/main.tsx) to see how the application is mounted and which providers wrap it.
2. Read [`App.tsx`](../web/src/App.tsx) for the URL-to-page map.
3. Follow a staff route through [`RequireAuth.tsx`](../web/src/auth/RequireAuth.tsx) and [`Layout.tsx`](../web/src/components/Layout.tsx).
4. Read [`AuthProvider.tsx`](../web/src/auth/AuthProvider.tsx) and [`useAuth.ts`](../web/src/auth/useAuth.ts) for shared authentication state.
5. Read [`api/hooks.ts`](../web/src/api/hooks.ts) and [`api/client.ts`](../web/src/api/client.ts) for API queries and mutations.
6. Open a page such as [`DashboardPage.tsx`](../web/src/pages/DashboardPage.tsx) or [`GuestPage.tsx`](../web/src/pages/GuestPage.tsx) to see the patterns combined in a feature.

## Build and Lint

From the repository root:

```bash
npm run build
npm run lint
```

The build runs TypeScript project checks and then creates the Vite production bundle. Lint checks the frontend source. For local development, run `npm run dev` from `web/` (or follow the root README instructions to start the UI and mock API together).
