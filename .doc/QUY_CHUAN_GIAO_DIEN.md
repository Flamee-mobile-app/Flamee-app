# Quy chuẩn giao diện Flamee

Tài liệu này định nghĩa màu sắc và kiểu chữ dùng chung cho **toàn bộ mobile app**. Các màn hình và component cần dùng chung bộ token giao diện, không tự đặt lại màu hoặc font riêng.

Nguồn: `img/color.png` và `img/font.png`.

## Bảng màu

| Nhóm | Token | Mã màu | Cách dùng |
| --- | --- | --- | --- |
| Brand | `primary` | `#FF7158` | Màu thương hiệu chính, CTA và điểm nhấn |
| Brand | `secondary` | `#FCB76D` | Màu thương hiệu phụ, điểm nhấn ấm |
| Brand | `gradient` | `#FCB76D → #FF7158` | Gradient thương hiệu |
| Neutral | `text-primary` | `#2B2B2B` | Nội dung và tiêu đề chính |
| Neutral | `text-secondary` | `#555555` | Nội dung phụ |
| Neutral | `background` | `#FAF9F7` | Nền sáng mặc định |
| Support | `support-peach-light` | `#FFE6CE` | Nền phụ nhẹ |
| Support | `support-peach` | `#FFC7A1` | Nền hoặc điểm nhấn phụ |
| Support | `support-lavender` | `#CDB4FF` | Điểm nhấn phụ |
| Support | `support-lavender-light` | `#DCCEF7` | Nền phụ nhẹ |
| Support | `support-coral` | `#FF9B8A` | Điểm nhấn phụ |
| Semantic | `warning` | `#F5B041` | Cảnh báo |
| Semantic | `success` | `#76E69F` | Thành công, hoàn tất |
| Semantic | `error` | `#E65C5C` | Lỗi hoặc trạng thái cần chú ý |

Giữ nguyên mã màu trong bảng khi tạo theme dùng chung. Gradient thương hiệu đi từ `secondary` sang `primary`.

## Kiểu chữ

### Tiêu đề

| Cấp | Font | Cỡ chữ |
| --- | --- | ---: |
| H1 | SF Pro Rounded Bold | 32 px |
| H2 | SF Pro Rounded Bold | 28 px |
| H3 | SF Pro Rounded Bold | 24 px |
| H4 | SF Pro Rounded Bold | 20 px |
| H5 | SF Pro Rounded Semibold | 18 px |

Ảnh ghi “SF Compact Rounded” ở nhãn nhóm tiêu đề, trong khi thang chữ ghi “SF Pro Rounded”. Dùng tên font theo thang chữ ở trên; giữ lại ghi chú này để đối chiếu tên family khi khai báo font trên nền tảng.

### Nội dung và điều khiển

| Vai trò | Font | Cỡ chữ |
| --- | --- | ---: |
| Body L | SF Pro Medium | 16 px |
| Body M | SF Pro Medium | 14 px |
| Body S | SF Pro Regular | 12 px |
| Caption | SF Pro Regular | 10 px |
| Button | SF Pro Medium | 16 px |

## Quy tắc dùng chung

- Khai báo palette và font thành một theme/token dùng chung toàn app; màn hình và component lấy giá trị từ đó.
- Dùng đúng cấp chữ theo vai trò nội dung; không tạo thêm font family hoặc cỡ chữ cục bộ nếu chưa cập nhật quy chuẩn.
- Giữ khả năng đọc nội dung và trạng thái bằng chữ/biểu tượng, không chỉ dựa vào màu sắc.
