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
export declare const WORKSPACE_CONFIG: WorkspaceConfig;
export declare function validateWorkspaceConfig(): {
    warnings: string[];
    errors: string[];
};
export declare const SYSTEM_MNEMONIC: string, TEST_WALLETS: {
    ADMIN: string;
    USER: string;
}, API: {
    BASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    REFRESH_EXPIRES_IN: string;
}, NODE: {
    DEFAULT_CHAIN_ID: number;
    DEFAULT_EVM_CHAIN_ID: number;
    DEFAULT_CORE_PORT: number;
    DEFAULT_EVM_PORT: number;
    DEFAULT_DATA_DIR: string;
}, ENVIRONMENT: {
    IS_DEVELOPMENT: boolean;
    IS_PRODUCTION: boolean;
    IS_TEST: boolean;
};
//# sourceMappingURL=workspace-config.d.ts.map