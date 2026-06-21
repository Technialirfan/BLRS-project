import { cn } from "../../lib/utils";

export function Progress({ className, value = 0 }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700", className)}>
      <div className="h-full bg-[#1B4332] transition-all dark:bg-[#2D6A4F]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
