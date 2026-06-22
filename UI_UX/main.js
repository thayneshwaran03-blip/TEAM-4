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

console.log('🏠 HostelHub Design Preview loaded!');

const root = document.getElementById('root');

// Clear root
root.innerHTML = '';

// Create both pages
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

// Toggle between pages
document.addEventListener('click', function(e) {
    const link = e.target.closest('.auth-link');
    if (link) {
        const text = link.textContent.trim();
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
});

console.log('💡 Click "Sign Up" or "Sign In" to switch pages');

// Handle window resize for responsive
window.addEventListener('resize', function() {
    console.log('Window resized to: ' + window.innerWidth + 'px');
});