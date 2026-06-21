import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Copy, Plus } from "lucide-react";
import { useStore } from "../../store/useStore";
import { adminAPI } from "../../services/api";
import { DISTRICTS } from "../../utils/constants";
import { formatCNIC, formatDateShort } from "../../utils/helpers";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../components/ui/sheet";

export default function AdminUsers() {
  const { officer } = useStore();
  const [panelOpen, setPanelOpen] = useState(false);
  const [filters, setFilters] = useState({ role: "", district: "", status: "", search: "" });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, patwari: 0, tehsildar: 0, dc: 0 });

  const [form, setForm] = useState({
    fullName: "",
    cnic: "",
    email: "",
    phone: "",
    role: "patwari",
    assignedDistrict: "Quetta",
    password: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = { ...filters, limit: 50, page };
      if (queryParams.status === 'active') queryParams.isActive = true;
      if (queryParams.status === 'inactive') queryParams.isActive = false;
      delete queryParams.status;

      Object.keys(queryParams).forEach(key => !queryParams[key] && delete queryParams[key]);

      const [officersRes, statsRes] = await Promise.all([
        adminAPI.getOfficers(queryParams),
        adminAPI.getStats()
      ]);

      if (officersRes.ok) {
        setUsers(officersRes.data.data.officers);
      }
      if (statsRes.ok) {
        const roles = statsRes.data.data.officersByRole || [];
        const roleStats = { total: statsRes.data.data.totals.officers || 0, patwari: 0, tehsildar: 0, dc: 0 };
        roles.forEach(r => {
          if (roleStats[r._id] !== undefined) roleStats[r._id] = r.count;
        });
        setStats(roleStats);
      }
    } catch (err) {
      toast.error('Failed to load officers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(loadData, 300);
    return () => clearTimeout(timeoutId);
  }, [filters, page]);

  const createOfficer = async () => {
    if (!form.fullName || !form.email || !form.phone || form.cnic.length !== 13) return toast.error("Complete required fields");
    
    try {
      const response = await adminAPI.createOfficer({
        fullName: form.fullName,
        cnic: form.cnic,
        email: form.email,
        phone: form.phone,
        role: form.role,
        assignedDistrict: form.assignedDistrict,
        password: form.password
      });

      if (response.ok) {
        toast.success("Officer created successfully");
        setPanelOpen(false);
        setForm({
          fullName: "",
          cnic: "",
          email: "",
          phone: "",
          role: "patwari",
          assignedDistrict: "Quetta",
          password: "",
        });
        loadData();
      } else {
        throw new Error(response.data?.message || "Failed to create officer");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleOfficer = async (id, currentStatus) => {
    try {
      const response = await adminAPI.toggleOfficer(id);
      if (response.ok) {
        toast.success(`Officer ${currentStatus ? "deactivated" : "activated"}`);
        loadData();
      } else {
        throw new Error(response.data?.message || "Failed to update officer status");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const updateDistrict = async (id, district) => {
    try {
      const response = await adminAPI.updateDistrict(id, district);
      if (response.ok) {
        toast.success("District updated successfully");
        loadData();
      } else {
        throw new Error(response.data?.message || "Failed to update district");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const updateEmploymentStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to change this officer's status to ${status}?`)) return;
    try {
      const response = await adminAPI.updateEmploymentStatus(id, status);
      if (response.ok) {
        toast.success(`Officer marked as ${status}`);
        loadData();
      } else {
        throw new Error(response.data?.message || "Failed to update employment status");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const resetPassword = async (id) => {
    if (!window.confirm("Reset this officer's password to 'Officer@2024'?")) return;
    try {
      const response = await adminAPI.resetOfficerPassword(id);
      if (response.ok) {
        toast.success("Password reset to: Officer@2024", { duration: 5000 });
      } else {
        throw new Error(response.data?.message || "Failed to reset password");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500">Patwari</p>
          <p className="text-2xl font-bold">{stats.patwari}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500">Tehsildar</p>
          <p className="text-2xl font-bold">{stats.tehsildar}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500">DC</p>
          <p className="text-2xl font-bold">{stats.dc}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Officer Management</h1>
        <button type="button" onClick={() => setPanelOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#1B4332] px-4 py-2 text-sm text-white">
          <Plus className="h-4 w-4" /> Create New Officer
        </button>
      </div>

      <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 md:grid-cols-4">
        <select className="h-10 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600 dark:bg-slate-700" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
          <option value="">All Roles</option>
          <option value="patwari">Patwari</option>
          <option value="tehsildar">Tehsildar</option>
          <option value="dc">DC</option>
        </select>
        <select className="h-10 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600 dark:bg-slate-700" value={filters.district} onChange={(e) => setFilters({ ...filters, district: e.target.value })}>
          <option value="">All Districts</option>
          {DISTRICTS.map((d) => (
            <option key={d.name} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
        <select className="h-10 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600 dark:bg-slate-700" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <input className="h-10 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600 dark:bg-slate-700" placeholder="Search name/email/cnic" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
        {loading ? (
          <div className="py-8 text-center text-slate-500">Loading officers...</div>
        ) : (
          <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="px-3 py-2 text-left">Avatar + Name</th>
              <th className="px-3 py-2 text-left">CNIC</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-left">District</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Last Login</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-slate-100 dark:border-slate-700/60">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-semibold text-white">
                      {u.fullName
                        .split(" ")
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="font-medium">{u.fullName}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2">{formatCNIC(u.cnic)}</td>
                <td className="px-3 py-2">{u.role}</td>
                <td className="px-3 py-2">{u.assignedDistrict || "—"}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${u.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/40" : "bg-slate-100 text-slate-700 dark:bg-slate-900/40"}`}>
                    <span className={`h-2 w-2 rounded-full ${u.isActive ? "bg-green-500" : "bg-slate-500"}`} />
                    {u.employmentStatus || (u.isActive ? "Active" : "Inactive")}
                  </span>
                </td>
                <td className="px-3 py-2">{formatDateShort(u.lastLogin)}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <select
                      className="h-8 rounded border border-slate-300 px-2 text-xs dark:border-slate-600 dark:bg-slate-700"
                      value={u.assignedDistrict || ""}
                      onChange={(e) => updateDistrict(u._id, e.target.value)}
                    >
                      <option value="">No district</option>
                      {DISTRICTS.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600"
                      onClick={() => toggleOfficer(u._id, u.isActive)}
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 dark:border-amber-700 dark:text-amber-500"
                      onClick={() => resetPassword(u._id)}
                    >
                      Reset Pass
                    </button>
                    <select
                      className="h-8 rounded border border-red-300 px-2 text-xs text-red-600 dark:border-red-800 dark:text-red-400 dark:bg-slate-700"
                      value={u.employmentStatus || "Active"}
                      onChange={(e) => {
                        if (e.target.value !== (u.employmentStatus || "Active")) {
                          updateEmploymentStatus(u._id, e.target.value);
                        }
                      }}
                    >
                      <option value="Active">Active</option>
                      <option value="Retired">Retired</option>
                      <option value="Promoted">Promoted</option>
                      <option value="Transferred">Transferred</option>
                      <option value="Deceased">Deceased</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="7" className="py-4 text-center text-slate-500">No officers found matching filters.</td>
              </tr>
            )}
          </tbody>
        </table>
        )}
      </div>

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent side="right" onClose={() => setPanelOpen(false)}>
          <SheetHeader>
            <SheetTitle>Create New Officer</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 text-sm">
            <input className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700" placeholder="Full Name EN" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <input className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700" placeholder="CNIC (13 digits)" value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value.replace(/\D/g, "").slice(0, 13) })} />
            <input className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div>
              <p className="mb-1">Role</p>
              <div className="grid grid-cols-3 gap-2">
                {["patwari", "tehsildar", "dc"].map((role) => (
                  <button key={role} type="button" onClick={() => setForm({ ...form, role })} className={`rounded border px-2 py-2 text-xs ${form.role === role ? "border-[#1B4332] bg-green-50 dark:bg-green-900/20" : "border-slate-300 dark:border-slate-600"}`}>
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <select className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700" value={form.assignedDistrict} onChange={(e) => setForm({ ...form, assignedDistrict: e.target.value })}>
              {DISTRICTS.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
            <input 
              className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700" 
              placeholder="Initial Password" 
              value={form.password} 
              onChange={(e) => setForm({ ...form, password: e.target.value })} 
            />
            <button type="button" onClick={createOfficer} className="w-full rounded-lg bg-[#1B4332] py-2 font-medium text-white">
              Create Officer
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
