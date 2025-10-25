# Tối Ưu Hóa Code Splitting cho Production

## Vấn đề ban đầu
- File `app.js` quá lớn, load chậm
- Tất cả code được bundle vào một file duy nhất
- Không có code splitting trong production

## Các tối ưu hóa đã thực hiện

### 1. Webpack Code Splitting Configuration
- **Chia nhỏ thư viện theo nhóm:**
  - `react` - React core libraries (react, react-dom, react-router)
  - `redux` - Redux ecosystem (@reduxjs, redux, react-redux, reselect)
  - `charts` - Chart libraries (chart.js, react-chartjs-2, recharts)
  - `fontawesome` - FontAwesome icons
  - `lodash` - Lodash utilities
  - `edx-platform` - EdX platform libraries (@edx, @openedx)
  - `vendors` - Other vendor libraries
  - `common` - Common code được sử dụng nhiều lần

### 2. Tối ưu hóa Bundle Size
- **maxSize**: 244KB per chunk (tối đa)
- **minSize**: 20KB per chunk (tối thiểu)
- **maxInitialRequests**: 30 chunks ban đầu
- **maxAsyncRequests**: 30 chunks async

### 3. Preloading Strategy (Tiered Loading)
- **Tier 1**: Critical components - preload ngay lập tức
- **Tier 2**: Important components - preload sau 500ms
- **Tier 3**: Secondary components - preload sau 1.5s
- **Tier 4**: Optional components - preload sau 3s

### 4. Production Optimizations
- **Tree shaking**: Loại bỏ code không sử dụng
- **Minification**: Nén code và loại bỏ console.log
- **Content hashing**: Cache busting cho files
- **Module concatenation**: Gộp modules nhỏ
- **Deterministic IDs**: Stable chunk IDs

## Kết quả mong đợi

### Trước tối ưu hóa:
- 1 file `app.js` lớn (có thể > 1MB)
- Load time chậm
- Cache không hiệu quả

### Sau tối ưu hóa:
- Nhiều chunks nhỏ (< 244KB mỗi chunk)
- Load time nhanh hơn
- Cache hiệu quả hơn
- Parallel loading
- Better user experience

## Cách test
```bash
npm run build
```

Kiểm tra thư mục `dist/` để xem các chunks được tạo:
- `runtime.[hash].js` - Runtime code
- `react.[hash].js` - React libraries
- `redux.[hash].js` - Redux libraries
- `charts.[hash].js` - Chart libraries
- `app.[hash].js` - Main application code (nhỏ hơn nhiều)
- Và các chunks khác...

## Lưu ý
- Các chunks sẽ được load theo thứ tự ưu tiên
- Browser sẽ cache các chunks riêng biệt
- Khi có update, chỉ chunks thay đổi mới cần download lại
