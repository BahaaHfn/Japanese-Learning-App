import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        let bgStyle = 'bg-white border-stationery-border text-ink';
        let Icon = Info;
        let iconColor = 'text-indigo-primary';

        if (toast.type === 'success') {
          bgStyle = 'bg-white border-jade/40 text-ink shadow-lg';
          Icon = CheckCircle2;
          iconColor = 'text-jade';
        } else if (toast.type === 'warning') {
          bgStyle = 'bg-white border-vermilion/40 text-ink shadow-lg';
          Icon = AlertCircle;
          iconColor = 'text-vermilion';
        } else if (toast.type === 'error') {
          bgStyle = 'bg-vermilion-wash border-vermilion text-vermilion shadow-lg';
          Icon = AlertCircle;
          iconColor = 'text-vermilion';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-md transition-all duration-200 animate-slide-in ${bgStyle}`}
          >
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
              <p className="text-sm font-medium leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-stationery-border/50 ml-3 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
