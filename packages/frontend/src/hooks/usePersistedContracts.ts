/*
 * Copyright 2025 Conflux DevKit Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DevKitApiServiceWithAuth } from '../services/developmentAuth';

export interface DeployedContract {
  address: string;
  chain: 'core' | 'evm';
  deployer: string;
  timestamp: string;
  template?: string;
  name?: string;
  abi?: unknown[];
  network?: 'local' | 'testnet' | 'mainnet';
}

const PERSISTENT_STORAGE_KEY = 'conflux-devkit-deployed-contracts';
const SESSION_STORAGE_KEY = 'conflux-devkit-local-contracts';

export function usePersistedContracts() {
  const [deployedContracts, setDeployedContracts] = useState<
    DeployedContract[]
  >([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const nodeStatusRef = useRef<boolean | null>(null);
  
  // Get node running status from devkit status query
  const { data: devkitStatus } = useQuery({
    queryKey: ['devkit-status'],
    queryFn: DevKitApiServiceWithAuth.getDevKitStatusSafe,
    refetchInterval: 30000,
    retry: 1,
  });
  
  const currentNodeRunning = !!devkitStatus?.running;

  // Load contracts from storage on mount
  useEffect(() => {
    try {
      // Load persistent contracts (testnet/mainnet) from localStorage
      const persistentStored = localStorage.getItem(PERSISTENT_STORAGE_KEY);
      let persistentContracts: DeployedContract[] = [];
      if (persistentStored) {
        persistentContracts = JSON.parse(persistentStored) as DeployedContract[];
      }

      // Load local contracts from sessionStorage only if node is running
      let localContracts: DeployedContract[] = [];
      if (currentNodeRunning) {
        const localStored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (localStored) {
          localContracts = JSON.parse(localStored) as DeployedContract[];
        }
      }

      // Combine contracts
      const allContracts = [...persistentContracts, ...localContracts];
      setDeployedContracts(allContracts);
    } catch (error) {
      console.warn('Failed to load deployed contracts from storage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, [currentNodeRunning]);

  // Track node status changes and clear local contracts when node stops/restarts
  useEffect(() => {
    if (nodeStatusRef.current !== null && nodeStatusRef.current !== currentNodeRunning) {
      if (!currentNodeRunning) {
        // Node stopped - clear local contracts from memory and session storage
        console.log('Local node stopped, clearing local contracts');
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        setDeployedContracts(prev => prev.filter(contract => contract.network !== 'local'));
      } else {
        // Node started - reload local contracts from session storage
        console.log('Local node started, reloading local contracts');
        try {
          const localStored = sessionStorage.getItem(SESSION_STORAGE_KEY);
          if (localStored) {
            const localContracts = JSON.parse(localStored) as DeployedContract[];
            setDeployedContracts(prev => {
              // Remove any existing local contracts and add the restored ones
              const nonLocalContracts = prev.filter(contract => contract.network !== 'local');
              return [...nonLocalContracts, ...localContracts];
            });
          }
        } catch (error) {
          console.warn('Failed to reload local contracts:', error);
        }
      }
    }
    nodeStatusRef.current = currentNodeRunning;
  }, [currentNodeRunning]);

  // Save contracts to appropriate storage when they change
  useEffect(() => {
    if (isLoaded) {
      try {
        // Separate contracts by type
        const persistentContracts = deployedContracts.filter(
          contract => contract.network !== 'local'
        );
        const localContracts = deployedContracts.filter(
          contract => contract.network === 'local'
        );

        // Save persistent contracts to localStorage
        localStorage.setItem(PERSISTENT_STORAGE_KEY, JSON.stringify(persistentContracts));

        // Save local contracts to sessionStorage only if node is running
        if (currentNodeRunning) {
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(localContracts));
        }
      } catch (error) {
        console.warn('Failed to save deployed contracts to storage:', error);
      }
    }
  }, [deployedContracts, isLoaded, currentNodeRunning]);

  const addContract = (contract: DeployedContract) => {
    setDeployedContracts((prev) => [contract, ...prev]);
  };

  const removeContract = (address: string, chain: 'core' | 'evm') => {
    setDeployedContracts((prev) =>
      prev.filter(
        (contract) =>
          !(contract.address === address && contract.chain === chain)
      )
    );
  };

  const clearAllContracts = () => {
    setDeployedContracts([]);
  };

  const clearLocalContracts = () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setDeployedContracts(prev => prev.filter(contract => contract.network !== 'local'));
  };

  const getContractsByChain = (chain: 'core' | 'evm') => {
    return deployedContracts.filter((contract) => contract.chain === chain);
  };

  const getContractsByNetwork = (network: 'local' | 'testnet' | 'mainnet') => {
    return deployedContracts.filter((contract) => contract.network === network);
  };

  const getContractsByChainAndNetwork = (chain: 'core' | 'evm', network: 'local' | 'testnet' | 'mainnet') => {
    return deployedContracts.filter((contract) => contract.chain === chain && contract.network === network);
  };

  return {
    deployedContracts,
    addContract,
    removeContract,
    clearAllContracts,
    clearLocalContracts,
    getContractsByChain,
    getContractsByNetwork,
    getContractsByChainAndNetwork,
    isLoaded,
    isLocalNodeRunning: currentNodeRunning,
  };
}
