// ============================================================================
// React Hooks for UI State Management
// ============================================================================

import { useCallback, useEffect, useMemo } from 'react';
import { useUIStore, selectors } from './store';
import type {
  Theme,
  UIPreferences,
  BreadcrumbItem,
  NotificationState,
  ModalState,
} from './types';

// ============================================================================
// Core UI State Hook
// ============================================================================

export function useUIState() {
  const store = useUIStore();

  return {
    // State
    theme: selectors.theme(store),
    systemTheme: selectors.systemTheme(store),
    effectiveTheme: selectors.effectiveTheme(store),
    sidebarOpen: selectors.sidebarOpen(store),
    sidebarWidth: selectors.sidebarWidth(store),
    activeTab: selectors.activeTab(store),
    breadcrumbs: selectors.breadcrumbs(store),
    notifications: selectors.notifications(store),
    modals: selectors.modals(store),
    loading: selectors.loading(store),
    globalLoading: selectors.globalLoading(store),
    error: selectors.error(store),
    errors: selectors.errors(store),
    preferences: selectors.preferences(store),
    isOnline: selectors.isOnline(store),
    lastActivity: selectors.lastActivity(store),
    viewport: selectors.viewport(store),

    // Computed
    hasNotifications: selectors.hasNotifications(store),
    hasModals: selectors.hasModals(store),
    isAnyLoading: selectors.isAnyLoading(store),
    hasErrors: selectors.hasErrors(store),
    isMobile: selectors.isMobile(store),
    isTablet: selectors.isTablet(store),
    isDesktop: selectors.isDesktop(store),

    // Actions
    ...store,
  };
}

// ============================================================================
// Theme Management Hook
// ============================================================================

export function useTheme() {
  const theme = selectors.theme(useUIStore());
  const systemTheme = selectors.systemTheme(useUIStore());
  const effectiveTheme = selectors.effectiveTheme(useUIStore());
  const setTheme = useUIStore(state => state.setTheme);
  const toggleTheme = useUIStore(state => state.toggleTheme);
  const setSystemTheme = useUIStore(state => state.setSystemTheme);

  // Auto-detect system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    updateSystemTheme();
    mediaQuery.addEventListener('change', updateSystemTheme);

    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, [setSystemTheme]);

  return {
    theme,
    systemTheme,
    effectiveTheme,
    setTheme,
    toggleTheme,
    setSystemTheme,
  };
}

// ============================================================================
// Sidebar Management Hook
// ============================================================================

export function useSidebar() {
  const sidebarOpen = selectors.sidebarOpen(useUIStore());
  const sidebarWidth = selectors.sidebarWidth(useUIStore());
  const toggleSidebar = useUIStore(state => state.toggleSidebar);
  const setSidebarOpen = useUIStore(state => state.setSidebarOpen);
  const setSidebarWidth = useUIStore(state => state.setSidebarWidth);

  return {
    sidebarOpen,
    sidebarWidth,
    toggleSidebar,
    setSidebarOpen,
    setSidebarWidth,
  };
}

// ============================================================================
// Tab Management Hook
// ============================================================================

export function useTabs() {
  const activeTab = selectors.activeTab(useUIStore());
  const setActiveTab = useUIStore(state => state.setActiveTab);

  return {
    activeTab,
    setActiveTab,
  };
}

// ============================================================================
// Breadcrumb Management Hook
// ============================================================================

export function useBreadcrumbs() {
  const breadcrumbs = selectors.breadcrumbs(useUIStore());
  const setBreadcrumbs = useUIStore(state => state.setBreadcrumbs);
  const addBreadcrumb = useUIStore(state => state.addBreadcrumb);
  const removeBreadcrumb = useUIStore(state => state.removeBreadcrumb);

  return {
    breadcrumbs,
    setBreadcrumbs,
    addBreadcrumb,
    removeBreadcrumb,
  };
}

// ============================================================================
// Notification Management Hook
// ============================================================================

