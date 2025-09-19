// ============================================================================
// UI State Types - Pure UI State Management for Conflux DevKit
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';

export interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
  dismissible?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface ModalState {
  id: string;
  type: string;
  title?: string;
  props?: Record<string, unknown>;
  isOpen: boolean;
  closable?: boolean;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  onClose?: () => void;
}

export interface UIPreferences {
  // Display preferences
  showAdvancedOptions: boolean;
  showDebugInfo: boolean;
  compactMode: boolean;

  // Notification preferences
  enableNotifications: boolean;
  notificationDuration: number;
  enableSounds: boolean;

  // UI behavior
  autoRefresh: boolean;
  refreshInterval: number;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';

  // Layout preferences
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  defaultTab: string;
}

export interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: string;
  active?: boolean;
}

export interface UIState {
  // Theme & Appearance
  theme: Theme;
  systemTheme: 'light' | 'dark'; // Detected system theme

  // Layout & Navigation
  sidebarOpen: boolean;
  sidebarWidth: number;
  activeTab: string;
  breadcrumbs: BreadcrumbItem[];

  // Notifications & Modals
  notifications: NotificationState[];
  modals: ModalState[];
  maxNotifications: number;

  // Loading States
  loading: Record<string, boolean>;
  globalLoading: boolean;

  // Error State
  error: string | null;
  errors: Record<string, string>;

  // User Preferences
  preferences: UIPreferences;

  // UI State
  isOnline: boolean;
  lastActivity: Date | null;
  viewport: {
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  };
}

export interface UIActions {
  // Theme & Appearance
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSystemTheme: (theme: 'light' | 'dark') => void;

  // Layout & Navigation
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setActiveTab: (tab: string) => void;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  addBreadcrumb: (item: BreadcrumbItem) => void;
  removeBreadcrumb: (path: string) => void;

  // Notifications & Modals
  addNotification: (
    notification: Omit<NotificationState, 'id' | 'timestamp'>
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  openModal: (
    type: string,
    props?: Record<string, unknown>,
    options?: {
      title?: string;
      closable?: boolean;
      size?: 'small' | 'medium' | 'large' | 'fullscreen';
      onClose?: () => void;
    }
  ) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  // Loading States
  setLoading: (key: string, loading: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  isLoading: (key: string) => boolean;

  // Error Handling
  setError: (error: string) => void;
  setFieldError: (field: string, error: string) => void;
  clearError: () => void;
  clearFieldError: (field: string) => void;
  clearAllErrors: () => void;

  // User Preferences
  updatePreferences: (preferences: Partial<UIPreferences>) => void;
  resetPreferences: () => void;

  // UI State
  setOnlineStatus: (isOnline: boolean) => void;
  updateLastActivity: () => void;
  setViewport: (viewport: Partial<UIState['viewport']>) => void;

  // Utility
  reset: () => void;
  resetToDefaults: () => void;
}

export type UIStore = UIState & UIActions;

// Event types for UI state changes
export interface UIEvents {
  'theme:changed': [theme: Theme];
  'sidebar:toggled': [open: boolean];
  'tab:changed': [tab: string];
  'notification:added': [notification: NotificationState];
  'notification:removed': [id: string];
  'modal:opened': [modal: ModalState];
  'modal:closed': [id: string];
  'loading:started': [key: string];
  'loading:finished': [key: string];
  'error:occurred': [error: string];
  'error:cleared': [];
  'preferences:updated': [preferences: Partial<UIPreferences>];
  'online:status': [isOnline: boolean];
  'viewport:changed': [viewport: UIState['viewport']];
}
