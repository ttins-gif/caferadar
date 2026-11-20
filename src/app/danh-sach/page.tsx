"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Wifi,
  Plug,
  Clock,
  VolumeX,
  Sparkles,
  Bookmark,
  MapPin,
  ArrowRight,
  Trophy,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { SEED_CAFES } from "@/data/seedCafes";
import { Cafe, District } from "@/types/cafe";
import { loadFavorites, loadUserCafes, saveFavorites } from "@/lib/storage";

type CategoryTab = "all" | "24h" | "fast_wifi" | "quiet" | "favorites";

export default function DirectoryPage() {
  const [userCafes, setUserCafes] = useState<Cafe[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [tab, setTab] = useState<CategoryTab>("all");
  const [district, setDistrict] = useState<District | "ALL">("ALL");

  useEffect(() => {
    setUserCafes(loadUserCafes());
    setFavorites(loadFavorites());
  }, []);

  const allCafes = useMemo(() => [...userCafes, ...SEED_CAFES], [userCafes]);

  const filtered = useMemo(() => {
    return allCafes
      .filter((c) => {
        if (district !== "ALL" && c.district !== district) return false;
        if (tab === "24h") return c.open24h;
        if (tab === "fast_wifi") return c.wifiDownload >= 80;
        if (tab === "quiet") return c.quietForCalls;
        if (tab === "favorites") return favorites.includes(c.id);
        return true;
      })
      .sort((a, b) => b.score - a.score);
  }, [allCafes, tab, district, favorites]);

  const toggleFav = (id: string) => {
    const next = favorites.includes(id)
      ? favorites.filter((x) => x !== id)
      : [...favorites, id];
    setFavorites(next);
    saveFavorites(next);
  };

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
              Top quán cafe chạy deadline đáng ngồi nhất
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Đánh giá hoàn toàn bằng thông số thực tế: tốc độ Wi-Fi, tỷ lệ ổ cắm và độ ồn theo khung giờ.
            </p>
          </div>

          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value as District | "ALL")}
            className="px-3.5 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-xl shadow-xs outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả khu vực</option>
            <option value="Quận 1">Quận 1</option>
            <option value="Quận 3">Quận 3</option>
            <option value="Bình Thạnh">Bình Thạnh</option>
            <option value="Phú Nhuận">Phú Nhuận</option>
          </select>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 mb-4">
          {(
            [
              ["all", "Tất cả quán"],
              ["24h", "Mở 24/7 xuyên đêm"],
              ["fast_wifi", "Wi-Fi cực mạnh (≥80Mbps)"],
              ["quiet", "Yên tĩnh họp online"],
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
              Hãy thử chọn bộ lọc khác hoặc quay lại bản đồ để lưu quán ruột nhé!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((cafe, index) => {
              const isFav = favorites.includes(cafe.id);
              return (
                <div
                  key={cafe.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md hover:border-indigo-200 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-slate-400">
                          #{index + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-600 text-white">
                          {cafe.score.toFixed(1)}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {cafe.district}
                        </span>
                        {cafe.featured && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                            <Sparkles className="w-3 h-3" /> Nổi bật
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFav(cafe.id)}
                        aria-label="Lưu quán"
                        className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
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
                          {cafe.wifiDownload} Mbps
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 flex items-center gap-1.5">
                        <Plug className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-800">
                          {cafe.powerOutlets === "all"
                            ? "Ổ cắm 100%"
                            : "Sát tường"}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                        <span className="font-medium text-slate-700 truncate">
                          {cafe.open24h ? "Mở 24/7" : cafe.openHours}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 flex items-center gap-1.5">
                        <VolumeX className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-medium text-slate-700">
                          {cafe.quietForCalls ? "Họp online ổn" : "Hơi ồn chiều"}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-3 line-clamp-2 italic">
                      “{cafe.staffNote}”
                    </p>
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
