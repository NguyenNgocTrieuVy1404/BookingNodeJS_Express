const pool = require('../utils/connectDB');
const bcrypt = require('bcrypt');

const createCustomer = async (customerData) => {
    const sql = `
            INSERT INTO KhachHang (hoTen, email, soDienThoai) 
            VALUES (?, ?, ?)
        `;
    const [result] = await pool.query(sql, [
        customerData.hoTen,
        customerData.email,
        customerData.soDienThoai
    ]);

    return { idKhachHang: result.insertId, ...customerData };
}

const createAccount = async (accountData) => {
    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(accountData.matKhau, 10);

    const sql = `
            INSERT INTO TaiKhoan (idKhachHang, tenDangNhap, matKhau, quyenHan) 
            VALUES (?, ?, ?, 'user')
        `;
    const [result] = await pool.query(sql, [
        accountData.idKhachHang,
        accountData.tenDangNhap,
        hashedPassword
    ]);

    return { idTaiKhoan: result.insertId, ...accountData };
}

const findByUsername = async (tenDangNhap) => {
    const [rows] = await pool.query(
        'SELECT * FROM TaiKhoan WHERE tenDangNhap = ?',
        [tenDangNhap]
    );
    return rows[0];
}

const findByEmail = async (email) => {
    const [rows] = await pool.query(
        'SELECT * FROM KhachHang WHERE email = ?',
        [email]
    );
    return rows[0];
}

const findById = async (idKhachHang) => {
    const [rows] = await pool.query(
        'SELECT * FROM KhachHang WHERE idKhachHang = ?',
        [idKhachHang]
    );
    return rows[0];
}

const findAccountById = async (idTaiKhoan) => {
    const [rows] = await pool.query(`
        SELECT t.*, k.hoTen, k.email, k.soDienThoai, k.diaChi
        FROM TaiKhoan t
        LEFT JOIN KhachHang k ON t.idKhachHang = k.idKhachHang
        WHERE t.idTaiKhoan = ?
    `, [idTaiKhoan]);
    
    return rows[0];
}

const findAccountsByCustomerId = async (idKhachHang) => {
    const [rows] = await pool.query(`
        SELECT t.*, k.hoTen, k.email, k.soDienThoai, k.diaChi
        FROM TaiKhoan t
        LEFT JOIN KhachHang k ON t.idKhachHang = k.idKhachHang
        WHERE t.idKhachHang = ?
    `, [idKhachHang]);
    return rows;
}

const updateCustomer = async (idKhachHang, updateData) => {
    const sql = `
            UPDATE KhachHang 
            SET hoTen = ?, email = ?, soDienThoai = ? 
            WHERE idKhachHang = ?
        `;
    await pool.query(sql, [
        updateData.hoTen,
        updateData.email,
        updateData.soDienThoai,
        idKhachHang
    ]);

    return updateData;
}

const findByUsernameWithCustomerInfo = async (tenDangNhap) => {
    try {
        const [rows] = await pool.query(`
                SELECT t.*, k.hoTen, k.email, k.soDienThoai 
                FROM TaiKhoan t 
                LEFT JOIN KhachHang k ON t.idKhachHang = k.idKhachHang 
                WHERE t.tenDangNhap = ?
            `, [tenDangNhap]);

        return rows[0];
    } catch (error) {
        console.error('Error in findByUsernameWithCustomerInfo:', error);
        throw error;
    }
}

const updateUser = async (userId, userData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Cập nhật thông tin cơ bản trong bảng KhachHang
        await connection.query(`
            UPDATE KhachHang 
            SET hoTen = ?,
                email = ?,
                soDienThoai = ?,
                diaChi = ?
            WHERE idKhachHang = ?
        `, [
            userData.hoTen,
            userData.email,
            userData.soDienThoai,
            userData.diaChi,
            userId
        ]);

        // Cập nhật trạng thái và quyền hạn trong bảng TaiKhoan
        await connection.query(`
            UPDATE TaiKhoan 
            SET trangThai = ?,
                quyenHan = ?
            WHERE idKhachHang = ?
        `, [
            userData.trangThai === 'true' ? 1 : 0,
            userData.quyenHan,
            userId
        ]);

        await connection.commit();
        return true;

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

const findByUsernameWithFullInfo = async (tenDangNhap) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.*, k.hoTen, k.email, k.soDienThoai, dd.tenDiaDiem
            FROM TaiKhoan t 
            LEFT JOIN KhachHang k ON t.idKhachHang = k.idKhachHang
            LEFT JOIN DiaDiem dd ON t.idDiaDiem = dd.idDiaDiem
            WHERE t.tenDangNhap = ?
        `, [tenDangNhap]);

        return rows[0];
    } catch (error) {
        console.error('Error in findByUsernameWithFullInfo:', error);
        throw error;
    }
};

module.exports = {
    createCustomer,
    createAccount,
    findByUsername,
    findByEmail,
    findById,
    findAccountById,
    findAccountsByCustomerId,
    updateCustomer,
    findByUsernameWithCustomerInfo,
    updateUser,
    findByUsernameWithFullInfo
};