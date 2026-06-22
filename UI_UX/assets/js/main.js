/**
 * ========================================
 * HOSTELHUB - UI INTERACTIONS
 * ========================================
 * Author: Thayaneshwaran S (UI/UX Designer)
 * Description: UI interactions with validation
 * ========================================
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 HostelHub UI loaded!');
    
    initPasswordToggle();
    initLoginValidation();
    initSignupValidation();
});

// ========================================
// 1. PASSWORD TOGGLE (For all password fields)
// ========================================
function initPasswordToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.closest('.password-wrapper').querySelector('input');
            if (input) {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                const icon = this.querySelector('i');
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    });
}

// ========================================
// 2. LOGIN VALIDATION
// ========================================
function initLoginValidation() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        // Real-time validation on blur
        emailInput.addEventListener('blur', function() {
            validateLoginEmail(this);
        });
        
        emailInput.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                validateLoginEmail(this);
            }
        });
        
        passwordInput.addEventListener('blur', function() {
            validateLoginPassword(this);
        });
        
        passwordInput.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                validateLoginPassword(this);
            }
        });
        
        // Form submit validation
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email');
            const password = document.getElementById('password');
            
            const isEmailValid = validateLoginEmail(email);
            const isPasswordValid = validateLoginPassword(password);
            
            if (isEmailValid && isPasswordValid) {
                showNotification('✅ Login successful! Redirecting...', 'success');
                // Redirect will be handled by Dharani's login.js
                // loginUser(email.value.trim(), password.value.trim());
            } else {
                showNotification('❌ Please fix the errors above', 'error');
            }
        });
    }
}

function validateLoginEmail(input) {
    const value = input.value.trim();
    const errorElement = document.getElementById('emailError');
    
    if (!value) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Email address is required';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    if (!isValidEmail(value)) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Please enter a valid email address (e.g., student@hostel.com)';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    input.classList.remove('error');
    input.classList.add('success');
    errorElement.classList.add('hidden');
    return true;
}

function validateLoginPassword(input) {
    const value = input.value.trim();
    const errorElement = document.getElementById('passwordError');
    
    if (!value) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Password is required';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    if (value.length < 6) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Password must be at least 6 characters';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    input.classList.remove('error');
    input.classList.add('success');
    errorElement.classList.add('hidden');
    return true;
}

// ========================================
// 3. SIGNUP VALIDATION
// ========================================
function initSignupValidation() {
    const signupForm = document.getElementById('signupForm');
    
    if (!signupForm) return;
    
    const fields = {
        fullname: { validate: validateFullName, errorId: 'fullnameError' },
        email: { validate: validateSignupEmail, errorId: 'emailError' },
        phone: { validate: validatePhone, errorId: 'phoneError' },
        department: { validate: validateDepartment, errorId: 'departmentError' },
        year: { validate: validateYear, errorId: 'yearError' },
        gender: { validate: validateGender, errorId: 'genderError' },
        role: { validate: validateRole, errorId: 'roleError' },
        password: { validate: validateSignupPassword, errorId: 'passwordError' },
        confirm_password: { validate: validateConfirmPassword, errorId: 'confirmPasswordError' }
    };
    
    // Add real-time validation for each field
    Object.keys(fields).forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (input) {
            input.addEventListener('blur', function() {
                fields[fieldId].validate(this);
            });
            input.addEventListener('input', function() {
                if (this.value.trim() !== '') {
                    fields[fieldId].validate(this);
                }
                // Also validate confirm password when password changes
                if (fieldId === 'password') {
                    const confirmInput = document.getElementById('confirm_password');
                    if (confirmInput && confirmInput.value.trim() !== '') {
                        validateConfirmPassword(confirmInput);
                    }
                }
            });
            if (input.tagName === 'SELECT') {
                input.addEventListener('change', function() {
                    fields[fieldId].validate(this);
                });
            }
        }
    });
    
    // Form submit validation
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let allValid = true;
        
        Object.keys(fields).forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (input) {
                const isValid = fields[fieldId].validate(input);
                if (!isValid) allValid = false;
            }
        });
        
        if (allValid) {
            showNotification('✅ Account created successfully! Redirecting...', 'success');
            // Redirect will be handled by Bharani's signup.js
        } else {
            showNotification('❌ Please fix the errors above', 'error');
        }
    });
}

// Signup validation functions
function validateFullName(input) {
    const value = input.value.trim();
    const errorElement = document.getElementById('fullnameError');
    
    if (!value) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Full name is required';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    if (value.length < 3) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Name must be at least 3 characters';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    if (value.length > 100) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Name must be less than 100 characters';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    input.classList.remove('error');
    input.classList.add('success');
    errorElement.classList.add('hidden');
    return true;
}

function validateSignupEmail(input) {
    const value = input.value.trim();
    const errorElement = document.getElementById('emailError');
    
    if (!value) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Email address is required';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    if (!isValidEmail(value)) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Please enter a valid email address (e.g., student@hostel.com)';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    input.classList.remove('error');
    input.classList.add('success');
    errorElement.classList.add('hidden');
    return true;
}

function validatePhone(input) {
    const value = input.value.trim();
    const errorElement = document.getElementById('phoneError');
    
    if (!value) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Phone number is required';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    if (!/^[0-9]{10}$/.test(value)) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Please enter a valid 10-digit phone number';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    input.classList.remove('error');
    input.classList.add('success');
    errorElement.classList.add('hidden');
    return true;
}

function validateDepartment(input) {
    const value = input.value;
    const errorElement = document.getElementById('departmentError');
    
    if (!value) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Please select your department';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    input.classList.remove('error');
    input.classList.add('success');
    errorElement.classList.add('hidden');
    return true;
}

function validateYear(input) {
    const value = input.value;
    const errorElement = document.getElementById('yearError');
    
    if (!value) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Please select your year';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    input.classList.remove('error');
    input.classList.add('success');
    errorElement.classList.add('hidden');
    return true;
}

function validateGender(input) {
    const value = input.value;
    const errorElement = document.getElementById('genderError');
    
    if (!value) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Please select your gender';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    input.classList.remove('error');
    input.classList.add('success');
    errorElement.classList.add('hidden');
    return true;
}

function validateRole(input) {
    const value = input.value;
    const errorElement = document.getElementById('roleError');
    
    if (!value) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Please select your role';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    input.classList.remove('error');
    input.classList.add('success');
    errorElement.classList.add('hidden');
    return true;
}

function validateSignupPassword(input) {
    const value = input.value.trim();
    const errorElement = document.getElementById('passwordError');
    
    if (!value) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Password is required';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    if (value.length < 6) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Password must be at least 6 characters';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    if (value.length > 100) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Password must be less than 100 characters';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    input.classList.remove('error');
    input.classList.add('success');
    errorElement.classList.add('hidden');
    return true;
}

function validateConfirmPassword(input) {
    const value = input.value.trim();
    const password = document.getElementById('password');
    const errorElement = document.getElementById('confirmPasswordError');
    
    if (!value) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Please confirm your password';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    if (value !== password.value.trim()) {
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = '⚠️ Passwords do not match';
        errorElement.classList.remove('hidden');
        return false;
    }
    
    input.classList.remove('error');
    input.classList.add('success');
    errorElement.classList.add('hidden');
    return true;
}

// ========================================
// 4. HELPER FUNCTIONS
// ========================================
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ========================================
// 5. NOTIFICATION SYSTEM
// ========================================
function showNotification(message, type = 'info', duration = 3000) {
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ========================================
// 6. KEYBOARD SHORTCUT
// ========================================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const form = document.getElementById('loginForm') || document.getElementById('signupForm');
        if (form && document.activeElement) {
            const active = document.activeElement;
            if (active.tagName === 'INPUT' || active.tagName === 'SELECT') {
                form.dispatchEvent(new Event('submit'));
            }
        }
    }
});

// ========================================
// 7. EXPOSE FUNCTIONS GLOBALLY
// ========================================
window.showNotification = showNotification;

console.log('✅ HostelHub UI Interactions loaded!');