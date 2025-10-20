const Admin = require('../models/adminModel');
const userModel = require('../models/userModel');
const pool = require('../utils/connectDB');
const jwt = require('jsonwebtoken');
const Booking = require('../models/bookingModel');

class AdminController {

    // Hiển thị trang đăng nhập
    async loginPage(req, res) {
        res.render('admin/login', {
            title: 'Đăng nhập Admin',
            message: 'Vui lòng đăng nhập để tiếp tục'
        });
    }

    // Xử lý đăng nhập
    async login(req, res) {
        try {
            const { tenDangNhap, matKhau } = req.body;
            const account = await Admin.checkLogin(tenDangNhap, matKhau);
            
            // Kiểm tra request từ API hay web
            const isApiRequest = req.xhr || 
                               req.headers['accept'] === '*/*' ||
                               req.headers['content-type']?.includes('application/json');

            if (!account) {
                if (isApiRequest) {
                    return res.status(401).json({
                        success: false,
                        message: 'Sai tên đăng nhập hoặc mật khẩu'
                    });
                }
                return res.render('admin/login', {
                    error: 'Sai tên đăng nhập hoặc mật khẩu',
                    title: 'Đăng nhập Admin',
                    lastUsername: tenDangNhap
                });
            }

            // Tạo token data
            const tokenData = {
                id: account.idKhachHang,
                username: account.tenDangNhap,
                fullName: account.hoTen,
                email: account.email,
                quyenHan: account.quyenHan
            };
            
            // Tạo JWT token
            const token = jwt.sign(
                tokenData,
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Nếu là API request
            if (isApiRequest) {
                return res.status(200).json({
                    success: true,
                    message: 'Đăng nhập thành công',
                    data: {
                        token,
                        user: tokenData
                    }
                });
            }

            // Nếu là web request
            res.cookie('token', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
                secure: process.env.NODE_ENV === 'production'
            });
            return res.redirect('/admin/dashboard');

        } catch (error) {
            console.error('Login error:', error);
            
            if (isApiRequest) {
                return res.status(500).json({
                    success: false,
                    message: 'Lỗi server',
                    error: error.message
                });
            }

            return res.render('admin/login', {
                error: 'Có lỗi xảy ra: ' + error.message,
                title: 'Đăng nhập Admin'
            });
        }
    }

