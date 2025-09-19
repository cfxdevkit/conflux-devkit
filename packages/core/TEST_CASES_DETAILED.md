# 🧪 Detailed Test Cases for Core Package

> **Comprehensive test case specifications for @conflux-devkit/core**

## 📋 **Test Case Categories**

### **1. Type Normalization Tests** (15 functions, 45 test cases)

#### **normalizeAddress() Tests**

```typescript
describe('normalizeAddress', () => {
  describe('Core Address Formats', () => {
    it('should handle mainnet Core addresses (CFX:)', () => {
      expect(normalizeAddress('CFX:TYPE.USER:abc123def456')).toBe(
        'CFX:TYPE.USER:abc123def456'
      );
    });

    it('should handle testnet Core addresses (CFXTEST:)', () => {
      expect(normalizeAddress('CFXTEST:TYPE.USER:abc123def456')).toBe(
        'CFXTEST:TYPE.USER:abc123def456'
      );
    });

    it('should handle local Core addresses (NET)', () => {
      expect(normalizeAddress('NET:TYPE.USER:abc123def456')).toBe(
        'NET:TYPE.USER:abc123def456'
      );
    });
  });

  describe('EVM Address Formats', () => {
    it('should handle valid EVM addresses (0x...)', () => {
      expect(
        normalizeAddress('0x1234567890abcdef1234567890abcdef12345678')
      ).toBe('0x1234567890abcdef1234567890abcdef12345678');
    });

    it('should handle short EVM addresses', () => {
      expect(normalizeAddress('0x1234')).toBe('0x1234');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      expect(normalizeAddress('')).toBe('');
    });

    it('should handle invalid formats', () => {
      expect(normalizeAddress('invalid')).toBe('invalid');
    });

    it('should handle null/undefined gracefully', () => {
      expect(() => normalizeAddress(null as any)).toThrow();
      expect(() => normalizeAddress(undefined as any)).toThrow();
    });
  });
});
```

#### **normalizeBigInt() Tests**

```typescript
describe('normalizeBigInt', () => {
  it('should convert BigInt to string', () => {
    expect(normalizeBigInt(1000000000000000000n)).toBe('1000000000000000000');
  });

  it('should convert string to string', () => {
    expect(normalizeBigInt('1000000000000000000')).toBe('1000000000000000000');
  });

  it('should convert number to string', () => {
    expect(normalizeBigInt(1000000)).toBe('1000000');
  });

  it('should handle zero values', () => {
    expect(normalizeBigInt(0n)).toBe('0');
    expect(normalizeBigInt('0')).toBe('0');
    expect(normalizeBigInt(0)).toBe('0');
  });

  it('should handle negative values', () => {
    expect(normalizeBigInt(-1000n)).toBe('-1000');
    expect(normalizeBigInt('-1000')).toBe('-1000');
    expect(normalizeBigInt(-1000)).toBe('-1000');
  });
});
```

#### **Address Conversion Tests**

```typescript
describe('Address Conversion', () => {
  describe('toEvmAddress', () => {
    it('should convert EVM address to EVM format', () => {
      expect(toEvmAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(
        '0x1234567890abcdef1234567890abcdef12345678'
      );
    });

    it('should throw error for Core addresses', () => {
      expect(() => toEvmAddress('CFX:TYPE.USER:abc123')).toThrow(
        'Cannot convert Core address to EVM format'
      );
    });
  });

  describe('toCoreAddress', () => {
    it('should convert Core address to Core format', () => {
      expect(toCoreAddress('CFX:TYPE.USER:abc123def456')).toBe(
        'CFX:TYPE.USER:abc123def456'
      );
    });

    it('should throw error for EVM addresses', () => {
      expect(() =>
        toCoreAddress('0x1234567890abcdef1234567890abcdef12345678')
      ).toThrow('Cannot convert EVM address to Core format');
    });
  });

  describe('Address Type Detection', () => {
    it('should detect Core addresses', () => {
      expect(isCoreAddress('CFX:TYPE.USER:abc123')).toBe(true);
      expect(isCoreAddress('CFXTEST:TYPE.USER:abc123')).toBe(true);
      expect(isCoreAddress('NET:TYPE.USER:abc123')).toBe(true);
    });

    it('should detect EVM addresses', () => {
      expect(isEvmAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(
        true
      );
    });

    it('should reject invalid addresses', () => {
      expect(isCoreAddress('invalid')).toBe(false);
      expect(isEvmAddress('invalid')).toBe(false);
    });
  });
});
```

### **2. Browser Conversion Tests** (10 functions, 30 test cases)

#### **toBrowserWalletInfo() Tests**

