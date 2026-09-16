import { database } from "./firebase"
import { ref, push, set, get, update, remove, onValue, off } from "firebase/database"

// Product types
export interface Product {
  id?: string
  name: string
  image_url?: string
  category_id: string
  price: number
  unit: string
  stock: number
  status: "active" | "inactive"
  // Additional fields for extended functionality
  category?: string // For display purposes
  description?: string
  specifications?: string
  steelGrade?: string
  thickness?: string
  diameter?: string
  length?: string
  surface?: string
  standard?: string
  origin?: string
  weight?: string
  minOrder?: string
  sku?: string
  comparePrice?: number
  isFeatured?: boolean
  metaTitle?: string
  metaDescription?: string
  tags?: string
  created_at: string
  updated_at: string
}

// News types
export interface NewsArticle {
  id?: string
  title: string // Required, needs index for search
  slug: string // Required, unique, URL-friendly string
  content: string // Required, full article content with HTML
  excerpt?: string // Optional, short summary
  featured_image_url?: string // Optional, featured image URL
  author_id: string // Foreign key to users table
  status: "published" | "draft" | "scheduled" // Required, default 'draft'
  view_count: number // Required, default 0
  published_at?: string // Nullable timestamp for publication
  created_at: string // Creation timestamp
  updated_at: string // Last update timestamp
  tags?: Tag[] // For display purposes - populated from post_tags relationship
  tag_ids?: string[] // Array of tag IDs for easier management
}

// Contact types
export interface Contact {
  id?: string
  customer_name: string // Required, customer name
  customer_email: string // Required, needs index
  customer_phone?: string // Optional, phone number
  customer_company?: string // Optional, company name
  subject: string // Required, message subject
  message: string // Required, detailed message content
  status: "new" | "replied" | "processing" | "closed" // Required, default 'new', needs index
  priority: "low" | "medium" | "high" // Required, default 'medium', needs index
  source: "website" | "phone" | "email" // Required, default 'website'
  replied_at?: string // Nullable timestamp for admin reply
  created_at: string // Message creation timestamp
  updated_at: string // Last update timestamp
}

// Agent registration types
export interface AgentRegistration {
  id?: string
  name: string
  email: string
  phone: string
  company: string
  address: string
  businessType: string
  experience: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

// Agent types
export interface Agent {
  id?: string
  name: string
  email: string
  phone: string
  company: string
  address: string
  businessType: string
  experience: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

// Category types
export interface Category {
  id?: string
  name: string
  description?: string
  slug: string
  display_order: number
  status: "active" | "paused"
  createdAt: string
  updatedAt: string
}

// Tag types
export interface Tag {
  id?: string
  name: string // Required, unique tag name
  slug: string // Required, unique URL-friendly string
  created_at: string
  updated_at: string
}

// Post-Tag relationship types
export interface PostTag {
  post_id: string // Foreign key to posts
  tag_id: string // Foreign key to tags
}

// Activity Log types
export interface ActivityLog {
  id?: string // BIGINT in SQL, but Firebase uses string IDs
  user_id?: string // INT, FOREIGN KEY, NULLABLE - links to users table
  actor_details?: string // VARCHAR(255) - actor info if not a user
  action: string // VARCHAR(100) - Required, short action code, needs index
  type: "Auth" | "Product" | "Content" | "User" | "System" // ENUM - Required, needs index
  level: "Information" | "Success" | "Warning" | "Error" // ENUM - Required, needs index
  details: string // TEXT - Required, detailed event description
  ip_address?: string // VARCHAR(45) - Optional, IP address
  created_at: string // TIMESTAMP - Event occurrence time
}

export type { User, CreateUserData, UpdateUserData, UserStats } from "./types/user"
import type { User, CreateUserData, UpdateUserData, UserStats } from "./types/user"

// Slider types
export interface Slider {
  id?: string
  title: string
  description: string
  image: string
  link: string
  buttonText: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

// Generic database operations
export class FirebaseDB {
  // Products
  static async getProducts(): Promise<Product[]> {
    const productsRef = ref(database, "products")
    const snapshot = await get(productsRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      const products = Object.keys(data).map((key) => ({ id: key, ...data[key] }))

      // Populate category names
      const categories = await this.getCategories()
      const categoryMap = new Map(categories.map((cat) => [cat.id, cat.name]))

      return products.map((product) => ({
        ...product,
        category: categoryMap.get(product.category_id) || "Không xác định",
      }))
    }
    return []
  }

  static async getProduct(id: string): Promise<Product | null> {
    const productRef = ref(database, `products/${id}`)
    const snapshot = await get(productRef)
    if (snapshot.exists()) {
      const product = { id, ...snapshot.val() }

      // Populate category name
      if (product.category_id) {
        const category = await this.getCategory(product.category_id)
        product.category = category?.name || "Không xác định"
      }

      return product
    }
    return null
  }

