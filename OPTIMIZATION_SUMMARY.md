# Tối Ưu Hóa Code Splitting cho Production (V2 - Cân Bằng Performance)

## Vấn đề ban đầu
- File `app.js` quá lớn, load chậm
- Tất cả code được bundle vào một file duy nhất
- Không có code splitting trong production

## Vấn đề sau khi chia nhỏ
- Quá nhiều HTTP requests làm chậm load time
- Cần cân bằng giữa kích thước file và số lượng requests

## Các tối ưu hóa đã thực hiện (V2)

### 1. Webpack Code Splitting Configuration (Tối Ưu)
- **Gộp các thư viện liên quan:**
  - `react-redux` - React + Redux ecosystem (gộp lại)
  - `charts` - Chart libraries (chỉ load khi cần - async)
  - `utilities` - FontAwesome + Lodash (gộp lại)
  - `edx-platform` - EdX platform libraries (gộp tất cả)
  - `vendors` - Other vendor libraries (gộp tất cả còn lại)

### 2. Tối ưu hóa Bundle Size (Cân Bằng)
- **maxSize**: 500KB per chunk (tăng từ 244KB)
- **minSize**: 50KB per chunk (tăng từ 20KB)
- **maxInitialRequests**: 8 chunks ban đầu (giảm từ 30)
- **maxAsyncRequests**: 15 chunks async (giảm từ 30)

### 3. Preloading Strategy (Tối Ưu)
- **Chỉ preload 1 component quan trọng nhất** ngay lập tức
- **Sử dụng requestIdleCallback** để preload components khác
- **Giảm tải ban đầu** để trang load nhanh hơn

### 4. Production Optimizations
- **Tree shaking**: Loại bỏ code không sử dụng
- **Minification**: Nén code và loại bỏ console.log
- **Content hashing**: Cache busting với hash ngắn hơn (6 ký tự)
- **Module concatenation**: Gộp modules nhỏ
- **Performance hints**: Cảnh báo khi bundle quá lớn

## Kết quả mong đợi (V2)

### Trước tối ưu hóa:
- 1 file `app.js` lớn (có thể > 1MB)
- Load time chậm
- Cache không hiệu quả

### Sau tối ưu hóa V1 (có vấn đề):
- Quá nhiều chunks nhỏ
- Nhiều HTTP requests
- Load time chậm hơn

### Sau tối ưu hóa V2 (cân bằng):
- **5-8 chunks chính** (thay vì 30+ chunks)
- **Kích thước hợp lý** (50KB-500KB mỗi chunk)
- **Ít HTTP requests** hơn
- **Load time nhanh hơn** so với V1
- **Cache hiệu quả** hơn

## Cách test
```bash
npm run build
```

Kiểm tra thư mục `dist/` để xem các chunks được tạo:
- `runtime.[hash].js` - Runtime code
- `react-redux.[hash].js` - React + Redux libraries (gộp)
- `utilities.[hash].js` - FontAwesome + Lodash (gộp)
- `edx-platform.[hash].js` - EdX platform libraries (gộp)
- `vendors.[hash].js` - Other vendor libraries (gộp)
- `app.[hash].js` - Main application code (nhỏ hơn nhiều)
- `charts.[hash].js` - Chart libraries (chỉ load khi cần)

## Lưu ý
- **Cân bằng tối ưu**: Không quá ít chunks (file lớn) và không quá nhiều chunks (nhiều requests)
- **Preloading thông minh**: Chỉ preload khi browser rảnh rỗi
- **Cache hiệu quả**: Các chunks được cache riêng biệt
- **Performance monitoring**: Cảnh báo khi bundle quá lớn
