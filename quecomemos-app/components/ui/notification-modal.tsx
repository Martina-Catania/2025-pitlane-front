"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, X, AlertCircle, Info } from "lucide-react";

export type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: NotificationType;
  title: string;
  message: string;
  autoClose?: boolean;
  autoCloseTime?: number;
  customIcon?: React.ReactNode;
  showProgressBar?: boolean;
}

export function NotificationModal({ 
  isOpen, 
  onClose, 
  type, 
  title, 
  message, 
  autoClose = true,
  autoCloseTime = 3000,
  customIcon,
  showProgressBar = true
}: NotificationModalProps) {
  
  // Auto close functionality
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseTime);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseTime, onClose]);

  // Close modal with ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIconAndColors = () => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle className="w-8 h-8" />,
          iconBg: "bg-green-100 dark:bg-green-900/30",
          iconColor: "text-green-600 dark:text-green-400",
          borderColor: "border-green-200 dark:border-green-800",
          titleColor: "text-green-800 dark:text-green-300",
          messageColor: "text-green-700 dark:text-green-400",
          progressColor: "bg-green-500"
        };
      case "error":
        return {
          icon: <XCircle className="w-8 h-8" />,
          iconBg: "bg-red-100 dark:bg-red-900/30",
          iconColor: "text-red-600 dark:text-red-400",
          borderColor: "border-red-200 dark:border-red-800",
          titleColor: "text-red-800 dark:text-red-300",
          messageColor: "text-red-700 dark:text-red-400",
          progressColor: "bg-red-500"
        };
      case "warning":
        return {
          icon: <AlertCircle className="w-8 h-8" />,
          iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
          iconColor: "text-yellow-600 dark:text-yellow-400",
          borderColor: "border-yellow-200 dark:border-yellow-800",
          titleColor: "text-yellow-800 dark:text-yellow-300",
          messageColor: "text-yellow-700 dark:text-yellow-400",
          progressColor: "bg-yellow-500"
        };
      case "info":
        return {
          icon: <Info className="w-8 h-8" />,
          iconBg: "bg-blue-100 dark:bg-blue-900/30",
          iconColor: "text-blue-600 dark:text-blue-400",
          borderColor: "border-blue-200 dark:border-blue-800",
          titleColor: "text-blue-800 dark:text-blue-300",
          messageColor: "text-blue-700 dark:text-blue-400",
          progressColor: "bg-blue-500"
        };
      default:
        return {
          icon: <Info className="w-8 h-8" />,
          iconBg: "bg-muted",
          iconColor: "text-muted-foreground",
          borderColor: "border-border",
          titleColor: "text-foreground",
          messageColor: "text-muted-foreground",
          progressColor: "bg-primary"
        };
    }
  };

  const { icon, iconBg, iconColor, borderColor, titleColor, messageColor, progressColor } = getIconAndColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative bg-card border ${borderColor} rounded-xl shadow-2xl 
        max-w-md w-full transform transition-all duration-300 ease-out
        animate-in zoom-in-95 fade-in-0
      `}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-full ${iconBg}`}>
              <div className={iconColor}>
                {customIcon || icon}
              </div>
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${titleColor} mb-1`}>
                {title}
              </h3>
              <p className={`text-sm ${messageColor} leading-relaxed`}>
                {message}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors ml-2"
            aria-label="Close notification"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Progress bar for auto-close */}
        {autoClose && showProgressBar && (
          <div className="px-6 pb-4">
            <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
              <div 
                className={`h-full transition-all ease-linear ${progressColor}`}
                style={{
                  animation: `shrink ${autoCloseTime}ms linear forwards`
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}