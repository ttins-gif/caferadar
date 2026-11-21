# CafeRadar — Bản đồ Quán Cafe "Chạy Deadline" (Việt Nam)

Ứng dụng web **Work-from-Cafe Radar** giúp freelancer, sinh viên và dân văn phòng tìm quán cafe làm việc trên toàn Việt Nam chỉ trong 3 giây bằng dữ liệu có cấu trúc.

## Tính năng MVP đã có

- **Bộ lọc sinh tồn (Quick Filters)**: Lọc nhanh theo *Ổ cắm từng bàn*, *Wi-Fi > 50Mbps*, *Mở 24/7*, *Yên tĩnh (họp online)*, *Bàn cao công thái học*, *Không đuổi khi ngồi lâu*, kết hợp lọc theo quận & tìm kiếm.
- **Bản đồ tương tác (Leaflet + OpenStreetMap/CartoDB)**: Ghim hiển thị điểm chạy deadline, nhãn `24h`, quán nổi bật (`★`) và cảnh báo thực tế. Hỗ trợ nút **Gần tôi** (GPS).
- **Thẻ điểm "Chạy deadline" (Workspace Scorecard)**:
  - Độ ồn theo khung giờ (Sáng / Chiều / Tối)
  - Tỷ lệ ổ cắm & tốc độ Wi-Fi thực tế (Download/Upload Mbps)
  - Mức giá nước, ghi chú thái độ nhân viên & voucher ưu đãi
- **Cập nhật tình trạng thực tế (Crowd-sourced Check-in)**: 1 chạm báo *Wi-Fi đang lag*, *Quán đang sửa chữa/ồn*, *Sắp hết bàn*, *Đang yên tĩnh*... tự động hết hạn sau **6 tiếng**.
- **Đóng góp quán ruột**: Form thêm quán mới theo dữ liệu có cấu trúc.

## Chạy dự án cục bộ

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt.

## Kết nối Supabase (khi lên Production)

File [`supabase/schema.sql`](./supabase/schema.sql) đã chuẩn bị sẵn:
- Bật extension **PostGIS**
- Bảng `cafes` (có cột `location` kiểu `geography(Point, 4326)`)
- Bảng `live_checkins` (tự động set `expires_at = now() + interval '6 hours'`)
- RPC `get_nearby_cafes(user_lat, user_lng, radius_meters)`

<!-- supabase-connected -->
