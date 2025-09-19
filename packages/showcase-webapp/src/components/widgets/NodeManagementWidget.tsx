import type { NodeStatus } from '../../types/node';

interface NodeManagementWidgetProps {
  nodeStatus: NodeStatus;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onConfigure: () => void;
}

export function NodeManagementWidget({
  nodeStatus,
  onStart,
  onStop,
  onRestart,
  onConfigure
}: NodeManagementWidgetProps) {
  const getStatusColor = () => {
    if (nodeStatus.isRunning) return 'text-green-600';
    if (nodeStatus.isStarting) return 'text-yellow-600';
    if (nodeStatus.isStopping) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusText = () => {
    if (nodeStatus.isRunning) return '🟢 Running';
    if (nodeStatus.isStarting) return '🟡 Starting...';
    if (nodeStatus.isStopping) return '🟠 Stopping...';
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
            onClick={onStart}
            disabled={nodeStatus.isRunning || nodeStatus.isStarting}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ▶️ Start
          </button>
          <button
            onClick={onStop}
            disabled={!nodeStatus.isRunning || nodeStatus.isStopping}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⏹️ Stop
          </button>
          <button
            onClick={onRestart}
            disabled={!nodeStatus.isRunning || nodeStatus.isStarting || nodeStatus.isStopping}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔄 Restart
          </button>
          <button
            onClick={onConfigure}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            ⚙️ Configure
          </button>
        </div>

        {nodeStatus.error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-sm text-red-700">{nodeStatus.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}