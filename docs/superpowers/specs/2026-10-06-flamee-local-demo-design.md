# Flamee Local Demo — Design Specification

**Ngày duyệt:** 2026-10-06  
**Phạm vi:** React Native mobile, Expo SDK 57, Tamagui v2  
**Nguồn sản phẩm:** `.doc/Tài liệu yêu cầu sản phẩm_ App kết nối cho cặp đôi.md`, `.doc/Các luồng chính của app (bản đầu).md`  
**Nguồn kiến trúc và giao diện:** `.doc/FLAMEE-MOBILE-ARCHITECTURE.md`, `.doc/QUY_CHUAN_GIAO_DIEN.md`

## 1. Mục tiêu

Xây dựng toàn bộ hành trình MVP bắt buộc của Flamee thành một bản mobile demo tương tác hoàn chỉnh. Bản demo chạy bằng dữ liệu giả và trạng thái local, không phụ thuộc backend, nhưng giữ đúng ranh giới service/domain để có thể thay mock bằng API thật ở giai đoạn cuối.

Bản demo phải cho phép nghiệm thu vòng lặp giá trị chính:

1. Một người check-in.
2. Người kia nhìn thấy phần trạng thái được chia sẻ.
3. Người kia nhận và xử lý Smart Nudge.
4. Người kia gửi Tiny Moment.
5. Người đầu tiên nhận và phản hồi.

Mọi flow phải có đầy đủ trạng thái hiển thị: loading, empty, success, offline/pending, validation error, permission denied, expired, recoverable error và trạng thái đã xử lý.

## 2. Phạm vi

### Bao gồm

- Đăng nhập mock bằng Apple, Google và số điện thoại/OTP.
- Đồng ý Điều khoản và Chính sách quyền riêng tư.
- Hồ sơ ban đầu, múi giờ, loại quan hệ và cách muốn được quan tâm.
- Tạo, chia sẻ, nhập mã, xác nhận và chấp nhận lời mời.
- Quà kèm lời mời và chế độ chờ.
- Check-in hằng ngày với năm mood, reason, note và ba mức chia sẻ.
- Trạng thái người yêu và múi giờ trên Home.
- Smart Nudge: làm ngay, sửa, để sau, bỏ qua và feedback.
- Tiny Moments: ảnh, voice, text, one-tap signal, feed, detail, reply, reaction và delete.
- Notification settings và permission states.
- Hồ sơ, “Ai thấy gì”, care preferences, export, support, unpair và delete account.
- Màn hình chuyển kịch bản demo để nghiệm thu mọi trạng thái.

### Không bao gồm

- Backend thật, authentication provider thật, AI vendor hoặc push server thật.
- Mã hóa SQLCipher hoặc durable offline queue trong Expo Go.
- Deferred deep-link provider thật.
- Realtime WebSocket/SSE thật.
- Widget, streak và các mục “Nên có” không cần cho vòng lặp demo.
- Các tính năng Phase 2.

## 3. Nguyên tắc triển khai

- `app/` chỉ chứa route adapter và navigation composition.
- Nghiệp vụ nằm trong `src/features/<feature>`; shared code không import feature.
- Component không gọi `fetch` trực tiếp.
- Mock service thực thi cùng interface mà API service thật sẽ dùng sau này.
- Remote-like data được mô phỏng qua TanStack Query; state điều phối demo nhỏ dùng Zustand hoặc provider chuyên biệt.
- Draft/form state dùng React state hoặc React Hook Form; validation dùng Zod.
- Không gọi `src/shared/native/encryptedDatabase.ts` trong bản Expo Go demo.
- Không tuyên bố dữ liệu mock đã được mã hóa hoặc đồng bộ server.
- Reload ứng dụng đưa runtime về seed mặc định. Không persist nội dung nhạy cảm.
- User-facing copy nằm trong localization resources, tiếng Việt trước.

## 4. Mock domain runtime

`DemoRuntimeProvider` là nguồn trạng thái của bản demo. Runtime lưu các domain object tối thiểu: account, onboarding progress, consent, profile, care preferences, invite, couple, check-ins, partner status, nudges, moments, notification settings, export request và simulated connectivity/permissions.

Mỗi feature truy cập runtime qua mock repository/service của chính feature. Service trả Promise và hỗ trợ latency giả để UI hiển thị loading. Lỗi được tạo bằng mã lỗi ổn định, không dùng raw error text. Các mutation quan trọng chỉ cập nhật runtime sau khi Promise thành công để UI không hiển thị thành công giả.

Runtime hỗ trợ hai vai trò demo: người mời và người được mời. Các hành động của “người yêu” được mô phỏng qua scenario action, ví dụ chấp nhận lời mời, check-in, gửi Moment hoặc reaction.

Check-in offline được giữ trong in-memory demo outbox với trạng thái `queued`, `sending`, `failed`, `acknowledged`. Khi connectivity đổi sang online, runtime có thể mô phỏng gửi lại và đối soát. Đây chỉ là hành vi demo, không phải durable encrypted storage.

