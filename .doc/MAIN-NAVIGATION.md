# Pill nav — cập nhật 2026-11-15

Yêu cầu mới nhất của người dùng thay thế quy tắc FAB chỉ có hiệu ứng ngày 2026-10-26. Thứ tự cố định từ trái sang phải:

| Vị trí | Chức năng | Route |
| --- | --- | --- |
| 1 | Home / feed | `/(main)` |
| 2 | Kỷ niệm, icon lịch | `/(main)/memories` |
| Giữa, nút Flamee | Mood Check-in | `/mood/check-in` |
| 3 | Tiny Mission | `/(main)/tasks` |
| 4 | Hồ sơ | `/(main)/profile` |

Nút Flamee mở trực tiếp Mood Check-in, không mở Tiny Mission hoặc menu. Giữ hiệu ứng nhấn/thả, bóng và reduced motion. Dùng navigate để tránh xếp lặp route check-in. Nhãn/hint vi/en mô tả đúng chức năng mở ghi lại cảm xúc.

Home và Kỷ niệm không còn header nổi `+ / title chọn view / chuông`; title/back của các màn tính năng khác giữ nguyên. Chuông inbox mới là nút nổi riêng ở góc phải trên các tab chính, không dựng lại thanh header. Padding list là safe area trên +72 (gap8, nút48, gap16), đủ tránh chuông che bài/lịch. Nút thêm bài dạng tròn gọn 48, nền trắng với bóng mềm, dấu +22 dùng gradient cam–đào thương hiệu; neo góc phải ngay trên pill nav (gap16, tính theo chiều cao nav và safe area), thay cho CTA ngang đầu feed. Chỉ hiện nút thêm ở Home/Kỷ niệm khi đã bootstrap và có account/couple; mở đúng composer hiện có. Trạng thái rỗng và nút thêm tại ngày hiện tại của lịch vẫn dùng luồng tạo bài thật hiện có. Xem MEMORY-CONVERSATIONS.md cho inbox/badge và quyền bình luận.

Kỷ niệm dùng lại HomeScreen ở view calendar, cùng query/cache/API, không sao chép dữ liệu backend hoặc thêm dữ liệu giả. Route `moments` (dashboard cảm xúc cũ) vẫn tồn tại cho liên kết hiện có nhưng được ẩn khỏi pill nav. `timeline` và link Home cũ có `view=memories` redirect sang route chính xác để capsule chọn đúng tab. `useFabActions` vẫn dùng cho các quick action Profile; emotion intent mở `/mood/check-in`.

Đã kiểm tra Android emulator: Kỷ niệm chọn tab lịch, không có header nổi; nhấn Flamee mở Mood Check-in và quay lại được; tab lấp lánh mở Tiny Mission. Ảnh bằng chứng trong `.local-tools/flamee-nav-memories.png`, `flamee-nav-mood.png`, `flamee-nav-tiny.png`. Phiên emulator chưa ghép đôi nên chưa kiểm tra trực tiếp lịch có dữ liệu ảnh thật trong lượt này. Không dùng kiểm tra điều hướng để xác nhận thao tác ghi Mood/Tiny Mission đã tích hợp backend.
