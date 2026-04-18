import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: <AlertTriangle className="w-6 h-6 text-tertiary" />,
      button: "bg-tertiary text-on-tertiary hover:brightness-110",
      accent: "border-tertiary"
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-secondary" />,
      button: "bg-secondary text-on-secondary hover:brightness-110",
      accent: "border-secondary"
    },
    info: {
      icon: <AlertTriangle className="w-6 h-6 text-primary" />,
      button: "bg-primary text-on-primary hover:brightness-110",
      accent: "border-primary"
    }
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={cn(
        "bg-surface-container-low w-full max-w-md rounded-xl border border-outline-variant/20 shadow-2xl overflow-hidden animate-in zoom-in duration-300",
        `border-t-4 ${style.accent}`
      )}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              {style.icon}
              <h2 className="text-xl font-black text-on-surface tracking-tight font-headline uppercase">
                {title}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-surface-bright rounded-full text-on-surface-variant transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
            {message}
          </p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest text-on-surface-variant hover:bg-surface-bright transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={cn(
                "px-8 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95",
                style.button
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
