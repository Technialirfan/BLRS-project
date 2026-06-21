import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  BadgeCheck,
  Blocks,
  CheckCircle2,
  CheckSquare,
  Eye,
  FileWarning,
  Globe,
  Network,
  SearchCheck,
  ShieldCheck,
  Target,
  Timer,
  Trophy,
  UserCog,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Footer from "../components/layout/Footer";
import PublicNavbar from "../components/layout/PublicNavbar";
import { publicAPI } from "../services/api";

const sectionMotion = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
  viewport: { once: true, amount: 0.2 },
};

const AnimatedStat = ({ value, label, icon: Icon }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 900;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-[#1B4332] dark:bg-green-900/30 dark:text-green-300">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-3xl font-bold text-[#1B4332] dark:text-[#D4AF37]">{count}</p>
      <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
    </div>
  );
};

const About = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalLands: 0,
    totalDistricts: 0,
    activeOfficers: 0,
    disputesResolved: 0
  });

  useEffect(() => {
    publicAPI.getStats()
      .then((res) => {
        if (res.ok && res.data?.success) {
          setStats(res.data.data);
        }
      })
      .catch((err) => console.error("Failed to fetch public stats", err));
  }, []);

  const problemCards = [
    {
      title: t("about.problem1Title"),
      description: t("about.problem1Desc"),
      icon: FileWarning,
    },
    {
      title: t("about.problem2Title"),
      description: t("about.problem2Desc"),
      icon: ShieldCheck,
    },
    {
      title: t("about.problem3Title"),
      description: t("about.problem3Desc"),
      icon: Timer,
    },
    {
      title: t("about.problem4Title"),
      description: t("about.problem4Desc"),
      icon: SearchCheck,
    },
  ];

  const solutionCards = [
    {
      title: "Blockchain Immutable Records",
      desc: "Every approved update is permanently recorded on-chain with auditability.",
      icon: Blocks,
    },
    {
      title: "IPFS Document Preservation",
      desc: "Land documents are distributed and tamper-resistant with decentralized storage.",
      icon: Network,
    },
    {
      title: "NFT Ownership Certificates",
      desc: "Approved parcels can issue unique ownership NFTs as verifiable digital proof.",
      icon: Trophy,
    },
    {
      title: "Public Verification Anytime",
      desc: "Citizens can verify status instantly using CNIC or parcel ID without login.",
      icon: Globe,
    },
  ];

  const technologyCards = [
    {
      title: t("about.blockchainTitle"),
      description: t("about.blockchainDesc"),
      icon: Blocks,
      badges: ["Solidity ^0.8.20", "OpenZeppelin v5", "Hardhat"],
      accent: "border-[#1B4332]",
      iconClass: "text-[#1B4332]",
    },
    {
      title: t("about.ipfsTitle"),
      description: t("about.ipfsDesc"),
      icon: Network,
      badges: ["Pinata SDK", "IPFS v0.17"],
      accent: "border-blue-500",
      iconClass: "text-blue-600",
    },
    {
      title: t("about.nftTitle"),
      description: t("about.nftDesc"),
      icon: BadgeCheck,
      badges: ["ERC-721", "Ethers.js v6"],
      accent: "border-[#D4AF37]",
      iconClass: "text-[#D4AF37]",
    },
  ];

  const roleCards = [
    {
      role: "Admin",
      title: "System Administrator",
      color: "border-t-purple-500",
      icon: UserCog,
      points: [
        "Manages officers",
        "Views all records",
        "Audit logs access",
        "System statistics",
      ],
    },
    {
      role: "Patwari",
      title: "Field Officer",
      color: "border-t-blue-500",
      icon: FileWarning,
      points: [
        "Registers land",
        "Uploads documents",
        "Initiates transfer",
        "Files disputes",
      ],
    },
    {
      role: "Tehsildar",
      title: "Verification Officer",
      color: "border-t-amber-500",
      icon: CheckCircle2,
      points: ["Verifies records", "Reviews disputes", "District-locked", "Queue management"],
    },
    {
      role: "DC",
      title: "Deputy Commissioner",
      color: "border-t-green-500",
      icon: Users,
      points: [
        "Final approval",
        "Approves transfer",
        "Resolves disputes",
        "Mints NFT cert",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <PublicNavbar />

      <section className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] px-4 py-14 text-white dark:from-[#0D2B1F] dark:to-[#1B4332]">
        <div className="mx-auto grid max-w-7xl items-center gap-8 md:grid-cols-5">
          <div className="md:col-span-3">
            <p className="text-xs text-white/75">Home / About</p>
            <h1 className="mt-2 text-4xl font-bold">{t("about.heroTitle")}</h1>
            <h2 className="mt-1 text-xl font-semibold text-[#D4AF37]">{t("about.heroSubtitle")}</h2>
            <p className="mt-3 line-clamp-2 max-w-3xl text-white/80">{t("about.missionText")}</p>
          </div>
          <div className="md:col-span-2">
            <div className="mx-auto w-full max-w-xs rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#D4AF37] bg-white/10 text-3xl">
                ★
              </div>
              <p className="mt-3 text-sm font-semibold">Est. 2024</p>
              <p className="text-sm text-white/80">Revenue & Estate Department</p>
            </div>
          </div>
        </div>
      </section>

      <motion.section {...sectionMotion} className="mx-auto grid max-w-7xl gap-4 px-4 py-8 md:grid-cols-4">
        <AnimatedStat value={stats.totalLands} label={t("about.stat1Label", "Land Records")} icon={Blocks} />
        <AnimatedStat value={stats.totalDistricts} label={t("about.stat2Label", "Districts Covered")} icon={Globe} />
        <AnimatedStat value={stats.activeOfficers} label={t("about.stat3Label", "Active Officers")} icon={Users} />
        <AnimatedStat value={stats.disputesResolved} label={t("about.stat4Label", "Disputes Resolved")} icon={CheckCircle2} />
      </motion.section>

      <motion.section {...sectionMotion} className="mx-auto grid max-w-7xl gap-4 px-4 py-4 md:grid-cols-2">
        <div className="rounded-2xl border-t-4 border-[#1B4332] bg-white p-6 shadow-sm dark:bg-slate-800">
          <Target className="h-7 w-7 text-[#1B4332] dark:text-green-300" />
          <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{t("about.missionTitle")}</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t("about.missionText")}</p>
        </div>
        <div className="rounded-2xl border-t-4 border-[#D4AF37] bg-white p-6 shadow-sm dark:bg-slate-800">
          <Eye className="h-7 w-7 text-[#D4AF37]" />
          <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{t("about.visionTitle")}</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t("about.visionText")}</p>
        </div>
      </motion.section>

      <section className="mt-6 bg-[#F0F4F8] px-4 py-12 dark:bg-slate-900">
        <motion.div {...sectionMotion} className="mx-auto max-w-7xl">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("about.problemTitle")}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Traditional land management in Balochistan faces 4 critical issues
          </p>
          <motion.div
            className="mt-5 grid gap-4 md:grid-cols-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            {problemCards.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                  className="rounded-xl border-l-4 border-[#DC2626] bg-white p-5 transition hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/20"
                >
                  <Icon className="h-6 w-6 text-[#DC2626]" />
                  <h4 className="mt-2 font-semibold text-slate-900 dark:text-slate-100">{item.title}</h4>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      <section className="bg-[#1B4332] px-4 py-12 text-white dark:bg-slate-800">
        <motion.div {...sectionMotion} className="mx-auto max-w-7xl">
          <h3 className="text-2xl font-bold">{t("about.solutionTitle")}</h3>
          <motion.div
            className="mt-5 grid gap-4 md:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            {solutionCards.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                  className="relative rounded-xl bg-white p-4 text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                >
                  <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-600" />
                  <Icon className="h-8 w-8 text-[#1B4332] dark:text-green-300" />
                  <h4 className="mt-2 font-semibold">{item.title}</h4>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      <motion.section {...sectionMotion} className="mx-auto grid max-w-7xl gap-6 px-4 py-12 md:grid-cols-5">
        <div className="md:col-span-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("about.aboutDeptTitle")}</h3>
          <p className="mt-1 text-sm font-medium text-[#1B4332] dark:text-green-300">{t("about.deptFullName")}</p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{t("about.deptDescription")}</p>
          <h4 className="mt-5 text-lg font-semibold text-slate-900 dark:text-slate-100">{t("about.deptResponsibilities")}</h4>
          <div className="mt-2 space-y-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <p key={n} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                <span>{t(`about.resp${n}`)}</span>
              </p>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="rounded-2xl bg-[#1B4332] p-6 text-white shadow-md dark:bg-[#0D2B1F]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#D4AF37] text-2xl">
              ★
            </div>
            <p className="mt-3 text-center font-semibold">Revenue & Estate Department</p>
            <div className="my-3 h-px bg-white/20" />
            <div className="space-y-2 text-sm text-white/85">
              <p>📍 Civil Secretariat, Zarghoon Road, Quetta, Balochistan 87300</p>
              <p>📞 +92-81-9201234</p>
              <p>✉️ info@blrs.gov.pk</p>
              <p>🌐 revenue.balochistan.gov.pk</p>
              <p>🕐 Mon–Sat, 9:00 AM – 5:00 PM</p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section {...sectionMotion} className="mx-auto max-w-7xl px-4 py-8">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("about.technologyTitle")}</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {technologyCards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`rounded-2xl border-t-4 ${item.accent} bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:bg-slate-800`}
              >
                <Icon className={`h-8 w-8 ${item.iconClass}`} />
                <h4 className="mt-2 font-semibold text-slate-900 dark:text-slate-100">{item.title}</h4>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      <section className="bg-slate-100 px-4 py-10 dark:bg-slate-800">
        <motion.div {...sectionMotion} className="mx-auto max-w-7xl">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("about.rolesTitle")}</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {roleCards.map((role) => {
              const Icon = role.icon;
              return (
                <motion.div
                  key={role.role}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  viewport={{ once: true }}
                  className={`rounded-2xl border-t-4 ${role.color} bg-white p-5 shadow-sm dark:bg-slate-900`}
                >
                  <Icon className="h-7 w-7 text-[#1B4332] dark:text-green-300" />
                  <h4 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{role.role}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{role.title}</p>
                  <div className="my-3 h-px bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-2">
                    {role.points.map((point) => (
                      <p key={point} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <CheckSquare className="mt-0.5 h-4 w-4 text-green-600" />
                        <span>{point}</span>
                      </p>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] px-4 py-12 text-white dark:from-[#0D2B1F] dark:to-[#1B4332]">
        <div className="mx-auto max-w-5xl text-center">
          <h3 className="text-3xl font-bold">Ready to Check Your Land Status?</h3>
          <p className="mt-2 text-white/80">Use our public search — no account needed</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              to="/search"
              className="rounded-lg bg-[#D4AF37] px-5 py-3 font-semibold text-[#1B4332] hover:bg-[#F0D060]"
            >
              🔍 Search My Land
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-white px-5 py-3 font-semibold text-white hover:bg-white/10"
            >
              👮 Officer Login
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