```typescript
describe('toBrowserWalletInfo', () => {
  it('should convert complete WalletInfo', () => {
    const wallet: WalletInfo = {
      index: 0,
      address: '0x1234567890abcdef1234567890abcdef12345678',
      privateKey:
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      mnemonic:
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      balance: 1000000000000000000n,
      balanceFormatted: '1.0 CFX',
      isMining: false,
    };

    const result = toBrowserWalletInfo(wallet);

    expect(result).toEqual({
      index: 0,
      address: '0x1234567890abcdef1234567890abcdef12345678',
      privateKey:
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      mnemonic:
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      balance: '1000000000000000000',
      balanceFormatted: '1.0 CFX',
      isMining: false,
    });
  });

  it('should handle missing optional properties', () => {
    const wallet: Partial<WalletInfo> = {
      index: 0,
      address: '0x1234567890abcdef1234567890abcdef12345678',
      privateKey:
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      mnemonic:
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    };

    const result = toBrowserWalletInfo(wallet as WalletInfo);

    expect(result.balance).toBe('0');
    expect(result.balanceFormatted).toBe('0');
    expect(result.isMining).toBe(false);
  });
});
```

#### **toBrowserTransactionReceipt() Tests**

```typescript
describe('toBrowserTransactionReceipt', () => {
  it('should convert successful transaction receipt', () => {
    const receipt: TransactionReceipt = {
      transactionHash:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      blockNumber: 12345n,
      blockHash:
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      transactionIndex: 0,
      from: '0x1234567890abcdef1234567890abcdef12345678',
      to: '0x9876543210fedcba9876543210fedcba98765432',
      gasUsed: 21000n,
      effectiveGasPrice: 20000000000n,
      status: 'success',
      logs: [],
    };

    const result = toBrowserTransactionReceipt(receipt);

    expect(result).toEqual({
      transactionHash:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      blockNumber: '12345',
      blockHash:
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      transactionIndex: '0',
      from: '0x1234567890abcdef1234567890abcdef12345678',
      to: '0x9876543210fedcba9876543210fedcba98765432',
      gasUsed: '21000',
      effectiveGasPrice: '20000000000',
      status: 'success',
      logs: [],
    });
  });

  it('should handle failed transaction receipt', () => {
    const receipt: TransactionReceipt = {
      transactionHash:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      blockNumber: 12345n,
      blockHash:
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      transactionIndex: 0,
      from: '0x1234567890abcdef1234567890abcdef12345678',
      to: '0x9876543210fedcba9876543210fedcba98765432',
      gasUsed: 21000n,
      effectiveGasPrice: 20000000000n,
      status: 'reverted',
      logs: [],
    };

    const result = toBrowserTransactionReceipt(receipt);

    expect(result.status).toBe('reverted');
  });
});
```

### **3. API Utilities Tests** (25 functions, 75 test cases)

#### **createApiResponse() Tests**

```typescript
describe('createApiResponse', () => {
  it('should create success response with data only', () => {
    const data = { message: 'success', value: 42 };
    const response = createApiResponse(data);

    expect(response).toEqual({
      success: true,
      data: { message: 'success', value: 42 },
      meta: undefined,
    });
  });

  it('should create success response with metadata', () => {
    const data = { message: 'success' };
    const meta: ResponseMeta = {
      requestId: 'req-123',
      timestamp: new Date('2024-01-01T00:00:00Z'),
      duration: 150,
      version: '1.0.0',
    };
    const response = createApiResponse(data, meta);

    expect(response.success).toBe(true);
    expect(response.data).toEqual(data);
    expect(response.meta).toEqual(meta);
  });

  it('should handle null data', () => {
    const response = createApiResponse(null);
    expect(response.success).toBe(true);
    expect(response.data).toBeNull();
  });
});
```

#### **createApiError() Tests**

```typescript
describe('createApiError', () => {
  it('should create error response with code and message', () => {
    const response = createApiError('VALIDATION_ERROR', 'Invalid input data');

    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe('VALIDATION_ERROR');
    expect(response.error?.message).toBe('Invalid input data');
    expect(response.error?.timestamp).toBeInstanceOf(Date);
  });

  it('should create error response with details', () => {
    const details = { field: 'email', reason: 'Invalid format' };
    const response = createApiError(
      'VALIDATION_ERROR',
      'Invalid input data',
      details
    );

    expect(response.error?.details).toEqual(details);
  });
});
```

#### **Response Validation Tests**

