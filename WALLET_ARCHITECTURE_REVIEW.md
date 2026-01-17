# Wallet & Mnemonic Management Architecture Review

## Current Issues

### 🔴 Critical Issue: Node Doesn't Restart on Mnemonic Change

**Problem**: When a new mnemonic is added and set as active via `/wallet/keystore/select`, the DevNode continues running with the old mnemonic.

**Impact**:
- Blockchain state mismatch: Node uses old accounts, but KeystoreService thinks it's using new ones
- Data directory mismatch: Node writes to old data dir while KeystoreService expects new one
- Account/balance confusion: Frontend queries show wrong accounts for the running blockchain

**Root Cause**: The backend (BackendServer) initializes DevKitCompat once on startup with a mnemonic. Changing the active mnemonic in KeystoreService doesn't propagate to the running node.

---

### 🟡 Design Issue: Auth Tied to Active Mnemonic

**Problem**: Admin address is derived from the active mnemonic's first account (m/44'/60'/0'/0/0).

**Impact**:
- Changing active mnemonic changes the admin address
- User loses admin access when switching wallets
- Cannot have a stable admin account across different development mnemonics

**Current Flow**:
```
DevelopmentAuthService.initialize() 
  → devkit.getEthereumAdminAddress()
    → Uses first account of active mnemonic
```

---

### 🟡 Architectural Concern: Coupling of Management & Development

**Problem**: Same mnemonic used for both:
1. **Management Operations**: Auth, API access, configuration changes
2. **Development Operations**: Contract deployment, testing, transaction signing

**User's Proposed Solution**:
- **Admin Wallet**: Independent from active mnemonic, stable for management
- **Active Mnemonic**: Used for blockchain development, can be changed freely
- **First address of mnemonic = admin of that mnemonic**: Each mnemonic has its own admin

---

## Proposed Architecture

### Core Concepts

1. **Admin Private Key**: 
   - Stored separately from mnemonics
   - Used for authentication and management operations
   - Can be set explicitly or default to first account of default mnemonic
   - Persists across mnemonic changes

2. **Active Mnemonic**:
   - Used by DevNode for blockchain operations
   - Has its own data directory (already implemented)
   - Can be changed, triggering node restart
   - Has its own "mnemonic admin" (first derived account)

3. **Mnemonic Admin**:
   - First account derived from each mnemonic (index 0)
   - Owner/admin for that specific mnemonic's operations
   - Stored with mnemonic metadata

---

## Implementation Plan

### Phase 1: Separate Admin Wallet from Active Mnemonic ✅ TODO

**Changes Needed**:

1. **KeystoreService Enhancement**:
   ```typescript
   interface KeystoreData {
     entries: Array<{ mnemonic: string; label: string; type: string }>;
     activeIndex: number;
     adminPrivateKey?: string; // NEW: Independent admin key
   }
   
   class KeystoreService {
     // NEW methods
     setAdminPrivateKey(privateKey: string): Promise<void>
     getAdminPrivateKey(): string | null
     getAdminAddress(): string | null
     
     // Returns first address of mnemonic
     getMnemonicAdmin(index: number): string
   }
   ```

2. **DevelopmentAuthService Update**:
   ```typescript
   async initialize() {
     // Priority order:
     // 1. KeystoreService.getAdminPrivateKey() (if set)
     // 2. ENV variable
     // 3. First account of default mnemonic
     
     const keystoreAdmin = getKeystoreService().getAdminAddress();
     if (keystoreAdmin) {
       this.adminAddress = keystoreAdmin;
     } else {
       // Fallback to current logic
     }
   }
   ```

3. **New API Endpoints**:
   ```
   POST /wallet/admin/set-private-key    - Set admin private key
   GET  /wallet/admin/info                - Get admin address/info
   POST /wallet/admin/reset               - Reset to default (first of default mnemonic)
   ```

**Benefits**:
- ✅ Admin remains stable when changing mnemonics
- ✅ Can use any account as admin
- ✅ Decouples management from development

**Risks**:
- ⚠️ Need secure storage for admin private key
- ⚠️ Migration path for existing users
- ⚠️ UI needs to explain admin vs active mnemonic

---

### Phase 2: Node Restart on Mnemonic Change ✅ TODO

**Changes Needed**:

