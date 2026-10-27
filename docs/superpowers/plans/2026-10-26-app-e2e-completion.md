# Flamee App E2E Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Chỉ lập kế hoạch trong lượt hiện tại; chưa triển khai, chạy migration hay ghi dịch vụ thật. Không tự tạo worker hoặc thực hiện Git khi chưa có phạm vi cho phép tương ứng.

**Goal:** Hoàn thiện các tính năng mobile đang có, vòng lặp sản phẩm MVP và Tiny Mission đã duyệt thành các luồng có dữ liệu thật, kiểm tra được từ hai tài khoản/hai thiết bị.

**Architecture:** Giữ Expo Router → features → shared; trạng thái server qua API/service và TanStack Query, không dùng preview làm backend. Backend giữ API → service → repository → Supabase; quyền truy cập và các thao tác tiền/điểm được kiểm tra nguyên tử trên server. Triển khai theo lát cắt E2E, tái sử dụng các endpoint/module sẵn có trước khi mở rộng.

**Tech Stack:** Expo/React Native, TypeScript, Tamagui 2, TanStack Query, Zustand cho coordination; Python/FastAPI, Supabase/Postgres/Storage, pytest. Dùng phiên bản dependency thực tế trong repo lúc thực thi; không đổi SDK theo tài liệu lịch sử. Native E2E runner được chọn sau kiểm tra development build ở Task 1.

**Spec:** `.doc/Tài liệu yêu cầu sản phẩm_ App kết nối cho cặp đôi.md`; `.doc/Các luồng chính của app (bản đầu).md`; `.doc/TINY-MISSION.md`; `.doc/MAIN-NAVIGATION.md`; `AGENTS.md`.

## Global Constraints

- Mobile chỉ xác nhận dữ liệu/thao tác qua API thật đã tích hợp. Preview chỉ dùng cho thiết kế và kiểm thử; không báo thành công hoặc tạo bản ghi giả khi chưa có xác nhận server.
- app/ chỉ chứa route/layout có default React component export. Root providers nằm ở src/providers/. Giữ hướng phụ thuộc composition → features → shared.
- UI dùng Tamagui 2, longhand props, token chung và localization vi/en; dùng control chung đã duyệt. Không thiết kế lại toàn app trong đợt tích hợp.
- Giữ ranh giới chia sẻ full / mood_only / private_only. DTO backend hiện có dùng tên khác phải được map/kiểm thử rõ ràng; không suy diễn các mức chia sẻ là tương đương.
- Không đưa dữ liệu riêng tư vào AI, log, route params hoặc storage không bảo vệ.
- Backend xác thực và kiểm tra quyền bằng dữ liệu server, không tin ID do client/AI cung cấp.
- FAB giữa pill nav chỉ có hiệu ứng tương tác, không gán lại route hay nghiệp vụ.
- Bảo toàn thay đổi của người dùng; trước Git/thao tác phá hủy đọc `.doc/fe_skills/PERMISSION-RULES-SKILL.md`. Không tự chạy SQL, migration, live test ghi dữ liệu hoặc gọi AI có phí lên dịch vụ thật.
- `.doc/README.md`, `CODING-STANDARDS.md`, `CODEBASE-BASELINE.md` đang không có trong checkout được rà. Xác minh lại lúc thực thi; không coi tài liệu thiếu là bằng chứng tính năng đã hoàn tất.
- Không chốt thời gian giao hàng hoặc tỷ lệ hoàn thành trước khi có baseline, người thực hiện và môi trường nghiệm thu.

## Review Focus

1. Hai người thao tác đồng thời/retry sau timeout: không ghép đôi hai lần, tạo trùng bài đăng, cộng điểm hai lần hoặc trừ điểm hai lần. Test ở Task 2, 3, 6, 10, 11.
2. Đổi tài khoản, kết thúc kết nối hoặc thu hồi phiên khi request đang chạy: không hiển thị dữ liệu của scope cũ, không replay hàng đợi của người cũ. Test ở Task 2, 7, 9, 12.
3. Check-in mood_only/private_only: nội dung ẩn không đi qua response, notification, log, AI hoặc template fallback. Test ở Task 4, 5, 8.
4. Qua nửa đêm/DST và hai múi giờ khác nhau: ngày check-in, ngày nhiệm vụ, kỳ tuần/tháng và nhắc lịch không bị tính lại sai. Test ở Task 4, 8, 10.
5. Upload hoặc đổi quà đã commit nhưng app mất kết nối: khôi phục đúng kết quả, không mất mã nhận quà, không upload/giao dịch lại ngoài ý muốn. Test ở Task 3, 6, 11.

