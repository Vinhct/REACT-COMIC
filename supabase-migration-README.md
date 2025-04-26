# Chuyển đổi từ Firebase sang Supabase

Dự án này được cập nhật để sử dụng Supabase thay vì Firebase làm backend. Dưới đây là các thông tin quan trọng về quá trình chuyển đổi.

## Tổng quan

Chúng tôi đã chuyển từ Firebase sang Supabase vì những lý do sau:

- Chi phí hợp lý hơn với quy mô lớn
- Backend PostgreSQL mạnh mẽ với khả năng truy vấn linh hoạt
- API realtime tương tự Firebase nhưng dễ tùy chỉnh hơn
- Giải pháp mã nguồn mở với khả năng tự host

## Cấu trúc thư mục mới

Các tệp mới và được cập nhật:

- `src/supabaseClient.js`: Cấu hình kết nối Supabase
- `src/Components/Include/Authentication/SupabaseAuth.js`: Custom hook xác thực
- `src/Components/Include/Authentication/SupabaseAuthContext.js`: Context provider
- `src/Components/Include/Authentication/SupabaseLogin.js`: Component đăng nhập mới
- `src/Components/Include/Authentication/SupabaseRegister.js`: Component đăng ký mới
- `src/Components/DetailPage/hooks/useSupabaseFavorites.js`: Hook quản lý yêu thích
- `src/Components/DetailPage/hooks/useSupabaseHistory.js`: Hook quản lý lịch sử
- `src/Components/DetailPage/hooks/useSupabaseComments.js`: Hook quản lý bình luận
- `src/Components/SupabaseFavoritesPage.js`: Trang yêu thích mới
- `src/Components/SupabaseHistoryPage.js`: Trang lịch sử mới
- `supabase_migration.sql`: SQL thiết lập cơ sở dữ liệu Supabase
- `migration-guide.md`: Hướng dẫn di chuyển dữ liệu

## Cách thiết lập

1. Đăng ký tài khoản Supabase tại [supabase.com](https://supabase.com)
2. Tạo dự án mới
3. Chạy script trong tệp `supabase_migration.sql` để thiết lập cấu trúc cơ sở dữ liệu
4. Sao chép URL và Anon Key của dự án từ Project Settings > API
5. Cập nhật thông tin trong `src/supabaseClient.js`

```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

## Thay đổi chính

### Xác thực (Authentication)

- Thay thế Firebase Auth bằng Supabase Auth
- Hỗ trợ đăng nhập bằng email/password
- Lưu thông tin profile người dùng trong metadata Supabase

### Cơ sở dữ liệu (Database)

- Chuyển từ Firebase Firestore (NoSQL) sang Supabase PostgreSQL (SQL)
- Sử dụng Row Level Security (RLS) để bảo vệ dữ liệu
- Thiết lập realtime listeners qua WebSockets của Supabase

### Cấu trúc dữ liệu

- **favorites**: Lưu trữ truyện yêu thích của người dùng
- **history**: Lưu trữ lịch sử đọc truyện
- **comments**: Lưu trữ bình luận và đánh giá

## Di chuyển dữ liệu

Nếu bạn cần di chuyển dữ liệu từ Firebase sang Supabase, hãy tham khảo tệp `migration-guide.md`. Tệp này cung cấp hướng dẫn chi tiết về cách xuất dữ liệu từ Firebase và nhập vào Supabase.

## Tham khảo API

- [Tài liệu Supabase Auth](https://supabase.com/docs/reference/javascript/auth-signup)
- [Tài liệu Supabase Database](https://supabase.com/docs/reference/javascript/select)
- [Tài liệu Supabase Realtime](https://supabase.com/docs/reference/javascript/subscribe) 