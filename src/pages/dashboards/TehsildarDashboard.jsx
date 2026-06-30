import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2, Clock3, ShieldAlert, XCircle } from "lucide-react";
import { useStore } from "../../store/useStore";
import { landAPI, disputeAPI } from "../../services/api";
import StatCard from "../../components/shared/StatCard";
import ConfirmModal from "../../components/shared/ConfirmModal";
import RejectModal from "../../components/shared/RejectModal";
import StatusBadge from "../../components/shared/StatusBadge";
import { formatDateShort } from "../../utils/helpers";

export default function TehsildarDashboard() {
  const { officer } = useStore();
  const [districtLands, setDistrictLands] = useState([]);
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [transferQueue, setTransferQueue] = useState([]);
  const [filedDisputes, setFiledDisputes] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, disputed: 0 });
  
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [mode, setMode] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [landsResult, transfersResult, disputesResult, statsResult] = await Promise.all([
        landAPI.getAll({ status: 'Pending', limit: 50 }),
        landAPI.getAll({ status: 'TransferPending', propertyType: 'Private', limit: 50 }),
        disputeAPI.getAll({ status: 'Filed', limit: 20 }),
        landAPI.getDashboardStats()
      ]);

      if (landsResult.ok) {
        setVerificationQueue(landsResult.data.data.lands);
      }
      
      if (transfersResult.ok) {
        setTransferQueue(transfersResult.data.data.lands);
      }
      
      if (disputesResult.ok) {
        setFiledDisputes(disputesResult.data.data.disputes);
      }
      
      if (statsResult.ok) {
        const data = statsResult.data.data;
        setStats({
          total: data.total,
          pending: data.statuses.pending,
          verified: data.statuses.verified,
          disputed: data.statuses.disputed
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (!selected) return;
    try {
      const response = await landAPI.verify(selected.parcelId);
      if (response.ok) {
        toast.success("Land verified successfully");
        loadData();
      } else {
        throw new Error(response.data?.message || "Verification failed");
      }
    } catch (error) {
      toast.error(error.message || "Failed to verify land");
    } finally {
      setSelected(null);
      setConfirmOpen(false);
      setMode(null);
    }
  };

  const approveTransfer = async () => {
    if (!selected) return;
    try {
      const response = await landAPI.approveTransfer(selected.parcelId);
      if (response.ok) {
        toast.success("Transfer approved successfully.");
        loadData();
      } else {
        throw new Error(response.data?.message || "Transfer approval failed");
      }
    } catch (error) {
      toast.error(error.message || "Failed to approve transfer");
    } finally {
      setSelected(null);
      setConfirmOpen(false);
      setMode(null);
    }
  };

  const reject = async (reason) => {
    if (!selected) return;
    try {
      const response = await landAPI.reject(selected.parcelId, reason);
      if (response.ok) {
        toast.success("Land rejected successfully");
        loadData();
      } else {
        throw new Error(response.data?.message || "Rejection failed");
      }
    } catch (error) {
      toast.error(error.message || "Failed to reject land");
    } finally {
      setSelected(null);
      setRejectOpen(false);
    }
  };

  const markDisputeUnderReview = async (disputeId) => {
    try {
      const response = await disputeAPI.markUnderReview(disputeId);
      if (response.ok) {
        toast.success("Dispute marked under review");
        loadData();
      } else {
        throw new Error(response.data?.message || "Operation failed");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update dispute status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h1 className="text-2xl font-bold">Welcome, {officer?.fullName}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">District: {officer?.assignedDistrict}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total District Lands" value={stats.total} icon={Clock3} color="#1B4332" />
        <StatCard title="Verification Queue" value={stats.pending} icon={Clock3} color="#D97706" />
        <StatCard title="Verified" value={stats.verified} icon={CheckCircle2} color="#2563EB" />
        <StatCard title="Open Disputes" value={stats.disputed} icon={ShieldAlert} color="#7C3AED" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 text-lg font-semibold">Verification Queue</h2>
        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-3 py-2 text-left">Parcel ID</th>
                  <th className="px-3 py-2 text-left">Owner</th>
                  <th className="px-3 py-2 text-left">Mouza</th>
                  <th className="px-3 py-2 text-left">Area</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Patwari</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {verificationQueue.map((land) => (
                  <tr key={land.parcelId} className="border-b border-slate-100 dark:border-slate-700/60">
                    <td className="px-3 py-2 font-medium">
                      <Link to={`/land/${land.parcelId}`} className="text-blue-600 hover:underline dark:text-blue-400">
                        {land.parcelId}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{land.ownerName}</td>
                    <td className="px-3 py-2">{land.mouza}</td>
                    <td className="px-3 py-2">{land.areaMarla} Marla</td>
                    <td className="px-3 py-2">{land.landType}</td>
                    <td className="px-3 py-2">{land.registeredByPatwari?.fullName}</td>
                    <td className="px-3 py-2">{formatDateShort(land.createdAt)}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(land);
                            setMode('verify');
                            setConfirmOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Verify
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(land);
                            setRejectOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                        >
                          <XCircle className="h-3 w-3" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {verificationQueue.length === 0 && (
                  <tr>
                    <td colSpan="8" className="py-4 text-center text-gray-500">No lands pending verification.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 text-lg font-semibold">Transfer Queue (Private Land)</h2>
        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-3 py-2 text-left">Parcel ID</th>
                  <th className="px-3 py-2 text-left">Previous Owner</th>
                  <th className="px-3 py-2 text-left">New Owner</th>
                  <th className="px-3 py-2 text-left">Area</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transferQueue.map((land) => (
                  <tr key={land.parcelId} className="border-b border-slate-100 dark:border-slate-700/60">
                    <td className="px-3 py-2 font-medium">
                      <Link to={`/land/${land.parcelId}`} className="text-blue-600 hover:underline dark:text-blue-400">
                        {land.parcelId}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{land.ownerName}</td>
                    <td className="px-3 py-2">{land.pendingTransferName}</td>
                    <td className="px-3 py-2">{land.areaMarla} Marla</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(land);
                            setMode('transfer');
                            setConfirmOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(land);
                            setRejectOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                        >
                          <XCircle className="h-3 w-3" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {transferQueue.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-gray-500">No transfers pending approval.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 text-lg font-semibold">Disputes Review</h2>
        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-2">
            {filedDisputes.map((d) => (
              <div key={d._id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div>
                  <p className="font-medium">
                    #{d.disputeId} - {d.parcelId}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{d.claimantName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={d.status} size="sm" />
                  <button
                    type="button"
                    className="rounded bg-[#1B4332] px-3 py-1 text-xs text-white"
                    onClick={() => markDisputeUnderReview(d.disputeId)}
                  >
                    Mark Under Review
                  </button>
                </div>
              </div>
            ))}
            {filedDisputes.length === 0 && <p className="text-sm text-gray-500">No open disputes.</p>}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setMode(null);
        }}
        onConfirm={mode === 'transfer' ? approveTransfer : verify}
        title={mode === 'transfer' ? "Approve Land Transfer" : "Verify Land Record"}
        message={mode === 'transfer' ? `Are you sure you want to approve the transfer of parcel ${selected?.parcelId} to ${selected?.pendingTransferName}?` : "Are you sure you want to verify this land record?"}
        landSummary={selected}
      />

      <RejectModal isOpen={rejectOpen} onClose={() => setRejectOpen(false)} onConfirm={reject} title="Reject Land Record" />
    </div>
  );
}
