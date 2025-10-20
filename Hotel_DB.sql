CREATE DATABASE IF NOT EXISTS dbdatphongks;
USE dbdatphongks;

-- Bảng DiaDiem
CREATE TABLE DiaDiem (
    idDiaDiem INT AUTO_INCREMENT PRIMARY KEY,
    tenDiaDiem VARCHAR(100) NOT NULL
);

-- Bảng KhachSan
CREATE TABLE KhachSan (
    idKhachSan INT AUTO_INCREMENT PRIMARY KEY,
    tenKhachSan VARCHAR(100) NOT NULL,
    phuong VARCHAR(50),
    quan VARCHAR(50),
    thanhPho VARCHAR(50),
    idDiaDiem INT NOT NULL,
    FOREIGN KEY (idDiaDiem) REFERENCES DiaDiem(idDiaDiem)
);

-- Bảng LoaiPhong
CREATE TABLE LoaiPhong (
    idLoaiPhong INT AUTO_INCREMENT PRIMARY KEY,
    tenLoaiPhong VARCHAR(50) NOT NULL
);

-- Bảng Phong
CREATE TABLE Phong (
    idPhong INT AUTO_INCREMENT PRIMARY KEY,
    idLoaiPhong INT NOT NULL,
    giaPhong DECIMAL(10, 2) NOT NULL,
    trangThai TINYINT(1) NOT NULL DEFAULT 1,
    idKhachSan INT NOT NULL,
    FOREIGN KEY (idLoaiPhong) REFERENCES LoaiPhong(idLoaiPhong),
    FOREIGN KEY (idKhachSan) REFERENCES KhachSan(idKhachSan)
);

-- Bảng TienNghi
CREATE TABLE TienNghi (
    idTienNghi INT AUTO_INCREMENT PRIMARY KEY,
    tenTienNghi VARCHAR(100) NOT NULL
);

-- Bảng Phong_TienNghi
CREATE TABLE Phong_TienNghi (
    idPhong INT NOT NULL,
    idTienNghi INT NOT NULL,
    PRIMARY KEY (idPhong, idTienNghi),
    FOREIGN KEY (idPhong) REFERENCES Phong(idPhong),
    FOREIGN KEY (idTienNghi) REFERENCES TienNghi(idTienNghi)
);

-- Bảng KhachHang
CREATE TABLE KhachHang (
    idKhachHang INT AUTO_INCREMENT PRIMARY KEY,
    hoTen VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    soDienThoai VARCHAR(15) NOT NULL,
    diaChi VARCHAR(255)
);

-- Bảng TaiKhoan
CREATE TABLE TaiKhoan (
    idTaiKhoan INT AUTO_INCREMENT PRIMARY KEY,
    idKhachHang INT,
    tenDangNhap VARCHAR(100) NOT NULL UNIQUE,
    matKhau VARCHAR(255) NOT NULL,
    quyenHan ENUM('user', 'manager', 'admin') DEFAULT 'user',
    trangThai TINYINT(1) NOT NULL DEFAULT 1,
    idDiaDiem INT, -- Thêm trường này để xác định khu vực quản lý
    FOREIGN KEY (idKhachHang) REFERENCES KhachHang(idKhachHang),
    FOREIGN KEY (idDiaDiem) REFERENCES DiaDiem(idDiaDiem)
);

-- Bảng DatPhong với các trường mới

CREATE TABLE DatPhong (
    idDatPhong INT AUTO_INCREMENT PRIMARY KEY,
    idPhong INT NOT NULL,
    idKhachHang INT NOT NULL,
    ngayBatDau DATE NOT NULL,
    ngayKetThuc DATE NOT NULL,
    ngayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    donGia DECIMAL(12,2) NOT NULL, -- Đơn giá phòng khi đặt
    soLuongDem INT GENERATED ALWAYS AS (DATEDIFF(ngayKetThuc, ngayBatDau)) STORED, -- Số đêm tự động tính
    thanhTien DECIMAL(12,2) GENERATED ALWAYS AS (donGia * DATEDIFF(ngayKetThuc, ngayBatDau)) STORED, -- Thành tiền tự động tính
    trangThai TINYINT NOT NULL DEFAULT 1,
    -- Thay đổi TINYINT(1) thành TINYINT và thêm COMMENT để giải thích các trạng thái
    -- 0: Đã hủy
    -- 1: Đang hoạt động/Chờ checkin
    -- 2: Đã hoàn thành (đã checkout)
    CHECK (ngayBatDau < ngayKetThuc),
    FOREIGN KEY (idPhong) REFERENCES Phong(idPhong),
    FOREIGN KEY (idKhachHang) REFERENCES KhachHang(idKhachHang)
);

-- Bảng LichSuDatPhong
CREATE TABLE LichSuDatPhong (
    idLichSu INT AUTO_INCREMENT PRIMARY KEY,
    idDatPhong INT NOT NULL,
    idKhachHang INT NOT NULL,
    ngayCapNhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trangThai ENUM('dat', 'huy', 'hoanthanh') NOT NULL,
    -- Thay đổi các trạng thái theo code:
    -- 'dat': Khi tạo booking mới
    -- 'huy': Khi khách hàng hủy booking
    -- 'hoanthanh': Khi đã checkout
    ghiChu TEXT,
    FOREIGN KEY (idDatPhong) REFERENCES DatPhong(idDatPhong),
    FOREIGN KEY (idKhachHang) REFERENCES KhachHang(idKhachHang)
);

-- Chèn dữ liệu
INSERT INTO DiaDiem (tenDiaDiem) VALUES 
('Hồ Chí Minh'), ('Hà Nội'), ('Đà Nẵng'), ('Nha Trang'), ('Phú Quốc');

INSERT INTO LoaiPhong (tenLoaiPhong) VALUES 
('Deluxe'), ('Suite'), ('Standard'), ('Superior');

INSERT INTO KhachSan (tenKhachSan, phuong, quan, thanhPho, idDiaDiem) VALUES 
-- Hồ Chí Minh (idDiaDiem = 1)
('Khách sạn Majestic', 'Bến Nghé', 'Quận 1', 'Hồ Chí Minh', 1),
('Khách sạn Rex', 'Phạm Ngũ Lão', 'Quận 1', 'Hồ Chí Minh', 1),
('Khách sạn Caravelle', 'Đa Kao', 'Quận 1', 'Hồ Chí Minh', 1),
('Khách sạn Times Square', 'Phú Thọ Hòa', 'Quận Tân Phú', 'Hồ Chí Minh', 1),
('Khách sạn Sheraton Saigon', 'Nguyễn Văn Trỗi', 'Quận Phú Nhuận', 'Hồ Chí Minh', 1),

