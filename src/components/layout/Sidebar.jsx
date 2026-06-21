import { Link, useLocation } from "react-router-dom";
import {
  ClipboardList,
  FileClock,
  FileSearch,
  Gauge,
  LandPlot,
  LogOut,
  ShieldAlert,
  Users,
  Waypoints,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStore } from "../../store/useStore";
import { getRoleLabel } from "../../utils/helpers";
import WalletConnect from "../shared/WalletConnect";
import DarkModeToggle from "../shared/DarkModeToggle";

const Sidebar = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const user = useStore((s) => s.officer);
  const logout = useStore((s) => s.logout);
  const sidebarOpen = useStore((s) => s.sidebarOpen);

  if (!user) return null;

  const initials = user.fullName
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("");

  const allItems = {
    admin: [
      { to: "/dashboard/admin", label: t("nav.dashboard"), icon: Gauge },
      { to: "/land/all", label: t("nav.allLands"), icon: LandPlot },
      { to: "/admin/users", label: "Officer Management", icon: Users },
      { to: "/disputes", label: t("nav.disputes"), icon: ShieldAlert },
      { to: "/admin/audit", label: t("nav.auditLogs"), icon: ClipboardList },
    ],
    patwari: [
      { to: "/dashboard/patwari", label: t("nav.dashboard"), icon: Gauge },
      { to: "/land/register", label: t("nav.registerLand"), icon: LandPlot },
      { to: "/land/all", label: "My Lands", icon: FileSearch },
      { to: "/land/transfer", label: t("nav.transfer"), icon: Waypoints },
      { to: "/disputes", label: "File Dispute", icon: ShieldAlert },
    ],
    tehsildar: [
      { to: "/dashboard/tehsildar", label: t("nav.dashboard"), icon: Gauge },
      { to: "/land/all", label: "Land Records", icon: LandPlot },
      { to: "/dashboard/tehsildar", label: "Verification Queue", icon: FileClock },
      { to: "/disputes", label: t("nav.disputes"), icon: ShieldAlert },
    ],
    dc: [
      { to: "/dashboard/dc", label: t("nav.dashboard"), icon: Gauge },
      { to: "/land/all", label: "Land Records", icon: LandPlot },
      { to: "/dashboard/dc", label: "Approval Queue", icon: FileClock },
      { to: "/dashboard/dc", label: "Transfer Approvals", icon: Waypoints },
      { to: "/disputes", label: "Dispute Resolution", icon: ShieldAlert },
    ],
  };

  return (
    <aside
      className={`sidebar fixed left-0 top-0 z-30 h-screen w-64 transform overflow-y-auto border-r border-white/10 bg-[#1B4332] text-white transition-transform dark:bg-[#0D2B1F] ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="p-4">
        <div className="mb-6 rounded-xl border border-white/20 bg-white/5 p-3">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37] font-bold text-white">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold">{user.fullName}</p>
              <p className="text-xs text-slate-200">{getRoleLabel(user.role)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="rounded-full bg-amber-600/30 px-2 py-0.5 text-[11px]">
              {getRoleLabel(user.role)}
            </span>
            {user.assignedDistrict ? (
              <span className="rounded-full bg-green-600/30 px-2 py-0.5 text-[11px]">
                {user.assignedDistrict}
              </span>
            ) : null}
          </div>
        </div>

        <nav className="space-y-1">
          {allItems[user.role]?.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={`${item.to}-${item.label}`}
                to={item.to}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  active
                    ? "border-[#D4AF37] bg-white text-[#1B4332]"
                    : "border-transparent hover:bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto space-y-3 border-t border-white/10 p-4">
        <div className="flex items-center justify-between rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm">
          <span>Dark Mode</span>
          <DarkModeToggle />
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300/30 bg-red-600/20 px-3 py-2 text-sm hover:bg-red-600/40"
        >
          <LogOut className="h-4 w-4" />
          {t("nav.logout")}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
