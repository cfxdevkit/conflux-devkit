/**
 * Centralized workspace configuration
 * This file contains all shared configuration values for the Conflux DevKit workspace
 */

export interface WorkspaceConfig {
  SYSTEM_MNEMONIC: string;
  TEST_WALLETS: {
    ADMIN: string;
    USER: string;
  };
  API: {
    BASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    REFRESH_EXPIRES_IN: string;
  };
  NODE: {
    DEFAULT_CHAIN_ID: number;
    DEFAULT_EVM_CHAIN_ID: number;
    DEFAULT_CORE_PORT: number;
    DEFAULT_EVM_PORT: number;
    DEFAULT_DATA_DIR: string;
  };
  ENVIRONMENT: {
    IS_DEVELOPMENT: boolean;
    IS_PRODUCTION: boolean;
    IS_TEST: boolean;
  };
}

export const WORKSPACE_CONFIG: WorkspaceConfig = {
  // System mnemonic - used for all wallet operations
  // This should be set via environment variable in production
  SYSTEM_MNEMONIC: process.env.HARDHAT_VAR_DEPLOYER_MNEMONIC || 
                   process.env.VITE_HARDHAT_VAR_DEPLOYER_MNEMONIC ||
                   'test test test test test test test test test test test junk',
  
  // Default test wallets for development
  TEST_WALLETS: {
    ADMIN: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // First address from test mnemonic
    USER: '0x1234567890123456789012345678901234567890', // Common test address
  },
  
  // API Configuration
  API: {
    BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
    JWT_SECRET: process.env.JWT_SECRET || 'conflux-devkit-secret-key-change-in-production',
    JWT_EXPIRES_IN: '15m',
    REFRESH_EXPIRES_IN: '7d',
  },
  
  // Node Configuration
  NODE: {
    DEFAULT_CHAIN_ID: 2029,
    DEFAULT_EVM_CHAIN_ID: 2030,
    DEFAULT_CORE_PORT: 12537,
    DEFAULT_EVM_PORT: 8545,
    DEFAULT_DATA_DIR: '.conflux-dev',
  },
  
  // Environment detection
  ENVIRONMENT: {
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development' || process.env.DEV === 'true',
    IS_PRODUCTION: process.env.NODE_ENV === 'production' || process.env.PROD === 'true',
    IS_TEST: process.env.NODE_ENV === 'test',
  }
};

// Validation function to ensure critical values are set
export function validateWorkspaceConfig(): { warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Check if using test mnemonic in production
  if (WORKSPACE_CONFIG.ENVIRONMENT.IS_PRODUCTION && 
      WORKSPACE_CONFIG.SYSTEM_MNEMONIC === 'test test test test test test test test test test test junk') {
    errors.push('CRITICAL: Production environment using test mnemonic! Set HARDHAT_VAR_DEPLOYER_MNEMONIC immediately.');
  }
  
  // Check if using default JWT secret in production
  if (WORKSPACE_CONFIG.ENVIRONMENT.IS_PRODUCTION && 
      WORKSPACE_CONFIG.API.JWT_SECRET === 'conflux-devkit-secret-key-change-in-production') {
    warnings.push('WARNING: Production environment using default JWT secret. Set JWT_SECRET for security.');
  }
  
  return { warnings, errors };
}

// Export individual values for easier importing
export const {
  SYSTEM_MNEMONIC,
  TEST_WALLETS,
  API,
  NODE,
  ENVIRONMENT
} = WORKSPACE_CONFIG;
