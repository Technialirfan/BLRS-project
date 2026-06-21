import { useMemo, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import Footer from "../components/layout/Footer";
import PublicNavbar from "../components/layout/PublicNavbar";
import { publicAPI } from "../services/api";

const Counter = ({ value, label }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800"
  >
    <p className="text-2xl font-bold text-[#1B4332] dark:text-[#D4AF37]">{value}</p>
    <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p>
  </motion.div>
);

const Landing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalLands: 0, totalRegistered: 0, totalDistricts: 0 });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    publicAPI.getStats().then(res => {
      if (res && res.ok && res.data.success) {
        setStats({
          totalLands: res.data.data.totalLands || 0,
          totalRegistered: res.data.data.totalRegistered || 0,
          totalDistricts: res.data.data.totalDistricts || 0
        });
      }
    }).catch(() => {});
  }, []);
  const steps = useMemo(
    () => [
      t("landing.step1Title"),
      t("landing.step2Title"),
      t("landing.step3Title"),
      t("landing.step4Title"),
    ],
    [t]
  );

  return (
    <div className="min-h-screen">
      <PublicNavbar />

      <section className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] px-4 py-16 text-white dark:from-[#0D2B1F] dark:to-[#1B4332]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-5">
          <div className="md:col-span-3">
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs ring-1 ring-white/30">
              🔗 Powered by Blockchain Technology
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight">
              Secure Land Records.
              <br />
              <span className="text-[#D4AF37]">Protected by Blockchain.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-white/80">{t("landing.description")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/search"
                className="inline-flex items-center rounded-lg bg-[#D4AF37] px-5 py-3 font-semibold text-[#1B4332] hover:bg-[#F0D060]"
              >
                {t("landing.checkStatus")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center rounded-lg border border-white px-5 py-3 font-semibold text-white hover:bg-white/10"
              >
                {t("landing.officerLogin")}
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-1">
                <Check className="h-4 w-4 text-[#D4AF37]" /> Immutable
              </span>
              <span className="inline-flex items-center gap-1">
                <Check className="h-4 w-4 text-[#D4AF37]" /> 35 Districts
              </span>
              <span className="inline-flex items-center gap-1">
                <Check className="h-4 w-4 text-[#D4AF37]" /> Blockchain Verified
              </span>
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="space-y-4">
              {["Land", "Verified", "Immutable"].map((block, i) => (
                <motion.div
                  key={block}
                  className="blockchain-glow rounded-xl border border-white/30 bg-white/10 p-4 text-center font-semibold"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.2 }}
                >
                  {block}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 md:grid-cols-3">
        <Counter value={stats.totalLands} label={t("landing.totalLands")} />
        <Counter value={stats.totalDistricts} label={t("landing.districts")} />
        <Counter value={stats.totalRegistered} label="Registered Lands" />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-center text-2xl font-bold">{t("landing.howItWorks")}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {steps.map((step, i) => (
            <div
              key={step}
              className="rounded-xl border border-slate-200 bg-white p-5 text-center dark:border-slate-700 dark:bg-slate-800"
            >
              <p className="text-sm font-semibold text-[#1B4332] dark:text-[#D4AF37]">{i + 1}</p>
              <p className="mt-2 text-sm font-medium">{step}</p>
              {i < 3 ? <p className="mt-3 text-slate-400">→</p> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-center text-2xl font-bold">{t("landing.whyBlockchain")}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: "🔒",
              title: "Tamper-Proof",
              body: "Records cannot be altered after approval.",
            },
            {
              icon: "📋",
              title: "Complete History",
              body: "Every ownership action remains traceable.",
            },
            {
              icon: "⚡",
              title: "Instant Verification",
              body: "Search by parcel ID or CNIC in seconds.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
            >
              <p className="text-2xl">{f.icon}</p>
              <p className="mt-2 font-semibold">{f.title}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#1B4332] px-4 py-12 text-white dark:bg-[#0D2B1F]">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-bold">Check Your Land Status Instantly</h2>
          <form 
            className="flex w-full items-center gap-2 rounded-xl bg-white p-2 shadow-sm transition-all focus-within:ring-2 focus-within:ring-[#D4AF37] dark:bg-slate-800 dark:shadow-none"
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery) navigate("/search", { state: { query: searchQuery } });
            }}
          >
            <Search className="ml-2 h-5 w-5 text-slate-500 dark:text-slate-400" />
            <input
              className="h-10 flex-1 border-0 bg-transparent text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-white dark:placeholder:text-slate-500"
              placeholder="Enter CNIC or Parcel ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-white"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
