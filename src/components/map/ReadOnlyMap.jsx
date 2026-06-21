import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polygon, Popup, useMap } from "react-leaflet";
import { publicAPI } from "../../services/api";
import "leaflet/dist/leaflet.css";

const FitBounds = ({ coordinates }) => {
  const map = useMap();
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      // leaflet expects [lat, lng], geojson is [lng, lat]
      const bounds = coordinates[0].map(coord => [coord[1], coord[0]]);
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [coordinates, map]);
  return null;
};

const ReadOnlyMap = ({ gisData, status }) => {
  if (!gisData || !gisData.coordinates) return <div className="p-4 bg-slate-100 text-slate-500 rounded text-center">No GIS Data Available</div>;

  const getColorByStatus = (status) => {
    switch (status) {
      case "Registered": return "#10B981"; // Green
      case "Pending":
      case "Verified": return "#F59E0B"; // Yellow
      case "Disputed": return "#EF4444"; // Red
      case "Suspended": return "#6B7280"; // Gray
      default: return "#3B82F6"; // Blue
    }
  };

  const color = getColorByStatus(status);
  
  // Transform GeoJSON [lng, lat] to Leaflet [lat, lng]
  const leafletPositions = gisData.coordinates[0].map(coord => [coord[1], coord[0]]);

  const [otherLands, setOtherLands] = useState([]);

  useEffect(() => {
    const fetchOtherLands = async () => {
      try {
        const response = await publicAPI.getAllGIS();
        if (response.ok && response.data.success) {
          setOtherLands(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch GIS data for other lands", error);
      }
    };
    fetchOtherLands();
  }, []);

  return (
    <div className="h-64 md:h-80 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 z-0">
      <MapContainer 
        scrollWheelZoom={false} 
        className="h-full w-full"
        zoomControl={true}
        dragging={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render other lands first so they appear underneath the active land */}
        {otherLands.map((land) => {
          // Skip if it's the exact same polygon (based on coordinates length and first coordinate match to avoid passing parcelId prop to ReadOnlyMap for now)
          const isSame =
            land.gisData?.coordinates[0]?.[0]?.[0] === gisData.coordinates[0]?.[0]?.[0] &&
            land.gisData?.coordinates[0]?.[0]?.[1] === gisData.coordinates[0]?.[0]?.[1];
          
          if (isSame || !land.gisData?.coordinates?.[0]) return null;

          const positions = land.gisData.coordinates[0].map((coord) => [coord[1], coord[0]]);
          const landColor = getColorByStatus(land.status);

          return (
            <Polygon
              key={land.parcelId}
              positions={positions}
              pathOptions={{ color: landColor, fillColor: landColor, fillOpacity: 0.3, weight: 1, opacity: 0.7 }}
            >
              <Popup>
                <div className="font-semibold text-sm">Parcel ID: {land.parcelId}</div>
                <div className="text-xs text-slate-500">Status: {land.status}</div>
              </Popup>
            </Polygon>
          );
        })}

        {/* Render active land on top */}
        <Polygon 
          positions={leafletPositions} 
          pathOptions={{ color: color, fillColor: color, fillOpacity: 0.5, weight: 3 }} 
        />
        <FitBounds coordinates={gisData.coordinates} />
      </MapContainer>
    </div>
  );
};

export default ReadOnlyMap;
