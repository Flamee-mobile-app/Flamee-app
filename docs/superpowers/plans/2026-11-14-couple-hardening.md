# Ghép đôi — kế hoạch triển khai

**Mục tiêu:** Củng cố luồng lời mời hiện có, kiểm thử contract và ghi rõ giới hạn deferred link/E2E. Không ghi dữ liệu backend thật hoặc chạy migration.

- [x] Kiểm tra phiên, thời điểm hết hạn và phản hồi đến muộn; test tái hiện mã hết hạn khi request đang chờ và chấp nhận bị mất phản hồi.
- [x] Kiểm tra service, API, lỗi mã mời và phạm vi tài khoản; 39/39 test liên quan và typecheck đạt.
- [x] Kiểm tra PostgreSQL cô lập: hết hạn khi chờ ba loại khóa, nhận đồng thời, thời gian client sai và parity giữa schema/migration.
- [ ] Nghiệm thu E2E hai thiết bị và database/server thật; không suy diễn từ PostgreSQL cô lập.
- [x] Onboarding theo quyết định 14/11: màn chọn kết nối tham chiếu mockup; có nút bỏ qua, sau đó mở app vào Home; người dùng cập nhật cách quan tâm trong Hồ sơ. Code local giữ trạng thái bỏ qua riêng với hoàn tất; có migration chưa chạy, bảo vệ phiên, retry khi không xác nhận được lưu, ưu tiên link mời, tài khoản đã ghép đôi vào Home.
- [ ] Review/triển khai backend và migration trên môi trường được xác nhận; nghiệm thu giao diện, trạng thái sau restart/đổi thiết bị và các nhánh lỗi trên thiết bị thật. Ảnh dùng asset tạo từ mockup, chưa kiểm tra trực quan trên emulator.
- [ ] Deferred link tạm hoãn theo người dùng đến khi chọn nhà cung cấp, domain và signing.
