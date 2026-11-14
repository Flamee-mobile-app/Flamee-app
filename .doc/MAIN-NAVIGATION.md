# Pill nav — nút FAB

Theo yêu cầu ngày 2026-10-26, nút Flamee ở giữa pill nav chỉ giữ hình ảnh và hiệu ứng tương tác nhấn/thả. Không gán onPress nghiệp vụ, không điều hướng sang timeline/Home, không mở menu, không gọi API và không đánh dấu như một tab được chọn. Hiệu ứng nhấn, bóng và xử lý reduced motion được giữ trong BottomNavigationBar.

MainLayout không sử dụng useFabActions cho FAB nữa. Hook này vẫn cung cấp các quick action hiện có ở Profile; các luồng đó không bị thay đổi. Timeline route alias vẫn tồn tại cho khả năng tương thích, nhưng không còn là đích của FAB. Home vẫn được mở bằng tab Home như trước.

Nhãn/hint hỗ trợ tiếp cận vi/en mô tả nút Flamee chỉ có hiệu ứng nhấn, không hứa mở màn hình.
