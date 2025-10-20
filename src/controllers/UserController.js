const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

class UserController {
    async register(req, res) {
        try {
            const { hoTen, email, soDienThoai, tenDangNhap, matKhau } = req.body;

            // Kiểm tra tên đăng nhập đã tồn tại
            const existingUser = await User.findByUsername(tenDangNhap);
            if (existingUser) {
                // Kiểm tra nếu request là API
                if (req.headers['content-type'] === 'application/json') {
                    return res.status(400).json({
                        success: false,
                        message: 'Tên đăng nhập đã tồn tại'
                    });
                }
                return res.render('register', {
                    title: 'Đăng ký',
                    error: 'Tên đăng nhập đã tồn tại',
                    oldInput: req.body
                });
            }

            // Kiểm tra email đã tồn tại
            const existingEmail = await User.findByEmail(email);
            if (existingEmail) {
                // Kiểm tra nếu request là API
                if (req.headers['content-type'] === 'application/json') {
                    return res.status(400).json({
                        success: false,
                        message: 'Email đã tồn tại'
                    });
                }
                return res.render('register', {
                    title: 'Đăng ký',
                    error: 'Email đã tồn tại',
                    oldInput: req.body
                });
            }

            // Tạo khách hàng mới
            const newCustomer = await User.createCustomer({
                hoTen,
                email,
                soDienThoai
            });

            // Tạo tài khoản
            const newAccount = await User.createAccount({
                idKhachHang: newCustomer.idKhachHang,
                tenDangNhap,
                matKhau
            });

            // Kiểm tra nếu request là API
            if (req.headers['content-type'] === 'application/json') {
                return res.status(201).json({
                    success: true,
                    message: 'Đăng ký thành công',
                    data: {
                        idKhachHang: newCustomer.idKhachHang,
                        hoTen,
                        email,
                        tenDangNhap
                    }
                });
            }

            // Response cho form HTML
            return res.render('login', {
                title: 'Đăng nhập',
                success: 'Đăng ký thành công!',
                oldInput: { tenDangNhap }
            });

        } catch (error) {
            console.error(error);
            // Kiểm tra nếu request là API
            if (req.headers['content-type'] === 'application/json') {
                return res.status(500).json({
                    success: false,
                    message: 'Có lỗi xảy ra trong quá trình đăng ký',
                    error: error.message
                });
            }
            return res.render('register', {
                title: 'Đăng ký',
                error: 'Có lỗi xảy ra trong quá trình đăng ký',
                oldInput: req.body
            });
        }
    }

    async login(req, res) {
        try {
            const { tenDangNhap, matKhau } = req.body;

            // Sử dụng hàm mới từ model
            const user = await User.findByUsernameWithFullInfo(tenDangNhap);
            if (!user) {
                // Kiểm tra nếu request là API
                if (req.headers['content-type'] === 'application/json') {
                    return res.status(401).json({
                        success: false,
                        message: 'Tên đăng nhập không tồn tại'
                    });
                }
                return res.render('login', {
                    title: 'Đăng nhập',
                    error: 'Tên đăng nhập không tồn tại',
                    oldInput: { tenDangNhap }
                });
            }

            // Phần kiểm tra mật khẩu và trạng thái giữ nguyên
            const isValidPassword = await bcrypt.compare(matKhau, user.matKhau);
            if (!isValidPassword) {
                // Kiểm tra nếu request là API
                if (req.headers['content-type'] === 'application/json') {
                    return res.status(401).json({
                        success: false,
                        message: 'Mật khẩu không chính xác'
                    });
                }
                return res.render('login', {
                    title: 'Đăng nhập',
                    error: 'Mật khẩu không chính xác',
                    oldInput: { tenDangNhap }
                });
            }

            if (user.trangThai === 0) {
                // Kiểm tra nếu request là API
                if (req.headers['content-type'] === 'application/json') {
                    return res.status(403).json({
                        success: false,
                        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'
                    });
                }
                return res.render('login', {
                    title: 'Đăng nhập',
                    error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
                    oldInput: { tenDangNhap }
                });
            }

            // Tạo token với đầy đủ thông tin
            const tokenData = {
                id: user.idKhachHang,
                username: user.tenDangNhap,
                fullName: user.hoTen,
                email: user.email,
                quyenHan: user.quyenHan,
                isLoggedIn: true
            };
            
            // Thêm thông tin cho manager
            if (user.quyenHan === 'manager') {
                tokenData.idDiaDiem = user.idDiaDiem;
                tokenData.tenDiaDiem = user.tenDiaDiem;
            }
            
            const token = jwt.sign(
                tokenData,
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Kiểm tra nếu request là API
            if (req.headers['content-type'] === 'application/json') {
                return res.status(200).json({
                    success: true,
                    message: 'Đăng nhập thành công',
                    data: {
                        token,
                        user: {
                            id: user.idKhachHang,
                            username: user.tenDangNhap,
                            fullName: user.hoTen,
                            email: user.email,
                            quyenHan: user.quyenHan
                        }
                    }
                });
            }

            // Set cookie cho form thông thường
            res.cookie('token', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
                secure: false
            });

            // Chuyển hướng dựa vào quyền hạn
            switch (user.quyenHan) {
                case 'admin':
                    return res.redirect('/admin/dashboard');
                case 'manager':
                    return res.redirect('/manager/dashboard');
                case 'user':
                default:
                    return res.redirect('/');
            }

        } catch (error) {
            console.error('Login error:', error);
            // Kiểm tra nếu request là API
            if (req.headers['content-type'] === 'application/json') {
                return res.status(500).json({
                    success: false,
                    message: 'Lỗi server',
                    error: error.message
                });
            }
            return res.render('login', {
                title: 'Đăng nhập',
                error: 'Đã xảy ra lỗi trong quá trình đăng nhập',
                oldInput: { tenDangNhap: req.body.tenDangNhap }
            });
        }
    }

    async logout(req, res) {
        try {
            // Kiểm tra nếu request là API
            if (req.headers['content-type'] === 'application/json') {
                return res.status(200).json({
                    success: true,
                    message: 'Đăng xuất thành công'
                });
            }

            // Xóa token cookie
            res.clearCookie('token', {
                httpOnly: true,
                secure: false,
                path: '/'
            });

            // Đảm bảo xóa thông tin user trong res.locals
            res.locals.user = null;

            // Chuyển hướng về trang đăng nhập
            return res.redirect('/');
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);

            // Kiểm tra nếu request là API
            if (req.headers['content-type'] === 'application/json') {
                return res.status(500).json({
                    success: false,
                    message: 'Có lỗi xảy ra khi đăng xuất',
                    error: error.message
                });
            }

            return res.status(500).render('error', {
                title: 'Lỗi',
                message: 'Có lỗi xảy ra khi đăng xuất',
                user: null
            });
        }
    }
}

module.exports = new UserController();