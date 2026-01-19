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

import { beforeEach, describe, expect, it } from 'vitest';
import { SessionKeyManager } from './manager.js';

describe('SessionKeyManager', () => {
  let manager: SessionKeyManager;
  const parentAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  beforeEach(() => {
    manager = new SessionKeyManager();
  });

  describe('generateSessionKey', () => {
    it('should generate a valid session key', () => {
      const sessionKey = manager.generateSessionKey(parentAddress, {
        ttl: 3600,
        chain: 'evm',
      });

      expect(sessionKey.id).toMatch(/^sk_/);
      expect(sessionKey.privateKey).toMatch(/^0x[a-f0-9]{64}$/);
      expect(sessionKey.address).toMatch(/^0x[a-f0-9]{40}$/i);
      expect(sessionKey.parentAddress).toBe(parentAddress);
      expect(sessionKey.ttl).toBe(3600);
      expect(sessionKey.isActive).toBe(true);
      expect(sessionKey.chain).toBe('evm');
    });

    it('should use default TTL if not provided', () => {
      const sessionKey = manager.generateSessionKey(parentAddress, {
        chain: 'core',
      });

      expect(sessionKey.ttl).toBe(3600); // Default 1 hour
    });

    it('should set expiration time correctly', () => {
      const ttl = 7200;
      const sessionKey = manager.generateSessionKey(parentAddress, {
        ttl,
        chain: 'evm',
      });

      const expectedExpiry = new Date(
        sessionKey.createdAt.getTime() + ttl * 1000
      );
      expect(sessionKey.expiresAt.getTime()).toBeCloseTo(
        expectedExpiry.getTime(),
        -2
      );
    });

    it('should apply permissions', () => {
      const permissions = {
        maxValue: 1000000000000000000n,
        contracts: ['0xContract1', '0xContract2'],
        operations: ['0x12345678'],
      };

      const sessionKey = manager.generateSessionKey(parentAddress, {
        ttl: 3600,
        permissions,
        chain: 'evm',
      });

      expect(sessionKey.permissions).toEqual(permissions);
    });
  });

  describe('getSessionKey', () => {
    it('should retrieve a session key by ID', () => {
      const sessionKey = manager.generateSessionKey(parentAddress, {
        ttl: 3600,
        chain: 'evm',
      });

      const retrieved = manager.getSessionKey(sessionKey.id);

      expect(retrieved).toEqual(sessionKey);
    });

    it('should return undefined for non-existent key', () => {
      const retrieved = manager.getSessionKey('non-existent-id');

      expect(retrieved).toBeUndefined();
    });

    it('should mark expired keys as inactive', () => {
      const sessionKey = manager.generateSessionKey(parentAddress, {
        ttl: -1, // Already expired
        chain: 'evm',
      });

      const retrieved = manager.getSessionKey(sessionKey.id);

      expect(retrieved?.isActive).toBe(false);
    });
  });

  describe('revokeSessionKey', () => {
    it('should revoke an active session key', () => {
      const sessionKey = manager.generateSessionKey(parentAddress, {
        ttl: 3600,
        chain: 'evm',
      });

      manager.revokeSessionKey(sessionKey.id);

      const retrieved = manager.getSessionKey(sessionKey.id);
      expect(retrieved?.isActive).toBe(false);
    });
  });

  describe('listSessionKeys', () => {
    it('should list all session keys for a parent address', () => {
      manager.generateSessionKey(parentAddress, { chain: 'evm' });
      manager.generateSessionKey(parentAddress, { chain: 'core' });
      manager.generateSessionKey('0xOtherAddress', { chain: 'evm' });

      const keys = manager.listSessionKeys(parentAddress);

      expect(keys).toHaveLength(2);
      expect(keys.every((k) => k.parentAddress === parentAddress)).toBe(true);
    });
  });

  describe('listActiveSessionKeys', () => {
    it('should list only active, non-expired session keys', () => {
      const active = manager.generateSessionKey(parentAddress, {
        ttl: 3600,
        chain: 'evm',
      });
      const expired = manager.generateSessionKey(parentAddress, {
        ttl: -1,
        chain: 'evm',
      });
      const revoked = manager.generateSessionKey(parentAddress, {
        ttl: 3600,
        chain: 'evm',
      });
      manager.revokeSessionKey(revoked.id);

      const activeKeys = manager.listActiveSessionKeys(parentAddress);

      expect(activeKeys).toHaveLength(1);
      expect(activeKeys[0].id).toBe(active.id);
    });
  });

  describe('signWithSessionKey', () => {
    it('should sign transaction with valid session key', async () => {
      const sessionKey = manager.generateSessionKey(parentAddress, {
        ttl: 3600,
        chain: 'evm',
      });

      const signed = await manager.signWithSessionKey(sessionKey.id, {
        to: '0xRecipient',
        chain: 'evm',
      });

      expect(signed.rawTransaction).toMatch(/^0x[a-f0-9]+$/);
      expect(signed.hash).toMatch(/^0x[a-f0-9]{64}$/);
      expect(signed.chain).toBe('evm');
    });

    it('should throw error for non-existent session key', async () => {
      await expect(
        manager.signWithSessionKey('non-existent-id', {
          to: '0xRecipient',
          chain: 'evm',
        })
      ).rejects.toThrow('Session key not found');
    });

    it('should throw error for expired session key', async () => {
      const sessionKey = manager.generateSessionKey(parentAddress, {
        ttl: -1,
        chain: 'evm',
      });

      await expect(
        manager.signWithSessionKey(sessionKey.id, {
          to: '0xRecipient',
          chain: 'evm',
        })
      ).rejects.toThrow('expired');
    });

    it('should throw error for inactive session key', async () => {
      const sessionKey = manager.generateSessionKey(parentAddress, {
        ttl: 3600,
        chain: 'evm',
      });
      manager.revokeSessionKey(sessionKey.id);

      await expect(
        manager.signWithSessionKey(sessionKey.id, {
          to: '0xRecipient',
          chain: 'evm',
        })
      ).rejects.toThrow('not active');
    });

    it('should enforce value limit', async () => {
      const sessionKey = manager.generateSessionKey(parentAddress, {
        ttl: 3600,
        permissions: {
          maxValue: 100n,
        },
        chain: 'evm',
      });

      await expect(
        manager.signWithSessionKey(sessionKey.id, {
          to: '0xRecipient',
          value: 200n,
          chain: 'evm',
        })
      ).rejects.toThrow('exceeds maximum');
    });

    it('should enforce contract whitelist', async () => {
      const sessionKey = manager.generateSessionKey(parentAddress, {
        ttl: 3600,
        permissions: {
          contracts: ['0xWhitelisted'],
        },
        chain: 'evm',
      });

      await expect(
        manager.signWithSessionKey(sessionKey.id, {
          to: '0xNotWhitelisted',
          chain: 'evm',
        })
      ).rejects.toThrow('not whitelisted');
    });

    it('should enforce chain restriction', async () => {
      const sessionKey = manager.generateSessionKey(parentAddress, {
        ttl: 3600,
        chain: 'core',
      });

      await expect(
        manager.signWithSessionKey(sessionKey.id, {
          to: '0xRecipient',
          chain: 'evm',
        })
      ).rejects.toThrow('Chain mismatch');
    });
  });

  describe('cleanupExpired', () => {
    it('should remove expired session keys', () => {
      manager.generateSessionKey(parentAddress, { ttl: 3600, chain: 'evm' });
      manager.generateSessionKey(parentAddress, { ttl: -1, chain: 'evm' });
      manager.generateSessionKey(parentAddress, { ttl: -2, chain: 'evm' });

      const removed = manager.cleanupExpired();

      expect(removed).toBe(2);
    });
  });

  describe('getStats', () => {
    it('should return session key statistics', () => {
      manager.generateSessionKey(parentAddress, { ttl: 3600, chain: 'evm' });
      manager.generateSessionKey(parentAddress, { ttl: -1, chain: 'evm' });
      const revoked = manager.generateSessionKey(parentAddress, {
        ttl: 3600,
        chain: 'evm',
      });
      manager.revokeSessionKey(revoked.id);

      const stats = manager.getStats();

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(1);
      expect(stats.expired).toBe(1);
      expect(stats.inactive).toBe(1);
    });
  });
});
