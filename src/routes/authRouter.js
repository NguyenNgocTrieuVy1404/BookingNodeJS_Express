const express = require('express');
const router = express.Router();
const passport = require('passport');
const { googleAuthSuccess, googleAuthFailure } = require('../controllers/authController');

// Khởi tạo quá trình đăng nhập Google
router.get('/google', 
    passport.authenticate('google', { 
        scope: ['profile', 'email'] 
    })
);

// Callback sau khi Google xác thực
router.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/auth/google/failure'
    }),
    googleAuthSuccess
);

// Route xử lý khi Google xác thực thất bại
router.get('/google/failure', googleAuthFailure);

module.exports = router; 