import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { landAPI } from "../../services/api";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from "react-leaflet";
import * as turf from "@turf/turf";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons
import L from "leaflet";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], map.getZoom() || 18);
    }
  }, [center, map]);
  return null;
};

const FieldSurvey = () => {
  const navigate = useNavigate();
  const [pendingLands, setPendingLands] = useState([]);
  const [selectedLandId, setSelectedLandId] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [recordedPoints, setRecordedPoints] = useState([]);
  const [isSurveying, setIsSurveying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingLands();
  }, []);

  const fetchPendingLands = async () => {
    try {
      const res = await landAPI.getAll({ status: "SurveyPending", limit: 50 });
      if (res.ok && res.data?.data?.lands) {
        setPendingLands(res.data.data.lands);
      }
    } catch (err) {
      toast.error("Failed to fetch pending surveys");
    }
  };

  const startSurvey = () => {
    if (!selectedLandId) {
      toast.error("Please select a land parcel first");
      return;
    }
    
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsSurveying(true);
    setRecordedPoints([]);
    
    toast.loading("Acquiring GPS signal...", { id: "gps" });
    
    navigator.geolocation.watchPosition(
      (position) => {
        toast.dismiss("gps");
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        toast.dismiss("gps");
        toast.error(`GPS Error: ${error.message}`);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
  };

  const recordPoint = () => {
    if (!currentLocation) {
      toast.error("Waiting for GPS signal...");
      return;
    }
    
    setRecordedPoints(prev => [...prev, { lat: currentLocation.lat, lng: currentLocation.lng }]);
    toast.success(`Point ${recordedPoints.length + 1} recorded!`);
  };

  const undoLastPoint = () => {
    setRecordedPoints(prev => prev.slice(0, -1));
  };

  const completeSurvey = async () => {
    if (recordedPoints.length < 3) {
      toast.error("You need at least 3 points to form a closed polygon area");
      return;
    }

    setSubmitting(true);
    try {
      const coordinates = [...recordedPoints.map(p => [p.lng, p.lat])];
      coordinates.push([recordedPoints[0].lng, recordedPoints[0].lat]); // close loop
      
      const polygon = turf.polygon([coordinates]);
      
      const areaSqMeters = turf.area(polygon);
      const areaSqFt = areaSqMeters * 10.7639;
      
      const center = turf.centerOfMass(polygon);
      const centerPoint = {
        lng: center.geometry.coordinates[0],
        lat: center.geometry.coordinates[1]
      };

      toast.loading("Saving survey data...", { id: "survey-save" });
      
      const payload = {
        gisData: polygon.geometry,
        areaSqFt: areaSqFt.toFixed(2),
        centerPoint
      };

      const res = await landAPI.updateSurvey(selectedLandId, payload);
      
      if (res.ok) {
        toast.success("Survey completed successfully!", { id: "survey-save" });
        setIsSurveying(false);
        setRecordedPoints([]);
        setSelectedLandId("");
        fetchPendingLands();
        navigate("/dashboard");
      } else {
        throw new Error(res.data?.message || "Failed to save survey");
      }
    } catch (err) {
      toast.error(err.message || "An error occurred", { id: "survey-save" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h1 className="text-2xl font-bold">Mobile Field Survey</h1>
        <p className="mt-2 text-sm text-slate-500">
          Select a pending registration and walk the physical boundaries to map the land using your device's GPS.
        </p>
      </div>

      {!isSurveying ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <label className="mb-2 block font-semibold">Select Pending Land Parcel:</label>
          <select 
            className="w-full rounded-lg border p-3 dark:border-slate-600 dark:bg-slate-700"
            value={selectedLandId}
            onChange={(e) => setSelectedLandId(e.target.value)}
          >
            <option value="">-- Select Parcel --</option>
            {pendingLands.map(land => (
              <option key={land._id} value={land._id}>
                {land.parcelId} - {land.ownerName} ({land.district})
              </option>
            ))}
          </select>
          
          <button 
            onClick={startSurvey}
            disabled={!selectedLandId}
            className="mt-6 w-full rounded-lg bg-[#1B4332] py-4 text-lg font-bold text-white disabled:opacity-50"
          >
            Start GPS Survey
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 h-[60vh] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            {currentLocation ? (
              <MapContainer 
                center={[currentLocation.lat, currentLocation.lng]} 
                zoom={18} 
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater center={currentLocation} />
                
                <Marker position={[currentLocation.lat, currentLocation.lng]}>
                  <Popup>Your Location (Accuracy: {currentLocation.accuracy?.toFixed(1)}m)</Popup>
                </Marker>
                
                {recordedPoints.length > 0 && (
                  <Polygon 
                    positions={recordedPoints.map(p => [p.lat, p.lng])} 
                    pathOptions={{ color: 'blue', weight: 3, fillColor: 'blue', fillOpacity: 0.2 }} 
                  />
                )}
                
                {recordedPoints.map((p, idx) => (
                  <Marker key={idx} position={[p.lat, p.lng]} opacity={0.7} />
                ))}
              </MapContainer>
            ) : (
              <div className="flex h-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                <p className="animate-pulse text-lg font-semibold text-slate-500">Waiting for GPS signal...</p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="text-center">
              <h2 className="text-xl font-bold">{recordedPoints.length}</h2>
              <p className="text-sm text-slate-500">Points Recorded</p>
            </div>
            
            <button 
              onClick={recordPoint}
              className="flex-1 rounded-lg bg-blue-600 py-6 text-xl font-bold text-white active:bg-blue-800"
            >
              📍 RECORD POINT
            </button>
            
            <button 
              onClick={undoLastPoint}
              disabled={recordedPoints.length === 0}
              className="rounded-lg border border-slate-300 py-3 text-sm font-semibold disabled:opacity-50 dark:border-slate-600"
            >
              Undo Last Point
            </button>
            
            <div className="mt-auto pt-4">
              <button 
                onClick={completeSurvey}
                disabled={recordedPoints.length < 3 || submitting}
                className="w-full rounded-lg bg-green-600 py-4 font-bold text-white disabled:opacity-50"
              >
                {submitting ? "Saving..." : "✅ COMPLETE SURVEY"}
              </button>
              
              <button 
                onClick={() => {
                  setIsSurveying(false);
                  setRecordedPoints([]);
                }}
                className="mt-2 w-full py-2 text-sm text-red-500"
              >
                Cancel Survey
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldSurvey;
