# 🧩 Showcase Application - Component Architecture

## 📁 **Project Structure**

```
devkit/
├── packages/
│   ├── state-ui/                       # UI state management
│   ├── state-client/                   # Client state management
│   ├── state-server/                   # Server state management
│   ├── showcase-webapp/                # Main showcase application
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── DashboardLayout.tsx
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   └── Footer.tsx
│   │   │   │   ├── widgets/
│   │   │   │   │   ├── WorkspaceStatusWidget.tsx
│   │   │   │   │   ├── NodeManagementWidget.tsx
│   │   │   │   │   ├── WalletManagementWidget.tsx
│   │   │   │   │   └── NetworkManagementWidget.tsx
│   │   │   │   ├── hardhat/
│   │   │   │   │   ├── HardhatDeploymentSection.tsx
│   │   │   │   │   ├── ScriptDeploymentCard.tsx
│   │   │   │   │   ├── DeployedContractsList.tsx
│   │   │   │   │   └── DeploymentConfigModal.tsx
│   │   │   │   ├── contracts/
│   │   │   │   │   ├── ContractManagementSection.tsx
│   │   │   │   │   ├── ContractCard.tsx
│   │   │   │   │   ├── ContractInteractionModal.tsx
│   │   │   │   │   ├── MethodCallForm.tsx
│   │   │   │   │   └── EventMonitor.tsx
│   │   │   │   ├── logs/
│   │   │   │   │   ├── OperationLogsConsole.tsx
│   │   │   │   │   ├── LogEntry.tsx
│   │   │   │   │   ├── LogFilter.tsx
│   │   │   │   │   └── LogExport.tsx
│   │   │   │   └── common/
│   │   │   │       ├── StatusIndicator.tsx
│   │   │   │       ├── LoadingSpinner.tsx
│   │   │   │       ├── ErrorBoundary.tsx
│   │   │   │       └── Modal.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useWorkspaceStatus.ts
│   │   │   │   ├── useNodeManagement.ts
│   │   │   │   ├── useWalletManagement.ts
│   │   │   │   ├── useNetworkManagement.ts
│   │   │   │   ├── useHardhatIntegration.ts
│   │   │   │   ├── useContractManagement.ts
│   │   │   │   └── useOperationLogs.ts
│   │   │   ├── services/
│   │   │   │   ├── WorkspaceStatusService.ts
│   │   │   │   ├── NodeManagementService.ts
│   │   │   │   ├── WalletManagementService.ts
│   │   │   │   ├── NetworkManagementService.ts
│   │   │   │   ├── HardhatService.ts
│   │   │   │   ├── ContractService.ts
│   │   │   │   └── LoggingService.ts
│   │   │   ├── types/
│   │   │   │   ├── workspace.ts
│   │   │   │   ├── node.ts
│   │   │   │   ├── wallet.ts
│   │   │   │   ├── network.ts
│   │   │   │   ├── hardhat.ts
│   │   │   │   ├── contract.ts
│   │   │   │   └── logs.ts
│   │   │   ├── utils/
│   │   │   │   ├── formatters.ts
│   │   │   │   ├── validators.ts
│   │   │   │   ├── constants.ts
│   │   │   │   └── helpers.ts
│   │   │   ├── styles/
│   │   │   │   ├── globals.css
│   │   │   │   ├── components.css
│   │   │   │   └── themes.css
│   │   │   └── pages/
│   │   │       ├── Dashboard.tsx
│   │   │       ├── Settings.tsx
│   │   │       └── About.tsx
│   │   ├── public/
│   │   │   ├── icons/
│   │   │   ├── images/
│   │   │   └── favicon.ico
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.js
│   │   └── README.md
│   └── ...                            # Other devkit packages
├── showcase-planning/                  # Planning documents
└── ...                                # Other devkit files
```

## 📋 **Type Definitions**

### **Core Types**

