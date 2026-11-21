"use client";

import React, { useState } from "react";
import {
  X,
  PlusCircle,
  Search,
  MapPin,
  Star,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  Cafe,
  CafeReview,
  District,
  PowerOutletCoverage,
} from "@/types/cafe";
import { getCurrentUser } from "@/lib/auth";

interface AddCafeModalProps {
  onClose: () => void;
  onAddCafe: (cafe: Cafe, firstReview: CafeReview) => void;
}

interface SearchPlaceResult {
  place_id: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
}

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  "TP.HCM": { lat: 10.7769, lng: 106.7009 },
  "Hà Nội": { lat: 21.0285, lng: 105.8542 },
  "Đà Nẵng": { lat: 16.0544, lng: 108.2022 },
  "Khác": { lat: 16.0544, lng: 108.2022 },
};

function detectCity(text: string): District {
  const lower = text.toLowerCase();
  if (lower.includes("hồ chí minh") || lower.includes("ho chi minh") || lower.includes("sài gòn")) {
    return "TP.HCM";
  }
  if (lower.includes("hà nội") || lower.includes("ha noi") || lower.includes("hanoi")) {
    return "Hà Nội";
  }
  if (lower.includes("đà nẵng") || lower.includes("da nang")) {
    return "Đà Nẵng";
  }
  return "TP.HCM";
}

