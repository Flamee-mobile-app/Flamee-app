# SDD ledger — plan: docs/superpowers/plans/2026-10-26-app-e2e-completion.md

## Lịch sử cảm xúc, trạng thái đối tác và Home polling — 2026-10-27

- Tiếp tục theo yêu cầu triển khai và báo cáo phần chưa làm được. Chi tiết thay đổi, kiểm tra và các mục còn lại: `docs/progress/2026-10-27-app-e2e-status/IMPLEMENTATION.md`.
- Nối GET moods/partner latest; thêm backend limit/offset, scope couple cho trạng thái/alert/digest, projection mood_only và ưu tiên legacy is_private=true. Không sửa contract POST để bỏ mất custom feeling/sleep/attachments của UI; write flow còn chưa tích hợp.
- Lịch tuần/tháng dùng dữ liệu server; lỗi không trở thành empty. Cache riêng account/session/couple, hủy request khi đổi scope; không persist dữ liệu cảm xúc. Ngày hiển thị theo timezone thiết bị; chưa có server timezone preference.
- Home polling foreground 5 giây, refresh khi focus/resume, tránh chồng các tick; không tuyên bố đã có WebSocket hoặc đạt SLA 5 giây trên thiết bị.
- Typecheck đạt; full mobile 310/312, đúng hai lỗi UI baseline. Backend full offline 138 passed, 5 deselected (không live), 13 deprecation warnings; sau sửa private flag cuối chạy lại mood/history/privacy/AI boundary: 13 passed, 5 warnings. Test fake hỗ trợ ilike/multiple order để mô phỏng đúng query, không thay API thật.
- Không chạy migration, ghi dịch vụ thật, AI trả phí hoặc UI native/hai thiết bị. Chưa đánh dấu các mốc E2E hoàn tất. Điểm/quà/retention mở rộng vẫn theo DECISIONS.md.

## Triển khai Home và rà quyết định — 2026-10-27

- Đã đọc AGENTS, plan E2E, contract/acceptance, spec Tiny Mission, các phần PRD/luồng liên quan, tài liệu thiết kế Home và kiểm tra source. Ba tài liệu nền tảng bắt buộc vẫn thiếu trong checkout; xem báo cáo `docs/progress/2026-10-27-app-e2e-status/DECISIONS.md`.
- Mobile thêm PUT sửa title/description (null để xóa nội dung), DELETE bài và DELETE ảnh. DELETE yêu cầu đúng 204; không parse JSON ở response rỗng, không coi 200 rỗng/404 là xác nhận đã xóa.
- Chi tiết Home có form sửa, xác nhận xóa bài/ảnh, khóa double-submit, lỗi giữ form. Chỉ mở thao tác trên detail đã tải thật, không dùng cover preview như album đầy đủ. Cache được hủy read đang chạy trước mutation, cập nhật sau ack và invalidates để đọc lại feed/detail.
- Service kiểm session/account/couple trước mỗi lần gọi, bao gồm retry xác thực, và sau response. Membership revision thay đổi trong request cũng hủy kết quả. Component bỏ kết quả khi đã unmount/đổi scope. Không tự retry mutation khi timeout; invalidate để đọc trạng thái server trước khi người dùng thử lại. Cần nghiệm thu thêm trường hợp server commit rồi mất response.
- Cài dependency theo lockfile bằng `npm ci --ignore-scripts --no-audit --no-fund` vì checkout ban đầu thiếu node_modules; không đổi phiên bản package hay lockfile để né lỗi.
- `npm run typecheck`: đạt sau thay đổi cuối. Bộ memory API/scope/query/publish: **34/34 đạt**, gồm 6 test mới (PUT/null, DELETE 204, lỗi xóa, phân vùng session/cặp, late ack, retry sau đổi membership).
- Full mobile trước hai test scope cuối: **301/303 đạt**; đúng hai lỗi baseline checkInUiContract (gap đuôi bubble) và profileFeedbackContract (outlined/elevated). Không xóa assertion hoặc đổi UI ngoài phạm vi để làm xanh suite. Hai test scope thêm sau đó đều đạt trong bộ 34 test.
- Backend `python -m pytest tests/test_memory.py tests/test_memory_storage.py tests/test_memory_idempotency.py -q`: **28 passed**; warning AnyIO BlockingPortal deprecation và pytest cache không ghi được do quyền filesystem. Không thay đổi backend runtime trong lát cắt Home.
- Báo cáo quyết định xác nhận retention 30 ngày đã có trong spec; source break_up xóa ngay không khớp. Sửa kết luận audit cũ trong tài liệu, chưa triển khai lifecycle destructive. Điểm/quà/fanpage/timezone chung vẫn thiếu quyết định; không dùng preview để thiết lập nghiệp vụ thật.
- **Chưa hoàn thành toàn bộ kế hoạch.** Chưa chạy UI Android/iOS/hai máy, chưa chạy live workflow/migration/AI, chưa kiểm chứng popup lồng trong sheet trên thiết bị. Realtime, check-in, Nudge, Tiny Moments, notifications, settings/lifecycle và Tiny Mission còn công việc theo bảng tiến độ. H03 chưa được tick E2E.

