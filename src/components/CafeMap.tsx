"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { Cafe, CHECKIN_META, LiveCheckIn } from "@/types/cafe";
import vnmGeo from "@/data/vnm.geo.json";

interface CafeMapProps {
  cafes: Cafe[];
  selectedCafeId: string | null;
  onSelectCafe: (cafe: Cafe) => void;
  checkInsByCafe: Record<string, LiveCheckIn[]>;
  userLocation: { lat: number; lng: number } | null;
}

const HCMC_CENTER: [number, number] = [10.788, 106.695];
const VIETNAM_CENTER: [number, number] = [15.5, 109.5];
// Giới hạn vùng bản đồ trong lãnh thổ & vùng biển Việt Nam (bao gồm Hoàng Sa & Trường Sa)
const VIETNAM_BOUNDS: L.LatLngBoundsExpression = [
  [6.0, 101.5],
  [24.0, 118.5],
];

const WORLD_OUTER: [number, number][] = [
  [-90, -180],
  [-90, 180],
  [90, 180],
  [90, -180],
];

// Chuyển tọa độ [lng, lat] từ GeoJSON ranh giới thực của Việt Nam sang [lat, lng] cho Leaflet
const VIETNAM_BORDER_RING: [number, number][] = (
  vnmGeo.features[0].geometry.coordinates[0] as number[][]
).map(([lng, lat]) => [lat, lng]);

const SOVEREIGNTY_ISLANDS = [
  {
    name: "Quần đảo Hoàng Sa",
    sub: "Đà Nẵng, Việt Nam",
    coords: [16.5, 112.0] as [number, number],
    coverRadiusMeters: 150000,
  },
  {
    name: "Quần đảo Trường Sa",
    sub: "Khánh Hòa, Việt Nam",
    coords: [10.0, 114.5] as [number, number],
    coverRadiusMeters: 240000,
  },
];

export default function CafeMap({
  cafes,
  selectedCafeId,
  onSelectCafe,
  checkInsByCafe,
  userLocation,
}: CafeMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: VIETNAM_CENTER,
      zoom: 6,
      minZoom: 5,
      maxZoom: 19,
      maxBounds: VIETNAM_BOUNDS,
      maxBoundsViscosity: 1.0,
      zoomControl: false,
    });

    // Standard OpenStreetMap basemap (100% free, no API key required)
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      noWrap: true,
    }).addTo(map);

    // Che trắng hoàn toàn (#ffffff) mọi phần ngoài ranh giới đất liền Việt Nam
    L.polygon([WORLD_OUTER, VIETNAM_BORDER_RING], {
      color: "#94a3b8",
      weight: 1.5,
      opacity: 0.7,
      fillColor: "#ffffff",
      fillOpacity: 1,
      interactive: false,
    }).addTo(map);

    // Hiển thị vùng biển & nhãn chủ quyền Quần đảo Hoàng Sa & Quần đảo Trường Sa (Việt Nam), không có chữ tiếng nước ngoài
    SOVEREIGNTY_ISLANDS.forEach((island) => {
      L.circle(island.coords, {
        radius: island.coverRadiusMeters,
        color: "#dc2626",
        weight: 1,
        dashArray: "4 4",
        opacity: 0.45,
        fillColor: "#dbeafe",
        fillOpacity: 0.85,
        interactive: false,
      }).addTo(map);

      const icon = L.divIcon({
        className: "custom-cafe-marker",
        html: `
          <div style="
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            pointer-events: none;
            white-space: nowrap;
          ">
            <div style="
              background: rgba(220, 38, 38, 0.92);
              color: #fef08a;
              font-weight: 800;
              font-size: 11px;
              padding: 3px 8px;
              border-radius: 9999px;
              border: 1.5px solid #ffffff;
              box-shadow: 0 2px 8px rgba(15, 23, 42, 0.25);
              letter-spacing: 0.01em;
            ">
              ★ ${island.name}
            </div>
            <div style="
              margin-top: 2px;
              background: rgba(255, 255, 255, 0.92);
              color: #991b1b;
              font-weight: 700;
              font-size: 9px;
              padding: 1px 6px;
              border-radius: 9999px;
              box-shadow: 0 1px 4px rgba(15, 23, 42, 0.15);
            ">
              ${island.sub}
            </div>
          </div>
        `,
        iconSize: [140, 38],
        iconAnchor: [70, 19],
      });

      L.marker(island.coords, {
        icon,
        interactive: false,
        zIndexOffset: 2000,
      }).addTo(map);
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapRef.current = map;
    markersLayerRef.current = layerGroup;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Render cafe markers whenever cafes, selection, or live check-ins change
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    cafes.forEach((cafe) => {
      const isSelected = cafe.id === selectedCafeId;
      const activeCheckIns = checkInsByCafe[cafe.id] || [];
      const latestAlert = activeCheckIns.find(
        (c) => CHECKIN_META[c.type].severity === "alert"
      );

      const bgColor = isSelected
        ? "#4f46e5" // indigo-600
        : latestAlert
        ? "#e11d48" // rose-600
        : cafe.featured
        ? "#d97706" // amber-600
        : "#0f172a"; // slate-900

      const scale = isSelected ? "scale(1.15)" : "scale(1)";
      const ring = isSelected
        ? "0 0 0 4px rgba(79, 70, 229, 0.28)"
        : "0 4px 12px rgba(15, 23, 42, 0.25)";

      const html = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: ${scale};
          transition: transform 150ms ease;
          cursor: pointer;
        ">
          <div style="
            background: ${bgColor};
            color: white;
            font-weight: 700;
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 9999px;
            border: 2px solid white;
            box-shadow: ${ring};
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
          ">
            ${cafe.featured ? "<span>★</span>" : ""}
            <span>${cafe.score != null ? cafe.score.toFixed(1) : "☕"}</span>
            ${cafe.open24h ? '<span style="font-size:10px;opacity:.9;">24h</span>' : ""}
            ${
              latestAlert
                ? `<span title="${CHECKIN_META[latestAlert.type].label}" style="font-size:11px;">${CHECKIN_META[latestAlert.type].emoji}</span>`
                : ""
            }
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid ${bgColor};
            margin-top: -1px;
          "></div>
        </div>
      `;

      const icon = L.divIcon({
        className: "custom-cafe-marker",
        html,
        iconSize: [56, 34],
        iconAnchor: [28, 34],
      });

      const marker = L.marker([cafe.lat, cafe.lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : cafe.featured ? 500 : 0,
      });

      marker.on("click", () => {
        onSelectCafe(cafe);
      });

      marker.addTo(layerGroup);
    });
  }, [cafes, selectedCafeId, checkInsByCafe, onSelectCafe]);

  // Smooth flyTo when selectedCafeId changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedCafeId) return;
    const selected = cafes.find((c) => c.id === selectedCafeId);
    if (selected) {
      map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 15), {
        duration: 0.5,
      });
    }
  }, [selectedCafeId, cafes]);

  // Show user location pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const marker = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 9,
        fillColor: "#2563eb",
        color: "#ffffff",
        weight: 3,
        opacity: 1,
        fillOpacity: 1,
      })
        .bindTooltip("Vị trí của bạn", { direction: "top" })
        .addTo(map);

      userMarkerRef.current = marker;
      map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 0.7 });
    }
  }, [userLocation]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
