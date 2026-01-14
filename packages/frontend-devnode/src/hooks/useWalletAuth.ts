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

import { useCallback, useEffect } from 'react';
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

  // Define handleAuthentication with useCallback to prevent infinite loops
  const handleAuthentication = useCallback(async () => {
    if (!address) return;

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
    } catch (error) {
      console.warn('Authentication failed:', error);
      setUser({
        address,
        chainId: chainId || 1,
        isConnected: true,
      });
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
    if (!walletConnected || !address) {
      return;
    }

    // Wallet connected but not authenticated
    if (address && !authConnected) {
      handleAuthentication();
    }
  }, [walletConnected, address, authConnected, handleAuthentication]);

  // Restore session on mount (if wallet reconnects and sessionId is present)
  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');

    // Restore persisted auth even if wallet has not reconnected yet
    if (sessionId && !authConnected && user?.address) {
      setUser({
        address: user.address,
        chainId: user.chainId || chainId || 1,
        isConnected: true,
      });
      return;
    }

    // When wallet reconnects and we have a session, sync the store
    if (sessionId && !authConnected && walletConnected && address) {
      setUser({
        address,
        chainId: chainId || 1,
        isConnected: true,
      });
    }
  }, [address, authConnected, chainId, setUser, walletConnected, user]);

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
