const pdf = require('html-pdf');
const path = require('path');
const fs = require('fs');
const pug = require('pug');

/**
 * Utility để tạo file PDF và HTML email từ dữ liệu và template
 */
class DocumentGenerator {
  /**
   * Tạo file PDF hóa đơn đặt phòng
   * @param {Object} bookingData - Dữ liệu đặt phòng
   * @param {number} nights - Số đêm
   * @param {string} qrCodeURL - URL của mã QR
   * @returns {Promise<string>} - Đường dẫn tới file PDF đã tạo
   */
  static async generateInvoicePDF(bookingData, nights, qrCodeURL) {
    try {
      // Đảm bảo thư mục uploads tồn tại
      const uploadsDir = path.join(__dirname, '../../public/uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Tạo tên file PDF duy nhất
      const pdfFileName = `hoa-don-${bookingData.idDatPhong}-${Date.now()}.pdf`;
      const pdfFilePath = path.join(uploadsDir, pdfFileName);

      // Định nghĩa các hàm helper 
      const helpers = this.getHelperFunctions();

      // Đọc và biên dịch template
      const templatePath = path.join(__dirname, '../views/templates/invoice.pug');
      const compiledTemplate = pug.compileFile(templatePath);

      // Render template với dữ liệu
      const html = compiledTemplate({ 
        booking: bookingData, 
        nights, 
        qrCodeURL,
        formatDate: helpers.formatDate,
        formatCurrency: helpers.formatCurrency
      });

      // Cấu hình PDF
      const pdfOptions = {
        format: 'A4',
        border: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm'
        },
        // Fonts chỉ hoạt động khi dùng puppeteer
        // Vì chúng ta dùng phantomJS, sẽ dùng webfont trong CSS
        timeout: 30000
      };

      // Tạo file PDF từ HTML
      return new Promise((resolve, reject) => {
        pdf.create(html, pdfOptions).toFile(pdfFilePath, (err, res) => {
          if (err) {
            console.error('Lỗi khi tạo PDF:', err);
            reject(err);
          } else {
            console.log('Tạo PDF thành công:', res.filename);
            resolve(pdfFilePath);
          }
        });
      });
    } catch (error) {
      console.error('Lỗi trong quá trình tạo PDF:', error);
      throw error;
    }
  }

  /**
   * Tạo nội dung HTML cho email xác nhận đặt phòng
   * @param {Object} bookingData - Dữ liệu đặt phòng
   * @param {number} nights - Số đêm
   * @param {string} qrCodeURL - URL của mã QR
   * @returns {string} - HTML content cho email
   */
  static async generateEmailHTML(bookingData, nights, qrCodeURL) {
    try {
      // Định nghĩa các hàm helper
      const helpers = this.getHelperFunctions();

      // Đọc và biên dịch template
      const templatePath = path.join(__dirname, '../views/templates/email-confirmation.pug');
      const compiledTemplate = pug.compileFile(templatePath);

      // Render template với dữ liệu
      const html = compiledTemplate({
        booking: bookingData,
        nights,
        qrCodeURL,
        formatDate: helpers.formatDate,
        formatCurrency: helpers.formatCurrency
      });

      return html;
    } catch (error) {
      console.error('Lỗi trong quá trình tạo HTML email:', error);
      throw error;
    }
  }

  /**
   * Lấy các hàm helper cho định dạng dữ liệu
   * @returns {Object} - Đối tượng chứa các hàm helper
   */
  static getHelperFunctions() {
    return {
      formatDate: (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
      },
      formatCurrency: (amount) => {
        return new Intl.NumberFormat('vi-VN', { 
          style: 'currency', 
          currency: 'VND' 
        }).format(amount);
      }
    };
  }
}

module.exports = DocumentGenerator; 