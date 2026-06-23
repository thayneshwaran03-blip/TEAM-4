/**
 * ========================================
 * HOSTELHUB - WARDEN DASHBOARD
 * ========================================
 * Author: Samritha S
 * Description: Warden dashboard UI
 * ========================================
 */

export function createWardenDashboard(user, onLogout) {
    const container = document.createElement('div');
    container.id = 'wardenDashboard';

    container.style.cssText = `
        min-height:100vh;
        background:
        radial-gradient(circle at 10% 20%,
        rgb(18,28,97) 0.1%,
        rgb(8,14,53) 90.1%);
        font-family:'Outfit',sans-serif;
        color:white;
        padding:30px;
    `;

    if (!document.getElementById('warden-styles')) {
        const style = document.createElement('style');
        style.id = 'warden-styles';
        style.textContent = `
            .dashboard-card{
                background:rgba(255,255,255,0.08);
                backdrop-filter:blur(20px);
                border:1px solid rgba(255,255,255,0.15);
                border-radius:20px;
                padding:25px;
                text-align:center;
                transition:0.3s;
            }

            .dashboard-card:hover{
                transform:translateY(-5px);
                box-shadow:0 20px 40px rgba(0,0,0,0.3);
            }

            .stats-grid{
                display:grid;
                grid-template-columns:
                repeat(auto-fit,minmax(220px,1fr));
                gap:20px;
                margin-top:30px;
            }

            .glass-card{
                background:rgba(255,255,255,0.07);
                backdrop-filter:blur(20px);
                border:1px solid rgba(255,255,255,0.15);
                border-radius:20px;
                padding:25px;
                margin-top:30px;
            }

            table{
                width:100%;
                border-collapse:collapse;
                margin-top:20px;
            }

            th{
                color:#90caf9;
                padding:15px;
                text-align:left;
                border-bottom:1px solid rgba(255,255,255,0.15);
            }

            td{
                padding:15px;
                border-bottom:1px solid rgba(255,255,255,0.08);
            }

            .pending{
                color:#ffb74d;
                font-weight:600;
            }

            .approved{
                color:#81c784;
                font-weight:600;
            }

            .btn{
                background:#1f6feb;
                border:none;
                color:white;
                padding:12px 20px;
                border-radius:10px;
                cursor:pointer;
                margin-right:10px;
                transition:0.3s;
            }

            .btn:hover{
                transform:translateY(-2px);
            }

            .logout-btn{
                background:rgba(248,81,73,0.15);
                border:1px solid rgba(248,81,73,0.4);
                color:#ff7b72;
                padding:12px 20px;
                border-radius:10px;
                cursor:pointer;
            }
        `;
        document.head.appendChild(style);
    }

    container.innerHTML = `
        <h1 style="
            margin-bottom:10px;
            font-size:32px;">
            🏠 HostelHub Warden Portal
        </h1>

        <p style="
            color:#90caf9;
            font-size:18px;">
            Welcome back, ${user.fullName}
        </p>

        <div class="stats-grid">

            <div class="dashboard-card">
                <h1>250</h1>
                <p>Total Students</p>
            </div>

            <div class="dashboard-card">
                <h1>10</h1>
                <p>Pending Leaves</p>
            </div>

            <div class="dashboard-card">
                <h1>120</h1>
                <p>Occupied Rooms</p>
            </div>

            <div class="dashboard-card">
                <h1>5</h1>
                <p>Visitors Today</p>
            </div>

        </div>

        <div class="glass-card">
            <h2>Recent Leave Requests</h2>

            <table>
                <tr>
                    <th>Student</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Reason</th>
                    <th>Status</th>
                </tr>

                <tr>
                    <td>Priya</td>
                    <td>20-06-2026</td>
                    <td>22-06-2026</td>
                    <td>Medical</td>
                    <td class="pending">
                        Pending
                    </td>
                </tr>

                <tr>
                    <td>Rahul</td>
                    <td>18-06-2026</td>
                    <td>19-06-2026</td>
                    <td>Personal</td>
                    <td class="approved">
                        Approved
                    </td>
                </tr>
            </table>
        </div>

        <div class="glass-card">
            <h2>Quick Actions</h2>

            <button class="btn">
                View Leave Requests
            </button>

            <button class="btn">
                View Students
            </button>

            <button class="btn">
                Room Occupancy
            </button>

            <button class="btn">
                Visitor Logs
            </button>
        </div>

        <div style="margin-top:30px;">
            <button id="logoutBtn"
                    class="logout-btn">
                Sign Out
            </button>
        </div>
    `;

    container
        .querySelector('#logoutBtn')
        .addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            onLogout();
        });

    return container;
}

export default createWardenDashboard;