  static async addProduct(product: Omit<Product, "id">, userId?: string): Promise<string> {
    const productsRef = ref(database, "products")
    const newProductRef = push(productsRef)
    await set(newProductRef, {
      ...product,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (userId) {
      await this.logActivity("product.create", "Product", "Success", `Tạo sản phẩm mới: ${product.name}`, userId)
    }

    return newProductRef.key!
  }

  static async updateProduct(id: string, updates: Partial<Product>, userId?: string): Promise<void> {
    const existingProduct = await this.getProduct(id)
    const productName = existingProduct?.name || "Không xác định"

    const productRef = ref(database, `products/${id}`)
    await update(productRef, {
      ...updates,
      updated_at: new Date().toISOString(),
    })

    if (userId) {
      await this.logActivity("product.update", "Product", "Information", `Cập nhật sản phẩm: ${productName}`, userId)
    }
  }

  static async deleteProduct(id: string, userId?: string): Promise<void> {
    const existingProduct = await this.getProduct(id)
    const productName = existingProduct?.name || "Không xác định"

    const productRef = ref(database, `products/${id}`)
    await remove(productRef)

    if (userId) {
      await this.logActivity("product.delete", "Product", "Warning", `Xóa sản phẩm: ${productName}`, userId)
    }
  }

  static async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const productsRef = ref(database, "products")
    const snapshot = await get(productsRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      const products = Object.keys(data)
        .map((key) => ({ id: key, ...data[key] }))
        .filter((product) => product.category_id === categoryId)

      // Populate category names
      const categories = await this.getCategories()
      const categoryMap = new Map(categories.map((cat) => [cat.id, cat.name]))

      return products.map((product) => ({
        ...product,
        category: categoryMap.get(product.category_id) || "Không xác định",
      }))
    }
    return []
  }

  static async getFeaturedProducts(): Promise<Product[]> {
    const productsRef = ref(database, "products")
    const snapshot = await get(productsRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      const products = Object.keys(data)
        .map((key) => ({ id: key, ...data[key] }))
        .filter((product) => product.isFeatured === true && product.status === "active")

      // Populate category names
      const categories = await this.getCategories()
      const categoryMap = new Map(categories.map((cat) => [cat.id, cat.name]))

      return products.map((product) => ({
        ...product,
        category: categoryMap.get(product.category_id) || "Không xác định",
      }))
    }
    return []
  }

  // News
  static async getNews(): Promise<NewsArticle[]> {
    const newsRef = ref(database, "posts")
    const snapshot = await get(newsRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      const articles = Object.keys(data).map((key) => ({ id: key, ...data[key] }))

      // Populate tags for each article
      const articlesWithTags = await Promise.all(
        articles.map(async (article) => {
          const tags = await this.getPostTags(article.id!)
          return { ...article, tags, tag_ids: tags.map((tag) => tag.id!) }
        }),
      )

      return articlesWithTags
    }
    return []
  }

  static async getNewsArticle(id: string): Promise<NewsArticle | null> {
    const articleRef = ref(database, `posts/${id}`)
    const snapshot = await get(articleRef)
    if (snapshot.exists()) {
      const article = { id, ...snapshot.val() }
      const tags = await this.getPostTags(id)
      return { ...article, tags, tag_ids: tags.map((tag) => tag.id!) }
    }
    return null
  }

  static async getPostBySlug(slug: string): Promise<NewsArticle | null> {
    const postsRef = ref(database, "posts")
    const snapshot = await get(postsRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      const postEntry = Object.entries(data).find(([_, post]: [string, any]) => post.slug === slug)
      if (postEntry) {
        const [id, postData] = postEntry
        return { id, ...(postData as NewsArticle) }
      }
    }
    return null
  }

  static async addNewsArticle(article: Omit<NewsArticle, "id">, userId?: string): Promise<string> {
    const postsRef = ref(database, "posts")
    const newArticleRef = push(postsRef)
    const postId = newArticleRef.key!

    // Save article without tags
    const { tag_ids, tags, ...articleData } = article
    await set(newArticleRef, {
      ...articleData,
      view_count: articleData.view_count || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    // Add post-tag relationships if tags are provided
    if (tag_ids && tag_ids.length > 0) {
      await this.addPostTags(postId, tag_ids)
    }

    if (userId) {
      await this.logActivity("post.create", "Content", "Success", `Tạo bài viết mới: ${article.title}`, userId)
    }

    return postId
  }

  static async updateNewsArticle(id: string, updates: Partial<NewsArticle>, userId?: string): Promise<void> {
    const existingPost = await this.getNewsArticle(id)
    const postTitle = existingPost?.title || "Không xác định"

    const { tag_ids, tags, ...articleUpdates } = updates

    // Update article
    const articleRef = ref(database, `posts/${id}`)
    await update(articleRef, {
      ...articleUpdates,
      updated_at: new Date().toISOString(),
    })

    // Update post-tag relationships if tags are provided
    if (tag_ids !== undefined) {
      await this.removePostTags(id)
      if (tag_ids.length > 0) {
        await this.addPostTags(id, tag_ids)
      }
    }

    if (userId) {
      await this.logActivity("post.update", "Content", "Information", `Cập nhật bài viết: ${postTitle}`, userId)
    }
  }

  static async deleteNewsArticle(id: string, userId?: string): Promise<void> {
    const existingPost = await this.getNewsArticle(id)
    const postTitle = existingPost?.title || "Không xác định"

    // Remove post-tag relationships first
    await this.removePostTags(id)
    // Then delete the article
    const articleRef = ref(database, `posts/${id}`)
    await remove(articleRef)

    if (userId) {
      await this.logActivity("post.delete", "Content", "Warning", `Xóa bài viết: ${postTitle}`, userId)
    }
  }

  static async getPublishedNews(limit?: number): Promise<NewsArticle[]> {
    const newsRef = ref(database, "posts")
    const snapshot = await get(newsRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      let articles = Object.keys(data)
        .map((key) => ({ id: key, ...data[key] }))
        .filter((article) => article.status === "published")
        .sort(
          (a, b) =>
            new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime(),
        )

      if (limit) {
        articles = articles.slice(0, limit)
      }

      // Populate tags for each article
      const articlesWithTags = await Promise.all(
        articles.map(async (article) => {
          const tags = await this.getPostTags(article.id!)
          return { ...article, tags, tag_ids: tags.map((tag) => tag.id!) }
        }),
      )

      return articlesWithTags
    }
    return []
  }

  static async incrementNewsViewCount(id: string): Promise<void> {
    const articleRef = ref(database, `posts/${id}`)
    const snapshot = await get(articleRef)
    if (snapshot.exists()) {
      const currentData = snapshot.val()
      const currentViewCount = currentData.view_count || 0
      await update(articleRef, {
        view_count: currentViewCount + 1,
        updated_at: new Date().toISOString(),
      })
    }
  }

  // Contacts
  static async getContacts(): Promise<Contact[]> {
    const contactsRef = ref(database, "contacts")
    const snapshot = await get(contactsRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      return Object.keys(data).map((key) => ({ id: key, ...data[key] }))
    }
    return []
  }

  static async getContact(id: string): Promise<Contact | null> {
    const contactRef = ref(database, `contacts/${id}`)
    const snapshot = await get(contactRef)
    if (snapshot.exists()) {
      return { id, ...snapshot.val() }
    }
    return null
  }

  static async addContact(contact: Omit<Contact, "id" | "created_at" | "updated_at">): Promise<string> {
    const contactsRef = ref(database, "contacts")
    const newContactRef = push(contactsRef)
    await set(newContactRef, {
      ...contact,
      status: contact.status || "new",
      priority: contact.priority || "medium",
      source: contact.source || "website",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    await this.logActivity(
      "contact.received",
      "User",
      "Information",
      `Nhận liên hệ mới từ ${contact.customer_email}: ${contact.subject}`,
      undefined,
      contact.customer_email,
    )

    return newContactRef.key!
  }

  static async updateContact(id: string, updates: Partial<Contact>, userId?: string): Promise<void> {
    const existingContact = await this.getContact(id)
    const customerEmail = existingContact?.customer_email || "Không xác định"

    const contactRef = ref(database, `contacts/${id}`)
    await update(contactRef, {
      ...updates,
      updated_at: new Date().toISOString(),
    })

    if (userId) {
      await this.logActivity(
        "contact.update",
        "User",
        "Information",
        `Cập nhật liên hệ từ khách hàng: ${customerEmail}`,
        userId,
      )
    }
  }

  static async updateContactStatus(
    id: string,
    status: Contact["status"],
    replied_at?: string,
    userId?: string,
  ): Promise<void> {
    const existingContact = await this.getContact(id)
    const customerEmail = existingContact?.customer_email || "Không xác định"

    const contactRef = ref(database, `contacts/${id}`)
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === "replied" && !replied_at) {
      updates.replied_at = new Date().toISOString()
    } else if (replied_at) {
      updates.replied_at = replied_at
    }

    await update(contactRef, updates)

    if (userId) {
      const statusText =
        status === "replied"
          ? "Đã phản hồi"
          : status === "processing"
            ? "Đang xử lý"
            : status === "closed"
              ? "Đã đóng"
              : "Mới"
      await this.logActivity(
        "contact.status_update",
        "User",
        "Information",
        `Cập nhật trạng thái liên hệ từ ${customerEmail}: ${statusText}`,
        userId,
      )
    }
  }

  static async deleteContact(id: string, userId?: string): Promise<void> {
    const existingContact = await this.getContact(id)
    const customerEmail = existingContact?.customer_email || "Không xác định"

    const contactRef = ref(database, `contacts/${id}`)
    await remove(contactRef)

    if (userId) {
      await this.logActivity("contact.delete", "User", "Warning", `Xóa liên hệ từ khách hàng: ${customerEmail}`, userId)
    }
  }

  static async getContactsByStatus(status: Contact["status"]): Promise<Contact[]> {
    const contacts = await this.getContacts()
    return contacts.filter((contact) => contact.status === status)
  }

  static async getContactsByPriority(priority: Contact["priority"]): Promise<Contact[]> {
    const contacts = await this.getContacts()
    return contacts.filter((contact) => contact.priority === priority)
  }

  // Agent registrations
  static async getAgentRegistrations(): Promise<AgentRegistration[]> {
    const agentsRef = ref(database, "agent_registrations")
    const snapshot = await get(agentsRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      return Object.keys(data).map((key) => ({ id: key, ...data[key] }))
    }
    return []
  }

  static async addAgentRegistration(agent: Omit<AgentRegistration, "id">): Promise<string> {
    const agentsRef = ref(database, "agent_registrations")
    const newAgentRef = push(agentsRef)
    await set(newAgentRef, {
      ...agent,
      createdAt: new Date().toISOString(),
    })

    await this.logActivity(
      "agent.register",
      "User",
      "Information",
      `Đăng ký đại lý mới: ${agent.email} - ${agent.company}`,
      undefined,
      agent.email,
    )

    return newAgentRef.key!
  }

  static async updateAgentStatus(id: string, status: AgentRegistration["status"], userId?: string): Promise<void> {
    const agentsRef = ref(database, "agent_registrations")
    const snapshot = await get(agentsRef)
    let agentEmail = "Không xác định"
    if (snapshot.exists()) {
      const data = snapshot.val()
      const agent = data[id]
      if (agent) {
        agentEmail = agent.email
      }
    }

    const agentRef = ref(database, `agent_registrations/${id}`)
    await update(agentRef, { status })

    if (userId) {
      const statusText = status === "approved" ? "Đã duyệt" : status === "rejected" ? "Đã từ chối" : "Đang chờ"
      await this.logActivity(
        "agent.status_update",
        "User",
        "Information",
        `Cập nhật trạng thái đại lý ${agentEmail}: ${statusText}`,
        userId,
      )
    }
  }

  static async getAgents(): Promise<Agent[]> {
    const agentsRef = ref(database, "agent_registrations")
    const snapshot = await get(agentsRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      return Object.keys(data).map((key) => ({ id: key, ...data[key] }))
    }
    return []
  }

  static async getAgent(id: string): Promise<Agent | null> {
    const agentRef = ref(database, `agent_registrations/${id}`)
    const snapshot = await get(agentRef)
    if (snapshot.exists()) {
      return { id, ...snapshot.val() }
    }
    return null
  }

  static async deleteAgent(id: string, userId?: string): Promise<void> {
    const existingAgent = await this.getAgent(id)
    const agentEmail = existingAgent?.email || "Không xác định"

    const agentRef = ref(database, `agent_registrations/${id}`)
    await remove(agentRef)

    if (userId) {
      await this.logActivity("agent.delete", "User", "Warning", `Xóa đăng ký đại lý: ${agentEmail}`, userId)
    }
  }

  static async getAgentsByStatus(status: Agent["status"]): Promise<Agent[]> {
    const agents = await this.getAgents()
    return agents.filter((agent) => agent.status === status)
  }

  // Categories
  static async getCategories(): Promise<Category[]> {
    const categoriesRef = ref(database, "categories")
    const snapshot = await get(categoriesRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      return Object.keys(data).map((key) => ({ id: key, ...data[key] }))
    }
    return []
  }

  static async getCategory(id: string): Promise<Category | null> {
    const categoryRef = ref(database, `categories/${id}`)
    const snapshot = await get(categoryRef)
    if (snapshot.exists()) {
      return { id, ...snapshot.val() }
    }
    return null
  }

  static async getCategoryBySlug(slug: string): Promise<Category | null> {
    const categoriesRef = ref(database, "categories")
    const snapshot = await get(categoriesRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      const categoryEntry = Object.entries(data).find(([_, category]: [string, any]) => category.slug === slug)
      if (categoryEntry) {
        const [id, categoryData] = categoryEntry
        return { id, ...(categoryData as Category) }
      }
    }
    return null
  }

  static async addCategory(category: Omit<Category, "id">, userId?: string): Promise<string> {
    const categoriesRef = ref(database, "categories")
    const newCategoryRef = push(categoriesRef)
    await set(newCategoryRef, {
      ...category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    if (userId) {
      await this.logActivity("category.create", "Product", "Success", `Tạo danh mục mới: ${category.name}`, userId)
    }

    return newCategoryRef.key!
  }

  static async updateCategory(id: string, updates: Partial<Category>, userId?: string): Promise<void> {
    const existingCategory = await this.getCategory(id)
    const categoryName = existingCategory?.name || "Không xác định"

    const categoryRef = ref(database, `categories/${id}`)
    await update(categoryRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    })

    if (userId) {
      await this.logActivity("category.update", "Product", "Information", `Cập nhật danh mục: ${categoryName}`, userId)
    }
  }

  static async deleteCategory(id: string, userId?: string): Promise<void> {
    const existingCategory = await this.getCategory(id)
    const categoryName = existingCategory?.name || "Không xác định"

    const categoryRef = ref(database, `categories/${id}`)
    await remove(categoryRef)

    if (userId) {
      await this.logActivity("category.delete", "Product", "Warning", `Xóa danh mục: ${categoryName}`, userId)
    }
  }

  // Tags CRUD operations
  static async getTags(): Promise<Tag[]> {
    const tagsRef = ref(database, "tags")
    const snapshot = await get(tagsRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      return Object.keys(data).map((key) => ({ id: key, ...data[key] }))
    }
    return []
  }

  static async getTag(id: string): Promise<Tag | null> {
    const tagRef = ref(database, `tags/${id}`)
    const snapshot = await get(tagRef)
    if (snapshot.exists()) {
      return { id, ...snapshot.val() }
    }
    return null
  }

  static async getTagBySlug(slug: string): Promise<Tag | null> {
    const tagsRef = ref(database, "tags")
    const snapshot = await get(tagsRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      const tagEntry = Object.entries(data).find(([_, tag]: [string, any]) => tag.slug === slug)
      if (tagEntry) {
        const [id, tagData] = tagEntry
        return { id, ...(tagData as Tag) }
      }
    }
    return null
  }

  static async addTag(tag: Omit<Tag, "id" | "created_at" | "updated_at">, userId?: string): Promise<string> {
    const tagsRef = ref(database, "tags")
    const newTagRef = push(tagsRef)
    await set(newTagRef, {
      ...tag,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (userId) {
      await this.logActivity("tag.create", "Content", "Success", `Tạo thẻ mới: ${tag.name}`, userId)
    }

    return newTagRef.key!
  }

  static async updateTag(id: string, updates: Partial<Tag>, userId?: string): Promise<void> {
    const existingTag = await this.getTag(id)
    const tagName = existingTag?.name || "Không xác định"

    const tagRef = ref(database, `tags/${id}`)
    await update(tagRef, {
      ...updates,
      updated_at: new Date().toISOString(),
    })

    if (userId) {
      await this.logActivity("tag.update", "Content", "Information", `Cập nhật thẻ: ${tagName}`, userId)
    }
  }

  static async deleteTag(id: string, userId?: string): Promise<void> {
    const existingTag = await this.getTag(id)
    const tagName = existingTag?.name || "Không xác định"

    // First remove all post-tag relationships
    await this.removeAllPostTagsByTagId(id)
    // Then delete the tag
    const tagRef = ref(database, `tags/${id}`)
    await remove(tagRef)

    if (userId) {
      await this.logActivity("tag.delete", "Content", "Warning", `Xóa thẻ: ${tagName}`, userId)
    }
  }

  // Post-Tag relationship management
  static async addPostTags(postId: string, tagIds: string[]): Promise<void> {
    const postTagsRef = ref(database, "post_tags")
    const updates: { [key: string]: PostTag } = {}

    for (const tagId of tagIds) {
      const newPostTagRef = push(postTagsRef)
      updates[newPostTagRef.key!] = {
        post_id: postId,
        tag_id: tagId,
      }
    }

    await update(postTagsRef, updates)
  }

  static async removePostTags(postId: string): Promise<void> {
    const postTagsRef = ref(database, "post_tags")
    const snapshot = await get(postTagsRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      const updates: { [key: string]: null } = {}

      Object.entries(data).forEach(([key, postTag]: [string, any]) => {
        if (postTag.post_id === postId) {
          updates[key] = null
        }
      })

      if (Object.keys(updates).length > 0) {
        await update(postTagsRef, updates)
      }
    }
  }

  static async removeAllPostTagsByTagId(tagId: string): Promise<void> {
    const postTagsRef = ref(database, "post_tags")
    const snapshot = await get(postTagsRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      const updates: { [key: string]: null } = {}

      Object.entries(data).forEach(([key, postTag]: [string, any]) => {
        if (postTag.tag_id === tagId) {
          updates[key] = null
        }
      })

      if (Object.keys(updates).length > 0) {
        await update(postTagsRef, updates)
      }
    }
  }

  static async getPostTags(postId: string): Promise<Tag[]> {
    const postTagsRef = ref(database, "post_tags")
    const snapshot = await get(postTagsRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      const tagIds = Object.values(data)
        .filter((postTag: any) => postTag.post_id === postId)
        .map((postTag: any) => postTag.tag_id)

      if (tagIds.length > 0) {
        const tags = await this.getTags()
        return tags.filter((tag) => tagIds.includes(tag.id!))
      }
    }
    return []
  }

  // Activity Logs
  static async getActivityLogs(): Promise<ActivityLog[]> {
    const logsRef = ref(database, "activity_logs")
    const snapshot = await get(logsRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      return Object.keys(data)
        .map((key) => ({ id: key, ...data[key] }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Sort by newest first
    }
    return []
  }

  static async getActivityLog(id: string): Promise<ActivityLog | null> {
    const logRef = ref(database, `activity_logs/${id}`)
    const snapshot = await get(logRef)
    if (snapshot.exists()) {
      return { id, ...snapshot.val() }
    }
    return null
  }

  static async addActivityLog(log: Omit<ActivityLog, "id">): Promise<string> {
    const logsRef = ref(database, "activity_logs")
    const newLogRef = push(logsRef)
    await set(newLogRef, {
      ...log,
      created_at: new Date().toISOString(),
    })
    return newLogRef.key!
  }

  static async deleteActivityLog(id: string, userId?: string): Promise<void> {
    const existingLog = await this.getActivityLog(id)
    const logAction = existingLog?.action || "Không xác định"

    const logRef = ref(database, `activity_logs/${id}`)
    await remove(logRef)

    if (userId) {
      await this.logActivity("log.delete", "System", "Warning", `Xóa nhật ký hoạt động: ${logAction}`, userId)
    }
  }

  static async getRecentActivityLogs(limit = 10): Promise<ActivityLog[]> {
    const logs = await this.getActivityLogs()
    return logs.slice(0, limit)
  }

  static async getActivityLogsByType(type: ActivityLog["type"]): Promise<ActivityLog[]> {
    const logs = await this.getActivityLogs()
    return logs.filter((log) => log.type === type)
  }

  static async getActivityLogsByLevel(level: ActivityLog["level"]): Promise<ActivityLog[]> {
    const logs = await this.getActivityLogs()
    return logs.filter((log) => log.level === level)
  }

  static async logActivity(
    action: string,
    type: ActivityLog["type"],
    level: ActivityLog["level"],
    details: string,
    user_id?: string,
    actor_details?: string,
    ip_address?: string,
  ): Promise<void> {
    try {
      const logData: Omit<ActivityLog, "id"> = {
        action,
        type,
        level,
        details,
        created_at: new Date().toISOString(),
      }

      // Only add optional fields if they have values
      if (user_id) {
        logData.user_id = user_id
      }

      if (actor_details) {
        logData.actor_details = actor_details
      }

      if (ip_address) {
        logData.ip_address = ip_address
      }

      await this.addActivityLog(logData)
    } catch (error) {
      console.error("Failed to log activity:", error)
    }
  }

  // User Management Methods
  static async getUsers(): Promise<User[]> {
    const usersRef = ref(database, "users")
    const snapshot = await get(usersRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      return Object.keys(data).map((key) => ({ id: key, ...data[key] }))
    }
    return []
  }

  static async getUser(id: string): Promise<User | null> {
    const userRef = ref(database, `users/${id}`)
    const snapshot = await get(userRef)
    if (snapshot.exists()) {
      return { id, ...snapshot.val() }
    }
    return null
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const usersRef = ref(database, "users")
    const snapshot = await get(usersRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      const userEntry = Object.entries(data).find(([_, user]: [string, any]) => user.email === email)
      if (userEntry) {
        const [id, userData] = userEntry
        const { id: _storedId, ...profile } = userData as User & { id?: string }
        return { id, ...profile }
      }
    }
    return null
  }

  static async createUser(userData: CreateUserData, firebaseUid: string, adminId?: string): Promise<string> {
    const userRef = ref(database, `users/${firebaseUid}`)
    const newUser: User = {
      id: firebaseUid,
      ...userData,
      status: userData.status || "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await set(userRef, newUser)

    if (adminId) {
      await this.logActivity(
        "user.create",
        "User",
        "Success",
        `Tạo tài khoản người dùng mới: ${userData.email}`,
        adminId,
      )
    }

    return firebaseUid
  }

  static async updateUser(id: string, updates: UpdateUserData, adminId?: string): Promise<void> {
    const existingUser = await this.getUser(id)
    const userEmail = existingUser?.email || "Không xác định"

    const userRef = ref(database, `users/${id}`)
    await update(userRef, {
      ...updates,
      updated_at: new Date().toISOString(),
    })

    if (adminId) {
      await this.logActivity(
        "user.update",
        "User",
        "Information",
        `Cập nhật thông tin người dùng: ${userEmail}`,
        adminId,
      )
    }
  }

  static async updateUserLastLogin(id: string): Promise<void> {
    const userRef = ref(database, `users/${id}`)
    await update(userRef, {
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  static async deleteUser(id: string, adminId?: string): Promise<void> {
    const existingUser = await this.getUser(id)
    const userEmail = existingUser?.email || "Không xác định"

    const userRef = ref(database, `users/${id}`)
    await remove(userRef)

    if (adminId) {
      await this.logActivity("user.delete", "User", "Warning", `Xóa tài khoản người dùng: ${userEmail}`, adminId)
    }
  }

  static async getUserStats(): Promise<UserStats> {
    const users = await this.getUsers()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return {
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      inactive: users.filter((u) => u.status === "inactive").length,
      newThisMonth: users.filter((u) => new Date(u.created_at) >= startOfMonth).length,
    }
  }

  // Slider CRUD operations
  static async getSliders(): Promise<Slider[]> {
    const slidersRef = ref(database, "sliders")
    const snapshot = await get(slidersRef)
    if (snapshot.exists()) {
      const data = snapshot.val()
      return Object.keys(data).map((key) => ({ id: key, ...data[key] }))
    }
    return []
  }

  static async getSlider(id: string): Promise<Slider | null> {
    const sliderRef = ref(database, `sliders/${id}`)
    const snapshot = await get(sliderRef)
    if (snapshot.exists()) {
      return { id, ...snapshot.val() }
    }
    return null
  }

  static async addSlider(slider: Omit<Slider, "id" | "createdAt">, userId?: string): Promise<string> {
    const slidersRef = ref(database, "sliders")
    const newSliderRef = push(slidersRef)
    await set(newSliderRef, {
      ...slider,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    if (userId) {
      await this.logActivity("slider.create", "Content", "Success", `Tạo slider mới: ${slider.title}`, userId)
    }

    return newSliderRef.key!
  }

  static async updateSlider(id: string, updates: Partial<Slider>, userId?: string): Promise<void> {
    const existingSlider = await this.getSlider(id)
    const sliderTitle = existingSlider?.title || "Không xác định"

    const sliderRef = ref(database, `sliders/${id}`)
    await update(sliderRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    })

    if (userId) {
      await this.logActivity("slider.update", "Content", "Information", `Cập nhật slider: ${sliderTitle}`, userId)
    }
  }

  static async deleteSlider(id: string, userId?: string): Promise<void> {
    const existingSlider = await this.getSlider(id)
    const sliderTitle = existingSlider?.title || "Không xác định"

    const sliderRef = ref(database, `sliders/${id}`)
    await remove(sliderRef)

    if (userId) {
      await this.logActivity("slider.delete", "Content", "Warning", `Xóa slider: ${sliderTitle}`, userId)
    }
  }

  static async getActiveSliders(): Promise<Slider[]> {
    const sliders = await this.getSliders()
    return sliders.filter((slider) => slider.isActive).sort((a, b) => a.order - b.order)
  }

  // Real-time listeners
  static onProductsChange(callback: (products: Product[]) => void): () => void {
    const productsRef = ref(database, "products")
    const unsubscribe = onValue(productsRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const products = Object.keys(data).map((key) => ({ id: key, ...data[key] }))

        // Populate category names
        const categories = await this.getCategories()
        const categoryMap = new Map(categories.map((cat) => [cat.id, cat.name]))

        const productsWithCategories = products.map((product) => ({
          ...product,
          category: categoryMap.get(product.category_id) || "Không xác định",
        }))

        callback(productsWithCategories)
      } else {
        callback([])
      }
    })
    return () => off(productsRef, "value", unsubscribe)
  }

  static onNewsChange(callback: (news: NewsArticle[]) => void): () => void {
    const newsRef = ref(database, "posts")
    const unsubscribe = onValue(newsRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const articles = Object.keys(data).map((key) => ({ id: key, ...data[key] }))

        // Populate tags for each article
        const articlesWithTags = await Promise.all(
          articles.map(async (article) => {
            const tags = await this.getPostTags(article.id!)
            return { ...article, tags, tag_ids: tags.map((tag) => tag.id!) }
          }),
        )

        callback(articlesWithTags)
      } else {
        callback([])
      }
    })
    return () => off(newsRef, "value", unsubscribe)
  }

  static onCategoriesChange(callback: (categories: Category[]) => void): () => void {
    const categoriesRef = ref(database, "categories")
    const unsubscribe = onValue(categoriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const categories = Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        callback(categories)
      } else {
        callback([])
      }
    })
    return () => off(categoriesRef, "value", unsubscribe)
  }

  static onTagsChange(callback: (tags: Tag[]) => void): () => void {
    const tagsRef = ref(database, "tags")
    const unsubscribe = onValue(tagsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const tags = Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        callback(tags)
      } else {
        callback([])
      }
    })
    return () => off(tagsRef, "value", unsubscribe)
  }

  static onContactsChange(callback: (contacts: Contact[]) => void): () => void {
    const contactsRef = ref(database, "contacts")
    const unsubscribe = onValue(contactsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const contacts = Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        callback(contacts)
      } else {
        callback([])
      }
    })
    return () => off(contactsRef, "value", unsubscribe)
  }

  static onActivityLogsChange(callback: (logs: ActivityLog[]) => void): () => void {
    const logsRef = ref(database, "activity_logs")
    const unsubscribe = onValue(logsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const logs = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        callback(logs)
      } else {
        callback([])
      }
    })
    return () => off(logsRef, "value", unsubscribe)
  }

  static onUsersChange(callback: (users: User[]) => void): () => void {
    const usersRef = ref(database, "users")
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const users = Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        callback(users)
      } else {
        callback([])
      }
    })
    return () => off(usersRef, "value", unsubscribe)
  }

