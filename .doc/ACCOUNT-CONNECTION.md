# Kết nối và tài khoản — 2026-11-24

Theo yêu cầu mới, mục Menu → Kết nối và tài khoản hiển thị tài khoản đang kết nối với partner, thay toàn bộ cụm đổi mật khẩu/đăng xuất/thông báo chưa khả dụng trước đây. Không đổi các màn Dữ liệu/Hỗ trợ hoặc tự chuyển các hành động bị bỏ sang vị trí khác.

Yêu cầu tiếp theo cùng ngày: mục Cách quan tâm cũng chỉ hiển thị cùng thông tin kết nối, dùng lại AccountLifecycleScreen mode account và title Kết nối và tài khoản. Settings không còn mount CareSettingsForm hoặc đọc/lưu preferences khi mở mục này; dữ liệu preferences cũ trên server được giữ nguyên, không xóa hoặc thay đổi.

- Giữ FeatureScreen/ContentSurface của Settings. Dùng ConnectedUsers qua public export của invites để hiển thị avatar/tên thật của hai người và trạng thái kết nối được xác nhận.
- Dùng GET `/couple` từ inviteService với connection query/cache theo session/account/couple hiện có. Chỉ hiển thị response đúng couple và có chính tài khoản hiện tại; không nhận hai thành viên trùng ID. Không đưa email/ID hoặc nội dung riêng tư vào route params/toast.
- Chưa bootstrap có skeleton; chưa ghép đôi có lời dẫn và CTA mở `/connection`. Lỗi tải không giả thành trạng thái chưa kết nối. Lỗi quyền truy cập ẩn dữ liệu cache; lỗi mạng giữ dữ liệu cùng scope đã xác nhận nếu có.
- Nút “Kiểm tra kết nối” có loading và toast thành công/lỗi, bỏ phản hồi sau đổi tài khoản/phiên/cặp/membership revision. Không polling hoặc refetch khi reconnect.
- Thay đổi chỉ đọc dữ liệu thật, không tạo kết nối hay dữ liệu mô phỏng. Chưa kiểm chứng trực quan màn mới trên thiết bị.
