# Security Policy

## Reporting a Vulnerability

**Do not open a public issue.** Security vulnerabilities must be reported privately.

Send an email to [INSERT SECURITY EMAIL] with:

- A description of the vulnerability
- Steps to reproduce
- Affected versions
- Any potential mitigations you've identified

You can encrypt your message using our [PGP key](#) (fingerprint: `INSERT FINGERPRINT`).

### What to Expect

- **Acknowledgment:** within 48 hours
- **Assessment:** within 5 business days
- **Fix timeline:** depends on severity, typically 7–30 days
- **Disclosure:** coordinated with you. We aim to publish an advisory after the fix is released.

We follow a responsible disclosure process and will credit you in the advisory (unless you prefer to remain anonymous).

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

Only the latest minor release receives security patches.

## Security Best Practices for Users

- **Never commit kubeconfig files** to version control.
- **Use RBAC-restricted service accounts** for the migration tool — cluster-admin is not required.
- **Rotate kubeconfigs** used by the migration tool regularly.
- **Review the dry-run report** before performing any apply operation.
- **Redact secrets in logs** — the tool strips `.data` fields from Secrets in its YAML output, but always verify.
- **Run the migration tool in an isolated network** or with network policies restricting its egress.

## What We Consider a Vulnerability

- Unauthorized access to cluster resources
- Secrets leakage in logs, reports, or API responses
- Privilege escalation via the migration tool
- Remote code execution through crafted manifests or kubeconfigs
- Authentication bypass in the API layer

## What We Do Not Consider a Vulnerability

- Issues requiring cluster-admin access already obtained
- Misconfigured RBAC on the user's cluster
- Vulnerabilities in dependencies that do not affect the migration tool's operation
- Social engineering or phishing attacks

## Dependency Scanning

Dependencies are scanned regularly via Dependabot / Renovate. If you find a vulnerable dependency, report it as a regular bug (not a security issue) unless it enables a real attack vector.
