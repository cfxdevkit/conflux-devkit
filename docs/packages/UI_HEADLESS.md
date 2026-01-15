# @conflux-devkit/ui-headless

**Version:** 1.0.0  
**Status:** New Package  
**Type:** Component Library

## Purpose
Headless React components for Conflux applications. Provides behavior without styling, allowing full customization with any CSS framework.

## Key Features
- **Render Props Pattern**: Full control over rendering
- **Hooks**: Reusable blockchain operation hooks
- **Framework Agnostic**: Works with Tailwind, Styled Components, etc.
- **TypeScript**: Full type safety

## Exports
```typescript
// Hooks
import { 
  useBalance,
  useTransaction,
  useContract 
} from '@conflux-devkit/ui-headless';

// Headless Components
import {
  BalanceDisplay,
  TransactionForm,
  ContractInteraction
} from '@conflux-devkit/ui-headless';
```

## Usage Example
```typescript
import { useBalance } from '@conflux-devkit/ui-headless';

function MyBalanceComponent() {
  const { balance, loading, error } = useBalance(address);
  
  // Render with your own styling
  return (
    <div className="my-custom-styles">
      {loading ? 'Loading...' : `${balance} CFX`}
    </div>
  );
}
```

## Status
Core hooks and component structure implemented. Additional components to be added based on common use cases.
