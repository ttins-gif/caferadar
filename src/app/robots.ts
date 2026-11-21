import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/auth/"],
    },
    sitemap: "https://caferadar-vn.vercel.app/sitemap.xml",
  };
}
