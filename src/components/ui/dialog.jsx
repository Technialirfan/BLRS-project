import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => onOpenChange?.(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn("mb-4", className)} {...props} />;
}

export function DialogTitle({ className, ...props }) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

export function DialogDescription({ className, ...props }) {
  return <p className={cn("text-sm text-slate-600 dark:text-slate-300", className)} {...props} />;
}

export function DialogContent({ className, children, onClose }) {
  return (
    <div className={cn("", className)}>
      {onClose ? (
        <button
          type="button"
          className="absolute right-3 top-3 rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
      {children}
    </div>
  );
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn("mt-4 flex justify-end gap-2", className)} {...props} />;
}
