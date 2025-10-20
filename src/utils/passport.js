const passport = require('passport');
const pool = require('./connectDB');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// Cấu hình Passport.js
passport.serializeUser((user, done) => {
    done(null, user.idTaiKhoan);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findAccountById(id);
        done(null, user || null);
    } catch (error) {
        done(error, null);
    }
});

// Thêm chiến lược Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback: true
  },
  async function(req, accessToken, refreshToken, profile, done) {
    try {
        console.log('Đang tìm kiếm user với email:', profile.emails[0].value);
        
        // Tìm KhachHang có email từ Google
        const existingCustomer = await User.findByEmail(profile.emails[0].value);
        
        if (existingCustomer) {
            // Khách hàng đã tồn tại, kiểm tra tài khoản
            const existingAccounts = await User.findAccountsByCustomerId(existingCustomer.idKhachHang);
            
            if (existingAccounts && existingAccounts.length > 0) {
                // Người dùng đã có tài khoản, trả về
                console.log('Existing account for user:', existingAccounts[0]);
                return done(null, existingAccounts[0]);
            } else {
                // Khách hàng tồn tại nhưng chưa có tài khoản, tạo tài khoản mới
                const tenDangNhap = `google_${profile.id}`;
                const matKhau = Math.random().toString(36).slice(-10);
                
                // Tạo tài khoản mới sử dụng model
                const newAccount = await User.createAccount({
                    idKhachHang: existingCustomer.idKhachHang,
                    tenDangNhap: tenDangNhap,
                    matKhau: matKhau
                });
                
                // Lấy thông tin đầy đủ của tài khoản vừa tạo
                const accountDetail = await User.findAccountById(newAccount.idTaiKhoan);
                console.log('New account created for existing customer:', accountDetail);
                return done(null, accountDetail);
            }
        } else {
            // Khách hàng chưa tồn tại, tạo khách hàng mới và tài khoản
            const hoTen = profile.displayName;
            const email = profile.emails[0].value;
            const tenDangNhap = `google_${profile.id}`;
            const matKhau = Math.random().toString(36).slice(-10);
            
            // Tạo khách hàng mới sử dụng model
const newCustomer = await User.createCustomer({
                hoTen: hoTen,
                email: email,
                soDienThoai: ''
            });
            
            // Tạo tài khoản mới sử dụng model
            const newAccount = await User.createAccount({
                idKhachHang: newCustomer.idKhachHang,
                tenDangNhap: tenDangNhap,
                matKhau: matKhau
            });
            
            // Lấy thông tin đầy đủ của tài khoản vừa tạo
            const accountDetail = await User.findAccountById(newAccount.idTaiKhoan);
            console.log('New account created for new customer:', accountDetail);
            return done(null, accountDetail);
        }
    } catch (error) {
        console.error('Error in Google strategy:', error);
        return done(error, null);
    }
  }
));

module.exports = passport;