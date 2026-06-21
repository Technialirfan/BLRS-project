import { cn } from "../../lib/utils";

export function Table({ className, ...props }) {
  return <table className={cn("w-full text-sm", className)} {...props} />;
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn("bg-slate-50 dark:bg-slate-700/60", className)} {...props} />;
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn("", className)} {...props} />;
}

export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn(
        "border-b border-slate-200 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50",
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }) {
  return <th className={cn("px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300", className)} {...props} />;
}

export function TableCell({ className, ...props }) {
  return <td className={cn("px-3 py-2 text-slate-800 dark:text-slate-100", className)} {...props} />;
}
