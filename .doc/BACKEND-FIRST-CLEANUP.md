# Gỡ luồng mô phỏng và làm backend trước — 2026-10-17

## Cập nhật sau backend alignment cùng ngày

Xem [hướng dẫn database hiện tại](../backend/docs/DATABASE-SETUP.md).
Auth đã bổ sung session thật, refresh rotation, logout và thu hồi session khi đổi
mật khẩu. Schema/migration đã được chuẩn bị nhưng chưa chạy lên Supabase.
Sau merge dev 2026-10-18, upload ảnh mới dùng pipeline private `flamee-media`
(xem BACKEND-MEDIA-PIPELINE.md); không còn trả 501 hoặc public URL. Plans đọc database, không
fallback giá mẫu; checkout/manual activation trả 501. Các ghi nhận upload và
kết quả test cleanup bên dưới là lịch sử trước bản alignment này.

> Cập nhật 2026-10-18: Home đã chuyển thành feed album kỷ niệm đọc thật `GET /memories` theo yêu cầu redesign; route Timeline cũ về Home. Hero cảm xúc cũ đã bỏ. Create/upload, notification và Tiny Moment vẫn chưa khả dụng, không khôi phục simulator. [Contract Home hiện tại](HOME-MEMORY-FEED.md).

Quyết định trực tiếp: bỏ mock data và mock flow trong app trước khi tiếp tục phát triển backend. Tài liệu này cập nhật trạng thái thực tế, thay các mô tả local runtime trước đây; không tuyên bố backend media hoặc các feature chưa tích hợp đã hoàn tất.

## Đã thay đổi trong source

| Phạm vi | Hiện trạng sau cleanup |
| --- | --- |
| Auth | Giữ login/register, bearer token, SecureStore thật và xác thực `/auth/me`. Bootstrap/login không tạo bản sao tài khoản onboarding cục bộ. |
| Invite | Giữ API create/current/preview/revoke/accept, copy/share thật, polling và lỗi server. Gỡ engine mã mời, membership, quà và thông báo ghép đôi trong bộ nhớ. Bỏ qua chỉ điều hướng; không ghi setup hoàn tất giả. |
| Home/Connection | Đọc lại identity và `couple_id` từ server. Không suy ra chưa ghép đôi từ một Map rỗng, không chèn partner hoặc nội dung mẫu. Giữ header/hero và hệ control đã duyệt. |
| Profile | Form sửa `full_name` và `username` của chính mình qua `GET/PUT /auth/me`. Biệt danh này khác tên gọi đối phương. Chỉ báo lưu khi server xác nhận đúng tài khoản; lỗi không fallback local. Migration username đang chờ, chưa chạy. |
| Check-in/Moment/Timeline/Nudge/Tasks | Gỡ lưu/sửa/xóa/reply/reaction/retry/sinh gợi ý bằng bộ nhớ. Các route và deep link trả màn chưa khả dụng, không phải feed rỗng giả. Không mở picker/thu âm để giả gửi ảnh/giọng nói. |
| Care/notification settings | Gỡ form báo đã lưu vào bộ nhớ. Hiển thị chưa khả dụng cho đến khi tích hợp contract phù hợp. |
| Lifecycle | Giữ logout thật, xóa credential/session/invite intent/query cache và dọn nhắc nhở native đã biết. Gỡ export preview, form support không gửi, unpair local và delete local. Backend unpair có endpoint thật nhưng chưa được tích hợp lại; app không giả lập nó. |
| Menu | Giữ nhóm/card/divider/quick action. Gỡ gói Premium, giá và quyền lợi mẫu. Giữ mục Chế độ tối trống theo yêu cầu trước đó; không giả thay theme. |
| Backend recovery | Gỡ OTP lưu trong dict và trả trực tiếp trong response. Payload hợp lệ tới forgot/reset-password nhận 501 `feature_unavailable`; không gửi mã hoặc đổi mật khẩu. |
| Backend ảnh | Pipeline private đã được triển khai trong source: decode/giới hạn ảnh thật, JPEG chuẩn hóa, thumbnail, signed URL và cleanup bù trừ. Migration chưa áp dụng và chưa E2E Supabase thật. |

Đã xóa các service `localCheckInService`, `localMomentService`, `localNudgeService`, `localCoupleService`, `localInviteService`, `localOnboardingService`, `localSettingsService`, `localAccountLifecycleService` và reminder helper không còn caller. Gỡ UI gift/popup chỉ phục vụ engine local và `PremiumPreview`. Các test chỉ xác nhận simulator đã được bỏ cùng triển khai đó; test schema/catalog/presentation còn giữ.

