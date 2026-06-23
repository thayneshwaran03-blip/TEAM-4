/**
 * ========================================
 * HOSTELHUB - MAIN ENTRY (FIXED)
 * ========================================
 * Author: Thayaneshwaran S (UI/UX Designer)
 * Description: Entry point for previewing design with toggle
 * ========================================
 */

import createLoginPage from './design/login_design.js';
import createSignupPage from './design/signup_design.js';
import createDashboardPage from './design/dashboard_design.js';

console.log('🏠 HostelHub Design Preview loaded!');

const root = document.getElementById('root');

function renderApp() {
    // Clear root
    root.innerHTML = '';

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
        // User is logged in, show Dashboard
        try {
            const user = JSON.parse(userStr);
            const dashboardPage = createDashboardPage(user, token, () => {
                renderApp();
            });
            root.appendChild(dashboardPage);
            console.log('🔑 Logged in: Rendered dashboard');
        } catch (e) {
            console.error('Error parsing user data, logging out:', e);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            renderApp();
        }
    } else {
        // User not logged in, show Login/Signup forms
        const loginPage = createLoginPage();
        const signupPage = createSignupPage();

        // Store references for toggling
        loginPage.id = 'loginContainer';
        signupPage.id = 'signupContainer';

        // Show login first
        loginPage.style.display = 'flex';
        signupPage.style.display = 'none';

        root.appendChild(loginPage);
        root.appendChild(signupPage);
        console.log('🚪 Logged out: Rendered auth views');
    }
}

// Watch for authentication changes
window.addEventListener('authChange', () => {
    renderApp();
});

// Render the application initially
renderApp();

// Toggle between pages
document.addEventListener('click', function(e) {
    const link = e.target.closest('.auth-link');
    if (link) {
        const text = link.textContent.trim();
        const loginPage = document.getElementById('loginContainer');
        const signupPage = document.getElementById('signupContainer');
        
        if (loginPage && signupPage) {
            if (text === 'Sign Up') {
                loginPage.style.display = 'none';
                signupPage.style.display = 'flex';
                console.log('🔄 Switched to Sign Up page');
            } else if (text === 'Sign In') {
                signupPage.style.display = 'none';
                loginPage.style.display = 'flex';
                console.log('🔄 Switched to Login page');
            }
        }
    }
});

console.log('💡 Click "Sign Up" or "Sign In" to switch pages');

// Handle window resize for responsive
window.addEventListener('resize', function() {
    console.log('Window resized to: ' + window.innerWidth + 'px');
});