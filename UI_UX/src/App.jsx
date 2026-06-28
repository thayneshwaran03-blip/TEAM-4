import React, { useState, useEffect } from 'react';
import Login from './pages/Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import WardenDashboard from './pages/WardenDashboard.jsx';
import FirstLoginChangePassword from './pages/FirstLoginChangePassword.jsx';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try { return savedUser ? JSON.parse(savedUser) : null; }
    catch { return null; }
  });
  // 'login' | 'forgot-password'
  const [authView, setAuthView] = useState('login');

  // Sync auth across tabs
  useEffect(() => {
    const handleAuthChange = () => {
      setToken(localStorage.getItem('token'));
      const savedUser = localStorage.getItem('user');
      try { setUser(savedUser ? JSON.parse(savedUser) : null); }
      catch { setUser(null); }
    };
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  const handleLoginSuccess = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setAuthView('login');
  };

  // ── Role-based dashboard routing ─────────────────────────────────────────
  if (token && user) {
    if (user.mustChangePassword) {
      return (
        <FirstLoginChangePassword
          user={user}
          onLogout={handleLogout}
          onPasswordChanged={(updatedUser) => {
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
          }}
        />
      );
    }

    switch (user.role) {
      case 'student':
        return <StudentDashboard user={user} onLogout={handleLogout} />;
      case 'warden':
        return <WardenDashboard user={user} onLogout={handleLogout} />;
      case 'admin':
      default:
        return <AdminDashboard user={user} onLogout={handleLogout} />;
    }
  }

  // ── Auth views ────────────────────────────────────────────────────────────
  if (authView === 'login') {
    return (
      <Login
        onForgotPassword={() => setAuthView('forgot-password')}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (authView === 'forgot-password') {
    return (
      <ForgotPassword
        onBackToLogin={() => setAuthView('login')}
      />
    );
  }

  return null;
}
