# 👥 Online Users Tracking - Hướng dẫn tích hợp

## 🎯 Tổng quan tính năng

Hệ thống theo dõi người dùng online real-time đã được tích hợp vào Admin Dashboard, cho phép:

- **Real-time tracking** số người đang online
- **Phân loại chi tiết**: Đã đăng nhập vs Khách, Mobile vs Desktop  
- **Auto cleanup** người dùng offline (> 5 phút)
- **Dashboard visualization** với hiệu ứng đẹp mắt
- **Lịch sử thống kê** cho analytics

## 🗄️ Cài đặt Database

### 1. Chạy Migration SQL

Vào **Supabase Dashboard > SQL Editor** và chạy file:
```sql
-- File: supabase/online_users_migration.sql
-- Copy toàn bộ nội dung file và execute
```

### 2. Tạo tables và functions

Migration sẽ tạo:
- `online_users` - Tracking user sessions
- `online_stats_history` - Lịch sử thống kê  
- Functions: `update_user_online()`, `get_online_users_count()`, `cleanup_offline_users()`

## 🚀 Cách sử dụng

### 1. Auto Tracking

Tính năng đã được tích hợp vào `App.js`:
```javascript
// Tự động track khi user vào trang
useOnlineTracker(); // Đã thêm vào AppContent component
```

### 2. Admin Dashboard

Vào `/admin/dashboard` để xem:

#### **📊 Stats Card "Đang online":**
- Số tổng người online
- Breakdown: đã đăng nhập vs khách
- Hiệu ứng pulse & glow animation

#### **📈 Chi tiết Online Users:**
- Người dùng đã đăng nhập
- Khách truy cập  
- Mobile vs Desktop breakdown
- Auto refresh mỗi 30 giây

## ⚙️ Cấu hình

### 1. Thời gian timeout

Trong file `online_users_migration.sql`:
```sql
-- Thay đổi timeout (mặc định 5 phút)
DELETE FROM public.online_users 
WHERE last_seen < NOW() - INTERVAL '5 minutes'; -- Đổi thành '10 minutes' nếu muốn
```

### 2. Tần suất update

Trong `useOnlineTracker.js`:
```javascript
// Update mỗi 2 phút (có thể thay đổi)
intervalRef.current = setInterval(updateOnlineStatus, 2 * 60 * 1000);

// Dashboard refresh mỗi 30s
refetchInterval: 30000, // Trong useOnlineUsersCount
```

## 🎨 Customization

### 1. Thay đổi màu sắc

Trong `Dashboard.css`:
```css
/* Màu online indicator */
.online-pulse {
  animation: glow 3s ease-in-out infinite;
}

/* Gradient cho card online */
background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
```

### 2. Thêm thông tin tracking

Có thể mở rộng trong `useOnlineTracker.js`:
```javascript
const updateOnlineStatus = async () => {
  // Thêm thông tin khác như:
  // - Geolocation
  // - Browser info
  // - Connection speed
  // - Page engagement time
};
```

## 📊 Features đã implement

### ✅ Hoàn thành:
- [x] Real-time online tracking
- [x] Session management  
- [x] Auto cleanup offline users
- [x] Dashboard visualization
- [x] Mobile/Desktop detection
- [x] Guest vs Authenticated breakdown
- [x] Responsive design
- [x] Error handling
- [x] CSS animations

### 🔄 Có thể mở rộng:
- [ ] **Geographic tracking** (IP-based location)
- [ ] **Page engagement metrics** (time spent, scroll depth)
- [ ] **Real-time user list** (xem ai đang online)
- [ ] **Online status in chat** (hiển thị status trong comment)
- [ ] **Push notifications** khi có user mới
- [ ] **Analytics dashboard** với charts theo thời gian

## 🛠️ Troubleshooting

### 1. Không hiển thị số online

**Kiểm tra:**
```sql
-- Test function
SELECT * FROM get_online_users_count();

-- Xem raw data
SELECT * FROM online_users ORDER BY last_seen DESC;
```

### 2. Tracking không hoạt động

**Trong browser console:**
```javascript
// Kiểm tra session ID
console.log(sessionStorage.getItem('user_session_id'));

// Test manual update
// (Gọi trong component có useOnlineTracker)
```

### 3. RLS policy issues

**Nếu lỗi permission:**
```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'online_users';

-- Test admin access
SELECT auth.uid(), * FROM admin_users WHERE user_id = auth.uid();
```

## 📈 Analytics Queries

### Thống kê hữu ích:

```sql
-- Peak hours
SELECT 
  EXTRACT(HOUR FROM recorded_at) as hour,
  AVG(total_online) as avg_online
FROM online_stats_history 
GROUP BY EXTRACT(HOUR FROM recorded_at)
ORDER BY avg_online DESC;

-- Mobile vs Desktop trend
SELECT 
  DATE(recorded_at) as date,
  AVG(mobile_online) as mobile_avg,
  AVG(desktop_online) as desktop_avg
FROM online_stats_history 
GROUP BY DATE(recorded_at)
ORDER BY date DESC;

-- Current active sessions
SELECT 
  user_id,
  page_url,
  is_mobile,
  last_seen,
  NOW() - last_seen as active_duration
FROM online_users 
ORDER BY last_seen DESC;
```

## 🔒 Security & Privacy

### 1. Data Protection
- Không lưu trữ IP address thực (client-side limitation)
- Session IDs được regenerate mỗi browser session
- Auto cleanup data cũ

### 2. GDPR Compliance  
- User có thể opt-out bằng cách disable JavaScript
- Data retention tự động (5 phút timeout)
- Không track thông tin cá nhân nhạy cảm

## 🎉 Kết quả

### Dashboard trước:
```
📊 Basic stats: Comics, Users, Favorites, etc.
```

### Dashboard sau:
```
🟢 Đang online: 15 (12 đã đăng nhập, 3 khách) [PULSE EFFECT]
📊 Detailed breakdown: Mobile (8) vs Desktop (7)
📈 Real-time updates every 30s
✨ Beautiful animations & modern UI
```

---

**🎯 Tính năng này giúp admin:**
- Theo dõi traffic real-time
- Hiểu user behavior patterns  
- Monitor peak usage times
- Optimize server resources
- Enhance user experience

**🚀 Sẵn sàng production!** Hệ thống đã được optimize cho performance và scalability. 