  static onAgentsChange(callback: (agents: Agent[]) => void): () => void {
    const agentsRef = ref(database, "agent_registrations")
    const unsubscribe = onValue(agentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const agents = Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        callback(agents)
      } else {
        callback([])
      }
    })
    return () => off(agentsRef, "value", unsubscribe)
  }

  static onSlidersChange(callback: (sliders: Slider[]) => void): () => void {
    const slidersRef = ref(database, "sliders")
    const unsubscribe = onValue(slidersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const sliders = Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        callback(sliders)
      } else {
        callback([])
      }
    })
    return () => off(slidersRef, "value", unsubscribe)
  }
}

// Search methods
export class FirebaseSearch {
  static async searchProducts(query: string): Promise<Product[]> {
    const products = await FirebaseDB.getProducts()
    const searchTerm = query.toLowerCase()

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description && product.description.toLowerCase().includes(searchTerm)) ||
        (product.category && product.category.toLowerCase().includes(searchTerm)) ||
        (product.tags && product.tags.toLowerCase().includes(searchTerm)),
    )
  }

  static async searchNews(query: string): Promise<NewsArticle[]> {
    const news = await FirebaseDB.getNews()
    const searchTerm = query.toLowerCase()

    return news.filter(
      (article) =>
        article.title.toLowerCase().includes(searchTerm) ||
        (article.excerpt && article.excerpt.toLowerCase().includes(searchTerm)) ||
        article.content.toLowerCase().includes(searchTerm),
    )
  }
}

