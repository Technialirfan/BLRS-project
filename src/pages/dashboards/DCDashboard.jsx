import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Award, CheckCircle2, Clock3, ShieldAlert, Waypoints, XCircle } from "lucide-react";
import { useStore } from "../../store/useStore";
import { landAPI, disputeAPI } from "../../services/api";
import StatCard from "../../components/shared/StatCard";
import ConfirmModal from "../../components/shared/ConfirmModal";
import RejectModal from "../../components/shared/RejectModal";
import StatusBadge from "../../components/shared/StatusBadge";

export default function DCDashboard() {
  const { officer } = useStore();
  const [approvalQueue, setApprovalQueue] = useState([]);
  const [transferQueue, setTransferQueue] = useState([]);
  const [disputeQueue, setDisputeQueue] = useState([]);
  const [stats, setStats] = useState({ registered: 0, pending: 0, monthlyData: [] });
  const [loading, setLoading] = useState(true);

  const [target, setTarget] = useState(null);
  const [mode, setMode] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [approvalRes, transferRes, disputeRes, statsRes] = await Promise.all([
        landAPI.getAll({ status: "Verified", limit: 50 }),
        landAPI.getAll({ status: "TransferPending", limit: 50 }),
        disputeAPI.getAll({ status: "UnderReview", limit: 20 }),
        landAPI.getDashboardStats()
      ]);

      if (approvalRes.ok) setApprovalQueue(approvalRes.data.data.lands);
      if (transferRes.ok) setTransferQueue(transferRes.data.data.lands);
      if (disputeRes.ok) setDisputeQueue(disputeRes.data.data.disputes);
      
      if (statsRes.ok) {
        const data = statsRes.data.data;
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyData = (data.monthlyRegistrations || []).map(m => ({
          month: `${monthNames[m._id.month - 1]}`,
          count: m.count,
        }));

        setStats({
          registered: data.statuses.registered || 0,
          pending: (data.total || 0) - (data.statuses.registered || 0),
          monthlyData: monthlyData.length ? monthlyData : [
            { month: 'Jan', count: 12 }, { month: 'Feb', count: 19 }, { month: 'Mar', count: 15 },
            { month: 'Apr', count: 22 }, { month: 'May', count: 28 }, { month: 'Jun', count: 35 }
          ]
        });
      }
    } catch (error) {
      console.error('Failed to load DC dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const openConfirm = (item, type) => {
    setTarget(item);
    setMode(type);
    setConfirmOpen(true);
  };

  const openReject = (item, type) => {
    setTarget(item);
    setMode(type);
    setRejectOpen(true);
  };

  const onConfirm = async () => {
    if (!target || !mode) return;

    try {
      if (mode === "approve") {
        const res = await landAPI.approve(target.parcelId);
        if (res.ok) toast.success("Land approved");
        else throw new Error(res.data?.message || "Failed to approve land");
      }

      if (mode === "approve-transfer") {
        const res = await landAPI.approveTransfer(target.parcelId);
        if (res.ok) {
          toast.success("Transfer approved successfully.");
        } else {
          throw new Error(res.data?.message || "Failed to approve transfer");
        }
      }

      if (mode === "resolve-dispute") {
        const resolution = "Resolved by DC after record review.";
        const res = await disputeAPI.resolve(target.disputeId, resolution);
        if (res.ok) toast.success("Dispute resolved");
        else throw new Error(res.data?.message || "Failed to resolve dispute");
      }

      loadData();
    } catch (error) {
      toast.error(error.message || "Operation failed");
    } finally {
      setConfirmOpen(false);
      setTarget(null);
      setMode(null);
    }
  };

  const onReject = async (reason) => {
    if (!target || !mode) return;

    try {
      if (mode === "approve") {
        const res = await landAPI.reject(target.parcelId, reason);
        if (res.ok) toast.success("Request rejected");
        else throw new Error(res.data?.message || "Failed to reject request");
      }

      if (mode === "approve-transfer") {
        const res = await landAPI.rejectTransfer(target.parcelId, reason);
        if (res.ok) toast.success("Transfer rejected");
        else throw new Error(res.data?.message || "Failed to reject transfer");
      }

      if (mode === "resolve-dispute") {
        const res = await disputeAPI.reject(target.disputeId, reason);
        if (res.ok) toast.success("Dispute rejected");
        else throw new Error(res.data?.message || "Failed to reject dispute");
      }

      loadData();
    } catch (error) {
      toast.error(error.message || "Operation failed");
    } finally {
      setRejectOpen(false);
      setTarget(null);
      setMode(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Welcome, {officer?.fullName}</h1>
          <span className="rounded-full bg-[#D4AF37] px-3 py-1 text-xs font-semibold text-[#1B4332]">Final Authority</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">District: {officer?.assignedDistrict}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <StatCard title="Verified Queue" value={approvalQueue.length} icon={CheckCircle2} color="#2563EB" />
        <StatCard title="Transfer Approvals" value={transferQueue.length} icon={Waypoints} color="#EA580C" />
        <StatCard title="Dispute Resolution" value={disputeQueue.length} icon={ShieldAlert} color="#7C3AED" />
        <StatCard title="Registered" value={stats.registered} icon={Award} color="#16A34A" />
        <StatCard title="Pending" value={stats.pending} icon={Clock3} color="#D97706" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 font-semibold">Approval Queue</h2>
          {loading ? (
            <div className="py-4 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-2">
              {approvalQueue.map((land) => (
                <div key={land.parcelId} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        <Link to={`/land/${land.parcelId}`} className="text-blue-600 hover:underline dark:text-blue-400">
                          {land.parcelId}
                        </Link>
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{land.ownerName}</p>
                    </div>
                    <StatusBadge status={land.status} size="sm" />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button type="button" className="rounded bg-green-600 px-3 py-1 text-xs text-white" onClick={() => openConfirm(land, "approve")}>
                      ✓ Approve
                    </button>
                    <button type="button" className="rounded bg-red-600 px-3 py-1 text-xs text-white" onClick={() => openReject(land, "approve")}>
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}
              {approvalQueue.length === 0 && <p className="text-sm text-gray-500">No pending approvals.</p>}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 font-semibold">Transfer Approvals</h2>
          {loading ? (
            <div className="py-4 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-2">
              {transferQueue.map((land) => (
                <div key={land.parcelId} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <p className="font-medium">
                    <Link to={`/land/${land.parcelId}`} className="text-blue-600 hover:underline dark:text-blue-400">
                      {land.parcelId}
                    </Link>
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {land.ownerName} → {land.pendingTransferName}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="rounded bg-green-600 px-3 py-1 text-xs text-white"
                      onClick={() => openConfirm(land, "approve-transfer")}
                    >
                      ✓ Approve Transfer
                    </button>
                    <button type="button" className="rounded bg-red-600 px-3 py-1 text-xs text-white" onClick={() => openReject(land, "approve-transfer")}>
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}
              {transferQueue.length === 0 && <p className="text-sm text-gray-500">No pending transfers.</p>}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 font-semibold">Dispute Resolution</h2>
        {loading ? (
          <div className="py-4 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-2">
            {disputeQueue.map((d) => (
              <div key={d._id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div>
                  <p className="font-medium">
                    #{d.disputeId} - 
                    <Link to={`/land/${d.parcelId}`} className="ml-1 text-blue-600 hover:underline dark:text-blue-400">
                      {d.parcelId}
                    </Link>
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{d.claimantName}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="rounded bg-green-600 px-3 py-1 text-xs text-white" onClick={() => openConfirm(d, "resolve-dispute")}>
                    Resolve
                  </button>
                  <button type="button" className="rounded bg-red-600 px-3 py-1 text-xs text-white" onClick={() => openReject(d, "resolve-dispute")}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {disputeQueue.length === 0 && <p className="text-sm text-gray-500">No disputes under review.</p>}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 font-semibold">My Approvals This Month</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#1B4332" fill="#2D6A4F" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <p className="text-xs text-slate-500">Approved Today</p>
            <p className="text-xl font-bold">4</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <p className="text-xs text-slate-500">Transfers This Month</p>
            <p className="text-xl font-bold">7</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <p className="text-xs text-slate-500">Disputes Resolved</p>
            <p className="text-xl font-bold">3</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <p className="text-xs text-slate-500">Avg Response Time</p>
            <p className="text-xl font-bold">2.1 days</p>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirm}
        title="Confirm Action"
        message="Proceed with this action?"
        landSummary={target?.parcelId ? target : null}
      />
      <RejectModal isOpen={rejectOpen} onClose={() => setRejectOpen(false)} onConfirm={onReject} title="Provide Rejection Reason" />

      <div className="hidden">
        <XCircle />
      </div>
    </div>
  );
}
