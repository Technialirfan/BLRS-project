import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Dialog, DialogHeader, DialogTitle } from "../ui/dialog";
import { landAPI } from "../../services/api";

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
    }
  }, [land, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Basic area conversions based on sqft
      const areaSqFt = Number(formData.areaSqFt);
      const data = {
        ...formData,
        areaSqFt,
        areaMarla: Number((areaSqFt / 225).toFixed(2)),
        areaKanal: Number((areaSqFt / 4500).toFixed(2)),
        areaAcre: Number((areaSqFt / 36000).toFixed(2)),
      };
      await landAPI.update(land.parcelId, data);
      toast.success("Land updated successfully");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update land");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogHeader>
        <DialogTitle>Edit Land Record ({land?.parcelId})</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
            className="rounded bg-[#1B4332] px-4 py-2 text-sm text-white"
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
