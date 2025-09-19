import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { DevKitApiService } from '../services/api';

interface NodeControlPanelProps {
  isAdmin: boolean;
  currentMiningStatus?: {
    isRunning: boolean;
    interval: number;
    blocksMined: number;
    startTime?: Date;
  };
  nodeRunning: boolean;
}

export function NodeControlPanel({
  isAdmin,
  currentMiningStatus,
  nodeRunning,
}: NodeControlPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [miningInterval, setMiningInterval] = useState(
    currentMiningStatus?.interval || 2000
  );
  const [blocksToMine, setBlocksToMine] = useState(1);
  const queryClient = useQueryClient();

  const handleNodeAction = async (action: 'start' | 'stop') => {
    if (!isAdmin) {
      alert('Admin access required');
      return;
    }

    setIsLoading(true);
    try {
      if (action === 'start') {
        await DevKitApiService.startNode();
        alert('Node started successfully');
      } else {
        await DevKitApiService.stopNode();
        alert('Node stopped successfully');
      }

      // Refresh status
      queryClient.invalidateQueries({ queryKey: ['devkit-status'] });
      queryClient.invalidateQueries({ queryKey: ['public-status'] });
    } catch (error) {
      console.error(`Node ${action} failed:`, error);
      alert(
        `Failed to ${action} node: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMiningAction = async (action: 'start' | 'stop') => {
    if (!isAdmin) {
      alert('Admin access required');
      return;
    }

    setIsLoading(true);
    try {
      if (action === 'start') {
        await DevKitApiService.startMining();
        alert('Mining started successfully');
      } else {
        await DevKitApiService.stopMining();
        alert('Mining stopped successfully');
      }

      // Refresh status
      queryClient.invalidateQueries({ queryKey: ['devkit-status'] });
    } catch (error) {
      console.error(`Mining ${action} failed:`, error);
      alert(
        `Failed to ${action} mining: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetMiningInterval = async () => {
    if (!isAdmin) {
      alert('Admin access required');
      return;
    }

    if (miningInterval < 100) {
      alert('Mining interval must be at least 100ms');
      return;
    }

    setIsLoading(true);
    try {
      await DevKitApiService.setMiningInterval(miningInterval);
      alert(`Mining interval set to ${miningInterval}ms`);

      // Refresh status
      queryClient.invalidateQueries({ queryKey: ['devkit-status'] });
    } catch (error) {
      console.error('Mining interval update failed:', error);
      alert(
        `Failed to update mining interval: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMineBlocks = async () => {
    if (!isAdmin) {
      alert('Admin access required');
      return;
    }

    if (blocksToMine < 1 || blocksToMine > 100) {
      alert('Block count must be between 1 and 100');
      return;
    }

    setIsLoading(true);
    try {
      await DevKitApiService.mineBlocks(blocksToMine);
      alert(`Successfully mined ${blocksToMine} blocks`);

      // Refresh status
      queryClient.invalidateQueries({ queryKey: ['devkit-status'] });
    } catch (error) {
      console.error('Manual mining failed:', error);
      alert(
        `Failed to mine blocks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Node Control Panel
      </h3>

      {!isAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
          <p className="text-sm text-yellow-800">
            🔒 Admin access required for node control operations
          </p>
        </div>
      )}

      {/* Node Controls */}
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Node Operations</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleNodeAction('start')}
              disabled={!isAdmin || isLoading || nodeRunning}
              className={`px-4 py-2 rounded font-medium ${
                !isAdmin || isLoading || nodeRunning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isLoading ? '...' : nodeRunning ? 'Node Running' : 'Start Node'}
            </button>
            <button
              onClick={() => handleNodeAction('stop')}
              disabled={!isAdmin || isLoading || !nodeRunning}
              className={`px-4 py-2 rounded font-medium ${
                !isAdmin || isLoading || !nodeRunning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isLoading ? '...' : 'Stop Node'}
            </button>
          </div>
        </div>

        {/* Mining Controls */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Mining Controls</h4>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleMiningAction('start')}
                disabled={
                  !isAdmin ||
                  isLoading ||
                  !nodeRunning ||
                  currentMiningStatus?.isRunning
                }
                className={`px-4 py-2 rounded font-medium ${
                  !isAdmin ||
                  isLoading ||
                  !nodeRunning ||
                  currentMiningStatus?.isRunning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLoading
                  ? '...'
                  : currentMiningStatus?.isRunning
                    ? 'Mining Active'
                    : 'Start Mining'}
              </button>
              <button
                onClick={() => handleMiningAction('stop')}
                disabled={
                  !isAdmin ||
                  isLoading ||
                  !nodeRunning ||
                  !currentMiningStatus?.isRunning
                }
                className={`px-4 py-2 rounded font-medium ${
                  !isAdmin ||
                  isLoading ||
                  !nodeRunning ||
                  !currentMiningStatus?.isRunning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {isLoading ? '...' : 'Pause Mining'}
              </button>
            </div>

            {/* Mining Interval Control */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Mining Interval:</label>
              <input
                type="number"
                value={miningInterval}
                onChange={(e) =>
                  setMiningInterval(parseInt(e.target.value, 10) || 2000)
                }
                min="100"
                max="60000"
                step="100"
                className="w-20 px-2 py-1 border rounded text-sm"
                disabled={!isAdmin || isLoading}
              />
              <span className="text-sm text-gray-500">ms</span>
              <button
                onClick={handleSetMiningInterval}
                disabled={!isAdmin || isLoading || !nodeRunning}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  !isAdmin || isLoading || !nodeRunning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                Update
              </button>
            </div>

            {/* Manual Mining */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Mine Blocks:</label>
              <input
                type="number"
                value={blocksToMine}
                onChange={(e) =>
                  setBlocksToMine(parseInt(e.target.value, 10) || 1)
                }
                min="1"
                max="100"
                className="w-16 px-2 py-1 border rounded text-sm"
                disabled={!isAdmin || isLoading}
              />
              <button
                onClick={handleMineBlocks}
                disabled={!isAdmin || isLoading || !nodeRunning}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  !isAdmin || isLoading || !nodeRunning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                Mine Now
              </button>
            </div>
          </div>
        </div>

        {/* Mining Status Display */}
        {currentMiningStatus && (
          <div className="bg-gray-50 p-3 rounded">
            <h5 className="text-sm font-medium text-gray-700 mb-1">
              Current Mining Status
            </h5>
            <div className="text-xs text-gray-600 space-y-1">
              <p>
                Status:{' '}
                {currentMiningStatus.isRunning ? '✅ Running' : '⏸️ Stopped'}
              </p>
              <p>Interval: {currentMiningStatus.interval}ms</p>
              <p>Blocks Mined: {currentMiningStatus.blocksMined}</p>
              {currentMiningStatus.startTime && (
                <p>
                  Started: {currentMiningStatus.startTime.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
