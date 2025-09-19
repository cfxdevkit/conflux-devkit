# 🏗️ Contract Business Logic System

The Contract Business Logic System provides a comprehensive solution for managing smart contract interactions with automatic template generation, business state management, and React hooks integration.

## 🎯 **Overview**

This system automatically generates business logic stores and React hooks for any smart contract, allowing developers to:

- **Generate Templates**: Automatically create contract-specific components and hooks
- **Manage Business State**: Handle contract-specific business logic and state
- **React Integration**: Use specialized hooks for different contract operations
- **Event Handling**: Subscribe to and handle contract events
- **Error Management**: Comprehensive error handling and loading states

## 🚀 **Quick Start**

### 1. Basic Usage

```typescript
import { useContractBusinessLogic } from '@conflux-devkit/state-client';

function MyContractComponent({ contract }: { contract: ClientContractOrchestrator }) {
  const {
    methods,
    calls,
    events,
    callReadMethod,
    callWriteMethod,
    subscribeToEvent,
    setBusinessState,
  } = useContractBusinessLogic(contract);

  // Use the contract methods
  const handleGetBalance = async (address: string) => {
    const balance = await callReadMethod('balanceOf', [address]);
    console.log('Balance:', balance);
  };

  return (
    <div>
      <h2>{contract.name}</h2>
      <p>Address: {contract.address}</p>
      {/* Your UI components */}
    </div>
  );
}
```

### 2. Generate Contract Template

```typescript
import { ContractTemplateGenerator } from '@conflux-devkit/state-client';

const generator = new ContractTemplateGenerator({
  componentName: 'MyTokenContract',
  includeTypes: true,
  includeTests: true,
  includeDocumentation: true,
  includeBusinessLogic: true,
  includeEventHandlers: true,
  includeStateManagement: true,
  includeUI: true,
  uiFramework: 'react',
  useTypeScript: true,
  useHooks: true,
  useContext: false,
  includeErrorHandling: true,
  includeLoadingStates: true,
  includeCaching: false,
  includeValidation: true,
});

// Generate single file
const { filename, content } = generator.generateFile(contract);

// Generate multiple files
const files = generator.generateMultipleFiles(contract);
```

## 📚 **API Reference**

### Core Hooks

#### `useContractBusinessLogic(contract)`

Main hook for contract business logic management.

```typescript
const {
  // Contract info
  contract,
  methods,

  // Call states
  calls,
  activeCall,

  // Event states
  events,
  eventFilters,

  // Business logic state
  businessState,

  // Configuration
  config,

  // Actions
  callReadMethod,
  callWriteMethod,
  subscribeToEvent,
  unsubscribeFromEvent,
  getEventHistory,
  getCallHistory,
  retryCall,
  clearCallHistory,
  setBusinessState,
  getBusinessState,
  resetBusinessState,
  updateConfig,
  setError,
  clearError,
  clearAllErrors,
  refreshContract,
  reset,
} = useContractBusinessLogic(contract);
```

#### `useContractReadMethods(contract)`

Specialized hook for read operations.

```typescript
const {
  readMethods,
  callMethod,
  getMethodCalls,
  isMethodLoading,
  calls,
  loading,
  errors,
} = useContractReadMethods(contract);
```

#### `useContractWriteMethods(contract)`

Specialized hook for write operations.

```typescript
const {
  writeMethods,
  callMethod,
  getMethodCalls,
  isMethodLoading,
  calls,
  loading,
  errors,
} = useContractWriteMethods(contract);
```

#### `useContractEvents(contract)`

Specialized hook for event management.

```typescript
const {
  events,
  eventStates,
  eventFilters,
  subscribeToEvent,
  unsubscribeFromEvent,
  getEventHistory,
  useEventSubscription,
  getEventsByName,
  isEventSubscribed,
  loading,
  errors,
} = useContractEvents(contract);
```

#### `useContractBusinessState(contract)`

Specialized hook for business state management.

