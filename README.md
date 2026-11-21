# CafeRadar — Bản đồ Quán Cafe "Chạy Deadline" Việt Nam

🌐 **Website chính thức:** [https://caferadar-vn.vercel.app/](https://caferadar-vn.vercel.app/)

**CafeRadar** giúp freelancer, sinh viên và dân văn phòng tìm quán cafe làm việc trên toàn Việt Nam chỉ trong 3 giây bằng dữ liệu thực tế do cộng đồng đóng góp.

## Tính năng nổi bật

- **Bản đồ Việt Nam trực quan (Leaflet + OpenStreetMap):** Khóa phạm vi lãnh thổ Việt Nam kèm nhãn chủ quyền **Quần đảo Hoàng Sa (Đà Nẵng, Việt Nam)** và **Quần đảo Trường Sa (Khánh Hòa, Việt Nam)**.
- **Bộ lọc thông minh & Gần tôi:** Lọc theo đánh giá thực tế của người dùng (*Ổ cắm từng bàn*, *Wi-Fi > 50Mbps*, *Mở 24/7*, *Không gian rộng rãi, yên tĩnh*, *Quán đã lưu*) và định vị **Gần tôi**.
- **Đánh giá chuẩn Google Maps & Chống spam:**
  - Phân bố sao `5★ → 1★`, lọc từng mức sao, đính kèm tối đa 3 ảnh, chọn mức Wi-Fi / ổ cắm / không gian quán.
  - Giới hạn **tối đa 3 quán/ngày** (mỗi quán 1 lần/ngày) và **Check-in Live 6h** (1 lần/quán, tự hết hạn sau 6 tiếng).
- **Danh hiệu "Người dùng năng nổ":** Khung tên hiển thị lấp lánh ngôi sao cho tài khoản đánh giá liên tiếp 7 ngày hoặc từ 10 quán trở lên.
- **Tài khoản & Phân quyền:** Đăng nhập bằng **Google OAuth 2.0** hoặc tạo tài khoản (tên đăng nhập cố định, tên hiển thị đổi sau 7 ngày, đổi avatar có xem trước & đồng bộ đánh giá), phân quyền **User / Admin**.
- **Đồng bộ Cloud (Supabase + Vercel):** Toàn bộ quán cộng đồng thêm, đánh giá, check-in 6h và lượt xem chi tiết (`👁`) được đồng bộ công khai trên **Supabase**.

## Chạy dự án cục bộ

```bash
npm install
npm run dev
```
