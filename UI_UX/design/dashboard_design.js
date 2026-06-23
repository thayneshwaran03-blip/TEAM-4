/**
 * ========================================
 * HOSTELHUB - DASHBOARD PREVIEW
 * ========================================
 * Description: Logged in dashboard preview to test API integration
 * ========================================
 */

export function createDashboardPage(user, token, onLogout) {
    const container = document.createElement('div');
    container.id = 'dashboardContainer';
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: radial-gradient(circle at 10% 20%, rgb(18, 28, 97) 0.1%, rgb(8, 14, 53) 90.1%);
        font-family: 'Outfit', sans-serif;
        color: white;
        padding: 20px;
    `;

    // Dynamic style insertion for keyframe animation
    if (!document.getElementById('dashboard-styles')) {
        const style = document.createElement('style');
        style.id = 'dashboard-styles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    const card = document.createElement('div');
    card.style.cssText = `
        background: rgba(255, 255, 255, 0.07);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 20px;
        padding: 40px;
        max-width: 550px;
        width: 100%;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        text-align: center;
        animation: fadeIn 0.5s ease-out;
    `;

    // Title
    const title = document.createElement('h1');
    title.innerHTML = '<span style="font-size:32px">🏠</span> HostelHub Portal';
    title.style.cssText = 'margin: 0 0 10px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;';
    card.appendChild(title);

    // Subtitle
    const subtitle = document.createElement('p');
    subtitle.textContent = `Welcome back, ${user.fullName}!`;
    subtitle.style.cssText = 'color: #90caf9; font-size: 18px; margin: 0 0 25px 0;';
    card.appendChild(subtitle);

    // Profile Details Table
    const details = document.createElement('div');
    details.style.cssText = `
        text-align: left;
        background: rgba(0, 0, 0, 0.25);
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 25px;
        font-size: 14px;
        line-height: 1.8;
        border: 1px solid rgba(255, 255, 255, 0.05);
    `;
    details.innerHTML = `
        <strong>Email:</strong> ${user.email}<br>
        <strong>Role:</strong> <span style="text-transform: uppercase; color: #ffab40; font-weight: 700; font-size: 12px; background: rgba(255,171,64,0.15); padding: 2px 8px; border-radius: 4px; margin-left: 5px;">${user.role}</span><br>
        <strong>Department:</strong> ${user.department || 'N/A'}<br>
        <strong>Year:</strong> ${user.year || 'N/A'}<br>
        <strong>Phone:</strong> ${user.phoneNumber || 'N/A'}<br>
        ${user.parentName ? `<strong>Parent/Guardian:</strong> ${user.parentName} (${user.parentContact})` : ''}
    `;
    card.appendChild(details);

    // API Console Header
    const consoleHeader = document.createElement('div');
    consoleHeader.textContent = 'Backend Auth API Test Console';
    consoleHeader.style.cssText = 'font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #a5b4fc; text-align: left; margin-bottom: 5px; font-weight: 600;';
    card.appendChild(consoleHeader);

    // API Test Output Area
    const apiConsole = document.createElement('div');
    apiConsole.id = 'apiConsole';
    apiConsole.style.cssText = `
        background: #0d1117;
        border: 1px solid #30363d;
        color: #8b949e;
        padding: 15px;
        border-radius: 8px;
        font-family: 'Courier New', Courier, monospace;
        font-size: 12px;
        text-align: left;
        margin-bottom: 25px;
        min-height: 80px;
        max-height: 180px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-break: break-all;
        box-shadow: inset 0 2px 8px rgba(0,0,0,0.5);
    `;
    apiConsole.textContent = 'Click one of the buttons below to test role-based authorizations against your backend server.';
    card.appendChild(apiConsole);

    // Button container
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;';

    // Helper function for API test buttons
    const createTestBtn = (btnRole, color) => {
        const btn = document.createElement('button');
        btn.textContent = `Test ${btnRole.charAt(0).toUpperCase() + btnRole.slice(1)} API`;
        btn.style.cssText = `
            background: ${color};
            border: none;
            color: white;
            padding: 10px 15px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 6px 12px rgba(0,0,0,0.2)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        });
        btn.addEventListener('click', async () => {
            apiConsole.style.color = '#8b949e';
            apiConsole.textContent = `GET /api/${btnRole}/dashboard...\nHeaders: Authorization: Bearer [JWT_TOKEN]`;
            
            try {
                const res = await fetch(`http://localhost:5000/api/${btnRole}/dashboard`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await res.json();
                
                if (res.ok) {
                    apiConsole.style.color = '#39d353'; // green
                } else if (res.status === 403) {
                    apiConsole.style.color = '#ff7b72'; // light red
                } else {
                    apiConsole.style.color = '#f0883e'; // orange
                }
                apiConsole.textContent = `Response Code: ${res.status} ${res.statusText}\n\n${JSON.stringify(data, null, 2)}`;
            } catch (err) {
                apiConsole.style.color = '#f85149';
                apiConsole.textContent = `Connection Refused: Is your backend running on http://localhost:5000?\n\nError Details:\n${err.message}`;
            }
        });
        return btn;
    };

    // Add buttons for student, warden, admin
    btnContainer.appendChild(createTestBtn('student', '#238636'));
    btnContainer.appendChild(createTestBtn('warden', '#8957e5'));
    btnContainer.appendChild(createTestBtn('admin', '#1f6feb'));

    // Logout Button
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'Sign Out';
    logoutBtn.style.cssText = `
        background: rgba(248, 81, 73, 0.15);
        border: 1px solid rgba(248, 81, 73, 0.4);
        color: #ff7b72;
        padding: 10px 20px;
        font-size: 13px;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
    `;
    logoutBtn.addEventListener('mouseenter', () => {
        logoutBtn.style.background = 'rgba(248, 81, 73, 0.3)';
        logoutBtn.style.transform = 'translateY(-2px)';
    });
    logoutBtn.addEventListener('mouseleave', () => {
        logoutBtn.style.background = 'rgba(248, 81, 73, 0.15)';
        logoutBtn.style.transform = 'translateY(0)';
    });
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        onLogout();
    });
    btnContainer.appendChild(logoutBtn);

    card.appendChild(btnContainer);
    container.appendChild(card);

    return container;
}

export default createDashboardPage;
