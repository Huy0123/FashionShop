# 🛍️ Chevai Fashion E-commerce

**Một website thời trang e-commerce đầy đủ tính năng với AI thông minh, được xây dựng bằng React.js, Node.js và MongoDB**

---

## 🌟 Tính Năng Nổi Bật

### 🎯 **Đặc biệt - Tính năng AI độc đáo:**
- 🤖 **AI Chat Assistant** - Tư vấn thông minh bằng tiếng Việt
- 🎨 **AI Try-On** - Thử đồ ảo với CatVTON AI
- 🧠 **Hybrid AI System** - Kết hợp Custom AI + Google Gemini
- 📚 **AI Learning** - Học từ feedback người dùng để cải thiện

### 👥 **Khách Hàng (Frontend)**
- 🏠 **Trang chủ** với hero section và sản phẩm nổi bật
- 🛒 **Catalog sản phẩm** với filter và sort thông minh
- 🔍 **Tìm kiếm** nhanh chóng và chính xác
- 🛍️ **Giỏ hàng** với quản lý số lượng dễ dàng
- 👤 **Đăng nhập/Đăng ký** an toàn với JWT
- 📦 **Quản lý đơn hàng** và lịch sử mua hàng
- 💳 **Thanh toán đa dạng** (COD, VNPay)
- 🎨 **Thử đồ AI** - Xem mình mặc như thế nào trước khi mua
- 💬 **Chat AI** - Tư vấn sản phẩm 24/7
- 📱 **Responsive** - Hoạt động mượt mà trên mọi thiết bị

### 👨‍💼 **Admin Panel**
- 📊 **Dashboard** với thống kê đơn hàng chi tiết
- ➕ **Quản lý sản phẩm** (Thêm, Sửa, Xóa) với upload nhiều ảnh
- 📋 **Quản lý đơn hàng** với cập nhật trạng thái realtime
- 👥 **Quản lý người dùng** và thông tin khách hàng
- 💬 **Chat support** trực tiếp với khách hàng
- 📈 **Phân tích bán hàng** và báo cáo doanh thu

### ⚙️ **Backend mạnh mẽ**
- 🔐 **JWT Authentication** bảo mật cao
- 🗄️ **MongoDB** database với Mongoose ODM
- ☁️ **Cloudinary** lưu trữ ảnh tối ưu
- 💰 **VNPay** tích hợp thanh toán Việt Nam
- 🤖 **Hybrid AI System** thông minh và tiết kiệm chi phí
- 💬 **Socket.io** cho chat realtime
- 🛡️ **API security** với middleware authentication
- �️ **Try-on AI** với Hugging Face CatVTON

## 🚀 Công Nghệ Sử Dụng

### **Frontend (React.js)**
```
🔧 Core: React 19, Vite, React Router DOM
🎨 UI: Tailwind CSS, CSS3 Responsive
📡 HTTP: Axios, Context API
🔔 UX: React Toastify, Loading states
📱 MediaPipe: Face detection, Pose estimation
```

### **Backend (Node.js)**
```
🏗️ Core: Express.js, Node.js
🗄️ Database: MongoDB, Mongoose ODM
🔐 Auth: JWT, Bcrypt password hashing
📁 Upload: Multer, Sharp image processing
💬 Realtime: Socket.io
🤖 AI: Google Gemini AI, Custom AI engine
🖼️ Images: Cloudinary integration
```

### **AI & Machine Learning**
```
🧠 AI Engine: Hybrid system (Custom + Gemini)
🎨 Try-on: CatVTON, Hugging Face API
📚 Learning: User feedback system
🔄 Smart routing: Context-aware responses
📊 Analytics: Conversation tracking
```

### **Payment & Services**
```
💳 VNPay: Vietnamese payment gateway
💰 COD: Cash on delivery
☁️ Cloudinary: Optimized image storage
🗄️ MongoDB Atlas: Cloud database
```

## 🛠️ Cài Đặt & Thiết Lập

### **Yêu cầu hệ thống:**
```bash
📋 Node.js v16+ (khuyến nghị v18+)
🗄️ MongoDB Atlas account (free tier)
☁️ Cloudinary account (free tier)
💳 VNPay merchant account (test mode)
🤖 Google Gemini API key (optional)
🎨 Hugging Face API key (cho Try-on AI)
```

