# Hồ sơ và cách quan tâm — kế hoạch triển khai

**Mục tiêu:** Hoàn thiện phần preferences đã có contract backend, giữ an toàn dữ liệu và ghi rõ giới hạn nghiệm thu hồ sơ/avatar/mật khẩu.

**Contract:** `GET/PUT /api/v1/users/me/preferences` sử dụng bearer và revision; PUT gửi đủ trường có sẵn, giữ timezone/locale và không tự hoàn tất onboarding. Quy tắc UX/privacy: PRD mục 6.1, 6.4 và `docs/progress/FEATURE-STATUS.md`.

1. [x] Test API: bearer, giữ trường không chỉnh, response sai, 401/409/timeout và xác nhận revision.
2. [x] Nối service qua auth public export; không lưu note vào log, route hoặc persistent storage; bỏ response thuộc phiên cũ.
3. [x] Nối form bằng component chung; có trạng thái tải/lỗi, lưu sau xác nhận, xử lý xung đột và chuỗi vi/en. Hai trường profile dùng outlined theo mockup đã có.
4. [ ] Nghiệm thu trên thiết bị và database đã xác minh schema/migration; công cụ điều khiển thiết bị hiện không khả dụng. Kiểm tra múi giờ tự động và phạm vi sở thích ngoài sáu lựa chọn khi có contract.
