# K8s Migration Tool — Frontend

![License](https://img.shields.io/badge/license-Apache%202.0-blue) ![Vue](https://img.shields.io/badge/vue-3.x-green) ![TypeScript](https://img.shields.io/badge/typescript-5.6-blue) ![Vite](https://img.shields.io/badge/vite-6.0-purple) ![Docker](https://img.shields.io/badge/docker-ready-blue)

**Vue 3 SPA for the K8s Migration Tool.** A reactive, real-time UI for discovering Kubernetes resources, resolving migration bundles, reviewing dependency-aware migration plans, monitoring live progress via WebSocket, and downloading detailed migration reports.

## Quick Start

```bash
cd frontend
npm install
npm run dev
# Opens http://localhost:5173 — proxies /api to backend at :8080
```

## Docker

```bash
# Build and run
docker build -t k8s-migration-frontend .
docker run -p 5173:80 k8s-migration-frontend

# With docker-compose from repo root
docker-compose up frontend
```

The Docker image serves the production build behind nginx, with `/api/` proxied to the backend service at `http://backend:8080` and WebSocket upgrade support.

## Views

### Setup View
A two-pane form for pasting source and target cluster kubeconfigs. Each pane supports file upload or direct text paste with optional insecure-skip-verify toggles. After successful connection, cluster metadata (context name, server URL, Kubernetes version, node count) is displayed. Validates connectivity before allowing navigation to other views.

### Resource Diff Explorer (Resources View)
A three-column filterable table of all discovered resources from the source cluster, grouped by kind. Supports text filtering by kind, namespace, and resource name. Each resource row can be selected individually. Keyboard shortcuts: `Ctrl+A` selects all, `Ctrl+Shift+A` deselects all, `Enter` navigates to the plan review. Expandable groups show per-kind resource counts.

### Bundle Resolution
Analyzes the dependency graph of selected resources and organizes them into atomic migration bundles. Each bundle shows its primary resource, all contained resources, internal dependencies (matching resources that should be migrated together), external dependencies (non-migratable things like StorageClasses and IngressClasses), and warnings. Bundles that share ConfigMaps or Secrets are automatically merged.

### Plan View
Displays the selected resources ordered by the migration engine's dependency sequence. Shows the execution order from Namespaces through HelmReleases. Allows choosing a global conflict strategy (skip, overwrite, rename) and reviewing per-resource targets. Supports triggering the dry-run mode toggle. A "Start Migration" button submits the plan and navigates to live progress.

### Live Progress
Real-time WebSocket view that subscribes to migration events for a running job. Shows a progress bar (completed / total resources) with live counters for succeeded, failed, skipped, and dry-run resources. A scrolling event log renders each resource event with timestamp, kind, name, namespace, status badge (color-coded: green for success, amber for skipped, red for failed, blue for dry-run), and message detail. Supports pause/resume of the visual feed. When the job completes, provides a link to the report.

### Dashboard
Overview page shown after cluster configuration. Displays cluster health status, the migration pipeline progress bar (from Setup through Report), quick navigation cards for each step, and a "Last Migration" summary with a shortcut to view the most recent report.

### Report View
Post-migration audit view showing the full results table: status (with color-coded badges), resource kind, name, namespace, and detail message. Includes a status filter dropdown to view only succeeded, failed, skipped, or dry-run resources. Download buttons for JSON and YAML report formats.

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Vue 3 | 3.5+ | Reactive component framework (Composition API, `<script setup>`) |
| TypeScript | 5.6+ | Type safety across components, stores, composables, and API types |
| Vite | 6.0+ | Dev server with HMR and API proxy |
| Pinia | 2.2+ | State management (cluster config, migration jobs, toast queue) |
| Vue Router | 4.4+ | Client-side routing with 6 views |
| TailwindCSS | 3.4+ | Utility-first CSS with custom forms plugin |
| Playwright | 1.48+ | E2E test framework |
| Vitest | 2.1+ | Unit test runner |

## Project Structure

```
src/
  main.ts                  App bootstrap, Pinia & Router initialization
  App.vue                  Root component with toast container and router-view
  env.d.ts                 Global type declarations
  assets/                  Static styles and fonts
  components/
    LoadingSkeleton.vue    Skeleton loading placeholder for async states
    ToastContainer.vue     Notification toast overlay (positioned bottom-right, auto-dismiss)
  composables/
    useApi.ts              HTTP client wrapping fetch for all API endpoints
    useWebSocket.ts        WebSocket client with auto-reconnect, exponential backoff, event parsing
  router/
    index.ts               Vue Router config: /setup, /resources, /plan, /progress/:id, /report/:id, /
  stores/
    cluster.ts             Pinia store — kubeconfig submission, discovered resources, selection state, plan generation
    migration.ts           Pinia store — migration job tracking, event log accumulation, progress counters
    toasts.ts              Pinia store — toast queue with auto-dismiss timers and severity levels
  types/
    index.ts               Full TypeScript type definitions mirroring backend models
  views/
    SetupView.vue          Cluster configuration page
    ResourcesView.vue      Resource discovery and selection
    PlanView.vue           Migration plan review and launch
    ProgressView.vue       Live migration event stream
    ReportView.vue         Post-migration audit report
    DashboardView.vue      Overview dashboard
```

## Connecting to the Backend

The API URL is configurable at build time. In development, Vite proxies `/api` requests to the backend:

```ts
// vite.config.ts — dev proxy
server: {
  proxy: {
    '/api': 'http://localhost:8080'
  }
}
```

In production (Docker / nginx), the nginx config proxies `/api/` to the backend container:

```nginx
location /api/ {
    proxy_pass http://backend:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400s;  # long-lived WebSocket connections
}
```

To point at a different API server (e.g., staging), set `VITE_API_BASE_URL` at build time or update the proxy target.

## Development

```bash
npm run dev          # Dev server with HMR on :5173
npm run build        # Production build (type-check + vite build)
npm run preview      # Preview production build locally
npm run test:unit    # Run unit tests (Vitest)
npm run test:e2e     # Run E2E tests (Playwright)
```

From the repo root:

```bash
make run-frontend    # npm run dev
make lint            # vue-tsc --noEmit type check
make build           # production build
```

## License

Apache License 2.0. See the root [`LICENSE`](../LICENSE).