### **1. Clone repository**
```bash
git clone 
cd "Chevai fashional"
```

### **2. Thiết lập Backend**
```bash
cd BE
npm install
```

**Tạo file `.env` trong thư mục BE:**
```env
# Database
mongodb_uri

# Authentication
jwt_key=your_super_secret_jwt_key_here_make_it_long_and_secure

# Cloudinary (Image Storage)
cloudinary_name=your_cloudinary_cloud_name
cloudinary_api_key=your_cloudinary_api_key
cloudinary_api_secret=your_cloudinary_api_secret

# Admin Login
admin_email=admin@chevai.com
admin_password=admin123456

# VNPay Payment (Sandbox)
vnp_TmnCode=your_vnpay_terminal_code
vnp_HashSecret=your_vnpay_hash_secret
vnp_Url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
vnp_ReturnUrl=http://localhost:5173/verify-payment

# AI Services
GEMINI_API_KEY=your_google_gemini_api_key
HF_TOKEN=your_hugging_face_token

# AI Configuration
AI_GEMINI_DAILY_LIMIT=1400
AI_COMPLEXITY_THRESHOLD=0.5
```

**Khởi động Backend:**
```bash
npm run server
# Hoặc production: npm start
```

### **3. Thiết lập Frontend (Khách hàng)**
```bash
cd ../FE
npm install
```

**Tạo file `.env` trong thư mục FE:**
```env
VITE_BE_URL=http://localhost:4000
```

**Khởi động Frontend:**
```bash
npm run dev
```

### **4. Thiết lập Admin Panel**
```bash
cd ../ADMIN
npm install
npm run dev
```

## 🌐 Truy Cập Ứng Dụng

| Service | URL | Mô tả |
|---------|-----|-------|
| **🛍️ Frontend** | http://localhost:5173 | Website khách hàng |
| **👨‍💼 Admin Panel** | http://localhost:5174 | Quản trị viên |
| **⚙️ Backend API** | http://localhost:4000 | REST API server |

### **� Tài khoản Admin mặc định:**
```
Email: admin@chevai.com
Password: admin123456
```

## 💳 Test Thanh Toán VNPay

### **Thông tin thẻ test (Sandbox):**
```
🏦 Ngân hàng: NCB Bank
💳 Số thẻ: 9704198526191432198
👤 Chủ thẻ: NGUYEN VAN A
📅 Ngày hết hạn: 07/15
🔒 OTP: 123456
```

### **Các trường hợp test:**
- **Thành công:** Sử dụng thông tin trên
- **Thất bại:** Sử dụng OTP khác (ví dụ: 654321)
- **Hủy:** Nhấn "Hủy giao dịch" trên trang VNPay

## 🎯 Hướng Dẫn Sử Dụng

### **👤 Khách Hàng:**

1. **Đăng ký/Đăng nhập:**
   - Vào trang chủ → Click "Đăng nhập"
   - Đăng ký với email và mật khẩu
   - Xác thực và bắt đầu shopping

2. **Mua sắm:**
   - Duyệt sản phẩm theo danh mục
   - Sử dụng filter để tìm sản phẩm phù hợp
   - Click vào sản phẩm để xem chi tiết

3. **Thử đồ AI (Tính năng độc đáo):**
   - Vào trang sản phẩm → Click "Thử đồ AI"
   - Upload ảnh của bạn (chụp thẳng, ánh sáng tốt)
   - Đợi AI xử lý và xem kết quả

4. **Chat AI:**
   - Click biểu tượng chat ở góc dưới
   - Hỏi về sản phẩm bằng tiếng Việt tự nhiên
   - AI sẽ tư vấn và gợi ý sản phẩm phù hợp

5. **Đặt hàng:**
   - Thêm sản phẩm vào giỏ hàng
   - Chọn size và số lượng
   - Checkout và chọn phương thức thanh toán

### **👨‍💼 Admin:**

1. **Đăng nhập Admin:**
   - Vào http://localhost:5174
   - Sử dụng email/password admin

