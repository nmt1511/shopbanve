import fs from "node:fs"
import { initializeApp } from "firebase/app"
import { getDatabase, ref, update } from "firebase/database"

const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter(Boolean).map((line) => {
  const index = line.indexOf("=")
  return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")]
}))
const app = initializeApp({ apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, databaseURL: env.NEXT_PUBLIC_FIREBASE_DATABASE_URL, projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, appId: env.NEXT_PUBLIC_FIREBASE_APP_ID })
const database = getDatabase(app)
const now = new Date().toISOString()
const photo = (id, url, alt) => ({ id, url, alt, width: 1200, height: 800, format: "jpg", sortOrder: 0 })
const imageUrls = {
  thesis: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=1200&q=80",
  transport: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1200&q=80",
  standards: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80",
}
const updates = {
  "shop_categories/seed-thesis": { name: "Luận văn & nghiên cứu", slug: "luan-van-nghien-cuu", description: "Luận văn, chuyên đề và tài liệu nghiên cứu theo lĩnh vực.", image: imageUrls.thesis, order: 4, status: "active", createdAt: now, updatedAt: now },
  "shop_categories/seed-transport": { name: "Giao thông & hạ tầng", slug: "giao-thong-ha-tang", description: "Dự án đường, hạ tầng và công trình giao thông tham khảo.", image: imageUrls.transport, order: 5, status: "active", createdAt: now, updatedAt: now },
  "shop_categories/seed-standards": { name: "Tiêu chuẩn & tham khảo", slug: "tieu-chuan-tham-khao", description: "Tiêu chuẩn, checklist và tài liệu nền tảng cho dự án.", image: imageUrls.standards, order: 6, status: "active", createdAt: now, updatedAt: now },
  "drawings/seed-thesis-water": { title: "Luận văn thiết kế hệ thống cấp thoát nước", slug: "luan-van-thiet-ke-cap-thoat-nuoc", excerpt: "Tài liệu tham khảo cho luận văn hệ thống cấp thoát nước công trình.", description: "Nội dung gồm thuyết minh, sơ đồ nguyên lý và các bảng tính tham khảo cho đề tài.", categoryId: "seed-thesis", tags: ["luận văn", "cấp thoát nước", "nghiên cứu"], status: "published", price: 150000, priceType: "paid", coverImageId: "water-cover", images: [photo("water-cover", imageUrls.thesis, "Luận văn và tài liệu nghiên cứu")], fileMeta: [{ id: "water-pdf", name: "luan-van-cap-thoat-nuoc.pdf", format: "PDF", sizeLabel: "8.6 MB" }], software: ["Word", "Excel"], version: "2024", formats: ["PDF"], sizeLabel: "8.6 MB", viewCount: 63, featured: false, createdAt: now, updatedAt: now, publishedAt: now },
  "drawings/seed-road-project": { title: "Đồ án thiết kế tuyến đường đô thị", slug: "do-an-thiet-ke-tuyen-duong-do-thi", excerpt: "Hồ sơ tham khảo cho đồ án thiết kế tuyến đường và hạ tầng đô thị.", description: "Tài liệu giúp tham khảo cách trình bày bình đồ, trắc dọc, trắc ngang và thuyết minh đồ án.", categoryId: "seed-transport", tags: ["đồ án", "giao thông", "hạ tầng"], status: "published", price: 180000, priceType: "paid", coverImageId: "road-cover", images: [photo("road-cover", imageUrls.transport, "Dự án giao thông đô thị")], fileMeta: [{ id: "road-pdf", name: "do-an-tuyen-duong.pdf", format: "PDF", sizeLabel: "6.2 MB" }], software: ["Civil 3D"], version: "2023", formats: ["PDF"], sizeLabel: "6.2 MB", viewCount: 88, featured: true, createdAt: now, updatedAt: now, publishedAt: now },
  "drawings/seed-standards-checklist": { title: "Checklist kiểm tra hồ sơ thiết kế", slug: "checklist-kiem-tra-ho-so-thiet-ke", excerpt: "Danh sách kiểm tra nhanh trước khi nộp hoặc phát hành hồ sơ.", description: "Checklist tổng hợp các mục cần rà soát về tên file, phiên bản, khung tên và tính nhất quán của hồ sơ.", categoryId: "seed-standards", tags: ["tham khảo", "checklist", "hồ sơ"], status: "published", price: 0, priceType: "free", coverImageId: "checklist-cover", images: [photo("checklist-cover", imageUrls.standards, "Checklist kiểm tra hồ sơ")], fileMeta: [{ id: "checklist-pdf", name: "checklist-ho-so.pdf", format: "PDF", sizeLabel: "1.2 MB" }], software: ["PDF"], version: "2025", formats: ["PDF"], sizeLabel: "1.2 MB", viewCount: 117, featured: true, createdAt: now, updatedAt: now, publishedAt: now },
  "shop_articles/seed-thesis-outline": { title: "Cách xây dựng đề cương luận văn kỹ thuật", slug: "cach-xay-dung-de-cuong-luan-van-ky-thuat", content: "<p>Một đề cương tốt cần nêu rõ vấn đề, phạm vi, phương pháp và kết quả dự kiến.</p><p>Hãy bắt đầu từ câu hỏi nghiên cứu cụ thể rồi sắp xếp các chương theo mạch lập luận.</p>", excerpt: "Các bước thực tế để biến ý tưởng thành đề cương rõ ràng.", category: "Luận văn", tags: ["luận văn", "nghiên cứu"], featuredImage: imageUrls.thesis, status: "published", viewCount: 36, createdAt: now, updatedAt: now, publishedAt: now },
  "shop_articles/seed-reference-checklist": { title: "Checklist trước khi nộp đồ án", slug: "checklist-truoc-khi-nop-do-an", content: "<p>Kiểm tra tên file, phiên bản, mục lục, chú thích và sự thống nhất giữa bản thuyết minh với bản vẽ.</p>", excerpt: "Một checklist ngắn giúp bạn rà soát đồ án trước hạn nộp.", category: "Đồ án", tags: ["đồ án", "tham khảo"], featuredImage: imageUrls.standards, status: "published", viewCount: 54, createdAt: now, updatedAt: now, publishedAt: now },
}
await update(ref(database), updates)
console.log(`Added ${Object.keys(updates).length} additional shop records.`)
