# Deploy backend đơn giản: EC2 + GitHub Actions

Ưu tiên BE trước: một EC2 chạy API và maintenance worker, Supabase đang có giữ nguyên. Không cần tên miền, CloudFormation, ECR, OIDC, S3 hoặc Parameter Store.

```text
Push main → test BE/SQL → build Docker → gửi image bằng SSH → EC2 chạy API
```

Workflow: [backend-simple.yml](../.github/workflows/backend-simple.yml). Đã chuẩn bị/kiểm local, chưa chạy trên EC2/GitHub thật. HTTP/IP dành cho nghiệm thu bằng tài khoản test; thêm HTTPS trước khi dùng dữ liệu người dùng thật.

Workflow hỗ trợ cả `main` và nhánh triển khai hiện tại `cloud-implement`. Khi Run workflow, chọn nhánh có source cần triển khai; chỉ bật một nhánh deploy cho mỗi đợt để tránh hai bản thay nhau chạy trên cùng EC2.

## 1. Tạo EC2

AWS → EC2 → Launch instance:

| Trường | Chọn |
| --- | --- |
| Name | `flamee-backend` |
| AMI | Amazon Linux 2023, x86_64 |
| Instance | `t3.small` để bắt đầu chạy BE |
| Key pair | Create new → RSA → `.pem`, tải `flamee.pem` |
| Public IP | Enable |
| Disk | 20 GiB gp3 |

Security Group inbound mở TCP **22** và **8000**. GitHub runner có IP thay đổi; cấu hình thử nghiệm đơn giản là nguồn `0.0.0.0/0` cho22 và8000, SSH đăng nhập bằng key. Không bật password login. EC2/ổ đĩa/public IP có tính phí. Nếu đã tạo máy theo template cũ, template đó không cấu hình key pair/SSH; hướng dẫn này áp dụng máy mới tạo theo bước trên.

Lấy Public IPv4 address, gọi là `IP_EC2` ở các bước sau.

## 2. Cài Docker một lần

PowerShell trong thư mục chứa PEM:

```powershell
ssh -i .\flamee.pem ec2-user@IP_EC2
```

Thay IP thật. Trong SSH EC2:

```bash
sudo dnf install -y docker nano
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
sudo mkdir -p /usr/local/lib/docker/cli-plugins
curl -fL --retry 3 https://github.com/docker/compose/releases/download/v2.40.3/docker-compose-linux-x86_64 -o /tmp/flamee-compose
echo 'dba9d98e1ba5bfe11d88c99b9bd32fc4a0624a30fafe68eea34d61a3e42fd372  /tmp/flamee-compose' | sha256sum -c -
sudo install -m 755 /tmp/flamee-compose /usr/local/lib/docker/cli-plugins/docker-compose
mkdir -p ~/flamee
exit
```

