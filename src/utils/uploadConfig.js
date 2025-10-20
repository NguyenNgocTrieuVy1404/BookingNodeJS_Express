const multer = require('multer');
const path = require('path');

// Cấu hình lưu trữ cho upload file từ máy tính
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/hotels/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});

// Cấu hình multer
const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Chỉ chấp nhận file ảnh (jpg, jpeg, png)'));
    }
});

module.exports = upload; 