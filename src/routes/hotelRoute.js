const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/HotelController');
const { checkAuth } = require('../middleware/authMiddleware');

router.get('/', (req, res) => hotelController.getAllHotelsAPI(req, res));
router.get('/:id', checkAuth, hotelController.getHotelDetail);

module.exports = router;