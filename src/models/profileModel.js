const pool = require('../utils/connectDB');

const findById = async (idKhachHang) => {
    if (!idKhachHang) return null;

    try {
        const [rows] = await pool.query(
            'SELECT hoTen, email, soDienThoai, diaChi FROM KhachHang WHERE idKhachHang = ?',
            [idKhachHang]
        );
        return rows[0]; 
    } catch (err) {
        console.error('Database error:', err);
        throw err;
    }
};

const updatePhoneNumber = async (idKhachHang, soDienThoai) => {
    await pool.query(
        'UPDATE KhachHang SET soDienThoai = ? WHERE idKhachHang = ?',
        [soDienThoai, idKhachHang]
    );
};

const updatePassword = async (idKhachHang, matKhau) => {
    await pool.query(
        'UPDATE TaiKhoan SET matKhau = ? WHERE idKhachHang = ?',
        [matKhau, idKhachHang]
    );
};
const updateAddress = async (idKhachHang, diaChi) => {
    await pool.query(
        'UPDATE KhachHang SET diaChi = ? WHERE idKhachHang = ?',
        [diaChi, idKhachHang]
    );
};
const updateFullName = async (idKhachHang, hoTen) => {
    await pool.query(
        'UPDATE KhachHang SET hoTen = ? WHERE idKhachHang = ?',
        [hoTen, idKhachHang]
    );
};

module.exports = {
    findById,
    updatePhoneNumber,
    updatePassword,
    updateAddress,
    updateFullName
};