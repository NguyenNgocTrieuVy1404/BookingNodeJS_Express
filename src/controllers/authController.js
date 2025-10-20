const jwt = require('jsonwebtoken');

// Hàm xử lý callback từ Google OAuth
const googleCallback = (req, res) => {
    // Người dùng đã được xác thực qua middleware passport
    
    // Kiểm tra quyền hạn và chuyển hướng phù hợp
    if (req.user.quyenHan === 'admin') {
        res.redirect('/admin');
    } else if (req.user.quyenHan === 'manager') {
        res.redirect('/manager/dashboard');
    } else {
        res.redirect('/');  // Chuyển hướng về trang chủ cho người dùng thông thường
    }
};

// Thêm xử lý đăng nhập Google thành công
const googleAuthSuccess = (req, res) => {
    // Log thông tin người dùng để debug
    console.log('User from Google OAuth:', req.user);
    
    // Chuẩn bị dữ liệu người dùng cho token
    const userData = {
        id: req.user.idKhachHang || req.user.idTaiKhoan,
        username: req.user.tenDangNhap,
        fullName: req.user.hoTen, // Sử dụng hoTen làm fullName
        hoTen: req.user.hoTen,    // Cũng lưu hoTen để đảm bảo tương thích
        email: req.user.email,
        quyenHan: req.user.quyenHan,
        isLoggedIn: true
    };
    
    console.log('JWT userData:', userData);
    
    // Tạo JWT token với thông tin người dùng
    const token = jwt.sign(
        userData,
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    // Set cookie với token
    res.cookie('token', token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        secure: false
    });

    // Chuyển hướng dựa vào quyền hạn
    if (req.user.quyenHan === 'admin') {
        return res.redirect('/admin');
    } else if (req.user.quyenHan === 'manager') {
        return res.redirect('/manager/dashboard');
    } else {
        return res.redirect('/');
    }
};

// Xử lý đăng nhập Google thất bại
const googleAuthFailure = (req, res) => {
    res.redirect('/users/login?error=Đăng nhập bằng Google thất bại');
};

module.exports = {
    googleCallback,
    googleAuthSuccess,
    googleAuthFailure
}; 