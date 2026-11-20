"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Wifi,
  Plug,
  Clock,
  Volume2,
  Coffee,
  ExternalLink,
  Radio,
  Ticket,
  Sparkles,
  Bookmark,
  CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { SEED_CAFES } from "@/data/seedCafes";
import {
  Cafe,
  CHECKIN_META,
  CheckInStatusType,
  LiveCheckIn,
  NoiseLevel,
} from "@/types/cafe";
import {
  loadActiveCheckIns,
  loadFavorites,
  loadUserCafes,
  saveCheckIns,
  saveFavorites,
  SIX_HOURS_MS,
} from "@/lib/storage";

const NOISE_LABEL: Record<NoiseLevel, { text: string; cls: string }> = {
  quiet: {
    text: "Yên tĩnh",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  moderate: {
    text: "Hơi ồn",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  busy: {
    text: "Đông",
    cls: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export default function CafeDetailPage() {
  const params = useParams<{ id: string }>();
  const [userCafes, setUserCafes] = useState<Cafe[]>([]);
  const [checkIns, setCheckIns] = useState<LiveCheckIn[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [justCheckedIn, setJustCheckedIn] = useState<CheckInStatusType | null>(
    null
  );

  useEffect(() => {
    setUserCafes(loadUserCafes());
    setCheckIns(loadActiveCheckIns());
    setFavorites(loadFavorites());
  }, []);

  const cafe = useMemo(() => {
    const all = [...userCafes, ...SEED_CAFES];
    return all.find((c) => c.id === params.id) ?? null;
  }, [userCafes, params.id]);

  const activeCheckIns = useMemo(() => {
    if (!cafe) return [];
    const now = Date.now();
    return checkIns.filter(
      (c) => c.cafeId === cafe.id && new Date(c.expiresAt).getTime() > now
    );
  }, [checkIns, cafe]);

  const handleCheckIn = (type: CheckInStatusType) => {
    if (!cafe) return;
    const now = Date.now();
    const item: LiveCheckIn = {
      id: `ci-${now}`,
      cafeId: cafe.id,
      type,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + SIX_HOURS_MS).toISOString(),
    };
    const next = [item, ...checkIns];
    setCheckIns(next);
    saveCheckIns(next);
    setJustCheckedIn(type);
    setTimeout(() => setJustCheckedIn(null), 3000);
  };

  const toggleFav = () => {
    if (!cafe) return;
    const next = favorites.includes(cafe.id)
      ? favorites.filter((x) => x !== cafe.id)
      : [...favorites, cafe.id];
    setFavorites(next);
    saveFavorites(next);
  };

  if (!cafe) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md">
            <h1 className="text-lg font-bold text-slate-900">
              Không tìm thấy quán cafe này
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Quán có thể chưa được thêm vào hệ thống CafeRadar.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Quay về bản đồ
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isFav = favorites.includes(cafe.id);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${cafe.name} ${cafe.address}`
  )}`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/danh-sach"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </Link>
          <Link
            href={`/?cafe=${cafe.id}`}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Mở vị trí trên bản đồ →
          </Link>
        </div>

        {/* Hero Card */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="px-2.5 py-1 rounded-lg text-sm font-extrabold bg-indigo-600 text-white">
                  {cafe.score.toFixed(1)} / 10
                </span>
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                  {cafe.district}
                </span>
                {cafe.open24h && (
                  <span className="text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-lg">
                    Mở 24/7
                  </span>
                )}
                {cafe.featured && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg">
                    <Sparkles className="w-3.5 h-3.5" /> Quán nổi bật
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {cafe.name}
              </h1>
              <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                {cafe.address}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFav}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition cursor-pointer ${
                  isFav
                    ? "bg-amber-50 border-amber-300 text-amber-700"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${isFav ? "fill-amber-500" : ""}`}
                />
                {isFav ? "Đã lưu" : "Lưu quán"}
              </button>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition"
              >
                <ExternalLink className="w-4 h-4" /> Chỉ đường
              </a>
            </div>
          </div>

          {cafe.voucher && (
            <div className="mt-4 flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
              <Ticket className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Ưu đãi CafeRadar: </span>
                {cafe.voucher}
              </div>
            </div>
          )}
        </section>

        {/* Metrics Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 mb-2">
              <Wifi className="w-4 h-4 text-indigo-600" /> Tốc độ Wi-Fi thực tế
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {cafe.wifiDownload} <span className="text-sm font-medium text-slate-500">Mbps ↓</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Upload: <strong>{cafe.wifiUpload} Mbps</strong> • Đo {cafe.wifiMeasuredAt}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 mb-2">
              <Plug className="w-4 h-4 text-emerald-600" /> Tỷ lệ ổ cắm
            </div>
            <div className="text-lg font-extrabold text-slate-900">
              {cafe.powerOutlets === "all"
                ? "Đầy đủ (100% bàn)"
                : cafe.powerOutlets === "scattered"
                ? "Rải rác (sát tường)"
                : "Hiếm ổ cắm"}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {cafe.openHours}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 mb-2">
              <Coffee className="w-4 h-4 text-amber-600" /> Giá nước trung bình
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {cafe.priceRange}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {cafe.stayFriendly ? "Ngồi lâu thoải mái" : "Nên gọi thêm nước"}
            </div>
          </div>
        </section>

        {/* Noise + Staff Note */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 mb-3">
              <Volume2 className="w-4 h-4 text-indigo-600" /> Độ ồn theo khung giờ
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["Sáng", cafe.noise.morning],
                  ["Chiều", cafe.noise.afternoon],
                  ["Tối", cafe.noise.evening],
                ] as const
              ).map(([slot, lvl]) => (
                <div
                  key={slot}
                  className="rounded-xl border border-slate-200 p-3 text-center"
                >
                  <div className="text-xs text-slate-500 mb-1">{slot}</div>
                  <span
                    className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border ${NOISE_LABEL[lvl].cls}`}
                  >
                    {NOISE_LABEL[lvl].text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-xs font-bold uppercase text-slate-500 mb-2">
              Ghi chú thực tế từ cộng đồng
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              “{cafe.staffNote}”
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {cafe.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Live 6h Check-in */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-bold text-slate-900">
              Cập nhật tình trạng thực tế (Tự động hết hạn sau 6 tiếng)
            </h2>
          </div>

          {justCheckedIn && (
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
              Đã cập nhật "{CHECKIN_META[justCheckedIn].label}"!
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {(Object.keys(CHECKIN_META) as CheckInStatusType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleCheckIn(type)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                <span>{CHECKIN_META[type].emoji}</span>
                <span>{CHECKIN_META[type].label}</span>
              </button>
            ))}
          </div>

          {activeCheckIns.length === 0 ? (
            <p className="text-xs text-slate-500">
              Chưa có check-in nào trong 6 tiếng gần nhất.
            </p>
          ) : (
            <div className="space-y-2">
              {activeCheckIns.map((ci) => (
                <div
                  key={ci.id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <span className="font-semibold text-slate-800">
                    {CHECKIN_META[ci.type].emoji} {CHECKIN_META[ci.type].label}
                  </span>
                  <span className="text-slate-400">
                    {new Date(ci.createdAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
