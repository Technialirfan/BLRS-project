import { useState, useEffect } from 'react';
import { adminAPI, landAPI } from '../../services/api';
import useStore from '../../store/useStore';
import StatCard from "../../components/shared/StatCard";
import StatusBadge from "../../components/shared/StatusBadge";
import { formatDateShort } from "../../utils/helpers";
import {
  Activity,
  AlertTriangle,
  Building2,
  ClipboardList,
  Clock3,
  FileClock,
  LandPlot,
  ShieldAlert,
  Users,
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ['#1B4332', '#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2', '#B7E4C7', '#D8F3DC'];

const sparklineData = [
  { v: 72 }, { v: 76 }, { v: 74 }, { v: 80 }, { v: 82 }, { v: 87 },
];

export default function AdminDashboard() {
  const { officer } = useStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [statsResult, landStatsResult] = await Promise.all([
        adminAPI.getStats(),
        landAPI.getDashboardStats()
      ]);

      if (statsResult.ok) {
        setStats(statsResult.data.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent" />
    </div>
  );

  if (error) return (
    <div className="p-6 text-red-500 text-center">
      <p>{error}</p>
      <button
        onClick={loadDashboardData}
        className="mt-4 bg-green-700 text-white px-4 py-2 rounded"
      >
        Retry
      </button>
    </div>
  );

  // Use fallbacks if stats is undefined
  const totalLands = stats?.totals?.lands || 0;
  const landsRegistered = stats?.landsByStatus?.find(s => s._id === 'Registered')?.count || 0;
  const landsPending = stats?.landsByStatus?.find(s => s._id === 'Pending')?.count || 0;
  const landsDisputed = stats?.landsByStatus?.find(s => s._id === 'Disputed')?.count || 0;
  const totalOfficers = stats?.totals?.officers || 0;
  
  const recentLogs = stats?.recentLogs || [];
  const pendingApprovals = stats?.pendingApprovals || [];
  const districtRows = stats?.districtPerformance || [];
  
  const landsByDistrict = stats?.landsByDistrict?.map(d => ({ district: d._id || 'Unassigned', count: d.count })) || [];
  const landsByType = stats?.landsByType?.map(d => ({ type: d._id || 'Unknown', count: d.count })) || [];
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyRegistrations = stats?.monthlyRegistrations?.map(m => ({
    month: `${monthNames[m._id.month - 1]} ${m._id.year}`,
    count: m.count,
    disputes: 0, // backend doesn't provide monthly disputes currently
    transfers: 0, // backend doesn't provide monthly transfers currently
  })) || [];

  const gisStats = stats?.gisAreaStats || [];
  const totalRegisteredArea = Number(gisStats.reduce((sum, item) => sum + (item.totalArea || 0), 0).toFixed(2));
  const agriculturalArea = Number((gisStats.find(s => s._id === 'agricultural')?.totalArea || 0).toFixed(2));
  const residentialArea = Number((gisStats.find(s => s._id === 'residential')?.totalArea || 0).toFixed(2));
  const commercialArea = Number((gisStats.find(s => s._id === 'commercial')?.totalArea || 0).toFixed(2));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total GIS Area (Acres)" value={totalRegisteredArea} icon={LandPlot} color="#1B4332" />
        <StatCard title="Agricultural Area" value={agriculturalArea} icon={LandPlot} color="#16A34A" />
        <StatCard title="Residential Area" value={residentialArea} icon={Building2} color="#2563EB" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Lands" value={totalLands} icon={LandPlot} color="#1B4332" />
        <StatCard title="Registered" value={landsRegistered} icon={Activity} color="#16A34A" />
        <StatCard title="Pending" value={landsPending} icon={Clock3} color="#D97706" />
        <StatCard title="Disputed" value={landsDisputed} icon={AlertTriangle} color="#DC2626" />
        <StatCard title="Officers" value={totalOfficers} icon={Users} color="#2563EB" />
        <StatCard title="Districts" value={35} icon={Building2} color="#7C3AED" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 lg:col-span-3">
          <h2 className="mb-3 font-semibold">Registrations by District (Top 10)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={landsByDistrict}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="district" angle={-25} textAnchor="end" height={70} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2D6A4F" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 lg:col-span-2">
          <h2 className="mb-3 font-semibold">Land Types Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={landsByType} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={90}>
                  {landsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 font-semibold">Monthly Activity - Last 6 Months</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyRegistrations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="count" fill="#2D6A4F" stroke="#2D6A4F" fillOpacity={0.2} name="Registrations" />
              <Line type="monotone" dataKey="disputes" stroke="#DC2626" strokeWidth={2} name="Disputes" />
              <Bar dataKey="transfers" fill="#2563EB" name="Transfers" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Avg Processing Time", value: "5.2 days", trend: "down", trendValue: "3%" },
          { title: "Approval Rate", value: "87%", trend: "up", trendValue: "4%" },
          { title: "Dispute Resolution Rate", value: "78%", trend: "up", trendValue: "6%" },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{item.title}</p>
              <span className={`text-xs font-semibold ${item.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {item.trend === "up" ? "↑" : "↓"} {item.trendValue}
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold">{item.value}</p>
            <div className="mt-2 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sparklineData}>
                  <Bar dataKey="v" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 font-semibold">District Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-3 py-2 text-left">District</th>
                <th className="px-3 py-2 text-left">Registered</th>
                <th className="px-3 py-2 text-left">Pending</th>
                <th className="px-3 py-2 text-left">Disputed</th>
                <th className="px-3 py-2 text-left">Officer Count</th>
                <th className="px-3 py-2 text-left">Score</th>
              </tr>
            </thead>
            <tbody>
              {districtRows.map((d) => (
                <tr key={d.district} className="border-b border-slate-100 dark:border-slate-700/60">
                  <td className="px-3 py-2 font-medium">{d.district}</td>
                  <td className="px-3 py-2">{d.registered}</td>
                  <td className="px-3 py-2">{d.pending}</td>
                  <td className="px-3 py-2">{d.disputed}</td>
                  <td className="px-3 py-2">{d.officerCount}</td>
                  <td className="px-3 py-2">
                    <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className={`h-full ${d.score > 80 ? "bg-green-600" : d.score > 60 ? "bg-amber-500" : "bg-red-600"}`} style={{ width: `${d.score}%` }} />
                    </div>
                    <span className="ml-2 text-xs">{d.score}%</span>
                  </td>
                </tr>
              ))}
              {districtRows.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-gray-500">No district performance data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <FileClock className="h-4 w-4" /> Pending Approvals
          </h2>
          <div className="space-y-2">
            {pendingApprovals.map((l) => (
              <div key={l.parcelId} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{l.parcelId}</p>
                  <StatusBadge status={l.status} size="sm" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{l.ownerName}</p>
              </div>
            ))}
            {pendingApprovals.length === 0 && <p className="text-sm text-gray-500">No pending approvals.</p>}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <ClipboardList className="h-4 w-4" /> Recent Activity
          </h2>
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div key={log._id} className="rounded-lg border-l-4 border-[#1B4332] bg-slate-50 p-3 text-sm dark:bg-slate-700/50">
                <p className="font-medium">{log.action}</p>
                <p className="text-xs text-slate-500">
                  {log.performedBy?.fullName} | {formatDateShort(log.timestamp)}
                </p>
              </div>
            ))}
            {recentLogs.length === 0 && <p className="text-sm text-gray-500">No recent activity.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
