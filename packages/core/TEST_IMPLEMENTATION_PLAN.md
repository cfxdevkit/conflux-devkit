# 🧪 Core Package Test Implementation Plan

> **Comprehensive test suite for @conflux-devkit/core package**

## 📊 **Analysis Summary**

### **Current State**

- **No existing tests** - Package has `"test": "echo \"No tests specified\""`
- **Complex functionality** - 8 main modules with 50+ exported functions
- **Type-heavy** - Extensive TypeScript types and interfaces
- **Utility-focused** - Core utilities for the entire ecosystem

### **Package Structure Analysis**

```
@conflux-devkit/core/
├── 📁 config/ (2 files) - Node configuration extraction
├── 📁 constants/ (3 files) - Chain constants and network configs
├── 📁 contracts/ (8 files) - Contract orchestration and management
├── 📁 schemas/ (3 files) - Zod validation schemas
├── 📁 types/ (9 files) - TypeScript type definitions
├── 📁 utils/ (7 files) - Core utility functions
├── 📁 wallet/ (2 files) - Wallet interface definitions
└── 📄 index.ts - Main exports
```

## 🎯 **Test Coverage Plan**

### **1. Type Normalization Utilities** (Priority: HIGH)

**File**: `src/utils/type-normalization.ts`
**Functions to Test**: 15 functions

- `normalizeAddress()` - Core address format handling
- `normalizeBigInt()` - BigInt to string conversion
- `normalizeTxHash()` - Transaction hash normalization
- `normalizeBlockNumber()` - Block number formatting
- `toEvmAddress()` - Core to EVM address conversion
- `toCoreAddress()` - EVM to Core address conversion
- `isCoreAddress()` - Address type detection
- `normalizeBigIntFormatted()` - Formatted BigInt conversion
- `normalizeObject()` - Object property normalization

**Test Cases**:

- ✅ Valid Core addresses (CFX:, CFXTEST:, NET)
- ✅ Valid EVM addresses (0x...)
- ✅ Invalid address formats
- ✅ Edge cases (empty strings, null, undefined)
- ✅ BigInt conversion with different formats
- ✅ Object normalization with nested properties

### **2. Browser Conversion Utilities** (Priority: HIGH)

**File**: `src/utils/browser-conversion.ts`
**Functions to Test**: 10 functions

- `toBrowserWalletInfo()` - Wallet info conversion
- `toBrowserTransactionReceipt()` - Transaction receipt conversion
- `toBrowserBlock()` - Block data conversion
- `toBrowserTransaction()` - Transaction conversion
- `toBrowserContractCallResult()` - Contract call result conversion
- `toBrowserDeploymentResult()` - Deployment result conversion
- `toBrowserNodeStatus()` - Node status conversion
- `toBrowserNetworkConfig()` - Network config conversion
- `toBrowserContractOrchestrator()` - Contract orchestrator conversion
- `toBrowserSafe()` - Generic browser-safe conversion

**Test Cases**:

- ✅ Wallet info with all properties
- ✅ Transaction receipts with different statuses
- ✅ Block data with various properties
- ✅ Contract call results (success/error)
- ✅ Deployment results with different outcomes
- ✅ Node status in different states
- ✅ Network configurations for all 6 networks
- ✅ Contract orchestrator with full metadata

### **3. API Utilities** (Priority: HIGH)

**File**: `src/utils/api-utils.ts`
**Functions to Test**: 25 functions

- `createApiResponse()` - Success response creation
- `createApiError()` - Error response creation
- `createSuccessResponse()` - Success with metadata
- `createErrorResponse()` - Error with metadata
- `createHealthCheckResponse()` - Health check response
- `createPaginatedResponse()` - Paginated data response
- `createResponseMeta()` - Response metadata creation
- `isApiResponse()` - Response type checking
- `isSuccessResponse()` - Success response checking
- `isErrorResponse()` - Error response checking
- `validateApiResponse()` - Response validation
- `handleApiError()` - Error handling
- `generateRequestId()` - Request ID generation
- `filterResponse()` - Response filtering
- `mapResponse()` - Response mapping
- `transformResponse()` - Response transformation

