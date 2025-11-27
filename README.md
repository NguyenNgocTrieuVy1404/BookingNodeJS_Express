# Hệ Thống Đặt Phòng Khách Sạn - Node.js Express

## Mô tả
Website đặt phòng khách sạn toàn diện được xây dựng bằng Node.js Express với MySQL. Dự án học tập tích hợp đầy đủ chức năng từ đặt phòng, quản lý khách sạn đến báo cáo và thanh toán.

## Chức năng chính
- ✅ **Đặt phòng khách sạn**: Tìm kiếm và đặt phòng theo ngày
- ✅ **Quản lý khách sạn**: Admin quản lý khách sạn, phòng, tiện nghi
- ✅ **Quản lý đặt phòng**: Manager quản lý booking của khách sạn
- ✅ **Xác thực người dùng**: Đăng ký, đăng nhập với JWT
- ✅ **Gửi email**: Xác nhận đặt phòng qua email
- ✅ **Tạo PDF**: Xuất hóa đơn và voucher
- ✅ **QR Code**: Tạo mã QR cho booking
- ✅ **Upload ảnh**: Quản lý hình ảnh khách sạn
- ✅ **Scheduled Jobs**: Tự động hủy booking hết hạn

## Cấu trúc dự án

### Node.js Express Application
```
BookingNodeJS_Express/
├── app.js                     # Main application file
├── package.json               # Dependencies và scripts
├── Hotel_DB.sql              # Database schema
├── src/
│   ├── controllers/          # Business logic
│   │   ├── BookingController.js
│   │   ├── HotelController.js
│   │   ├── AdminController.js
│   │   ├── ManagerController.js
│   │   └── authController.js
│   ├── models/               # Data models
│   │   ├── bookingModel.js
│   │   ├── hotelModel.js
│   │   ├── userModel.js
│   │   └── adminModel.js
│   ├── routes/               # API routes
│   │   ├── bookingRoute.js
│   │   ├── hotelRoute.js
│   │   ├── adminRoute.js
│   │   └── authRouter.js
│   ├── middleware/           # Custom middleware
│   │   └── authMiddleware.js
│   ├── utils/                # Utility functions
│   │   ├── connectDB.js       # Database connection
│   │   ├── passport.js        # Authentication
│   │   ├── pdfGenerator.js    # PDF generation
│   │   ├── qrGenerator.js     # QR code generation
│   │   └── scheduler.js       # Cron jobs
│   └── views/                # Pug templates
│       ├── home.pug
│       ├── booking-form.pug
│       ├── admin/
│       └── manager/
└── public/                   # Static files
    ├── css/
    ├── js/
    └── hotels/
```

## Công nghệ sử dụng
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **Pug** - Template engine
- **JWT** - Authentication
- **Passport.js** - Authentication middleware
- **Multer** - File upload
- **Nodemailer** - Email service
- **html-pdf** - PDF generation
- **qrcode** - QR code generation
- **node-cron** - Scheduled tasks
- **bcrypt** - Password hashing

## Cài đặt

### 1. Yêu cầu
- Node.js 14+
- MySQL 8.0+
- npm hoặc yarn

### 2. Clone và cài đặt
```bash
git clone <repository-url>
cd BookingNodeJS_Express
npm install
```

### 3. Setup database
```sql
-- Import file Hotel_DB.sql vào MySQL
mysql -u root -p < Hotel_DB.sql
```

### 4. Cấu hình environment
Tạo file `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dbdatphongks
DB_PORT=3306
PORT=3000
JWT_SECRET=....
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SESSION_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 5. Chạy ứng dụng
```bash
npm start
```
Truy cập: http://localhost:3000

## Cấu trúc database

### Các bảng chính
- **DiaDiem**: Địa điểm du lịch
- **KhachSan**: Thông tin khách sạn
- **Phong**: Phòng khách sạn
- **LoaiPhong**: Loại phòng (Standard, Deluxe, Suite)
- **TienNghi**: Tiện nghi phòng
- **DatPhong**: Đặt phòng của khách hàng
- **NguoiDung**: Tài khoản người dùng
- **Admin**: Tài khoản admin
- **Manager**: Tài khoản quản lý khách sạn

## Cách sử dụng

### 1. Khách hàng
- **Đăng ký/Đăng nhập**: Tạo tài khoản hoặc đăng nhập
- **Tìm kiếm**: Tìm khách sạn theo địa điểm và ngày
- **Đặt phòng**: Chọn phòng và điền thông tin
- **Xem booking**: Xem lịch sử đặt phòng
- **Hủy booking**: Hủy đặt phòng (trước ngày check-in)

### 2. Admin
- **Quản lý khách sạn**: Thêm/sửa/xóa khách sạn
- **Quản lý phòng**: Quản lý phòng và tiện nghi
- **Quản lý user**: Quản lý tài khoản người dùng
- **Quản lý booking**: Xem tất cả đặt phòng
- **Dashboard**: Thống kê tổng quan

### 3. Manager
- **Quản lý khách sạn**: Quản lý khách sạn được phân công
- **Quản lý phòng**: Quản lý phòng của khách sạn
- **Quản lý booking**: Xem đặt phòng của khách sạn
- **Cập nhật tiện nghi**: Thêm/sửa tiện nghi phòng

## API Endpoints

### Authentication
- `POST /auth/register` - Đăng ký
- `POST /auth/login` - Đăng nhập
- `POST /auth/logout` - Đăng xuất

### Booking
- `GET /bookings` - Lấy danh sách booking
- `POST /bookings` - Tạo booking mới
- `POST /bookings/:id/cancel` - Hủy booking

### Hotels
- `GET /hotels` - Lấy danh sách khách sạn
- `GET /hotels/:id` - Chi tiết khách sạn
- `POST /hotels` - Tạo khách sạn (Admin)

## Tính năng nổi bật

### 1. Authentication & Authorization
- JWT token authentication
- Role-based access control (User, Manager, Admin)
- Session management với Passport.js

### 2. File Management
- Upload hình ảnh khách sạn với Multer
- Generate PDF hóa đơn và voucher
- QR code generation cho booking

### 3. Email Service
- Gửi email xác nhận đặt phòng
- Template email với Pug
- Nodemailer integration

### 4. Scheduled Tasks
- Tự động hủy booking hết hạn
- Cron jobs với node-cron
- Background task processing

### 5. Database Optimization
- Connection pooling với MySQL2
- Prepared statements
- Transaction support

## Lưu ý
- Đây là dự án học tập Node.js Express
- Cần cấu hình email service để gửi email
- Database cần được setup trước khi chạy
- Phù hợp để học full-stack development