-- Hà Nội (idDiaDiem = 2)
('Khách sạn Melia Hanoi', 'Trần Hưng Đạo', 'Hoàn Kiếm', 'Hà Nội', 2),
('Khách sạn Lotte Hotel Hanoi', 'Cống Vị', 'Ba Đình', 'Hà Nội', 2),
('Khách sạn Sofitel Legend Metropole', 'Hàng Trống', 'Hoàn Kiếm', 'Hà Nội', 2),
('Khách sạn JW Marriott Hanoi', 'Mễ Trì', 'Nam Từ Liêm', 'Hà Nội', 2),
('Khách sạn InterContinental Hanoi Westlake', 'Tây Hồ', 'Tây Hồ', 'Hà Nội', 2),

-- Đà Nẵng (idDiaDiem = 3)
('Khách sạn Novotel Danang', 'Hòa Cường Bắc', 'Hải Châu', 'Đà Nẵng', 3),
('Khách sạn Hilton Da Nang', 'Hòa Cường Nam', 'Hải Châu', 'Đà Nẵng', 3),
('Khách sạn Vinpearl Condotel', 'Nại Hiên Đông', 'Sơn Trà', 'Đà Nẵng', 3),
('Khách sạn Grand Mercure Danang', 'An Hải Bắc', 'Sơn Trà', 'Đà Nẵng', 3),
('Khách sạn Pullman Danang Beach Resort', 'Bãi Bụt', 'Ngũ Hành Sơn', 'Đà Nẵng', 3),

-- Nha Trang (idDiaDiem = 4)
('Khách sạn InterContinental Nha Trang', 'Vĩnh Hòa', 'Nha Trang', 'Nha Trang', 4),
('Khách sạn Sheraton Nha Trang', 'Vĩnh Phước', 'Nha Trang', 'Nha Trang', 4),
('Khách sạn Mường Thanh Nha Trang', 'Phước Tiến', 'Nha Trang', 'Nha Trang', 4),
('Khách sạn Diamond Bay Resort & Spa', 'Vĩnh Trường', 'Nha Trang', 'Nha Trang', 4),
('Khách sạn Vinpearl Resort Nha Trang', 'Hòn Tre', 'Nha Trang', 'Nha Trang', 4),

-- Phú Quốc (idDiaDiem = 5)
('Khách sạn JW Marriott Phu Quoc', 'Dương Tơ', 'Phú Quốc', 'Phú Quốc', 5),
('Khách sạn Vinpearl Resort Phu Quoc', 'Cửa Cạn', 'Phú Quốc', 'Phú Quốc', 5),
('Khách sạn Premier Village Phu Quoc', 'Hàm Ninh', 'Phú Quốc', 'Phú Quốc', 5),
('Khách sạn Novotel Phu Quoc Resort', 'Bãi Trước', 'Phú Quốc', 'Phú Quốc', 5),
('Khách sạn Mövenpick Resort Waverly Phu Quoc', 'Bãi Ông Xá', 'Phú Quốc', 'Phú Quốc', 5);



INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
(1, 1500000, 1, 1),
(2, 3000000, 1, 1),
(3, 1000000, 1, 2),
(1, 2000000, 1, 3),
(4, 1800000, 1, 4);

INSERT INTO TienNghi (tenTienNghi) VALUES 
('Hồ bơi'), ('Wifi'), ('Máy lạnh'), ('TV'), ('Tủ lạnh');

INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
(1, 1), (1, 2), (1, 3),  -- Phòng 1 có hồ bơi, wifi, máy lạnh
(2, 2), (2, 4),  -- Phòng 2 có wifi, TV
(3, 3), (3, 5);  -- Phòng 3 có máy lạnh, tủ lạnh

INSERT INTO KhachHang (hoTen, email, soDienThoai, diaChi) VALUES 
('Nguyễn Văn An', 'nguyenvanan@gmail.com', '0901234567', 'Quận 1, TP.HCM'),
('Trần Thị Bình', 'tranthib@gmail.com', '0912345678', 'Quận Hoàn Kiếm, Hà Nội'),
('Lê Văn Cường', 'levanc@gmail.com', '0923456789', 'Quận Hải Châu, Đà Nẵng'),
('Phạm Thị Dung', 'phamthid@gmail.com', '0934567890', 'Quận Nha Trang, Khánh Hòa'),
('Admin System', 'admin@system.com', '0909888777', 'TP.HCM');
INSERT INTO KhachHang (hoTen, email, soDienThoai, diaChi) VALUES 
('Lê Vĩnh Thái', 'levinhthai2015@gmail.com', '0978537109', 'Quận 12, TP.HCM');

INSERT INTO TaiKhoan (idKhachHang, tenDangNhap, matKhau, quyenHan, trangThai) VALUES 
(1, 'nguyenvanan', '$2b$10$M1cfYBlNR3MizAuJGVod.OdgPI0gwJUyyquZv5NDRGOJYmzKwx90y', 'user', 1),
(2, 'tranthib', '$2b$10$M1cfYBlNR3MizAuJGVod.OdgPI0gwJUyyquZv5NDRGOJYmzKwx90y', 'user', 1),
(3, 'levanc', '$2b$10$M1cfYBlNR3MizAuJGVod.OdgPI0gwJUyyquZv5NDRGOJYmzKwx90y', 'user', 1),
(4, 'phamthid', '$2b$10$M1cfYBlNR3MizAuJGVod.OdgPI0gwJUyyquZv5NDRGOJYmzKwx90y', 'user', 1),
(5, 'admin', '$2b$10$M1cfYBlNR3MizAuJGVod.OdgPI0gwJUyyquZv5NDRGOJYmzKwx90y', 'admin', 1),
(6, 'levinhthai', '$2b$10$M1cfYBlNR3MizAuJGVod.OdgPI0gwJUyyquZv5NDRGOJYmzKwx90y', 'user', 1);

-- Dữ liệu cho tài khoản admin (không cần idDiaDiem)
INSERT INTO TaiKhoan (idKhachHang, tenDangNhap, matKhau, quyenHan) VALUES 
(NULL, 'adminvy', '$2b$10$M1cfYBlNR3MizAuJGVod.OdgPI0gwJUyyquZv5NDRGOJYmzKwx90y', 'admin');

