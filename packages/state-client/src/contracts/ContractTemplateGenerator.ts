// ============================================================================
// Contract Template Generator Utility
// ============================================================================

import type { ClientContractOrchestrator } from '../types';
import { generateContractTemplate } from './useContractBusinessLogic';

export interface ContractTemplateOptions {
  // Template customization
  componentName?: string;
  includeTypes?: boolean;
  includeTests?: boolean;
  includeDocumentation?: boolean;

  // Business logic customization
  includeBusinessLogic?: boolean;
  includeEventHandlers?: boolean;
  includeStateManagement?: boolean;

  // UI customization
  includeUI?: boolean;
  uiFramework?: 'react' | 'vue' | 'angular' | 'vanilla';

  // Code style
  useTypeScript?: boolean;
  useHooks?: boolean;
  useContext?: boolean;

  // Additional features
  includeErrorHandling?: boolean;
  includeLoadingStates?: boolean;
  includeCaching?: boolean;
  includeValidation?: boolean;
}

export class ContractTemplateGenerator {
  private options: Required<ContractTemplateOptions>;

  constructor(options: ContractTemplateOptions = {}) {
    this.options = {
      componentName: options.componentName || 'ContractComponent',
      includeTypes: options.includeTypes ?? true,
      includeTests: options.includeTests ?? false,
      includeDocumentation: options.includeDocumentation ?? true,
      includeBusinessLogic: options.includeBusinessLogic ?? true,
      includeEventHandlers: options.includeEventHandlers ?? true,
      includeStateManagement: options.includeStateManagement ?? true,
      includeUI: options.includeUI ?? true,
      uiFramework: options.uiFramework || 'react',
      useTypeScript: options.useTypeScript ?? true,
      useHooks: options.useHooks ?? true,
      useContext: options.useContext ?? false,
      includeErrorHandling: options.includeErrorHandling ?? true,
      includeLoadingStates: options.includeLoadingStates ?? true,
      includeCaching: options.includeCaching ?? false,
      includeValidation: options.includeValidation ?? true,
    };
  }

  // ========================================================================
  // Main Template Generation
  // ========================================================================

  generateTemplate(contract: ClientContractOrchestrator): string {
    const contractName = contract.name || 'Contract';
    const contractAddress = contract.address;

    let template = '';

    // Add file header
    template += this.generateFileHeader(contract);

    // Add imports
    template += this.generateImports(contract);

    // Add types if requested
    if (this.options.includeTypes) {
      template += this.generateTypes(contract);
    }

    // Add main component
    template += this.generateMainComponent(contract);

    // Add custom hooks
    if (this.options.useHooks) {
      template += this.generateCustomHooks(contract);
    }

    // Add context if requested
    if (this.options.useContext) {
      template += this.generateContext(contract);
    }

    // Add business logic
    if (this.options.includeBusinessLogic) {
      template += this.generateBusinessLogic(contract);
    }

    // Add tests if requested
    if (this.options.includeTests) {
      template += this.generateTests(contract);
    }

    // Add documentation if requested
    if (this.options.includeDocumentation) {
      template += this.generateDocumentation(contract);
    }

    return template;
  }

  // ========================================================================
  // Template Sections
  // ========================================================================

  private generateFileHeader(contract: ClientContractOrchestrator): string {
    const contractName = contract.name || 'Contract';
    const contractAddress = contract.address;

    return `// ============================================================================
// ${contractName} Business Logic Template
// Generated for contract: ${contractAddress}
// Generated at: ${new Date().toISOString()}
// ============================================================================

`;
  }

  private generateImports(contract: ClientContractOrchestrator): string {
    const imports = [
      "import React from 'react';",
      'import {',
      '  useContractBusinessLogic,',
      '  useContractReadMethods,',
      '  useContractWriteMethods,',
      '  useContractEvents,',
      '  useContractBusinessState,',
      '  useContractConfig,',
      '  useContractErrors,',
      '  useContractLoading,',
      "} from '@conflux-devkit/state-client';",
    ];

    if (this.options.includeTypes) {
      imports.push(
        "import type { ClientContractOrchestrator } from '@conflux-devkit/state-client';"
      );
    }

    if (this.options.includeValidation) {
      imports.push("import { z } from 'zod';");
    }

    if (this.options.includeCaching) {
      imports.push(
        "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';"
      );
    }

    return imports.join('\n') + '\n\n';
  }

  private generateTypes(contract: ClientContractOrchestrator): string {
    const contractName = contract.name || 'Contract';

    return `// ============================================================================
// ${contractName} Types
// ============================================================================

export interface ${contractName}Props {
  contract: ClientContractOrchestrator;
  onMethodCall?: (methodName: string, args: unknown[], result: unknown) => void;
  onError?: (error: Error) => void;
}

export interface ${contractName}State {
  // Add your custom state types here
  isLoading: boolean;
  error: string | null;
  data: Record<string, unknown>;
}

export interface ${contractName}Actions {
  // Add your custom action types here
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setData: (key: string, value: unknown) => void;
}

`;
  }

