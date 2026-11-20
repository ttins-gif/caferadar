import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CafeRadar — Bản đồ Quán Cafe Chạy Deadline TP.HCM",
  description:
    "CafeRadar giúp freelancer & dân văn phòng tìm quán cafe làm việc tại Quận 1, Quận 3, Bình Thạnh, Phú Nhuận trong 3 giây: lọc theo ổ cắm từng bàn, Wi-Fi > 50Mbps, mở 24/7, yên tĩnh họp online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
