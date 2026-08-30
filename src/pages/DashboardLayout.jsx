import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, CalendarDays, LogOut, Activity, Layers } from 'lucide-react';
import logo from '../assets/logo-03.png';
const DashboardLayout = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkStyle = ({ isActive }) => {
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '8px',
      color: isActive ? '#fff' : 'var(--text-muted)',
      background: isActive ? 'var(--primary)' : 'transparent',
      textDecoration: 'none',
      marginBottom: '8px',
      transition: 'all 0.2s',
    };
  };

  return (
    <div className="app-container">
      <div className="sidebar glass-panel" style={{ margin: '16px', borderRadius: '16px', height: 'calc(100vh - 32px)' }}>
        <div className="flex items-center gap-2 mb-6" style={{ padding: '0 8px' }}>
          <img src={logo} alt="VytalYou Logo" style={{ height: '46px', width: 'auto' }} />
        </div>
        
        <div style={{ padding: '0 8px', marginBottom: '32px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Logged in as:</p>
          <p className="font-bold">{admin?.name}</p>
        </div>

        <nav style={{ flex: 1 }}>
          <NavLink to="/" style={navLinkStyle} end>
            <LayoutDashboard size={20} /> Overview
          </NavLink>
          <NavLink to="/nurses" style={navLinkStyle}>
            <Users size={20} /> Nurses Directory
          </NavLink>
          <NavLink to="/bookings" style={navLinkStyle}>
            <CalendarDays size={20} /> Bookings
          </NavLink>
          <NavLink to="/subscriptions" style={navLinkStyle}>
            <Layers size={20} /> Subscriptions
          </NavLink>
        </nav>

        <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="main-content">
        <div className="glass-panel" style={{ height: '100%', padding: '32px', overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
