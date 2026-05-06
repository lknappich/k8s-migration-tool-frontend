# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added — 0.2.0 (pending)

- Bundle-aware migration engine (single-file, directory, S3, OCI backends)
- GitHub Actions CI pipeline
- Frontend overhaul (new component library, responsive design)
- Enterprise features (RBAC, audit logging, multi-tenancy)

## [0.1.0] — 2026-05-05

### Added

- Multi-resource discovery: Deployments, Services, ConfigMaps, Secrets, CRDs, HelmReleases, PVCs, ServiceAccounts, Ingresses, NetworkPolicies
- Kubernetes resource migration engine with dependency ordering and conflict resolution (skip / overwrite / merge / error-out)
- `/api/discover` endpoint returning resource count per type from source cluster
- `/api/resources` endpoint listing discovered resources as tree with filtering
- `/api/select` endpoint for selecting resources by type, namespace, label, name, and target namespace remapping
- `/api/migrate` endpoint executing migration plan with per-resource status tracking
- Dry-run mode: migrate with `dry_run: true` to preview without applying
- WebSocket streaming via `/ws` endpoint — push events through entire migration lifecycle
- Structured JSON logging with slog
- Request ID middleware: UUID per request in `X-Request-ID` header
- Namespace remapping: redirect resources to alternate namespaces
- Image registry rewriting: mutate container/initContainer images during migration
- Toast notification system in frontend (Pinia store + ToastContainer component)
- Loading skeleton components for async states
- Keyboard shortcuts in ResourcesView (Ctrl+A, Ctrl+Shift+A, Enter)
- `infra/` directory with k3d cluster setup scripts and seed data
- `Makefile` with test, lint, setup, and E2E targets
- Unit tests for kubeconfig parsing (7), WebSocket hub (4), API routes (9)
- Integration tests for health endpoint and dry-run migration
