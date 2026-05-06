---
name: Migration Issue
about: Report an issue encountered during a migration run
title: "[MIGRATION] "
labels: migration, triage
assignees: ''
---

## Cluster Information

- **Source cluster Kubernetes version:**
- **Target cluster Kubernetes version:**
- **Source cluster provider** (k3d / kind / EKS / GKE / AKS / on-prem):
- **Target cluster provider** (k3d / kind / EKS / GKE / AKS / on-prem):

## Migration Scope

- **Resource types involved:**

  <!-- e.g. Deployments, Services, ConfigMaps, CRDs, Secrets -->

- **Namespaces involved:**
- **Number of resources selected:**

## Bundle Information

- **Bundle format** (single-file / directory / S3 / OCI):
- **Bundle size (approx):**
- **Was namespaces remapping enabled?** yes / no
- **Was image registry rewriting enabled?** yes / no

## Error Details

- **Error message:**

  ```
  <!-- paste error message -->
  ```

- **Phase where error occurred** (discovery / metadata-strip / dry-run / apply):
- **Conflict strategy used** (skip / overwrite / merge / error-out):
- **Is the issue reproducible?** yes / no / sometimes

## Logs

<details>
<summary>Full migration logs</summary>

```
<!-- paste logs here (redact secrets) -->
```

</details>

## Additional Context

<!-- Resource manifests (redacted), kubeconfig info without secrets, timing data, cluster state before/after. -->
