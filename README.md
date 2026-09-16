# Shop Bản Vẽ

Nền tảng tài liệu kỹ thuật và bản vẽ số, xây dựng với Next.js 14, TypeScript và Firebase. Shop Bản Vẽ hiện là website chính tại `/`. Các route Phương Thuận Phát cũ và namespace Firebase legacy vẫn được giữ lại trong giai đoạn chuyển đổi để có thể rollback.

## Trạng thái chức năng

- Public catalog, tìm kiếm, lọc danh mục, bài viết và chi tiết bản vẽ đọc dữ liệu Shop Bản Vẽ từ Firebase Realtime Database.
- Admin có CRUD cho bản vẽ, gallery nhiều ảnh/cover, danh mục, bài viết, yêu cầu mua và cấu hình liên hệ/Zalo.
- Người dùng có thể liên hệ trực tiếp qua Zalo hoặc gửi form yêu cầu mua/tư vấn.
- Hệ thống không giả lập thanh toán thành công và không cấp quyền tải file giả.
- `app/shopbanve-clone` hiện là implementation dùng chung cho các route public Shop Bản Vẽ; route `/shopbanve-clone` vẫn được giữ để xem compatibility page.
- Build, type-check, lint, browser smoke test và Firebase rules test chưa được coi là đạt nếu chưa có output thực tế.

## Công nghệ

- **Framework:** Next.js 14 App Router
- **Ngôn ngữ:** TypeScript strict mode
- **UI:** React, Tailwind CSS v4, Radix/shadcn-style primitives, Lucide
- **Backend:** Firebase Authentication, Realtime Database và Storage
- **Validation:** Zod
- **Charts:** Recharts

## Chạy local

Yêu cầu Node.js 18 trở lên.

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Biến môi trường Firebase

