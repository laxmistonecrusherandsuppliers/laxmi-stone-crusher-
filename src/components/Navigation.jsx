'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/sales/new', icon: '➕', label: 'New Sale' },
  { to: '/sales', icon: '🧾', label: 'Sales & Invoices' },
  { to: '/customers', icon: '👥', label: 'Customers' },
  { to: '/attendance', icon: '📋', label: 'Attendance' },
  { to: '/reports', icon: '📈', label: 'Reports Hub' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Navigation({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/login') {
      setCheckingAuth(false);
      return;
    }

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('lsc_token');
      if (!token) {
        router.replace('/login');
      } else {
        setCheckingAuth(false);
      }
    }
  }, [pathname, router]);

  if (pathname === '/login') {
    return <main>{children}</main>;
  }

  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '32px 48px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '1.75rem', marginBottom: '8px' }}>🔐</div>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>Verifying Authentication...</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>Connecting securely</div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lsc_token');
      router.push('/login');
    }
  };

  const activeNav = navItems.find(item => item.to === pathname) || { label: 'Management Workspace' };

  return (
    <div className="app-container">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>
              ⛰️
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'white', letterSpacing: '-0.01em' }}>Lakshmi Stone</div>
              <div style={{ fontSize: '0.725rem', color: 'var(--sidebar-text)', fontWeight: 400 }}>Crusher &amp; Suppliers</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', tracking: '0.05em', color: '#64748b', padding: '8px 12px 4px 12px' }}>
            Main Menu
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.to;
            return (
              <Link
                key={item.to}
                href={item.to}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>
                A
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'white' }}>Administrator</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--sidebar-text)' }}>Admin Account</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              style={{ color: '#ef4444', padding: '6px', borderRadius: '6px', fontSize: '0.9rem' }}
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </button>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {activeNav.label}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {pathname !== '/sales/new' && (
              <Link href="/sales/new" className="btn btn-primary btn-sm">
                <span>➕</span> New Sale Bill
              </Link>
            )}
            <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '4px 10px', borderRadius: '6px' }}>
              FY 2026-27
            </div>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
