# Backend EC2 — 10/11/2026

Đã push backend/deploy lên nhánh `cloud-implement`, SSH clone/pull repository public và khởi động thật trên EC2 theo yêu cầu người dùng. Các thay đổi frontend còn trong workspace, không nằm trong commit deploy backend.

- Commit backend đầu: `6b7c475`; sửa CI startup độc lập `.env` và healthcheck worker: `bf41fc3`.
- EC2: `32.236.230.247`, Amazon Linux 2023 x86_64. Docker25.0.18, Compose2.40.3, Git2.50.1.
- Source: `/home/ec2-user/flamee/source`, nhánh `cloud-implement`.
- Env: `/home/ec2-user/flamee/backend.env`, quyền600, dùng Supabase development hiện có. Không commit env/PEM/token.
- API: [health](http://32.236.230.247:8000/health), [Swagger](http://32.236.230.247:8000/docs).
- API và maintenance container đều `healthy`. Worker xử lý kỳ gần nhất không có failed items. `pip check` đạt và preflight `ready:true`, không thiếu schema/RPC, bucket private.
- Kiểm từ bên ngoài: health/docs/OpenAPI200, thiếu bearer401, localhost CORS đúng origin.
- [17 kiểm tra live qua EC2](ec2-5030ef7fb0/report.json) đạt: ba tài khoản test, login/profile, ghép đôi, isolation, bốn Mission thật, chặn hoàn thành hộ, completion retry chỉ một credit, wallet10 và ledger một dòng. Không gọi AI trả phí, không chạy DDL hoặc tạo quà/tồn kho giả. Dữ liệu account/cặp kiểm thử được giữ trên development.
- Frontend local `.env.local` đã đổi URL API sang `http://32.236.230.247:8000/api/v1`; cần restart Expo để nhận env.

## CI/CD

Workflow `backend-simple.yml` hỗ trợ `main` và `cloud-implement`. Đã cấu hình ba Actions Secrets mã hóa `BACKEND_HOST`, `BACKEND_SSH_KEY`, `BACKEND_KNOWN_HOSTS`; host key kiểm khớp fingerprint người dùng đã xác nhận khi SSH. `BACKEND_DEPLOY_ENABLED=true`.

[CI run, attempt2](https://github.com/Flamee-mobile-app/Flamee-app/actions/runs/42771129208/attempts/2) **thành công toàn bộ**, gồm test, build, smoke, kiểm deploy script, nén image và deploy qua SSH. Sau deploy tự động đã xác minh API và maintenance container đều `healthy`, preflight đạt và archive truyền image được dọn. Attempt1 package/deploy bị skip vì job bắt đầu trước khi bật variable; attempt2 đã nghiệm thu hai bước này thật.

Backend CI: **231 passed, 8 deselected, 50 warnings**, 90.62s, có PostgreSQL transaction tests thật. Tám bài live không chạy trong CI; 17 kiểm tra qua EC2/development được ghi riêng bên trên. Cuối lượt kiểm lại public health/docs/OpenAPI200 và thiếu bearer401 trên image do CI triển khai.

Deploy tự động dùng image đã test từ runner; thao tác clone/pull/build ban đầu đã thực hiện trực tiếp qua SSH theo yêu cầu. Không cần GitHub token trên EC2. Luồng dùng HTTP phục vụ nghiệm thu; native/Google/các task Spec Kit còn thiếu không được xem là hoàn tất nhờ deploy này.
