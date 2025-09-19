import { useState, useEffect } from 'react';
import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now().toString();
    const newToast = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    // Auto-remove after duration (default 5 seconds)
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, toast.duration || 5000);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  }
}));

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const getToastStyles = () => {
    const baseStyles = "transform transition-all duration-300 ease-in-out max-w-sm w-full shadow-lg rounded-lg p-4 flex items-center justify-between";
    const visibilityStyles = isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0";

    const typeStyles = {
      success: "bg-green-500 text-white",
      error: "bg-red-500 text-white",
      warning: "bg-yellow-500 text-white",
      info: "bg-blue-500 text-white"
    };

    return `${baseStyles} ${visibilityStyles} ${typeStyles[toast.type]}`;
  };

  const getIcon = () => {
    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️"
    };
    return icons[toast.type];
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-center">
        <span className="mr-2 text-lg">{getIcon()}</span>
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200 text-xl leading-none"
      >
        ×
      </button>
    </div>
  );
}

// Helper hook for easier toast usage
export function useToast() {
  const addToast = useToastStore((state) => state.addToast);

  return {
    success: (message: string, duration?: number) => addToast({ message, type: 'success', duration }),
    error: (message: string, duration?: number) => addToast({ message, type: 'error', duration }),
    warning: (message: string, duration?: number) => addToast({ message, type: 'warning', duration }),
    info: (message: string, duration?: number) => addToast({ message, type: 'info', duration })
  };
}