## Chẩn đoán kết nối đăng nhập — 2026-10-27

- `.env.local` của mobile còn trỏ `192.168.1.87:8000`, địa chỉ này timeout. Wi-Fi hiện tại của máy chạy backend là `192.168.11.26`; `/health` qua localhost và IP LAN hiện tại đều trả HTTP 200.
- Cập nhật riêng host trong `EXPO_PUBLIC_API_URL` sang `http://192.168.11.26:8000/api/v1`, giữ nguyên API prefix. Không đổi tài khoản, mật khẩu, dữ liệu hoặc schema.
- Chưa xác minh đăng nhập bằng tài khoản của người dùng hoặc kết nối từ điện thoại; health chỉ chứng minh backend truy cập được từ máy phát triển. Cần reload app sau khi Metro nhận lại biến môi trường; khởi động lại Expo nếu client vẫn giữ URL cũ.

## Bắt đầu sau khi duyệt kế hoạch

- Người dùng đã duyệt kế hoạch; triển khai local trong workspace hiện tại.
- Task 1: in progress — baseline offline, rà contract và lập ma trận nghiệm thu.
- Task 2–12: pending; không xem duyệt kế hoạch là bằng chứng E2E đã đạt.
- Ruling: giữ workspace hiện tại, dùng ledger này và công cụ đọc/chỉnh file trực tiếp; không chạy helper skill phụ thuộc Git, không tạo branch/commit hoặc đọc Git vì quy tắc repository yêu cầu phạm vi cho phép riêng. Không ghi live backend hoặc gọi AI có phí.
- Pre-flight 2→4/9: onboarding dùng profile API hiện có trước; care/relationship chưa có contract đầy đủ được hoàn thiện với settings, không gửi thêm trường vào DTO cũ.
- Pre-flight 4→5→6: cần chốt mapping cảm xúc, privacy và media payload trước khi thay preview; Tiny Moment hiện chưa có private media contract đầy đủ.
- Pre-flight 4/6→7/8: đồng bộ chỉ invalidates query đã có, notification/WS không thay thế dữ liệu API.
- Pre-flight 9→10→11: cần quy tắc ngày chung/đổi nhiệm vụ/giá quà/fanpage và lifecycle ledger trước khi ghi điểm hoặc redemption thật.
- Ruling: ưu tiên phần local có contract xác định; ghi nhận các điểm cần quyết định sản phẩm/cấu hình bên ngoài để hỏi khi chúng chặn triển khai, không tự đặt quy tắc có ảnh hưởng điểm/quà/dữ liệu.

## Bằng chứng kiểm tra

