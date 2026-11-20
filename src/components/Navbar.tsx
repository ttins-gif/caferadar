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
  User,
  LogOut,
  Plus,
  X,
  Lock,
} from "lucide-react";
import {
  getStoredRole,
  loginAsAdmin,
  logoutAdmin,
  UserRole,
} from "@/lib/auth";

interface NavbarProps {
  onOpenAddModal?: () => void;
}

const BASE_NAV_ITEMS = [
  { href: "/", label: "Bản đồ", icon: MapIcon },
  { href: "/danh-sach", label: "Bảng xếp hạng", icon: LayoutGrid },
  { href: "/cong-dong", label: "Live 6h", icon: Radio },
];

export default function Navbar({ onOpenAddModal }: NavbarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole>("user");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const sync = () => setRole(getStoredRole());
    sync();
    window.addEventListener("caferadar-role-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("caferadar-role-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAsAdmin(passcode)) {
      setPasscode("");
      setError("");
      setShowLoginModal(false);
    } else {
      setError("Mã Admin không đúng. Vui lòng thử lại.");
    }
  };

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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition">
              <Radar className="w-5 h-5" />
            </div>
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

          {/* Right: Role Switch + Add Cafe */}
          <div className="flex items-center gap-2 shrink-0">
            {role === "admin" ? (
              <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Admin</span>
                <button
                  type="button"
                  onClick={logoutAdmin}
                  title="Thoát quyền Admin (về chế độ User)"
                  className="ml-1 p-0.5 rounded hover:bg-amber-200/70 text-amber-700 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                title="Đăng nhập quyền Admin để chỉnh sửa / xóa đánh giá"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">User</span>
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

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[1100] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Đăng nhập quyền Admin
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(false);
                  setError("");
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="p-5 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong>User</strong> có thể xem bản đồ, lưu quán, góp quán mới & check-in 6h.{" "}
                <strong>Admin</strong> có toàn quyền chỉnh sửa thông tin quán, thêm/bớt hoặc xóa đánh giá.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã khóa Admin
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Nhập mã khóa Admin..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                />
                {error && (
                  <p className="text-xs text-rose-600 font-medium mt-1.5">
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition cursor-pointer"
              >
                Xác nhận quyền Admin
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
