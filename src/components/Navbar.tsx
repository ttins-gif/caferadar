"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Radar,
  Map as MapIcon,
  LayoutGrid,
  Radio,
  Handshake,
  Plus,
} from "lucide-react";

interface NavbarProps {
  onOpenAddModal?: () => void;
}

const NAV_ITEMS = [
  { href: "/", label: "Bản đồ", icon: MapIcon },
  { href: "/danh-sach", label: "Bảng xếp hạng", icon: LayoutGrid },
  { href: "/cong-dong", label: "Live 6h", icon: Radio },
  { href: "/hop-tac", label: "Dành cho quán", icon: Handshake },
];

export default function Navbar({ onOpenAddModal }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-slate-200 z-40 shrink-0 sticky top-0">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-3">
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
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
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

        {/* Right CTA */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenAddModal ? (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Thêm quán ruột</span>
            </button>
          ) : (
            <Link
              href="/?add=1"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Thêm quán ruột</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