Native `localMediaAdapter` và `localNotificationAdapter` là wrapper thực cho Expo, không phải dữ liệu backend giả. Giữ chúng để tái sử dụng khi backend sẵn sàng. Không có đường submit nghiệp vụ nào gọi chúng để giả thành công. Preset emotion/mascot, assets, trạng thái form/UI, dữ liệu trong test và catalog `/design-system` được giữ; chúng không đại diện cho dữ liệu người dùng thật. Không xóa build QA lịch sử hoặc dữ liệu người dùng.

## Bằng chứng và giới hạn

- Thêm guard quét production source chống service mô phỏng/`persist => saved_local` quay lại.
- Test profile HTTP kiểm tra PUT, bearer, payload và response lỗi; session test kiểm tra đúng owner và response đến sau logout.
- Backend test kiểm tra recovery không trả mã/không đổi mật khẩu; upload test không chấp nhận thumbnail giả.
- Unit tests backend vẫn dùng FakeSupabase. Đây là test double, không phải bằng chứng Storage hoặc database thật hoạt động.
- Không dùng browser agent, không tạo account/ảnh giả, không gọi AI, không ghi Supabase, không chạy migration/Git hoặc đụng process của người dùng.
- `.doc/README.md`, `CODING-STANDARDS.md`, `CODEBASE-BASELINE.md` đang thiếu. Không tự dựng các file đó.
- Kết quả typecheck/tests được ghi ở cuối sau khi chạy. Chưa E2E Expo Go/iOS/Android, chưa benchmark hoặc kiểm tra upload thật.

## Backend trước: thứ tự đề xuất

### 1. Chốt và kiểm tra contract hiện có

- Giữ một nguồn logic hồ sơ cho `/users/me` và alias `/auth/me`, tránh hai nhánh update lệch validation. Backend hiện có cả hai, mobile vừa nối alias auth để dùng chung session coordinator.
- Review rồi áp dụng migration `20261017_profile_username.sql` qua quy trình riêng. Chưa được chạy trong cleanup này. Kiểm tra đọc/sửa/xóa biệt danh trên database phát triển, account khác không sửa được owner. Không tự điền biệt danh cho account cũ.
- Kiểm tra membership server, accept đồng thời và unpair với dữ liệu thật trên môi trường kiểm thử. Endpoint có code không đồng nghĩa migration/RPC và quyền đã được xác nhận.
- Chọn contract Moment cho text/photo/voice/signal, reply/reaction/delete và Timeline. `/memories` hiện là album kỷ niệm với title/category/date, không tự động tương đương Tiny Moment. Không nối UI bằng cách đổi tên field cho qua.

Nghiệm thu: response schema và error codes nhất quán; không đọc/sửa được tài khoản/couple khác; lỗi mạng không biến thành thành công, không tin owner/couple ID do client gửi.

### 2. Media dùng chung cho avatar và Timeline — đã triển khai trong source

Contract và tradeoff hiện tại nằm tại [BACKEND-MEDIA-PIPELINE.md](BACKEND-MEDIA-PIPELINE.md).
Migration `backend/migrations/20261018_private_media_pipeline.sql` chỉ là artifact
review, chưa được chạy.

Đề xuất bản đầu dùng upload multipart qua API cho ảnh sau nén tối đa 2 MiB. Đổi lại API phải nhận và chuyển tiếp bytes; dễ đặt validation, quyền và rollback tập trung. Chỉ chuyển upload trực tiếp có signed permission khi đo được API băng thông/concurrency là điểm nghẽn. Không cần dựng resumable upload cho ảnh nhỏ ở bước đầu.

- Bucket private `flamee-media` và object key do server sinh; client không nhận quyền ghi trực tiếp.
- `users.avatar_storage_path` và metadata/path trong `memory_images` lưu asset mới. Cột URL cũ chỉ còn phục vụ dữ liệu legacy.
- Stream được đọc với hard limit trước khi decode; Pillow xác minh ảnh thật, giới hạn pixel, sửa orientation, bỏ EXIF và chuẩn hóa JPEG.
- Ảnh kỷ niệm có bản lớn tối đa 1600 px và thumbnail tối đa 480 px; avatar center-crop tối đa 512 px. Các ngưỡng chưa được benchmark trên thiết bị/mạng thật.
- `POST/DELETE /auth/me/avatar` quản lý avatar; PUT profile không nhận URL tùy ý. Upload ảnh memory giữ endpoint hiện có.
- Tải ảnh riêng tư qua URL ký thời hạn ngắn (không quá 15 phút theo spec), sau khi kiểm tra quyền hiện tại. URL ký còn dùng được trong TTL sau unpair là tradeoff cần chấp nhận/giảm TTL hoặc dùng proxy kiểm quyền; không hứa thu hồi tức thì.
- Storage và Postgres không có cùng transaction: source đã bù trừ object mới khi ghi database lỗi và dọn object khi xóa. Việc dọn avatar cũ là best-effort sau commit; cần orphan sweep có retry cho vận hành dài hạn.
- Giữ dữ liệu cũ: cần kế hoạch chuyển public URL/path trước khi thay quyền bucket, không làm hỏng ảnh hiện có hoặc chạy cleanup hàng loạt trong bước này.

