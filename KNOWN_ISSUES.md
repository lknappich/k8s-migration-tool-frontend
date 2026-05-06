# KNOWN_ISSUES.md — Known Issues & Workarounds

This file documents known issues that have not yet been resolved, with workarounds where available.

## Format
```
### Issue: <short description>
Priority: high | medium | low
Workaround: <description of workaround if any>
```

---

### Issue: CustomResource migration not supported by the engine
Priority: medium
Workaround: Custom resources are discovered and selectable in the UI but resolveGVR returns "custom resources require per-type resolution" during migration. To support this, the engine would need to dynamically resolve the GVR from the CRD definition at migration time (similar to how discovery does it).

### Issue: WebSocket readPump runs forever until disconnect
Priority: low
Workaround: The readPump goroutine in ws/hub.go has no cancellation mechanism — it runs until a read error occurs. For long-lived clients, this is fine. If the client never disconnects, the goroutine stays alive. This is standard gorilla/websocket behavior.

### Issue: No Playwright E2E test configured
Priority: medium
Workaround: The make test-e2e target references `npx playwright test --project=e2e` but no Playwright config or tests exist in frontend/tests/e2e/. Use `make test` (which covers unit + integration) as the primary test target. E2E tests need to be written.

### Issue: Large-scale migrations may exceed context timeout
Priority: medium
Workaround: The discovery context timeout is 30 seconds and the migration runs synchronously without batching. For clusters with hundreds of resources, migrations should be batched into groups or use increased timeouts.

### Issue: No go.sum file committed
Priority: low
Workaround: go.sum is generated locally by `go mod tidy` and exists in the working directory but is not tracked. For reproducible builds, consider running `go mod tidy` as part of the build pipeline.

### Issue: Frontend has no unit tests
Priority: medium
Workaround: Use `npx vue-tsc --noEmit` to verify type correctness. Vitest is configured in package.json with `npm run test:unit` but no test files exist in frontend/tests/unit/.