```typescript
// types/contract.ts
export interface DeployedContract {
  id: string;
  name: string;
  address: string;
  abi: any[];
  bytecode: string;
  deployedBytecode: string;
  chainType: 'core' | 'evm';
  networkId: string;
  chainId: string | number;
  evmChainId?: string | number;
  network: NetworkConfig;
  methods: {
    read: ContractMethod[];
    write: ContractMethod[];
    events: ContractEvent[];
  };
  capabilities: ContractCapabilities;
  metadata?: ContractMetadata;
  deployment?: ContractDeployment;
  ui?: ContractUI;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractMethod {
  name: string;
  type: 'read' | 'write';
  inputs: ContractInput[];
  outputs: ContractOutput[];
  stateMutability: 'view' | 'pure' | 'nonpayable' | 'payable';
  payable?: boolean;
  constant?: boolean;
}

export interface ContractInput {
  name: string;
  type: string;
  internalType?: string;
  indexed?: boolean;
}

export interface ContractOutput {
  name: string;
  type: string;
  internalType?: string;
}

export interface ContractEvent {
  name: string;
  inputs: ContractInput[];
  anonymous: boolean;
}

export interface ContractCapabilities {
  read: boolean;
  write: boolean;
  events: boolean;
  canRead?: boolean;
  canWrite?: boolean;
  hasEvents?: boolean;
  canReceive?: boolean;
  canFallback?: boolean;
  isUpgradeable?: boolean;
  isPausable?: boolean;
  isOwnable?: boolean;
}

export interface ContractMetadata {
  name?: string;
  version?: string;
  description?: string;
  author?: string;
  license?: string;
  source?: string;
  tags?: string[];
  category?: string;
  icon?: string;
  color?: string;
  website?: string;
  documentation?: string;
}

export interface ContractDeployment {
  transactionHash?: string;
  blockNumber?: string;
  gasUsed?: string;
  deployedAt?: string;
  isVerified?: boolean;
  verificationStatus?: string;
}

export interface ContractUI {
  displayName?: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  tags?: string[];
  isActive?: boolean;
  lastUsed?: string;
  usageCount?: number;
}

// types/workspace.ts
export type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface WorkspaceStatus {
  apiServer: ServiceStatus;
  stateServer: ServiceStatus;
  websocket: ServiceStatus;
  database: ServiceStatus;
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  isLoading: boolean;
}

// types/node.ts
export interface NodeStatus {
  isRunning: boolean;
  isStarting: boolean;
  isStopping: boolean;
  uptime: number;
  blockHeight: number;
  peerCount: number;
  health: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastHealthCheck: Date | null;
  error: string | null;
}

// types/wallet.ts
export interface WalletInfo {
  address: string;
  privateKey?: string;
  balance: string;
  balanceFormatted: string;
  isDefault?: boolean;
  name?: string;
  network?: string;
  type: 'internal' | 'browser';
  chainType: 'evm' | 'core';
}

export interface InternalWallet {
  evm: WalletInfo;
  core: WalletInfo;
}

// types/network.ts
export interface NetworkConfig {
  id: string;
  name: string;
  rpcUrl: string;
  chainId: string;
  evmChainId?: string;
  currency: {
    name: string;
    symbol: string;
    decimals: string;
  };
  isTestnet: boolean;
  networkType: 'core' | 'evm';
  blockExplorer?: string;
  icon?: string;
  color?: string;
}

// types/hardhat.ts
export interface HardhatScript {
  id: string;
  name: string;
  path: string;
  description?: string;
  parameters: ScriptParameter[];
  estimatedGas?: string;
  dependencies?: string[];
}

export interface ScriptParameter {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface DeployConfig {
  scriptId: string;
  parameters: Record<string, any>;
  gasLimit?: string;
  gasPrice?: string;
  value?: string;
  confirmations?: number;
}

// types/logs.ts
export interface OperationLog {
  id: string;
  timestamp: Date;
  category: 'node' | 'hardhat' | 'wallet' | 'network' | 'contract' | 'general';
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: any;
  source: string;
  userId?: string;
  sessionId?: string;
}

export type LogFilter =
  | 'all'
  | 'node'
  | 'hardhat'
  | 'wallet'
  | 'network'
  | 'contract'
  | 'general';
```

## 🔧 **Core Components Implementation**

### **1. DashboardLayout**

```typescript
// src/components/layout/DashboardLayout.tsx
import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useUIState } from '@conflux-devkit/state-ui';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarOpen, toggleSidebar } = useUIState();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onToggleSidebar={toggleSidebar} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
        <main className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        }`}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
```

### **2. WorkspaceStatusWidget**

```typescript
// src/components/widgets/WorkspaceStatusWidget.tsx
import React from 'react';
import { StatusIndicator } from '../common/StatusIndicator';
import { useWorkspaceStatus } from '../../hooks/useWorkspaceStatus';