1. **BackendServer Enhancement**:
   ```typescript
   class BackendServer {
     async switchActiveMnemonic(index: number): Promise<void> {
       const keystore = getKeystoreService();
       const oldDataDir = keystore.getDataDir();
       
       // Set new active mnemonic
       await keystore.setActiveMnemonic(index);
       const newDataDir = keystore.getDataDir();
       
       if (oldDataDir !== newDataDir) {
         // Restart node with new config
         await this.restartNodeWithNewMnemonic();
       }
     }
     
     private async restartNodeWithNewMnemonic(): Promise<void> {
       // 1. Stop current node
       await this.devkit?.stop();
       
       // 2. Get new mnemonic and data dir
       const keystore = getKeystoreService();
       const newMnemonic = keystore.getActiveMnemonic();
       const newDataDir = keystore.getDataDir();
       
       // 3. Recreate DevKitCompat with new config
       this.devkit = new DevKitCompat({
         ...this.config.devkitConfig,
         mnemonic: newMnemonic,
         dataDir: newDataDir,
       });
       
       // 4. Restart node
       await this.devkit.start();
       
       // 5. Notify WebSocket clients
       this.wsServer?.broadcast({
         type: 'node_restarted',
         reason: 'mnemonic_changed',
       });
     }
   }
   ```

2. **Update `/wallet/keystore/select` Route**:
   ```typescript
   router.post('/wallet/keystore/select', async (req, res) => {
     const { index } = req.body;
     
     // Check if node is running
     const isRunning = devkit.getStatus().core.status === 'running';
     
     if (isRunning) {
       // Restart node with new mnemonic
       await backendServer.switchActiveMnemonic(index);
       res.json({
         success: true,
         message: 'Node restarted with new mnemonic',
         nodeRestarted: true,
       });
     } else {
       // Just change keystore
       await keystore.setActiveMnemonic(index);
       res.json({
         success: true,
         message: 'Active wallet changed (node not running)',
         nodeRestarted: false,
       });
     }
   });
   ```

**Benefits**:
- ✅ Node always uses correct mnemonic
- ✅ Data directory always matches active mnemonic
- ✅ No state inconsistency

**Risks**:
- ⚠️ Node restart takes time (user must wait)
- ⚠️ Active transactions/connections lost on restart
- ⚠️ Frontend needs loading state during restart
- ⚠️ Need to handle restart failures gracefully

---

### Phase 3: Enhanced Mnemonic Metadata ✅ TODO

**Changes Needed**:

1. **Keystore Entry Enhancement**:
   ```typescript
   interface KeystoreEntry {
     mnemonic: string;
     label: string;
     type: string;
     adminAddress: string;      // NEW: First derived address
     derivedAt: string;          // NEW: Timestamp
     lastUsed?: string;          // NEW: Last time set as active
   }
   ```

2. **Auto-populate on Add**:
   ```typescript
   async addMnemonic(mnemonic: string, label: string) {
     // Derive admin address
     const accounts = await this.deriveAccounts(mnemonic, 'espace', 1);
     const adminAddress = accounts[0].address;
     
     this.keystore.entries.push({
       mnemonic,
       label,
       type: 'BIP39',
       adminAddress,
       derivedAt: new Date().toISOString(),
     });
   }
   ```

**Benefits**:
- ✅ Clear ownership per mnemonic
- ✅ Better UX showing admin for each wallet
- ✅ Audit trail of wallet usage

---

## Security Considerations

### ⚠️ Server-Side Mnemonic Storage

**Current State**: Mnemonics stored in `~/.devkit.keystore.json` (unencrypted)

**TODO (User Request)**:
- [ ] Add encryption for stored mnemonics
- [ ] Consider password-based encryption
- [ ] Add option to not persist mnemonics (session-only)
- [ ] Warn users about security implications

**Options**:
1. **Encrypt with password**: User provides password on startup
2. **OS Keychain**: Use system keychain (platform-specific)
3. **Session-only**: Don't persist, require re-import each session
4. **Hybrid**: Critical mnemonics encrypted, dev ones unencrypted

---

## Migration Strategy

### For Existing Users

1. **Auto-migration on startup**:
   ```typescript
   async initializeKeystoreService() {
     const keystore = new KeystoreService();
     await keystore.load();
     
     // If no adminPrivateKey set, derive from first mnemonic
     if (!keystore.getAdminPrivateKey()) {
       const firstMnemonic = keystore.getActiveMnemonic();
       const adminAccount = await keystore.deriveAccount(firstMnemonic, 'espace', 0);
       await keystore.setAdminPrivateKey(adminAccount.privateKey);
       logger.info('Auto-set admin from first mnemonic');
     }
   }
   ```

2. **UI notification**: Inform users about the new admin wallet concept

---

## Potential Issues & Mitigations

