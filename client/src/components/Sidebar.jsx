import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', icon: '🏠', label: 'Dashboard', exact: true },
  { to: '/sales/new', icon: '➕', label: 'New Sale' },
  { to: '/sales', icon: '🧾', label: 'Sales' },
  { to: '/customers', icon: '👥', label: 'Customers' },
  { to: '/reports', icon: '📊', label: 'Reports' },
  { to: '/attendance', icon: '📅', label: 'Attendance' },
  { to: '/settings', icon: '⚙️', label: 'Settings', adminOnly: true },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);
  
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span style={{fontSize:'1.5rem'}}>⛰️</span>
          <div>
            <div style={{fontWeight:800, fontSize:'0.95rem', lineHeight:1.2}}>Lakshmi Stone</div>
            <div style={{fontSize:'0.7rem', opacity:0.7, fontWeight:400}}>Crusher & Suppliers</div>
          </div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-info" style={{marginBottom: '12px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px'}}>
          <div style={{color: 'var(--sidebar-text)', fontSize: '0.85rem', fontWeight: 600}}>{user?.username || 'User'}</div>
          <div style={{color: 'rgba(226,232,240,0.6)', fontSize: '0.75rem', textTransform: 'capitalize'}}>{user?.role}</div>
        </div>
        <button className="btn btn-ghost" onClick={handleLogout} style={{color: '#ef4444', width: '100%', justifyContent: 'center'}}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
