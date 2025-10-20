const jwt = require('jsonwebtoken');
const managerModel = require('../models/managerModel');

const verifyToken = (req, res, next) => {
    try {
        // Kiểm tra có phải API request không
        const isApiRequest = req.xhr || 
                           req.headers.accept === 'application/json' ||
                           req.headers.authorization;

        // Lấy token từ Authorization header hoặc cookie
        const authHeader = req.headers['authorization'];
        let token = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            if (isApiRequest) {
                return res.status(401).json({
                    success: false,
                    message: 'Không tìm thấy token'
                });
            }
            return res.redirect('/users/login');
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            res.locals.user = {
                ...decoded,
                isLoggedIn: true
            };
            next();
        } catch (error) {
            if (isApiRequest) {
                return res.status(401).json({
                    success: false,
                    message: 'Token không hợp lệ'
                });
            }
            res.clearCookie('token');
            return res.redirect('/users/login');
        }

    } catch (error) {
        if (isApiRequest) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi xác thực'
            });
        }
        return res.redirect('/users/login');
    }
};

// Middleware kiểm tra auth không bắt buộc
const checkAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            res.locals.user = {
                ...decoded,
                isLoggedIn: true
            };
        } catch (error) {
            res.clearCookie('token');
            req.user = null;
            res.locals.user = null;
        }
    } else {
        req.user = null;
        res.locals.user = null;
    }
    next();
};

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
    try {
        // Kiểm tra có phải API request không
        const isApiRequest = req.xhr || 
                           req.headers.accept === 'application/json' ||
                           req.headers.authorization;

        // Lấy token từ header hoặc cookie
        const authHeader = req.headers['authorization'];
        let token = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            if (isApiRequest) {
                return res.status(401).json({
                    success: false,
                    message: 'Không tìm thấy token'
                });
            }
            return res.redirect('/admin/login');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.quyenHan !== 'admin') {
            if (isApiRequest) {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền truy cập'
                });
            }
            return res.status(403).render('error', {
                message: 'Bạn không có quyền truy cập trang này'
            });
        }

        req.user = decoded;
        res.locals.user = {
            ...decoded,
            isLoggedIn: true
        };
        next();
    } catch (error) {
        if (isApiRequest) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ'
            });
        }
        res.clearCookie('token');
        return res.redirect('/admin/login');
    }
};

// Middleware kiểm tra quyền manager
const requireManager = (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.redirect('/manager/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.quyenHan !== 'manager') {
            return res.status(403).render('error', {
                message: 'Bạn không có quyền truy cập trang này'
            });
        }

        req.user = decoded;
        res.locals.user = {
            ...decoded,
            isLoggedIn: true
        };
        
        next();
    } catch (error) {
        console.error('JWT verification error:', error);
        res.clearCookie('token');
        return res.redirect('/manager/login');
    }
};

// Middleware kiểm tra quyền user thường
const isUser = (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.redirect('/users/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.quyenHan !== 'user') {
            return res.status(403).render('error', {
                message: 'Bạn không có quyền truy cập trang này'
            });
        }

        req.user = decoded;
        res.locals.user = {
            ...decoded,
            isLoggedIn: true
        };
        
        next();
    } catch (error) {
        console.error('JWT verification error:', error);
        res.clearCookie('token');
        return res.redirect('/users/login');
    }
};

// Middleware kiểm tra quyền manager hoặc admin
const isManagerOrAdmin = (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.redirect('/users/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.quyenHan !== 'manager' && decoded.quyenHan !== 'admin') {
            return res.status(403).render('error', {
                message: 'Bạn không có quyền truy cập trang này'
            });
        }

        req.user = decoded;
        res.locals.user = {
            ...decoded,
            isLoggedIn: true
        };
        
        next();
    } catch (error) {
        console.error('JWT verification error:', error);
        res.clearCookie('token');
        return res.redirect('/users/login');
    }
};

// Middleware kiểm tra quyền quản lý phòng theo khu vực
const checkRoomAreaPermission = async (req, res, next) => {
    try {
        const manager = req.user;
        if (!manager || manager.quyenHan !== 'manager') {
            return res.status(403).render('error', {
                message: 'Bạn không có quyền truy cập trang này'
            });
        }
        
        // Lấy idPhong từ params hoặc body
        const idPhong = req.params.id || req.params.idPhong || req.body.idPhong;
        
        if (!idPhong) {
            return next();
        }
        
        // Kiểm tra phòng có thuộc khu vực quản lý không
        const hasPermission = await managerModel.checkRoomBelongsToArea(idPhong, manager.idDiaDiem);
        
        if (!hasPermission) {
            return res.status(403).render('error', {
                message: 'Bạn không có quyền quản lý phòng này'
            });
        }
        
        next();
    } catch (error) {
        console.error('Error in checkRoomAreaPermission:', error);
        return res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi kiểm tra quyền'
        });
    }
};

// Middleware kiểm tra quyền quản lý đặt phòng theo khu vực
const checkBookingAreaPermission = async (req, res, next) => {
    try {
        const manager = req.user;
        if (!manager || manager.quyenHan !== 'manager') {
            return res.status(403).render('error', {
                message: 'Bạn không có quyền truy cập trang này'
            });
        }
        
        // Lấy idDatPhong từ params hoặc body
        const idDatPhong = req.params.id || req.params.idDatPhong || req.body.idDatPhong;
        
        if (!idDatPhong) {
            return next(); // Không có idDatPhong để kiểm tra
        }
        
        // Kiểm tra đặt phòng có thuộc khu vực quản lý không
        const hasPermission = await managerModel.checkBookingBelongsToArea(idDatPhong, manager.idDiaDiem);
        
        if (!hasPermission) {
            return res.status(403).render('error', {
                message: 'Bạn không có quyền quản lý đơn đặt phòng này'
            });
        }
        
        next();
    } catch (error) {
        console.error('Error in checkBookingAreaPermission:', error);
        return res.status(500).render('error', {
            message: 'Có lỗi xảy ra khi kiểm tra quyền'
        });
    }
};

module.exports = { 
    verifyToken, 
    checkAuth, 
    requireAdmin,
    requireManager,
    isUser,
    isManagerOrAdmin,
    checkRoomAreaPermission,
    checkBookingAreaPermission
};
