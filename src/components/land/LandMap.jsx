import { useMemo } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { Link } from "react-router-dom";
import { BALOCHISTAN_CENTER, BALOCHISTAN_ZOOM } from "../../utils/constants";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const statusColor = {
  Pending: "#D97706",
  Verified: "#2563EB",
  Registered: "#16A34A",
  Rejected: "#DC2626",
  TransferPending: "#EA580C",
  Disputed: "#DC2626",
};

const LandMap = ({ parcels = [], center = BALOCHISTAN_CENTER, zoom = BALOCHISTAN_ZOOM, singleMarker, readOnly = false }) => {
  const points = useMemo(() => parcels.filter((p) => p.gpsLat && p.gpsLng), [parcels]);

  return (
    <div className="h-80 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={!readOnly} className="h-full w-full">
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {singleMarker ? (
          <Marker position={[singleMarker.lat, singleMarker.lng]}>
            <Popup>
              {singleMarker.label || "Land Location"} <br />
              {singleMarker.lat}, {singleMarker.lng}
            </Popup>
          </Marker>
        ) : null}
        {!singleMarker
          ? points.map((p) => (
              <CircleMarker key={p.parcelId} center={[p.gpsLat, p.gpsLng]} radius={7} pathOptions={{ color: statusColor[p.status] || "#64748B" }}>
                <Popup>
                  <p className="font-semibold">{p.parcelId}</p>
                  <p>{p.ownerName}</p>
                  <p>Status: {p.status}</p>
                  <Link to={`/land/${p.parcelId}`} className="text-blue-600 hover:underline">
                    View Details
                  </Link>
                </Popup>
              </CircleMarker>
            ))
          : null}
      </MapContainer>
    </div>
  );
};

export default LandMap;
