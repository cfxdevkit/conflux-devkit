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

/**
 * Development Authentication Helper
 *
 * Provides seamless authentication in development environments
 * while maintaining security patterns for production
 */

import { DevKitApiService } from './api.js';

interface DevSession {
  sessionId: string;
  address: string;
  isAdmin: boolean;
  environment: string;
}

export /**
 * Development Authentication Helper
 * Auto-connects in development environment for easier testing
 */

// Use Vite proxy in development, full URL in production
const API_BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
  : '/api';

class DevelopmentAuth {
  private static instance: DevelopmentAuth;
  private sessionId: string | null = null;
  private isInitialized = false;

  static getInstance(): DevelopmentAuth {
    if (!DevelopmentAuth.instance) {
      DevelopmentAuth.instance = new DevelopmentAuth();
    }
    return DevelopmentAuth.instance;
  }

  /**
   * Initialize development authentication
   * Tries to get development session if available
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // First, check if we already have a session stored
      const storedSession = localStorage.getItem('sessionId');
      if (storedSession) {
        // Try to validate it
        const isValid = await this.validateStoredSession(storedSession);
        if (isValid) {
          this.sessionId = storedSession;
          this.isInitialized = true;
          console.log('✅ Using stored session');
          return true;
        } else {
          localStorage.removeItem('sessionId');
        }
      }

      // Try to get development session from backend
      const devSession = await this.getDevelopmentSession();
      if (devSession) {
        this.sessionId = devSession.sessionId;
        localStorage.setItem('sessionId', devSession.sessionId);
        this.isInitialized = true;
        console.log('🔧 Development session activated:', {
          address: devSession.address,
          isAdmin: devSession.isAdmin,
        });
        return true;
      }

      console.log('ℹ️ No development session available - manual auth required');
    } catch (error) {
      console.warn('Failed to initialize development auth:', error);
    }

    this.isInitialized = true;
    return false;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return !!this.sessionId;
  }

  /**
   * Manual logout
   */
  logout(): void {
    this.sessionId = null;
    localStorage.removeItem('sessionId');
    console.log('🔓 Session cleared');
  }

  /**
   * Try to get development session from backend
   */
  private async getDevelopmentSession(): Promise<DevSession | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/dev/session`);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Silent fail - this is expected in production
    }
    return null;
  }

  /**
   * Validate a stored session
   */
  private async validateStoredSession(sessionId: string): Promise<boolean> {
    try {
      // Try to make an authenticated request
      const response = await fetch(`${API_BASE_URL}/devkit/status`, {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Set session manually (for wallet auth)
   */
  setSession(sessionId: string): void {
    this.sessionId = sessionId;
    localStorage.setItem('sessionId', sessionId);
    console.log('🔐 Session set manually');
  }
}

/**
 * Enhanced API service with development auth integration
 */
export class DevKitApiServiceWithAuth extends DevKitApiService {
  private static devAuth = DevelopmentAuth.getInstance();

  /**
   * Initialize authentication and API service
   */
  static async initialize(): Promise<void> {
    await DevKitApiServiceWithAuth.devAuth.initialize();
  }

  /**
   * Get current session status
   */
  static getAuthStatus(): {
    authenticated: boolean;
    sessionId: string | null;
  } {
    return {
      authenticated: DevKitApiServiceWithAuth.devAuth.isAuthenticated(),
      sessionId: DevKitApiServiceWithAuth.devAuth.getSessionId(),
    };
  }

  /**
   * Enhanced public status that includes auth info
   */
  static async getPublicStatusWithAuth() {
    const [publicStatus, authStatus] = await Promise.all([
      DevKitApiService.getPublicStatus(),
      Promise.resolve(DevKitApiServiceWithAuth.getAuthStatus()),
    ]);

    return {
      ...publicStatus,
      auth: authStatus,
    };
  }

  /**
   * DevKit status with better error handling
   */
  static async getDevKitStatusSafe() {
    try {
      return await DevKitApiService.getDevKitStatus();
    } catch (error) {
      console.warn('DevKit status request failed:', error);
      return null;
    }
  }

  /**
   * Set session from wallet connection
   */
  static setAuthSession(sessionId: string): void {
    DevKitApiServiceWithAuth.devAuth.setSession(sessionId);
  }

  /**
   * Logout
   */
  static logout(): void {
    DevKitApiServiceWithAuth.devAuth.logout();
  }
}
