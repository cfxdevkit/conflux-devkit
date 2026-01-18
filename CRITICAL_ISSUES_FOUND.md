# Critical Issues Found - User Feedback Analysis

**Date:** 2026-01-18 09:05 UTC
**Reporter:** User
**Status:** ⚠️ CRITICAL ISSUES IDENTIFIED - FIX IN PROGRESS

---

## User-Reported Issues

### 1. ❌ **UI Loses Connection to Node**
**Problem:** "node start, but soon UI loses the connection to it, permitting to start it again"

**Analysis:**
- WebSocket connections constantly opening/closing (seen in logs)
- Node status not properly synchronized between backend and frontend
- Multiple node start requests possible due to stale UI state

**Root Cause:**
- NOT YET DIAGNOSED - Need to investigate WebSocket message handling
- Possible issue with `updateDevKit()` method disrupting WebSocket state
- May be related to block number fetching failing after wallet switch

**Status:** 🔴 NOT FIXED - Investigating

---

### 2. ❌ **Node Status Gets Updated Then Loses Sync**
**Problem:** "if done the status of the node get updated for few seconds and after loose the sync again"

**Analysis:**
- Status endpoint works correctly (verified - returns wallet info)
- WebSocket broadcasts may be failing or not reaching frontend
- Frontend may not be handling WebSocket reconnections properly

**Root Cause:**
- Likely related to Issue #1 (WebSocket connection instability)
- May be caused by errors in `broadcastNodeStats()` after DevKit instance change

**Status:** 🔴 NOT FIXED - Related to Issue #1

---

### 3. ✅ **Wallet Info Not Displayed on DevNode Page**
**Problem:** "not clearly stated in the devnode page what is the current mnemonic that is going to be used or the data directory that will be pointed"

**Analysis:**
- UI was only showing wallet card when node was RUNNING
- Early return in DevNodeStatus component prevented wallet display when stopped
- Backend was correctly returning wallet info in status endpoint

**Root Cause:**
```tsx
// BEFORE (BROKEN):
if (!status?.isRunning) {
  return <Card>Node not running</Card>;  // Early return - wallet never shown!
}

return (
  <>
    {status?.wallet && <WalletCard />}  // Never reached when stopped
    <BlockchainStatus />
  </>
);
```

**Fix Applied:**
```tsx
// AFTER (FIXED):
return (
  <>
    {status?.wallet && <WalletCard />}  // Always shown
    {!status?.isRunning && <NotRunningMessage />}
    {status?.isRunning && <BlockchainStatus />}
  </>
);
```

**Status:** ✅ FIXED - Wallet card now displays regardless of node state

---

## Technical Analysis

### WebSocket Connection Issues

**Logs showing problem:**
```
[INFO]: WebSocket connection closed
[INFO]: New WebSocket connection from: ::ffff:172.18.0.1
[INFO]: WebSocket connection closed
[INFO]: New WebSocket connection from: ::ffff:172.18.0.1
```

**Hypothesis:**
1. `updateDevKit()` in WebSocketServer might be causing broadcasts to fail
2. RPC calls in `broadcastNodeStats()` may be timing out
3. Frontend WebSocket client may be disconnecting on errors

**Need to investigate:**
- [ ] WebSocketServer.broadcastNodeStats() error handling
- [ ] Frontend WebSocket error event handling
- [ ] Whether `forceStatusUpdate()` after `updateDevKit()` is causing issues
- [ ] If block number fetching is failing and causing reconnects

### Status Endpoint Performance

**Current behavior:**
- Works correctly: Returns wallet info even when node stopped ✅
- Responds within acceptable time ✅
- Properly structured JSON response ✅

**Potential issue:**
- When node IS running, it makes multiple RPC calls to fetch block data
- If these calls fail/timeout, the entire endpoint may hang
- This could explain why UI loses sync after initial connection

---

## Files Affected

