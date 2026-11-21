"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Radar,
  Map as MapIcon,
  LayoutGrid,
  Radio,
  ShieldCheck,
  LogOut,
  Plus,
  LogIn,
  MessageSquareHeart,
  Moon,
  Sun,
} from "lucide-react";
import {
  getCurrentUser,
  getStoredRole,
  logoutUser,
  syncCurrentUserFromCloud,
  UserAccount,
  UserRole,
} from "@/lib/auth";
import AuthModal from "./AuthModal";

interface NavbarProps {
  onOpenAddModal?: () => void;
}

const BASE_NAV_ITEMS = [
  { href: "/", label: "Bản đồ", icon: MapIcon },
  { href: "/danh-sach", label: "Bảng xếp hạng", icon: LayoutGrid },
  { href: "/cong-dong", label: "Live 6h", icon: Radio },
  { href: "/gop-y", label: "Góp ý", icon: MessageSquareHeart },
];

export default function Navbar({ onOpenAddModal }: NavbarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole>("user");
  const [user, setUser] = useState<UserAccount | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("caferadar_theme_v1");
      const isDark = savedTheme === "dark";
      setDarkMode(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    } catch {
      // ignore
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("caferadar_theme_v1", next ? "dark" : "light");
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const sync = () => {
      setRole(getStoredRole());
      setUser(getCurrentUser());
    };
    sync();
    // Đồng bộ hồ sơ từ Supabase khi mở trang trên thiết bị khác
    void syncCurrentUserFromCloud();
    window.addEventListener("caferadar-role-change", sync);
    window.addEventListener("caferadar-auth-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("caferadar-role-change", sync);
      window.removeEventListener("caferadar-auth-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const navItems =
    role === "admin"
      ? [
          ...BASE_NAV_ITEMS,
          { href: "/admin", label: "Quản trị", icon: ShieldCheck },
        ]
      : BASE_NAV_ITEMS;

  return (
    <>
      <nav className="bg-white border-b border-slate-200 z-40 shrink-0 sticky top-0">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <img
              src="/favicon.svg"
              alt="CafeRadar"
              className="w-9 h-9 rounded-xl shadow-sm group-hover:scale-105 transition"
            />
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                  CafeRadar
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Việt Nam
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Bản đồ quán cafe chạy deadline
              </p>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right: Dark Mode + User Account / Login + Add Cafe */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleDarkMode}
              title={darkMode ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối (Dark Mode)"}
              aria-label="Đổi chế độ Sáng/Tối"
              className="p-2 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
            {role === "admin" && (
              <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2 py-1 rounded-lg text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Admin</span>
              </span>
            )}

            {user ? (
              <div className="inline-flex items-center gap-1.5 bg-slate-100 rounded-xl pl-1 pr-2 py-1">
                <Link
                  href="/tai-khoan"
                  className="inline-flex items-center gap-1.5 hover:opacity-80 transition"
                  title="Xem hồ sơ tài khoản"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center overflow-hidden shrink-0">
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
                  <span className="text-xs font-bold text-slate-800 max-w-[90px] truncate hidden sm:inline">
                    {user.displayName}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={logoutUser}
                  title="Đăng xuất"
                  className="p-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-white transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-600" />
                <span>Đăng nhập</span>
              </button>
            )}

            {onOpenAddModal ? (
              <button
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Thêm quán</span>
              </button>
            ) : (
              <Link
                href="/?add=1"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Thêm quán</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
}
