const cron = require('node-cron');
const Booking = require('../models/bookingModel');

class Scheduler {
    static async initScheduledJobs() {
        // Cập nhật trạng thái ngay khi khởi động ứng dụng
        try {
            console.log('Cập nhật trạng thái booking khi khởi động...');
            const result = await Booking.updateBookingStatuses();
            console.log('Cập nhật trạng thái booking thành công:', result);
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái booking:', error);
        }

        // Cập nhật trạng thái booking mỗi ngày lúc 00:01
        cron.schedule('1 0 * * *', async () => {
            try {
                console.log('Running automatic booking status update...');
                const result = await Booking.updateBookingStatuses();
                console.log('Booking statuses updated successfully:', result);
            } catch (error) {
                console.error('Error in automatic booking update:', error);
            }
        });

    }
}

module.exports = Scheduler; 