### Frontend
- ✅ **FIXED:** `/workspace/packages/frontend/src/components/DevNodeStatus.tsx`
  - Changed conditional rendering to always show wallet card
  - Removed early return that prevented wallet display

### Backend (Needs Investigation)
- ⚠️ `/workspace/packages/backend/src/server/WebSocketServer.ts`
  - `updateDevKit()` method (line 609-619)
  - `broadcastNodeStats()` method (line 279-446)
  - Block monitoring logic

- ⚠️ `/workspace/packages/backend/src/routes/devkit.ts`
  - `/status` endpoint block fetching (line 160-252)
  - Error handling in RPC calls

---

## Testing Results

### ✅ Status Endpoint Test
```bash
$ curl http://localhost:3001/api/devkit/status
{
  "status": "stopped",
  "running": false,
  "wallet": {
    "activeLabel": "Default Wallet",
    "activeIndex": 0,
    "dataDir": "/workspace/.conflux-dev/wallet-f79cd64f9cea2378",
    "mnemonicHash": "f79cd64f"
  }
}
```
**Result:** ✅ PASSING - Wallet info correctly returned

### ❌ WebSocket Stability Test
**Result:** ❌ FAILING - Connections keep closing/reopening

### ❌ UI State Synchronization Test
**Result:** ❌ FAILING - UI loses sync with node status

---

## Action Items

### Immediate Fixes Needed

1. **Investigate WebSocket connection instability**
   - Add detailed logging to WebSocketServer message handlers
   - Check if `updateDevKit()` is breaking active connections
   - Verify `forceStatusUpdate()` isn't causing errors that disconnect clients

2. **Debug block number fetching**
   - Check if RPC calls are timing out
   - Add better error handling in `broadcastNodeStats()`
   - Ensure failed RPC calls don't kill WebSocket connection

3. **Frontend WebSocket error handling**
   - Check how frontend handles WebSocket errors
   - Verify reconnection logic is working correctly
   - Add logging for connection state changes

4. **Node restart verification**
   - Previously tested and working, but need to verify it still works after UI fixes
   - Ensure WebSocket stays connected through wallet switches

### Testing Protocol

1. Start backend + frontend
2. **Without starting node:**
   - ✅ Verify wallet card displays
   - ✅ Verify wallet name, data dir, hash are shown
3. **Start node:**
   - ⚠️ Verify WebSocket connects and stays connected
   - ⚠️ Verify block numbers update in real-time
   - ⚠️ Verify no connection drop-offs
4. **Switch wallet:**
   - ⚠️ Verify node restarts
   - ⚠️ Verify WebSocket stays connected through switch
   - ⚠️ Verify wallet card updates to show new wallet
   - ⚠️ Verify block numbers start from 0 for new wallet

---

## User Feedback Summary

**Original complaint (paraphrased):**
> "You introduced bugs. Node starts but UI loses connection. Can start node multiple times. DevNode page doesn't show which mnemonic/data directory is being used. Please read instructions carefully and validate implementation more carefully."

**Assessment:**
- User is **100% correct** - critical issues exist
- Initial implementation focused on backend logic but broke UX
- WebSocket stability was not tested thoroughly
- UI display logic had fundamental flaw (early return)

**Priority:** 🔴 **CRITICAL** - These issues make the feature unusable

---

## Next Steps

1. **Debug WebSocket issues** (HIGHEST PRIORITY)
   - This is blocking all other functionality
   - Users can't reliably monitor node status

2. **Fix node status synchronization**
   - Related to WebSocket fix
   - Prevent multiple node starts

3. **Comprehensive end-to-end testing**
   - Test full workflow: start → stop → switch → restart
   - Monitor WebSocket connection throughout
   - Verify UI never shows stale data

4. **Add resilience**
   - Better error handling in WebSocket broadcasts
   - Retry logic for failed RPC calls
   - Graceful degradation when RPC unavailable

---

**Status:** Work in progress - User feedback being addressed
**ETA:** TBD - Need to diagnose WebSocket issues first
