import { cn } from "../../lib/utils";

export function Tabs({ className, children }) {
  return <div className={cn("", className)}>{children}</div>;
}

export function TabsList({ className, ...props }) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-600 dark:bg-slate-700",
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, active, ...props }) {
  return (
    <button
      className={cn(
        "rounded-md px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200",
        active && "bg-white shadow-sm dark:bg-slate-800",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }) {
  return <div className={cn("mt-3", className)} {...props} />;
}
