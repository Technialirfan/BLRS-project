import { X } from "lucide-react";

export function Sheet({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40" onClick={() => onOpenChange?.(false)}>
      {children}
    </div>
  );
}

export function SheetContent({ children, side = "right", className = "", onClose }) {
  const sideClass = side === "left" ? "left-0" : "right-0";
  return (
    <div
      className={`absolute top-0 ${sideClass} h-full w-full max-w-md overflow-y-auto bg-white p-6 dark:bg-slate-800 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700">
        <X className="h-4 w-4" />
      </button>
      {children}
    </div>
  );
}

export function SheetHeader({ className = "", ...props }) {
  return <div className={`mb-4 ${className}`} {...props} />;
}

export function SheetTitle({ className = "", ...props }) {
  return <h3 className={`text-lg font-semibold ${className}`} {...props} />;
}
