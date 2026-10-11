# Flamee — mục lục và tiêu chuẩn tài liệu

Cập nhật: 2026-10-11. Tài liệu này thiết lập phạm vi áp dụng sau khi đọc mã nguồn mobile, backend, cấu hình, schema, scripts và docs trong repository.

## Thứ tự áp dụng

1. Yêu cầu và quyết định mới nhất của người dùng.
2. [AGENTS.md](../AGENTS.md) và [CODING-STANDARDS.md](CODING-STANDARDS.md): nội quy code.
3. Spec đúng phạm vi: flow sau login/ghép đôi dùng ONBOARDING-PAIRING-FLOW (yêu cầu mới nhất, phần local đã triển khai); kiến trúc local dùng FLAMEE-LOCAL-MAINFLOW-SPEC; các nghiệp vụ khác dùng PRD và tài liệu luồng bản 1.1.
4. Tài liệu kiến trúc / giao diện / backend tương ứng module.
5. [CODEBASE-BASELINE.md](CODEBASE-BASELINE.md): bằng chứng hiện trạng, chênh lệch và danh sách file đã đọc.

Source đang có không thay thế yêu cầu sản phẩm. Khi source và spec khác nhau, ghi nhận chênh lệch và sửa trong phạm vi được giao. Không xem ví dụ thiết kế, roadmap hoặc checklist lịch sử là tính năng đã triển khai.

## Bộ tài liệu chuẩn

| Tài liệu | Phạm vi / cách dùng |
|---|---|
| [CODING-STANDARDS.md](CODING-STANDARDS.md) | Quy tắc bắt buộc cho mobile và backend |
| [CODEBASE-BASELINE.md](CODEBASE-BASELINE.md) | Bản đồ source và các sai lệch tại ngày đọc |
| [FEATURE-INVENTORY.md](FEATURE-INVENTORY.md) | Danh sách tính năng mobile/backend hiện có, trạng thái local/mô phỏng/chưa tích hợp và chênh lệch mock login |
| [ONBOARDING-PAIRING-FLOW.md](ONBOARDING-PAIRING-FLOW.md) | Flow sau login: hồ sơ và ghép đôi tùy chọn, tạo/nhận lời mời qua auth, Home chưa ghép đôi và tắt nhắc theo phiên/24 giờ; phần local đã triển khai |
| [LOGIN-SPLASH-TRANSITION.md](LOGIN-SPLASH-TRANSITION.md) | Login một màn, splash tự chuyển và timing fade/slide |
| [FLAMEE-LOCAL-MAINFLOW-SPEC.md](FLAMEE-LOCAL-MAINFLOW-SPEC.md) | Kiến trúc và hành vi mobile local hiện tại; ưu tiên trong giai đoạn local |
| [Tài liệu yêu cầu sản phẩm](<Tài liệu yêu cầu sản phẩm_ App kết nối cho cặp đôi.md>) | Yêu cầu sản phẩm 1.1; nhiều năng lực cần backend và chưa có trên local |
| [Các luồng chính](<Các luồng chính của app (bản đầu).md>) | Luồng nghiệp vụ 1.1, privacy, giới hạn và vòng đời |
| [FLAMEE-MOBILE-ARCHITECTURE.md](FLAMEE-MOBILE-ARCHITECTURE.md) | Hướng kiến trúc đầy đủ / production; không tự bật persistence, auth, realtime khi sửa local |
| [ARCHITECTURE-FE-SKILL.md](fe_skills/ARCHITECTURE-FE-SKILL.md) | Boundary frontend, native UI, API adapter, state và typography |
| [PERMISSION-RULES-SKILL.md](fe_skills/PERMISSION-RULES-SKILL.md) | Quyền thao tác Git và thay đổi phá hủy dữ liệu |
| [QUY_CHUAN_GIAO_DIEN.md](QUY_CHUAN_GIAO_DIEN.md) | Màu sắc và thang typography; sai lệch hiện tại được ghi ở baseline |
| [flameelogo.md](flameelogo.md) | Tham khảo logo / bản xuất thiết kế; không dùng CSS web này làm component native |
| [Mobile README](../flamee-mobile/README.md) | Cách chạy và khả năng mobile đang có |
| [Backend architecture](../backend/docs/README.md) | Điểm đọc backend, hướng API → service → repository → Supabase; đối chiếu app/config.py, requirements.txt và source trước khi chạy |
| [Database](../backend/docs/database.md) | Thiết kế Supabase; schema.sql là file schema trong repository, không chứng minh trạng thái DB cloud |
| [API reference](../backend/docs/api-reference.md) | Tài liệu lịch sử 2026-07-10, còn mock storage / couple_members / base64; không dùng làm contract hiện hành |
| [API specification](../backend/docs/api.md) | Thiết kế / roadmap gồm endpoint chưa triển khai; đối chiếu routers và schemas |
| [AI design](../backend/docs/ai.md) | Thiết kế smart logic; không khẳng định mọi provider, rule, cache đã có |
| [Deployment](../backend/docs/deployment.md) | Hướng dẫn lịch sử còn SQLite / SQLAlchemy / Alembic; cần cập nhật theo Supabase trước khi triển khai |

## Cập nhật tài liệu

- Ghi ngày, phạm vi và trạng thái: đang áp dụng, hiện trạng, đề xuất hoặc lịch sử.
- Mỗi mô tả triển khai phải có đường dẫn source/config/schema kiểm chứng được.
- Thay đổi contract cập nhật cả schema, adapter và ví dụ docs tương ứng; không sửa chỉ README.
- Không ghi secret, dữ liệu cảm xúc thật, token, URI media của người dùng vào docs.
- Không đánh dấu đã test/deploy/đồng bộ khi chỉ đọc source.
