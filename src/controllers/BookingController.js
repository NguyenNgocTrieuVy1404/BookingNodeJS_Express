const Booking = require('../models/bookingModel');
// const qrcode = require('qrcode');
const QRGenerator = require('../utils/qrGenerator');
const DocumentGenerator = require('../utils/documentGenerator');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

class BookingController {
    async getUserBookings(req, res) {
        try {
            const userId = req.user.id;
            const bookings = await Booking.findByUserId(userId);
            
            // Kiểm tra nếu là API request
            if (req.headers['content-type'] === 'application/json') {
                return res.status(200).json({
                    success: true,
                    data: bookings
                });
            }

            // Render view cho web
            res.render('bookings-detail', {
                title: 'Chi tiết đặt phòng',
                bookings: bookings,
                user: res.locals.user
            });
        } catch (error) {
            console.error('Error in getUserBookings:', error);
            if (req.headers['content-type'] === 'application/json') {
                return res.status(500).json({
                    success: false,
                    message: 'Có lỗi xảy ra khi tải thông tin đặt phòng',
                    error: error.message
                });
            }
            res.status(500).render('error', {
                message: 'Có lỗi xảy ra khi tải thông tin đặt phòng',
                error: error
            });
        }
    }

    // Tạo đặt phòng mới
    async createBooking(req, res) {
        try {
            const { idPhong, ngayBatDau, ngayKetThuc } = req.body;
            const idKhachHang = req.user.id;

            const booking = await Booking.create({
                idPhong,
                idKhachHang,
                ngayBatDau,
                ngayKetThuc
            });

            return res.status(200).json({
                success: true,
                message: 'Đặt phòng thành công',
                data: booking,
                redirectUrl: `/bookings/success/${booking.idDatPhong}`
            });

        } catch (error) {
            console.error('Error in createBooking:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Có lỗi xảy ra khi đặt phòng'
            });
        }
    }

    // Hủy đặt phòng
    async cancelBooking(req, res) {
        try {
            const bookingId = req.params.id;
            const userId = req.user.id;

            await Booking.cancelBooking(bookingId, userId);
            return res.status(200).json({
                success: true,
                message: 'Hủy đặt phòng thành công'
            });

        } catch (error) {
            console.error('Error in cancelBooking:', error);
            
            return res.status(400).json({
                success: false,
                message: error.message || 'Không thể hủy đặt phòng'
            });
        }
    }

    // Hiển thị form đặt phòng
    async showBookingForm(req, res) {
        try {
            const idPhong = req.params.idPhong;
            const roomData = await Booking.getRoomDetailsWithBookings(idPhong);

            res.render('booking-form', {
                title: 'Đặt phòng',
                room: roomData,
                existingBookings: roomData.bookings,
                user: res.locals.user
            });
        } catch (error) {
            console.error('Error in showBookingForm:', error);
            
            if (error.message.includes('không tồn tại')) {
                return res.status(404).render('error', {
                    title: 'Không thể đặt phòng',
                    message: error.message,
                    error: { status: 404 },
                    user: res.locals.user
                });
            }

            res.status(500).render('error', {
                title: 'Lỗi hệ thống',
                message: 'Có lỗi xảy ra khi tải form đặt phòng',
                error: error,
                user: res.locals.user
            });
        }
    }

    // Hiển thị trang đặt phòng thành công
    async showBookingSuccess(req, res) {
        try {
            const bookingId = req.params.id;
            const userId = req.user.id;
            
            // Lấy thông tin đặt phòng
            const bookingData = await Booking.findById(bookingId);
            
            if (!bookingData || bookingData.idKhachHang !== userId) {
                return res.status(404).render('error', {
                    title: 'Không tìm thấy',
                    message: 'Không tìm thấy thông tin đặt phòng hoặc bạn không có quyền xem',
                    error: { status: 404 },
                    user: res.locals.user
                });
            }
            
            // Tính số đêm
            const startDate = new Date(bookingData.ngayBatDau);
            const endDate = new Date(bookingData.ngayKetThuc);
            const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            
            // Sử dụng QRGenerator để tạo mã QR tùy chỉnh
            const qrCodeURL = await QRGenerator.generateBookingQR(bookingData);
            
            res.render('booking-success', {
                title: 'Đặt phòng thành công',
                booking: bookingData,
                nights,
                qrCodeURL,
                user: res.locals.user
            });
            
        } catch (error) {
            console.error('Error in showBookingSuccess:', error);
            res.status(500).render('error', {
                title: 'Lỗi hệ thống',
                message: 'Có lỗi xảy ra khi tải thông tin đặt phòng',
                error: error,
                user: res.locals.user
            });
        }
    }
    
    // Gửi email xác nhận đặt phòng
    async sendBookingConfirmationEmail(req, res) {
        try {
            const bookingId = req.params.id;
            const userId = req.user.id;
            
            // Lấy thông tin đặt phòng
            const bookingData = await Booking.findById(bookingId);
            
            if (!bookingData || bookingData.idKhachHang !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông tin đặt phòng hoặc bạn không có quyền'
                });
            }
            
            // Kiểm tra nếu không có email
            if (!bookingData.email) {
                return res.status(400).json({
                    success: false,
                    message: 'Không tìm thấy email của người đặt phòng'
                });
            }
            
            // Tính số đêm
            const startDate = new Date(bookingData.ngayBatDau);
            const endDate = new Date(bookingData.ngayKetThuc);
            const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            
            // Tạo mã QR tùy chỉnh cho email
            const qrCodeURL = await QRGenerator.generateBookingQR(bookingData);
            
            console.log('Bắt đầu tạo file PDF...');
            
            // Sử dụng DocumentGenerator để tạo file PDF
            const pdfFilePath = await DocumentGenerator.generateInvoicePDF(bookingData, nights, qrCodeURL);
            
            // Tạo nội dung HTML cho email từ template
            const emailHtml = await DocumentGenerator.generateEmailHTML(bookingData, nights, qrCodeURL);
            
            // Cấu hình transporter cho Nodemailer
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                }
            });
            
            console.log('Gửi email đến:', bookingData.email);
            
            // Chuẩn bị nội dung email
            const mailOptions = {
                from: `"Hệ thống đặt phòng" <${process.env.EMAIL_USER}>`,
                to: bookingData.email,
                subject: `Xác nhận đặt phòng #${bookingData.idDatPhong}`,
                html: emailHtml,
                attachments: [
                    {
                        filename: 'booking-qr.png',
                        path: qrCodeURL,
                        cid: 'booking-qr'
                    },
                    {
                        filename: `Hoa-don-dat-phong-${bookingData.idDatPhong}.pdf`,
                        path: pdfFilePath,
                        contentType: 'application/pdf'
                    }
                ]
            };
            
            // Gửi email
            const info = await transporter.sendMail(mailOptions);
            console.log('Kết quả gửi email:', {
                messageId: info.messageId,
                response: info.response,
                accepted: info.accepted,
                rejected: info.rejected
            });
            
            return res.status(200).json({
                success: true,
                message: 'Email xác nhận kèm hóa đơn PDF đã được gửi thành công đến ' + bookingData.email
            });
            
        } catch (error) {
            console.error('Error in sendBookingConfirmationEmail:', error);
            return res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi gửi email xác nhận',
                error: error.message
            });
        }
    }
}

module.exports = new BookingController();