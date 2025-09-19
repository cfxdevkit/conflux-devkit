// ============================================================================
// @conflux-devkit/state-ui - Pure UI State Management
// ============================================================================

// Types
export type {
  Theme,
  NotificationState,
  NotificationAction,
  ModalState,
  UIPreferences,
  BreadcrumbItem,
  UIState,
  UIActions,
  UIStore,
  UIEvents,
} from './types';

// Store
export { useUIStore, selectors } from './store';

// React Hooks
export {
  useUIState,
  useTheme,
  useSidebar,
  useTabs,
  useBreadcrumbs,
  useNotifications,
  useModals,
  useLoading,
  useError,
  usePreferences,
  useViewport,
  useOnlineStatus,
  useActivity,
} from './hooks';

// Default export
export { useUIStore as default } from './store';
