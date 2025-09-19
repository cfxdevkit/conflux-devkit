import { useState, useEffect } from 'react';
import type { DeployedContract, ContractEvent } from '../../types/contract';

interface EventMonitorProps {
  contract: DeployedContract;
  isActive: boolean;
  onToggle: (isActive: boolean) => void;
}

interface ContractEventLog {
  id: string;
  blockNumber: number;
  transactionHash: string;
  event: ContractEvent;
  args: Record<string, any>;
  timestamp: Date;
}

export function EventMonitor({ contract, isActive, onToggle }: EventMonitorProps) {
  const [events, setEvents] = useState<ContractEventLog[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Simulate event monitoring
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      // Simulate receiving events
      const mockEvents = [
        {
          id: Date.now().toString(),
          blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
          transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
          event: contract.methods.events[0], // Transfer event
          args: {
            from: `0x${Math.random().toString(16).substring(2, 42)}`,
            to: `0x${Math.random().toString(16).substring(2, 42)}`,
            value: (Math.random() * 1000).toFixed(0) + '000000000000000000'
          },
          timestamp: new Date()
        }
      ];

      if (Math.random() > 0.7) { // 30% chance of new event
        setEvents(prev => [mockEvents[0], ...prev.slice(0, 49)]); // Keep last 50 events
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive, contract]);

  const filteredEvents = events.filter(event =>
    selectedEvent === 'all' || event.event.name === selectedEvent
  );

  const handleToggleMonitoring = () => {
    setIsLoading(true);
    setTimeout(() => {
      onToggle(!isActive);
      setIsLoading(false);
    }, 1000);
  };

  const formatEventArgs = (args: Record<string, any>) => {
    return Object.entries(args).map(([key, value]) => ({
      name: key,
      value: typeof value === 'string' && value.length > 42
        ? `${value.slice(0, 10)}...${value.slice(-8)}`
        : value
    }));
  };

  const getEventColor = (eventName: string) => {
    switch (eventName) {
      case 'Transfer': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'Approval': return 'bg-green-50 border-green-200 text-green-800';
      case 'Mint': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'Burn': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            📡 Event Monitor - {contract.name}
          </h3>
          <p className="text-sm text-gray-500">
            Real-time contract event monitoring
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 ${
            isActive ? 'text-green-600' : 'text-gray-500'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span className="text-sm font-medium">
              {isActive ? 'Monitoring' : 'Stopped'}
            </span>
          </div>
          <button
            onClick={handleToggleMonitoring}
            disabled={isLoading}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              isActive
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            } disabled:opacity-50`}
          >
            {isLoading ? '⏳' : (isActive ? '⏹️ Stop' : '▶️ Start')}
          </button>
        </div>
      </div>

      {/* Event Filter */}
      <div className="flex items-center space-x-4 mb-4">
        <label className="text-sm font-medium text-gray-700">Filter by event:</label>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Events ({events.length})</option>
          {contract.methods.events.map((event) => (
            <option key={event.name} value={event.name}>
              {event.name} ({events.filter(e => e.event.name === event.name).length})
            </option>
          ))}
        </select>
      </div>

      {/* Events List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((eventLog) => (
            <div
              key={eventLog.id}
              className={`border rounded-lg p-4 ${getEventColor(eventLog.event.name)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">
                    {eventLog.event.name}
                  </span>
                  <span className="px-2 py-1 text-xs bg-white bg-opacity-50 rounded">
                    Block #{eventLog.blockNumber}
                  </span>
                </div>
                <span className="text-xs text-gray-600">
                  {eventLog.timestamp.toLocaleTimeString()}
                </span>
              </div>

              <div className="space-y-1 text-sm">
                {formatEventArgs(eventLog.args).map((arg, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="font-medium">{arg.name}:</span>
                    <span className="font-mono text-xs">{arg.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-2 pt-2 border-t border-white border-opacity-50">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Transaction:</span>
                  <span className="font-mono">
                    {eventLog.transactionHash.slice(0, 10)}...{eventLog.transactionHash.slice(-8)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📡</div>
            <div className="text-gray-500 text-sm">
              {isActive ? 'Waiting for events...' : 'Start monitoring to see contract events'}
            </div>
            {isActive && (
              <div className="text-xs text-gray-400 mt-2">
                Events will appear here as they are emitted by the contract
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{events.length}</div>
            <div className="text-xs text-gray-500">Total Events</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">
              {events.filter(e => e.event.name === 'Transfer').length}
            </div>
            <div className="text-xs text-gray-500">Transfers</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">
              {events.filter(e => e.timestamp > new Date(Date.now() - 60000)).length}
            </div>
            <div className="text-xs text-gray-500">Last Minute</div>
          </div>
        </div>
      </div>
    </div>
  );
}