## Phạm vi và trạng thái xuất phát

Quy ước đường dẫn trong các task: `src/...` là trong `flamee-mobile/`; `app/api`, `app/services`, `app/repositories`, `app/schemas` và `tests/...py` là trong `backend/`. Đường dẫn route mobile được ghi với tiền tố `flamee-mobile/app/` để tránh nhầm. File được ghi “Tạo” là phần đề xuất, không phải bằng chứng file đã tồn tại.

| Nhóm | Bằng chứng hiện tại | Đích của kế hoạch |
| --- | --- | --- |
| Auth/profile/invite | Mobile có API client và UI thật | Nghiệm thu hai tài khoản, thu hồi phiên, recovery và quyền truy cập |
| Home/memories | Đọc/tạo/upload ảnh qua API; có feed/lịch/chi tiết | Khép kín sửa/xóa, media lỗi/retry và đồng bộ hai máy |
| Check-in/cảm xúc | UI draft và lịch preview; backend có mood API | Lưu/lấy lịch sử và trạng thái người yêu thật |
| Smart Nudge/Tiny Moments | Có backend code; mobile chưa nối đủ | Gợi ý → soạn → gửi → nhận → phản hồi hoạt động thật |
| Notifications/realtime | Có adapter/token endpoint/WebSocket; chưa xuyên suốt | Foreground/background/tap/reconnect đúng scope và quyền riêng tư |
| Tiny Mission | UI preview được duyệt; chưa có backend nhiệm vụ/điểm/quà | Giao nhiệm vụ, hoàn thành, thành tựu, ví, đổi quà và truy xuất mã thật |
| Settings/lifecycle | Nhiều mục placeholder; đăng xuất hiện là local | Cài đặt thật, unpair/export/delete và dọn quyền truy cập |

Phạm vi bản hoàn thiện: các nhóm trên và yêu cầu MVP liên quan. Widget, AI lập kế hoạch hẹn hò, quỹ chung, tổng kết tuần AI, gọi video nội bộ và Premium/payment là backlog riêng, không tự gộp vào tiêu chí phát hành này. Nếu cần ra mắt các nhóm đó, lập contract và nghiệm thu riêng. Nhiệm vụ gọi video không mặc nhiên yêu cầu xây một hệ thống gọi video.

## Thứ tự và mốc bàn giao

| Mốc | Task | Kết quả có thể demo/nghiệm thu |
| --- | --- | --- |
| M0 — môi trường và contract | 1 | Biết rõ endpoint/schema nào thật sự sẵn sàng; staging/test build và ma trận nghiệm thu |
| M1 — nền tảng tài khoản/cặp/kỷ niệm | 2–3 | Hai tài khoản ghép đôi, sửa hồ sơ, đăng/xem ảnh thật, đăng xuất an toàn |
| M2 — vòng lặp sản phẩm | 4–6 | A check-in → B thấy trạng thái/Nudge → B gửi Moment → A nhận và phản hồi |
| M3 — tin cậy và quyền riêng tư | 7–9 | Realtime/push/offline/settings/lifecycle làm việc đúng ở lỗi và đổi scope |
| M4 — Tiny Mission thật | 10–11 | Nhiệm vụ → điểm → mốc → đổi quà → mã có thể tra lại; không race số dư |
| M5 — release candidate | 12 | Bộ E2E hai thiết bị và regression đạt; không còn placeholder thuộc phạm vi phát hành |

Phụ thuộc: 1 → 2 → 3/4; 4 → 5; 3/5 → 6; 4/6 → 7/8/9; 2/4/9 và quyết định Tiny Mission → 10 → 11; tất cả → 12. Có thể làm phần độc lập khi triển khai nhưng không đánh dấu mốc đạt trước khi chạy kịch bản tích hợp của mốc đó.

## Các quyết định cần chốt tại M0

