import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getDashboardStats, getRecentSales } from '../api/sales';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const StatCard = ({ icon, label, value, subvalue, color }) => (
  <div className="stat-card" style={{ borderTop: `4px solid var(--${color})` }}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-label">{label}</div>
    <div className="stat-value text-primary-color">{value}</div>
    {subvalue && <div className="text-sm mt-2 text-muted-color">{subvalue}</div>}
  </div>
);

const QuickAction = ({ to, icon, label, primary, danger }) => (
  <Link to={to} style={{ textDecoration: 'none' }}>
    <div className={`card ${primary ? 'bg-primary text-white' : ''}`} style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', 
      textAlign: 'center', transition: 'transform 0.2s', cursor: 'pointer',
      backgroundColor: primary ? 'var(--primary)' : 'var(--bg-card)',
      color: primary ? 'white' : danger ? 'var(--danger)' : 'inherit',
      border: danger ? '1px solid var(--danger)' : 'none'
    }}>
      <span style={{ fontSize: '2rem', marginBottom: '12px' }}>{icon}</span>
      <span style={{ fontWeight: 600 }}>{label}</span>
    </div>
  </Link>
);

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
  });

  const { data: recentSales, isLoading: recentLoading } = useQuery({
    queryKey: ['recentSales'],
    queryFn: getRecentSales,
  });

  if (statsLoading || recentLoading) {
    return <div className="loading-overlay"><div className="spinner"></div>Loading dashboard...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span className="text-muted-color font-medium">Today: {formatDate(new Date())}</span>
      </div>

      <div className="stat-cards-grid flex-wrap flex gap-4 mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <StatCard icon="🧾" label="Today's Sales" value={stats?.today_sales_count || 0} subvalue={`Amount: ${formatCurrency(stats?.today_sales_amount)}`} color="primary" />
        <StatCard icon="💰" label="Today's Collection" value={formatCurrency(stats?.today_collection)} color="success" />
        <StatCard icon="⚠️" label="Total Outstanding" value={formatCurrency(stats?.total_outstanding)} color="danger" />
        <StatCard icon="👥" label="Total Customers" value={stats?.total_customers || 0} color="info" />
      </div>

      <div className="card mb-6">
        <div className="card-header">Quick Actions</div>
        <div className="card-body">
          <div className="quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <QuickAction to="/sales/new" icon="➕" label="New Sale" primary />
            <QuickAction to="/customers" icon="👥" label="Customers" />
            <QuickAction to="/sales?filter=due" icon="📋" label="Due Payments" danger />
            <QuickAction to="/reports" icon="📊" label="Reports" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Recent Transactions</div>
        <div className="card-body p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales?.length > 0 ? (
                  recentSales.map(sale => (
                    <tr key={sale.id}>
                      <td><Link to={`/sales/${sale.id}`}>{sale.invoice_number}</Link></td>
                      <td>{sale.customer_name}</td>
                      <td className="amount">{formatCurrency(sale.grand_total)}</td>
                      <td>
                        <span className={`badge ${sale.amount_due > 0 ? 'badge-due' : 'badge-paid'}`}>
                          {sale.amount_due > 0 ? 'DUE' : 'PAID'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-state">No recent sales found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
