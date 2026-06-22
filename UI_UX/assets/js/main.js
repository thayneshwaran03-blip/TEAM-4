/**
 * ========================================
 * HOSTELHUB - LOGIN PAGE JAVASCRIPT
 * ========================================
 * Author: Thayaneshwaran S
 * Description: Login page interactions
 * ========================================
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 HostelHub Login Page loaded!');
    
    initPasswordToggle();
    initDemoLogin();
    initFormValidation();
});

// ========================================
// 1. PASSWORD TOGGLE (Show/Hide)
// ========================================
function initPasswordToggle() {
    const toggleBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
}

// ========================================
// 2. DEMO LOGIN BUTTONS (Auto-fill credentials)
// ========================================
function initDemoLogin() {
    const demoBtns = document.querySelectorAll('.demo-btn');
    
    demoBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const email = this.getAttribute('data-email');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            
            if (emailInput && passwordInput) {
                emailInput.value = email;
                passwordInput.value = 'password123';
                
                // Highlight the selected button
                demoBtns.forEach(b => {
                    b.style.opacity = '0.5';
                    b.style.transform = 'scale(1)';
                });
                this.style.opacity = '1';
                this.style.transform = 'scale(1.05)';
                
                // Show success notification
                showNotification(`✅ Demo account loaded: ${email}`, 'success');
            }
        });
    });
}

// ========================================
// 3. FORM VALIDATION
// ========================================
function initFormValidation() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const email = document.getElementById('email');
            const password = document.getElementById('password');
            
            // Clear previous errors
            clearErrors(this);
            
            let isValid = true;
            
            // Validate Email
            if (!email.value.trim()) {
                showError(email, 'Email address is required');
                isValid = false;
            } else if (!isValidEmail(email.value.trim())) {
                showError(email, 'Please enter a valid email address');
                isValid = false;
            }
            
            // Validate Password
            if (!password.value.trim()) {
                showError(password, 'Password is required');
                isValid = false;
            } else if (password.value.trim().length < 6) {
                showError(password, 'Password must be at least 6 characters');
                isValid = false;
            }
            
            if (!isValid) {
                e.preventDefault();
                showNotification('❌ Please fix the errors above', 'error');
            } else {
                e.preventDefault();
                showNotification('✅ Login successful! Redirecting...', 'success');
                // In real project, this would redirect to dashboard
                // window.location.href = 'pages/student/dashboard.html';
            }
        });
    }
}

// Helper: Validate email format
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Helper: Show error below input
function showError(input, message) {
    const formGroup = input.closest('.form-group');
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) existingError.remove();
    
    input.style.borderColor = '#e53935';
    input.style.boxShadow = '0 0 0 4px rgba(229, 57, 53, 0.1)';
    
    const error = document.createElement('small');
    error.className = 'error-message';
    error.style.cssText = 'color: #e53935; font-size: 0.8rem; margin-top: 4px; display: block;';
    error.textContent = '❌ ' + message;
    formGroup.appendChild(error);
}

// Helper: Clear all errors
function clearErrors(form) {
    form.querySelectorAll('.error-message').forEach(el => el.remove());
    form.querySelectorAll('input').forEach(input => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
    });
}

// ========================================
// 4. NOTIFICATION SYSTEM (Toast Messages)
// ========================================
function showNotification(message, type = 'info', duration = 3000) {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Show after small delay
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Auto hide
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

// ========================================
// 5. KEYBOARD SHORTCUT: Press Enter to login
// ========================================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const form = document.getElementById('loginForm');
        if (form && document.activeElement) {
            const active = document.activeElement;
            if (active.tagName === 'INPUT') {
                form.dispatchEvent(new Event('submit'));
            }
        }
    }
});

console.log('✅ HostelHub Login JS loaded!');