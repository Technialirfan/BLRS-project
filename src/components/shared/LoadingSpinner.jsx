import { Loader2 } from "lucide-react";

const LoadingSpinner = ({ fullPage = false, message = "Loading..." }) => {
  const content = (
    <div className="flex items-center gap-2 text-[#1B4332] dark:text-[#2D6A4F]">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{message}</span>
    </div>
  );

  if (fullPage) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">{content}</div>;
  }
  return content;
};

export default LoadingSpinner;