**Test Cases**:

- ✅ Success responses with various data types
- ✅ Error responses with different error types
- ✅ Paginated responses with metadata
- ✅ Health check responses
- ✅ Response validation with valid/invalid data
- ✅ Error handling with different error scenarios
- ✅ Request ID generation uniqueness
- ✅ Response filtering and mapping

### **4. Network Utilities** (Priority: MEDIUM)

**File**: `src/utils/network.ts`
**Functions to Test**: 8 functions

- `getMainnetNetworks()` - Mainnet network retrieval
- `getTestnetNetworks()` - Testnet network retrieval
- `getNetworkByChainId()` - Network lookup by chain ID
- `getNetworkByEvmChainId()` - Network lookup by EVM chain ID
- `getNetworkByName()` - Network lookup by name
- `getNetworkDisplayName()` - Network display name
- `isTestnet()` - Testnet detection
- `validateNetworkConfig()` - Network config validation

**Test Cases**:

- ✅ All 6 network configurations
- ✅ Network lookup by different identifiers
- ✅ Testnet vs mainnet detection
- ✅ Network config validation
- ✅ Display name formatting
- ✅ Edge cases (invalid chain IDs, missing networks)

### **5. Contract Orchestrator** (Priority: MEDIUM)

**File**: `src/contracts/ContractOrchestrator.ts`
**Class**: `ContractOrchestratorManager`
**Methods to Test**: 12 methods

- `createOrchestrator()` - Contract orchestrator creation
- `extractContractInterface()` - ABI interface extraction
- `assessContractCapabilities()` - Capability assessment
- `registerContract()` - Contract registration
- `getContract()` - Contract retrieval
- `listContracts()` - Contract listing
- `updateContractMetadata()` - Metadata updates
- `validateContract()` - Contract validation
- `getContractInteractions()` - Interaction history
- `recordInteraction()` - Interaction recording
- `getContractStats()` - Contract statistics
- `exportContractData()` - Data export

**Test Cases**:

- ✅ Contract creation with various ABI types
- ✅ Interface extraction from different ABI formats
- ✅ Capability assessment for different contract types
- ✅ Contract registration and retrieval
- ✅ Metadata updates and validation
- ✅ Interaction recording and history
- ✅ Statistics calculation
- ✅ Data export functionality

### **6. Error Types and Handling** (Priority: MEDIUM)

**File**: `src/types/errors.ts`
**Classes to Test**: 10 error classes

- `BaseError` - Base error class
- `ValidationError` - Validation errors
- `NetworkError` - Network-related errors
- `WalletError` - Wallet-related errors
- `ContractError` - Contract-related errors
- `DeploymentError` - Deployment errors
- `NodeError` - Node-related errors
- `ConfigurationError` - Configuration errors
- `NotFoundError` - Not found errors
- `InternalError` - Internal errors

**Test Cases**:

- ✅ Error creation with different parameters
- ✅ Error inheritance and properties
- ✅ Error serialization and deserialization
- ✅ Error message formatting
- ✅ Error code generation
- ✅ Error context preservation
- ✅ Error stack trace handling

### **7. Validation Schemas** (Priority: MEDIUM)

**File**: `src/schemas/`
**Schemas to Test**: 3 schemas

- `network.ts` - Network validation schema
- `node.ts` - Node configuration schema
- `wallet.ts` - Wallet validation schema

**Test Cases**:

- ✅ Valid network configurations
- ✅ Invalid network configurations
- ✅ Node configuration validation
- ✅ Wallet data validation
- ✅ Schema error messages
- ✅ Custom validation rules

### **8. Constants and Configuration** (Priority: LOW)

**Files**: `src/constants/`, `src/config/`
**Functions to Test**: 8 functions

- Chain constants validation
- Network configuration constants
- Node configuration extraction
- Configuration validation

**Test Cases**:

- ✅ Chain ID constants
- ✅ Network configuration constants
- ✅ Node configuration extraction
- ✅ Configuration validation

## 🛠️ **Test Implementation Strategy**

