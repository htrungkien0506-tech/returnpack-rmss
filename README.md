# RETURNPACK MANAGEMENT SYSTEM (RMS) — v3 Workshop Ready
**Tagline:** Giao hàng xanh – Bao bì tuần hoàn

Hệ thống SaaS quản lý vòng đời bao bì thương mại điện tử tái sử dụng (Reusable E-commerce Packaging Lifecycle Management System) sử dụng **Next.js (App Router) + React + TypeScript + Tailwind CSS + Supabase PostgreSQL (RLS)**.

## 1. Các tính năng mới đã bổ sung trong v3
- **Đồng bộ tuyến Shipper ↔ Khách hàng:** Đối tác vận chuyển (`PARTNER`) cấu hình tuyến theo Quận/Huyện và khung giờ; Khách hàng (`CUSTOMER`) đặt lịch trả túi khớp trực tiếp với tuyến Shipper khả dụng.
- **Hồ sơ mặc định & Lịch sử đóng góp xanh:** Lưu sẵn SĐT, địa chỉ mặc định và thống kê lượng rác thải nhựa giảm thiểu.
- **Shop tự phát hành Voucher:** Shop Đối tác (`SHOP`) tự tạo mã giảm giá của gian hàng mình và đẩy lên Ví Green Rewards cho khách đổi điểm.
- **Trạm A/B/C & Phiếu bàn giao Kho tổng:** Bên Vận chuyển/Vệ sinh lập phiếu bàn giao túi sạch Loại A và túi hỏng Loại C về Kho tổng Returnpack để Admin duyệt nhập kho.
- **Quản trị Green Rewards & Hoàn tác (Rollback):** Admin cấu hình định mức điểm, giám sát giao dịch và hoàn tác điểm lỗi có lưu Audit Log.

## 2. Cài đặt & Chạy trên máy
1. `cp .env.example .env.local` và điền thông tin Supabase.
2. Chạy lần lượt 3 file SQL trong `supabase/migrations/`:
   - `001_returnpack_schema_and_rls.sql`
   - `002_seed_demo_data.sql`
   - `003_workshop_full_features.sql`
3. Chạy `npm install && npm run dev`.
