import type { ServiceStatus } from '../../types/workspace';

interface StatusIndicatorProps {
  status: ServiceStatus;
  className?: string;
}

export function StatusIndicator({ status, className = '' }: StatusIndicatorProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div
      className={`w-3 h-3 rounded-full ${getStatusStyles()} ${className}`}
      title={`Status: ${status}`}
    />
  );
}