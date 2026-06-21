import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { ChevronDown, Download } from "lucide-react";
import { adminAPI } from "../../services/api";
import { formatDate } from "../../utils/helpers";
import { AUDIT_ACTIONS, ROLES } from "../../utils/constants";

const actionColor = (action) => {
  if (!action) return "border-l-slate-500";
  if (action.includes("REGISTERED") || action.includes("APPROVED") || action.includes("RESOLVED")) return "border-l-green-600";
  if (action.includes("REJECTED")) return "border-l-red-600";
  if (action.includes("DISPUTE")) return "border-l-purple-600";
  if (action.includes("TRANSFER")) return "border-l-orange-600";
  return "border-l-slate-500";
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", action: "", role: "", parcelId: "" });
  const [expanded, setExpanded] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const actions = Object.values(AUDIT_ACTIONS);
  const roles = Object.values(ROLES);

  const perPage = 10;
  const pageCount = Math.max(1, Math.ceil(total / perPage));

  const loadLogs = async () => {
    try {
      setLoading(true);
      const queryParams = { limit: perPage, page, ...filters };
      Object.keys(queryParams).forEach(key => !queryParams[key] && delete queryParams[key]);

      const res = await adminAPI.getAuditLogs(queryParams);
      if (res.ok && res.data.success) {
        setLogs(res.data.data.logs);
        setTotal(res.data.data.total);
      } else {
        throw new Error(res.data?.message || "Failed to load audit logs");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(loadLogs, 300);
    return () => clearTimeout(timeoutId);
  }, [filters, page]);

  const exportCsv = async () => {
    try {
      setExporting(true);
      toast.loading("Preparing CSV export...", { id: "export" });
      
      const queryParams = { ...filters };
      Object.keys(queryParams).forEach(key => !queryParams[key] && delete queryParams[key]);
      
      const blob = await adminAPI.exportAuditLogs(queryParams);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `blrs-audit-logs-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("Export successful", { id: "export" });
    } catch (err) {
      toast.error("Export failed", { id: "export" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <button type="button" onClick={exportCsv} disabled={exporting || loading} className="inline-flex items-center gap-2 rounded-lg bg-[#1B4332] px-4 py-2 text-sm text-white disabled:opacity-50">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 md:grid-cols-5">
        <input type="date" className="h-10 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600 dark:bg-slate-700" value={filters.startDate} onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setPage(1); }} />
        <input type="date" className="h-10 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600 dark:bg-slate-700" value={filters.endDate} onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setPage(1); }} />
        <select className="h-10 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600 dark:bg-slate-700" value={filters.action} onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(1); }}>
          <option value="">All Actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select className="h-10 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600 dark:bg-slate-700" value={filters.role} onChange={(e) => { setFilters({ ...filters, role: e.target.value }); setPage(1); }}>
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input className="h-10 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600 dark:bg-slate-700" placeholder="Parcel ID" value={filters.parcelId} onChange={(e) => { setFilters({ ...filters, parcelId: e.target.value }); setPage(1); }} />
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="py-8 text-center text-slate-500">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center text-slate-500">No logs found matching filters.</div>
        ) : (
          logs.map((log) => (
          <div key={log._id} className={`rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 ${actionColor(log.action)} border-l-4`}>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <div className="grid gap-1 md:grid-cols-7 md:gap-3">
                <p>{formatDate(log.timestamp)}</p>
                <p>{log.performedBy?.fullName}</p>
                <p>{log.performedByRole}</p>
                <p className="font-medium">{log.action}</p>
                <p>{log.targetParcelId || "—"}</p>
                <p className="tx-hash">{log.txHash || "—"}</p>
                <p>{Object.keys(log.details || {}).join(", ")}</p>
              </div>
              <button type="button" className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => setExpanded((v) => (v === log._id ? null : log._id))}>
                <ChevronDown className={`h-4 w-4 transition ${expanded === log._id ? "rotate-180" : ""}`} />
              </button>
            </div>
            {expanded === log._id ? (
              <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
                <p className="mb-2 text-xs text-slate-500">Details JSON</p>
                <pre className="overflow-auto rounded-lg bg-slate-100 p-3 text-xs dark:bg-slate-900">{JSON.stringify(log.details, null, 2)}</pre>
                <p className="mt-2 text-xs text-slate-500">IP: {log.ipAddress}</p>
              </div>
            ) : null}
          </div>
        )))}
      </div>

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
