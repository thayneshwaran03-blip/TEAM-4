/**
 * ========================================
 * HOSTELHUB - LOGIN FUNCTIONALITY
 * ========================================
 * Author: Dharani (Frontend Developer)
 * Description: Login logic, API calls, and state management
 * ========================================
 */

import { Toast } from '../UI_UX/design/components.js';

// ========================================
// 1. INITIALIZE LOGIN PAGE
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Login functionality loaded!');

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

    // Get the login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        setupLoginFunctionality(loginForm);
    } else {
        console.log('⏳ Waiting for login form to load...');
        // Retry after a short delay
        setTimeout(() => {
            const retryForm = document.getElementById('loginForm');
            if (retryForm) {
                setupLoginFunctionality(retryForm);
            }
        }, 500);
    }
});

// ========================================
// 2. SETUP LOGIN FUNCTIONALITY
// ========================================
function setupLoginFunctionality(loginForm) {
    // Remove existing submit listener to avoid duplicates
    loginForm.removeEventListener('submit', handleLoginSubmit);
    loginForm.addEventListener('submit', handleLoginSubmit);

    // Get email and password inputs
    const emailInput = document.getElementById('email');
    const passwordInput = document.querySelector('#loginForm .password-wrapper input');

    // Listen for Enter key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            if (document.activeElement === emailInput || document.activeElement === passwordInput) {
                loginForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    console.log('✅ Login form is ready!');
}

// ========================================
// 3. HANDLE LOGIN SUBMIT
// ========================================
async function handleLoginSubmit(e) {
    e.preventDefault();

    const emailInput = document.getElementById('email');
    const passwordInput = document.querySelector('#loginForm .password-wrapper input');

    if (!emailInput || !passwordInput) {
        Toast('❌ Form elements not found', 'error');
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Validate using design validation first
    // Trigger blur events to show validation
    emailInput.dispatchEvent(new Event('blur'));
    passwordInput.dispatchEvent(new Event('blur'));

    // Check if there are any validation errors from design
    const hasError = emailInput.dataset.error === 'true' || passwordInput.dataset.error === 'true';

    if (hasError) {
        Toast('❌ Please fix the errors above', 'error');
        return;
    }

    if (!email || !password) {
        Toast('❌ Please fill in all fields', 'error');
        return;
    }

    // Show loading state
    const loginBtn = document.querySelector('#loginForm .login-btn');
    if (!loginBtn) return;
    
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    loginBtn.disabled = true;

    try {
        // Call login API
        const response = await fetch('../swetha_backend/login_api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        // Reset button
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;

        if (data.success) {
            // Login successful
            Toast('✅ Login successful! Redirecting...', 'success');

            // Store user data
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', 'user_' + data.user.user_id + '_' + Date.now());

            // Redirect based on role
            setTimeout(() => {
                redirectBasedOnRole(data.user.role);
            }, 1500);

        } else {
            // Login failed
            Toast('❌ ' + data.message, 'error');

            // Highlight fields for wrong credentials
            if (data.message.toLowerCase().includes('email') || data.message.toLowerCase().includes('password')) {
                if (emailInput) {
                    emailInput.style.borderColor = '#e53935';
                    emailInput.style.boxShadow = '0 0 0 4px rgba(229, 57, 53, 0.1)';
                    emailInput.dataset.error = 'true';
                    const errorEl = emailInput.closest('.form-group').querySelector('.error-message');
                    if (errorEl) {
                        errorEl.textContent = '⚠️ ' + data.message;
                        errorEl.style.display = 'block';
                    }
                }
                if (passwordInput) {
                    passwordInput.style.borderColor = '#e53935';
                    passwordInput.style.boxShadow = '0 0 0 4px rgba(229, 57, 53, 0.1)';
                    passwordInput.dataset.error = 'true';
                    const errorEl = passwordInput.closest('.form-group').querySelector('.error-message');
                    if (errorEl) {
                        errorEl.textContent = '⚠️ ' + data.message;
                        errorEl.style.display = 'block';
                    }
                }
            }
        }

    } catch (error) {
        console.error('Login error:', error);
        Toast('❌ Connection error. Please try again.', 'error');

        // Reset button
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
}

// ========================================
// 4. REDIRECT BASED ON ROLE
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
// 5. EXPOSE FUNCTIONS GLOBALLY
// ========================================
window.handleLoginSubmit = handleLoginSubmit;
window.redirectBasedOnRole = redirectBasedOnRole;

console.log('✅ Login functionality ready!');