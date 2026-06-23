import { useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";

import { useNavigate } from "react-router-dom";
import { BALOCHISTAN_CENTER, BALOCHISTAN_ZOOM, DISTRICTS, DOCUMENT_TYPES, LAND_TYPES } from "../../utils/constants";
import {
  cleanCNIC,
  convertArea,
  formatCNIC,
  generateParcelId,
} from "../../utils/helpers";
import { landAPI, documentAPI } from "../../services/api";
import { useStore } from "../../store/useStore";
import { Progress } from "../../components/ui/progress";
import PolygonDrawer from "../../components/map/PolygonDrawer";
import "leaflet/dist/leaflet.css";

const steps = ["Owner Info", "Location", "Land Details", "GPS Map", "Documents", "Review & Submit"];



const RegisterLand = () => {
  const navigate = useNavigate();
  const user = useStore((s) => s.officer);
  const lands = useStore((s) => s.lands);
  const addLand = useStore((s) => s.addLand);
  const addLog = useStore((s) => s.addLog);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const setLands = useStore((s) => s.setLands);

  useEffect(() => {
    // Fetch existing lands to display on the map
    const fetchExistingLands = async () => {
      try {
        const res = await landAPI.getAll({ limit: 100 });
        if (res.ok && res.data?.data?.lands) {
          setLands(res.data.data.lands);
        }
      } catch (err) {
        console.error("Failed to fetch existing lands for map:", err);
      }
    };
    fetchExistingLands();
  }, [setLands]);

  const [owner, setOwner] = useState({ fullName: "", cnic: "" });
  const [location, setLocation] = useState({ parcelId: "", district: "", tehsil: "", mouza: "" });
  const [details, setDetails] = useState({ propertyType: "Private", landType: "agricultural", areaValue: "", areaUnit: "marla" });
  const [latLng, setLatLng] = useState({ lat: BALOCHISTAN_CENTER[0], lng: BALOCHISTAN_CENTER[1] });
  const [gisState, setGisState] = useState(null);
  const [documents, setDocuments] = useState([]);

  const selectedDistrict = DISTRICTS.find((d) => d.name === location.district);
  const parcelExists = lands.some((l) => l.parcelId === location.parcelId.toUpperCase());

  const converted = useMemo(() => convertArea(Number(details.areaValue || 0), details.areaUnit), [details]);

  const fetchCoordinates = async () => {
    try {
      toast.loading("Fetching GPS for location...", { id: "geo-fetch" });
      const query = `${location.mouza}, ${location.tehsil}, ${location.district}, Balochistan, Pakistan`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setLatLng({ lat: Number(data[0].lat), lng: Number(data[0].lon) });
        toast.success("Map centered to Mouza!", { id: "geo-fetch" });
      } else {
        const districtQuery = `${location.district}, Balochistan, Pakistan`;
        const resDist = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(districtQuery)}`);
        const dataDist = await resDist.json();
        if (dataDist && dataDist.length > 0) {
          setLatLng({ lat: Number(dataDist[0].lat), lng: Number(dataDist[0].lon) });
          toast.success("Map centered to District (Mouza not found)", { id: "geo-fetch" });
        } else {
          toast.dismiss("geo-fetch");
        }
      }
    } catch (err) {
      toast.dismiss("geo-fetch");
    }
  };

  const next = () => {
    if (step === 2) {
      fetchCoordinates();
    }
    setStep((s) => Math.min(6, s + 1));
  };
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const addFiles = (files) => {
    const accepted = Array.from(files).filter((f) => ["application/pdf", "image/png", "image/jpeg"].includes(f.type) && f.size <= 5 * 1024 * 1024);
    if (accepted.length !== files.length) {
      toast.error("Only PDF/JPG/PNG up to 5MB are accepted");
    }
    if (documents.length + accepted.length > 5) {
      toast.error("Maximum limit is 5 documents per registration");
      return;
    }
    setDocuments((prevDocs) => [
      ...prevDocs,
      ...accepted.map((f) => ({
        file: f,
        name: f.name,
        size: f.size,
        mime: f.type,
        type: "Fard Malkiat",
        hash: "Pending...",
      })),
    ]);
  };

  const validateStep = () => {
    if (step === 1) {
      const cnicOk = cleanCNIC(owner.cnic).length === 13;
      if (!owner.fullName || !cnicOk) return false;
    }
    if (step === 2) {
      if (!location.parcelId || !location.district || !location.tehsil || !location.mouza || parcelExists) return false;
    }
    if (step === 3) {
      if (!details.landType) return false;
    }
    if (step === 4) {
      if (!gisState || !gisState.gisData) return false; // Require Polygon
    }
    if (step === 5) {
      if (documents.length === 0) return false;
    }
    return true;
  };

  const handleDocumentUpload = async (file) => {
    try {
      const result = await documentAPI.upload(file);
      if (result.ok && result.data.success) {
        return result.data.data.ipfsHash;
      }
      throw new Error(result.data.message || 'Upload failed');
    } catch (err) {
      toast.error('Failed to upload document');
      throw err;
    }
  };

  const submit = async () => {
    if (!user && !useStore.getState().officer) return;
    setSubmitting(true);
    
    try {
      // 1. Upload all documents to IPFS
      toast.loading("Uploading documents to IPFS...", { id: "upload-toast" });
      const uploadedDocs = await Promise.all(
        documents.map(async (doc) => {
          const hash = await handleDocumentUpload(doc.file);
          return { hash, type: doc.type };
        })
      );
      toast.success("Documents uploaded", { id: "upload-toast" });

      // Update documents state to show the uploaded hashes in the UI
      setDocuments(documents.map((doc, index) => ({
        ...doc,
        hash: uploadedDocs[index].hash
      })));

      // 2. Create JSON payload
      const landData = {
        parcelId: location.parcelId.toUpperCase(),
        ownerCNIC: cleanCNIC(owner.cnic),
        ownerName: owner.fullName,
        district: location.district,
        tehsil: location.tehsil,
        mouza: location.mouza,
        areaSqFt: converted.sqft,
        areaMarla: converted.marla,
        areaKanal: converted.kanal,
        areaAcre: converted.acre,
        propertyType: details.propertyType,
        landType: details.landType,
        gpsLat: gisState?.centerPoint?.lat || Number(latLng.lat),
        gpsLng: gisState?.centerPoint?.lng || Number(latLng.lng),
        gisData: gisState?.gisData,
        centerPoint: gisState?.centerPoint,
        calculatedArea: gisState?.calculatedArea,
        primaryDocHash: uploadedDocs[0].hash,
        allDocHashes: uploadedDocs.map(d => d.hash),
        docTypes: uploadedDocs.map(d => d.type),
      };

      // Also create a GIS JSON to store on IPFS
      const gisMetadataJSON = {
         landId: landData.parcelId,
         district: landData.district,
         tehsil: landData.tehsil,
         mouza: landData.mouza,
         areaSqFt: landData.areaSqFt,
         calculatedArea: landData.calculatedArea,
         registrationDate: new Date().toISOString()
      };
      const gisBlob = new Blob([JSON.stringify(gisMetadataJSON)], { type: 'application/json' });
      const gisHash = await handleDocumentUpload(new File([gisBlob], `gis-${landData.parcelId}.json`, { type: 'application/json' }));
      
      landData.gisMetadataCID = gisHash;

      // 3. Send to backend
      toast.loading("Registering land on blockchain...", { id: "register-toast" });
      const response = await landAPI.register(landData);
      
      if (!response.ok) {
        throw new Error(response.data?.message || "Failed to register land");
      }
      
      toast.success("Land registered successfully", { id: "register-toast" });

      setSuccess({ 
        parcelId: response.data?.data?.land?.parcelId || location.parcelId.toUpperCase(), 
        txHash: response.data?.data?.txHash || "Pending...", 
        blockNumber: response.data?.data?.blockNumber || "Pending..." 
      });
    } catch (error) {
      toast.dismiss("upload-toast");
      toast.error(error.message || "Failed to register land", { id: "register-toast" });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
        <p className="text-3xl">✅</p>
        <h1 className="mt-3 text-2xl font-bold">Land Registered Successfully!</h1>
        <p className="mt-2">Parcel ID: {success.parcelId}</p>
        <p className="tx-hash mt-1">{success.txHash}</p>
        <p className="mt-1 text-sm text-slate-500">Block #{success.blockNumber}</p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button type="button" onClick={() => navigate(`/land/${success.parcelId}`)} className="rounded-lg bg-[#1B4332] px-4 py-2 text-white">
            View Details
          </button>
          <button
            type="button"
            onClick={() => {
              setSuccess(null);
              setStep(1);
              setOwner({ fullName: "", cnic: "" });
              setLocation({ parcelId: "", district: "", tehsil: "", mouza: "" });
              setDetails({ propertyType: "Private", landType: "agricultural", areaValue: "", areaUnit: "marla" });
              setDocuments([]);
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-600"
          >
            Register Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-xl font-bold">Register New Land</h1>
          <span className="text-sm text-slate-500">
            Step {step} / 6
          </span>
        </div>
        <Progress value={(step / 6) * 100} />
        <div className="mt-3 grid gap-2 text-xs md:grid-cols-6">
          {steps.map((s, i) => (
            <div key={s} className={`rounded px-2 py-1 text-center ${step === i + 1 ? "bg-[#1B4332] text-white" : "bg-slate-100 dark:bg-slate-700"}`}>
              {i + 1}. {s}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        {step === 1 ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Full Name EN*</label>
              <input className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700" value={owner.fullName} onChange={(e) => setOwner({ ...owner, fullName: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm">CNIC*</label>
              <input
                className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700"
                value={owner.cnic}
                onChange={(e) => setOwner({ ...owner, cnic: formatCNIC(e.target.value.replace(/\D/g, "").slice(0, 13)) || e.target.value })}
                placeholder="54301-5566778-8"
              />
              <p className="mt-1 text-xs">{cleanCNIC(owner.cnic).length === 13 ? "✅ Valid CNIC" : "❌ Invalid CNIC"}</p>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm">Property Type*</label>
              <select
                className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700"
                value={details.propertyType}
                onChange={(e) => setDetails({ ...details, propertyType: e.target.value })}
              >
                <option value="Private">Private Land</option>
                <option value="Government">Government Land</option>
              </select>
            </div>
            <div className="md:col-span-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-700 dark:bg-blue-950/30">
              Owner does not need a system account
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Parcel ID*</label>
              <div className="flex gap-2">
                <input
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 uppercase dark:border-slate-600 dark:bg-slate-700"
                  value={location.parcelId}
                  onChange={(e) => setLocation({ ...location, parcelId: e.target.value.toUpperCase() })}
                />
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-3 text-xs dark:border-slate-600"
                  onClick={() =>
                    setLocation({
                      ...location,
                      parcelId: generateParcelId((location.district || "QTA").slice(0, 3).toUpperCase()),
                    })
                  }
                >
                  Generate
                </button>
              </div>
              <p className={`mt-1 text-xs ${parcelExists ? "text-red-600" : "text-green-600"}`}>{parcelExists ? "❌ Parcel already exists" : "✅ Parcel available"}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm">District*</label>
              <input
                list="districts-list"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700"
                value={location.district}
                onChange={(e) => setLocation({ ...location, district: e.target.value, tehsil: "" })}
                placeholder="Type to search District"
              />
              <datalist id="districts-list">
                {DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-sm">Tehsil*</label>
              <input
                list="tehsils-list"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700"
                value={location.tehsil}
                onChange={(e) => setLocation({ ...location, tehsil: e.target.value })}
                placeholder="Type to search Tehsil"
              />
              <datalist id="tehsils-list">
                {selectedDistrict?.tehsils.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-sm">Mouza*</label>
              <input className="h-10 w-full rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-700" value={location.mouza} onChange={(e) => setLocation({ ...location, mouza: e.target.value })} />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm">Land Type</label>
              <div className="grid gap-2 md:grid-cols-4">
                {LAND_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setDetails({ ...details, landType: type.value })}
                    className={`rounded-xl border p-3 text-left ${
                      details.landType === type.value ? "border-[#1B4332] bg-green-50 dark:bg-green-900/20" : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <p>{type.icon}</p>
                    <p className="font-medium">{type.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-3">
            <div className="h-[500px]">
              <PolygonDrawer 
                initialCenter={{ lat: latLng.lat, lng: latLng.lng }} 
                existingLands={lands.filter(l => l.gisData && l.status !== "Rejected")}
                onPolygonComplete={(data) => {
                  setGisState(data);
                  if (data?.calculatedArea) {
                    setDetails(prev => ({
                      ...prev,
                      areaValue: data.calculatedArea.marla,
                      areaUnit: "marla"
                    }));
                  }
                }}
              />
            </div>
            {!gisState?.gisData && <p className="text-sm text-red-500">Please draw a closed polygon to represent the land boundary.</p>}
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-3">
            <label
              htmlFor="docs"
              className="flex min-h-28 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[#1B4332]/50 bg-green-50 text-sm dark:bg-green-900/10"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
            >
              Drag and drop files here or click to browse
            </label>
            <input id="docs" type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files || [])} />
            <div className="space-y-2">
              {documents.map((doc, i) => (
                <div key={`${doc.hash}-${i}`} className="grid gap-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700 md:grid-cols-4">
                  <p className="truncate">{doc.name}</p>
                  <select
                    value={doc.type}
                    onChange={(e) =>
                      setDocuments((prevDocs) => prevDocs.map((d, idx) => (idx === i ? { ...d, type: e.target.value } : d)))
                    }
                    className="rounded border border-slate-300 px-2 py-1 dark:border-slate-600 dark:bg-slate-700"
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.label}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <p>{(doc.size / 1024).toFixed(1)} KB</p>
                  <div className="flex items-center justify-between">
                    <p className="tx-hash truncate max-w-[100px]">{doc.hash}</p>
                    <button
                      type="button"
                      className="ml-2 text-red-500 hover:text-red-700 font-bold"
                      onClick={() => setDocuments(docs => docs.filter((_, idx) => idx !== i))}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {documents.length === 0 ? <p className="text-xs text-red-600">Minimum 1 document is required</p> : null}
          </div>
        ) : null}

        {step === 6 ? (
          <div className="space-y-4 text-sm">
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <h2 className="mb-2 font-semibold">Review Summary</h2>
              <p>
                <span className="font-medium">Owner:</span> {owner.fullName}
              </p>
              <p>
                <span className="font-medium">CNIC:</span> {owner.cnic}
              </p>
              <p>
                <span className="font-medium">Parcel:</span> {location.parcelId}
              </p>
              <p>
                <span className="font-medium">Location:</span> {location.district}, {location.tehsil}, {location.mouza}
              </p>
              <p>
                <span className="font-medium">Area:</span> {converted.marla} Marla ({converted.sqft} sq ft)
              </p>
              <p>
                <span className="font-medium">GPS:</span> {latLng.lat}, {latLng.lng}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <h2 className="mb-2 font-semibold">Documents</h2>
              {documents.map((doc, i) => (
                <p key={`${doc.hash}-${i}`} className="tx-hash">
                  {doc.type}: {doc.hash}
                </p>
              ))}
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
              <p className="font-medium">Blockchain Info</p>
              <p className="text-xs">Network: Sepolia Testnet | Estimated Gas: 21000</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={prev} disabled={step === 1} className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-slate-600">
          ← Previous
        </button>
        {step < 6 ? (
          <button
            type="button"
            onClick={next}
            disabled={!validateStep()}
            className="rounded-lg bg-[#1B4332] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Next →
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={submitting} className="rounded-lg bg-[#1B4332] px-4 py-2 text-sm text-white">
            {submitting ? "Creating..." : "Submit"}
          </button>
        )}
      </div>
    </div>
  );
};

export default RegisterLand;

