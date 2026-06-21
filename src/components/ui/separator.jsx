import { cn } from "../../lib/utils";

export function Separator({ className, ...props }) {
  return <div className={cn("h-px w-full bg-slate-200 dark:bg-slate-700", className)} {...props} />;
}
