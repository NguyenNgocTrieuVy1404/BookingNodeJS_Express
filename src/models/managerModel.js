const pool = require('../utils/connectDB');
const bcrypt = require('bcrypt');

// Lấy thống kê cho dashboard
const getStats = async (idDiaDiem) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM Phong p 
                 JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan 
                 WHERE ks.idDiaDiem = ?) as totalRooms,
                 
                (SELECT COUNT(*) FROM DatPhong dp 
                 JOIN Phong p ON dp.idPhong = p.idPhong
                 JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
                 WHERE ks.idDiaDiem = ? AND dp.trangThai = 1) as activeBookings,
                 
                (SELECT COUNT(*) FROM DatPhong dp 
                 JOIN Phong p ON dp.idPhong = p.idPhong
                 JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
                 WHERE ks.idDiaDiem = ? AND dp.trangThai = 2) as completedBookings,
                 
                (SELECT COUNT(*) FROM DatPhong dp 
                 JOIN Phong p ON dp.idPhong = p.idPhong
                 JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
                 WHERE ks.idDiaDiem = ? AND dp.trangThai = 0) as cancelledBookings,
                 
                (SELECT COUNT(*) FROM DatPhong dp 
                 JOIN Phong p ON dp.idPhong = p.idPhong
                 JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
                 WHERE ks.idDiaDiem = ? AND dp.trangThai = 3) as noShowBookings,
                 
                (SELECT SUM(dp.thanhTien) 
                 FROM DatPhong dp 
                 JOIN Phong p ON dp.idPhong = p.idPhong
                 JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
                 WHERE ks.idDiaDiem = ? 
                 AND MONTH(dp.ngayBatDau) = MONTH(CURRENT_DATE())
                 AND dp.trangThai IN (1, 2)) as monthlyRevenue
        `, [idDiaDiem, idDiaDiem, idDiaDiem, idDiaDiem, idDiaDiem, idDiaDiem]);
        
        console.log(`Thống kê cho khu vực ${idDiaDiem}:`, stats[0]);
        return stats[0];
    } catch (error) {
        console.error('Error in getStats:', error);
        throw error;
    }
};

// Thêm hàm lấy dữ liệu đặt phòng theo tháng cho biểu đồ đường
const getMonthlyBookingStats = async (idDiaDiem, year = new Date().getFullYear()) => {
    try {
        const [results] = await pool.query(`
            SELECT 
                MONTH(dp.ngayBatDau) as month,
                COUNT(*) as count
            FROM DatPhong dp
            JOIN Phong p ON dp.idPhong = p.idPhong
            JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
            WHERE ks.idDiaDiem = ? AND YEAR(dp.ngayBatDau) = ?
            GROUP BY MONTH(dp.ngayBatDau)
            ORDER BY month
        `, [idDiaDiem, year]);

        // Tạo mảng cho 12 tháng
        const monthlyData = Array(12).fill(0);
        
        // Cập nhật dữ liệu cho các tháng có booking
        results.forEach(item => {
            monthlyData[item.month - 1] = parseInt(item.count || 0);
        });
        
        return monthlyData;
    } catch (error) {
        console.error('Error in getMonthlyBookingStats:', error);
        throw error;
    }
};

// Lấy danh sách phòng
const getAllRooms = async () => {
    try {
        const [rooms] = await pool.query(`
            SELECT p.*, lp.tenLoaiPhong, ks.tenKhachSan,
                   GROUP_CONCAT(tn.tenTienNghi) as tienNghi
            FROM Phong p
            JOIN LoaiPhong lp ON p.idLoaiPhong = lp.idLoaiPhong
            JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
            LEFT JOIN Phong_TienNghi ptn ON p.idPhong = ptn.idPhong
            LEFT JOIN TienNghi tn ON ptn.idTienNghi = tn.idTienNghi
            GROUP BY p.idPhong
        `);
        return rooms;
    } catch (error) {
        console.error('Error in getAllRooms:', error);
        throw error;
    }
};

// Tạo phòng mới
const createRoom = async (roomData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query(`
            INSERT INTO Phong (idKhachSan, idLoaiPhong, giaPhong, trangThai)
            VALUES (?, ?, ?, ?)
        `, [roomData.idKhachSan, roomData.idLoaiPhong, roomData.giaPhong, roomData.trangThai]);

        await connection.commit();
        return { idPhong: result.insertId, ...roomData };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Cập nhật phòng
const updateRoom = async (idPhong, updateData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(`
            UPDATE Phong 
            SET idLoaiPhong = ?, giaPhong = ?, trangThai = ?
            WHERE idPhong = ?
        `, [updateData.idLoaiPhong, updateData.giaPhong, updateData.trangThai, idPhong]);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Lấy danh sách đặt phòng
const getAllBookings = async () => {
    try {
        const [bookings] = await pool.query(`
            SELECT dp.*, kh.hoTen, p.idPhong, ks.tenKhachSan,
                   lp.tenLoaiPhong, p.giaPhong
            FROM DatPhong dp
            JOIN KhachHang kh ON dp.idKhachHang = kh.idKhachHang
            JOIN Phong p ON dp.idPhong = p.idPhong
            JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
            JOIN LoaiPhong lp ON p.idLoaiPhong = lp.idLoaiPhong
            ORDER BY dp.idDatPhong ASC
        `);
        return bookings;
    } catch (error) {
        console.error('Error in getAllBookings:', error);
        throw error;
    }
};

// Cập nhật đặt phòng
const updateBooking = async (idDatPhong, updateData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Lấy thông tin khách hàng từ đặt phòng
        const [bookingInfo] = await connection.query(`
            SELECT idKhachHang FROM DatPhong WHERE idDatPhong = ?
        `, [idDatPhong]);

        if (!bookingInfo.length) {
            throw new Error('Không tìm thấy thông tin đặt phòng');
        }

        const { idKhachHang } = bookingInfo[0];

        // Cập nhật trạng thái đặt phòng
        await connection.query(`
            UPDATE DatPhong 
            SET trangThai = ?
            WHERE idDatPhong = ?
        `, [updateData.trangThai, idDatPhong]);

        // Thêm vào lịch sử
        let trangThaiText;
        switch(parseInt(updateData.trangThai)) {
            case 0: trangThaiText = 'huy'; break;
            case 1: trangThaiText = 'dat'; break;
            case 2: trangThaiText = 'hoanthanh'; break;
            case 3: trangThaiText = 'noshow'; break;
            default: trangThaiText = 'dat';
        }

        await connection.query(`
            INSERT INTO LichSuDatPhong (idDatPhong, idKhachHang, trangThai, ghiChu)
            VALUES (?, ?, ?, ?)
        `, [idDatPhong, idKhachHang, trangThaiText, 'Cập nhật trạng thái đặt phòng']);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Lấy danh sách tiện nghi
const getAllAmenities = async () => {
    try {
        const [amenities] = await pool.query(`
            SELECT tn.*, COUNT(pt.idPhong) as totalRooms
            FROM TienNghi tn
            LEFT JOIN Phong_TienNghi pt ON tn.idTienNghi = pt.idTienNghi
            GROUP BY tn.idTienNghi
        `);
        return amenities;
    } catch (error) {
        console.error('Error in getAllAmenities:', error);
        throw error;
    }
};

// Thêm tiện nghi cho phòng
const addAmenityToRoom = async (idPhong, idTienNghi) => {
    try {
        await pool.query(`
            INSERT INTO Phong_TienNghi (idPhong, idTienNghi)
            VALUES (?, ?)
        `, [idPhong, idTienNghi]);
    } catch (error) {
        console.error('Error in addAmenityToRoom:', error);
        throw error;
    }
};

// Xóa tiện nghi khỏi phòng
const removeAmenityFromRoom = async (idPhong, idTienNghi) => {
    try {
        await pool.query(`
            DELETE FROM Phong_TienNghi
            WHERE idPhong = ? AND idTienNghi = ?
        `, [idPhong, idTienNghi]);
    } catch (error) {
        console.error('Error in removeAmenityFromRoom:', error);
        throw error;
    }
};

// Lấy đặt phòng gần đây
const getRecentBookings = async () => {
    try {
        const [bookings] = await pool.query(`
            SELECT 
                dp.idDatPhong,
                dp.idPhong,
                dp.ngayBatDau,
                dp.ngayKetThuc,
                dp.trangThai,
                kh.hoTen,
                ks.tenKhachSan
            FROM DatPhong dp
            JOIN KhachHang kh ON dp.idKhachHang = kh.idKhachHang
            JOIN Phong p ON dp.idPhong = p.idPhong
            JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
            ORDER BY dp.idDatPhong ASC
        `);
        return bookings;
    } catch (error) {
        console.error('Error in getRecentBookings:', error);
        throw error;
    }
};

const checkLogin = async (tenDangNhap, matKhau) => {
    try {
        const queryCheck = `
            SELECT TaiKhoan.*, KhachHang.*, DiaDiem.tenDiaDiem
            FROM TaiKhoan
            LEFT JOIN KhachHang ON TaiKhoan.idKhachHang = KhachHang.idKhachHang
            LEFT JOIN DiaDiem ON TaiKhoan.idDiaDiem = DiaDiem.idDiaDiem
            WHERE TaiKhoan.tenDangNhap = ?
            AND TaiKhoan.quyenHan = 'manager'
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

