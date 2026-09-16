import fs from "node:fs"
import { initializeApp } from "firebase/app"
import { getDatabase, ref, set, update } from "firebase/database"

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=")
      return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")]
    }),
)

const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
})
const database = getDatabase(app)
const now = new Date().toISOString()

// Public images are intentionally remote so the seed does not upload binaries.
const images = {
  architecture: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&q=80",
  structure: "https://images.unsplash.com/photo-1503387762-592e9b7305b2?w=1200&q=80",
  interior: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80",
  factory: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=1200&q=80",
  article: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1200&q=80",
}

const image = (id, url, alt) => ({ id, url, alt, width: 1200, height: 800, format: "jpg", sortOrder: 0 })
const file = (id, name, format, sizeLabel) => ({ id, name, format, version: "1.0", sizeLabel })

const categories = {
  "seed-architecture": { name: "Kiến trúc", slug: "kien-truc", description: "Mặt bằng, mặt đứng và hồ sơ kiến trúc thực hành.", image: images.architecture, order: 1, status: "active", createdAt: now, updatedAt: now },
  "seed-structure": { name: "Kết cấu", slug: "ket-cau", description: "Tài liệu kết cấu bê tông và thép cho đồ án kỹ thuật.", image: images.structure, order: 2, status: "active", createdAt: now, updatedAt: now },
  "seed-interior": { name: "Nội thất", slug: "noi-that", description: "Bố trí không gian và chi tiết nội thất tham khảo.", image: images.interior, order: 3, status: "active", createdAt: now, updatedAt: now },
}

const drawings = {
  "seed-house-plan": {
    title: "Hồ sơ nhà phố 3 tầng hiện đại", slug: "ho-so-nha-pho-3-tang-hien-dai", excerpt: "Bộ bản vẽ tham khảo cho nhà phố 3 tầng trên khu đất đô thị.", description: "Bộ hồ sơ gồm mặt bằng, mặt đứng và mặt cắt cơ bản, phù hợp để tham khảo khi triển khai đồ án.", categoryId: "seed-architecture", tags: ["nhà phố", "kiến trúc", "mặt bằng"], status: "published", price: 120000, priceType: "paid", coverImageId: "house-cover", images: [image("house-cover", images.architecture, "Phối cảnh nhà phố hiện đại")], fileMeta: [file("house-dwg", "nha-pho-mat-bang.dwg", "DWG", "4.2 MB"), file("house-pdf", "nha-pho-ho-so.pdf", "PDF", "2.8 MB")], software: ["AutoCAD"], version: "2024", formats: ["DWG", "PDF"], sizeLabel: "7 MB", viewCount: 184, featured: true, createdAt: now, updatedAt: now, publishedAt: now,
  },
  "seed-steel-frame": {
    title: "Chi tiết khung thép nhà xưởng", slug: "chi-tiet-khung-thep-nha-xuong", excerpt: "Bản vẽ tham khảo liên kết và bố trí khung thép nhà xưởng.", description: "Tài liệu minh họa các cấu kiện chính, lưới cột và một số chi tiết liên kết phổ biến.", categoryId: "seed-structure", tags: ["khung thép", "nhà xưởng", "kết cấu"], status: "published", price: 0, priceType: "free", coverImageId: "steel-cover", images: [image("steel-cover", images.factory, "Kết cấu khung thép nhà xưởng")], fileMeta: [file("steel-pdf", "khung-thep-tham-khao.pdf", "PDF", "5.1 MB")], software: ["AutoCAD", "Tekla"], version: "2023", formats: ["PDF"], sizeLabel: "5.1 MB", viewCount: 96, featured: true, createdAt: now, updatedAt: now, publishedAt: now,
  },
  "seed-interior-layout": {
    title: "Bố trí nội thất căn hộ 2 phòng ngủ", slug: "bo-tri-noi-that-can-ho-2-phong-ngu", excerpt: "Mặt bằng bố trí nội thất gọn và dễ triển khai cho căn hộ vừa.", description: "Bộ tài liệu tham khảo cho cách phân khu chức năng, giao thông và kích thước nội thất cơ bản.", categoryId: "seed-interior", tags: ["nội thất", "căn hộ", "mặt bằng"], status: "published", price: 85000, priceType: "paid", coverImageId: "interior-cover", images: [image("interior-cover", images.interior, "Không gian nội thất căn hộ")], fileMeta: [file("interior-dwg", "can-ho-noi-that.dwg", "DWG", "3.4 MB")], software: ["AutoCAD"], version: "2024", formats: ["DWG"], sizeLabel: "3.4 MB", viewCount: 72, featured: true, createdAt: now, updatedAt: now, publishedAt: now,
  },
}

