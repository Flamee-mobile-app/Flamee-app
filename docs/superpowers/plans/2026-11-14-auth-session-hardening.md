# Đăng ký, đăng nhập và phiên — kế hoạch kiểm tra

**Mục tiêu:** Hoàn thiện các nhánh lỗi có thể kiểm chứng của luồng email/mật khẩu và ghi rõ giới hạn nghiệm thu thiết bị.

**Phạm vi:** API auth thật, phiên, SecureStore, refresh, đăng xuất và lỗi tương ứng; không triển khai provider/OTP hoặc thay đổi dữ liệu tài khoản thật. Đối chiếu `docs/progress/FEATURE-STATUS.md` và `.doc/E2E-ACCEPTANCE.md`.

1. [x] Rà luồng tạo, khôi phục, thay thế và kết thúc phiên cùng các test hiện có, tập trung lỗi lưu/xóa credential và response đến muộn.
2. [x] Thêm test và xử lý thu hồi phiên chưa công bố khi lưu thất bại; từ chối refresh sai tài khoản/thiếu token và bảo vệ phiên mới khỏi cleanup cũ. Không log credential hoặc dữ liệu riêng tư.
3. [x] Rà validation và thông báo lỗi UI; chuyển adapter bàn phím native về shared để khôi phục quy tắc design system.
4. [ ] Hoàn tất bằng chứng E2E trên thiết bị cho các nhánh trong `.doc/E2E-ACCEPTANCE.md`; công cụ điều khiển thiết bị hiện không kết nối được. Kết quả kiểm thử tự động và lỗi nền ghi ở tài liệu tiến độ, không thay thế E2E.
