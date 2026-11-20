"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Map as MapIcon,
  List,
  Wifi,
  Plug,
  Sparkles,
  Clock,
  Radio,
  Bookmark,
} from "lucide-react";
import { SEED_CAFES } from "@/data/seedCafes";
import {
  Cafe,
  CHECKIN_META,
  CheckInStatusType,
  LiveCheckIn,
  QuickFilters,
} from "@/types/cafe";
import {
  loadActiveCheckIns,
  loadFavorites,
  loadUserCafes,
  saveCheckIns,
  saveFavorites,
  saveUserCafes,
  SIX_HOURS_MS,
} from "@/lib/storage";
import Navbar from "./Navbar";
import QuickFilterBar from "./QuickFilterBar";
import WorkspaceScorecard from "./WorkspaceScorecard";
import AddCafeModal from "./AddCafeModal";

const CafeMap = dynamic(() => import("./CafeMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500 text-sm">
      Đang tải bản đồ CafeRadar TP.HCM...
    </div>
  ),
});

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DeadlineRadarApp() {
  const [userCafes, setUserCafes] = useState<Cafe[]>([]);
  const [checkIns, setCheckIns] = useState<LiveCheckIn[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedCafeId, setSelectedCafeId] = useState<string | null>(
    SEED_CAFES[0]?.id ?? null
  );
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [showAddModal, setShowAddModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [filters, setFilters] = useState<QuickFilters>({
    powerEveryTable: false,
    fastWifi: false,
    open24h: false,
    quietForCalls: false,
    ergonomicDesk: false,
    stayFriendly: false,
    district: "ALL",
    search: "",
  });

  useEffect(() => {
    setUserCafes(loadUserCafes());
    setCheckIns(loadActiveCheckIns());
    setFavorites(loadFavorites());

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("add") === "1") {
        setShowAddModal(true);
      }
      const focusId = params.get("cafe");
      if (focusId) {
        setSelectedCafeId(focusId);
      }
    }
  }, []);

  const allCafes = useMemo(() => [...userCafes, ...SEED_CAFES], [userCafes]);

  const checkInsByCafe = useMemo(() => {
    const now = Date.now();
    const map: Record<string, LiveCheckIn[]> = {};
    for (const item of checkIns) {
      if (new Date(item.expiresAt).getTime() <= now) continue;
      if (!map[item.cafeId]) map[item.cafeId] = [];
      map[item.cafeId].push(item);
    }
    return map;
  }, [checkIns]);

  const filteredCafes = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const list = allCafes.filter((c) => {
      if (onlyFavorites && !favorites.includes(c.id)) return false;
      if (filters.district !== "ALL" && c.district !== filters.district) {
        return false;
      }
      if (filters.powerEveryTable && c.powerOutlets !== "all") return false;
      if (filters.fastWifi && c.wifiDownload < 50) return false;
      if (filters.open24h && !c.open24h) return false;
      if (filters.quietForCalls && !c.quietForCalls) return false;
      if (filters.ergonomicDesk && !c.ergonomicDesk) return false;
      if (filters.stayFriendly && !c.stayFriendly) return false;
      if (q) {
        const hay =
          `${c.name} ${c.address} ${c.district} ${c.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (userLocation) {
        const da = haversineKm(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const db = haversineKm(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return da - db;
      }
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.score - a.score;
    });
  }, [allCafes, filters, userLocation, onlyFavorites, favorites]);

  const selectedCafe = useMemo(
    () => allCafes.find((c) => c.id === selectedCafeId) ?? null,
    [allCafes, selectedCafeId]
  );

  const handleSelectCafe = useCallback((cafe: Cafe) => {
    setSelectedCafeId(cafe.id);
  }, []);

  const handleAddCheckIn = (cafeId: string, type: CheckInStatusType) => {
    const now = Date.now();
    const newItem: LiveCheckIn = {
      id: `ci-${now}`,
      cafeId,
      type,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + SIX_HOURS_MS).toISOString(),
    };
    const next = [newItem, ...checkIns];
    setCheckIns(next);
    saveCheckIns(next);
  };

  const handleAddCafe = (cafe: Cafe) => {
    const next = [cafe, ...userCafes];
    setUserCafes(next);
    setSelectedCafeId(cafe.id);
    saveUserCafes(next);
  };

  const handleToggleFavorite = (cafeId: string) => {
    const next = favorites.includes(cafeId)
      ? favorites.filter((id) => id !== cafeId)
      : [...favorites, cafeId];
    setFavorites(next);
    saveFavorites(next);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert(
          "Không thể lấy vị trí của bạn. Hãy cấp quyền vị trí trên trình duyệt."
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50">
      <Navbar onOpenAddModal={() => setShowAddModal(true)} />

      <QuickFilterBar
        filters={filters}
        onChange={setFilters}
        onlyFavorites={onlyFavorites}
        onToggleFavorites={() => setOnlyFavorites((v) => !v)}
        favoritesCount={favorites.length}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
      />

      {/* Main Split Workspace */}
      <main className="flex-1 flex relative overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`${
            mobileView === "list" ? "flex" : "hidden"
          } lg:flex flex-col w-full lg:w-[360px] xl:w-[390px] bg-white border-r border-slate-200 z-20 shrink-0 overflow-hidden`}
        >
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/70">
            <span className="font-semibold text-slate-700">
              {filteredCafes.length}/{allCafes.length} quán phù hợp
            </span>
            <span>
              {userLocation
                ? "Sắp xếp: Gần bạn nhất"
                : "Sắp xếp: Điểm chạy deadline"}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredCafes.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  Không tìm thấy quán nào khớp bộ lọc
                </p>
                <p className="text-xs text-slate-500">
                  Thử bỏ bớt 1–2 tiêu chí hoặc chọn “Tất cả quận” nhé!
                </p>
              </div>
            ) : (
              filteredCafes.map((cafe) => {
                const isSelected = cafe.id === selectedCafeId;
                const isFav = favorites.includes(cafe.id);
                const activeCI = checkInsByCafe[cafe.id] || [];
                const latestCI = activeCI[0];
                const dist = userLocation
                  ? haversineKm(
                      userLocation.lat,
                      userLocation.lng,
                      cafe.lat,
                      cafe.lng
                    )
                  : null;

                return (
                  <button
                    key={cafe.id}
                    type="button"
                    onClick={() => {
                      handleSelectCafe(cafe);
                      setMobileView("map");
                    }}
                    className={`w-full text-left p-3.5 transition cursor-pointer hover:bg-slate-50 ${
                      isSelected
                        ? "bg-indigo-50/70 border-l-4 border-l-indigo-600"
                        : "border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm text-slate-900 truncate">
                            {cafe.name}
                          </h3>
                          {cafe.featured && (
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          {isFav && (
                            <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {cafe.district} • {cafe.address}
                        </p>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded-md text-xs font-bold bg-slate-900 text-white">
                        {cafe.score.toFixed(1)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center flex-wrap gap-2 text-[11px] text-slate-600">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Wifi className="w-3 h-3 text-indigo-500" />
                        {cafe.wifiDownload} Mbps
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Plug className="w-3 h-3 text-emerald-600" />
                        {cafe.powerOutlets === "all"
                          ? "Ổ cắm 100%"
                          : cafe.powerOutlets === "scattered"
                          ? "Sát tường"
                          : "Ít ổ cắm"}
                      </span>
                      {cafe.open24h && (
                        <span className="inline-flex items-center gap-1 font-semibold text-violet-700">
                          <Clock className="w-3 h-3" /> 24/7
                        </span>
                      )}
                      <span className="ml-auto font-semibold text-slate-700">
                        {dist != null ? `${dist.toFixed(1)} km` : cafe.priceRange}
                      </span>
                    </div>

                    {latestCI && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                        <Radio className="w-3 h-3 text-rose-500" />
                        <span>
                          {CHECKIN_META[latestCI.type].emoji}{" "}
                          {CHECKIN_META[latestCI.type].shortLabel}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Center: Interactive Map */}
        <section
          className={`${
            mobileView === "map" ? "block" : "hidden"
          } lg:block flex-1 relative h-full`}
        >
          <CafeMap
            cafes={filteredCafes}
            selectedCafeId={selectedCafeId}
            onSelectCafe={handleSelectCafe}
            checkInsByCafe={checkInsByCafe}
            userLocation={userLocation}
          />

          {/* Right Floating Workspace Scorecard */}
          {selectedCafe && (
            <div className="absolute top-3 right-3 bottom-3 w-[calc(100%-24px)] sm:w-[400px] z-[500] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden bg-white">
              <WorkspaceScorecard
                cafe={selectedCafe}
                activeCheckIns={checkInsByCafe[selectedCafe.id] || []}
                onClose={() => setSelectedCafeId(null)}
                onAddCheckIn={handleAddCheckIn}
                isFavorite={favorites.includes(selectedCafe.id)}
                onToggleFavorite={handleToggleFavorite}
                distanceKm={
                  userLocation
                    ? haversineKm(
                        userLocation.lat,
                        userLocation.lng,
                        selectedCafe.lat,
                        selectedCafe.lng
                      )
                    : null
                }
              />
            </div>
          )}
        </section>

        {/* Mobile Map/List Toggle Pill (hidden when scorecard is open on mobile) */}
        {(!selectedCafe || mobileView === "list") && (
          <div className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-[600]">
            <button
              type="button"
              onClick={() =>
                setMobileView((v) => (v === "map" ? "list" : "map"))
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-lg cursor-pointer"
            >
              {mobileView === "map" ? (
                <>
                  <List className="w-4 h-4" />
                  Xem danh sách ({filteredCafes.length})
                </>
              ) : (
                <>
                  <MapIcon className="w-4 h-4" />
                  Xem bản đồ
                </>
              )}
            </button>
          </div>
        )}
      </main>

      {showAddModal && (
        <AddCafeModal
          onClose={() => setShowAddModal(false)}
          onAddCafe={handleAddCafe}
        />
      )}
    </div>
  );
}
