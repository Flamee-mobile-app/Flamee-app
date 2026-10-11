# Flamee — hiện trạng codebase

Ngày đọc: 2026-10-11. Đây là bản ghi từ source trong workspace, không phải chứng nhận runtime, DB cloud hoặc production readiness. Bộ nội quy và mục lục được tạo trước khi chỉnh cấu hình font.

## 1. Phạm vi đọc

Đã đọc mã nguồn do dự án quản lý trong flamee-mobile/app, src, cấu hình; backend/app, tests, scripts, schema.sql, cấu hình mẫu; các Markdown tại .doc và backend/docs. Danh sách file ở phụ lục. Bỏ qua node_modules toàn bộ, .git, cache/build, lockfile chi tiết và nội dung binary. Với cảnh báo font, đã đọc riêng implementation Button và getFontSize native của Tamagui cài tại máy.

Không chạy script scratch, không truy cập dữ liệu Supabase thật, không thay schema cloud. Những điểm dưới đây là quan sát tĩnh; kiểm tra thiết bị cần runtime native.

## 2. Mobile đang có

| Khu vực | Source | Hiện trạng |
|---|---|---|
| Stack | package.json, tsconfig.json | Expo 57, RN 0.86.3, React 19.2.3, Tamagui cài 2.7.7; TypeScript strict 6.0.3 |
| Root / navigation | app/_layout.tsx, app/index.tsx, src/shared/navigation/entryRoute.ts | Router mỏng, provider/query/session/startup; resolve entry theo auth/onboarding/couple |
| Startup | src/providers/StartupProvider.tsx; features/startup/startupLifecycle.ts | Brand motion, reduced motion, startup gate, timeout khởi tạo |
| Auth | features/auth/localAuthService.ts | Số điện thoại → account local trong bộ nhớ; chưa xác minh SMS/OAuth |
| Onboarding | features/onboarding/localOnboardingService.ts | Consent 1.1, hồ sơ, care preferences, relation type |
| Invite / couple | features/invites/localInviteService.ts; features/couple/localCoupleService.ts | Mã 6 ký tự, TTL 72 giờ; chỉ kết nối các account trong cùng process, có khóa accept local |
| Check-in | features/checkins/localCheckInService.ts | Mood 1–5, reason tối đa 3, note 140, ba scope chia sẻ; local day/timezone |
| Home / partner | features/home, features/partner-status | Đọc trạng thái local, lọc check-in có thể chia sẻ |
| Nudge | features/nudges/localNudgeService.ts | Template, giới hạn/ngày, hết hạn, snooze, feedback và liên kết Moment; không gọi AI thật |
| Moments | features/moments/localMomentService.ts | Text/photo/voice/signal, phản ứng/trả lời, retry/delete trong bộ nhớ |
| Native media | features/media/localMediaAdapter.ts | Picker/camera/record/playback thực qua Expo; voice 30 giây, không media demo giả |
| Notifications | features/notifications/localNotificationAdapter.ts | Quyền sau first check-in, lịch nhắc hàng ngày local; chưa remote push |
| Settings / lifecycle | features/profile-settings/localSettingsService.ts; features/account-lifecycle/localAccountLifecycleService.ts | Cài đặt local, JSON preview đã làm sạch, hỗ trợ chưa gửi, sign-out/unpair/delete khác nhau |
| Shared | src/shared; src/lib/api | Tamagui UI/token, vi/en, credentials/native privacy, API client chưa nối toàn bộ main flow |

Dữ liệu domain do feature sở hữu trong bộ nhớ. Cold restart làm mất bản ghi; sign-out giữ dữ liệu trong process để đổi account local. SecureStore là adapter credential cho tích hợp tương lai. SQLCipher helper tồn tại nhưng chưa được import vào luồng Expo Go. QueryProvider tồn tại không có nghĩa các service local đang đồng bộ server.

## 3. Backend đang có

- [main.py](../backend/app/main.py) ghép các router auth, couple, memory, mood, user, feed, chat dưới /api/v1 và health endpoint.
- [database.py](../backend/app/database.py) khởi tạo Supabase client bằng service-role key; [config.py](../backend/app/config.py) đọc FLAMEE_*; [schema.sql](../backend/schema.sql) mô tả PostgreSQL/pgvector.
- Auth email/password, bcrypt, JWT HS256 có TTL; chưa refresh token. OTP reset đang lưu trong process và trả trong response.
- Couple dùng mã FLM-XXXXXX, TTL cấu hình mặc định 168 giờ. Memory có title/description/category/memory_date/images; khác Tiny Moment của mobile.
- Mood backend dùng tên mood + intensity 1–10 + is_private; khác ba sharing scope và thang 1–5 của mobile.
- AI/chat có LangGraph/OpenAI/embeddings/facts/tools. Interface provider riêng không chứng minh mọi lời gọi AI đi qua nó hoặc mọi provider đã hỗ trợ.
- tests/ có FakeSupabaseClient cho auth/couple/memory. Các script ở root backend có thể sửa/xóa dữ liệu cloud; không coi là test suite an toàn.

