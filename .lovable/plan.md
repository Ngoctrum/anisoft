
# Nâng cấp VPS Console — 3 tính năng mới

## 1. Template VPS (Preset)

Cho phép lưu cấu hình yêu thích và tạo VPS chỉ với 1 cú click.

**Database:**
- Bảng `vps_templates`: user_id, name, description, os_type, networking_type, vps_config, duration_hours, icon (emoji), is_favorite
- RLS: user chỉ xem/sửa/xóa template của mình

**UI:**
- Thêm tab "Templates" trong VPS Console
- Nút "Lưu làm template" ở form tạo VPS hiện tại
- Card danh sách template với nút "Deploy" (1-click tạo VPS từ template)
- Preset mặc định (system): Ubuntu Dev, Windows Gaming, Linux Server

## 2. Notification & Webhook

Gửi thông báo khi VPS ready / sắp hết hạn / bị lỗi.

**Database:**
- Bảng `notification_channels`: user_id, type (telegram/discord/webhook/email), config (JSONB: bot_token, chat_id, webhook_url...), events (array: ready, expiring, error, killed), enabled

**Edge function:** `send-vps-notification`
- Nhận session_id + event type
- Query channels của user
- Format message theo template và gửi (Telegram Bot API / Discord Webhook / generic webhook POST)

**Trigger points:**
- `update-rdp-info` gọi khi VPS ready
- `cleanup-failed-sessions` gọi khi expiring (còn 10 phút) và khi error
- `manage-vps` gọi khi kill

**UI:**
- Trang `Settings → Notifications` trong VPS Console
- Form thêm channel: chọn type, nhập config, tick events
- Nút "Test" gửi tin nhắn thử

## 3. File Manager tích hợp

Upload/download file giữa web và VPS qua SFTP.

**Cách tiếp cận:**
Do trình duyệt không kết nối SSH trực tiếp được, dùng edge function làm proxy:
- Edge function `vps-file-manager` dùng thư viện `ssh2` (Deno npm) kết nối tới VPS bằng SSH credentials trong session
- Endpoints: `list` (ls path), `upload` (nhận base64 → ghi file), `download` (đọc file → trả base64), `delete`, `mkdir`

**UI component `VPSFileManager`:**
- Modal mở từ session card ("File Manager" trong Quick Actions)
- Breadcrumb đường dẫn hiện tại
- Table: tên, size, modified, actions (download/delete)
- Drop zone upload file (giới hạn 10MB do edge function payload limit)
- Nút tạo folder mới

**Giới hạn:**
- Chỉ hoạt động với Linux VPS (SSH), Windows RDP không hỗ trợ đợt này
- File > 10MB: khuyến nghị dùng SCP/rsync trực tiếp (hiển thị hướng dẫn)

## Kỹ thuật

**Files tạo mới:**
- `src/components/vps/VPSTemplates.tsx`, `VPSTemplateCard.tsx`, `SaveTemplateDialog.tsx`
- `src/components/vps/VPSNotificationSettings.tsx`, `NotificationChannelForm.tsx`
- `src/components/vps/VPSFileManager.tsx`
- `supabase/functions/send-vps-notification/index.ts`
- `supabase/functions/vps-file-manager/index.ts`

**Files sửa:**
- `src/pages/VPSConsole.tsx` — thêm tabs Templates/Notifications
- `src/components/vps/VPSQuickActions.tsx` — thêm mục "File Manager"
- `supabase/functions/update-rdp-info/index.ts` — trigger notification
- `supabase/functions/cleanup-failed-sessions/index.ts` — trigger notification
- `supabase/functions/manage-vps/index.ts` — trigger notification

**Migrations:** 1 migration tạo 2 bảng `vps_templates` + `notification_channels` với RLS + GRANTs.

## Ước tính

Khoảng 12-15 file mới/sửa, 1 migration, 2 edge function mới. Triển khai theo thứ tự: (1) Templates, (2) Notifications, (3) File Manager để có thể review từng phần.

Bạn duyệt kế hoạch này để mình bắt đầu triển khai nhé?
