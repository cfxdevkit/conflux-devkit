/*
 * Copyright 2025 Conflux DevKit Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState, useId } from 'react';
import { DevKitApiService } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './Toast';
import { useWebSocketStore } from '../services/websocket';

interface MiningStatus {
  isRunning: boolean;
  interval: number;
  blocksMined: number;
  startTime?: Date;
}

interface UnifiedNodeDashboardProps {
  isAdmin: boolean;
  nodeRunning: boolean;
  miningStatus?: MiningStatus;
}

export function UnifiedNodeDashboard({ isAdmin, nodeRunning, miningStatus }: UnifiedNodeDashboardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [blocksToMine, setBlocksToMine] = useState(1);
  const [devBlockIntervalEnabled, setDevBlockIntervalEnabled] = useState(true); // Default enabled
  const [devBlockIntervalMs, setDevBlockIntervalMs] = useState(500); // Default 500ms
  const [devPackTxImmediately, setDevPackTxImmediately] = useState(true);
  const queryClient = useQueryClient();
  const toast = useToast();
  const blocksId = useId();
  const devBlockIntervalId = useId();
  const devPackTxId = useId();

  // WebSocket data for live status
  const {
    isConnected: wsConnected,
    nodeStats,
    lastUpdate,
    error: wsError
  } = useWebSocketStore();

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['devkit-status'] });
    queryClient.invalidateQueries({ queryKey: ['public-status'] });
  };

  const handleNodeAction = async (action: 'start' | 'stop') => {
    if (!isAdmin) {
      toast.warning('Admin access required');
      return;
    }

    setIsLoading(true);
    try {
      if (action === 'start') {
        await DevKitApiService.startNode();
        toast.success('Node started successfully');
      } else {
        await DevKitApiService.stopNode();
        toast.success('Node stopped successfully');
      }
      refreshData();
    } catch (error) {
      console.error(`Node ${action} failed:`, error);
      toast.error(`Failed to ${action} node: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };


  const handleMineBlocks = async () => {
    if (!isAdmin) {
      toast.warning('Admin access required');
      return;
    }

    if (blocksToMine < 1 || blocksToMine > 100) {
      toast.warning('Block count must be between 1 and 100');
      return;
    }

    setIsLoading(true);
    try {
      await DevKitApiService.mineBlocks(blocksToMine);
      toast.success(`Successfully mined ${blocksToMine} blocks`);
      refreshData();
    } catch (error) {
      console.error('Manual mining failed:', error);
      toast.error(`Failed to mine blocks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDevSettings = async () => {
    if (!isAdmin) {
      toast.warning('Admin access required');
      return;
    }

    if (nodeRunning) {
      toast.warning('Development settings can only be changed when the node is stopped');
      return;
    }

    if (devBlockIntervalEnabled && devBlockIntervalMs < 100) {
      toast.warning('Block interval must be at least 100ms when enabled');
      return;
    }

    setIsLoading(true);
    try {
      await DevKitApiService.updateDevSettings({
        devBlockIntervalMs: devBlockIntervalEnabled ? devBlockIntervalMs : undefined,
        devPackTxImmediately: devPackTxImmediately
      });
      toast.success('Development settings saved. Settings will be applied when the node starts.');
      refreshData();
    } catch (error) {
      console.error('Dev settings update failed:', error);
      toast.error(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Node Control Dashboard</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm">{wsConnected ? 'Live' : 'Disconnected'}</span>
          </div>
        </div>
        {!isAdmin && (
          <div className="mt-2 text-sm bg-yellow-500 bg-opacity-20 rounded px-3 py-1">
            🔒 Admin access required for control operations
          </div>
        )}
      </div>

      {/* WebSocket Error */}
      {wsError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-800">⚠️ WebSocket Error: {wsError}</p>
        </div>
      )}

      <div className="p-6">
        {/* Live Status Section */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Live Node Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Conflux Core Status */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-blue-900">Conflux Core</h5>
                <div className={`w-2 h-2 rounded-full ${nodeRunning ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              </div>
              <p className="text-2xl font-bold text-blue-800">{nodeStats?.coreBlockNumber || '0'}</p>
              <p className="text-sm text-blue-600 mb-2">Latest Block</p>
              {nodeStats?.coreLatestBlock && (
                <div className="text-xs text-blue-700 space-y-1">
                  <p>Hash: {nodeStats.coreLatestBlock.hash.slice(0, 12)}...</p>
                  <p>Transactions: {nodeStats.coreLatestBlock.transactions}</p>
                </div>
              )}
            </div>

            {/* eSpace Status */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-purple-900">eSpace (EVM)</h5>
                <div className={`w-2 h-2 rounded-full ${nodeRunning ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              </div>
              <p className="text-2xl font-bold text-purple-800">{nodeStats?.evmBlockNumber || '0'}</p>
              <p className="text-sm text-purple-600 mb-2">Latest Block</p>
              {nodeStats?.evmLatestBlock && (
                <div className="text-xs text-purple-700 space-y-1">
                  <p>Hash: {nodeStats.evmLatestBlock.hash.slice(0, 12)}...</p>
                  <p>Transactions: {nodeStats.evmLatestBlock.transactions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Mining Status Display */}
          {miningStatus && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <h5 className="font-medium text-green-800 mb-2">Mining Status</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <p className="font-medium text-green-700">
                    {miningStatus.isRunning ? '✅ Running' : '⏸️ Stopped'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Interval:</span>
                  <p className="font-medium text-green-700">{miningStatus.interval}ms</p>
                </div>
                <div>
                  <span className="text-gray-600">Blocks Mined:</span>
                  <p className="font-medium text-green-700">{miningStatus.blocksMined}</p>
                </div>
                <div>
                  <span className="text-gray-600">Started:</span>
                  <p className="font-medium text-green-700">
                    {miningStatus.startTime ? miningStatus.startTime.toLocaleTimeString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {lastUpdate && (
            <p className="text-xs text-gray-500 mt-2">
              Last update: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Control Sections */}
        <div className="space-y-6">
          {/* Combined Node Operations and Mining Controls */}
          <div>
            <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8 gap-6">
              {/* Node Operations */}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-3">Node Operations</h4>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleNodeAction('start')}
                    disabled={!isAdmin || isLoading || nodeRunning}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      !isAdmin || isLoading || nodeRunning
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isLoading ? '...' : nodeRunning ? 'Node Running' : 'Start Node'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNodeAction('stop')}
                    disabled={!isAdmin || isLoading || !nodeRunning}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      !isAdmin || isLoading || !nodeRunning
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {isLoading ? '...' : 'Stop Node'}
                  </button>
                </div>
              </div>

              {/* Manual Mining (Simplified) */}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-3">Manual Mining</h4>
                <div className="space-y-3">
                  {/* Manual Mining Only */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <label htmlFor={blocksId} className="text-xs text-gray-700 font-medium">Mine:</label>
                    <input
                      id={blocksId}
                      type="number"
                      value={blocksToMine}
                      onChange={(e) => setBlocksToMine(parseInt(e.target.value) || 1)}
                      min="1"
                      max="100"
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!isAdmin || isLoading}
                    />
                    <span className="text-xs text-gray-500">blocks</span>
                    <button
                      type="button"
                      onClick={handleMineBlocks}
                      disabled={!isAdmin || isLoading || !nodeRunning}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        !isAdmin || isLoading || !nodeRunning
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      Mine Now
                    </button>
                  </div>

                  {/* Info about automatic mining */}
                  <div className="text-xs text-gray-600 bg-gray-50 rounded p-2 border border-gray-200">
                    ℹ️ Automatic mining is configured in Development Settings below.
                  </div>
                </div>
              </div>

              {/* Development Settings */}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-3">Development Settings</h4>
                <div className="space-y-3">
                  {/* Auto Block Generation */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      id={devBlockIntervalId}
                      type="checkbox"
                      checked={devBlockIntervalEnabled}
                      onChange={(e) => setDevBlockIntervalEnabled(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={!isAdmin || isLoading || nodeRunning}
                    />
                    <label htmlFor={devBlockIntervalId} className="text-xs text-gray-700 font-medium">
                      Auto Block Generation:
                    </label>
                    <input
                      type="number"
                      value={devBlockIntervalMs}
                      onChange={(e) => setDevBlockIntervalMs(parseInt(e.target.value) || 500)}
                      min="100"
                      max="10000"
                      step="100"
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!isAdmin || isLoading || nodeRunning || !devBlockIntervalEnabled}
                    />
                    <span className="text-xs text-gray-500">ms</span>
                  </div>

                  {/* Pack Transactions Immediately */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      id={devPackTxId}
                      type="checkbox"
                      checked={devPackTxImmediately}
                      onChange={(e) => setDevPackTxImmediately(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={!isAdmin || isLoading || nodeRunning}
                    />
                    <label htmlFor={devPackTxId} className="text-xs text-gray-700 font-medium">
                      Pack Transactions Immediately
                    </label>
                  </div>

                  {/* Apply Settings Info */}
                  <div className="text-xs text-gray-600 bg-blue-50 rounded p-2 border border-blue-200">
                    ℹ️ Development settings can only be changed when the node is stopped.
                    Settings will be applied when the node starts.
                  </div>

                  {/* Update Settings Button */}
                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={handleUpdateDevSettings}
                      disabled={!isAdmin || isLoading || nodeRunning}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        !isAdmin || isLoading || nodeRunning
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {isLoading ? 'Saving...' : 'Save Dev Settings'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}