## 4. Sai lệch cần biết trước khi code

| Quan sát | Hệ quả / việc cần làm khi đụng module |
|---|---|
| Mobile README cũ mô tả src/demo, OTP 240624, scenario switcher và demo:// voice nhưng các luồng đó không còn | Cập nhật README theo feature local; không khôi phục architecture cũ |
| API reference còn mock storage/couple_members/base64; deployment còn SQLAlchemy/SQLite/Alembic | Đọc source/router/schema hiện tại, cập nhật các doc này trước khi nối API/deploy |
| UI doc background #FAF9F7; token hiện #FFF4EC; app.json splash còn palette khác | Ghi quyết định thiết kế riêng khi chỉnh giao diện; không tự đổi màu trong fix font |
| SF Pro font binary và một số ảnh được doc tham chiếu chưa có | System fallback; không công bố brand font đã đóng gói |
| Một số feature import sâu sang service feature khác | Nợ boundary; thêm tích hợp mới qua public index, refactor trong task riêng |
| Nudge draft có truyền qua route params | Nợ privacy so với spec; chuyển sang state/draft ownership khi sửa luồng đó |
| Entry hiện truyền inviteIntent=false | Chưa đủ luồng deferred invite/deep link production |
| Notification local không triển khai toàn bộ quiet hours/cap/remote event của PRD | Không công bố remote push hoặc scheduler production |
| Sign-out chưa phối hợp toàn bộ cleanup query/cache/notification | Cần review vòng đời khi thay persistence hoặc kết nối server |
| Mood partner latest và AI enrichment chưa đồng bộ với ranh giới private trong spec | Cần áp dụng sharing scope trước đọc partner/fact/alert khi tích hợp backend |
| Mark alert read và tool IDs cần review quyền của actor/couple | Không tin ID client/LLM; kiểm tra quyền theo server context |
| Accept invite backend ghi nhiều bước chưa có transaction | Cần atomic consume/membership khi có request đồng thời |
| Break-up/delete coupling chưa thể hiện đầy đủ retention/cascade theo PRD | Đối chiếu FK/schema và chính sách dữ liệu trước thay đổi |
| Storage bucket upload memory-images khác memories trong doc; xóa DB chưa tương đương xóa file | Đồng bộ contract bucket và cleanup media |
| Memory create có early return trước AI hook; tool ghi alert có đường chỉ trả thông báo thành công | Đánh giá side effect thực khi sửa AI; không suy từ chuỗi success |
| AI khởi tạo eager ở một số module; log fact có thể chứa dữ liệu cảm xúc | Tách capability/config và làm sạch log khi sửa module |
| app.json yêu cầu iOS 16.4, PRD ghi iOS 15 | Quyết định compatibility riêng trước release |

Đây là các việc ngoài phạm vi sửa cảnh báo font; ghi nhận không có nghĩa đã khắc phục hoặc kiểm chứng trên môi trường thật.

## 5. Truy vết cảnh báo font

Bằng chứng: [tamagui.config.ts](../flamee-mobile/tamagui.config.ts), [tokens.ts](../flamee-mobile/src/shared/constants/tokens.ts), [AppButton.tsx](../flamee-mobile/src/shared/components/AppButton.tsx), [AppHeader.tsx](../flamee-mobile/src/shared/components/AppHeader.tsx), implementation đã cài @tamagui/button/dist/esm/Button.native.js và @tamagui/font-size/dist/esm/getFontSize.native.js.

1. Button chọn props.size hoặc mặc định $true, rồi gọi getFontSize để tính icon size ngay cả khi không có icon.
2. Cấu hình font body/heading chỉ khai báo caption/body*/button/h*, thiếu $true.
3. getFontSize đổi $true thiếu thành $4; $4 cũng không có nên warning xuất hiện, lookup rơi về phần tử đầu (caption).
4. Một số Button truyền size=$control; token chiều cao 48 có nhưng font chưa có key tương ứng.
5. Bản sửa cần alias true/control trong font size và lineHeight của cả body/heading, cùng typography.button 16/24. Giữ thang chữ và chiều cao control hiện tại.

