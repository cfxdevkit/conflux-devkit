import { StatusIndicator } from '../common/StatusIndicator';
import type { WorkspaceStatus } from '../../types/workspace';

interface WorkspaceStatusWidgetProps {
  status: WorkspaceStatus;
  onRefresh: () => void;
}

export function WorkspaceStatusWidget({ status, onRefresh }: WorkspaceStatusWidgetProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          📊 Workspace Status
        </h3>
        <button
          onClick={onRefresh}
          disabled={status.isLoading}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
        >
          {status.isLoading ? '🔄' : '🔄'} Refresh
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

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Overall Status:</span>
          <span className={`font-medium ${
            status.overallStatus === 'healthy' ? 'text-green-600' :
            status.overallStatus === 'degraded' ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {status.overallStatus}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
          <span>Last Check:</span>
          <span>{status.lastCheck.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}