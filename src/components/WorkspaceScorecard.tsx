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
  Pencil,
  Trash2,
  Star,
  MessageSquarePlus,
} from "lucide-react";
import {
  Cafe,
  CafeReview,
  CHECKIN_META,
  CheckInStatusType,
  LiveCheckIn,
  NoiseLevel,
  PowerOutletCoverage,
} from "@/types/cafe";
import { getRealtimeOpenStatus } from "@/lib/realtime";
import { getCurrentUser } from "@/lib/auth";

interface WorkspaceScorecardProps {
  cafe: Cafe;
  activeCheckIns: LiveCheckIn[];
  onClose: () => void;
  onAddCheckIn: (cafeId: string, type: CheckInStatusType) => void;
  distanceKm?: number | null;
  isFavorite?: boolean;
  onToggleFavorite?: (cafeId: string) => void;
  isAdmin?: boolean;
  onEditCafe?: (cafe: Cafe) => void;
  onDeleteCafe?: (cafeId: string) => void;
  onDeleteCheckIn?: (checkInId: string) => void;
  reviews?: CafeReview[];
  onAddReview?: (review: CafeReview) => void;
  onDeleteReview?: (reviewId: string) => void;
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
  isAdmin = false,
  onEditCafe,
  onDeleteCafe,
  onDeleteCheckIn,
  reviews = [],
  onAddReview,
  onDeleteReview,
}: WorkspaceScorecardProps) {
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState<CheckInStatusType | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(
    null
  );
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewWifi, setReviewWifi] = useState("");
  const [reviewPower, setReviewPower] = useState<string>("");
  const [reviewComment, setReviewComment] = useState("");

  const currentUser = getCurrentUser();

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddReview || !reviewComment.trim()) return;
    onAddReview({
      id: `rev-${Date.now()}`,
      cafeId: cafe.id,
      authorName: currentUser?.displayName || "Thành viên ẩn danh",
      rating: reviewRating,
      wifiDownload: reviewWifi.trim() ? Number(reviewWifi) : undefined,
      powerOutlets: reviewPower
        ? (reviewPower as PowerOutletCoverage)
        : undefined,
      comment: reviewComment.trim(),
      createdAt: new Date().toISOString(),
    });
    setReviewRating(5);
    setReviewWifi("");
    setReviewPower("");
    setReviewComment("");
    setShowReviewForm(false);
  };

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

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of reviews) {
    if (starCounts[r.rating] !== undefined) starCounts[r.rating]++;
  }

  const filteredReviews =
    selectedStarFilter == null
      ? reviews
      : reviews.filter((r) => r.rating === selectedStarFilter);

  // Tự động tổng hợp Wi-Fi & Ổ cắm từ đánh giá thật của cộng đồng
  const wifiReadings = reviews
    .map((r) => r.wifiDownload)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const effectiveWifiDownload =
    wifiReadings.length > 0
      ? Math.round(
          wifiReadings.reduce((a, b) => a + b, 0) / wifiReadings.length
        )
      : cafe.wifiDownload;
  const wifiSourceLabel =
    wifiReadings.length > 0
      ? `Trung bình từ ${wifiReadings.length} người đo`
      : cafe.wifiMeasuredAt
      ? `Đo gần nhất: ${cafe.wifiMeasuredAt}`
      : null;

  const powerVotes = reviews
    .map((r) => r.powerOutlets)
    .filter((v): v is PowerOutletCoverage => Boolean(v));
  let effectivePower: PowerOutletCoverage | null = cafe.powerOutlets;
  if (powerVotes.length > 0) {
    const counts: Record<PowerOutletCoverage, number> = {
      all: 0,
      scattered: 0,
      rare: 0,
    };
    for (const p of powerVotes) counts[p]++;
    effectivePower = (Object.keys(counts) as PowerOutletCoverage[]).sort(
      (a, b) => counts[b] - counts[a]
    )[0];
  }

  const powerInfo = effectivePower
    ? POWER_LABEL[effectivePower]
    : {
        text: "Chưa đo thực tế",
        cls: "text-slate-600 bg-slate-100 border-slate-200",
      };
  const openStatus = getRealtimeOpenStatus(cafe);

  return (
    <div className="bg-white h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-start justify-between gap-3 bg-gradient-to-br from-slate-50 to-white">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {cafe.score != null && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-600 text-white">
                {cafe.score.toFixed(1)} / 10
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${
                openStatus.isOpen
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  openStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                }`}
              />
              {openStatus.label}
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
        {/* Admin Action Bar */}
        {isAdmin && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs">
            <span className="font-bold text-amber-800">Quyền Admin</span>
            <div className="flex items-center gap-1.5">
              {onEditCafe && (
                <button
                  type="button"
                  onClick={() => onEditCafe(cafe)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold hover:bg-amber-100 cursor-pointer"
                >
                  <Pencil className="w-3 h-3" /> Sửa quán
                </button>
              )}
              {onDeleteCafe && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Xóa quán "${cafe.name}" khỏi CafeRadar?`)) {
                      onDeleteCafe(cafe.id);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Xóa quán
                </button>
              )}
            </div>
          </div>
        )}
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
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] opacity-75">
                        {formatTimeRemaining(item.expiresAt)}
                      </span>
                      {isAdmin && onDeleteCheckIn && (
                        <button
                          type="button"
                          onClick={() => onDeleteCheckIn(item.id)}
                          title="Admin: Xóa đánh giá/check-in này"
                          className="p-0.5 rounded hover:bg-rose-200/80 text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Ưu đãi hiện có (chỉ hiển thị khi có ưu đãi xác thực) */}
        {cafe.voucher && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-900">
            <Ticket className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="text-xs">
              <span className="font-bold block">Ưu đãi hiện có</span>
              <span>{cafe.voucher}</span>
            </div>
          </div>
        )}

        {/* 1. Độ ồn theo khung giờ */}
        {cafe.noise && (
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
        )}

        {/* 2. Tốc độ Wi-Fi & 3. Tỷ lệ ổ cắm */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-slate-200 p-3 bg-white">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
              <Wifi className="w-4 h-4 text-indigo-500" />
              <span>Wi-Fi thực tế</span>
            </div>
            {effectiveWifiDownload != null ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900">
                    {effectiveWifiDownload}
                  </span>
                  <span className="text-xs text-slate-500">Mbps ↓</span>
                  {cafe.wifiUpload != null && wifiReadings.length === 0 && (
                    <>
                      <span className="text-sm font-semibold text-slate-600 ml-1">
                        {cafe.wifiUpload}
                      </span>
                      <span className="text-xs text-slate-400">Mbps ↑</span>
                    </>
                  )}
                </div>
                {wifiSourceLabel && (
                  <div className="text-[11px] text-slate-400 mt-1">
                    {wifiSourceLabel}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-slate-500 italic">
                Chưa có số liệu đo thực tế
              </div>
            )}
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
              {powerVotes.length > 0 ? (
                <span>Từ {powerVotes.length} đánh giá thực tế</span>
              ) : (
                <>
                  <Clock className="w-3 h-3" /> {cafe.openHours}
                </>
              )}
            </div>
          </div>
        </section>

        {/* 4. Thái độ nhân viên & Giá nước */}
        <section className="rounded-xl border border-slate-200 p-3.5 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Coffee className="w-4 h-4 text-indigo-500" />
              <span>Giới thiệu quán & Giá nước</span>
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

        {/* 5. Đánh giá từ cộng đồng (User có quyền đánh giá trên mọi quán) */}
        <section className="rounded-xl border border-slate-200 p-3.5 bg-white space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>
                Đánh giá cộng đồng ({reviews.length})
              </span>
            </div>
            {onAddReview && (
              <button
                type="button"
                onClick={() => setShowReviewForm((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                {showReviewForm ? "Đóng" : "Viết đánh giá"}
              </button>
            )}
          </div>

          {showReviewForm && onAddReview && (
            <form
              onSubmit={handleSubmitReview}
              className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs"
            >
              <div className="flex items-center gap-1">
                <span className="text-slate-600 font-semibold mr-1">
                  Đánh giá:
                </span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-0.5 cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= reviewRating
                          ? "text-amber-500 fill-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Hiển thị tự động Tên hiển thị của tài khoản đang đăng nhập */}
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center overflow-hidden shrink-0">
                  {currentUser?.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (currentUser?.displayName?.[0] || "A").toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-slate-500">Đánh giá với tên: </span>
                  <strong className="text-slate-900">
                    {currentUser?.displayName || "Thành viên ẩn danh"}
                  </strong>
                </div>
              </div>

              {/* Chọn mức độ Wi-Fi gợi ý dễ hiểu */}
              <select
                value={reviewWifi}
                onChange={(e) => setReviewWifi(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white outline-none"
              >
                <option value="">Tốc độ Wi-Fi cảm nhận (tùy chọn)</option>
                <option value="15">Yếu / Lag (~15 Mbps)</option>
                <option value="40">Ổn — lướt web, làm việc (~40 Mbps)</option>
                <option value="80">Mạnh — họp Zoom, gửi file mượt (~80 Mbps)</option>
                <option value="150">Cực mạnh — tải file nặng siêu nhanh (~150 Mbps)</option>
              </select>

              <select
                value={reviewPower}
                onChange={(e) => setReviewPower(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white outline-none"
              >
                <option value="">Tình trạng ổ cắm (tùy chọn)</option>
                <option value="all">Ổ cắm đầy đủ (100% bàn)</option>
                <option value="scattered">Rải rác (sát tường)</option>
                <option value="rare">Hiếm ổ cắm</option>
              </select>

              <textarea
                required
                rows={2}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm thực tế của bạn khi ngồi làm việc tại quán..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white outline-none resize-none"
              />

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
              >
                Gửi đánh giá thực tế
              </button>
            </form>
          )}

          {/* Google Maps style Rating Summary (Điểm trung bình + 5 thanh phân bố sao) */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-center shrink-0 min-w-[76px]">
              <div className="text-3xl font-extrabold text-slate-900 leading-none">
                {avgRating != null ? avgRating.toFixed(1) : "—"}
              </div>
              <div className="flex items-center justify-center gap-0.5 mt-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      avgRating != null && s <= Math.round(avgRating)
                        ? "text-amber-500 fill-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                ))}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {reviews.length} đánh giá
              </div>
            </div>

            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = starCounts[star];
                const pct =
                  reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                const active = selectedStarFilter === star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setSelectedStarFilter(active ? null : star)
                    }
                    className={`w-full flex items-center gap-2 text-[11px] group cursor-pointer rounded px-1 py-0.5 transition ${
                      active ? "bg-amber-50" : "hover:bg-slate-100"
                    }`}
                  >
                    <span className="font-semibold text-slate-700 w-3 text-right">
                      {star}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-slate-400 w-5 text-right">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nút lọc đánh giá theo sao giống Google Maps */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedStarFilter(null)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition shrink-0 cursor-pointer ${
                selectedStarFilter === null
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Tất cả ({reviews.length})
            </button>
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() =>
                  setSelectedStarFilter(
                    selectedStarFilter === star ? null : star
                  )
                }
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition shrink-0 cursor-pointer ${
                  selectedStarFilter === star
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50"
                }`}
              >
                <span>{star} ★</span>
                <span className="opacity-75">({starCounts[star]})</span>
              </button>
            ))}
          </div>

          {filteredReviews.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              {reviews.length === 0
                ? "Chưa có đánh giá nào từ người dùng. Hãy bấm “Viết đánh giá” nếu bạn đã ngồi quán này!"
                : `Chưa có bài đánh giá ${selectedStarFilter} sao nào.`}
            </p>
          ) : (
            <div className="space-y-2.5">
              {filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {rev.authorName[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 leading-tight">
                          {rev.authorName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-amber-500 text-[11px] leading-none">
                            {"★".repeat(rev.rating)}
                            <span className="text-slate-300">
                              {"★".repeat(5 - rev.rating)}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(rev.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isAdmin && onDeleteReview && (
                      <button
                        type="button"
                        onClick={() => onDeleteReview(rev.id)}
                        title="Admin: Xóa đánh giá này"
                        className="p-1 rounded hover:bg-rose-100 text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-slate-700 leading-relaxed">{rev.comment}</p>
                  {(rev.wifiDownload || rev.powerOutlets) && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                      {rev.wifiDownload && <span>📶 {rev.wifiDownload} Mbps</span>}
                      {rev.powerOutlets && (
                        <span>
                          🔌{" "}
                          {rev.powerOutlets === "all"
                            ? "Ổ cắm 100%"
                            : rev.powerOutlets === "scattered"
                            ? "Sát tường"
                            : "Hiếm"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
