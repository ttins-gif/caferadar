"use client";

import React, { useEffect, useState } from "react";
import {
  MessageSquareHeart,
  Send,
  CheckCircle2,
  Trash2,
  Lock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { getCurrentUser, getStoredRole, UserAccount } from "@/lib/auth";
import {
  deleteSiteFeedback,
  fetchAllFeedback,
  SiteFeedback,
  submitSiteFeedback,
} from "@/lib/supabase";

const CATEGORIES = [
  "Đề xuất tính năng mới",
  "Báo lỗi trang web",
  "Báo sai thông tin quán",
  "Góp ý khác",
];

export default function FeedbackPage() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [list, setList] = useState<SiteFeedback[]>([]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const syncAuth = () => {
    setUser(getCurrentUser());
    setIsAdmin(getStoredRole() === "admin");
  };

  useEffect(() => {
    syncAuth();
    void fetchAllFeedback().then(setList);
    window.addEventListener("caferadar-auth-change", syncAuth);
    return () => window.removeEventListener("caferadar-auth-change", syncAuth);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;
    setSubmitting(true);
    const newItem: SiteFeedback = {
      id: `fb_${Date.now()}`,
      authorId: user.id,
      authorName: user.displayName,
      authorAvatar: user.avatarUrl,
      category,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    await submitSiteFeedback(newItem);
    setList((prev) => [newItem, ...prev]);
    setContent("");
    setSent(true);
    setSubmitting(false);
    setTimeout(() => setSent(false), 3000);
  };

  const handleDelete = async (id: string) => {
    await deleteSiteFeedback(id);
    setList((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-2">
            <MessageSquareHeart className="w-3.5 h-3.5" /> Hộp thư góp ý CafeRadar
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Đóng góp ý kiến cho CafeRadar
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Mọi ý kiến về tính năng mới, báo lỗi hoặc đề xuất cải thiện đều giúp CafeRadar tốt hơn cho cộng đồng chạy deadline.
          </p>
        </div>

        {/* Form góp ý */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          {!user ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
              <Lock className="w-5 h-5 text-slate-400 shrink-0" />
              <span>
                Vui lòng bấm nút <strong>Đăng nhập</strong> ở góc phải thanh điều hướng để gửi góp ý cho CafeRadar.
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {sent && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Cảm ơn bạn đã gửi góp ý cho CafeRadar!
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chủ đề góp ý
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white outline-none focus:border-indigo-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nội dung góp ý *
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Chia sẻ ý kiến, tính năng bạn mong muốn hoặc lỗi bạn gặp phải..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition cursor-pointer disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {submitting ? "Đang gửi..." : "Gửi góp ý"}
              </button>
            </form>
          )}
        </section>

        {/* Danh sách góp ý cộng đồng */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800">
            Góp ý gần đây ({list.length})
          </h2>
          {list.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              Chưa có góp ý nào. Hãy là người đầu tiên đóng góp ý kiến cho CafeRadar nhé!
            </div>
          ) : (
            <div className="space-y-2.5">
              {list.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                        {item.authorAvatar ? (
                          <img
                            src={item.authorAvatar}
                            alt={item.authorName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          item.authorName[0]?.toUpperCase() || "U"
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">
                            {item.authorName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                            {item.category}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(item.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        title="Admin: Xóa góp ý này"
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