```typescript
describe('Response Validation', () => {
  describe('isApiResponse', () => {
    it('should identify valid API responses', () => {
      const response = createApiResponse({ data: 'test' });
      expect(isApiResponse(response)).toBe(true);
    });

    it('should reject invalid responses', () => {
      expect(isApiResponse({})).toBe(false);
      expect(isApiResponse(null)).toBe(false);
      expect(isApiResponse('string')).toBe(false);
    });
  });

  describe('isSuccessResponse', () => {
    it('should identify success responses', () => {
      const response = createApiResponse({ data: 'test' });
      expect(isSuccessResponse(response)).toBe(true);
    });

    it('should reject error responses', () => {
      const response = createApiError('ERROR', 'Test error');
      expect(isSuccessResponse(response)).toBe(false);
    });
  });

  describe('isErrorResponse', () => {
    it('should identify error responses', () => {
      const response = createApiError('ERROR', 'Test error');
      expect(isErrorResponse(response)).toBe(true);
    });

    it('should reject success responses', () => {
      const response = createApiResponse({ data: 'test' });
      expect(isErrorResponse(response)).toBe(false);
    });
  });
});
```

### **4. Network Management Tests** (8 functions, 24 test cases)

#### **Network Lookup Tests**

```typescript
describe('Network Lookup Functions', () => {
  describe('getNetworkByChainId', () => {
    it('should return mainnet Core network for chain ID 2029', () => {
      const network = getNetworkByChainId(2029);
      expect(network).toBeDefined();
      expect(network?.name).toBe('Conflux Mainnet Core');
      expect(network?.chainId).toBe(2029);
      expect(network?.isTestnet).toBe(false);
    });

    it('should return undefined for invalid chain ID', () => {
      const network = getNetworkByChainId(9999);
      expect(network).toBeUndefined();
    });
  });

  describe('getNetworkByEvmChainId', () => {
    it('should return mainnet EVM network for EVM chain ID 2030', () => {
      const network = getNetworkByEvmChainId(2030);
      expect(network).toBeDefined();
      expect(network?.name).toBe('Conflux Mainnet EVM');
      expect(network?.evmChainId).toBe(2030);
      expect(network?.isTestnet).toBe(false);
    });
  });

  describe('getNetworkByName', () => {
    it('should return network by exact name', () => {
      const network = getNetworkByName('Conflux Mainnet Core');
      expect(network).toBeDefined();
      expect(network?.chainId).toBe(2029);
    });

    it('should return undefined for invalid name', () => {
      const network = getNetworkByName('Invalid Network');
      expect(network).toBeUndefined();
    });
  });
});
```

#### **Network Validation Tests**

```typescript
describe('Network Validation', () => {
  describe('validateNetworkConfig', () => {
    it('should validate correct network config', () => {
      const config: NetworkConfig = {
        name: 'Test Network',
        chainId: 2029,
        evmChainId: 2030,
        rpcUrl: 'https://test.confluxrpc.com',
        currency: {
          name: 'Conflux',
          symbol: 'CFX',
          decimals: 18,
        },
        isTestnet: true,
      };

      expect(validateNetworkConfig(config)).toBe(true);
    });

    it('should reject invalid network config', () => {
      const invalidConfig = {
        name: 'Test Network',
        chainId: 'invalid', // Should be number
        rpcUrl: 'not-a-url',
      };

      expect(validateNetworkConfig(invalidConfig as any)).toBe(false);
    });
  });

  describe('isTestnet', () => {
    it('should identify testnet networks', () => {
      const testnetConfig: NetworkConfig = {
        name: 'Test Network',
        chainId: 2029,
        rpcUrl: 'https://test.confluxrpc.com',
        currency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
        isTestnet: true,
      };

      expect(isTestnet(testnetConfig)).toBe(true);
    });

    it('should identify mainnet networks', () => {
      const mainnetConfig: NetworkConfig = {
        name: 'Main Network',
        chainId: 2029,
        rpcUrl: 'https://main.confluxrpc.com',
        currency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
        isTestnet: false,
      };

      expect(isTestnet(mainnetConfig)).toBe(false);
    });
  });
});
```

### **5. Contract Orchestration Tests** (12 methods, 36 test cases)

#### **ContractOrchestratorManager Tests**

