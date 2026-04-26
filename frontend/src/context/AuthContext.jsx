import React, { createContext, useContext, useState, useEffect } from 'react';
import localforage from 'localforage';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      const savedUser = await localforage.getItem('user');
      
      if (token && savedUser) {
        setUser(savedUser);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (role, data) => {
    // For demo, we just set the role
    const mockUser = { role, ...data };
    setUser(mockUser);
    await localforage.setItem('user', mockUser);
    localStorage.setItem('token', 'mock_token');
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('token');
    await localforage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