| Quyết định | Đề xuất để review | Chặn phần nào |
| --- | --- | --- |
| OAuth/OTP | Email/password là baseline hiện có; Google/Apple/OTP theo yêu cầu gốc cần cấu hình provider, signing và SMS. Nếu giảm phạm vi phải có quyết định sản phẩm rõ ràng. | Auth đầy đủ và release scope |
| Draft check-in ↔ backend | Chốt mapping danh mục cảm xúc, intensity/reasons, note 60 ký tự ở UI hiện tại so với 140 ở spec, attachment và ba mức chia sẻ. | Task 4 |
| Ngày chung Tiny Mission | Đề xuất một timezone của cặp, cố định trong kỳ; client chỉ trình bày theo cấu hình server. Chốt mốc reset, đầu tuần, thay timezone. | Task 10 |
| Đổi nhiệm vụ/điểm | Đề xuất chỉ đổi trước khi có ai hoàn thành; chốt số lượt đổi, phân bổ 2 cá nhân + 2 chung, điểm/mốc thật. Các số đang hiện chỉ là minh họa. | Task 10 |
| Quà hiện vật | Cần link fanpage thật, danh mục/giá/tồn kho, số lượt đổi, thời hạn mã, người xác nhận giao quà và quy tắc hủy/hoàn điểm. | Task 11 |
| Tích hợp ngoài | Chọn push credentials, email recovery, deferred deep-link provider và nguồn hỗ trợ khủng hoảng đã duyệt. | Task 2, 5, 8 |
| Xóa dữ liệu | Chốt chính sách giữ 30 ngày theo spec, quyền export, quà chưa giao và dữ liệu ledger cần lưu sau unpair/delete. | Task 9, 11 |

Các đề xuất trên chưa phải quy tắc đã được người dùng duyệt. Trong lúc chờ có thể làm task độc lập; không tự áp dụng quyết định ảnh hưởng điểm, quà hoặc dữ liệu cá nhân.

**Quyết định bổ sung sau duyệt kế hoạch:** người dùng đã chốt bản E2E đầu tiên dùng email/mật khẩu, OAuth/OTP chuyển đợt kế tiếp; check-in giữ note 60 ký tự và nhiều lý do theo UI hiện tại. Các quyết định khác vẫn chờ chốt. Tiến độ thực thi và bằng chứng nằm trong `.doc/E2E-EXECUTION-LOG.md`.

**Cập nhật tiếp theo:** dùng development đang cấu hình; bỏ luôn quên/reset mật khẩu, không cần tích hợp kênh email recovery. Đã cho phép và chạy riêng account workflow không AI; các live write khác/migration vẫn cần phạm vi cho phép tương ứng.

## Task 1 — Baseline có thể tái hiện và hợp đồng API

**Files:** Rà `backend/app/main.py`, `backend/app/api/*.py`, `backend/app/schemas/*.py`, `backend/migrations/`, `backend/tests/test_backend_readiness.py`, `backend/tests/test_schema_contract.py`; mobile `src/features/auth/authApi.ts`, `invites/inviteApi.ts`, `moments/memoryApi.ts`, `src/providers/SessionInitializer.tsx`. Tạo `.doc/E2E-ACCEPTANCE.md` và cập nhật `backend/docs/api.md` nếu có thay đổi contract.

**Interfaces:** Produces ma trận endpoint/method/DTO/error/idempotency/quyền truy cập và danh sách migration cần áp dụng; không đổi endpoint chỉ để giống UI.

- [x] Kiểm tra snapshot dependency/config; chạy kiểm tra offline hiện có, ghi nguyên các lỗi baseline và phân loại ảnh hưởng release. Không bỏ qua test hỏng bằng cách xóa assertion.
- [ ] So sánh schema/service/frontend thực tế; đặc biệt media Tiny Moment hiện chỉ có content, check-in attachment, share_level và thời gian. Chốt contract cho Task 4–11 trước khi tích hợp phần phụ thuộc.
- [ ] Chuẩn bị tài khoản test A/B và cặp C ngoài scope, dev/staging độc lập, Android/iOS development build. Chọn native E2E runner qua một thử nghiệm đăng nhập/khởi động; ưu tiên Maestro nếu tương thích, dùng kịch bản thủ công có bằng chứng trong lúc runner chưa chạy được. Không cài thêm dependency nếu chưa cần.
- [ ] Ghi release scope và các quyết định ở bảng trên; người có quyền môi trường review/ap dụng migration trên môi trường test đúng phạm vi. Live schema check và live workflow chỉ chạy khi được cho phép riêng.

**Gate:** Có một bản build mở được, kết nối môi trường test; baseline và contract được ghi lại, không còn lẫn FakeSupabase với database thật.

## Task 2 — Auth, hồ sơ và ghép đôi E2E

**Files:** Sửa `src/features/auth/authApi.ts`, `authService.ts`, `pages/AuthScreen.tsx`, `src/features/onboarding/pages/OnboardingScreen.tsx`, `src/features/account-lifecycle/components/SignOutAction.tsx`, `src/features/invites/inviteApi.ts`, `inviteService.ts`, `pages/InviteFlowScreen.tsx`, `src/features/profile-settings/pages/ProfileEditScreen.tsx`; backend `app/api/auth.py`, `app/services/auth_service.py`, `app/api/couple.py`, `app/services/couple_service.py`. Mở rộng test auth/invite/couple hiện có.

