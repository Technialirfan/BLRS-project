import { Link } from "react-router-dom";
import { ArrowRightLeft, Clock3, FilePlus2, FolderSearch, LandPlot } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { landAPI } from "../../services/api";
import StatCard from "../../components/shared/StatCard";
import StatusBadge from "../../components/shared/StatusBadge";
import { formatDateShort } from "../../utils/helpers";

const statuses = ["All", "Pending", "Verified", "Registered", "Rejected"];

export default function PatwariDashboard() {
  const { officer } = useStore();
  const [myLands, setMyLands] = useState([]);
  const [stats, setStats] = useState({
    pending: 0, verified: 0, registered: 0, rejected: 0, total: 0, thisMonth: 0, transfers: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("All");

  useEffect(() => {
    loadMyLands();
  }, []);

  const loadMyLands = async () => {
    try {
      setLoading(true);
      // Fetching up to 100 recent lands for dashboard
      const result = await landAPI.getAll({ limit: 100, page: 1 });

      if (result.ok && result.data.success) {
        const lands = result.data.data.lands;
        setMyLands(lands);

        setStats({
          pending: lands.filter(l => l.status === 'Pending').length,
          verified: lands.filter(l => l.status === 'Verified').length,
          registered: lands.filter(l => l.status === 'Registered').length,
          rejected: lands.filter(l => l.status === 'Rejected').length,
          total: lands.length,
          thisMonth: lands.filter(l => new Date(l.createdAt).getMonth() === new Date().getMonth()).length,
          transfers: lands.filter(l => l.status === 'TransferPending').length
        });
      }
    } catch (err) {
      console.error('Failed to load lands:', err);
    } finally {
      setLoading(false);
    }
  };

  const tableRows = useMemo(
    () => (activeStatus === "All" ? myLands : myLands.filter((l) => l.status === activeStatus)),
    [activeStatus, myLands]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h1 className="text-2xl font-bold">السلام علیکم، {officer?.fullName}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          District: <span className="font-medium">{officer?.assignedDistrict}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="My Total" value={stats.total} icon={LandPlot} color="#1B4332" />
        <StatCard title="This Month" value={stats.thisMonth} icon={Clock3} color="#2563EB" />
        <StatCard title="Pending" value={stats.pending} icon={Clock3} color="#D97706" />
        <StatCard title="Transfers Initiated" value={stats.transfers} icon={ArrowRightLeft} color="#EA580C" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/land/register" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
          <FilePlus2 className="h-6 w-6 text-[#1B4332]" />
          <h3 className="mt-2 font-semibold">Register New Land</h3>
        </Link>
        <Link to="/land/transfer" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
          <ArrowRightLeft className="h-6 w-6 text-[#EA580C]" />
          <h3 className="mt-2 font-semibold">Transfer Land</h3>
        </Link>
        <Link to="/land/all" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
          <FolderSearch className="h-6 w-6 text-[#2563EB]" />
          <h3 className="mt-2 font-semibold">View My Lands</h3>
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 font-semibold">Recent Registrations</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActiveStatus(s)}
              className={`rounded-full px-3 py-1 text-xs ${activeStatus === s ? "bg-[#1B4332] text-white" : "bg-slate-100 dark:bg-slate-700"}`}
            >
              {s}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-3 py-2 text-left">Parcel ID</th>
                  <th className="px-3 py-2 text-left">Owner</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Area</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">View</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(0, 8).map((land) => (
                  <tr key={land.parcelId} className="border-b border-slate-100 dark:border-slate-700/60">
                    <td className="px-3 py-2 font-medium">{land.parcelId}</td>
                    <td className="px-3 py-2">{land.ownerName}</td>
                    <td className="px-3 py-2">{land.landType}</td>
                    <td className="px-3 py-2">{land.areaMarla} Marla</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={land.status} size="sm" />
                    </td>
                    <td className="px-3 py-2">{formatDateShort(land.createdAt)}</td>
                    <td className="px-3 py-2">
                      <Link to={`/land/${land.parcelId}`} className="text-[#1B4332] hover:underline dark:text-[#D4AF37]">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {tableRows.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-4 text-center text-gray-500">No recent registrations found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 font-semibold">Pending Transfers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-3 py-2 text-left">Parcel ID</th>
                <th className="px-3 py-2 text-left">Current Owner</th>
                <th className="px-3 py-2 text-left">New Owner</th>
                <th className="px-3 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {myLands
                .filter((l) => l.status === "TransferPending")
                .map((land) => (
                  <tr key={land.parcelId} className="border-b border-slate-100 dark:border-slate-700/60">
                    <td className="px-3 py-2 font-medium">{land.parcelId}</td>
                    <td className="px-3 py-2">{land.ownerName}</td>
                    <td className="px-3 py-2">{land.pendingTransferName || "—"}</td>
                    <td className="px-3 py-2">{formatDateShort(land.updatedAt)}</td>
                  </tr>
                ))}
              {myLands.filter((l) => l.status === "TransferPending").length === 0 && (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-gray-500">No pending transfers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
