import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Dialog, DialogHeader, DialogTitle } from "../ui/dialog";
import { landAPI } from "../../services/api";
import { DOCUMENT_TYPES } from "../../utils/constants";

const EditLandModal = ({ isOpen, onClose, land, onSuccess }) => {
  const [formData, setFormData] = useState({
    ownerName: "",
    ownerCNIC: "",
    district: "",
    tehsil: "",
    mouza: "",
    landType: "",
    areaSqFt: "",
  });
  const [retainedDocs, setRetainedDocs] = useState([]);
  const [newDocs, setNewDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (land && isOpen) {
      setFormData({
        ownerName: land.ownerName || "",
        ownerCNIC: land.ownerCNIC || "",
        district: land.district || "",
        tehsil: land.tehsil || "",
        mouza: land.mouza || "",
        landType: land.landType || "",
        areaSqFt: land.areaSqFt || "",
      });

      // Load existing documents
      if (land.allDocHashes && land.docTypes) {
        const docs = land.allDocHashes.map((hash, i) => ({
          hash,
          type: land.docTypes[i] || "Supporting Document",
        }));
        setRetainedDocs(docs);
      }
      setNewDocs([]);
    }
  }, [land, isOpen]);

  const addFiles = (files) => {
    const accepted = Array.from(files).filter(
      (f) =>
        ["application/pdf", "image/png", "image/jpeg"].includes(f.type) &&
        f.size <= 5 * 1024 * 1024
    );
    if (accepted.length !== files.length) {
      toast.error("Only PDF/JPG/PNG up to 5MB are accepted");
    }
    if (retainedDocs.length + newDocs.length + accepted.length > 5) {
      toast.error("Maximum limit is 5 documents per registration");
      return;
    }
    setNewDocs((prevDocs) => [
      ...prevDocs,
      ...accepted.map((f) => ({
        file: f,
        name: f.name,
        size: f.size,
        type: "Supporting Document",
      })),
    ]);
  };

  const removeRetainedDoc = (index) => {
    setRetainedDocs((docs) => docs.filter((_, i) => i !== index));
  };

  const removeNewDoc = (index) => {
    setNewDocs((docs) => docs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (retainedDocs.length === 0 && newDocs.length === 0) {
      toast.error("At least one document is required");
      return;
    }

    setLoading(true);
    try {
      const areaSqFt = Number(formData.areaSqFt);
      const areaMarla = Number((areaSqFt / 225).toFixed(2));
      const areaKanal = Number((areaSqFt / 4500).toFixed(2));
      const areaAcre = Number((areaSqFt / 36000).toFixed(2));

      // Use FormData to send files and text
      const submitData = new FormData();
      submitData.append("ownerName", formData.ownerName);
      submitData.append("ownerCNIC", formData.ownerCNIC);
      submitData.append("district", formData.district);
      submitData.append("tehsil", formData.tehsil);
      submitData.append("mouza", formData.mouza);
      submitData.append("landType", formData.landType);
      submitData.append("areaSqFt", areaSqFt);
      submitData.append("areaMarla", areaMarla);
      submitData.append("areaKanal", areaKanal);
      submitData.append("areaAcre", areaAcre);

      // Append retained documents
      retainedDocs.forEach((doc) => {
        submitData.append("retainedDocHashes", doc.hash);
        submitData.append("retainedDocTypes", doc.type);
      });

      // Append new documents
      newDocs.forEach((doc) => {
        submitData.append("newDocs", doc.file);
        submitData.append("newDocTypes", doc.type);
      });

      await landAPI.update(land.parcelId, submitData);
      toast.success("Land updated successfully");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to update land");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogHeader>
        <DialogTitle>Edit Land Record ({land?.parcelId})</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 pt-4 overflow-y-auto max-h-[80vh] px-2">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Owner Name</label>
            <input
              className="h-10 w-full rounded border px-3 text-sm dark:bg-slate-800"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Owner CNIC</label>
            <input
              className="h-10 w-full rounded border px-3 text-sm dark:bg-slate-800"
              value={formData.ownerCNIC}
              onChange={(e) => setFormData({ ...formData, ownerCNIC: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">District</label>
            <input
              className="h-10 w-full rounded border px-3 text-sm dark:bg-slate-800"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Tehsil</label>
            <input
              className="h-10 w-full rounded border px-3 text-sm dark:bg-slate-800"
              value={formData.tehsil}
              onChange={(e) => setFormData({ ...formData, tehsil: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Mouza</label>
            <input
              className="h-10 w-full rounded border px-3 text-sm dark:bg-slate-800"
              value={formData.mouza}
              onChange={(e) => setFormData({ ...formData, mouza: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Land Type</label>
            <select
              className="h-10 w-full rounded border px-3 text-sm dark:bg-slate-800"
              value={formData.landType}
              onChange={(e) => setFormData({ ...formData, landType: e.target.value })}
              required
            >
              <option value="agricultural">Agricultural</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm">Total Area (Square Feet)</label>
            <input
              type="number"
              className="h-10 w-full rounded border px-3 text-sm dark:bg-slate-800"
              value={formData.areaSqFt}
              onChange={(e) => setFormData({ ...formData, areaSqFt: e.target.value })}
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              {formData.areaSqFt ? `${(formData.areaSqFt / 225).toFixed(2)} Marla` : ""}
            </p>
          </div>
        </div>

        {/* DOCUMENTS SECTION */}
        <div className="border-t pt-4 dark:border-slate-700">
          <label className="mb-2 block font-semibold">Documents</label>
          <div className="space-y-2 mb-4">
            {retainedDocs.map((doc, i) => (
              <div key={`ret-${i}`} className="flex items-center justify-between rounded border p-2 text-sm dark:border-slate-700">
                <div className="flex flex-col">
                  <span className="font-medium truncate max-w-[200px] text-xs">IPFS: {doc.hash}</span>
                  <select
                    value={doc.type}
                    onChange={(e) =>
                      setRetainedDocs((prev) =>
                        prev.map((d, idx) => (idx === i ? { ...d, type: e.target.value } : d))
                      )
                    }
                    className="mt-1 rounded border px-1 py-0.5 text-xs dark:bg-slate-800"
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.label}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeRetainedDoc(i)}
                  className="text-red-500 hover:text-red-700 font-bold px-2"
                  title="Remove Document"
                >
                  ✕
                </button>
              </div>
            ))}
            {newDocs.map((doc, i) => (
              <div key={`new-${i}`} className="flex items-center justify-between rounded border border-green-200 bg-green-50 p-2 text-sm dark:border-green-800 dark:bg-green-900/20">
                <div className="flex flex-col">
                  <span className="font-medium truncate max-w-[200px] text-xs">{doc.name} (New)</span>
                  <select
                    value={doc.type}
                    onChange={(e) =>
                      setNewDocs((prev) =>
                        prev.map((d, idx) => (idx === i ? { ...d, type: e.target.value } : d))
                      )
                    }
                    className="mt-1 rounded border border-green-300 px-1 py-0.5 text-xs dark:bg-slate-800"
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.label}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeNewDoc(i)}
                  className="text-red-500 hover:text-red-700 font-bold px-2"
                  title="Remove Document"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <label
            htmlFor="edit-docs"
            className="flex min-h-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[#1B4332]/50 bg-green-50 text-sm dark:bg-green-900/10"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
          >
            Drag & drop new files here or click to browse<br/>
            (Max 5 files, up to 5MB each)
          </label>
          <input id="edit-docs" type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files || [])} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border px-4 py-2 text-sm"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-[#1B4332] px-4 py-2 text-sm text-white disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Dialog>
  );
};

export default EditLandModal;
