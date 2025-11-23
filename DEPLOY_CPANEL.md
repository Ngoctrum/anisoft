# Hướng Dẫn Deploy Ani Studio lên cPanel/PHP Hosting

## 🎯 Yêu Cầu
- cPanel hosting với PHP
- Domain đã trỏ về hosting
- Truy cập File Manager hoặc FTP

## 📝 Các Bước Deploy

### Bước 1: Build Project (Trên Máy Tính)

**Option A: Build trên Windows/Mac/Linux**
```bash
# Mở Terminal/CMD tại thư mục project
npm install
npm run build
```
Sau khi chạy xong, thư mục `dist` sẽ được tạo ra.

**Option B: Dùng Lovable Publish**
1. Click nút "Publish" trên Lovable
2. Đợi build xong
3. Download toàn bộ thư mục `dist`

**Option C: Dùng Vercel/Netlify để build**
1. Connect GitHub với Vercel/Netlify
2. Vercel sẽ tự build
3. Download thư mục build về máy

### Bước 2: Chuẩn Bị File Upload

Trong thư mục `dist` sau khi build sẽ có:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
├── robots.txt
├── favicon.ico
└── ...
```

**Thêm file `.htaccess`** (đã tạo sẵn ở root project):
- Copy file `.htaccess` từ root project vào trong thư mục `dist/`

### Bước 3: Upload lên cPanel

**Cách 1: Dùng File Manager**
1. Login vào cPanel
2. Mở **File Manager**
3. Vào thư mục `public_html` (hoặc thư mục của domain)
4. **XÓA TẤT CẢ** file cũ trong `public_html` (nếu có)
5. Upload **tất cả file** trong thư mục `dist/` lên `public_html`
6. Đảm bảo file `.htaccess` cũng được upload

**Cách 2: Dùng FTP (FileZilla)**
1. Kết nối FTP đến hosting
2. Vào thư mục `public_html`
3. Xóa tất cả file cũ
4. Upload tất cả file từ `dist/` lên `public_html`

### Bước 4: Kiểm Tra Domain

Sau khi upload xong, cấu trúc file trên server phải giống thế này:

```
public_html/
├── .htaccess          ← FILE NÀY QUAN TRỌNG!
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
├── robots.txt
└── favicon.ico
```

### Bước 5: Truy Cập Website

Vào domain của bạn (ví dụ: `anishop.site`)

Website sẽ hoạt động ngay! ✅

## 🔧 Xử Lý Lỗi

### Lỗi 1: Trang con bị 404
**Nguyên nhân:** Thiếu file `.htaccess`  
**Giải pháp:** Upload lại file `.htaccess` vào `public_html`

### Lỗi 2: Không load được CSS/JS
**Nguyên nhân:** Đường dẫn base URL sai  
**Giải pháp:** 
1. Check file `vite.config.ts` phải có `base: '/'`
2. Build lại project

### Lỗi 3: Không kết nối được Supabase
**Nguyên nhân:** Thiếu environment variables  
**Giải pháp:** 
- Environment variables đã được build sẵn vào file JS
- Không cần cấu hình gì thêm
- Nếu vẫn lỗi, check lại file `.env` trước khi build

### Lỗi 4: Website hiển thị "Index of /"
**Nguyên nhân:** Thiếu file `index.html`  
**Giải pháp:** Đảm bảo file `index.html` ở ngay thư mục `public_html`

## 🚀 Cập Nhật Website Sau Này

Khi cần cập nhật:
1. Build lại project: `npm run build`
2. Xóa tất cả file trong `public_html` (trừ `.htaccess` nếu không thay đổi)
3. Upload file mới từ `dist/` lên
4. Xong!

## 📌 Lưu Ý Quan Trọng

1. **KHÔNG** upload thư mục `node_modules` lên server
2. **KHÔNG** upload file `.env` lên server (đã được build vào code rồi)
3. **PHẢI CÓ** file `.htaccess` để React Router hoạt động
4. **PHẢI XÓA** file cũ trước khi upload file mới
5. File `.htaccess` phải ở cùng cấp với `index.html`

## 🎉 Xong!

Website của bạn giờ đã live trên PHP hosting rồi! 🚀

Nếu có lỗi gì, check lại các bước trên hoặc inbox để được hỗ trợ.
