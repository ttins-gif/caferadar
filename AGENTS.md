# CafeRadar — Project Rules

## 1. Tự động cập nhật GitHub sau mỗi lần chỉnh sửa
- Sau **mọi lần chỉnh sửa** mã nguồn website CafeRadar:
  1. Chạy `npm.cmd run build` để kiểm tra không có lỗi TypeScript / Next.js.
  2. Đẩy toàn bộ các file vừa thay đổi lên nhánh `main` của repository `ttins-gif/caferadar` bằng `gh api` (vì máy hiện chưa cài `git.exe` trên PATH) để Vercel tự động deploy lên `https://caferadar-vn.vercel.app/`.

## 2. Quy tắc bản đồ Việt Nam & Chủ quyền
- Bản đồ Leaflet phải luôn giới hạn trong phạm vi lãnh thổ & vùng biển Việt Nam (`maxBounds` bao gồm cả Hoàng Sa & Trường Sa, `noWrap: true`).
- Luôn hiển thị rõ ràng nhãn chủ quyền **Quần đảo Hoàng Sa (Đà Nẵng, Việt Nam)** và **Quần đảo Trường Sa (Khánh Hòa, Việt Nam)**.
- Sử dụng tile OpenStreetMap miễn phí (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`), không dùng dịch vụ yêu cầu API key trả phí.

## 3. Môi trường Windows PowerShell
- Luôn dùng `npm.cmd` và `npx.cmd` thay cho `npm` / `npx` (tránh lỗi PowerShell ExecutionPolicy).

## 4. Trung thực dữ liệu đánh giá (Không tự chế)
- Mọi dữ liệu quán & đánh giá phải có nguồn uy tín (Google Maps, Threads, Facebook, hoặc trải nghiệm thực tế của người dùng).
- Tuyệt đối không tự ý chế đánh giá, tốc độ Wi-Fi, hay check-in giả; nếu chưa có dữ liệu thật thì để trống.
