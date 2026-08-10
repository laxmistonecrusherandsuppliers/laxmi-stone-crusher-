'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/format';

export default function NewSalePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showNewCustModal, setShowNewCustModal] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', mobile: '', address: '' });

  const [materials, setMaterials] = useState([]);
  const [items, setItems] = useState([
    { material_id: '', custom_material_name: '', quantity: '', unit: 'Tonne', rate: '' }
  ]);

  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercent, setGstPercent] = useState(18);
  const [paymentMode, setPaymentMode] = useState('full');
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Load Materials & Saved Rates
  useEffect(() => {
    fetch('/api/materials')
      .then(r => r.json())
      .then(res => { if (res.data) setMaterials(res.data); });
  }, []);

  // Customer search debounce
  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomerResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}`)
        .then(r => r.json())
        .then(res => { if (res.data) setCustomerResults(res.data); });
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCust.name.trim()) return;
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCust),
      }).then(r => r.json());
      if (res.data) {
        setSelectedCustomer(res.data);
        setShowNewCustModal(false);
        setNewCust({ name: '', mobile: '', address: '' });
      }
    } catch (err) {
      alert('Error creating customer: ' + err.message);
    }
  };

  const handleMaterialSelect = (index, matId) => {
    const newItems = [...items];
    newItems[index].material_id = matId;
    const selectedMat = materials.find(m => String(m.id) === String(matId));
    if (selectedMat && selectedMat.rate_per_unit) {
      newItems[index].rate = selectedMat.rate_per_unit;
      newItems[index].unit = selectedMat.unit || 'Tonne';
    }
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { material_id: '', custom_material_name: '', quantity: '', unit: 'Tonne', rate: '' }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const r = parseFloat(item.rate) || 0;
      return sum + (q * r);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const gstAmount = gstEnabled ? subtotal * (parseFloat(gstPercent) / 100) : 0;
  const grandTotal = subtotal + gstAmount;

  let actualPaid = 0;
  let dueAmount = 0;
  if (paymentMode === 'full') {
    actualPaid = grandTotal;
    dueAmount = 0;
  } else if (paymentMode === 'due') {
    actualPaid = 0;
    dueAmount = grandTotal;
  } else {
    actualPaid = parseFloat(amountPaid) || 0;
    dueAmount = Math.max(0, grandTotal - actualPaid);
  }

  const handleSaveSale = async () => {
    if (!selectedCustomer) return alert('Please select a customer.');
    if (items.some(i => !i.material_id || !i.quantity || !i.rate)) {
      return alert('Please fill material, quantity, and rate for all line items.');
    }

    setSaving(true);
    try {
      const payload = {
        customer_id: selectedCustomer.id,
        sale_date: new Date().toISOString().split('T')[0],
        gst_enabled: gstEnabled,
        items: items.map(i => ({
          material_id: parseInt(i.material_id),
          custom_material_name: i.custom_material_name || null,
          quantity: parseFloat(i.quantity),
          unit: i.unit,
          rate: parseFloat(i.rate),
        })),
        payment_mode: paymentMode,
        amount_paid: actualPaid,
        notes,
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => r.json());

      if (res.data?.sale_id) {
        router.push(`/sales/${res.data.sale_id}`);
      } else {
        throw new Error(res.error || 'Failed to save sale');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">➕ New Sale</h1>
      </div>

      {/* Step Indicator */}
      <div className="steps">
        <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-number">{step > 1 ? '✓' : '1'}</div>
          <span>Customer</span>
        </div>
        <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-number">{step > 2 ? '✓' : '2'}</div>
          <span>Materials</span>
        </div>
        <div className={`step-item ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
          <div className="step-number">{step > 3 ? '✓' : '3'}</div>
          <span>GST</span>
        </div>
        <div className={`step-item ${step >= 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}>
          <div className="step-number">{step > 4 ? '✓' : '4'}</div>
          <span>Payment</span>
        </div>
        <div className={`step-item ${step >= 5 ? 'active' : ''}`}>
          <div className="step-number">5</div>
          <span>Review</span>
        </div>
      </div>

      {/* STEP 1: CUSTOMER */}
      {step === 1 && (
        <div className="card">
          <div className="card-header">Step 1: Select Customer</div>

          {selectedCustomer ? (
            <div style={{ background: 'var(--success-light)', padding: '16px 20px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#065f46', fontSize: '1.1rem' }}>👤 {selectedCustomer.name}</div>
                <div style={{ color: '#047857', fontSize: '0.9rem' }}>📞 {selectedCustomer.mobile || 'No Mobile'} | 🏠 {selectedCustomer.address || 'No Address'}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCustomer(null)}>Change Customer</button>
            </div>
          ) : (
            <div>
              <div className="form-group">
                <label className="form-label">Search Customer (by Name or Mobile)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type to search existing customer..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  autoFocus
                />
              </div>

              {customerResults.length > 0 && (
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
                  {customerResults.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                      style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                    >
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{c.mobile}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ textAlignment: 'center', marginTop: '16px' }}>
                <button className="btn btn-secondary" onClick={() => setShowNewCustModal(true)}>
                  ➕ Create New Customer Profile
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button className="btn btn-primary btn-lg" disabled={!selectedCustomer} onClick={() => setStep(2)}>
              Next: Select Materials →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: MATERIALS */}
      {step === 2 && (
        <div className="card">
          <div className="card-header">Step 2: Add Materials &amp; Quantities</div>

          {items.map((item, idx) => {
            const isOther = materials.find(m => String(m.id) === String(item.material_id))?.name === 'Other';
            const rowAmt = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);

            return (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 40px', gap: '12px', alignItems: 'end', marginBottom: '16px', padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Material</label>
                  <select className="form-select" value={item.material_id} onChange={(e) => handleMaterialSelect(idx, e.target.value)}>
                    <option value="">Select Material</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  {isOther && (
                    <input
                      type="text"
                      className="form-input"
                      style={{ marginTop: '8px' }}
                      placeholder="Type custom material name..."
                      value={item.custom_material_name}
                      onChange={(e) => handleItemChange(idx, 'custom_material_name', e.target.value)}
                    />
                  )}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Quantity</label>
                  <input type="number" step="0.001" className="form-input" placeholder="0.000" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Unit</label>
                  <select className="form-select" value={item.unit} onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}>
                    <option value="Tonne">Tonne</option>
                    <option value="CFT">CFT</option>
                    <option value="Load">Load</option>
                    <option value="Piece">Piece</option>
                    <option value="KG">KG</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Rate (₹)</label>
                  <input type="number" step="0.01" className="form-input" placeholder="₹0.00" value={item.rate} onChange={(e) => handleItemChange(idx, 'rate', e.target.value)} />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Amount</label>
                  <div style={{ padding: '10px 14px', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontWeight: 700 }}>
                    {formatCurrency(rowAmt)}
                  </div>
                </div>

                <div>
                  <button className="btn btn-danger btn-sm" onClick={() => removeItemRow(idx)} disabled={items.length === 1}>🗑️</button>
                </div>
              </div>
            );
          })}

          <button className="btn btn-secondary" onClick={addItemRow}>➕ Add Another Item</button>

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Subtotal Amount:</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(subtotal)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(3)}>Next: GST Settings →</button>
          </div>
        </div>
      )}

      {/* STEP 3: GST */}
      {step === 3 && (
        <div className="card">
          <div className="card-header">Step 3: GST Invoice Options</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
            <input type="checkbox" id="gst-toggle" checked={gstEnabled} onChange={(e) => setGstEnabled(e.target.checked)} style={{ width: '24px', height: '24px', cursor: 'pointer' }} />
            <label htmlFor="gst-toggle" style={{ fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer' }}>
              Enable GST Tax Invoice (ON / OFF)
            </label>
          </div>

          {gstEnabled && (
            <div className="form-group" style={{ maxWidth: '300px' }}>
              <label className="form-label">GST Percentage (%)</label>
              <input type="number" className="form-input" value={gstPercent} onChange={(e) => setGstPercent(e.target.value)} />
            </div>
          )}

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Taxable Subtotal:</span> <strong>{formatCurrency(subtotal)}</strong>
            </div>
            {gstEnabled && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>CGST @ {(parseFloat(gstPercent)/2).toFixed(1)}%:</span> <strong>{formatCurrency(gstAmount/2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>SGST @ {(parseFloat(gstPercent)/2).toFixed(1)}%:</span> <strong>{formatCurrency(gstAmount/2)}</strong>
                </div>
              </>
            )}
            <hr style={{ margin: '12px 0', borderColor: 'var(--border)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 800 }}>
              <span>Grand Total Amount:</span> <span style={{ color: 'var(--primary)' }}>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(4)}>Next: Payment Mode →</button>
          </div>
        </div>
      )}

      {/* STEP 4: PAYMENT */}
      {step === 4 && (
        <div className="card">
          <div className="card-header">Step 4: Payment Terms</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div onClick={() => setPaymentMode('full')} style={{ border: `2px solid ${paymentMode === 'full' ? 'var(--success)' : 'var(--border)'}`, padding: '20px', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center', background: paymentMode === 'full' ? 'var(--success-light)' : 'white' }}>
              <div style={{ fontSize: '2rem' }}>💰</div>
              <div style={{ fontWeight: 700, marginTop: '8px' }}>FULL PAYMENT</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Entire amount paid now</div>
            </div>

            <div onClick={() => setPaymentMode('partial')} style={{ border: `2px solid ${paymentMode === 'partial' ? 'var(--warning)' : 'var(--border)'}`, padding: '20px', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center', background: paymentMode === 'partial' ? 'var(--warning-light)' : 'white' }}>
              <div style={{ fontSize: '2rem' }}>📋</div>
              <div style={{ fontWeight: 700, marginTop: '8px' }}>PARTIAL PAYMENT</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Part paid, part due</div>
            </div>

            <div onClick={() => setPaymentMode('due')} style={{ border: `2px solid ${paymentMode === 'due' ? 'var(--danger)' : 'var(--border)'}`, padding: '20px', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center', background: paymentMode === 'due' ? 'var(--danger-light)' : 'white' }}>
              <div style={{ fontSize: '2rem' }}>📅</div>
              <div style={{ fontWeight: 700, marginTop: '8px' }}>FULL DUE</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>0 paid now, full due</div>
            </div>
          </div>

          {paymentMode === 'partial' && (
            <div className="form-group" style={{ maxWidth: '300px' }}>
              <label className="form-label">Amount Paid Now (₹)</label>
              <input type="number" step="0.01" className="form-input" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="₹0.00" autoFocus />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea className="form-textarea" rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Vehicle Truck No: MH-12-AB-1234" />
          </div>

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Total Bill Amount:</span> <strong>{formatCurrency(grandTotal)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--success)' }}>
              <span>Amount Paid Now:</span> <strong>{formatCurrency(actualPaid)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: dueAmount > 0 ? 'var(--danger)' : 'inherit', fontWeight: dueAmount > 0 ? 700 : 400 }}>
              <span>Remaining Balance Due:</span> <strong>{formatCurrency(dueAmount)}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <button className="btn btn-secondary" onClick={() => setStep(3)}>← Back</button>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(5)}>Next: Final Review →</button>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW & SAVE */}
      {step === 5 && (
        <div className="card">
          <div className="card-header">Step 5: Review &amp; Create Invoice</div>

          <div style={{ padding: '20px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>CUSTOMER</h4>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedCustomer?.name}</div>
                <div>{selectedCustomer?.mobile}</div>
              </div>
              <div>
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>INVOICE SUMMARY</h4>
                <div>GST: <strong>{gstEnabled ? `ON (${gstPercent}%)` : 'OFF (Plain Bill)'}</strong></div>
                <div>Payment Mode: <span className={`badge badge-${paymentMode}`}>{paymentMode.toUpperCase()}</span></div>
              </div>
            </div>
          </div>

          <table className="table" style={{ marginBottom: '20px' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Material</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{materials.find(m => String(m.id) === String(it.material_id))?.name === 'Other' ? it.custom_material_name : materials.find(m => String(m.id) === String(it.material_id))?.name}</td>
                  <td>{it.quantity} {it.unit}</td>
                  <td>{formatCurrency(it.rate)}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency((parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: 800 }}>
              <span>Grand Total:</span> <span style={{ color: 'var(--primary)' }}>{formatCurrency(grandTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', marginTop: '4px' }}>
              <span>Paid Amount:</span> <span>{formatCurrency(actualPaid)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: dueAmount > 0 ? 'var(--danger)' : 'inherit', marginTop: '4px', fontWeight: dueAmount > 0 ? 700 : 400 }}>
              <span>Due Balance:</span> <span>{formatCurrency(dueAmount)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setStep(4)} disabled={saving}>← Back</button>
            <button className="btn btn-success btn-lg" onClick={handleSaveSale} disabled={saving}>
              {saving ? 'Creating Sale Invoice...' : '✅ Save Sale &amp; Generate Invoice'}
            </button>
          </div>
        </div>
      )}

      {/* NEW CUSTOMER MODAL */}
      {showNewCustModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Customer</h3>
              <button onClick={() => setShowNewCustModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateCustomer}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Customer Name *</label>
                  <input type="text" className="form-input" required value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input type="text" className="form-input" value={newCust.mobile} onChange={(e) => setNewCust({ ...newCust, mobile: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input type="text" className="form-input" value={newCust.address} onChange={(e) => setNewCust({ ...newCust, address: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewCustModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save &amp; Select Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
