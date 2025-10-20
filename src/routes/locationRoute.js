const express = require('express');
const router = express.Router();
const locationController = require('../controllers/LocationController');

router.get('/:tenDiaDiem', locationController.getAddress);
router.get('/', locationController.getAll);


module.exports = router;
