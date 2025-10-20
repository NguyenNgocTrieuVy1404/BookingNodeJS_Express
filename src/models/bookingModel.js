const pool = require('../utils/connectDB');

const findBookingsByRoomId = async (roomId) => {
    try {
        const [bookings] = await pool.query(`
            SELECT * FROM DatPhong 
            WHERE idPhong = ? 
            AND trangThai = 'active'
            AND ngayKetThuc >= CURRENT_DATE()
            ORDER BY ngayBatDau ASC
        `, [roomId]);
        return bookings;
    } catch (error) {
        throw error;
    }
};

const checkRoomAvailability = async (idPhong, ngayBatDau, ngayKetThuc) => {
    try {
        const [bookings] = await pool.query(`
            SELECT * FROM DatPhong 
            WHERE idPhong = ? 
            AND trangThai = 'active'
            AND ngayKetThuc >= ? 
            AND ngayBatDau <= ?
        `, [idPhong, ngayBatDau, ngayKetThuc]);
        
        return bookings.length === 0;
    } catch (error) {
        throw error;
    }
};

class Booking {
    static async findByUserId(idKhachHang) {
        try {
            const [bookings] = await pool.query(`
                SELECT 
                    dp.idPhong,
                    dp.idDatPhong,
                    dp.ngayBatDau,
                    dp.ngayKetThuc,
                    dp.trangThai,
                    dp.donGia,
                    dp.soLuongDem,
                    dp.thanhTien,
                    dp.ngayTao,
                    ks.tenKhachSan,
                    lp.tenLoaiPhong as loaiPhong
                FROM DatPhong dp
                JOIN Phong p ON dp.idPhong = p.idPhong
                JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
                JOIN LoaiPhong lp ON p.idLoaiPhong = lp.idLoaiPhong
                WHERE dp.idKhachHang = ? 
                AND dp.trangThai = 1 
                ORDER BY dp.ngayBatDau DESC
            `, [idKhachHang]);
            
            return bookings;
        } catch (error) {
            console.error('Error in findByUserId:', error);
            throw error;
        }
    }

    // Tìm một đặt phòng theo ID
    static async findById(idDatPhong) {
        const [rows] = await pool.query(`
            SELECT dp.*, lp.tenLoaiPhong as loaiPhong, 
                   ks.tenKhachSan, 
                   CONCAT_WS(', ', ks.phuong, ks.quan, ks.thanhPho) as diaChi,
                   kh.hoTen, kh.email, kh.soDienThoai
            FROM DatPhong dp
            JOIN Phong p ON dp.idPhong = p.idPhong
            JOIN LoaiPhong lp ON p.idLoaiPhong = lp.idLoaiPhong
            JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
            JOIN KhachHang kh ON dp.idKhachHang = kh.idKhachHang
            WHERE dp.idDatPhong = ?
        `, [idDatPhong]);
        return rows[0];
    }

