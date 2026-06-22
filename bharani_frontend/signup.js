/**
 * ========================================
 * HOSTELHUB - SIGNUP FUNCTIONALITY
 * ========================================
 * Author: Bharani Dharani (Frontend Developer)
 * Description: Signup logic, API calls, and state management
 * ========================================
 */

import { Toast } from '../UI_UX/design/components.js';

// ========================================
// 1. INITIALIZE SIGNUP PAGE
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Signup functionality loaded!');

    // Check if user is already logged in
    const user = localStorage.getItem('user');
    if (user) {
        try {
            const userData = JSON.parse(user);
            if (userData && userData.user_id) {
                redirectBasedOnRole(userData.role);
                return;
            }
        } catch (e) {
            localStorage.removeItem('user');
        }
    }

    // Get the signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        setupSignupFunctionality(signupForm);
    } else {
        console.log('⏳ Waiting for signup form to load...');
        // Retry after a short delay
        setTimeout(() => {
            const retryForm = document.getElementById('signupForm');
            if (retryForm) {
                setupSignupFunctionality(retryForm);
            }
        }, 500);
    }
});

// ========================================
// 2. SETUP SIGNUP FUNCTIONALITY
// ========================================
function setupSignupFunctionality(signupForm) {
    // Remove existing submit listener to avoid duplicates
    signupForm.removeEventListener('submit', handleSignupSubmit);
    signupForm.addEventListener('submit', handleSignupSubmit);

    // Setup real-time email check
    const emailInput = document.getElementById('email');
    if (emailInput) {
        // Remove existing listeners to avoid duplicates
        emailInput.removeEventListener('blur', handleEmailCheck);
        emailInput.removeEventListener('input', handleEmailInput);
        emailInput.addEventListener('blur', handleEmailCheck);
        emailInput.addEventListener('input', handleEmailInput);
    }

    // Listen for Enter key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const active = document.activeElement;
            if (active && (active.tagName === 'INPUT' || active.tagName === 'SELECT')) {
                signupForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    console.log('✅ Signup form is ready!');
}

// ========================================
// 3. EMAIL AVAILABILITY CHECK
// ========================================
async function handleEmailCheck(e) {
    const input = e.target;
    const email = input.value.trim();

    if (!email || email === '') {
        return;
    }

    // Check if email is valid format
    if (!isValidEmail(email)) {
        return;
    }

    try {
        const response = await fetch(`../dharshini_backend/check_email.php?email=${encodeURIComponent(email)}`);
        const data = await response.json();

        if (data.exists) {
            input.style.borderColor = '#e53935';
            input.style.boxShadow = '0 0 0 4px rgba(229, 57, 53, 0.1)';
            input.dataset.error = 'true';
            const errorEl = input.closest('.form-group').querySelector('.error-message');
            if (errorEl) {
                errorEl.textContent = '⚠️ This email is already registered';
                errorEl.style.display = 'block';
            }
        } else if (data.valid) {
            // Email is available
            input.style.borderColor = '#43a047';
            input.style.boxShadow = '0 0 0 4px rgba(67, 160, 71, 0.1)';
            delete input.dataset.error;
            const errorEl = input.closest('.form-group').querySelector('.error-message');
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Email check error:', error);
    }
}

function handleEmailInput(e) {
    const input = e.target;
    if (input.dataset.error === 'true') {
        // Clear error state if user is typing
        const errorEl = input.closest('.form-group').querySelector('.error-message');
        if (errorEl && errorEl.textContent.includes('already registered')) {
            // Only clear if it's the duplicate email error
            input.style.borderColor = '';
            input.style.boxShadow = '';
            delete input.dataset.error;
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ========================================
// 4. HANDLE SIGNUP SUBMIT
// ========================================
async function handleSignupSubmit(e) {
    e.preventDefault();

    // Get all form fields
    const fullname = document.getElementById('fullname');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');
    const department = document.getElementById('department');
    const year = document.getElementById('year');
    const gender = document.getElementById('gender');
    const role = document.getElementById('role');
    const parent_name = document.getElementById('parent_name');
    const parent_phone = document.getElementById('parent_phone');
    
    // Get password inputs
    const passwordWrappers = document.querySelectorAll('#signupForm .password-wrapper');
    let passwordInput = null;
    let confirmInput = null;
    
    if (passwordWrappers.length >= 1) {
        passwordInput = passwordWrappers[0].querySelector('input');
    }
    if (passwordWrappers.length >= 2) {
        confirmInput = passwordWrappers[1].querySelector('input');
    }

    // Trigger blur events to show validation
    if (fullname) fullname.dispatchEvent(new Event('blur'));
    if (email) email.dispatchEvent(new Event('blur'));
    if (phone) phone.dispatchEvent(new Event('blur'));
    if (department) department.dispatchEvent(new Event('blur'));
    if (year) year.dispatchEvent(new Event('blur'));
    if (gender) gender.dispatchEvent(new Event('blur'));
    if (role) role.dispatchEvent(new Event('blur'));
    if (passwordInput) passwordInput.dispatchEvent(new Event('blur'));
    if (confirmInput) confirmInput.dispatchEvent(new Event('blur'));

    // Check if there are any validation errors from design
    const hasErrors = document.querySelectorAll('[data-error="true"]').length > 0;

    if (hasErrors) {
        Toast('❌ Please fix the errors above', 'error');
        return;
    }

    // Check if email is already taken (from email check)
    if (email && email.dataset.error === 'true') {
        Toast('❌ This email is already registered', 'error');
        return;
    }

    // Collect data
    const userData = {
        name: fullname ? fullname.value.trim() : '',
        email: email ? email.value.trim() : '',
        phone: phone ? phone.value.trim() : '',
        department: department ? department.value : '',
        year: year ? parseInt(year.value) : 0,
        gender: gender ? gender.value : '',
        role: role ? role.value : '',
        parent_name: parent_name ? parent_name.value.trim() : '',
        parent_phone: parent_phone ? parent_phone.value.trim() : '',
        password: passwordInput ? passwordInput.value.trim() : ''
    };

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'department', 'year', 'gender', 'role', 'password'];
    for (const field of requiredFields) {
        if (!userData[field]) {
            Toast(`❌ ${field.charAt(0).toUpperCase() + field.slice(1)} is required`, 'error');
            return;
        }
    }

    // Show loading state
    const signupBtn = document.querySelector('#signupForm .login-btn');
    if (!signupBtn) return;
    
    const originalText = signupBtn.innerHTML;
    signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    signupBtn.disabled = true;

    try {
        // Call signup API
        const response = await fetch('../dharshini_backend/signup_api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        // Reset button
        signupBtn.innerHTML = originalText;
        signupBtn.disabled = false;

        if (data.success) {
            // Registration successful
            Toast('✅ Account created successfully! Redirecting to login...', 'success');

            // Store user data
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = '../UI_UX/index.html?registered=true';
            }, 2000);

        } else {
            // Registration failed
            if (data.message.toLowerCase().includes('email')) {
                Toast('❌ This email is already registered.', 'error');
                if (email) {
                    email.style.borderColor = '#e53935';
                    email.style.boxShadow = '0 0 0 4px rgba(229, 57, 53, 0.1)';
                    email.dataset.error = 'true';
                    const errorEl = email.closest('.form-group').querySelector('.error-message');
                    if (errorEl) {
                        errorEl.textContent = '⚠️ ' + data.message;
                        errorEl.style.display = 'block';
                    }
                }
            } else {
                Toast('❌ ' + data.message, 'error');
            }
        }

    } catch (error) {
        console.error('Signup error:', error);
        Toast('❌ Connection error. Please try again.', 'error');

        // Reset button
        signupBtn.innerHTML = originalText;
        signupBtn.disabled = false;
    }
}

// ========================================
// 5. REDIRECT BASED ON ROLE
// ========================================
function redirectBasedOnRole(role) {
    const roleMap = {
        'admin': '../UI_UX/pages/admin/dashboard.html',
        'warden': '../UI_UX/pages/warden/dashboard.html',
        'student': '../UI_UX/pages/student/dashboard.html'
    };

    const url = roleMap[role] || '../UI_UX/dashboard.html';
    window.location.href = url;
}

// ========================================
// 6. EXPOSE FUNCTIONS GLOBALLY
// ========================================
window.handleSignupSubmit = handleSignupSubmit;
window.handleEmailCheck = handleEmailCheck;
window.redirectBasedOnRole = redirectBasedOnRole;

console.log('✅ Signup functionality ready!');