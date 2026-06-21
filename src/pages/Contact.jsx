import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  ExternalLink,
  Landmark,
  Mail,
  Phone,
  Search,
  Send,
} from "lucide-react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import Footer from "../components/layout/Footer";
import PublicNavbar from "../components/layout/PublicNavbar";
import { DISTRICTS } from "../utils/constants";

const DISTRICT_OFFICES = [
  { id: 1, district: "Quetta", address: "Revenue Commissioner Office, Zarghoon Road, Quetta", phone: "+92-81-9201001", email: "quetta.revenue@blrs.gov.pk", hours: "Mon–Sat, 9:00 AM – 5:00 PM", dc: "Sardar Ahmed Raisani", lat: 30.1798, lng: 67.0089, isHeadquarters: true },
  { id: 2, district: "Gwadar", address: "Tehsil Office Complex, Marine Drive, Gwadar", phone: "+92-86-4510034", email: "gwadar.revenue@blrs.gov.pk", hours: "Mon–Sat, 9:00 AM – 5:00 PM", dc: "Mir Hamid Buledi", lat: 25.1264, lng: 62.3225, isHeadquarters: false },
  { id: 3, district: "Khuzdar", address: "DC Office, Main Bazaar Road, Khuzdar", phone: "+92-84-5210045", email: "khuzdar.revenue@blrs.gov.pk", hours: "Mon–Sat, 9:00 AM – 5:00 PM", dc: "Agha Zubair Mengal", lat: 27.812, lng: 66.611, isHeadquarters: false },
  { id: 4, district: "Turbat", address: "Revenue Office, Kech Road, Turbat", phone: "+92-85-2410056", email: "turbat.revenue@blrs.gov.pk", hours: "Mon–Sat, 9:00 AM – 5:00 PM", dc: "Mir Aslam Rind", lat: 26.0031, lng: 63.044, isHeadquarters: false },
  { id: 5, district: "Zhob", address: "District Collectorate, Fort Sandeman Road, Zhob", phone: "+92-82-4110067", email: "zhob.revenue@blrs.gov.pk", hours: "Mon–Sat, 9:00 AM – 5:00 PM", dc: "Haji Naseer Kakar", lat: 31.342, lng: 69.448, isHeadquarters: false },
  { id: 6, district: "Loralai", address: "Revenue Department Office, Loralai Bazaar", phone: "+92-82-3610078", email: "loralai.revenue@blrs.gov.pk", hours: "Mon–Sat, 9:00 AM – 5:00 PM", dc: "Abdul Nasir Tareen", lat: 30.372, lng: 68.592, isHeadquarters: false },
  { id: 7, district: "Sibi", address: "DC Office, Railway Road, Sibi", phone: "+92-83-4610089", email: "sibi.revenue@blrs.gov.pk", hours: "Mon–Sat, 9:00 AM – 5:00 PM", dc: "Sardar Iqbal Bugti", lat: 29.543, lng: 67.877, isHeadquarters: false },
  { id: 8, district: "Lasbela", address: "Collectorate Building, Uthal", phone: "+92-83-2110090", email: "lasbela.revenue@blrs.gov.pk", hours: "Mon–Sat, 9:00 AM – 5:00 PM", dc: "Mir Ghazanfar Jamali", lat: 25.814, lng: 66.556, isHeadquarters: false },
];

const QUERY_TYPES = [
  { value: "land_registration", label: "Land Registration Issue" },
  { value: "ownership_dispute", label: "Ownership Dispute" },
  { value: "document_correction", label: "Document Correction Request" },
  { value: "transfer_issue", label: "Transfer Related Issue" },
  { value: "patwari_complaint", label: "Complaint Against Patwari" },
  { value: "general_inquiry", label: "General Inquiry" },
  { value: "other", label: "Other" },
];

