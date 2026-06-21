import { cn } from "../../lib/utils";

export function Avatar({ className, ...props }) {
  return <div className={cn("relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full", className)} {...props} />;
}

export function AvatarImage({ className, ...props }) {
  return <img className={cn("h-full w-full object-cover", className)} {...props} />;
}

export function AvatarFallback({ className, ...props }) {
  return <div className={cn("flex h-full w-full items-center justify-center bg-[#D4AF37] text-white", className)} {...props} />;
}
