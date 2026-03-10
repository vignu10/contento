'use client';

import * as React from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'danger';
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  footer,
  variant = 'default'
}: DialogProps) {
  if (!isOpen) return null;

  const titleColor = variant === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <h2 className={`text-xl font-bold mb-4 pr-6 ${titleColor}`}>
          {title}
        </h2>

        {/* Body */}
        <div className="mb-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
