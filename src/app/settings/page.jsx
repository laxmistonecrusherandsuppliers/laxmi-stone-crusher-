'use client';

import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
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
    loadData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      }).then(r => r.json());

      alert('Settings updated successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading settings...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">⚙️ Business &amp; GST Settings</h1>
      </div>

      <div className="card" style={{ maxWidth: '700px', marginBottom: '24px' }}>
        <div className="card-header">🏢 Business Profile &amp; GST Configuration</div>

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
            {saving ? 'Saving...' : '💾 Save Settings'}
          </button>
        </form>
      </div>

      <div className="card" style={{ maxWidth: '700px' }}>
        <div className="card-header">🪨 Saved Materials List</div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Material Name</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m, i) => (
                <tr key={m.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td>{m.is_system ? <span className="badge badge-admin">System Built-in</span> : <span className="badge badge-staff">Custom Saved</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
