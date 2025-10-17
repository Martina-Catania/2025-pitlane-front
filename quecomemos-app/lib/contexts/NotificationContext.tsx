"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { NotificationModal, NotificationType } from '@/components/modals/notification-modal';

interface NotificationState {
  isOpen: boolean;
  type: NotificationType;
  title: string;
  message: string;
  autoClose?: boolean;
  autoCloseTime?: number;
  customIcon?: React.ReactNode;
}

interface NotificationContextType {
  showNotification: (
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      autoClose?: boolean;
      autoCloseTime?: number;
      customIcon?: React.ReactNode;
    }
  ) => void;
  showSuccess: (title: string, message: string, customIcon?: React.ReactNode) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
  closeNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    autoClose: true,
    autoCloseTime: 4000,
  });

  const showNotification = (
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      autoClose?: boolean;
      autoCloseTime?: number;
      customIcon?: React.ReactNode;
    }
  ) => {
    console.log('Global notification triggered:', { type, title, message });
    setNotification({
      isOpen: true,
      type,
      title,
      message,
      autoClose: options?.autoClose ?? true,
      autoCloseTime: options?.autoCloseTime ?? 4000,
      customIcon: options?.customIcon,
    });
  };

  const showSuccess = (title: string, message: string, customIcon?: React.ReactNode) => {
    showNotification('success', title, message, { customIcon });
  };

  const showError = (title: string, message: string) => {
    showNotification('error', title, message);
  };

  const showWarning = (title: string, message: string) => {
    showNotification('warning', title, message);
  };

  const showInfo = (title: string, message: string) => {
    showNotification('info', title, message);
  };

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        closeNotification,
      }}
    >
      {children}
      
      {/* Global Notification Toast - Non-blocking */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        autoClose={notification.autoClose}
        autoCloseTime={notification.autoCloseTime}
        customIcon={notification.customIcon}
      />
    </NotificationContext.Provider>
  );
}

export function useGlobalNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useGlobalNotification must be used within a NotificationProvider');
  }
  return context;
}