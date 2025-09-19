# Conflux DevKit - Full Stack Refactoring Plan
## Modern Architecture with DevKit API Foundation

### 🎯 **Core Vision**
Transform the existing complex infrastructure into a streamlined, modern full-stack application leveraging our new ergonomic DevKit API as the foundation for backend services and UI communication.

---

## 📋 **Current State Analysis**

### ✅ **What We Have (Working)**
- **DevKit API** - New ergonomic unified API (packages/node/src/devkit.ts)
- **Core Infrastructure** - Node management, contract operations, account handling
- **Test Coverage** - 86/102 tests passing with comprehensive functionality validation
- **Examples** - Working TypeScript examples demonstrating the API

### 🔧 **What Needs Refactoring**
- **Backend Services** - Complex devkit-backend with legacy patterns
- **API/WebSocket Layer** - Over-engineered with unnecessary orchestration
- **Authentication** - Overly complex admin/user management
- **Frontend** - Multiple frontend packages with inconsistent patterns
- **State Management** - Complex contract state tracking (to be removed)

---

## 🏗️ **New Architecture Design**

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                     │
│                                                                 │  
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Auth Screen   │  │   Admin Panel   │  │   User Panel    │ │
│  │                 │  │                 │  │                 │ │
│  │ - Wallet Login  │  │ - Node Control  │  │ - View Status   │ │
│  │ - Role Detection│  │ - Contract Mgmt │  │ - Read Contracts│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                         WebSocket + REST API
                                │
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICES                             │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   API Server    │  │ WebSocket Server│  │  Auth Service   │ │
│  │                 │  │                 │  │                 │ │
│  │ - REST endpoints│  │ - Real-time data│  │ - Simple roles  │ │
│  │ - DevKit bridge │  │ - Event streams │  │ - JWT tokens    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                         DevKit API Layer
                                │
┌─────────────────────────────────────────────────────────────────┐
│                      DEVKIT CORE                               │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   DevKit Class  │  │ DevKitAccount   │  │  Node Manager   │ │
│  │                 │  │                 │  │                 │ │
│  │ - Unified API   │  │ - Account Ops   │  │ - Mining Control│ │
│  │ - Cross-chain   │  │ - Wallet Clients│  │ - RPC Endpoints │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 **Full Stack Goals**

### **Phase 1: Backend Services Refactoring**
1. **Simplify Backend Architecture**
   - Remove complex orchestration layers
   - Create clean DevKit API bridge
   - Simple database schema (users, sessions)
   - Clean REST + WebSocket endpoints

2. **Authentication System**
   - Wallet-based authentication only
   - Simple role detection: `admin` (account[0]) vs `user` (others)
   - JWT tokens for session management
   - No complex permissions system

3. **API Endpoints**
   ```typescript
   // Authentication
   POST /api/auth/challenge     // Get nonce for signing
   POST /api/auth/login         // Submit signature
   GET  /api/auth/me           // Current user info
   POST /api/auth/logout       // End session
   
   // Node Operations (Admin only)
   GET  /api/node/status       // Node status
   POST /api/node/start        // Start node
   POST /api/node/stop         // Stop node
   GET  /api/node/accounts     // Get all accounts
   
   // Contract Operations  
   POST /api/contracts/deploy  // Deploy contract (Admin)
   GET  /api/contracts/:id     // Get contract info (All)
   POST /api/contracts/:id/call // Call contract method (All)
   
   // WebSocket Events
   node:status         // Node status updates
   node:mining         // Mining events  
   contracts:deployed  // New deployments
   accounts:updated    // Account balance changes
   ```

### **Phase 2: Frontend Application**
1. **Single React Application**
   - Modern Vite + React + TypeScript
   - TailwindCSS for styling
   - Wagmi/Viem for wallet connection
   - React Query for API state management

2. **Authentication Flow**
   ```typescript
   // 1. Connect wallet (any supported wallet)
   // 2. Sign authentication message
   // 3. Backend validates signature
   // 4. Role assignment: admin if wallet === devkit.account(0).address.evm
   // 5. Show appropriate UI based on role
   ```

3. **UI Components**
   - **Auth Screen**: Wallet connection and login
   - **Admin Panel**: Full control (node, contracts, accounts)
   - **User Panel**: Read-only interface (status, contract calls)
   - **Real-time Updates**: WebSocket integration

### **Phase 3: Integration & Polish**
1. **Real-time Communication**
   - WebSocket integration for live updates
   - Node status monitoring
   - Mining progress tracking
   - Contract deployment notifications

2. **Error Handling & UX**
   - Proper error boundaries
   - Loading states
   - Connection status indicators
   - Graceful fallbacks

---

## 🔨 **Implementation Steps**

### **Step 1: Clean Backend Services** 
- [ ] Remove unnecessary packages and complex orchestration
- [ ] Create simple Express server with DevKit integration
- [ ] Implement wallet-based authentication
- [ ] Add clean REST API endpoints
- [ ] Setup WebSocket server for real-time updates

### **Step 2: Database Simplification**
- [ ] Simple SQLite schema (users, sessions, basic contract info)
- [ ] Remove complex state tracking
- [ ] Keep only essential data for UI

### **Step 3: Frontend Rebuild**
- [ ] Single React application with modern stack
- [ ] Wallet integration with role detection
- [ ] Admin vs User interface separation
- [ ] Real-time WebSocket integration

### **Step 4: DevKit Bridge**
- [ ] Clean integration layer between backend and DevKit API
- [ ] Expose DevKit functionality through REST/WebSocket
- [ ] Handle cross-chain operations properly
- [ ] Proper error handling and validation

---

## 💡 **Key Design Principles**

1. **Simplicity First**: Remove unnecessary complexity
2. **DevKit Foundation**: Leverage our proven DevKit API
3. **Role-Based Access**: Simple admin/user distinction  
4. **Real-time Updates**: WebSocket for live data
5. **Modern Stack**: Current best practices
6. **Type Safety**: Full TypeScript coverage
7. **Clean Architecture**: Clear separation of concerns

---

## 📦 **Package Structure (After Refactoring)**

```
packages/
├── node/                    # DevKit Core API (✅ Complete)
│   ├── src/devkit.ts       # Main DevKit class  
│   ├── examples/           # Working examples
│   └── tests/              # Comprehensive tests
│
├── backend/                 # Simplified Backend Services (🔧 Refactor)
│   ├── src/
│   │   ├── api/           # REST endpoints
│   │   ├── websocket/     # Real-time communication
│   │   ├── auth/          # Simple wallet auth
│   │   ├── devkit/        # DevKit integration bridge
│   │   └── database/      # Simple data storage
│   └── package.json
│
├── frontend/               # Single React Application (🔧 Rebuild)
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Auth, Admin, User pages
│   │   ├── services/      # API client, WebSocket
│   │   ├── hooks/         # React hooks
│   │   └── types/         # TypeScript definitions  
│   └── package.json
│
└── shared/                 # Common types and utilities
    ├── types/             # Shared TypeScript types
    └── utils/             # Common utilities
```

---

## 🚀 **Success Metrics**

- **Reduced Complexity**: < 5 backend packages vs current 10+
- **Clean Architecture**: Clear data flow from DevKit → Backend → Frontend
- **Fast Development**: New features require touching minimal files
- **Type Safety**: 100% TypeScript coverage
- **Real-time UX**: < 100ms WebSocket response times
- **Simple Deployment**: Single backend service + frontend build
- **Maintainable**: New developers can understand the codebase in < 1 day

---

This refactoring will transform the complex existing infrastructure into a modern, maintainable, and developer-friendly full-stack application that properly showcases the power of our DevKit API.