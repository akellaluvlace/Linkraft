---
name: preflight
description: 60-second read-only scan. Security score, health score, ship readiness percentage. No fixes, no commits. The on-ramp to Sheep.
---

# Preflight: See What's Wrong

## What This Does

Scans your codebase in ~60 seconds. Three scores: security (0-10), health (0-100), ship readiness (0-100%). Read-only. No fixes, no commits, no story. Just a report.

## /linkraft preflight - Full Execution Flow

**Step 1:** Call `preflight_full` with the project root.
This runs all three scanners and writes the report to `.preflight/report.md` and `.preflight/report.json`.

**Step 2:** Present the report to the user. Highlight:
- Security score and any critical findings
- Health score and worst metrics
- Ship readiness percentage and what's missing
- The "next steps" recommendation

That's it. One tool call. One report.

## Subcommand Flows

### /linkraft preflight
Call `preflight_full`. Full report.

### /linkraft preflight security
Call `preflight_security`. Security findings only.

### /linkraft preflight health
Call `preflight_health`. Health metrics only.

### /linkraft preflight ready
Call `preflight_readiness`. Ship readiness checks only.

## What It Checks

### Security (score/10)
- Hardcoded secrets (Stripe keys, GitHub tokens, JWTs, passwords)
- API routes missing auth checks
- API routes missing rate limiting
- Fail-open patterns (catch blocks that return success)
- dangerouslySetInnerHTML (XSS risk)
- SQL injection vectors (template literals in queries)
- Server-side env vars in client files
- Missing RLS policies (Supabase projects)

### Health (score/100)
- Console.log count
- TypeScript `any` count
- Test file count vs source file ratio
- Largest file by line count
- TODO/FIXME count
- Empty catch blocks
- Source file count

### Ship Readiness (percentage)
- Error handling on API routes
- Loading states (Suspense, loading.tsx, isLoading)
- Empty states for lists/collections
- 404/not-found page
- Auth implementation
- Deploy config (vercel.json, Dockerfile, etc.)
- Env vars documented (.env.example)
- Favicon
- OG meta tags
- robots.txt
- TODOs and FIXMEs count

## The Chain

```
/linkraft plan        -> understand the project
/linkraft preflight   -> see what's wrong (YOU ARE HERE)
/linkraft sheep       -> fix what's wrong
```

After preflight, suggest `/linkraft sheep` to auto-fix issues.

## Available Tools

- `preflight_full`: all three scans, writes to .preflight/
- `preflight_security`: security scan only
- `preflight_health`: health metrics only
- `preflight_readiness`: ship readiness only

## Zero Config

No setup. No API keys. No MCPs. Just `/linkraft preflight`.
