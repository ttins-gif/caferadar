"use client";

import React, { useState } from "react";
import { Sparkles, Ticket, Megaphone, CheckCircle2, Send } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function PartnerPage() {
  const [submitted, setSubmitted] = useState(false);
  const [cafeName, setCafeName] = useState("");
  const [contact, setContact] = useState("");
  const [plan, setPlan] = useState("featured");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeName.trim() || !contact.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 space-y-10">
        {/* Hero */}
        <section className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-3">
            Dành cho Chủ quán Cafe & Nhãn hàng
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Kéo khách freelancer & dân văn phòng vào khung giờ vắng
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-3">
            CafeRadar kết nối đúng tệp khách hàng sẵn sàng chi tiêu đều đặn từ sáng thứ 2 đến thứ 6 tại TP.HCM.
          </p>
        </section>

        {/* 3 Monetization Packages */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Gói Quán Nổi Bật
              </h2>
              <p className="text-xs text-slate-500 mt-1">Featured Listing</p>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Ghim nổi bật màu vàng ★ trên bản đồ và đứng top danh sách tìm kiếm theo quận. Cực kỳ hiệu quả cho quán mới mở hoặc cần kéo khách sáng thứ 2–6.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="text-xl font-extrabold text-slate-900">
                499k <span className="text-xs font-medium text-slate-500">/ tháng</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-indigo-600 p-6 flex flex-col justify-between shadow-md relative">
            <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white">
              Phổ biến nhất
            </span>
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Ticket className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Voucher Độc Quyền
              </h2>
              <p className="text-xs text-slate-500 mt-1">Affiliate / Check-in</p>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Tạo mã giảm 10–15% hoặc tặng bánh khi người dùng check-in qua CafeRadar. Chỉ tính hiệu quả thực tế, tăng tỷ lệ khách quay lại hàng tuần.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="text-xl font-extrabold text-slate-900">
                0đ <span className="text-xs font-medium text-slate-500">phí cố định</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
                <Megaphone className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Tài Trợ Nhãn Hàng
              </h2>
              <p className="text-xs text-slate-500 mt-1">Brand Sponsorship</p>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Dành cho thương hiệu ghế công thái học, bàn phím cơ, sạc dự phòng, laptop hoặc gói cước 4G/5G muốn tiếp cận 100% đúng tệp dân chạy deadline.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="text-xl font-extrabold text-slate-900">
                Liên hệ <span className="text-xs font-medium text-slate-500">theo chiến dịch</span>
              </div>
            </div>
          </div>
        </section>

        {/* Registration Form */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-2xl mx-auto shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            Đăng ký hợp tác cùng CafeRadar
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Để lại thông tin, đội ngũ CafeRadar sẽ liên hệ trong vòng 24 giờ.
          </p>

          {submitted ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">Đã nhận đăng ký của bạn!</p>
                <p className="text-xs mt-0.5">
                  Cảm ơn <strong>{cafeName}</strong>. Chúng mình sẽ liên hệ qua{" "}
                  <strong>{contact}</strong> sớm nhất.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên quán cafe / Thương hiệu *
                </label>
                <input
                  required
                  value={cafeName}
                  onChange={(e) => setCafeName(e.target.value)}
                  placeholder="VD: SOKO Study & Coffee"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại / Zalo / Email *
                </label>
                <input
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="VD: 090x xxx xxx hoặc hello@quan.vn"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gói quan tâm
                </label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white outline-none"
                >
                  <option value="featured">Gói Quán Nổi Bật (Featured Listing)</option>
                  <option value="voucher">Hợp tác Voucher Độc Quyền</option>
                  <option value="sponsor">Tài trợ Nhãn hàng</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition cursor-pointer"
              >
                <Send className="w-4 h-4" /> Gửi đăng ký hợp tác
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