Media mock dùng local URI. Native picker/recorder được dùng khi Expo Go hỗ trợ; permission denial hoặc native failure luôn có UI fallback. Upload được mô phỏng qua các trạng thái preparing, uploading, pending, failed và sent.

## 5. Navigation

Route groups giữ đúng kiến trúc hiện tại:

- `(auth)`: welcome và đăng nhập.
- `(onboarding)`: consent, profile, care preferences và relation type.
- `(invite)`: tạo lời mời, nhập mã, xác nhận và kết quả.
- `(waiting)`: chế độ chờ, quà mời, trạng thái/hết hạn/gửi lại.
- `(main)`: ba tab Hôm nay, Khoảnh khắc, Cá nhân.
- `nudge/[nudgeId]`: Nudge detail/action.
- `moment/[momentId]`: Moment detail/reply/reaction.
- `settings/*`: hồ sơ, notification, privacy, care, export, support và account lifecycle.

Root bootstrap đọc demo account state và đưa người dùng tới đúng nhánh. Notification mock chỉ ánh xạ allowlisted payload type/id sang Nudge hoặc Moment; không điều hướng từ URL tùy ý.

## 6. Hệ thống giao diện

Giao diện dùng Tamagui v2 và token hiện có. Nền mặc định là `$background`; `$primary` dành cho CTA chính; peach và lavender dành cho vùng nhấn nhẹ. Gradient thương hiệu chỉ xuất hiện ở hero hoặc trạng thái kết nối có chủ đích.

Typography dùng đúng H1–H5 và Body/Caption trong theme. System font tiếp tục là fallback cho tới khi có binary SF Pro/SF Pro Rounded được cấp phép.

Các component nền:

- App header và back action.
- Primary, secondary, ghost và destructive button.
- Text field, text area, OTP field và time input.
- Selectable chip và segmented option.
- Mood selector có icon, label và màu.
- Section card, avatar, status badge và inline metadata.
- Bottom sheet, dialog và two-step confirmation.
- Loading skeleton, empty state, offline banner, pending card, error state và permission state.
- Feedback toast/banner và character counter.

Tất cả màn hình tôn trọng safe area, keyboard, dynamic type, screen reader, contrast và hit target tối thiểu 48 px. Mood và trạng thái không bao giờ chỉ dựa vào màu.

## 7. Thiết kế flow

### 7.1 Auth, onboarding, invite và waiting

Welcome giới thiệu ngắn giá trị của Flamee và CTA bắt đầu. Login hiển thị Apple, Google và phone. Phone flow gồm nhập số, OTP mock, OTP sai, hết hạn và gửi lại.

Consent giải thích dữ liệu cảm xúc nhạy cảm và việc dùng AI. Profile yêu cầu tên; biệt danh, ảnh là tùy chọn; timezone tự điền và sửa được. Care preferences cho chọn nhiều mục, note tối đa 140 ký tự và có thể bỏ qua. Relation type gồm yêu xa và cùng thành phố.

Invite creation hiển thị mã sáu ký tự, thời hạn 72 giờ, share action và quà tùy chọn. Invite acceptance hỗ trợ token intent và code thủ công, với các trạng thái hợp lệ, hết hạn, revoked, used và already paired. Confirmation hiển thị người mời và preview quà trước khi accept.

Người mời thực hiện check-in đầu tiên trước notification permission. Waiting screen hiển thị thời gian còn lại, resend/share, chỉnh quà và check-in. Khi partner accept, cả hai thấy paired success; người nhận mở quà rồi vào Home.

### 7.2 Home, check-in và Smart Nudge

Home ưu tiên lời chào/ngày, Partner Status Card và hành động phù hợp nhất. Partner card hiển thị mood, dữ liệu được phép chia sẻ, thời điểm cập nhật, local time và timezone difference. Nếu chưa có check-in hôm nay, dùng ngôn ngữ trung tính và one-tap signal.

Check-in composer đi theo mood → tối đa ba reason → note → share scope. CTA cho biết người yêu sẽ thấy gì. Kết quả gồm full/mood-only/private-only, sent, queued offline, retry failed và synchronized.

Nudge detail hiển thị observation, action, draft và reason. Hành động gồm Làm ngay, Sửa nội dung, Để sau và Bỏ qua. Composer được mở đúng loại với draft điền sẵn. Sau act/skip, UI hỏi 👍/👎 và lý do nếu 👎.

Nudge có các trạng thái generating, template fallback, crisis-safe, new, snoozed, acted, skipped, expired và load error. UI không bao giờ hiển thị lỗi AI hoặc gắn nhãn AI lên nội dung người dùng gửi.

### 7.3 Tiny Moments

Feed hiển thị mới nhất trước, phân biệt người gửi bằng avatar/căn lề và hiển thị thời gian theo múi giờ người xem. Daily Prompt đứng đầu feed.

