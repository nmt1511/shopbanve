export type PublicationStatus = "draft" | "published" | "archived"
export type DrawingPriceType = "paid" | "free" | "contact"
export type InquirySource = "zalo" | "form"
export type InquiryStatus = "new" | "processing" | "contacted" | "closed" | "spam"

export interface DrawingImage {
  id: string
  url: string
  publicId?: string
  alt: string
  width?: number
  height?: number
  bytes?: number
  format?: string
  sortOrder: number
}

export interface DrawingFileMeta {
  id: string
  name: string
  format: string
  version?: string
  sizeLabel?: string
  downloadKey?: string
}

export interface ShopCategory {
  id?: string
  name: string
  slug: string
  description?: string
  image?: string
  order: number
  status: "active" | "paused"
  createdAt: string
  updatedAt: string
}

export interface Drawing {
  id?: string
  title: string
  slug: string
  excerpt: string
  description: string
  categoryId: string
  tags: string[]
  status: PublicationStatus
  price: number
  priceType: DrawingPriceType
  coverImageId?: string
  images: DrawingImage[]
  fileMeta: DrawingFileMeta[]
  software?: string[]
  version?: string
  formats: string[]
  sizeLabel?: string
  viewCount: number
  featured: boolean
  seoTitle?: string
  seoDescription?: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface ShopArticle {
  id?: string
  title: string
  slug: string
  content: string
  excerpt?: string
  category?: string
  tags: string[]
  featuredImage?: string
  status: PublicationStatus
  viewCount: number
  seoTitle?: string
  seoDescription?: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface ShopMedia {
  id?: string
  url: string
  publicId?: string
  resourceType: "image" | "raw"
  mimeType: string
  bytes: number
  width?: number
  height?: number
  alt: string
  ownerId?: string
  createdAt: string
  updatedAt: string
}

export interface PurchaseInquiry {
  id?: string
  drawingId?: string
  drawingTitle: string
  source: InquirySource
  status: InquiryStatus
  fullName: string
  email: string
  phone: string
  company?: string
  address?: string
  projectPurpose: string
  message: string
  consent: boolean
  userId?: string
  createdAt: string
  updatedAt: string
}

export interface ShopContactSettings {
  shopName: string
  email: string
  phone: string
  zaloEnabled: boolean
  zaloUrl?: string
  zaloPhone?: string
  zaloMessageTemplate: string
  inquiryEnabled: boolean
  contactChannels?: ContactChannel[]
  menuItems?: ShopMenuItem[]
  homepageSections?: HomepageSection[]
  homepageOptions?: HomepageOptions
  updatedAt: string
  announcementEnabled?: boolean
  announcementText?: string
  footerDescription?: string
  footerSupportTitle?: string
  footerSupportText?: string
  footerSupportButtonLabel?: string
  telegramBotEnabled?: boolean
  telegramBotToken?: string
  telegramChatId?: string
  cloudinaryCloudName?: string
  cloudinaryUploadPreset?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
}

export interface ContactChannel {
  id: "zalo" | "telegram" | "instagram" | "facebook" | "email" | "phone"
  label: string
  url: string
  enabled: boolean
}

export interface ShopMenuItem {
  id: string
  label: string
  href: string
  enabled: boolean
  order: number
}

export interface HomepageSection {
  id: "search" | "hero" | "library" | "articles"
  label: string
  enabled: boolean
  order: number
}

export interface HomepageOptions {
  showDailyUpdate: boolean
  showCategoryLink: boolean
  showArticleLink: boolean
  dailyUpdateOrder: number
  categoryLinkOrder: number
  articleLinkOrder: number
}
