const Location = require('../models/locationModel');

class LocationController {
    async getAll(req, res) {
        try {
            const locations = await Location.getAll();
            
            // Nếu có res (gọi từ API route)
            if (res) {
                return res.status(200).json({ 
                    success: true, 
                    data: locations 
                });
            }

            // Nếu không có res (gọi từ home route)
            return locations;
            
        } catch (error) {
            if (res) {
                return res.status(500).json({ message: error.message });
            }
            throw error; // Ném lỗi để route xử lý
        }
    }

    async getAddress(req, res) {
        try {
            const tenDiaDiem = req.params.tenDiaDiem;
            const hotels = await Location.getAddress(tenDiaDiem);
            return res.status(200).json({ 
                success: true, 
                data: hotels,
                count: hotels.length
            });
        } catch (error) {
            return res.status(500).json({ 
                success: false, 
                message: 'Lỗi khi tìm kiếm khách sạn', 
                error: error.message 
            });
        }
    }
}

module.exports = new LocationController();
