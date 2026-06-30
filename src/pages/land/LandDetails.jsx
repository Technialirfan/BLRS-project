import { useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Copy, FileDown, FileText, Printer, ShieldAlert, Waypoints } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useStore } from "../../store/useStore";
import {
  formatCNIC,
  formatDate,
  generateFakeTxHash,
  truncateHash,
} from "../../utils/helpers";
import StatusBadge from "../../components/shared/StatusBadge";
import LandMap from "../../components/land/LandMap";
import ReadOnlyMap from "../../components/map/ReadOnlyMap";
import DocumentViewer from "../../components/shared/DocumentViewer";
import LandHistory from "../../components/land/LandHistory";
import ConfirmModal from "../../components/shared/ConfirmModal";
import RejectModal from "../../components/shared/RejectModal";
import { landAPI } from "../../services/api";
import { generateLandReport, generateOwnershipCertificate, generateSaleDeed, generateMutationCertificate } from "../../utils/pdfGenerator";
import { Dialog, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import EditLandModal from "../../components/land/EditLandModal";

const LandDetails = () => {
  const { parcelId } = useParams();
  const navigate = useNavigate();
  const user = useStore((s) => s.officer);
  const lands = useStore((s) => s.lands);
  const disputes = useStore((s) => s.disputes);
  const updateLandStatus = useStore((s) => s.updateLandStatus);
  const updateLandOwner = useStore((s) => s.updateLandOwner);
  const addLog = useStore((s) => s.addLog);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [rawOpen, setRawOpen] = useState(false);

  const [localLand, setLocalLand] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLand = async () => {
      try {
        const response = await landAPI.getOne(parcelId);
        if (response.ok) {
          setLocalLand(response.data?.data?.land || response.data?.land);
        }
      } catch (err) {
        console.error("Failed to fetch land details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLand();
  }, [parcelId]);

  const storeLand = useMemo(() => lands.find((l) => l.parcelId === parcelId), [lands, parcelId]);
  const land = localLand || storeLand;
  const history = land?.ownershipHistory || [];
  const activeDispute = disputes.find((d) => d.parcelId === parcelId && d.status !== "Resolved" && d.status !== "Rejected");

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!land) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <p className="font-semibold">Land record not found.</p>
      </div>
    );
  }

  const docs = (land.allDocHashes || []).map((hash, idx) => ({
    type: land.docTypes?.[idx] || "Document",
    hash,
  }));

  const workflow = [
    {
      label: "Registered by Patwari",
      officer: land.registeredByPatwari?.fullName || land.registeredByPatwariName || "Unknown Officer",
      date: formatDate(land.registeredAt || land.createdAt),
      tx: land.blockchainTxHash,
    },
    {
      label: "Verified by Tehsildar",
      officer: land.status === "Pending" ? "—" : (land.verifiedByTehsildar?.fullName || land.verifiedByTehsildarName || "Unknown Officer"),
      date: land.status === "Pending" ? null : formatDate(land.verifiedAt || land.updatedAt),
      tx: land.blockchainTxHash,
    },
    {
      label: land.propertyType === "Private" ? "Approved by Tehsildar" : "Approved by DC",
      officer: ["Pending", "Verified"].includes(land.status) ? "—" : (land.propertyType === "Private" ? (land.approvedByTehsildar?.fullName || land.approvedByTehsildarName || "Unknown Officer") : (land.approvedByDC?.fullName || land.approvedByDCName || "Unknown Officer")),
      date: ["Pending", "Verified"].includes(land.status) ? null : formatDate(land.approvedAt || land.updatedAt),
      tx: land.blockchainTxHash,
    },
  ];

  const runAction = async () => {
    try {
      if (action === "verify") {
        const res = await landAPI.verify(land.parcelId);
        if (!res?.ok) throw new Error(res?.data?.message || "Verification failed");
        toast.success("Land verified");
      }
      if (action === "approve") {
        const res = await landAPI.approve(land.parcelId);
        if (!res?.ok) throw new Error(res?.data?.message || "Approval failed");
        toast.success("Land approved");
      }
      if (action === "approve-transfer") {
        const res = await landAPI.approveTransfer(land.parcelId);
        if (!res?.ok) throw new Error(res?.data?.message || "Transfer approval failed");
        toast.success("Transfer approved");
      }
      if (action === "delete") {
        const res = await landAPI.delete(land.parcelId);
        if (!res?.ok) throw new Error(res?.data?.message || "Deletion failed");
        toast.success("Land record deleted successfully");
        navigate("/land/all");
        return;
      }
      
      // Refresh local data
      const response = await landAPI.getOne(parcelId);
      if (response?.ok) setLocalLand(response.data?.data?.land || response.data?.land);
      setConfirmOpen(false);
    } catch (error) {
      toast.error(error.message || error.response?.data?.message || "Action failed");
    }
  };

  const runReject = async (reason) => {
    try {
      if (action === "revoke") {
        const res = await landAPI.revoke(land.parcelId, reason);
        if (!res?.ok) throw new Error(res?.data?.message || "Revoke failed");
        toast.success("Land registration suspended/revoked");
        const response = await landAPI.getOne(parcelId);
        if (response?.ok) setLocalLand(response.data?.data?.land || response.data?.land);
      } else {
        const res = await landAPI.reject(land.parcelId, reason);
        if (!res?.ok) throw new Error(res?.data?.message || "Reject failed");
        updateLandStatus(land.parcelId, "Rejected", { rejectionReason: reason });
        addLog("LAND_REJECTED", user, land.parcelId, { reason });
        toast.success("Record rejected");
      }
    } catch (error) {
      toast.error(error.message || error.response?.data?.message || "Action failed");
    } finally {
      setRejectOpen(false);
      setAction(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/land/all" className="hover:underline">
          Land Records
        </Link>
        <span>/</span>
        <span>{land.parcelId}</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">{land.parcelId}</h1>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={land.status} />
              {land.isDisputed ? <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">Dispute Active</span> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {land.status === "Registered" ? (
              <button
                type="button"
                onClick={() => generateOwnershipCertificate(land)}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-100 px-3 py-2 text-sm text-amber-800"
              >
                <FileDown className="h-4 w-4" /> Download Certificate
              </button>
            ) : null}
            {land.ownershipHistory && land.ownershipHistory.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => generateSaleDeed(land)}
                  className="inline-flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800"
                >
                  <FileDown className="h-4 w-4" /> Sale Deed
                </button>
                <button
                  type="button"
                  onClick={() => generateMutationCertificate(land)}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800"
                >
                  <FileDown className="h-4 w-4" /> Mutation
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => generateLandReport(land, history)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
            >
              <FileText className="h-4 w-4" /> Download Report
            </button>
            <button
              type="button"
              onClick={() => navigate(`/land/${land.parcelId}/print`)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1B4332] px-3 py-2 text-sm text-white"
            >
              <Printer className="h-4 w-4" /> Print Record
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-2 text-lg font-semibold">Land Information</h2>
            <div className="grid gap-1 text-sm md:grid-cols-2">
              <p>
                <span className="font-medium">Owner:</span> {land.ownerName}
              </p>
              <p>
                <span className="font-medium">CNIC:</span> {formatCNIC(land.ownerCNIC)}
              </p>
              <p>
                <span className="font-medium">Property:</span> {land.propertyType || "Private"}
              </p>
              <p>
                <span className="font-medium">Type:</span> {land.landType}
              </p>
              <p>
                <span className="font-medium">District:</span> {land.district}
              </p>
              <p>
                <span className="font-medium">Tehsil:</span> {land.tehsil}
              </p>
              <p>
                <span className="font-medium">Mouza:</span> {land.mouza}
              </p>
              <p>
                <span className="font-medium">Area:</span> {land.areaSqFt ? `${land.areaMarla} Marla (${land.areaSqFt} sq ft)` : "Pending Field Survey"}
              </p>
            </div>
          </div>

          {land.gisData && land.gisData.coordinates ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-2 text-lg font-semibold">GIS Map & Boundaries</h2>
              <ReadOnlyMap gisData={land.gisData} status={land.status} />
              {land.calculatedArea && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div><span className="font-semibold text-slate-700 dark:text-slate-300">Sq Ft:</span> {land.calculatedArea.sqft}</div>
                  <div><span className="font-semibold text-slate-700 dark:text-slate-300">Marla:</span> {land.calculatedArea.marla}</div>
                  <div><span className="font-semibold text-slate-700 dark:text-slate-300">Kanal:</span> {land.calculatedArea.kanal}</div>
                  <div><span className="font-semibold text-slate-700 dark:text-slate-300">Acre:</span> {land.calculatedArea.acre}</div>
                </div>
              )}
            </div>
          ) : land.gpsLat && land.gpsLng ? (
            <LandMap
              singleMarker={{ lat: land.gpsLat, lng: land.gpsLng, label: land.parcelId }}
              center={[land.gpsLat, land.gpsLng]}
              zoom={13}
              readOnly
            />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="font-medium">GIS Map & Boundaries Pending</p>
              <p className="text-sm">Coordinates will be mapped during the Field Survey.</p>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-2 text-lg font-semibold">Documents</h2>
            <DocumentViewer documents={docs} />
          </div>

          {land.status === "Rejected" && land.rejectionReason ? (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/20">
              <p className="font-semibold">Rejection Reason</p>
              <p>{land.rejectionReason}</p>
            </div>
          ) : null}

          {land.status === "Suspended" && land.suspensionReason ? (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/20">
              <p className="font-semibold">Suspension Reason (Court Stay Order)</p>
              <p>{land.suspensionReason}</p>
            </div>
          ) : null}

          {land.status === "TransferPending" ? (
            <div className="rounded-xl border border-orange-300 bg-orange-50 p-4 text-sm text-orange-700 dark:border-orange-700 dark:bg-orange-950/20">
              <p className="font-semibold">Pending Transfer</p>
              <p>
                To: {land.pendingTransferName} ({formatCNIC(land.pendingTransferCNIC || "")})
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-2 text-lg font-semibold">Workflow Timeline</h2>
            <div className="space-y-3">
              {workflow.map((w, i) => (
                <div key={w.label} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                  <p className="font-medium">
                    {i + 1}. {w.label}
                  </p>
                  <p>{w.officer}</p>
                  <p className="text-xs text-slate-500">{w.date}</p>
                  <button
                    type="button"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-[#1B4332] dark:text-[#D4AF37]"
                    onClick={() => {
                      navigator.clipboard.writeText(w.tx || "");
                      toast.success("Hash copied");
                    }}
                  >
                    <Copy className="h-3 w-3" /> {truncateHash(w.tx)}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-2 text-lg font-semibold">Blockchain Record</h2>
            <p className="tx-hash text-sm">{land.blockchainTxHash}</p>
            <p className="mt-1 text-xs text-slate-500">Block: #{Math.floor(Math.random() * 90000) + 10000}</p>
            <button type="button" className="mt-2 text-sm text-[#1B4332] hover:underline dark:text-[#D4AF37]" onClick={() => setRawOpen(true)}>
              View Raw Transaction
            </button>
          </div>

          {land.status === "Registered" ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
              <h2 className="font-semibold text-amber-800 dark:text-amber-200">NFT Certificate</h2>
              <p className="text-sm">Token ID: #{land.nftTokenId || "Not Minted"}</p>
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-2 text-lg font-semibold">Ownership History</h2>
            <LandHistory history={history} parcelId={land.parcelId} />
          </div>

          {activeDispute ? (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950/20">
              <p className="inline-flex items-center gap-2 font-semibold text-red-700 dark:text-red-200">
                <ShieldAlert className="h-4 w-4" /> Active Dispute #{activeDispute.disputeId}
              </p>
              <p className="mt-1 text-sm">{activeDispute.description.slice(0, 120)}...</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-2 font-semibold">Actions</h2>
        <div className="flex flex-wrap gap-2">
          {user?.role === "tehsildar" && land.status === "Pending" ? (
            <>
              <button type="button" className="rounded bg-green-600 px-3 py-2 text-sm text-white" onClick={() => { setAction("verify"); setConfirmOpen(true); }}>
                {land.propertyType === "Private" ? "✓ Final Approval" : "✓ Verify"}
              </button>
              <button type="button" className="rounded bg-red-600 px-3 py-2 text-sm text-white" onClick={() => setRejectOpen(true)}>
                ✗ Reject
              </button>
            </>
          ) : null}

          {user?.role === "patwari" && land.status === "Pending" ? (
            <>
              <button type="button" className="rounded bg-blue-600 px-3 py-2 text-sm text-white" onClick={() => setEditOpen(true)}>
                ✎ Edit Details
              </button>
              <button type="button" className="rounded bg-red-600 px-3 py-2 text-sm text-white" onClick={() => { setAction("delete"); setConfirmOpen(true); }}>
                🗑 Delete Record
              </button>
            </>
          ) : null}

          {user?.role === "dc" && land.status === "Verified" ? (
            <>
              <button type="button" className="rounded bg-green-600 px-3 py-2 text-sm text-white" onClick={() => { setAction("approve"); setConfirmOpen(true); }}>
                ✓ Final Approval
              </button>
              <button type="button" className="rounded bg-red-600 px-3 py-2 text-sm text-white" onClick={() => setRejectOpen(true)}>
                ✗ Reject
              </button>
            </>
          ) : null}

          {user?.role === "dc" && land.status === "TransferPending" ? (
            <>
              <button type="button" className="rounded bg-green-600 px-3 py-2 text-sm text-white" onClick={() => { setAction("approve-transfer"); setConfirmOpen(true); }}>
                ✓ Approve Transfer
              </button>
              <button type="button" className="rounded bg-red-600 px-3 py-2 text-sm text-white" onClick={() => setRejectOpen(true)}>
                ✗ Reject Transfer
              </button>
            </>
          ) : null}

          {(user?.role === "admin" || user?.role === "dc") && land.status === "Registered" ? (
            <button type="button" className="rounded bg-red-700 px-3 py-2 text-sm text-white" onClick={() => { setAction("revoke"); setRejectOpen(true); }}>
              ⚠️ Suspend/Revoke Registration
            </button>
          ) : null}

          {user?.role === "patwari" && land.status === "Registered" ? (
            <>
              <button type="button" className="inline-flex items-center gap-2 rounded bg-orange-600 px-3 py-2 text-sm text-white" onClick={() => navigate(`/land/transfer?parcelId=${land.parcelId}`)}>
                <Waypoints className="h-4 w-4" /> Initiate Transfer
              </button>
              <button type="button" className="inline-flex items-center gap-2 rounded bg-purple-600 px-3 py-2 text-sm text-white" onClick={() => navigate(`/disputes?parcelId=${land.parcelId}`)}>
                ⚖ File Dispute
              </button>
            </>
          ) : null}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={runAction}
        title="Confirm Action"
        message={action === "delete" ? "Are you sure you want to permanently delete this pending land record?" : "Proceed with this action?"}
        landSummary={land}
      />
      <RejectModal isOpen={rejectOpen} onClose={() => setRejectOpen(false)} onConfirm={runReject} title="Provide Rejection Reason" />

      <EditLandModal 
        isOpen={editOpen} 
        onClose={() => setEditOpen(false)} 
        land={land} 
        onSuccess={async () => {
          setEditOpen(false);
          const response = await landAPI.getOne(parcelId);
          if (response?.ok) setLocalLand(response.data?.data?.land || response.data?.land);
        }} 
      />

      <Dialog open={rawOpen} onOpenChange={setRawOpen}>
        <DialogHeader>
          <DialogTitle>Raw Transaction JSON</DialogTitle>
        </DialogHeader>
        <pre className="max-h-[60vh] overflow-auto rounded-lg bg-slate-100 p-3 text-xs dark:bg-slate-900">
{JSON.stringify(land, null, 2)}
        </pre>
      </Dialog>
    </div>
  );
};

export default LandDetails;

