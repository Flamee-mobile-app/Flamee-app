# Rà soát quyết định còn thiếu — 2026-10-27

Đối chiếu spec `.doc`, kế hoạch `docs/superpowers/plans`, tài liệu backend và source hiện tại. Không dùng số liệu preview làm cấu hình nghiệp vụ thật. Không đọc hoặc đưa nội dung `.env` vào báo cáo.

## Đã tìm thấy quy định

| Chủ đề | Quy định | Nguồn |
| --- | --- | --- |
| Nhiệm vụ | 4 nhiệm vụ/ngày, gồm cá nhân và chung; từng người tự đánh dấu phần mình; được đổi nhiệm vụ | [TINY-MISSION.md](../../../.doc/TINY-MISSION.md), mục Phạm vi đã chốt |
| Điều kiện đổi nhiệm vụ | Không đổi khi đã có người đánh dấu hoàn thành | TINY-MISSION.md, mục Hiệu chỉnh theo mockup ngày 2026-10-26 |
| Điểm và quà | Điểm chung của cặp; đổi quà hiện vật trừ điểm ngay, cấp mã, có sao chép mã/link và mở fanpage | TINY-MISSION.md, mục Phạm vi đã chốt |
| Hủy kết nối | Xác nhận hai lần; thu hồi quyền xem dữ liệu chung của cả hai; xóa dữ liệu chung sau 30 ngày; trong thời gian đó mỗi người tải được dữ liệu của mình | [PRD](../../../.doc/Tài%20liệu%20yêu%20cầu%20sản%20phẩm_%20App%20kết%20nối%20cho%20cặp%20đôi.md), mục 1.12; [luồng nghiệp vụ](../../../.doc/Các%20luồng%20chính%20của%20app%20(bản%20đầu).md), luồng kết thúc kết nối |
| Xóa tài khoản | Xác nhận hai lần; xóa dữ liệu cá nhân trong tối đa 30 ngày; tự kết thúc cặp và thông báo trung tính | PRD, mục 6.6 |
| Check-in | Nhiều lần/ngày; ngày cá nhân theo múi giờ từng người. Quyết định mới giữ note 60 ký tự và nhiều lý do | PRD, mục 2; [nhật ký](../../../.doc/E2E-EXECUTION-LOG.md) |

## Chưa tìm thấy quyết định đủ để triển khai production

| Cần chốt | Điều tìm thấy và khoảng trống | Phần phụ thuộc |
| --- | --- | --- |
| Ngày chung Tiny Mission | Timezone cặp, giờ reset, đầu tuần, đổi timezone chưa chốt. Ngày cá nhân của check-in không giải quyết được ngày chung | Giao nhiệm vụ, kỳ thành tựu |
| Phân bổ/đổi nhiệm vụ | 2 cá nhân + 2 chung vẫn được spec gọi là minh họa; chưa có hạn mức đổi/ngày, tập nhiệm vụ và quy tắc chọn thay thế | Backend nhiệm vụ |
| Điểm/thành tựu | Chưa có điểm từng nhiệm vụ, các ngưỡng thưởng và quy tắc cộng thưởng thật | Ví, ledger, thành tựu |
| Danh mục quà | Có dữ liệu preview trong `flamee-mobile/src/features/tiny-mission/previewContent.ts`; chưa có danh mục/giá/tồn kho/giới hạn đổi thật | Backend đổi quà |
| Fanpage và vận hành | Spec ghi rõ chưa cung cấp link; chưa có người/quyền xác nhận mã và giao quà | Luồng nhận quà |
| Mã quà và hoàn điểm | Chưa có thời hạn mã, hủy/hoàn điểm, hết hàng, xử lý quà chưa giao khi hủy cặp/xóa tài khoản | Redemption và lifecycle |
| Retention mở rộng | Quy tắc 30 ngày đã rõ; quyền sở hữu trong bản export, thời hạn lưu ledger/mã quà và xử lý dữ liệu hai người cùng tạo chưa đủ chi tiết | Export/purge và quà |

Nguồn ghi rõ các mục chưa chốt: [kế hoạch, bảng M0 và Task 10–11](../../superpowers/plans/2026-10-26-app-e2e-completion.md), [TINY-MISSION.md](../../../.doc/TINY-MISSION.md). Không tìm thấy router/migration mission, wallet hoặc redemption trong checkout hiện tại.

## Sai lệch cần xử lý

- `backend/app/services/couple_service.py::break_up` hiện gỡ `couple_id` hai user rồi xóa couple ngay. Không thấy triển khai `purge_expired_dissolved_couples`. Mục cuối của `backend/docs/BE-AUDIT-2026-10-17.md` ghi retention đã sửa không khớp source hiện tại. Không nối nút hủy cặp vào hành vi này rồi đánh dấu đạt spec.
- `.doc/README.md`, `.doc/CODING-STANDARDS.md`, `.doc/CODEBASE-BASELINE.md` và các tài liệu Home/design-system được AGENTS dẫn tới không có trong checkout này. Quy tắc trực tiếp trong AGENTS vẫn áp dụng; chưa có đủ tài liệu để tuyên bố toàn bộ baseline đã được đối chiếu.
- Mood backend vẫn giới hạn note 140, tối đa 3 reasons và enum cũ; chưa hỗ trợ đầy đủ custom feeling/sleep/attachment của draft mobile. Cần contract/migration trước khi bật gửi đầy đủ.

## Phạm vi thực thi

Tiếp tục được các phần có contract xác định như sửa/xóa kỷ niệm. Các quyết định điểm/quà chưa có không được tự suy diễn từ preview. Không chạy migration, gọi AI trả phí hoặc ghi dịch vụ thật trong lượt rà soát này. Mọi nghiệm thu hai thiết bị vẫn cần kiểm tra riêng.
