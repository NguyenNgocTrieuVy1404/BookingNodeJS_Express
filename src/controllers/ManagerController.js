const Manager = require('../models/managerModel');
const jwt = require('jsonwebtoken');
const Booking = require('../models/bookingModel');
const bcrypt = require('bcrypt');

class ManagerController {
    // Hiển thị trang đăng nhập
    async loginPage(req, res) {
        res.render('manager/login', {
            title: 'Đăng nhập Manager',
            message: 'Vui lòng đăng nhập để tiếp tục'
        });
    }

    // Xử lý đăng nhập
    async login(req, res) {
        try {
            const { tenDangNhap, matKhau } = req.body;
            const account = await Manager.checkLogin(tenDangNhap, matKhau);
            
            if (!account) {
                return res.render('manager/login', {
                    error: 'Sai tên đăng nhập hoặc mật khẩu',
                    title: 'Đăng nhập Manager',
                    lastUsername: tenDangNhap
                });
            }

            // Tạo token data, bao gồm thông tin khu vực
            const tokenData = {
                id: account.idTaiKhoan,
                username: account.tenDangNhap,
                fullName: account.hoTen || 'Manager',
                email: account.email,
                quyenHan: account.quyenHan,
                idDiaDiem: account.idDiaDiem,
                tenDiaDiem: account.tenDiaDiem
            };
            
            // Tạo JWT token
            const token = jwt.sign(
                tokenData,
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Set cookie và chuyển hướng
            res.cookie('token', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000
            });
            return res.redirect('/manager/dashboard');

        } catch (error) {
            console.error('Login error:', error);
            return res.render('manager/login', {
                error: 'Có lỗi xảy ra: ' + error.message,
                title: 'Đăng nhập Manager'
            });
        }
    }

    // Dashboard
    async dashboard(req, res) {
        try {
            const manager = req.user;
            console.log(`Dashboard cho manager ${manager.username}, khu vực ${manager.idDiaDiem}`);
            
            // Lấy thống kê theo khu vực của manager
            const stats = await Manager.getStats(manager.idDiaDiem);
            
            // Lấy dữ liệu biểu đồ theo tháng
            const monthlyBookingData = await Manager.getMonthlyBookingStats(manager.idDiaDiem);
            
            // Lấy danh sách đặt phòng gần đây theo khu vực
            const recentBookings = await Manager.getBookingsByArea(manager.idDiaDiem);
            
            res.render('manager/dashboard', {
                title: 'Dashboard',
                manager,
                stats,
                recentBookings,
                areaName: manager.tenDiaDiem,
                monthlyBookingData: JSON.stringify(monthlyBookingData),
                timestamp: Date.now() // Ngăn cache
            });
        } catch (error) {
            console.error('Error in dashboard:', error);
            res.status(500).render('error', {
                message: 'Có lỗi xảy ra khi tải trang Dashboard',
                error
            });
        }
    }

    // Quản lý phòng
    async getRooms(req, res) {
        try {
            const manager = req.user;
            // Lấy danh sách phòng theo khu vực
            const rooms = await Manager.getRoomsByArea(manager.idDiaDiem);
            
            res.render('manager/rooms', {
                title: 'Quản lý Phòng',
                rooms,
                manager,
                areaName: manager.tenDiaDiem
            });
        } catch (error) {
            console.error('Error in getRooms:', error);
            res.status(500).render('error', { 
                message: 'Có lỗi xảy ra khi tải danh sách phòng',
                error 
            });
        }
    }

