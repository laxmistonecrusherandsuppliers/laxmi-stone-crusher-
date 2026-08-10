import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMaterials, getSavedRates } from '../api/materials';
import { getCustomers, createCustomer } from '../api/customers';
import { createSale } from '../api/sales';
import { getSettings } from '../api/settings';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount || 0);
};

const NewSale = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  // Step 1: Customer
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', mobile: '', address: '' });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', debouncedSearch],
    queryFn: () => getCustomers(debouncedSearch),
    enabled: debouncedSearch.length > 0,
  });

  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (data) => {
      setSelectedCustomer(data.data || data);
      setShowNewCustomer(false);
      setSearchTerm('');
    }
  });

  // Step 2: Items
  const [items, setItems] = useState([
    { id: 1, material_id: '', material_name: '', custom_material_name: '', quantity: '', unit: 'Tonne', rate: '', amount: 0 }
  ]);

  const { data: materials = [] } = useQuery({ queryKey: ['materials'], queryFn: getMaterials });
  const { data: savedRates = [] } = useQuery({ queryKey: ['savedRates'], queryFn: getSavedRates });

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const item = newItems[index];
    item[field] = value;

    if (field === 'material_id') {
      const mat = materials.find(m => m.id === parseInt(value));
      item.material_name = mat ? mat.name : '';
      if (item.material_name !== 'Other') {
        item.custom_material_name = '';
      }
      // Auto-fill rate
      const rateObj = savedRates.find(r => r.material_id === parseInt(value));
      if (rateObj) {
        item.rate = rateObj.rate_per_unit;
        item.unit = rateObj.unit || 'Tonne';
      }
    }

    // Calc amount
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    item.amount = qty * rate;

    setItems(newItems);
  };

  const addItem = () => setItems([...items, { id: Date.now(), material_id: '', material_name: '', custom_material_name: '', quantity: '', unit: 'Tonne', rate: '', amount: 0 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  // Step 3: GST
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercent, setGstPercent] = useState(18);

  useEffect(() => {
    if (settings?.gst_percent) {
      setGstPercent(settings.gst_percent);
    }
  }, [settings]);

  const gstAmount = gstEnabled ? (subtotal * gstPercent) / 100 : 0;
  const grandTotal = subtotal + gstAmount;

  // Step 4: Payment
  const [paymentMode, setPaymentMode] = useState('full');
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (paymentMode === 'full') setAmountPaid(grandTotal);
    else if (paymentMode === 'due') setAmountPaid(0);
    else if (paymentMode === 'partial' && (amountPaid === grandTotal || amountPaid === 0)) setAmountPaid('');
  }, [paymentMode, grandTotal]);

  // Step 5: Save
  const createSaleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: (data, variables, context) => {
      const id = data.sale_id || data.data?.id || data.id;
      if (context?.print) {
        navigate(`/sales/${id}?print=true`);
      } else {
        navigate(`/sales/${id}`);
      }
    },
    onError: (err) => {
      alert("Failed to create sale: " + (err.response?.data?.message || err.message));
    }
  });

  const handleSave = (print = false) => {
    const payload = {
      customer_id: selectedCustomer.id,
      sale_date: new Date().toISOString().split('T')[0],
      gst_enabled: gstEnabled,
      items: items.filter(i => i.material_id && i.quantity > 0 && i.rate > 0).map(item => ({
        material_id: parseInt(item.material_id),
        custom_material_name: item.material_name === 'Other' ? item.custom_material_name : null,
        quantity: parseFloat(item.quantity),
        unit: item.unit,
        rate: parseFloat(item.rate),
      })),
      payment_mode: paymentMode,
      amount_paid: parseFloat(amountPaid) || 0,
      notes: notes,
    };

    createSaleMutation.mutate(payload, { context: { print } });
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const isStep1Valid = selectedCustomer !== null;
  const isStep2Valid = items.some(i => i.material_id && parseFloat(i.quantity) > 0 && parseFloat(i.rate) > 0);
  const isStep4Valid = paymentMode !== 'partial' || (parseFloat(amountPaid) > 0 && parseFloat(amountPaid) < grandTotal);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">New Sale</h1>
      </div>

      {/* Progress Steps */}
      <div className="steps">
        {[1, 2, 3, 4, 5].map((num) => (
          <React.Fragment key={num}>
            <div className={`step-item ${step === num ? 'active' : ''} ${step > num ? 'completed' : ''}`} onClick={() => num < step && setStep(num)} style={{cursor: num < step ? 'pointer' : 'default'}}>
              <div className="step-number">{step > num ? '✓' : num}</div>
              <span className="step-label">
                {num === 1 ? 'Customer' : num === 2 ? 'Items' : num === 3 ? 'GST' : num === 4 ? 'Payment' : 'Review'}
              </span>
            </div>
            {num < 5 && <div className="step-connector"></div>}
          </React.Fragment>
        ))}
      </div>

      <div className="card">
        {step === 1 && (
          <div className="step-content">
            <h2 className="section-title">Select Customer</h2>
            
            {selectedCustomer ? (
              <div className="alert alert-success" style={{justifyContent:'space-between'}}>
                <div>
                  <strong>{selectedCustomer.name}</strong> 
                  {selectedCustomer.mobile && ` (${selectedCustomer.mobile})`}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedCustomer(null)}>✕ Remove</button>
              </div>
            ) : (
              <div className="form-group">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search customer by name or mobile..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                
                {customers.length > 0 && (
                  <div style={{border:'1px solid var(--border)', borderRadius:'var(--radius-md)', marginTop:'8px', maxHeight:'200px', overflowY:'auto'}}>
                    {customers.map(c => (
                      <div 
                        key={c.id} 
                        style={{padding:'12px', borderBottom:'1px solid var(--border)', cursor:'pointer'}}
                        onClick={() => setSelectedCustomer(c)}
                        className="hover-bg-light"
                      >
                        <div style={{fontWeight:600}}>{c.name}</div>
                        {c.mobile && <div className="text-sm text-muted-color">{c.mobile}</div>}
                      </div>
                    ))}
                  </div>
                )}
                
                <button 
                  className="btn btn-ghost mt-4" 
                  onClick={() => setShowNewCustomer(!showNewCustomer)}
                >
                  ➕ New Customer
                </button>
              </div>
            )}

            {showNewCustomer && !selectedCustomer && (
              <div style={{background:'var(--bg-primary)', padding:'16px', borderRadius:'var(--radius-md)', marginTop:'16px'}}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input type="text" className="form-input" value={newCustomerData.name} onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile</label>
                    <input type="text" className="form-input" value={newCustomerData.mobile} onChange={e => setNewCustomerData({...newCustomerData, mobile: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input type="text" className="form-input" value={newCustomerData.address} onChange={e => setNewCustomerData({...newCustomerData, address: e.target.value})} />
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={() => createCustomerMutation.mutate(newCustomerData)}
                  disabled={!newCustomerData.name || createCustomerMutation.isLoading}
                >
                  {createCustomerMutation.isLoading ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            )}
            
            <div className="form-actions mt-6" style={{display:'flex', justifyContent:'flex-end'}}>
              <button className="btn btn-primary btn-lg" onClick={nextStep} disabled={!isStep1Valid}>
                Next: Items ➔
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <h2 className="section-title">Add Materials</h2>
            
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Rate (₹)</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td style={{minWidth: '200px'}}>
                        <select 
                          className="form-select mb-2" 
                          value={item.material_id} 
                          onChange={(e) => handleItemChange(index, 'material_id', e.target.value)}
                        >
                          <option value="">Select Material...</option>
                          {materials.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                        {item.material_name === 'Other' && (
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Enter material name" 
                            value={item.custom_material_name}
                            onChange={(e) => handleItemChange(index, 'custom_material_name', e.target.value)}
                          />
                        )}
                      </td>
                      <td style={{width: '100px'}}>
                        <input 
                          type="number" 
                          className="form-input" 
                          min="0" step="0.001"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        />
                      </td>
                      <td style={{width: '120px'}}>
                        <select 
                          className="form-select" 
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        >
                          {['Tonne', 'CFT', 'Load', 'Piece', 'KG', 'Cubic Meter'].map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{width: '120px'}}>
                        <input 
                          type="number" 
                          className="form-input" 
                          min="0" step="0.01"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                        />
                      </td>
                      <td className="amount">
                        {formatCurrency(item.amount)}
                      </td>
                      <td>
                        <button className="btn btn-ghost text-danger" onClick={() => removeItem(index)} disabled={items.length === 1}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button className="btn btn-ghost mt-4" onClick={addItem}>➕ Add Item Row</button>
            
            <div style={{textAlign:'right', fontSize:'1.25rem', fontWeight:600, marginTop:'24px'}}>
              Subtotal: <span className="amount">{formatCurrency(subtotal)}</span>
            </div>

            <div className="form-actions mt-6" style={{display:'flex', justifyContent:'space-between'}}>
              <button className="btn btn-secondary btn-lg" onClick={prevStep}>⬅ Back</button>
              <button className="btn btn-primary btn-lg" onClick={nextStep} disabled={!isStep2Valid}>Next: GST ➔</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <h2 className="section-title">Tax (GST)</h2>
            
            <div style={{display:'flex', alignItems:'center', gap:'16px', marginBottom:'24px', padding:'24px', background:'var(--bg-primary)', borderRadius:'var(--radius-md)'}}>
              <label className="toggle-switch">
                <input type="checkbox" checked={gstEnabled} onChange={e => setGstEnabled(e.target.checked)} />
                <span className="slider"></span>
              </label>
              <span style={{fontSize:'1.1rem', fontWeight:600}}>Enable GST</span>
            </div>

            {gstEnabled && (
              <div className="form-group" style={{maxWidth:'200px'}}>
                <label className="form-label">GST Percentage (%)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={gstPercent}
                  onChange={e => setGstPercent(e.target.value)}
                />
              </div>
            )}

            <div style={{background:'var(--bg-card)', padding:'24px', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', marginTop:'24px'}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'12px'}}>
                <span>Subtotal:</span>
                <span className="amount">{formatCurrency(subtotal)}</span>
              </div>
              {gstEnabled && (
                <>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', color:'var(--text-secondary)'}}>
                    <span>CGST ({(gstPercent/2).toFixed(1)}%):</span>
                    <span className="amount">{formatCurrency(gstAmount/2)}</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'12px', color:'var(--text-secondary)', borderBottom:'1px solid var(--border)', paddingBottom:'12px'}}>
                    <span>SGST ({(gstPercent/2).toFixed(1)}%):</span>
                    <span className="amount">{formatCurrency(gstAmount/2)}</span>
                  </div>
                </>
              )}
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'1.25rem', fontWeight:700, marginTop: gstEnabled ? '0' : '12px', paddingTop: gstEnabled ? '0' : '12px', borderTop: gstEnabled ? 'none' : '1px solid var(--border)'}}>
                <span>Grand Total:</span>
                <span className="amount">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className="form-actions mt-6" style={{display:'flex', justifyContent:'space-between'}}>
              <button className="btn btn-secondary btn-lg" onClick={prevStep}>⬅ Back</button>
              <button className="btn btn-primary btn-lg" onClick={nextStep}>Next: Payment ➔</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step-content">
            <h2 className="section-title">Payment Details</h2>
            
            <div style={{textAlign:'center', fontSize:'1.5rem', fontWeight:700, marginBottom:'24px'}}>
              Grand Total: <span className="amount">{formatCurrency(grandTotal)}</span>
            </div>

            <div className="form-row mb-6">
              <div className={`payment-mode-card ${paymentMode === 'full' ? 'selected' : ''}`} onClick={() => setPaymentMode('full')}>
                <div className="payment-mode-icon">💰</div>
                <div className="payment-mode-title">FULL PAYMENT</div>
                <div className="payment-mode-desc">Amount received in full</div>
              </div>
              <div className={`payment-mode-card ${paymentMode === 'partial' ? 'selected' : ''}`} onClick={() => setPaymentMode('partial')}>
                <div className="payment-mode-icon">📋</div>
                <div className="payment-mode-title">PARTIAL</div>
                <div className="payment-mode-desc">Some amount received</div>
              </div>
              <div className={`payment-mode-card ${paymentMode === 'due' ? 'selected' : ''}`} onClick={() => setPaymentMode('due')}>
                <div className="payment-mode-icon">📅</div>
                <div className="payment-mode-title">DUE</div>
                <div className="payment-mode-desc">Payment to be made later</div>
              </div>
            </div>

            {paymentMode === 'partial' && (
              <div className="form-group" style={{maxWidth:'300px', margin:'0 auto 24px'}}>
                <label className="form-label">Amount Paid (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  style={{fontSize:'1.2rem', textAlign:'center'}}
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                />
              </div>
            )}

            <div style={{background:'var(--bg-primary)', padding:'16px', borderRadius:'var(--radius-md)', marginBottom:'24px'}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                <span>Amount Paid:</span>
                <span className="amount text-success">{formatCurrency(amountPaid || 0)}</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontWeight:600}}>
                <span>Balance Due:</span>
                <span className="amount text-danger">{formatCurrency(grandTotal - (amountPaid || 0))}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="E.g. vehicle number, driver name, etc."></textarea>
            </div>

            <div className="form-actions mt-6" style={{display:'flex', justifyContent:'space-between'}}>
              <button className="btn btn-secondary btn-lg" onClick={prevStep}>⬅ Back</button>
              <button className="btn btn-primary btn-lg" onClick={nextStep} disabled={!isStep4Valid}>Next: Review ➔</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="step-content">
            <h2 className="section-title">Review & Save</h2>
            
            <div style={{background:'#fdfdfd', border:'1px solid var(--border)', padding:'24px', borderRadius:'var(--radius-md)', marginBottom:'24px'}}>
              <h3 style={{marginBottom:'16px'}}>Invoice Summary</h3>
              
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'24px'}}>
                <div>
                  <div className="text-muted-color text-sm">Customer</div>
                  <div className="font-semibold">{selectedCustomer?.name}</div>
                  <div className="text-sm">{selectedCustomer?.mobile}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className="text-muted-color text-sm">Date</div>
                  <div className="font-semibold">{new Date().toLocaleDateString()}</div>
                </div>
              </div>

              <table className="table mb-4">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style={{textAlign:'right'}}>Qty</th>
                    <th style={{textAlign:'right'}}>Rate</th>
                    <th style={{textAlign:'right'}}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.filter(i => i.material_id).map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.material_name === 'Other' ? item.custom_material_name : item.material_name}</td>
                      <td style={{textAlign:'right'}}>{item.quantity} {item.unit}</td>
                      <td style={{textAlign:'right'}} className="amount">₹{item.rate}</td>
                      <td style={{textAlign:'right'}} className="amount">₹{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{width:'250px', marginLeft:'auto'}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                  <span>Subtotal:</span>
                  <span className="amount">₹{subtotal.toFixed(2)}</span>
                </div>
                {gstEnabled && (
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px', color:'var(--text-secondary)'}}>
                    <span>GST ({gstPercent}%):</span>
                    <span className="amount">₹{gstAmount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:'1.1rem', margin:'8px 0', borderTop:'1px solid var(--border)', paddingTop:'8px'}}>
                  <span>Total:</span>
                  <span className="amount">₹{grandTotal.toFixed(2)}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', color:'var(--success)', marginTop:'8px'}}>
                  <span>Paid:</span>
                  <span className="amount">₹{parseFloat(amountPaid || 0).toFixed(2)}</span>
                </div>
                {grandTotal - (amountPaid || 0) > 0 && (
                  <div style={{display:'flex', justifyContent:'space-between', color:'var(--danger)', fontWeight:600}}>
                    <span>Due:</span>
                    <span className="amount">₹{(grandTotal - (amountPaid || 0)).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions mt-6" style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
              <button className="btn btn-secondary btn-lg" onClick={prevStep}>⬅ Back</button>
              <div style={{flex:1}}></div>
              <button className="btn btn-secondary btn-lg" onClick={() => handleSave(false)} disabled={createSaleMutation.isLoading}>
                {createSaleMutation.isLoading ? 'Saving...' : 'Save Only'}
              </button>
              <button className="btn btn-primary btn-lg" onClick={() => handleSave(false)} disabled={createSaleMutation.isLoading}>
                Save & View
              </button>
              <button className="btn btn-accent btn-lg" onClick={() => handleSave(true)} disabled={createSaleMutation.isLoading}>
                Save & Print 🖨️
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewSale;
