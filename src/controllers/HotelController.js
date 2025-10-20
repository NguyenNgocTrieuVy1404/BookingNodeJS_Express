const Hotel = require('../models/hotelModel');

class HotelController {

    async getHotelDetail(req, res) {
        try {
            const hotelId = req.params.id;
            const hotel = await Hotel.findById(hotelId);

            
            // Check nếu là request từ Postman hoặc API client
            const isApiRequest = req.xhr || 
                               req.headers['accept'] === '*/*' ||
                               req.headers['accept'].includes('json');

            if (!hotel) {
                if (isApiRequest) {
                    return res.status(404).json({
                        success: false,
                        message: 'Không tìm thấy khách sạn'
                    });
                }
                return res.status(404).render('error', {
                    title: 'Không tìm thấy',
                    message: 'Không tìm thấy khách sạn',
                    user: res.locals.user
                });
            }

            if (isApiRequest) {
                return res.status(200).json({
                    success: true,
                    data: hotel
                });
            }

            res.render('hotel-detail', {
                title: hotel.tenKhachSan,
                hotel: hotel,
                user: res.locals.user
            });
            
        } catch (error) {
            console.error('Error in getHotelDetail:', error);
            if (isApiRequest) {
                return res.status(500).json({
                    success: false,
                    message: 'Lỗi server'
                });
            }
            res.status(500).render('error', {
                title: 'Lỗi',
                message: 'Có lỗi xảy ra khi tải thông tin khách sạn',
                user: res.locals.user
            });
        }
    }

    // Lấy danh sách khách sạn cho trang chủ
    async getAllHotels() {
        try {
            return await Hotel.findAll();
        } catch (error) {
            console.error('Error in getAllHotels:', error);
            throw error;
        }
    }

    // Lấy tất cả khách sạn
    async getAllHotelsAPI(req, res) {
        try {
            const hotels = await this.getAllHotels();
            res.status(200).json(hotels);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }

}

module.exports = new HotelController();
