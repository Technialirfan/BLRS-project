import { useState } from "react";
import { Eye, EyeOff, AlertTriangle, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useStore } from "../store/useStore";

import { authAPI } from "../services/api";

const roleRoute = {
  admin: "/dashboard/admin",
  patwari: "/dashboard/patwari",
  tehsildar: "/dashboard/tehsildar",
  dc: "/dashboard/dc",
};

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await authAPI.login(email.trim(), password.trim());

      if (result.ok && result.data.success) {
        login(result.data.data.officer, result.data.data.token);
        toast.success(`Welcome, ${result.data.data.officer.fullName}!`);
        navigate(roleRoute[result.data.data.officer.role] || "/dashboard");
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 400);
        toast.error(result.data.message || t("auth.wrongCredentials"));
      }
    } catch (err) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      toast.error('Cannot connect to server. Make sure backend is running.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0D2B1F] to-[#2D6A4F] p-4">
      <motion.div
        animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : {}}
        className="w-full max-w-md rounded-2xl border border-white/20 bg-white/95 p-6 shadow-2xl dark:bg-slate-900/95"
      >
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1B4332] text-[#D4AF37]">★</div>
          <h1 className="mt-3 text-xl font-bold">BLRS Officer Portal</h1>
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4" /> ⚠️ Authorized Government Officers Only
          </div>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("auth.email")} / سرکاری ای میل
            </label>
            <input
              className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-800"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("auth.password")} / پاس ورڈ
            </label>
            <div className="relative">
              <input
                className="h-10 w-full rounded-lg border border-slate-300 px-3 pr-10 dark:border-slate-600 dark:bg-slate-800"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-2 top-2 rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => setShowPw((v) => !v)}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#1B4332] font-semibold text-white hover:bg-[#0D2B1F]">
            {t("auth.login")}
          </button>
        </form>


        <Link to="/" className="mt-4 block text-center text-sm text-[#1B4332] hover:underline dark:text-[#D4AF37]">
          ← Back to Home
        </Link>
      </motion.div>
    </div>
  );
};

export default Login;
