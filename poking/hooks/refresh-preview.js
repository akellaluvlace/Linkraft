#!/usr/bin/env node

// Hook: After Claude saves a file referenced by a poke selection,
// the preview auto-refreshes via the dev server's HMR.
// This hook is a placeholder for custom refresh logic if needed.

process.stderr.write('[poking] File saved, preview will refresh via HMR.\n');
