/**
 * Simple logger utility
 */

const colors = {
  info: '\x1b[36m', // Cyan
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  success: '\x1b[32m', // Green
  reset: '\x1b[0m', // Reset
};

function formatMessage(level: string, message: string, ...args: any[]): string {
  const timestamp = new Date().toISOString();
  const formattedArgs =
    args.length > 0
      ? ` ${args
          .map((arg) =>
            typeof arg === 'object'
              ? JSON.stringify(arg, (key, value) =>
                  typeof value === 'bigint' ? value.toString() : value, 2)
              : String(arg)
          )
          .join(' ')}`
      : '';

  return `[${timestamp}] ${level.toUpperCase()}: ${message}${formattedArgs}`;
}

export const logger = {
  info(message: string, ...args: any[]) {
    console.log(
      colors.info + formatMessage('info', message, ...args) + colors.reset
    );
  },

  warn(message: string, ...args: any[]) {
    console.warn(
      colors.warn + formatMessage('warn', message, ...args) + colors.reset
    );
  },

  error(message: string, ...args: any[]) {
    console.error(
      colors.error + formatMessage('error', message, ...args) + colors.reset
    );
  },

  success(message: string, ...args: any[]) {
    console.log(
      colors.success + formatMessage('success', message, ...args) + colors.reset
    );
  },
};
