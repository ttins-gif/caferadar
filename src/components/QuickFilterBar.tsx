"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Plug,
  Wifi,
  Clock,
  VolumeX,
  Search,
  LocateFixed,
  RotateCcw,
  Bookmark,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { District, QuickFilters } from "@/types/cafe";

interface QuickFilterBarProps {
  filters: QuickFilters;
  onChange: (next: QuickFilters) => void;
  onlyFavorites: boolean;
  onToggleFavorites: () => void;
  favoritesCount: number;
  onLocateMe: () => void;
  isLocating: boolean;
}

const DISTRICTS: Array<District | "ALL"> = [
  "ALL",
  "Hà Nội",
  "Đà Nẵng",
  "TP.HCM",
];

export default function QuickFilterBar({
  filters,
  onChange,
  onlyFavorites,
  onToggleFavorites,
  favoritesCount,
  onLocateMe,
  isLocating,
}: QuickFilterBarProps) {
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dropdownFilterCount = [
    filters.powerEveryTable,
    filters.fastWifi,
    filters.open24h,
    filters.quietForCalls,
    onlyFavorites,
  ].filter(Boolean).length;

  const totalActiveCount =
    dropdownFilterCount +
    (filters.district !== "ALL" ? 1 : 0) +
    (filters.search.trim().length > 0 ? 1 : 0);

  const toggle = (key: keyof QuickFilters) => {
    onChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  const resetFilters = () => {
    if (onlyFavorites) onToggleFavorites();
    onChange({
      powerEveryTable: false,
      fastWifi: false,
      open24h: false,
      quietForCalls: false,
      ergonomicDesk: false,
      stayFriendly: false,
      district: "ALL",
      search: "",
    });
  };

  return (
    <div className="bg-white border-b border-slate-200 shadow-xs z-30 shrink-0">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 py-2 flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Tìm quán, tên đường..."
            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-100 border border-transparent focus:border-indigo-400 focus:bg-white rounded-lg outline-none transition"
          />
        </div>

        {/* Province/City */}
        <select
          value={filters.district}
          onChange={(e) =>
            onChange({
              ...filters,
              district: e.target.value as District | "ALL",
            })
          }
          aria-label="Chọn tỉnh/thành"
          className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200/70 text-slate-700 rounded-lg border border-transparent focus:border-indigo-400 outline-none cursor-pointer shrink-0"
        >
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d === "ALL" ? "Tất cả tỉnh/thành" : d}
            </option>
          ))}
        </select>

        {/* GPS Locate */}
        <button
          type="button"
          onClick={onLocateMe}
          disabled={isLocating}
          title="Tìm quán gần tôi nhất"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer shrink-0 disabled:opacity-60"
        >
          <LocateFixed
            className={`w-3.5 h-3.5 text-indigo-600 ${
              isLocating ? "animate-spin" : ""
            }`}
          />
          <span>Gần tôi</span>
        </button>

        {/* Unified "Bộ lọc" Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpenMenu((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              dropdownFilterCount > 0 || openMenu
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>
              Bộ lọc{dropdownFilterCount > 0 ? ` (${dropdownFilterCount})` : ""}
            </span>
          </button>

          {openMenu && (
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-[700] space-y-1">
              <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Lọc theo đánh giá thực tế
              </div>

              <FilterMenuItem
                active={filters.powerEveryTable}
                onClick={() => toggle("powerEveryTable")}
                icon={<Plug className="w-3.5 h-3.5 text-emerald-600" />}
                label="Ổ cắm từng bàn (100%)"
              />
              <FilterMenuItem
                active={filters.fastWifi}
                onClick={() => toggle("fastWifi")}
                icon={<Wifi className="w-3.5 h-3.5 text-indigo-600" />}
                label="Wi-Fi > 50Mbps"
              />
              <FilterMenuItem
                active={filters.open24h}
                onClick={() => toggle("open24h")}
                icon={<Clock className="w-3.5 h-3.5 text-violet-600" />}
                label="Mở 24/7"
              />
              <FilterMenuItem
                active={filters.quietForCalls}
                onClick={() => toggle("quietForCalls")}
                icon={<VolumeX className="w-3.5 h-3.5 text-slate-600" />}
                label="Không gian rộng rãi, yên tĩnh"
              />
              <div className="my-1 border-t border-slate-100" />
              <FilterMenuItem
                active={onlyFavorites}
                onClick={onToggleFavorites}
                icon={<Bookmark className="w-3.5 h-3.5 text-amber-500" />}
                label={`Quán đã lưu${favoritesCount > 0 ? ` (${favoritesCount})` : ""}`}
              />
            </div>
          )}
        </div>

        {totalActiveCount > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Xóa lọc ({totalActiveCount})
          </button>
        )}
      </div>
    </div>
  );
}

function FilterMenuItem({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </span>
      {active && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
    </button>
  );
}