```typescript
const {
  businessState,
  setBusinessState,
  getBusinessState,
  resetBusinessState,
  setMultipleBusinessState,
  getMultipleBusinessState,
} = useContractBusinessState(contract);
```

### Template Generator

#### `ContractTemplateGenerator`

Generate contract-specific templates and components.

```typescript
const generator = new ContractTemplateGenerator({
  componentName: 'MyContract',
  includeTypes: true,
  includeTests: false,
  includeDocumentation: true,
  includeBusinessLogic: true,
  includeEventHandlers: true,
  includeStateManagement: true,
  includeUI: true,
  uiFramework: 'react',
  useTypeScript: true,
  useHooks: true,
  useContext: false,
  includeErrorHandling: true,
  includeLoadingStates: true,
  includeCaching: false,
  includeValidation: true,
});
```

## 🏗️ **Architecture**

### Contract Business Logic Store

Each contract gets its own business logic store that manages:

- **Method States**: Read, write, and event methods
- **Call States**: History and status of method calls
- **Event States**: Subscribed events and their data
- **Business State**: Custom business logic state
- **Loading States**: Loading indicators for operations
- **Error States**: Error handling and management
- **Configuration**: Contract-specific settings

### Template Generation

The system automatically generates:

- **React Components**: Complete contract interaction components
- **Custom Hooks**: Specialized hooks for different operations
- **Type Definitions**: TypeScript types for contract methods
- **Business Logic**: Customizable business logic classes
- **Event Handlers**: Event subscription and handling
- **Error Handling**: Comprehensive error management
- **Loading States**: Loading indicators and states
- **Tests**: Unit tests for generated components
- **Documentation**: Comprehensive documentation

## 📝 **Examples**

### ERC20 Token Contract

```typescript
import { useContractBusinessLogic } from '@conflux-devkit/state-client';

function ERC20TokenComponent({ contract }: { contract: ClientContractOrchestrator }) {
  const {
    callReadMethod,
    callWriteMethod,
    subscribeToEvent,
    setBusinessState,
    businessState,
  } = useContractBusinessLogic(contract);

  // Token information
  const tokenInfo = {
    name: businessState.tokenName as string,
    symbol: businessState.tokenSymbol as string,
    decimals: businessState.tokenDecimals as number,
    totalSupply: businessState.totalSupply as string,
  };

  // User's balance
  const userBalance = businessState.userBalance as string;

  // Read methods
  const handleGetBalance = async (address: string) => {
    const balance = await callReadMethod('balanceOf', [address]);
    setBusinessState('userBalance', balance.toString());
    return balance;
  };

  const handleGetTotalSupply = async () => {
    const totalSupply = await callReadMethod('totalSupply', []);
    setBusinessState('totalSupply', totalSupply.toString());
    return totalSupply;
  };

  // Write methods
  const handleTransfer = async (to: string, amount: string) => {
    const txHash = await callWriteMethod('transfer', [to, amount]);
    console.log('Transfer transaction:', txHash);
    return txHash;
  };

  const handleApprove = async (spender: string, amount: string) => {
    const txHash = await callWriteMethod('approve', [spender, amount]);
    console.log('Approve transaction:', txHash);
    return txHash;
  };

  // Event subscriptions
  subscribeToEvent('Transfer', {
    from: userAddress, // Filter for user's transfers
  });

  subscribeToEvent('Approval', {
    owner: userAddress, // Filter for user's approvals
  });

  return (
    <div>
      <h2>{tokenInfo.name} ({tokenInfo.symbol})</h2>
      <p>Balance: {userBalance}</p>
      <button onClick={() => handleGetBalance(userAddress)}>
        Refresh Balance
      </button>
    </div>
  );
}
```

### NFT Contract