### Issue 1: Node Restart Downtime
**Problem**: Users have to wait during restart  
**Mitigation**: 
- Show clear loading state in UI
- Estimate restart time (~2-5 seconds)
- Allow queueing operations during restart

### Issue 2: Lost Sessions on Restart
**Problem**: WebSocket connections lost  
**Mitigation**:
- Auto-reconnect logic in frontend
- Broadcast restart notification before stopping
- Grace period for clients to prepare

### Issue 3: Admin Key Compromise
**Problem**: If admin key leaked, system compromised  
**Mitigation**:
- Add ability to rotate admin key
- Multi-sig admin support (future)
- Audit log of admin actions

### Issue 4: Confusion Between Concepts
**Problem**: Users confused between admin wallet vs active mnemonic  
**Mitigation**:
- Clear UI labels and tooltips
- Documentation/help section
- Onboarding flow explaining concepts

### Issue 5: Race Conditions
**Problem**: Mnemonic changed while node restarting  
**Mitigation**:
- Lock mechanism during restart
- Queue mnemonic changes
- Return error if restart in progress

---

## UI/UX Implications

### WalletSettings Component Updates Needed:

1. **Admin Wallet Section**:
   ```tsx
   <Card title="Admin Wallet" description="Used for authentication and management">
     <Text>Current Admin: {adminAddress}</Text>
     <Button onClick={openSetAdminModal}>Change Admin</Button>
     <Button onClick={resetAdminToDefault}>Reset to Default</Button>
   </Card>
   ```

2. **Active Mnemonic Indicator**:
   ```tsx
   {entry.isActive && (
     <Badge>
       Active (Node Using This)
       {nodeStatus === 'restarting' && <Spinner />}
     </Badge>
   )}
   ```

3. **Restart Warning**:
   ```tsx
   <Modal opened={switchWarning}>
     <Text>Switching active mnemonic will restart the blockchain node.</Text>
     <Text>This will take ~5 seconds and disconnect active sessions.</Text>
     <Button onClick={confirmSwitch}>Confirm Switch</Button>
   </Modal>
   ```

---

## API Changes Summary

### New Endpoints:
- `POST /wallet/admin/set` - Set admin private key
- `GET /wallet/admin` - Get admin info
- `POST /wallet/admin/reset` - Reset to default

### Modified Endpoints:
- `POST /wallet/keystore/select` - Now triggers node restart if running
- `GET /wallet/keystore` - Include adminAddress per entry

### New WebSocket Events:
- `node_restarting` - Node about to restart
- `node_restarted` - Node finished restart
- `mnemonic_changed` - Active mnemonic changed

---

## Testing Strategy

1. **Unit Tests**:
   - KeystoreService admin operations
   - Mnemonic derivation consistency
   - Data directory switching

2. **Integration Tests**:
   - Node restart on mnemonic change
   - Auth persistence across restarts
   - Data isolation between mnemonics

3. **E2E Tests**:
   - User flow: Add mnemonic → Set active → Verify node restart
   - Admin operations work across mnemonic switches
   - Session handling during restart

---

## Questions for Clarification

1. **Admin Key Storage**: Should admin private key be encrypted or rely on filesystem permissions?

2. **Node Restart Policy**: Should it be:
   - Automatic on mnemonic change?
   - Opt-in with confirmation?
   - Only if node is running?

3. **Default Admin**: When no admin is set, should it:
   - Use first account of first mnemonic?
   - Use first account of active mnemonic?
   - Require explicit setup?

4. **Multi-Admin Support**: Should we support multiple admin accounts (future)?

5. **Mnemonic Encryption**: Priority level for implementing encryption?
   - High (block other work)
   - Medium (next sprint)
   - Low (backlog)

---

## Recommendation

**Implement in this order**:

1. ✅ **Phase 1** (Separate Admin Wallet) - High Priority
   - Solves immediate auth stability issue
   - Relatively low risk
   - Good foundation for other improvements

2. ✅ **Phase 2** (Node Restart on Change) - High Priority
   - Solves critical consistency issue
   - Medium complexity
   - Requires careful testing

3. ✅ **Phase 3** (Enhanced Metadata) - Medium Priority
   - Nice-to-have for UX
   - Low risk
   - Can be done incrementally

4. 🔒 **Mnemonic Encryption** - High Priority (Security)
   - Should not be delayed
   - User explicitly requested
   - Consider as Phase 1.5

**Estimated Timeline**:
- Phase 1: 1-2 days
- Phase 2: 2-3 days  
- Phase 3: 1 day
- Encryption: 2-3 days
- Testing/Polish: 2 days

**Total**: ~1.5-2 weeks for complete implementation
