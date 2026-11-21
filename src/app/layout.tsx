import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://caferadar-vn.vercel.app"),
  title: "CafeRadar — Bản đồ Quán Cafe Chạy Deadline Việt Nam",
  description:
    "CafeRadar giúp freelancer & dân văn phòng tìm quán cafe làm việc trên toàn quốc trong 3 giây: lọc theo ổ cắm từng bàn, Wi-Fi > 50Mbps, mở 24/7, không gian yên tĩnh.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/logo.jpg",
  },
  openGraph: {
    title: "CafeRadar — Bản đồ Quán Cafe Chạy Deadline Việt Nam",
    description:
      "Tìm nhanh quán cafe chạy deadline trên toàn quốc với đánh giá thực tế từ cộng đồng.",
    url: "https://caferadar-vn.vercel.app",
    siteName: "CafeRadar",
    images: [{ url: "/logo.jpg", width: 512, height: 512, alt: "CafeRadar Logo" }],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "CafeRadar — Bản đồ Quán Cafe Chạy Deadline Việt Nam",
    description:
      "Tìm nhanh quán cafe chạy deadline trên toàn quốc với đánh giá thực tế từ cộng đồng.",
    images: ["/logo.jpg"],
  },
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