Sao chép `.env.example` thành `.env.local` và điền API key/App ID của Firebase Web App:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=shopduan-2bf1b.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://shopduan-2bf1b-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=shopduan-2bf1b
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=shopduan-2bf1b.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=639462115066
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_ADMIN_EMAILS=
```

Không commit `.env.local` hoặc bất kỳ file môi trường chứa giá trị thật. Firebase Web API key là cấu hình client, nhưng vẫn phải được quản lý qua biến môi trường và Firebase Rules.

## Route chính

### Public Shop Bản Vẽ

- `/`
- `/danh-muc`
- `/do-an`
- `/tim-kiem`
- `/bai-viet`
- `/bai-viet/[slug]`
- `/ban-ve/[slug]`
- `/dang-nhap`
- `/dang-ky`
- `/lien-he`
- `/gio-hang`
- `/huong-dan`
- `/ve-chung-toi`
- `/chinh-sach-bao-mat`

### Admin Shop Bản Vẽ

- `/admin/login`
- `/admin`
- `/admin/drawings`
- `/admin/drawings/new`
- `/admin/drawings/[id]/edit`
- `/admin/shop-categories`
- `/admin/articles`
- `/admin/articles/new`
- `/admin/articles/[id]/edit`
- `/admin/purchase-inquiries`
- `/admin/shop-settings`

### Legacy compatibility

Các route và node legacy được giữ lại để rollback hoặc vận hành song song:

- Public: `/san-pham`, `/tin-tuc`, `/gioi-thieu`, `/lien-he`, `/dang-ky-dai-ly`
- Admin: nhóm products, categories, news, contacts, agents, users, tags, sliders, settings và logs
- Firebase nodes: `products`, `posts`, `categories`, `contacts`, `users`, `agent_registrations`, `tags`, `sliders`

Không xóa các node legacy nếu chưa có backup/export và quyết định chuyển đổi rõ ràng.

## Firebase data model Shop Bản Vẽ

- `drawings`
- `shop_categories`
- `shop_articles`
- `shop_settings/contact`
- `purchase_inquiries`
- `activity_logs`

Bản vẽ có thể có nhiều ảnh trong `Drawing.images`, gồm URL, alt text, metadata, thứ tự và `coverImageId`. Bản vẽ `published` phải có ít nhất một ảnh. Ảnh upload được lưu trong Firebase Storage dưới namespace:

```text
shopbanve/drawings/{userId}/{id}-{fileName}
```

Xóa record không đồng nghĩa với xóa file vật lý trong Storage. Việc cleanup asset cũ cần server-side cleanup hoặc metadata `cleanup-pending`; không được giả định file đã bị xóa.

## Admin authorization

Admin có thể được cấp quyền bằng một trong các cơ chế sau:

- Firebase custom claims (`admin`, `role: admin` hoặc `isAdmin`)
- Profile `users/{uid}` với `role: admin`
- Profile `users/{uid}` có `permissions` chứa `admin`
- Allowlist tạm thời trong `NEXT_PUBLIC_ADMIN_EMAILS`

Firebase Rules vẫn là lớp bảo vệ cuối cùng. UI guard không thay thế Rules.

## Purchase flow

Trang chi tiết bản vẽ cung cấp hai lựa chọn:

1. Liên hệ trực tiếp qua Zalo, dùng URL hoặc số Zalo được cấu hình trong `/admin/shop-settings`.
2. Gửi form yêu cầu với họ tên, email, số điện thoại, công ty, mục đích, lời nhắn và consent.

Form ghi vào `purchase_inquiries` và admin có thể chuyển trạng thái `new`, `processing`, `contacted`, `closed` hoặc `spam`. Không có trạng thái thanh toán thành công hoặc entitlement tải file giả.

## Bảo mật

- Không hardcode Firebase credentials vào source.
- Không commit `.env.local`.
- Không expose `CLOUDINARY_API_SECRET` hoặc bất kỳ secret server-side nào vào client bundle.
- Upload mới dùng Firebase Storage; module `lib/cloudinary.ts` chỉ giữ compatibility cho một số màn hình legacy và không đọc secret client-side.
- Xác thực và phân quyền phải được kiểm tra lại bằng Firebase Rules trong môi trường thật.
- Không xóa dữ liệu Firebase legacy trước khi có backup/export và kế hoạch rollback.
- Không force-push, tạo remote mới hoặc xóa `.git` trong phạm vi migration này nếu chưa có chỉ dẫn và URL repository rõ ràng.

## Kiểm tra trước khi bàn giao

Chạy các lệnh sau khi môi trường cho phép:

```bash
npx tsc --noEmit --pretty false
npm run lint
npm run build
```

Hiện chưa có output thành công được xác nhận cho các lệnh trên. `next.config.mjs` hiện vẫn có `ignoreDuringBuilds` và `ignoreBuildErrors` cho compatibility, vì vậy phải chạy `npx tsc --noEmit` riêng và ghi nhận kết quả thực tế.

### Checklist vận hành

- [ ] Cấu hình đủ biến Firebase trong `.env.local`.
- [ ] Kiểm tra Firebase Realtime Database Rules: public published read và admin write.
- [ ] Kiểm tra Firebase Storage Rules: upload đúng namespace và chỉ admin được ghi/xóa theo policy.
- [ ] Kiểm tra custom claims/profile/allowlist với tài khoản admin thật.
- [ ] Test drawing CRUD, gallery nhiều ảnh, cover, reorder và draft không ảnh.
- [ ] Test article/category/inquiry/settings CRUD.
- [ ] Test Zalo URL, Zalo phone, bật/tắt Zalo và bật/tắt inquiry form.
- [ ] Test public routes ở 320px, 375px, 768px và desktop.
- [ ] Test keyboard focus, dialog close, label, alt text và Vietnamese glyphs.
- [ ] Test cleanup asset sau khi thay/xóa ảnh; không giả định Storage tự xóa.
- [ ] Giữ nguyên `.git` và Firebase legacy nodes cho tới khi migration/rollback được xác nhận.

## Rollback safety

- Không xóa `.git` trong giai đoạn này.
- Không khởi tạo remote mới hoặc push nếu chưa có repository URL và ủy quyền rõ ràng.
- Không xóa Firebase legacy nodes.
- Giữ các route legacy cho tới khi public/admin Shop Bản Vẽ, Rules, upload và dữ liệu đã được smoke-test thực tế.