```typescript
describe('ContractOrchestratorManager', () => {
  let manager: ContractOrchestratorManager;

  beforeEach(() => {
    manager = new ContractOrchestratorManager();
  });

  describe('createOrchestrator', () => {
    it('should create orchestrator from deployment result', () => {
      const deploymentResult: TypedDeploymentResult = {
        contractName: 'TestToken',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        transactionHash:
          '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        blockNumber: 12345n,
        blockHash:
          '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba98',
        gasUsed: 1000000n,
        gasPrice: 20000000000n,
        abi: [
          {
            type: 'function',
            name: 'totalSupply',
            inputs: [],
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'view',
          },
        ],
        bytecode: '0x608060405234801561001057600080fd5b50...',
        deployedBytecode: '0x608060405234801561001057600080fd5b50...',
        deployedAt: new Date(),
        network: 'evm',
        networkId: '2030',
        chainId: 2030,
        evmChainId: 2030,
        chainType: 'evm',
        typesGenerated: true,
      };

      const networkConfig: NetworkConfig = {
        name: 'Test Network',
        chainId: 2030,
        evmChainId: 2030,
        rpcUrl: 'https://test.confluxrpc.com',
        currency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
        isTestnet: true,
      };

      const orchestrator = manager.createOrchestrator(
        deploymentResult,
        networkConfig
      );

      expect(orchestrator).toBeDefined();
      expect(orchestrator.name).toBe('TestToken');
      expect(orchestrator.address).toBe(
        '0x1234567890abcdef1234567890abcdef12345678'
      );
      expect(orchestrator.methods.read).toContain('totalSupply');
    });
  });

  describe('registerContract', () => {
    it('should register contract in registry', () => {
      const orchestrator: ContractOrchestrator = {
        name: 'TestToken',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        abi: '[]',
        bytecode: '0x...',
        deployedBytecode: '0x...',
        chainType: 'evm',
        networkId: '2030',
        chainId: '2030',
        evmChainId: '2030',
        network: {} as BrowserNetworkConfig,
        methods: { read: [], write: [], events: [] },
        capabilities: { read: true, write: false, events: false },
      };

      manager.registerContract(orchestrator);

      const retrieved = manager.getContract(
        '0x1234567890abcdef1234567890abcdef12345678'
      );
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('TestToken');
    });
  });
});
```

### **6. Error Handling Tests** (10 classes, 30 test cases)

#### **Error Class Tests**

```typescript
describe('Error Classes', () => {
  describe('ValidationError', () => {
    it('should create validation error with message', () => {
      const error = new ValidationError('Invalid input data');
      expect(error.message).toBe('Invalid input data');
      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should create validation error with context', () => {
      const error = new ValidationError('Invalid input data', {
        field: 'email',
      });
      expect(error.context).toEqual({ field: 'email' });
    });
  });

  describe('NetworkError', () => {
    it('should create network error with details', () => {
      const error = new NetworkError('Connection failed', {
        url: 'https://api.example.com',
      });
      expect(error.message).toBe('Connection failed');
      expect(error.name).toBe('NetworkError');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.context).toEqual({ url: 'https://api.example.com' });
    });
  });

  describe('ContractError', () => {
    it('should create contract error with contract details', () => {
      const error = new ContractError('Contract call failed', {
        contractAddress: '0x1234...',
        method: 'transfer',
      });
      expect(error.message).toBe('Contract call failed');
      expect(error.name).toBe('ContractError');
      expect(error.code).toBe('CONTRACT_ERROR');
    });
  });
});
```

### **7. Validation Schema Tests** (3 schemas, 15 test cases)

#### **Network Schema Tests**

```typescript
describe('Network Schema Validation', () => {
  it('should validate correct network config', () => {
    const validConfig = {
      name: 'Test Network',
      chainId: 2029,
      evmChainId: 2030,
      rpcUrl: 'https://test.confluxrpc.com',
      currency: {
        name: 'Conflux',
        symbol: 'CFX',
        decimals: 18,
      },
      isTestnet: true,
    };

    const result = networkSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('should reject invalid network config', () => {
    const invalidConfig = {
      name: 'Test Network',
      chainId: 'invalid', // Should be number
      rpcUrl: 'not-a-url', // Should be valid URL
    };

    const result = networkSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength(2); // Two validation errors
    }
  });
});
```

## 📊 **Test Execution Plan**

### **Test Execution Order**

1. **Type Normalization** (45 tests) - 5 minutes
2. **Browser Conversion** (30 tests) - 3 minutes
3. **API Utilities** (75 tests) - 8 minutes
4. **Network Management** (24 tests) - 3 minutes
5. **Contract Orchestration** (36 tests) - 5 minutes
6. **Error Handling** (30 tests) - 3 minutes
7. **Validation Schemas** (15 tests) - 2 minutes
8. **Integration Tests** (30 tests) - 5 minutes
9. **Performance Tests** (10 tests) - 3 minutes

### **Total Execution Time**: ~37 minutes

### **Parallel Execution**: ~15 minutes (with 4 workers)

## 🎯 **Success Criteria**

### **Coverage Targets**

- **Line Coverage**: 95%+
- **Branch Coverage**: 90%+
- **Function Coverage**: 100%
- **Statement Coverage**: 95%+

### **Quality Targets**

- **All Tests Pass**: 100%
- **No Flaky Tests**: 0%
- **Clear Error Messages**: 100%
- **Well-Documented Tests**: 100%

---

**This detailed test case specification provides comprehensive coverage for all critical functionality in the core package.** 🚀
