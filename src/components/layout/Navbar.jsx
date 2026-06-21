import { Bell, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../store/useStore";
import DarkModeToggle from "../shared/DarkModeToggle";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from "../ui/dropdown-menu";

const pathTitle = {
  "/dashboard/admin": "Admin Dashboard",
  "/dashboard/patwari": "Patwari Dashboard",
  "/dashboard/tehsildar": "Tehsildar Dashboard",
  "/dashboard/dc": "DC Dashboard",
  "/land/register": "Register Land",
  "/land/all": "Land Records",
  "/land/transfer": "Transfer Land",
  "/disputes": "Disputes",
  "/profile": "My Profile",
  "/admin/users": "Officer Management",
  "/admin/audit": "Audit Logs",
};

const Navbar = ({ pathname }) => {
  const navigate = useNavigate();
  const user = useStore((s) => s.officer);
  const unreadCount = useStore((s) => s.unreadCount);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const logout = useStore((s) => s.logout);

  if (!user) return null;
  const initials = user.fullName
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("");

  return (
    <header className="navbar fixed left-0 right-0 top-0 z-20 h-16 border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 md:left-64">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button type="button" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-700 md:hidden" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">{pathTitle[pathname] || "Balochistan Land Registry System"}</h1>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{user.role.toUpperCase()}</Badge>
          {user.assignedDistrict ? <Badge>{user.assignedDistrict}</Badge> : null}
        </div>

        <div className="flex items-center gap-3">
          <DarkModeToggle />
          <button type="button" className="relative rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-700">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
                {unreadCount}
              </span>
            ) : null}
          </button>
          <DropdownMenu
            trigger={
              <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            }
          >
            {({ close }) => (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    navigate("/profile");
                    close();
                  }}
                >
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={close}>Change Password</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    logout();
                    close();
                    navigate("/login");
                  }}
                >
                  Logout
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
