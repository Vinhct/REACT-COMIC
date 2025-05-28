# VietQR.io Integration - Hướng dẫn tích hợp

## 🎯 Tổng quan

Dự án đã được tích hợp với [VietQR.io](https://www.vietqr.io/) để cung cấp hệ thống thanh toán chuyên nghiệp thay thế cho MoMo link cố định. VietQR.io là Payment Kit của CTY CASSO, cung cấp API và công cụ để tích hợp thanh toán VietQR vào web/app.

## 🚀 Tính năng đã tích hợp

### ✅ Đã hoàn thành:
- **VietQR Code Generation**: Tạo mã QR cho nhiều ngân hàng
- **Multi-bank Support**: Hỗ trợ 8+ ngân hàng phổ biến
- **Deeplink Integration**: Mở app banking trực tiếp
- **Quicklink Support**: Link web để thanh toán
- **Dynamic Order ID**: Tạo mã đơn hàng động
- **Responsive UI**: Giao diện thân thiện mobile/desktop

### 🔄 Chuẩn bị cho tương lai:
- **Auto Payment Confirmation**: Tự động xác nhận thanh toán
- **Webhook Integration**: Nhận thông báo real-time từ ngân hàng
- **Payment Status Tracking**: Theo dõi trạng thái thanh toán

## 📁 Cấu trúc files đã thay đổi

### Files mới:
- `src/utils/useVietQR.js` - Hook quản lý VietQR API
- `src/Components/banner/PaymentStatus.js` - Component trạng thái thanh toán
- `supabase/migrations/20240705_vietqr_integration.sql` - Migration database

### Files đã cập nhật:
- `src/Components/banner/BuyAdPage.js` - Tích hợp VietQR thay MoMo
- `src/Components/banner/index.js` - Export components mới

## ⚙️ Cấu hình

### 1. Cập nhật thông tin ngân hàng

Mở file `src/utils/useVietQR.js` và cập nhật:

```javascript
const VIETQR_CONFIG = {
  bankId: 'vietinbank', // Thay đổi theo ngân hàng của bạn
  accountNo: '113366668888', // Thay bằng số tài khoản thật
  accountName: 'VCT%20TRUYEN', // Tên tài khoản (URL encoded)
  template: 'compact2' // compact, compact2, qr_only, print
};
```

### 2. Chạy migration database

```sql
-- Chạy file migration trong Supabase SQL Editor
-- File: supabase/migrations/20240705_vietqr_integration.sql
```

## 🎨 Giao diện mới

### Trang mua gói quảng cáo (`/buy-ad`):

1. **Chọn gói**: Grid layout hiển thị các gói có sẵn
2. **Chọn ngân hàng**: Dropdown với 8+ ngân hàng phổ biến
3. **Hiển thị QR**: VietQR code tự động tạo
4. **Buttons**:
   - 📱 "Mở App Banking" - Deeplink
   - 🌐 "Xem chi tiết thanh toán" - Quicklink
5. **Hướng dẫn**: Chi tiết các bước thanh toán

## 🔗 API Endpoints sử dụng

### VietQR.io Public APIs (Miễn phí):
- `https://img.vietqr.io/image/` - Tạo QR code
- `https://api.vietqr.io/deeplink/` - Deeplink apps
- `https://vietqr.io/quicklink/` - Web quicklink

### VietQR.io Premium APIs (Tương lai):
- `https://api.vietqr.io/v2/banks` - Danh sách ngân hàng
- `https://api.vietqr.io/v2/lookup` - Validate tài khoản
- Payment Confirmation API - Auto verify payments

## 🛠️ Sử dụng useVietQR Hook

```javascript
import useVietQR from '../utils/useVietQR';

const MyComponent = () => {
  const {
    banks,                    // Danh sách ngân hàng
    config,                   // Cấu hình VietQR
    generateVietQRUrl,        // Tạo QR URL
    generateDeeplink,         // Tạo deeplink
    generateQuicklink,        // Tạo quicklink  
    generateOrderId,          // Tạo order ID
    fetchBanks,              // Lấy banks từ API
    validateAccount          // Validate account
  } = useVietQR();

  // Tạo QR cho thanh toán
  const qrUrl = generateVietQRUrl(
    100000,                   // Số tiền
    'Mua goi quang cao AD123', // Nội dung
    'vietcombank'             // Bank ID (optional)
  );

  return <img src={qrUrl} alt="VietQR" />;
};
```

## 🔮 Roadmap tích hợp thêm

### Phase 2 - Auto Payment Confirmation:
1. **Đăng ký VietQR.io Verified Company**
2. **Tích hợp Payment Confirmation API**:
   ```javascript
   // Sẽ thêm vào useVietQR hook
   const confirmPayment = async (orderId) => {
     const response = await fetch('/api/vietqr/confirm-payment', {
       method: 'POST',
       body: JSON.stringify({ orderId })
     });
     return response.json();
   };
   ```

3. **Webhook endpoint** để nhận thông báo từ ngân hàng
4. **Real-time activation** của gói quảng cáo

### Phase 3 - Advanced Features:
- **Custom Domain**: `pay.vct-truyen.com`
- **Multiple Account Support**: Nhiều tài khoản ngân hàng
- **Analytics Dashboard**: Thống kê thanh toán
- **Refund System**: Hoàn tiền tự động

## 🚨 Lưu ý quan trọng

### Bảo mật:
- ✅ Số tài khoản có thể public (VietQR standard)
- ❌ Không bao giờ expose API keys hoặc service keys
- ✅ Sử dụng environment variables cho production

### Testing:
- Thử nghiệm với số tiền nhỏ (1,000 - 10,000 VNĐ)
- Test trên nhiều ngân hàng khác nhau
- Kiểm tra deeplink trên mobile devices

### Production:
1. Cập nhật số tài khoản thật trong `VIETQR_CONFIG`
2. Setup monitoring cho payment failures
3. Backup plan khi VietQR.io API down

## 📞 Hỗ trợ

- **VietQR.io Documentation**: [https://www.vietqr.io/](https://www.vietqr.io/)
- **API Docs**: Xem trong dashboard VietQR.io
- **Support**: Liên hệ CTY CASSO qua website

---

✨ **Kết quả**: Hệ thống thanh toán chuyên nghiệp, hỗ trợ đa ngân hàng, UX tốt hơn nhiều so với MoMo link cố định! 