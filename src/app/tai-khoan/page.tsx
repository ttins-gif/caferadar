"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Lock,
  Upload,
  Mail,
  CheckCircle2,
  Clock,
  LogOut,
  Save,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  canChangeDisplayName,
  getCurrentUser,
  linkUserGmail,
  logoutUser,
  updateDisplayName,
  updateUserAvatar,
  UserAccount,
} from "@/lib/auth";

export default function AccountProfilePage() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [gmailInput, setGmailInput] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const syncUser = () => {
    const current = getCurrentUser();
    setUser(current);
    if (current) {
      setDisplayName(current.displayName);
      setGmailInput(current.gmail || "");
    }
  };

  useEffect(() => {
    syncUser();
    window.addEventListener("caferadar-auth-change", syncUser);
    return () => window.removeEventListener("caferadar-auth-change", syncUser);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md shadow-xs">
            <h1 className="text-lg font-bold text-slate-900">
              Bạn chưa đăng nhập
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Hãy bấm nút <strong>Đăng nhập</strong> ở góc phải để đăng nhập bằng Google hoặc tạo tài khoản CafeRadar.
            </p>
            <Link
              href="/"
              className="inline-block mt-5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
            >
              Quay về bản đồ
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const nameCooldown = canChangeDisplayName(user);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setMessage({ type: "error", text: "Ảnh đại diện tối đa 1MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateUserAvatar(reader.result);
        setMessage({ type: "success", text: "Đã cập nhật ảnh đại diện!" });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDisplayName = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateDisplayName(displayName);
    if (res.ok) {
      setMessage({
        type: "success",
        text: "Đã đổi tên hiển thị! Lần đổi tiếp theo sẽ mở sau 7 ngày.",
      });
    } else {
      setMessage({ type: "error", text: res.error || "Không thể đổi tên." });
    }
  };

  const handleLinkGmail = (e: React.FormEvent) => {
    e.preventDefault();
    const res = linkUserGmail(gmailInput);
    if (res.ok) {
      setMessage({ type: "success", text: "Đã liên kết Gmail thành công!" });
    } else {
      setMessage({ type: "error", text: res.error || "Liên kết Gmail thất bại." });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Hồ sơ tài khoản
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý ảnh đại diện, tên hiển thị và liên kết Gmail
            </p>
          </div>
          <button
            type="button"
            onClick={logoutUser}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Đăng xuất
          </button>
        </div>

        {message && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-700"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Avatar & Immutable Username */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-600 text-white text-2xl font-bold flex items-center justify-center overflow-hidden border-2 border-indigo-100 shrink-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.displayName[0]?.toUpperCase() || "U"
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {user.displayName}
              </h2>
              <p className="text-xs text-slate-500">
                @{user.username} •{" "}
                {user.provider === "google"
                  ? "Đăng nhập bằng Google"
                  : "Tài khoản CafeRadar"}
              </p>
              <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Đổi ảnh đại diện
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Immutable Username */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Tên đăng nhập (Cố định — không thể thay đổi)
            </label>
            <input
              disabled
              value={user.username}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
            />
          </div>

          {/* Display Name with 7-day rule */}
          <form onSubmit={handleSaveDisplayName} className="space-y-2.5">
            <label className="block text-xs font-semibold text-slate-700">
              Tên hiển thị (Được đổi sau mỗi 7 ngày)
            </label>
            <div className="flex gap-2">
              <input
                disabled={!nameCooldown.allowed}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none text-sm disabled:bg-slate-100 disabled:text-slate-500"
              />
              <button
                type="submit"
                disabled={!nameCooldown.allowed}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-3.5 h-3.5" /> Lưu tên
              </button>
            </div>
            {!nameCooldown.allowed && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                Bạn vừa đổi tên hiển thị gần đây. Bạn có thể đổi tiếp sau{" "}
                <strong>{nameCooldown.remainingText}</strong>.
              </p>
            )}
          </form>
        </section>

        {/* Linked Gmail */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Liên kết Gmail
            </h2>
          </div>
          {user.gmail ? (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl font-semibold">
              ✓ Đã liên kết với Gmail: {user.gmail}
            </div>
          ) : (
            <form onSubmit={handleLinkGmail} className="flex gap-2">
              <input
                type="email"
                required
                value={gmailInput}
                onChange={(e) => setGmailInput(e.target.value)}
                placeholder="Nhập Gmail của bạn (vd: tenban@gmail.com)"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                Liên kết
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
