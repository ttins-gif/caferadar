"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  MapPin,
  Clock,
  Wifi,
  Plug,
  Volume2,
  Coffee,
  Sparkles,
  ExternalLink,
  Radio,
  CheckCircle2,
  Ticket,
  Armchair,
  HeartHandshake,
  VolumeX,
  Bookmark,
  Share2,
  ArrowUpRight,
} from "lucide-react";
import {
  Cafe,
  CHECKIN_META,
  CheckInStatusType,
  LiveCheckIn,
  NoiseLevel,
} from "@/types/cafe";

interface WorkspaceScorecardProps {
  cafe: Cafe;
  activeCheckIns: LiveCheckIn[];
  onClose: () => void;
  onAddCheckIn: (cafeId: string, type: CheckInStatusType) => void;
  distanceKm?: number | null;
  isFavorite?: boolean;
  onToggleFavorite?: (cafeId: string) => void;
}

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

const POWER_LABEL = {
  all: {
    text: "Đầy đủ (100% bàn)",
    cls: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  scattered: {
    text: "Rải rác (chỉ sát tường)",
    cls: "text-amber-700 bg-amber-50 border-amber-200",
  },
  rare: {
    text: "Hiếm ổ cắm",
    cls: "text-rose-700 bg-rose-50 border-rose-200",
  },
};

function formatTimeRemaining(expiresAt: string): string {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return "Đã hết hạn";
  const totalMins = Math.ceil(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours > 0) return `hết hạn sau ${hours}g ${mins}p`;
  return `hết hạn sau ${mins}p`;
}

export default function WorkspaceScorecard({
  cafe,
  activeCheckIns,
  onClose,
  onAddCheckIn,
  distanceKm,
  isFavorite = false,
  onToggleFavorite,
}: WorkspaceScorecardProps) {
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState<CheckInStatusType | null>(
    null
  );
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = `${window.location.origin}/quan/${cafe.id}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckIn = (type: CheckInStatusType) => {
    onAddCheckIn(cafe.id, type);
    setJustCheckedIn(type);
    setShowCheckInPicker(false);
    setTimeout(() => setJustCheckedIn(null), 3000);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${cafe.name} ${cafe.address}`
  )}`;

  const powerInfo = POWER_LABEL[cafe.powerOutlets];

  return (
    <div className="bg-white h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-start justify-between gap-3 bg-gradient-to-br from-slate-50 to-white">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-600 text-white">
              {cafe.score.toFixed(1)} / 10
            </span>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              {cafe.district}
            </span>
            {cafe.open24h && (
              <span className="text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-md">
                Mở 24/7
              </span>
            )}
            {cafe.featured && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                <Sparkles className="w-3 h-3" /> Nổi bật
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-900 leading-snug">
            {cafe.name}
          </h2>
          <p className="text-xs text-slate-500 flex items-start gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
            <span>
              {cafe.address}
              {distanceKm != null && (
                <span className="font-semibold text-indigo-600">
                  {" "}
                  • cách {distanceKm.toFixed(1)} km
                </span>
              )}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thẻ điểm"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Live Crowd-sourced Check-ins (Active 6h) */}
        <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Tình trạng thực tế (Live 6h)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowCheckInPicker((v) => !v)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
            >
              {showCheckInPicker ? "Đóng" : "+ Cập nhật 1 chạm"}
            </button>
          </div>

          {justCheckedIn && (
            <div className="mb-2.5 flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Đã cập nhật "{CHECKIN_META[justCheckedIn].label}" (tự động hết hạn sau 6 tiếng).
            </div>
          )}

          {showCheckInPicker && (
            <div className="mb-3 grid grid-cols-1 gap-1.5 bg-white p-2.5 rounded-lg border border-indigo-100 shadow-xs">
              <p className="text-[11px] text-slate-500 mb-1">
                Bạn đang ngồi ở quán? Bấm 1 chạm để báo cho anh em:
              </p>
              {(Object.keys(CHECKIN_META) as CheckInStatusType[]).map((type) => {
                const meta = CHECKIN_META[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleCheckIn(type)}
                    className="flex items-center gap-2 text-left text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition cursor-pointer"
                  >
                    <span>{meta.emoji}</span>
                    <span className="text-slate-800">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {activeCheckIns.length === 0 ? (
            <p className="text-xs text-slate-500">
              Chưa có báo cáo mới trong 6 giờ qua. Mọi thứ có vẻ bình thường!
            </p>
          ) : (
            <div className="space-y-1.5">
              {activeCheckIns.slice(0, 4).map((item) => {
                const meta = CHECKIN_META[item.type];
                const badgeCls =
                  meta.severity === "alert"
                    ? "bg-rose-50 border-rose-200 text-rose-800"
                    : meta.severity === "warning"
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800";
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${badgeCls}`}
                  >
                    <span className="font-medium">
                      {meta.emoji} {meta.label}
                    </span>
                    <span className="text-[11px] opacity-75 shrink-0">
                      {formatTimeRemaining(item.expiresAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Voucher (if featured) */}
        {cafe.voucher && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
            <Ticket className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold block">Ưu đãi độc quyền</span>
              <span>{cafe.voucher}</span>
            </div>
          </div>
        )}

        {/* 1. Độ ồn theo khung giờ */}
        <section className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Volume2 className="w-4 h-4 text-indigo-500" />
            <span>Độ ồn theo khung giờ</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["Sáng", cafe.noise.morning],
                ["Chiều", cafe.noise.afternoon],
                ["Tối", cafe.noise.evening],
              ] as const
            ).map(([slot, level]) => (
              <div
                key={slot}
                className="rounded-xl border border-slate-200 p-2.5 text-center bg-white"
              >
                <div className="text-[11px] text-slate-500 mb-1">{slot}</div>
                <span
                  className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${NOISE_LABEL[level].cls}`}
                >
                  {NOISE_LABEL[level].text}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Tốc độ Wi-Fi & 3. Tỷ lệ ổ cắm */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-slate-200 p-3 bg-white">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
              <Wifi className="w-4 h-4 text-indigo-500" />
              <span>Wi-Fi thực tế</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900">
                {cafe.wifiDownload}
              </span>
              <span className="text-xs text-slate-500">Mbps ↓</span>
              <span className="text-sm font-semibold text-slate-600 ml-1">
                {cafe.wifiUpload}
              </span>
              <span className="text-xs text-slate-400">Mbps ↑</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Đo gần nhất: {cafe.wifiMeasuredAt}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 bg-white">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
              <Plug className="w-4 h-4 text-indigo-500" />
              <span>Tỷ lệ ổ cắm</span>
            </div>
            <span
              className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-lg border ${powerInfo.cls}`}
            >
              {powerInfo.text}
            </span>
            <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {cafe.openHours}
            </div>
          </div>
        </section>

        {/* 4. Thái độ nhân viên & Giá nước */}
        <section className="rounded-xl border border-slate-200 p-3.5 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Coffee className="w-4 h-4 text-indigo-500" />
              <span>Giá nước & Thái độ nhân viên</span>
            </div>
            <span className="text-sm font-bold text-slate-900">
              {cafe.priceRange}
            </span>
          </div>
          {cafe.staffNote ? (
            <p className="text-sm text-slate-700 leading-relaxed">
              “{cafe.staffNote}”
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Chưa có ghi chú đánh giá chi tiết.
            </p>
          )}
          {cafe.sourceName && (
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>Nguồn:</span>
              {cafe.sourceUrl ? (
                <a
                  href={cafe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  {cafe.sourceName} ↗
                </a>
              ) : (
                <span className="font-semibold text-slate-700">
                  {cafe.sourceName}
                </span>
              )}
            </div>
          )}

          {/* Structured badges */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {cafe.quietForCalls && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                <VolumeX className="w-3 h-3 text-indigo-600" /> Họp online ổn
              </span>
            )}
            {cafe.ergonomicDesk && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                <Armchair className="w-3 h-3 text-indigo-600" /> Bàn cao công thái học
              </span>
            )}
            {cafe.stayFriendly && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                <HeartHandshake className="w-3 h-3 text-indigo-600" /> Không đuổi ngồi lâu
              </span>
            )}
          </div>
        </section>
      </div>

      {/* Footer CTA */}
      <div className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2">
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(cafe.id)}
            title={isFavorite ? "Bỏ lưu quán" : "Lưu quán ruột"}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              isFavorite
                ? "bg-amber-50 border-amber-300 text-amber-600"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Bookmark
              className={`w-4 h-4 ${isFavorite ? "fill-amber-500" : ""}`}
            />
          </button>
        )}
        <button
          type="button"
          onClick={handleShare}
          title="Sao chép link quán"
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <Link
          href={`/quan/${cafe.id}`}
          className="inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
        >
          {copied ? "Đã copy!" : "Chi tiết"}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition"
        >
          <ExternalLink className="w-4 h-4" />
          Chỉ đường
        </a>
      </div>
    </div>
  );
}
