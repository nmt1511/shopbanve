import { z } from "zod"

export const drawingImageSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  publicId: z.string().optional(),
  alt: z.string().trim().min(1).max(160),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  bytes: z.number().int().nonnegative().optional(),
  format: z.string().max(12).optional(),
  sortOrder: z.number().int().nonnegative(),
})

export const drawingSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().trim().min(1).max(320),
  description: z.string().trim().min(1),
  categoryId: z.string().min(1),
  tags: z.array(z.string().trim().min(1).max(60)).max(30),
  status: z.enum(["draft", "published", "archived"]),
  price: z.number().finite().nonnegative(),
  priceType: z.enum(["paid", "free", "contact"]),
  coverImageId: z.string().optional(),
  images: z.array(drawingImageSchema).max(20),
  fileMeta: z.array(z.object({
    id: z.string().min(1),
    name: z.string().trim().min(1).max(180),
    format: z.string().trim().min(1).max(20),
    version: z.string().max(80).optional(),
    sizeLabel: z.string().max(40).optional(),
    downloadKey: z.string().max(240).optional(),
  })).max(20),
  software: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  version: z.string().max(80).optional(),
  formats: z.array(z.string().trim().min(1).max(20)).max(20),
  sizeLabel: z.string().max(40).optional(),
  viewCount: z.number().int().nonnegative(),
  featured: z.boolean(),
  seoTitle: z.string().max(180).optional(),
  seoDescription: z.string().max(320).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().optional(),
}).superRefine((drawing, context) => {
  if (drawing.status === "published" && drawing.images.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["images"], message: "Bản vẽ đã xuất bản cần ít nhất một ảnh." })
  }
  if (drawing.coverImageId && !drawing.images.some((image) => image.id === drawing.coverImageId)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["coverImageId"], message: "Ảnh cover không thuộc gallery." })
  }
})

export const shopArticleSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  content: z.string().trim().min(1),
  excerpt: z.string().trim().max(320).optional(),
  category: z.string().trim().max(80).optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(30),
  featuredImage: z.string().url().optional(),
  status: z.enum(["draft", "published", "archived"]),
  viewCount: z.number().int().nonnegative(),
  seoTitle: z.string().max(180).optional(),
  seoDescription: z.string().max(320).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().optional(),
})

export const shopCategorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(320).optional(),
  image: z.string().url().optional(),
  order: z.number().int().nonnegative(),
  status: z.enum(["active", "paused"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const purchaseInquirySchema = z.object({
  drawingId: z.string().optional(),
  drawingTitle: z.string().trim().min(1).max(180),
  source: z.enum(["zalo", "form"]),
  status: z.enum(["new", "processing", "contacted", "closed", "spam"]),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  phone: z.string().trim().regex(/^(\+84|0)(3|5|7|8|9)[0-9]{8}$/),
  company: z.string().trim().max(180).optional(),
  address: z.string().trim().max(240).optional(),
  projectPurpose: z.string().trim().min(2).max(240),
  message: z.string().trim().min(2).max(2000),
  consent: z.literal(true),
  userId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const shopContactSettingsSchema = z.object({
  shopName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180).or(z.literal("")),
  phone: z.string().trim().max(40),
  zaloEnabled: z.boolean(),
  zaloUrl: z.string().url().optional().or(z.literal("")),
  zaloPhone: z.string().trim().max(40).optional(),
  zaloMessageTemplate: z.string().trim().min(1).max(240),
  inquiryEnabled: z.boolean(),
  contactChannels: z.array(z.object({
    id: z.enum(["zalo", "telegram", "instagram", "facebook", "email", "phone"]),
    label: z.string().trim().min(1).max(60),
    url: z.string().max(240),
    enabled: z.boolean(),
  })).max(12).optional(),
  menuItems: z.array(z.object({
    id: z.string().min(1).max(40),
    label: z.string().trim().min(1).max(80),
    href: z.string().startsWith("/"),
    enabled: z.boolean(),
    order: z.number().int().nonnegative(),
  })).max(12).optional(),
  homepageSections: z.array(z.object({
    id: z.enum(["search", "hero", "library", "articles"]),
    label: z.string().trim().min(1).max(80),
    enabled: z.boolean(),
    order: z.number().int().nonnegative(),
  })).max(8).optional(),
  homepageOptions: z.object({
    showDailyUpdate: z.boolean(),
    showCategoryLink: z.boolean(),
    showArticleLink: z.boolean(),
    dailyUpdateOrder: z.number().int().nonnegative().default(1),
    categoryLinkOrder: z.number().int().nonnegative().default(2),
    articleLinkOrder: z.number().int().nonnegative().default(3),
  }).optional(),
  announcementEnabled: z.boolean().optional(),
  announcementText: z.string().trim().max(180).optional(),
  footerDescription: z.string().trim().max(320).optional(),
  footerSupportTitle: z.string().trim().max(100).optional(),
  footerSupportText: z.string().trim().max(320).optional(),
  footerSupportButtonLabel: z.string().trim().max(80).optional(),
  updatedAt: z.string().datetime(),
})

export type ShopContactSettingsInput = z.infer<typeof shopContactSettingsSchema>

export function slugifyShopText(value: string): string {
  return value.toLocaleLowerCase("vi-VN").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}
