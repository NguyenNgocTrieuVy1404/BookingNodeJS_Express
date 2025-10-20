const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

/**
 * Lớp tạo mã QR tùy chỉnh cho hệ thống đặt phòng khách sạn
 */
class QRGenerator {
    /**
     * Tạo mã QR dưới dạng URL base64 với tùy chỉnh
     * @param {string} data Dữ liệu để mã hóa thành QR
     * @param {Object} options Tùy chọn tạo mã QR
     * @param {number} options.width Chiều rộng của mã QR (mặc định: 300)
     * @param {string} options.errorCorrectionLevel Mức độ sửa lỗi (L, M, Q, H - mặc định: 'M')
     * @param {string} options.color Màu cho mã QR (mặc định: '#000000')
     * @param {string} options.background Màu nền (mặc định: '#ffffff')
     * @returns {Promise<string>} URL base64 của mã QR
     */
    static async generateBase64(data, options = {}) {
        const defaultOptions = {
            width: 300,
            errorCorrectionLevel: 'M',
            color: {
                dark: options.color || '#000000',
                light: options.background || '#ffffff'
            },
            margin: 1,
            scale: 4
        };

        const mergedOptions = { ...defaultOptions, ...options };
        
        try {
            const url = await QRCode.toDataURL(data, mergedOptions);
            return url;
        } catch (error) {
            console.error('Lỗi khi tạo mã QR base64:', error);
            throw error;
        }
    }

    /**
     * Tạo mã QR và lưu thành file trong thư mục public
     * @param {string} data Dữ liệu để mã hóa thành QR
     * @param {string} fileName Tên file (không cần đuôi .png)
     * @param {Object} options Tùy chọn tạo mã QR (giống như generateBase64)
     * @returns {Promise<string>} Đường dẫn tương đối đến file QR
     */
    static async generateAndSaveFile(data, fileName, options = {}) {
        // Đảm bảo fileName an toàn cho tên file
        const safeFileName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        const defaultOptions = {
            width: 300,
            errorCorrectionLevel: 'M',
            color: {
                dark: options.color || '#000000',
                light: options.background || '#ffffff'
            },
            margin: 1,
            scale: 4
        };

        const mergedOptions = { ...defaultOptions, ...options };
        
        // Đường dẫn đầy đủ đến thư mục lưu trữ
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'qrcodes');
        
        // Tạo thư mục nếu chưa tồn tại
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filePath = path.join(uploadDir, `${safeFileName}.png`);
        const relativePath = `/uploads/qrcodes/${safeFileName}.png`;
        
        try {
            await QRCode.toFile(filePath, data, mergedOptions);
            return relativePath;
        } catch (error) {
            console.error('Lỗi khi tạo và lưu mã QR:', error);
            throw error;
        }
    }

    /**
     * Tạo mã QR cho đặt phòng khách sạn với thông tin đầy đủ
     * @param {Object} booking Thông tin đặt phòng
     * @returns {Promise<string>} URL base64 của mã QR
     */
    static async generateBookingQR(booking) {
        // Tạo dữ liệu cần mã hóa (có thể là JSON để dễ parse)
        const qrData = JSON.stringify({
            idDatPhong: booking.idDatPhong,
            idPhong: booking.idPhong,
            hoTen: booking.hoTen,
            ngayBatDau: booking.ngayBatDau,
            ngayKetThuc: booking.ngayKetThuc,
            timestamp: new Date().toISOString()
        });
        
        // Tùy chọn màu sắc theo thương hiệu khách sạn
        const options = {
            color: '#0083b0',
            width: 300,
            errorCorrectionLevel: 'H' // Mức độ cao để dễ quét
        };
        
        return this.generateBase64(qrData, options);
    }

    /**
     * Tạo và lưu mã QR cho đặt phòng với ID đặt phòng
     * @param {Object} booking Thông tin đặt phòng
     * @returns {Promise<string>} Đường dẫn tương đối đến file QR
     */
    static async saveBookingQR(booking) {
        // Tạo dữ liệu và tên file
        const qrData = JSON.stringify({
            idDatPhong: booking.idDatPhong,
            idPhong: booking.idPhong,
            hoTen: booking.hoTen,
            ngayBatDau: booking.ngayBatDau,
            ngayKetThuc: booking.ngayKetThuc,
            timestamp: new Date().toISOString()
        });
        
        const fileName = `booking_${booking.idDatPhong}_${Date.now()}`;
        
        // Tùy chọn màu sắc theo thương hiệu khách sạn
        const options = {
            color: '#0083b0',
            width: 300,
            errorCorrectionLevel: 'H'
        };
        
        return this.generateAndSaveFile(qrData, fileName, options);
    }
}

module.exports = QRGenerator; 