// ============================================================================
// ERC20 Contract Business Logic Example
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  useContractBusinessLogic,
  useContractReadMethods,
  useContractWriteMethods,
  useContractEvents,
  useContractBusinessState,
  ContractTemplateGenerator,
} from '@conflux-devkit/state-client';
import type { ClientContractOrchestrator } from '@conflux-devkit/state-client';

// ============================================================================
// ERC20 Contract Component
// ============================================================================

interface ERC20ContractProps {
  contract: ClientContractOrchestrator;
  onTransfer?: (from: string, to: string, amount: string) => void;
  onApproval?: (owner: string, spender: string, amount: string) => void;
}

export function ERC20ContractComponent({
  contract,
  onTransfer,
  onApproval,
}: ERC20ContractProps) {
  // Main contract business logic
  const {
    methods,
    calls,
    events: eventStates,
    businessState,
    callReadMethod,
    callWriteMethod,
    subscribeToEvent,
    unsubscribeFromEvent,
    setBusinessState,
  } = useContractBusinessLogic(contract);

  // Specialized hooks
  const { readMethods, callMethod: callRead } =
    useContractReadMethods(contract);
  const { writeMethods, callMethod: callWrite } =
    useContractWriteMethods(contract);
  const { events, useEventSubscription } = useContractEvents(contract);
  const { businessState: state, setBusinessState: setState } =
    useContractBusinessState(contract);

  // Local state for form inputs
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [approveSpender, setApproveSpender] = useState('');
  const [approveAmount, setApproveAmount] = useState('');

  // ============================================================================
  // ERC20 Specific Business Logic
  // ============================================================================

  // Token information
  const tokenInfo = {
    name: (state.tokenName as string) || 'Unknown Token',
    symbol: (state.tokenSymbol as string) || 'UNK',
    decimals: (state.tokenDecimals as number) || 18,
    totalSupply: (state.totalSupply as string) || '0',
  };

  // User's token balance
  const userBalance = (state.userBalance as string) || '0';
  const userAddress = (state.userAddress as string) || '';

  // ============================================================================
  // Read Methods
  // ============================================================================

  const handleGetBalance = async (address: string) => {
    try {
      const balance = await callRead('balanceOf', [address]);
      setState('userBalance', balance.toString());
      return balance;
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  };

  const handleGetAllowance = async (owner: string, spender: string) => {
    try {
      const allowance = await callRead('allowance', [owner, spender]);
      return allowance;
    } catch (error) {
      console.error('Error getting allowance:', error);
      throw error;
    }
  };

  const handleGetTotalSupply = async () => {
    try {
      const totalSupply = await callRead('totalSupply', []);
      setState('totalSupply', totalSupply.toString());
      return totalSupply;
    } catch (error) {
      console.error('Error getting total supply:', error);
      throw error;
    }
  };

  const handleGetTokenInfo = async () => {
    try {
      const [name, symbol, decimals] = await Promise.all([
        callRead('name', []),
        callRead('symbol', []),
        callRead('decimals', []),
      ]);

      setState('tokenName', name);
      setState('tokenSymbol', symbol);
      setState('tokenDecimals', decimals);

      return { name, symbol, decimals };
    } catch (error) {
      console.error('Error getting token info:', error);
      throw error;
    }
  };

  // ============================================================================
  // Write Methods
  // ============================================================================

  const handleTransfer = async (to: string, amount: string) => {
    try {
      const txHash = await callWrite('transfer', [to, amount]);
      console.log('Transfer transaction:', txHash);
      onTransfer?.(userAddress, to, amount);
      return txHash;
    } catch (error) {
      console.error('Error transferring tokens:', error);
      throw error;
    }
  };

  const handleApprove = async (spender: string, amount: string) => {
    try {
      const txHash = await callWrite('approve', [spender, amount]);
      console.log('Approve transaction:', txHash);
      onApproval?.(userAddress, spender, amount);
      return txHash;
    } catch (error) {
      console.error('Error approving tokens:', error);
      throw error;
    }
  };

  const handleTransferFrom = async (
    from: string,
    to: string,
    amount: string
  ) => {
    try {
      const txHash = await callWrite('transferFrom', [from, to, amount]);
      console.log('TransferFrom transaction:', txHash);
      onTransfer?.(from, to, amount);
      return txHash;
    } catch (error) {
      console.error('Error transferring from:', error);
      throw error;
    }
  };

  // ============================================================================
  // Event Subscriptions
  // ============================================================================

  // Subscribe to Transfer events
  useEventSubscription('Transfer', {
    from: userAddress, // Filter for transfers involving the user
  });

  // Subscribe to Approval events
  useEventSubscription('Approval', {
    owner: userAddress, // Filter for approvals by the user
  });

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleTransferEvent = (eventData: any) => {
    console.log('Transfer event received:', eventData);
    const { from, to, value } = eventData;

    // Update business state
    setState('lastTransfer', {
      from,
      to,
      value,
      timestamp: new Date().toISOString(),
    });

    // Refresh balance if it's the user's address
    if (from === userAddress || to === userAddress) {
      handleGetBalance(userAddress);
    }
  };

  const handleApprovalEvent = (eventData: any) => {
    console.log('Approval event received:', eventData);
    const { owner, spender, value } = eventData;

    // Update business state
    setState('lastApproval', {
      owner,
      spender,
      value,
      timestamp: new Date().toISOString(),
    });
  };

  // ============================================================================
  // Form Handlers
  // ============================================================================

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTo || !transferAmount) return;

    try {
      await handleTransfer(transferTo, transferAmount);
      setTransferTo('');
      setTransferAmount('');
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveSpender || !approveAmount) return;

    try {
      await handleApprove(approveSpender, approveAmount);
      setApproveSpender('');
      setApproveAmount('');
    } catch (error) {
      console.error('Approve failed:', error);
    }
  };

  // ============================================================================
  // Effects
  // ============================================================================

  // Load token info on mount
  useEffect(() => {
    handleGetTokenInfo();
  }, []);

  // Load user balance when address changes
  useEffect(() => {
    if (userAddress) {
      handleGetBalance(userAddress);
    }
  }, [userAddress]);

  // ============================================================================
  // Component Render
  // ============================================================================

  return (
    <div className="erc20-contract-component">
      <div className="contract-header">
        <h2>
          {tokenInfo.name} ({tokenInfo.symbol})
        </h2>
        <p>Contract Address: {contract.address}</p>
        <p>Decimals: {tokenInfo.decimals}</p>
        <p>Total Supply: {tokenInfo.totalSupply}</p>
      </div>

      <div className="user-info">
        <h3>User Information</h3>
        <p>Address: {userAddress}</p>
        <p>
          Balance: {userBalance} {tokenInfo.symbol}
        </p>
        <button onClick={() => handleGetBalance(userAddress)}>
          Refresh Balance
        </button>
      </div>

      <div className="transfer-section">
        <h3>Transfer Tokens</h3>
        <form onSubmit={handleTransferSubmit}>
          <div>
            <label>
              To Address:
              <input
                type="text"
                value={transferTo}
                onChange={e => setTransferTo(e.target.value)}
                placeholder="0x..."
              />
            </label>
          </div>
          <div>
            <label>
              Amount:
              <input
                type="text"
                value={transferAmount}
                onChange={e => setTransferAmount(e.target.value)}
                placeholder="0"
              />
            </label>
          </div>
          <button type="submit" disabled={!transferTo || !transferAmount}>
            Transfer
          </button>
        </form>
      </div>

      <div className="approve-section">
        <h3>Approve Tokens</h3>
        <form onSubmit={handleApproveSubmit}>
          <div>
            <label>
              Spender Address:
              <input
                type="text"
                value={approveSpender}
                onChange={e => setApproveSpender(e.target.value)}
                placeholder="0x..."
              />
            </label>
          </div>
          <div>
            <label>
              Amount:
              <input
                type="text"
                value={approveAmount}
                onChange={e => setApproveAmount(e.target.value)}
                placeholder="0"
              />
            </label>
          </div>
          <button type="submit" disabled={!approveSpender || !approveAmount}>
            Approve
          </button>
        </form>
      </div>

      <div className="events-section">
        <h3>Recent Events</h3>
        <div className="event-list">
          {eventStates.map((event, index) => (
            <div key={index} className="event-item">
              <p>
                <strong>{event.eventName}</strong>
              </p>
              <p>Block: {event.blockNumber}</p>
              <p>Transaction: {event.transactionHash}</p>
              <pre>{JSON.stringify(event.data, null, 2)}</pre>
            </div>
          ))}
        </div>
      </div>

      <div className="business-state">
        <h3>Business State</h3>
        <pre>{JSON.stringify(state, null, 2)}</pre>
      </div>
    </div>
  );
}