Composer sheet có bốn loại:

- Photo: capture/pick, preview, caption tối đa 100 ký tự và place text nhập tay.
- Voice: record/stop, timer 30 giây, auto-stop, playback và re-record.
- Text: tối đa 200 ký tự và character counter.
- Signal: Nhớ bạn, Đang nghĩ về bạn, Chúc ngủ ngon.

Moment detail hỗ trợ sáu reaction, reply bằng text/voice/photo, save media và delete nếu là người gửi. Upload/draft có preparing, uploading, offline pending, failed/retry và sent. Feed có loading, empty, refresh, end-of-list, recoverable error, media unavailable và deleted item.

Quà kèm lời mời trở thành Moment đầu tiên sau khi ghép.

### 7.4 Profile, settings và account lifecycle

Tab Cá nhân hiển thị profile và các nhóm Hồ sơ, Quan tâm, Thông báo, Quyền riêng tư, Dữ liệu và Hỗ trợ.

Notification settings có toggle A–H, check-in time, quiet hours, privacy mode và pause 1/8/24 giờ. Permission UI có not-requested, granted và denied.

“Ai thấy gì” giải thích ba share scope, dữ liệu partner thấy, dữ liệu Flamee xử lý và dữ liệu không đưa vào AI. Consent screen hiển thị mock version/time. Care preferences có thể chỉnh sửa và nói rõ partner chỉ thấy bản tóm tắt phù hợp.

Export flow có requested, preparing, ready, expired và error. Bản demo chỉ hiển thị JSON preview; không khẳng định tạo ZIP thật. Support có contact, bug report và content report với success/error.

Unpair và delete account đều xác nhận hai bước. Unpair đưa runtime về unpaired và xóa couple-scoped mock state. Delete account gợi ý export trước, mô phỏng sign-out all devices và trở về Welcome.

## 8. Demo scenario control

Màn “Kịch bản demo” nằm trong tab Cá nhân và có nhãn rõ là công cụ local demo. Preset bao phủ:

- Signed out, onboarding incomplete, invite not created.
- Waiting, expiring invite, expired invite.
- Valid/revoked/used invite và already-paired rejection.
- Paired with no check-in; partner full/mood-only/no update.
- Check-in sent/private/offline queued/sync failed.
- Nudge generating/fallback/crisis/new/snoozed/acted/skipped/expired.
- Empty/populated feed, upload pending/failed, media unavailable/deleted.
- Notification permission not requested/granted/denied.
- Export preparing/ready/expired.
- Network, rate-limit, session-expired, unavailable-service và unexpected-screen error.

Reset action đưa runtime về seed ban đầu. Scenario switch không ghi dữ liệu bền vững.

## 9. Error handling và privacy

Mỗi lỗi có câu giải thích tiếng Việt và hành động retry/recover phù hợp. Không hiển thị stack trace, raw provider error hoặc AI error. Session-expired đưa về auth; expired invite cho phép nhập mã khác; denied permission giữ text/check-in flow sử dụng được; upload failure giữ draft trong runtime.

Không đưa mood, note, message, care preferences, invite token, media URI hoặc credential vào log/analytics. Route chỉ mang opaque ID. Mock notification payload chỉ chứa type/id. Private-only check-in không xuất hiện trong partner state và không tạo Nudge.

## 10. Tiêu chí nghiệm thu local

- TypeScript typecheck thành công.
- Expo dependency/config check thành công.
- Hai vai trò demo đi hết onboarding → invite → pair → check-in → Nudge → Moment → reaction.
- Mỗi form enforce đúng giới hạn ký tự, lựa chọn và validation.
- Mỗi preset hiển thị không crash và có recovery action hợp lý.
- Back navigation, keyboard, safe area và tab navigation hoạt động ổn.
- Notification mock mở đúng Nudge/Moment.
- Private-only và mood-only không làm lộ dữ liệu không được chia sẻ.
- Offline check-in thể hiện queued/sync/retry đúng trong phạm vi in-memory demo.
- Không có request backend ngoài ý muốn.
- Không import hoặc gọi encrypted SQLite trong demo flow.
- Toàn bộ chữ người dùng thấy lấy từ localization resources.
- Các control chính có accessibility label và vùng bấm phù hợp.
- Reset scenario trả runtime về seed mặc định.

## 11. Quyết định được hoãn tới backend phase

- Backend realtime transport.
- AI provider và crisis-support content do pháp lý duyệt.
- Deferred deep-link provider.
- SQLCipher/native build integration.
- Phone login có bắt buộc hay chỉ là một lựa chọn.
- Tiny Moment retention policy.
- Streak calculation across time zones.
- Production push policy enforcement, rate limiting và server authorization.

UI demo phải thể hiện các nhánh cần thiết nhưng không được biến giá trị mock thành cam kết chính sách sản phẩm.
