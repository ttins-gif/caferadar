"use client";

import React, { useState } from "react";
import { X, Lock, Upload, ShieldCheck, UserPlus, LogIn } from "lucide-react";
import {
  loginAsAdmin,
  loginLocalAccount,
  registerLocalAccount,
} from "@/lib/auth";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

interface AuthModalProps {
  onClose: () => void;
  initialTab?: "login" | "register" | "admin";
}

export default function AuthModal({
  onClose,
  initialTab = "login",
}: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register" | "admin">(initialTab);
  const [error, setError] = useState("");

  // Login state
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regUsername, setRegUsername] = useState("");
  const [regDisplayName, setRegDisplayName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [wantLinkGmail, setWantLinkGmail] = useState(true);
  const [regGmail, setRegGmail] = useState("");
  const [regAvatar, setRegAvatar] = useState<string>("");

  // Admin state
  const [adminPasscode, setAdminPasscode] = useState("");

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setError("Ảnh đại diện tối đa 1MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setRegAvatar(reader.result);
        setError("");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLocalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const res = loginLocalAccount(loginId, loginPassword);
    if (res.ok) {
      onClose();
    } else {
      setError(res.error || "Đăng nhập thất bại.");
    }
  };

  const handleGoogleOAuthRedirect = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError(
        "Chưa cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID (Google Cloud OAuth Client ID) trên Vercel. Hãy thêm biến này trong Vercel → Settings → Environment Variables rồi Redeploy."
      );
      return;
    }
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "token",
      scope: "openid email profile",
      prompt: "select_account",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const res = registerLocalAccount({
      username: regUsername,
      displayName: regDisplayName,
      password: regPassword,
      gmail: wantLinkGmail ? regGmail : undefined,
      avatarUrl: regAvatar || undefined,
    });
    if (res.ok) {
      onClose();
    } else {
      setError(res.error || "Đăng ký thất bại.");
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAsAdmin(adminPasscode)) {
      onClose();
    } else {
      setError("Mã khóa Admin không đúng.");
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Tài khoản CafeRadar
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setError("");
            }}
            className={`py-2.5 inline-flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
              tab === "login"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setError("");
            }}
            className={`py-2.5 inline-flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
              tab === "register"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Đăng ký
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("admin");
              setError("");
            }}
            className={`py-2.5 inline-flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
              tab === "admin"
                ? "border-amber-600 text-amber-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Admin
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* LOGIN TAB */}
          {tab === "login" && (
            <div className="space-y-4">
              {/* Real Google Cloud OAuth 2.0 Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleOAuthRedirect}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700 transition cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
                Đăng nhập bằng Google
              </button>

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-slate-200" />
                <span className="shrink mx-3 text-[11px] text-slate-400 uppercase font-semibold">
                  hoặc tài khoản CafeRadar
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <form onSubmit={handleLocalLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên đăng nhập hoặc Gmail
                  </label>
                  <input
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="username hoặc email@gmail.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition cursor-pointer"
                >
                  Đăng nhập
                </button>
              </form>
            </div>
          )}

          {/* REGISTER TAB */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              {/* Avatar upload */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg flex items-center justify-center overflow-hidden border border-indigo-200 shrink-0">
                  {regAvatar ? (
                    <img
                      src={regAvatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (regDisplayName[0] || regUsername[0] || "U").toUpperCase()
                  )}
                </div>
                <div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Chọn ảnh đại diện
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tùy chọn (tối đa 1MB)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên đăng nhập *{" "}
                  <span className="text-[11px] font-normal text-rose-600">
                    (Không thể đổi sau khi tạo)
                  </span>
                </label>
                <input
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="vd: nguyenvana"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên hiển thị *{" "}
                  <span className="text-[11px] font-normal text-slate-400">
                    (Đổi được sau mỗi 7 ngày)
                  </span>
                </label>
                <input
                  required
                  value={regDisplayName}
                  onChange={(e) => setRegDisplayName(e.target.value)}
                  placeholder="vd: Nguyễn Văn A"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu * (tối thiểu 6 ký tự)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="pt-1 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wantLinkGmail}
                    onChange={(e) => setWantLinkGmail(e.target.checked)}
                  />
                  Liên kết tài khoản Gmail
                </label>
                {wantLinkGmail && (
                  <input
                    type="email"
                    value={regGmail}
                    onChange={(e) => setRegGmail(e.target.value)}
                    placeholder="tenban@gmail.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition cursor-pointer"
              >
                Tạo tài khoản
              </button>
            </form>
          )}

          {/* ADMIN TAB */}
          {tab === "admin" && (
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <Lock className="w-4 h-4 shrink-0" />
                <span>
                  Nhập mã khóa Admin để mở toàn quyền chỉnh sửa quán và xóa đánh giá.
                </span>
              </div>
              <input
                type="password"
                required
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder="Nhập mã khóa Admin..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-none"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold transition cursor-pointer"
              >
                Xác nhận quyền Admin
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
