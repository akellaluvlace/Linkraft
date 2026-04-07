---
name: linkraft
description: Claude Code plugin for project analysis, preflight checks, and autonomous QA.
---

# /linkraft

Three modes for your development lifecycle.

## Modes

### /linkraft plan
Before you build. Scans your project, generates CLAUDE.md, analyzes competitors, reviews architecture, produces 10-12 planning documents.

### /linkraft preflight
Before you ship. 60-second read-only scan: security (0-10), health (0-100), ship readiness (0-100%). No fixes, no commits.

### /linkraft sheep
After you build. Auto-configuring QA agent that hunts bugs, fixes what's safe, commits, writes a narrative report, and generates social content.

## The Chain

```
/linkraft plan               # understand the project
/linkraft preflight           # see what's wrong (60 sec)
/linkraft sheep              # fix what's wrong (autonomous)
```
