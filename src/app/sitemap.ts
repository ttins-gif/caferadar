import type { MetadataRoute } from "next";
import { SEED_CAFES } from "@/data/seedCafes";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://caferadar-vn.vercel.app";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${baseUrl}/danh-sach`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cong-dong`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.8,
    },
  ];

  const cafeRoutes: MetadataRoute.Sitemap = SEED_CAFES.map((cafe) => ({
    url: `${baseUrl}/quan/${cafe.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...cafeRoutes];
}
