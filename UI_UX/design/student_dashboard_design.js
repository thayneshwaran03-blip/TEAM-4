/**
 * ========================================
 * HOSTELHUB - STUDENT DASHBOARD DESIGN
 * ========================================
 * Author: Thayaneshwaran S (UI/UX Designer)
 * Description: Student dashboard created with JavaScript only
 * ========================================
 */

import DesignSystem from './design_system.js';
import { addResponsiveStyles } from './components.js';

const { colors, typography, spacing, radius, shadows } = DesignSystem;

export function createStudentDashboard() {
    addResponsiveStyles();

    const dashboard = document.createElement('div');
    dashboard.id = 'studentDashboard';
    dashboard.style.cssText = `
        display: flex;
        min-height: 100vh;
        font-family: ${typography.fontFamily};
        background: ${colors.gray50};
        width: 100%;
    `;

    // ========================================
    // SIDEBAR
    // ========================================
    const sidebar = document.createElement('aside');
    sidebar.style.cssText = `
        width: 260px; min-height: 100vh; background: ${colors.white};
        border-right: 1px solid ${colors.gray200}; padding: ${spacing.lg};
        position: sticky; top: 0; overflow-y: auto; flex-shrink: 0;
    `;

    const brand = document.createElement('div');
    brand.style.cssText = `display: flex; align-items: center; gap: ${spacing.md}; padding-bottom: ${spacing.lg}; border-bottom: 1px solid ${colors.gray200}; margin-bottom: ${spacing.lg};`;
    brand.innerHTML = `
        <div style="width:40px;height:40px;background:${colors.primary};border-radius:${radius.md};display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:18px;">H</div>
        <span style="font-size:${typography.sizes.lg};font-weight:${typography.weights.bold};color:${colors.gray800};">Hostel<span style="color:${colors.primary};">Hub</span></span>
    `;
    sidebar.appendChild(brand);

    const userBadge = document.createElement('div');
    userBadge.style.cssText = `background: ${colors.gray50}; border-radius: ${radius.md}; padding: ${spacing.md}; margin-bottom: ${spacing.lg}; display: flex; align-items: center; gap: ${spacing.md};`;
    userBadge.innerHTML = `
        <div style="width:40px;height:40px;border-radius:${radius.full};background:${colors.primary}20;display:flex;align-items:center;justify-content:center;color:${colors.primary};font-weight:bold;">AM</div>
        <div>
            <p style="font-size:${typography.sizes.sm};font-weight:${typography.weights.semibold};color:${colors.gray800};margin:0;">Alex Mercer</p>
            <p style="font-size:${typography.sizes.xs};color:${colors.gray500};margin:0;">Student</p>
        </div>
    `;
    sidebar.appendChild(userBadge);

    const navItems = [
        { icon: 'fa-th-large', label: 'Dashboard', active: true },
        { icon: 'fa-user', label: 'My Profile' },
        { icon: 'fa-door-open', label: 'My Room' },
        { icon: 'fa-calendar-check', label: 'Apply Leave' },
        { icon: 'fa-exclamation-triangle', label: 'Complaints' },
        { icon: 'fa-credit-card', label: 'Fees & Dues' },
        { icon: 'fa-bullhorn', label: 'Announcements' },
        { icon: 'fa-address-book', label: 'My Visitor History' },
        { icon: 'fa-qrcode', label: 'QR Gate Pass' }
    ];

    const nav = document.createElement('nav');
    nav.style.cssText = `display: flex; flex-direction: column; gap: ${spacing.xs};`;

    navItems.forEach(item => {
        const link = document.createElement('a');
        link.style.cssText = `
            display: flex; align-items: center; gap: ${spacing.md}; padding: 10px ${spacing.md};
            border-radius: ${radius.md}; text-decoration: none;
            color: ${item.active ? colors.white : colors.gray600};
            background: ${item.active ? colors.primary : 'transparent'};
            font-size: ${typography.sizes.sm};
            font-weight: ${item.active ? typography.weights.medium : typography.weights.normal};
            cursor: pointer; transition: all 0.2s ease;
        `;
        link.innerHTML = `<i class="fas ${item.icon}" style="width:20px;text-align:center;color:${item.active ? colors.white : colors.gray400};"></i> <span>${item.label}</span>`;
        
        if (!item.active) {
            link.addEventListener('mouseenter', () => {
                link.style.background = colors.gray100;
                link.style.color = colors.gray800;
            });
            link.addEventListener('mouseleave', () => {
                link.style.background = 'transparent';
                link.style.color = colors.gray600;
            });
        }
        nav.appendChild(link);
    });
    sidebar.appendChild(nav);

    const signOut = document.createElement('div');
    signOut.style.cssText = `margin-top: ${spacing.lg}; padding-top: ${spacing.lg}; border-top: 1px solid ${colors.gray200};`;
    const signOutLink = document.createElement('a');
    signOutLink.style.cssText = `
        display: flex; align-items: center; gap: ${spacing.md}; padding: 10px ${spacing.md};
        border-radius: ${radius.md}; text-decoration: none; color: ${colors.danger};
        font-size: ${typography.sizes.sm}; cursor: pointer; transition: all 0.2s ease;
    `;
    signOutLink.innerHTML = `<i class="fas fa-sign-out-alt" style="width:20px;text-align:center;"></i> <span>Sign Out</span>`;
    signOutLink.addEventListener('mouseenter', () => { signOutLink.style.background = '#fee2e2'; });
    signOutLink.addEventListener('mouseleave', () => { signOutLink.style.background = 'transparent'; });
    signOut.appendChild(signOutLink);
    sidebar.appendChild(signOut);

    // ========================================
    // MAIN CONTENT
    // ========================================
    const mainContent = document.createElement('div');
    mainContent.style.cssText = `flex: 1; padding: ${spacing.lg}; overflow-y: auto; min-height: 100vh;`;

    // Header
    const header = document.createElement('header');
    header.style.cssText = `
        display: flex; justify-content: space-between; align-items: center;
        padding-bottom: ${spacing.lg}; border-bottom: 1px solid ${colors.gray200};
        margin-bottom: ${spacing.xl};
    `;
    header.innerHTML = `
        <h1 style="font-size:${typography.sizes.xl};color:${colors.gray800};font-weight:${typography.weights.bold};">Welcome Back, Alex Mercer! 🎉</h1>
        <div style="display:flex;align-items:center;gap:${spacing.md};font-size:${typography.sizes.sm};color:${colors.gray500};">
            <span style="background:${colors.gray100};padding:${spacing.sm} ${spacing.md};border-radius:${radius.full};">AM</span>
            <span>Alex Mercer</span>
            <span style="color:${colors.primary};">Student</span>
        </div>
    `;
    mainContent.appendChild(header);

    // Stats Grid
    const grid = document.createElement('div');
    grid.style.cssText = `display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: ${spacing.md}; margin-bottom: ${spacing.xl};`;

    const stats = [
        { icon: 'fa-door-open', label: 'My Room', value: 'Room 101', color: '#2563eb' },
        { icon: 'fa-calendar-check', label: 'Pending Leaves', value: '2', sub: 'Awaiting approvals', color: '#d97706' },
        { icon: 'fa-exclamation-triangle', label: 'Active Complaints', value: '1', sub: 'Under resolution', color: '#dc2626' },
        { icon: 'fa-credit-card', label: 'Unpaid Fees', value: 'No Dues', sub: 'Cleared', color: '#16a34a' }
    ];

    stats.forEach(stat => {
        const card = document.createElement('div');
        card.style.cssText = `
            background: ${colors.white}; border-radius: ${radius.lg}; padding: ${spacing.lg};
            box-shadow: ${shadows.sm}; transition: all 0.3s ease; cursor: pointer;
        `;
        card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-4px)'; card.style.boxShadow = shadows.md; });
        card.addEventListener('mouseleave', () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = shadows.sm; });

        const iconDiv = document.createElement('div');
        iconDiv.style.cssText = `
            width: 45px; height: 45px; border-radius: ${radius.md}; background: ${stat.color}20;
            display: flex; align-items: center; justify-content: center; color: ${stat.color};
            font-size: ${typography.sizes.lg}; margin-bottom: ${spacing.sm};
        `;
        iconDiv.innerHTML = `<i class="fas ${stat.icon}"></i>`;

        const value = document.createElement('h3');
        value.textContent = stat.value;
        value.style.cssText = `font-size: ${typography.sizes['2xl']}; font-weight: ${typography.weights.bold}; color: ${colors.gray800}; margin: 0;`;

        const label = document.createElement('p');
        label.textContent = stat.label;
        label.style.cssText = `font-size: ${typography.sizes.sm}; color: ${colors.gray500}; margin: 0;`;

        const sub = document.createElement('small');
        sub.textContent = stat.sub || '';
        sub.style.cssText = `font-size: ${typography.sizes.xs}; color: ${colors.gray400}; display: ${stat.sub ? 'block' : 'none'};`;

        card.appendChild(iconDiv);
        card.appendChild(value);
        card.appendChild(label);
        if (stat.sub) card.appendChild(sub);
        grid.appendChild(card);
    });
    mainContent.appendChild(grid);

    // Widgets
    const widgetsGrid = document.createElement('div');
    widgetsGrid.style.cssText = `display: grid; grid-template-columns: 1fr 1fr; gap: ${spacing.lg};`;

    // Widget 1: Current Room
    const widget1 = document.createElement('div');
    widget1.style.cssText = `background: ${colors.white}; border-radius: ${radius.lg}; padding: ${spacing.lg}; box-shadow: ${shadows.sm};`;
    widget1.innerHTML = `
        <h3 style="font-size:${typography.sizes.base};color:${colors.gray700};margin-bottom:${spacing.md};">Current Room Allocation</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:${spacing.sm};">
            <div><p style="font-size:${typography.sizes.sm};color:${colors.gray500};margin:0;">Room</p><p style="font-size:${typography.sizes.lg};font-weight:${typography.weights.bold};color:${colors.gray800};margin:0;">101</p></div>
            <div><p style="font-size:${typography.sizes.sm};color:${colors.gray500};margin:0;">Block</p><p style="font-size:${typography.sizes.lg};font-weight:${typography.weights.bold};color:${colors.gray800};margin:0;">Block A</p></div>
            <div><p style="font-size:${typography.sizes.sm};color:${colors.gray500};margin:0;">Floor</p><p style="font-size:${typography.sizes.lg};font-weight:${typography.weights.bold};color:${colors.gray800};margin:0;">1</p></div>
            <div><p style="font-size:${typography.sizes.sm};color:${colors.gray500};margin:0;">Roommates</p><p style="font-size:${typography.sizes.lg};font-weight:${typography.weights.bold};color:${colors.gray800};margin:0;">1</p></div>
        </div>
        <button style="width:100%;margin-top:${spacing.md};padding:10px;background:${colors.primary};color:white;border:none;border-radius:${radius.md};font-size:${typography.sizes.sm};font-weight:${typography.weights.medium};cursor:pointer;transition:all 0.3s ease;" 
                onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='${shadows.md}'"
                onmouseleave="this.style.transform='translateY(0)';this.style.boxShadow='none'">
            View All
        </button>
    `;
    widgetsGrid.appendChild(widget1);

    // Widget 2: Announcements
    const widget2 = document.createElement('div');
    widget2.style.cssText = `background: ${colors.white}; border-radius: ${radius.lg}; padding: ${spacing.lg}; box-shadow: ${shadows.sm};`;
    widget2.innerHTML = `
        <h3 style="font-size:${typography.sizes.base};color:${colors.gray700};margin-bottom:${spacing.md};">📢 Announcements Notice Board</h3>
        <div style="padding:${spacing.md};background:${colors.gray50};border-radius:${radius.md};border-left:4px solid ${colors.accent};">
            <p style="font-size:${typography.sizes.sm};color:${colors.gray500};">No active announcements on notice board.</p>
        </div>
    `;
    widgetsGrid.appendChild(widget2);

    mainContent.appendChild(widgetsGrid);

    dashboard.appendChild(sidebar);
    dashboard.appendChild(mainContent);

    return dashboard;
}

if (document.getElementById('root')) {
    const root = document.getElementById('root');
    const dashboard = createStudentDashboard();
    root.innerHTML = '';
    root.appendChild(dashboard);
}

export default createStudentDashboard;