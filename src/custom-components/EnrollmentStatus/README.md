# 📚 EnrollmentStatus Component

Component hiển thị trạng thái enrollment của user trên header.

## 🎯 Tính năng

- **Icon trạng thái**: Hiển thị icon trực quan trên header
- **Tooltip**: Hiển thị thông tin chi tiết khi hover
- **Click để xem chi tiết**: Mở trang enrollment status đầy đủ
- **Real-time**: Tự động cập nhật trạng thái

## 🎨 Các trạng thái

### ✅ Có Subscription (Xanh lá)
- Icon: ✅
- Màu: Xanh lá (#28a745)
- Ý nghĩa: User có active subscription và có thể truy cập tất cả khóa học

### ⚠️ Partial Enrollment (Vàng)
- Icon: ⚠️
- Màu: Vàng (#ffc107)
- Ý nghĩa: User đã đăng ký một số khóa học nhưng chưa có subscription

### ❌ No Subscription (Đỏ)
- Icon: ❌
- Màu: Đỏ (#dc3545)
- Ý nghĩa: User chưa có subscription và chưa đăng ký khóa học nào

### ⏳ Loading
- Icon: ⏳
- Màu: Xám (#6c757d)
- Ý nghĩa: Đang tải dữ liệu enrollment

## 📁 Cấu trúc file

```
EnrollmentStatus/
├── src/
│   ├── EnrollmentStatus.jsx          # Component header
│   ├── EnrollmentStatusPage.jsx      # Trang chi tiết
│   ├── EnrollmentStatusRoute.jsx     # Route component
│   ├── EnrollmentStatus.scss         # Styles
│   └── index.js                      # Exports
└── README.md                         # Hướng dẫn
```

## 🚀 Cách sử dụng

### 1. Import component

```jsx
import { EnrollmentStatus } from './custom-components/EnrollmentStatus/src';
```

### 2. Thêm vào header

```jsx
// Trong LearningHeader.jsx
import EnrollmentStatus from '../../EnrollmentStatus/src/EnrollmentStatus';

// Trong NavigationMenu
<div className="nav-links">
  {/* Các menu items khác */}
  <div className="payment-link">💳 Thanh toán</div>
  <EnrollmentStatus /> {/* Thêm component này */}
</div>
```

### 3. Thêm route (nếu cần)

```jsx
// Trong router config
import { EnrollmentStatusRoute } from './custom-components/EnrollmentStatus/src';

// Thêm route
{
  path: '/learning/enrollment-status',
  component: EnrollmentStatusRoute
}
```

## 🔧 API Endpoints

Component sử dụng các API endpoints sau:

- `GET /api/payment/enrollment/status/` - Lấy trạng thái enrollment
- `GET /api/payment/subscription/status/` - Lấy trạng thái subscription
- `GET /api/payment/subscription/details/` - Lấy chi tiết subscription

## 🎨 Customization

### Thay đổi màu sắc

```scss
.enrollment-status-header {
  .status-indicator {
    &.has-subscription {
      background: #your-color;
      border-color: #your-border-color;
      color: #your-text-color;
    }
  }
}
```

### Thay đổi kích thước

```scss
.enrollment-status-header {
  .status-indicator {
    width: 40px;  // Thay đổi kích thước
    height: 40px;
    font-size: 18px; // Thay đổi font size
  }
}
```

## 📱 Responsive

Component tự động responsive:
- Desktop: 32px x 32px
- Mobile: 28px x 28px

## 🔍 Debug

### Kiểm tra console

```javascript
// Trong browser console
console.log('EnrollmentStatus data:', enrollmentData);
```

### Kiểm tra network

- Mở DevTools > Network
- Tìm request đến `/api/payment/enrollment/status/`
- Kiểm tra response data

## 🐛 Troubleshooting

### Icon không hiển thị
- Kiểm tra CSS có được load không
- Kiểm tra font emoji có hỗ trợ không

### API error
- Kiểm tra LMS_BASE_URL config
- Kiểm tra user đã login chưa
- Kiểm tra CORS settings

### Click không hoạt động
- Kiểm tra route `/learning/enrollment-status` có được định nghĩa không
- Kiểm tra console có error không

## 📈 Performance

- Component chỉ fetch data một lần khi mount
- Sử dụng React.memo để tránh re-render không cần thiết
- CSS được optimize cho performance

## 🔒 Security

- Chỉ hiển thị cho authenticated users
- API calls sử dụng credentials: 'include'
- Không expose sensitive data trong tooltip

---

**🎉 Component này giúp user dễ dàng kiểm tra trạng thái enrollment của mình!** 