"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Wifi,
  Plug,
  Clock,
  Sparkles,
  Bookmark,
  MapPin,
  ArrowRight,
  Trophy,
  Star,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { SEED_CAFES } from "@/data/seedCafes";
import {
  Cafe,
  CafeReview,
  District,
  PowerOutletCoverage,
  SpaceRating,
} from "@/types/cafe";
import {
  loadFavorites,
  loadMergedCafes,
  loadReviews,
  saveFavorites,
} from "@/lib/storage";
import { getRealtimeOpenStatus } from "@/lib/realtime";
import {
  fetchCloudCafes,
  fetchCloudReviews,
  isSupabaseConfigured,
} from "@/lib/supabase";

type CategoryTab = "all" | "24h" | "fast_wifi" | "quiet" | "favorites";

const SPACE_TEXT: Record<SpaceRating, string> = {
  spacious_quiet: "Rộng rãi, yên tĩnh",
  cozy_moderate: "Ấm cúng, vừa phải",
  small_noisy: "Nhỏ / Hơi ồn",
};

export default function DirectoryPage() {
  const [allCafes, setAllCafes] = useState<Cafe[]>(SEED_CAFES);
  const [reviews, setReviews] = useState<CafeReview[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [tab, setTab] = useState<CategoryTab>("all");
  const [district, setDistrict] = useState<District | "ALL">("ALL");

  useEffect(() => {
    setAllCafes(loadMergedCafes(SEED_CAFES));
    setReviews(loadReviews());
    setFavorites(loadFavorites());

    if (isSupabaseConfigured) {
      Promise.all([fetchCloudCafes(), fetchCloudReviews()]).then(
        ([cloudCafes, cloudReviews]) => {
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
        }
      );
    }
  }, []);

  // Tổng hợp điểm sao, Wi-Fi, ổ cắm, không gian từ đánh giá thật của user
  const enrichedCafes = useMemo(() => {
    const revMap = new Map<string, CafeReview[]>();
    for (const r of reviews) {
      const list = revMap.get(r.cafeId) ?? [];
      list.push(r);
      revMap.set(r.cafeId, list);
    }

    return allCafes.map((cafe) => {
      const cafeRevs = revMap.get(cafe.id) ?? [];
      const reviewCount = cafeRevs.length;
      const avgRating =
        reviewCount > 0
          ? cafeRevs.reduce((s, r) => s + r.rating, 0) / reviewCount
          : null;

      const wifiVals = cafeRevs
        .map((r) => r.wifiDownload)
        .filter((v): v is number => typeof v === "number" && v > 0);
      const effectiveWifi =
        wifiVals.length > 0
          ? Math.round(wifiVals.reduce((a, b) => a + b, 0) / wifiVals.length)
          : cafe.wifiDownload;

      const powerVotes = cafeRevs
        .map((r) => r.powerOutlets)
        .filter(Boolean) as PowerOutletCoverage[];
      let effectivePower: PowerOutletCoverage | null = cafe.powerOutlets;
      if (powerVotes.length > 0) {
        const counts = { all: 0, scattered: 0, rare: 0 };
        for (const p of powerVotes) counts[p]++;
        const keys: PowerOutletCoverage[] = ["all", "scattered", "rare"];
        effectivePower = keys.sort((a, b) => counts[b] - counts[a])[0];
      }

      const spaceVotes = cafeRevs
        .map((r) => r.spaceRating)
        .filter(Boolean) as SpaceRating[];
      let effectiveSpace: SpaceRating | null = null;
      if (spaceVotes.length > 0) {
        const counts = { spacious_quiet: 0, cozy_moderate: 0, small_noisy: 0 };
        for (const s of spaceVotes) counts[s]++;
        const keys: SpaceRating[] = [
          "spacious_quiet",
          "cozy_moderate",
          "small_noisy",
        ];
        effectiveSpace = keys.sort((a, b) => counts[b] - counts[a])[0];
      }

      return {
        cafe,
        reviewCount,
        avgRating,
        effectiveWifi,
        effectivePower,
        effectiveSpace,
      };
    });
  }, [allCafes, reviews]);

  const filtered = useMemo(() => {
    return enrichedCafes
      .filter((item) => {
        if (district !== "ALL" && item.cafe.district !== district) return false;
        if (tab === "24h") return item.cafe.open24h;
        if (tab === "fast_wifi")
          return item.effectiveWifi != null && item.effectiveWifi >= 50;
        if (tab === "quiet") return item.effectiveSpace === "spacious_quiet";
        if (tab === "favorites") return favorites.includes(item.cafe.id);
        return true;
      })
      .sort((a, b) => {
        // Chỉ xếp hạng theo đánh giá sao thật của user; quán chưa có đánh giá xếp phía dưới
        if (a.avgRating != null && b.avgRating == null) return -1;
        if (a.avgRating == null && b.avgRating != null) return 1;
        if (a.avgRating != null && b.avgRating != null) {
          if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
          if (b.reviewCount !== a.reviewCount)
            return b.reviewCount - a.reviewCount;
        }
        return a.cafe.name.localeCompare(b.cafe.name, "vi");
      });
  }, [enrichedCafes, tab, district, favorites]);

  const toggleFav = (id: string) => {
    const next = favorites.includes(id)
      ? favorites.filter((x) => x !== id)
      : [...favorites, id];
    setFavorites(next);
    saveFavorites(next);
  };

  let rankCounter = 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-2">
              <Trophy className="w-3.5 h-3.5" /> Bảng xếp hạng CafeRadar Việt Nam
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Bảng xếp hạng theo đánh giá sao thực tế
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Thứ hạng được tính hoàn toàn từ đánh giá sao thật của cộng đồng — quán chưa có đánh giá sẽ không bị xếp hạng tự ý.
            </p>
          </div>

          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value as District | "ALL")}
            className="px-3.5 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-xl shadow-xs outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả tỉnh/thành</option>
            <option value="Hà Nội">Hà Nội</option>
            <option value="Đà Nẵng">Đà Nẵng</option>
            <option value="TP.HCM">TP.HCM</option>
          </select>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 mb-4">
          {(
            [
              ["all", "Tất cả quán"],
              ["24h", "Mở 24/7 xuyên đêm"],
              ["fast_wifi", "Wi-Fi > 50Mbps"],
              ["quiet", "Rộng rãi, yên tĩnh"],
              ["favorites", `Quán đã lưu (${favorites.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition shrink-0 cursor-pointer ${
                tab === key
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="font-semibold text-slate-700">
              Chưa có quán nào trong mục này.
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Hãy thử chọn bộ lọc khác hoặc quay lại bản đồ để viết đánh giá cho quán nhé!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => {
              const {
                cafe,
                avgRating,
                reviewCount,
                effectiveWifi,
                effectivePower,
                effectiveSpace,
              } = item;
              const isFav = favorites.includes(cafe.id);
              const openStatus = getRealtimeOpenStatus(cafe);
              const rank = avgRating != null ? ++rankCounter : null;

              return (
                <div
                  key={cafe.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md hover:border-indigo-200 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {rank != null ? (
                          <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-amber-500 text-white">
                            #{rank}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-500">
                            Chưa xếp hạng
                          </span>
                        )}
                        {avgRating != null && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            {avgRating.toFixed(1)} ({reviewCount})
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                            openStatus.isOpen
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {openStatus.isOpen ? "Đang mở" : "Đã đóng"}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {cafe.district}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFav(cafe.id)}
                        aria-label="Lưu quán"
                        className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0"
                      >
                        <Bookmark
                          className={`w-4 h-4 ${
                            isFav
                              ? "text-amber-500 fill-amber-500"
                              : "text-slate-400"
                          }`}
                        />
                      </button>
                    </div>

                    <Link
                      href={`/quan/${cafe.id}`}
                      className="text-base font-bold text-slate-900 hover:text-indigo-600 transition line-clamp-1"
                    >
                      {cafe.name}
                    </Link>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {cafe.address}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                      <div className="bg-slate-50 rounded-lg p-2 flex items-center gap-1.5">
                        <Wifi className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="font-semibold text-slate-800">
                          {effectiveWifi != null
                            ? `${effectiveWifi} Mbps`
                            : "Chưa đo"}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 flex items-center gap-1.5">
                        <Plug className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-800">
                          {effectivePower === "all"
                            ? "Ổ cắm 100%"
                            : effectivePower === "scattered"
                            ? "Sát tường"
                            : effectivePower === "rare"
                            ? "Hiếm ổ cắm"
                            : "Chưa đo"}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                        <span className="font-medium text-slate-700 truncate">
                          {cafe.open24h ? "Mở 24/7" : cafe.openHours}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-medium text-slate-700 truncate">
                          {effectiveSpace
                            ? SPACE_TEXT[effectiveSpace]
                            : "Chưa đánh giá"}
                        </span>
                      </div>
                    </div>

                    {cafe.staffNote && (
                      <p className="text-xs text-slate-600 mt-3 line-clamp-2 italic">
                        “{cafe.staffNote}”
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {cafe.priceRange}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/?cafe=${cafe.id}`}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                      >
                        Xem bản đồ
                      </Link>
                      <Link
                        href={`/quan/${cafe.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        Chi tiết <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
