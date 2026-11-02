import React, { useState, useEffect } from 'react';
import Login from './pages/Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import WardenDashboard from './pages/WardenDashboard.jsx';
import FirstLoginChangePassword from './pages/FirstLoginChangePassword.jsx';
import CompleteProfile from './pages/CompleteProfile.jsx';

// ── Decode JWT payload without any library ────────────────────────────────────
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// ── Validate the stored token matches the stored user's role ──────────────────
function isSessionValid(token, user) {
  if (!token || !user) return false;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  // Token must not be expired
  if (payload.exp && Date.now() / 1000 > payload.exp) return false;
  // Token role must match the user role saved in localStorage
  if (payload.role !== user.role) return false;
  return true;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try { return savedUser ? JSON.parse(savedUser) : null; }
    catch { return null; }
  });
  // 'login' | 'forgot-password'
  const [authView, setAuthView] = useState('login');

  // ── On mount: clear stale/mismatched sessions ─────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    let parsedUser = null;
    try { parsedUser = savedUser ? JSON.parse(savedUser) : null; } catch { /* ignore */ }

    if (storedToken && parsedUser && !isSessionValid(storedToken, parsedUser)) {
      // Token expired OR role in token ≠ role in saved user → force logout
      console.warn('[Auth] Stale or mismatched session detected. Clearing localStorage.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  }, []);

  // ── Sync auth state across browser tabs ───────────────────────────────────
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

  // ── Global 401/403 logout hook (used by apiFetch in dashboards) ───────────
  useEffect(() => {
    window.__forceLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setAuthView('login');
    };
    return () => { delete window.__forceLogout; };
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

  // ── Role-based dashboard routing ──────────────────────────────────────────
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
        if (!user.profileCompleted) {
          return (
            <CompleteProfile
              user={user}
              onLogout={handleLogout}
              onProfileCompleted={(updatedUser) => {
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
              }}
            />
          );
        }
        return <StudentDashboard user={user} onLogout={handleLogout} />;
      case 'warden':
        return <WardenDashboard user={user} onLogout={handleLogout} />;
      case 'admin':
        return <AdminDashboard user={user} onLogout={handleLogout} />;
      default:
        // Unknown role – force logout to prevent privilege escalation
        handleLogout();
        return null;
    }
  }

  // ── Auth views ─────────────────────────────────────────────────────────────
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