const toggleRoomStatus = async (idPhong) => {
    try {
        const [room] = await pool.query(
            'SELECT trangThai FROM Phong WHERE idPhong = ?', 
            [idPhong]
        );

        if (!room[0]) {
            throw new Error('Không tìm thấy phòng');
        }

        // Đảo ngược trạng thái
        const newStatus = room[0].trangThai === 1 ? 0 : 1;

        // Cập nhật trạng thái mới
        await pool.query(
            'UPDATE Phong SET trangThai = ? WHERE idPhong = ?',
            [newStatus, idPhong]
        );

        return { success: true };
    } catch (error) {
        console.error('Error in toggleRoomStatus:', error);
        throw error;
    }
};

async function addAmenity(tenTienNghi) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Kiểm tra tiện nghi đã tồn tại chưa
        const [existing] = await connection.query(
            'SELECT * FROM TienNghi WHERE tenTienNghi = ?',
            [tenTienNghi]
        );

        if (existing.length > 0) {
            throw new Error('Tiện nghi này đã tồn tại');
        }

        // Thêm tiện nghi mới
        const [result] = await connection.query(
            'INSERT INTO TienNghi (tenTienNghi) VALUES (?)',
            [tenTienNghi]
        );

        await connection.commit();
        return {
            idTienNghi: result.insertId,
            tenTienNghi
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function deleteAmenity(idTienNghi) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Kiểm tra tiện nghi tồn tại
        const [amenity] = await connection.query(
            'SELECT * FROM TienNghi WHERE idTienNghi = ?',
            [idTienNghi]
        );

        if (!amenity.length) {
            throw new Error('Không tìm thấy tiện nghi');
        }

        // Kiểm tra có phòng nào đang dùng
        const [usedRooms] = await connection.query(
            'SELECT COUNT(*) as count FROM Phong_TienNghi WHERE idTienNghi = ?',
            [idTienNghi]
        );

        if (usedRooms[0].count > 0) {
            throw new Error('Không thể xóa tiện nghi đang được sử dụng bởi phòng');
        }

        // Thực hiện xóa
        await connection.query(
            'DELETE FROM TienNghi WHERE idTienNghi = ?',
            [idTienNghi]
        );

        await connection.commit();
        return true;

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// Cập nhật thông tin tiện nghi
async function editAmenity(idTienNghi, tenTienNghi) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Kiểm tra tiện nghi tồn tại
        const [amenity] = await connection.query(
            'SELECT * FROM TienNghi WHERE idTienNghi = ?',
            [idTienNghi]
        );

        if (!amenity.length) {
            throw new Error('Không tìm thấy tiện nghi');
        }

        // Kiểm tra tên tiện nghi trùng
        const [existing] = await connection.query(
            'SELECT * FROM TienNghi WHERE tenTienNghi = ? AND idTienNghi != ?',
            [tenTienNghi, idTienNghi]
        );

        if (existing.length > 0) {
            throw new Error('Tên tiện nghi này đã tồn tại');
        }

        // Thực hiện cập nhật
        await connection.query(
            'UPDATE TienNghi SET tenTienNghi = ? WHERE idTienNghi = ?',
            [tenTienNghi, idTienNghi]
        );

        await connection.commit();
        return {
            idTienNghi,
            tenTienNghi
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// Lấy thông tin chi tiết phòng
const getRoomById = async (idPhong) => {
    try {
        const [rooms] = await pool.query(`
            SELECT p.*, lp.tenLoaiPhong, ks.tenKhachSan
            FROM Phong p
            JOIN LoaiPhong lp ON p.idLoaiPhong = lp.idLoaiPhong
            JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
            WHERE p.idPhong = ?
        `, [idPhong]);
        
        if (rooms.length === 0) {
            throw new Error('Không tìm thấy phòng');
        }
        
        return rooms[0];
    } catch (error) {
        console.error('Error in getRoomById:', error);
        throw error;
    }
};

// Lấy danh sách tiện nghi của phòng
const getRoomAmenities = async (idPhong) => {
    const connection = await pool.getConnection();
    try {
        const [amenities] = await connection.query(`
            SELECT tn.*
            FROM Phong_TienNghi ptn
            JOIN TienNghi tn ON ptn.idTienNghi = tn.idTienNghi
            WHERE ptn.idPhong = ?
        `, [idPhong]);
        
        console.log(`Tìm thấy ${amenities.length} tiện nghi cho phòng ${idPhong}`);
        return amenities;
    } catch (error) {
        console.error('Error in getRoomAmenities:', error);
        throw error;
    } finally {
        connection.release();
    }
};

// Lấy danh sách tiện nghi chưa có của phòng
const getAvailableAmenities = async (idPhong) => {
    try {
        const [amenities] = await pool.query(`
            SELECT tn.*
            FROM TienNghi tn
            WHERE tn.idTienNghi NOT IN (
                SELECT ptn.idTienNghi
                FROM Phong_TienNghi ptn
                WHERE ptn.idPhong = ?
            )
        `, [idPhong]);
        
        return amenities;
    } catch (error) {
        console.error('Error in getAvailableAmenities:', error);
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

// Lấy danh sách phòng theo khu vực
const getRoomsByArea = async (idDiaDiem) => {
    try {
        const [rooms] = await pool.query(`
            SELECT p.*, lp.tenLoaiPhong, ks.tenKhachSan,
                   GROUP_CONCAT(tn.tenTienNghi) as tienNghi
            FROM Phong p
            JOIN LoaiPhong lp ON p.idLoaiPhong = lp.idLoaiPhong
            JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
            LEFT JOIN Phong_TienNghi ptn ON p.idPhong = ptn.idPhong
            LEFT JOIN TienNghi tn ON ptn.idTienNghi = tn.idTienNghi
            WHERE ks.idDiaDiem = ?
            GROUP BY p.idPhong
        `, [idDiaDiem]);
        return rooms;
    } catch (error) {
        console.error('Error in getRoomsByArea:', error);
        throw error;
    }
};

// Lấy danh sách khách sạn theo khu vực
const getHotelsByArea = async (idDiaDiem) => {
    try {
        const [hotels] = await pool.query(`
            SELECT * FROM KhachSan 
            WHERE idDiaDiem = ?
            ORDER BY tenKhachSan ASC
        `, [idDiaDiem]);
        return hotels;
    } catch (error) {
        console.error('Error in getHotelsByArea:', error);
        throw error;
    }
};

// Lấy danh sách đặt phòng theo khu vực
const getBookingsByArea = async (idDiaDiem) => {
    try {
        const [bookings] = await pool.query(`
            SELECT dp.*, kh.hoTen, p.idPhong, ks.tenKhachSan,
                   lp.tenLoaiPhong, p.giaPhong
            FROM DatPhong dp
            JOIN KhachHang kh ON dp.idKhachHang = kh.idKhachHang
            JOIN Phong p ON dp.idPhong = p.idPhong
            JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
            JOIN LoaiPhong lp ON p.idLoaiPhong = lp.idLoaiPhong
            WHERE ks.idDiaDiem = ?
            ORDER BY dp.idDatPhong ASC
        `, [idDiaDiem]);
        return bookings;
    } catch (error) {
        console.error('Error in getBookingsByArea:', error);
        throw error;
    }
};

// Kiểm tra quyền quản lý phòng
const checkRoomBelongsToArea = async (idPhong, idDiaDiem) => {
    try {
        const [result] = await pool.query(`
            SELECT COUNT(*) as count
            FROM Phong p
            JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
            WHERE p.idPhong = ? AND ks.idDiaDiem = ?
        `, [idPhong, idDiaDiem]);
        
        return result[0].count > 0;
    } catch (error) {
        console.error('Error in checkRoomBelongsToArea:', error);
        throw error;
    }
};

// Kiểm tra quyền quản lý đặt phòng
const checkBookingBelongsToArea = async (idDatPhong, idDiaDiem) => {
    try {
        const [result] = await pool.query(`
            SELECT COUNT(*) as count
            FROM DatPhong dp
            JOIN Phong p ON dp.idPhong = p.idPhong
            JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
            WHERE dp.idDatPhong = ? AND ks.idDiaDiem = ?
        `, [idDatPhong, idDiaDiem]);
        
        return result[0].count > 0;
    } catch (error) {
        console.error('Error in checkBookingBelongsToArea:', error);
        throw error;
    }
};

module.exports = {
    getStats,
    getMonthlyBookingStats,
    getAllRooms,
    createRoom,
    updateRoom,
    getAllBookings,
    updateBooking,
    getAllAmenities,
    addAmenityToRoom,
    removeAmenityFromRoom,
    getRecentBookings,
    checkLogin,
    toggleRoomStatus,
    addAmenity,
    deleteAmenity,
    editAmenity,
    getRoomById,
    getRoomAmenities,
    getAvailableAmenities,
    confirmCheckin,
    checkIfAlreadyCheckedIn,
    getRoomsByArea,
    getHotelsByArea,
    getBookingsByArea,
    checkRoomBelongsToArea,
    checkBookingBelongsToArea
}; 