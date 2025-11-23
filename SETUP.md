# Hướng Dẫn Cài Đặt Ani Studio

## Yêu Cầu Hệ Thống
- Node.js 16+ và npm
- Tài khoản Supabase (miễn phí)
- cPanel hosting với hỗ trợ Node.js (tùy chọn)

## Bước 1: Clone Project

```bash
git clone <YOUR_GIT_URL>
cd <PROJECT_NAME>
npm install
```

## Bước 2: Tạo Database Riêng (Supabase)

### 2.1. Tạo Supabase Project
1. Truy cập [supabase.com](https://supabase.com)
2. Đăng ký/Đăng nhập tài khoản
3. Click **New Project**
4. Điền thông tin:
   - Project name: `ani-studio` (hoặc tên bạn muốn)
   - Database password: Tạo password mạnh
   - Region: Chọn gần bạn nhất
5. Click **Create new project** (chờ 2-3 phút)

### 2.2. Lấy API Keys
Sau khi project tạo xong:
1. Vào **Settings** → **API**
2. Copy các giá trị sau:
   - **Project URL** (dạng: `https://xxx.supabase.co`)
   - **anon/public key** (key dài)
   - **Project Reference ID** (dạng: `abcdefgh`)

### 2.3. Import Database Schema
1. Vào **SQL Editor** trong Supabase dashboard
2. Copy toàn bộ nội dung từ file **`database-schema.sql`** 
3. Paste vào SQL Editor và click **Run**
4. Chờ vài giây để tất cả tables, functions, triggers được tạo

**Lưu ý**: File `database-schema.sql` đã bao gồm toàn bộ:
- Tables (profiles, tools, error_reports, etc.)
- Functions (has_role, handle_new_user, etc.)
- Triggers (auto create profile, update timestamps)
- RLS Policies (security rules)
- Default settings data

## Bước 3: Cấu Hình Environment Variables

Tạo file `.env` trong thư mục gốc của project:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_SUPABASE_PROJECT_ID=your-project-id
```

**Thay thế các giá trị**:
- `VITE_SUPABASE_URL`: Project URL từ bước 2.2
- `VITE_SUPABASE_PUBLISHABLE_KEY`: anon/public key từ bước 2.2
- `VITE_SUPABASE_PROJECT_ID`: Project Reference ID từ bước 2.2

## Bước 4: Cấu Hình Authentication

1. Trong Supabase dashboard, vào **Authentication** → **Providers**
2. Enable **Email** provider
3. Vào **Authentication** → **Settings**:
   - Bật **Enable email confirmations** = OFF (cho môi trường test)
   - Hoặc cấu hình SMTP để gửi email xác thực

## Bước 5: Tạo Admin User Đầu Tiên

### 5.1. Đăng ký tài khoản đầu tiên qua website
1. Chạy `npm run dev`
2. Truy cập http://localhost:8080
3. Đăng ký tài khoản mới

### 5.2. Cấp quyền Admin
1. Vào Supabase dashboard → **Table Editor** → `user_roles`
2. Tìm user vừa tạo (theo `user_id`)
3. Sửa `role` thành `admin` hoặc `super_admin`

Hoặc dùng SQL:
```sql
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = 'user-id-của-bạn';
```

## Bước 6: Chạy Development Server

```bash
npm run dev
```

Website sẽ chạy tại: http://localhost:8080

## Deploy Lên cPanel Hosting

### 6.1. Build Production
```bash
npm run build
```
Folder `dist` sẽ được tạo ra.

### 6.2. Upload lên cPanel
1. Đăng nhập cPanel
2. Vào **File Manager**
3. Upload toàn bộ nội dung folder `dist` vào `public_html`
4. Tạo file `.htaccess` trong `public_html`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### 6.3. Cấu hình Environment Variables trên Production

**Tạo file `env.js` trong public_html**:
```javascript
window.ENV = {
  VITE_SUPABASE_URL: 'https://your-project.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'your-anon-key',
  VITE_SUPABASE_PROJECT_ID: 'your-project-id'
}
```

**Sửa file `index.html`** để load env.js trước:
```html
<head>
  <script src="/env.js"></script>
  <!-- các script khác -->
</head>
```

## Cấu Hình SMTP (Tùy chọn)

1. Vào Admin Panel → Settings → SMTP
2. Điền thông tin:
   - **SMTP Host**: smtp.gmail.com (hoặc smtp server của bạn)
   - **SMTP Port**: 587
   - **SMTP User**: your-email@gmail.com
   - **SMTP Password**: app password (không phải password Gmail thông thường)
   - **From Email**: your-email@gmail.com
   - **From Name**: Ani Studio

### Tạo App Password cho Gmail:
1. Vào Google Account → Security
2. Bật 2-Step Verification
3. Tìm "App passwords"
4. Tạo mới cho "Mail"
5. Copy password và dùng làm SMTP Password

## Cấu Hình Bảo Trì

Trong Admin Panel → Settings → General:
- Bật/Tắt **Maintenance Mode**
- Admin vẫn có thể truy cập khi bảo trì

## Troubleshooting

### Lỗi kết nối Database
- Kiểm tra lại `.env` có đúng API keys không
- Kiểm tra Supabase project có đang active không
- Xem Console log để debug

### Lỗi Authentication
- Vào Supabase → Authentication → Settings
- Tắt email confirmation cho môi trường test
- Kiểm tra RLS policies trong Database

### Lỗi 404 khi refresh page trên cPanel
- Kiểm tra file `.htaccess` đã tạo chưa
- Đảm bảo mod_rewrite được enable trên server

## Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra Console log trong Browser (F12)
2. Kiểm tra Supabase logs
3. Tham khảo [Supabase Documentation](https://supabase.com/docs)

---

**Lưu ý**: Database và Authentication hoàn toàn chạy trên Supabase Cloud (miễn phí). cPanel chỉ host frontend (static files).