```typescript
function NFTContractComponent({ contract }: { contract: ClientContractOrchestrator }) {
  const {
    callReadMethod,
    callWriteMethod,
    subscribeToEvent,
    setBusinessState,
    businessState,
  } = useContractBusinessLogic(contract);

  // NFT information
  const nftInfo = {
    name: businessState.name as string,
    symbol: businessState.symbol as string,
    totalSupply: businessState.totalSupply as string,
    maxSupply: businessState.maxSupply as string,
  };

  // User's NFTs
  const userNFTs = businessState.userNFTs as string[];

  // Read methods
  const handleGetBalance = async (address: string) => {
    const balance = await callReadMethod('balanceOf', [address]);
    return balance;
  };

  const handleGetTokenURI = async (tokenId: string) => {
    const uri = await callReadMethod('tokenURI', [tokenId]);
    return uri;
  };

  // Write methods
  const handleMint = async (to: string, tokenId: string) => {
    const txHash = await callWriteMethod('mint', [to, tokenId]);
    console.log('Mint transaction:', txHash);
    return txHash;
  };

  const handleTransfer = async (from: string, to: string, tokenId: string) => {
    const txHash = await callWriteMethod('transferFrom', [from, to, tokenId]);
    console.log('Transfer transaction:', txHash);
    return txHash;
  };

  // Event subscriptions
  subscribeToEvent('Transfer', {
    from: userAddress, // Filter for user's transfers
  });

  subscribeToEvent('Mint', {
    to: userAddress, // Filter for user's mints
  });

  return (
    <div>
      <h2>{nftInfo.name} ({nftInfo.symbol})</h2>
      <p>Total Supply: {nftInfo.totalSupply}</p>
      <p>User NFTs: {userNFTs.length}</p>
    </div>
  );
}
```

## 🔧 **Configuration**

### Template Options

```typescript
interface ContractTemplateOptions {
  // Template customization
  componentName?: string;
  includeTypes?: boolean;
  includeTests?: boolean;
  includeDocumentation?: boolean;

  // Business logic customization
  includeBusinessLogic?: boolean;
  includeEventHandlers?: boolean;
  includeStateManagement?: boolean;

  // UI customization
  includeUI?: boolean;
  uiFramework?: 'react' | 'vue' | 'angular' | 'vanilla';

  // Code style
  useTypeScript?: boolean;
  useHooks?: boolean;
  useContext?: boolean;

  // Additional features
  includeErrorHandling?: boolean;
  includeLoadingStates?: boolean;
  includeCaching?: boolean;
  includeValidation?: boolean;
}
```

### Contract Configuration

```typescript
interface ContractConfig {
  autoRefresh: boolean;
  refreshInterval: number;
  maxCalls: number;
  maxEvents: number;
  gasLimit?: string;
  gasPrice?: string;
}
```

## 🎨 **Best Practices**

### 1. Contract-Specific Business Logic

```typescript
// Create contract-specific business logic
const useERC20BusinessLogic = (contract: ClientContractOrchestrator) => {
  const { setBusinessState, getBusinessState } =
    useContractBusinessState(contract);

  const updateTokenInfo = async () => {
    // Fetch and update token information
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      callReadMethod('name', []),
      callReadMethod('symbol', []),
      callReadMethod('decimals', []),
      callReadMethod('totalSupply', []),
    ]);

    setBusinessState('tokenInfo', { name, symbol, decimals, totalSupply });
  };

  const updateUserBalance = async (address: string) => {
    const balance = await callReadMethod('balanceOf', [address]);
    setBusinessState('userBalance', balance.toString());
  };

  return {
    updateTokenInfo,
    updateUserBalance,
    tokenInfo: getBusinessState('tokenInfo'),
    userBalance: getBusinessState('userBalance'),
  };
};
```

### 2. Event Handling

```typescript
// Handle contract events
const useContractEventHandlers = (contract: ClientContractOrchestrator) => {
  const { subscribeToEvent, unsubscribeFromEvent } =
    useContractEvents(contract);

  useEffect(() => {
    // Subscribe to events
    subscribeToEvent('Transfer', { from: userAddress });
    subscribeToEvent('Approval', { owner: userAddress });

    return () => {
      // Cleanup subscriptions
      unsubscribeFromEvent('Transfer');
      unsubscribeFromEvent('Approval');
    };
  }, [userAddress]);
};
```

