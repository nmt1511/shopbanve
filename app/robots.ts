import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shopbanve.com"
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/dang-nhap", "/dang-ky"] }], sitemap: `${baseUrl}/sitemap.xml`, host: baseUrl }
}
