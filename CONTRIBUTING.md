# Contributing to k8s-migration

Thank you for your interest in contributing!

## AI-Assisted Development

This project uses AI coding agents (Claude and others) as part of the development workflow. All AI-generated code is reviewed by human engineers before merging. If you use AI tools while contributing, please disclose it in your PR description.

## Dev Environment Setup

### Prerequisites

- **Go** 1.22+
- **Node.js** 20+
- **Docker** (for k3d clusters)
- **k3d** CLI — `curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash`
- **kubectl** — https://kubernetes.io/docs/tasks/tools/

### Quick Start

```bash
git clone <repo-url>
cd k8s-migration
make setup
```

This installs Go dependencies, npm packages, and creates local k3d clusters.

### Manual Setup

```bash
# Backend
cd backend
go mod download

# Frontend
cd frontend
npm install

# Create test clusters
infra/setup-clusters.sh
```

## Running Tests

```bash
# All tests
make test

# Backend unit tests only
cd backend && go test ./...

# Backend integration tests (requires clusters)
make test-integration

# Frontend unit tests
cd frontend && npm run test:unit

# E2E tests
make test-e2e

# Linting
make lint
```

## Commit Conventions

We use **Conventional Commits**:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`

Scopes: `backend`, `frontend`, `migration`, `discovery`, `k8s`, `config`, `ws`, `infra`, `docs`

Examples:

```
feat(migration): add HelmRelease migration support
fix(k8s): handle missing discovery client gracefully
docs(api): document /healthz endpoint
chore(deps): bump client-go to v0.30.0
```

## Pull Request Process

1. Create a branch from `main`.
2. Make your changes, following the [agent ownership rules](AGENTS.md).
3. If crossing agent boundaries, ping the owning agent in the PR.
4. Write or update tests for your changes.
5. Run `make test` and `make lint` — both must pass.
6. Open a PR using the [PR template](.github/PULL_REQUEST_TEMPLATE.md).
7. Request review from the agent(s) owning the files you changed.

## Code Review Requirements

- At least one approval from the agent owning the changed files.
- All tests pass in CI.
- No secrets or credentials in the diff.
- AI contributions disclosed in the PR body.
- Documentation updated if the public API or user-facing behavior changes.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating.

## License

By contributing, you agree that your contributions will be licensed under the project's license.

## Questions?

Open a [Discussion](<repo-url>/discussions) or file an issue with the `question` label.
