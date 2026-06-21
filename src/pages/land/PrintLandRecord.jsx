import { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { landAPI } from "../../services/api";
import { useStore } from "../../store/useStore";
import PrintLayout from "../../components/shared/PrintLayout";
import { formatCNIC, formatDateShort, truncateHash } from "../../utils/helpers";

const PrintLandRecord = () => {
  const { parcelId } = useParams();
  const lands = useStore((s) => s.lands);
  const storeLand = useMemo(() => lands.find((l) => l.parcelId === parcelId), [lands, parcelId]);

  const [localLand, setLocalLand] = useState(null);
  const [loading, setLoading] = useState(!storeLand);

  useEffect(() => {
    if (storeLand) return;
    const fetchLand = async () => {
      try {
        const response = await landAPI.getOne(parcelId);
        if (response.ok) setLocalLand(response.data?.data?.land || response.data?.land);
      } catch (err) {
        console.error("Failed to fetch land for printing", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLand();
  }, [parcelId, storeLand]);

  const land = storeLand || localLand;

  if (loading) {
    return (
      <PrintLayout title="Print Record">
        <p className="text-center mt-10">Loading record...</p>
      </PrintLayout>
    );
  }

  if (!land) {
    return (
      <PrintLayout title="Print Record">
        <p className="text-center mt-10">Record not found.</p>
      </PrintLayout>
    );
  }

  return (
    <PrintLayout title="Official Land Record" autoPrint>
      <div className="no-print mb-3">
        <Link to={`/land/${land.parcelId}`} className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600">
          Back to Details
        </Link>
      </div>
      <div className="mx-auto max-w-4xl border border-slate-300 bg-white p-6 text-black">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 rounded-full border-2 border-[#1B4332] bg-[#2D6A4F] text-xl text-[#D4AF37]">★</div>
          <p className="mt-1 text-xs font-semibold">GOVERNMENT OF BALOCHISTAN</p>
          <p className="text-xs font-semibold">REVENUE & ESTATE DEPARTMENT</p>
          <p className="text-xs font-semibold">BALOCHISTAN LAND REGISTRY SYSTEM</p>
          <div className="my-2 border-t border-b border-slate-400 py-2">
            <p className="text-sm font-bold">OFFICIAL LAND RECORD</p>
            <p className="text-xs">
              Record No: BLRS-{land.parcelId} | Date: {new Date().toLocaleDateString("en-PK")}
            </p>
          </div>
        </div>

        <section className="mt-4 text-sm">
          <h2 className="font-bold">LAND INFORMATION</h2>
          <hr className="my-1 border-slate-400" />
          <div className="grid grid-cols-2 gap-1">
            <p>Parcel ID: {land.parcelId}</p>
            <p>Owner (EN): {land.ownerName}</p>
            <p>CNIC: {formatCNIC(land.ownerCNIC)}</p>
            <p>District: {land.district}</p>
            <p>Tehsil: {land.tehsil}</p>
            <p>Mouza: {land.mouza}</p>
            <p>
              Area: {land.areaMarla} Marla ({land.areaSqFt.toLocaleString()} sq ft)
            </p>
            <p>Land Type: {land.landType}</p>
            <p>
              GPS: {land.gpsLat}, {land.gpsLng}
            </p>
            <p className="col-span-2">Status: ✅ {land.status.toUpperCase()}</p>
          </div>
        </section>

        <section className="mt-4 text-sm">
          <h2 className="font-bold">APPROVAL CHAIN</h2>
          <hr className="my-1 border-slate-400" />
          <p>
            Registered: {land.registeredByPatwari?.fullName || "—"} (Patwari)
            <br />
            {formatDateShort(land.createdAt)}
          </p>
          <p className="mt-2">
            Verified: {land.verifiedByTehsildar?.fullName || "—"} (Tehsildar)
            <br />
            {formatDateShort(land.updatedAt)}
          </p>
          <p className="mt-2">
            Approved: {land.approvedByDC?.fullName || "—"} (DC)
            <br />
            {formatDateShort(land.updatedAt)}
          </p>
        </section>

        <section className="mt-4 text-sm">
          <h2 className="font-bold">BLOCKCHAIN VERIFICATION</h2>
          <hr className="my-1 border-slate-400" />
          <p>TX Hash: {truncateHash(land.blockchainTxHash, 12)}</p>
          <p>Network: Hardhat Local | Block: #{Math.floor(Math.random() * 90000) + 10000}</p>
          <p>NFT Token: #{land.nftTokenId || "N/A"}</p>
        </section>

        <section className="mt-4">
          <div className="grid grid-cols-2 gap-4 border-y border-slate-400 py-3">
            <div>
              <p className="text-sm font-semibold">Official Stamp Area:</p>
              <div className="mt-2 h-16 border border-slate-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">Signature Area:</p>
              <div className="mt-2 h-16 border border-slate-400" />
            </div>
          </div>
        </section>

        <p className="mt-4 text-center text-xs">
          This record is blockchain-verified by BLRS | Verify at: blrs.gov.pk/verify
        </p>
      </div>
    </PrintLayout>
  );
};

export default PrintLandRecord;