**Interfaces:** Tái sử dụng login/register/refresh/me/invite/accept hiện có. Bổ sung `AuthApi.logout(token: string): Promise<void>` gọi POST `/auth/logout`; recovery/provider dùng contract đã chốt, không tạo tài khoản local. Giữ logout local rõ ràng nếu server không liên lạc được; không khẳng định đã thu hồi server trong ca đó.

- [ ] Thêm test: `logout_revokes_session`, `refresh_after_logout_rejected`, `accept_same_invite_concurrently_creates_one_couple`, `late_profile_response_after_account_switch_ignored`.
- [x] Nối logout server, đổi mật khẩu/gỡ avatar cho scope email/password đã chốt. Khôi phục phiên/retry giữ quyền server; không lưu password. Recovery bị loại; OAuth/OTP hoãn theo quyết định người dùng. Nghiệm thu UI native ở bước cuối task vẫn còn.
- [ ] Nối bước thông tin cá nhân bằng API profile hiện có; tạo/nhận lời mời và chế độ chờ. Trường quan hệ/cách muốn được quan tâm được hoàn thiện cùng settings API ở Task 9, không đánh dấu toàn bộ onboarding đạt tại M1 hoặc gửi trường không được server hỗ trợ.
- [ ] Chạy A đăng ký → sửa hồ sơ/avatar → mời B → B preview/accept → cả hai thấy đúng đối tác → restart → logout/login. Thử mã hết hạn, tự mời, đã có cặp, double accept và token hết hạn.

**Gate:** A/B đã ghép hoạt động sau restart; C không đọc được dữ liệu cặp; logout/recovery không còn đường báo thành công giả. Deferred link sau cài đặt cần bằng chứng trên hai nền tảng trước khi đánh dấu yêu cầu đó đạt.

## Task 3 — Home/kỷ niệm khép kín

**Files:** Sửa `src/features/moments/memoryApi.ts`, `memoryService.ts`, `src/features/home/components/MemoryComposerDialog.tsx`, `MemoryDetailView.tsx`, `HomeOverlays.tsx`, `useHomeMemories.ts`; backend `app/api/memory.py`, `app/services/memory_service.py`, `app/repositories/memory_repo.py`, media storage/processing. Test `publishMemoryPost.test.ts`, backend memory/idempotency/storage.

**Interfaces:** Giữ list/detail/create/upload; bổ sung API client cho PUT/DELETE memory và DELETE ảnh theo endpoint đã có. Khôi phục create/upload theo Idempotency-Key và checkpoint; không tạo memory mới chỉ vì upload ảnh bị timeout.

- [ ] Thêm test create/upload retry cùng key trả cùng tài nguyên; dùng lại key với payload khác bị từ chối; URL ảnh hết hạn có thể refresh; C không đọc/xóa ảnh của A/B.
- [ ] Nối sửa/xóa bài/ảnh và trạng thái đang xử lý/thử lại; kiểm tra phân trang, invalidation, cleanup file tạm và object storage theo quyền.
- [ ] Kiểm tra ký URL private, giới hạn file/type/kích thước và lỗi upload; feed/lịch/chi tiết cùng một nguồn dữ liệu thật. Pin chỉ làm nếu contract hiện có hỗ trợ hoặc được bổ sung rõ ràng.
- [ ] A tạo text/ảnh → B tải và xem được → sửa/xóa → B refresh xác nhận đúng; lặp lại khi mất mạng sau create và sau upload.

**Gate:** Một bài đăng chỉ xuất hiện một lần, không có ảnh giả, ảnh ngoài cặp không truy cập được.

## Task 4 — Check-in, lịch sử và trạng thái người yêu thật

**Files:** Tạo `src/features/checkins/moodApi.ts`, `moodService.ts`, `moodQueries.ts`, `moodDto.ts`; sửa `pages/MoodCheckInScreen.tsx`, `pages/MoodHistoryScreen.tsx`, `src/features/moments/pages/MomentsScreen.tsx`, public exports của checkins/partner-status. Backend sửa `app/api/mood.py`, `app/schemas/mood.py`, `app/services/mood_service.py`; mở rộng `tests/test_mood_privacy.py`.

**Interfaces:** `moodService.submit(input, idempotencyKey)`, `history(period, signal)`, `partnerLatest(signal)` theo DTO đã chốt ở Task 1. UI draft giữ canonical privacy; `moodDto.ts` là nơi map server values. Không gửi GIF/sticker qua trường note hoặc content nếu contract không hỗ trợ.

