const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/BookingController');
const { verifyToken } = require('../middleware/authMiddleware');

// Xem danh sách booking của user
router.get('/', verifyToken, bookingController.getUserBookings);

// Form đặt phòng
router.get('/book/:idPhong', verifyToken, bookingController.showBookingForm);

// Tạo booking mới
router.post('/', verifyToken, bookingController.createBooking);

// Hủy booking
router.post('/:id/cancel', verifyToken, bookingController.cancelBooking);

// Hiển thị trang booking success
router.get('/success/:id', verifyToken, bookingController.showBookingSuccess);

// Gửi email xác nhận đặt phòng
router.post('/:id/send-email', verifyToken, bookingController.sendBookingConfirmationEmail);

module.exports = router;