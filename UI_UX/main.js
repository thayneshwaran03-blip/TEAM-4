/**
 * ========================================
 * HOSTELHUB - MAIN ENTRY
 * ========================================
 * Author: Thayaneshwaran S (UI/UX Designer)
 * Description: Entry point for previewing all designs
 * ========================================
 */

import createLoginPage from './design/login_design.js';
import createSignupPage from './design/signup_design.js';
import createAdminDashboard from './design/admin_dashboard_design.js';
import createStudentDashboard from './design/student_dashboard_design.js';
import createWardenDashboard from './design/warden_dashboard_design.js';

console.log('🏠 HostelHub Design Preview loaded!');

// ========================================
// CHOOSE WHICH PAGE TO PREVIEW
// ========================================
// Change this value to preview different pages:
// 'login' - Login page
// 'signup' - Signup page
// 'admin' - Admin Dashboard
// 'student' - Student Dashboard
// 'warden' - Warden Dashboard

const page = 'signup'; // <-- CHANGE THIS TO PREVIEW DIFFERENT PAGES

// ========================================
// RENDER SELECTED PAGE
// ========================================
const root = document.getElementById('root');
root.innerHTML = '';

let pageContent;
switch(page) {
    case 'login':
        pageContent = createLoginPage();
        break;
    case 'signup':
        pageContent = createSignupPage();
        break;
    case 'admin':
        pageContent = createAdminDashboard();
        break;
    case 'student':
        pageContent = createStudentDashboard();
        break;
    case 'warden':
        pageContent = createWardenDashboard();
        break;
    default:
        pageContent = createLoginPage();
}

root.appendChild(pageContent);

console.log('💡 Current page:', page);
console.log('💡 To switch pages, change the "page" variable in main.js');
console.log('💡 Options: login, signup, admin, student, warden');