import { useState } from 'react';
import { WorkspaceStatusWidget } from '../components/widgets/WorkspaceStatusWidget';
import { NodeManagementWidget } from '../components/widgets/NodeManagementWidget';
import { WalletManagementWidget } from '../components/widgets/WalletManagementWidget';
import { NetworkManagementWidget } from '../components/widgets/NetworkManagementWidget';
import { HardhatDeploymentSection } from '../components/hardhat/HardhatDeploymentSection';
import { ContractManagementSection } from '../components/contracts/ContractManagementSection';
import { OperationLogsConsole } from '../components/logs/OperationLogsConsole';
import { useWorkspaceStatus } from '../hooks/useWorkspaceStatus';
import { useNodeStatus } from '../hooks/useNodeStatus';
import type { InternalWallet, WalletInfo } from '../types/wallet';
import type { NetworkConfig } from '../types/network';
import type { HardhatScript } from '../types/hardhat';
import type { DeployedContract } from '../types/contract';
import type { OperationLog, LogFilter } from '../types/logs';

export function Dashboard() {
  // Real API integration
  const { status: workspaceStatus, refreshStatus: refreshWorkspaceStatus } = useWorkspaceStatus();
  const { status: nodeStatus, startNode, stopNode, restartNode, isOperationLoading } = useNodeStatus();

  const [internalWallet] = useState<InternalWallet>({
    evm: {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      balance: '1000000000000000000',
      balanceFormatted: '1.0 CFX',
      type: 'internal',
      chainType: 'evm',
    },
    core: {
      address: 'cfx:aak7fsws4u4yf38fk870218p1h3gxut3ku00u1k1da',
      balance: '5000000000000000000',
      balanceFormatted: '5.0 CFX',
      type: 'internal',
      chainType: 'core',
    },
  });

  const [browserWallet] = useState<WalletInfo | null>({
    address: '0x9876543210fedcba9876543210fedcba98765432',
    balance: '2500000000000000000',
    balanceFormatted: '2.5 CFX',
    type: 'browser',
    chainType: 'evm',
    network: 'Conflux Testnet',
  });

  const [activeWallet, setActiveWallet] = useState<'internal' | 'browser'>('internal');
  const [isConnecting, setIsConnecting] = useState(false);

  const [currentNetwork] = useState<NetworkConfig>({
    id: 'conflux-testnet',
    name: 'Conflux Testnet',
    rpcUrl: 'https://test.confluxrpc.com',
    chainId: '1',
    evmChainId: '71',
    currency: {
      name: 'Conflux',
      symbol: 'CFX',
      decimals: '18',
    },
    isTestnet: true,
    networkType: 'core',
    blockExplorer: 'https://testnet.confluxscan.io',
  });

  const [availableNetworks] = useState<NetworkConfig[]>([
    currentNetwork,
    {
      id: 'conflux-mainnet',
      name: 'Conflux Mainnet',
      rpcUrl: 'https://main.confluxrpc.com',
      chainId: '1029',
      evmChainId: '1030',
      currency: { name: 'Conflux', symbol: 'CFX', decimals: '18' },
      isTestnet: false,
      networkType: 'core',
    },
    {
      id: 'localhost',
      name: 'Localhost',
      rpcUrl: 'http://localhost:12537',
      chainId: '999',
      currency: { name: 'Conflux', symbol: 'CFX', decimals: '18' },
      isTestnet: true,
      networkType: 'core',
    },
  ]);

  const [availableScripts] = useState<HardhatScript[]>([
    {
      id: 'erc20-token',
      name: 'ERC20 Token',
      path: './scripts/deploy-erc20.js',
      description: 'Deploy a standard ERC20 token contract',
      parameters: [
        { name: 'name', type: 'string', required: true, defaultValue: 'MyToken' },
        { name: 'symbol', type: 'string', required: true, defaultValue: 'MTK' },
        { name: 'totalSupply', type: 'uint256', required: true, defaultValue: '1000000' },
      ],
      estimatedGas: '2,500,000',
    },
    {
      id: 'nft-contract',
      name: 'NFT Contract',
      path: './scripts/deploy-nft.js',
      description: 'Deploy an ERC721 NFT contract',
      parameters: [
        { name: 'name', type: 'string', required: true, defaultValue: 'MyNFT' },
        { name: 'symbol', type: 'string', required: true, defaultValue: 'MNFT' },
      ],
      estimatedGas: '3,200,000',
    },
  ]);

  const [deployedContracts] = useState<DeployedContract[]>([
    {
      id: 'contract-1',
      name: 'MyToken',
      address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      abi: [],
      bytecode: '',
      deployedBytecode: '',
      chainType: 'evm',
      networkId: 'conflux-testnet',
      chainId: '71',
      network: currentNetwork,
      methods: {
        read: [
          { name: 'name', type: 'read', inputs: [], outputs: [{ name: '', type: 'string' }], stateMutability: 'view' },
          { name: 'symbol', type: 'read', inputs: [], outputs: [{ name: '', type: 'string' }], stateMutability: 'view' },
          { name: 'totalSupply', type: 'read', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
          { name: 'balanceOf', type: 'read', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
        ],
        write: [
          { name: 'transfer', type: 'write', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' },
          { name: 'approve', type: 'write', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' },
        ],
        events: [
          { name: 'Transfer', inputs: [{ name: 'from', type: 'address', indexed: true }, { name: 'to', type: 'address', indexed: true }, { name: 'value', type: 'uint256' }], anonymous: false },
          { name: 'Approval', inputs: [{ name: 'owner', type: 'address', indexed: true }, { name: 'spender', type: 'address', indexed: true }, { name: 'value', type: 'uint256' }], anonymous: false },
        ],
      },
      capabilities: { read: true, write: true, events: true },
      metadata: { description: 'A standard ERC20 token for testing', category: 'Token' },
      deployment: { isVerified: true, transactionHash: '0x123...', deployedAt: new Date().toISOString() },
      ui: { isActive: true, usageCount: 15 },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const [logs, setLogs] = useState<OperationLog[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 300000),
      category: 'node',
      level: 'info',
      message: 'Conflux node started successfully on port 12537',
      source: 'NodeManager',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 240000),
      category: 'wallet',
      level: 'success',
      message: 'Connected browser wallet: 0x9876...5432',
      source: 'WalletManager',
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 180000),
      category: 'hardhat',
      level: 'info',
      message: 'Deploying ERC20 contract with name: MyToken',
      source: 'HardhatDeployer',
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 120000),
      category: 'contract',
      level: 'success',
      message: 'Contract deployed successfully: 0xabcd...abcd',
      source: 'ContractManager',
      details: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', gasUsed: '2,345,678' },
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 60000),
      category: 'network',
      level: 'info',
      message: 'Switched to Conflux Testnet',
      source: 'NetworkManager',
    },
  ]);

  const [logFilter, setLogFilter] = useState<LogFilter>('all');
  const [isSwitching, setIsSwitching] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  // Event handlers
  const handleRefreshWorkspace = () => {
    console.log('Refreshing workspace status...');
    addLog('general', 'info', 'Refreshing workspace status...', 'Dashboard');
    refreshWorkspaceStatus();
  };

  const handleStartNode = async () => {
    try {
      console.log('Starting node...');
      addLog('node', 'info', 'Starting Conflux node...', 'NodeManager');
      await startNode();
      addLog('node', 'success', 'Conflux node started successfully', 'NodeManager');
    } catch (error) {
      console.error('Failed to start node:', error);
      addLog('node', 'error', `Failed to start node: ${error instanceof Error ? error.message : 'Unknown error'}`, 'NodeManager');
    }
  };

  const handleStopNode = async () => {
    try {
      console.log('Stopping node...');
      addLog('node', 'warning', 'Stopping Conflux node...', 'NodeManager');
      await stopNode();
      addLog('node', 'success', 'Conflux node stopped successfully', 'NodeManager');
    } catch (error) {
      console.error('Failed to stop node:', error);
      addLog('node', 'error', `Failed to stop node: ${error instanceof Error ? error.message : 'Unknown error'}`, 'NodeManager');
    }
  };

  const handleRestartNode = async () => {
    try {
      console.log('Restarting node...');
      addLog('node', 'info', 'Restarting Conflux node...', 'NodeManager');
      await restartNode();
      addLog('node', 'success', 'Conflux node restarted successfully', 'NodeManager');
    } catch (error) {
      console.error('Failed to restart node:', error);
      addLog('node', 'error', `Failed to restart node: ${error instanceof Error ? error.message : 'Unknown error'}`, 'NodeManager');
    }
  };

  const handleConfigureNode = () => {
    console.log('Configuring node...');
    addLog('node', 'info', 'Opening node configuration panel', 'NodeManager');
  };

  const handleConnectBrowser = () => {
    setIsConnecting(true);
    addLog('wallet', 'info', 'Attempting to connect browser wallet...', 'WalletManager');
    setTimeout(() => setIsConnecting(false), 2000);
  };

  const handleDisconnectBrowser = () => {
    addLog('wallet', 'info', 'Browser wallet disconnected', 'WalletManager');
  };

  const handleSwitchWallet = (type: 'internal' | 'browser') => {
    setActiveWallet(type);
    addLog('wallet', 'success', `Switched to ${type} wallet`, 'WalletManager');
  };

  const handleSwitchNetwork = (networkId: string) => {
    setIsSwitching(true);
    addLog('network', 'info', `Switching to network: ${networkId}`, 'NetworkManager');
    setTimeout(() => setIsSwitching(false), 1500);
  };

  const handleAddNetwork = () => {
    addLog('network', 'info', 'Opening add network dialog', 'NetworkManager');
  };

  const handleDeploy = (script: HardhatScript, _config: any) => {
    setIsDeploying(true);
    addLog('hardhat', 'info', `Deploying script: ${script.name}`, 'HardhatDeployer');
    setTimeout(() => {
      setIsDeploying(false);
      addLog('hardhat', 'success', `Script ${script.name} deployed successfully`, 'HardhatDeployer');
    }, 3000);
  };

  const handleViewContract = (contract: DeployedContract) => {
    addLog('contract', 'info', `Viewing contract: ${contract.name}`, 'ContractViewer');
  };

  const handleSelectContract = (contract: DeployedContract) => {
    addLog('contract', 'info', `Selected contract: ${contract.name}`, 'ContractManager');
  };

  const handleRemoveContract = (contractId: string) => {
    addLog('contract', 'warning', `Removed contract: ${contractId}`, 'ContractManager');
  };

  const handleExecuteMethod = (contract: DeployedContract, methodName: string, _args: any[]) => {
    addLog('contract', 'info', `Executing ${methodName} on ${contract.name}`, 'ContractExecutor');
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleExportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `operation-logs-${new Date().toISOString()}.json`;
    link.click();
    addLog('general', 'success', 'Logs exported successfully', 'LogExporter');
  };

  const addLog = (category: any, level: any, message: string, source: string) => {
    const newLog: OperationLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      category,
      level,
      message,
      source,
    };
    setLogs(prev => [...prev, newLog]);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <WorkspaceStatusWidget
            status={workspaceStatus}
            onRefresh={handleRefreshWorkspace}
          />
          <NodeManagementWidget
            nodeStatus={nodeStatus}
            onStart={handleStartNode}
            onStop={handleStopNode}
            onRestart={handleRestartNode}
            onConfigure={handleConfigureNode}
          />
          <WalletManagementWidget
            internalWallet={internalWallet}
            browserWallet={browserWallet}
            activeWallet={activeWallet}
            isConnecting={isConnecting}
            onConnectBrowser={handleConnectBrowser}
            onDisconnectBrowser={handleDisconnectBrowser}
            onSwitchWallet={handleSwitchWallet}
          />
          <NetworkManagementWidget
            currentNetwork={currentNetwork}
            availableNetworks={availableNetworks}
            isSwitching={isSwitching}
            onSwitchNetwork={handleSwitchNetwork}
            onAddNetwork={handleAddNetwork}
          />
        </div>

        <HardhatDeploymentSection
          availableScripts={availableScripts}
          deployedContracts={deployedContracts}
          isDeploying={isDeploying}
          onDeploy={handleDeploy}
          onViewContract={handleViewContract}
        />

        <ContractManagementSection
          contracts={deployedContracts}
          onSelectContract={handleSelectContract}
          onRemoveContract={handleRemoveContract}
          onExecuteMethod={handleExecuteMethod}
        />
      </div>

      <OperationLogsConsole
        logs={logs}
        activeFilter={logFilter}
        onFilterChange={setLogFilter}
        onClearLogs={handleClearLogs}
        onExportLogs={handleExportLogs}
      />
    </>
  );
}