Tài liệu upstream để tham khảo: [Tamagui font lookup source](https://github.com/tamagui/tamagui/blob/main/code/core/font-size/src/getFontSize.ts), [Button source](https://github.com/tamagui/tamagui/blob/main/code/ui/button/src/Button.tsx). Source cài tại máy phiên bản 2.7.7 là căn cứ trực tiếp cho lỗi này; docs upstream có thể thuộc phiên bản khác.

## 6. Kết quả sửa font và kiểm tra

- Đã thêm true/control ở font size và lineHeight trong tamagui.config.ts; body và heading cùng dùng typography.button 16/24. Letter spacing tự sinh theo cùng bộ key. Không thay token chiều cao control hoặc các bậc chữ semantic.
- Chẩn đoán dùng đúng getFontSize.native.js đã cài, transpile sang CommonJS trong thư mục tạm. Dùng Tamagui core với phần font/token/theme của config; bỏ animation driver khỏi phép chẩn đoán vì Node không có renderer native/react-native-web.
- Trước sửa: lookup $true và $control trên body/heading trả 10 / $caption và phát warning thiếu $4 hoặc $control. Sau sửa: sáu lookup ($true/$control/$button × body/heading) trả 16 với đúng token, không phát warning.
- TypeScript 6.0.3 compiler API đọc tsconfig của mobile, tạo program 118 file và lấy toàn bộ pre-emit diagnostics: 0 diagnostic. Đây là kiểm tra qua compiler API, không phải báo npm run typecheck đã chạy; terminal bị lỗi khởi tạo process trong môi trường này.
- Đã cập nhật mobile README theo luồng local đang có và rà đường dẫn tương đối của docs mới.
- Chưa chạy app trên iOS/Android; chưa kết luận toàn bộ UI hoặc backend đã được test. Không thêm/chạy test suite hay script ghi dữ liệu cloud trong task này.

## 7. Sửa cảnh báo Expo Router nhận nhầm module thành route

Ngày cập nhật: 2026-10-11. Expo Router quét file trong app/ thành route; implementation getRoutesCore.js đã cài gọi validateRouteTreeExports và cảnh báo nếu module không có default export. [Quy tắc chính thức](https://docs.expo.dev/router/basics/core-concepts/) yêu cầu đặt module không phải route ngoài route root.

Trước sửa có 7 module không phải màn hình trong app/: entryRoute.ts, QueryProvider.tsx, SessionInitializer.tsx, StartupProvider.tsx, TamaguiProvider.tsx, sessionStore.ts và startupLifecycle.ts. Đã chuyển:

- Bốn provider → src/providers/; app/_layout.tsx vẫn compose cùng provider tree.
- sessionStore.ts → src/shared/state/sessionStore.ts; các feature import metadata phiên từ shared.
- entryRoute.ts → src/shared/navigation/entryRoute.ts.
- startupLifecycle.ts → src/features/startup/startupLifecycle.ts, export qua public index của feature.

Đã cập nhật các import liên quan và docs. Rà cấu trúc bằng TypeScript AST: app/ còn 18 route/layout, tất cả có default export; các statement triển khai ngoài import/export được giữ nguyên. Kiểm tra TypeScript compiler API theo tsconfig: 118 file, 0 diagnostic. Không thêm/chạy test suite. Chưa chạy app trên iOS/Android. Sau khi đổi vị trí module, khởi động lại Metro với npm start -- --clear để tạo lại route context/cache.

## 8. Login và startup mới

Ngày cập nhật: 2026-10-11. [LOGIN-SPLASH-TRANSITION.md](LOGIN-SPLASH-TRANSITION.md) mô tả login một màn, bỏ nút Tiếp tục khám phá/dòng Kết nối hai trái tim và chuyển tự động từ splash. Brand animation được giữ; overlay fade 640 ms, từng phần form fade/slide 18 px với stagger 90 ms. Root chỉ dismiss sau khi destination route sẵn sàng; feature nhận reveal qua context presentation trong shared. Auth vẫn local bằng số điện thoại, Apple/Google unavailable. TypeScript compiler API: 123 file, 0 diagnostic. Chưa xác nhận runtime/độ mượt vì công cụ browser không khả dụng và Metro bundle timeout.

## 9. Phụ lục file đã đọc

Danh sách lịch sử trước khi thêm bộ docs và chuyển module routing; các đường dẫn app/providers và app/entryRoute bên dưới là vị trí tại lần đọc ban đầu. Không bao gồm dependency/vendor, binary và package-lock.json. Các file env bên dưới chỉ là mẫu cấu hình.

- .doc/Các luồng chính của app (bản đầu).md
- .doc/FLAMEE-LOCAL-MAINFLOW-SPEC.md
- .doc/FLAMEE-MOBILE-ARCHITECTURE.md
- .doc/QUY_CHUAN_GIAO_DIEN.md
- .doc/Tài liệu yêu cầu sản phẩm_ App kết nối cho cặp đôi.md
- .doc/fe_skills/ARCHITECTURE-FE-SKILL.md
- .doc/fe_skills/PERMISSION-RULES-SKILL.md
- .doc/flameelogo.md
- backend/.env.example
- backend/.gitignore
- backend/app/__init__.py
- backend/app/ai/__init__.py
- backend/app/ai/agents/graph.py
- backend/app/ai/agents/state.py
- backend/app/ai/agents/tools/date_planner.py
- backend/app/ai/agents/tools/memory.py
- backend/app/ai/agents/tools/mood.py
- backend/app/ai/background_tasks.py
- backend/app/ai/base.py
- backend/app/ai/factory.py
- backend/app/ai/openai_provider.py
- backend/app/api/__init__.py
- backend/app/api/auth.py
- backend/app/api/chat.py
- backend/app/api/couple.py
- backend/app/api/deps.py
- backend/app/api/feed.py
- backend/app/api/memory.py
- backend/app/api/mood.py
- backend/app/api/response.py
- backend/app/api/user.py
- backend/app/config.py
- backend/app/core/__init__.py
- backend/app/core/constants.py
- backend/app/core/exceptions.py
- backend/app/core/handlers.py
- backend/app/core/security.py
- backend/app/database.py
- backend/app/main.py
- backend/app/models/__init__.py
- backend/app/models/couple.py
- backend/app/models/memory.py
- backend/app/models/mood.py
- backend/app/models/user.py
- backend/app/repositories/__init__.py
- backend/app/repositories/base.py
- backend/app/repositories/couple_repo.py
- backend/app/repositories/memory_repo.py
- backend/app/repositories/mood_repo.py
- backend/app/repositories/user_repo.py
- backend/app/schemas/__init__.py
- backend/app/schemas/auth.py
- backend/app/schemas/common.py
- backend/app/schemas/couple.py
- backend/app/schemas/memory.py
- backend/app/schemas/mood.py
- backend/app/schemas/user.py
- backend/app/services/__init__.py
- backend/app/services/auth_service.py
- backend/app/services/couple_service.py
- backend/app/services/feed_service.py
- backend/app/services/memory_service.py
- backend/app/services/mood_service.py
- backend/app/services/user_service.py
- backend/app/utils/__init__.py
- backend/app/utils/ids.py
- backend/app/utils/time.py
- backend/docs/README.md
- backend/docs/ai.md
- backend/docs/api-reference.md
- backend/docs/api.md
- backend/docs/database.md
- backend/docs/deployment.md
- backend/pytest.ini
- backend/requirements.txt
- backend/run.py
- backend/schema.sql
- backend/scratch/test_ai_apis.py
- backend/scratch/test_ambient_ai.py
- backend/scratch/test_ambient_ai_v2.py
- backend/scratch/test_ambient_ai_v3.py
- backend/scratch/test_new_apis.py
- backend/tests/__init__.py
- backend/tests/conftest.py
- backend/tests/test_auth.py
- backend/tests/test_couple.py
- backend/tests/test_memory.py
- flamee-mobile/.gitignore
- flamee-mobile/.npmrc
- flamee-mobile/README.md
- flamee-mobile/app.json
- flamee-mobile/app/(auth)/_layout.tsx
- flamee-mobile/app/(auth)/index.tsx
- flamee-mobile/app/(invite)/_layout.tsx
- flamee-mobile/app/(invite)/index.tsx
- flamee-mobile/app/(main)/_layout.tsx
- flamee-mobile/app/(main)/index.tsx
- flamee-mobile/app/(main)/moments.tsx
- flamee-mobile/app/(main)/profile.tsx
- flamee-mobile/app/(onboarding)/_layout.tsx
- flamee-mobile/app/(onboarding)/index.tsx
- flamee-mobile/app/(waiting)/_layout.tsx
- flamee-mobile/app/(waiting)/index.tsx
- flamee-mobile/app/_layout.tsx
- flamee-mobile/app/entryRoute.ts
- flamee-mobile/app/index.tsx
- flamee-mobile/app/moment/[momentId].tsx
- flamee-mobile/app/nudge/[nudgeId].tsx
- flamee-mobile/app/nudge/support-unavailable.tsx
- flamee-mobile/app/providers/QueryProvider.tsx
- flamee-mobile/app/providers/SessionInitializer.tsx
- flamee-mobile/app/providers/StartupProvider.tsx
- flamee-mobile/app/providers/TamaguiProvider.tsx
- flamee-mobile/app/providers/sessionStore.ts
- flamee-mobile/app/providers/startupLifecycle.ts
- flamee-mobile/app/settings/index.tsx
- flamee-mobile/babel.config.js
- flamee-mobile/expo-env.d.ts
- flamee-mobile/metro.config.js
- flamee-mobile/package.json
- flamee-mobile/src/features/account-lifecycle/components/DoubleConfirmDialog.tsx
- flamee-mobile/src/features/account-lifecycle/confirmationFlow.ts
- flamee-mobile/src/features/account-lifecycle/index.ts
- flamee-mobile/src/features/account-lifecycle/localAccountLifecycleService.ts
- flamee-mobile/src/features/account-lifecycle/pages/AccountLifecycleScreen.tsx
- flamee-mobile/src/features/account-lifecycle/schemas.ts
- flamee-mobile/src/features/auth/index.ts
- flamee-mobile/src/features/auth/localAuthService.ts
- flamee-mobile/src/features/auth/pages/AuthScreen.tsx
- flamee-mobile/src/features/auth/schemas.ts
- flamee-mobile/src/features/checkins/components/CheckInComposer.tsx
- flamee-mobile/src/features/checkins/components/MoodSelector.tsx
- flamee-mobile/src/features/checkins/components/ShareScopePicker.tsx
- flamee-mobile/src/features/checkins/index.ts
- flamee-mobile/src/features/checkins/localCheckInService.ts
- flamee-mobile/src/features/checkins/schemas.ts
- flamee-mobile/src/features/checkins/types.ts
- flamee-mobile/src/features/couple/components/PairedSuccess.tsx
- flamee-mobile/src/features/couple/index.ts
- flamee-mobile/src/features/couple/localCoupleService.ts
- flamee-mobile/src/features/couple/pages/WaitingScreen.tsx
- flamee-mobile/src/features/home/index.ts
- flamee-mobile/src/features/home/pages/HomeScreen.tsx
- flamee-mobile/src/features/invites/components/InviteCodeCard.tsx
- flamee-mobile/src/features/invites/components/InviteGiftComposer.tsx
- flamee-mobile/src/features/invites/index.ts
- flamee-mobile/src/features/invites/localInviteService.ts
- flamee-mobile/src/features/invites/pages/InviteScreen.tsx
- flamee-mobile/src/features/invites/schemas.ts
- flamee-mobile/src/features/invites/types.ts
- flamee-mobile/src/features/media/index.ts
- flamee-mobile/src/features/media/localMediaAdapter.ts
- flamee-mobile/src/features/moments/components/MomentCard.tsx
- flamee-mobile/src/features/moments/components/MomentComposerSheet.tsx
- flamee-mobile/src/features/moments/components/VoiceDraftControl.tsx
- flamee-mobile/src/features/moments/index.ts
- flamee-mobile/src/features/moments/localMomentService.ts
- flamee-mobile/src/features/moments/pages/MomentDetailScreen.tsx
- flamee-mobile/src/features/moments/pages/MomentsScreen.tsx
- flamee-mobile/src/features/moments/schemas.ts
- flamee-mobile/src/features/moments/types.ts
- flamee-mobile/src/features/notifications/index.ts
- flamee-mobile/src/features/notifications/localNotificationAdapter.ts
- flamee-mobile/src/features/notifications/types.ts
- flamee-mobile/src/features/nudges/components/NudgeCard.tsx
- flamee-mobile/src/features/nudges/components/NudgeFeedbackSheet.tsx
- flamee-mobile/src/features/nudges/index.ts
- flamee-mobile/src/features/nudges/localNudgeService.ts
- flamee-mobile/src/features/nudges/pages/NudgeScreen.tsx
- flamee-mobile/src/features/nudges/schemas.ts
- flamee-mobile/src/features/nudges/types.ts
- flamee-mobile/src/features/onboarding/index.ts
- flamee-mobile/src/features/onboarding/localOnboardingService.ts
- flamee-mobile/src/features/onboarding/pages/OnboardingScreen.tsx
- flamee-mobile/src/features/onboarding/schemas.ts
- flamee-mobile/src/features/partner-status/components/PartnerStatusCard.tsx
- flamee-mobile/src/features/partner-status/index.ts
- flamee-mobile/src/features/partner-status/selectPartnerStatus.ts
- flamee-mobile/src/features/partner-status/types.ts
- flamee-mobile/src/features/profile-settings/index.ts
- flamee-mobile/src/features/profile-settings/localSettingsService.ts
- flamee-mobile/src/features/profile-settings/pages/NotificationSettingsScreen.tsx
- flamee-mobile/src/features/profile-settings/pages/PrivacyScreen.tsx
- flamee-mobile/src/features/profile-settings/pages/ProfileScreen.tsx
- flamee-mobile/src/features/profile-settings/pages/SettingsScreen.tsx
- flamee-mobile/src/features/profile-settings/schemas.ts
- flamee-mobile/src/features/startup/components/StartupArtwork.tsx
- flamee-mobile/src/features/startup/components/StartupSplash.tsx
- flamee-mobile/src/features/startup/index.ts
- flamee-mobile/src/lib/api/apiClient.ts
- flamee-mobile/src/lib/api/apiError.ts
- flamee-mobile/src/shared/components/AmbientBackground.tsx
- flamee-mobile/src/shared/components/AppButton.tsx
- flamee-mobile/src/shared/components/AppField.tsx
- flamee-mobile/src/shared/components/AppHeader.tsx
- flamee-mobile/src/shared/components/AppScreen.tsx
- flamee-mobile/src/shared/components/AsyncStateView.tsx
- flamee-mobile/src/shared/components/ChoiceChip.tsx
- flamee-mobile/src/shared/components/FoundationScreen.tsx
- flamee-mobile/src/shared/components/SectionCard.tsx
- flamee-mobile/src/shared/components/StatusBanner.tsx
- flamee-mobile/src/shared/components/asyncStateCopy.ts
- flamee-mobile/src/shared/components/index.ts
- flamee-mobile/src/shared/constants/tokens.ts
- flamee-mobile/src/shared/datetime/localDate.ts
- flamee-mobile/src/shared/localization/messages.ts
- flamee-mobile/src/shared/native/credentials.ts
- flamee-mobile/src/shared/native/encryptedDatabase.ts
- flamee-mobile/src/shared/native/privacy.ts
- flamee-mobile/src/shared/navigation/notificationIntent.ts
- flamee-mobile/tamagui.config.ts
- flamee-mobile/tsconfig.json

## 9. Sửa vòng import lúc khởi động Expo Go

Ngày cập nhật: 2026-10-11. Metro báo chu trình `couple/index.ts → WaitingScreen → invites/index.ts → InviteScreen → couple/index.ts`. Barrel `couple/index.ts` đồng thời export service và screen; khi `InviteScreen` nạp service couple, module quay lại barrel đang khởi tạo. Đã bỏ screen khỏi barrel domain `src/features/couple/index.ts`, chuyển screen exports sang `src/features/couple/screens.ts`, và cập nhật route `app/(waiting)/index.tsx` để lấy screen từ barrel route riêng. Quy tắc public boundary và README đã ghi nhận entrypoint này. Metro dựng bundle iOS thành công (HTTP 200, 19,031,384 bytes); xác nhận Android đang chạy. Chưa thử mở app trên thiết bị Expo Go.

## 10. Compatibility web và giảm chờ khởi động

Ngày cập nhật: 2026-10-11. Đã đọc lại source hiện tại và implementation cài ở máy (React DOM 19.2.3 development, Tamagui 2.7.7 core/Input/optimized native view, react-native-svg 15.15.4 web prepare). Renderer development độc lập tái hiện cảnh báo boolean accessible trên SVG và unknown maskType/accessibilityRole/accessibilityLabel trên DOM. Chuyển props Tamagui sang role/ARIA, giữ native mappings; SVG fallback không truyền maskType trên web. Artwork.web có sẵn được giữ, sửa wordmark clipping và glow boxShadow.

- 29 file icon import chuyển từ barrel 1760 module sang 56 public icon entrypoint thực dùng; tất cả 56 entrypoint resolve được. Không đổi dependency hoặc cấu hình Metro.
- Auth screen export chuyển sang auth/screens.ts; auth/index.ts chỉ còn service/schema, tránh SessionInitializer kéo UI qua service barrel.
- Readiness cho navigation không đợi hết animation; dismissal vẫn yêu cầu animation hoàn tất và destination route sẵn sàng. Playback brand 1600 ms + exit 640 ms; login stagger giữ nguyên. Timeout theo dõi đến canDismiss, tránh mất deadline khi canNavigate sẵn sàng sớm.
- TypeScript compiler API với tsconfig hiện tại: 124 file, 0 diagnostic. Render development của các primitive với props đã sửa: 0 cảnh báo DOM, markup có role/ARIA/inputMode đúng. Không thêm/chạy test suite.
- Metro /status trả running, web bundle request timeout sau 20 giây. Browser tool không có app/browser surface. Chưa đo được cold bundle, thời gian mở app hoặc frame rate sau sửa; không tuyên bố mức tăng tốc runtime.

Xem [LOGIN-SPLASH-TRANSITION.md](LOGIN-SPLASH-TRANSITION.md) để biết timing và giới hạn kiểm tra. Hướng tối ưu import đối chiếu [Expo performance guidance](https://expo.dev/blog/best-practices-for-reducing-lag-in-expo-apps); các số lượng module trên là kiểm tra source tại máy.

## 11. Login theo ảnh tham chiếu

Ngày cập nhật: 2026-10-11. AuthScreen hiện là hero dùng src/public/login-bg.png và form bo góc với email/password, đăng ký, Remember me, quên mật khẩu, CTA và một nút Google. Dùng màu Flamee và chữ G gradient chính thức từ Google, lưu local src/public/google-g.png; không dùng icon Chrome. Có validation, checkbox và hiện/ẩn mật khẩu; mỗi nhóm form reveal riêng. Local phone service giữ nguyên nhưng không được gọi từ UI mới. Email login/register/recovery/Google chưa được tích hợp và trả unavailable; không giả phiên đã xác minh. TypeScript compiler API: 124 file, 0 diagnostic. Chưa kiểm tra trực quan runtime; không thêm/chạy test suite.

## 12. Form auth gọn và thêm register

Ngày cập nhật: 2026-10-11. Bỏ flexGrow của panel login để nền form không kéo dài xuống vùng trống; ảnh login-bg.png trải cả vùng nội dung. Thu input/nút xuống 48 px, form bên trong tối đa 380 px, giảm padding/gap và tăng phần hero nhìn thấy. Nút Đăng ký mở RegisterForm gồm họ tên/email/password/confirm password, validation qua registerSchema, toggle mật khẩu, Google và quay lại login. Submit register hiện unavailable do chưa tích hợp auth backend. Đã chạy npm run typecheck exit 0; không chạy test suite. Không có browser surface để xác nhận trực quan.

## 13. Panel sát đáy, hero theo ảnh tham chiếu, fade lần đầu

Ngày cập nhật: 2026-10-11. Auth bỏ wrapper AppScreen để tránh safe area tạo dải màu rời; ScrollView content flexGrow, hero nhận phần trống, form flush bottom không margin ngang/dưới. Background cover trong hero (không theo toàn viewport), góc trái trên dùng asset flamee-logo-slogan-tachnen.png. LoginEntrance chỉ opacity, duration/delay tùy chỉnh, tổng tối đa 640 ms, chỉ chạy lần đầu reveal trong process; Register/quay lại login/re-render hiển thị ngay. Web font fallback chuyển từ System sang system font stack vì browser trước đó hiển thị serif.

Đã chạy npm run typecheck exit 0. Dev server /status 33 ms, HTML 31 ms, đúng web bundle URL HTTP 200 / 734 ms / 11,126,431 ký tự; phép đo warm trong phiên, không phải cold-start/native benchmark. Chưa xem trực quan runtime vì không có browser surface. Không thêm/chạy test suite hoặc thay auth backend.

## 14. Crop hero, nền splash hoàng hôn và căn nút auth

Ngày cập nhật: 2026-10-11. Crop cover giữa của hero chưa giữ được vị trí nhà/mặt trăng trong ảnh tham chiếu. AuthHeroBackground nay đo vùng hero, giữ tỷ lệ ảnh gốc, chiều rộng ít nhất 2 lần vùng, neo ngang 34% phần dư và neo trên; logo có lề ngang 16 px, lề trên safe area + 8 px. Nút Đăng ký unstyled thiếu căn giữa nội dung, đã thêm row/alignItems/justifyContent center và paddingVertical 0; nút quay lại login dùng cùng quy tắc.

StartupBackground riêng thay AmbientBackground trong cả artwork native/web: SVG gradient tĩnh #FFD5AD → #FFC7A1 → #FFB6A4. app.json đồng bộ màu native splash; config native cần rebuild binary. Không đổi background chung/timing/gate/giới hạn hiệu ứng lần đầu. npm run typecheck exit 0; không chạy test suite. Đã xem asset và ảnh tham chiếu, chưa xác nhận trực quan toàn màn/native vì công cụ không có browser/app surface.

## 15. Tăng độ đậm nền splash, giảm sắc hồng

Ngày cập nhật: 2026-10-11. Theo phản hồi người dùng, startupTokens chuyển sang hổ phách #F2B66D → cam ấm #E9A065 → cam đất #D98A5B; app.json đồng bộ màu native splash #F2B66D. Palette lịch sử này thay thế palette nhạt ở mục 14, sau đó được thay bằng nền giấy ở mục 16. Đã chạy npm run typecheck exit 0. Không chạy test suite; chưa xác nhận trực quan runtime hoặc native binary.

## 16. Trở lại nền giấy kem nhạt cho splash

Ngày cập nhật: 2026-10-11. Theo quyết định mới nhất của người dùng, startupTokens.background lấy appBackground #FFF4EC; StartupBackground dùng View nền phẳng, bỏ SVG gradient và hai token màu gradient không còn dùng để làm nổi bật logo. app.json đồng bộ màu native splash sáng/tối #FFF4EC. Không đổi logo hoặc timing. Lần typecheck đầu phát hiện RN hiện tại không có StyleSheet.absoluteFillObject; đã dùng StyleSheet.absoluteFill và chạy lại npm run typecheck exit 0. Không chạy test suite; chưa xác nhận trực quan runtime/native binary.

## 17. Mock login trực tiếp tạm thời cho development

Ngày cập nhật: 2026-10-11. Người dùng yêu cầu mock login để phát triển các màn tiếp. Auth feature có mockLoginMode guard __DEV__ và EXPO_PUBLIC_MOCK_LOGIN !== false; UI và localAuthService.continueWithMockSession đều kiểm tra guard. Nút Đăng nhập bypass email/password khi mock bật, reset form, mở phiên memory, cập nhật metadata sessionStore và quay về entry resolver. Account mock tạo khi bấm, không verified/token hoặc seeded consent/profile/pair/media; sign-out giữ ID trong process, delete/cold restart bỏ ID. Development có copy vi/en thông báo mock; release luôn tắt. Không sửa backend/global domain reducer. Đã chạy npm run typecheck exit 0; không thêm/chạy test suite, chưa xác nhận flow trên runtime thiết bị/browser.

## 18. Flow onboarding/ghép đôi mới — chưa triển khai

Ngày ghi nhận: 2026-10-11. [ONBOARDING-PAIRING-FLOW.md](ONBOARDING-PAIRING-FLOW.md) ghi yêu cầu mới: login → hồ sơ nhanh → hỏi nửa kia → yêu xa/ở gần → tạo/nhập lời mời; mọi bước có thể để sau để vào Home. Sender được rời màn chờ mà lời mời vẫn còn hiệu lực; recipient giữ ý định lời mời qua register/login rồi xác nhận chủ động. Lời nhắn có thể kèm quà mascot/ảnh; paired hiển thị popup một lần với lời chúc đối phương nếu có. Home chưa paired có lời nhắc nhẹ, tắt theo phiên hoặc tạm ẩn; thời gian tạm ẩn còn chờ lựa chọn.

Source hiện vẫn khác yêu cầu: entryRoute bắt onboarding complete rồi đưa none/ended sang invite, waiting sang waiting; Home cần partner/couple; onboarding chưa có metadata để sau; invite intent tại entry là false; gift union chưa có mascot hoặc lời chúc trả lại; chưa có banner tắt nhắc theo phiên. Các khác biệt này cần sửa trong bước triển khai, không hợp thức hóa bằng spec cũ. Lỗi mock login chớp giao diện người dùng đã báo vẫn chưa được khắc phục. Lần này chỉ cập nhật tài liệu, đọc source; không sửa app, chạy typecheck/test hoặc kiểm tra thiết bị.

## 19. Triển khai flow tùy chọn sau khi người dùng đồng ý

Ngày: 2026-10-11. Mục này cập nhật hiện trạng và thay các mô tả chưa triển khai ở mục 18.

- AuthScreen dùng destination có group rõ ràng từ resolver thay URL `/` chung. Onboarding snapshot bổ sung setupStatus/setupStep độc lập consent/legacy step. Entry chọn quick setup khi pending, Home sau completed/deferred nếu không nhận lời mời; không ép none/waiting vào invite/waiting.
- OnboardingScreen: hồ sơ nhanh + checkbox consent trước lưu → hỏi nửa kia → yêu xa/ở gần → tạo/nhập; mọi bước có thể về Home. Care ở settings. CheckInComposer/SettingsScreen hỏi consent khi còn thiếu; check-in/care service cũng kiểm tra consent.
- Invite domain và onboarding domain tách screen exports sang screens.ts. app/connect/[code].tsx có default component, chỉ compose InviteLinkScreen. Mã từ URL bên ngoài được kiểm tra và giữ trong invite feature memory, không truyền qua các internal route params; không tự accept hoặc giữ qua cold restart/cài đặt mới.
- LocalInvite.message độc lập gift; thêm mascot vector Flamee với trái tim/cái ôm/bông hoa và reply greeting tùy chọn. Accept tạo notice cho mỗi account. Receiver về Home, sender có thể rời waiting mà không thu hồi. Home nhận notice qua focus/foreground/local event; popup có scroll, không thêm animation; acknowledge không phát lại popup đã xem trong process. Text/media phù hợp giữ delivery vào Moment; mascot không thành media giả.
- Home render được none/waiting/paired, giữ check-in cá nhân và các tab; partner UI chỉ render khi có dữ liệu. Reminder snooze 24 giờ, mute theo sessionId đến sign-out; dữ liệu reminder thuộc couple service memory. Unpair về Home. Xóa account dọn reminder preference.
- Review source độc lập phát hiện waiting hết hạn chặn accept mã khác và incoming link quay lại partner/relation setup. Đã sửa normalize expiry, giữ thông tin hết hạn cho Waiting qua getLatestInvite, ưu tiên nhánh nhận trong setup. Membership accept không có await giữa kiểm tra và ghi hai account để giữ tính nguyên tử trong process.
- npm run typecheck lần đầu báo sai biến chủ notice; đã sửa và các lần sau, gồm lần cuối, exit 0. Không thêm/chạy test suite. CUA apps/browsers đều rỗng; chưa xác nhận layout/navigation/media/performance trên runtime. Không đổi timing login/splash, dependency, backend hoặc dữ liệu cloud.
- Mock vẫn tái sử dụng một account trong process, không tự nhận mã mình; auth thật, account creation, pairing cross-device/upload/push/deferred installation vẫn chưa tích hợp. Không coi thay route tĩnh/typecheck là bằng chứng thiết bị đã hết chớp nháy.

Kế hoạch và ghi nhận review: [plans/2026-10-11-onboarding-pairing.md](plans/2026-10-11-onboarding-pairing.md).
