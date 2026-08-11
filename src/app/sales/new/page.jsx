'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/format';
import { User, Phone, MapPin, Trash2, Plus, Banknote, FileText, Calendar, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [paymentMethod, setPaymentMethod] = useState('cash');
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
        payment_method: paymentMethod,
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
        <div>
          <h1 className="page-title">New Sale Invoice</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84375rem', marginTop: '2px' }}>
            Generate bill for stone crusher material sales
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="steps">
        <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-number">{step > 1 ? <Check size={12} /> : '1'}</div>
          <span>1. Customer</span>
        </div>
        <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-number">{step > 2 ? <Check size={12} /> : '2'}</div>
          <span>2. Materials</span>
        </div>
        <div className={`step-item ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
          <div className="step-number">{step > 3 ? <Check size={12} /> : '3'}</div>
          <span>3. GST Tax</span>
        </div>
        <div className={`step-item ${step >= 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}>
          <div className="step-number">{step > 4 ? <Check size={12} /> : '4'}</div>
          <span>4. Payment</span>
        </div>
        <div className={`step-item ${step >= 5 ? 'active' : ''}`}>
          <div className="step-number">5</div>
          <span>5. Final Review</span>
        </div>
      </div>

      {/* STEP 1: CUSTOMER */}
      {step === 1 && (
        <div className="card" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div className="card-header">Step 1: Select Customer Account</div>

          {selectedCustomer ? (
            <div style={{ background: 'var(--success-light)', border: '1px solid #a7f3d0', padding: '16px 20px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--success-text)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} /> {selectedCustomer.name}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.84375rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14} /> {selectedCustomer.mobile || 'No Mobile'}</span> | <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {selectedCustomer.address || 'No Address'}</span>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCustomer(null)}>Change</button>
            </div>
          ) : (
            <div>
              <div className="form-group">
                <label className="form-label">Search Customer (by Name or Mobile)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type customer name or phone number..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  autoFocus
                />
              </div>

              {customerResults.length > 0 && (
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', maxHeight: '220px', overflowY: 'auto', marginBottom: '20px', background: 'white' }}>
                  {customerResults.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                      style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}
                    >
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{c.mobile}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border)' }}>
                <button className="btn btn-secondary" onClick={() => setShowNewCustModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={14} /> Create New Customer Profile
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button className="btn btn-primary btn-lg" disabled={!selectedCustomer} onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Next: Materials List <ChevronRight size={14} />
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
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 40px', gap: '10px', alignItems: 'end', marginBottom: '12px', padding: '14px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Material Item</label>
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
                      style={{ marginTop: '6px' }}
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
                  <select
                    className="form-select"
                    value={['Tonne', 'CFT', 'Brass', 'Trip', 'Load', 'Piece', 'KG', 'Cubic Meter', 'Sq Ft'].includes(item.unit) ? item.unit : 'Other'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Other') {
                        handleItemChange(idx, 'unit', '');
                      } else {
                        handleItemChange(idx, 'unit', val);
                      }
                    }}
                  >
                    <option value="Tonne">Tonne</option>
                    <option value="CFT">CFT</option>
                    <option value="Brass">Brass</option>
                    <option value="Trip">Trip</option>
                    <option value="Load">Load</option>
                    <option value="Piece">Piece</option>
                    <option value="KG">KG</option>
                    <option value="Cubic Meter">Cu.m</option>
                    <option value="Sq Ft">Sq Ft</option>
                    <option value="Other">Other...</option>
                  </select>
                  {!['Tonne', 'CFT', 'Brass', 'Trip', 'Load', 'Piece', 'KG', 'Cubic Meter', 'Sq Ft'].includes(item.unit) && (
                    <input
                      type="text"
                      className="form-input"
                      style={{ marginTop: '6px' }}
                      placeholder="Custom unit..."
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                    />
                  )}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Rate (₹)</label>
                  <input type="number" step="0.01" className="form-input" placeholder="₹0.00" value={item.rate} onChange={(e) => handleItemChange(idx, 'rate', e.target.value)} />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Subtotal</label>
                  <div style={{ padding: '8px 12px', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.875rem' }}>
                    {formatCurrency(rowAmt)}
                  </div>
                </div>

                <div>
                  <button className="btn btn-danger btn-sm" onClick={() => removeItemRow(idx)} disabled={items.length === 1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          <button className="btn btn-secondary" onClick={addItemRow} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> Add Line Item
          </button>

          <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Calculated Subtotal:</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-blue)' }}>{formatCurrency(subtotal)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ChevronLeft size={14} /> Back
            </button>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(3)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Next: GST Config <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: GST */}
      {step === 3 && (
        <div className="card" style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div className="card-header">Step 3: GST Invoice Options</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '20px', border: '1px solid var(--border)' }}>
            <input type="checkbox" id="gst-toggle" checked={gstEnabled} onChange={(e) => setGstEnabled(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
            <label htmlFor="gst-toggle" style={{ fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' }}>
              Enable Tax Invoice (GST Billing)
            </label>
          </div>

          {gstEnabled && (
            <div className="form-group" style={{ maxWidth: '240px' }}>
              <label className="form-label">GST Tax Rate (%)</label>
              <input type="number" className="form-input" value={gstPercent} onChange={(e) => setGstPercent(e.target.value)} />
            </div>
          )}

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Taxable Subtotal:</span> <strong>{formatCurrency(subtotal)}</strong>
            </div>
            {gstEnabled && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  <span>CGST @ {(parseFloat(gstPercent)/2).toFixed(1)}%:</span> <strong>{formatCurrency(gstAmount/2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  <span>SGST @ {(parseFloat(gstPercent)/2).toFixed(1)}%:</span> <strong>{formatCurrency(gstAmount/2)}</strong>
                </div>
              </>
            )}
            <hr style={{ margin: '10px 0', borderColor: 'var(--border)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1875rem', fontWeight: 800 }}>
              <span>Grand Total Amount:</span> <span style={{ color: 'var(--brand-blue)' }}>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ChevronLeft size={14} /> Back
            </button>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(4)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Next: Payment Terms <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PAYMENT */}
      {step === 4 && (
        <div className="card" style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div className="card-header">Step 4: Payment Terms &amp; Notes</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div onClick={() => setPaymentMode('full')} style={{ border: `2px solid ${paymentMode === 'full' ? 'var(--success)' : 'var(--border)'}`, padding: '16px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center', background: paymentMode === 'full' ? 'var(--success-light)' : 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}><Banknote size={24} color={paymentMode === 'full' ? 'var(--success)' : 'currentColor'} /></div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginTop: '4px' }}>FULL PAYMENT</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Entire bill paid now</div>
            </div>

            <div onClick={() => setPaymentMode('partial')} style={{ border: `2px solid ${paymentMode === 'partial' ? 'var(--warning)' : 'var(--border)'}`, padding: '16px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center', background: paymentMode === 'partial' ? 'var(--warning-light)' : 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}><FileText size={24} color={paymentMode === 'partial' ? 'var(--warning)' : 'currentColor'} /></div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginTop: '4px' }}>PARTIAL PAYMENT</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Part paid, part due</div>
            </div>

            <div onClick={() => setPaymentMode('due')} style={{ border: `2px solid ${paymentMode === 'due' ? 'var(--danger)' : 'var(--border)'}`, padding: '16px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center', background: paymentMode === 'due' ? 'var(--danger-light)' : 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}><Calendar size={24} color={paymentMode === 'due' ? 'var(--danger)' : 'currentColor'} /></div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginTop: '4px' }}>FULL DUE</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>₹0 paid, full balance due</div>
            </div>
          </div>

          {paymentMode !== 'due' && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Payment Mode / Method *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[
                  { id: 'cash', label: 'Cash' },
                  { id: 'upi', label: 'UPI' },
                  { id: 'bank', label: 'Bank Transfer' },
                  { id: 'cheque', label: 'Cheque' },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    className={`btn ${paymentMethod === m.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    onClick={() => setPaymentMethod(m.id)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {paymentMode === 'partial' && (
            <div className="form-group" style={{ maxWidth: '280px' }}>
              <label className="form-label">Amount Paid Now (₹)</label>
              <input type="number" step="0.01" className="form-input" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="₹0.00" autoFocus />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Vehicle No / Reference Notes (Optional)</label>
            <textarea className="form-textarea" rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Truck No: MH-12-AB-1234" />
          </div>

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Total Bill Amount:</span> <strong>{formatCurrency(grandTotal)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--success)' }}>
              <span>Amount Paid Now:</span> <strong>{formatCurrency(actualPaid)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: dueAmount > 0 ? 'var(--danger)' : 'inherit', fontWeight: dueAmount > 0 ? 700 : 400 }}>
              <span>Remaining Balance Due:</span> <strong>{formatCurrency(dueAmount)}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <button className="btn btn-secondary" onClick={() => setStep(3)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ChevronLeft size={14} /> Back
            </button>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(5)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Next: Final Review <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW & SAVE */}
      {step === 5 && (
        <div className="card" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div className="card-header">Step 5: Review &amp; Generate Invoice</div>

          <div style={{ padding: '16px 20px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>CUSTOMER</div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedCustomer?.name}</div>
                <div style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)' }}>{selectedCustomer?.mobile}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>INVOICE SUMMARY</div>
                <div style={{ fontSize: '0.84375rem' }}>GST: <strong>{gstEnabled ? `ON (${gstPercent}%)` : 'OFF (Plain Bill)'}</strong></div>
                <div style={{ fontSize: '0.84375rem', marginTop: '2px' }}>
                  Payment Mode: <span className={`badge badge-${paymentMode}`}>{paymentMode.toUpperCase()} {paymentMode !== 'due' ? `(${paymentMethod.toUpperCase()})` : ''}</span>
                </div>
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

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
              <span>Grand Total:</span> <span style={{ color: 'var(--brand-blue)' }}>{formatCurrency(grandTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', marginTop: '4px', fontSize: '0.875rem' }}>
              <span>Paid Amount:</span> <span>{formatCurrency(actualPaid)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: dueAmount > 0 ? 'var(--danger)' : 'inherit', marginTop: '4px', fontSize: '0.875rem', fontWeight: dueAmount > 0 ? 700 : 400 }}>
              <span>Due Balance:</span> <span>{formatCurrency(dueAmount)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setStep(4)} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ChevronLeft size={14} /> Back
            </button>
            <button className="btn btn-success btn-lg" onClick={handleSaveSale} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {saving ? 'Creating Invoice...' : <><Check size={16} /> Save Sale &amp; Print Invoice</>}
            </button>
          </div>
        </div>
      )}

      {/* NEW CUSTOMER MODAL */}
      {showNewCustModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create Customer Profile</h3>
              <button onClick={() => setShowNewCustModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
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
                <button type="submit" className="btn btn-primary">Save &amp; Select</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
