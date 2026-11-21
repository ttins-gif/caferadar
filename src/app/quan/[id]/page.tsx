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
  Eye,
  Camera,
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
  loadMergedCafes,
  loadReviews,
  saveCheckIns,
  saveFavorites,
  SIX_HOURS_MS,
} from "@/lib/storage";
import { getRealtimeOpenStatus } from "@/lib/realtime";
import { getCurrentUser, getStoredRole } from "@/lib/auth";
import {
  fetchCloudReviews,
  insertCloudCheckIn,
  isSupabaseConfigured,
  recordUniqueCafeView,
} from "@/lib/supabase";

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
  const [allCafes, setAllCafes] = useState<Cafe[]>(SEED_CAFES);
  const [checkIns, setCheckIns] = useState<LiveCheckIn[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [communityPhotos, setCommunityPhotos] = useState<string[]>([]);
  const [justCheckedIn, setJustCheckedIn] = useState<CheckInStatusType | null>(
    null
  );

  useEffect(() => {
    setAllCafes(loadMergedCafes(SEED_CAFES));
    setCheckIns(loadActiveCheckIns());
    setFavorites(loadFavorites());
    setIsAdmin(getStoredRole() === "admin");

    // Lấy ảnh thực tế từ các bài đánh giá của quán
    const collectPhotos = (revs: { cafeId: string; images?: string[] }[]) => {
      const imgs: string[] = [];
      for (const r of revs) {
        if (r.cafeId === params.id && r.images) {
          for (const src of r.images) {
            if (!imgs.includes(src)) imgs.push(src);
          }
        }
      }
      setCommunityPhotos(imgs.slice(0, 4));
    };

    collectPhotos(loadReviews());
    if (isSupabaseConfigured) {
      fetchCloudReviews().then((cloudRevs) => {
        if (cloudRevs.length > 0) collectPhotos(cloudRevs);
      });
    }

    // Ghi nhận 1 lượt mắt xem duy nhất cho mỗi account (mỗi account chỉ tính 1 lần)
    const user = getCurrentUser();
    let viewerId = user?.id;
    if (!viewerId) {
      try {
        viewerId = localStorage.getItem("caferadar_guest_id_v1") || "";
        if (!viewerId) {
          viewerId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          localStorage.setItem("caferadar_guest_id_v1", viewerId);
        }
      } catch {
        viewerId = "guest_anon";
      }
    }
    if (params.id) {
      recordUniqueCafeView(params.id, viewerId).then((count) => {
        setViewCount(count);
      });
    }
  }, [params.id]);

  const cafe = useMemo(() => {
    return allCafes.find((c) => c.id === params.id) ?? null;
  }, [allCafes, params.id]);

  const activeCheckIns = useMemo(() => {
    if (!cafe) return [];
    const now = Date.now();
    return checkIns.filter(
      (c) => c.cafeId === cafe.id && new Date(c.expiresAt).getTime() > now
    );
  }, [checkIns, cafe]);

  const actorId = getCurrentUser()?.id || "guest";
  const hasCheckedInThisCafe =
    !isAdmin &&
    activeCheckIns.some((ci) => (ci.authorId || "guest") === actorId);

  const handleCheckIn = (type: CheckInStatusType) => {
    if (!cafe || hasCheckedInThisCafe) return;
    const now = Date.now();
    const item: LiveCheckIn = {
      id: `ci-${now}`,
      cafeId: cafe.id,
      authorId: actorId,
      type,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + SIX_HOURS_MS).toISOString(),
    };
    const next = [item, ...checkIns];
    setCheckIns(next);
    saveCheckIns(next);
    void insertCloudCheckIn(item);
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
  const openStatus = getRealtimeOpenStatus(cafe);
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
                {cafe.score != null && (
                  <span className="px-2.5 py-1 rounded-lg text-sm font-extrabold bg-indigo-600 text-white">
                    {cafe.score.toFixed(1)} / 10
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    openStatus.isOpen
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      openStatus.isOpen
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-slate-400"
                    }`}
                  />
                  {openStatus.label}
                </span>
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                  {cafe.district}
                </span>
                {viewCount != null && (
                  <span
                    title="Số lượng tài khoản đã xem chi tiết quán này (mỗi tài khoản chỉ tính 1 lần)"
                    className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    {viewCount} lượt xem
                  </span>
                )}
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

        {/* Hình ảnh không gian quán */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
              <Camera className="w-4 h-4 text-indigo-600" />
              <span>Hình ảnh</span>
            </div>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
            >
              Xem thêm ảnh trên Google Maps <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {(() => {
            const gallery = [...(cafe.photos ?? []), ...communityPhotos].slice(
              0,
              4
            );
            if (gallery.length === 0) {
              return (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                  Chưa có ảnh không gian quán được tải lên. Admin có thể cập nhật ảnh trong mục <strong>Sửa quán</strong> hoặc User có thể đính kèm ảnh thực tế khi viết đánh giá!
                </div>
              );
            }
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {gallery.map((src, idx) => (
                  <a
                    key={idx}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 block hover:opacity-95 transition"
                  >
                    <img
                      src={src}
                      alt={`${cafe.name} - Không gian ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            );
          })()}
        </section>

        {/* Metrics Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 mb-2">
              <Wifi className="w-4 h-4 text-indigo-600" /> Tốc độ Wi-Fi thực tế
            </div>
            {cafe.wifiDownload != null ? (
              <>
                <div className="text-2xl font-extrabold text-slate-900">
                  {cafe.wifiDownload}{" "}
                  <span className="text-sm font-medium text-slate-500">
                    Mbps ↓
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Upload: <strong>{cafe.wifiUpload ?? "—"} Mbps</strong>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-500 italic">
                Chưa có số liệu đo thực tế
              </div>
            )}
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
                : cafe.powerOutlets === "rare"
                ? "Hiếm ổ cắm"
                : "Chưa đo thực tế"}
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
          {cafe.noise && (
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
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-xs font-bold uppercase text-slate-500 mb-2">
              Thông tin từ nguồn đối chiếu
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {cafe.staffNote ? `“${cafe.staffNote}”` : "Chưa có ghi chú chi tiết."}
            </p>
            <div className="mt-3 text-xs text-slate-500">
              Nguồn:{" "}
              <a
                href={cafe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-indigo-600 hover:underline"
              >
                {cafe.sourceName} ↗
              </a>
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

          {hasCheckedInThisCafe ? (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              Bạn đã cập nhật tình trạng quán này trong 6 giờ qua (tự mở lại sau khi hết hạn 6 tiếng).
            </div>
          ) : (
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
          )}

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
