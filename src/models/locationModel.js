const pool = require('../utils/connectDB');

const getAll = async () => {
    const query = 'SELECT * FROM DiaDiem';
    const [rows] = await pool.execute(query);
    return rows;
};

const getAddress = async (tenDiaDiem) => {
    const query = `
        SELECT 
            ks.idKhachSan, 
            ks.tenKhachSan, 
            ks.phuong, 
            ks.quan, 
            ks.thanhPho, 
            dd.tenDiaDiem
        FROM KhachSan ks
        JOIN DiaDiem dd ON ks.idDiaDiem = dd.idDiaDiem
        WHERE dd.tenDiaDiem LIKE ?
    `;
    const [rows] = await pool.execute(query, [`%${tenDiaDiem}%`]);
    return rows;
};

module.exports = { getAll, getAddress };
