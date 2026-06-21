import { Moon, Sun } from "lucide-react";
import { Switch } from "../ui/switch";
import { useStore } from "../../store/useStore";

const DarkModeToggle = () => {
  const darkMode = useStore((s) => s.darkMode);
  const toggleDarkMode = useStore((s) => s.toggleDarkMode);
  return (
    <div className="inline-flex items-center gap-2">
      <Sun className="h-4 w-4 text-amber-500" />
      <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
      <Moon className="h-4 w-4 text-slate-500" />
    </div>
  );
};

export default DarkModeToggle;
