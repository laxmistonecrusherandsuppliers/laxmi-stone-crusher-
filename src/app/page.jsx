'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/format';
import { Plus, Receipt, IndianRupee, AlertTriangle, Users, ClipboardList, BarChart3, Eye } from 'lucide-react';

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
          <Plus size={16} /> New Sale Invoice
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="stat-cards-grid">
        <div className="stat-card" style={{ borderTop: '3px solid var(--brand-blue)' }}>
          <div>
            <div className="stat-label">Today's Billed Sales</div>
            <div className="stat-value">{formatCurrency(stats.today_sales_amount)}</div>
            <div className="stat-meta">
              {stats.today_sales_count} invoices created
            </div>
          </div>
          <div className="stat-icon stat-icon-blue"><Receipt size={20} /></div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid var(--success)' }}>
          <div>
            <div className="stat-label">Today's Cash Collection</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              {formatCurrency(stats.today_collection)}
            </div>
            <div className="stat-meta">
              Collected today
            </div>
          </div>
          <div className="stat-icon stat-icon-green"><IndianRupee size={20} /></div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid var(--danger)' }}>
          <div>
            <div className="stat-label">Total Outstanding Due</div>
            <div className="stat-value" style={{ color: stats.total_outstanding > 0 ? 'var(--danger)' : 'inherit' }}>
              {formatCurrency(stats.total_outstanding)}
            </div>
            <div className="stat-meta">
              Customer dues balance
            </div>
          </div>
          <div className="stat-icon stat-icon-red"><AlertTriangle size={20} /></div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid var(--warning)' }}>
          <div>
            <div className="stat-label">Active Customer Base</div>
            <div className="stat-value">{stats.total_customers}</div>
            <div className="stat-meta">
              Registered customers
            </div>
          </div>
          <div className="stat-icon stat-icon-amber"><Users size={20} /></div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Quick actions</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link href="/sales/new" className="btn btn-secondary btn-sm">
              <Plus size={14} /> New Sale
            </Link>
            <Link href="/customers" className="btn btn-secondary btn-sm">
              <Users size={14} /> Customers
            </Link>
            <Link href="/reports?type=due" className="btn btn-secondary btn-sm" style={{ color: 'var(--danger-text)' }}>
              <AlertTriangle size={14} /> Outstanding Dues
            </Link>
            <Link href="/attendance" className="btn btn-secondary btn-sm">
              <ClipboardList size={14} /> Attendance
            </Link>
            <Link href="/reports" className="btn btn-secondary btn-sm">
              <BarChart3 size={14} /> Reports
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
                        <Eye size={14} /> View
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
