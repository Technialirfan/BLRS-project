import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Grid2X2, List } from "lucide-react";
import toast from "react-hot-toast";
import { useStore } from "../../store/useStore";
import { landAPI } from "../../services/api";
import { LAND_TYPES } from "../../utils/constants";
import LandCard from "../../components/land/LandCard";
import StatusBadge from "../../components/shared/StatusBadge";
import { formatDateShort } from "../../utils/helpers";

const statuses = ["", "Pending", "Verified", "Registered", "Rejected", "TransferPending", "Disputed"];

export default function ManageLands() {
  const navigate = useNavigate();
  const { officer } = useStore();
  
  const [viewMode, setViewMode] = useState("table");
  const [sortBy, setSortBy] = useState("createdAt");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lands, setLands] = useState([]);
  
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    landType: "",
    district: ""
  });

  const perPage = 10;
  const pageCount = Math.max(1, Math.ceil(total / perPage));

  useEffect(() => {
    const fetchLands = async () => {
      setLoading(true);
      try {
        const queryParams = {
          limit: perPage,
          page,
          ...filters
        };
        
        // Remove empty filters
        Object.keys(queryParams).forEach(key => {
          if (!queryParams[key]) delete queryParams[key];
        });

        const result = await landAPI.getAll(queryParams);
        if (result.ok && result.data.success) {
          setLands(result.data.data.lands);
          setTotal(result.data.data.total);
        } else {
          throw new Error(result.data?.message || "Failed to fetch lands");
        }
      } catch (err) {
        toast.error("Failed to load land records");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    // Add a small debounce for search
    const timeoutId = setTimeout(fetchLands, 300);
    return () => clearTimeout(timeoutId);
  }, [page, filters, sortBy]);

  const clearFilters = () => {
    setFilters({ search: "", status: "", landType: "", district: "" });
    setPage(1);
  };

  const titleByRole = {
    admin: "All Land Records",
    patwari: "My Land Records",
    tehsildar: "District Land Records",
    dc: "District Land Records",
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{titleByRole[officer?.role] || "Land Records"}</h1>

      <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 md:grid-cols-6">
        <input
          className="h-10 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600 dark:bg-slate-700 md:col-span-2"
          placeholder="Search parcel / owner / cnic"
          value={filters.search}
          onChange={(e) => {
            setFilters(prev => ({ ...prev, search: e.target.value }));
            setPage(1);
          }}
        />
        <select
          className="h-10 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600 dark:bg-slate-700"
          value={filters.status}
          onChange={(e) => {
            setFilters(prev => ({ ...prev, status: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          {statuses
            .filter(Boolean)
            .map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
        </select>
        <select
          className="h-10 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600 dark:bg-slate-700"
          value={filters.landType}
          onChange={(e) => {
            setFilters(prev => ({ ...prev, landType: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">All Types</option>
          {LAND_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          className="h-10 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600 dark:bg-slate-700"
          placeholder="District"
          value={filters.district}
          onChange={(e) => {
            setFilters(prev => ({ ...prev, district: e.target.value }));
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <button type="button" onClick={clearFilters} className="h-10 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600">
            Clear
          </button>
          <button type="button" onClick={() => setViewMode("table")} className={`h-10 rounded-lg border px-3 ${viewMode === "table" ? "bg-[#1B4332] text-white" : "border-slate-300 dark:border-slate-600"}`}>
            <List className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setViewMode("grid")} className={`h-10 rounded-lg border px-3 ${viewMode === "grid" ? "bg-[#1B4332] text-white" : "border-slate-300 dark:border-slate-600"}`}>
            <Grid2X2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading land records...</div>
      ) : viewMode === "table" ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="cursor-pointer px-3 py-2 text-left" onClick={() => setSortBy("parcelId")}>
                  Parcel ID
                </th>
                <th className="cursor-pointer px-3 py-2 text-left" onClick={() => setSortBy("ownerName")}>
                  Owner
                </th>
                <th className="px-3 py-2 text-left">District</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Area</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="cursor-pointer px-3 py-2 text-left" onClick={() => setSortBy("createdAt")}>
                  Registered
                </th>
              </tr>
            </thead>
            <tbody>
              {lands.map((land) => (
                <tr
                  key={land.parcelId}
                  className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 dark:border-slate-700/60 dark:hover:bg-slate-700/40"
                  onClick={() => navigate(`/land/${land.parcelId}`)}
                >
                  <td className="px-3 py-2 font-medium">{land.parcelId}</td>
                  <td className="px-3 py-2">{land.ownerName}</td>
                  <td className="px-3 py-2">{land.district}</td>
                  <td className="px-3 py-2">{land.landType}</td>
                  <td className="px-3 py-2">{land.areaMarla} Marla</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={land.status} size="sm" />
                  </td>
                  <td className="px-3 py-2">{formatDateShort(land.createdAt)}</td>
                </tr>
              ))}
              {lands.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-4 text-center text-slate-500">No records found matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {lands.map((land) => (
            <LandCard key={land.parcelId} land={land} onClick={() => navigate(`/land/${land.parcelId}`)} />
          ))}
          {lands.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-500">No records found matching filters.</div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Page {page} of {pageCount}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-slate-300 px-3 py-1 text-sm dark:border-slate-600">
            ← Previous
          </button>
          <button type="button" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="rounded border border-slate-300 px-3 py-1 text-sm dark:border-slate-600">
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
