'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/format';
import { Building2, Save, Layers, Plus, Pencil, Trash2, X } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    business_name: '',
    business_address: '',
    business_mobile: '',
    gstin: '',
    gst_percent: '18',
    invoice_prefix: 'LSC',
  });

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Material Modal States
  const [showMatModal, setShowMatModal] = useState(false);
  const [editMatId, setEditMatId] = useState(null);
  const [matForm, setMatForm] = useState({ name: '', rate_per_unit: '', unit: 'Tonne' });
  const [savingMat, setSavingMat] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [setRes, matRes] = await Promise.all([
        fetch('/api/settings').then(r => r.json()),
        fetch('/api/materials').then(r => r.json()),
      ]);
      if (setRes.data) setSettings(prev => ({ ...prev, ...setRes.data }));
      if (matRes.data) setMaterials(matRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      alert('Business profile & GST settings updated successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddMat = () => {
    setEditMatId(null);
    setMatForm({ name: '', rate_per_unit: '', unit: 'Tonne' });
    setShowMatModal(true);
  };

  const handleOpenEditMat = (mat) => {
    setEditMatId(mat.id);
    setMatForm({
      name: mat.name || '',
      rate_per_unit: mat.rate_per_unit || '',
      unit: mat.unit || 'Tonne'
    });
    setShowMatModal(true);
  };

  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    if (!matForm.name.trim()) return alert('Material name is required.');
    setSavingMat(true);
    try {
      const url = editMatId ? `/api/materials/${editMatId}` : '/api/materials';
      const method = editMatId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matForm),
      }).then(r => r.json());

      if (res.error) throw new Error(res.error);

      setShowMatModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingMat(false);
    }
  };

  const handleDeleteMaterial = async (matId, matName) => {
    if (!confirm(`Are you sure you want to remove material "${matName}" from saved menu list?`)) return;
    try {
      const res = await fetch(`/api/materials/${matId}`, { method: 'DELETE' }).then(r => r.json());
      if (res.error) throw new Error(res.error);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading settings &amp; menu items...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      {/* Business Profile */}
      <div className="card" style={{ maxWidth: '800px', marginBottom: '24px' }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={16} /> Business Profile
        </div>

        <form onSubmit={handleSaveSettings}>
          <div className="form-group">
            <label className="form-label">Business Name</label>
            <input type="text" className="form-input" value={settings.business_name || ''} onChange={(e) => setSettings({ ...settings, business_name: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Business Address</label>
            <input type="text" className="form-input" value={settings.business_address || ''} onChange={(e) => setSettings({ ...settings, business_address: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input type="text" className="form-input" value={settings.business_mobile || ''} onChange={(e) => setSettings({ ...settings, business_mobile: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">GSTIN (GST Number)</label>
            <input type="text" className="form-input" value={settings.gstin || ''} onChange={(e) => setSettings({ ...settings, gstin: e.target.value })} placeholder="e.g. 27AAAAA0000A1Z5" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Default GST Rate (%)</label>
              <input type="number" className="form-input" value={settings.gst_percent || ''} onChange={(e) => setSettings({ ...settings, gst_percent: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Invoice Prefix</label>
              <input type="text" className="form-input" value={settings.invoice_prefix || ''} onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? 'Saving...' : <><Save size={14} /> Save Settings</>}
          </button>
        </form>
      </div>

      {/* Materials Menu Editor */}
      <div className="card" style={{ maxWidth: '800px' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Layers size={16} /> Materials &amp; Rates</span>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAddMat}>
            <Plus size={14} /> Add Material
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Material Item Name</th>
                <th>Default Rate (₹)</th>
                <th>Unit</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m, i) => (
                <tr key={m.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {parseFloat(m.rate_per_unit) > 0 ? formatCurrency(m.rate_per_unit) : 'Not Set'}
                  </td>
                  <td>{m.unit || 'Tonne'}</td>
                  <td>
                    {m.is_system ? <span className="badge badge-admin">System</span> : <span className="badge badge-staff">Custom</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditMat(m)}>
                        <Pencil size={14} /> Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMaterial(m.id, m.name)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MATERIAL EDIT / ADD MODAL */}
      {showMatModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                {editMatId ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Pencil size={16} /> Edit Material
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} /> Add Material
                  </span>
                )}
              </h3>
              <button onClick={() => setShowMatModal(false)} className="close-btn" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveMaterial}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Material Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. 40mm, Crush Sand, GSB, WMM"
                    value={matForm.name}
                    onChange={(e) => setMatForm({ ...matForm, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Default Rate (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="e.g. 450"
                      value={matForm.rate_per_unit}
                      onChange={(e) => setMatForm({ ...matForm, rate_per_unit: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Default Unit</label>
                    <select
                      className="form-select"
                      value={['Tonne', 'CFT', 'Brass', 'Trip', 'Load', 'Piece', 'KG', 'Cubic Meter', 'Sq Ft'].includes(matForm.unit) ? matForm.unit : 'Other'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Other') {
                          setMatForm({ ...matForm, unit: '' });
                        } else {
                          setMatForm({ ...matForm, unit: val });
                        }
                      }}
                    >
                      <option value="Tonne">Tonne</option>
                      <option value="CFT">CFT (Cubic Feet)</option>
                      <option value="Brass">Brass</option>
                      <option value="Trip">Trip</option>
                      <option value="Load">Load</option>
                      <option value="Piece">Piece</option>
                      <option value="KG">KG</option>
                      <option value="Cubic Meter">Cubic Meter</option>
                      <option value="Sq Ft">Sq Ft</option>
                      <option value="Other">Other (Type Custom Unit)...</option>
                    </select>
                    {!['Tonne', 'CFT', 'Brass', 'Trip', 'Load', 'Piece', 'KG', 'Cubic Meter', 'Sq Ft'].includes(matForm.unit) && (
                      <input
                        type="text"
                        className="form-input"
                        style={{ marginTop: '6px' }}
                        placeholder="Type custom unit (e.g. Tractor, Box, Bag)..."
                        value={matForm.unit}
                        onChange={(e) => setMatForm({ ...matForm, unit: e.target.value })}
                        autoFocus
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMatModal(false)} disabled={savingMat}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingMat}>
                  {savingMat ? 'Saving...' : editMatId ? 'Update Material' : 'Save Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
