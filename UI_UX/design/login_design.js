/**
 * ========================================
 * HOSTELHUB - LOGIN PAGE DESIGN (FIXED)
 * ========================================
 * Author: Thayaneshwaran S (UI/UX Designer)
 * Description: Login page created with JavaScript only
 * ========================================
 */

import DesignSystem from './design_system.js';
import {
    Container,
    Branding,
    FormCard,
    FormGroup,
    Input,
    PasswordInput,
    Button,
    AuthLink,
    Footer,
    Toast,
    addResponsiveStyles
} from './components.js';

// ========================================
// LOGIN PAGE DESIGN
// ========================================
export function createLoginPage() {
    const { colors, typography, spacing } = DesignSystem;

    // Add responsive styles
    addResponsiveStyles();

    // ========================================
    // 1. LEFT SIDE - BRANDING
    // ========================================
    const features = [
        'Student Room Allocation',
        'Visitor Entry',
        'Leave Requests',
        'Occupancy Reports'
    ];

    const branding = Branding(
        '🏠 HostelHub',
        'centralize & digitalize hostel management.',
        'Simplify room allocations, verify visitor records, process leaves instantly, and track occupancy reports within a secure, responsive dashboard control.',
        features,
        'assets/logo.png'
    );

    // ========================================
    // 2. RIGHT SIDE - LOGIN FORM
    // ========================================

    // Create form
    const form = document.createElement('form');
    form.id = 'loginForm';
    form.noValidate = true;
    form.style.cssText = `
        margin: 0;
        padding: 0;
        width: 100%;
    `;

    // Email field
    const emailInput = Input('email', 'student@hostel.com');
    const emailGroup = FormGroup(
        '<i class="fas fa-envelope" style="color: #1a237e; width:20px;"></i> Email Address',
        emailInput,
        ''
    );

    // Password field
    const passwordWrapper = PasswordInput('**********');
    const passwordGroup = FormGroup(
        '<i class="fas fa-lock" style="color: #1a237e; width:20px;"></i> Password',
        passwordWrapper,
        ''
    );

    // Login button
    const loginBtn = Button('Sign in to Portal', 'submit', 'fas fa-sign-in-alt');

    // Append everything to form
    form.appendChild(emailGroup);
    form.appendChild(passwordGroup);

    const btnWrapper = document.createElement('div');
    btnWrapper.style.cssText = `
        margin-top: ${spacing.sm};
        width: 100%;
    `;
    btnWrapper.appendChild(loginBtn);
    form.appendChild(btnWrapper);

    // Auth links
    const authLink = AuthLink(
        "Don't have an account?",
        'Sign Up',
        () => {
            console.log('Navigate to Sign Up');
            // Toggle to signup page
            const loginContainer = document.getElementById('loginContainer');
            const signupContainer = document.getElementById('signupContainer');
            if (loginContainer && signupContainer) {
                loginContainer.style.display = 'none';
                signupContainer.style.display = 'flex';
            }
        }
    );

    const footer = Footer('© 2026 HostelHub System. Centralized College Utilities.');

    // Create form card
    const formCard = FormCard(
        'Welcome Back',
        'Sign in with your registered college email account.',
        form
    );

    // Add auth link and footer inside card
    const cardContent = formCard.querySelector('.auth-card-content');
    if (cardContent) {
        cardContent.appendChild(authLink);
        cardContent.appendChild(footer);
    }

    // ========================================
    // 3. MAIN CONTAINER
    // ========================================
    const container = Container('');
    container.id = 'loginContainer';

    const flexWrapper = document.createElement('div');
    flexWrapper.style.cssText = `
        display: flex;
        width: 100%;
        min-height: 100vh;
    `;
    flexWrapper.appendChild(branding);
    flexWrapper.appendChild(formCard);
    container.appendChild(flexWrapper);

    // ========================================
    // 4. ADD VALIDATION (Connects to backend)
    // ========================================
    setupLoginValidation(form, emailInput, passwordWrapper, loginBtn);

    return container;
}

