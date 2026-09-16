import { get, onValue, push, ref, remove, set, update, type Unsubscribe } from "firebase/database"
import { database } from "@/lib/firebase"
import type { Drawing, PurchaseInquiry, ShopArticle, ShopCategory, ShopContactSettings } from "./types"
import {
  drawingSchema,
  purchaseInquirySchema,
  shopArticleSchema,
  shopCategorySchema,
  shopContactSettingsSchema,
} from "./validation"

const now = () => new Date().toISOString()

/** Firebase Realtime Database rejects undefined values in set/update payloads. */
function withoutUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => withoutUndefined(item)) as T
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, withoutUndefined(item)])

    return Object.fromEntries(entries) as T
  }

  return value
}

function values<T>(value: Record<string, T> | null | undefined): Array<T & { id: string }> {
  if (!value) return []
  return Object.entries(value).map(([id, item]) => ({ id, ...item }))
}

function normalizeDrawing(id: string, value: Partial<Drawing>): Drawing {
  const timestamp = now()
  return {
    id,
    title: value.title ?? "",
    slug: value.slug ?? "",
    excerpt: value.excerpt ?? "",
    description: value.description ?? "",
    categoryId: value.categoryId ?? "",
    tags: value.tags ?? [],
    status: value.status ?? "draft",
    price: value.price ?? 0,
    priceType: value.priceType ?? "contact",
    coverImageId: value.coverImageId,
    images: value.images ?? [],
    fileMeta: value.fileMeta ?? [],
    software: value.software ?? [],
    version: value.version,
    formats: value.formats ?? [],
    sizeLabel: value.sizeLabel,
    viewCount: value.viewCount ?? 0,
    featured: value.featured ?? false,
    seoTitle: value.seoTitle,
    seoDescription: value.seoDescription,
    createdAt: value.createdAt ?? timestamp,
    updatedAt: value.updatedAt ?? timestamp,
    publishedAt: value.publishedAt,
  }
}

function normalizeArticle(id: string, value: Partial<ShopArticle>): ShopArticle {
  const timestamp = now()
  return {
    id,
    title: value.title ?? "",
    slug: value.slug ?? "",
    content: value.content ?? "",
    excerpt: value.excerpt,
    category: value.category,
    tags: value.tags ?? [],
    featuredImage: value.featuredImage,
    status: value.status ?? "draft",
    viewCount: value.viewCount ?? 0,
    seoTitle: value.seoTitle,
    seoDescription: value.seoDescription,
    createdAt: value.createdAt ?? timestamp,
    updatedAt: value.updatedAt ?? timestamp,
    publishedAt: value.publishedAt,
  }
}

function normalizeCategory(id: string, value: Partial<ShopCategory>): ShopCategory {
  const timestamp = now()
  return {
    id,
    name: value.name ?? "",
    slug: value.slug ?? "",
    description: value.description,
    image: value.image,
    order: value.order ?? 0,
    status: value.status ?? "active",
    createdAt: value.createdAt ?? timestamp,
    updatedAt: value.updatedAt ?? timestamp,
  }
}

export class ShopBanVeRepository {
  static async getDrawings(): Promise<Drawing[]> {
    const snapshot = await get(ref(database, "drawings"))
    return values<Partial<Drawing>>(snapshot.exists() ? snapshot.val() : null)
      .map(({ id, ...drawing }) => normalizeDrawing(id, drawing))
  }

  static async getDrawing(id: string): Promise<Drawing | null> {
    const snapshot = await get(ref(database, `drawings/${id}`))
    return snapshot.exists() ? normalizeDrawing(id, snapshot.val()) : null
  }

  static async getDrawingBySlug(slug: string): Promise<Drawing | null> {
    const drawings = await this.getDrawings()
    return drawings.find((drawing) => drawing.slug === slug && drawing.status === "published") ?? null
  }

  private static async getDrawingByAnyStatusSlug(slug: string): Promise<Drawing | null> {
    const drawings = await this.getDrawings()
    return drawings.find((drawing) => drawing.slug === slug) ?? null
  }

