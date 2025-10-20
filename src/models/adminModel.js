const pool = require('../utils/connectDB');
const bcrypt = require('bcrypt');

const getAllUsers = async () => {
    const query = `
        SELECT KhachHang.*, TaiKhoan.quyenHan, TaiKhoan.trangThai
        FROM KhachHang
        LEFT JOIN TaiKhoan ON KhachHang.idKhachHang = TaiKhoan.idKhachHang
        ORDER BY 
            CASE TaiKhoan.quyenHan
                WHEN 'admin' THEN 1
                WHEN 'user' THEN 2
            END,
            KhachHang.idKhachHang ASC
    `;
    const [rows] = await pool.execute(query);
    return rows;
};

const getAllHotels = async () => {
    const query = `
    SELECT *
    FROM KhachSan
    `;
    const [rows, fields] = await pool.execute(query);
    return rows;
}

const getAllBookings = async () => {
    const [bookings] = await pool.execute(`
        SELECT dp.*, kh.hoTen, ks.tenKhachSan 
        FROM DatPhong dp
        LEFT JOIN KhachHang kh ON dp.idKhachHang = kh.idKhachHang
        LEFT JOIN Phong p ON dp.idPhong = p.idPhong
        LEFT JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
        ORDER BY dp.idDatPhong ASC
    `);
    return bookings;
}

const checkLogin = async (tenDangNhap, matKhau) => {
    try {
        const queryCheck = `
            SELECT TaiKhoan.*, KhachHang.*
            FROM TaiKhoan
            LEFT JOIN KhachHang ON TaiKhoan.idKhachHang = KhachHang.idKhachHang
            WHERE TaiKhoan.tenDangNhap = ?
            AND TaiKhoan.quyenHan = 'admin'
        `;
        const [accounts] = await pool.execute(queryCheck, [tenDangNhap]);
        console.log('Found account:', accounts[0]); 

        if (accounts.length > 0) {
            const account = accounts[0];
            const isMatch = await bcrypt.compare(matKhau, account.matKhau);

            if (isMatch) {
                return account;
            }
        }
        return null;
    } catch (error) {
        console.error('Error in checkLogin:', error);
        throw error;
    }
};

const getUserById = async (userId) => {
    const query = `
        SELECT KhachHang.*, TaiKhoan.quyenHan, TaiKhoan.trangThai
        FROM KhachHang
        LEFT JOIN TaiKhoan ON KhachHang.idKhachHang = TaiKhoan.idKhachHang
        WHERE KhachHang.idKhachHang = ?
    `;
    const [rows] = await pool.execute(query, [userId]);
    return rows[0];
};