const FAQ_DATA = [
  { id: 1, question: "How do I check if my land is registered?", answer: "You can check your land status for free using our Public Search feature. Go to the Home page and click 'Check Your Land Status', then enter your 13-digit CNIC number or your Parcel ID. No account or login is required.", category: "search" },
  { id: 2, question: "How long does land registration take?", answer: "The complete registration process involves 3 steps: Patwari registers (Day 1), Tehsildar verifies (2–3 days), and DC gives final approval (1–2 days). In total, registration typically completes within 5–7 working days after submitting all required documents.", category: "registration" },
  { id: 3, question: "What documents are required for land registration?", answer: "Required documents typically include: (1) Fard Malkiat (ownership record), (2) Sale Deed (Bai Nama) or inheritance certificate, (3) CNIC of the owner, (4) Survey Map or Tatimma, and (5) any court orders if applicable. The Patwari officer will guide you on specific requirements for your land type.", category: "documents" },
  { id: 4, question: "What is a blockchain TX hash and why does it matter?", answer: "A Transaction Hash (TX Hash) is a unique identifier generated when your land record is written to the blockchain. It proves that your record exists on the blockchain and has not been altered. You can use this hash to independently verify your land record at any time — it is permanent proof of registration.", category: "blockchain" },
  { id: 5, question: "How do I file a land dispute?", answer: "Land disputes must be filed through a Revenue Department officer (Patwari). Visit your nearest Patwari office and provide your claim details along with supporting evidence (court orders, inheritance certificates, survey maps). The Patwari will file the dispute in the system on your behalf. You can also use this Contact form to report an issue.", category: "disputes" },
  { id: 6, question: "Is my personal data safe in this system?", answer: "Yes. The public search only shows limited information (name, district, area, status). Sensitive data like CNIC, wallet addresses, and officer details are never shown to the public. All system access is logged and audited. The blockchain ensures no one can secretly modify your records.", category: "security" },
  { id: 7, question: "What is an NFT land certificate?", answer: "When the DC (Deputy Commissioner) gives final approval to a land registration, the system automatically mints an ERC-721 NFT (Non-Fungible Token) on the blockchain. This NFT is a digital certificate of ownership that is unique, non-copyable, and permanently stored on the blockchain. It moves automatically when ownership is transferred.", category: "blockchain" },
  { id: 8, question: "Can I register land online myself?", answer: "No. This system is used internally by authorized Revenue Department officers. To register your land, you must visit your local Patwari office and the officer will enter the details into the system on your behalf. Citizens can only use the public search feature without any account.", category: "registration" },
];

const toDigits = (v) => v.replace(/\D/g, "");
const formatCNICInput = (v) => {
  const d = toDigits(v).slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
};
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const hqIcon = L.divIcon({
  className: "",
  html: '<div style="width:28px;height:28px;border-radius:999px;background:#D4AF37;color:#1B4332;display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid #fff;">?</div>',
  iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14],
});

