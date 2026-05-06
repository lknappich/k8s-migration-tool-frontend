# K8s Migration Tool

```
 _  _______        __  __ _                 _   _
| |/ /___ /  ___  |  \/  (_) __ _  __ _  __| | (_) ___  _ __
| ' /  |_ \ / __| | |\/| | |/ _` |/ _` |/ _` | | |/ _ \| '_ \
| . \ ___) |\__ \ | |  | | | (_| | (_| | (_| |_| | (_) | | | |
|_|\_\____/ |___/ |_|  |_|_|\__, |\__,_|\__,_(_)_|\___/|_| |_|
                            |___/
```

![License](https://img.shields.io/badge/license-Apache%202.0-blue) ![Go](https://img.shields.io/badge/go-1.26-blue) ![Vue](https://img.shields.io/badge/vue-3.x-green)

**Enterprise-grade Kubernetes cluster migration — open source**

The K8s Migration Tool discovers resources from a source Kubernetes cluster, resolves their dependency tree into atomic migration bundles, and executes dependency-ordered migrations to a target cluster with real-time WebSocket feedback. It supports dry-run simulation, namespace remapping, image registry rewriting, and plan-as-code export so migrations are auditable and repeatable.

## UI Flow

```
+---------+     +---------------+     +-------------------+     +----------------+     +----------------+     +----------+
|  Setup  | --> | Diff Explorer | --> | Bundle Resolution | --> | Migration Plan | --> | Live Progress  | --> |  Report  |
+---------+     +---------------+     +-------------------+     +----------------+     +----------------+     +----------+
     |                  |                      |                       |                       |                    |
 Paste            Browse & filter       Dependencies             Conflict resolution      WebSocket stream     JSON/YAML export
 kubeconfigs      source resources      auto-grouped             per-bundle strategy       per-resource         success/failure
                                                                    & acknowledge           event log            summary
```

## Quick Start

```bash
git clone https://github.com/k8s-migration/k8s-migration-tool.git
cd k8s-migration-tool
make setup
make dev
# Open http://localhost:5173 – paste kubeconfigs for source and target clusters
```

For local testing with k3d clusters:

```bash
./infra/setup-clusters.sh
./infra/seed-source.sh
make dev
# Use kubeconfigs from infra/kubeconfigs/ on the Setup page
```

## Architecture

```
+--------+       +---------------------------+       +-------------------------+
|  User  | <---> |   Frontend (Vite :5173)   | <---> |   Backend API (Go :8080) |
|Browser |       |  Vue 3 / Pinia / TS /     |       |  gorilla/mux / gorilla/  |
+--------+       |  TailwindCSS              |       |  websocket / slog        |
                 +---------------------------+       +------------|-------------+
                                                                   |
                                                    +--------------v--------------+
                                                    |      K8s Clusters           |
                                                    |  +--------+  +--------+    |
                                                    |  | Source |  | Target |    |
                                                    |  | (RKE2) |  | (any)  |    |
                                                    |  +--------+  +--------+    |
                                                    +-----------------------------+
```

The backend discovers resources from the source cluster via `client-go`, resolves bundle dependencies, and writes to the target cluster using `dynamic.Interface`. The frontend consumes the REST API for CRUD and subscribes to the WebSocket stream for live per-resource migration events.

## Features

- **Bundle-aware migration engine** — resources are automatically grouped into atomic bundles based on runtime dependencies (ConfigMaps, Secrets, PVCs, Services, Ingresses, RBAC)
- **Dependency-ordered execution** — Namespaces before CRDs, ServiceAccounts before RoleBindings, ConfigMaps/Secrets before workloads
- **Dry-run mode** — simulate the full migration without writing to the target cluster; every resource reports `dry_run` status
- **Conflict strategies** — skip, overwrite, or rename per-resource or per-bundle
- **Namespace remapping** — redirect namespaced resources to different target namespaces
- **Image registry rewriting** — rewrite container and init-container image references during migration
- **Pre-flight health checks** — `/api/healthz` validates connectivity to both source and target clusters before migration
- **WebSocket live streaming** — real-time per-resource event stream with status, message, and progress payloads
- **Post-migration verification** — downloadable JSON or YAML migration reports with full result audit trail
- **Plan-as-code** — migration plans are serializable YAML/JSON; re-apply the same plan across environments
- **Request ID tracing** — every API request carries a `X-Request-ID` header and structured JSON logs for auditability

## Migrated Resource Types

Namespaces, Deployments, StatefulSets, DaemonSets, Jobs, CronJobs, Services, Ingresses, NetworkPolicies, ConfigMaps, Secrets, PersistentVolumes, PersistentVolumeClaims, ServiceAccounts, Roles, RoleBindings, ClusterRoles, ClusterRoleBindings, CRDs, CustomResources, HelmReleases

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/healthz` | Cluster connectivity health check |
| POST | `/api/config` | Submit kubeconfigs for source and target clusters |
| GET | `/api/resources` | List all discovered resources from source cluster |
| GET | `/api/groups` | Group discovered resources by kind |
| POST | `/api/migrate` | Start migration with a plan of selected resources |
| POST | `/api/migrate/batch` | Start a batch migration with pre-grouped resources |
| GET | `/api/migrate/{id}` | Get migration job status and progress |
| DELETE | `/api/migrate/{id}` | Cancel a running migration job |
| GET | `/api/migrate/{id}/report` | Download migration report (JSON or YAML) |
| WS | `/api/migrate/{id}/live` | WebSocket stream for live migration events |
| GET | `/api/bundles` | List resolved migration bundles with dependencies |
| POST | `/api/bundles/resolve` | Resolve bundles for a specific set of resources |
| GET | `/api/bundles/{id}` | Get detail for a single resolved bundle |
| POST | `/api/migrate/bundles` | Start migration from selected bundles (with warning acknowledgement) |

## Roadmap

### In Progress / Recent

- Dry-run mode, namespace remapping, image registry rewriting, request ID middleware, cluster health endpoint
- Toast notification system, loading skeleton components, keyboard shortcuts (Ctrl+A select all, Enter to plan)
- Shared GVR resolution utility, HelmRelease discovery warning, service-account-token secret handling

### Planned

- CustomResource migration via dynamic GVR resolution at migration time
- Batching for large-scale migrations with configurable context timeouts
- Frontend unit test suite (Vitest configured, tests to be written)
- Playwright E2E tests (Playwright configured, test files to be created)
- WebSocket readPump cancellation mechanism for clean shutdown

See [`IMPROVEMENTS.md`](IMPROVEMENTS.md) for the full change log and [`KNOWN_ISSUES.md`](KNOWN_ISSUES.md) for tracked issues with workarounds.

## Split Repositories

This monorepo may also be available as separate repositories:

- **Backend:** [k8s-migration-tool-backend](https://github.com/k8s-migration/k8s-migration-tool-backend) — Go API server, migration engine, WebSocket hub, bundle resolver
- **Frontend:** [k8s-migration-tool-frontend](https://github.com/k8s-migration/k8s-migration-tool-frontend) — Vue 3 SPA, composables, Pinia stores, Tailwind UI

## Contributing

Contributions are welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for dev environment setup, commit conventions (Conventional Commits), pull request process, and agent-based ownership rules. This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](LICENSE) for the full text.

```
Copyright 2026 K8s Migration Tool Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
