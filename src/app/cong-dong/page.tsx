"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Radio, MapPin, Clock, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { SEED_CAFES } from "@/data/seedCafes";
import { Cafe, CHECKIN_META, LiveCheckIn } from "@/types/cafe";
import { loadActiveCheckIns, loadUserCafes } from "@/lib/storage";

export default function CommunityLivePage() {
  const [userCafes, setUserCafes] = useState<Cafe[]>([]);
  const [checkIns, setCheckIns] = useState<LiveCheckIn[]>([]);

  useEffect(() => {
    setUserCafes(loadUserCafes());
    setCheckIns(loadActiveCheckIns());
  }, []);

  const cafeMap = useMemo(() => {
    const map: Record<string, Cafe> = {};
    for (const c of [...userCafes, ...SEED_CAFES]) {
      map[c.id] = c;
    }
    return map;
  }, [userCafes]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full mb-2">
            <Radio className="w-3.5 h-3.5" /> Bản tin Live 6h
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Tình trạng thực tế các quán ngay lúc này
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Mọi cập nhật từ cộng đồng CafeRadar tự động hết hạn sau 6 tiếng để đảm bảo thông tin luôn mới nhất.
          </p>
        </div>

        {checkIns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <p className="font-semibold text-slate-700">
              Chưa có báo cáo mới trong 6 giờ qua.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
            >
              Mở bản đồ để check-in quán bạn đang ngồi
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {checkIns.map((ci) => {
              const cafe = cafeMap[ci.cafeId];
              if (!cafe) return null;
              const meta = CHECKIN_META[ci.type];
              const badgeCls =
                meta.severity === "alert"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : meta.severity === "warning"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200";

              return (
                <div
                  key={ci.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-200 transition"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeCls}`}
                      >
                        {meta.emoji} {meta.label}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ci.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <Link
                      href={`/quan/${cafe.id}`}
                      className="font-bold text-slate-900 hover:text-indigo-600 transition"
                    >
                      {cafe.name}
                    </Link>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {cafe.district} • {cafe.address}
                    </p>
                  </div>

                  <Link
                    href={`/?cafe=${cafe.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 shrink-0"
                  >
                    Xem trên bản đồ <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