const Contact = () => {
  const { t } = useTranslation();  const [selectedOffice, setSelectedOffice] = useState(DISTRICT_OFFICES[0]);
  const [faqCategory, setFaqCategory] = useState("all");
  const [openFaq, setOpenFaq] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successRef, setSuccessRef] = useState("");
  const [errors, setErrors] = useState({});
  const mapRef = useRef(null);
  const markerRefs = useRef({});

  const [form, setForm] = useState({ fullName: "", cnic: "", phone: "", email: "", district: "", queryType: "", subject: "", parcelId: "", message: "" });

  const faqTabs = [
    { value: "all", label: "All" },
    { value: "registration", label: "Registration" },
    { value: "documents", label: "Documents" },
    { value: "blockchain", label: "Blockchain" },
    { value: "disputes", label: "Disputes" },
    { value: "security", label: "Security" },
  ];
  const faqs = useMemo(() => (faqCategory === "all" ? FAQ_DATA : FAQ_DATA.filter((f) => f.category === faqCategory)), [faqCategory]);

  useEffect(() => {
    if (!selectedOffice || !mapRef.current) return;
    mapRef.current.flyTo([selectedOffice.lat, selectedOffice.lng], 12, { duration: 1.2 });
    const m = markerRefs.current[selectedOffice.id];
    if (m) setTimeout(() => m.openPopup(), 600);
  }, [selectedOffice]);

  const validate = () => {
    const e = {};
    if (!form.fullName || form.fullName.trim().length < 3) e.fullName = "This field is required";
    if (toDigits(form.cnic).length !== 13) e.cnic = "Please enter a valid 13-digit CNIC";
    const p = toDigits(form.phone);
    if (p.length !== 11 || !p.startsWith("03")) e.phone = "Phone must start with 03 and be 11 digits";
    if (form.email && !validEmail(form.email)) e.email = "Please enter a valid email address";
    if (!form.district) e.district = "This field is required";
    if (!form.queryType) e.queryType = "This field is required";
    if (!form.subject || form.subject.trim().length < 5) e.subject = "This field is required";
    if (!form.message || form.message.trim().length < 50) e.message = "Please provide at least 50 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSuccessRef(`BLRS-2024-${Math.floor(100000 + Math.random() * 900000)}`);
      setSubmitting(false);
    }, 2000);
  };

  const reset = () => {
    setSuccessRef("");
    setErrors({});
    setForm({ fullName: "", cnic: "", phone: "", email: "", district: "", queryType: "", subject: "", parcelId: "", message: "" });
  };

  const sectionMotion = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, viewport: { once: true } };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <PublicNavbar />

      <section className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] px-4 py-12 text-white dark:from-[#0D2B1F] dark:to-[#1B4332]">
        <motion.div {...sectionMotion} className="mx-auto max-w-6xl text-center">
          <p className="text-xs text-white/75">Home / {t("contact.navLink")}</p>
          <h1 className="mt-2 text-4xl font-bold">{t("contact.heroTitle")}</h1>
          <p className="mt-1 text-white/85">{t("contact.heroSubtitle")}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm">
            <span className="rounded-full bg-white/10 px-3 py-1">?? 0800-BLRS (2577)</span>
            <span className="rounded-full bg-white/10 px-3 py-1">?? info@blrs.gov.pk</span>
            <span className="rounded-full bg-white/10 px-3 py-1">?? Mon–Sat, 9AM–5PM</span>
          </div>
        </motion.div>
      </section>

      <section className="px-4 py-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 rounded-2xl border border-amber-500 bg-amber-100 px-5 py-4 dark:bg-amber-900/20 md:flex-row">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-6 w-6 text-amber-700" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">{t("contact.emergencyTitle")}: {t("contact.emergencyNumber")}</p>
              <p className="text-sm text-amber-800 dark:text-amber-300">{t("contact.emergencyNote")}</p>
            </div>
          </div>
          <button className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white">Call Now</button>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 lg:grid-cols-11">
        <motion.div {...sectionMotion} className="lg:col-span-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            {!successRef ? (
              <>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("contact.formTitle")}</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("contact.formSubtitle")}</p>
                <form className="mt-5 space-y-4" onSubmit={submit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">{t("contact.nameLabel")}*</label>
                      <input className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" placeholder={t("contact.namePlaceholder")} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                      {errors.fullName ? <p className="mt-1 text-xs text-red-600">{errors.fullName}</p> : null}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">{t("contact.cnicLabel")}*</label>
                      <input className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" placeholder={t("contact.cnicPlaceholder")} value={form.cnic} onChange={(e) => setForm({ ...form, cnic: formatCNICInput(e.target.value) })} />
                      {errors.cnic ? <p className="mt-1 text-xs text-red-600">{errors.cnic}</p> : null}
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">{t("contact.phoneLabel")}*</label>
                      <input className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" placeholder={t("contact.phonePlaceholder")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                      {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone}</p> : null}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">{t("contact.emailLabel")}</label>
                      <input className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" placeholder={t("contact.emailPlaceholder")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                      {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">{t("contact.districtLabel")}*</label>
                      <select className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
                        <option value="">{t("contact.districtPlaceholder")}</option>
                        {DISTRICTS.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                      </select>
                      {errors.district ? <p className="mt-1 text-xs text-red-600">{errors.district}</p> : null}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">{t("contact.queryTypeLabel")}*</label>
                      <select className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" value={form.queryType} onChange={(e) => setForm({ ...form, queryType: e.target.value })}>
                        <option value="">{t("contact.queryTypeLabel")}</option>
                        {QUERY_TYPES.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
                      </select>
                      {errors.queryType ? <p className="mt-1 text-xs text-red-600">{errors.queryType}</p> : null}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">{t("contact.subjectLabel")}*</label>
                    <input className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" placeholder={t("contact.subjectPlaceholder")} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                    {errors.subject ? <p className="mt-1 text-xs text-red-600">{errors.subject}</p> : null}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">{t("contact.parcelIdLabel")}</label>
                    <input className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 uppercase dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" placeholder={t("contact.parcelIdPlaceholder")} value={form.parcelId} onChange={(e) => setForm({ ...form, parcelId: e.target.value.toUpperCase() })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">{t("contact.messageLabel")}*</label>
                    <textarea className="min-h-[140px] w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" placeholder={t("contact.messagePlaceholder")} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                    <div className="mt-1 flex items-center justify-between">
                      {errors.message ? <p className="text-xs text-red-600">{errors.message}</p> : <span />}
                      <p className={`text-xs ${form.message.trim().length >= 50 ? "text-green-600" : "text-slate-500"}`}>{form.message.trim().length} / 50 minimum</p>
                    </div>
                  </div>
                  <button type="submit" disabled={submitting} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1B4332] font-semibold text-white hover:bg-[#0D2B1F] disabled:opacity-60"><Send className="h-4 w-4" /> {submitting ? t("contact.submitting") : t("contact.submitButton")}</button>
                </form>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
                <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{t("contact.successTitle")}</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400">{t("contact.successMessage")}</p>
                <div className="mx-auto mt-4 flex max-w-md items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-700">
                  <p className="flex-1 font-mono font-semibold">{successRef}</p>
                  <button type="button" className="rounded border border-slate-300 p-2 text-xs dark:border-slate-600" onClick={() => { navigator.clipboard.writeText(successRef); toast.success("Reference copied"); }}><Copy className="h-4 w-4" /></button>
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{t("contact.successNote")}</p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  <button type="button" onClick={reset} className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600">Submit Another Complaint</button>
                  <Link to="/search" className="rounded-lg bg-[#1B4332] px-4 py-2 text-sm text-white">Search My Land ?</Link>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
        <motion.div {...sectionMotion} className="space-y-4 lg:col-span-5">
          <div className="rounded-2xl bg-[#1B4332] p-6 text-white dark:bg-[#0D2B1F]">
            <h3 className="inline-flex items-center gap-2 text-xl font-semibold"><Landmark className="h-5 w-5" /> {t("contact.headquartersTitle")}</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-white/90">{t("contact.headquartersAddress")}</p>
            <div className="my-3 h-px bg-white/20" />
            <div className="space-y-1 text-sm text-white/85">
              <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {t("contact.headquartersPhone")}</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {t("contact.headquartersEmail")}</p>
              <p className="flex items-center gap-2"><ExternalLink className="h-4 w-4" /> revenue.balochistan.gov.pk</p>
              <p className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> Mon–Sat, 9:00 AM – 5:00 PM</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Specific Departments</h4>
            <div className="mt-3 space-y-3 text-sm">
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"><p className="font-medium">?? Land Registration Queries</p><p className="text-slate-600 dark:text-slate-400">registration@blrs.gov.pk</p><p className="text-slate-600 dark:text-slate-400">+92-81-9201235</p></div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"><p className="font-medium">?? Dispute Resolution Cell</p><p className="text-slate-600 dark:text-slate-400">disputes@blrs.gov.pk</p><p className="text-slate-600 dark:text-slate-400">+92-81-9201236</p></div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"><p className="font-medium">?? Technical Support</p><p className="text-slate-600 dark:text-slate-400">support@blrs.gov.pk</p><p className="text-slate-600 dark:text-slate-400">+92-81-9201237</p></div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Online Services</h4>
            <div className="mt-3 space-y-2 text-sm">
              <Link className="flex items-center gap-2 text-[#1B4332] hover:underline dark:text-green-300" to="/search"><Search className="h-4 w-4" /> Public Land Search</Link>
              <Link className="flex items-center gap-2 text-[#1B4332] hover:underline dark:text-green-300" to="/login"><Building2 className="h-4 w-4" /> Officer Portal</Link>
              <a href="#" className="flex items-center gap-2 text-[#1B4332] hover:underline dark:text-green-300">?? Download Forms</a>
              <a href="#" className="flex items-center gap-2 text-[#1B4332] hover:underline dark:text-green-300">?? Citizen Charter</a>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="bg-slate-100 px-4 py-10 dark:bg-slate-800">
        <motion.div {...sectionMotion} className="mx-auto max-w-7xl">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("contact.mapTitle")}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("contact.officesSubtitle")}</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-5">
            <div className="max-h-[500px] space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 lg:col-span-2">
              {DISTRICT_OFFICES.map((office) => (
                <button key={office.id} type="button" onClick={() => setSelectedOffice(office)} className={`w-full rounded-xl border p-3 text-left transition ${selectedOffice.id === office.id ? "border-[#1B4332] bg-green-50 dark:bg-green-900/20" : "border-slate-200 hover:border-[#1B4332] dark:border-slate-700"}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{office.district} Revenue Office</p>
                    {office.isHeadquarters ? <span className="rounded-full bg-[#D4AF37] px-2 py-0.5 text-xs font-medium text-[#1B4332]">HQ</span> : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{office.address}</p>
                  <p className="mt-1 text-xs">?? {office.phone}</p>
                  <p className="text-xs">?? {office.email}</p>
                  <p className="text-xs">?? {office.hours}</p>
                  <p className="text-xs">DC: {office.dc}</p>
                </button>
              ))}
            </div>
            <div className="h-[500px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 lg:col-span-3">
              <MapContainer center={[29, 65.5]} zoom={7} className="h-full w-full" whenCreated={(m) => (mapRef.current = m)}>
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {DISTRICT_OFFICES.map((office) => (
                  <Marker key={office.id} position={[office.lat, office.lng]} icon={office.isHeadquarters ? hqIcon : greenIcon} ref={(r) => { if (r) markerRefs.current[office.id] = r; }}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">?? {office.district} {office.isHeadquarters ? "(HEADQUARTERS)" : ""}</p>
                        <p>{office.address}</p><p>{office.phone}</p><p>{office.hours}</p>
                        <a href="#" className="mt-1 inline-flex items-center gap-1 text-blue-600 hover:underline">Get Directions <ExternalLink className="h-3 w-3" /></a>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("contact.officesTitle")}</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DISTRICT_OFFICES.map((office) => (
            <div key={office.id} className={`rounded-2xl border p-4 transition hover:border-[#1B4332] hover:shadow-md ${office.isHeadquarters ? "border-[#1B4332] bg-green-50 dark:bg-green-900/20" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"}`}>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">{office.district} District Office</h4>
                {office.isHeadquarters ? <span className="rounded-full bg-[#D4AF37] px-2 py-0.5 text-xs font-medium text-[#1B4332]">? Headquarters</span> : null}
              </div>
              <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <p>?? {office.address}</p><p>?? {office.phone}</p><p>?? {office.email}</p><p>?? DC: {office.dc}</p><p>?? {office.hours}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-white px-4 py-10 dark:bg-slate-800">
        <motion.div {...sectionMotion} className="mx-auto max-w-7xl">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("contact.faqTitle")}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("contact.faqSubtitle")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {faqTabs.map((tab) => (
              <button key={tab.value} type="button" onClick={() => setFaqCategory(tab.value)} className={`rounded-full px-3 py-1 text-sm ${faqCategory === tab.value ? "bg-[#1B4332] text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100"}`}>{tab.label}</button>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {faqs.map((faq) => {
              const open = openFaq === faq.id;
              return (
                <div key={faq.id} className={`overflow-hidden rounded-xl border ${open ? "border-l-4 border-l-green-600 border-green-300 bg-green-50 dark:bg-green-900/20" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"}`}>
                  <button type="button" className="flex w-full items-center justify-between px-4 py-3 text-left" onClick={() => setOpenFaq(open ? null : faq.id)}>
                    <span className="font-medium text-slate-900 dark:text-slate-100">Q: {faq.question}</span>
                    <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {open ? (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                        <div className="px-4 pb-4 text-sm">
                          <p className="text-slate-700 dark:text-slate-300">A: {faq.answer}</p>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] px-4 py-12 text-white dark:from-[#0D2B1F] dark:to-[#1B4332]">
        <div className="mx-auto max-w-5xl text-center">
          <h3 className="text-3xl font-bold">Still have questions?</h3>
          <p className="mt-2 text-white/80">Contact our helpline or visit your nearest Revenue Department office</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a href="tel:08002577" className="rounded-lg bg-[#D4AF37] px-5 py-3 font-semibold text-[#1B4332] hover:bg-[#F0D060]">?? Call Helpline: 0800-BLRS</a>
            <Link to="/search" className="rounded-lg border border-white px-5 py-3 font-semibold text-white hover:bg-white/10">?? Search Your Land</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;


