import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginApi } from '../api/auth';

// Manual JWT decode (no library needed)
const decodeJwt = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch {
    return null;
  }
};

const isTokenValid = (token) => {
  const decoded = decodeJwt(token);
  if (!decoded) return false;
  return decoded.exp * 1000 > Date.now();
};

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('lsc_token');
    if (storedToken && isTokenValid(storedToken)) {
      const decoded = decodeJwt(storedToken);
      setUser(decoded);
      setToken(storedToken);
    } else {
      localStorage.removeItem('lsc_token');
    }
    setLoading(false);
  }, []);

  const login = async (identifier, password) => {
    const response = await loginApi(identifier, password);
    // API returns: { data: { token, user }, message }
    const { token: newToken, user: userData } = response.data.data;
    localStorage.setItem('lsc_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('lsc_token');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
