import { useState, useCallback } from 'react';
import { useRealTimeWebSocket } from './useRealTimeWebSocket';
import type { WorkspaceStatus } from '../types/workspace';
import type { NodeStatus } from '../types/node';

export function useRealTimeUpdates() {
  const [isSimulating, setIsSimulating] = useState(true);

  // WebSocket integration for real-time events
  const { isConnected, emit } = useRealTimeWebSocket({
    url: 'ws://localhost:3001',
    enabled: !isSimulating,
    onNodeEvent: (data) => {
      console.log('Real-time node event:', data);
    },
    onContractEvent: (data) => {
      console.log('Real-time contract event:', data);
    },
    onNetworkEvent: (data) => {
      console.log('Real-time network event:', data);
    },
    onError: (error) => {
      console.warn('WebSocket error, falling back to simulation:', error);
      setIsSimulating(true);
    }
  });

  // Simulate workspace status changes
  const simulateWorkspaceStatusChanges = useCallback((
    currentStatus: WorkspaceStatus,
    setStatus: (status: WorkspaceStatus) => void
  ) => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      // Randomly change one service status
      const services = ['apiServer', 'stateServer', 'websocket', 'database'] as const;
      const serviceToChange = services[Math.floor(Math.random() * services.length)];

      // Bias towards healthy status (80% chance)
      const newStatus = Math.random() < 0.8 ? 'healthy' :
                       Math.random() < 0.5 ? 'degraded' : 'unhealthy';

      const updatedStatus = {
        ...currentStatus,
        [serviceToChange]: newStatus,
        lastCheck: new Date(),
        overallStatus: calculateOverallStatus({
          ...currentStatus,
          [serviceToChange]: newStatus
        })
      } as WorkspaceStatus;

      setStatus(updatedStatus);
    }, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Simulate node status changes
  const simulateNodeStatusChanges = useCallback((
    currentStatus: NodeStatus,
    setStatus: (status: NodeStatus) => void
  ) => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const updatedStatus = {
        ...currentStatus,
        uptime: currentStatus.isRunning ? currentStatus.uptime + 15 : 0,
        blockHeight: currentStatus.isRunning ?
          currentStatus.blockHeight + Math.floor(Math.random() * 3) :
          currentStatus.blockHeight,
        peerCount: currentStatus.isRunning ?
          Math.max(0, currentStatus.peerCount + (Math.random() > 0.5 ? 1 : -1)) :
          0,
        lastHealthCheck: new Date(),
      };

      setStatus(updatedStatus);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Calculate overall workspace status
  const calculateOverallStatus = (status: WorkspaceStatus): 'healthy' | 'degraded' | 'unhealthy' => {
    const services = [status.apiServer, status.stateServer, status.websocket, status.database];

    if (services.every(s => s === 'healthy')) return 'healthy';
    if (services.some(s => s === 'unhealthy')) return 'unhealthy';
    return 'degraded';
  };

  // Simulate network activity
  const simulateNetworkActivity = useCallback((
    onNetworkEvent: (message: string, level: 'info' | 'success' | 'warning' | 'error') => void
  ) => {
    if (!isSimulating) return;

    const networkEvents = [
      { message: 'New block mined', level: 'success' as const },
      { message: 'Peer connected', level: 'info' as const },
      { message: 'Transaction confirmed', level: 'success' as const },
      { message: 'Network latency spike detected', level: 'warning' as const },
      { message: 'Synchronizing with network', level: 'info' as const },
      { message: 'Block validation completed', level: 'success' as const },
    ];

    const interval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance of event
        const event = networkEvents[Math.floor(Math.random() * networkEvents.length)];
        onNetworkEvent(event.message, event.level);
      }
    }, 8000); // Check every 8 seconds

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Simulate contract activity
  const simulateContractActivity = useCallback((
    onContractEvent: (contractName: string, eventType: string, details: any) => void
  ) => {
    if (!isSimulating) return;

    const contractEvents = [
      { event: 'Transfer', contract: 'MyToken', details: { amount: '1000000000000000000' } },
      { event: 'Approval', contract: 'MyToken', details: { amount: '5000000000000000000' } },
      { event: 'Mint', contract: 'MyToken', details: { amount: '2000000000000000000' } },
      { event: 'OwnershipTransferred', contract: 'MyToken', details: { newOwner: '0x123...abc' } },
    ];

    const interval = setInterval(() => {
      if (Math.random() < 0.2) { // 20% chance of contract event
        const event = contractEvents[Math.floor(Math.random() * contractEvents.length)];
        onContractEvent(event.contract, event.event, event.details);
      }
    }, 12000); // Check every 12 seconds

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Simulate wallet balance changes
  const simulateWalletUpdates = useCallback((
    onBalanceUpdate: (walletType: 'evm' | 'core', newBalance: string) => void
  ) => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance of balance change
        const walletType = Math.random() > 0.5 ? 'evm' : 'core';
        const baseBalance = parseFloat('5.0');
        const change = (Math.random() - 0.5) * 0.1; // Small random change
        const newBalance = Math.max(0, baseBalance + change).toFixed(4);
        onBalanceUpdate(walletType, `${newBalance} CFX`);
      }
    }, 20000); // Check every 20 seconds

    return () => clearInterval(interval);
  }, [isSimulating]);

  return {
    isSimulating,
    setIsSimulating,
    isWebSocketConnected: isConnected,
    simulateWorkspaceStatusChanges,
    simulateNodeStatusChanges,
    simulateNetworkActivity,
    simulateContractActivity,
    simulateWalletUpdates,
    emit,
  };
}