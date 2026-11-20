"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Pencil, Trash2, Radio, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import EditCafeModal from "@/components/EditCafeModal";
import { SEED_CAFES } from "@/data/seedCafes";
import { Cafe, CHECKIN_META, LiveCheckIn } from "@/types/cafe";
import { getStoredRole, UserRole } from "@/lib/auth";
import {
  deleteCafeById,
  deleteCheckInById,
  loadActiveCheckIns,
  loadMergedCafes,
  saveCafeOverride,
} from "@/lib/storage";

export default function AdminDashboardPage() {
  const [role, setRole] = useState<UserRole>("user");
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [checkIns, setCheckIns] = useState<LiveCheckIn[]>([]);
  const [editingCafe, setEditingCafe] = useState<Cafe | null>(null);

  const reloadData = () => {
    setCafes(loadMergedCafes(SEED_CAFES));
    setCheckIns(loadActiveCheckIns());
  };

  useEffect(() => {
    const syncRole = () => setRole(getStoredRole());
    syncRole();
    reloadData();
    window.addEventListener("caferadar-role-change", syncRole);
    return () => window.removeEventListener("caferadar-role-change", syncRole);
  }, []);

  if (role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">
              Khu vực chỉ dành cho Admin
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Vui lòng bấm nút <strong>User</strong> ở góc phải thanh điều hướng và nhập mã khóa Admin để truy cập bảng quản trị.
            </p>
            <Link
              href="/"
              className="inline-block mt-5 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold"
            >
              Quay về bản đồ
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> CafeRadar Admin Panel
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Quản trị quán cafe & đánh giá
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Chỉnh sửa thông số, thêm ưu đãi, cập nhật đánh giá hoặc xóa các quán / check-in không hợp lệ.
          </p>
        </div>

        {/* Cafes Table */}
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Danh sách quán ({cafes.length})
            </h2>
            <Link
              href="/?add=1"
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              + Thêm quán mới
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {cafes.map((cafe) => (
              <div
                key={cafe.id}
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900">
                      {cafe.name}
                    </span>
                    <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {cafe.district}
                    </span>
                    <span className="text-xs text-slate-500">
                      {cafe.priceRange}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {cafe.address}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingCafe(cafe)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Xóa quán "${cafe.name}"?`)) {
                        deleteCafeById(cafe.id);
                        reloadData();
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live Check-ins Moderation */}
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-bold text-slate-900">
              Kiểm duyệt Check-in Live 6h ({checkIns.length})
            </h2>
          </div>
          {checkIns.length === 0 ? (
            <p className="p-5 text-xs text-slate-500">
              Hiện chưa có check-in nào đang hoạt động.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {checkIns.map((ci) => {
                const cafe = cafes.find((c) => c.id === ci.cafeId);
                return (
                  <div
                    key={ci.id}
                    className="px-5 py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">
                        {CHECKIN_META[ci.type].emoji} {CHECKIN_META[ci.type].label}
                      </span>
                      <span className="text-slate-500">
                        {" "}
                        — {cafe?.name ?? ci.cafeId}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckIns(deleteCheckInById(ci.id));
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {editingCafe && (
        <EditCafeModal
          cafe={editingCafe}
          onClose={() => setEditingCafe(null)}
          onSave={(updated) => {
            saveCafeOverride(updated);
            reloadData();
          }}
        />
      )}
    </div>
  );
}
