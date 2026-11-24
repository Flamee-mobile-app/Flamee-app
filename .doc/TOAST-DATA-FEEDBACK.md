# Quy định bắt buộc: toast cho thao tác dữ liệu

Theo yêu cầu trực tiếp của người dùng ngày2026-11-16, áp dụng toàn repository cho chức năng mới và các luồng được chỉnh sửa.

- Mọi thao tác dữ liệu do người dùng chủ động thực hiện phải có toast thông báo rõ hành động và kết quả: tạo, sửa/lưu, xóa, tải ảnh lên, gửi/trả lời, thả/bỏ tim, cập nhật cài đặt và thao tác tương đương. Không chỉ đổi dữ liệu trên màn hình mà im lặng.
- Dùng `appToast` chung, nội dung vi/en. Với request có thời gian chờ, dùng operation handle cho loading và kết quả. Chỉ success sau acknowledgement API hợp lệ, đúng đối tượng và cùng session/account/couple. Bắt lỗi và báo rõ; timeout là chưa xác nhận kết quả, không khẳng định server chưa ghi. Giữ bản nháp và hướng dẫn khôi phục/thử lại phù hợp.
- Không success khi tính năng chưa tích hợp, request thất bại, response sai contract hoặc scope đã thay đổi. Không đưa text riêng tư, token, URL ký hoặc payload vào thông báo.
- Hủy form/đóng dialog không được gọi mutation hoặc thông báo dữ liệu đã thay đổi. Đọc nền/polling không tạo toast success liên tục; người dùng chủ động tải lại mà lỗi phải nhận phản hồi rõ.
- Toast phải nhìn thấy trên màn thường, sheet, alert native và viewer. Dùng modal host chung cho native Modal, không chỉ tăng zIndex của root. Một thông báo dùng một timer; không render trùng, treo loading hoặc mất success khi popup đóng. Giữ TTL, reduced motion, pause background và reset khi đổi tài khoản.
- Trước nghiệm thu, kiểm tra success sau ack, failure không success, request lặp, kết quả cũ sau đổi scope và toast hiển thị trên popup. Báo rõ test doubles và kiểm tra thiết bị thực; không dùng typecheck làm bằng chứng toast xuất hiện.

Hướng dẫn operation/lifecycle: `docs/progress/2026-11-15-toast-lifecycle.md`. Triển khai modal host và bằng chứng kiểm tra: `docs/progress/2026-11-16-toast-data-feedback.md`.