export default function AddCafeModal({ onClose, onAddCafe }: AddCafeModalProps) {
  // Search state (Map / Google Maps lookup)
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchPlaceResult[]>([]);
  const [pickedCoords, setPickedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Cafe fields
  const [name, setName] = useState("");
  const [district, setDistrict] = useState<District>("TP.HCM");
  const [address, setAddress] = useState("");
  const [openHours, setOpenHours] = useState("07:30 – 22:30");
  const [open24h, setOpen24h] = useState(false);
  const [powerOutlets, setPowerOutlets] = useState<string>("");
  const [wifiDownload, setWifiDownload] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [sourceName, setSourceName] = useState("Google Maps");
  const [sourceUrl, setSourceUrl] = useState("");

  // Mandatory first review to publish
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [formError, setFormError] = useState("");

  const handleSearchPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setFormError("");
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=vn&limit=5&addressdetails=1&q=${encodeURIComponent(
        q
      )}`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "vi" },
      });
      const data: SearchPlaceResult[] = await res.json();
      setResults(data);
      if (data.length === 0) {
        setFormError(
          "Không tìm thấy quán khớp trên bản đồ. Bạn có thể thử gõ tên quán + tên đường/quận hoặc tự nhập địa chỉ bên dưới."
        );
      }
    } catch {
      setFormError("Lỗi kết nối tìm kiếm bản đồ. Bạn có thể tự nhập thông tin bên dưới.");
    } finally {
      setSearching(false);
    }
  };

  const handlePickResult = (item: SearchPlaceResult) => {
    const shortName =
      item.name?.trim() || item.display_name.split(",")[0].trim();
    setName(shortName);
    setAddress(item.display_name);
    setDistrict(detectCity(item.display_name));
    setPickedCoords({ lat: Number(item.lat), lng: Number(item.lon) });
    setSourceName("Google Maps");
    setSourceUrl(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${shortName} ${item.display_name}`
      )}`
    );
    setResults([]);
    setFormError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      setFormError("Vui lòng nhập tên quán và địa chỉ.");
      return;
    }
    if (reviewComment.trim().length < 10) {
      setFormError(
        "Bạn phải viết ít nhất 1 đánh giá thực tế (tối thiểu 10 ký tự) thì quán mới được công khai lên bản đồ cho mọi người thấy."
      );
      return;
    }

    const base = CITY_CENTERS[district] ?? { lat: 10.7769, lng: 106.7009 };
    const lat = pickedCoords
      ? pickedCoords.lat
      : base.lat + (Math.random() - 0.5) * 0.01;
    const lng = pickedCoords
      ? pickedCoords.lng
      : base.lng + (Math.random() - 0.5) * 0.01;

    const cafeId = `user-${Date.now()}`;
    const currentUser = getCurrentUser();
    const wifiNum = wifiDownload.trim() ? Number(wifiDownload) : null;
    const powerVal = powerOutlets
      ? (powerOutlets as PowerOutletCoverage)
      : null;

    const newCafe: Cafe = {
      id: cafeId,
      name: name.trim(),
      district,
      address: address.trim(),
      lat,
      lng,
      openHours: open24h ? "Mở cửa 24/7" : openHours.trim() || "07:30 – 22:30",
      open24h,
      score: null,
      powerOutlets: powerVal,
      wifiDownload: wifiNum,
      wifiUpload: null,
      wifiMeasuredAt: wifiNum ? "Vừa đo" : undefined,
      quietForCalls: false,
      ergonomicDesk: false,
      stayFriendly: true,
      priceRange: priceRange.trim() || "Chưa có dữ liệu",
      staffNote: reviewComment.trim(),
      sourceName,
      sourceUrl:
        sourceUrl.trim() ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${name.trim()} ${address.trim()}`
        )}`,
      tags: [sourceName],
    };

    const firstReview: CafeReview = {
      id: `rev-${Date.now()}`,
      cafeId,
      authorId: currentUser?.id,
      authorName: currentUser?.displayName || "Thành viên CafeRadar",
      authorAvatar: currentUser?.avatarUrl,
      rating,
      wifiDownload: wifiNum ?? undefined,
      powerOutlets: powerVal ?? undefined,
      comment: reviewComment.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddCafe(newCafe, firstReview);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Thêm quán của bạn lên CafeRadar
            </h2>
            <p className="text-xs text-slate-500">
              Tìm quán trên bản đồ & viết 1 đánh giá thực tế để công khai
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Step 1: Search cafe on Map / Google Maps */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-900">
                1. Tìm nhanh quán trên bản đồ (Google Maps / Việt Nam)
              </label>
              {searchQuery.trim() && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    searchQuery.trim()
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                >
                  Xem trên Google Maps <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <form onSubmit={handleSearchPlace} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Gõ tên quán + tên đường (vd: Highlands Nguyễn Huệ)"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-indigo-200 bg-white outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-60 inline-flex items-center gap-1"
              >
                {searching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Tìm quán"
                )}
              </button>
            </form>

            {results.length > 0 && (
              <div className="bg-white rounded-lg border border-indigo-200 divide-y divide-slate-100 max-h-40 overflow-y-auto">
                {results.map((item) => (
                  <button
                    key={item.place_id}
                    type="button"
                    onClick={() => handlePickResult(item)}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition cursor-pointer flex items-start gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {item.name || item.display_name.split(",")[0]}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {item.display_name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {pickedCoords && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã lấy đúng tọa độ GPS trên bản đồ ({pickedCoords.lat.toFixed(4)},{" "}
                {pickedCoords.lng.toFixed(4)})
              </div>
            )}
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {formError}
            </div>
          )}

          {/* Step 2: Cafe details + Mandatory first review */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên quán *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tên quán cafe"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tỉnh / Thành phố *
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value as District)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white outline-none"
                >
                  <option value="TP.HCM">TP.HCM</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Khác">Tỉnh / Thành khác</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Địa chỉ cụ thể *
              </label>
              <input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, tên đường, quận/huyện..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giá nước
                </label>
                <input
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  placeholder="VD: 45k–65k"
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wi-Fi (Mbps)
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={wifiDownload}
                  onChange={(e) => setWifiDownload(e.target.value)}
                  placeholder="Chưa đo"
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ổ cắm
                </label>
                <select
                  value={powerOutlets}
                  onChange={(e) => setPowerOutlets(e.target.value)}
                  className="w-full px-2 py-2 text-xs rounded-lg border border-slate-300 bg-white outline-none"
                >
                  <option value="">Chưa đo</option>
                  <option value="all">100% bàn</option>
                  <option value="scattered">Sát tường</option>
                  <option value="rare">Hiếm</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={open24h}
                  onChange={(e) => setOpen24h(e.target.checked)}
                />
                Mở cửa 24/7
              </label>
              {!open24h && (
                <input
                  value={openHours}
                  onChange={(e) => setOpenHours(e.target.value)}
                  placeholder="07:30 – 22:30"
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 outline-none"
                />
              )}
            </div>

            {/* Mandatory First Review Box */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">
                  2. Đánh giá bắt buộc để công khai quán *
                </span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-0.5 cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          s <= rating
                            ? "text-amber-500 fill-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                required
                minLength={10}
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Viết trải nghiệm thực tế của bạn về quán (không gian, Wi-Fi, ổ cắm, nhân viên...) để công khai cho mọi người cùng xem..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 bg-white focus:border-amber-500 outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Đăng quán & Công khai
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
