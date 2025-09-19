// ============================================================================
// Port Configuration for Conflux DevKit Services
// Ensures no port conflicts between services
// ============================================================================

export const PORT_CONFIG = {
  // Core Services
  STATE_SERVER: 3002,
  API_SERVER: 3001,
  
  // Web Applications
  DEMO_WEBAPP: 3003,
  SHOWCASE_WEBAPP: 3000,
  
  // Blockchain Services
  CONFLUX_NODE_CORE: 12537,
  CONFLUX_NODE_EVM: 8545,
  
  // Development Tools
  VITE_DEV_SERVER: 5173,
  TURBO_DEV_SERVER: 3004,
  
  // Reserved Ports (for future use)
  RESERVED_1: 3005,
  RESERVED_2: 3006,
  RESERVED_3: 3007,
  RESERVED_4: 3008,
  RESERVED_5: 3009,
};

export const SERVICE_PORTS = {
  'state-server': PORT_CONFIG.STATE_SERVER,
  'api-server': PORT_CONFIG.API_SERVER,
  'demo-webapp': PORT_CONFIG.DEMO_WEBAPP,
  'showcase-webapp': PORT_CONFIG.SHOWCASE_WEBAPP,
  'conflux-node': PORT_CONFIG.CONFLUX_NODE_CORE,
};

export function validatePorts() {
  const usedPorts = new Set();
  const conflicts = [];
  
  for (const [service, port] of Object.entries(SERVICE_PORTS)) {
    if (usedPorts.has(port)) {
      conflicts.push(`${service} conflicts with port ${port}`);
    }
    usedPorts.add(port);
  }
  
  if (conflicts.length > 0) {
    throw new Error(`Port conflicts detected:\n${conflicts.join('\n')}`);
  }
  
  return true;
}

export function getServicePort(serviceName) {
  return SERVICE_PORTS[serviceName] || null;
}

export function getAllPorts() {
  return Object.values(SERVICE_PORTS);
}