- [ ] Test mapping cảm xúc/mức chia sẻ/note/attachment; private_only không tạo partner status/Nudge; mood_only không có reason/note trong bất kỳ response nào cho đối tác.
- [ ] Nối submit và API đọc; dùng cache key theo account/couple/period, phân biệt chưa có dữ liệu và tải lỗi. Chỉ thay preview khi query thật xác nhận kết quả.
- [ ] Lịch sử dùng timezone cá nhân, nhiều check-in/ngày giữ lịch sử và trạng thái mới nhất đúng thứ tự server. Danh mục lý do từ cấu hình server theo spec.
- [ ] A check-in ba mức chia sẻ → B chỉ thấy dữ liệu cho phép; restart vẫn thấy lịch sử thật; thử hai múi giờ/DST, qua nửa đêm, gửi lặp sau timeout.

**Gate:** Nút chia sẻ/lưu thực sự tạo bản ghi; không còn dùng moodPreviewRecords ở màn sản phẩm đã tích hợp.

## Task 5 — Smart Nudge từ dữ liệu thật

**Files:** Tạo `src/features/nudges/nudgeApi.ts`, `nudgeService.ts`, `nudgeQueries.ts`; sửa `components/NudgePreview.tsx`, `pages/NudgeScreen.tsx`. Backend tái sử dụng `app/api/smart_nudge.py`, `app/services/smart_nudge_service.py`, `app/ai/`; mở rộng `test_nudge_ai_boundary.py`, `test_smart_nudge_state.py`.

**Interfaces:** GET `/nudges/active`, POST `/nudges/{id}/action`, POST `/nudges/{id}/rate`. Việc tạo Nudge do check-in phía server kích hoạt; mobile không tự tạo Nudge hoặc đánh dấu completed chỉ vì mở composer.

- [ ] Test private_only và mood_only trước AI, moderation và template fallback; giới hạn 3/ngày, cooldown 4 giờ, hết hạn 24 giờ, snooze 2 giờ tối đa một lần theo spec; kiểm tra timezone đã chốt.
- [ ] Nối active/detail/action/rating; làm ngay mở draft phù hợp trong Tiny Moment, người dùng sửa trước gửi. Giữ ID tham chiếu, không đưa nội dung riêng tư vào route params.
- [ ] Test AI timeout/lỗi/JSON sai dùng template trong SLA 6 giây; dữ liệu khủng hoảng chỉ đi qua flow hỗ trợ được duyệt. Xác minh nguồn và nội dung hỗ trợ trước release.
- [ ] A check-in shared → B thấy đúng gợi ý, snooze/dismiss/rate lưu thật; AI hỏng vẫn dùng được; cùng thao tác từ hai phiên không ghi đè trạng thái sai.

**Gate:** Không còn placeholder Smart Nudge trong luồng chính; không gắn nhãn hoàn thành trước khi hành động được xác nhận.

## Task 6 — Tiny Moments, media và phản hồi

**Files:** Tạo `src/features/moments/tinyMomentApi.ts`, `tinyMomentService.ts`, `tinyMomentQueries.ts`; sửa `components/MomentComposerSheet.tsx`, `VoiceDraftControl.tsx`, `MomentCard.tsx`, `pages/MomentDetailScreen.tsx`; backend mở rộng `app/api/smart_nudge.py`, `app/schemas/smart_nudge.py`, `app/services/smart_nudge_service.py`, `app/repositories/smart_nudge_repo.py` và media pipeline.

**Interfaces:** Giữ POST/GET `/tiny-moments`; contract mới cần phân trang/detail/private media reference/reaction/reply/read/delete. Tên endpoint mới được định nghĩa trong ma trận Task 1 trước khi thêm API client; không xem schema reaction đã tồn tại là endpoint đã triển khai. Gửi/đánh dấu Nudge liên quan phải retry an toàn.

- [ ] Test send retry cùng key chỉ tạo một Moment; file thuộc user/cặp khác không gắn vào Moment được; tối đa voice 30 giây và note/content theo contract.
- [ ] Nối text/signal trước, sau đó ảnh/ghi âm qua private upload + thumbnail/playback. Native media adapter hiện có được tái sử dụng; soạn draft không tương đương đã gửi.
- [ ] Làm detail/reaction/reply/read receipt theo tùy chọn người dùng, xóa cho cả hai; bình luận Home nếu khác entity phải có contract riêng, không ghi lẫn vào Tiny Moment.
- [ ] B mở Nudge → sửa draft → gửi → A nhận, nghe/xem và phản hồi → B thấy phản hồi. Thử hết quyền mic/ảnh, mất mạng giữa upload, app bị đóng sau server commit.

