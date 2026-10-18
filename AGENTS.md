# Flamee — nội quy làm việc với codebase

Áp dụng cho toàn bộ repository. Đọc tài liệu trước khi sửa mã.

## Đọc bắt buộc

1. [.doc/README.md](.doc/README.md): mục lục, phạm vi và thứ tự áp dụng tài liệu.
2. [.doc/CODING-STANDARDS.md](.doc/CODING-STANDARDS.md): quy tắc code bắt buộc.
3. [.doc/CODEBASE-BASELINE.md](.doc/CODEBASE-BASELINE.md): hiện trạng và các chênh lệch đã ghi nhận.
4. Đọc spec nghiệp vụ và tài liệu của module liên quan theo mục lục.
5. Trước thao tác Git hoặc thao tác phá hủy dữ liệu, đọc [.doc/fe_skills/PERMISSION-RULES-SKILL.md](.doc/fe_skills/PERMISSION-RULES-SKILL.md) và tuân thủ phạm vi cho phép của người dùng.

## Nguyên tắc bắt buộc

- Mobile chỉ xác nhận dữ liệu/thao tác qua API thật đã tích hợp (auth, invite, profile, đọc album kỷ niệm trên Home). Các service mô phỏng nghiệp vụ trong bộ nhớ đã bị gỡ theo yêu cầu ngày 2026-10-17; chức năng chưa tích hợp phải hiển thị chưa khả dụng, không báo thành công hoặc dùng feed rỗng giả. Không dựng lại src/demo, global domain reducer, tài khoản giả đã xác minh hoặc media giả. Native media adapter, trạng thái UI tạm thời và test doubles không phải backend thay thế. Xem .doc/BACKEND-FIRST-CLEANUP.md và .doc/HOME-MEMORY-FEED.md.
- app/ chỉ chứa route/layout có default React component export; root providers nằm ở src/providers/, store/helper nằm ngoài route root. Giữ hướng phụ thuộc composition → features → shared; giao tiếp giữa feature qua public exports. Không đưa nghiệp vụ vào route hoặc shared UI.
- UI dùng Tamagui 2, longhand props, token chung và localization vi/en. Token size của component phải tương thích với font lookup; xem mục typography trong CODING-STANDARDS.
- Design system đã được duyệt và áp dụng toàn app: dùng `AppButton`, `AppFilterChip`, `AppIconButton`, `AppField`, `AppSwitch`, `AppCheckbox`, `AppChoiceTile`, `SectionCard`, `AppDialog`, `AppSheet` và `appToast` từ shared. Không tự style primitive hoặc dựng control bằng stack/onPress trong feature; xem `.doc/QUY_CHUAN_GIAO_DIEN.md` và kiểm tra `designSystemUsage.test.ts`.
- Giao diện tính năng mới dùng `FeatureScreen` / `ContentSurface`: title nằm ngoài một vùng background bo góc có shadow từ token chung; không có subtitle/eyebrow của trang. Toàn bộ nội dung, form, CTA và các trạng thái nằm trong vùng này. Xem `.doc/QUY_CHUAN_GIAO_DIEN.md`.
- Home là ngoại lệ bố cục theo yêu cầu ngày 2026-10-18: feed ảnh trực tiếp trên nền kem, header kính `+ / Dòng thời gian / chuông`, title mở rộng header để chọn Kỷ niệm; không hero, card bao post hoặc hai chip view; xem `.doc/HOME-MEMORY-FEED.md`.
- Giữ ranh giới chia sẻ full / mood_only / private_only; không đưa dữ liệu riêng tư vào AI, log, route params hoặc storage không bảo vệ.
- Backend theo API → service → repository → Supabase; xác thực và kiểm tra quyền bằng dữ liệu server, không tin ID do client/AI cung cấp.
- Sửa đúng nguyên nhân và đúng phạm vi. Không chỉnh node_modules, tắt LogBox, giấu warning hoặc đổi dependency để né lỗi cấu hình.
- Bảo toàn thay đổi đang có của người dùng. Không tự chạy script scratch, SQL hoặc thao tác ghi lên dịch vụ thật.
- Khi thay đổi hành vi, contract hoặc kiến trúc, cập nhật docs liên quan. Báo rõ kiểm tra nào đã thực hiện, kiểm tra nào chưa chạy; không khẳng định thiết bị hoạt động chỉ dựa trên typecheck.

## Xử lý tài liệu không đồng nhất

Yêu cầu trực tiếp của người dùng là ưu tiên đầu tiên. Tài liệu nghiệp vụ quy định hành vi mong muốn; source/config/schema đang có là bằng chứng triển khai. CODEBASE-BASELINE mô tả sai lệch, không hợp thức hóa sai lệch. Không dùng một doc lịch sử để tự thay kiến trúc đang áp dụng. Nếu xung đột ảnh hưởng phạm vi hoặc dữ liệu người dùng, ghi lại và hỏi quyết định cần thiết.