// Dashboard statistics
export class FirebaseDashboard {
  static async getDashboardStats(): Promise<{
    products: { total: number; active: number; outOfStock: number }
    news: { total: number; published: number; totalViews: number }
    contacts: { total: number; unread: number; urgent: number }
    agents: { total: number; approved: number; pending: number }
    logs: { total: number; errors: number; success: number }
  }> {
    const [products, news, contacts, agents, logs] = await Promise.all([
      FirebaseDB.getProducts(),
      FirebaseDB.getNews(),
      FirebaseDB.getContacts(),
      FirebaseDB.getAgents(),
      FirebaseDB.getActivityLogs(),
    ])

    return {
      products: {
        total: products.length,
        active: products.filter((p) => p.status === "active").length,
        outOfStock: products.filter((p) => p.stock === 0).length,
      },
      news: {
        total: news.length,
        published: news.filter((n) => n.status === "published").length,
        totalViews: news.reduce((sum, n) => sum + (n.view_count || 0), 0),
      },
      contacts: {
        total: contacts.length,
        unread: contacts.filter((c) => c.status === "new").length,
        urgent: contacts.filter((c) => c.priority === "high").length,
      },
      agents: {
        total: agents.length,
        approved: agents.filter((a) => a.status === "approved").length,
        pending: agents.filter((a) => a.status === "pending").length,
      },
      logs: {
        total: logs.length,
        errors: logs.filter((l) => l.level === "Error").length,
        success: logs.filter((l) => l.level === "Success").length,
      },
    }
  }

