'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { MapPin, Phone, ChevronLeft, Receipt, IndianRupee, AlertTriangle, BarChart3, RotateCcw, Eye } from 'lucide-react';

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id;

  const [activeTab, setActiveTab] = useState('sales');
  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [ledger, setLedger] = useState({ logs: [], summary: {} });
  const [loading, setLoading] = useState(true);

  // Date filters
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let salesUrl = `/api/sales?customer_id=${id}&`;
        if (from) salesUrl += `from=${from}&`;
        if (to) salesUrl += `to=${to}&`;

        const [custRes, salesRes, ledgerRes] = await Promise.all([
          fetch('/api/customers').then(r => r.json()),
          fetch(salesUrl).then(r => r.json()),
          fetch(`/api/customers/${id}/ledger`).then(r => r.json()),
        ]);

        if (custRes.data) {
          const found = custRes.data.find(c => String(c.id) === String(id));
          setCustomer(found);
        }
        if (salesRes.data) setSales(salesRes.data);
        if (ledgerRes.data) setLedger(ledgerRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadData();
  }, [id, from, to]);

  if (loading && !customer) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading customer profile...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{customer?.name || 'Customer'} Profile</h1>
          <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Phone size={14} /> {customer?.mobile || 'No Mobile'} | <MapPin size={14} /> {customer?.address || 'No Address'}
          </p>
        </div>
        <Link href="/customers" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ChevronLeft size={14} /> Back to Customers
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="stat-cards-grid">
        <div className="stat-card">
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Billed Amount</div>
            <div className="stat-value">{formatCurrency(ledger.summary?.total_billed)}</div>
          </div>
          <div className="stat-icon stat-icon-blue"><Receipt size={20} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Paid</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{formatCurrency(ledger.summary?.total_paid)}</div>
          </div>
          <div className="stat-icon stat-icon-green"><IndianRupee size={20} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Outstanding Due Balance</div>
            <div className="stat-value" style={{ color: parseFloat(ledger.summary?.total_due) > 0 ? 'var(--danger)' : 'inherit' }}>
              {formatCurrency(ledger.summary?.total_due)}
            </div>
          </div>
          <div className="stat-icon stat-icon-red"><AlertTriangle size={20} /></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Receipt size={14} /> Sales History
        </button>
        <button
          className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <BarChart3 size={14} /> Payment Ledger
        </button>
      </div>

      {/* TAB 1: CUSTOMER SALES HISTORY WITH DATE RANGE FILTER */}
      {activeTab === 'sales' && (
        <>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'end', flexWrap: 'wrap' }}>
              <div>
                <label className="form-label">Filter From Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Filter To Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              <div>
                <button
                  className="btn btn-secondary"
                  onClick={() => { setFrom(''); setTo(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RotateCcw size={14} /> Reset
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Sales History for {customer?.name}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {sales.length} transactions found
              </span>
            </div>

            {sales.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No sales recorded for this customer in selected date range.
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Sale Date</th>
                      <th>Payment Status</th>
                      <th>Grand Total</th>
                      <th>Amount Paid</th>
                      <th>Amount Due</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.invoice_number}</td>
                        <td>{formatDate(s.sale_date)}</td>
                        <td>
                          <span className={`badge badge-${s.payment_mode}`}>{s.payment_mode?.toUpperCase()}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(s.grand_total)}</td>
                        <td style={{ color: 'var(--success)' }}>{formatCurrency(s.amount_paid)}</td>
                        <td style={{ color: parseFloat(s.amount_due) > 0 ? 'var(--danger)' : 'inherit', fontWeight: parseFloat(s.amount_due) > 0 ? 700 : 400 }}>
                          {formatCurrency(s.amount_due)}
                        </td>
                        <td>
                          <Link href={`/sales/${s.id}`} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
        </>
      )}

      {/* TAB 2: PAYMENT LEDGER */}
      {activeTab === 'ledger' && (
        <div className="card">
          <div className="card-header">Payment Ledger</div>
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
      )}
    </div>
  );
}
