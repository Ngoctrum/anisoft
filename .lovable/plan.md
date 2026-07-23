## 1. Nâng quyền admin
- Đã cấp role `admin` cho tài khoản `NexusOverride` (đã chạy migration).

## 2. Feature flag toàn cục "Nexus Mode"
- Thêm key `nexus_mode_enabled` (boolean) vào bảng `site_settings` (mặc định `false`).
- Thêm toggle trong Admin > Cài đặt: "Bật chế độ Nexus Override".
- Tạo `NexusModeProvider` (React context) đọc setting này 1 lần khi app load + realtime subscribe.
- Logic route:
  - `nexus_mode_enabled = false` → site chạy như hiện tại (Ani Studio).
  - `nexus_mode_enabled = true` + user **không phải admin** → toàn bộ route redirect sang site Nexus Override mới. Các trang cũ (`/tools`, `/apps`, `/vps-console`, `/gdrive-scanner`, `/courses`, `/docs`, `/support`, `/report`, `/website`, `/apps/*`, `/tools/*`, `/download/*`) trả về 404 hoặc redirect về `/`.
  - `nexus_mode_enabled = true` + user **là admin** → admin vẫn thấy site Ani Studio cũ đầy đủ (có banner nhỏ "Bạn đang xem chế độ admin, site đang ẩn với public"). Admin cũng có thể bấm nút xem thử site Nexus Override.

## 3. Site Nexus Override (mới)
Danh mục shop share tài khoản premium: ChatGPT, Netflix, Canva, Gemini, YouTube Premium, CapCut Pro, Spotify, các AI tools, đọc truyện tranh, v.v.

### Routes mới (dùng chung route `/`)
- `/` — Landing: hero + featured products + categories + testimonials + FAQ + CTA
- `/products` — danh sách tất cả sản phẩm với filter theo category, giá, tình trạng
- `/products/:slug` — chi tiết sản phẩm (mô tả, gói giá, chính sách bảo hành, nút mua/đặt hàng)
- `/cart` — giỏ hàng đơn giản (localStorage)
- `/checkout` — form đặt hàng (tên, liên hệ Zalo/Telegram, ghi chú) → tạo `order` record. Bản đầu không tích hợp payment, chỉ tạo order để admin xác nhận thủ công.
- `/orders` — lịch sử đơn của user
- `/account` — tái sử dụng trang account cũ (có thêm section đơn hàng)
- `/login`, `/register` — giữ nguyên, chỉ đổi branding

### Data model mới
- `nexus_products`: id, slug, name, category, description, image_url, features (jsonb: array các gói giá + thời hạn), stock_status, is_featured, is_active, sort_order, created_at, updated_at
- `nexus_categories`: id, slug, name, icon, sort_order
- `nexus_orders`: id, user_id (nullable cho guest), product_id, plan_name, price, quantity, contact_name, contact_phone, contact_channel (zalo/telegram/messenger), note, status (pending/confirmed/delivered/cancelled), created_at, updated_at
- Tất cả bảng: GRANT + RLS phù hợp; products/categories public read; orders user chỉ xem đơn của mình, admin xem tất cả.

### Admin quản lý Nexus
- Sidebar admin thêm mục: "Nexus - Sản phẩm", "Nexus - Danh mục", "Nexus - Đơn hàng"
- CRUD đầy đủ cho từng mục.

## 4. Hệ thống 2 theme (Light / Dark)
- Thêm `ThemeProvider` (localStorage `nexus-theme`, mặc định dark).
- Bổ sung biến CSS `.light` (đã có sẵn) — tinh chỉnh cho phù hợp shop.
- Toggle theme (Sun/Moon icon) hiển thị trên Header cả 2 site.
- Nexus Override dùng palette mới:
  - Dark: nền `hsl(240 15% 6%)`, accent tím-hồng `hsl(280 90% 65%)` → `hsl(320 90% 60%)` gradient, viền neon nhẹ.
  - Light: nền trắng ngà `hsl(30 20% 98%)`, accent cùng tone tím-hồng đậm hơn, shadow mềm.
- Fonts: heading `Sora`, body `Inter` (Google Fonts).

## 5. Cấu trúc thư mục
```
src/
  contexts/
    NexusModeContext.tsx
    ThemeContext.tsx
  components/nexus/
    NexusHeader.tsx
    NexusFooter.tsx
    NexusProductCard.tsx
    NexusCategoryPill.tsx
    NexusLayout.tsx
  pages/nexus/
    Landing.tsx
    Products.tsx
    ProductDetail.tsx
    Cart.tsx
    Checkout.tsx
    Orders.tsx
  pages/admin/
    NexusProducts.tsx
    NexusCategories.tsx
    NexusOrders.tsx
```

## 6. Router logic (App.tsx)
- Bọc Routes trong `NexusModeProvider` + `ThemeProvider`.
- Component `RouteSwitcher` quyết định set routes nào render dựa trên `(nexusEnabled, isAdmin)`.
- Admin luôn có `/admin/*` truy cập được.
- Route `/preview-nexus` chỉ dành cho admin xem thử site Nexus khi flag đang tắt.

## 7. Seed dữ liệu mẫu
- Insert 6 category (ChatGPT, Netflix, Canva, Gemini, YouTube, Giải trí khác).
- Insert ~8 sản phẩm mẫu để landing không trống khi bật lần đầu.

## Chi tiết kỹ thuật
- Tất cả route logic tập trung ở `App.tsx` để dễ maintain.
- Không xóa/đổi tên file cũ — chỉ ẩn qua router; khi flag tắt là quay về nguyên trạng.
- Ngăn flicker: `NexusModeProvider` render skeleton loader khi đang fetch setting lần đầu.
- Order flow chưa cần cổng thanh toán; admin liên hệ user qua thông tin đơn để giao account.

Bạn duyệt kế hoạch để mình bắt đầu triển khai từng bước nhé?