    // Lấy thông tin phòng và các booking hiện tại
    static async getRoomDetailsWithBookings(idPhong) {
        const connection = await pool.getConnection();
        try {
            // Lấy thông tin phòng
            const [rooms] = await connection.query(`
                SELECT 
                    p.*,
                    lp.tenLoaiPhong as loaiPhong,
                    ks.tenKhachSan,
                    GROUP_CONCAT(tn.tenTienNghi) as tienNghi,
                    CONCAT_WS(', ', ks.phuong, ks.quan, ks.thanhPho) as diaChi
                FROM Phong p
                JOIN LoaiPhong lp ON p.idLoaiPhong = lp.idLoaiPhong
                JOIN KhachSan ks ON p.idKhachSan = ks.idKhachSan
                LEFT JOIN Phong_TienNghi ptn ON p.idPhong = ptn.idPhong
                LEFT JOIN TienNghi tn ON ptn.idTienNghi = tn.idTienNghi
                WHERE p.idPhong = ? AND p.trangThai = 1
                GROUP BY p.idPhong
            `, [idPhong]);

            if (!rooms || rooms.length === 0) {
                throw new Error('Phòng không tồn tại hoặc không hoạt động');
            }

            // Lấy danh sách booking hiện tại của phòng
            const [bookings] = await connection.query(`
                SELECT 
                    idDatPhong,
                    ngayBatDau,
                    ngayKetThuc
                FROM DatPhong 
                WHERE idPhong = ? 
                AND trangThai = 1
                AND ngayKetThuc >= CURRENT_DATE()
                ORDER BY ngayBatDau ASC
            `, [idPhong]);

            return {
                ...rooms[0],
                tienNghi: rooms[0].tienNghi ? rooms[0].tienNghi.split(',') : [],
                bookings: bookings
            };

        } catch (error) {
            console.error('Error in getRoomDetailsWithBookings:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Lấy danh sách phòng theo khách sạn
    static async getRoomsByHotelId(hotelId) {
        try {
            const [rows] = await pool.query(`
                SELECT 
                    p.*,
                    lp.tenLoaiPhong as loaiPhong,
                    GROUP_CONCAT(tn.tenTienNghi) as tienNghi
                FROM Phong p
                JOIN LoaiPhong lp ON p.idLoaiPhong = lp.idLoaiPhong
                LEFT JOIN Phong_TienNghi ptn ON p.idPhong = ptn.idPhong
                LEFT JOIN TienNghi tn ON ptn.idTienNghi = tn.idTienNghi
                WHERE p.idKhachSan = ?
                GROUP BY p.idPhong
            `, [hotelId]);

            return rows.map(room => ({
                ...room,
                tienNghi: room.tienNghi ? room.tienNghi.split(',') : []
            }));
        } catch (error) {
            console.error('Error in getRoomsByHotelId:', error);
            throw error;
        }
    }

    // Tạo booking mới
    static async create(bookingData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Kiểm tra xem phòng có trống trong khoảng thời gian này không
            const [existingBookings] = await connection.query(`
                SELECT * FROM DatPhong 
                WHERE idPhong = ? 
                AND ((ngayBatDau BETWEEN ? AND ?) 
                OR (ngayKetThuc BETWEEN ? AND ?))
                AND trangThai = 1
            `, [
                bookingData.idPhong,
                bookingData.ngayBatDau,
                bookingData.ngayKetThuc,
                bookingData.ngayBatDau,
                bookingData.ngayKetThuc
            ]);

            if (existingBookings.length > 0) {
                throw new Error('Phòng đã được đặt trong khoảng thời gian này');
            }

            // Tạo đặt phòng
            const [roomData] = await connection.query(`
                SELECT giaPhong FROM Phong WHERE idPhong = ?
            `, [bookingData.idPhong]);

            const [result] = await connection.query(`
                INSERT INTO DatPhong (idPhong, idKhachHang, ngayBatDau, ngayKetThuc, donGia, trangThai)
                VALUES (?, ?, ?, ?, ?, 1)
            `, [
                bookingData.idPhong,
                bookingData.idKhachHang,
                bookingData.ngayBatDau,
                bookingData.ngayKetThuc,
                roomData[0].giaPhong
            ]);

            await connection.commit();
            return { idDatPhong: result.insertId, ...bookingData };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Cập nhật đặt phòng
    static async update(idDatPhong, updateData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const setClause = Object.keys(updateData)
                .map(key => `${key} = ?`)
                .join(', ');
            const values = [...Object.values(updateData), idDatPhong];

            await connection.query(
                `UPDATE DatPhong SET ${setClause} WHERE idDatPhong = ?`,
                values
            );

            // Thêm vào lịch sử nếu có thay đổi trạng thái
            if (updateData.trangThai !== undefined) {
                await connection.query(`
                    INSERT INTO LichSuDatPhong (idDatPhong, idKhachHang, trangThai, ghiChu)
                    SELECT ?, idKhachHang, ?, ?
                    FROM DatPhong WHERE idDatPhong = ?
                `, [idDatPhong, updateData.trangThai ? 'dat' : 'huy', updateData.ghiChu || null, idDatPhong]);
            }

            await connection.commit();
            return this.findById(idDatPhong);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Thêm phương thức hủy đặt phòng
    static async cancelBooking(idDatPhong, idKhachHang) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Kiểm tra đặt phòng và quyền hủy
            const [booking] = await connection.query(`
                SELECT dp.*, 
                       DATEDIFF(dp.ngayBatDau, CURDATE()) as daysUntilCheckIn,
                       TIMESTAMPDIFF(HOUR, dp.ngayTao, NOW()) as hoursFromBooking
                FROM DatPhong dp
                WHERE dp.idDatPhong = ? AND dp.idKhachHang = ?
            `, [idDatPhong, idKhachHang]);

            if (!booking[0]) {
                throw new Error('Không tìm thấy đặt phòng hoặc bạn không có quyền hủy');
            }

            // Kiểm tra thời gian hủy
            // Quy tắc 1: Trong vòng 24 giờ sau khi đặt phòng, cho phép hủy bất kỳ lúc nào
            // Quy tắc 2: Sau 24 giờ từ lúc đặt, không cho phép hủy trong vòng 24 giờ trước check-in
            if (booking[0].hoursFromBooking > 24 && booking[0].daysUntilCheckIn < 1) {
                throw new Error('Không thể hủy phòng trong vòng 24 giờ trước thời gian nhận phòng');
            }

            // Cập nhật trạng thái đặt phòng (bỏ ngayCapNhat)
            await connection.query(`
                UPDATE DatPhong 
                SET trangThai = 0
                WHERE idDatPhong = ?
            `, [idDatPhong]);

            // Thêm vào lịch sử
            let ghiChu = 'Khách hàng tự hủy đặt phòng';
            if (booking[0].hoursFromBooking <= 24) {
                ghiChu = 'Khách hàng hủy trong vòng 24 giờ sau khi đặt phòng';
            }
            
            await connection.query(`
                INSERT INTO LichSuDatPhong (idDatPhong, idKhachHang, trangThai, ghiChu)
                VALUES (?, ?, 'huy', ?)
            `, [idDatPhong, idKhachHang, ghiChu]);

            await connection.commit();
            return true;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Cập nhật trạng thái tự động
    static async updateBookingStatuses() {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Lấy danh sách các booking cần cập nhật thành hoàn thành
            const [completedBookings] = await connection.query(`
                SELECT idDatPhong, idKhachHang 
                FROM DatPhong 
                WHERE ngayKetThuc < CURDATE() 
                AND trangThai = 1
            `);

            // Cập nhật trạng thái
            if (completedBookings.length > 0) {
                await connection.query(`
                    UPDATE DatPhong 
                    SET trangThai = 2 
                    WHERE ngayKetThuc < CURDATE() 
                    AND trangThai = 1
                `);

                // Thêm vào lịch sử
                await connection.query(`
                    INSERT INTO LichSuDatPhong (idDatPhong, idKhachHang, trangThai, ghiChu)
                    VALUES ?
                `, [completedBookings.map(booking => [
                    booking.idDatPhong,
                    booking.idKhachHang,
                    'hoanthanh',
                    'Tự động cập nhật - Đã checkout'
                ])]);
            }

            // 2. Lấy danh sách các booking no-show
            const [noShowBookings] = await connection.query(`
                SELECT idDatPhong, idKhachHang 
                FROM DatPhong 
                WHERE ngayBatDau < CURDATE() 
                AND trangThai = 1
            `);

            // Cập nhật trạng thái
            if (noShowBookings.length > 0) {
                await connection.query(`
                    UPDATE DatPhong 
                    SET trangThai = 3 
                    WHERE ngayBatDau < CURDATE() 
                    AND trangThai = 1
                `);

                // Thêm vào lịch sử
                await connection.query(`
                    INSERT INTO LichSuDatPhong (idDatPhong, idKhachHang, trangThai, ghiChu)
                    VALUES ?
                `, [noShowBookings.map(booking => [
                    booking.idDatPhong,
                    booking.idKhachHang,
                    'huy',
                    'Tự động cập nhật - Không checkin'
                ])]);
            }

            await connection.commit();
            return {
                completed: completedBookings.length,
                noShow: noShowBookings.length
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Lấy trạng thái hiện tại của đặt phòng
    static getBookingStatus(booking) {
        const now = new Date();
        const startDate = new Date(booking.ngayBatDau);
        const endDate = new Date(booking.ngayKetThuc);

        if (booking.trangThai === 0) return 'Đã hủy';
        if (booking.trangThai === 2) return 'Đã hoàn thành';
        if (booking.trangThai === 3) return 'Không checkin';
        
        if (now < startDate) return 'Chờ checkin';
        if (now > endDate) return 'Đã checkout';
        return 'Đang ở';
    }

    // Thêm method kiểm tra user có booking không
    static async checkUserHasBookings(idKhachHang) {
        try {
            const [bookings] = await pool.query(`
                SELECT COUNT(*) as count 
                FROM DatPhong 
                WHERE idKhachHang = ? AND trangThai = 1
            `, [idKhachHang]);
            
            return bookings[0].count > 0;
        } catch (error) {
            console.error('Error in checkUserHasBookings:', error);
            throw error;
        }
    }
}

module.exports = Booking;