// ========================================
// VALIDATION & API CONNECTIVITY
// ========================================
function setupLoginValidation(form, emailInput, passwordWrapper, loginBtn) {
    const { colors } = DesignSystem;

    // Get actual input from password wrapper
    const passwordInput = passwordWrapper.querySelector('input');

    // Email validation
    emailInput.addEventListener('blur', function() {
        validateEmail(this);
    });

    emailInput.addEventListener('input', function() {
        if (this.value.trim() !== '') {
            validateEmail(this);
        }
    });

    // Password validation
    passwordInput.addEventListener('blur', function() {
        validatePassword(this);
    });

    passwordInput.addEventListener('input', function() {
        if (this.value.trim() !== '') {
            validatePassword(this);
        }
    });

    // Form submit - connects to backend
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const isEmailValid = validateEmail(emailInput);
        const isPasswordValid = validatePassword(passwordInput);

        if (!isEmailValid || !isPasswordValid) {
            Toast('❌ Please fix the errors above', 'error');
            return;
        }

        // Show loading state
        const originalBtnText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
        loginBtn.disabled = true;

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: emailInput.value.trim(),
                    password: passwordInput.value.trim()
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                Toast('✅ ' + data.message, 'success');
                
                // Store authentication credentials
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Dispatch authChange event to reload views
                window.dispatchEvent(new Event('authChange'));
            } else {
                Toast('❌ ' + (data.message || 'Login failed'), 'error');
            }
        } catch (error) {
            console.error('Login Error:', error);
            Toast('❌ Connection error to backend server.', 'error');
        } finally {
            loginBtn.innerHTML = originalBtnText;
            loginBtn.disabled = false;
        }
    });

    function validateEmail(input) {
        const value = input.value.trim();
        const errorEl = input.closest('.form-group').querySelector('.error-message');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!value) {
            input.style.borderColor = colors.danger;
            input.style.boxShadow = '0 0 0 4px rgba(229, 57, 53, 0.1)';
            if (errorEl) {
                errorEl.textContent = '⚠️ Email address is required';
                errorEl.style.display = 'block';
            }
            input.dataset.error = 'true';
            return false;
        }

        if (!emailRegex.test(value)) {
            input.style.borderColor = colors.danger;
            input.style.boxShadow = '0 0 0 4px rgba(229, 57, 53, 0.1)';
            if (errorEl) {
                errorEl.textContent = '⚠️ Please enter a valid email address';
                errorEl.style.display = 'block';
            }
            input.dataset.error = 'true';
            return false;
        }

        input.style.borderColor = colors.success;
        input.style.boxShadow = '0 0 0 4px rgba(67, 160, 71, 0.1)';
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
        delete input.dataset.error;
        return true;
    }

    function validatePassword(input) {
        const value = input.value.trim();
        const errorEl = input.closest('.form-group').querySelector('.error-message');

        if (!value) {
            input.style.borderColor = colors.danger;
            input.style.boxShadow = '0 0 0 4px rgba(229, 57, 53, 0.1)';
            if (errorEl) {
                errorEl.textContent = '⚠️ Password is required';
                errorEl.style.display = 'block';
            }
            input.dataset.error = 'true';
            return false;
        }

        if (value.length < 6) {
            input.style.borderColor = colors.danger;
            input.style.boxShadow = '0 0 0 4px rgba(229, 57, 53, 0.1)';
            if (errorEl) {
                errorEl.textContent = '⚠️ Password must be at least 6 characters';
                errorEl.style.display = 'block';
            }
            input.dataset.error = 'true';
            return false;
        }

        input.style.borderColor = colors.success;
        input.style.boxShadow = '0 0 0 4px rgba(67, 160, 71, 0.1)';
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
        delete input.dataset.error;
        return true;
    }
}

// ========================================
// AUTO-RENDER (If used directly)
// ========================================
if (document.getElementById('root')) {
    const root = document.getElementById('root');
    const loginPage = createLoginPage();
    root.appendChild(loginPage);
}

export default createLoginPage;