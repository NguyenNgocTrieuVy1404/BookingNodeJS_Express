const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');

router.get('/register', (req, res) => {
  res.render('register', { title: 'Đăng ký' });
});
router.post('/register', userController.register);
router.get('/login', (req, res) => {
  res.render('login', { title: 'Đăng nhập' });
});
router.post('/login', userController.login);
router.get('/logout', userController.logout);
router.get('/', (req, res) => {
    res.redirect('/');
});

module.exports = router;