const updateUser = async (userId, userData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Cập nhật thông tin trong bảng KhachHang
        await connection.execute(`
            UPDATE KhachHang 
            SET hoTen = ?, email = ?, soDienThoai = ?
            WHERE idKhachHang = ?
        `, [userData.hoTen, userData.email, userData.soDienThoai, userId]);

        // Cập nhật thông tin trong bảng TaiKhoan
        await connection.execute(`
            UPDATE TaiKhoan 
            SET quyenHan = ?, trangThai = ?
            WHERE idKhachHang = ?
        `, [userData.quyenHan, userData.trangThai, userId]);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const deleteUser = async (userId) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Xóa tài khoản trước vì có khóa ngoại
        await connection.execute(`
            DELETE FROM TaiKhoan WHERE idKhachHang = ?
        `, [userId]);

        // Sau đó xóa thông tin khách hàng
        await connection.execute(`
            DELETE FROM KhachHang WHERE idKhachHang = ?
        `, [userId]);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const addUser = async (userData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        await connection.execute(`
            INSERT INTO KhachHang (hoTen, email, soDienThoai, diaChi)
            VALUES (?, ?, ?, ?)
        `, [userData.hoTen, userData.email, userData.soDienThoai, userData.diaChi]);

        await connection.execute(`
            INSERT INTO TaiKhoan (idKhachHang, tenDangNhap, matKhau, quyenHan)
            VALUES (?, ?, ?, ?)
        `, [userData.idKhachHang, userData.tenDangNhap, userData.matKhau, userData.quyenHan]);

        await connection.commit();

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

const createHotel = async (hotelData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query(`
            INSERT INTO KhachSan (tenKhachSan, phuong, quan, thanhPho, idDiaDiem, hinhAnh)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            hotelData.tenKhachSan, 
            hotelData.phuong, 
            hotelData.quan, 
            hotelData.thanhPho, 
            hotelData.idDiaDiem,
            hotelData.hinhAnh
        ]);
        
        await connection.commit();
        return { idKhachSan: result.insertId, ...hotelData };
    } catch (error) {
        await connection.rollback();
        console.error('Lỗi khi tạo khách sạn:', error);
        throw error;
    } finally {
        connection.release();
    }
};

const updateHotel = async (idKhachSan, hotelData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        let query = `
            UPDATE KhachSan 
            SET tenKhachSan = ?, phuong = ?, quan = ?, thanhPho = ?, idDiaDiem = ?
        `;
        let params = [
            hotelData.tenKhachSan, 
            hotelData.phuong, 
            hotelData.quan, 
            hotelData.thanhPho, 
            hotelData.idDiaDiem
        ];

        // Chỉ cập nhật hình ảnh nếu có file mới
        if (hotelData.hinhAnh) {
            query += `, hinhAnh = ?`;
            params.push(hotelData.hinhAnh);
        }

        query += ` WHERE idKhachSan = ?`;
        params.push(idKhachSan);

        await connection.query(query, params);
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error('Lỗi khi cập nhật khách sạn:', error);
        throw error;
    } finally {
        connection.release();
    }
};

const deleteHotel = async (idKhachSan) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Kiểm tra xem có phòng nào trong khách sạn không
        const [rooms] = await connection.query('SELECT * FROM Phong WHERE idKhachSan = ?', [idKhachSan]);
        if (rooms.length > 0) {
            throw new Error('Không thể xóa khách sạn vì còn phòng liên kết');
        }
        
        await connection.query('DELETE FROM KhachSan WHERE idKhachSan = ?', [idKhachSan]);
        
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error('Lỗi khi xóa khách sạn:', error);
        throw error;
    } finally {
        connection.release();
    }
};

const createBooking = async (bookingData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Kiểm tra xem phòng có trống trong khoảng thời gian này không
        const [existingBookings] = await connection.query(`
            SELECT * FROM DatPhong 
            WHERE idPhong = ? 
            AND trangThai = 1
            AND ((ngayBatDau BETWEEN ? AND ?) 
            OR (ngayKetThuc BETWEEN ? AND ?)
            OR (ngayBatDau <= ? AND ngayKetThuc >= ?))
        `, [
            bookingData.idPhong, 
            bookingData.ngayBatDau, bookingData.ngayKetThuc,
            bookingData.ngayBatDau, bookingData.ngayKetThuc,
            bookingData.ngayBatDau, bookingData.ngayKetThuc
        ]);

        if (existingBookings.length > 0) {
            throw new Error('Phòng đã được đặt trong khoảng thời gian này');
        }

        // Thêm đặt phòng mới
        const [result] = await connection.query(`
            INSERT INTO DatPhong (idPhong, idKhachHang, ngayBatDau, ngayKetThuc, trangThai)
            VALUES (?, ?, ?, ?, ?)
        `, [
            bookingData.idPhong,
            bookingData.idKhachHang,
            bookingData.ngayBatDau,
            bookingData.ngayKetThuc,
            bookingData.trangThai
        ]);

        // Thêm vào lịch sử đặt phòng
        await connection.query(`
            INSERT INTO LichSuDatPhong (idDatPhong, idKhachHang, trangThai, ghiChu)
            VALUES (?, ?, ?, ?)
        `, [
            result.insertId,
            bookingData.idKhachHang,
            'dat',
            'Đặt phòng thành công'
        ]);

        await connection.commit();
        return { idDatPhong: result.insertId, ...bookingData };
    } catch (error) {
        await connection.rollback();
        throw error;
    } 
};

const updateBooking = async (idDatPhong, bookingData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Kiểm tra xem phòng có trống trong khoảng thời gian mới không (trừ booking hiện tại)
        const [existingBookings] = await connection.query(`
            SELECT * FROM DatPhong 
            WHERE idPhong = ? 
            AND idDatPhong != ?
            AND trangThai = 1
            AND ((ngayBatDau BETWEEN ? AND ?) 
            OR (ngayKetThuc BETWEEN ? AND ?)
            OR (ngayBatDau <= ? AND ngayKetThuc >= ?))
        `, [
            bookingData.idPhong,
            idDatPhong,
            bookingData.ngayBatDau, bookingData.ngayKetThuc,
            bookingData.ngayBatDau, bookingData.ngayKetThuc,
            bookingData.ngayBatDau, bookingData.ngayKetThuc
        ]);

        if (existingBookings.length > 0) {
            throw new Error('Phòng đã được đặt trong khoảng thời gian này');
        }

        // Lấy thông tin booking hiện tại
        const [currentBooking] = await connection.query(
            'SELECT trangThai FROM DatPhong WHERE idDatPhong = ?',
            [idDatPhong]
        );

        // Chỉ cập nhật nếu trạng thái thực sự thay đổi hoặc các thông tin khác thay đổi
        if (currentBooking[0].trangThai !== bookingData.trangThai || 
            bookingData.idPhong || bookingData.ngayBatDau || bookingData.ngayKetThuc) {
            
            // Cập nhật đặt phòng
            await connection.query(`
                UPDATE DatPhong 
                SET idPhong = ?, 
                    idKhachHang = ?, 
                    ngayBatDau = ?, 
                    ngayKetThuc = ?, 
                    trangThai = ?
                WHERE idDatPhong = ?
            `, [
                bookingData.idPhong,
                bookingData.idKhachHang,
                bookingData.ngayBatDau,
                bookingData.ngayKetThuc,
                bookingData.trangThai,
                idDatPhong
            ]);

            // Xác định trạng thái cho LichSuDatPhong
            let trangThaiText;
            switch(parseInt(bookingData.trangThai)) {
                case 0: trangThaiText = 'huy'; break;
                case 1: trangThaiText = 'dat'; break;
                case 2: trangThaiText = 'hoanthanh'; break;
                case 3: trangThaiText = 'noshow'; break;
                default: trangThaiText = 'dat';
            }

            // Thêm vào lịch sử đặt phòng
            await connection.query(`
                INSERT INTO LichSuDatPhong (idDatPhong, idKhachHang, trangThai, ghiChu)
                VALUES (?, ?, ?, ?)
            `, [
                idDatPhong,
                bookingData.idKhachHang,
                trangThaiText,
                'Cập nhật đặt phòng'
            ]);
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const deleteBooking = async (idDatPhong) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Xóa lịch sử đặt phòng trước
        await connection.query('DELETE FROM LichSuDatPhong WHERE idDatPhong = ?', [idDatPhong]);
        
        // Sau đó xóa đặt phòng
        await connection.query('DELETE FROM DatPhong WHERE idDatPhong = ?', [idDatPhong]);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } 
};

// Kiểm tra xem đã checkin chưa
const checkIfAlreadyCheckedIn = async (idDatPhong) => {
    try {
        const [result] = await pool.query(`
            SELECT * FROM LichSuDatPhong 
            WHERE idDatPhong = ? AND ghiChu = 'Khách hàng đã checkin'
        `, [idDatPhong]);
        
        return result.length > 0;
    } catch (error) {
        console.error('Error checking checkin status:', error);
        throw error;
    }
};

// Xác nhận khách hàng đã checkin
const confirmCheckin = async (idDatPhong) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Kiểm tra xem đã checkin chưa
        const alreadyCheckedIn = await checkIfAlreadyCheckedIn(idDatPhong);
        if (alreadyCheckedIn) {
            throw new Error('Khách hàng đã checkin trước đó');
        }

        // Lấy thông tin đặt phòng
        const [bookingInfo] = await connection.query(`
            SELECT idKhachHang, trangThai, ngayBatDau, ngayKetThuc
            FROM DatPhong 
            WHERE idDatPhong = ?
        `, [idDatPhong]);

        if (!bookingInfo.length) {
            throw new Error('Không tìm thấy thông tin đặt phòng');
        }

        const booking = bookingInfo[0];
        
        // Kiểm tra nếu đặt phòng đã bị hủy hoặc đã hoàn thành
        if (booking.trangThai === 0) {
            throw new Error('Không thể xác nhận checkin cho đặt phòng đã bị hủy');
        }
        
        if (booking.trangThai === 2) {
            throw new Error('Đặt phòng này đã hoàn thành (đã checkout)');
        }
        
        // Thêm vào lịch sử
        await connection.query(`
            INSERT INTO LichSuDatPhong (idDatPhong, idKhachHang, trangThai, ghiChu)
            VALUES (?, ?, ?, ?)
        `, [idDatPhong, booking.idKhachHang, 'dat', 'Khách hàng đã checkin']);

        await connection.commit();
        return { success: true };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Lấy thống kê doanh thu theo từng tháng trong năm hiện tại
const getMonthlyRevenue = async (year = new Date().getFullYear()) => {
    try {
        const [results] = await pool.query(`
            SELECT 
                MONTH(dp.ngayBatDau) as month,
                SUM(dp.thanhTien) as revenue
            FROM DatPhong dp
            WHERE YEAR(dp.ngayBatDau) = ? 
            AND dp.trangThai IN (1, 2) 
            GROUP BY MONTH(dp.ngayBatDau)
            ORDER BY month
        `, [year]);

        // Tạo mảng doanh thu cho 12 tháng, với giá trị mặc định là 0
        const monthlyRevenue = Array(12).fill(0);
        
        // Cập nhật giá trị doanh thu cho các tháng có dữ liệu
        results.forEach(item => {
            monthlyRevenue[item.month - 1] = parseFloat(item.revenue || 0);
        });
        
        return monthlyRevenue;
    } catch (error) {
        console.error('Error in getMonthlyRevenue:', error);
        throw error;
    }
};

// Lấy thống kê số lượng đặt phòng theo từng tháng trong năm hiện tại
const getMonthlyBookings = async (year = new Date().getFullYear()) => {
    try {
        const [results] = await pool.query(`
            SELECT 
                MONTH(dp.ngayBatDau) as month,
                COUNT(*) as count
            FROM DatPhong dp
            WHERE YEAR(dp.ngayBatDau) = ?
            GROUP BY MONTH(dp.ngayBatDau)
            ORDER BY month
        `, [year]);

        // Tạo mảng số lượng đặt phòng cho 12 tháng, với giá trị mặc định là 0
        const monthlyBookings = Array(12).fill(0);
        
        // Cập nhật giá trị số lượng đặt phòng cho các tháng có dữ liệu
        results.forEach(item => {
            monthlyBookings[item.month - 1] = parseInt(item.count || 0);
        });
        
        return monthlyBookings;
    } catch (error) {
        console.error('Error in getMonthlyBookings:', error);
        throw error;
    }
};

// Lấy thống kê số lượng đặt phòng theo trạng thái
const getBookingsByStatus = async () => {
    try {
        const [results] = await pool.query(`
            SELECT 
                trangThai,
                COUNT(*) as count
            FROM DatPhong
            GROUP BY trangThai
        `);
        
        // Tạo đối tượng chứa số lượng đặt phòng theo trạng thái
        const bookingsByStatus = {
            cancelled: 0,   // Đã hủy (trangThai = 0)
            active: 0,      // Đang hoạt động (trangThai = 1)
            completed: 0,   // Đã hoàn thành (trangThai = 2)
            noShow: 0       // Không checkin (trangThai = 3)
        };
        
        // Cập nhật giá trị số lượng đặt phòng theo trạng thái
        results.forEach(item => {
            switch (item.trangThai) {
                case 0:
                    bookingsByStatus.cancelled = parseInt(item.count || 0);
                    break;
                case 1:
                    bookingsByStatus.active = parseInt(item.count || 0);
                    break;
                case 2:
                    bookingsByStatus.completed = parseInt(item.count || 0);
                    break;
                case 3:
                    bookingsByStatus.noShow = parseInt(item.count || 0);
                    break;
            }
        });
        
        return bookingsByStatus;
    } catch (error) {
        console.error('Error in getBookingsByStatus:', error);
        throw error;
    }
};

// Dự đoán doanh thu và số lượng đặt phòng cho 3 tháng tiếp theo
const getPredictions = async () => {
    try {
        // Lấy dữ liệu doanh thu và số lượng đặt phòng trong 12 tháng gần nhất
        const monthlyRevenue = await getMonthlyRevenue();
        const monthlyBookings = await getMonthlyBookings();
        
        // Lấy 6 tháng gần đây để dự đoán
        const recentMonths = 6;
        const currentMonth = new Date().getMonth(); // 0-11
        
        // Tính toán các tháng để lấy dữ liệu (6 tháng gần đây)
        const recentRevenue = [];
        const recentBookings = [];
        
        for (let i = 0; i < recentMonths; i++) {
            const monthIndex = (currentMonth - i + 12) % 12; // Để xử lý qua năm
            recentRevenue.unshift(monthlyRevenue[monthIndex]);
            recentBookings.unshift(monthlyBookings[monthIndex]);
        }
        
        // Dự đoán đơn giản: Tính trung bình và tăng 5% cho mỗi tháng
        const avgRevenue = recentRevenue.reduce((sum, val) => sum + val, 0) / recentRevenue.length;
        const avgBookings = recentBookings.reduce((sum, val) => sum + val, 0) / recentBookings.length;
        
        // Dự đoán cho 3 tháng tiếp theo
        const predictions = {
            revenue: [],
            bookings: []
        };
        
        for (let i = 1; i <= 3; i++) {
            predictions.revenue.push(Math.round(avgRevenue * (1 + 0.05 * i)));
            predictions.bookings.push(Math.round(avgBookings * (1 + 0.05 * i)));
        }
        
        return predictions;
    } catch (error) {
        console.error('Error in getPredictions:', error);
        throw error;
    }
};

// Tìm kiếm khách hàng theo số điện thoại
const searchCustomerByPhone = async (phoneNumber) => {
    try {
        const query = `
            SELECT KhachHang.*, TaiKhoan.quyenHan
            FROM KhachHang
            LEFT JOIN TaiKhoan ON KhachHang.idKhachHang = TaiKhoan.idKhachHang
            WHERE KhachHang.soDienThoai LIKE ?
        `;
        const [customers] = await pool.execute(query, [`%${phoneNumber}%`]);
        return customers;
    } catch (error) {
        console.error('Error in searchCustomerByPhone:', error);
        throw error;
    }
};

module.exports = {
    getAllUsers,
    getAllHotels,
    getAllBookings,
    checkLogin,
    getUserById,
    updateUser,
    deleteUser,
    addUser,
    createHotel,
    updateHotel,
    deleteHotel,
    createBooking,
    updateBooking,
    deleteBooking,
    checkIfAlreadyCheckedIn,
    confirmCheckin,
    getMonthlyRevenue,
    getMonthlyBookings,
    getBookingsByStatus,
    getPredictions,
    searchCustomerByPhone
};