2. **Quản lý sản phẩm:**
   - Thêm sản phẩm mới với nhiều ảnh
   - Chỉnh sửa thông tin và giá cả
   - Xóa sản phẩm hết hàng

3. **Quản lý đơn hàng:**
   - Xem danh sách đơn hàng mới
   - Cập nhật trạng thái giao hàng
   - Theo dõi thanh toán

## 🤖 Hệ Thống AI Thông Minh

### **Hybrid AI Architecture:**
```
🎯 Câu hỏi đơn giản → Custom AI (Nhanh, Miễn phí)
🧠 Câu hỏi phức tạp → Gemini AI (Thông minh, Chi phí)
🔄 Fallback system → Đảm bảo luôn có phản hồi
📚 Learning system → Cải thiện theo thời gian
```

### **Tính năng AI:**

1. **Chat Assistant:**
   - Tư vấn sản phẩm bằng tiếng Việt
   - Hiểu ngữ cảnh và phong cách
   - Gợi ý dựa trên budget và sở thích

2. **Try-on AI:**
   - Sử dụng CatVTON technology
   - Xử lý ảnh realtime
   - Kết quả chất lượng cao

3. **Learning System:**
   - Học từ feedback người dùng
   - Cải thiện phản hồi theo thời gian
   - Personalization cho từng user

### **Test AI System:**
```bash
cd BE
npm run test:ai              # Test toàn bộ hệ thống
npm run test:ai:performance  # Test hiệu suất
npm run ai:stats             # Kiểm tra trạng thái
```


## � API Documentation

### **🔐 Authentication Endpoints**
```http
POST /api/user/register     # Đăng ký người dùng mới
POST /api/user/login        # Đăng nhập người dùng
POST /api/user/admin        # Đăng nhập admin
GET  /api/user/profile      # Lấy thông tin user (cần token)
```

### **🛍️ Product Endpoints**
```http
GET  /api/product/list      # Lấy danh sách tất cả sản phẩm
POST /api/product/add       # Thêm sản phẩm mới (Admin only)
POST /api/product/remove    # Xóa sản phẩm (Admin only)
POST /api/product/single    # Lấy thông tin 1 sản phẩm
POST /api/product/tryOnClothes # Thử đồ AI
```

### **📦 Order Endpoints**
```http
POST /api/order/place       # Đặt hàng COD
POST /api/order/vnpay       # Tạo thanh toán VNPay
GET  /api/order/vnpay-return # Callback VNPay
POST /api/order/userorders  # Lấy đơn hàng của user
POST /api/order/list        # Lấy tất cả đơn hàng (Admin)
POST /api/order/status      # Cập nhật trạng thái đơn hàng (Admin)
```

### **🛒 Cart Endpoints**
```http
POST /api/cart/add          # Thêm vào giỏ hàng
POST /api/cart/update       # Cập nhật giỏ hàng
POST /api/cart/get          # Lấy giỏ hàng của user
```

### **🤖 AI Chat Endpoints**
```http
POST /api/chat/message      # Gửi tin nhắn đến AI
POST /api/learning/feedback # Gửi feedback cho AI
GET  /api/learning/user-stats/:userId # Lấy thống kê AI của user
```

## 🔧 Tích Hợp Quan Trọng

### **💳 VNPay Payment Gateway**
- Xử lý thanh toán an toàn cho thị trường Việt Nam
- Hỗ trợ đa ngân hàng và ví điện tử
- Automatic order status update
- Test mode với sandbox environment
- Hỗ trợ tiền tệ VND

### **☁️ Cloudinary Image Management**
- Lưu trữ ảnh tối ưu với CDN global
- Auto-resize và optimize ảnh
- Upload multiple images
- Responsive image delivery
- Backup và security cao

### **� Hybrid AI System**
- **Custom AI**: Xử lý câu hỏi đơn giản, nhanh chóng
- **Google Gemini**: Xử lý câu hỏi phức tạp, tư vấn chuyên sâu
- **Smart routing**: Tự động chọn AI phù hợp
- **Fallback mechanism**: Đảm bảo luôn có response
- **Learning system**: Cải thiện qua feedback

### **🎨 Try-on AI với CatVTON**
- State-of-the-art virtual try-on technology
- Xử lý ảnh realtime với chất lượng cao
- Hỗ trợ multiple clothing types
- Integration với Hugging Face API