export function useNotifications() {
  const notifications = selectors.notifications(useUIStore());
  const hasNotifications = selectors.hasNotifications(useUIStore());
  const addNotification = useUIStore(state => state.addNotification);
  const removeNotification = useUIStore(state => state.removeNotification);
  const clearNotifications = useUIStore(state => state.clearNotifications);

  // Helper methods
  const showSuccess = useCallback(
    (title: string, message: string, options?: Partial<NotificationState>) => {
      addNotification({
        type: 'success',
        title,
        message,
        ...options,
      });
    },
    [addNotification]
  );

  const showError = useCallback(
    (title: string, message: string, options?: Partial<NotificationState>) => {
      addNotification({
        type: 'error',
        title,
        message,
        duration: 0, // Don't auto-dismiss errors
        ...options,
      });
    },
    [addNotification]
  );

  const showWarning = useCallback(
    (title: string, message: string, options?: Partial<NotificationState>) => {
      addNotification({
        type: 'warning',
        title,
        message,
        ...options,
      });
    },
    [addNotification]
  );

  const showInfo = useCallback(
    (title: string, message: string, options?: Partial<NotificationState>) => {
      addNotification({
        type: 'info',
        title,
        message,
        ...options,
      });
    },
    [addNotification]
  );

  return {
    notifications,
    hasNotifications,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}

// ============================================================================
// Modal Management Hook
// ============================================================================

export function useModals() {
  const modals = selectors.modals(useUIStore());
  const hasModals = selectors.hasModals(useUIStore());
  const openModal = useUIStore(state => state.openModal);
  const closeModal = useUIStore(state => state.closeModal);
  const closeAllModals = useUIStore(state => state.closeAllModals);

  // Helper methods
  const openConfirmModal = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void
    ) => {
      return openModal(
        'confirm',
        {
          title,
          message,
          onConfirm,
          onCancel,
        },
        {
          title,
          closable: true,
          size: 'small',
        }
      );
    },
    [openModal]
  );

  const openAlertModal = useCallback(
    (title: string, message: string, onClose?: () => void) => {
      return openModal(
        'alert',
        {
          title,
          message,
          onClose,
        },
        {
          title,
          closable: true,
          size: 'small',
        }
      );
    },
    [openModal]
  );

  return {
    modals,
    hasModals,
    openModal,
    closeModal,
    closeAllModals,
    openConfirmModal,
    openAlertModal,
  };
}

// ============================================================================
// Loading State Management Hook
// ============================================================================

export function useLoading() {
  const loading = selectors.loading(useUIStore());
  const globalLoading = selectors.globalLoading(useUIStore());
  const isAnyLoading = selectors.isAnyLoading(useUIStore());
  const setLoading = useUIStore(state => state.setLoading);
  const setGlobalLoading = useUIStore(state => state.setGlobalLoading);
  const isLoading = useUIStore(state => state.isLoading);

  // Helper method for async operations
  const withLoading = useCallback(
    async <T>(key: string, operation: () => Promise<T>): Promise<T> => {
      setLoading(key, true);
      try {
        const result = await operation();
        return result;
      } finally {
        setLoading(key, false);
      }
    },
    [setLoading]
  );

  return {
    loading,
    globalLoading,
    isAnyLoading,
    setLoading,
    setGlobalLoading,
    isLoading,
    withLoading,
  };
}

// ============================================================================
// Error Management Hook
// ============================================================================

export function useError() {
  const error = selectors.error(useUIStore());
  const errors = selectors.errors(useUIStore());
  const hasErrors = selectors.hasErrors(useUIStore());
  const setError = useUIStore(state => state.setError);
  const setFieldError = useUIStore(state => state.setFieldError);
  const clearError = useUIStore(state => state.clearError);
  const clearFieldError = useUIStore(state => state.clearFieldError);
  const clearAllErrors = useUIStore(state => state.clearAllErrors);
  const fieldError = useUIStore(state => state.fieldError);

  return {
    error,
    errors,
    hasErrors,
    setError,
    setFieldError,
    clearError,
    clearFieldError,
    clearAllErrors,
    fieldError,
  };
}

// ============================================================================
// User Preferences Hook
// ============================================================================

export function usePreferences() {
  const preferences = selectors.preferences(useUIStore());
  const updatePreferences = useUIStore(state => state.updatePreferences);
  const resetPreferences = useUIStore(state => state.resetPreferences);

  return {
    preferences,
    updatePreferences,
    resetPreferences,
  };
}

// ============================================================================
// Viewport Management Hook
// ============================================================================

export function useViewport() {
  const viewport = selectors.viewport(useUIStore());
  const isMobile = selectors.isMobile(useUIStore());
  const isTablet = selectors.isTablet(useUIStore());
  const isDesktop = selectors.isDesktop(useUIStore());
  const setViewport = useUIStore(state => state.setViewport);

  // Auto-detect viewport changes
  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setViewport({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => window.removeEventListener('resize', updateViewport);
  }, [setViewport]);

  return {
    viewport,
    isMobile,
    isTablet,
    isDesktop,
    setViewport,
  };
}

// ============================================================================
// Online Status Hook
// ============================================================================

export function useOnlineStatus() {
  const isOnline = selectors.isOnline(useUIStore());
  const setOnlineStatus = useUIStore(state => state.setOnlineStatus);

  // Auto-detect online status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setOnlineStatus(navigator.onLine);
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [setOnlineStatus]);

  return {
    isOnline,
    setOnlineStatus,
  };
}

// ============================================================================
// Activity Tracking Hook
// ============================================================================

export function useActivity() {
  const lastActivity = selectors.lastActivity(useUIStore());
  const updateLastActivity = useUIStore(state => state.updateLastActivity);

  // Track user activity
  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
    ];

    const handleActivity = () => {
      updateLastActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [updateLastActivity]);

  return {
    lastActivity,
    updateLastActivity,
  };
}
