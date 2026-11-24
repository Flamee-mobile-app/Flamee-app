# FAQ hỗ trợ — 2026-11-24

Mục Hỗ trợ trong Settings hiển thị FAQ thay thông báo chưa khả dụng. Giữ FeatureScreen/ContentSurface, chỉ thay nội dung mode support; mục Dữ liệu vẫn giữ trạng thái hiện có.

Sáu chủ đề: kết nối partner, hiển thị check-in, điểm Tiny Mission, đổi điểm lấy quà, liên hệ nhận quà qua TikTok và xử lý thao tác chưa được xác nhận. Nội dung vi/en nằm trong `supportFaqMessages.ts`, được hợp nhất vào localization chung. FAQ không xác nhận một giao dịch cụ thể hoặc thay API bằng dữ liệu mẫu.

Mỗi câu hỏi dùng AppTextButton với expanded/accessibility label/controls, cho phép mở một câu trả lời mỗi lần và bấm lại để đóng. Đây là trạng thái UI cục bộ, không gọi API, không lưu dữ liệu hoặc phát toast. Text xuống dòng trong vùng cuộn sẵn có của FeatureScreen; không lồng thêm ScrollView.

Đã kiểm tra typecheck, 4 test design-system và thao tác mở/chuyển/đóng 6 câu bằng component harness. Chưa kiểm tra trực quan hoặc trình đọc màn hình trên thiết bị.