// ============================================================================
// Contract Template Generation Example
// ============================================================================

export function generateERC20Template(
  contract: ClientContractOrchestrator
): string {
  const generator = new ContractTemplateGenerator({
    componentName: 'ERC20Contract',
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

  return generator.generateTemplate(contract);
}

// ============================================================================
// Usage Example
// ============================================================================

export function ERC20ContractUsageExample() {
  const mockContract: ClientContractOrchestrator = {
    address: '0x1234567890123456789012345678901234567890',
    name: 'MyToken',
    abi: [
      {
        name: 'name',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }],
      },
      {
        name: 'symbol',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }],
      },
      {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
      },
      {
        name: 'totalSupply',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
      },
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
      {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
      },
      {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'spender', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
      },
      {
        name: 'Transfer',
        type: 'event',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'value', type: 'uint256' },
        ],
        anonymous: false,
      },
      {
        name: 'Approval',
        type: 'event',
        inputs: [
          { name: 'owner', type: 'address', indexed: true },
          { name: 'spender', type: 'address', indexed: true },
          { name: 'value', type: 'uint256' },
        ],
        anonymous: false,
      },
    ],
    methods: {
      read: ['name', 'symbol', 'decimals', 'totalSupply', 'balanceOf'],
      write: ['transfer', 'approve', 'transferFrom'],
      events: ['Transfer', 'Approval'],
    },
  };

  return (
    <div>
      <h1>ERC20 Contract Example</h1>
      <ERC20ContractComponent
        contract={mockContract}
        onTransfer={(from, to, amount) => {
          console.log(`Transfer: ${amount} tokens from ${from} to ${to}`);
        }}
        onApproval={(owner, spender, amount) => {
          console.log(
            `Approval: ${owner} approved ${spender} for ${amount} tokens`
          );
        }}
      />
    </div>
  );
}

export default ERC20ContractComponent;
