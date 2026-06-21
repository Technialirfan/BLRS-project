import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, X } from "lucide-react";
import { useStore } from "../../store/useStore";
import DisputeCard from "../../components/dispute/DisputeCard";
import { DISPUTE_TYPES } from "../../utils/constants";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { disputeAPI } from "../../services/api";

const tabs = ["all", "Filed", "UnderReview", "Resolved", "Rejected"];

const ManageDisputes = () => {
  const [params] = useSearchParams();
  const user = useStore((s) => s.officer);
  
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [panelOpen, setPanelOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    parcelId: params.get("parcelId") || "",
    claimantName: "",
    claimantCNIC: "",
    claimantPhone: "",
    disputeType: "ownership_claim",
    description: "",
    evidenceTypes: [],
    evidenceFiles: [],
  });
  const [evidenceType, setEvidenceType] = useState("Court Order");
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const response = await disputeAPI.getAll();
      if (response.ok && response.data.success) {
        setDisputes(response.data.data.disputes || []);
      }
    } catch (error) {
      console.error("Failed to fetch disputes:", error);
      toast.error("Failed to fetch disputes from backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
    if (params.get("parcelId")) setPanelOpen(true);
  }, [params]);

  const visible = useMemo(() => {
    if (activeTab === "all") return disputes;
    return disputes.filter((d) => d.status === activeTab);
  }, [activeTab, disputes]);

  const handleAddEvidence = () => {
    if (!selectedFile) {
      return toast.error("Please select a file to upload as evidence");
    }
    setForm((f) => ({
      ...f,
      evidenceTypes: [...f.evidenceTypes, evidenceType],
      evidenceFiles: [...f.evidenceFiles, selectedFile],
    }));
    setSelectedFile(null);
  };

  const fileDispute = async () => {
    if (!form.parcelId) return toast.error("Parcel ID is required");
    if (!form.claimantName || form.claimantCNIC.length < 13 || form.description.length < 50) {
      return toast.error("Complete form fields (description min 50 chars)");
    }
    if (!form.claimantPhone || form.claimantPhone.length !== 11) {
      return toast.error("Phone number must be exactly 11 digits");
    }
    if (form.evidenceFiles.length === 0) return toast.error("Add at least one evidence item");

    try {
      setSubmitting(true);
      toast.loading("Filing dispute...", { id: "file-dispute" });

      const formData = new FormData();
      formData.append("parcelId", form.parcelId);
      formData.append("claimantName", form.claimantName);
      formData.append("claimantCNIC", form.claimantCNIC);
      formData.append("claimantPhone", form.claimantPhone);
      formData.append("disputeType", form.disputeType);
      formData.append("description", form.description);

      form.evidenceTypes.forEach((type) => {
        formData.append("evidenceTypes", type);
      });

      form.evidenceFiles.forEach((file) => {
        formData.append("evidenceFiles", file); // multer handles this
      });

      const response = await disputeAPI.file(formData);

      if (!response.ok) {
        throw new Error(response.data?.message || "Failed to file dispute");
      }

      toast.success("Dispute filed successfully", { id: "file-dispute" });
      setPanelOpen(false);
      setForm({
        parcelId: "",
        claimantName: "",
        claimantCNIC: "",
        claimantPhone: "",
        disputeType: "ownership_claim",
        description: "",
        evidenceTypes: [],
        evidenceFiles: [],
      });
      fetchDisputes(); // Refresh list
    } catch (error) {
      toast.error(error.message, { id: "file-dispute" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (disputeId, action, reasonOrRes = "") => {
    try {
      toast.loading(`Processing...`, { id: "status-update" });
      
      let response;
      if (action === "review") {
        response = await disputeAPI.review(disputeId);
      } else if (action === "resolve") {
        response = await disputeAPI.resolve(disputeId, reasonOrRes);
      } else if (action === "reject") {
        response = await disputeAPI.reject(disputeId, reasonOrRes);
      }

      if (!response.ok) throw new Error(response.data?.message || "Failed to update status");

      toast.success("Dispute updated", { id: "status-update" });
      fetchDisputes(); // refresh
    } catch (error) {
      toast.error(error.message, { id: "status-update" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Disputes</h1>
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1B4332] px-4 py-2 text-sm text-white"
        >
          <Plus className="h-4 w-4" /> File Dispute
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-3 py-1 text-sm ${activeTab === tab ? "bg-[#1B4332] text-white" : "bg-slate-100 dark:bg-slate-700"}`}
          >
            {tab === "all" ? "All" : tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
           <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
        </div>
      ) : visible.length === 0 ? (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
           No disputes found.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((dispute) => (
            <DisputeCard
              key={dispute._id}
              dispute={dispute}
              actions={
                <div className="flex gap-1">
                  {user?.role === "tehsildar" && dispute.status === "Filed" ? (
                    <button
                      type="button"
                      className="rounded bg-indigo-600 px-2 py-1 text-xs text-white"
                      onClick={() => handleStatusUpdate(dispute._id, "review")}
                    >
                      Mark Under Review
                    </button>
                  ) : null}

                  {user?.role === "dc" && dispute.status === "UnderReview" ? (
                    <>
                      <button
                        type="button"
                        className="rounded bg-green-600 px-2 py-1 text-xs text-white"
                        onClick={() => {
                          const res = window.prompt("Enter resolution decision:");
                          if (res) handleStatusUpdate(dispute._id, "resolve", res);
                        }}
                      >
                        Resolve
                      </button>
                      <button
                        type="button"
                        className="rounded bg-red-600 px-2 py-1 text-xs text-white"
                        onClick={() => {
                          const reason = window.prompt("Enter rejection reason:");
                          if (reason) handleStatusUpdate(dispute._id, "reject", reason);
                        }}
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                </div>
              }
            />
          ))}
        </div>
      )}

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent side="right" onClose={() => setPanelOpen(false)} className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>File New Dispute</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 text-sm mt-4">
            <div>
              <label className="mb-1 block">Parcel ID</label>
              <input className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700" value={form.parcelId} onChange={(e) => setForm({ ...form, parcelId: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <label className="mb-1 block">Claimant Name</label>
              <input className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700" value={form.claimantName} onChange={(e) => setForm({ ...form, claimantName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block">CNIC</label>
                <input className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700" value={form.claimantCNIC} onChange={(e) => setForm({ ...form, claimantCNIC: e.target.value.replace(/\D/g, "").slice(0, 13) })} placeholder="Without dashes" />
              </div>
              <div>
                <label className="mb-1 block">Phone</label>
                <input className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700" value={form.claimantPhone} onChange={(e) => setForm({ ...form, claimantPhone: e.target.value.replace(/\D/g, "").slice(0, 11) })} placeholder="e.g. 03001234567" />
              </div>
            </div>
            <div>
              <label className="mb-1 block">Dispute Type</label>
              <select className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700" value={form.disputeType} onChange={(e) => setForm({ ...form, disputeType: e.target.value })}>
                {DISPUTE_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block">Description (min 50 chars)</label>
              <textarea className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <p className="text-xs text-slate-500 mt-1">{form.description.length} chars</p>
            </div>
            
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <p className="mb-2 font-medium">Evidence Documents</p>
              
              <div className="space-y-2 mb-3">
                <select className="h-9 w-full rounded border border-slate-300 px-2 dark:border-slate-600 dark:bg-slate-700" value={evidenceType} onChange={(e) => setEvidenceType(e.target.value)}>
                  <option>Court Order</option>
                  <option>Survey Map</option>
                  <option>Inheritance Certificate</option>
                  <option>Original Fard</option>
                </select>
                
                <div className="flex gap-2 items-center">
                  <input 
                    type="file" 
                    className="flex-1 text-xs file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-[#1B4332] hover:file:bg-green-100" 
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    key={form.evidenceFiles.length} // Force re-render of input after add
                  />
                  <button
                    type="button"
                    className="rounded bg-[#1B4332] text-white px-3 py-1.5 text-xs font-medium shrink-0 disabled:opacity-50"
                    onClick={handleAddEvidence}
                    disabled={!selectedFile}
                  >
                    Add Evidence
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                {form.evidenceFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600">
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{form.evidenceTypes[i]}</p>
                      <p className="text-xs text-slate-500 truncate">{f.name}</p>
                    </div>
                    <button 
                      onClick={() => {
                        const newTypes = [...form.evidenceTypes];
                        const newFiles = [...form.evidenceFiles];
                        newTypes.splice(i, 1);
                        newFiles.splice(i, 1);
                        setForm({ ...form, evidenceTypes: newTypes, evidenceFiles: newFiles });
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {form.evidenceFiles.length === 0 && (
                  <p className="text-xs text-slate-500 italic text-center py-2">No evidence documents added yet</p>
                )}
              </div>
            </div>
            
            <button 
              type="button" 
              onClick={fileDispute} 
              disabled={submitting}
              className="w-full mt-4 rounded-lg bg-[#1B4332] py-2.5 font-medium text-white disabled:opacity-70"
            >
              {submitting ? "Submitting..." : "Submit Dispute"}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ManageDisputes;
