const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const { checkAuth } = require('./src/middleware/authMiddleware');
const upload = require('./src/utils/uploadConfig');
const Scheduler = require('./src/utils/scheduler');
const passport = require('./src/utils/passport');
const session = require('express-session');
const authRouter = require('./src/routes/authRouter');
Scheduler.initScheduledJobs();
dotenv.config();
const port = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(cors());
const morgan = require('morgan');
app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Cấu hình Session và Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'my_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));
app.use(passport.initialize());
app.use(passport.session());

// Thêm middleware để kiểm tra auth cho tất cả các route
app.use(checkAuth);

// Cấu hình view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const userRouter = require('./src/routes/userRoute');
const bookingRouter = require('./src/routes/bookingRoute');
const hotelRouter = require('./src/routes/hotelRoute');
const homeRouter = require('./src/routes/homeRoute');
const locationRoute = require('./src/routes/locationRoute');
const staticRoute = require('./src/routes/staticRoute');
const profileRoute = require('./src/routes/profileRoute');
const adminRouter = require('./src/routes/adminRoute');
const managerRouter = require('./src/routes/managerRouter');

app.use('/users', userRouter);
app.use('/bookings-detail', bookingRouter);
app.use('/bookings', bookingRouter);
app.use('/hotels', hotelRouter);
app.use('/', homeRouter);
app.use('/locations', locationRoute);
app.use('/', staticRoute);
app.use('/profile', profileRoute);
app.use('/admin', adminRouter);
app.use('/manager', managerRouter);
app.use('/auth', authRouter);

app.use((req, res, next) => {
    console.log('404 middleware hit');
    res.status(404).render('Error', {
        title: 'Không tìm thấy trang',
        message: 'Trang bạn đang tìm kiếm không tồn tại.',
        user: res.locals.user
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('Error', {
        title: 'Lỗi máy chủ',
        message: 'Có lỗi xảy ra',
        user: res.locals.user
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
});

app.locals.upload = upload;