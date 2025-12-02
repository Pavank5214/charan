import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext();

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/auth`;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCompany(null);
  }, []);

  // Memoize loadUser to prevent infinite loops in useEffect
  const loadUser = useCallback(async () => {
    if (!token) {
        setLoading(false);
        return;
    }

    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setCompany(data.company);
      } else {
        console.error('Token validation failed:', res.statusText);
        logout();
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  // Load user data when token changes
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const { token: newToken, user: userData, company: companyData } = data;

      // Update all states at once
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      setCompany(companyData);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      const { token: newToken, user: userDataRes, company: companyData } = data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userDataRes);
      setCompany(companyData);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    company,
    token,
    loading,
    login,
    register,
    logout,
    loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};