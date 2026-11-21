"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginWithGoogleAccount } from "@/lib/auth";

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Đang xác thực tài khoản Google...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const oauthError = params.get("error");

        if (oauthError) {
          setError(`Google từ chối đăng nhập: ${oauthError}`);
          return;
        }

        if (!accessToken) {
          setError("Không nhận được mã xác thực từ Google.");
          return;
        }

        setStatus("Đang tải thông tin hồ sơ Google...");
        const res = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!res.ok) {
          setError("Không thể lấy thông tin tài khoản từ Google.");
          return;
        }

        const profile: {
          email?: string;
          name?: string;
          picture?: string;
        } = await res.json();

        if (!profile.email) {
          setError("Tài khoản Google không trả về địa chỉ email.");
          return;
        }

        const loginRes = loginWithGoogleAccount({
          gmail: profile.email,
          displayName: profile.name || profile.email.split("@")[0],
          avatarUrl: profile.picture,
        });

        if (!loginRes.ok) {
          setError(loginRes.error || "Đăng nhập thất bại.");
          return;
        }

        router.replace("/");
      } catch {
        setError("Đã xảy ra lỗi khi kết nối với Google.");
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center shadow-xs space-y-3">
        {error ? (
          <>
            <h1 className="text-lg font-bold text-rose-600">
              Đăng nhập Google thất bại
            </h1>
            <p className="text-sm text-slate-600">{error}</p>
            <Link
              href="/"
              className="inline-block mt-3 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold"
            >
              Quay về CafeRadar
            </Link>
          </>
        ) : (
          <>
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <h1 className="text-base font-bold text-slate-900">{status}</h1>
            <p className="text-xs text-slate-500">
              Vui lòng chờ trong giây lát...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