  static async getPublishedDrawings(): Promise<Drawing[]> {
    const drawings = await this.getDrawings()
    return drawings.filter((drawing) => drawing.status === "published").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  static async searchDrawings(query: string): Promise<Drawing[]> {
    const normalized = query.trim().toLocaleLowerCase("vi-VN")
    if (!normalized) return this.getPublishedDrawings()
    const drawings = await this.getPublishedDrawings()
    return drawings.filter((drawing) => `${drawing.title} ${drawing.excerpt} ${drawing.description} ${drawing.tags.join(" ")}`.toLocaleLowerCase("vi-VN").includes(normalized))
  }

  static async getDrawingsByCategory(categoryId: string): Promise<Drawing[]> {
    const drawings = await this.getPublishedDrawings()
    return drawings.filter((drawing) => drawing.categoryId === categoryId)
  }

  static async getFeaturedDrawings(limit = 6): Promise<Drawing[]> {
    const drawings = await this.getPublishedDrawings()
    return drawings.filter((drawing) => drawing.featured).slice(0, limit)
  }

  static async getArticles(): Promise<ShopArticle[]> {
    const snapshot = await get(ref(database, "shop_articles"))
    return values<Partial<ShopArticle>>(snapshot.exists() ? snapshot.val() : null).map(({ id, ...article }) => normalizeArticle(id, article))
  }

  static async getPublishedArticles(limit?: number): Promise<ShopArticle[]> {
    const articles = (await this.getArticles()).filter((article) => article.status === "published")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return limit ? articles.slice(0, limit) : articles
  }

  static async getArticleBySlug(slug: string): Promise<ShopArticle | null> {
    const articles = await this.getArticles()
    return articles.find((article) => article.slug === slug && article.status === "published") ?? null
  }

  static async addArticle(input: Omit<ShopArticle, "id" | "createdAt" | "updatedAt">, userId?: string): Promise<string> {
    const timestamp = now()
    const article = shopArticleSchema.parse({
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp,
      publishedAt: input.status === "published" ? timestamp : input.publishedAt,
    })
    const existing = (await this.getArticles()).find((item) => item.slug === article.slug)
    if (existing) throw new Error("Slug bài viết đã tồn tại")
    const newRef = push(ref(database, "shop_articles"))
    await set(newRef, withoutUndefined(article))
    if (userId) await this.logActivity("article.create", `Tạo bài viết: ${article.title}`, userId)
    return newRef.key!
  }

  static async updateArticle(id: string, updates: Partial<ShopArticle>, userId?: string): Promise<void> {
    const existing = await this.getArticle(id)
    if (!existing) throw new Error("Không tìm thấy bài viết")
    if (updates.slug && updates.slug !== existing.slug) {
      const duplicate = (await this.getArticles()).find((item) => item.slug === updates.slug)
      if (duplicate && duplicate.id !== id) throw new Error("Slug bài viết đã tồn tại")
    }
    const merged = {
      ...existing,
      ...updates,
      id: undefined,
      updatedAt: now(),
      publishedAt:
        updates.status === "published"
          ? existing.publishedAt ?? now()
          : updates.status === "draft" || updates.status === "archived"
            ? updates.publishedAt
            : existing.publishedAt,
    }
    delete merged.id
    const parsed = shopArticleSchema.parse(merged)
    await update(ref(database, `shop_articles/${id}`), withoutUndefined(parsed))
    if (userId) await this.logActivity("article.update", `Cập nhật bài viết: ${existing.title}`, userId)
  }

  static async getArticle(id: string): Promise<ShopArticle | null> {
    const snapshot = await get(ref(database, `shop_articles/${id}`))
    return snapshot.exists() ? normalizeArticle(id, snapshot.val()) : null
  }

  static async archiveArticle(id: string, userId?: string): Promise<void> {
    await this.updateArticle(id, { status: "archived" }, userId)
  }

  static async deleteArticle(id: string, userId?: string): Promise<void> {
    const existing = await this.getArticle(id)
    if (!existing) return
    await remove(ref(database, `shop_articles/${id}`))
    if (userId) await this.logActivity("article.delete", `Xóa bài viết: ${existing.title}`, userId)
  }

  static async incrementArticleViewCount(id: string): Promise<void> {
    const existing = await this.getArticle(id)
    if (!existing) return
    await update(ref(database, `shop_articles/${id}`), { viewCount: existing.viewCount + 1, updatedAt: now() })
  }

  static onArticlesChange(callback: (articles: ShopArticle[]) => void): Unsubscribe {
    return onValue(ref(database, "shop_articles"), (snapshot) => {
      const articles = values<Partial<ShopArticle>>(snapshot.exists() ? snapshot.val() : null)
        .map(({ id, ...article }) => normalizeArticle(id, article))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      callback(articles)
    })
  }

  static onPublishedArticlesChange(callback: (articles: ShopArticle[]) => void): Unsubscribe {
    return this.onArticlesChange((articles) => callback(articles.filter((article) => article.status === "published")))
  }

  static async addDrawing(input: Omit<Drawing, "id" | "createdAt" | "updatedAt">, userId?: string): Promise<string> {
    const timestamp = now()
    const drawing = drawingSchema.parse({ ...input, createdAt: timestamp, updatedAt: timestamp })
    const existing = await this.getDrawingByAnyStatusSlug(drawing.slug)
    if (existing) throw new Error("Slug bản vẽ đã tồn tại")
    const newRef = push(ref(database, "drawings"))
    await set(newRef, withoutUndefined(drawing))
    if (userId) await this.logActivity("drawing.create", `Tạo bản vẽ: ${drawing.title}`, userId)
    return newRef.key!
  }

  static async updateDrawing(id: string, updates: Partial<Drawing>, userId?: string): Promise<void> {
    const existing = await this.getDrawing(id)
    if (!existing) throw new Error("Không tìm thấy bản vẽ")
    if (updates.slug && updates.slug !== existing.slug) {
      const duplicate = await this.getDrawingByAnyStatusSlug(updates.slug)
      if (duplicate && duplicate.id !== id) throw new Error("Slug bản vẽ đã tồn tại")
    }
    const merged = { ...existing, ...updates, updatedAt: now() }
    const { id: _id, ...withoutId } = merged
    const parsed = drawingSchema.parse(withoutId)
    await update(ref(database, `drawings/${id}`), withoutUndefined(parsed))
    if (userId) await this.logActivity("drawing.update", `Cập nhật bản vẽ: ${existing.title}`, userId)
  }

  static async incrementDrawingViewCount(id: string): Promise<void> {
    const existing = await this.getDrawing(id)
    if (!existing) return
    await update(ref(database, `drawings/${id}`), { viewCount: existing.viewCount + 1, updatedAt: now() })
  }

  static async getRelatedDrawings(drawing: Drawing, limit = 3): Promise<Drawing[]> {
    const drawings = await this.getPublishedDrawings()
    return drawings.filter((item) => item.id !== drawing.id && item.categoryId === drawing.categoryId).slice(0, limit)
  }

  static async archiveDrawing(id: string, userId?: string): Promise<void> {
    await this.updateDrawing(id, { status: "archived" }, userId)
  }

  static async deleteDrawing(id: string, userId?: string): Promise<void> {
    const existing = await this.getDrawing(id)
    if (!existing) return
    await remove(ref(database, `drawings/${id}`))
    if (userId) await this.logActivity("drawing.delete", `Xóa bản vẽ: ${existing.title}`, userId)
  }

  static onDrawingsChange(callback: (drawings: Drawing[]) => void): Unsubscribe {
    return onValue(ref(database, "drawings"), (snapshot) => {
      const drawings = values<Partial<Drawing>>(snapshot.exists() ? snapshot.val() : null)
        .map(({ id, ...drawing }) => normalizeDrawing(id, drawing))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      callback(drawings)
    })
  }

  static onPublishedDrawingsChange(callback: (drawings: Drawing[]) => void): Unsubscribe {
    return this.onDrawingsChange((drawings) => callback(drawings.filter((drawing) => drawing.status === "published")))
  }

  static async getCategories(): Promise<ShopCategory[]> {
    const snapshot = await get(ref(database, "shop_categories"))
    return values<Partial<ShopCategory>>(snapshot.exists() ? snapshot.val() : null)
      .map(({ id, ...category }) => normalizeCategory(id, category))
      .sort((a, b) => a.order - b.order)
  }

  static onCategoriesChange(callback: (categories: ShopCategory[]) => void): Unsubscribe {
    return onValue(ref(database, "shop_categories"), (snapshot) => callback(
      values<Partial<ShopCategory>>(snapshot.exists() ? snapshot.val() : null)
        .map(({ id, ...category }) => normalizeCategory(id, category))
        .sort((a, b) => a.order - b.order),
    ))
  }

  static async addCategory(category: Omit<ShopCategory, "id">, userId?: string): Promise<string> {
    const timestamp = now()
    const parsed = shopCategorySchema.parse({ ...category, createdAt: timestamp, updatedAt: timestamp })
    const existing = (await this.getCategories()).find((item) => item.slug === parsed.slug)
    if (existing) throw new Error("Slug danh mục đã tồn tại")
    const newRef = push(ref(database, "shop_categories"))
    await set(newRef, withoutUndefined(parsed))
    if (userId) await this.logActivity("shop_category.create", `Tạo danh mục: ${category.name}`, userId)
    return newRef.key!
  }

  static async updateCategory(id: string, updates: Partial<ShopCategory>, userId?: string): Promise<void> {
    const existing = (await this.getCategories()).find((item) => item.id === id)
    if (!existing) throw new Error("Không tìm thấy danh mục")
    if (updates.slug && updates.slug !== existing.slug) {
      const duplicate = (await this.getCategories()).find((item) => item.slug === updates.slug && item.id !== id)
      if (duplicate) throw new Error("Slug danh mục đã tồn tại")
    }
    const merged = { ...existing, ...updates, id: undefined, updatedAt: now() }
    delete merged.id
    await update(ref(database, `shop_categories/${id}`), withoutUndefined(shopCategorySchema.parse(merged)))
    if (userId) await this.logActivity("shop_category.update", `Cập nhật danh mục: ${id}`, userId)
  }

  static async deleteCategory(id: string, userId?: string): Promise<void> {
    const drawings = await this.getDrawings()
    if (drawings.some((drawing) => drawing.categoryId === id)) {
      throw new Error("Không thể xóa danh mục đang có bản vẽ. Hãy chuyển bản vẽ sang danh mục khác trước.")
    }
    await remove(ref(database, `shop_categories/${id}`))
    if (userId) await this.logActivity("shop_category.delete", `Xóa danh mục: ${id}`, userId)
  }

  static async getContactSettings(): Promise<ShopContactSettings | null> {
    const snapshot = await get(ref(database, "shop_settings/contact"))
    if (!snapshot.exists()) return null

    const result = shopContactSettingsSchema.safeParse(snapshot.val())
    return result.success ? result.data : null
  }

  static onContactSettingsChange(callback: (settings: ShopContactSettings | null) => void): Unsubscribe {
    return onValue(ref(database, "shop_settings/contact"), (snapshot) => {
      if (!snapshot.exists()) {
        callback(null)
        return
      }

      const result = shopContactSettingsSchema.safeParse(snapshot.val())
      callback(result.success ? result.data : null)
    })
  }

  static async updateContactSettings(settings: ShopContactSettings, userId?: string): Promise<void> {
    const parsed = shopContactSettingsSchema.parse({ ...settings, updatedAt: now() })
    await set(ref(database, "shop_settings/contact"), withoutUndefined(parsed))
    if (userId) await this.logActivity("shop_settings.update", "Cập nhật cấu hình liên hệ Shop Bản Vẽ", userId)
  }

  static async addPurchaseInquiry(input: Omit<PurchaseInquiry, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const timestamp = now()
    const inquiry = purchaseInquirySchema.parse({ ...input, createdAt: timestamp, updatedAt: timestamp })
    const newRef = push(ref(database, "purchase_inquiries"))
    await set(newRef, withoutUndefined(inquiry))
    return newRef.key!
  }

  static async getPurchaseInquiries(): Promise<PurchaseInquiry[]> {
    const snapshot = await get(ref(database, "purchase_inquiries"))
    return values<Partial<PurchaseInquiry>>(snapshot.exists() ? snapshot.val() : null)
      .map(({ id, ...inquiry }) => ({ ...inquiry, id } as PurchaseInquiry))
      .filter((inquiry) => inquiry.drawingTitle && inquiry.createdAt)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  static onPurchaseInquiriesChange(callback: (inquiries: PurchaseInquiry[]) => void): Unsubscribe {
    return onValue(ref(database, "purchase_inquiries"), (snapshot) => {
      const inquiries = values<Partial<PurchaseInquiry>>(snapshot.exists() ? snapshot.val() : null)
        .map(({ id, ...inquiry }) => ({ ...inquiry, id } as PurchaseInquiry))
        .filter((inquiry) => inquiry.drawingTitle && inquiry.createdAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      callback(inquiries)
    })
  }

  static async updatePurchaseInquiryStatus(id: string, status: PurchaseInquiry["status"], userId?: string): Promise<void> {
    await update(ref(database, `purchase_inquiries/${id}`), { status, updatedAt: now() })
    if (userId) await this.logActivity("purchase_inquiry.status", `Cập nhật yêu cầu mua: ${id} → ${status}`, userId)
  }

  private static async logActivity(action: string, details: string, userId: string): Promise<void> {
    const activityRef = push(ref(database, "activity_logs"))
    await set(activityRef, { action, type: "Content", level: "Information", details, user_id: userId, created_at: now() })
  }
}
