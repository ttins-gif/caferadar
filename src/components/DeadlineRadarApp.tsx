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
  CafeReview,
  CHECKIN_META,
  CheckInStatusType,
  LiveCheckIn,
  QuickFilters,
} from "@/types/cafe";
import {
  addReview,
  deleteCafeById,
  deleteCheckInById,
  deleteReviewById,
  loadActiveCheckIns,
  loadFavorites,
  loadMergedCafes,
  loadReviews,
  loadUserCafes,
  saveCafeOverride,
  saveCheckIns,
  saveFavorites,
  saveUserCafes,
  SIX_HOURS_MS,
} from "@/lib/storage";
import { getStoredRole, UserRole } from "@/lib/auth";
import { getRealtimeOpenStatus } from "@/lib/realtime";
import {
  deleteCloudCafe,
  deleteCloudCheckIn,
  deleteCloudReview,
  fetchCloudCafes,
  fetchCloudCheckIns,
  fetchCloudReviews,
  insertCloudCheckIn,
  insertCloudReview,
  isSupabaseConfigured,
  upsertCloudCafe,
} from "@/lib/supabase";
import Navbar from "./Navbar";
import QuickFilterBar from "./QuickFilterBar";
import WorkspaceScorecard from "./WorkspaceScorecard";
import AddCafeModal from "./AddCafeModal";
import EditCafeModal from "./EditCafeModal";