**Gate:** Vòng lặp M2 chạy với text/signal/photo/voice, không chỉ các component soạn nội dung độc lập.

## Task 7 — Đồng bộ giữa hai thiết bị

**Files:** Tạo `src/features/realtime/realtimeClient.ts`, `RealtimeSync.tsx`, `index.ts`; compose ở provider root ngoài route; backend rà `app/api/ws.py`, `app/services/websocket_service.py`. Thêm test invalidation/reconnect/scope; không thay WS transport nếu hiện có đáp ứng.

**Interfaces:** Sự kiện chỉ mang allowlisted type + entity ID/version; xác thực session và membership trên server. Client invalidates query trong feature qua public exports, không dùng payload push/WS làm nguồn chân lý.

- [ ] Test C không subscribe sự kiện cặp A/B; token hết hạn phải re-auth; event trùng/lệch thứ tự không nhân đôi dữ liệu.
- [ ] Nối reconnect/backoff và refetch khi foreground/mất sự kiện; xóa subscription và cache scope cũ khi logout/unpair/đổi account.
- [ ] Hai máy đang mở: check-in/Moment/phản hồi cập nhật trong 5 giây trên môi trường nghiệm thu có mạng; ghi thời gian thực tế.

**Gate:** Reconnect và foreground không làm mất dữ liệu, không cần người dùng kill/reopen app để thấy trạng thái mới.

## Task 8 — Push, nhắc lịch và cài đặt thông báo

**Files:** Sửa `src/features/notifications/localNotificationAdapter.ts`, `src/features/profile-settings/pages/NotificationSettingsScreen.tsx`, `src/shared/navigation/notificationIntent.ts`; tạo `notificationApi.ts`, `notificationService.ts`; backend bổ sung module notifications API/service/repository và migration nếu chưa có, tái sử dụng `/users/me/device-token`.

**Interfaces:** Token thiết bị được ràng buộc account và gỡ khi logout. Settings lưu server; nhắc local là best-effort. Outbox server/worker có retry và delivery key, không chạy scheduler phụ thuộc process mobile.

- [ ] Test quyền denied/unavailable; nhắc check-in không gửi nếu đã check-in; quiet hours/timezone, tối đa 4 push/ngày và gom phản hồi 15 phút theo spec; ngoại lệ ghép đôi/bảo mật.
- [ ] Nối settings/token/provider thật và notification tap allowlist; nội dung privacy mode không chứa mood note/reasons. Ghi quyền và kênh riêng, không báo đã bật nếu OS từ chối.
- [ ] Kiểm tra foreground/background/app bị đóng trên Android và iOS, tap đi đúng tài nguyên còn được phép; sau unpair notification cũ không mở được dữ liệu.
- [ ] Bổ sung nhắc lời mời 24/48/72 giờ tối đa ba lần, dừng sau accept/revoke; snooze Nudge chỉ một lần.

**Gate:** Có bằng chứng delivery/tap trên thiết bị thật; có adapter hoặc unit test không đủ đánh dấu push đạt.

## Task 9 — Settings, lifecycle và check-in offline an toàn

**Files:** Sửa `src/features/profile-settings/pages/SettingsScreen.tsx`, `NotificationSettingsScreen.tsx`, `src/features/onboarding/pages/OnboardingScreen.tsx`, `src/features/account-lifecycle/pages/AccountLifecycleScreen.tsx`, invite API/UI và session/cache coordination; tạo API/service cho care preferences/export/delete và check-in encrypted outbox ngoài route root. Backend rà `app/services/couple_service.py`, thêm lifecycle/export/purge worker và migration tương ứng.

**Interfaces:** Unpair dùng DELETE `/couple` nhưng phải rà việc giữ/xóa dữ liệu 30 ngày so với code hiện tại. Export job có trạng thái/expiry/private download. `flushCheckInOutbox(accountScope)` chỉ gửi đúng owner, hỗ trợ idempotency; khóa/credential ở secure storage, dữ liệu outbox mã hóa.

