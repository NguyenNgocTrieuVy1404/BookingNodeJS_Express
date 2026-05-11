# Hệ Thống Đặt Phòng Khách Sạn - Node.js Express

## Mô tả
Website đặt phòng khách sạn được xây dựng bằng Node.js Express với MySQL. Dự án học tập tích hợp đặt phòng, quản lý khách sạn, báo cáo, gửi email xác nhận và xuất PDF.

## Chức năng chính
- ✅ **Đặt phòng khách sạn**: Tìm kiếm và đặt phòng theo ngày
- ✅ **Quản lý khách sạn**: Admin quản lý khách sạn, phòng, tiện nghi
- ✅ **Quản lý đặt phòng**: Manager quản lý booking của khách sạn
- ✅ **Xác thực**: Đăng ký / đăng nhập (JWT + cookie), **đăng nhập Google (OAuth 2.0)** qua Passport.js
- ✅ **Gửi email**: Xác nhận đặt phòng qua email (Nodemailer)
- ✅ **PDF / voucher**: Xuất hóa đơn và nội dung email HTML (html-pdf, template Pug)
- ✅ **Upload ảnh**: Quản lý hình ảnh khách sạn (Multer)
- ✅ **Scheduled Jobs**: Tự động hủy booking hết hạn (node-cron)

## Cấu trúc dự án

### Node.js Express Application
```
BookingNodeJS_Express/
├── app.js                     # Khởi tạo Express, session, Passport
├── package.json
├── Hotel_DB.sql               # Schema MySQL
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   │   ├── authRouter.js      # Google OAuth (/auth/google, ...)
│   │   ├── userRoute.js       # Đăng ký, đăng nhập, đăng xuất
│   │   ├── bookingRoute.js
│   │   ├── hotelRoute.js
│   │   ├── homeRoute.js
│   │   ├── locationRoute.js
│   │   ├── profileRoute.js
│   │   ├── adminRoute.js
│   │   ├── managerRouter.js
│   │   └── staticRoute.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── utils/
│   │   ├── connectDB.js
│   │   ├── passport.js        # Google OAuth strategy
│   │   ├── pdfGenerator.js / documentGenerator.js
│   │   ├── scheduler.js
│   │   └── uploadConfig.js
│   └── views/                 # Pug templates
└── public/
```

## Công nghệ sử dụng
- **Node.js**, **Express.js**
- **MySQL** (mysql2)
- **Pug** — template engine
- **JWT** + **cookie-parser** — đăng nhập form qua `UserController`
- **express-session** + **Passport.js** + **passport-google-oauth20** — đăng nhập Google (`passport.js` hiện chỉ đăng ký Google strategy; `passport-local` có trong `package.json` nhưng chưa được `passport.use` tại đây)
- **Multer** — upload file
- **Nodemailer** — email
- **html-pdf** — PDF
- **node-cron** — tác vụ theo lịch
- **bcrypt** — mã hóa mật khẩu

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
Tạo file `.env` ở thư mục gốc dự án:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dbdatphongks
DB_PORT=3306
PORT=3000
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# Đăng nhập Google: OAuth client + redirect http://localhost:3000/auth/google/callback (Google Cloud Console)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 5. Chạy ứng dụng
```bash
npm start
```
Mặc định: `http://localhost:3000` (hoặc cổng trong `PORT`).

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
- **Đăng ký / đăng nhập**: `/users/register`, `/users/login`; có thể dùng **Đăng nhập Google** qua liên kết tới `/auth/google` (nếu đã cấu hình OAuth).
- **Tìm kiếm**: Khách sạn theo địa điểm và ngày
- **Đặt phòng**: Chọn phòng và điền thông tin
- **Xem booking**: Lịch sử đặt phòng
- **Hủy booking**: Trước ngày check-in (theo luật nghiệp vụ trong ứng dụng)

### 2. Admin
- Quản lý khách sạn, phòng, user, booking, dashboard

### 3. Manager
- Quản lý khách sạn được phân công, phòng, booking, tiện nghi

## Một số route HTTP (tham khảo)

Ứng dụng chủ yếu render Pug; dưới đây là các nhóm route chính (một phần cần đăng nhập / JWT).

### Người dùng (local)
- `GET/POST /users/register` — form đăng ký
- `GET/POST /users/login` — form đăng nhập
- `GET /users/logout` — đăng xuất

### Google OAuth
- `GET /auth/google`, `GET /auth/google/callback`, `GET /auth/google/failure`

### Booking (nhiều route có middleware `verifyToken`)
- `GET /bookings` — danh sách booking của user
- `GET /bookings/book/:idPhong` — form đặt phòng
- `POST /bookings` — tạo booking
- `POST /bookings/:id/cancel` — hủy
- `GET /bookings/success/:id` — trang thành công
- `POST /bookings/:id/send-email` — gửi lại email xác nhận

### Khách sạn (ví dụ)
- `GET /hotels` — API/danh sách
- `GET /hotels/:id` — chi tiết (có `checkAuth`)

## Tính năng nổi bật

### 1. Authentication & Authorization
- JWT (cookie `httpOnly`) cho phiên sau đăng nhập form hoặc sau OAuth
- Phân quyền User / Manager / Admin
- Session + Passport cho luồng Google OAuth

### 2. File & tài liệu
- Upload ảnh khách sạn (Multer)
- PDF hóa đơn / voucher và HTML email (template Pug)

### 3. Email & lịch
- Nodemailer, template email
- Cron: xử lý booking hết hạn

### 4. Database
- MySQL2, pooling, truy vấn tham số hóa

## Lưu ý
- Dự án học tập; cần import `Hotel_DB.sql` và điền `.env` trước khi chạy.
- **Email**: cần `EMAIL_USER` / `EMAIL_PASS` (ví dụ mật khẩu ứng dụng Gmail) để gửi xác nhận.
- **Google OAuth**: không điền `GOOGLE_CLIENT_ID` / `SECRET` thì chức năng đăng nhập Google sẽ lỗi khi gọi `/auth/google`.
- Callback Google đang hardcode `localhost:3000` trong `src/utils/passport.js` — khi chạy domain/cổng khác phải sửa cho khớp URI đã đăng ký trên Google.
