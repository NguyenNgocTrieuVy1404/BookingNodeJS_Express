const express = require('express');
const router = express.Router();

// Route cho trang Về chúng tôi
router.get('/about', (req, res) => {
    res.render('about', { 
        title: 'Về chúng tôi',
        user: res.locals.user 
    });
});

// Route cho trang Liên hệ
router.get('/contact', (req, res) => {
    res.render('contact', { 
        title: 'Liên hệ',
        user: res.locals.user 
    });
});

// Route cho trang Chính sách
router.get('/privacy', (req, res) => {
    res.render('privacy', { 
        title: 'Chính sách & Điều khoản',
        user: res.locals.user 
    });
});

module.exports = router; 