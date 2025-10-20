const express = require('express');
const router = express.Router();
const profileController = require('../controllers/ProfileController');
const { verifyToken, checkAuth } = require('../middleware/authMiddleware');

// Thêm checkAuth middleware để đảm bảo trạng thái đăng nhập được cập nhật
router.use(checkAuth);

// Routes cho web UI
router.get('/', verifyToken, profileController.getProfile);
router.post('/', verifyToken, profileController.updateProfile);

module.exports = router;