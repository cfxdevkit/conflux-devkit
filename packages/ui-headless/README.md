# @conflux-devkit/ui-headless

A set of unstyled React hooks, providers, and utilities tailored to building Conflux experiences with your own design system.

Features:
- `DevKitProvider` establishes RPC endpoints for Core/eSpace chains and exposes the current wallet context.
- React hooks such as `useBalance`, `useContract`, and `useTransaction` that wrap the shared Conflux clients.
- Fully tree-shakeable exports so you only ship what you need.

## Getting started

```tsx
import { DevKitProvider, useBalance } from '@conflux-devkit/ui-headless';

const App = () => (
  <DevKitProvider apiUrl="http://localhost:3001" network="testnet">
    <YourComponent />
  </DevKitProvider>
);
```

## Development

```bash
pnpm --filter @conflux-devkit/ui-headless install
pnpm --filter @conflux-devkit/ui-headless build
pnpm --filter @conflux-devkit/ui-headless test
```

## Testing and linting

- Tests run with `vitest`.
- Formatting and linting use Biome.