-- Dữ liệu cho tài khoản manager theo từng khu vực
-- manager_hcm: quản lý khách sạn ở Hồ Chí Minh (idDiaDiem = 1)
-- manager_hanoi: quản lý khách sạn ở Hà Nội (idDiaDiem = 2)
-- Thêm manager quản lý Đà Nẵng (idDiaDiem = 3)
-- Thêm manager quản lý Nha Trang (idDiaDiem = 4)
-- Thêm manager quản lý Phú Quốc (idDiaDiem = 5)
INSERT INTO TaiKhoan (idKhachHang, tenDangNhap, matKhau, quyenHan, idDiaDiem) VALUES 
(NULL, 'manager_hcm', '$2b$10$M1cfYBlNR3MizAuJGVod.OdgPI0gwJUyyquZv5NDRGOJYmzKwx90y', 'manager', 1),
(NULL, 'manager_hanoi', '$2b$10$M1cfYBlNR3MizAuJGVod.OdgPI0gwJUyyquZv5NDRGOJYmzKwx90y', 'manager', 2),
(NULL, 'manager_danang', '$2b$10$M1cfYBlNR3MizAuJGVod.OdgPI0gwJUyyquZv5NDRGOJYmzKwx90y', 'manager', 3),
(NULL, 'manager_nhatrang', '$2b$10$M1cfYBlNR3MizAuJGVod.OdgPI0gwJUyyquZv5NDRGOJYmzKwx90y', 'manager', 4),
(NULL, 'manager_phuquoc', '$2b$10$M1cfYBlNR3MizAuJGVod.OdgPI0gwJUyyquZv5NDRGOJYmzKwx90y', 'manager', 5);

-- INSERT cho bảng DatPhong với trường donGia bắt buộc
INSERT INTO DatPhong (idPhong, idKhachHang, ngayBatDau, ngayKetThuc, ngayTao, donGia, trangThai) VALUES 
(1, 1, '2025-01-10', '2025-01-15', '2025-01-9 14:30:00', 1800000, 2),
(2, 2, '2025-01-12', '2025-01-18', '2025-01-11 09:15:00', 2200000, 2),
(3, 3, '2025-02-05', '2025-02-10', '2025-02-04 18:45:00', 1950000, 2),
(4, 4, '2025-03-15', '2025-03-20', '2025-03-13 11:20:00', 2500000, 2);

-- INSERT cho bảng LichSuDatPhong (giữ nguyên)
INSERT INTO LichSuDatPhong (idDatPhong, idKhachHang, trangThai, ghiChu) VALUES 
(1, 1, 'dat', 'Đặt phòng thành công'),
(2, 2, 'dat', 'Đặt phòng thành công'),
(3, 3, 'dat', 'Đặt phòng thành công'),
(4, 4, 'dat', 'Đặt phòng thành công');

-- HỒ CHÍ MINH __________________________________________________________________________________________
-- 1. Khách sạn Majestic (idKhachSan = 1)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 1500000, 1, 1),
(1, 1500000, 1, 1),
(1, 1500000, 1, 1),
-- 3 phòng Suite
(2, 3000000, 1, 1),
(2, 3000000, 1, 1),
(2, 3000000, 1, 1),
-- 2 phòng Standard
(3, 1200000, 1, 1),
(3, 1200000, 1, 1),
-- 2 phòng Superior
(4, 1800000, 1, 1),
(4, 1800000, 1, 1);

