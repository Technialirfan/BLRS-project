import { cn } from "../../lib/utils";

export function Badge({ className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100",
        className
      )}
      {...props}
    />
  );
}
