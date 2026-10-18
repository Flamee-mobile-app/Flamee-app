# Backend Media Implementation Plan

**Goal:** Cung cấp pipeline ảnh thật, private và dùng chung cho avatar cùng kỷ niệm.

**Architecture:** API → media service → repository/Supabase. Image processor thuần không biết Storage; storage gateway không biết nghiệp vụ; avatar và memory service sở hữu authorization cùng compensation.

**Tech Stack:** FastAPI, Pillow, Supabase Storage/PostgREST, pytest.

**Spec:** `.doc/BACKEND-MEDIA-PIPELINE.md`

## Global constraints

- Không Git, không chạy migration, không ghi Supabase thật, không gọi AI hoặc đụng process người dùng.
- Test viết trước và phải fail đúng lý do trước khi production code được thêm.
- Không giữ public URL hoặc tin filename/MIME từ client.

## Tasks

1. Image processor: bounded read, decode, pixel guard, EXIF transpose, JPEG original/thumbnail/avatar và test bytes thật.
2. Private storage gateway và schema/model migration: upload/remove/sign normalization, path fields và FakeSupabase quan sát được.
3. Memory pipeline: authorization, upload compensation, signed responses, batch image lookup và storage cleanup.
4. Avatar pipeline: multipart upload/delete, text profile không nhận URL tùy ý, signed responses.
5. Documentation and verification: backend suite, dependency check, mobile regression typecheck/tests; không claim device/Supabase QA.

## Review focus

- File giả ảnh nhưng khai MIME ảnh phải bị từ chối.
- Ảnh quá byte/pixel phải bị chặn trước khi gây tải không giới hạn.
- Upload object thứ hai hoặc ghi DB thất bại phải dọn object đã tạo.
- User/couple khác không được đọc, sửa hay xóa asset.
- Signed URL hết hạn không được lưu vào database.