export function WorkspaceStatusWidget() {
  const { status, isLoading, refresh } = useWorkspaceStatus();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          📊 Workspace Status
        </h3>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
        >
          {isLoading ? '🔄' : '🔄'} Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-3">
          <StatusIndicator status={status.apiServer} />
          <span className="text-sm font-medium">API Server</span>
        </div>
        <div className="flex items-center space-x-3">
          <StatusIndicator status={status.stateServer} />
          <span className="text-sm font-medium">State Server</span>
        </div>
        <div className="flex items-center space-x-3">
          <StatusIndicator status={status.websocket} />
          <span className="text-sm font-medium">WebSocket</span>
        </div>
        <div className="flex items-center space-x-3">
          <StatusIndicator status={status.database} />
          <span className="text-sm font-medium">Database</span>
        </div>
      </div>
    </div>
  );
}
```

### **3. NodeManagementWidget**

```typescript
// src/components/widgets/NodeManagementWidget.tsx
import React from 'react';
import { useNodeManagement } from '../../hooks/useNodeManagement';

export function NodeManagementWidget() {
  const {
    nodeStatus,
    isStarting,
    isStopping,
    startNode,
    stopNode,
    restartNode,
    configureNode
  } = useNodeManagement();

  const getStatusColor = () => {
    if (nodeStatus.isRunning) return 'text-green-600';
    if (isStarting) return 'text-yellow-600';
    if (isStopping) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusText = () => {
    if (nodeStatus.isRunning) return '🟢 Running';
    if (isStarting) return '🟡 Starting...';
    if (isStopping) return '🟠 Stopping...';
    return '🔴 Stopped';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🖥️ Node Management
        </h3>
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Uptime:</span>
            <span className="ml-2 font-mono">
              {nodeStatus.uptime ? `${nodeStatus.uptime}s` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Blocks:</span>
            <span className="ml-2 font-mono">
              {nodeStatus.blockHeight || '0'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Peers:</span>
            <span className="ml-2 font-mono">
              {nodeStatus.peerCount || '0'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Health:</span>
            <span className="ml-2">
              {nodeStatus.health || 'N/A'}
            </span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={startNode}
            disabled={nodeStatus.isRunning || isStarting}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ▶️ Start
          </button>
          <button
            onClick={stopNode}
            disabled={!nodeStatus.isRunning || isStopping}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⏹️ Stop
          </button>
          <button
            onClick={restartNode}
            disabled={!nodeStatus.isRunning || isStarting || isStopping}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔄 Restart
          </button>
          <button
            onClick={configureNode}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            ⚙️ Configure
          </button>
        </div>
      </div>
    </div>
  );
}
```

### **4. WalletManagementWidget**

```typescript
// src/components/widgets/WalletManagementWidget.tsx
import React from 'react';
import { useWalletManagement } from '../../hooks/useWalletManagement';

export function WalletManagementWidget() {
  const {
    internalWallet,
    browserWallet,
    activeWallet,
    isConnecting,
    connectBrowserWallet,
    disconnectBrowserWallet,
    switchWallet
  } = useWalletManagement();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          💼 Wallet Management
        </h3>
        <div className="text-sm text-gray-500">
          Active: {activeWallet === 'internal' ? 'Internal' : 'Browser'}
        </div>
      </div>

      <div className="space-y-4">
        {/* Internal Wallet */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">🔑 Internal Wallet</h4>
            <button
              onClick={() => switchWallet('internal')}
              className={`px-2 py-1 text-xs rounded ${
                activeWallet === 'internal'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {activeWallet === 'internal' ? 'Active' : 'Switch'}
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">EVM:</span>
              <span className="ml-2 font-mono text-xs">
                {internalWallet.evm.address}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Core:</span>
              <span className="ml-2 font-mono text-xs">
                {internalWallet.core.address}
              </span>
            </div>
          </div>
        </div>

        {/* Browser Wallet */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">🔗 Browser Wallet</h4>
            {browserWallet ? (
              <button
                onClick={() => switchWallet('browser')}
                className={`px-2 py-1 text-xs rounded ${
                  activeWallet === 'browser'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {activeWallet === 'browser' ? 'Active' : 'Switch'}
              </button>
            ) : (
              <button
                onClick={connectBrowserWallet}
                disabled={isConnecting}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
          {browserWallet ? (
            <div className="text-sm">
              <div>
                <span className="text-gray-500">Address:</span>
                <span className="ml-2 font-mono text-xs">
                  {browserWallet.address}
                </span>
              </div>
              <div className="mt-2">
                <button
                  onClick={disconnectBrowserWallet}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              No browser wallet connected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### **5. ContractCard**

```typescript
// src/components/contracts/ContractCard.tsx
import React, { useState } from 'react';
import { useContractBusinessLogic } from '@conflux-devkit/state-client';
import { ContractInteractionModal } from './ContractInteractionModal';

interface ContractCardProps {
  contract: DeployedContract;
  onRemove: () => void;
}

export function ContractCard({ contract, onRemove }: ContractCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<ContractMethod | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    methods,
    businessState,
    callReadMethod,
    callWriteMethod,
    loading,
    errors
  } = useContractBusinessLogic(contract);

  const handleMethodClick = async (method: ContractMethod) => {
    try {
      setError(null);
      setSelectedMethod(method);
      setIsModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleMethodExecute = async (method: ContractMethod, args: unknown[]) => {
    try {
      setIsLoading(true);
      setError(null);

      let result;
      if (method.type === 'read') {
        result = await callReadMethod(method.name, args);
      } else {
        result = await callWriteMethod(method.name, args);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    if (window.confirm(`Are you sure you want to remove ${contract.name}?`)) {
      onRemove();
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              🎯 {contract.name}
            </h3>
            <p className="text-sm text-gray-500 font-mono">
              {contract.address}
            </p>
            {contract.metadata?.description && (
              <p className="text-sm text-gray-600 mt-1">
                {contract.metadata.description}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {contract.ui?.isActive && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                Active
              </span>
            )}
            <button
              onClick={handleRemove}
              className="text-gray-400 hover:text-red-600 transition-colors"
              title="Remove contract"
            >
              ❌
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Read Methods */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              📖 Read Methods ({methods.read.length})
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {methods.read.map((method) => (
                <button
                  key={method.name}
                  onClick={() => handleMethodClick(method)}
                  disabled={loading.methods || isLoading}
                  className="block w-full text-left px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {method.name}()
                  {loading.methods && (
                    <span className="ml-2 text-blue-500">⏳</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Write Methods */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              ✏️ Write Methods ({methods.write.length})
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {methods.write.map((method) => (
                <button
                  key={method.name}
                  onClick={() => handleMethodClick(method)}
                  disabled={loading.methods || isLoading}
                  className="block w-full text-left px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {method.name}()
                  {loading.methods && (
                    <span className="ml-2 text-blue-500">⏳</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events */}
        {methods.events.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              📡 Events ({methods.events.length})
            </h4>
            <div className="flex flex-wrap gap-1">
              {methods.events.map((event) => (
                <span
                  key={event.name}
                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded"
                >
                  {event.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Business State */}
        {Object.keys(businessState).length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              📊 Business State
            </h4>
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
              <pre>{JSON.stringify(businessState, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Contract Info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <span className="font-medium">Network:</span> {contract.network.name}
            </div>
            <div>
              <span className="font-medium">Type:</span> {contract.chainType}
            </div>
            <div>
              <span className="font-medium">Created:</span> {contract.createdAt.toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Last Used:</span> {contract.ui?.lastUsed || 'Never'}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && selectedMethod && (
        <ContractInteractionModal
          contract={contract}
          method={selectedMethod}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMethod(null);
            setError(null);
          }}
          onExecute={handleMethodExecute}
          isLoading={isLoading}
          error={error}
        />
      )}
    </>
  );
}
```

### **6. OperationLogsConsole**

```typescript
// src/components/logs/OperationLogsConsole.tsx
import React, { useState } from 'react';
import { useOperationLogs } from '../../hooks/useOperationLogs';
import { LogEntry } from './LogEntry';
import { LogFilter } from './LogFilter';

export function OperationLogsConsole() {
  const { logs, activeFilter, setFilter, clearLogs, exportLogs } = useOperationLogs();
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredLogs = logs.filter(log => {
    if (activeFilter === 'all') return true;
    return log.category === activeFilter;
  });

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${
      isExpanded ? 'h-64' : 'h-16'
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-medium">📝 Operation Logs & Console</h3>
          <LogFilter
            activeFilter={activeFilter}
            onFilterChange={setFilter}
          />
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
          >
            {isExpanded ? '📉' : '📈'}
          </button>
          <button
            onClick={clearLogs}
            className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded"
          >
            🗑️ Clear
          </button>
          <button
            onClick={exportLogs}
            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
          >
            📤 Export
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="h-full overflow-y-auto p-4">
          <div className="space-y-1">
            {filteredLogs.map((log, index) => (
              <LogEntry key={index} log={log} />
            ))}
            {filteredLogs.length === 0 && (
              <div className="text-gray-400 text-sm text-center py-8">
                No logs available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

## 🔧 **Realistic Service Implementation**

### **WorkspaceStatusService**

```typescript
// src/services/WorkspaceStatusService.ts
export class WorkspaceStatusService {
  private static instance: WorkspaceStatusService;
  private status: WorkspaceStatus;
  private listeners: Set<(status: WorkspaceStatus) => void> = new Set();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.status = {
      apiServer: 'unknown',
      stateServer: 'unknown',
      websocket: 'unknown',
      database: 'unknown',
      overallStatus: 'unknown',
      lastCheck: new Date(),
      isLoading: false,
    };
  }

  static getInstance(): WorkspaceStatusService {
    if (!WorkspaceStatusService.instance) {
      WorkspaceStatusService.instance = new WorkspaceStatusService();
    }
    return WorkspaceStatusService.instance;
  }

  async checkServiceHealth(endpoint: string): Promise<ServiceStatus> {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      if (response.ok) {
        const data = await response.json();
        return data.status === 'healthy' ? 'healthy' : 'degraded';
      } else {
        return 'degraded';
      }
    } catch (error) {
      console.error(`Health check failed for ${endpoint}:`, error);
      return 'unhealthy';
    }
  }

  async checkWebSocketHealth(): Promise<ServiceStatus> {
    return new Promise(resolve => {
      const ws = new WebSocket('ws://localhost:3001/ws');
      const timeout = setTimeout(() => {
        ws.close();
        resolve('unhealthy');
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve('healthy');
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve('unhealthy');
      };
    });
  }

  async checkDatabaseHealth(): Promise<ServiceStatus> {
    try {
      const response = await fetch('/api/database/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      if (response.ok) {
        const data = await response.json();
        return data.status === 'healthy' ? 'healthy' : 'degraded';
      } else {
        return 'degraded';
      }
    } catch (error) {
      console.error('Database health check failed:', error);
      return 'unhealthy';
    }
  }

  async refreshStatus(): Promise<void> {
    this.status.isLoading = true;
    this.notifyListeners();

    try {
      const [apiStatus, stateStatus, wsStatus, dbStatus] = await Promise.all([
        this.checkServiceHealth('/api/health'),
        this.checkServiceHealth('/api/state/health'),
        this.checkWebSocketHealth(),
        this.checkDatabaseHealth(),
      ]);

      this.status = {
        apiServer: apiStatus,
        stateServer: stateStatus,
        websocket: wsStatus,
        database: dbStatus,
        overallStatus: this.calculateOverallStatus(
          apiStatus,
          stateStatus,
          wsStatus,
          dbStatus
        ),
        lastCheck: new Date(),
        isLoading: false,
      };

      this.notifyListeners();
    } catch (error) {
      console.error('Failed to refresh workspace status:', error);
      this.status.isLoading = false;
      this.status.overallStatus = 'unhealthy';
      this.notifyListeners();
    }
  }

  private calculateOverallStatus(
    api: ServiceStatus,
    state: ServiceStatus,
    ws: ServiceStatus,
    db: ServiceStatus
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = [api, state, ws, db];

    if (statuses.every(s => s === 'healthy')) {
      return 'healthy';
    } else if (statuses.some(s => s === 'unhealthy')) {
      return 'unhealthy';
    } else {
      return 'degraded';
    }
  }

  startHealthCheck(intervalMs: number = 30000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.refreshStatus();
    }, intervalMs);
  }

  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  subscribe(listener: (status: WorkspaceStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.status));
  }

  getStatus(): WorkspaceStatus {
    return { ...this.status };
  }
}
```

## 🔗 **Integration Hooks**

### **1. useWorkspaceStatus**

```typescript
// src/hooks/useWorkspaceStatus.ts
import { useState, useEffect } from 'react';
import { useClientState } from '@conflux-devkit/state-client';

export function useWorkspaceStatus() {
  const { isConnected, node, wallets, network } = useClientState();
  const [status, setStatus] = useState({
    apiServer: 'unknown' as ServiceStatus,
    stateServer: 'unknown' as ServiceStatus,
    websocket: 'unknown' as ServiceStatus,
    database: 'unknown' as ServiceStatus,
  });
  const [isLoading, setIsLoading] = useState(false);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      // Check API server
      const apiStatus = await checkServiceHealth('/api/health');

      // Check state server
      const stateStatus = await checkServiceHealth('/api/state/health');

      // Check WebSocket
      const wsStatus = await checkWebSocketHealth();

      // Check database
      const dbStatus = await checkDatabaseHealth();

      setStatus({
        apiServer: apiStatus,
        stateServer: stateStatus,
        websocket: wsStatus,
        database: dbStatus,
      });
    } catch (error) {
      console.error('Failed to check workspace status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return {
    status,
    isLoading,
    refresh: checkStatus,
  };
}
```

### **2. useNodeManagement**

```typescript
// src/hooks/useNodeManagement.ts
import { useState, useEffect } from 'react';
import { useClientState } from '@conflux-devkit/state-client';

export function useNodeManagement() {
  const { node, startNode, stopNode, restartNode } = useClientState();
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const handleStartNode = async () => {
    setIsStarting(true);
    try {
      await startNode();
    } catch (error) {
      console.error('Failed to start node:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopNode = async () => {
    setIsStopping(true);
    try {
      await stopNode();
    } catch (error) {
      console.error('Failed to stop node:', error);
    } finally {
      setIsStopping(false);
    }
  };

  const handleRestartNode = async () => {
    setIsStarting(true);
    try {
      await restartNode();
    } catch (error) {
      console.error('Failed to restart node:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const configureNode = () => {
    // Open node configuration modal
    console.log('Configure node');
  };

  return {
    nodeStatus: node,
    isStarting,
    isStopping,
    startNode: handleStartNode,
    stopNode: handleStopNode,
    restartNode: handleRestartNode,
    configureNode,
  };
}
```

## 🎨 **Styling & Theming**

### **Tailwind Configuration**

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        conflux: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1e40af',
          700: '#1d4ed8',
          800: '#1e3a8a',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

### **Global Styles**

```css
/* src/styles/globals.css */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

@layer base {
  html {
    font-family: 'Inter', system-ui, sans-serif;
  }

  code {
    font-family: 'JetBrains Mono', monospace;
  }
}

@layer components {
  .status-indicator {
    @apply w-3 h-3 rounded-full;
  }

  .status-indicator.healthy {
    @apply bg-green-500;
  }

  .status-indicator.degraded {
    @apply bg-yellow-500;
  }

  .status-indicator.unhealthy {
    @apply bg-red-500;
  }

  .log-entry {
    @apply text-xs font-mono;
  }

  .log-entry.info {
    @apply text-blue-400;
  }

  .log-entry.warning {
    @apply text-yellow-400;
  }

  .log-entry.error {
    @apply text-red-400;
  }

  .log-entry.success {
    @apply text-green-400;
  }
}
```

## 🚀 **Getting Started Implementation**

### **1. Create Project Structure**

```bash
# Create showcase directory
mkdir showcase-webapp
cd showcase-webapp

# Initialize package.json
npm init -y

# Install dependencies
npm install @conflux-devkit/state-ui @conflux-devkit/state-client
npm install react react-dom @types/react @types/react-dom
npm install tailwindcss @tailwindcss/forms
npm install @headlessui/react @heroicons/react
npm install zustand immer
npm install -D typescript @types/node
```

### **2. Set up TypeScript**

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

### **3. Create Main App**

```typescript
// src/App.tsx
import React from 'react';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
}

export default App;
```

### **4. Create Dashboard Page**

```typescript
// src/pages/Dashboard.tsx
import React from 'react';
import { WorkspaceStatusWidget } from '../components/widgets/WorkspaceStatusWidget';
import { NodeManagementWidget } from '../components/widgets/NodeManagementWidget';
import { WalletManagementWidget } from '../components/widgets/WalletManagementWidget';
import { NetworkManagementWidget } from '../components/widgets/NetworkManagementWidget';
import { HardhatDeploymentSection } from '../components/hardhat/HardhatDeploymentSection';
import { ContractManagementSection } from '../components/contracts/ContractManagementSection';

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <WorkspaceStatusWidget />
        <NodeManagementWidget />
        <WalletManagementWidget />
        <NetworkManagementWidget />
      </div>

      <HardhatDeploymentSection />
      <ContractManagementSection />
    </div>
  );
}
```

This comprehensive component architecture provides a solid foundation for building the showcase application. Each component is designed to be modular, reusable, and easily testable, following React best practices and modern development patterns.
