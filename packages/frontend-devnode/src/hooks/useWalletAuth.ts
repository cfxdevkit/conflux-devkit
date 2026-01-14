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

import { apiClient } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useCallback, useEffect, useRef } from 'react';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';

/**
 * Hook to synchronize Wagmi wallet connection with auth store
 * Gets development session from backend when wallet connects
 */
export function useWalletAuth() {
  const { address, isConnected: walletConnected, chainId, status } = useAccount();
  const { disconnect: disconnectWallet } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { isConnected: authConnected, user, setUser, logout } = useAuthStore();
  const authInProgress = useRef(false);
  const authAttemptedAddress = useRef<string | null>(null);

  // Define handleAuthentication with useCallback to prevent infinite loops
  const handleAuthentication = useCallback(async () => {
    if (!address) return;

    // Deduplicate per address to avoid double signing on re-renders
    if (authAttemptedAddress.current === address) return;
    authAttemptedAddress.current = address;

    // Avoid duplicate auth flows (e.g., React strict mode double-invoke)
    if (authInProgress.current) return;
    authInProgress.current = true;

    try {
      // 1) Request challenge from backend
      const challenge = await apiClient.createChallenge(address);

      // 2) Ask user to sign the challenge message (restores old UX)
      const signature = await signMessageAsync({ message: challenge.message });

      // 3) Verify signature and obtain session
      const session = await apiClient.verifySignature(address, signature);

      if (session.sessionId) {
        localStorage.setItem('sessionId', session.sessionId);
        setUser({
          address: session.address || address,
          chainId: chainId || 1,
          isConnected: true,
        });
        console.log('✅ Authenticated via signature', {
          address: session.address,
          isAdmin: session.isAdmin,
        });
        return;
      }

      // Fallback to dev session if available (keeps DX smooth)
      const devSession = await apiClient.getDevelopmentSession();
      if (devSession?.sessionId) {
        localStorage.setItem('sessionId', devSession.sessionId);
        setUser({
          address: devSession.address || address,
          chainId: chainId || 1,
          isConnected: true,
        });
        console.log('🔧 Development session activated as fallback');
        return;
      }

      // Last resort: keep wallet-connected state only
      setUser({
        address,
        chainId: chainId || 1,
        isConnected: true,
      });
      authInProgress.current = false;
      authAttemptedAddress.current = null;
    } catch (error) {
      console.warn('Authentication failed:', error);
      // Don't set user as authenticated on signature failure
      authInProgress.current = false;
      authAttemptedAddress.current = null;
      // Clear any stale session
      localStorage.removeItem('sessionId');
    }
  }, [address, chainId, setUser, signMessageAsync]);

  // Handle wallet disconnection
  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (!walletConnected && status !== 'connecting' && authConnected && !sessionId) {
      // Wallet explicitly disconnected and no session to keep
      logout();
    }
  }, [walletConnected, status, authConnected, logout]);

  // Handle wallet connection and authentication
  useEffect(() => {
    if (!walletConnected || !address || status === 'connecting') {
      return;
    }

    // Wallet connected but not authenticated and not in progress
    if (address && !authConnected && !authInProgress.current) {
      handleAuthentication();
    }
  }, [walletConnected, address, authConnected, status, handleAuthentication]);

  // Restore session on mount (if wallet reconnects and sessionId is present)
  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) return;

    // Don't restore if already connected or auth is in progress
    if (authConnected || authInProgress.current) return;

    // Validate session by trying to fetch status - if 401, session is invalid
    const validateAndRestore = async () => {
      try {
        await apiClient.getDevKitStatus();
        // Session is valid, restore auth state
        const addr = address || user?.address;
        if (addr) {
          setUser({
            address: addr,
            chainId: chainId || user?.chainId || 1,
            isConnected: true,
          });
        }
      } catch (error: any) {
        // Session invalid (401 or other error), clear it
        if (error.response?.status === 401) {
          console.log('[Auth] Clearing invalid session');
          localStorage.removeItem('sessionId');
        }
      }
    };

    validateAndRestore();
  }, [address, authConnected, chainId, setUser, user]);

  // Listen for backend-forced session expiry (401)
  useEffect(() => {
    const handleSessionExpired = () => {
      console.log('[Auth] Session expired, logging out');
      authAttemptedAddress.current = null;
      authInProgress.current = false;
      logout();
      // Don't auto-disconnect wallet - let user manually disconnect
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [logout]);

  // Custom logout that also disconnects wallet
  const handleLogout = () => {
    logout();
    disconnectWallet();
  };

  return {
    isAuthenticated: authConnected,
    address,
    chainId,
    logout: handleLogout,
  };
}
