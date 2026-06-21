import { motion } from "framer-motion";
import { Card } from "../ui/card";

const StatCard = ({ title, value, icon: Icon, color = "#1B4332", trend, trendValue, subtitle }) => {
  return (
    <Card className="border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{title}</p>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100"
          >
            {value}
          </motion.p>
          {subtitle ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
          {trend ? (
            <p className={`mt-2 text-xs font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
              {trend === "up" ? "↑" : "↓"} {trendValue}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <div className="rounded-lg p-2 text-white" style={{ backgroundColor: color }}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </Card>
  );
};

export default StatCard;
