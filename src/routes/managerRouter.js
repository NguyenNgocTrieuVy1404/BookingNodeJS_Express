const express = require('express');
const router = express.Router();
const { 
    requireManager, 
    checkRoomAreaPermission, 
    checkBookingAreaPermission 
} = require('../middleware/authMiddleware');
const managerController = require('../controllers/ManagerController');

// Routes không cần auth
router.get('/login', managerController.loginPage);
router.post('/login', managerController.login);

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

// Middleware bảo vệ các routes manager
router.use(requireManager);

// Routes cần auth
router.get('/', (req, res) => res.redirect('/manager/dashboard'));
router.get('/dashboard', managerController.dashboard);

// Quản lý phòng
router.get('/rooms', managerController.getRooms);
router.post('/rooms/add', managerController.addRoom);
router.post('/rooms/edit/:id', checkRoomAreaPermission, managerController.updateRoom);
router.post('/rooms/toggle/:id', checkRoomAreaPermission, managerController.toggleRoomStatus);

// Quản lý đặt phòng
router.get('/bookings', managerController.getBookings);
router.post('/bookings/edit/:id', checkBookingAreaPermission, managerController.updateBooking);
router.post('/bookings/confirm-checkin/:id', checkBookingAreaPermission, managerController.confirmCheckin);
router.get('/bookings/check-checkin-status/:id', checkBookingAreaPermission, managerController.checkCheckinStatus);

// Quản lý tiện nghi
router.get('/amenities', managerController.getAmenities);
router.post('/amenities/add', managerController.addAmenity);
router.post('/amenities/delete/:id', managerController.deleteAmenity);
router.post('/amenities/edit/:id', managerController.editAmenity);

// Quản lý tiện nghi cho phòng cụ thể
router.get('/rooms/:idPhong/amenities', checkRoomAreaPermission, managerController.getRoomAmenities);
router.post('/rooms/amenities/add', checkRoomAreaPermission, managerController.addAmenityToRoom);
router.get('/rooms/amenities/remove/:idPhong/:idTienNghi', checkRoomAreaPermission, managerController.removeAmenityFromRoom);

module.exports = router;