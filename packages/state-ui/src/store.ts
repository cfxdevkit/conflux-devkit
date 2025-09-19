import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  UIStore,
  UIState,
  UIActions,
  UIPreferences,
  BreadcrumbItem,
} from './types';

// ============================================================================
// Initial State
// ============================================================================

const defaultPreferences: UIPreferences = {
  // Display preferences
  showAdvancedOptions: false,
  showDebugInfo: false,
  compactMode: false,

  // Notification preferences
  enableNotifications: true,
  notificationDuration: 5000,
  enableSounds: true,

  // UI behavior
  autoRefresh: true,
  refreshInterval: 5000,
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',

  // Layout preferences
  sidebarWidth: 280,
  sidebarCollapsed: false,
  defaultTab: 'dashboard',
};

const initialState: UIState = {
  // Theme & Appearance
  theme: 'system',
  systemTheme: 'light',

  // Layout & Navigation
  sidebarOpen: true,
  sidebarWidth: 280,
  activeTab: 'dashboard',
  breadcrumbs: [],

  // Notifications & Modals
  notifications: [],
  modals: [],
  maxNotifications: 5,

  // Loading States
  loading: {},
  globalLoading: false,

  // Error State
  error: null,
  errors: {},

  // User Preferences
  preferences: defaultPreferences,

  // UI State
  isOnline: true,
  lastActivity: null,
  viewport: {
    width: 1920,
    height: 1080,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  },
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useUIStore = create<UIStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        ...initialState,

        // ====================================================================
        // Theme & Appearance Actions
        // ====================================================================

        setTheme: theme => {
          set(state => {
            state.theme = theme;
          });
        },

        toggleTheme: () => {
          set(state => {
            if (state.theme === 'light') {
              state.theme = 'dark';
            } else if (state.theme === 'dark') {
              state.theme = 'system';
            } else {
              state.theme = state.systemTheme === 'light' ? 'dark' : 'light';
            }
          });
        },

        setSystemTheme: theme => {
          set(state => {
            state.systemTheme = theme;
          });
        },

        // ====================================================================
        // Layout & Navigation Actions
        // ====================================================================

        toggleSidebar: () => {
          set(state => {
            state.sidebarOpen = !state.sidebarOpen;
          });
        },

        setSidebarOpen: open => {
          set(state => {
            state.sidebarOpen = open;
          });
        },

        setSidebarWidth: width => {
          set(state => {
            state.sidebarWidth = width;
          });
        },

        setActiveTab: tab => {
          set(state => {
            state.activeTab = tab;
          });
        },

        setBreadcrumbs: breadcrumbs => {
          set(state => {
            state.breadcrumbs = breadcrumbs;
          });
        },

        addBreadcrumb: item => {
          set(state => {
            state.breadcrumbs.push(item);
          });
        },

        removeBreadcrumb: path => {
          set(state => {
            state.breadcrumbs = state.breadcrumbs.filter(b => b.path !== path);
          });
        },

        // ====================================================================
        // Notifications & Modals Actions
        // ====================================================================

        addNotification: notification => {
          const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newNotification = {
            ...notification,
            id,
            timestamp: new Date(),
            dismissible: notification.dismissible ?? true,
          };

          set(state => {
            // Remove oldest notifications if we exceed max
            if (state.notifications.length >= state.maxNotifications) {
              state.notifications.shift();
            }
            state.notifications.push(newNotification);
          });

          // Auto-dismiss after duration
          if (notification.duration && notification.duration > 0) {
            setTimeout(() => {
              get().removeNotification(id);
            }, notification.duration);
          }
        },

        removeNotification: id => {
          set(state => {
            state.notifications = state.notifications.filter(n => n.id !== id);
          });
        },

        clearNotifications: () => {
          set(state => {
            state.notifications = [];
          });
        },

        openModal: (type, props, options) => {
          const id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newModal = {
            id,
            type,
            title: options?.title,
            props,
            isOpen: true,
            closable: options?.closable ?? true,
            size: options?.size ?? 'medium',
            onClose: options?.onClose,
          };

          set(state => {
            state.modals.push(newModal);
          });

          return id;
        },

        closeModal: id => {
          set(state => {
            const modal = state.modals.find(m => m.id === id);
            if (modal?.onClose) {
              modal.onClose();
            }
            state.modals = state.modals.filter(m => m.id !== id);
          });
        },

        closeAllModals: () => {
          set(state => {
            state.modals.forEach(modal => {
              if (modal.onClose) {
                modal.onClose();
              }
            });
            state.modals = [];
          });
        },

        // ====================================================================
        // Loading States Actions
        // ====================================================================

        setLoading: (key, loading) => {
          set(state => {
            if (loading) {
              state.loading[key] = true;
            } else {
              delete state.loading[key];
            }
          });
        },

        setGlobalLoading: loading => {
          set(state => {
            state.globalLoading = loading;
          });
        },

        isLoading: key => {
          return get().loading[key] ?? false;
        },

        // ====================================================================
        // Error Handling Actions
        // ====================================================================

        setError: error => {
          set(state => {
            state.error = error;
          });
        },

        setFieldError: (field, error) => {
          set(state => {
            state.errors[field] = error;
          });
        },

        clearError: () => {
          set(state => {
            state.error = null;
          });
        },

        clearFieldError: field => {
          set(state => {
            delete state.errors[field];
          });
        },

        clearAllErrors: () => {
          set(state => {
            state.error = null;
            state.errors = {};
          });
        },

        // ====================================================================
        // User Preferences Actions
        // ====================================================================

        updatePreferences: preferences => {
          set(state => {
            state.preferences = { ...state.preferences, ...preferences };
          });
        },

        resetPreferences: () => {
          set(state => {
            state.preferences = defaultPreferences;
          });
        },

        // ====================================================================
        // UI State Actions
        // ====================================================================

        setOnlineStatus: isOnline => {
          set(state => {
            state.isOnline = isOnline;
          });
        },

        updateLastActivity: () => {
          set(state => {
            state.lastActivity = new Date();
          });
        },

        setViewport: viewport => {
          set(state => {
            state.viewport = { ...state.viewport, ...viewport };
          });
        },

        // ====================================================================
        // Utility Actions
        // ====================================================================

        reset: () => {
          set(state => {
            Object.assign(state, initialState);
          });
        },

        resetToDefaults: () => {
          set(state => {
            state.preferences = defaultPreferences;
            state.theme = 'system';
            state.sidebarOpen = true;
            state.sidebarWidth = 280;
            state.activeTab = 'dashboard';
            state.breadcrumbs = [];
            state.notifications = [];
            state.modals = [];
            state.loading = {};
            state.globalLoading = false;
            state.error = null;
            state.errors = {};
          });
        },
      })),
      {
        name: 'conflux-devkit-ui-state',
        partialize: state => ({
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
          activeTab: state.activeTab,
        }),
      }
    )
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectors = {
  // Theme & Appearance
  theme: (state: UIStore) => state.theme,
  systemTheme: (state: UIStore) => state.systemTheme,
  effectiveTheme: (state: UIStore) =>
    state.theme === 'system' ? state.systemTheme : state.theme,

  // Layout & Navigation
  sidebarOpen: (state: UIStore) => state.sidebarOpen,
  sidebarWidth: (state: UIStore) => state.sidebarWidth,
  activeTab: (state: UIStore) => state.activeTab,
  breadcrumbs: (state: UIStore) => state.breadcrumbs,

  // Notifications & Modals
  notifications: (state: UIStore) => state.notifications,
  modals: (state: UIStore) => state.modals,
  maxNotifications: (state: UIStore) => state.maxNotifications,

  // Loading States
  loading: (state: UIStore) => state.loading,
  globalLoading: (state: UIStore) => state.globalLoading,
  isLoading: (state: UIStore) => (key: string) => state.loading[key] ?? false,

  // Error State
  error: (state: UIStore) => state.error,
  errors: (state: UIStore) => state.errors,
  fieldError: (state: UIStore) => (field: string) => state.errors[field],

  // User Preferences
  preferences: (state: UIStore) => state.preferences,

  // UI State
  isOnline: (state: UIStore) => state.isOnline,
  lastActivity: (state: UIStore) => state.lastActivity,
  viewport: (state: UIStore) => state.viewport,

  // Computed
  hasNotifications: (state: UIStore) => state.notifications.length > 0,
  hasModals: (state: UIStore) => state.modals.length > 0,
  isAnyLoading: (state: UIStore) =>
    Object.keys(state.loading).length > 0 || state.globalLoading,
  hasErrors: (state: UIStore) =>
    state.error !== null || Object.keys(state.errors).length > 0,
  isMobile: (state: UIStore) => state.viewport.isMobile,
  isTablet: (state: UIStore) => state.viewport.isTablet,
  isDesktop: (state: UIStore) => state.viewport.isDesktop,
};
