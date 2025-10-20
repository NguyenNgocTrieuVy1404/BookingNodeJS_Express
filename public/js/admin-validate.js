/**
 * Admin validate script
 * Xử lý validate tất cả các form trong trang admin
 */

// Khởi tạo các validate listeners khi trang đã load
document.addEventListener('DOMContentLoaded', function() {
    // Vô hiệu hóa validate HTML mặc định
    document.querySelectorAll('form').forEach(form => {
        form.setAttribute('novalidate', true);
    });
    
    // Áp dụng validate cho form thêm người dùng
    if (document.getElementById('addUserForm')) {
        initFormValidation('addUserForm');
    }
    
    // Áp dụng validate cho form thêm khách sạn
    if (document.getElementById('addHotelForm')) {
        initFormValidation('addHotelForm');
    }
    
    // Áp dụng validate cho form thêm đặt phòng
    if (document.getElementById('addBookingForm')) {
        initFormValidation('addBookingForm');
    }
    
    // Áp dụng validate cho form sửa khách sạn
    if (document.getElementById('editHotelForm')) {
        initFormValidation('editHotelForm');
    }
    
    // Áp dụng validate cho form sửa người dùng
    if (document.getElementById('editUserForm')) {
        initFormValidation('editUserForm');
    }
    
    // Áp dụng validate cho form sửa đặt phòng
    if (document.getElementById('editBookingForm')) {
        initFormValidation('editBookingForm');
    }
});

// Hàm khởi tạo validate cho một form
function initFormValidation(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    // Lấy tất cả các input, select elements trong form
    const inputs = form.querySelectorAll('input, select, textarea');
    
    // Thêm listeners cho mỗi trường
    inputs.forEach(input => {
        // Validate khi blur (rời khỏi trường)
        input.addEventListener('blur', function() {
            validateField(input);
        });
        
        // Validate khi input thay đổi (để clear error khi người dùng bắt đầu sửa)
        input.addEventListener('input', function() {
            // Clear error nếu người dùng bắt đầu nhập
            if (input.value.trim()) {
                clearError(input);
            }
        });
        
        // Trường hợp đặc biệt cho select elements
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', function() {
                validateField(input);
            });
        }
    });
}

