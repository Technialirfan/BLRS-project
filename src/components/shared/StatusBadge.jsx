import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  XCircle,
} from "lucide-react";
import { STATUS_CONFIG } from "../../utils/constants";

const iconMap = {
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  AlertTriangle,
  FileText,
  Search,
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

const StatusBadge = ({ status, size = "md" }) => {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    color: "#6B7280",
    bg: "#F3F4F6",
    darkBg: "#1F2937",
    icon: "FileText",
  };
  const Icon = iconMap[cfg.icon] || FileText;

  return (
    <span
      className={`${sizeClasses[size]} inline-flex items-center gap-1 rounded-full font-medium ${
        cfg.pulse ? "status-disputed" : ""
      }`}
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{cfg.label}</span>
    </span>
  );
};

export default StatusBadge;
