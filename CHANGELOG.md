# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-05-06

### Added

#### Bundle Dependency Resolution Engine
- Automatic dependency detection from workloads: ConfigMap, Secret, PVC, ServiceAccount, RBAC, TLS secrets, Ingress references, StorageClass, IngressClass
- Bundle merging for shared dependencies across resources
- External dependency warnings for non-migratable resources
- Bundle API endpoints: `/api/bundles`, `/api/bundles/resolve`, `/api/bundles/:id`, `/api/migrate/bundles`

#### Enterprise Frontend
- Full sidebar navigation with 7 views: Setup, Dashboard, Cluster Diff, Resources, Bundles, History, Settings
- ClusterDiffView — three-column diff (source only / out of sync / target only) with bundle badges
- BundleExplorer — card grid with expandable dependency trees, namespace/warning filters
- BundleDetail — dependency graph visualization with color-coded nodes and edge labels
- MigrationHistory — filterable table of past jobs with success rates
- SettingsView — conflict defaults, bundle resolution toggles, registry rewrite editor, namespace remapping
- Toast notification system with auto-dismiss
- Loading skeletons for async operations
- Keyboard shortcuts (Ctrl+A, Ctrl+Shift+A, Enter)

#### Preflight Checks & Verification
- Preflight check engine: cluster health, CRD existence, StorageClass, IngressClass, node capacity, namespace conflicts
- Post-migration verification: Deployment/StatefulSet replicas, Pod status, Service endpoints, PVC binding
- API endpoints: `/api/preflight`, `/api/verify/:jobId`, `/api/preflight/:jobId`

#### CLI Mode (Plan-as-Code)
- `migration-tool` CLI binary: `migration-tool migrate --plan plan.yaml --source src.kubeconfig --target tgt.kubeconfig`
- YAML plan format with bundle include/exclude/all support
- NDJSON progress streaming to stdout

#### Developer Experience
- OpenAPI 3.0 spec (`openapi.yaml`) covering all endpoints
- Playwright E2E test suite with config
- 39 frontend Vitest unit tests (stores, composables, components)
- GitHub Actions CI pipelines for backend and frontend (lint, test, build, Docker, security)
- Dependabot configuration for Go modules and npm packages
- Professional open source READMEs with badges, architecture diagrams, quickstart guides
- Apache 2.0 LICENSE, CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md

### Fixed
- writeYAML producing JSON instead of YAML
- Duplicated resolveGVR function extracted to shared package
- ServiceAccount token secrets properly skipped during migration
- HelmRelease discovery errors now logged instead of silently swallowed
- WebSocket endpoint nil pointer panic (missing requireConfig middleware)
- Docker host networking for k3d cluster connectivity
- Bundle name generation (was empty, now shows Kind/name/namespace)

## [0.1.0] — 2026-05-05

### Added
- Multi-resource discovery across 18 resource types
- Dependency-ordered migration engine with conflict resolution (skip/overwrite/rename)
- Dry-run mode
- WebSocket live progress streaming with structured events
- REST API: `/api/config`, `/api/resources`, `/api/migrate`, `/api/migrate/:id`, `/api/migrate/:id/live`, `/api/migrate/:id/report`
- `/healthz` endpoint with cluster connectivity checking
- Request ID middleware with structured JSON logging
- Namespace remapping and image registry rewriting
- k3d-based local cluster infrastructure with seed data
- Vue 3 frontend with dark mode, TailwindCSS, Pinia stores
- 80+ Go unit and integration tests against real clusters
