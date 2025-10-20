/**
 * User validate script
 * Xử lý validate tất cả các form người dùng (đăng nhập, đăng ký)
 */

// Khởi tạo validate khi trang đã load
document.addEventListener('DOMContentLoaded', function() {
    // Vô hiệu hóa validate HTML mặc định
    document.querySelectorAll('form').forEach(form => {
        form.setAttribute('novalidate', true);
    });
    
    // Áp dụng validate cho form đăng nhập
    if (document.getElementById('loginForm')) {
        initFormValidation('loginForm');
    }
    
    // Áp dụng validate cho form đăng ký
    if (document.getElementById('registerForm')) {
        initFormValidation('registerForm');
    }
});

// Khởi tạo validate cho một form
function initFormValidation(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    // Lấy tất cả input trong form
    const inputs = form.querySelectorAll('input, select');
    
    // Thêm event listeners cho từng input
    inputs.forEach(input => {
        // Validate khi blur (rời khỏi trường)
        input.addEventListener('blur', function() {
            validateField(input);
        });
        
        // Clear error khi nhập
        input.addEventListener('input', function() {
            if (input.value.trim()) {
                clearError(input);
                
                // Validate mật khẩu khớp nhau khi nhập xác nhận mật khẩu
                if (input.id === 'confirmPassword' || input.id === 'registerPassword') {
                    const registerPassword = document.getElementById('registerPassword');
                    const confirmPassword = document.getElementById('confirmPassword');
                    
                    if (registerPassword && confirmPassword && 
                        registerPassword.value && confirmPassword.value) {
                        validatePasswordMatch();
                    }
                }
            }
        });
    });
}

// Validate từng trường
function validateField(field) {
    const id = field.id;
    const value = field.value.trim();
    
    switch(id) {
        case 'username':
            if (!value) {
                showError(id, 'Vui lòng nhập tên đăng nhập');
                return false;
            } else if (value.length < 3) {
                showError(id, 'Tên đăng nhập phải có ít nhất 3 ký tự');
                return false;
            }
            break;
            
        case 'loginPassword':
            if (!value) {
                showError(id, 'Vui lòng nhập mật khẩu');
                return false;
            } else if (value.length < 6) {
                showError(id, 'Mật khẩu phải có ít nhất 6 ký tự');
                return false;
            }
            break;
            
        case 'tenDangNhap':
            if (!value) {
                showError(id, 'Vui lòng nhập tên đăng nhập');
                return false;
            } else if (value.length < 3) {
                showError(id, 'Tên đăng nhập phải có ít nhất 3 ký tự');
                return false;
            } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                showError(id, 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới');
                return false;
            }
            break;
            
        case 'registerPassword':
            if (!value) {
                showError(id, 'Vui lòng nhập mật khẩu');
                return false;
            } else if (value.length < 6) {
                showError(id, 'Mật khẩu phải có ít nhất 6 ký tự');
                return false;
            } else {
                // Kiểm tra mật khẩu xác nhận nếu đã nhập
                validatePasswordMatch();
            }
            break;
            
        case 'confirmPassword':
            if (!value) {
                showError(id, 'Vui lòng xác nhận mật khẩu');
                return false;
            } else {
                validatePasswordMatch();
            }
            break;
            
        case 'hoTen':
            if (!value) {
                showError(id, 'Vui lòng nhập họ tên');
                return false;
            } else if (value.length < 2) {
                showError(id, 'Họ tên phải có ít nhất 2 ký tự');
                return false;
            }
            break;
            
        case 'email':
            if (!value) {
                showError(id, 'Vui lòng nhập email');
                return false;
            } else if (!value.includes('@')) {
                showError(id, 'Email phải chứa ký tự @');
                return false;
            } else {
                const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
                if (!emailRegex.test(value)) {
                    showError(id, 'Email không hợp lệ (ví dụ: user@example.com)');
                    return false;
                }
            }
            break;
            
        case 'soDienThoai':
            if (!value) {
                showError(id, 'Vui lòng nhập số điện thoại');
                return false;
            } else {
                const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
                if (!phoneRegex.test(value)) {
                    showError(id, 'Số điện thoại không hợp lệ (VD: 0912345678)');
                    return false;
                }
            }
            break;
    }
    
    clearError(id);
    return true;
}

// Kiểm tra mật khẩu khớp nhau
function validatePasswordMatch() {
    const password = document.getElementById('registerPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (!password || !confirmPassword) return true;
    
    const passwordValue = password.value;
    const confirmValue = confirmPassword.value;
    
    if (confirmValue && passwordValue !== confirmValue) {
        showError('confirmPassword', 'Mật khẩu xác nhận không khớp');
        return false;
    } else if (confirmValue) {
        clearError('confirmPassword');
        return true;
    }
    
    return true;
}

// Validate form đăng nhập
function validateLoginForm(event) {
    event.preventDefault();
    
    const username = document.getElementById('username');
    const password = document.getElementById('loginPassword');
    
    // Reset lỗi
    resetErrors();
    
    // Validate từng trường
    let hasError = false;
    
    if (!validateField(username)) hasError = true;
    if (!validateField(password)) hasError = true;
    
    // Nếu có lỗi, không submit
    if (hasError) {
        return false;
    }
    
    // Nếu không có lỗi, submit form
    document.getElementById('loginForm').submit();
    return true;
}

// Validate form đăng ký
function validateRegisterForm(event) {
    event.preventDefault();
    
    // Lấy tất cả các trường trong form
    const hoTen = document.getElementById('hoTen');
    const tenDangNhap = document.getElementById('tenDangNhap');
    const password = document.getElementById('registerPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const email = document.getElementById('email');
    const soDienThoai = document.getElementById('soDienThoai');
    
    // Reset lỗi
    resetErrors();
    
    // Validate từng trường
    let hasError = false;
    
    if (!validateField(hoTen)) hasError = true;
    if (!validateField(tenDangNhap)) hasError = true;
    if (!validateField(password)) hasError = true;
    if (!validateField(confirmPassword)) hasError = true;
    if (!validateField(email)) hasError = true;
    if (!validateField(soDienThoai)) hasError = true;
    
    // Validate mật khẩu khớp nhau
    if (!validatePasswordMatch()) hasError = true;
    
    // Nếu có lỗi, không submit
    if (hasError) {
        return false;
    }
    
    // Nếu không có lỗi, submit form
    document.getElementById('registerForm').submit();
    return true;
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

// Xóa lỗi cho một trường
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

// Reset tất cả lỗi
function resetErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
} 