SSH lại để nhận quyền Docker group, rồi chạy `docker ps` và `docker compose version`. Docker group có quyền cao, chỉ cấp cho tài khoản deploy của bạn. Cách cài Compose thủ công theo [Docker docs](https://docs.docker.com/compose/install/linux/).

## 3. Tạo env trên EC2

Trong SSH: `openssl rand -hex 32` để tạo secret, sau đó `nano ~/flamee/backend.env`. Dán và thay giá trị:

```dotenv
FLAMEE_DEBUG=false
FLAMEE_SECRET_KEY=THAY_BANG_CHUOI_NGAU_NHIEN_VUA_TAO
FLAMEE_SUPABASE_URL=https://PROJECT_CUA_BAN.supabase.co
FLAMEE_SUPABASE_KEY=ANON_KEY_CUA_BAN
FLAMEE_SUPABASE_SERVICE_KEY=SERVICE_ROLE_KEY_CUA_BAN
FLAMEE_CORS_ORIGINS=["http://localhost:8081","http://localhost:19006"]
FLAMEE_AI_PROVIDER=openai
FLAMEE_OPENAI_API_KEY=
FLAMEE_AI_TIMEOUT_SECONDS=6
FLAMEE_GOOGLE_OAUTH_CLIENT_ID=
```

Lưu Ctrl+O → Enter → Ctrl+X, rồi `chmod 600 ~/flamee/backend.env`. Có thể dùng Supabase development đã migration để nghiệm thu trước. AI key điền nếu muốn AI thật; Google đang hoãn. Không commit env/PEM. Giữ secret ổn định qua các lần deploy.

## 4. Ba GitHub Secrets và một Variable

Đưa source mới lên branch `main`. GitHub repo → Settings → Secrets and variables → Actions → **Secrets**:

| Secret | Giá trị |
| --- | --- |
| `BACKEND_HOST` | IP public EC2, không thêm scheme/port |
| `BACKEND_SSH_KEY` | Toàn bộ file `flamee.pem`, gồm BEGIN/END |
| `BACKEND_KNOWN_HOSTS` | Public host key, lấy theo lệnh bên dưới |

Lấy host key ngay trong phiên SSH EC2 đang kết nối:

```bash
printf 'IP_EC2 '
cat /etc/ssh/ssh_host_ed25519_key.pub
```

Thay IP thật trước khi chạy. Copy một dòng kết quả dạng `1.2.3.4 ssh-ed25519 AAAAC3... root@...` vào `BACKEND_KNOWN_HOSTS`. Host key này khác với private PEM.

Tab **Variables** thêm `BACKEND_DEPLOY_ENABLED` = `true`. SSH user cố định `ec2-user`. Để `FLAMEE_FULL_PIPELINE_ENABLED` trống/false: workflow AWS đầy đủ cũ sẽ không chạy các job FE/ECR/OIDC. Không cần thêm AWS access keys hay Supabase secrets trong GitHub.

## 5. Deploy và tương tác

GitHub → Actions → **Backend - simple EC2 deploy** → Run workflow → `main`.

CI kiểm BE/PostgreSQL riêng, build/smoke image rồi gửi SSH sang EC2. EC2 kiểm schema/bucket Supabase thật trước khi thay container; không tự chạy DDL hoặc seed dữ liệu. Compose chạy API và maintenance worker.

Sau khi job xanh, mở:

```text
http://IP_EC2:8000/health
http://IP_EC2:8000/docs
```

Trong Swagger `/docs`, dùng Try it out để register/login tài khoản test, lấy Flamee access token rồi gọi API có bearer. Không dùng Supabase service key làm bearer đăng nhập app.

## 6. Nối FE local với BE EC2

Sửa `flamee-mobile/.env.local` trên máy bạn:

```dotenv
EXPO_PUBLIC_API_URL=http://IP_EC2:8000/api/v1
```

Chạy lại Expo để đọc env mới:

```powershell
cd D:\Flamee-app\flamee-mobile
npx expo start --web --clear
```

Đăng ký/đăng nhập/ghép đôi trên web local sẽ gọi BE EC2 và Supabase thật. Nếu Expo dùng port khác8081/19006, sửa CORS origin tương ứng trong EC2 env rồi chạy lại deploy. HTTPS web không gọi HTTP BE do mixed content. Native Android có thể cần cleartext/build riêng; chưa nghiệm thu điện thoại chỉ bằng bước web này.

## 7. Cập nhật và xem lỗi

Push thay đổi BE lên `main` sẽ tự test/deploy. Sửa env cần deploy lại để container đọc giá trị mới. Migration áp dụng riêng trước deploy.

```bash
docker ps --filter label=com.docker.compose.project=flamee-backend
docker logs --tail 100 flamee-backend-api-1
docker logs --tail 100 flamee-backend-maintenance-1
```

SSH timeout: kiểm IP/inbound22 cho runner. Publickey error: kiểm PEM/key pair. Host key error: kiểm dòng known_hosts đúng IP. Preflight `ready:false`: kiểm env/migration/bucket `flamee-media` private. Health local trên EC2 chạy nhưng browser không mở được: kiểm inbound8000.

Luồng đơn giản chưa có rollback tự động. Preflight lỗi giữ API hiện hành; lỗi lúc thay container có thể cần chạy lại image cũ thủ công. Không tự prune image/release; theo dõi `df -h`/`docker system df`. Chỉ archive image tạm được xóa sau deploy thành công. IP có thể đổi khi stop/start EC2: cập nhật host/known_hosts/FE URL hoặc gắn Elastic IP khi cần ổn định.
