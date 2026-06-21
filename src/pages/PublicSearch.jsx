import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Search, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { publicAPI } from "../services/api";
import { formatCNIC, formatDateShort } from "../utils/helpers";
import StatusBadge from "../components/shared/StatusBadge";
import DarkModeToggle from "../components/shared/DarkModeToggle";
import ReadOnlyMap from "../components/map/ReadOnlyMap";

const PublicSearch = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [mode, setMode] = useState("cnic");
  const [query, setQuery] = useState(location.state?.query || "");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [result, setResult] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location.state?.query) {
      if (location.state.query.includes("-") || /^\d/.test(location.state.query)) {
        setMode("cnic");
        onCNICChange(location.state.query);
      } else {
        setMode("parcel");
        setQuery(location.state.query.toUpperCase());
      }
      setTimeout(() => onSearch(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.query]);

  const onSearch = async () => {
    if (!query) return;

    setLoading(true);
    setHasSearched(false);
    setError(null);
    setResult([]);

    try {
      let searchParams = {};
      if (mode === "cnic") {
        searchParams.cnic = query.replace(/-/g, "");
      } else {
        searchParams.parcelId = query;
      }

      const response = await publicAPI.search(searchParams);

      if (response.ok && response.data.success) {
        setResult(response.data.data.lands);
      } else {
        setError(response.data?.message || "Search failed");
      }
    } catch (err) {
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  const onCNICChange = (value) => {
    const numeric = value.replace(/\D/g, "").slice(0, 13);
    setQuery(formatCNIC(numeric) || numeric);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto mb-4 flex max-w-2xl justify-end gap-3">
        <DarkModeToggle />
      </div>

      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-800">
        <h1 className="text-center text-xl font-bold">{t("search.title")}</h1>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-700">
          <button
            type="button"
            onClick={() => {
              setMode("cnic");
              setQuery("");
            }}
            className={`rounded-md px-3 py-2 text-sm ${mode === "cnic" ? "bg-white shadow dark:bg-slate-800" : ""}`}
          >
            {t("search.byCNIC")}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("parcel");
              setQuery("");
            }}
            className={`rounded-md px-3 py-2 text-sm ${mode === "parcel" ? "bg-white shadow dark:bg-slate-800" : ""}`}
          >
            {t("search.byParcelId")}
          </button>
        </div>

        {mode === "cnic" ? (
          <input
            className="mt-4 h-11 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-600 dark:bg-slate-700"
            value={query}
            onChange={(e) => onCNICChange(e.target.value)}
            placeholder={t("search.placeholder_cnic")}
          />
        ) : (
          <input
            className="mt-4 h-11 w-full rounded-lg border border-slate-200 px-3 uppercase dark:border-slate-600 dark:bg-slate-700"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            placeholder={t("search.placeholder_parcel")}
          />
        )}
        <button
          type="button"
          onClick={onSearch}
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1B4332] font-medium text-white hover:bg-[#0D2B1F]"
        >
          <Search className="h-4 w-4" /> {t("search.search")}
        </button>
        <p className="mt-2 text-center text-xs text-slate-500">Results fetched from blockchain</p>
      </div>

      <div className="mx-auto mt-6 max-w-4xl space-y-3">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#1B4332] border-t-transparent" />
            <p className="mt-3 text-sm">{t("search.searching")}</p>
          </div>
        ) : null}

        {!loading && hasSearched && result.length === 0 && !error ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="text-lg font-semibold">{t("search.noResults")}</p>
            <p className="mt-2 text-sm text-slate-500">{t("search.visitOffice")}</p>
          </div>
        ) : null}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-600 dark:border-red-900/50 dark:bg-red-900/20">
            {error}
          </div>
        )}

        {!loading && result.length > 0 &&
          result.map((land) => (
            <div key={land.parcelId} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{land.parcelId}</h3>
                <StatusBadge status={land.status} />
              </div>
              <div className="mt-2 grid gap-1 text-sm text-slate-700 dark:text-slate-300 md:grid-cols-2">
                <p>Owner: {land.ownerName}</p>
                <p>District: {land.district}</p>
                <p>Tehsil: {land.tehsil}</p>
                <p>Mouza: {land.mouza}</p>
                <p>Area: {land.areaMarla} Marla</p>
                <p>Type: {land.landType}</p>
                <p>Registered: {formatDateShort(land.registeredAt)}</p>
              </div>
              
              {land.gisData && land.gisData.coordinates && (
                <div className="mt-3 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <ReadOnlyMap gisData={land.gisData} status={land.status} />
                </div>
              )}

              <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-2 text-sm text-green-700 dark:border-slate-600 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Verified on Blockchain
                </div>
                {land.status === "Registered" && land.blockchainTxHash && (
                  <div className="rounded bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                    Tx: {land.blockchainTxHash}
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default PublicSearch;
