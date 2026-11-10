import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sweety_token'));
  const [loading, setLoading] = useState(true);

  // Restore user session on app load if token exists
  useEffect(() => {
    async function restoreSession() {
      const storedToken = localStorage.getItem('sweety_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await authApi.getMe();
        setUser(data.user);
        setToken(storedToken);
      } catch (err) {
        // Token is invalid or expired, clear it
        console.warn('Session expired or invalid token:', err.message);
        localStorage.removeItem('sweety_token');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  // Handle user login
  async function login(email, password) {
    const data = await authApi.login(email, password);
    localStorage.setItem('sweety_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  // Handle new user registration
  async function signup(name, email, password) {
    const data = await authApi.register(name, email, password);
    localStorage.setItem('sweety_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  // Handle user logout
  function logout() {
    localStorage.removeItem('sweety_token');
    setToken(null);
    setUser(null);
  }

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