const articles = {
  "seed-reading-drawings": { title: "Cách đọc nhanh một bộ bản vẽ kỹ thuật", slug: "cach-doc-nhanh-bo-ban-ve-ky-thuat", content: "<p>Bắt đầu bằng mục lục, khung tên và ký hiệu. Sau đó đối chiếu mặt bằng với mặt cắt trước khi xem chi tiết.</p><p>Thói quen kiểm tra tỉ lệ, đơn vị và phiên bản giúp hạn chế nhầm lẫn khi triển khai.</p>", excerpt: "Một quy trình ngắn để bắt đầu đọc hồ sơ kỹ thuật có hệ thống.", category: "Kỹ năng", tags: ["bản vẽ", "kỹ năng"], featuredImage: images.article, status: "published", viewCount: 41, createdAt: now, updatedAt: now, publishedAt: now },
  "seed-steel-basics": { title: "Những điểm cần kiểm tra trong bản vẽ khung thép", slug: "diem-can-kiem-tra-ban-ve-khung-thep", content: "<p>Kiểm tra lưới trục, cao độ, tiết diện cấu kiện và vị trí liên kết trước khi bóc tách khối lượng.</p>", excerpt: "Danh sách kiểm tra ngắn cho sinh viên và kỹ thuật viên mới bắt đầu.", category: "Kết cấu", tags: ["khung thép", "kiểm tra"], featuredImage: images.factory, status: "published", viewCount: 28, createdAt: now, updatedAt: now, publishedAt: now },
}

const inquiries = {
  "seed-inquiry-1": { drawingId: "seed-house-plan", drawingTitle: drawings["seed-house-plan"].title, source: "form", status: "new", fullName: "Nguyễn Minh An", email: "minhan.seed@example.com", phone: "0912345678", company: "Studio An", projectPurpose: "Tham khảo cho đồ án tốt nghiệp", message: "Mình muốn biết bộ hồ sơ có kèm mặt cắt và mặt đứng không.", consent: true, createdAt: now, updatedAt: now },
  "seed-inquiry-2": { drawingId: "seed-steel-frame", drawingTitle: drawings["seed-steel-frame"].title, source: "zalo", status: "processing", fullName: "Trần Quốc Bình", email: "quocbinh.seed@example.com", phone: "0987654321", projectPurpose: "Tham khảo phương án nhà xưởng", message: "Cần tư vấn thêm về định dạng file.", consent: true, createdAt: now, updatedAt: now },
}

const seedUpdates = {}
for (const [id, value] of Object.entries(categories)) seedUpdates[`shop_categories/${id}`] = value
for (const [id, value] of Object.entries(drawings)) seedUpdates[`drawings/${id}`] = value
for (const [id, value] of Object.entries(articles)) seedUpdates[`shop_articles/${id}`] = value
for (const [id, value] of Object.entries(inquiries)) seedUpdates[`purchase_inquiries/${id}`] = value

await update(ref(database), seedUpdates)
await set(ref(database, "shop_settings/contact"), { shopName: "Shop Bản Vẽ", email: "", phone: "", zaloEnabled: false, zaloMessageTemplate: "Xin chào, tôi muốn hỏi về tài liệu.", inquiryEnabled: true, updatedAt: now })

console.log(`Seeded ${Object.keys(categories).length} categories, ${Object.keys(drawings).length} drawings, ${Object.keys(articles).length} articles and ${Object.keys(inquiries).length} inquiries.`)
