"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { Cafe, CHECKIN_META, LiveCheckIn } from "@/types/cafe";

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

const SOVEREIGNTY_ISLANDS = [
  {
    name: "Quần đảo Hoàng Sa",
    sub: "Đà Nẵng, Việt Nam",
    coords: [16.5, 112.0] as [number, number],
  },
  {
    name: "Quần đảo Trường Sa",
    sub: "Khánh Hòa, Việt Nam",
    coords: [10.0, 114.5] as [number, number],
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
      center: HCMC_CENTER,
      zoom: 13,
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

    // Luôn hiển thị nhãn chủ quyền Quần đảo Hoàng Sa & Quần đảo Trường Sa (Việt Nam)
    SOVEREIGNTY_ISLANDS.forEach((island) => {
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
            <span>${cafe.score.toFixed(1)}</span>
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

      {/* Map legend + Vietnam Overview button */}
      <div className="hidden sm:flex items-center gap-2 absolute bottom-4 left-4 z-[400]">
        <button
          type="button"
          onClick={() => {
            mapRef.current?.flyTo(VIETNAM_CENTER, 6, { duration: 0.8 });
          }}
          className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-yellow-200 font-bold px-3 py-1.5 rounded-full shadow-sm text-[11px] transition cursor-pointer"
        >
          <span>★</span> Toàn cảnh Việt Nam
        </button>
        <div className="flex items-center gap-3 bg-white/95 backdrop-blur-xs border border-slate-200 px-3 py-1.5 rounded-full shadow-sm text-[11px] text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900" /> Quán chuẩn
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> Nổi bật ★
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Có cảnh báo (6h)
          </span>
        </div>
      </div>
    </div>
  );
}