  private generateMainComponent(contract: ClientContractOrchestrator): string {
    const contractName = contract.name || 'Contract';
    const contractAddress = contract.address;

    const readMethods = contract.methods?.read || [];
    const writeMethods = contract.methods?.write || [];
    const events = contract.methods?.events || [];

    return `// ============================================================================
// ${contractName} Component
// ============================================================================

export function ${contractName}Component({ contract, onMethodCall, onError }: ${contractName}Props) {
  // Main contract business logic
  const {
    methods,
    calls,
    events: eventStates,
    businessState,
    config,
    callReadMethod,
    callWriteMethod,
    subscribeToEvent,
    unsubscribeFromEvent,
    setBusinessState,
    updateConfig,
  } = useContractBusinessLogic(contract);

  // Specialized hooks
  const { readMethods, callMethod: callRead } = useContractReadMethods(contract);
  const { writeMethods, callMethod: callWrite } = useContractWriteMethods(contract);
  const { events, useEventSubscription } = useContractEvents(contract);
  const { businessState: state, setBusinessState: setState } = useContractBusinessState(contract);
  const { config: contractConfig, updateConfig: updateContractConfig } = useContractConfig(contract);
  const { errors, hasErrors } = useContractErrors(contract);
  const { isLoading } = useContractLoading(contract);

  // ============================================================================
  // Read Methods
  // ============================================================================

${readMethods
  .map(
    method => `  const handle${method.name} = async (args: unknown[]) => {
    try {
      const result = await callRead('${method.name}', args);
      console.log('${method.name} result:', result);
      onMethodCall?.('${method.name}', args, result);
      return result;
    } catch (error) {
      console.error('${method.name} error:', error);
      onError?.(error as Error);
      throw error;
    }
  };`
  )
  .join('\n\n')}

  // ============================================================================
  // Write Methods
  // ============================================================================

${writeMethods
  .map(
    method => `  const handle${method.name} = async (args: unknown[], options?: any) => {
    try {
      const transactionHash = await callWrite('${method.name}', args, options);
      console.log('${method.name} transaction:', transactionHash);
      onMethodCall?.('${method.name}', args, transactionHash);
      return transactionHash;
    } catch (error) {
      console.error('${method.name} error:', error);
      onError?.(error as Error);
      throw error;
    }
  };`
  )
  .join('\n\n')}

  // ============================================================================
  // Event Subscriptions
  // ============================================================================

${events
  .map(
    event => `  // Subscribe to ${event.name} event
  useEventSubscription('${event.name}');`
  )
  .join('\n')}

  // ============================================================================
  // Business Logic State Management
  // ============================================================================

  // Add your custom business logic state here
  const customBusinessLogic = {
    // Example: track user interactions
    userInteractions: state.userInteractions || 0,
    
    // Example: track contract state
    contractState: state.contractState || 'idle',
    
    // Add more custom state as needed
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

${events
  .map(
    event => `  const handle${event.name}Event = (eventData: any) => {
    console.log('${event.name} event received:', eventData);
    // Add your custom event handling logic here
  };`
  )
  .join('\n\n')}

  // ============================================================================
  // Component Render
  // ============================================================================

  return (
    <div className="${contractName.toLowerCase()}-component">
      <h2>${contractName} Contract</h2>
      <p>Address: {contractAddress}</p>
      
      {/* Read Methods */}
      <div className="read-methods">
        <h3>Read Methods</h3>
        {readMethods.map(method => (
          <div key={method.name} className="method">
            <h4>{method.name}</h4>
            <p>Inputs: {method.inputs.map(input => \`\${input.name}: \${input.type}\`).join(', ')}</p>
            <p>Outputs: {method.outputs.map(output => \`\${output.name}: \${output.type}\`).join(', ')}</p>
            <button onClick={() => handle${method.name}([])}>
              Call {method.name}
            </button>
          </div>
        ))}
      </div>

      {/* Write Methods */}
      <div className="write-methods">
        <h3>Write Methods</h3>
        {writeMethods.map(method => (
          <div key={method.name} className="method">
            <h4>{method.name}</h4>
            <p>Inputs: {method.inputs.map(input => \`\${input.name}: \${input.type}\`).join(', ')}</p>
            <p>State Mutability: {method.stateMutability}</p>
            <button onClick={() => handle${method.name}([], {})}>
              Call {method.name}
            </button>
          </div>
        ))}
      </div>

      {/* Events */}
      <div className="events">
        <h3>Events</h3>
        {events.map(event => (
          <div key={event.name} className="event">
            <h4>{event.name}</h4>
            <p>Inputs: {event.inputs.map(input => \`\${input.name}: \${input.type}\`).join(', ')}</p>
            <p>Anonymous: {event.anonymous ? 'Yes' : 'No'}</p>
          </div>
        ))}
      </div>

      {/* Business Logic State */}
      <div className="business-state">
        <h3>Business Logic State</h3>
        <pre>{JSON.stringify(customBusinessLogic, null, 2)}</pre>
      </div>

      {/* Error Display */}
      {hasErrors() && (
        <div className="errors">
          <h3>Errors</h3>
          <pre>{JSON.stringify(errors, null, 2)}</pre>
        </div>
      )}

      {/* Loading State */}
      {isLoading() && (
        <div className="loading">
          <p>Loading...</p>
        </div>
      )}
    </div>
  );
}

`;
  }