### 3. Error Handling

```typescript
// Comprehensive error handling
const useContractErrorHandling = (contract: ClientContractOrchestrator) => {
  const { errors, setError, clearError, clearAllErrors } =
    useContractErrors(contract);

  const handleMethodError = (methodName: string, error: Error) => {
    setError('calls', methodName, error.message);

    // Log error for debugging
    console.error(`Contract method ${methodName} failed:`, error);

    // Show user-friendly error message
    showNotification('error', `Failed to call ${methodName}`, error.message);
  };

  return {
    errors,
    handleMethodError,
    clearError,
    clearAllErrors,
  };
};
```

## 🚀 **Advanced Features**

### 1. Custom Business Logic Classes

```typescript
class ERC20BusinessLogic {
  private contract: ClientContractOrchestrator;
  private businessState: Map<string, unknown> = new Map();

  constructor(contract: ClientContractOrchestrator) {
    this.contract = contract;
  }

  async processTransfer(from: string, to: string, amount: string) {
    // Custom business logic for transfers
    const transferData = {
      from,
      to,
      amount,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    this.businessState.set('lastTransfer', transferData);

    // Add additional processing logic
    await this.validateTransfer(transferData);
    await this.updateTransferHistory(transferData);

    return transferData;
  }

  private async validateTransfer(transferData: any) {
    // Custom validation logic
    if (transferData.amount <= 0) {
      throw new Error('Invalid transfer amount');
    }
  }

  private async updateTransferHistory(transferData: any) {
    // Update transfer history
    const history = (this.businessState.get('transferHistory') as any[]) || [];
    history.push(transferData);
    this.businessState.set('transferHistory', history);
  }
}
```

### 2. Contract State Management

```typescript
// Advanced state management
const useContractStateManagement = (contract: ClientContractOrchestrator) => {
  const { businessState, setBusinessState, getBusinessState } =
    useContractBusinessState(contract);

  // State selectors
  const selectors = {
    tokenInfo: () => getBusinessState('tokenInfo'),
    userBalance: () => getBusinessState('userBalance'),
    transferHistory: () => getBusinessState('transferHistory') || [],
    lastTransfer: () => getBusinessState('lastTransfer'),
  };

  // State actions
  const actions = {
    updateTokenInfo: (info: any) => setBusinessState('tokenInfo', info),
    updateUserBalance: (balance: string) =>
      setBusinessState('userBalance', balance),
    addTransfer: (transfer: any) => {
      const history = selectors.transferHistory();
      setBusinessState('transferHistory', [...history, transfer]);
    },
    clearHistory: () => setBusinessState('transferHistory', []),
  };

  return {
    selectors,
    actions,
    state: businessState,
  };
};
```

## 🔍 **Troubleshooting**

### Common Issues

1. **Contract Not Found**: Ensure the contract address is valid and the contract is deployed
2. **Method Not Found**: Check that the method name exists in the contract ABI
3. **Event Subscription Failed**: Verify the event name and parameters match the contract
4. **State Not Updating**: Check that the business state is being set correctly

### Debug Mode

```typescript
// Enable debug mode for contract operations
const { callReadMethod, callWriteMethod } = useContractBusinessLogic(contract);

// Debug read method calls
const debugCallRead = async (methodName: string, args: unknown[]) => {
  console.log(`Calling read method: ${methodName}`, args);
  try {
    const result = await callReadMethod(methodName, args);
    console.log(`Read method result:`, result);
    return result;
  } catch (error) {
    console.error(`Read method error:`, error);
    throw error;
  }
};
```

## 📚 **Additional Resources**

- [Contract ABI Documentation](https://docs.ethers.io/v5/api/utils/abi/)
- [React Hooks Guide](https://reactjs.org/docs/hooks-intro.html)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.