    // Thêm phòng mới
    async addRoom(req, res) {
        try {
            const manager = req.user;
            const { idKhachSan, idLoaiPhong, giaPhong, trangThai } = req.body;
            
            // Kiểm tra khách sạn có thuộc khu vực quản lý không
            const hotels = await Manager.getHotelsByArea(manager.idDiaDiem);
            const hotelExists = hotels.some(hotel => hotel.idKhachSan == idKhachSan);
            
            if (!hotelExists) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền thêm phòng cho khách sạn này'
                });
            }
            
            const roomData = {
                idKhachSan,
                idLoaiPhong,
                giaPhong,
                trangThai: trangThai || 1
            };
            
            const newRoom = await Manager.createRoom(roomData);
            
            res.json({
                success: true,
                message: 'Thêm phòng thành công',
                data: newRoom
            });
        } catch (error) {
            console.error('Error in addRoom:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi thêm phòng',
                error: error.message
            });
        }
    }

    // Cập nhật thông tin phòng
    async updateRoom(req, res) {
        try {
            const idPhong = req.params.id;
            const { idLoaiPhong, giaPhong, trangThai } = req.body;
            
            // Kiểm tra quyền đã được xử lý trong middleware
            
            const updateData = {
                idLoaiPhong,
                giaPhong,
                trangThai
            };
            
            await Manager.updateRoom(idPhong, updateData);
            
            res.json({
                success: true,
                message: 'Cập nhật phòng thành công'
            });
        } catch (error) {
            console.error('Error in updateRoom:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi cập nhật phòng',
                error: error.message
            });
        }
    }

    // Xem danh sách đặt phòng
    async getBookings(req, res) {
        try {
            const manager = req.user;
            // Lấy danh sách đặt phòng theo khu vực
            const bookings = await Manager.getBookingsByArea(manager.idDiaDiem);
            
            res.render('manager/bookings', {
                title: 'Quản lý Đặt phòng',
                bookings,
                manager,
                areaName: manager.tenDiaDiem
            });
        } catch (error) {
            console.error('Error in getBookings:', error);
            res.status(500).render('error', { 
                message: 'Có lỗi xảy ra khi tải danh sách đặt phòng',
                error 
            });
        }
    }

    // Cập nhật trạng thái đặt phòng
    async updateBooking(req, res) {
        try {
            const idDatPhong = req.params.id;
            const { trangThai } = req.body;
            
            // Kiểm tra quyền đã được xử lý trong middleware
            
            await Manager.updateBooking(idDatPhong, { trangThai });
            
            res.json({
                success: true,
                message: 'Cập nhật trạng thái đặt phòng thành công'
            });
        } catch (error) {
            console.error('Error in updateBooking:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi cập nhật trạng thái đặt phòng',
                error: error.message
            });
        }
    }

    // Xác nhận khách hàng đã checkin
    async confirmCheckin(req, res) {
        try {
            const idDatPhong = req.params.id;
            
            // Kiểm tra quyền đã được xử lý trong middleware
            
            await Manager.confirmCheckin(idDatPhong);
            
            res.json({
                success: true,
                message: 'Xác nhận checkin thành công'
            });
        } catch (error) {
            console.error('Error in confirmCheckin:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi xác nhận checkin',
                error: error.message
            });
        }
    }

    // Toggle trạng thái phòng
    async toggleRoomStatus(req, res) {
        try {
            const idPhong = req.params.id;
            
            // Kiểm tra quyền đã được xử lý trong middleware
            
            await Manager.toggleRoomStatus(idPhong);
            
            res.json({
                success: true,
                message: 'Chuyển đổi trạng thái phòng thành công'
            });
        } catch (error) {
            console.error('Error in toggleRoomStatus:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi chuyển đổi trạng thái phòng',
                error: error.message
            });
        }
    }

    // Lấy chi tiết tiện nghi phòng
    async getRoomAmenities(req, res) {
        try {
            const manager = req.user;
            const idPhong = req.params.idPhong;
            
            // Kiểm tra phòng có thuộc khu vực quản lý không
            const hasPermission = await Manager.checkRoomBelongsToArea(idPhong, manager.idDiaDiem);
            
            if (!hasPermission) {
                return res.status(403).render('error', {
                    message: 'Bạn không có quyền quản lý tiện nghi của phòng này'
                });
            }
            
            // Log thông tin debug
            console.log(`Manager ${manager.username} đang xem tiện nghi phòng ${idPhong}, khu vực ${manager.idDiaDiem}`);
            
            const room = await Manager.getRoomById(idPhong);
            const currentAmenities = await Manager.getRoomAmenities(idPhong);
            const availableAmenities = await Manager.getAvailableAmenities(idPhong);
            
            console.log(`Số tiện nghi hiện có: ${currentAmenities ? currentAmenities.length : 0}`);
            console.log(`Số tiện nghi có thể thêm: ${availableAmenities ? availableAmenities.length : 0}`);
            
            res.render('manager/room-amenities', {
                title: 'Quản lý Tiện nghi Phòng',
                room,
                roomAmenities: currentAmenities || [],
                availableAmenities: availableAmenities || [],
                manager: req.user,
                areaName: manager.tenDiaDiem,
                timestamp: Date.now() // Ngăn cache
            });
        } catch (error) {
            console.error('Error in getRoomAmenities:', error);
            res.status(500).render('error', { 
                message: 'Có lỗi xảy ra khi tải tiện nghi phòng',
                error 
            });
        }
    }

    // Quản lý tiện nghi
    async getAmenities(req, res) {
        try {
            const amenities = await Manager.getAllAmenities();
            res.render('manager/amenities', {
                title: 'Quản lý Tiện nghi',
                user: req.user,
                amenities
            });
        } catch (error) {
            console.error('Error getting amenities:', error);
            res.status(500).render('error', { error });
        }
    }

    // Thêm tiện nghi cho phòng
    async addAmenityToRoom(req, res) {
        try {
            const { idPhong, idTienNghi } = req.body;
            await Manager.addAmenityToRoom(idPhong, idTienNghi);
            
            res.cookie('managerMessage', 'Thêm tiện nghi cho phòng thành công', { maxAge: 2000 });
            res.redirect(`/manager/rooms/${idPhong}/amenities`);
        } catch (error) {
            console.error('Error adding amenity to room:', error);
            res.cookie('managerError', error.message, { maxAge: 2000 });
            res.redirect('back');
        }
    }

    // Xóa tiện nghi khỏi phòng
    async removeAmenityFromRoom(req, res) {
        try {
            const { idPhong, idTienNghi } = req.params;
            await Manager.removeAmenityFromRoom(idPhong, idTienNghi);
            
            res.cookie('managerMessage', 'Xóa tiện nghi khỏi phòng thành công', { maxAge: 2000 });
            res.redirect(`/manager/rooms/${idPhong}/amenities`);
        } catch (error) {
            console.error('Error removing amenity from room:', error);
            res.cookie('managerError', error.message, { maxAge: 2000 });
            res.redirect('back');
        }
    }

    // Kiểm tra trạng thái checkin
    async checkCheckinStatus(req, res) {
        try {
            const idDatPhong = req.params.id;
            const hasCheckedIn = await Manager.checkIfAlreadyCheckedIn(idDatPhong);
            
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

    // Thêm tiện nghi
    async addAmenity(req, res) {
        try {
            const { tenTienNghi } = req.body;
            
            if (!tenTienNghi) {
                return res.status(400).json({ 
                    message: 'Tên tiện nghi không được để trống' 
                });
            }

            // Thêm vào database thông qua model
            const result = await Manager.addAmenity(tenTienNghi);

            // Nếu thành công
            res.json({ 
                success: true, 
                message: 'Thêm tiện nghi thành công',
                data: result
            });

        } catch (error) {
            console.error('Error in addAmenity:', error);
            res.status(500).json({ 
                success: false,
                message: error.message || 'Lỗi khi thêm tiện nghi' 
            });
        }
    }

    // Xóa tiện nghi
    async deleteAmenity(req, res) {
        try {
            const { id } = req.params;
            await Manager.deleteAmenity(id);
            
            return res.status(200).json({
                success: true,
                message: 'Xóa tiện nghi thành công'
            });
        } catch (error) {
            console.error('Error deleting amenity:', error);
            
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Cập nhật tiện nghi
    async editAmenity(req, res) {
        try {
            const { id } = req.params;
            const { tenTienNghi } = req.body;
            
            if (!tenTienNghi) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Tên tiện nghi không được để trống' 
                });
            }

            // Cập nhật thông qua model
            const result = await Manager.editAmenity(id, tenTienNghi);

            return res.status(200).json({
                success: true,
                message: 'Cập nhật tiện nghi thành công',
                data: result
            });
        } catch (error) {
            console.error('Error editing amenity:', error);
            
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async logout(req, res) {
        res.clearCookie('token');
        res.json({ success: true });
    }
}

module.exports = new ManagerController(); 