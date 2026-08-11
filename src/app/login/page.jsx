'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Check, Mountain, AlertCircle, Lock } from 'lucide-react';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('lsc_token');
      if (token) {
        router.replace('/');
      }
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your username/mobile and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      if (typeof window !== 'undefined') {
        localStorage.setItem('lsc_token', data.data.token);
      }
      router.push('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left branding panel */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-img-container">
            <Mountain size={28} className="login-crusher-img" />
          </div>
          <h1 className="login-brand-name">Lakshmi Stone<br />Crusher &amp; Suppliers</h1>
          <p className="login-brand-tagline">Premium Stone Material Sales &amp; Business Management</p>

          <div className="login-features">
            <div className="login-feature"><Check size={14} /> Multi-device real-time sync</div>
            <div className="login-feature"><Check size={14} /> GST Invoice generation</div>
            <div className="login-feature"><Check size={14} /> Customer due tracking</div>
            <div className="login-feature"><Check size={14} /> PDF &amp; thermal print support</div>
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <div className="login-form-card">
            <div className="login-form-header">
              <div className="login-logo-sm"><Mountain size={24} /></div>
              <h2>Welcome Back</h2>
              <p>Sign in to your account</p>
            </div>

            {error && (
              <div className="login-error">
                <span><AlertCircle size={14} /></span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form" noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="identifier">
                  Username or Mobile Number
                </label>
                <input
                  className="form-input"
                  type="text"
                  id="identifier"
                  name="identifier"
                  placeholder="e.g. admin or 9999999999"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <input
                  className="form-input"
                  type="password"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                disabled={loading}
              >
                {loading ? 'Signing in...' : <><Lock size={14} /> Sign In</>}
              </button>
            </form>

            <div className="login-hint">
              <small>Default: <strong>admin</strong> / <strong>admin123</strong></small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
