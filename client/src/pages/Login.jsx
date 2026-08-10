import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your username/mobile and password.');
      return;
    }
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.error || 'Invalid credentials. Please try again.'
      );
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
            <img src="/stone_crusher.png" alt="Lakshmi Stone Crusher Plant" className="login-crusher-img" />
          </div>
          <h1 className="login-brand-name">Lakshmi Stone<br />Crusher &amp; Suppliers</h1>
          <p className="login-brand-tagline">Premium Stone Material Sales &amp; Business Management</p>

          <div className="login-features">
            <div className="login-feature">✅ Multi-device real-time sync</div>
            <div className="login-feature">✅ GST Invoice generation</div>
            <div className="login-feature">✅ Customer due tracking</div>
            <div className="login-feature">✅ PDF &amp; thermal print support</div>
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <div className="login-form-card">
            <div className="login-form-header">
              <div className="login-logo-sm">⛰️</div>
              <h2>Welcome Back</h2>
              <p>Sign in to your account</p>
            </div>

            {error && (
              <div className="login-error">
                <span>⚠️</span> {error}
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
                style={{ marginTop: '8px' }}
                disabled={loading}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                    Signing in...
                  </span>
                ) : (
                  '🔐 Sign In'
                )}
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
};

export default Login;
