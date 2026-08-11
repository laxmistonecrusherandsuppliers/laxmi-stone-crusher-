'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.id;
  const printRef = useRef(null);

  const [sale, setSale] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // Settlement Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNotes, setPayNotes] = useState('');
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    loadSaleData();
  }, [saleId]);

  async function loadSaleData() {
    try {
      const [saleRes, settingsRes] = await Promise.all([
        fetch(`/api/sales/${saleId}`).then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
      ]);
      if (saleRes.data) setSale(saleRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: sale ? `Invoice-${sale.invoice_number}` : 'Invoice',
  });

  const handleDownloadPdf = () => {
    window.open(`/api/sales/${saleId}/pdf`, '_blank');
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) return alert('Enter valid payment amount.');
    if (amt > parseFloat(sale.amount_due) + 0.01) {
      return alert(`Payment amount (₹${amt}) cannot exceed outstanding due balance (₹${sale.amount_due}).`);
    }

    setRecording(true);
    try {
      const res = await fetch(`/api/sales/${saleId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_paid: amt,
          payment_method: payMethod,
          notes: payNotes,
        }),
      }).then(r => r.json());

      if (res.error) throw new Error(res.error);

      alert('Payment settled successfully!');
      setShowPayModal(false);
      setPayAmount('');
      setPayNotes('');
      loadSaleData();
    } catch (err) {
      alert(err.message);
    } finally {
      setRecording(false);
    }
  };

  const handleDeleteBill = async () => {
    if (!confirm(`⚠️ Are you sure you want to permanently delete Invoice #${sale.invoice_number}?\nThis action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/sales/${saleId}`, { method: 'DELETE' }).then(r => r.json());
      if (res.error) throw new Error(res.error);
      alert(`Invoice #${sale.invoice_number} deleted successfully.`);
      router.push('/sales');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading sale details...</div>;
  if (!sale) return <div style={{ padding: '40px', textAlign: 'center' }}>Sale invoice not found.</div>;

  const dueAmt = parseFloat(sale.amount_due) || 0;

  return (
    <div>
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Invoice #{sale.invoice_number}</h1>
          <span className={`badge badge-${sale.payment_mode}`}>{sale.payment_mode?.toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {dueAmt > 0 && (
            <button className="btn btn-success" onClick={() => { setPayAmount(dueAmt); setShowPayModal(true); }}>
              💳 Settle Due (₹{formatCurrency(dueAmt)})
            </button>
          )}
          <button className="btn btn-secondary" onClick={handlePrint}>
            🖨️ Print Invoice
          </button>
          <button className="btn btn-primary" onClick={handleDownloadPdf}>
            📄 Download PDF
          </button>
          <button className="btn btn-danger" onClick={handleDeleteBill}>
            🗑️ Delete Bill
          </button>
        </div>
      </div>

      {dueAmt > 0 && (
        <div className="card no-print" style={{ marginBottom: '20px', background: 'var(--danger-light)', borderColor: '#fecaca' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '1.1rem' }}>
                ⚠️ Outstanding Balance Due: {formatCurrency(dueAmt)}
              </div>
              <div style={{ color: '#b91c1c', fontSize: '0.85rem' }}>
                Record full or partial payment to settle this invoice.
              </div>
            </div>
            <button className="btn btn-danger" onClick={() => { setPayAmount(dueAmt); setShowPayModal(true); }}>
              Record Payment
            </button>
          </div>
        </div>
      )}

      {/* Screen View + Printable Invoice Box */}
      <div className="card" style={{ padding: '36px', maxWidth: '800px', margin: '0 auto' }}>
        <div className="bill-print" ref={printRef}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{settings.business_name || 'Lakshmi Stone Crusher & Suppliers'}</h2>
            {sale.gst_enabled && <div style={{ fontWeight: 800, color: 'var(--primary)', margin: '4px 0' }}>TAX INVOICE</div>}
            <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>{settings.business_address}</div>
            <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>Ph: {settings.business_mobile}</div>
            {sale.gst_enabled && settings.gstin && <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>GSTIN: {settings.gstin}</div>}
          </div>

          <hr style={{ margin: '16px 0', borderColor: '#ccc' }} />

          {/* Details */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.95rem' }}>
            <div>
              <div><strong>Invoice No:</strong> {sale.invoice_number}</div>
              <div><strong>Date:</strong> {formatDate(sale.sale_date)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div><strong>Customer:</strong> {sale.customer_name}</div>
              <div>{sale.customer_mobile}</div>
              <div>{sale.customer_address}</div>
            </div>
          </div>

          {/* Items Table */}
          <table className="table" style={{ marginBottom: '20px' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Material</th>
                <th>Qty</th>
                <th>Unit</th>
                <th style={{ textAlign: 'right' }}>Rate (₹)</th>
                <th style={{ textAlign: 'right' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{item.custom_material_name || item.material_name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ maxWidth: '320px', marginLeft: 'auto', textAlign: 'right', fontSize: '0.95rem' }}>
            {sale.gst_enabled && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Subtotal (Taxable):</span> <strong>{formatCurrency(sale.subtotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>CGST @ {(parseFloat(sale.gst_percent)/2).toFixed(1)}%:</span> <strong>{formatCurrency(sale.gst_amount/2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>SGST @ {(parseFloat(sale.gst_percent)/2).toFixed(1)}%:</span> <strong>{formatCurrency(sale.gst_amount/2)}</strong>
                </div>
              </>
            )}
            <hr style={{ margin: '8px 0', borderColor: '#000' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800 }}>
              <span>Grand Total:</span> <span>{formatCurrency(sale.grand_total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', marginTop: '4px' }}>
              <span>Amount Paid:</span> <span>{formatCurrency(sale.amount_paid)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: dueAmt > 0 ? 'var(--danger)' : 'inherit', marginTop: '4px', fontWeight: dueAmt > 0 ? 700 : 400 }}>
              <span>Balance Due:</span> <span>{formatCurrency(sale.amount_due)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Ledger Box */}
      <div className="card no-print" style={{ maxWidth: '800px', margin: '24px auto 0 auto' }}>
        <div className="card-header">📊 Invoice Payment History</div>
        {sale.payment_logs.length === 0 ? (
          <div style={{ padding: '20px', color: 'var(--text-muted)' }}>No payment logs recorded yet.</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Payment Mode</th>
                  <th>Amount Paid</th>
                  <th>Balance After</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {sale.payment_logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDateTime(log.payment_date)}</td>
                    <td>
                      <span className="badge badge-admin">{log.payment_mode?.toUpperCase() || 'CASH'}</span>
                    </td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(log.amount_paid)}</td>
                    <td style={{ color: parseFloat(log.balance_after) > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                      {formatCurrency(log.balance_after)}
                    </td>
                    <td>{log.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SETTLE DUE PAYMENT MODAL */}
      {showPayModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>💳 Record Payment / Settle Due</h3>
              <button onClick={() => setShowPayModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="modal-body">
                <div style={{ padding: '12px 16px', background: 'var(--danger-light)', borderRadius: 'var(--radius-md)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Outstanding Balance:</span>
                  <strong style={{ color: '#991b1b', fontSize: '1.2rem' }}>{formatCurrency(dueAmt)}</strong>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Mode *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {[
                      { id: 'cash', label: '💵 Cash' },
                      { id: 'upi', label: '📱 UPI' },
                      { id: 'bank', label: '🏦 Bank' },
                      { id: 'cheque', label: '📄 Cheque' },
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        className={`btn ${payMethod === m.id ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '8px 4px', fontSize: '0.85rem' }}
                        onClick={() => setPayMethod(m.id)}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Enter amount..."
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPayAmount(dueAmt)}>
                      Full (₹{formatCurrency(dueAmt)})
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPayAmount((dueAmt / 2).toFixed(2))}>
                      50% (₹{formatCurrency(dueAmt / 2)})
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes / Reference No</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. UPI Ref # 123456789 or Cheque No 00123"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)} disabled={recording}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={recording}>
                  {recording ? 'Processing...' : '✅ Confirm &amp; Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
