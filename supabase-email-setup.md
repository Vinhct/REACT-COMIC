# Cấu hình Supabase để chấp nhận email Gmail và các email phổ biến

Supabase mặc định có các chính sách hạn chế email để tránh việc lạm dụng và bảo vệ dịch vụ. Tuy nhiên, bạn có thể cấu hình để cho phép các email như Gmail, Yahoo trong dự án của mình.

## Bước 1: Đăng nhập vào Supabase Dashboard

1. Truy cập [https://app.supabase.com/](https://app.supabase.com/)
2. Đăng nhập vào tài khoản Supabase của bạn
3. Chọn dự án của bạn từ danh sách dự án

## Bước 2: Truy cập Authentication Settings

1. Trong menu bên trái, chọn **Authentication**
2. Chọn tab **Providers**
3. Chọn phần **Email**

## Bước 3: Cấu hình Email Provider

1. Đảm bảo **Email Auth** đã được bật
2. Đảm bảo **Enable Email Signup** đã được bật
3. Tìm phần **Email Domains** hoặc **Domain Allowlist** 
4. Thêm các domain email phổ biến vào danh sách:
   ```
   gmail.com
   yahoo.com
   hotmail.com
   outlook.com
   icloud.com
   aol.com
   ```

5. Lưu các thay đổi

## Bước 4: Cấu hình SMTP (Nếu cần)

Để đảm bảo email xác thực được gửi đúng:

1. Chọn tab **Email Templates**
2. Kiểm tra cấu hình SMTP của bạn
3. Nếu chưa cấu hình SMTP, bạn có thể sử dụng dịch vụ SMTP miễn phí như:
   - [SendGrid](https://sendgrid.com/) (100 email/ngày miễn phí)
   - [Mailgun](https://www.mailgun.com/) (5000 email/tháng miễn phí)
   - [Amazon SES](https://aws.amazon.com/ses/) (62,000 email/tháng miễn phí với AWS Free Tier)

## Bước 5: Kiểm tra Cấu hình

1. Quay lại ứng dụng của bạn
2. Thử đăng ký với email Gmail
3. Kiểm tra xem email xác thực có được gửi không

## Giải pháp Thay thế Nếu Không Thể Cấu hình Supabase

Nếu bạn không có quyền cấu hình dự án Supabase, hãy thử các giải pháp sau:

### 1. Sử dụng Email Tạm thời

- [Temp-mail.org](https://temp-mail.org/)
- [10MinuteMail](https://10minutemail.com/)
- [Guerrilla Mail](https://www.guerrillamail.com/)

### 2. Sử dụng API Trực tiếp để Tạo Người dùng (Admin API)

Nếu bạn có quyền truy cập vào Supabase Service Role key, bạn có thể tạo tài khoản từ backend của mình với bất kỳ email nào:

```javascript
// CẢNH BÁO: Đây là code backend, KHÔNG sử dụng trong client
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_SERVICE_ROLE_KEY'
);

const createUser = async (email, password, displayName) => {
  return await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Tự động xác nhận email
    user_metadata: { display_name: displayName }
  });
};
```

### 3. Bật Xác thực bằng Phone hoặc OAuth

Một lựa chọn khác là bật các phương thức xác thực khác như:
- Xác thực số điện thoại
- Đăng nhập với Google, Facebook, GitHub 