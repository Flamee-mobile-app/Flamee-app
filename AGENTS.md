# Flamee — nội quy làm việc với codebase

Áp dụng cho toàn bộ repository. Đọc tài liệu trước khi sửa mã.

## Đọc bắt buộc

1. [.doc/README.md](.doc/README.md): mục lục, phạm vi và thứ tự áp dụng tài liệu.
2. [.doc/CODING-STANDARDS.md](.doc/CODING-STANDARDS.md): quy tắc code bắt buộc.
3. [.doc/CODEBASE-BASELINE.md](.doc/CODEBASE-BASELINE.md): hiện trạng và các chênh lệch đã ghi nhận.
4. Đọc spec nghiệp vụ và tài liệu của module liên quan theo mục lục.
5. Trước thao tác Git hoặc thao tác phá hủy dữ liệu, đọc [.doc/fe_skills/PERMISSION-RULES-SKILL.md](.doc/fe_skills/PERMISSION-RULES-SKILL.md) và tuân thủ phạm vi cho phép của người dùng.

## Nguyên tắc bắt buộc

- Mobile hiện là luồng local với service riêng từng feature. Không dựng lại src/demo, global domain reducer, tài khoản giả đã xác minh hoặc media giả.
- app/ chỉ chứa route/layout có default React component export; root providers nằm ở src/providers/, store/helper nằm ngoài route root. Giữ hướng phụ thuộc composition → features → shared; giao tiếp giữa feature qua public exports. Không đưa nghiệp vụ vào route hoặc shared UI.
- UI dùng Tamagui 2, longhand props, token chung và localization vi/en. Token size của component phải tương thích với font lookup; xem mục typography trong CODING-STANDARDS.
- Giữ ranh giới chia sẻ full / mood_only / private_only; không đưa dữ liệu riêng tư vào AI, log, route params hoặc storage không bảo vệ.
- Backend theo API → service → repository → Supabase; xác thực và kiểm tra quyền bằng dữ liệu server, không tin ID do client/AI cung cấp.
- Sửa đúng nguyên nhân và đúng phạm vi. Không chỉnh node_modules, tắt LogBox, giấu warning hoặc đổi dependency để né lỗi cấu hình.
- Bảo toàn thay đổi đang có của người dùng. Không tự chạy script scratch, SQL hoặc thao tác ghi lên dịch vụ thật.
- Khi thay đổi hành vi, contract hoặc kiến trúc, cập nhật docs liên quan. Báo rõ kiểm tra nào đã thực hiện, kiểm tra nào chưa chạy; không khẳng định thiết bị hoạt động chỉ dựa trên typecheck.

## Xử lý tài liệu không đồng nhất

Yêu cầu trực tiếp của người dùng là ưu tiên đầu tiên. Tài liệu nghiệp vụ quy định hành vi mong muốn; source/config/schema đang có là bằng chứng triển khai. CODEBASE-BASELINE mô tả sai lệch, không hợp thức hóa sai lệch. Không dùng một doc lịch sử để tự thay kiến trúc đang áp dụng. Nếu xung đột ảnh hưởng phạm vi hoặc dữ liệu người dùng, ghi lại và hỏi quyết định cần thiết.
