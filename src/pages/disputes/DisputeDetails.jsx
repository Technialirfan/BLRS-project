import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useStore } from "../../store/useStore";
import StatusBadge from "../../components/shared/StatusBadge";
import { formatCNIC, formatDate, truncateHash } from "../../utils/helpers";
import RejectModal from "../../components/shared/RejectModal";
import { disputeAPI } from "../../services/api";

const DisputeDetails = () => {
  const { id } = useParams();
  const user = useStore((s) => s.officer);
  
  const [dispute, setDispute] = useState(null);
  const [land, setLand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchDispute = async () => {
    try {
      setLoading(true);
      const res = await disputeAPI.getOne(id);
      if (res.ok && res.data.success) {
        setDispute(res.data.data.dispute);
        setLand(res.data.data.land);
      } else {
        toast.error("Failed to load dispute details");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispute();
  }, [id]);

  const handleReview = async () => {
    setProcessing(true);
    try {
      const res = await disputeAPI.markUnderReview(dispute._id || dispute.disputeId);
      if (res.ok && res.data.success) {
        toast.success("Dispute marked under review");
        fetchDispute();
      } else {
        toast.error(res.data?.message || "Failed to mark under review");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleResolve = async () => {
    setProcessing(true);
    try {
      const res = await disputeAPI.resolve(dispute._id || dispute.disputeId, "Resolved after review.");
      if (res.ok && res.data.success) {
        toast.success("Dispute resolved successfully");
        fetchDispute();
      } else {
        toast.error(res.data?.message || "Failed to resolve dispute");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (reason) => {
    setProcessing(true);
    try {
      const res = await disputeAPI.reject(dispute._id || dispute.disputeId, reason);
      if (res.ok && res.data.success) {
        toast.success("Dispute rejected successfully");
        fetchDispute();
      } else {
        toast.error(res.data?.message || "Failed to reject dispute");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setProcessing(false);
      setRejectOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 text-center">
        <p>Loading dispute details...</p>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <p>Dispute not found.</p>
        <Link to="/disputes" className="mt-4 inline-flex items-center text-indigo-600 hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Disputes
        </Link>
      </div>
    );
  }

  // Workflow logic based on Land Type
  const isGovtLand = land?.landType === "Government";
  const isPrivateLand = !isGovtLand;
  
  const canTehsildarReview = user?.role === "tehsildar" && isGovtLand && dispute.status === "Filed";
  const canTehsildarResolve = user?.role === "tehsildar" && isPrivateLand && (dispute.status === "Filed" || dispute.status === "UnderReview");
  const canDCResolve = user?.role === "dc" && isGovtLand && dispute.status === "UnderReview";

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-500">
        <Link to="/disputes" className="hover:underline">
          Disputes
        </Link>{" "}
        / #{dispute.disputeId}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dispute #{dispute.disputeId}</h1>
          <StatusBadge status={dispute.status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-2 text-lg font-semibold">Dispute Information</h2>
            <p>
              <span className="font-medium">Type:</span> {dispute.disputeType}
            </p>
            <p className="mt-2 text-sm">{dispute.description}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-2 text-lg font-semibold">Land</h2>
            <p>
              <span className="font-medium">Parcel:</span> {dispute.parcelId}
            </p>
            <p>
              <span className="font-medium">Type:</span> {land?.landType || "—"}
            </p>
            <p>
              <span className="font-medium">Owner:</span> {land?.ownerName || "—"}
            </p>
            <p>
              <span className="font-medium">District:</span> {land?.district || "—"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-2 text-lg font-semibold">Claimant</h2>
            <p>{dispute.claimantName}</p>
            <p>{formatCNIC(dispute.claimantCNIC)}</p>
            <p>{dispute.claimantPhone}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-2 text-lg font-semibold">Evidence</h2>
            {dispute.evidenceHashes.map((hash, i) => (
              <p key={`${hash}-${i}`} className="text-sm mb-1">
                <span className="font-medium mr-2">{dispute.evidenceTypes[i]}:</span>
                <a 
                  href={`https://gateway.pinata.cloud/ipfs/${hash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                >
                  {hash}
                </a>
              </p>
            ))}
            {dispute.evidenceHashes.length === 0 && <p className="text-sm text-slate-500">No evidence uploaded</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-2 text-lg font-semibold">Timeline</h2>
            <div className="space-y-2 text-sm">
              <div className="rounded border border-slate-200 p-3 dark:border-slate-700">
                <p className="font-medium">Filed</p>
                <p>{dispute.filedByOfficer?.fullName}</p>
                <p className="text-xs text-slate-500">{formatDate(dispute.filedAt)}</p>
              </div>
              {dispute.reviewedBy && (
                <div className="rounded border border-slate-200 p-3 dark:border-slate-700">
                  <p className="font-medium">Reviewed</p>
                  <p>{dispute.reviewedBy?.fullName || "—"}</p>
                  <p className="text-xs text-slate-500">{formatDate(dispute.reviewedAt)}</p>
                </div>
              )}
              {dispute.resolvedBy && (
                <div className="rounded border border-slate-200 p-3 dark:border-slate-700">
                  <p className="font-medium">{dispute.status === "Rejected" ? "Rejected" : "Resolved"}</p>
                  <p>{dispute.resolvedBy?.fullName || "—"}</p>
                  <p className="text-xs text-slate-500">{formatDate(dispute.resolvedAt)}</p>
                  {dispute.resolution ? <p className="mt-1 text-xs">Resolution: {dispute.resolution}</p> : null}
                  {dispute.rejectionReason ? <p className="mt-1 text-xs text-red-600">Reason: {dispute.rejectionReason}</p> : null}
                </div>
              )}
            </div>
          </div>

          {dispute.blockchainTxHash && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-2 text-lg font-semibold">Blockchain</h2>
              <p className="tx-hash text-sm">{truncateHash(dispute.blockchainTxHash, 12)}</p>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-2 text-lg font-semibold">Actions</h2>
            <div className="flex flex-wrap gap-2">
              {canTehsildarReview && (
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleReview}
                  className="rounded bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                >
                  Review (Govt Land)
                </button>
              )}

              {(canTehsildarResolve || canDCResolve) && (
                <>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleResolve}
                    className="rounded bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    Resolve
                  </button>
                  <button 
                    type="button" 
                    disabled={processing}
                    onClick={() => setRejectOpen(true)} 
                    className="rounded bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}

              {dispute.status === "Disputed" ? (
                <p className="inline-flex items-center gap-1 text-sm text-red-600">
                  <ShieldAlert className="h-4 w-4" /> Active
                </p>
              ) : null}
              
              {!canTehsildarReview && !canTehsildarResolve && !canDCResolve && (
                <p className="text-sm text-slate-500">No actions available for your role.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <RejectModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
        title="Reject Dispute"
      />
    </div>
  );
};

export default DisputeDetails;
