const ProfileModel = require('../models/profileModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class ProfileController {
    async getProfile(req, res) {
        try {
            const userId = req.user.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Không tìm thấy thông tin người dùng'
                });
            }

            const user = await ProfileModel.findById(userId);

            // Kiểm tra user có tồn tại
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông tin người dùng'
                });
            }

            const profileData = {
                id: userId,
                hoTen: user.hoTen,
                email: user.email,
                soDienThoai: user.soDienThoai,
                diaChi: user.diaChi
            };

            // Kiểm tra nếu là API request
            if (req.headers['content-type']?.includes('application/json')) {
                return res.status(200).json({
                    success: true,
                    message: 'Lấy thông tin profile thành công',
                    data: profileData
                });
            }

            // Render template profile.pug với dữ liệu người dùng
            return res.render('profile', { 
                title: 'Hồ sơ cá nhân',
                profileData: profileData,
                user: res.locals.user,
                error: req.query.error,
                success: req.query.success
            });

        } catch (error) {
            console.error('Profile error:', error);
            
            // Kiểm tra nếu là API request
            if (req.headers['content-type']?.includes('application/json')) {
                return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi lấy thông tin profile',
                    error: error.message
                });
            }
            
            // Render template với thông báo lỗi
            return res.render('profile', { 
                title: 'Hồ sơ cá nhân',
                user: res.locals.user,
                error: error.message
            });
        }
    }

    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const { soDienThoai, matKhau, diaChi, hoTen } = req.body;

            const currentUser = await ProfileModel.findById(userId);
            if (!currentUser) {
                // Nếu là API request
                if (req.headers['content-type']?.includes('application/json')) {
                    return res.status(404).json({
                        success: false,
                        message: 'Không tìm thấy thông tin người dùng'
                    });
                }
                // Nếu là form submit
                throw new Error('Không tìm thấy thông tin người dùng');
            }

            // Tạo object chứa thông tin token mới
            const tokenData = {
                id: userId,
                fullName: hoTen || currentUser.hoTen,
                email: currentUser.email,
                role: req.user.role
            };

            // Cập nhật thông tin
            if (hoTen) {
                await ProfileModel.updateFullName(userId, hoTen);
                // Cập nhật JWT token với thông tin mới
                const newToken = jwt.sign(
                    tokenData,
                    process.env.JWT_SECRET,
                    { expiresIn: '1d' }
                );
                res.cookie('token', newToken, {
                    httpOnly: true,
secure: process.env.NODE_ENV === 'production'
                });
                
                // Cập nhật thông tin cho request hiện tại
                req.user = tokenData;
                res.locals.user = {
                    ...tokenData,
                    isLoggedIn: true
                };
            }

            if (soDienThoai) await ProfileModel.updatePhoneNumber(userId, soDienThoai);
            if (diaChi) await ProfileModel.updateAddress(userId, diaChi);
            if (matKhau) {
                const hashedPassword = await bcrypt.hash(matKhau, 10);
                await ProfileModel.updatePassword(userId, hashedPassword);
            }

            // Lấy thông tin đã cập nhật
            const updatedUser = await ProfileModel.findById(userId);

            // Nếu là API request
            if (req.headers['content-type']?.includes('application/json')) {
                return res.status(200).json({
                    success: true,
                    message: 'Cập nhật thông tin thành công',
                    data: updatedUser
                });
            }

            // Nếu là form submit
            res.redirect('/profile?success=Cập nhật thông tin thành công!');
        } catch (error) {
            console.error('Chi tiết lỗi khi cập nhật hồ sơ:', error);
            
            // Nếu là API request
            if (req.headers['content-type']?.includes('application/json')) {
                return res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
            
            // Nếu là form submit
            res.redirect('/profile?error=' + encodeURIComponent(error.message || 'Có lỗi xảy ra khi cập nhật thông tin.'));
        }
    }
}

module.exports = new ProfileController();