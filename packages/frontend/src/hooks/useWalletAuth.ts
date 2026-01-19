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

import { useCallback, useEffect, useRef } from 'react';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { apiClient } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

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
  const lastAuthenticatedAddress = useRef<string | null>(null);

  // Define handleAuthentication with useCallback to prevent infinite loops
  const handleAuthentication = useCallback(async () => {
    if (!address) return;

    // Avoid duplicate auth flows (e.g., React strict mode double-invoke)
    if (authInProgress.current) {
      console.log('[Auth] Skipping - auth already in progress');
      return;
    }

    // Skip if we already successfully authenticated this address in this session
    // But allow re-auth if the user logged out (lastAuthenticatedAddress is cleared)
    if (lastAuthenticatedAddress.current === address && authConnected) {
      console.log('[Auth] Skipping - already authenticated for this address');
      return;
    }

    authInProgress.current = true;
    console.log('[Auth] Starting authentication for:', address);

    try {
      // 1) Request challenge from backend
      const challenge = await apiClient.createChallenge(address);
      console.log('[Auth] Got challenge, requesting signature...');

      // 2) Ask user to sign the challenge message (restores old UX)
      const signature = await signMessageAsync({ message: challenge.message });
      console.log('[Auth] Got signature, verifying...');

      // 3) Verify signature and obtain session
      const session = await apiClient.verifySignature(address, signature);

      if (session.sessionId) {
        localStorage.setItem('sessionId', session.sessionId);
        setUser({
          address: session.address || address,
          chainId: chainId || 1,
          isConnected: true,
          isAdmin: session.isAdmin,
        });
        lastAuthenticatedAddress.current = address;
        authInProgress.current = false;
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
          isAdmin: devSession.isAdmin,
        });
        lastAuthenticatedAddress.current = address;
        authInProgress.current = false;
        console.log('🔧 Development session activated as fallback', {
          isAdmin: devSession.isAdmin,
        });
        return;
      }

      // Last resort: keep wallet-connected state only (no admin access)
      setUser({
        address,
        chainId: chainId || 1,
        isConnected: true,
        isAdmin: false,
      });
      authInProgress.current = false;
    } catch (error) {
      console.warn('[Auth] Authentication failed:', error);
      // Don't set user as authenticated on signature failure
      authInProgress.current = false;
      // Clear any stale session
      localStorage.removeItem('sessionId');
    }
  }, [address, chainId, setUser, signMessageAsync, authConnected]);

  // Handle wallet disconnection
  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (!walletConnected && status !== 'connecting' && authConnected && !sessionId) {
      // Wallet explicitly disconnected and no session to keep
      console.log('[Auth] Wallet disconnected, logging out');
      lastAuthenticatedAddress.current = null;
      logout();
    }
  }, [walletConnected, status, authConnected, logout]);

  // Handle wallet connection and authentication
  useEffect(() => {
    console.log('[Auth] Connection effect - walletConnected:', walletConnected, 'address:', address, 'status:', status, 'authConnected:', authConnected);

    if (!walletConnected || !address) {
      return;
    }

    // Skip during reconnection
    if (status === 'reconnecting') {
      console.log('[Auth] Skipping - reconnecting');
      return;
    }

    // If wallet is connected but we're not authenticated, start auth flow
    // This handles both fresh connections and reconnections after page refresh
    if (!authConnected && !authInProgress.current) {
      console.log('[Auth] Wallet connected but not authenticated, starting auth...');
      handleAuthentication();
    }
  }, [walletConnected, address, authConnected, status, handleAuthentication]);

  // Restore session on mount (if wallet reconnects and sessionId is present)
  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      console.log('[Auth] No sessionId in localStorage');
      return;
    }

    // Don't restore if already connected or auth is in progress
    if (authConnected || authInProgress.current) {
      console.log('[Auth] Skipping session restore - already connected or in progress');
      return;
    }

    // Validate session and get fresh user data from backend
    const validateAndRestore = async () => {
      console.log('[Auth] Attempting to restore session...');
      try {
        // First validate the session is still good
        await apiClient.getDevKitStatus();

        // Session is valid - get fresh user info from dev session endpoint
        // This ensures we get the current isAdmin status from backend
        const devSession = await apiClient.getDevelopmentSession();
        const addr = address || user?.address;

        if (addr) {
          setUser({
            address: devSession?.address || addr,
            chainId: chainId || user?.chainId || 1,
            isConnected: true,
            // Use backend's isAdmin if available, otherwise keep local
            isAdmin: devSession?.isAdmin ?? user?.isAdmin ?? false,
          });
          lastAuthenticatedAddress.current = addr;
          console.log('[Auth] Session restored with isAdmin:', devSession?.isAdmin);
        }
      } catch (error: any) {
        // Session invalid (401 or other error), clear it
        console.log('[Auth] Session validation failed:', error.message);
        localStorage.removeItem('sessionId');
        // Also clear auth state to force re-authentication
        logout();
      }
    };

    validateAndRestore();
  }, [address, authConnected, chainId, setUser, user, logout]);

  // Listen for backend-forced session expiry (401)
  useEffect(() => {
    const handleSessionExpired = () => {
      console.log('[Auth] Session expired, logging out');
      lastAuthenticatedAddress.current = null;
      authInProgress.current = false;
      logout();
      // Don't auto-disconnect wallet - let user manually disconnect
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [logout]);

  // Custom logout that also disconnects wallet and clears refs
  const handleLogout = () => {
    console.log('[Auth] Manual logout');
    lastAuthenticatedAddress.current = null;
    authInProgress.current = false;
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