- [ ] Test unpair/delete khi WS/request/upload đang chạy: chặn quyền ngay, invalidate scope hai máy, không đọc được file bằng URL cũ ngoài thời hạn/quy tắc đã duyệt.
- [ ] Hoàn thiện care/relationship/timezone/privacy/read receipt và settings trong release scope; dark mode phải chạy thật hoặc được loại khỏi phạm vi và UI rõ ràng, không giữ nút không làm gì.
- [ ] Nối các trường onboarding còn thiếu vào cùng API settings; bỏ qua rồi quay lại sửa được. Sau media Task 6, hoàn thiện quà kèm lời mời text/ảnh/voice nếu nằm trong release scope: upload riêng tư, gắn đúng lời mời, chỉ người nhận mở sau accept; revoke/expiry xử lý media mồ côi. Đây là bước tùy chọn của spec nhưng phải có quyết định phạm vi rõ ràng.
- [ ] Làm export → xác nhận unpair/delete hai bước → thu hồi session/token → purge theo lịch; worker có retry/audit. Không chạy thao tác thật trên dữ liệu người dùng trong test.
- [ ] Kiểm tra SQLite/SQLCipher trên development build trước khi xây encrypted outbox. Nếu chưa hỗ trợ, giữ check-in offline chưa khả dụng, ghi blocker release thay vì lưu plaintext. Test airplane mode → restart → online chỉ gửi một bản ghi; đổi account không gửi hàng đợi cũ.

**Gate:** Những hành động ảnh hưởng dữ liệu có kết quả server và bằng chứng thu hồi quyền. Dọn dữ liệu theo lịch được kiểm thử bằng clock/test environment, không cần chờ 30 ngày thật.

## Task 10 — Tiny Mission: nhiệm vụ, thành tựu và ví điểm

**Files:** Tạo backend `app/api/mission.py`, `app/schemas/mission.py`, `app/services/mission_service.py`, `app/repositories/mission_repo.py`, migration mission/assignment/completion/points ledger; đăng ký router trong `app/main.py`. Mobile tạo `src/features/tiny-mission/missionApi.ts`, `missionService.ts`, `missionQueries.ts`; sửa `TinyMissionContent.tsx`, `MissionViews.tsx`, detail screen và overlays. Fixtures chỉ còn ở QA/test.

**Interfaces đề xuất, phải chốt ở M0:** GET `/missions/today`; POST `/missions/{id}/complete`; POST `/missions/{id}/swap`; GET `/missions/progress?period=week|month&anchor=...`; GET `/points/wallet`; GET `/points/ledger`. Response chứa ngày/kỳ/timezone, owner, trạng thái từng người, version và điểm server. Mutation dùng idempotency key; caller không truyền user ID để đánh dấu thay đối tác.

- [ ] Test 4 nhiệm vụ/ngày; cá nhân chỉ owner tự xác nhận; chung chỉ thưởng khi cả hai hoàn thành; swap bị từ chối nếu đã có completion; điểm/mốc và số lượt đổi theo quyết định đã duyệt.
- [ ] Tạo assignment theo ngày server bằng unique constraint; completion và ledger/milestone cùng transaction/RPC. Retry/multi-device không cộng trùng; số dư tính từ ledger, không lấy từ previewBalance/client.
- [ ] Nối UI đã duyệt, gồm lịch progress tháng, lịch sử điểm và trạng thái lỗi/loading/empty. Qua ngày/kỳ/đổi timezone không tính lại hoặc mất điểm cũ.
- [ ] A/B nhận cùng bộ nhiệm vụ đúng owner → tự đánh dấu → mốc tuần/tháng cập nhật → restart vẫn giữ điểm. Chạy completion đồng thời và request cũ sau swap.

**Gate:** Bỏ nhãn preview chỉ khi toàn bộ dữ liệu được tải thật; không hardcode Linh/Nam hoặc số điểm minh họa trong màn sản phẩm.

## Task 11 — Tiny Mission: đổi quà, mã và vận hành trao quà

**Files:** Tạo backend `app/api/reward.py`, `app/schemas/reward.py`, `app/services/redemption_service.py`, `app/repositories/redemption_repo.py`, migration catalog/stock/redemption/code; mobile `rewardApi.ts`, `rewardService.ts`, `rewardQueries.ts` trong tiny-mission, sửa `MissionOverlays.tsx` và `MissionRewards`. Tạo `.doc/REWARD-OPERATIONS.md` cho nhân sự trao quà.

**Interfaces đề xuất:** GET `/rewards`; POST `/redemptions` với `reward_id` + idempotency key; GET `/redemptions` và GET `/redemptions/{id}`. Kết quả gồm mã, quà/giá snapshot, trạng thái nhận quà, số dư server và link fanpage cấu hình. Công cụ nội bộ claim/fulfill có quyền quản trị, không cho mobile tự đánh dấu đã giao.

