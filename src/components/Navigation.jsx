'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, PlusCircle, Receipt, Users, ClipboardList, BarChart3, Settings, LogOut, Menu, X, Mountain, ChevronRight } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sales/new', icon: PlusCircle, label: 'New Sale' },
  { to: '/sales', icon: Receipt, label: 'Sales & Invoices' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
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
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--brand)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: 12 }}>
            <Mountain size={22} />
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Verifying authentication...</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Connecting securely</div>
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

  const currentPage = navItems.find(item => item.to === pathname);

  return (
    <div className="app-container">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
              <Mountain size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'white', lineHeight: 1.3 }}>Lakshmi Stone</div>
              <div style={{ fontSize: 11, color: 'var(--sidebar-text)', fontWeight: 400 }}>Crusher & Suppliers</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu</div>
          {navItems.map((item) => {
            const isActive = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                href={item.to}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#60a5fa', flexShrink: 0 }}>
                A
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Admin</div>
                <div style={{ fontSize: 11, color: 'var(--sidebar-text)' }}>Administrator</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{ color: '#9ca3af', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={20} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
              {currentPage?.label || 'Lakshmi Stone Crusher'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {pathname !== '/sales/new' && (
              <Link href="/sales/new" className="btn btn-primary btn-sm">
                <PlusCircle size={14} /> New Sale
              </Link>
            )}
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