  static async getMonthlyStats(): Promise<{
    products: Array<{ month: string; count: number }>
    news: Array<{ month: string; count: number; views: number }>
    contacts: Array<{ month: string; count: number }>
    agents: Array<{ month: string; count: number }>
  }> {
    const [products, news, contacts, agents] = await Promise.all([
      FirebaseDB.getProducts(),
      FirebaseDB.getNews(),
      FirebaseDB.getContacts(),
      FirebaseDB.getAgents(),
    ])

    // Get last 6 months
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      months.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        name: date.toLocaleDateString("vi-VN", { month: "short", year: "numeric" }),
      })
    }

    const getMonthKey = (dateString: string) => {
      const date = new Date(dateString)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    }

    return {
      products: months.map((month) => ({
        month: month.name,
        count: products.filter((p) => getMonthKey(p.created_at) === month.key).length,
      })),
      news: months.map((month) => {
        const monthNews = news.filter((n) => getMonthKey(n.created_at) === month.key)
        return {
          month: month.name,
          count: monthNews.length,
          views: monthNews.reduce((sum, n) => sum + (n.view_count || 0), 0),
        }
      }),
      contacts: months.map((month) => ({
        month: month.name,
        count: contacts.filter((c) => getMonthKey(c.created_at) === month.key).length,
      })),
      agents: months.map((month) => ({
        month: month.name,
        count: agents.filter((a) => getMonthKey(a.createdAt) === month.key).length,
      })),
    }
  }

  static async getCategoryDistribution(): Promise<Array<{ name: string; value: number; color: string }>> {
    const [products, categories] = await Promise.all([FirebaseDB.getProducts(), FirebaseDB.getCategories()])

    const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658"]

    const categoryMap = new Map(categories.map((cat) => [cat.id, cat.name]))
    const distribution = new Map<string, number>()

    products.forEach((product) => {
      const categoryName = categoryMap.get(product.category_id) || "Khác"
      distribution.set(categoryName, (distribution.get(categoryName) || 0) + 1)
    })

    return Array.from(distribution.entries()).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length] ?? "#64748B",
    }))
  }

  static async getRecentActivity(limit = 10): Promise<ActivityLog[]> {
    return await FirebaseDB.getRecentActivityLogs(limit)
  }

  static async getTopContent(): Promise<{
    topProducts: Product[]
    topNews: NewsArticle[]
  }> {
    const [products, news] = await Promise.all([FirebaseDB.getProducts(), FirebaseDB.getNews()])

    // Sort products by stock (assuming higher stock = better performing)
    const topProducts = products
      .filter((p) => p.status === "active")
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 5)

    // Sort news by view count
    const topNews = news
      .filter((n) => n.status === "published")
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 5)

    return { topProducts, topNews }
  }
}
