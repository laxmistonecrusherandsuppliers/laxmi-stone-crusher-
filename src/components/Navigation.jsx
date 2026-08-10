'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { to: '/', icon: '🏠', label: 'Dashboard' },
  { to: '/sales/new', icon: '➕', label: 'New Sale' },
  { to: '/sales', icon: '🧾', label: 'Sales' },
  { to: '/customers', icon: '👥', label: 'Customers' },
  { to: '/reports', icon: '📊', label: 'Reports' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Navigation({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // If on login page, skip app sidebar layout
  if (pathname === '/login') {
    return <main>{children}</main>;
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lsc_token');
      router.push('/login');
    }
  };

  return (
    <div className="app-container">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span style={{ fontSize: '1.5rem' }}>⛰️</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}>Lakshmi Stone</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 400 }}>Crusher &amp; Suppliers</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.to;
            return (
              <Link
                key={item.to}
                href={item.to}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            className="btn btn-ghost"
            onClick={handleLogout}
            style={{ color: '#ef4444', width: '100%', justifyContent: 'center' }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <div style={{ fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>
            Lakshmi Stone Crusher Business System
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
