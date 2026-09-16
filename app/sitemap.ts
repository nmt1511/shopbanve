import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shopbanve.com"
  const routes = ["", "/danh-muc", "/do-an", "/bai-viet", "/tim-kiem", "/huong-dan", "/lien-he", "/ve-chung-toi", "/chinh-sach-bao-mat"]
  return routes.map((route) => ({ url: `${baseUrl}${route}`, lastModified: new Date(), changeFrequency: route === "" ? "daily" : "weekly", priority: route === "" ? 1 : 0.7 }))
}
