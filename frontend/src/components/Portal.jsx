import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { Lock, Mail, Key } from 'lucide-react';
import './Portal.css';

const Portal = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      localStorage.setItem('adminToken', res.data.access_token);
      toast.success("Welcome back");
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error("Invalid credentials");
    }
  };

  return (
    <div className="portal-container animate-in">
      <div className="portal-card ledger-surface">
        <div className="text-center mb-6">
          <Lock size={48} className="mx-auto" style={{ color: 'var(--primary-color)' }} />
          <h2>NutimetryOrganic Admin</h2>
        </div>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label><Mail size={16} /> Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label><Key size={16} /> Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary w-full haptic-press mt-4">Login to Dashboard</button>
        </form>
        <div className="text-center mt-4">
          <button className="text-btn" onClick={() => toast("Contact SuperAdmin for reset")}>Forgot Password?</button>
        </div>
      </div>
    </div>
  );
};

export default Portal;
