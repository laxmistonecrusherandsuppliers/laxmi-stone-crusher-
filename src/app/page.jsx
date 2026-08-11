'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/format';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    today_sales_count: 0,
    today_sales_amount: 0,
    today_collection: 0,
    total_outstanding: 0,
    total_customers: 0,
  });
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, recentRes] = await Promise.all([
          fetch('/api/sales/stats/dashboard').then(r => r.json()),
          fetch('/api/sales/stats/recent').then(r => r.json()),
        ]);
        if (statsRes.data) setStats(statsRes.data);
        if (recentRes.data) setRecentSales(recentRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84375rem', marginTop: '2px' }}>
            Real-time business performance summary • {formatDate(new Date())}
          </p>
        </div>
        <Link href="/sales/new" className="btn btn-primary">
          <span>➕</span> New Sale Invoice
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="stat-cards-grid">
        <div className="stat-card" style={{ borderTop: '3px solid var(--brand-blue)' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', tracking: '0.04em' }}>Today's Billed Sales</div>
            <div className="stat-value">{formatCurrency(stats.today_sales_amount)}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2px', fontWeight: 500 }}>
              {stats.today_sales_count} invoices created
            </div>
          </div>
          <div className="stat-icon">🧾</div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid var(--success)' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', tracking: '0.04em' }}>Today's Cash Collection</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              {formatCurrency(stats.today_collection)}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2px', fontWeight: 500 }}>
              Collected today
            </div>
          </div>
          <div className="stat-icon">💰</div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid var(--danger)' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', tracking: '0.04em' }}>Total Outstanding Due</div>
            <div className="stat-value" style={{ color: stats.total_outstanding > 0 ? 'var(--danger)' : 'inherit' }}>
              {formatCurrency(stats.total_outstanding)}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2px', fontWeight: 500 }}>
              Customer dues balance
            </div>
          </div>
          <div className="stat-icon">⚠️</div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid var(--warning)' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', tracking: '0.04em' }}>Active Customer Base</div>
            <div className="stat-value">{stats.total_customers}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2px', fontWeight: 500 }}>
              Registered customers
            </div>
          </div>
          <div className="stat-icon">👥</div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⚡ Quick Shortcuts</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link href="/sales/new" className="btn btn-secondary btn-sm">
              ➕ New Sale Bill
            </Link>
            <Link href="/customers" className="btn btn-secondary btn-sm">
              👥 View Customers
            </Link>
            <Link href="/reports?type=due" className="btn btn-secondary btn-sm" style={{ color: 'var(--danger-text)' }}>
              ⚠️ Outstanding Dues
            </Link>
            <Link href="/attendance" className="btn btn-secondary btn-sm">
              📋 Daily Attendance
            </Link>
            <Link href="/reports" className="btn btn-secondary btn-sm">
              📈 Reports Hub
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Recent Sales Transactions</span>
          <Link href="/sales" style={{ fontSize: '0.8125rem', color: 'var(--brand-blue)', fontWeight: 600 }}>
            View All Sales Invoices →
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading recent sales...</div>
        ) : recentSales.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No sales transactions recorded yet. Click "+ New Sale Invoice" to create your first bill.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Customer Name</th>
                  <th>Sale Date</th>
                  <th>Status</th>
                  <th>Grand Total</th>
                  <th>Paid</th>
                  <th>Due Balance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td style={{ fontWeight: 600 }}>{sale.invoice_number}</td>
                    <td style={{ fontWeight: 500 }}>{sale.customer_name || 'N/A'}</td>
                    <td>{formatDate(sale.sale_date)}</td>
                    <td>
                      <span className={`badge badge-${sale.payment_mode}`}>
                        {sale.payment_mode?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(sale.grand_total)}</td>
                    <td style={{ color: 'var(--success)' }}>{formatCurrency(sale.amount_paid)}</td>
                    <td style={{ color: sale.amount_due > 0 ? 'var(--danger)' : 'inherit', fontWeight: sale.amount_due > 0 ? 700 : 400 }}>
                      {formatCurrency(sale.amount_due)}
                    </td>
                    <td>
                      <Link href={`/sales/${sale.id}`} className="btn btn-ghost btn-sm">
                        👁️ View Bill
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
