.PHONY: setup test test-e2e run-backend run-frontend clean build lint dev format

export PATH := $(HOME)/.local/go/bin:$(HOME)/.local/bin:$(PATH)

setup:
	cd backend && go mod tidy
	cd frontend && npm install

build:
	cd backend && go build -o bin/server ./cmd/server/
	cd frontend && npx vite build

lint:
	cd backend && go vet ./...
	cd frontend && npx vue-tsc --noEmit

format:
	cd backend && gofmt -w .

dev:
	cd backend && go run ./cmd/server/ &
	cd frontend && npm run dev

run-backend:
	cd backend && go run ./cmd/server/

run-frontend:
	cd frontend && npm run dev

test: test-backend-unit test-backend-integration

test-backend-unit:
	cd backend && go test ./internal/... -v -count=1

test-backend-integration:
	cd backend && PROJECT_ROOT=$(CURDIR) go test ./tests/... -v -count=1 -tags=integration

test-e2e:
	cd frontend && npx playwright test

test-full: setup-clusters seed-source
	cd backend && PROJECT_ROOT=$(CURDIR) go test -tags=integration ./tests/... -v -count=1 -timeout 120s
	cd frontend && npx playwright test
	$(MAKE) teardown-clusters

setup-clusters:
	./infra/setup-clusters.sh

seed-source:
	./infra/seed-source.sh

teardown-clusters:
	./infra/teardown-clusters.sh

clean:
	cd backend && rm -rf bin/
	cd frontend && rm -rf dist/
	$(MAKE) teardown-clusters