Unit test đã bao phủ file giả/quá giới hạn, xử lý/thumbnail, phân quyền couple,
cleanup khi lỗi và thay/xóa asset. Chưa có bằng chứng upload thật, RLS, signed URL,
payload bytes hoặc hiệu năng trên Supabase/thiết bị nên không gọi pipeline là đã tối ưu.

### 3. Timeline và CRUD thực, có giới hạn chi phí

- API Moment/Timeline dùng cursor `(created_at, id)`, limit có trần, index theo couple và thời gian; không tải toàn bộ rồi cắt 3 phần tử.
- Source hiện lấy metadata ảnh bằng một query cho toàn bộ kết quả và ký URL Storage theo batch, loại N+1 ở phần ảnh. API vẫn chưa có cursor nên "một trang" hiện có thể là toàn bộ dữ liệu.
- Tạo Moment có idempotency key; retry upload/create không nhân đôi. Chỉ báo đã gửi sau response canonical từ backend. Không có offline queue được xác minh thì không báo “đã xếp hàng”.
- Reply/reaction/delete kiểm tra membership và owner server-side; quyền phải được đánh giá lại sau unpair. Chưa nối mobile cho đến khi backend và Storage vượt kiểm tra trên.

Nghiệm thu: restart app còn dữ liệu, account partner xem được trên máy khác, xóa có hiệu lực thật. Đo p50/p95 API, số query/trang, payload bytes, peak memory khi upload và lưu lượng ảnh trên mạng chậm với dữ liệu đủ lớn. Đặt mục tiêu dựa trên phép đo này; hiện chưa có benchmark để khẳng định tối ưu.

### 4. Check-in, gợi ý và các chức năng còn lại

- Chốt API emotion-note và giữ ranh giới `full` / `mood_only` / `private_only`; backend thực hiện redaction trước response/job/AI. Không đưa note riêng tư vào log hoặc AI. Legacy mood service hiện có background fact extraction từ note; cần kiểm tra privacy trước khi nối, không coi nó tương thích với flow mới chỉ vì có endpoint.
- Gợi ý cần nguồn dữ liệu/trạng thái/expiry/feedback thật. Nếu chưa có thì để unavailable; không sinh template trên client rồi gán thành gợi ý của server/AI.
- Care/notification preferences cần persistence thật; quyền OS và push backend là hai phần khác nhau. Mở lại reminder sau khi có lifecycle và kiểm tra account switching/restart.
- Sau đó mới tích hợp export job/download thật, support persistence/delivery, unpair và account deletion với cleanup/retention. Recovery cần gửi xác minh thật, token một lần, rate limit và giới hạn thử; không trả mã qua API.
- Premium chỉ mở khi có product/entitlement/billing thật; không khôi phục giá và quyền lợi giả.

**Ưu tiên đề xuất:** profile + media → Moment/Timeline → check-in/privacy → gợi ý và settings/lifecycle. Không triển khai cả backend mới trong cleanup này và không tự chạy migration/dịch vụ thật.

## Kết quả kiểm tra source cleanup

Media pipeline được kiểm tra lại ngày 2026-10-18: backend 55/55 test đạt,
`pip check`/`compileall` đạt; mobile typecheck đạt và domain test 96/96. Đây là
test source/FakeSupabase, không thay cho migration, Storage/RLS thật hoặc QA thiết bị.

- `npm run typecheck`: đạt sau thay đổi cuối.
- `npm run test:domain`: 82/82 đạt. Tổng số thay đổi vì bỏ test dành riêng cho engine mô phỏng đã xóa và thêm kiểm tra API/response thật, stale session và guard production source.
- Backend `.venv/Scripts/python.exe -B -m pytest -q --tb=short`: 38/38 đạt. Còn 7 cảnh báo `datetime.utcnow()` có sẵn trong user service; không tắt cảnh báo hoặc đổi dependencies.
- Android Expo export: thành công, 4397 modules, HBC khoảng 8.5 MB. Artifact: `C:/Users/Huy/AppData/Local/Temp/flamee-no-mocks-android-7e8bafa7f7064790b287f92f725b70d6`. Toolchain còn cảnh báo `NO_COLOR`/`FORCE_COLOR` của môi trường; không giấu chúng. Đây chỉ là bundle JS/assets, không phải bản cài hoặc kiểm tra trên thiết bị.
- Chưa kiểm tra UI qua browser/Expo Go hoặc thiết bị iOS/Android; chưa build/export iOS trong cleanup này, chưa upload thật, chưa benchmark, chưa áp dụng migration username. Không có bằng chứng để khẳng định native/media hoặc backend performance đã tối ưu.
