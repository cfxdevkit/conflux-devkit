# Simple dApp Example

This example demonstrates the modular architecture of Conflux DevKit using:

- **@conflux-devkit/ui-headless**: Headless React components
- **@conflux-devkit/wallet**: Advanced wallet features
- **@conflux-devkit/contracts**: Contract interactions

## Features Demonstrated

1. **Wallet Connection**
   - ConnectButton with custom render prop
   - AccountCard with balance display

2. **Contract Interaction**
   - Reading ERC20 token information
   - Custom UI with render props

3. **Token Swap**
   - Swappi DEX integration
   - Quote fetching and swap execution

## Running the Example

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Architecture Benefits

This example shows how the modular architecture enables:

- ✅ **Flexibility**: Use render props for complete UI control
- ✅ **Simplicity**: Or use default styling for rapid development
- ✅ **Type Safety**: Full TypeScript support throughout
- ✅ **Modularity**: Import only what you need
- ✅ **Customization**: Easy to adapt to any design system

## Code Highlights

### Custom Wallet Button

```tsx
<ConnectButton>
  {({ isConnected, address, connect, disconnect }) => (
    <button onClick={isConnected ? disconnect : connect}>
      {isConnected ? `Connected: ${address}` : 'Connect Wallet'}
    </button>
  )}
</ConnectButton>
```

### Contract Reading

```tsx
<ContractReader
  address="0x..."
  abi={ERC20_ABI}
  functionName="name"
  chain="evm"
>
  {({ read, result, isLoading }) => (
    <div>
      <button onClick={() => read()}>Read Name</button>
      {result && <p>Token: {result}</p>}
    </div>
  )}
</ContractReader>
```

### Token Swap

```tsx
<SwapWidget
  defaultSlippage={0.5}
  onSuccess={(hash) => console.log('Success:', hash)}
>
  {({ getQuote, executeSwap, quote }) => (
    <div>
      <button onClick={() => getQuote('WCFX', 'USDT', '1.0')}>
        Get Quote
      </button>
      {quote && (
        <>
          <p>You get: {quote.amountOut}</p>
          <button onClick={executeSwap}>Swap</button>
        </>
      )}
    </div>
  )}
</SwapWidget>
```

## Learn More

- [Conflux DevKit Documentation](https://github.com/conflux-devkit/conflux-devkit)
- [UI Headless Components](../../packages/ui-headless/README.md)
- [Wallet Package](../../packages/wallet/README.md)
- [Contracts Package](../../packages/contracts/README.md)