- [ ] Test số dư không âm, stock không âm, retry trả cùng mã/kết quả; hai người đổi đồng thời không vượt số dư; không xem mã của cặp khác.
- [ ] Transaction đổi quà: khóa/kiểm tra ví + tồn → trừ ledger/reserve stock → tạo redemption/code duy nhất → commit. Không tạo mã trước rồi trừ điểm ở request khác.
- [ ] Nối popup xác nhận/mã, copy mã/link và mở fanpage thật; Quà đã đổi đọc lại mã sau timeout/restart. Nếu response mất sau commit, tra kết quả theo idempotency key thay vì bắt đổi lại.
- [ ] Nghiệm thu quy trình liên hệ fanpage → kiểm tra mã → xác nhận người có quyền nhận → giao quà → đánh dấu fulfilled một lần. Chốt cancellation/refund và tình huống unpair theo M0, có ledger bù thay vì sửa lịch sử.

**Gate:** Một lượt đổi có thể được truy vết từ app tới người vận hành; có mã trên màn hình nhưng không thể đối soát/tra lại chưa phải E2E.

## Task 12 — Nghiệm thu, hardening và release

**Files:** Tạo `flamee-mobile/e2e/` sau quyết định runner; `backend/tests/integration/` cho contract/transaction trên test DB; cập nhật `.doc/E2E-ACCEPTANCE.md`, backend API/database docs, hướng dẫn môi trường và release checklist.

- [ ] Tạo bộ flow UI chạy trên hai account: auth/invite, Home/media, privacy check-in, Nudge fallback, Moment reaction, push tap, offline replay, unpair/delete, mission concurrency và redemption recovery. Assertions kiểm dữ liệu server, không chỉ toast hoặc ảnh màn hình.
- [ ] Chạy smoke trên Android và iOS development/release build với cấu hình đúng môi trường; kiểm mic/ảnh/notification denied, bàn phím, back/swipe-back, safe area, font scaling và mạng chậm.
- [ ] Test contract/API + migration mới trên DB test, quyền C ngoài cặp, signed URL, rate limits và log redaction. Không dùng service-role test thay cho kiểm quyền API của user.
- [ ] Loại preview/placeholder khỏi các luồng phát hành đã cam kết, rà deep link, app restart/token refresh và FAB chỉ-animation. Không xóa QA riêng chỉ để che việc dữ liệu sản phẩm còn giả.
- [ ] Ghi build ID, phiên bản app/backend/schema, môi trường, ca test, actual/expected, artifact đã làm sạch và lỗi còn mở. Review riêng rollout/rollback migration, crash reporting không chứa PII và cấu hình signing/store; xuất bản chỉ sau quyết định phát hành.

**Release gate:** Không còn lỗi chặn vòng lặp chính, sai quyền riêng tư, mất dữ liệu, cộng/trừ điểm sai hoặc giao quà trùng. Các phần chưa được duyệt loại khỏi scope phải được ghi rõ; không dùng typecheck, web export hay FakeSupabase để thay bằng chứng native/server E2E.

## Lệnh kiểm tra nền tảng khi thực thi

Trong `flamee-mobile`:

```powershell
npm run typecheck
npm run test:domain
npx expo export --platform web --output-dir dist-e2e-qa
```

Trong `backend`, với virtualenv dự án:

```powershell
.\.venv\Scripts\python.exe -m pytest tests -m "not live_readonly and not live_workflow"
```

Đọc từng test tích hợp trước khi chạy. `test_live_workflow.py` hiện có thể tạo và giữ dữ liệu trên Supabase thật và gọi Gemini có phí; không tự bật `FLAMEE_TEST_LIVE_WORKFLOW`. Read-only live check cũng cần chọn đúng môi trường và quyền truy cập. Chạy integration/migration bằng dữ liệu test cô lập; dọn theo run ID, không xóa diện rộng.

Lỗi baseline cũ phải được tái hiện ở M0. Không suy ra toàn suite hiện vẫn hỏng/đạt từ kết quả của các lượt làm UI trước đó.

## Cách đánh dấu hoàn thành

Mỗi task chỉ được tick hoàn thành khi có: contract khớp + implementation FE/BE cần thiết + test lỗi/quyền/retry + ca E2E trên môi trường thật tương ứng + tài liệu cập nhật. Mỗi mốc cần bản demo có dữ liệu thật. Lưu checkpoint sau task; Git commit/PR là bước riêng theo phạm vi người dùng cho phép.

**Điểm bắt đầu đề xuất:** Task 1, rồi Task 2–3 để có nền tài khoản/cặp/media tin cậy. Không triển khai Tiny Mission backend trước khi chốt timezone, điểm/lượt đổi, stock/fanpage và đối soát quà.
