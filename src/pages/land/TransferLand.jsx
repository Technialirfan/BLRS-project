import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useStore } from "../../store/useStore";
import { landAPI, documentAPI } from "../../services/api";
import { cleanCNIC, formatCNIC } from "../../utils/helpers";

export default function TransferLand() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { officer } = useStore();

  const [step, setStep] = useState(1);
  const [parcelId, setParcelId] = useState(params.get("parcelId") || "");
  const [selected, setSelected] = useState(null);
  const [newOwner, setNewOwner] = useState({ name: "", cnic: "", docType: "CNIC Image", files: [] });
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.get("parcelId")) {
      findLand(params.get("parcelId"));
    }
  }, [params]);

  const findLand = async (searchId) => {
    const idToSearch = (typeof searchId === 'string' && searchId) ? searchId : parcelId.toUpperCase();
    if (!idToSearch) return toast.error("Please enter a Parcel ID");
    
    try {
      const result = await landAPI.getOne(idToSearch);
      if (result.ok && result.data.success) {
        const land = result.data.data.land;
        if (land.status !== "Registered") return toast.error("Only Registered land can be transferred");
        if (land.isDisputed) return toast.error("Cannot transfer disputed land");
        if (land.status === "TransferPending") return toast.error("Transfer already in progress");
        
        setSelected(land);
        setParcelId(land.parcelId);
        setStep(2);
      } else {
        toast.error(result.data?.message || "Parcel not found");
      }
    } catch (err) {
      toast.error("Failed to fetch parcel details");
    }
  };

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    
    try {
      toast.loading(`Uploading ${newOwner.files.length} CNIC image(s)...`, { id: "transfer-toast" });
      let hashes = [];
      for (const file of newOwner.files) {
        const uploadRes = await documentAPI.upload(file);
        if (!uploadRes.ok || !uploadRes.data.success) {
          throw new Error(uploadRes.data?.message || "Failed to upload document");
        }
        hashes.push(uploadRes.data.data.ipfsHash);
      }
      
      const transferDocHash = hashes.join(",");
      toast.success("CNIC image uploaded to IPFS", { id: "transfer-toast" });
      
      toast.loading("Initiating transfer...", { id: "transfer-toast" });
      const transferData = {
        newOwnerCNIC: cleanCNIC(newOwner.cnic),
        newOwnerName: newOwner.name,
        transferDocHash
      };
      
      const result = await landAPI.initiateTransfer(selected.parcelId, transferData);
      
      if (!result.ok) {
        throw new Error(result.data?.message || "Failed to initiate transfer");
      }
      
      toast.success("Transfer initiated successfully, now wait for approval.", { id: "transfer-toast" });
      setTimeout(() => navigate("/dashboard/patwari"), 2000);
    } catch (err) {
      toast.dismiss("transfer-toast");
      toast.error(err.message || "Failed to initiate transfer", { id: "transfer-toast" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Transfer Land</h1>
      <div className="grid gap-2 md:grid-cols-3">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`rounded-lg px-3 py-2 text-center text-sm ${step === s ? "bg-[#1B4332] text-white" : "bg-slate-100 dark:bg-slate-700"}`}>
            Step {s}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <label className="mb-1 block text-sm">Parcel ID</label>
          <div className="flex gap-2">
            <input
              className="h-10 flex-1 rounded-lg border border-slate-300 px-3 uppercase dark:border-slate-600 dark:bg-slate-700"
              value={parcelId}
              onChange={(e) => setParcelId(e.target.value.toUpperCase())}
            />
            <button type="button" onClick={findLand} className="rounded-lg bg-[#1B4332] px-4 text-white">
              Search
            </button>
          </div>
          {selected ? (
            <div className="mt-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
              <p className="font-medium">{selected.parcelId}</p>
              <p>{selected.ownerName}</p>
              <p>{selected.status}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">New Owner Name EN</label>
              <input className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700" value={newOwner.name} onChange={(e) => setNewOwner({ ...newOwner, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm">New Owner CNIC</label>
              <input
                className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700"
                value={newOwner.cnic}
                onChange={(e) => setNewOwner({ ...newOwner, cnic: formatCNIC(e.target.value.replace(/\D/g, "").slice(0, 13)) || e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm">Document Type</label>
              <input 
                readOnly
                className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400" 
                value="CNIC Image" 
              />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <label className="mb-1 block text-sm">Upload CNIC Photo (Buyer/Seller)</label>
            <input 
              type="file" 
              multiple
              className="mt-1 w-full text-sm"
              onChange={(e) => {
                const newFiles = Array.from(e.target.files);
                const totalFiles = [...newOwner.files, ...newFiles];
                if (totalFiles.length > 2) {
                  toast.error("You can only upload a maximum of 2 files.");
                  e.target.value = "";
                } else {
                  setNewOwner({ ...newOwner, files: totalFiles });
                  e.target.value = ""; // Clear the input so onChange fires again
                }
              }}
            />
            {newOwner.files.length > 0 && (
              <div className="mt-2 flex items-center justify-between text-xs">
                <p className="text-green-600">
                  {newOwner.files.length} file(s) selected: {newOwner.files.map(f => f.name).join(", ")}
                </p>
                <button 
                  type="button" 
                  onClick={() => setNewOwner({ ...newOwner, files: [] })} 
                  className="text-red-500 hover:text-red-700 font-medium"
                >
                  Clear Files
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg bg-slate-200 px-4 py-2 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
              >
                ← Previous
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newOwner.name || cleanCNIC(newOwner.cnic).length !== 13 || newOwner.files.length === 0) return toast.error("Complete all fields and upload documents");
                  if (newOwner.files.length > 2) return toast.error("You can only upload a maximum of 2 files");
                  setStep(3);
                }}
                className="rounded-lg bg-[#1B4332] px-4 py-2 text-white"
              >
                Next →
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-lg font-semibold">Review & Confirm</h2>
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <p className="font-medium">{selected?.parcelId}</p>
              <p>
                Current Owner: <span className="font-semibold">{selected?.ownerName}</span>
              </p>
              <p className="my-1 text-center">↓</p>
              <p>
                New Owner: <span className="font-semibold">{newOwner.name}</span> ({newOwner.cnic})
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} /> I confirm that documents and details are accurate.
            </label>
            <div className="flex justify-between pt-2">
              <button 
                type="button" 
                onClick={() => setStep(2)} 
                disabled={submitting}
                className="rounded-lg bg-slate-200 px-4 py-2 text-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200"
              >
                ← Previous
              </button>
              <button 
                type="button" 
                disabled={!confirm || submitting} 
                onClick={submit} 
                className="rounded-lg bg-[#1B4332] px-4 py-2 text-white disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Transfer"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
