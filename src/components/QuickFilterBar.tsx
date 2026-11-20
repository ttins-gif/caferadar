"use client";

import React from "react";
import {
  Plug,
  Wifi,
  Clock,
  VolumeX,
  Armchair,
  HeartHandshake,
  Search,
  LocateFixed,
  RotateCcw,
  Bookmark,
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
  "Quận 1",
  "Quận 3",
  "Bình Thạnh",
  "Phú Nhuận",
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
  const activeFilterCount = [
    filters.powerEveryTable,
    filters.fastWifi,
    filters.open24h,
    filters.quietForCalls,
    filters.ergonomicDesk,
    filters.stayFriendly,
    filters.district !== "ALL",
    filters.search.trim().length > 0,
    onlyFavorites,
  ].filter(Boolean).length;

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
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 py-2 flex flex-col gap-2">
        {/* Search + District + Locate + Survival Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {/* Search */}
          <div className="relative w-44 sm:w-56 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              placeholder="Tìm quán, tên đường..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-100 border border-transparent focus:border-indigo-400 focus:bg-white rounded-lg outline-none transition"
            />
          </div>

          {/* District */}
          <select
            value={filters.district}
            onChange={(e) =>
              onChange({
                ...filters,
                district: e.target.value as District | "ALL",
              })
            }
            aria-label="Chọn quận"
            className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200/70 text-slate-700 rounded-lg border border-transparent focus:border-indigo-400 outline-none cursor-pointer shrink-0"
          >
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d === "ALL" ? "Tất cả quận" : d}
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

          <div className="h-5 w-px bg-slate-200 shrink-0 mx-0.5" />

          {/* Quick Filters */}
          <FilterChip
            active={filters.powerEveryTable}
            onClick={() => toggle("powerEveryTable")}
            icon={<Plug className="w-3.5 h-3.5" />}
            label="Ổ cắm từng bàn"
          />
          <FilterChip
            active={filters.fastWifi}
            onClick={() => toggle("fastWifi")}
            icon={<Wifi className="w-3.5 h-3.5" />}
            label="Wi-Fi > 50Mbps"
          />
          <FilterChip
            active={filters.open24h}
            onClick={() => toggle("open24h")}
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Mở 24/7"
          />
          <FilterChip
            active={filters.quietForCalls}
            onClick={() => toggle("quietForCalls")}
            icon={<VolumeX className="w-3.5 h-3.5" />}
            label="Yên tĩnh"
          />
          <FilterChip
            active={filters.ergonomicDesk}
            onClick={() => toggle("ergonomicDesk")}
            icon={<Armchair className="w-3.5 h-3.5" />}
            label="Bàn công thái học"
          />
          <FilterChip
            active={filters.stayFriendly}
            onClick={() => toggle("stayFriendly")}
            icon={<HeartHandshake className="w-3.5 h-3.5" />}
            label="Ngồi lâu thoải mái"
          />
          <FilterChip
            active={onlyFavorites}
            onClick={onToggleFavorites}
            icon={<Bookmark className="w-3.5 h-3.5" />}
            label={`Đã lưu${favoritesCount > 0 ? ` (${favoritesCount})` : ""}`}
          />

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Xóa ({activeFilterCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
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
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition shrink-0 cursor-pointer select-none ${
        active
          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
          : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
