import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { UnifiedNodeDashboard } from '../components/UnifiedNodeDashboard';
import { AccountSelector } from '../components/AccountSelector';
import { ChainStatusWidget } from '../components/ChainStatusWidget';
import { MesonWidget } from '../components/MesonWidget';
import { GinsengSwapWidget } from '../components/GinsengSwapWidget';
import { DevKitApiService } from '../services/api';
import { DevKitApiServiceWithAuth } from '../services/developmentAuth';
import { useWebSocketStore } from '../services/websocket';
import { useAuthStore } from '../stores/authStore';

interface DashboardProps {
  currentNetwork: 'local' | 'testnet' | 'mainnet';
  onNodeStatusChange: (running: boolean) => void;
}

export function Dashboard({ 
  currentNetwork,
  onNodeStatusChange
}: DashboardProps) {
  const { isAdmin } = useAuthStore();
  const queryClient = useQueryClient();

  // WebSocket connection for real-time data
  const {
    connect: connectWs,
    disconnect: disconnectWs,
    setQueryClient: setWsQueryClient,
  } = useWebSocketStore();

  // Connect to WebSocket on component mount and inject query client
  useEffect(() => {
    setWsQueryClient(queryClient);
    connectWs();
    return () => disconnectWs();
  }, [connectWs, disconnectWs, setWsQueryClient, queryClient]);

  // Initialize development auth on component mount
  useEffect(() => {
    DevKitApiServiceWithAuth.initialize().catch(console.error);
  }, []);

  // Fetch DevKit status with less frequent polling (WebSocket provides real-time updates)
  const { data: devkitStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['devkit-status'],
    queryFn: DevKitApiServiceWithAuth.getDevKitStatusSafe,
    refetchInterval: 30000, // Reduced from 5s to 30s - WebSocket handles real-time
    retry: 1, // Don't retry too much on auth failures
  });



  // Fetch public status with reduced polling (WebSocket provides real-time updates)
  const { data: publicStatus } = useQuery({
    queryKey: ['public-status'],
    queryFn: DevKitApiService.getPublicStatus,
    refetchInterval: 60000, // Reduced from 10s to 60s - WebSocket handles real-time
    retry: 2,
  });



    // Handle network changes from the header dropdown
  useEffect(() => {
    // TODO: Add backend API call to switch networks/chains
    console.log(`Switched to ${currentNetwork}...`);
  }, [currentNetwork]);

  // Update parent component with node status
  useEffect(() => {
    onNodeStatusChange(!!devkitStatus?.running);
  }, [devkitStatus?.running, onNodeStatusChange]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        {isAdmin && (
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Admin Dashboard
          </span>
        )}
      </div>

      {/* Node Dashboard - Only show on local network */}
      {currentNetwork === 'local' && (
        <UnifiedNodeDashboard
          isAdmin={isAdmin}
          miningStatus={
            devkitStatus?.mining
              ? {
                  isRunning: devkitStatus.mining.isRunning,
                  interval: devkitStatus.mining.interval,
                  blocksMined: devkitStatus.mining.blocksMined,
                  startTime: devkitStatus.mining.startTime
                    ? new Date(devkitStatus.mining.startTime)
                    : undefined,
                }
              : undefined
          }
          nodeRunning={!!devkitStatus?.running}
        />
      )}

      {/* Chain Status Widget - Show on testnet and mainnet */}
      {(currentNetwork === 'testnet' || currentNetwork === 'mainnet') && (
        <ChainStatusWidget currentNetwork={currentNetwork} />
      )}

      {/* Account Selector - Always visible */}
      <AccountSelector currentNetwork={currentNetwork} />

      {/* GinsengSwap Widget - Show on testnet and mainnet */}
      {(currentNetwork === 'testnet' || currentNetwork === 'mainnet') && (
        <GinsengSwapWidget isVisible={true} currentNetwork={currentNetwork} />
      )}

      {/* Meson Cross-Chain Widget - Only on mainnet */}
      {currentNetwork === 'mainnet' && (
        <MesonWidget isVisible={true} currentNetwork={currentNetwork} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Backend Status
          </h3>
          {publicStatus ? (
            <div>
              <p className="text-green-600">✅ Connected</p>
              <p className="text-sm text-gray-500 mt-1">
                {publicStatus.server} v{publicStatus.version}
              </p>
            </div>
          ) : (
            <p className="text-red-600">❌ Disconnected</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            DevKit Status
          </h3>
          {statusLoading ? (
            <p className="text-yellow-600">⏳ Loading...</p>
          ) : devkitStatus ? (
            <div>
              <p className="text-green-600">✅ Running</p>
              <p className="text-sm text-gray-500 mt-1">
                {devkitStatus.status} -{' '}
                {new Date(devkitStatus.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ) : (
            <p className="text-red-600">❌ Not Connected</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            WebSocket
          </h3>
          {publicStatus?.websocket?.connected === 'active' ? (
            <div>
              <p className="text-green-600">✅ Active</p>
              <p className="text-sm text-gray-500 mt-1">
                Port {publicStatus.websocket.port}
              </p>
            </div>
          ) : (
            <p className="text-gray-600">⚪ Inactive</p>
          )}
        </div>
      </div>

      {/* Network switching functionality is now handled via the header dropdown */}
    </div>
  );
}
