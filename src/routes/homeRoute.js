const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/HotelController');
const locationController = require('../controllers/LocationController');

router.get('/', async (req, res) => {
    try {
        const hotels = await hotelController.getAllHotels();
        const locations = await locationController.getAll();
        
        if (!hotels || !locations) {
            throw new Error('Không thể lấy dữ liệu');
        }

        res.render('home', {
            title: 'Trang chủ',
            hotels: hotels,
            locations: locations,
            user: res.locals.user
        });
    } catch (error) {
        console.error('Error in home route:', error);
        res.status(500).render('error', {
            title: 'Lỗi',
            message: 'Có lỗi xảy ra khi tải trang',
            user: res.locals.user
        });
    }
});

module.exports = router;