## 🚨 Troubleshooting

### **❌ Lỗi thường gặp:**

**1. Backend không khởi động được:**
```bash
# Kiểm tra Node.js version
node --version  # Cần >= v16

# Kiểm tra MongoDB connection
# Đảm bảo mongodb_uri trong .env đúng format

# Kiểm tra port 4000 có bị chiếm không
netstat -tulpn | grep :4000
```

**2. Frontend không connect được Backend:**
```bash
# Kiểm tra VITE_BE_URL trong .env
echo $VITE_BE_URL  # Should be http://localhost:4000

# Kiểm tra CORS settings trong backend
# Đảm bảo frontend URL được allow trong cors()
```

**3. AI không hoạt động:**
```bash
cd BE
npm run ai:stats  # Kiểm tra trạng thái AI system

# Nếu Gemini API lỗi, system sẽ fallback về Custom AI
# Check GEMINI_API_KEY trong .env
```

**4. Try-on AI lỗi:**
```bash
# Kiểm tra HF_TOKEN trong .env
# Đảm bảo có quyền truy cập Hugging Face API
# Kiểm tra network connection
```

**5. VNPay thanh toán lỗi:**
```bash
# Kiểm tra vnp_TmnCode và vnp_HashSecret
# Đảm bảo vnp_ReturnUrl đúng domain
# Test với thông tin thẻ sandbox
```

### **🔍 Debug Commands:**
```bash
# Backend
cd BE
npm run test:ai              # Test AI system
npm run ai:stats            # Check AI status
node -e "console.log(process.env.mongodb_uri)" # Check env

# Frontend  
cd FE
npm run build               # Test build process
npm run preview             # Preview production build

# Admin
cd ADMIN
npm run build               # Test admin build
```

## 🎉 Tính Năng Nâng Cao

### **📊 Analytics & Monitoring**
- Real-time order tracking
- AI conversation analytics
- User behavior tracking
- Sales performance metrics
- Error monitoring và logging

### **🔒 Security Features**
- JWT token authentication
- Password hashing với bcrypt
- Rate limiting cho API
- Input validation và sanitization
- CORS protection
- SQL injection protection

### **⚡ Performance Optimization**
- Image lazy loading
- API response caching
- Database indexing
- CDN delivery
- Minified assets
- Gzip compression

### **📱 Mobile Optimization**
- Responsive design với Tailwind
- Touch-friendly interface
- Mobile payment optimization
- Progressive Web App features

## 🤝 Đóng Góp

### **Cách contribute:**
1. Fork repository
2. Tạo feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Tạo Pull Request

### **Code Standards:**
- ESLint configuration cho consistency
- Prettier formatting
- Meaningful commit messages
- Comprehensive testing
- Documentation updates

### **Development Workflow:**
```bash
# Setup development environment
npm run dev:all       # Start all services
npm run test:all      # Run all tests
npm run lint:all      # Check code quality
npm run build:all     # Build for production
```

## 📞 Hỗ Trợ & Liên Hệ

### **🆘 Cần hỗ trợ?**
- **Email:** huyhon2456@gmail.com
- **Documentation:** Xem file README này
- **AI System:** Đọc `BE/chat/README.md`

### **� Tài liệu bổ sung:**
- `BE/README.md` - Chi tiết về backend và AI system
- `BE/chat/README.md` - Hướng dẫn AI system
- `FE/docs/TRYON_FEATURE.md` - Hướng dẫn Try-on AI


## 🙏 Acknowledgments

- **Hugging Face** - Cho CatVTON AI model
- **Google** - Cho Gemini AI API
- **VNPay** - Cho payment gateway
- **Cloudinary** - Cho image storage
- **MongoDB** - Cho database hosting
- **Vercel/Netlify** - Cho deployment options

---

## 🚀 Production Ready!

**Dự án này đã sẵn sàng cho production với:**
- ✅ Comprehensive testing
- ✅ Security best practices  
- ✅ Performance optimization
- ✅ Error handling
- ✅ Monitoring & logging
- ✅ Documentation đầy đủ

---

**Made with ❤️ by [Huy Hon](https://github.com/huyhon2456)**