- Baseline mobile: typecheck đạt; 278 domain tests = 276 đạt/2 lỗi. Lỗi hiện có: checkInUiContract intrinsic bubble gap và profileFeedbackContract outlined field. Không sửa UI hoặc xóa assertion trong nhánh logout.
- Baseline backend: 132 passed, 4 deselected (live tests), 10 Starlette HTTP 422 deprecation warnings. Không gọi backend/Supabase/AI thật.
- Người dùng đã xác nhận giữ UI check-in hiện tại: note 60 ký tự, cho chọn nhiều lý do; quy tắc này ưu tiên tài liệu lịch sử.
- Task 1: đã tạo E2E-API-CONTRACT và E2E-ACCEPTANCE; có Android emulator qua adb, chưa có Maestro PATH/native build hoặc nghiệm thu hai thiết bị. Chưa đánh dấu complete.
- Task 2: in progress — thêm AuthApi.logout POST/ack validation, AuthService.signOut kết quả revoked/localOnly/noSession, xóa local ngay; tự thu hồi credential từ login/refresh bị hủy; UI chỉ báo local-only khi chưa có account mới.
- Test RED→GREEN: authSignOut 8 ca ban đầu đều đỏ do thiếu logout; thêm race logout khi login đang ghi storage cho thấy phiên server chưa bị thu hồi, sửa rồi đạt. Tổng 10 ca mới đạt; regression auth/session/localSignOut 40/40.
- Ruling: kết quả logout phân biệt server-confirmed và local-only, không coi HTTP 401 đơn lẻ là đã thu hồi refresh session. Refresh phục vụ logout dùng credential cũ, không đi qua coordinator của account mới.
- Ruling: cập nhật transport test cũ để hiểu endpoint logout mới; giữ nguyên assertion nghiệp vụ. Không đưa test double vào production.
- Người dùng xác nhận bản E2E đầu tiên dùng email/mật khẩu; Google/Apple/OTP chuyển đợt kế tiếp.
- Task 2: bổ sung API/service/UI gỡ avatar có xác nhận, chỉ chấp nhận response avatar_url=null đúng account; dùng save lifecycle và revision để không phục hồi avatar cũ hoặc mở xác nhận của account trước. 4 ca RED→GREEN; 23 test avatar/logout/profile lifecycle/design-system đạt.
- Sau logout: toàn mobile 288 tests = 286 đạt, đúng 2 lỗi baseline, không có lỗi mới; typecheck đạt. Sau avatar removal sẽ chạy lại suite trước bàn giao.
- Task 2: đã nối đổi mật khẩu API/service/UI ở settings section=password. Thành công đóng phiên; lỗi storage sau server ack được báo riêng. Form keyed theo account/session và không trim secret, xóa nội dung khi rời màn hình.
- Ruling: backend dùng HTTP 400/current_password_invalid cho mật khẩu hiện tại sai, giữ 401 cho phiên không hợp lệ; nếu giữ 401 như cũ, coordinator có thể refresh và đăng xuất nhầm user. Cập nhật hai endpoint dùng chung service, test và API docs.
- Ruling: giữ tối thiểu 8 ký tự cho mật khẩu mới như UI đăng ký hiện tại, không hạ xuống 6 chỉ để khớp mức tối thiểu backend.
- Đổi mật khẩu: 5 ca mobile và 2 ca backend RED→GREEN; validation form RED→GREEN; backend toàn suite 134 passed/4 deselected. Phát hiện test route list cũ chưa có password, cập nhật list và vẫn giữ kiểm tra privacy/terms bị loại.
- Bổ sung guard live account ở handler profile/password trước khi gọi mutation; response sau đổi account vẫn qua generation/lifecycle guard, không chạm phiên mới.
- Người dùng chọn development hiện có; bỏ luôn quên/reset mật khẩu khỏi phạm vi. Đã gỡ entry quên mật khẩu không hoạt động khỏi login; endpoint legacy vẫn 501, không xây OTP/email giả.
- Read-only live: 2 test schema/RPC và private media bucket đạt (11.51s). Không ghi dữ liệu trong hai test này; đây không phải kiểm quyền RLS của user.
- Người dùng đã cho phép đúng lệnh FLAMEE_TEST_LIVE_ACCOUNT=1 chạy `tests/test_live_account_workflow.py`, không AI/migration/dữ liệu có sẵn.
- Live account lần 1 `account-be4ea8bd65a3`: đã tạo 2 account, sửa profile, upload/gỡ avatar và server đã tạo invite; test harness dừng do mong 200 thay vì contract 201 của create invite. Sửa kỳ vọng trong harness, không sửa backend để chiều test.
- Đã thông báo giữ lại 2 account lần đầu và chạy lại cùng lệnh được duyệt. Lần 2 `account-f2e2a9e327b2`: 1 passed, 22 bước API đạt (30.53s), gồm pair, wrong-password validation giữ phiên, change-password revoke access/refresh, login mới, logout revoke access/refresh và partner session độc lập.
- Dữ liệu test giữ lại: account `b835c99c-eba9-4adf-a6ae-0e0e06b09587`, `23fbbaa4-af48-4d16-9889-dc104eb9f416` (lần 1); `0467a380-8290-4b4c-962c-f7a591173a39`, `fc6c0e9b-6c56-47df-9aa9-3c6b96f9ef61` (lần 2). Tổng 4 account test, 1 cặp, 1 invite chưa accept của lần 1 và 1 invite accepted của lần 2. Avatar của cả hai lần đã được gỡ qua API. Không dọn account/invite/couple có sẵn.
- Review local phát hiện khoảng microtask giữa withAccessToken và cleanup của changePassword có thể hủy login B. Test hồi quy bổ sung đã quan sát RED rồi GREEN sau guard generation ở outer operation. Bộ auth/session/avatar/password/localSignOut/schema 51/51 đạt.
- Android emulator từng xuất hiện lúc đầu nhưng lần kiểm tra adb sau không còn thiết bị; chưa kiểm UI native hoặc tạo native build. Không đánh dấu M0/M1 hoàn tất E2E hai thiết bị.
- Checkpoint cuối đợt local: mobile typecheck đạt, toàn suite 299 = 297 đạt/2 lỗi UI baseline, auth/session/schema liên quan 51/51; backend 134 unit/integration FakeSupabase đạt, development read-only 2/2 và account live workflow 1/1 (22 checks). Web export đã đạt trước chỉnh cuối form generation guard và gỡ entry forgot; các chỉnh cuối được typecheck/domain tests kiểm lại.
- Toàn bộ kế hoạch vẫn đang thực hiện. Không tick hoàn tất task/mốc chỉ vì API smoke đạt; UI Android/iOS, Home CRUD còn thiếu và các mốc sau vẫn pending.