// Hàm validate một trường cụ thể
function validateField(field) {
    const fieldId = field.id;
    const value = field.value.trim();
    
    // Validate theo loại field
    switch(fieldId) {
        case 'hoTen':
            if (!value) {
                showError(fieldId, 'Vui lòng nhập họ tên');
                return false;
            } else if (value.length < 3) {
                showError(fieldId, 'Họ tên phải có ít nhất 3 ký tự');
                return false;
            }
            break;
            
        case 'email':
            if (!value) {
                showError(fieldId, 'Vui lòng nhập email');
                return false;
            } else {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    showError(fieldId, 'Email không hợp lệ');
                    return false;
                }
            }
            break;
            
        case 'soDienThoai':
            if (!value) {
                showError(fieldId, 'Vui lòng nhập số điện thoại');
                return false;
            } else {
                const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
                if (!phoneRegex.test(value)) {
                    showError(fieldId, 'Số điện thoại không hợp lệ (VD: 0912345678)');
                    return false;
                }
            }
            break;
            
        case 'tenDangNhap':
            if (!value) {
                showError(fieldId, 'Vui lòng nhập tên đăng nhập');
                return false;
            } else if (value.length < 4) {
                showError(fieldId, 'Tên đăng nhập phải có ít nhất 4 ký tự');
                return false;
            }
            break;
            
        case 'matKhau':
            if (!value) {
                showError(fieldId, 'Vui lòng nhập mật khẩu');
                return false;
            } else if (value.length < 6) {
                showError(fieldId, 'Mật khẩu phải có ít nhất 6 ký tự');
                return false;
            }
            break;
            
        case 'tenKhachSan':
            if (!value) {
                showError(fieldId, 'Vui lòng nhập tên khách sạn');
                return false;
            } else if (value.length < 3) {
                showError(fieldId, 'Tên khách sạn phải có ít nhất 3 ký tự');
                return false;
            }
            break;
            
        case 'phuong':
            if (!value) {
                showError(fieldId, 'Vui lòng nhập phường/xã');
                return false;
            }
            break;
            
        case 'quan':
            if (!value) {
                showError(fieldId, 'Vui lòng nhập quận/huyện');
                return false;
            }
            break;
            
        case 'thanhPho':
            if (!value) {
                showError(fieldId, 'Vui lòng nhập thành phố');
                return false;
            }
            break;
            
        case 'idDiaDiem':
            if (!value) {
                showError(fieldId, 'Vui lòng chọn địa điểm');
                return false;
            }
            break;
            
        case 'hinhAnh':
            // Chỉ validate khi người dùng đã chọn file
            if (field.files && field.files.length > 0) {
                const file = field.files[0];
                
                // Kiểm tra loại file
                const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
                if (!validImageTypes.includes(file.type)) {
                    showError(fieldId, 'Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, GIF)');
                    return false;
                }
                
                // Kiểm tra kích thước file (giới hạn 5MB)
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (file.size > maxSize) {
                    showError(fieldId, 'Kích thước hình ảnh không được vượt quá 5MB');
                    return false;
                }
            } else if (field.getAttribute('required') === 'true') {
                showError(fieldId, 'Vui lòng chọn hình ảnh');
                return false;
            }
            break;
            
        case 'idKhachHang':
            if (!value) {
                showError(fieldId, 'Vui lòng chọn khách hàng');
                return false;
            }
            break;
            
        case 'idPhong':
            if (!value) {
                showError(fieldId, 'Vui lòng chọn phòng');
                return false;
            }
            break;
            
        case 'ngayBatDau':
            if (!value) {
                showError(fieldId, 'Vui lòng chọn ngày bắt đầu');
                return false;
            } else {
                // Kiểm tra ngày bắt đầu không phải trong quá khứ (chỉ áp dụng cho form thêm mới)
                const form = field.closest('form');
                if (form && form.id === 'addBookingForm') {
                    const startDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (startDate < today) {
                        showError(fieldId, 'Ngày bắt đầu không thể là ngày trong quá khứ');
                        return false;
                    }
                }
                
                // Kiểm tra ngày bắt đầu và ngày kết thúc
                const endDateInput = document.getElementById('ngayKetThuc');
                if (endDateInput && endDateInput.value) {
                    const startDate = new Date(value);
                    const endDate = new Date(endDateInput.value);
                    
                    if (endDate <= startDate) {
                        showError('ngayKetThuc', 'Ngày kết thúc phải sau ngày bắt đầu');
                        return false;
                    } else {
                        clearError('ngayKetThuc');
                    }
                }
            }
            break;
            
        case 'ngayKetThuc':
            if (!value) {
                showError(fieldId, 'Vui lòng chọn ngày kết thúc');
                return false;
            } else {
                // Kiểm tra ngày bắt đầu và ngày kết thúc
                const startDateInput = document.getElementById('ngayBatDau');
                if (startDateInput && startDateInput.value) {
                    const startDate = new Date(startDateInput.value);
                    const endDate = new Date(value);
                    
                    if (endDate <= startDate) {
                        showError(fieldId, 'Ngày kết thúc phải sau ngày bắt đầu');
                        return false;
                    }
                }
            }
            break;
            
        case 'donGia':
            if (!value) {
                showError(fieldId, 'Vui lòng nhập đơn giá');
                return false;
            } else if (isNaN(value) || parseFloat(value) <= 0) {
                showError(fieldId, 'Đơn giá phải là số dương');
                return false;
            }
            break;
            
        default:
            // Kiểm tra chung cho các trường còn lại
            if (field.hasAttribute('required') && !value) {
                showError(fieldId, 'Trường này không được để trống');
                return false;
            }
            break;
    }
    
    // Nếu qua tất cả validate, xóa thông báo lỗi
    clearError(fieldId);
    return true;
}

