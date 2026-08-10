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
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Today: {formatDate(new Date())}
          </p>
        </div>
        <Link href="/sales/new" className="btn btn-primary btn-lg">
          ➕ New Sale
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="stat-cards-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary-light)' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Today's Sales</div>
            <div className="stat-value">{stats.today_sales_count} bills</div>
            <div style={{ color: 'var(--primary-light)', fontSize: '0.9rem', fontWeight: 600, marginTop: '2px' }}>
              {formatCurrency(stats.today_sales_amount)}
            </div>
          </div>
          <div className="stat-icon">🧾</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Today's Collection</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              {formatCurrency(stats.today_collection)}
            </div>
          </div>
          <div className="stat-icon">💰</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Total Outstanding Due</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>
              {formatCurrency(stats.total_outstanding)}
            </div>
          </div>
          <div className="stat-icon">⚠️</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Total Customers</div>
            <div className="stat-value">{stats.total_customers}</div>
          </div>
          <div className="stat-icon">👥</div>
        </div>
      </div>

      {/* Quick Actions Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">⚡ Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <Link href="/sales/new" className="btn btn-primary btn-lg" style={{ height: '60px' }}>
            ➕ Create New Sale
          </Link>
          <Link href="/customers" className="btn btn-secondary btn-lg" style={{ height: '60px' }}>
            👥 View Customers
          </Link>
          <Link href="/sales?filter=due" className="btn btn-secondary btn-lg" style={{ height: '60px', color: 'var(--danger)' }}>
            📋 Pending Dues
          </Link>
          <Link href="/reports" className="btn btn-secondary btn-lg" style={{ height: '60px' }}>
            📊 Sales Reports
          </Link>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📋 Recent Transactions</span>
          <Link href="/sales" style={{ fontSize: '0.85rem', color: 'var(--primary-light)', fontWeight: 600 }}>
            View All Sales →
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading transactions...</div>
        ) : recentSales.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No sales recorded yet. Click "+ New Sale" to create one.</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Grand Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td style={{ fontWeight: 600 }}>{sale.invoice_number}</td>
                    <td>{sale.customer_name || 'N/A'}</td>
                    <td>{formatDate(sale.sale_date)}</td>
                    <td>
                      <span className={`badge badge-${sale.payment_mode}`}>
                        {sale.payment_mode?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(sale.grand_total)}</td>
                    <td style={{ color: 'var(--success)' }}>{formatCurrency(sale.amount_paid)}</td>
                    <td style={{ color: sale.amount_due > 0 ? 'var(--danger)' : 'inherit', fontWeight: sale.amount_due > 0 ? 600 : 400 }}>
                      {formatCurrency(sale.amount_due)}
                    </td>
                    <td>
                      <Link href={`/sales/${sale.id}`} className="btn btn-ghost btn-sm">
                        👁️ View
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
