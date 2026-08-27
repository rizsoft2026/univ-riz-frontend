import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, XCircle, Info, X } from 'lucide-react';

export default function Notification({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, type, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-800 dark:text-emerald-300',
      iconText: 'text-emerald-500',
      icon: CheckCircle2,
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-950/40',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-300',
      iconText: 'text-red-500',
      icon: XCircle,
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-300',
      iconText: 'text-amber-500',
      icon: AlertCircle,
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-300',
      iconText: 'text-blue-500',
      icon: Info,
    },
  };

  const currentStyle = styles[type] || styles.info;
  const IconComponent = currentStyle.icon;

  return (
    <div className="fixed top-20 right-5 z-[100] max-w-sm w-full animate-in slide-in-from-top-5 duration-300">
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${currentStyle.bg} ${currentStyle.border} ${currentStyle.text} shadow-lg shadow-slate-200/50 dark:shadow-none`}>
        <IconComponent className={`w-5 h-5 shrink-0 ${currentStyle.iconText}`} />
        <div className="flex-1 text-sm font-medium leading-relaxed">
          {message}
        </div>
        <button
          onClick={onClose}
          className="p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