// Validate cho form thêm người dùng
function validateAddUserForm(event) {
    event.preventDefault();
    
    // Lấy giá trị form
    const hoTen = document.getElementById('hoTen').value.trim();
    const email = document.getElementById('email').value.trim();
    const soDienThoai = document.getElementById('soDienThoai').value.trim();
    const diaChi = document.getElementById('diaChi').value.trim();
    const tenDangNhap = document.getElementById('tenDangNhap').value.trim();
    const matKhau = document.getElementById('matKhau').value;
    const quyenHan = document.getElementById('quyenHan').value;
    
    // Reset lỗi (nếu có)
    resetErrors();
    
    // Validate tất cả các trường
    let hasError = false;
    
    // Validate từng trường
    if (!validateField(document.getElementById('hoTen'))) hasError = true;
    if (!validateField(document.getElementById('email'))) hasError = true;
    if (!validateField(document.getElementById('soDienThoai'))) hasError = true;
    if (!validateField(document.getElementById('tenDangNhap'))) hasError = true;
    if (!validateField(document.getElementById('matKhau'))) hasError = true;
    
    if (hasError) {
        return false;
    }
    
    // Cảnh báo khi chọn quyền admin
    if (quyenHan === 'admin' && !confirm('Bạn đang tạo tài khoản với quyền admin. Tiếp tục?')) {
        return false;
    }

    if (!confirm('Bạn có chắc chắn muốn thêm người dùng này?')) {
        return false;
    }

    // Nếu không có lỗi, tạo formData và submit
    const formData = {
        hoTen,
        email,
        soDienThoai,
        diaChi,
        tenDangNhap,
        matKhau,
        quyenHan
    };

    // Gửi request
    fetch('/admin/users/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert(result.message || 'Thêm người dùng thành công');
            window.location.href = '/admin/users';
        } else {
            alert(result.message || 'Có lỗi xảy ra khi thêm người dùng');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Có lỗi kết nối đến server');
    });
    
    return false;
}

// Validate cho form thêm khách sạn
function validateAddHotelForm(event) {
    event.preventDefault();
    
    // Lấy giá trị các trường
    const tenKhachSan = document.getElementById('tenKhachSan').value.trim();
    const phuong = document.getElementById('phuong').value.trim();
    const quan = document.getElementById('quan').value.trim();
    const thanhPho = document.getElementById('thanhPho').value.trim();
    const idDiaDiem = document.getElementById('idDiaDiem').value;
    const hinhAnh = document.getElementById('hinhAnh').files[0];
    
    // Reset lỗi
    resetErrors();
    
    // Validate các trường
    let hasError = false;
    
    // Validate từng trường
    if (!validateField(document.getElementById('tenKhachSan'))) hasError = true;
    if (!validateField(document.getElementById('phuong'))) hasError = true;
    if (!validateField(document.getElementById('quan'))) hasError = true;
    if (!validateField(document.getElementById('thanhPho'))) hasError = true;
    if (!validateField(document.getElementById('idDiaDiem'))) hasError = true;
    
    // Validate hình ảnh
    if (!hinhAnh) {
        showError('hinhAnh', 'Vui lòng chọn hình ảnh');
        hasError = true;
    } else if (!validateField(document.getElementById('hinhAnh'))) {
        hasError = true;
    }
    
    if (hasError) {
        return false;
    }
    
    // Xác nhận
    if (!confirm(`Bạn có chắc chắn muốn thêm khách sạn "${tenKhachSan}" ở ${phuong}, ${quan}, ${thanhPho}?`)) {
        return false;
    }
    
    // Submit form nếu không có lỗi
    document.getElementById('addHotelForm').submit();
    return true;
}

// Validate cho form thêm đặt phòng
function validateAddBookingForm(event) {
    event.preventDefault();

    // Lấy giá trị form
    const idKhachHang = document.getElementById('idKhachHang').value;
    const idPhong = document.getElementById('idPhong').value;
    const ngayBatDau = document.getElementById('ngayBatDau').value;
    const ngayKetThuc = document.getElementById('ngayKetThuc').value;
    const trangThai = document.getElementById('trangThai').value;

    // Reset lỗi
    resetErrors();
    
    // Validate các trường
    let hasError = false;
    
    // Validate từng trường
    if (!validateField(document.getElementById('idKhachHang'))) hasError = true;
    if (!validateField(document.getElementById('idPhong'))) hasError = true;
    if (!validateField(document.getElementById('ngayBatDau'))) hasError = true;
    if (!validateField(document.getElementById('ngayKetThuc'))) hasError = true;
    
    if (hasError) {
        return false;
    }

    // Tính toán số đêm
    const startDate = new Date(ngayBatDau);
    const endDate = new Date(ngayKetThuc);
    const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    // Xác nhận
    if (!confirm(`Thông tin đặt phòng:\n- Số đêm: ${nights}\n\nBạn có chắc chắn muốn thêm đặt phòng này?`)) {
        return false;
    }
    
    // Submit form nếu không có lỗi
    document.getElementById('addBookingForm').submit();
    return true;
}