  private generateCustomHooks(contract: ClientContractOrchestrator): string {
    const contractName = contract.name || 'Contract';

    return `// ============================================================================
// Custom Hooks for ${contractName}
// ============================================================================

// Hook for ${contractName} read operations
export function use${contractName}Read() {
  const { readMethods, callMethod, getMethodCalls, isMethodLoading } = useContractReadMethods(contract);
  
  return {
    methods: readMethods,
    call: callMethod,
    getCalls: getMethodCalls,
    isLoading: isMethodLoading,
  };
}

// Hook for ${contractName} write operations
export function use${contractName}Write() {
  const { writeMethods, callMethod, getMethodCalls, isMethodLoading } = useContractWriteMethods(contract);
  
  return {
    methods: writeMethods,
    call: callMethod,
    getCalls: getMethodCalls,
    isLoading: isMethodLoading,
  };
}

// Hook for ${contractName} events
export function use${contractName}Events() {
  const { events, useEventSubscription, getEventsByName, isEventSubscribed } = useContractEvents(contract);
  
  return {
    events,
    subscribe: useEventSubscription,
    getEvents: getEventsByName,
    isSubscribed: isEventSubscribed,
  };
}

// Hook for ${contractName} business state
export function use${contractName}BusinessState() {
  const { businessState, setBusinessState, getBusinessState, resetBusinessState } = useContractBusinessState(contract);
  
  return {
    state: businessState,
    set: setBusinessState,
    get: getBusinessState,
    reset: resetBusinessState,
  };
}

`;
  }

  private generateContext(contract: ClientContractOrchestrator): string {
    const contractName = contract.name || 'Contract';

    return `// ============================================================================
// ${contractName} Context
// ============================================================================

const ${contractName}Context = React.createContext<{
  contract: ClientContractOrchestrator;
  businessLogic: ReturnType<typeof useContractBusinessLogic>;
} | null>(null);

export function ${contractName}Provider({ children, contract }: { children: React.ReactNode; contract: ClientContractOrchestrator }) {
  const businessLogic = useContractBusinessLogic(contract);
  
  return (
    <${contractName}Context.Provider value={{ contract, businessLogic }}>
      {children}
    </${contractName}Context.Provider>
  );
}

export function use${contractName}Context() {
  const context = React.useContext(${contractName}Context);
  if (!context) {
    throw new Error('use${contractName}Context must be used within a ${contractName}Provider');
  }
  return context;
}

`;
  }

  private generateBusinessLogic(contract: ClientContractOrchestrator): string {
    const contractName = contract.name || 'Contract';

    return `// ============================================================================
// ${contractName} Business Logic
// ============================================================================

export class ${contractName}BusinessLogic {
  private contract: ClientContractOrchestrator;
  private businessState: Map<string, unknown> = new Map();

  constructor(contract: ClientContractOrchestrator) {
    this.contract = contract;
  }

  // Add your custom business logic methods here
  async processData(data: unknown): Promise<unknown> {
    // Implement your business logic here
    return data;
  }

  async validateInput(input: unknown): Promise<boolean> {
    // Implement your validation logic here
    return true;
  }

  async handleError(error: Error): Promise<void> {
    // Implement your error handling logic here
    console.error('Business logic error:', error);
  }

  // State management methods
  setState(key: string, value: unknown): void {
    this.businessState.set(key, value);
  }

  getState(key: string): unknown {
    return this.businessState.get(key);
  }

  clearState(): void {
    this.businessState.clear();
  }
}

`;
  }

