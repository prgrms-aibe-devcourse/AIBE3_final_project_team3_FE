"use client";

import { useToastStore } from '@/global/stores/useToastStore';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
            transform transition-all duration-300 ease-in-out
            animate-slide-in-right
            ${toast.type === 'success' ? 'bg-emerald-600 text-white' : ''}
            ${toast.type === 'error' ? 'bg-red-600 text-white' : ''}
            ${toast.type === 'info' ? 'bg-blue-600 text-white' : ''}
            min-w-[300px] max-w-md
          `}
        >
          {toast.type === 'success' && <CheckCircle size={20} className="flex-shrink-0" />}
          {toast.type === 'error' && <XCircle size={20} className="flex-shrink-0" />}
          {toast.type === 'info' && <Info size={20} className="flex-shrink-0" />}

          <p className="flex-1 text-sm font-medium">{toast.message}</p>

          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
