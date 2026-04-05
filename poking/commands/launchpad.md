---
name: launchpad
description: Plan, build, test, and distribute landing pages end-to-end
---

# /launchpad

Full pipeline for launching landing pages.

## Subcommands

### /launchpad plan [product description]
Generate planning documents: brief, wireframe, copy, SEO config. Saved to .launchpad/.

### /launchpad build
Build the landing page from planning documents. Uses Forge preset + MCPancake components.

### /launchpad test [url]
Run quality checks: Lighthouse performance, responsive screenshots, CTA visibility.

### /launchpad distribute
Generate distribution drafts for LinkedIn, Twitter, Product Hunt, Reddit, and email.

### /launchpad status
Show which pipeline phases are complete.
