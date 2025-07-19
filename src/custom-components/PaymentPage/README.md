# Payment Page Component

## Mô tả
Component trang thanh toán khóa học với hỗ trợ VNPay và MoMo.

## Tính năng
- Giao diện thanh toán hiện đại và responsive
- Hỗ trợ VNPay và MoMo
- Hiển thị thông tin khóa học
- Tổng kết thanh toán
- Loading state khi xử lý thanh toán

## Cách sử dụng

### Import component
```jsx
import PaymentPage from './src/PaymentPage';
```

### Sử dụng cơ bản
```jsx
<PaymentPage />
```

### Tích hợp với Header
Link thanh toán đã được thêm vào main menu của Header:
- URL: `/payment`
- Text: "Thanh toán khóa học"

## Cấu trúc file
```
PaymentPage/
├── src/
│   ├── PaymentPage.jsx      # Component chính
│   ├── PaymentPage.scss     # Styles
│   ├── PaymentDemo.jsx      # Component demo
│   └── index.jsx           # Export
└── README.md               # Hướng dẫn
```

## Tùy chỉnh

### Thay đổi thông tin khóa học
Chỉnh sửa state `courseData` trong `PaymentPage.jsx`:

```jsx
const [courseData, setCourseData] = useState({
  courseId: 'CS101',
  courseName: 'Introduction to Computer Science',
  price: 500000, // 500,000 VND
  instructor: 'Dr. John Smith',
  duration: '8 weeks',
  level: 'Beginner'
});
```

### Thêm phương thức thanh toán mới
Thêm option mới vào phần `payment-options`:

```jsx
<label className="payment-option">
  <input
    type="radio"
    name="paymentMethod"
    value="new-method"
    checked={paymentMethod === 'new-method'}
    onChange={(e) => setPaymentMethod(e.target.value)}
  />
  <div className="option-content">
    <img src="path/to/logo.png" alt="New Method" />
    <span>New Method</span>
  </div>
</label>
```

### Tích hợp với backend
Thay thế phần xử lý thanh toán trong `handlePayment`:

```jsx
const handlePayment = async () => {
  setIsProcessing(true);
  
  try {
    // Gọi API backend để tạo payment URL
    const response = await fetch('/api/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: courseData.price,
        courseId: courseData.courseId,
        paymentMethod: paymentMethod,
        // ... other data
      }),
    });
    
    const { paymentUrl } = await response.json();
    
    // Redirect to payment gateway
    window.location.href = paymentUrl;
    
  } catch (error) {
    console.error('Payment error:', error);
    alert('Payment failed. Please try again.');
  } finally {
    setIsProcessing(false);
  }
};
```

## Responsive Design
Component được thiết kế responsive và hoạt động tốt trên:
- Desktop (>= 769px)
- Tablet (768px)
- Mobile (< 768px)

## Dependencies
- React
- @edx/frontend-platform
- SCSS

## Notes
- Hiện tại component chỉ là demo, cần tích hợp với backend thực tế
- Cần cấu hình VNPay/MoMo credentials trong backend
- Cần xử lý callback từ payment gateway 