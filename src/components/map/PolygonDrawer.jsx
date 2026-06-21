import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, FeatureGroup, Polygon, Popup, useMap } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import * as turf from "@turf/turf";
import toast from "react-hot-toast";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

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
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center, map]);
  return null;
};

const PolygonDrawer = ({ initialCenter, existingLands = [], onPolygonComplete }) => {
  const [area, setArea] = useState(null);
  const [isValid, setIsValid] = useState(false);
  const featureGroupRef = useRef();

  const handleCreated = (e) => {
    const { layer } = e;
    
    // Enforce single polygon
    const layers = featureGroupRef.current.getLayers();
    if (layers.length > 1) {
      layers[0].remove(); // remove old layer
    }

    const geoJSON = layer.toGeoJSON();
    
    // Ensure it's a Polygon
    if (geoJSON.geometry.type !== "Polygon") {
      setIsValid(false);
      return;
    }

    // Check for overlap with existing lands
    if (checkOverlap(geoJSON.geometry, existingLands)) {
      layer.remove(); // remove the invalid layer
      toast.error("Land boundary overlaps with an already registered parcel!");
      setIsValid(false);
      return;
    }

    calculateMetrics(geoJSON.geometry);
  };

  const checkOverlap = (newGeometry, lands) => {
    try {
      const newPoly = turf.polygon(newGeometry.coordinates);
      for (const land of lands) {
        if (!land.gisData?.coordinates?.[0]) continue;
        const existingPoly = turf.polygon(land.gisData.coordinates);
        const intersection = turf.intersect(turf.featureCollection([newPoly, existingPoly]));
        if (intersection && turf.area(intersection) > 1) { // Allow slight touching, but reject real overlap
          return true;
        }
      }
    } catch (err) {
      console.error("Intersection check error:", err);
    }
    return false;
  };

  const handleEdited = (e) => {
    const layers = e.layers;
    let hasOverlap = false;

    layers.eachLayer((layer) => {
      const geoJSON = layer.toGeoJSON();
      if (geoJSON.geometry.type === "Polygon") {
        if (checkOverlap(geoJSON.geometry, existingLands)) {
          hasOverlap = true;
          toast.error("Edited boundary overlaps with an already registered parcel!");
          // Reverting edits automatically is complex in leaflet-draw without reloading, 
          // so we'll just invalidate the state to prevent submission
          setIsValid(false);
          setArea(null);
          onPolygonComplete(null);
        } else if (!hasOverlap) {
          calculateMetrics(geoJSON.geometry);
        }
      }
    });
  };

  const handleDeleted = () => {
    setArea(null);
    setIsValid(false);
    onPolygonComplete(null);
  };

  const calculateMetrics = (geometry) => {
    try {
      // Create Turf Polygon
      const polygon = turf.polygon(geometry.coordinates);
      
      // Calculate Area
      const areaSqMeters = turf.area(polygon);
      const areaSqFt = areaSqMeters * 10.7639;
      const areaAcres = areaSqMeters / 4046.86;
      const areaHectares = areaSqMeters / 10000;
      const areaMarla = areaSqFt / 272.25;
      const areaKanal = areaMarla / 20;

      const calculatedArea = {
        sqft: Number(areaSqFt.toFixed(2)),
        marla: Number(areaMarla.toFixed(2)),
        kanal: Number(areaKanal.toFixed(2)),
        acre: Number(areaAcres.toFixed(4)),
        sqm: Number(areaSqMeters.toFixed(2)),
        hectare: Number(areaHectares.toFixed(4)),
      };

      // Calculate Center
      const center = turf.centerOfMass(polygon);
      const centerPoint = {
        lng: Number(center.geometry.coordinates[0].toFixed(6)),
        lat: Number(center.geometry.coordinates[1].toFixed(6)),
      };

      setArea(calculatedArea);
      setIsValid(true);

      onPolygonComplete({
        gisData: geometry,
        centerPoint,
        calculatedArea
      });
    } catch (error) {
      console.error("Invalid geometry", error);
      setIsValid(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 min-h-[400px] border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden">
        <MapContainer
          center={initialCenter || [30.1798, 66.9750]}
          zoom={15}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {initialCenter && <MapUpdater center={initialCenter} />}

          {existingLands.map((land) => {
            if (!land.gisData?.coordinates?.[0]) return null;
            const positions = land.gisData.coordinates[0].map((coord) => [coord[1], coord[0]]);
            return (
              <Polygon
                key={land.parcelId}
                positions={positions}
                pathOptions={{
                  color: "#d32f2f", // Red for existing to differentiate from drawing
                  fillColor: "#ffcdd2",
                  fillOpacity: 0.3,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">Parcel: {land.parcelId}</p>
                    <p>Owner: {land.ownerName}</p>
                    <p>Status: {land.status}</p>
                  </div>
                </Popup>
              </Polygon>
            );
          })}
          
          <FeatureGroup ref={featureGroupRef}>
            <EditControl
              position="topright"
              onCreated={handleCreated}
              onEdited={handleEdited}
              onDeleted={handleDeleted}
              draw={{
                rectangle: true,
                circle: false,
                circlemarker: false,
                marker: false,
                polyline: false,
                polygon: {
                  allowIntersection: false,
                  showArea: true,
                  drawError: {
                    color: "#e1e100",
                    message: "<strong>Oh snap!<strong> you can't draw that!"
                  },
                  shapeOptions: {
                    color: "#1B4332",
                    fillOpacity: 0.3
                  }
                }
              }}
            />
          </FeatureGroup>
        </MapContainer>
      </div>
      
      {area && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm grid grid-cols-2 md:grid-cols-4 gap-2">
          <div><span className="font-semibold text-green-700 dark:text-green-400">Sq Ft:</span> {area.sqft}</div>
          <div><span className="font-semibold text-green-700 dark:text-green-400">Marla:</span> {area.marla}</div>
          <div><span className="font-semibold text-green-700 dark:text-green-400">Kanal:</span> {area.kanal}</div>
          <div><span className="font-semibold text-green-700 dark:text-green-400">Acre:</span> {area.acre}</div>
        </div>
      )}
    </div>
  );
};

export default PolygonDrawer;
