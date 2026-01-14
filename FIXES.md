# Comprehensive Fixes for DevNode Frontend Issues

## Issue 1: Block Numbers Not Showing ❌

**Problem**: Backend returns chains without `blockNumber` and `gasPrice`
**Root Cause**: RPC client calls are failing silently

### Diagnosis:
The backend code tries to fetch block data but the calls are failing. Check backend logs for:
- "Fetching block data from RPC endpoints..."
- "Failed to fetch Core Space block data:" (with error details)
- "Failed to fetch eSpace block data:" (with error details)

### Potential Causes:
1. The `@conflux-devkit/node` package might not export `CoreClient` and `EspaceClient` correctly
2. The clients might need different initialization parameters
3. RPC endpoints might not be ready when status is called

### Solution: Use DevKit's built-in clients directly

Instead of creating new client instances, we should use the DevKit instance's existing clients:

```typescript
// In backend/src/routes/devkit.ts around line 118

if (isRunning) {
  try {
    // Use DevKit's internal clients through first account
    const account = accounts[0];

    // Get Core Space block data
    try {
      const coreBlockNumber = await account.core.publicClient.getEpochNumber();
      const coreGasPrice = await account.core.publicClient.getGasPrice();
      coreBlockData = {
        blockNumber: Number(coreBlockNumber),
        gasPrice: coreGasPrice.toString(),
      };
      logger.info('Core Space block data fetched:', coreBlockData);
    } catch (error) {
      logger.error('Failed to fetch Core Space block data:', error);
    }

    // Get eSpace block data
    try {
      const evmBlockNumber = await account.evm.publicClient.getBlockNumber();
      const evmGasPrice = await account.evm.publicClient.getGasPrice();
      evmBlockData = {
        blockNumber: Number(evmBlockNumber),
        gasPrice: evmGasPrice.toString(),
      };
      logger.info('eSpace block data fetched:', evmBlockData);
    } catch (error) {
      logger.error('Failed to fetch eSpace block data:', error);
    }
  } catch (error) {
    logger.error('Failed to fetch block data:', error);
  }
}
```

**Note**: The publicClient is private, so we need to check if DevKit accounts expose these methods directly or if we need a different approach.

---

## Issue 2: Start Button Not Showing Loading State ❌

**Problem**: Button doesn't show loading/disabled state while node is starting
**Location**: `packages/frontend-devnode/src/stores/devnodeStore.ts:58-73`

### Root Cause:
The store sets `isLoading: false` immediately after `fetchStatus()` completes, but node startup takes several seconds.

### Solution: Poll status until node is running

```typescript
// In packages/frontend-devnode/src/stores/devnodeStore.ts

startNode: async () => {
  try {
    console.log('Starting node...');
    set({ isLoading: true, error: null });
    const result = await apiClient.startNode();
    console.log('Start node result:', result);

    // Poll status until node is running (max 30 seconds)
    const maxAttempts = 30;
    let attempts = 0;
    let nodeStarted = false;

    while (attempts < maxAttempts && !nodeStarted) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      const status = await apiClient.getDevKitStatus();

      if (status.isRunning) {
        nodeStarted = true;
        set({ status, isLoading: false });
        console.log('Node started successfully after', attempts + 1, 'seconds');
      }

      attempts++;
    }

    if (!nodeStarted) {
      // Timeout - fetch final status
      await get().fetchStatus();
      set({ isLoading: false });
      console.warn('Node start timeout after 30 seconds');
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Failed to start node';
    console.error('Failed to start node:', error);
    set({ error: errorMessage, isLoading: false });
    throw error;
  }
},
```

---

## Issue 3: Mining Configuration Returns 500 Error ❌

**Problem**: Mining toggle and configuration endpoints failing
**Location**: Backend mining routes

### Likely Causes:
1. Mining interval endpoint might be missing or have wrong parameter structure
2. DevKit mining methods might have changed

### Solution: Check backend mining routes

Need to verify these endpoints in `packages/backend/src/routes/devkit.ts`:
- POST `/api/devkit/mining/start`
- POST `/api/devkit/mining/stop`
- POST `/api/devkit/mining/interval`

Check if they match DevKit's API:
- `devkit.startMining()`
- `devkit.stopMining()`
- `devkit.setMiningInterval(interval)` or similar

---

## Immediate Actions to Take:

### 1. Start the node and check backend logs:
```bash
# Terminal 1 - Backend with logs
cd packages/backend
pnpm dev

# Terminal 2 - Frontend
cd packages/frontend-devnode
pnpm dev

# Terminal 3 - Watch backend logs
tail -f /path/to/backend/logs
```

### 2. Test the node manually:
```bash
# In the browser console after starting node:
fetch('http://localhost:3001/api/devkit/status')
  .then(r => r.json())
  .then(d => console.log('Status:', d));
```

### 3. Check if accounts have accessible clients:
```bash
# Create test script: packages/backend/test-account-clients.mjs
```

---

## Next Steps Priority:

1. ✅ **[HIGH]** Fix block number fetching - this is critical for UX
2. ✅ **[HIGH]** Fix start button loading state - important for UX
3. ⚠️ **[MEDIUM]** Fix mining configuration - currently breaking but has workaround
4. ✅ **[LOW]** Add WebSocket real-time updates - for better performance

---

## Testing Checklist:

- [ ] Start node - button shows loading state
- [ ] Block numbers appear when node is running
- [ ] Block numbers increment as mining produces blocks
- [ ] Gas prices show actual values
- [ ] Mining toggle works without 500 error
- [ ] Mining interval can be adjusted
- [ ] Stop node works correctly
- [ ] Restart node works correctly
- [ ] Accounts load correctly
- [ ] Faucet requests work