// Validate cho form sửa thông tin khách sạn
function validateEditHotelForm(event) {
    event.preventDefault();
    
    // Lấy giá trị các trường
    const tenKhachSan = document.getElementById('tenKhachSan').value.trim();
    const phuong = document.getElementById('phuong').value.trim();
    const quan = document.getElementById('quan').value.trim();
    const thanhPho = document.getElementById('thanhPho').value.trim();
    const idDiaDiem = document.getElementById('idDiaDiem').value;
    const hinhAnh = document.getElementById('hinhAnh').files[0];
    
    // Reset lỗi
    resetErrors();
    
    // Validate các trường
    let hasError = false;
    
    // Validate từng trường
    if (!validateField(document.getElementById('tenKhachSan'))) hasError = true;
    if (!validateField(document.getElementById('phuong'))) hasError = true;
    if (!validateField(document.getElementById('quan'))) hasError = true;
    if (!validateField(document.getElementById('thanhPho'))) hasError = true;
    if (!validateField(document.getElementById('idDiaDiem'))) hasError = true;
    
    // Validate hình ảnh (nếu có)
    if (hinhAnh && !validateField(document.getElementById('hinhAnh'))) {
        hasError = true;
    }
    
    if (hasError) {
        return false;
    }
    
    // Xác nhận
    if (!confirm(`Bạn có chắc chắn muốn cập nhật thông tin khách sạn "${tenKhachSan}" ở ${phuong}, ${quan}, ${thanhPho}?`)) {
        return false;
    }
    
    // Sử dụng FormData để gửi dữ liệu (bao gồm cả file)
    const formData = new FormData();
    
    formData.append('tenKhachSan', tenKhachSan);
    formData.append('phuong', phuong);
    formData.append('quan', quan);
    formData.append('thanhPho', thanhPho);
    formData.append('idDiaDiem', idDiaDiem);
    
    // Chỉ thêm hình ảnh nếu có
    if (hinhAnh) {
        formData.append('hinhAnh', hinhAnh);
    }
    
    // Lấy ID khách sạn từ đường dẫn URL
    const idKhachSan = window.location.pathname.split('/').pop();
    
    // Gửi request PUT
    fetch(`/admin/hotels/${idKhachSan}`, {
        method: 'PUT',
        body: formData  // FormData không cần set Content-Type
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Có lỗi xảy ra khi cập nhật');
    })
    .then(data => {
        alert(data.message || 'Cập nhật thành công');
        window.location.href = '/admin/hotels';
    })
    .catch(error => {
        alert(error.message);
        console.error('Error:', error);
    });
    
    return false;
}

// Validate cho form sửa thông tin người dùng
function validateEditUserForm(event) {
    event.preventDefault();
    
    // Lấy giá trị các trường
    const hoTen = document.getElementById('hoTen').value.trim();
    const email = document.getElementById('email').value.trim();
    const soDienThoai = document.getElementById('soDienThoai').value.trim();
    const diaChi = document.getElementById('diaChi').value.trim();
    const quyenHan = document.getElementById('quyenHan').value;
    const trangThai = document.getElementById('trangThai').value;
    
    // Reset lỗi
    resetErrors();
    
    // Validate các trường
    let hasError = false;
    
    // Validate từng trường
    if (!validateField(document.getElementById('hoTen'))) hasError = true;
    if (!validateField(document.getElementById('email'))) hasError = true;
    if (!validateField(document.getElementById('soDienThoai'))) hasError = true;
    
    if (hasError) {
        return false;
    }
    
    // Cảnh báo khi thay đổi quyền hạn thành admin
    if (quyenHan === 'admin' && !document.querySelector(`#quyenHan option[value="admin"]`).selected) {
        if (!confirm('Bạn đang cấp quyền admin cho người dùng này. Tiếp tục?')) {
            return false;
        }
    }
    
    // Cảnh báo khi khóa tài khoản
    if (trangThai === 'false') {
        if (!confirm('Bạn có chắc chắn muốn khóa tài khoản người dùng này?')) {
            return false;
        }
    }
    
    // Xác nhận chung
    if (!confirm('Bạn có chắc chắn muốn lưu thay đổi cho người dùng này?')) {
        return false;
    }
    
    // Sử dụng Fetch API để gửi PUT request
    const formData = new FormData(document.getElementById('editUserForm'));
    const jsonData = {};
    
    formData.forEach((value, key) => {
        jsonData[key] = value;
    });
    
    fetch(document.getElementById('editUserForm').action, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(jsonData)
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Có lỗi xảy ra khi cập nhật');
    })
    .then(data => {
        alert(data.message || 'Cập nhật thành công');
        window.location.href = '/admin/users';
    })
    .catch(error => {
        alert(error.message);
    });
    
    return false;
}