    async dashboard(req, res) {
        try {
            // Cập nhật trạng thái trước khi hiển thị dashboard
            await Booking.updateBookingStatuses();
            
            const admin = req.user; // Lấy từ JWT thay vì session
            const stats = {
                totalUsers: 0,
                totalHotels: 0,
                newBookings: 0,
                monthlyRevenue: 0,
                bookingSuccessRate: 0,
                averageRating: 0,
                userGrowth: 0,
                hotelGrowth: 0,
                bookingGrowth: 0,
                revenueGrowth: 0
            };

            // Lấy dữ liệu thống kê từ database
            const [
                totalUsers,
                totalHotels,
                bookings,
                revenue,
                monthlyRevenue,
                monthlyBookings,
                bookingsByStatus,
                predictions
            ] = await Promise.all([
                pool.query('SELECT COUNT(*) as total FROM KhachHang'),
                pool.query('SELECT COUNT(*) as total FROM KhachSan'),
                pool.query(`
                    SELECT 
                        dp.*,
                        kh.hoTen,
                        ks.tenKhachSan
                    FROM DatPhong dp
                    JOIN KhachHang kh ON dp.idKhachHang = kh.idKhachHang
                    JOIN Phong p ON dp.idPhong = p.idPhong
                    JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
                    ORDER BY dp.ngayBatDau DESC 
                    LIMIT 10
                `),
                pool.query(`
                    SELECT SUM(dp.thanhTien) as total 
                    FROM DatPhong dp 
                    WHERE MONTH(dp.ngayBatDau) = MONTH(CURRENT_DATE())
                `),
                Admin.getMonthlyRevenue(),
                Admin.getMonthlyBookings(),
                Admin.getBookingsByStatus(),
                Admin.getPredictions()
            ]);

            // Cập nhật stats với dữ liệu thực
            stats.totalUsers = totalUsers[0][0].total;
            stats.totalHotels = totalHotels[0][0].total;
            stats.newBookings = bookings[0].length;
            stats.monthlyRevenue = revenue[0][0].total || 0;

            // Cập nhật tỷ lệ thành công (tỷ lệ đặt phòng đã hoàn thành)
            const totalBookings = bookingsByStatus.active + bookingsByStatus.completed + 
                                 bookingsByStatus.cancelled + bookingsByStatus.noShow;
            stats.bookingSuccessRate = totalBookings > 0 
                                     ? Math.round((bookingsByStatus.completed / totalBookings) * 100) 
                                     : 0;

            // Lấy danh sách đặt phòng gần đây
            const [recentBookings] = await pool.query(`
                SELECT 
                    dp.idDatPhong,
                    dp.ngayBatDau,
                    dp.ngayKetThuc,
                    dp.trangThai,
                    kh.hoTen,
                    ks.tenKhachSan
                FROM DatPhong dp
                JOIN KhachHang kh ON dp.idKhachHang = kh.idKhachHang
                JOIN Phong p ON dp.idPhong = p.idPhong
                JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
                ORDER BY dp.ngayBatDau DESC
                LIMIT 10
            `);

            // Tạo nhãn cho các tháng
            const monthLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
            
            // Tính toán các tháng dự đoán
            const currentMonth = new Date().getMonth(); // 0-11
            const predictionMonths = [];
            for (let i = 1; i <= 3; i++) {
                const nextMonth = (currentMonth + i) % 12;
                predictionMonths.push(monthLabels[nextMonth]);
            }

            res.render('admin/dashboard', {
                title: 'Dashboard',
                admin,
                stats,
                recentBookings,
                chartData: {
                    monthlyRevenue,
                    monthlyBookings,
                    bookingsByStatus,
                    predictions,
                    monthLabels,
                    predictionMonths
                }
            });
        } catch (error) {
            console.error('Error in dashboard:', error);
            res.status(500).render('error', {
                message: 'Có lỗi xảy ra khi tải trang Dashboard',
                error
            });
        }
    }

    async getUsers(req, res) {
        try {
            const users = await Admin.getAllUsers();
            res.render('admin/users', {
                title: 'Quản lý Users',
                users,
                admin: req.user
            });
        } catch (error) {
            console.error('Error getting users:', error);
            res.status(500).render('error', { error });
        }
    }

    async getHotels(req, res) {
        try {
            const hotels = await Admin.getAllHotels();
            res.render('admin/hotels', {
                title: 'Quản lý Khách sạn',
                hotels,
                admin: req.user
            });
        } catch (error) {
            console.error('Error getting hotels:', error);
            res.status(500).render('error', { error });
        }
    }

    async getBookings(req, res) {
        try {
            const bookings = await Admin.getAllBookings();
            res.render('admin/bookings', {
                title: 'Quản lý Đặt phòng',
                bookings,
                admin: req.user
            });
        } catch (error) {
            console.error('Error getting bookings:', error);
            res.status(500).render('error', { error });
        }
    }

    async addUserPage(req, res) {
        try {
            res.render('admin/addUser', {
                title: 'Thêm người dùng mới',
                admin: req.user,
                cookies: req.cookies
            });
        } catch (error) {
            console.error('Lỗi khi hiển thị trang thêm user:', error);
            res.redirect('/admin/users');
        }
    }

    async addUser(req, res) {
        try {
            console.log('=== Debug addUser controller ===');
            console.log('Request body:', req.body);
            console.log('User from token:', req.user);

            // Validate dữ liệu đầu vào
            const { hoTen, email, soDienThoai, diaChi, tenDangNhap, matKhau, quyenHan } = req.body;

            if (!hoTen || !email || !tenDangNhap || !matKhau) {
                console.log('Missing required fields');
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc',
                    requiredFields: ['hoTen', 'email', 'tenDangNhap', 'matKhau']
                });
            }

