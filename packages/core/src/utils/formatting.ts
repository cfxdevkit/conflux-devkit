// Formatting utilities

/**
 * Format wei to CFX with enhanced options
 */
export function formatWeiToCfx(
  wei: string | bigint,
  decimals: number = 18,
  options: {
    precision?: number;
    showSymbol?: boolean;
    locale?: string;
  } = {}
): string {
  const { precision = 6, showSymbol = false, locale = 'en-US' } = options;

  const weiBigInt = typeof wei === 'string' ? BigInt(wei) : wei;
  const divisor = BigInt(10 ** decimals);

  const wholePart = weiBigInt / divisor;
  const fractionalPart = weiBigInt % divisor;

  if (fractionalPart === 0n) {
    const formatted = wholePart.toLocaleString(locale);
    return showSymbol ? `${formatted} CFX` : formatted;
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmedFractional = fractionalStr.replace(/0+$/, '');
  const precisionLimited = trimmedFractional.slice(0, precision);

  const formatted = `${wholePart.toLocaleString(locale)}.${precisionLimited}`;
  return showSymbol ? `${formatted} CFX` : formatted;
}

/**
 * Format CFX to wei
 */
export function formatCfxToWei(
  cfx: string | number,
  decimals: number = 18
): string {
  const cfxStr = cfx.toString();
  const [wholePart, fractionalPart = ''] = cfxStr.split('.');

  const paddedFractional = fractionalPart
    .padEnd(decimals, '0')
    .slice(0, decimals);
  return wholePart + paddedFractional;
}

/**
 * Format number with commas
 */
export function formatNumberWithCommas(num: string | number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format duration in milliseconds to human readable
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Format address for display
 */
export function formatAddress(
  address: `0x${string}`,
  length: number = 6
): string {
  if (!address || address.length < 10) {
    return address;
  }

  return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
}

/**
 * Format balance for display
 */
export function formatBalance(balance: bigint, decimals: number = 18): string {
  return formatWeiToCfx(balance.toString(), decimals, {
    precision: 6,
    showSymbol: true,
  });
}
