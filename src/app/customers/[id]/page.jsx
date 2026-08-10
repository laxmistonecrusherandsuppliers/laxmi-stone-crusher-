'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id;

  const [customer, setCustomer] = useState(null);
  const [ledger, setLedger] = useState({ logs: [], summary: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, ledgerRes] = await Promise.all([
          fetch('/api/customers').then(r => r.json()),
          fetch(`/api/customers/${id}/ledger`).then(r => r.json()),
        ]);
        if (custRes.data) {
          const found = custRes.data.find(c => String(c.id) === String(id));
          setCustomer(found);
        }
        if (ledgerRes.data) setLedger(ledgerRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadData();
  }, [id]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading customer ledger...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👤 {customer?.name || 'Customer'} Ledger</h1>
          <p style={{ color: 'var(--text-secondary)' }}>📞 {customer?.mobile} | 🏠 {customer?.address}</p>
        </div>
        <Link href="/customers" className="btn btn-secondary">
          ← Back to Customers
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="stat-cards-grid">
        <div className="stat-card">
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Billed</div>
            <div className="stat-value">{formatCurrency(ledger.summary?.total_billed)}</div>
          </div>
          <div className="stat-icon">🧾</div>
        </div>

        <div className="stat-card">
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Paid</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{formatCurrency(ledger.summary?.total_paid)}</div>
          </div>
          <div className="stat-icon">💰</div>
        </div>

        <div className="stat-card">
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Outstanding Due Balance</div>
            <div className="stat-value" style={{ color: parseFloat(ledger.summary?.total_due) > 0 ? 'var(--danger)' : 'inherit' }}>
              {formatCurrency(ledger.summary?.total_due)}
            </div>
          </div>
          <div className="stat-icon">⚠️</div>
        </div>
      </div>

      {/* Payment Ledger Table */}
      <div className="card">
        <div className="card-header">📊 Running Payment Ledger</div>
        {ledger.logs.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No payment logs recorded for this customer.</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date &amp; Time</th>
                  <th>Notes</th>
                  <th>Amount Paid</th>
                  <th>Balance Before</th>
                  <th>Balance After</th>
                </tr>
              </thead>
              <tbody>
                {ledger.logs.map((log, i) => (
                  <tr key={log.id}>
                    <td>{i + 1}</td>
                    <td>{formatDateTime(log.payment_date)}</td>
                    <td>{log.notes || 'Payment Entry'}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(log.amount_paid)}</td>
                    <td>{formatCurrency(log.balance_before)}</td>
                    <td style={{ fontWeight: 700, color: parseFloat(log.balance_after) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      {formatCurrency(log.balance_after)}
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
