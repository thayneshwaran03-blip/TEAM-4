/**
 * ========================================
 * HOSTELHUB - ADMIN DASHBOARD DESIGN
 * ========================================
 * Author: Thayaneshwaran S (UI/UX Designer)
 * Description: Admin dashboard created with JavaScript only
 * ========================================
 */

import DesignSystem from './design_system.js';
import { addResponsiveStyles } from './components.js';

const { colors, typography, spacing, radius, shadows } = DesignSystem;

export function createAdminDashboard() {
    addResponsiveStyles();

    const dashboard = document.createElement('div');
    dashboard.id = 'adminDashboard';
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
        width: 260px;
        min-height: 100vh;
        background: ${colors.white};
        border-right: 1px solid ${colors.gray200};
        padding: ${spacing.lg};
        position: sticky;
        top: 0;
        overflow-y: auto;
        flex-shrink: 0;
    `;

    // Brand
    const brand = document.createElement('div');
    brand.style.cssText = `
        display: flex;
        align-items: center;
        gap: ${spacing.md};
        padding-bottom: ${spacing.lg};
        border-bottom: 1px solid ${colors.gray200};
        margin-bottom: ${spacing.lg};
    `;
    brand.innerHTML = `
        <div style="width:40px;height:40px;background:${colors.primary};border-radius:${radius.md};display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:18px;">H</div>
        <span style="font-size:${typography.sizes.lg};font-weight:${typography.weights.bold};color:${colors.gray800};">Hostel<span style="color:${colors.primary};">Hub</span></span>
    `;
    sidebar.appendChild(brand);

    // User Badge
    const userBadge = document.createElement('div');
    userBadge.style.cssText = `
        background: ${colors.gray50};
        border-radius: ${radius.md};
        padding: ${spacing.md};
        margin-bottom: ${spacing.lg};
        display: flex;
        align-items: center;
        gap: ${spacing.md};
    `;
    userBadge.innerHTML = `
        <div style="width:40px;height:40px;border-radius:${radius.full};background:${colors.primary}20;display:flex;align-items:center;justify-content:center;color:${colors.primary};font-weight:bold;">SA</div>
        <div>
            <p style="font-size:${typography.sizes.sm};font-weight:${typography.weights.semibold};color:${colors.gray800};margin:0;">System Admin</p>
            <p style="font-size:${typography.sizes.xs};color:${colors.gray500};margin:0;">Administrator</p>
        </div>
    `;
    sidebar.appendChild(userBadge);

    // Navigation
    const navItems = [
        { icon: 'fa-th-large', label: 'Dashboard', active: true },
        { icon: 'fa-user-graduate', label: 'Manage Students' },
        { icon: 'fa-door-open', label: 'Manage Rooms' },
        { icon: 'fa-user-tie', label: 'Manage Wardens' },
        { icon: 'fa-calendar-check', label: 'Leave Requests' },
        { icon: 'fa-exclamation-triangle', label: 'Complaints' },
        { icon: 'fa-credit-card', label: 'Fee Records' },
        { icon: 'fa-address-book', label: 'Visitor Logs' },
        { icon: 'fa-chart-bar', label: 'Reports' },
        { icon: 'fa-history', label: 'Activity Audit' }
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

    // Sign Out
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
        <h1 style="font-size:${typography.sizes.xl};color:${colors.gray800};font-weight:${typography.weights.bold};">Administrative Command Analytics Center</h1>
        <div style="display:flex;align-items:center;gap:${spacing.md};font-size:${typography.sizes.sm};color:${colors.gray500};">
            <span style="background:${colors.gray100};padding:${spacing.sm} ${spacing.md};border-radius:${radius.full};">👤 Admin</span>
            <span>System Admin</span>
        </div>
    `;
    mainContent.appendChild(header);

    // Stats Grid
    const grid = document.createElement('div');
    grid.style.cssText = `display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: ${spacing.md}; margin-bottom: ${spacing.xl};`;

    const stats = [
        { icon: 'fa-users', label: 'Total Students', value: '245', color: '#2563eb' },
        { icon: 'fa-bed', label: 'Beds Allotted', value: '3', sub: '9 vacancies remaining', color: '#16a34a' },
        { icon: 'fa-users', label: 'Active Visitors', value: '0', sub: 'Currently inside', color: '#d97706' },
        { icon: 'fa-calendar-check', label: 'Pending Leaves', value: '0', color: '#dc2626' },
        { icon: 'fa-exclamation-triangle', label: 'Pending Complaints', value: '1', color: '#7c3aed' },
        { icon: 'fa-tools', label: 'Maintenance Actions', value: '1', color: '#0d9488' }
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

    // Charts Row
    const chartsRow = document.createElement('div');
    chartsRow.style.cssText = `display: grid; grid-template-columns: 1fr 1fr; gap: ${spacing.lg}; margin-bottom: ${spacing.xl};`;

    // Chart 1: Room Occupancy
    const chart1 = document.createElement('div');
    chart1.style.cssText = `background: ${colors.white}; border-radius: ${radius.lg}; padding: ${spacing.lg}; box-shadow: ${shadows.sm};`;
    chart1.innerHTML = `
        <h3 style="font-size:${typography.sizes.base};color:${colors.gray700};margin-bottom:${spacing.md};">Room Occupancy</h3>
        <div style="display:flex;align-items:center;justify-content:center;gap:${spacing.xl};height:200px;">
            <div style="position:relative;width:150px;height:150px;">
                <svg viewBox="0 0 100 100" style="transform:rotate(-90deg);">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="${colors.gray200}" stroke-width="15"/>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="${colors.primary}" stroke-width="15" stroke-dasharray="${75 * 2.51} ${25 * 2.51}" stroke-linecap="round"/>
                </svg>
                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
                    <span style="font-size:${typography.sizes['2xl']};font-weight:${typography.weights.bold};color:${colors.gray800};">75%</span>
                    <p style="font-size:${typography.sizes.xs};color:${colors.gray500};margin:0;">Occupied</p>
                </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:${spacing.sm};">
                <span style="font-size:${typography.sizes.sm};display:flex;align-items:center;gap:${spacing.sm};"><span style="display:inline-block;width:12px;height:12px;border-radius:${radius.full};background:${colors.primary};"></span> Occupied Beds</span>
                <span style="font-size:${typography.sizes.sm};display:flex;align-items:center;gap:${spacing.sm};"><span style="display:inline-block;width:12px;height:12px;border-radius:${radius.full};background:${colors.gray200};"></span> Vacant Beds</span>
            </div>
        </div>
    `;
    chartsRow.appendChild(chart1);

    // Chart 2: Fee Collection
    const chart2 = document.createElement('div');
    chart2.style.cssText = `background: ${colors.white}; border-radius: ${radius.lg}; padding: ${spacing.lg}; box-shadow: ${shadows.sm};`;
    chart2.innerHTML = `
        <h3 style="font-size:${typography.sizes.base};color:${colors.gray700};margin-bottom:${spacing.md};">Fee Collection</h3>
        <div style="display:flex;align-items:flex-end;height:180px;gap:${spacing.md};padding:0 ${spacing.sm};">
            ${['Jan','Feb','Mar','Apr','May','Jun'].map((month, i) => `
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:${spacing.xs};">
                    <div style="width:100%;background:${colors.primary};border-radius:${radius.sm} ${radius.sm} 0 0;height:${(40 + i * 10)}px;transition:all 0.3s ease;cursor:pointer;" 
                         onmouseenter="this.style.opacity='0.8'" 
                         onmouseleave="this.style.opacity='1'"></div>
                    <span style="font-size:${typography.sizes.xs};color:${colors.gray500};">${month}</span>
                </div>
            `).join('')}
        </div>
        <p style="text-align:center;font-size:${typography.sizes.sm};color:${colors.gray500};margin-top:${spacing.md};">Total: ₹45,00,000</p>
    `;
    chartsRow.appendChild(chart2);
    mainContent.appendChild(chartsRow);

    // Recent Activity
    const activityContainer = document.createElement('div');
    activityContainer.style.cssText = `background: ${colors.white}; border-radius: ${radius.lg}; padding: ${spacing.lg}; box-shadow: ${shadows.sm};`;
    const activityHeader = document.createElement('div');
    activityHeader.style.cssText = `display: flex; justify-content: space-between; align-items: center; margin-bottom: ${spacing.md};`;
    activityHeader.innerHTML = `
        <h3 style="font-size:${typography.sizes.base};color:${colors.gray700};">Recent Activities</h3>
        <span style="font-size:${typography.sizes.xs};color:${colors.gray400};">8 complaints</span>
    `;
    activityContainer.appendChild(activityHeader);

    const activities = [
        { title: 'WiFi not working in Block A', time: '2 hours ago', status: 'pending' },
        { title: 'Water heater malfunction', time: '1 day ago', status: 'in-progress' },
        { title: 'Noise disturbance after 11 PM', time: '2 days ago', status: 'pending' },
        { title: 'Broken window in common room', time: '3 days ago', status: 'resolved' }
    ];

    activities.forEach(activity => {
        const item = document.createElement('div');
        item.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: ${spacing.sm} 0; border-bottom: 1px solid ${colors.gray100};`;
        const statusColors = {
            pending: { bg: '#dbeafe', text: '#2563eb' },
            'in-progress': { bg: '#fef3c7', text: '#d97706' },
            resolved: { bg: '#dcfce7', text: '#16a34a' }
        };
        const sc = statusColors[activity.status] || statusColors.pending;
        item.innerHTML = `
            <div>
                <p style="font-size:${typography.sizes.sm};color:${colors.gray800};margin:0;font-weight:${typography.weights.medium};">${activity.title}</p>
                <p style="font-size:${typography.sizes.xs};color:${colors.gray400};margin:0;">${activity.time}</p>
            </div>
            <span style="font-size:${typography.sizes.xs};padding:2px 12px;border-radius:${radius.full};background:${sc.bg};color:${sc.text};">
                ${activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
            </span>
        `;
        activityContainer.appendChild(item);
    });
    mainContent.appendChild(activityContainer);

    // Assemble
    dashboard.appendChild(sidebar);
    dashboard.appendChild(mainContent);

    return dashboard;
}

if (document.getElementById('root')) {
    const root = document.getElementById('root');
    const dashboard = createAdminDashboard();
    root.innerHTML = '';
    root.appendChild(dashboard);
}

export default createAdminDashboard;