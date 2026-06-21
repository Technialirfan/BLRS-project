import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Copy } from "lucide-react";
import { useStore } from "../../store/useStore";
import { authAPI } from "../../services/api";
import { formatCNIC, formatDateShort, truncateHash } from "../../utils/helpers";

const strengthOf = (password) => {
  if (password.length < 8) return "Weak";
  const score =
    Number(/[A-Z]/.test(password)) +
    Number(/[a-z]/.test(password)) +
    Number(/[0-9]/.test(password)) +
    Number(/[^A-Za-z0-9]/.test(password));
  if (score >= 4) return "Strong";
  if (score >= 3) return "Fair";
  return "Weak";
};

const OfficerProfile = () => {
  const user = useStore((s) => s.officer);
  const updateProfile = useStore((s) => s.updateProfile);
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    walletAddress: user?.walletAddress || "",
  });
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  const initials = useMemo(
    () =>
      (user?.fullName || "")
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join(""),
    [user]
  );

  if (!user) return null;

  const saveProfile = async () => {
    if (!/^03\d{9}$/.test(form.phone)) return toast.error("Phone must start with 03 and be 11 digits");
    try {
      const response = await authAPI.updateProfile({
        fullName: form.fullName,
        phone: form.phone,
        walletAddress: form.walletAddress,
      });
      if (response.ok) {
        updateProfile(response.data.data.officer);
        toast.success("Profile updated successfully");
      } else {
        throw new Error(response.data?.message || "Failed to update profile");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const changePassword = async () => {
    if (!pw.current) return toast.error("Current password is required");
    if (pw.next === pw.current) return toast.error("New password must be different");
    if (pw.next !== pw.confirm) return toast.error("Confirm password mismatch");
    if (strengthOf(pw.next) === "Weak") return toast.error("Password is too weak");
    try {
      const response = await authAPI.changePassword(pw.current, pw.next, pw.confirm);
      if (response.ok) {
        toast.success("Password changed successfully");
        setPw({ current: "", next: "", confirm: "" });
      } else {
        throw new Error(response.data?.message || "Failed to change password");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#D4AF37] text-2xl font-bold text-white">
          {user.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" /> : initials}
        </div>
        <div className="mx-auto mt-2 text-center">
          <label className="cursor-pointer rounded border border-slate-300 px-3 py-1 text-xs dark:border-slate-600">
            Upload Photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => toast.info("Avatar upload functionality to be connected to IPFS or server storage.")} />
          </label>
        </div>
        <h1 className="mt-3 text-center text-xl font-bold">{user.fullName}</h1>
        <div className="mt-3 flex justify-center gap-2">
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">{user.role}</span>
          {user.assignedDistrict ? <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900/40 dark:text-green-200">{user.assignedDistrict}</span> : null}
        </div>
        <div className="mt-4 space-y-1 text-sm">
          <p>
            <span className="font-medium">CNIC:</span> {formatCNIC(user.cnic)}
          </p>
          <p>
            <span className="font-medium">Email:</span> {user.email}
          </p>
          <p>
            <span className="font-medium">Member Since:</span> {formatDateShort(user.createdAt)}
          </p>
          <p>
            <span className="font-medium">Last Login:</span> {formatDateShort(user.lastLogin)}
          </p>
          <div className="mt-2 rounded-lg border border-slate-200 p-2 dark:border-slate-700">
            <p className="text-xs text-slate-500">Wallet</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="tx-hash text-xs">{user.walletAddress ? truncateHash(user.walletAddress, 6) : "Not connected"}</p>
              {user.walletAddress ? (
                <button
                  type="button"
                  className="rounded border border-slate-300 p-1 dark:border-slate-600"
                  onClick={() => {
                    navigator.clipboard.writeText(user.walletAddress);
                    toast.success("Copied");
                  }}
                >
                  <Copy className="h-3 w-3" />
                </button>
              ) : null}
            </div>
            {!user.walletAddress ? (
              <button
                type="button"
                className="mt-2 w-full rounded bg-[#1B4332] py-2 text-xs text-white"
                onClick={() => updateProfile({ walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" })}
              >
                Connect MetaMask
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold">Edit Profile</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Full Name</label>
            <input className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm">Phone Number</label>
          <input className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <button type="button" onClick={saveProfile} className="rounded-lg bg-[#1B4332] px-4 py-2 text-white">
          Save Changes
        </button>

        <div className="rounded-lg border border-slate-200 dark:border-slate-700">
          <button type="button" className="flex w-full items-center justify-between px-4 py-3 text-left" onClick={() => setPasswordOpen((v) => !v)}>
            <span className="font-medium">Change Password</span>
            <span>{passwordOpen ? "−" : "+"}</span>
          </button>
          {passwordOpen ? (
            <div className="space-y-3 border-t border-slate-200 p-4 dark:border-slate-700">
              <input type="password" placeholder="Current Password" className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
              <input type="password" placeholder="New Password" className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
              <p className="text-xs">Strength: {strengthOf(pw.next)}</p>
              <input type="password" placeholder="Confirm New Password" className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
              <button type="button" onClick={changePassword} className="rounded-lg bg-[#1B4332] px-4 py-2 text-white">
                Change Password
              </button>
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <h3 className="mb-2 font-medium">Wallet</h3>
          <p className="tx-hash text-xs">{user.walletAddress || "Not connected"}</p>
          <input
            className="mt-2 h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700"
            placeholder="Update Wallet Address"
            value={form.walletAddress}
            onChange={(e) => setForm({ ...form, walletAddress: e.target.value })}
          />
          <button
            type="button"
            className="mt-2 rounded-lg bg-[#1B4332] px-4 py-2 text-sm text-white"
            onClick={() => {
              updateProfile({ walletAddress: form.walletAddress });
              toast.success("Wallet updated");
            }}
          >
            Save Wallet
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfficerProfile;