            // Log các bước kiểm tra
            console.log('Checking existing username...');
            const existingUser = await userModel.findByUsername(tenDangNhap);
            if (existingUser) {
                console.log('Username already exists:', tenDangNhap);
                return res.status(409).json({
                    success: false,
                    message: 'Tên đăng nhập đã tồn tại'
                });
            }

            console.log('Checking existing email...');
            const existingEmail = await userModel.findByEmail(email);
            if (existingEmail) {
                console.log('Email already exists:', email);
                return res.status(409).json({
                    success: false,
                    message: 'Email đã tồn tại'
                });
            }

            // Tạo khách hàng mới
            const customerData = {
                hoTen,
                email,
                soDienThoai,
                diaChi
            };
            const newCustomer = await userModel.createCustomer(customerData);

            // Tạo tài khoản cho khách hàng
            const accountData = {
                idKhachHang: newCustomer.idKhachHang,
                tenDangNhap,
                matKhau,
                quyenHan: quyenHan || 'user'
            };
            const newAccount = await userModel.createAccount(accountData);

            // Trả về response thành công
            return res.status(201).json({
                success: true,
                message: 'Thêm người dùng mới thành công',
                data: {
                    id: newCustomer.idKhachHang,
                    hoTen: newCustomer.hoTen,
                    email: newCustomer.email,
                    soDienThoai: newCustomer.soDienThoai,
                    diaChi: newCustomer.diaChi,
                    tenDangNhap: accountData.tenDangNhap,
                    quyenHan: accountData.quyenHan
                }
            });

        } catch (error) {
            console.error('Error in addUser:', error);
            
            // Xử lý các loại lỗi cụ thể
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    message: 'Thông tin đã tồn tại trong hệ thống',
                    error: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Lỗi khi thêm người dùng mới',
                error: error.message
            });
        }
    }

    async editUserPage(req, res) {
        try {
            const idKhachHang = req.params.id;
            const user = await userModel.findById(idKhachHang);
            
            res.render('admin/editUser', {
                user: user,
                cookies: req.cookies,
                title: 'Chỉnh sửa người dùng',
                admin: req.user
            });
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error);
            res.redirect('/admin/users');
        }
    }
    
    async updateUser(req, res) {
        try {
            const idKhachHang = req.params.id;
            
            // Kiểm tra user có tồn tại không
            const existingUser = await userModel.findById(idKhachHang);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy người dùng'
                });
            }

            // Validate dữ liệu đầu vào
            const { hoTen, email, soDienThoai, diaChi, quyenHan, trangThai } = req.body;
            
            if (!hoTen || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc',
                    requiredFields: ['hoTen', 'email']
                });
            }

            // Kiểm tra email mới có bị trùng không (nếu email thay đổi)
            if (email !== existingUser.email) {
                const existingEmail = await userModel.findByEmail(email);
                if (existingEmail) {
                    return res.status(409).json({
                        success: false,
                        message: 'Email đã được sử dụng bởi người dùng khác'
                    });
                }
            }

            // Chuẩn bị dữ liệu cập nhật
            const updateData = {
                hoTen,
                email,
                soDienThoai,
                diaChi,
                quyenHan,
                trangThai
            };

            // Thực hiện cập nhật
            const updatedUser = await userModel.updateUser(idKhachHang, updateData);

            // Trả về response thành công
            return res.status(200).json({
                success: true,
                message: 'Cập nhật thông tin người dùng thành công',
                data: {
                    id: idKhachHang,
                    hoTen: updateData.hoTen,
                    email: updateData.email,
                    soDienThoai: updateData.soDienThoai,
                    diaChi: updateData.diaChi,
                    quyenHan: updateData.quyenHan,
                    trangThai: updateData.trangThai
                }
            });

        } catch (error) {
            console.error('Error in updateUser:', error);
            
            // Xử lý các loại lỗi cụ thể
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    message: 'Thông tin đã tồn tại trong hệ thống',
                    error: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Lỗi khi cập nhật thông tin người dùng',
                error: error.message
            });
        }
    }

    async deleteUser(req, res) {
        try {
            const idKhachHang = req.params.id;

            // Kiểm tra user có tồn tại không
            const existingUser = await userModel.findById(idKhachHang);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy người dùng'
                });
            }

            // Kiểm tra xem user có đang có đơn đặt phòng không
            const hasBookings = await Booking.checkUserHasBookings(idKhachHang);
            if (hasBookings) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể xóa người dùng này vì có đơn đặt phòng liên quan'
                });
            }

            // Thực hiện xóa user
            await Admin.deleteUser(idKhachHang);

            // Trả về response thành công
            return res.status(200).json({
                success: true,
                message: 'Xóa người dùng thành công',
                data: {
                    id: idKhachHang
                }
            });

        } catch (error) {
            console.error('Error in deleteUser:', error);
            
            // Xử lý các loại lỗi cụ thể
            if (error.code === 'ER_ROW_IS_REFERENCED') {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể xóa người dùng này vì có dữ liệu liên quan',
                    error: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Lỗi khi xóa người dùng',
                error: error.message
            });
        }
    }


    async addHotelPage(req, res) {
        try {
            const [diadiems] = await pool.query('SELECT * FROM DiaDiem');
            res.render('admin/addHotel', {
                title: 'Thêm khách sạn mới',
                admin: req.user,
                diadiems,
                cookies: req.cookies
            });
        } catch (error) {
            console.error('Lỗi khi hiển thị trang thêm khách sạn:', error);
            res.redirect('/admin/hotels');
        }
    }

    async addHotel(req, res) {
        try {
            const isApiRequest = req.xhr || 
                               req.headers['accept'] === '*/*' ||
                               req.headers['content-type']?.includes('application/json');

            const upload = req.app.locals.upload;
            
            // Xử lý upload file
            const handleUpload = () => {
                return new Promise((resolve, reject) => {
                    upload.single('hinhAnh')(req, res, function(err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(req.file);
                    });
                });
            };

            try {
                const file = await handleUpload();
                
                const hotelData = {
                    tenKhachSan: req.body.tenKhachSan,
                    phuong: req.body.phuong,
                    quan: req.body.quan,
                    thanhPho: req.body.thanhPho,
                    idDiaDiem: req.body.idDiaDiem,
                    hinhAnh: file ? '/hotels/' + file.filename : null
                };

                // Validate dữ liệu
                if (!hotelData.tenKhachSan || !hotelData.idDiaDiem) {
                    if (isApiRequest) {
                        return res.status(400).json({
                            success: false,
                            message: 'Thiếu thông tin bắt buộc'
                        });
                    }
                    throw new Error('Thiếu thông tin bắt buộc');
                }

                // Thêm khách sạn vào database
                const newHotel = await Admin.createHotel(hotelData);

                // Trả về response tương ứng
                if (isApiRequest) {
                    return res.status(201).json({
                        success: true,
                        message: 'Thêm khách sạn mới thành công',
                        data: newHotel
                    });
                }

                // Response cho web form
                res.cookie('adminMessage', 'Thêm khách sạn mới thành công', {
                    maxAge: 2000
                });
                res.redirect('/admin/hotels');

            } catch (uploadError) {
                if (isApiRequest) {
                    return res.status(400).json({
                        success: false,
                        message: 'Lỗi khi upload file',
                        error: uploadError.message
                    });
                }
                res.cookie('adminError', uploadError.message, { maxAge: 2000 });
                res.redirect('back');
            }

        } catch (error) {
            console.error('Lỗi khi thêm khách sạn:', error);
            
            if (isApiRequest) {
                return res.status(500).json({
                    success: false,
                    message: 'Lỗi server khi thêm khách sạn',
                    error: error.message
                });
            }

            res.cookie('adminError', 'Có lỗi xảy ra khi thêm khách sạn mới', {
                maxAge: 2000
            });
            res.redirect('back');
        }
    }

    async editHotelPage(req, res) {
        try {
            const idKhachSan = req.params.id;
            const [hotel] = await pool.query('SELECT * FROM KhachSan WHERE idKhachSan = ?', [idKhachSan]);
            const [diadiems] = await pool.query('SELECT * FROM DiaDiem');
            
            res.render('admin/editHotel', {
                hotel: hotel[0],
                diadiems,
                cookies: req.cookies,
                title: 'Sửa thông tin khách sạn',
                admin: req.user
            });
        } catch (error) {
            console.error('Lỗi khi lấy thông tin khách sạn:', error);
            res.redirect('/admin/hotels');
        }
    }

    async updateHotel(req, res) {
        try {
            const idKhachSan = req.params.id;
            const upload = req.app.locals.upload;
            
            // Xử lý upload ảnh với multer
            upload.single('hinhAnh')(req, res, async function(err) {
                if (err) {
                    console.error('Lỗi upload ảnh:', err);
                    res.cookie('adminError', err.message, { maxAge: 2000 });
                    return res.redirect('back');
                }
                
                try {
                    // Validate input
                    const { tenKhachSan, phuong, quan, thanhPho, idDiaDiem } = req.body;
                    
                    // Chi tiết validation
                    if (!tenKhachSan || tenKhachSan.trim().length < 3) {
                        res.cookie('adminError', 'Tên khách sạn không được để trống và phải có ít nhất 3 ký tự', { maxAge: 2000 });
                        return res.redirect('back');
                    }
                    
                    if (!phuong || phuong.trim() === '') {
                        res.cookie('adminError', 'Vui lòng nhập phường', { maxAge: 2000 });
                        return res.redirect('back');
                    }
                    
                    if (!quan || quan.trim() === '') {
                        res.cookie('adminError', 'Vui lòng nhập quận', { maxAge: 2000 });
                        return res.redirect('back');
                    }
                    
                    if (!thanhPho || thanhPho.trim() === '') {
                        res.cookie('adminError', 'Vui lòng nhập thành phố', { maxAge: 2000 });
                        return res.redirect('back');
                    }
                    
                    if (!idDiaDiem) {
                        res.cookie('adminError', 'Vui lòng chọn địa điểm', { maxAge: 2000 });
                        return res.redirect('back');
                    }

                    // Kiểm tra khách sạn tồn tại
                    const [existingHotel] = await pool.query(
                        'SELECT * FROM KhachSan WHERE idKhachSan = ?',
                        [idKhachSan]
                    );

                    if (!existingHotel[0]) {
                        res.cookie('adminError', 'Không tìm thấy khách sạn', { maxAge: 2000 });
                        return res.redirect('back');
                    }

                    // Cập nhật thông tin
                    const updateData = {
                        tenKhachSan: tenKhachSan.trim(),
                        phuong: phuong.trim(), 
                        quan: quan.trim(),
                        thanhPho: thanhPho.trim(),
                        idDiaDiem
                    };
                    
                    // Nếu có file upload mới thì cập nhật hình ảnh
                    if (req.file) {
                        updateData.hinhAnh = req.file.filename;
                    }

                    await Admin.updateHotel(idKhachSan, updateData);

                    // Đặt thông báo thành công
                    res.cookie('adminMessage', 'Cập nhật thông tin khách sạn thành công', { maxAge: 2000 });
                    
                    // Redirect sau khi hoàn thành
                    return res.redirect('/admin/hotels');
                } catch (error) {
                    console.error('Error in updateHotel:', error);
                    res.cookie('adminError', error.message || 'Lỗi khi cập nhật khách sạn', { maxAge: 2000 });
                    return res.redirect('back');
                }
            });
        } catch (error) {
            console.error('Error in updateHotel:', error);
            res.cookie('adminError', error.message || 'Lỗi khi cập nhật khách sạn', { maxAge: 2000 });
            return res.redirect('back');
        }
    }

    async deleteHotel(req, res) {
        try {
            const idKhachSan = req.params.id;

            // Kiểm tra khách sạn tồn tại
            const [existingHotel] = await pool.query(
                'SELECT * FROM KhachSan WHERE idKhachSan = ?', 
                [idKhachSan]
            );

            if (!existingHotel[0]) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy khách sạn'
                });
            }

            // Kiểm tra có phòng đang được đặt không
            const [activeBookings] = await pool.query(`
                SELECT COUNT(*) as count 
                FROM Phong p
                JOIN DatPhong dp ON p.idPhong = dp.idPhong
                WHERE p.idKhachSan = ? AND dp.trangThai = 1
            `, [idKhachSan]);

            if (activeBookings[0].count > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể xóa khách sạn vì có phòng đang được đặt'
                });
            }

            // Thực hiện xóa
            await Admin.deleteHotel(idKhachSan);

            return res.status(200).json({
                success: true,
                message: 'Xóa khách sạn thành công',
                data: {
                    id: idKhachSan
                }
            });

        } catch (error) {
            console.error('Error in deleteHotel:', error);
            
            // Xử lý lỗi foreign key
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể xóa khách sạn vì có dữ liệu liên quan',
                    error: error.message
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi xóa khách sạn',
                error: error.message
            });
        }
    }

    async addBookingPage(req, res) {
        try {
            const [[customers], [rooms]] = await Promise.all([
                pool.query('SELECT * FROM KhachHang'),
                pool.query(`
                    SELECT Phong.*, KhachSan.tenKhachSan 
                    FROM Phong 
                    JOIN KhachSan ON Phong.idKhachSan = KhachSan.idKhachSan
                    WHERE Phong.trangThai = 1
                `)
            ]);

            res.render('admin/addBooking', {
                title: 'Thêm đặt phòng mới',
                admin: req.user,
                customers,
                rooms,
                cookies: req.cookies
            });
        } catch (error) {
            console.error('Lỗi khi hiển thị trang thêm đặt phòng:', error);
            res.redirect('/admin/bookings');
        }
    }

    async addBooking(req, res) {
        try {
            const bookingData = {
                idKhachHang: req.body.idKhachHang,
                idPhong: req.body.idPhong,
                ngayBatDau: req.body.ngayBatDau,
                ngayKetThuc: req.body.ngayKetThuc,
                trangThai: req.body.trangThai
            };

            await Admin.createBooking(bookingData);
            
            res.cookie('adminMessage', 'Thêm đặt phòng mới thành công', {
                maxAge: 2000
            });
            res.redirect('/admin/bookings');
        } catch (error) {
            console.error('Lỗi khi thêm đặt phòng:', error);
            res.cookie('adminError', error.message || 'Có lỗi xảy ra khi thêm đặt phòng mới', {
                maxAge: 2000
            });
            res.redirect('back');
        }
    }

    async editBookingPage(req, res) {
        try {
            const idDatPhong = req.params.id;
            const [[booking], [customers], [rooms]] = await Promise.all([
                pool.query('SELECT * FROM DatPhong WHERE idDatPhong = ?', [idDatPhong]),
                pool.query('SELECT * FROM KhachHang'),
                pool.query(`
                    SELECT Phong.*, KhachSan.tenKhachSan 
                    FROM Phong 
                    JOIN KhachSan ON Phong.idKhachSan = KhachSan.idKhachSan
                `)
            ]);

            if (!booking[0]) {
                throw new Error('Không tìm thấy đặt phòng');
            }

            res.render('admin/editBooking', {
                booking: booking[0],
                customers,
                rooms,
                cookies: req.cookies,
                title: 'Sửa thông tin đặt phòng',
                admin: req.user
            });
        } catch (error) {
            console.error('Lỗi khi lấy thông tin đặt phòng:', error);
            res.cookie('adminError', 'Không thể tải thông tin đặt phòng', {
                maxAge: 2000
            });
            res.redirect('/admin/bookings');
        }
    }

    async updateBooking(req, res) {
        try {
            const idDatPhong = req.params.id;
            const updateData = {
                idKhachHang: req.body.idKhachHang,
                idPhong: req.body.idPhong,
                ngayBatDau: req.body.ngayBatDau,
                ngayKetThuc: req.body.ngayKetThuc,
                trangThai: req.body.trangThai
            };

            // Kiểm tra tính hợp lệ của dữ liệu
            if (!updateData.idKhachHang || !updateData.idPhong || !updateData.ngayBatDau || !updateData.ngayKetThuc) {
                res.cookie('adminError', 'Vui lòng điền đầy đủ thông tin bắt buộc', { maxAge: 2000 });
                return res.redirect('back');
            }

            await Admin.updateBooking(idDatPhong, updateData);
            
            res.cookie('adminMessage', 'Cập nhật thông tin đặt phòng thành công', {
                maxAge: 2000
            });
            res.redirect('/admin/bookings');
        } catch (error) {
            console.error('Lỗi khi cập nhật đặt phòng:', error);
            res.cookie('adminError', error.message || 'Có lỗi xảy ra khi cập nhật thông tin đặt phòng', {
                maxAge: 2000
            });
            res.redirect('back');
        }
    }

    async deleteBooking(req, res) {
        try {
            const idDatPhong = req.params.id;
            await Admin.deleteBooking(idDatPhong);
            
            res.cookie('adminMessage', 'Xóa đặt phòng thành công', {
                maxAge: 2000
            });
            res.redirect('/admin/bookings');
        } catch (error) {
            console.error('Lỗi khi xóa đặt phòng:', error);
            res.cookie('adminError', error.message || 'Có lỗi xảy ra khi xóa đặt phòng', {
                maxAge: 2000
            });
            res.redirect('back');
        }
    }

    // Xác nhận khách hàng đã checkin
    async confirmCheckin(req, res) {
        try {
            const idDatPhong = req.params.id;
            
            // Gọi hàm xác nhận checkin từ model
            await Admin.confirmCheckin(idDatPhong);
            
            res.cookie('adminMessage', 'Xác nhận checkin thành công', { maxAge: 2000 });
            res.redirect('/admin/bookings');
        } catch (error) {
            console.error('Error confirming checkin:', error);
            res.cookie('adminError', error.message, { maxAge: 2000 });
            res.redirect('back');
        }
    }

    // Kiểm tra trạng thái checkin
    async checkCheckinStatus(req, res) {
        try {
            const idDatPhong = req.params.id;
            const hasCheckedIn = await Admin.checkIfAlreadyCheckedIn(idDatPhong);
            
            res.json({
                idDatPhong,
                hasCheckedIn,
                status: hasCheckedIn ? 'Đã checkin' : 'Chờ checkin'
            });
        } catch (error) {
            console.error('Error checking checkin status:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Cập nhật trạng thái tự động
    async updateBookingStatuses(req, res) {
        try {
            const result = await Booking.updateBookingStatuses();
            
            res.json({
                success: true,
                message: `Đã cập nhật: ${result.completed} hoàn thành, ${result.noShow} không checkin`,
                data: result
            });
        } catch (error) {
            console.error('Error updating booking statuses:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi cập nhật trạng thái đặt phòng'
            });
        }
    }

    async logout(req, res) {
        try {
            // Xóa cookie token
            res.clearCookie('token');
            
            // Kiểm tra nếu là API request
            const isApiRequest = req.xhr || 
                               req.headers.accept === 'application/json';
            
            if (isApiRequest) {
                return res.json({
                    success: true,
                    message: 'Đăng xuất thành công'
                });
            }

            // Redirect về trang login
            return res.redirect('/admin/login');
        } catch (error) {
            console.error('Logout error:', error);
            return res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi đăng xuất'
            });
        }
    }

    // Tìm kiếm khách hàng theo số điện thoại
    async searchCustomerByPhone(req, res) {
        try {
            const phoneNumber = req.query.phone;
            
            if (!phoneNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập số điện thoại để tìm kiếm'
                });
            }
            
            const customers = await Admin.searchCustomerByPhone(phoneNumber);
            
            return res.json({
                success: true,
                data: customers
            });
        } catch (error) {
            console.error('Error in searchCustomerByPhone:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi tìm kiếm khách hàng',
                error: error.message
            });
        }
    }
}

module.exports = new AdminController();