// Validate cho form sửa đặt phòng
function validateEditBookingForm(event) {
    event.preventDefault();
    
    const form = document.getElementById('editBookingForm');
    const idKhachHang = document.getElementById('idKhachHang').value;
    const idPhong = document.getElementById('idPhong').value;
    const ngayBatDau = document.getElementById('ngayBatDau').value;
    const ngayKetThuc = document.getElementById('ngayKetThuc').value;
    const donGia = document.getElementById('donGia').value;
    const trangThai = document.getElementById('trangThai').value;
    
    // Reset lỗi
    resetErrors();
    
    // Validate các trường
    let hasError = false;
    
    // Validate từng trường
    if (!validateField(document.getElementById('idKhachHang'))) hasError = true;
    if (!validateField(document.getElementById('idPhong'))) hasError = true;
    if (!validateField(document.getElementById('ngayBatDau'))) hasError = true;
    if (!validateField(document.getElementById('ngayKetThuc'))) hasError = true;
    if (!validateField(document.getElementById('donGia'))) hasError = true;
    
    if (hasError) {
        return false;
    }
    
    // Validate trạng thái
    const now = new Date();
    const endDate = new Date(ngayKetThuc);
    const status = parseInt(trangThai);

    // Kiểm tra logic trạng thái
    if (status === 2 && now < endDate) {
        if (!confirm('Bạn sắp đánh dấu đơn đặt phòng này là đã hoàn thành trước ngày kết thúc. Bạn có chắc chắn không?')) {
            return false;
        }
    }
    
    // Tính toán số đêm và thành tiền
    const startDate = new Date(ngayBatDau);
    const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * parseInt(donGia);
    const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice);
    
    // Xác nhận
    if (!confirm(`Thông tin đặt phòng sẽ được cập nhật:\nSố đêm: ${nights}\nThành tiền: ${formattedPrice}\n\nBạn có chắc chắn muốn lưu thay đổi?`)) {
        return false;
    }
    
    // Manual form submission using fetch API
    const formData = new FormData(form);
    const jsonData = {};
    
    formData.forEach((value, key) => {
        jsonData[key] = value;
    });
    
    fetch(form.action, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
    })
    .then(response => {
        if (response.ok) {
            window.location.href = '/admin/bookings';
        } else {
            return response.json();
        }
    })
    .then(data => {
        if (data && data.error) {
            alert('Lỗi: ' + data.error);
        }
    })
    .catch(error => {
        alert('Có lỗi xảy ra: ' + error.message);
    });
    
    return false;
}

// Hiển thị lỗi
function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Xóa lỗi cũ nếu có
    clearError(field);
    
    // Tạo span lỗi
    const errorSpan = document.createElement('div');
    errorSpan.className = 'error-message text-danger mt-1 small';
    errorSpan.innerHTML = '<i class="fas fa-exclamation-circle me-1"></i>' + message;
    
    // Thêm class is-invalid cho input
    field.classList.add('is-invalid');
    
    // Tìm container phù hợp để thêm lỗi
    // Trường hợp 1: Nếu field nằm trong .input-group
    let container = field.closest('.input-group');
    if (container) {
        // Thêm lỗi sau .input-group
        container.parentElement.insertBefore(errorSpan, container.nextSibling);
        return;
    }
    
    // Trường hợp 2: Nếu field có parent là div, form-group
    container = field.closest('.form-group, .mb-3, .mb-4');
    if (container) {
        // Thêm lỗi vào cuối container
        container.appendChild(errorSpan);
        return;
    }
    
    // Trường hợp 3: Mặc định thêm sau field
    field.parentElement.insertBefore(errorSpan, field.nextSibling);
}

// Hàm xóa lỗi cho một trường
function clearError(fieldId) {
    const field = typeof fieldId === 'string' ? document.getElementById(fieldId) : fieldId;
    if (!field) return;
    
    // Xóa span lỗi
    const errorSpan = field.parentElement.querySelector('.error-message');
    if (errorSpan) {
        errorSpan.remove();
    }
    
    // Xóa class is-invalid
    field.classList.remove('is-invalid');
}

// Hàm reset lỗi
function resetErrors() {
    // Xóa tất cả thông báo lỗi
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    // Xóa class is-invalid
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}