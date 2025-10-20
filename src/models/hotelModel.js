const pool = require('../utils/connectDB');

const getAll = async () => {
    const [rows] = await pool.query(`
        SELECT ks.*, dd.tenDiaDiem, ks.hinhAnh
        FROM KhachSan ks
        JOIN DiaDiem dd ON ks.idDiaDiem = dd.idDiaDiem
        ORDER BY ks.idKhachSan DESC
    `);
    return rows;
};

// lấy tiện nghi luôn
const findById = async (idKhachSan) => {
    try {
        const [hotels] = await pool.query(`
            SELECT 
                ks.*, 
                dd.tenDiaDiem,
                ks.hinhAnh,
                CONCAT(ks.phuong, ', ', ks.quan, ', ', ks.thanhPho) as diaChi
            FROM KhachSan ks
            JOIN DiaDiem dd ON ks.idDiaDiem = dd.idDiaDiem
            WHERE ks.idKhachSan = ?
        `, [idKhachSan]);

        if (hotels.length === 0) return null;

        const hotel = hotels[0];

        const [rooms] = await pool.query(`
            SELECT 
                p.idPhong,
                p.giaPhong,
                p.trangThai,
                lp.tenLoaiPhong as loaiPhong,
                GROUP_CONCAT(tn.tenTienNghi) as tienNghi
            FROM Phong p
            JOIN LoaiPhong lp ON p.idLoaiPhong = lp.idLoaiPhong
            LEFT JOIN Phong_TienNghi ptn ON p.idPhong = ptn.idPhong
            LEFT JOIN TienNghi tn ON ptn.idTienNghi = tn.idTienNghi
            WHERE p.idKhachSan = ?
            GROUP BY p.idPhong
        `, [idKhachSan]);

        hotel.rooms = rooms.map(room => ({
            ...room,
            tienNghi: room.tienNghi ? room.tienNghi.split(',') : []
        }));
        return hotel;
    } catch (error) {
        console.error('Error in findById:', error);
        throw error;
    }
};

const create = async (hotelData) => {
    const [result] = await pool.query(
        'INSERT INTO KhachSan (tenKhachSan, diaChi, idDiaDiem) VALUES (?, ?, ?)',
        [hotelData.tenKhachSan, hotelData.diaChi, hotelData.idDiaDiem]
    );
    return { id: result.insertId, ...hotelData };
};

const update = async (idKhachSan, updateData) => {
    const [result] = await pool.query(
        'UPDATE KhachSan SET ? WHERE idKhachSan = ?',
        [updateData, idKhachSan]
    );
    return result.affectedRows > 0 ? findById(idKhachSan) : null;
};

const deleteHotel = async (idKhachSan) => {
    const [result] = await pool.query(
        'DELETE FROM KhachSan WHERE idKhachSan = ?',
        [idKhachSan]
    );
    return result.affectedRows > 0;
};

const findAll = async () => {
    try {
        const [hotels] = await pool.query(`
            SELECT 
                ks.*,
                dd.tenDiaDiem,
                CONCAT(ks.phuong, ', ', ks.quan, ', ', ks.thanhPho) as diaChi,
                MIN(p.giaPhong) as giaPhong,
                ks.hinhAnh
            FROM KhachSan ks
            JOIN DiaDiem dd ON ks.idDiaDiem = dd.idDiaDiem
            LEFT JOIN Phong p ON ks.idKhachSan = p.idKhachSan
            GROUP BY ks.idKhachSan
            ORDER BY ks.idKhachSan
        `);
        return hotels;
    } catch (error) {
        console.error('Error in findAll:', error);
        throw error;
    }
};

module.exports = {
    getAll,
    findById,
    create,
    update,
    delete: deleteHotel,
    findAll
};