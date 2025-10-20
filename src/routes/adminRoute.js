const express = require('express');
const router = express.Router();
const adminController = require('../controllers/AdminController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/login', adminController.loginPage);
router.post('/login', adminController.login);
router.post('/logout', adminController.logout);

router.use(authMiddleware.requireAdmin);

router.get('/', adminController.dashboard);
router.get('/dashboard', adminController.dashboard);
router.get('/users', adminController.getUsers);

// User routes
router.get('/users/add', adminController.addUserPage);
router.post('/users/add', adminController.addUser);
router.get('/users/edit/:id', adminController.editUserPage);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Hotel routes
router.get('/hotels', adminController.getHotels);
router.get('/hotels/add', adminController.addHotelPage);
router.post('/hotels/add', adminController.addHotel);
router.get('/hotels/edit/:id', adminController.editHotelPage);
router.post('/hotels/edit/:id', adminController.updateHotel);
router.delete('/hotels/:id', adminController.deleteHotel);

// Booking routes
router.get('/bookings', adminController.getBookings);
router.get('/bookings/add', adminController.addBookingPage);
router.post('/bookings/add', adminController.addBooking);
router.get('/bookings/edit/:id', adminController.editBookingPage);
router.post('/bookings/edit/:id', adminController.updateBooking);
router.delete('/bookings/:id', adminController.deleteBooking);
router.put('/bookings/update-statuses', adminController.updateBookingStatuses);
router.post('/bookings/confirm-checkin/:id', adminController.confirmCheckin);
router.get('/bookings/check-checkin-status/:id', adminController.checkCheckinStatus);
router.get('/customers/search', adminController.searchCustomerByPhone);

module.exports = router;