-- Thêm tiện nghi cho từng phòng của Majestic
-- Giả sử 10 phòng vừa thêm có id từ 6-15 (do đã có 5 phòng từ trước)
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5),
(7, 1), (7, 2), (7, 3), (7, 4), (7, 5),
(8, 1), (8, 2), (8, 3), (8, 4), (8, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(9, 1), (9, 2), (9, 3), (9, 4),
(10, 1), (10, 2), (10, 3), (10, 4),
(11, 1), (11, 2), (11, 3), (11, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(12, 2), (12, 3), (12, 4),
(13, 2), (13, 3), (13, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(14, 2), (14, 3), (14, 4), (14, 5),
(15, 2), (15, 3), (15, 4), (15, 5);

-- 2. Khách sạn Rex (idKhachSan = 2)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 1600000, 1, 2),
(1, 1600000, 1, 2),
(1, 1600000, 1, 2),
-- 3 phòng Suite
(2, 3200000, 1, 2),
(2, 3200000, 1, 2),
(2, 3200000, 1, 2),
-- 2 phòng Standard
(3, 1100000, 1, 2),
(3, 1100000, 1, 2),
-- 2 phòng Superior
(4, 1900000, 1, 2),
(4, 1900000, 1, 2);

-- Thêm tiện nghi cho từng phòng của Rex
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(16, 1), (16, 2), (16, 3), (16, 4), (16, 5),
(17, 1), (17, 2), (17, 3), (17, 4), (17, 5),
(18, 1), (18, 2), (18, 3), (18, 4), (18, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(19, 1), (19, 2), (19, 3), (19, 4),
(20, 1), (20, 2), (20, 3), (20, 4),
(21, 1), (21, 2), (21, 3), (21, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(22, 2), (22, 3), (22, 4),
(23, 2), (23, 3), (23, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(24, 2), (24, 3), (24, 4), (24, 5),
(25, 2), (25, 3), (25, 4), (25, 5);

-- 3. Khách sạn Caravelle (idKhachSan = 3)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 1700000, 1, 3),
(1, 1700000, 1, 3),
(1, 1700000, 1, 3),
-- 3 phòng Suite
(2, 3500000, 1, 3),
(2, 3500000, 1, 3),
(2, 3500000, 1, 3),
-- 2 phòng Standard
(3, 1300000, 1, 3),
(3, 1300000, 1, 3),
-- 2 phòng Superior
(4, 2000000, 1, 3),
(4, 2000000, 1, 3);

-- Thêm tiện nghi cho từng phòng của Caravelle
-- Phòng từ id 26-35
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(26, 1), (26, 2), (26, 3), (26, 4), (26, 5),
(27, 1), (27, 2), (27, 3), (27, 4), (27, 5),
(28, 1), (28, 2), (28, 3), (28, 4), (28, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(29, 1), (29, 2), (29, 3), (29, 4),
(30, 1), (30, 2), (30, 3), (30, 4),
(31, 1), (31, 2), (31, 3), (31, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(32, 2), (32, 3), (32, 4),
(33, 2), (33, 3), (33, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(34, 2), (34, 3), (34, 4), (34, 5),
(35, 2), (35, 3), (35, 4), (35, 5);

-- 4. Khách sạn Times Square (idKhachSan = 4)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 1400000, 1, 4),
(1, 1400000, 1, 4),
(1, 1400000, 1, 4),
-- 3 phòng Suite
(2, 2800000, 1, 4),
(2, 2800000, 1, 4),
(2, 2800000, 1, 4),
-- 2 phòng Standard
(3, 900000, 1, 4),
(3, 900000, 1, 4),
-- 2 phòng Superior
(4, 1700000, 1, 4),
(4, 1700000, 1, 4);

-- Thêm tiện nghi cho từng phòng của Times Square
-- Phòng từ id 36-45
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(36, 1), (36, 2), (36, 3), (36, 4), (36, 5),
(37, 1), (37, 2), (37, 3), (37, 4), (37, 5),
(38, 1), (38, 2), (38, 3), (38, 4), (38, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(39, 1), (39, 2), (39, 3), (39, 4),
(40, 1), (40, 2), (40, 3), (40, 4),
(41, 1), (41, 2), (41, 3), (41, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(42, 2), (42, 3), (42, 4),
(43, 2), (43, 3), (43, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(44, 2), (44, 3), (44, 4), (44, 5),
(45, 2), (45, 3), (45, 4), (45, 5);

-- 5. Khách sạn Sheraton Saigon (idKhachSan = 5)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 2000000, 1, 5),
(1, 2000000, 1, 5),
(1, 2000000, 1, 5),
-- 3 phòng Suite
(2, 4000000, 1, 5),
(2, 4000000, 1, 5),
(2, 4000000, 1, 5),
-- 2 phòng Standard
(3, 1500000, 1, 5),
(3, 1500000, 1, 5),
-- 2 phòng Superior
(4, 2500000, 1, 5),
(4, 2500000, 1, 5);

-- Thêm tiện nghi cho từng phòng của Sheraton Saigon
-- Phòng từ id 46-55
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(46, 1), (46, 2), (46, 3), (46, 4), (46, 5),
(47, 1), (47, 2), (47, 3), (47, 4), (47, 5),
(48, 1), (48, 2), (48, 3), (48, 4), (48, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(49, 1), (49, 2), (49, 3), (49, 4),
(50, 1), (50, 2), (50, 3), (50, 4),
(51, 1), (51, 2), (51, 3), (51, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(52, 2), (52, 3), (52, 4),
(53, 2), (53, 3), (53, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(54, 2), (54, 3), (54, 4), (54, 5),
(55, 2), (55, 3), (55, 4), (55, 5);

-- HÀ NỘI __________________________________________________________________________________________
-- 6. Khách sạn Melia Hanoi (idKhachSan = 6)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 2200000, 1, 6),
(1, 2200000, 1, 6),
(1, 2200000, 1, 6),
-- 3 phòng Suite
(2, 4500000, 1, 6),
(2, 4500000, 1, 6),
(2, 4500000, 1, 6),
-- 2 phòng Standard
(3, 1600000, 1, 6),
(3, 1600000, 1, 6),
-- 2 phòng Superior
(4, 2800000, 1, 6),
(4, 2800000, 1, 6);

-- Thêm tiện nghi cho từng phòng của Melia Hanoi
-- Phòng từ id 56-65
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(56, 1), (56, 2), (56, 3), (56, 4), (56, 5),
(57, 1), (57, 2), (57, 3), (57, 4), (57, 5),
(58, 1), (58, 2), (58, 3), (58, 4), (58, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(59, 1), (59, 2), (59, 3), (59, 4),
(60, 1), (60, 2), (60, 3), (60, 4),
(61, 1), (61, 2), (61, 3), (61, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(62, 2), (62, 3), (62, 4),
(63, 2), (63, 3), (63, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(64, 2), (64, 3), (64, 4), (64, 5),
(65, 2), (65, 3), (65, 4), (65, 5);

-- 7. Khách sạn Lotte Hotel Hanoi (idKhachSan = 7)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 2500000, 1, 7),
(1, 2500000, 1, 7),
(1, 2500000, 1, 7),
-- 3 phòng Suite
(2, 5000000, 1, 7),
(2, 5000000, 1, 7),
(2, 5000000, 1, 7),
-- 2 phòng Standard
(3, 1800000, 1, 7),
(3, 1800000, 1, 7),
-- 2 phòng Superior
(4, 3000000, 1, 7),
(4, 3000000, 1, 7);

-- Thêm tiện nghi cho từng phòng của Lotte Hotel Hanoi
-- Phòng từ id 66-75
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(66, 1), (66, 2), (66, 3), (66, 4), (66, 5),
(67, 1), (67, 2), (67, 3), (67, 4), (67, 5),
(68, 1), (68, 2), (68, 3), (68, 4), (68, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(69, 1), (69, 2), (69, 3), (69, 4),
(70, 1), (70, 2), (70, 3), (70, 4),
(71, 1), (71, 2), (71, 3), (71, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(72, 2), (72, 3), (72, 4),
(73, 2), (73, 3), (73, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(74, 2), (74, 3), (74, 4), (74, 5),
(75, 2), (75, 3), (75, 4), (75, 5);

-- 8. Khách sạn Sofitel Legend Metropole (idKhachSan = 8)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 2800000, 1, 8),
(1, 2800000, 1, 8),
(1, 2800000, 1, 8),
-- 3 phòng Suite
(2, 5500000, 1, 8),
(2, 5500000, 1, 8),
(2, 5500000, 1, 8),
-- 2 phòng Standard
(3, 2000000, 1, 8),
(3, 2000000, 1, 8),
-- 2 phòng Superior
(4, 3200000, 1, 8),
(4, 3200000, 1, 8);

-- Thêm tiện nghi cho từng phòng của Sofitel Legend Metropole
-- Phòng từ id 76-85
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(76, 1), (76, 2), (76, 3), (76, 4), (76, 5),
(77, 1), (77, 2), (77, 3), (77, 4), (77, 5),
(78, 1), (78, 2), (78, 3), (78, 4), (78, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(79, 1), (79, 2), (79, 3), (79, 4),
(80, 1), (80, 2), (80, 3), (80, 4),
(81, 1), (81, 2), (81, 3), (81, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(82, 2), (82, 3), (82, 4),
(83, 2), (83, 3), (83, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(84, 2), (84, 3), (84, 4), (84, 5),
(85, 2), (85, 3), (85, 4), (85, 5);

-- 9. Khách sạn JW Marriott Hanoi (idKhachSan = 9)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 2600000, 1, 9),
(1, 2600000, 1, 9),
(1, 2600000, 1, 9),
-- 3 phòng Suite
(2, 5200000, 1, 9),
(2, 5200000, 1, 9),
(2, 5200000, 1, 9),
-- 2 phòng Standard
(3, 1900000, 1, 9),
(3, 1900000, 1, 9),
-- 2 phòng Superior
(4, 3000000, 1, 9),
(4, 3000000, 1, 9);

-- Thêm tiện nghi cho từng phòng của JW Marriott Hanoi
-- Phòng từ id 86-95
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(86, 1), (86, 2), (86, 3), (86, 4), (86, 5),
(87, 1), (87, 2), (87, 3), (87, 4), (87, 5),
(88, 1), (88, 2), (88, 3), (88, 4), (88, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(89, 1), (89, 2), (89, 3), (89, 4),
(90, 1), (90, 2), (90, 3), (90, 4),
(91, 1), (91, 2), (91, 3), (91, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(92, 2), (92, 3), (92, 4),
(93, 2), (93, 3), (93, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(94, 2), (94, 3), (94, 4), (94, 5),
(95, 2), (95, 3), (95, 4), (95, 5);

-- 10. Khách sạn InterContinental Hanoi Westlake (idKhachSan = 10)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 2700000, 1, 10),
(1, 2700000, 1, 10),
(1, 2700000, 1, 10),
-- 3 phòng Suite
(2, 5300000, 1, 10),
(2, 5300000, 1, 10),
(2, 5300000, 1, 10),
-- 2 phòng Standard
(3, 1950000, 1, 10),
(3, 1950000, 1, 10),
-- 2 phòng Superior
(4, 3100000, 1, 10),
(4, 3100000, 1, 10);

-- Thêm tiện nghi cho từng phòng của InterContinental Hanoi Westlake
-- Phòng từ id 96-105
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(96, 1), (96, 2), (96, 3), (96, 4), (96, 5),
(97, 1), (97, 2), (97, 3), (97, 4), (97, 5),
(98, 1), (98, 2), (98, 3), (98, 4), (98, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(99, 1), (99, 2), (99, 3), (99, 4),
(100, 1), (100, 2), (100, 3), (100, 4),
(101, 1), (101, 2), (101, 3), (101, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(102, 2), (102, 3), (102, 4),
(103, 2), (103, 3), (103, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(104, 2), (104, 3), (104, 4), (104, 5),
(105, 2), (105, 3), (105, 4), (105, 5);
-- ĐÀ NẴNG __________________________________________________________________________________________
-- 11. Khách sạn Novotel Danang (idKhachSan = 11)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 1800000, 1, 11),
(1, 1800000, 1, 11),
(1, 1800000, 1, 11),
-- 3 phòng Suite
(2, 3600000, 1, 11),
(2, 3600000, 1, 11),
(2, 3600000, 1, 11),
-- 2 phòng Standard
(3, 1200000, 1, 11),
(3, 1200000, 1, 11),
-- 2 phòng Superior
(4, 2200000, 1, 11),
(4, 2200000, 1, 11);

-- Thêm tiện nghi cho từng phòng của Novotel Danang
-- Phòng từ id 106-115
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(106, 1), (106, 2), (106, 3), (106, 4), (106, 5),
(107, 1), (107, 2), (107, 3), (107, 4), (107, 5),
(108, 1), (108, 2), (108, 3), (108, 4), (108, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(109, 1), (109, 2), (109, 3), (109, 4),
(110, 1), (110, 2), (110, 3), (110, 4),
(111, 1), (111, 2), (111, 3), (111, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(112, 2), (112, 3), (112, 4),
(113, 2), (113, 3), (113, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(114, 2), (114, 3), (114, 4), (114, 5),
(115, 2), (115, 3), (115, 4), (115, 5);

-- 12. Khách sạn Hilton Da Nang (idKhachSan = 12)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 2000000, 1, 12),
(1, 2000000, 1, 12),
(1, 2000000, 1, 12),
-- 3 phòng Suite
(2, 4000000, 1, 12),
(2, 4000000, 1, 12),
(2, 4000000, 1, 12),
-- 2 phòng Standard
(3, 1400000, 1, 12),
(3, 1400000, 1, 12),
-- 2 phòng Superior
(4, 2400000, 1, 12),
(4, 2400000, 1, 12);

-- Thêm tiện nghi cho từng phòng của Hilton Da Nang
-- Phòng từ id 116-125
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(116, 1), (116, 2), (116, 3), (116, 4), (116, 5),
(117, 1), (117, 2), (117, 3), (117, 4), (117, 5),
(118, 1), (118, 2), (118, 3), (118, 4), (118, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(119, 1), (119, 2), (119, 3), (119, 4),
(120, 1), (120, 2), (120, 3), (120, 4),
(121, 1), (121, 2), (121, 3), (121, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(122, 2), (122, 3), (122, 4),
(123, 2), (123, 3), (123, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(124, 2), (124, 3), (124, 4), (124, 5),
(125, 2), (125, 3), (125, 4), (125, 5);

-- 13. Khách sạn Vinpearl Condotel (idKhachSan = 13)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 1900000, 1, 13),
(1, 1900000, 1, 13),
(1, 1900000, 1, 13),
-- 3 phòng Suite
(2, 3800000, 1, 13),
(2, 3800000, 1, 13),
(2, 3800000, 1, 13),
-- 2 phòng Standard
(3, 1300000, 1, 13),
(3, 1300000, 1, 13),
-- 2 phòng Superior
(4, 2300000, 1, 13),
(4, 2300000, 1, 13);

-- Thêm tiện nghi cho từng phòng của Vinpearl Condotel
-- Phòng từ id 126-135
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(126, 1), (126, 2), (126, 3), (126, 4), (126, 5),
(127, 1), (127, 2), (127, 3), (127, 4), (127, 5),
(128, 1), (128, 2), (128, 3), (128, 4), (128, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(129, 1), (129, 2), (129, 3), (129, 4),
(130, 1), (130, 2), (130, 3), (130, 4),
(131, 1), (131, 2), (131, 3), (131, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(132, 2), (132, 3), (132, 4),
(133, 2), (133, 3), (133, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(134, 2), (134, 3), (134, 4), (134, 5),
(135, 2), (135, 3), (135, 4), (135, 5);

-- 14. Khách sạn Grand Mercure Danang (idKhachSan = 14)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 1850000, 1, 14),
(1, 1850000, 1, 14),
(1, 1850000, 1, 14),
-- 3 phòng Suite
(2, 3700000, 1, 14),
(2, 3700000, 1, 14),
(2, 3700000, 1, 14),
-- 2 phòng Standard
(3, 1250000, 1, 14),
(3, 1250000, 1, 14),
-- 2 phòng Superior
(4, 2250000, 1, 14),
(4, 2250000, 1, 14);

-- Thêm tiện nghi cho từng phòng của Grand Mercure Danang
-- Phòng từ id 136-145
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(136, 1), (136, 2), (136, 3), (136, 4), (136, 5),
(137, 1), (137, 2), (137, 3), (137, 4), (137, 5),
(138, 1), (138, 2), (138, 3), (138, 4), (138, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(139, 1), (139, 2), (139, 3), (139, 4),
(140, 1), (140, 2), (140, 3), (140, 4),
(141, 1), (141, 2), (141, 3), (141, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(142, 2), (142, 3), (142, 4),
(143, 2), (143, 3), (143, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(144, 2), (144, 3), (144, 4), (144, 5),
(145, 2), (145, 3), (145, 4), (145, 5);

-- 15. Khách sạn Pullman Danang Beach Resort (idKhachSan = 15)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 2100000, 1, 15),
(1, 2100000, 1, 15),
(1, 2100000, 1, 15),
-- 3 phòng Suite
(2, 4200000, 1, 15),
(2, 4200000, 1, 15),
(2, 4200000, 1, 15),
-- 2 phòng Standard
(3, 1500000, 1, 15),
(3, 1500000, 1, 15),
-- 2 phòng Superior
(4, 2600000, 1, 15),
(4, 2600000, 1, 15);

-- Thêm tiện nghi cho từng phòng của Pullman Danang Beach Resort
-- Phòng từ id 146-155
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(146, 1), (146, 2), (146, 3), (146, 4), (146, 5),
(147, 1), (147, 2), (147, 3), (147, 4), (147, 5),
(148, 1), (148, 2), (148, 3), (148, 4), (148, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(149, 1), (149, 2), (149, 3), (149, 4),
(150, 1), (150, 2), (150, 3), (150, 4),
(151, 1), (151, 2), (151, 3), (151, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(152, 2), (152, 3), (152, 4),
(153, 2), (153, 3), (153, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(154, 2), (154, 3), (154, 4), (154, 5),
(155, 2), (155, 3), (155, 4), (155, 5);

-- NHA TRANG __________________________________________________________________________________________
-- 16. Khách sạn InterContinental Nha Trang (idKhachSan = 16)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 2200000, 1, 16),
(1, 2200000, 1, 16),
(1, 2200000, 1, 16),
-- 3 phòng Suite
(2, 4400000, 1, 16),
(2, 4400000, 1, 16),
(2, 4400000, 1, 16),
-- 2 phòng Standard
(3, 1600000, 1, 16),
(3, 1600000, 1, 16),
-- 2 phòng Superior
(4, 2800000, 1, 16),
(4, 2800000, 1, 16);

-- Thêm tiện nghi cho từng phòng của InterContinental Nha Trang
-- Phòng từ id 156-165
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(156, 1), (156, 2), (156, 3), (156, 4), (156, 5),
(157, 1), (157, 2), (157, 3), (157, 4), (157, 5),
(158, 1), (158, 2), (158, 3), (158, 4), (158, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(159, 1), (159, 2), (159, 3), (159, 4),
(160, 1), (160, 2), (160, 3), (160, 4),
(161, 1), (161, 2), (161, 3), (161, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(162, 2), (162, 3), (162, 4),
(163, 2), (163, 3), (163, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(164, 2), (164, 3), (164, 4), (164, 5),
(165, 2), (165, 3), (165, 4), (165, 5);

-- 17. Khách sạn Sheraton Nha Trang (idKhachSan = 17)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 2000000, 1, 17),
(1, 2000000, 1, 17),
(1, 2000000, 1, 17),
-- 3 phòng Suite
(2, 4000000, 1, 17),
(2, 4000000, 1, 17),
(2, 4000000, 1, 17),
-- 2 phòng Standard
(3, 1400000, 1, 17),
(3, 1400000, 1, 17),
-- 2 phòng Superior
(4, 2600000, 1, 17),
(4, 2600000, 1, 17);

-- Thêm tiện nghi cho từng phòng của Sheraton Nha Trang
-- Phòng từ id 166-175
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(166, 1), (166, 2), (166, 3), (166, 4), (166, 5),
(167, 1), (167, 2), (167, 3), (167, 4), (167, 5),
(168, 1), (168, 2), (168, 3), (168, 4), (168, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(169, 1), (169, 2), (169, 3), (169, 4),
(170, 1), (170, 2), (170, 3), (170, 4),
(171, 1), (171, 2), (171, 3), (171, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(172, 2), (172, 3), (172, 4),
(173, 2), (173, 3), (173, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(174, 2), (174, 3), (174, 4), (174, 5),
(175, 2), (175, 3), (175, 4), (175, 5);

-- 18. Khách sạn Mường Thanh Nha Trang (idKhachSan = 18)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 1600000, 1, 18),
(1, 1600000, 1, 18),
(1, 1600000, 1, 18),
-- 3 phòng Suite
(2, 3200000, 1, 18),
(2, 3200000, 1, 18),
(2, 3200000, 1, 18),
-- 2 phòng Standard
(3, 1000000, 1, 18),
(3, 1000000, 1, 18),
-- 2 phòng Superior
(4, 2000000, 1, 18),
(4, 2000000, 1, 18);

-- Thêm tiện nghi cho từng phòng của Mường Thanh Nha Trang
-- Phòng từ id 176-185
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(176, 1), (176, 2), (176, 3), (176, 4), (176, 5),
(177, 1), (177, 2), (177, 3), (177, 4), (177, 5),
(178, 1), (178, 2), (178, 3), (178, 4), (178, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(179, 1), (179, 2), (179, 3), (179, 4),
(180, 1), (180, 2), (180, 3), (180, 4),
(181, 1), (181, 2), (181, 3), (181, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(182, 2), (182, 3), (182, 4),
(183, 2), (183, 3), (183, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(184, 2), (184, 3), (184, 4), (184, 5),
(185, 2), (185, 3), (185, 4), (185, 5);

-- 19. Khách sạn Diamond Bay Resort & Spa (idKhachSan = 19)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 1900000, 1, 19),
(1, 1900000, 1, 19),
(1, 1900000, 1, 19),
-- 3 phòng Suite
(2, 3800000, 1, 19),
(2, 3800000, 1, 19),
(2, 3800000, 1, 19),
-- 2 phòng Standard
(3, 1300000, 1, 19),
(3, 1300000, 1, 19),
-- 2 phòng Superior
(4, 2400000, 1, 19),
(4, 2400000, 1, 19);

-- Thêm tiện nghi cho từng phòng của Diamond Bay Resort & Spa
-- Phòng từ id 186-195
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(186, 1), (186, 2), (186, 3), (186, 4), (186, 5),
(187, 1), (187, 2), (187, 3), (187, 4), (187, 5),
(188, 1), (188, 2), (188, 3), (188, 4), (188, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(189, 1), (189, 2), (189, 3), (189, 4),
(190, 1), (190, 2), (190, 3), (190, 4),
(191, 1), (191, 2), (191, 3), (191, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(192, 2), (192, 3), (192, 4),
(193, 2), (193, 3), (193, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(194, 2), (194, 3), (194, 4), (194, 5),
(195, 2), (195, 3), (195, 4), (195, 5);

-- 20. Khách sạn Vinpearl Resort Nha Trang (idKhachSan = 20)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 2300000, 1, 20),
(1, 2300000, 1, 20),
(1, 2300000, 1, 20),
-- 3 phòng Suite
(2, 4600000, 1, 20),
(2, 4600000, 1, 20),
(2, 4600000, 1, 20),
-- 2 phòng Standard
(3, 1700000, 1, 20),
(3, 1700000, 1, 20),
-- 2 phòng Superior
(4, 2900000, 1, 20),
(4, 2900000, 1, 20);

-- Thêm tiện nghi cho từng phòng của Vinpearl Resort Nha Trang
-- Phòng từ id 196-205
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(196, 1), (196, 2), (196, 3), (196, 4), (196, 5),
(197, 1), (197, 2), (197, 3), (197, 4), (197, 5),
(198, 1), (198, 2), (198, 3), (198, 4), (198, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(199, 1), (199, 2), (199, 3), (199, 4),
(200, 1), (200, 2), (200, 3), (200, 4),
(201, 1), (201, 2), (201, 3), (201, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(202, 2), (202, 3), (202, 4),
(203, 2), (203, 3), (203, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(204, 2), (204, 3), (204, 4), (204, 5),
(205, 2), (205, 3), (205, 4), (205, 5);

-- PHÚ QUỐC __________________________________________________________________________________________
-- 21. Khách sạn JW Marriott Phu Quoc (idKhachSan = 21)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 2500000, 1, 21),
(1, 2500000, 1, 21),
(1, 2500000, 1, 21),
-- 3 phòng Suite
(2, 5000000, 1, 21),
(2, 5000000, 1, 21),
(2, 5000000, 1, 21),
-- 2 phòng Standard
(3, 1800000, 1, 21),
(3, 1800000, 1, 21),
-- 2 phòng Superior
(4, 3200000, 1, 21),
(4, 3200000, 1, 21);

-- Thêm tiện nghi cho từng phòng của JW Marriott Phu Quoc
-- Phòng từ id 206-215
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(206, 1), (206, 2), (206, 3), (206, 4), (206, 5),
(207, 1), (207, 2), (207, 3), (207, 4), (207, 5),
(208, 1), (208, 2), (208, 3), (208, 4), (208, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(209, 1), (209, 2), (209, 3), (209, 4),
(210, 1), (210, 2), (210, 3), (210, 4),
(211, 1), (211, 2), (211, 3), (211, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(212, 2), (212, 3), (212, 4),
(213, 2), (213, 3), (213, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(214, 2), (214, 3), (214, 4), (214, 5),
(215, 2), (215, 3), (215, 4), (215, 5);

-- 22. Khách sạn Vinpearl Resort Phu Quoc (idKhachSan = 22)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 2400000, 1, 22),
(1, 2400000, 1, 22),
(1, 2400000, 1, 22),
-- 3 phòng Suite
(2, 4800000, 1, 22),
(2, 4800000, 1, 22),
(2, 4800000, 1, 22),
-- 2 phòng Standard
(3, 1700000, 1, 22),
(3, 1700000, 1, 22),
-- 2 phòng Superior
(4, 3000000, 1, 22),
(4, 3000000, 1, 22);

-- Thêm tiện nghi cho từng phòng của Vinpearl Resort Phu Quoc
-- Phòng từ id 216-225
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(216, 1), (216, 2), (216, 3), (216, 4), (216, 5),
(217, 1), (217, 2), (217, 3), (217, 4), (217, 5),
(218, 1), (218, 2), (218, 3), (218, 4), (218, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(219, 1), (219, 2), (219, 3), (219, 4),
(220, 1), (220, 2), (220, 3), (220, 4),
(221, 1), (221, 2), (221, 3), (221, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(222, 2), (222, 3), (222, 4),
(223, 2), (223, 3), (223, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(224, 2), (224, 3), (224, 4), (224, 5),
(225, 2), (225, 3), (225, 4), (225, 5);

-- 23. Khách sạn Premier Village Phu Quoc (idKhachSan = 23)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 2600000, 1, 23),
(1, 2600000, 1, 23),
(1, 2600000, 1, 23),
-- 3 phòng Suite
(2, 5200000, 1, 23),
(2, 5200000, 1, 23),
(2, 5200000, 1, 23),
-- 2 phòng Standard
(3, 1900000, 1, 23),
(3, 1900000, 1, 23),
-- 2 phòng Superior
(4, 3300000, 1, 23),
(4, 3300000, 1, 23);

-- Thêm tiện nghi cho từng phòng của Premier Village Phu Quoc
-- Phòng từ id 226-235
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(226, 1), (226, 2), (226, 3), (226, 4), (226, 5),
(227, 1), (227, 2), (227, 3), (227, 4), (227, 5),
(228, 1), (228, 2), (228, 3), (228, 4), (228, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(229, 1), (229, 2), (229, 3), (229, 4),
(230, 1), (230, 2), (230, 3), (230, 4),
(231, 1), (231, 2), (231, 3), (231, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(232, 2), (232, 3), (232, 4),
(233, 2), (233, 3), (233, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(234, 2), (234, 3), (234, 4), (234, 5),
(235, 2), (235, 3), (235, 4), (235, 5);

-- 24. Khách sạn Novotel Phu Quoc Resort (idKhachSan = 24)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 2000000, 1, 24),
(1, 2000000, 1, 24),
(1, 2000000, 1, 24),
-- 3 phòng Suite
(2, 4000000, 1, 24),
(2, 4000000, 1, 24),
(2, 4000000, 1, 24),
-- 2 phòng Standard
(3, 1500000, 1, 24),
(3, 1500000, 1, 24),
-- 2 phòng Superior
(4, 2600000, 1, 24),
(4, 2600000, 1, 24);

-- Thêm tiện nghi cho từng phòng của Novotel Phu Quoc Resort
-- Phòng từ id 236-245
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(236, 1), (236, 2), (236, 3), (236, 4), (236, 5),
(237, 1), (237, 2), (237, 3), (237, 4), (237, 5),
(238, 1), (238, 2), (238, 3), (238, 4), (238, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(239, 1), (239, 2), (239, 3), (239, 4),
(240, 1), (240, 2), (240, 3), (240, 4),
(241, 1), (241, 2), (241, 3), (241, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(242, 2), (242, 3), (242, 4),
(243, 2), (243, 3), (243, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(244, 2), (244, 3), (244, 4), (244, 5),
(245, 2), (245, 3), (245, 4), (245, 5);

-- 25. Khách sạn Mövenpick Resort Waverly Phu Quoc (idKhachSan = 25)
INSERT INTO Phong (idLoaiPhong, giaPhong, trangThai, idKhachSan) VALUES 
-- 3 phòng Deluxe
(1, 2300000, 1, 25),
(1, 2300000, 1, 25),
(1, 2300000, 1, 25),
-- 3 phòng Suite
(2, 4600000, 1, 25),
(2, 4600000, 1, 25),
(2, 4600000, 1, 25),
-- 2 phòng Standard
(3, 1700000, 1, 25),
(3, 1700000, 1, 25),
-- 2 phòng Superior
(4, 2800000, 1, 25),
(4, 2800000, 1, 25);

-- Thêm tiện nghi cho từng phòng của Mövenpick Resort Waverly
-- Phòng từ id 246-255
INSERT INTO Phong_TienNghi (idPhong, idTienNghi) VALUES 
-- 3 phòng Deluxe có đầy đủ tiện nghi
(246, 1), (246, 2), (246, 3), (246, 4), (246, 5),
(247, 1), (247, 2), (247, 3), (247, 4), (247, 5),
(248, 1), (248, 2), (248, 3), (248, 4), (248, 5),

-- 3 phòng Suite có hồ bơi, wifi, máy lạnh, TV
(249, 1), (249, 2), (249, 3), (249, 4),
(250, 1), (250, 2), (250, 3), (250, 4),
(251, 1), (251, 2), (251, 3), (251, 4),

-- 2 phòng Standard có wifi, máy lạnh, TV
(252, 2), (252, 3), (252, 4),
(253, 2), (253, 3), (253, 4),

-- 2 phòng Superior có wifi, máy lạnh, TV, tủ lạnh
(254, 2), (254, 3), (254, 4), (254, 5),
(255, 2), (255, 3), (255, 4), (255, 5);
-- PHÚ QUỐC __________________________________________________________________________________________


-- => Thêm ảnh cho khách sạn
ALTER TABLE KhachSan
ADD COLUMN hinhAnh VARCHAR(255);

-- Hồ Chí Minh
UPDATE KhachSan SET hinhAnh = '/hotels/majestic.jpg' WHERE idKhachSan = 1; -- Khách sạn Majestic
UPDATE KhachSan SET hinhAnh = '/hotels/rex.jpg' WHERE idKhachSan = 2; -- Khách sạn Rex
UPDATE KhachSan SET hinhAnh = '/hotels/caravelle.jpg' WHERE idKhachSan = 3; -- Khách sạn Caravelle (sửa từ continental)
UPDATE KhachSan SET hinhAnh = '/hotels/times-square.jpg' WHERE idKhachSan = 4; -- Khách sạn Times Square (sửa từ oscar)
UPDATE KhachSan SET hinhAnh = '/hotels/sheraton-saigon.jpg' WHERE idKhachSan = 5; -- Khách sạn Sheraton Saigon (sửa từ grand-hcm)

-- Hà Nội
UPDATE KhachSan SET hinhAnh = '/hotels/melia-hanoi.jpg' WHERE idKhachSan = 6; -- Khách sạn Melia Hanoi (sửa từ metropole)
UPDATE KhachSan SET hinhAnh = '/hotels/lotte-hanoi.jpg' WHERE idKhachSan = 7; -- Khách sạn Lotte Hotel Hanoi (sửa từ jw-marriott-hn)
UPDATE KhachSan SET hinhAnh = '/hotels/metropole.jpg' WHERE idKhachSan = 8; -- Khách sạn Sofitel Legend Metropole (sửa từ melia-hn)
UPDATE KhachSan SET hinhAnh = '/hotels/jw-marriott-hn.jpg' WHERE idKhachSan = 9; -- Khách sạn JW Marriott Hanoi (sửa từ intercontinental-hn)
UPDATE KhachSan SET hinhAnh = '/hotels/intercontinental-westlake.jpg' WHERE idKhachSan = 10; -- Khách sạn InterContinental Hanoi Westlake (sửa từ hilton-hn)

-- Đà Nẵng
UPDATE KhachSan SET hinhAnh = '/hotels/novotel-danang.jpg' WHERE idKhachSan = 11; -- Khách sạn Novotel Danang (sửa từ furama-dn)
UPDATE KhachSan SET hinhAnh = '/hotels/hilton-dn.jpg' WHERE idKhachSan = 12; -- Khách sạn Hilton Da Nang
UPDATE KhachSan SET hinhAnh = '/hotels/vinpearl-condotel.jpg' WHERE idKhachSan = 13; -- Khách sạn Vinpearl Condotel (sửa từ pullman-dn)
UPDATE KhachSan SET hinhAnh = '/hotels/grand-mercure.jpg' WHERE idKhachSan = 14; -- Khách sạn Grand Mercure Danang (sửa từ hyatt-dn)
UPDATE KhachSan SET hinhAnh = '/hotels/pullman-danang.jpg' WHERE idKhachSan = 15; -- Khách sạn Pullman Danang Beach Resort (sửa từ vinpearl-dn)

-- Nha Trang
UPDATE KhachSan SET hinhAnh = '/hotels/intercontinental-nt.jpg' WHERE idKhachSan = 16; -- Khách sạn InterContinental Nha Trang (sửa từ vinpearl-nt)
UPDATE KhachSan SET hinhAnh = '/hotels/sheraton-nt.jpg' WHERE idKhachSan = 17; -- Khách sạn Sheraton Nha Trang (sửa từ intercontinental-nt)
UPDATE KhachSan SET hinhAnh = '/hotels/muong-thanh-nt.jpg' WHERE idKhachSan = 18; -- Khách sạn Mường Thanh Nha Trang (sửa từ sheraton-nt)
UPDATE KhachSan SET hinhAnh = '/hotels/diamond-bay.jpg' WHERE idKhachSan = 19; -- Khách sạn Diamond Bay Resort & Spa (sửa từ muong-thanh-nt)
UPDATE KhachSan SET hinhAnh = '/hotels/vinpearl-nt.jpg' WHERE idKhachSan = 20; -- Khách sạn Vinpearl Resort Nha Trang (sửa từ liberty-nt)

-- Phú Quốc
UPDATE KhachSan SET hinhAnh = '/hotels/jw-marriott-pq.jpg' WHERE idKhachSan = 21; -- Khách sạn JW Marriott Phu Quoc
UPDATE KhachSan SET hinhAnh = '/hotels/vinpearl-pq.jpg' WHERE idKhachSan = 22; -- Khách sạn Vinpearl Resort Phu Quoc
UPDATE KhachSan SET hinhAnh = '/hotels/premier-village-pq.jpg' WHERE idKhachSan = 23; -- Khách sạn Premier Village Phu Quoc
UPDATE KhachSan SET hinhAnh = '/hotels/novotel-pq.jpg' WHERE idKhachSan = 24; -- Khách sạn Novotel Phu Quoc Resort
UPDATE KhachSan SET hinhAnh = '/hotels/movenpick-pq.jpg' WHERE idKhachSan = 25; -- Khách sạn Mövenpick Resort Waverly Phu Quoc