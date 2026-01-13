# @conflux-devkit/core

Core helpers and shared types used across the Conflux DevKit monorepo.

This package consolidates:

- chain configuration (chain IDs, RPC defaults) used by frontend, backend, and utility packages.
- shared wallet/account helpers so every package derives addresses consistently.
- consensus helpers, serialization utilities, and environment-aware fallbacks.

## Usage

The package primarily exports functions and constants that other packages consume via workspace imports:

```ts
import { defineChainConfig, toCoreAddress } from '@conflux-devkit/core';
```

## Development

```bash
pnpm --filter @conflux-devkit/core build
pnpm --filter @conflux-devkit/core test
```

## Publishing

- Run `pnpm --filter @conflux-devkit/core build` to regenerate artifacts.
- Artifacts live under `packages/core/dist` and the package exposes both ESM and CJS entrypoints.
