---
name: preflight
description: 60-second read-only scan. Security, health, ship readiness. No fixes, no commits.
---

# /linkraft preflight

See what's wrong before you ship. 60-second read-only scan.

## Subcommands

### /linkraft preflight
Full scan: security + health + ship readiness. Writes report to .preflight/.

### /linkraft preflight security
Security scan only: hardcoded secrets, missing auth, injection vectors, XSS, RLS.

### /linkraft preflight health
Health metrics only: console.logs, TypeScript any, test coverage, file complexity, TODOs.

### /linkraft preflight ready
Ship readiness only: error handling, loading states, 404, auth, deploy config, meta tags.