const CafeMap = dynamic(() => import("./CafeMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500 text-sm">
      Đang tải bản đồ CafeRadar Việt Nam...
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
  const [role, setRole] = useState<UserRole>("user");
  const [allCafes, setAllCafes] = useState<Cafe[]>(SEED_CAFES);
  const [checkIns, setCheckIns] = useState<LiveCheckIn[]>([]);
  const [reviews, setReviews] = useState<CafeReview[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedCafeId, setSelectedCafeId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCafe, setEditingCafe] = useState<Cafe | null>(null);
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
    const syncRole = () => setRole(getStoredRole());
    syncRole();
    setAllCafes(loadMergedCafes(SEED_CAFES));
    setCheckIns(loadActiveCheckIns());
    setReviews(loadReviews());
    setFavorites(loadFavorites());

    // Đồng bộ dữ liệu công khai từ Supabase Database nếu đã cấu hình
    if (isSupabaseConfigured) {
      Promise.all([
        fetchCloudCafes(),
        fetchCloudReviews(),
        fetchCloudCheckIns(),
      ]).then(([cloudCafes, cloudReviews, cloudCheckIns]) => {
        if (cloudCafes.length > 0) {
          const localMerged = loadMergedCafes(SEED_CAFES);
          const map = new Map<string, Cafe>();
          for (const c of [...cloudCafes, ...localMerged]) {
            if (!map.has(c.id)) map.set(c.id, c);
          }
          setAllCafes(Array.from(map.values()));
        }
        if (cloudReviews.length > 0) {
          setReviews(cloudReviews);
        }
        if (cloudCheckIns.length > 0) {
          setCheckIns(cloudCheckIns);
        }
      });
    }

    window.addEventListener("caferadar-role-change", syncRole);

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
    return () => window.removeEventListener("caferadar-role-change", syncRole);
  }, []);

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

    // Tổng hợp dữ liệu Wi-Fi, Ổ cắm, Không gian từ đánh giá thực tế của user cho từng quán
    const reviewsByCafe = new Map<string, CafeReview[]>();
    for (const r of reviews) {
      const arr = reviewsByCafe.get(r.cafeId) ?? [];
      arr.push(r);
      reviewsByCafe.set(r.cafeId, arr);
    }

    const list = allCafes.filter((c) => {
      if (onlyFavorites && !favorites.includes(c.id)) return false;
      if (filters.district !== "ALL" && c.district !== filters.district) {
        return false;
      }

      const cafeRevs = reviewsByCafe.get(c.id) ?? [];

      // Wi-Fi trung bình từ đánh giá user (fallback sang dữ liệu Admin nếu chưa có user đo)
      const wifiVals = cafeRevs
        .map((r) => r.wifiDownload)
        .filter((v): v is number => typeof v === "number" && v > 0);
      const effectiveWifi =
        wifiVals.length > 0
          ? wifiVals.reduce((a, b) => a + b, 0) / wifiVals.length
          : c.wifiDownload;

      // Ổ cắm theo số đông đánh giá user
      const powerVotes = cafeRevs
        .map((r) => r.powerOutlets)
        .filter(Boolean) as Array<"all" | "scattered" | "rare">;
      let effectivePower = c.powerOutlets;
      if (powerVotes.length > 0) {
        const counts = { all: 0, scattered: 0, rare: 0 };
        for (const p of powerVotes) counts[p]++;
        effectivePower = (["all", "scattered", "rare"] as const).sort(
          (a, b) => counts[b] - counts[a]
        )[0];
      }

      // Không gian theo số đông đánh giá user
      const spaceVotes = cafeRevs
        .map((r) => r.spaceRating)
        .filter(Boolean) as Array<"spacious_quiet" | "cozy_moderate" | "small_noisy">;
      let effectiveSpace: "spacious_quiet" | "cozy_moderate" | "small_noisy" | null =
        null;
      if (spaceVotes.length > 0) {
        const counts = { spacious_quiet: 0, cozy_moderate: 0, small_noisy: 0 };
        for (const s of spaceVotes) counts[s]++;
        effectiveSpace = (
          ["spacious_quiet", "cozy_moderate", "small_noisy"] as const
        ).sort((a, b) => counts[b] - counts[a])[0];
      }

      if (filters.powerEveryTable && effectivePower !== "all") return false;
      if (filters.fastWifi && (effectiveWifi == null || effectiveWifi < 50))
        return false;
      if (filters.open24h && !c.open24h) return false;
      if (filters.quietForCalls && effectiveSpace !== "spacious_quiet")
        return false;

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
      return (b.score ?? 0) - (a.score ?? 0);
    });
  }, [allCafes, reviews, filters, userLocation, onlyFavorites, favorites]);

  const selectedCafe = useMemo(
    () => allCafes.find((c) => c.id === selectedCafeId) ?? null,
    [allCafes, selectedCafeId]
  );

  const hasActiveSearchOrFilter =
    filters.search.trim().length > 0 ||
    filters.district !== "ALL" ||
    filters.powerEveryTable ||
    filters.fastWifi ||
    filters.open24h ||
    filters.quietForCalls ||
    filters.ergonomicDesk ||
    filters.stayFriendly ||
    onlyFavorites ||
    Boolean(userLocation);

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
    void insertCloudCheckIn(newItem);
  };

  const handleAddCafe = (cafe: Cafe, firstReview: CafeReview) => {
    const nextUser = [cafe, ...loadUserCafes()];
    saveUserCafes(nextUser);
    setAllCafes((prev) => [cafe, ...prev.filter((c) => c.id !== cafe.id)]);
    setReviews(addReview(firstReview));
    setSelectedCafeId(cafe.id);
    void upsertCloudCafe(cafe);
    void insertCloudReview(firstReview);
  };

  const handleSaveEditedCafe = (updated: Cafe) => {
    saveCafeOverride(updated);
    setAllCafes((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    void upsertCloudCafe(updated);
  };

  const handleDeleteCafe = (cafeId: string) => {
    deleteCafeById(cafeId);
    setAllCafes((prev) => prev.filter((c) => c.id !== cafeId));
    if (selectedCafeId === cafeId) setSelectedCafeId(null);
    void deleteCloudCafe(cafeId);
  };

  const handleDeleteCheckIn = (checkInId: string) => {
    setCheckIns(deleteCheckInById(checkInId));
    void deleteCloudCheckIn(checkInId);
  };

  const handleAddReview = (review: CafeReview) => {
    setReviews(addReview(review));
    void insertCloudReview(review);
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviews(deleteReviewById(reviewId));
    void deleteCloudReview(reviewId);
  };

  const handleToggleFavorite = (cafeId: string) => {
    const next = favorites.includes(cafeId)
      ? favorites.filter((id) => id !== cafeId)
      : [...favorites, cafeId];
    setFavorites(next);
    saveFavorites(next);
  };

  const fallbackToIpLocation = async () => {
    try {
      const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
      if (!res.ok) throw new Error("IP geo failed");
      const data: { latitude?: string; longitude?: string } = await res.json();
      const lat = Number(data.latitude);
      const lng = Number(data.longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        setUserLocation({ lat, lng });
        setIsLocating(false);
        return;
      }
    } catch {
      // ignore
    }
    setIsLocating(false);
    alert(
      "Không thể xác định vị trí tự động. Vui lòng bật quyền Vị trí (Location) cho trình duyệt và thử lại."
    );
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      void fallbackToIpLocation();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        // Nếu GPS trình duyệt bị tắt hoặc không khả dụng trên PC, tự động định vị theo IP
        void fallbackToIpLocation();
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
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
        {/* Left Sidebar: Chỉ hiện khi người dùng tìm kiếm hoặc lọc quán (hoặc bật danh sách trên mobile) */}
        {(hasActiveSearchOrFilter || mobileView === "list") && (
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
              {userLocation ? (
                <button
                  type="button"
                  onClick={() => setUserLocation(null)}
                  className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                >
                  Gần bạn nhất • Tắt Gần tôi
                </button>
              ) : (
                "Sắp xếp: Điểm chạy deadline"
              )}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredCafes.length === 0 ? (
              <div className="p-8 text-center">
                {allCafes.length === 0 ? (
                  <>
                    <p className="text-sm font-bold text-slate-800 mb-1">
                      Chưa có dữ liệu quán được xác thực
                    </p>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      CafeRadar chỉ hiển thị đánh giá thật từ nguồn uy tín (Google Maps, Threads, Facebook) — tuyệt đối không tự chế dữ liệu.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      + Đóng góp quán đầu tiên
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-700 mb-1">
                      Không tìm thấy quán nào khớp bộ lọc
                    </p>
                    <p className="text-xs text-slate-500">
                      Thử bỏ bớt 1–2 tiêu chí hoặc chọn “Tất cả quận” nhé!
                    </p>
                  </>
                )}
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

                const openStatus = getRealtimeOpenStatus(cafe);

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
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          openStatus.isOpen
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {openStatus.isOpen ? "Đang mở" : "Đã đóng"}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center flex-wrap gap-2 text-[11px] text-slate-600">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Wifi className="w-3 h-3 text-indigo-500" />
                        {cafe.wifiDownload != null
                          ? `${cafe.wifiDownload} Mbps`
                          : "Wi-Fi: chưa đo"}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Plug className="w-3 h-3 text-emerald-600" />
                        {cafe.powerOutlets === "all"
                          ? "Ổ cắm 100%"
                          : cafe.powerOutlets === "scattered"
                          ? "Sát tường"
                          : cafe.powerOutlets === "rare"
                          ? "Ít ổ cắm"
                          : "Ổ cắm: chưa đo"}
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
        )}

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
                isAdmin={role === "admin"}
                onEditCafe={(c) => setEditingCafe(c)}
                onDeleteCafe={handleDeleteCafe}
                onDeleteCheckIn={handleDeleteCheckIn}
                reviews={reviews.filter((r) => r.cafeId === selectedCafe.id)}
                onAddReview={handleAddReview}
                onDeleteReview={handleDeleteReview}
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

      {editingCafe && (
        <EditCafeModal
          cafe={editingCafe}
          onClose={() => setEditingCafe(null)}
          onSave={handleSaveEditedCafe}
        />
      )}
    </div>
  );
}