### **Testing Framework Setup**

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "c8": "^8.0.0",
    "tsx": "^4.0.0"
  }
}
```

### **Test Structure**

```
tests/
├── unit/
│   ├── utils/
│   │   ├── type-normalization.test.ts
│   │   ├── browser-conversion.test.ts
│   │   ├── api-utils.test.ts
│   │   └── network.test.ts
│   ├── contracts/
│   │   └── ContractOrchestrator.test.ts
│   ├── types/
│   │   └── errors.test.ts
│   └── schemas/
│       ├── network.test.ts
│       ├── node.test.ts
│       └── wallet.test.ts
├── integration/
│   ├── browser-conversion.test.ts
│   ├── contract-orchestration.test.ts
│   └── api-response-flow.test.ts
├── fixtures/
│   ├── sample-abi.json
│   ├── sample-wallet.json
│   ├── sample-transaction.json
│   └── sample-contract.json
└── helpers/
    ├── test-utils.ts
    ├── mock-data.ts
    └── assertions.ts
```

### **Test Categories**

#### **Unit Tests** (80% of tests)

- Individual function testing
- Type validation
- Error handling
- Edge cases
- Mock data testing

#### **Integration Tests** (15% of tests)

- Cross-module functionality
- Data flow testing
- Complex scenarios
- Real data processing

#### **Performance Tests** (5% of tests)

- Large data processing
- Memory usage
- Execution time
- Bundle size validation

## 📊 **Expected Test Metrics**

### **Coverage Targets**

- **Line Coverage**: 95%+
- **Branch Coverage**: 90%+
- **Function Coverage**: 100%
- **Statement Coverage**: 95%+

### **Test Count Estimates**

- **Unit Tests**: ~150 tests
- **Integration Tests**: ~25 tests
- **Performance Tests**: ~10 tests
- **Total Tests**: ~185 tests

### **Test Execution Time**

- **Unit Tests**: <5 seconds
- **Integration Tests**: <10 seconds
- **Performance Tests**: <15 seconds
- **Total Time**: <30 seconds

## 🚀 **Implementation Phases**

### **Phase 1: Foundation Setup** (Day 1)

- ✅ Install testing dependencies
- ✅ Configure Vitest
- ✅ Set up test structure
- ✅ Create test utilities and helpers
- ✅ Set up CI/CD integration

### **Phase 2: Core Utilities** (Days 2-3)

- ✅ Type normalization utilities
- ✅ Browser conversion utilities
- ✅ API utilities
- ✅ Network utilities

### **Phase 3: Contract System** (Days 4-5)

- ✅ Contract orchestrator
- ✅ Contract registry
- ✅ Contract UI representation
- ✅ Contract deployment manager

### **Phase 4: Types and Validation** (Day 6)

- ✅ Error types and handling
- ✅ Validation schemas
- ✅ Type definitions
- ✅ Constants and configuration

### **Phase 5: Integration and Performance** (Day 7)

- ✅ Integration tests
- ✅ Performance tests
- ✅ End-to-end scenarios
- ✅ Documentation updates

## 🔧 **Test Configuration**

### **Vitest Configuration**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 100,
          lines: 95,
          statements: 95,
        },
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
```

### **Package.json Scripts**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:ci": "vitest run --coverage --reporter=verbose"
  }
}
```

## 📈 **Success Criteria**

### **Functional Requirements**

- ✅ All exported functions have tests
- ✅ All error scenarios are covered
- ✅ All edge cases are handled
- ✅ All type definitions are validated

### **Quality Requirements**

- ✅ 95%+ code coverage
- ✅ All tests pass consistently
- ✅ Tests run in <30 seconds
- ✅ No flaky tests

### **Maintenance Requirements**

- ✅ Tests are well-documented
- ✅ Tests are maintainable
- ✅ Tests provide clear failure messages
- ✅ Tests are organized logically

## 🎯 **Next Steps**

1. **Approve this test plan**
2. **Set up testing infrastructure**
3. **Implement tests in phases**
4. **Integrate with CI/CD**
5. **Monitor and maintain test suite**

---

**This comprehensive test suite will ensure the core package is robust, reliable, and ready for production use across the entire Conflux DevKit ecosystem.** 🚀
