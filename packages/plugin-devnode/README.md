# @conflux-devkit/plugin-devnode

Utility scripts and plugins that orchestrate the local Conflux development node.

## What's inside

- wrappers around `@xcfx/node` for bootstrapping a local Core + eSpace dev environment.
- helpers for mining, funding, and cleanup so the backend can control the node lifecycle.
- configuration defaults tuned for the DevKit workspace.

## Running

```bash
pnpm --filter @conflux-devkit/plugin-devnode build
pnpm --filter @conflux-devkit/plugin-devnode test
```

## When to use

Import the exported server manager or node helpers from other packages to spawn a controlled Conflux node in automated tests or the backend.