  private generateTests(contract: ClientContractOrchestrator): string {
    const contractName = contract.name || 'Contract';

    return `// ============================================================================
// ${contractName} Tests
// ============================================================================

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ${contractName}Component } from './${contractName}Component';

describe('${contractName}Component', () => {
  const mockContract = {
    address: '0x1234567890123456789012345678901234567890',
    name: '${contractName}',
    abi: [],
    methods: {
      read: [],
      write: [],
      events: [],
    },
  } as ClientContractOrchestrator;

  it('renders contract information', () => {
    render(<${contractName}Component contract={mockContract} />);
    
    expect(screen.getByText('${contractName} Contract')).toBeInTheDocument();
    expect(screen.getByText('Address: 0x1234567890123456789012345678901234567890')).toBeInTheDocument();
  });

  it('handles method calls', async () => {
    const onMethodCall = jest.fn();
    render(<${contractName}Component contract={mockContract} onMethodCall={onMethodCall} />);
    
    // Add your test cases here
  });

  it('handles errors', async () => {
    const onError = jest.fn();
    render(<${contractName}Component contract={mockContract} onError={onError} />);
    
    // Add your error test cases here
  });
});

`;
  }

  private generateDocumentation(contract: ClientContractOrchestrator): string {
    const contractName = contract.name || 'Contract';
    const contractAddress = contract.address;

    return `// ============================================================================
// ${contractName} Documentation
// ============================================================================

/**
 * ${contractName} Contract Business Logic
 * 
 * This file contains the business logic for the ${contractName} contract.
 * It provides a complete template for interacting with the contract including:
 * 
 * - Read method calls
 * - Write method calls
 * - Event subscriptions
 * - Business state management
 * - Error handling
 * - Loading states
 * 
 * Contract Address: ${contractAddress}
 * 
 * @example
 * \`\`\`typescript
 * import { ${contractName}Component } from './${contractName}Component';
 * 
 * function App() {
 *   return (
 *     <${contractName}Component 
 *       contract={contractInstance}
 *       onMethodCall={(method, args, result) => console.log(method, result)}
 *       onError={(error) => console.error(error)}
 *     />
 *   );
 * }
 * \`\`\`
 * 
 * @example
 * \`\`\`typescript
 * import { use${contractName}Read, use${contractName}Write } from './${contractName}Component';
 * 
 * function CustomComponent() {
 *   const { methods: readMethods, call: callRead } = use${contractName}Read();
 *   const { methods: writeMethods, call: callWrite } = use${contractName}Write();
 *   
 *   const handleRead = async () => {
 *     const result = await callRead('methodName', [arg1, arg2]);
 *     console.log(result);
 *   };
 *   
 *   const handleWrite = async () => {
 *     const txHash = await callWrite('methodName', [arg1, arg2]);
 *     console.log(txHash);
 *   };
 *   
 *   return (
 *     <div>
 *       <button onClick={handleRead}>Read</button>
 *       <button onClick={handleWrite}>Write</button>
 *     </div>
 *   );
 * }
 * \`\`\`
 */

`;
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  generateFile(
    contract: ClientContractOrchestrator,
    filename?: string
  ): { filename: string; content: string } {
    const contractName = contract.name || 'Contract';
    const defaultFilename = `${contractName}Component.${this.options.useTypeScript ? 'tsx' : 'jsx'}`;

    return {
      filename: filename || defaultFilename,
      content: this.generateTemplate(contract),
    };
  }

  generateMultipleFiles(
    contract: ClientContractOrchestrator
  ): Array<{ filename: string; content: string }> {
    const contractName = contract.name || 'Contract';
    const files: Array<{ filename: string; content: string }> = [];

    // Main component file
    files.push({
      filename: `${contractName}Component.${this.options.useTypeScript ? 'tsx' : 'jsx'}`,
      content: this.generateTemplate(contract),
    });

    // Types file
    if (this.options.includeTypes) {
      files.push({
        filename: `${contractName}Types.${this.options.useTypeScript ? 'ts' : 'js'}`,
        content: this.generateTypes(contract),
      });
    }

    // Hooks file
    if (this.options.useHooks) {
      files.push({
        filename: `use${contractName}Hooks.${this.options.useTypeScript ? 'ts' : 'js'}`,
        content: this.generateCustomHooks(contract),
      });
    }

    // Context file
    if (this.options.useContext) {
      files.push({
        filename: `${contractName}Context.${this.options.useTypeScript ? 'tsx' : 'jsx'}`,
        content: this.generateContext(contract),
      });
    }

    // Business logic file
    if (this.options.includeBusinessLogic) {
      files.push({
        filename: `${contractName}BusinessLogic.${this.options.useTypeScript ? 'ts' : 'js'}`,
        content: this.generateBusinessLogic(contract),
      });
    }

    // Tests file
    if (this.options.includeTests) {
      files.push({
        filename: `${contractName}Component.test.${this.options.useTypeScript ? 'tsx' : 'jsx'}`,
        content: this.generateTests(contract),
      });
    }

    return files;
  }
}
